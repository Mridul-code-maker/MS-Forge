const express = require('express');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

// Mock Cloudinary storage endpoint for local testing
router.post('/', async (req, res, next) => {
  try {
    // In a real application, we would parse multipart/form-data and upload to Cloudinary.
    // To ensure the project builds and runs immediately without demanding credentials:
    const mockFiles = [
      'https://images.unsplash.com/photo-1540350390157-c74035bfc3e4?w=500&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=500&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60'
    ];

    const randomUrl = mockFiles[Math.floor(Math.random() * mockFiles.length)];

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully (Mock Cloudinary Service).',
      data: {
        url: randomUrl,
        filename: 'attachment_' + Date.now() + '.jpg',
        bytes: 1024 * 125 // 125KB
      }
    });

  } catch (err) {
    next(err);
  }
});

module.exports = router;
