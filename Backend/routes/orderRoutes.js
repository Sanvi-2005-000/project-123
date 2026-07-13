const express = require('express');
const { CreateOrder, ConfirmPayment, GetMyOrders, GetVendorOrders } = require('../controllers/orderController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { vendorAuthMiddleware } = require('../middleware/vendorAuthMiddleware');

const router = express.Router();

// Define routes for Order entity
router.post('/', authMiddleware, CreateOrder);
router.post('/payment/confirm', authMiddleware, ConfirmPayment);
router.get('/my', authMiddleware, GetMyOrders);
router.get('/vendor', vendorAuthMiddleware, GetVendorOrders);

module.exports = router;
