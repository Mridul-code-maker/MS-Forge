const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'mridul_sharma_ms_forge_secret_2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'mridul_sharma_ms_forge_refresh_secret_2026';

// Helper to generate access and refresh tokens
function generateTokens(user) {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    tenantId: user.tenantId
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId: user.id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

  return { accessToken, refreshToken };
}

// 1. SIGNUP: Create new Tenant and first Admin User
router.post('/signup', async (req, res, next) => {
  try {
    const { organizationName, tenantSlug, email, password, name } = req.body;

    if (!organizationName || !tenantSlug || !email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'All fields (organizationName, tenantSlug, email, password, name) are required.'
      });
    }

    const normalizedSlug = tenantSlug.trim().toLowerCase();

    // Check if slug is taken
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug: normalizedSlug }
    });
    if (existingTenant) {
      return res.status(400).json({
        success: false,
        message: 'Organization workspace URL slug is already taken.'
      });
    }

    // Check if user email is taken
    const existingUser = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() }
    });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email address is already registered.'
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Run in transaction to ensure tenant + user created together
    const result = await prisma.$transaction(async (tx) => {
      const newTenant = await tx.tenant.create({
        data: {
          slug: normalizedSlug,
          name: organizationName.trim()
        }
      });

      const newUser = await tx.user.create({
        data: {
          tenantId: newTenant.id,
          email: email.trim().toLowerCase(),
          passwordHash,
          role: 'Admin', // First user is always Admin
          name: name.trim()
        }
      });

      return { newTenant, newUser };
    });

    const tokens = generateTokens(result.newUser);

    // Set refresh token in HTTP-only cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      success: true,
      message: 'Account and workspace registered successfully.',
      data: {
        accessToken: tokens.accessToken,
        user: {
          id: result.newUser.id,
          email: result.newUser.email,
          name: result.newUser.name,
          role: result.newUser.role,
          tenantId: result.newUser.tenantId
        },
        tenant: {
          id: result.newTenant.id,
          slug: result.newTenant.slug,
          name: result.newTenant.name
        }
      }
    });

  } catch (err) {
    next(err);
  }
});

// 2. LOGIN: Authenticate credentials and return access token
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: { tenant: true }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.'
      });
    }

    const tokens = generateTokens(user);

    // Set refresh token cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      message: 'Logged in successfully.',
      data: {
        accessToken: tokens.accessToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId
        },
        tenant: {
          id: user.tenant.id,
          slug: user.tenant.slug,
          name: user.tenant.name
        }
      }
    });

  } catch (err) {
    next(err);
  }
});

// 3. REFRESH: Issue new access token using refresh token cookie
router.post('/refresh', async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token missing.'
      });
    }

    jwt.verify(refreshToken, JWT_REFRESH_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({
          success: false,
          message: 'Invalid or expired refresh token.'
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { tenant: true }
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User session no longer active.'
        });
      }

      const tokens = generateTokens(user);

      // Rotate refresh token
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.json({
        success: true,
        message: 'Access token rotated successfully.',
        data: {
          accessToken: tokens.accessToken,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            tenantId: user.tenantId
          },
          tenant: {
            id: user.tenant.id,
            slug: user.tenant.slug,
            name: user.tenant.name
          }
        }
      });
    });

  } catch (err) {
    next(err);
  }
});

// 4. LOGOUT: Clear cookie session
router.post('/logout', (req, res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });

  res.json({
    success: true,
    message: 'Logged out successfully.'
  });
});

// 5. ME: Get current authenticated user profile
router.get('/me', authenticateToken, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { tenant: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.'
      });
    }

    res.json({
      success: true,
      message: 'User profile retrieved.',
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenant: {
          id: user.tenant.id,
          slug: user.tenant.slug,
          name: user.tenant.name
        }
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
