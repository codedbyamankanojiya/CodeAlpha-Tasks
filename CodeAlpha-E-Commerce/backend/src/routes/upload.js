const express = require('express');
const { protect } = require('../middleware/auth');

const router = express.Router();

// POST /api/upload — mock upload (no Cloudinary needed)
router.post('/', protect, async (req, res) => {
  // Return a placeholder image URL
  const urls = [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
  ];
  res.json({ message: 'Upload successful', urls });
});

module.exports = router;
