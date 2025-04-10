const express = require("express");
const { Prisma } = require("@prisma/client");
const prisma = require("../prismaClient");
const recommendationService = require("../services/recommendationService");

// Import shopifyService if it exists, otherwise create a mock
let shopifyService;
try {
  shopifyService = require("../services/shopifyService");
} catch (error) {
  // Create a mock shopifyService if the real one doesn't exist yet
  shopifyService = {
    getProductById: async (productId) => ({
      id: productId,
      title: `Product ${productId}`,
      image: "https://via.placeholder.com/150",
      price: "$9.99"
    })
  };
}

/**
 * Track analytics events
 * @param {Object} data - Analytics data to track
 */
async function trackAnalytics(data) {
  try {
    // In a real implementation, this would save to the database
    // and potentially send to an analytics service
    console.log('📊 Analytics event:', data);

    // For now, we'll just log the event
    // In the future, we would update the Analytics model
  } catch (error) {
    console.error('Error tracking analytics:', error);
    // Don't throw - analytics errors shouldn't break the main flow
  }
}

const router = express.Router();

// Get AI-powered upsell recommendations for a product
router.post("/", async (req, res) => {
  try {
    const { productId, customerData = {}, cartData = {} } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, error: "Product ID is required" });
    }

    // Track analytics for this request
    await trackAnalytics({
      event: 'upsell_request',
      productId,
      hasCustomerData: Object.keys(customerData).length > 0
    });

    // Get AI-powered recommendations
    const recommendations = await recommendationService.getRecommendations(
      productId,
      customerData,
      { cartData }
    );

    if (!recommendations || recommendations.length === 0) {
      return res.json({
        success: true,
        upsells: []
      });
    }

    // For each recommendation, fetch the product details from Shopify
    const upsellsWithDetails = await Promise.all(
      recommendations.slice(0, 3).map(async (rec) => {
        try {
          // In a real implementation, this would fetch from Shopify
          // const productDetails = await shopifyService.getProductById(rec.productId);

          // For now, we'll use mock data
          const productDetails = {
            id: rec.productId,
            title: `Product ${rec.productId}`,
            image: "https://via.placeholder.com/150",
            price: "$9.99"
          };

          return {
            ...rec,
            ...productDetails,
            score: rec.score,
            source: rec.source,
            message: rec.message
          };
        } catch (error) {
          console.error(`Error fetching product details for ${rec.productId}:`, error);
          return null;
        }
      })
    );

    // Filter out any null results from failed product fetches
    const validUpsells = upsellsWithDetails.filter(item => item !== null);

    res.json({
      success: true,
      upsells: validUpsells
    });
  } catch (error) {
    console.error("❌ Error getting upsell recommendation:", error);
    res.status(500).json({ success: false, error: "Failed to get upsell recommendation." });
  }
});

// Save a new upsell rule with advanced options
router.post("/save", async (req, res) => {
  try {
    console.log("🔥🔥🔥 /api/upsell/save ROUTE HIT");
    const {
      triggerProductId,
      upsellProductId,
      message,
      discount = null,
      discountType = null,
      placement = "CART",
      displayStyle = "STANDARD",
      conditions = null,
      priority = 1,
      storeId = null,
      userId = null
    } = req.body;

    // Validate input
    if (!triggerProductId || !upsellProductId) {
      return res.status(400).json({ success: false, error: "Missing required fields." });
    }

    // Create the upsell rule with all the new fields
    const upsell = await prisma.upsell.create({
      data: {
        triggerProductId,
        upsellProductId,
        message: message || "",
        discount,
        discountType,
        placement,
        displayStyle,
        conditions,
        priority,
        storeId,
        userId,
        isActive: true,
      },
    });

    // Track this event
    await trackAnalytics({
      event: 'upsell_rule_created',
      upsellId: upsell.id,
      triggerProductId,
      upsellProductId
    });

    res.json({ success: true, upsell });
  } catch (error) {
    console.error("❌ Error saving upsell:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return res.status(400).json({ success: false, error: error.message });
    }
    res.status(500).json({ success: false, error: "Failed to save upsell." });
  }
});
// Get all upsell rules with filtering and pagination
router.get("/rules", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      isActive,
      placement,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      storeId,
      userId
    } = req.query;

    // Build the where clause for filtering
    const where = {};

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (placement) {
      where.placement = placement;
    }

    if (storeId) {
      where.storeId = parseInt(storeId);
    }

    if (userId) {
      where.userId = parseInt(userId);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get total count for pagination
    const totalCount = await prisma.upsell.count({ where });

    // Get the upsell rules
    const upsells = await prisma.upsell.findMany({
      where,
      orderBy: {
        [sortBy]: sortOrder
      },
      skip,
      take: parseInt(limit)
    });

    // Track this analytics event
    await trackAnalytics({
      event: 'upsell_rules_viewed',
      count: upsells.length,
      filters: { isActive, placement, storeId, userId }
    });

    res.json({
      success: true,
      rules: upsells,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalCount,
        totalPages: Math.ceil(totalCount / parseInt(limit))
      }
    });
  } catch (error) {
    console.error("❌ Error fetching upsell rules:", error);
    res.status(500).json({ success: false, error: "Failed to fetch upsell rules." });
  }
});

// Delete an upsell rule
router.delete("/rule/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ success: false, error: "Valid rule ID is required" });
    }

    // Get the rule before deleting it for analytics
    const rule = await prisma.upsell.findUnique({
      where: { id: parseInt(id) }
    });

    if (!rule) {
      return res.status(404).json({ success: false, error: "Upsell rule not found" });
    }

    await prisma.upsell.delete({
      where: {
        id: parseInt(id)
      }
    });

    // Track this deletion
    await trackAnalytics({
      event: 'upsell_rule_deleted',
      upsellId: parseInt(id),
      triggerProductId: rule.triggerProductId,
      upsellProductId: rule.upsellProductId
    });

    res.json({ success: true });
  } catch (error) {
    console.error("❌ Error deleting upsell rule:", error);
    res.status(500).json({ success: false, error: "Failed to delete upsell rule." });
  }
});

module.exports = router;