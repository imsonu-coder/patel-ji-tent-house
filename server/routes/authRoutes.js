const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const generateToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });

router.post('/register', async (req, res) => {
  try {
    const { name, phone, email, password, confirmPassword } = req.body;

    if (!name || !phone || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match.' });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({ message: 'A user with this email or phone already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      phone,
      email,
      password: hashedPassword,
      role: 'customer'
    });

    const token = generateToken(user);
    res.status(201).json({ token, user: { ...user.toObject(), password: undefined } });
  } catch (error) {
    res.status(500).json({ message: 'Unable to register user.', error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;

    if (!emailOrPhone || !password) {
      return res.status(400).json({ message: 'Email/phone and password are required.' });
    }

    const normalizedInput = String(emailOrPhone).trim();
    const user = await User.findOne({
      $or: [{ email: normalizedInput }, { phone: normalizedInput }]
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(String(password), user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = generateToken(user);
    res.json({ token, user: { ...user.toObject(), password: undefined } });
  } catch (error) {
    res.status(500).json({ message: 'Login failed.', error: error.message });
  }
});

router.get('/me', authenticate, async (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
