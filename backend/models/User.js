const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'viewer'],
    default: 'viewer',
  },
  department: {
    type: String,
    enum: ['Sales', 'Operations', 'Finance', 'IT', 'HR', 'Warehouse', 'Procurement', 'Management'],
    default: 'Operations',
  },
  phone: String,
  avatar: String,
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  lastLogin: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before save if modified
userSchema.pre('save', async function(next) {
  this.updatedAt = Date.now();

  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password with hashed password in DB
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
