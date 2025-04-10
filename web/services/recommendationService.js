const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * AI-Powered Recommendation Service for Cobot Pro
 * This service analyzes store data and customer behavior to generate
 * intelligent upsell recommendations.
 */

/**
 * Get personalized upsell recommendations for a product
 * @param {string} productId - The trigger product ID
 * @param {object} customerData - Customer data including purchase history and browsing behavior
 * @param {object} storeData - Store-wide data including popular combinations
 * @returns {Promise<Array>} - Array of recommended products with scores
 */
async function getRecommendations(productId, customerData = {}, storeData = {}) {
  try {
    // 1. Check for manually configured rules first (merchant knowledge)
    const manualRules = await getManualRules(productId);
    
    // 2. Get product purchase pattern data (what products are commonly bought together)
    const purchasePatterns = await getProductPurchasePatterns(productId);
    
    // 3. Get customer-specific recommendations based on their history
    const customerRecommendations = await getCustomerBasedRecommendations(customerData);
    
    // 4. Combine and score all recommendations
    const combinedRecommendations = combineAndScoreRecommendations(
      manualRules,
      purchasePatterns,
      customerRecommendations
    );
    
    // 5. Filter out products that don't make sense (e.g., already in cart, out of stock)
    const filteredRecommendations = filterRecommendations(combinedRecommendations, customerData);
    
    // 6. Return top recommendations
    return filteredRecommendations.slice(0, 3); // Return top 3 recommendations
  } catch (error) {
    console.error('Error generating recommendations:', error);
    // Fallback to manual rules if AI recommendations fail
    return getManualRules(productId);
  }
}

/**
 * Get manually configured upsell rules
 * @param {string} productId - The trigger product ID
 * @returns {Promise<Array>} - Array of manual upsell rules
 */
async function getManualRules(productId) {
  try {
    const rules = await prisma.upsell.findMany({
      where: {
        triggerProductId: productId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return rules.map(rule => ({
      productId: rule.upsellProductId,
      message: rule.message || 'Frequently bought together',
      score: 1.0, // Manual rules get highest priority
      source: 'manual',
      ruleId: rule.id
    }));
  } catch (error) {
    console.error('Error fetching manual rules:', error);
    return [];
  }
}

/**
 * Analyze product purchase patterns to find commonly bought together items
 * @param {string} productId - The trigger product ID
 * @returns {Promise<Array>} - Array of products commonly purchased with the trigger product
 */
async function getProductPurchasePatterns(productId) {
  // In a real implementation, this would query order history
  // For now, we'll return a placeholder implementation
  
  // Placeholder for purchase pattern analysis
  // This would be replaced with actual data analysis from order history
  return [
    {
      productId: 'complementary-product-1',
      score: 0.85,
      message: 'Customers often buy this together',
      source: 'purchase_pattern'
    },
    {
      productId: 'complementary-product-2',
      score: 0.72,
      message: '72% of customers also purchased this item',
      source: 'purchase_pattern'
    }
  ];
}

/**
 * Generate recommendations based on customer's purchase history and behavior
 * @param {object} customerData - Customer data including purchase history
 * @returns {Promise<Array>} - Array of personalized product recommendations
 */
async function getCustomerBasedRecommendations(customerData) {
  // This would analyze customer's past purchases, browsing history, etc.
  // For now, return placeholder recommendations
  
  if (!customerData || Object.keys(customerData).length === 0) {
    return [];
  }
  
  // Placeholder for customer-based recommendations
  return [
    {
      productId: 'personal-recommendation-1',
      score: 0.9,
      message: 'Based on your previous purchases',
      source: 'customer_history'
    }
  ];
}

/**
 * Combine and score recommendations from different sources
 * @param {Array} manualRules - Manually configured rules
 * @param {Array} purchasePatterns - Product purchase patterns
 * @param {Array} customerRecommendations - Customer-specific recommendations
 * @returns {Array} - Combined and scored recommendations
 */
function combineAndScoreRecommendations(manualRules, purchasePatterns, customerRecommendations) {
  // Combine all recommendations
  const allRecommendations = [
    ...manualRules,
    ...purchasePatterns,
    ...customerRecommendations
  ];
  
  // Group by product ID and take the highest score
  const productMap = new Map();
  
  allRecommendations.forEach(rec => {
    if (!productMap.has(rec.productId) || productMap.get(rec.productId).score < rec.score) {
      productMap.set(rec.productId, rec);
    }
  });
  
  // Convert back to array and sort by score
  return Array.from(productMap.values()).sort((a, b) => b.score - a.score);
}

/**
 * Filter recommendations based on business rules
 * @param {Array} recommendations - Combined recommendations
 * @param {object} customerData - Customer data including cart contents
 * @returns {Array} - Filtered recommendations
 */
function filterRecommendations(recommendations, customerData) {
  // In a real implementation, this would:
  // 1. Remove products already in cart
  // 2. Check inventory status
  // 3. Apply business rules (e.g., don't recommend products too similar)
  
  return recommendations;
}

/**
 * Generate a personalized message for an upsell recommendation
 * @param {object} product - Product data
 * @param {object} recommendation - Recommendation data
 * @param {object} customerData - Customer data
 * @returns {string} - Personalized message
 */
function generatePersonalizedMessage(product, recommendation, customerData) {
  // If there's a manual message, use it
  if (recommendation.source === 'manual' && recommendation.message) {
    return recommendation.message;
  }
  
  // Generate a message based on the recommendation source
  switch (recommendation.source) {
    case 'purchase_pattern':
      return `Customers who bought ${product.title} also loved this!`;
    case 'customer_history':
      return 'Based on your shopping history, you might like:';
    default:
      return 'You might also like:';
  }
}

module.exports = {
  getRecommendations,
  generatePersonalizedMessage
};
