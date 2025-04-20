const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { protect, authorize } = require('../middleware/auth.middleware');
const User = require('../models/user.model');

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Admin only
router.post('/register', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const { username, password, role, branch } = req.body;

    // Check if user already exists
    let user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    user = new User({
      username,
      password,
      role,
      branch: branch || 'HEAD_OFFICE' // Set default branch if not provided
    });

    await user.save();

    res.status(201).json({
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        branch: user.branch
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/users
// @desc    Get all users
// @access  Admin only
router.get('/users', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/users/:id
// @desc    Get user by ID
// @access  Admin only
router.get('/users/:id', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/auth/users/:id
// @desc    Update user
// @access  Admin only
router.put('/users/:id', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const { username, password, role } = req.body;
    const updateData = { username, role, branch: 'HEAD_OFFICE' }; // Set default branch

    // Only update password if provided
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/auth/users/:id
// @desc    Delete user
// @access  Admin only
router.delete('/users/:id', protect, authorize('ADMIN'), async (req, res) => {
  try {
    // Check if user exists
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting self
    if (req.user.id === req.params.id) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    // Prevent deleting the last admin
    if (user.role === 'ADMIN') {
      const adminCount = await User.countDocuments({ role: 'ADMIN' });
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'Cannot delete the last admin user' });
      }
    }

    // Use deleteOne instead of findByIdAndDelete for more explicit error handling
    const result = await User.deleteOne({ _id: req.params.id });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'User could not be deleted' });
    }
    
    res.json({ message: 'User successfully removed', success: true });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Validate password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        branch: user.branch
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
