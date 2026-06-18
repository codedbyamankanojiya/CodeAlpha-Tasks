const express = require('express');
const Review = require('../models/Review');
const Product = require('../models/Product');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/reviews?productId=xxx
router.get('/', async (req, res, next) => {
  try {
    const { productId } = req.query;
    const whereClause = {};
    if (productId) whereClause.productId = productId;

    const reviews = await Review.findAll({
      where: whereClause,
      include: [{ model: User, attributes: ['id', 'name', 'avatar'] }],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      reviews: reviews.map((r) => r.toAPI())
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/reviews
router.post('/', protect, async (req, res, next) => {
  try {
    const { productId, rating, title, content, images } = req.body;
    if (!productId || !rating || !content) {
      return res.status(400).json({ message: 'productId, rating, and content are required' });
    }
    
    const product = await Product.findByPk(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Check if user already reviewed this product
    const existing = await Review.findOne({
      where: {
        productId,
        userId: req.user.id
      }
    });
    if (existing) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }

    const review = await Review.create({
      productId: parseInt(productId),
      userId: req.user.id,
      rating: parseInt(rating),
      title: title || null,
      content,
      images: images || [],
    });

    // Update product's cached rating and count
    const allReviews = await Review.findAll({ where: { productId } });
    const count = allReviews.length;
    const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / count;
    
    product.reviewCount = count;
    product.rating = parseFloat(avg.toFixed(2));
    await product.save();

    res.status(201).json({
      review: {
        id: review.id.toString(),
        productId: review.productId.toString(),
        rating: review.rating,
        title: review.title,
        content: review.content,
        createdAt: review.createdAt.toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
