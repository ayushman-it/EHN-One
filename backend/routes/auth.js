const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Generate JWT Token helper
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'ehn_one_jwt_secret_key_2026',
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

// @route   POST /api/auth/login
// @desc    Authenticate real user from MongoDB database
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email address and password',
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. Query Mongoose User model
    let user = await User.findOne({ email: cleanEmail });

    // 2. Query native Mongo collection if not found by Mongoose
    if (!user && mongoose.connection && mongoose.connection.db) {
      user = await mongoose.connection.db.collection('users').findOne({ 
        email: { $regex: new RegExp(`^${cleanEmail}$`, 'i') } 
      }).catch(() => null);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email address or user account does not exist. Please contact Admin.',
      });
    }

    // Check Password using bcrypt
    let isMatch = false;
    if (user.password) {
      if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
        isMatch = await bcrypt.compare(password, user.password).catch(() => false);
      } else {
        isMatch = (password === user.password);
      }
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password. Please check your credentials.',
      });
    }

    if (user.status && user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: `Account is currently ${user.status}. Please contact Admin.`,
      });
    }

    const token = generateToken(user._id || user.id);

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id || user.id,
        name: user.name || cleanEmail.split('@')[0],
        email: user.email || cleanEmail,
        role: user.role || 'admin',
        department: user.department || 'Operations',
        avatar: user.avatar || null,
        customPermissions: Array.isArray(user.customPermissions) ? user.customPermissions : [],
      },
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server authentication error',
    });
  }
});

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;

    const cleanEmail = email.toLowerCase().trim();
    let userExists = await User.findOne({ email: cleanEmail });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User email already exists in system',
      });
    }

    const user = await User.create({
      name,
      email: cleanEmail,
      password,
      role: role || 'viewer',
      department: department || 'Operations',
      customPermissions: [],
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        avatar: user.avatar,
        customPermissions: user.customPermissions || [],
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating user',
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current logged in user details
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        avatar: user.avatar,
        customPermissions: user.customPermissions || [],
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
