const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Middleware to enforce plan limits
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
async function planEnforcement(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) return next();

    // Get user's plan
    const userPlan = await prisma.userPlan.findUnique({
      where: { userId },
      include: { user: true }
    });

    if (!userPlan) {
      // Set default free plan if not set
      await prisma.userPlan.create({
        data: {
          userId,
          planName: 'FREE',
          additionalRules: 0
        }
      });
      req.userPlan = { planName: 'FREE', additionalRules: 0 };
    } else {
      req.userPlan = userPlan;
    }

    // Get plan limits
    const planLimits = await prisma.planLimits.findUnique({
      where: { planName: req.userPlan.planName }
    });

    req.planLimits = planLimits;
    next();
  } catch (error) {
    console.error('Plan enforcement error:', error);
    next();
  }
}

module.exports = planEnforcement;
