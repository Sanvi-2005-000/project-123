const { CreateUser, GetAllUsers, DeleteUser, LoginUser } = require('../controllers/userController');
const express = require('express');
const upload = require('../middleware/uploadMiddleware');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// Define routes for User entity
router.post('/signup', upload.single('image'), CreateUser);
router.get('/all', authMiddleware, GetAllUsers);
router.delete('/:id', authMiddleware, DeleteUser);
router.post('/login', LoginUser);
router.get('/me', authMiddleware, (req, res) => {
  res.status(200).json({ user: req.user });
});

module.exports = router;