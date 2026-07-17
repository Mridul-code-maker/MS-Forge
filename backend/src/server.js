const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const tenantRoutes = require('./routes/tenants');
const logRoutes = require('./routes/logs');
const uploadRoutes = require('./routes/upload');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);

// 1. Initialize Socket.io with CORS
const io = socketIo(server, {
  cors: {
    origin: '*', // For development, allow all origins
    methods: ['GET', 'POST', 'PATCH', 'DELETE']
  }
});
app.set('io', io);

const prisma = new PrismaClient();

// 2. Global Middlewares
app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiter: 100 requests per minute per IP
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after a minute.'
  }
});
app.use(limiter);

// Configure CORS
app.use(cors({
  origin: true, // reflect request origin
  credentials: true
}));

// 3. Keep-alive Uptime Pinger endpoint (runs 24/7)
app.get('/api/v1/keep-alive', (req, res) => {
  res.json({
    success: true,
    message: 'MS-Forge Engine is Active.',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// 4. Mount API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/tenants', tenantRoutes);
app.use('/api/v1/logs', logRoutes);
app.use('/api/v1/upload', uploadRoutes);

// 5. WebSocket Connection Handling (Enforcing Tenant Isolation)
io.on('connection', (socket) => {
  console.log('Socket client connected:', socket.id);

  // Client requests to join their tenant-scoped room
  socket.on('join_tenant', (tenantId) => {
    if (tenantId) {
      socket.join(tenantId);
      console.log(`Socket ${socket.id} joined room (Tenant ID): ${tenantId}`);
    }
  });

  socket.on('disconnect', () => {
    console.log('Socket client disconnected:', socket.id);
  });
});

// 6. Background Cron Job: Daily activity email summary simulation
// Runs every day at 12:00 AM (midnight)
cron.schedule('0 0 * * *', async () => {
  console.log('Running daily background audit task...');
  try {
    const tenants = await prisma.tenant.findMany();
    
    for (const tenant of tenants) {
      // Find all activities logged in the last 24 hours
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const logs = await prisma.activityLog.findMany({
        where: {
          tenantId: tenant.id,
          createdAt: { gte: yesterday }
        },
        include: { user: true }
      });

      if (logs.length > 0) {
        console.log(`Sending daily digest for Tenant: ${tenant.name} (${logs.length} events logged)`);
        
        // Setup mock nodemailer transporter
        const transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: 'mock@ethereal.email',
            pass: 'mockpassword'
          }
        });

        const htmlContent = `
          <h2>Daily Activity Summary - ${tenant.name}</h2>
          <p>The following events occurred in your workspace over the last 24 hours:</p>
          <ul>
            ${logs.map(log => `<li><strong>${log.user.name}</strong> (${log.user.role}): ${log.action} - ${log.details}</li>`).join('')}
          </ul>
        `;

        // Send simulated email
        await transporter.sendMail({
          from: '"MS-Forge Sentinel" <sentinel@msforge.com>',
          to: 'admin@msforge.com',
          subject: `Daily Workspace Digest - ${tenant.name}`,
          html: htmlContent
        });
      }
    }
  } catch (err) {
    console.error('Failed to run daily background cron job:', err);
  }
});

// 7. Global Error Handler Middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`MS-Forge backend server running on port ${PORT}`);
  console.log(`====================================================`);
});
