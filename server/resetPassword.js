const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function resetPassword() {
  const email = process.argv[2] || '2004sksonu@gmail.com';
  const newPassword = process.argv[3];

  if (!newPassword || newPassword.length < 6) {
    console.log('Usage: node resetPassword.js <email> <newPassword>');
    console.log('Example: node resetPassword.js 2004sksonu@gmail.com MyNewPassword123');
    process.exit(1);
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('MONGODB_URI not set.');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  const user = await User.findOne({ email: email.trim().toLowerCase() });
  if (!user) {
    console.error(`User with email "${email}" not found.`);
    await mongoose.disconnect();
    process.exit(1);
  }

  user.password = await bcrypt.hash(newPassword, 10);
  user.role = 'admin'; // ensure admin role
  user.status = 'active';
  await user.save();

  console.log(`Password updated successfully for admin: ${user.email} (${user.name})`);
  await mongoose.disconnect();
}

resetPassword().catch(err => {
  console.error('Failed to reset password:', err.message);
  process.exit(1);
});
