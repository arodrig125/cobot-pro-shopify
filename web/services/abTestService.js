const prisma = require('../prismaClient');

/**
 * A/B Testing Service for Cobot Pro
 * Handles creation, management, and analysis of A/B tests for upsell rules
 */

/**
 * Create a new A/B test
 * @param {Object} data - Test data
 * @param {string} data.name - Test name
 * @param {string} data.description - Test description
 * @param {number} data.variantA - ID of the first upsell variant
 * @param {number} data.variantB - ID of the second upsell variant
 * @param {Date} data.endDate - End date for the test (optional)
 * @returns {Promise<Object>} - Created test
 */
async function createTest(data) {
  try {
    const { name, description, variantA, variantB, endDate } = data;
    
    // Validate that both variants exist
    const variantAExists = await prisma.upsell.findUnique({
      where: { id: variantA }
    });
    
    const variantBExists = await prisma.upsell.findUnique({
      where: { id: variantB }
    });
    
    if (!variantAExists || !variantBExists) {
      throw new Error('One or both variants do not exist');
    }
    
    // Create the test
    const test = await prisma.aBTest.create({
      data: {
        name,
        description,
        variantA,
        variantB,
        endDate,
        status: 'ACTIVE',
        upsells: {
          connect: [
            { id: variantA },
            { id: variantB }
          ]
        }
      }
    });
    
    return test;
  } catch (error) {
    console.error('Error creating A/B test:', error);
    throw error;
  }
}

/**
 * Get an A/B test variant for a specific trigger product
 * @param {string} triggerProductId - The trigger product ID
 * @returns {Promise<Object>} - Test variant
 */
async function getTestVariant(triggerProductId) {
  try {
    // Find active tests for this trigger product
    const activeTests = await prisma.aBTest.findMany({
      where: {
        status: 'ACTIVE',
        upsells: {
          some: {
            triggerProductId
          }
        }
      },
      include: {
        upsells: true
      }
    });
    
    if (activeTests.length === 0) {
      return null;
    }
    
    // For simplicity, just use the first active test
    const test = activeTests[0];
    
    // Find the variants for this test that match the trigger product
    const variants = test.upsells.filter(upsell => 
      upsell.triggerProductId === triggerProductId
    );
    
    if (variants.length === 0) {
      return null;
    }
    
    // Randomly select variant A or B with 50/50 probability
    const useVariantA = Math.random() < 0.5;
    
    // Find the specific variant
    const selectedVariant = variants.find(variant => 
      useVariantA ? variant.id === test.variantA : variant.id === test.variantB
    );
    
    if (!selectedVariant) {
      return null;
    }
    
    return {
      testId: test.id,
      variant: useVariantA ? 'A' : 'B',
      variantId: selectedVariant.id,
      upsell: selectedVariant
    };
  } catch (error) {
    console.error(`Error getting test variant for ${triggerProductId}:`, error);
    return null;
  }
}

/**
 * Track an impression for an A/B test variant
 * @param {Object} data - Impression data
 * @param {number} data.testId - The test ID
 * @param {string} data.variant - The variant (A or B)
 * @returns {Promise<void>}
 */
async function trackTestImpression(data) {
  try {
    const { testId, variant } = data;
    
    // Update the test's impression count for the variant
    await prisma.aBTest.update({
      where: { id: testId },
      data: variant === 'A' 
        ? { impressionsA: { increment: 1 } }
        : { impressionsB: { increment: 1 } }
    });
  } catch (error) {
    console.error('Error tracking test impression:', error);
    // Don't throw - analytics errors shouldn't break the main flow
  }
}

/**
 * Track a conversion for an A/B test variant
 * @param {Object} data - Conversion data
 * @param {number} data.testId - The test ID
 * @param {string} data.variant - The variant (A or B)
 * @returns {Promise<void>}
 */
