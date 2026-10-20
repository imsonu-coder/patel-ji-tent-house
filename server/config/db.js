const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let memoryServer;
let databaseMode = 'mongodb';

const connectDB = async () => {
  const configuredMode = process.env.MONGODB_MODE || 'mongodb';
  const mongoUri = process.env.MONGODB_URI;

  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required. Set it in server/.env before starting the server.');
  }

  if (configuredMode === 'memory') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('MONGODB_MODE=memory is not allowed in production.');
    }
    if (mongoUri) {
      throw new Error('Unset MONGODB_URI when explicitly using MONGODB_MODE=memory.');
    }

    databaseMode = 'memory';
    memoryServer = await MongoMemoryServer.create();
    await mongoose.connect(memoryServer.getUri(), { serverSelectionTimeoutMS: 10000 });
    console.warn('Connected to explicitly enabled in-memory MongoDB; data is temporary and is lost on shutdown.');
    return;
  }

  if (configuredMode !== 'mongodb') {
    throw new Error(`Unsupported MONGODB_MODE "${configuredMode}". Use "mongodb" or "memory".`);
  }
  if (!mongoUri) {
    throw new Error('MONGODB_URI is required. Configure a persistent MongoDB connection or explicitly opt in to MONGODB_MODE=memory for local testing.');
  }

  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
  databaseMode = 'mongodb';
  console.log(`Connected to MongoDB database "${mongoose.connection.name}" at ${mongoose.connection.host}.`);
};

module.exports = connectDB;
module.exports.getDatabaseStatus = () => ({
  mode: databaseMode,
  connected: mongoose.connection.readyState === 1,
  database: mongoose.connection.name || null,
  host: mongoose.connection.host || null
});
module.exports.closeMemoryServer = async () => {
  if (memoryServer) {
    await memoryServer.stop();
  }
};
