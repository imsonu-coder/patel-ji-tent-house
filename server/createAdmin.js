
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

const askSecret = (question) => new Promise((resolve, reject) => {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== 'function') {
    reject(new Error('Run this utility in an interactive terminal to enter the admin password securely.'));
    return;
  }

  rl.close();
  process.stdout.write(question);
  let value = '';
  const finish = (error) => {
    process.stdin.removeListener('data', onData);
    process.stdin.setRawMode(false);
    process.stdin.pause();
    process.stdout.write('\n');
    if (error) reject(error);
    else resolve(value);
  };
  const onData = (input) => {
    for (const byte of input) {
      if (byte === 3) {
        finish(new Error('Admin setup was cancelled.'));
        return;
      }
      if (byte === 10 || byte === 13) {
        finish();
        return;
      }
      if (byte === 8 || byte === 127) {
        value = value.slice(0, -1);
      } else if (byte >= 32 && byte <= 126) {
        value += String.fromCharCode(byte);
      }
    }
  };

  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.on('data', onData);
});

async function createAdmin() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('A MongoDB URI must be configured before running this utility.');
    }
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });

    const name = (await ask('Admin name: ')).trim();
    const email = (await ask('Admin email: ')).trim().toLowerCase();
    const phone = (await ask('Admin phone: ')).trim();
    const password = await askSecret('Admin password (minimum 12 characters; input hidden): ');

    if (
      !name
      || name.length > 100
      || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      || email.length > 254
      || !/^\+?[\d ()-]+$/.test(phone)
      || phone.replace(/\D/g, '').length < 7
      || phone.replace(/\D/g, '').length > 15
      || password.length < 12
      || Buffer.byteLength(password, 'utf8') > 72
    ) {
      throw new Error('Enter valid admin details and a password of 12 or more characters.');
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
    console.error(`Could not create admin: ${error.name || 'Error'}${error.code ? ` (${error.code})` : ''}`);
  } finally {
    rl.close();
    await mongoose.disconnect();
  }
}

createAdmin();
