
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ask = (question) =>
  new Promise((resolve) => rl.question(question, resolve));

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);

    const name = (await ask('Admin name: ')).trim();
    const email = (await ask('Admin email: ')).trim().toLowerCase();
    const phone = (await ask('Admin phone: ')).trim();
    const password = await ask('Admin password (minimum 6 characters): ');

    if (!name || !email || !phone || password.length < 6) {
      throw new Error('Enter all details and a password of at least 6 characters.');
    }

    const existing = await User.findOne({
      $or: [{ email }, { phone }]
    });

    if (existing) {
      throw new Error(
        'That email or phone already exists. No account was changed.'
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role: 'admin',
      status: 'active'
    });

    console.log('Admin account created successfully.');
  } catch (error) {
    console.error('Could not create admin:', error.message);
  } finally {
    rl.close();
    await mongoose.disconnect();
  }
}

createAdmin();
