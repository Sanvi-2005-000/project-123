const express = require('express');
const { GetAllProducts, CreateProduct, UpdateProduct } = require('../controllers/productController');
const { vendorAuthMiddleware } = require('../middleware/vendorAuthMiddleware');

const router = express.Router();

// Define routes for Product entity
router.get('/', GetAllProducts);
router.get('/vendor/me', vendorAuthMiddleware, GetAllProducts);
router.post('/', vendorAuthMiddleware, CreateProduct);
router.put('/:id', vendorAuthMiddleware, UpdateProduct);

module.exports = router;
