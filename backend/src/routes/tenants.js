const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireRoles } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

// 1. GET WORKSPACE MEMBERS
router.get('/members', async (req, res, next) => {
  try {
    const members = await prisma.user.findMany({
      where: { tenantId: req.tenantId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      message: 'Workspace members retrieved.',
      data: members
    });
  } catch (err) {
    next(err);
  }
});

// 2. INVITE MEMBER (Admin only)
router.post('/members', requireRoles('Admin'), async (req, res, next) => {
  try {
    const { email, name, role = 'Member', password } = req.body;

    if (!email || !name || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email, name, and temporary password are required.'
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email is already registered.'
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        tenantId: req.tenantId,
        email: email.trim().toLowerCase(),
        name: name.trim(),
        role,
        passwordHash
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    // Log action
    await prisma.activityLog.create({
      data: {
        tenantId: req.tenantId,
        userId: req.user.id,
        action: 'Member Invited',
        details: `Invited user "${newUser.name}" as ${newUser.role}`
      }
    });

    res.status(201).json({
      success: true,
      message: 'Member registered in workspace successfully.',
      data: newUser
    });

  } catch (err) {
    next(err);
  }
});

// 3. MODIFY MEMBER ROLE (Admin only)
router.patch('/members/:userId/role', requireRoles('Admin'), async (req, res, next) => {
  try {
    const { role } = req.body;
    const targetUserId = req.params.userId;

    if (!role || !['Admin', 'Member'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be "Admin" or "Member".'
      });
    }

    // Verify target user belongs to the same tenant
    const targetUser = await prisma.user.findFirst({
      where: { id: targetUserId, tenantId: req.tenantId }
    });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Member not found in your organization.'
      });
    }

    // If downgrading an Admin to Member, verify there is at least one other Admin in the tenant
    if (targetUser.role === 'Admin' && role === 'Member') {
      const adminCount = await prisma.user.count({
        where: { tenantId: req.tenantId, role: 'Admin' }
      });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot demote the sole administrator. Please assign another Admin first.'
        });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { role },
      select: { id: true, name: true, email: true, role: true }
    });

    // Log action
    await prisma.activityLog.create({
      data: {
        tenantId: req.tenantId,
        userId: req.user.id,
        action: 'Member Role Updated',
        details: `Updated role of "${updatedUser.name}" to ${updatedUser.role}`
      }
    });

    res.json({
      success: true,
      message: 'Member role updated successfully.',
      data: updatedUser
    });

  } catch (err) {
    next(err);
  }
});
// 3.5. GET TASK ACTIVITY HEATMAP DATA
router.get('/heatmap', async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const completedTasks = await prisma.task.findMany({
      where: {
        tenantId,
        status: 'Done'
      },
      select: {
        createdAt: true
      }
    });

    const counts = {};
    completedTasks.forEach(task => {
      const dateStr = task.createdAt.toISOString().split('T')[0];
      counts[dateStr] = (counts[dateStr] || 0) + 1;
    });

    res.json({
      success: true,
      data: counts
    });
  } catch (err) {
    next(err);
  }
});

// 4. GET DASHBOARD METRICS
router.get('/metrics', async (req, res, next) => {
  try {
    const tenantId = req.tenantId;

    const [totalTasks, todoTasks, inProgressTasks, doneTasks, priorityCounts] = await Promise.all([
      prisma.task.count({ where: { tenantId } }),
      prisma.task.count({ where: { tenantId, status: 'Todo' } }),
      prisma.task.count({ where: { tenantId, status: 'InProgress' } }),
      prisma.task.count({ where: { tenantId, status: 'Done' } }),
      prisma.task.groupBy({
        by: ['priority'],
        where: { tenantId },
        _count: { id: true }
      })
    ]);

    const formattedPriorities = { Low: 0, Medium: 0, High: 0 };
    priorityCounts.forEach(group => {
      formattedPriorities[group.priority] = group._count.id;
    });

    // Fetch last 10 activity logs
    const recentActivity = await prisma.activityLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: { select: { name: true } }
      }
    });

    res.json({
      success: true,
      message: 'Workspace metrics loaded.',
      data: {
        counts: {
          total: totalTasks,
          todo: todoTasks,
          inProgress: inProgressTasks,
          done: doneTasks
        },
        priorities: formattedPriorities,
        recentActivity: recentActivity.map(log => ({
          id: log.id,
          name: log.user.name,
          action: log.action,
          details: log.details,
          time: log.createdAt
        }))
      }
    });

  } catch (err) {
    next(err);
  }
});

module.exports = router;
