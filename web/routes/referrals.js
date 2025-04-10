const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const referralService = require('../services/referralService');
const router = express.Router();

/**
 * Get user's referral data
 * GET /api/referrals
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's referral link
    let referral = await prisma.referral.findFirst({
      where: { referrerId: userId }
    });
    
    // Create referral link if it doesn't exist
    if (!referral) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const referralLink = await referralService.createReferralLink(userId, baseUrl);
      
      referral = await prisma.referral.findFirst({
        where: { referrerId: userId }
      });
    }
    
    // Get user's referrals
    const referrals = await prisma.referral.findMany({
      where: { referrerId: userId },
      include: {
        referred: {
          select: {
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Format referrals for response
    const formattedReferrals = referrals.map(ref => ({
      id: ref.id,
      email: ref.referred?.email || null,
      status: ref.status,
      createdAt: ref.createdAt,
      creditApplied: ref.creditApplied
    }));
    
    // Get user's plan
    const userPlan = await prisma.userPlan.findUnique({
      where: { userId }
    });
    
    res.json({
      success: true,
      referralLink: referral.referralLink,
      referrals: formattedReferrals,
      userPlan: userPlan || { planName: 'FREE', additionalRules: 0 }
    });
  } catch (error) {
    console.error('Error fetching referral data:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch referral data' });
  }
});

/**
 * Process a referral signup
 * POST /api/referrals/signup
 */
router.post('/signup', async (req, res) => {
  try {
    const { referralCode, userId } = req.body;
    
    if (!referralCode || !userId) {
      return res.status(400).json({ success: false, error: 'Referral code and user ID are required' });
    }
    
    const success = await referralService.processReferralSignup(referralCode, userId);
    
    res.json({
      success: true,
      referralProcessed: success
    });
  } catch (error) {
    console.error('Error processing referral signup:', error);
    res.status(500).json({ success: false, error: 'Failed to process referral signup' });
  }
});

module.exports = router;
