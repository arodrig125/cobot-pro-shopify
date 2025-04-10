const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const router = express.Router();

/**
 * Get user's current plan
 * GET /api/user/plan
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user plan
    let userPlan = await prisma.userPlan.findUnique({
      where: { userId }
    });
    
    // Create default free plan if none exists
    if (!userPlan) {
      userPlan = await prisma.userPlan.create({
        data: {
          userId,
          planName: 'FREE',
          additionalRules: 0
        }
      });
    }
    
    // Get plan limits
    const planLimits = await prisma.planLimits.findUnique({
      where: { planName: userPlan.planName }
    });
    
    res.json({
      success: true,
      plan: {
        ...userPlan,
        limits: planLimits
      }
    });
  } catch (error) {
    console.error('Error fetching user plan:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch user plan' });
  }
});

/**
 * Upgrade plan (start trial)
 * POST /api/user/plan/upgrade
 */
router.post('/upgrade', async (req, res) => {
  try {
    const userId = req.user.id;
    const { planName } = req.body;
    
    if (!planName || !['GROWTH', 'PRO', 'ENTERPRISE'].includes(planName)) {
      return res.status(400).json({ success: false, error: 'Invalid plan name' });
    }
    
    // Set trial end date (14 days from now)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);
    
    // Update user plan
    const userPlan = await prisma.userPlan.upsert({
      where: { userId },
      update: {
        planName,
        isTrialing: true,
        trialEndsAt
      },
      create: {
        userId,
        planName,
        isTrialing: true,
        trialEndsAt,
        additionalRules: 0
      }
    });
    
    // Process referral if applicable
    const referralService = require('../services/referralService');
    await referralService.processReferralUpgrade(userId);
    
    res.json({
      success: true,
      plan: userPlan
    });
  } catch (error) {
    console.error('Error upgrading plan:', error);
    res.status(500).json({ success: false, error: 'Failed to upgrade plan' });
  }
});

module.exports = router;
