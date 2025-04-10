const express = require('express');
const { Prisma } = require('@prisma/client');
const prisma = require('../prismaClient');
const abTestService = require('../services/abTestService');

const router = express.Router();

/**
 * Create a new A/B test
 * POST /api/abtest
 */
router.post('/', async (req, res) => {
  try {
    const { name, description, variantA, variantB, endDate } = req.body;
    
    // Validate input
    if (!name || !variantA || !variantB) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name, variantA, and variantB are required.' 
      });
    }
    
    // Create the test
    const test = await abTestService.createTest({
      name,
      description,
      variantA: parseInt(variantA),
      variantB: parseInt(variantB),
      endDate: endDate ? new Date(endDate) : undefined
    });
    
    res.json({
      success: true,
      test
    });
  } catch (error) {
    console.error('❌ Error creating A/B test:', error);
    res.status(500).json({ success: false, error: 'Failed to create A/B test.' });
  }
});

/**
 * Get all A/B tests
 * GET /api/abtest
 */
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    
    const where = {};
    if (status) {
      where.status = status;
    }
    
    const tests = await prisma.aBTest.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        upsells: true
      }
    });
    
    // Format the response
    const formattedTests = tests.map(test => {
      const variantA = test.upsells.find(upsell => upsell.id === test.variantA);
      const variantB = test.upsells.find(upsell => upsell.id === test.variantB);
      
      // Calculate conversion rates
      const conversionRateA = test.impressionsA > 0 
        ? (test.conversionsA / test.impressionsA) * 100 
        : 0;
        
      const conversionRateB = test.impressionsB > 0 
        ? (test.conversionsB / test.impressionsB) * 100 
        : 0;
      
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
        winningVariant: test.winningVariant
      };
    });
    
    res.json({
      success: true,
      tests: formattedTests
    });
  } catch (error) {
    console.error('❌ Error fetching A/B tests:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch A/B tests.' });
  }
});

/**
 * Get a specific A/B test
 * GET /api/abtest/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ success: false, error: 'Valid test ID is required.' });
    }
    
    const testResults = await abTestService.getTestResults(parseInt(id));
    
    res.json({
      success: true,
      test: testResults
    });
  } catch (error) {
    console.error(`❌ Error fetching A/B test ${req.params.id}:`, error);
    res.status(500).json({ success: false, error: 'Failed to fetch A/B test.' });
  }
});

/**
 * Update an A/B test
 * PUT /api/abtest/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status, endDate } = req.body;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ success: false, error: 'Valid test ID is required.' });
    }
    
    // Update the test
    const test = await prisma.aBTest.update({
      where: { id: parseInt(id) },
      data: {
        name,
        description,
        status,
        endDate: endDate ? new Date(endDate) : undefined
      }
    });
    
    res.json({
      success: true,
      test
    });
  } catch (error) {
    console.error(`❌ Error updating A/B test ${req.params.id}:`, error);
    res.status(500).json({ success: false, error: 'Failed to update A/B test.' });
  }
});

/**
 * Delete an A/B test
 * DELETE /api/abtest/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ success: false, error: 'Valid test ID is required.' });
    }
    
    // Delete the test
    await prisma.aBTest.delete({
      where: { id: parseInt(id) }
    });
    
    res.json({
      success: true
    });
  } catch (error) {
    console.error(`❌ Error deleting A/B test ${req.params.id}:`, error);
    res.status(500).json({ success: false, error: 'Failed to delete A/B test.' });
  }
});

/**
 * Track an impression for an A/B test variant
 * POST /api/abtest/impression
 */
router.post('/impression', async (req, res) => {
  try {
    const { testId, variant } = req.body;
    
    if (!testId || !variant) {
      return res.status(400).json({ success: false, error: 'Test ID and variant are required.' });
    }
    
    await abTestService.trackTestImpression({
      testId: parseInt(testId),
      variant
    });
    
    res.json({
      success: true
    });
  } catch (error) {
    console.error('❌ Error tracking test impression:', error);
    res.status(500).json({ success: false, error: 'Failed to track test impression.' });
  }
});

/**
 * Track a conversion for an A/B test variant
 * POST /api/abtest/conversion
 */
router.post('/conversion', async (req, res) => {
  try {
    const { testId, variant } = req.body;
    
    if (!testId || !variant) {
      return res.status(400).json({ success: false, error: 'Test ID and variant are required.' });
    }
    
    await abTestService.trackTestConversion({
      testId: parseInt(testId),
      variant
    });
    
    res.json({
      success: true
    });
  } catch (error) {
    console.error('❌ Error tracking test conversion:', error);
    res.status(500).json({ success: false, error: 'Failed to track test conversion.' });
  }
});

module.exports = router;
