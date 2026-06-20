const express = require('express');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Cart = require('../models/Cart');
const CartItem = require('../models/CartItem');
const Product = require('../models/Product');
const User = require('../models/User');
const { protect, requireRole } = require('../middleware/auth');

const router = express.Router();

// POST /api/orders
router.post('/', protect, async (req, res, next) => {
  try {
    const { items, shippingAddress, paymentMethod, totalAmount } = req.body;
    if (!items || !items.length) return res.status(400).json({ message: 'Order must have items' });

    // Validate and structure order items, update stocks
    const orderItemsData = [];
    let subtotal = 0;
    
    for (const item of items) {
      const product = await Product.findByPk(item.productId);
      if (!product) return res.status(404).json({ message: `Product ${item.productId} not found` });

      const price = item.price || product.price;
      const total = price * item.quantity;
      
      orderItemsData.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: price,
      });
      
      subtotal += total;
      
      // Stock updates
      product.stock = Math.max(0, product.stock - item.quantity);
      await product.save();
    }

    const tax = Math.round(subtotal * 0.05);
    const shipping = subtotal >= 999 ? 0 : 99;
    const orderTotal = totalAmount || subtotal + tax + shipping;

    // Create primary Order
    const order = await Order.create({
      userId: req.user.id,
      subtotal,
      tax,
      shipping,
      discount: 0,
      total: orderTotal,
      paymentStatus: 'PENDING',
      shippingAddress,
    });

    // Create child OrderItems
    for (const itemData of orderItemsData) {
      await OrderItem.create({
        orderId: order.id,
        productId: itemData.productId,
        quantity: itemData.quantity,
        unitPrice: itemData.unitPrice,
      });
    }

    // Clear cart items for this customer
    const cart = await Cart.findOne({ where: { userId: req.user.id } });
    if (cart) {
      await CartItem.destroy({ where: { cartId: cart.id } });
    }

    // Fetch fresh completed order with items and products included
    const freshOrder = await Order.findByPk(order.id, {
      include: [{ model: OrderItem, as: 'items', include: [Product] }]
    });

    res.status(201).json(freshOrder.toAPI(freshOrder.items));
  } catch (err) {
    next(err);
  }
});

// GET /api/orders
router.get('/', protect, async (req, res, next) => {
  try {
    const orders = await Order.findAll({ 
      where: { userId: req.user.id },
      include: [{ model: OrderItem, as: 'items', include: [Product] }],
      order: [['createdAt', 'DESC']] 
    });
    
    res.json(orders.map(o => o.toAPI(o.items)));
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/admin/all (Admin only)
router.get('/admin/all', protect, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const orders = await Order.findAll({
      include: [
        { model: OrderItem, as: 'items', include: [Product] },
        { model: User, attributes: ['id', 'name', 'email'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    const formatted = orders.map(o => {
      const apiOrder = o.toAPI(o.items);
      apiOrder.user = o.User ? { id: o.User.id, name: o.User.name, email: o.User.email } : null;
      return apiOrder;
    });
    res.json(formatted);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/orders/:id/status (Admin or Seller)
router.patch('/:id/status', protect, requireRole('ADMIN', 'SELLER'), async (req, res, next) => {
  try {
    const { status, paymentStatus } = req.body;
    
    const order = await Order.findByPk(req.params.id, {
      include: [{ model: OrderItem, as: 'items', include: [Product] }]
    });
    
    if (!order) return res.status(404).json({ message: 'Order not found' });
    
    if (status) {
      const validStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];
      if (!validStatuses.includes(status.toUpperCase())) {
        return res.status(400).json({ message: `Invalid status. Must be one of ${validStatuses.join(', ')}` });
      }
      order.status = status.toUpperCase();
    }
    
    if (paymentStatus) {
      const validPaymentStatuses = ['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'];
      if (!validPaymentStatuses.includes(paymentStatus.toUpperCase())) {
        return res.status(400).json({ message: `Invalid payment status. Must be one of ${validPaymentStatuses.join(', ')}` });
      }
      order.paymentStatus = paymentStatus.toUpperCase();
    }
    
    await order.save();
    
    res.json(order.toAPI(order.items));
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/:id
router.get('/:id', protect, async (req, res, next) => {
  try {
    const order = await Order.findOne({ 
      where: { id: req.params.id, userId: req.user.id },
      include: [{ model: OrderItem, as: 'items', include: [Product] }]
    });
    
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order.toAPI(order.items));
  } catch (err) {
    next(err);
  }
});

// POST /api/orders/:id/confirm-mock-payment
router.post('/:id/confirm-mock-payment', protect, async (req, res, next) => {
  try {
    const order = await Order.findOne({ 
      where: { id: req.params.id, userId: req.user.id },
      include: [{ model: OrderItem, as: 'items', include: [Product] }]
    });
    
    if (!order) return res.status(404).json({ message: 'Order not found' });
    
    order.paymentStatus = 'PAID';
    order.status = 'CONFIRMED';
    order.paymentId = `mock_pay_${Date.now()}`;
    await order.save();
    
    res.json(order.toAPI(order.items));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
