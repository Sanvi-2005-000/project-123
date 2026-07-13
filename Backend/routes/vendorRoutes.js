const express = require('express');
const { RegisterVendor, LoginVendor, GetVendorProfile, GetPublicRestaurants } = require('../controllers/vendorController');
const { vendorAuthMiddleware } = require('../middleware/vendorAuthMiddleware');

const router = express.Router();

// Define routes for Vendor entity
router.post('/register', RegisterVendor);
router.post('/login', LoginVendor);
router.get('/me', vendorAuthMiddleware, GetVendorProfile);
router.get('/restaurants', GetPublicRestaurants);

module.exports = router;
