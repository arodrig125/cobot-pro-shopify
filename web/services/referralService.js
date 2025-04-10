const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

/**
 * Generate a unique referral code for a user
 * @param {number} userId - The user ID
 * @returns {string} - The generated referral code
 */
async function generateReferralCode(userId) {
  const randomBytes = crypto.randomBytes(4).toString('hex');
  return `${userId}-${randomBytes}`;
}

/**
 * Create a referral link for a user
 * @param {number} userId - The user ID
 * @param {string} baseUrl - The base URL for the referral link
 * @returns {Promise<string>} - The referral link
 */
async function createReferralLink(userId, baseUrl) {
  try {
    // Check if user already has a referral code
    const existingReferral = await prisma.referral.findFirst({
      where: { referrerId: userId }
    });

    if (existingReferral) {
      return existingReferral.referralLink;
    }

    // Generate new referral code and link
    const referralCode = await generateReferralCode(userId);
    const referralLink = `${baseUrl}/signup?ref=${referralCode}`;

    // Save to database
    await prisma.referral.create({
      data: {
        referrerId: userId,
        referralCode,
        referralLink,
        status: 'PENDING'
      }
    });

    return referralLink;
  } catch (error) {
    console.error('Error creating referral link:', error);
    throw error;
  }
}

/**
 * Process a referral signup
 * @param {string} referralCode - The referral code
 * @param {number} newUserId - The new user's ID
 * @returns {Promise<boolean>} - Whether the referral was processed successfully
 */
async function processReferralSignup(referralCode, newUserId) {
  try {
    const referral = await prisma.referral.findUnique({
      where: { referralCode }
    });

    if (!referral) return false;

    // Update referral status
    await prisma.referral.update({
      where: { id: referral.id },
      data: {
        referredId: newUserId,
        status: 'SIGNED_UP'
      }
    });

    // Add rule bonus for free plan referrers
    const referrerPlan = await prisma.userPlan.findUnique({
      where: { userId: referral.referrerId }
    });

    if (referrerPlan && referrerPlan.planName === 'FREE') {
      // Check current rule count
      const currentAdditionalRules = referrerPlan.additionalRules;
      
      // Only add if less than 5 additional rules (for max of 10 total)
      if (currentAdditionalRules < 5) {
        await prisma.userPlan.update({
          where: { userId: referral.referrerId },
          data: {
            additionalRules: currentAdditionalRules + 1
          }
        });
      }
    }

    return true;
  } catch (error) {
    console.error('Error processing referral signup:', error);
    return false;
  }
}

/**
 * Process a referral upgrade
 * @param {number} userId - The user ID of the user who upgraded
 * @returns {Promise<boolean>} - Whether the referral upgrade was processed successfully
 */
async function processReferralUpgrade(userId) {
  try {
    // Find the referral where this user was referred
    const referral = await prisma.referral.findFirst({
      where: { 
        referredId: userId,
        status: 'SIGNED_UP',
        creditApplied: false
      }
    });

    if (!referral) return false;

    // Update referral status
    await prisma.referral.update({
      where: { id: referral.id },
      data: {
        status: 'UPGRADED',
        creditApplied: true
      }
    });

    // Add credit to referrer
    await prisma.credit.create({
      data: {
        userId: referral.referrerId,
        amount: 50.00,
        description: 'Referral credit - user upgraded',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year expiry
      }
    });

    return true;
  } catch (error) {
    console.error('Error processing referral upgrade:', error);
    return false;
  }
}

module.exports = {
  createReferralLink,
  processReferralSignup,
  processReferralUpgrade
};
