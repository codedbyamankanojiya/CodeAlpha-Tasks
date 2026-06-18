const express = require('express');
const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const Category = require('../models/Category');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/wishlist
router.get('/', protect, async (req, res, next) => {
  try {
    const list = await Wishlist.findAll({
      where: { userId: req.user.id },
      include: [{
        model: Product,
        include: [Category, { model: User, as: 'Seller' }]
      }]
    });
    
    // Format product details
    const products = list
      .filter(item => item.Product !== null)
      .map(item => item.Product.toAPI());

    res.json({ products });
  } catch (err) {
    next(err);
  }
});

// POST /api/wishlist/toggle
router.post('/toggle', protect, async (req, res, next) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ message: 'productId is required' });
    }

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const existing = await Wishlist.findOne({
      where: {
        userId: req.user.id,
        productId: product.id
      }
    });

    if (existing) {
      await existing.destroy();
      res.json({ added: false, message: 'Removed from wishlist' });
    } else {
      await Wishlist.create({
        userId: req.user.id,
        productId: product.id
      });
      res.json({ added: true, message: 'Added to wishlist' });
    }
  } catch (err) {
    next(err);
  }
});

// DELETE /api/wishlist/clear
router.delete('/clear', protect, async (req, res, next) => {
  try {
    await Wishlist.destroy({
      where: { userId: req.user.id }
    });
    res.json({ message: 'Wishlist cleared' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
