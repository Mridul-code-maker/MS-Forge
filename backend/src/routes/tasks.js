const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// All routes are scoped under /api/v1/tasks and require a valid token
router.use(authenticateToken);

// Helper to log workspace activities
async function logActivity(tenantId, userId, action, details) {
  try {
    await prisma.activityLog.create({
      data: { tenantId, userId, action, details }
    });
  } catch (err) {
    console.error('Failed to write activity log:', err);
  }
}

// 1. GET ALL TASKS: supports search, status/priority filtering, pagination, and sorting
router.get('/', async (req, res, next) => {
  try {
    const tenantId = req.tenantId; // isolated tenant context from auth middleware
    const { 
      status, 
      priority, 
      assigneeId,
      search, 
      sortBy = 'createdAt', 
      order = 'desc', 
      page = 1, 
      limit = 10 
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build filters dynamically
    const where = { tenantId };

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assigneeId) where.assigneeId = assigneeId;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } }
      ];
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        orderBy: { [sortBy]: order.toLowerCase() },
        skip,
        take,
        include: {
          assignee: {
            select: { id: true, name: true, email: true }
          }
        }
      }),
      prisma.task.count({ where })
    ]);

    res.json({
      success: true,
      message: 'Tasks retrieved successfully.',
      data: tasks,
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

// 2. GET SINGLE TASK BY ID
router.get('/:id', async (req, res, next) => {
  try {
    const task = await prisma.task.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId },
      include: {
        assignee: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or unauthorized access.'
      });
    }

    res.json({
      success: true,
      message: 'Task retrieved.',
      data: task
    });
  } catch (err) {
    next(err);
  }
});

// 3. CREATE TASK (Triggers WebSocket broadcast + log)
router.post('/', async (req, res, next) => {
  try {
    const { title, description, status = 'Todo', priority = 'Medium', dueDate, assigneeId, attachments = [] } = req.body;

    if (!title || !description || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and dueDate are required.'
      });
    }

    // Verify assignee belongs to the same tenant if provided
    if (assigneeId) {
      const userExists = await prisma.user.findFirst({
        where: { id: assigneeId, tenantId: req.tenantId }
      });
      if (!userExists) {
        return res.status(400).json({
          success: false,
          message: 'Assignee user must belong to your organization.'
        });
      }
    }

    const newTask = await prisma.task.create({
      data: {
        tenantId: req.tenantId,
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        dueDate: new Date(dueDate),
        assigneeId: assigneeId || null,
        attachments: JSON.stringify(attachments)
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // 1. Log activity
    await logActivity(req.tenantId, req.user.id, 'Task Created', `Created task "${newTask.title}"`);

    // 2. WebSocket Real-time sync (broadcast to the tenant's room)
    const io = req.app.get('io');
    if (io) {
      io.to(req.tenantId).emit('task_created', newTask);
    }

    res.status(201).json({
      success: true,
      message: 'Task created successfully.',
      data: newTask
    });

  } catch (err) {
    next(err);
  }
});

// 4. UPDATE TASK (Triggers WebSocket broadcast + log)
router.patch('/:id', async (req, res, next) => {
  try {
    const { title, description, status, priority, dueDate, assigneeId, attachments } = req.body;

    // Fetch original task to verify tenant scope
    const originalTask = await prisma.task.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId }
    });

    if (!originalTask) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or unauthorized access.'
      });
    }

    const updates = {};
    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description.trim();
    if (status !== undefined) updates.status = status;
    if (priority !== undefined) updates.priority = priority;
    if (dueDate !== undefined) updates.dueDate = new Date(dueDate);
    if (attachments !== undefined) updates.attachments = JSON.stringify(attachments);

    if (assigneeId !== undefined) {
      if (assigneeId === null) {
        updates.assigneeId = null;
      } else {
        const userExists = await prisma.user.findFirst({
          where: { id: assigneeId, tenantId: req.tenantId }
        });
        if (!userExists) {
          return res.status(400).json({
            success: false,
            message: 'Assignee user must belong to your organization.'
          });
        }
        updates.assigneeId = assigneeId;
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id: req.params.id },
      data: updates,
      include: {
        assignee: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // 1. Log activity
    let changeMsg = `Updated task "${updatedTask.title}"`;
    if (status && status !== originalTask.status) {
      changeMsg += ` status from ${originalTask.status} to ${status}`;
    }
    await logActivity(req.tenantId, req.user.id, 'Task Updated', changeMsg);

    // 2. WebSocket Real-time sync
    const io = req.app.get('io');
    if (io) {
      io.to(req.tenantId).emit('task_updated', updatedTask);
    }

    res.json({
      success: true,
      message: 'Task updated successfully.',
      data: updatedTask
    });

  } catch (err) {
    next(err);
  }
});

// 5. DELETE TASK (Triggers WebSocket broadcast + log)
router.delete('/:id', async (req, res, next) => {
  try {
    const task = await prisma.task.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or unauthorized access.'
      });
    }

    await prisma.task.delete({
      where: { id: req.params.id }
    });

    // 1. Log activity
    await logActivity(req.tenantId, req.user.id, 'Task Deleted', `Deleted task "${task.title}"`);

    // 2. WebSocket Real-time sync
    const io = req.app.get('io');
    if (io) {
      io.to(req.tenantId).emit('task_deleted', { id: req.params.id });
    }

    res.json({
      success: true,
      message: 'Task deleted successfully.'
    });

  } catch (err) {
    next(err);
  }
});

module.exports = router;
