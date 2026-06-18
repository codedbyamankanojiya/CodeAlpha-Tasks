const express = require('express');
const Cart = require('../models/Cart');
const CartItem = require('../models/CartItem');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Helper: fetch cart and populate items & products, formatting for frontend compatibility
const getFormattedCart = async (userId) => {
  let [cart] = await Cart.findOrCreate({
    where: { userId }
  });

  // Fetch all CartItems including the Product info
  const items = await CartItem.findAll({
    where: { cartId: cart.id },
    include: [Product]
  });

  // Clean up any items whose products no longer exist in the system
  const validItems = [];
  for (const item of items) {
    if (!item.Product) {
      await item.destroy();
    } else {
      validItems.push(item);
    }
  }

  return cart.toAPI(validItems);
};

// GET /api/cart
router.get('/', protect, async (req, res, next) => {
  try {
    const cart = await getFormattedCart(req.user.id);
    res.json({ cart });
  } catch (err) {
    next(err);
  }
});

// POST /api/cart/add
router.post('/add', protect, async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;
    
    const product = await Product.findByPk(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    let [cart] = await Cart.findOrCreate({
      where: { userId: req.user.id }
    });

    // Check if product is already in cart
    let item = await CartItem.findOne({
      where: { 
        cartId: cart.id, 
        productId: product.id 
      }
    });

    if (item) {
      item.quantity += parseInt(quantity);
      await item.save();
    } else {
      item = await CartItem.create({
        cartId: cart.id,
        productId: product.id,
        quantity: parseInt(quantity),
        price: product.price // stores active price at point of adding
      });
    }

    const formatted = await getFormattedCart(req.user.id);
    res.json({ message: 'Added to cart', cart: formatted });
  } catch (err) {
    next(err);
  }
});

// PUT /api/cart/items/:itemId
router.put('/items/:itemId', protect, async (req, res, next) => {
  try {
    const { quantity } = req.body;
    
    const item = await CartItem.findByPk(req.params.itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    // Validate ownership
    const cart = await Cart.findOne({ where: { id: item.cartId, userId: req.user.id } });
    if (!cart) return res.status(403).json({ message: 'Forbidden — not your cart item' });

    if (parseInt(quantity) <= 0) {
      await item.destroy();
    } else {
      item.quantity = parseInt(quantity);
      await item.save();
    }

    const formatted = await getFormattedCart(req.user.id);
    res.json({ message: 'Cart updated', cart: formatted });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/cart/items/:itemId
router.delete('/items/:itemId', protect, async (req, res, next) => {
  try {
    const item = await CartItem.findByPk(req.params.itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    // Validate ownership
    const cart = await Cart.findOne({ where: { id: item.cartId, userId: req.user.id } });
    if (!cart) return res.status(403).json({ message: 'Forbidden — not your cart item' });

    await item.destroy();
    res.json({ message: 'Item removed' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/cart/clear
router.delete('/clear', protect, async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ where: { userId: req.user.id } });
    if (cart) {
      await CartItem.destroy({ where: { cartId: cart.id } });
    }
    res.json({ message: 'Cart cleared' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
