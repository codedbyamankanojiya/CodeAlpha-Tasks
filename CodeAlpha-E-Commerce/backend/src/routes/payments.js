const express = require('express');
const { protect } = require('../middleware/auth');

const router = express.Router();

// POST /api/payments/create-order — mock Razorpay order
router.post('/create-order', protect, async (req, res, next) => {
  try {
    const { amount, currency = 'INR' } = req.body;
    // Simulate Razorpay order creation
    const mockOrder = {
      id: `order_mock_${Date.now()}`,
      entity: 'order',
      amount: Math.round(amount * 100), // paise
      amount_paid: 0,
      amount_due: Math.round(amount * 100),
      currency,
      receipt: `receipt_${Date.now()}`,
      status: 'created',
      created_at: Math.floor(Date.now() / 1000),
    };
    res.json({ order: mockOrder });
  } catch (err) {
    next(err);
  }
});

// POST /api/payments/verify — mock payment verification
router.post('/verify', protect, async (req, res) => {
  res.json({ verified: true, message: 'Payment verified (mock)' });
});

module.exports = router;
