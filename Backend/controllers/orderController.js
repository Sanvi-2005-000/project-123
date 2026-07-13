const Order = require('../models/orderModel');
const OrderItem = require('../models/orderItemModel');
const Product = require('../models/productModel');
const Vendor = require('../models/vendorModel');
const crypto = require('crypto');
const Razorpay = require('razorpay');
require('dotenv').config();

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_demo';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'demo_secret';
const RAZORPAY_ENABLED = process.env.RAZORPAY_ENABLED === 'true';

// Initialize Razorpay client
const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

// Format database status code for client application
function statusToClient(status) {
  if (status === 'on_the_way') return 'on-the-way';
  if (status === 'pending') return 'preparing';
  return status;
}

// Map order database entry to clean json format
function formatOrder(order) {
  return {
    id: order.orderNumber,
    restaurantName: order.vendor ? order.vendor.restaurantName : '',
    vendorId: order.vendorId,
    items: order.items ? order.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
    })) : [],
    total: order.total,
    status: statusToClient(order.status),
    date: order.createdAt.toISOString().split('T')[0],
    address: order.address,
    paymentMode: order.paymentMode,
  };
}

// Create new customer order
async function CreateOrder(req, res) {
  try {
    const { items, address, paymentMode = 'COD', deliveryFee = 40, discount = 0, paymentDetails } = req.body;
    if (!Array.isArray(items) || items.length === 0 || !address) {
      return res.status(400).json({ error: 'Items and delivery address are required' });
    }

    const productIds = items.map((item) => Number(item.productId));
    const products = await Product.findAll({ where: { id: productIds }, include: [{ model: Vendor, as: 'vendor' }] });
    if (products.length !== items.length) {
      return res.status(400).json({ error: 'Some products are invalid' });
    }

    const vendorIds = [...new Set(products.map((product) => product.vendorId))];
    if (vendorIds.length !== 1) {
      return res.status(400).json({ error: 'Please order from one restaurant at a time' });
    }

    const subtotal = items.reduce((sum, item) => {
      const product = products.find((p) => p.id === Number(item.productId));
      return sum + product.price * Number(item.quantity);
    }, 0);
    const taxes = Math.round(subtotal * 0.05);
    const total = subtotal + Number(deliveryFee) + taxes - Number(discount);

    const order = await Order.create({
      orderNumber: `ORD${Date.now()}`,
      userId: req.user.id,
      vendorId: vendorIds[0],
      address,
      subtotal,
      deliveryFee,
      taxes,
      discount,
      total,
      paymentMode,
      status: paymentMode === 'ONLINE' ? 'pending' : 'preparing',
    });

    await Promise.all(items.map((item) => {
      const product = products.find((p) => p.id === Number(item.productId));
      return OrderItem.create({
        orderId: order.id,
        productId: product.id,
        name: product.name,
        quantity: Number(item.quantity),
        price: product.price,
      });
    }));

    const created = await Order.findByPk(order.id, {
      include: [{ model: OrderItem, as: 'items' }, { model: Vendor, as: 'vendor' }],
    });

    if (paymentMode === 'ONLINE') {
      let paymentPayload = null;

      if (RAZORPAY_ENABLED) {
        try {
          const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(total * 100),
            currency: 'INR',
            receipt: created.orderNumber,
            notes: {
              orderId: created.orderNumber,
              userId: req.user.id,
            },
          });

          paymentPayload = {
            key: RAZORPAY_KEY_ID,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            orderId: razorpayOrder.id,
            name: 'Zamato Clone',
            description: 'Food order payment',
            prefill: {
              name: req.user.name || 'Customer',
              email: paymentDetails?.email || 'customer@example.com',
              contact: req.user.mobile || '9999999999',
            },
          };
        } catch (paymentError) {
          return res.status(500).json({ error: `Payment gateway error: ${paymentError.message}` });
        }
      } else {
        paymentPayload = {
          key: RAZORPAY_KEY_ID,
          amount: Math.round(total * 100),
          currency: 'INR',
          orderId: created.orderNumber,
          name: 'Zamato Clone',
          description: 'Food order payment',
          prefill: {
            name: req.user.name || 'Customer',
            email: paymentDetails?.email || 'customer@example.com',
            contact: req.user.mobile || '9999999999',
          },
        };
      }

      return res.status(201).json({
        ...formatOrder(created),
        payment: paymentPayload,
      });
    }

    res.status(201).json(formatOrder(created));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Confirm online order payment signatures
async function ConfirmPayment(req, res) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      return res.status(400).json({ error: 'Payment details are required' });
    }

    const order = await Order.findOne({ where: { orderNumber: orderId } });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Payment verification failed' });
    }

    await order.update({ status: 'preparing', paymentMode: 'ONLINE' });

    const updated = await Order.findByPk(order.id, {
      include: [{ model: OrderItem, as: 'items' }, { model: Vendor, as: 'vendor' }],
    });

    res.json({ message: 'Payment confirmed', order: formatOrder(updated) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Retrieve login user's orders
async function GetMyOrders(req, res) {
  try {
    const orders = await Order.findAll({
      where: { userId: req.user.id },
      include: [{ model: OrderItem, as: 'items' }, { model: Vendor, as: 'vendor' }],
      order: [['createdAt', 'DESC']],
    });
    res.json(orders.map(formatOrder));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Retrieve login vendor's restaurant orders
async function GetVendorOrders(req, res) {
  try {
    const orders = await Order.findAll({
      where: { vendorId: req.vendor.id },
      include: [{ model: OrderItem, as: 'items' }, { model: Vendor, as: 'vendor' }],
      order: [['createdAt', 'DESC']],
    });
    res.json(orders.map(formatOrder));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { CreateOrder, ConfirmPayment, GetMyOrders, GetVendorOrders };
