const express = require('express');
const { Prisma } = require('@prisma/client');
const prisma = require('../prismaClient');
const analyticsService = require('../services/analyticsService');

const router = express.Router();

/**
 * Get performance metrics for upsell rules
 * GET /api/analytics/performance
 */
router.get('/performance', async (req, res) => {
  try {
    const { storeId, startDate, endDate } = req.query;
    
    const metrics = await analyticsService.getPerformanceMetrics({
      storeId,
      startDate,
      endDate
    });
    
    res.json({
      success: true,
      metrics
    });
  } catch (error) {
    console.error('❌ Error getting performance metrics:', error);
    res.status(500).json({ success: false, error: 'Failed to get performance metrics.' });
  }
});

/**
 * Track an upsell impression
 * POST /api/analytics/impression
 */
router.post('/impression', async (req, res) => {
  try {
    const { upsellId, shopDomain, customerId, sessionId } = req.body;
    
    if (!upsellId) {
      return res.status(400).json({ success: false, error: 'Upsell ID is required.' });
    }
    
    await analyticsService.trackImpression({
      upsellId,
      shopDomain,
      customerId,
      sessionId
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error tracking impression:', error);
    res.status(500).json({ success: false, error: 'Failed to track impression.' });
  }
});

/**
 * Track an upsell conversion
 * POST /api/analytics/conversion
 */
router.post('/conversion', async (req, res) => {
  try {
    const { upsellId, shopDomain, customerId, sessionId, revenue } = req.body;
    
    if (!upsellId) {
      return res.status(400).json({ success: false, error: 'Upsell ID is required.' });
    }
    
    await analyticsService.trackConversion({
      upsellId,
      shopDomain,
      customerId,
      sessionId,
      revenue
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error tracking conversion:', error);
    res.status(500).json({ success: false, error: 'Failed to track conversion.' });
  }
});

/**
 * Get top performing upsell rules
 * GET /api/analytics/top-rules
 */
router.get('/top-rules', async (req, res) => {
  try {
    const { storeId, limit = 5 } = req.query;
    
    const where = {};
    if (storeId) {
      where.storeId = parseInt(storeId);
    }
    
    const topRules = await prisma.upsell.findMany({
      where,
      orderBy: {
        revenue: 'desc'
      },
      take: parseInt(limit)
    });
    
    res.json({
      success: true,
      rules: topRules
    });
  } catch (error) {
    console.error('❌ Error getting top rules:', error);
    res.status(500).json({ success: false, error: 'Failed to get top rules.' });
  }
});

/**
 * Get daily analytics data
 * GET /api/analytics/daily
 */
router.get('/daily', async (req, res) => {
  try {
    const { storeId, startDate, endDate } = req.query;
    
    const where = {};
    
    if (storeId) {
      where.storeId = parseInt(storeId);
    }
    
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    } else if (startDate) {
      where.date = {
        gte: new Date(startDate)
      };
    } else if (endDate) {
      where.date = {
        lte: new Date(endDate)
      };
    }
    
    const analyticsData = await prisma.analytics.findMany({
      where,
      orderBy: {
        date: 'asc'
      }
    });
    
    const dailyData = analyticsData.map(record => ({
      date: record.date.toISOString().split('T')[0],
      impressions: record.impressions,
      conversions: record.conversions,
      revenue: record.revenue,
      conversionRate: record.impressions > 0 ? (record.conversions / record.impressions) * 100 : 0
    }));
    
    res.json({
      success: true,
      data: dailyData
    });
  } catch (error) {
    console.error('❌ Error getting daily analytics:', error);
    res.status(500).json({ success: false, error: 'Failed to get daily analytics.' });
  }
});

module.exports = router;