async function trackTestConversion(data) {
  try {
    const { testId, variant } = data;
    
    // Update the test's conversion count for the variant
    await prisma.aBTest.update({
      where: { id: testId },
      data: variant === 'A' 
        ? { conversionsA: { increment: 1 } }
        : { conversionsB: { increment: 1 } }
    });
    
    // Get the updated test
    const test = await prisma.aBTest.findUnique({
      where: { id: testId }
    });
    
    // Calculate conversion rates
    const conversionRateA = test.impressionsA > 0 
      ? (test.conversionsA / test.impressionsA) * 100 
      : 0;
      
    const conversionRateB = test.impressionsB > 0 
      ? (test.conversionsB / test.impressionsB) * 100 
      : 0;
    
    // Check if we have enough data to determine a winner
    const minImpressions = 100; // Minimum impressions needed for statistical significance
    
    if (test.impressionsA >= minImpressions && test.impressionsB >= minImpressions) {
      // Determine if there's a clear winner (at least 10% better)
      if (conversionRateA >= conversionRateB * 1.1) {
        // Variant A is the winner
        await prisma.aBTest.update({
          where: { id: testId },
          data: {
            winningVariant: test.variantA,
            status: 'COMPLETED'
          }
        });
      } else if (conversionRateB >= conversionRateA * 1.1) {
        // Variant B is the winner
        await prisma.aBTest.update({
          where: { id: testId },
          data: {
            winningVariant: test.variantB,
            status: 'COMPLETED'
          }
        });
      }
    }
  } catch (error) {
    console.error('Error tracking test conversion:', error);
    // Don't throw - analytics errors shouldn't break the main flow
  }
}

/**
 * Get A/B test results
 * @param {number} testId - The test ID
 * @returns {Promise<Object>} - Test results
 */
async function getTestResults(testId) {
  try {
    const test = await prisma.aBTest.findUnique({
      where: { id: testId },
      include: {
        upsells: true
      }
    });
    
    if (!test) {
      throw new Error(`Test with ID ${testId} not found`);
    }
    
    // Get the variant details
    const variantA = test.upsells.find(upsell => upsell.id === test.variantA);
    const variantB = test.upsells.find(upsell => upsell.id === test.variantB);
    
    // Calculate conversion rates
    const conversionRateA = test.impressionsA > 0 
      ? (test.conversionsA / test.impressionsA) * 100 
      : 0;
      
    const conversionRateB = test.impressionsB > 0 
      ? (test.conversionsB / test.impressionsB) * 100 
      : 0;
    
    // Determine the winner
    let winner = null;
    if (test.winningVariant) {
      winner = test.winningVariant === test.variantA ? 'A' : 'B';
    } else if (conversionRateA > conversionRateB) {
      winner = 'A (not statistically significant yet)';
    } else if (conversionRateB > conversionRateA) {
      winner = 'B (not statistically significant yet)';
    } else {
      winner = 'Tie';
    }
    
    return {
      id: test.id,
      name: test.name,
      description: test.description,
      status: test.status,
      startDate: test.startDate,
      endDate: test.endDate,
      variantA: {
        id: variantA?.id,
        triggerProductId: variantA?.triggerProductId,
        upsellProductId: variantA?.upsellProductId,
        message: variantA?.message,
        impressions: test.impressionsA,
        conversions: test.conversionsA,
        conversionRate: conversionRateA.toFixed(2)
      },
      variantB: {
        id: variantB?.id,
        triggerProductId: variantB?.triggerProductId,
        upsellProductId: variantB?.upsellProductId,
        message: variantB?.message,
        impressions: test.impressionsB,
        conversions: test.conversionsB,
        conversionRate: conversionRateB.toFixed(2)
      },
      winner,
      improvement: winner === 'A' 
        ? ((conversionRateA - conversionRateB) / conversionRateB * 100).toFixed(2)
        : winner === 'B'
          ? ((conversionRateB - conversionRateA) / conversionRateA * 100).toFixed(2)
          : 0
    };
  } catch (error) {
    console.error(`Error getting test results for ${testId}:`, error);
    throw error;
  }
}

module.exports = {
  createTest,
  getTestVariant,
  trackTestImpression,
  trackTestConversion,
  getTestResults
};
