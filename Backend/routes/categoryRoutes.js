const express = require('express');
const { GetAllCategories, CreateCategory, UpdateCategory } = require('../controllers/categoryController');

const router = express.Router();

// Define routes for Category entity
router.get('/', GetAllCategories);
router.post('/', CreateCategory);
router.put('/:id', UpdateCategory);

module.exports = router;
