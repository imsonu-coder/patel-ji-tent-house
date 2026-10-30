const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authLimiter } = require('../middleware/rateLimiter');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');
const {
  isPlainObject,
  readText,
  sendRouteError
} = require('../utils/httpValidation');

const router = express.Router();

const generateToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '7d',
    algorithm: 'HS256'
  });

const validateRegistrationInput = (body) => {
  if (!isPlainObject(body)) {
    const error = new Error('Registration details must be an object.');
    error.statusCode = 400;
    throw error;
  }
  const allowedFields = new Set(['name', 'phone', 'email', 'password', 'confirmPassword']);
  if (Object.keys(body).some((field) => !allowedFields.has(field))) {
    const error = new Error('Registration details contain unsupported fields.');
    error.statusCode = 400;
    throw error;
  }
  const name = readText(body.name, { max: 100 });
  const phone = readText(body.phone, { max: 24 });
  const email = readText(body.email, { max: 254 })?.toLowerCase();
  const password = body.password;
  if (!name || !phone || !email || typeof password !== 'string') {
    const error = new Error('Please provide valid name, phone, email and password fields.');
    error.statusCode = 400;
    throw error;
  }
  const phoneDigits = phone.replace(/\D/g, '');
  if (!/^\+?[\d ()-]+$/.test(phone) || phoneDigits.length < 7 || phoneDigits.length > 15) {
    const error = new Error('Phone number is invalid.');
    error.statusCode = 400;
    throw error;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    const error = new Error('Email address is invalid.');
    error.statusCode = 400;
    throw error;
  }
  if (
    password.length < 6
    || Buffer.byteLength(password, 'utf8') > 72
    || body.password !== body.confirmPassword
  ) {
    const error = new Error('Password must be 6 characters or longer, no more than 72 bytes, and match the confirmation.');
    error.statusCode = 400;
    throw error;
  }
  return { name, phone, email, password };
};

router.post('/register', authLimiter, async (req, res) => {
  try {
    const { name, phone, email, password } = validateRegistrationInput(req.body);

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
    sendRouteError(res, error, 'Unable to register user.');
  }
});

router.post('/login', authLimiter, async (req, res) => {
  try {
    if (!isPlainObject(req.body)) {
      return res.status(400).json({ message: 'Login details must be provided as an object.' });
    }
    const emailOrPhone = readText(req.body.emailOrPhone, { max: 254 });
    const password = req.body.password;
    if (!emailOrPhone || typeof password !== 'string' || !password) {
      return res.status(400).json({ message: 'Email/phone and password are required.' });
    }

    const normalizedInput = emailOrPhone.toLowerCase();
    const user = await User.findOne({
      $or: [{ email: normalizedInput }, { phone: normalizedInput }]
    });

    if (!user || user.status !== 'active') {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = generateToken(user);
    res.json({ token, user: { ...user.toObject(), password: undefined } });
  } catch (error) {
    sendRouteError(res, error, 'Login failed.');
  }
});

router.get('/me', authenticate, async (req, res) => {
  res.json({ user: req.user });
});

router.validateRegistrationInput = validateRegistrationInput;
module.exports = router;
