const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireRoles } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticateToken);
router.use(requireRoles('Admin')); // Audit logs are strictly Admin-only

// GET ALL AUDIT ACTIVITY LOGS
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where: { tenantId: req.tenantId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true }
          }
        }
      }),
      prisma.activityLog.count({
        where: { tenantId: req.tenantId }
      })
    ]);

    res.json({
      success: true,
      message: 'Workspace audit activity logs retrieved successfully.',
      data: logs,
      meta: {
        pagination: {
          total,
          page: parseInt(page),
          limit: take,
          totalPages: Math.ceil(total / take)
        }
      }
    });

  } catch (err) {
    next(err);
  }
});

module.exports = router;
