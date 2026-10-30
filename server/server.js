const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { globalLimiter } = require('./middleware/rateLimiter');
const bcrypt = require('bcryptjs');

const connectDB = require('./config/db');
const { getDatabaseStatus } = connectDB;
const User = require('./models/User');
const Category = require('./models/Category');
const Item = require('./models/Item');
const authRoutes = require('./routes/authRoutes');
const itemRoutes = require('./routes/itemRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const requestRoutes = require('./routes/requestRoutes');
const quotationRoutes = require('./routes/quotationRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const galleryRoutes = require('./routes/galleryRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const adminInventoryRoutes = require('./routes/adminInventoryRoutes');
const contactRoutes = require('./routes/contactRoutes');
const { redactDiagnosticText } = require('./utils/httpValidation');

const app = express();
const PORT = process.env.PORT || 5001;

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});
if (process.env.TRUST_PROXY === '1') app.set('trust proxy', 1);

const developmentOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174'
];
const configuredOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((origin) => origin.trim()).filter(Boolean)
  : [];
const allowedOrigins = [
  ...configuredOrigins,
  ...(process.env.NODE_ENV === 'production' ? [] : developmentOrigins)
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);
app.use(globalLimiter);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.get(['/', '/api', '/api/'], (req, res) => {
  res.json({
    status: 'ok',
    message: 'Patel Ji Tent House API is active and running.',
    database: getDatabaseStatus(),
    endpoints: {
      health: '/api/health',
      items: '/api/items',
      categories: '/api/categories',
      gallery: '/api/gallery'
    }
  });
});

app.get('/api/health', (req, res) => {
  const database = getDatabaseStatus();
  const status = database.connected ? 'ok' : 'unavailable';
  res.status(database.connected ? 200 : 503).json({
    status,
    message: 'Patel Ji Tent House API health status.',
    database
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api', requestRoutes);
app.use('/api', quotationRoutes);
app.use('/api', bookingRoutes);
app.use('/api/admin/suppliers', supplierRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/admin/analytics', analyticsRoutes);
app.use('/api/admin/inventory', adminInventoryRoutes);
app.use('/api/contact', contactRoutes);



app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  const isClientParserError = ['entity.parse.failed', 'entity.too.large'].includes(err.type);
  const statusCode = isClientParserError ? (err.type === 'entity.too.large' ? 413 : 400) : 500;
  if (statusCode === 500) {
    const identity = `[${req.method} ${req.path}] ${err.name || 'Error'}${err.code ? ` (${err.code})` : ''}`;
    if (process.env.NODE_ENV === 'production') {
      console.error(identity);
    } else {
      console.error(identity, redactDiagnosticText(err.stack || err.message || ''));
    }
  }
  return res.status(statusCode).json({
    message: statusCode === 413
      ? 'Request body is too large.'
      : statusCode === 400
        ? 'Request body is malformed.'
        : 'Something went wrong on the server.'
  });
});

const startServer = async () => {
  await connectDB();

  if (process.env.MONGODB_MODE === 'memory') {
    const adminEmail = process.env.DEV_ADMIN_EMAIL?.trim().toLowerCase();
    const adminPhone = process.env.DEV_ADMIN_PHONE?.trim();
    const adminPassword = process.env.DEV_ADMIN_PASSWORD;
    const adminConfigCount = [adminEmail, adminPhone, adminPassword].filter(Boolean).length;
    if (adminConfigCount !== 0 && adminConfigCount !== 3) {
      throw new Error('Set all of DEV_ADMIN_EMAIL, DEV_ADMIN_PHONE, and DEV_ADMIN_PASSWORD to bootstrap a temporary development admin.');
    }
    if (adminConfigCount === 3) {
      if (adminPassword.length < 12) {
        throw new Error('DEV_ADMIN_PASSWORD must be at least 12 characters.');
      }
      const existingAdmin = await User.findOne({
        $or: [{ email: adminEmail }, { phone: adminPhone }]
      });
      if (existingAdmin && existingAdmin.role !== 'admin') {
        throw new Error('DEV_ADMIN_EMAIL or DEV_ADMIN_PHONE already belongs to a non-admin account.');
      }
      if (!existingAdmin) {
        await User.create({
          name: 'Development Admin',
          phone: adminPhone,
          email: adminEmail,
          password: await bcrypt.hash(adminPassword, 10),
          role: 'admin'
        });
      }
    }

    const categories = await Category.countDocuments();
    if (categories === 0) {
      const created = await Category.insertMany([
        { name: 'Tents', slug: 'tents', description: 'Event tents and canopies' },
        { name: 'Furniture', slug: 'furniture', description: 'Chairs, tables, sofas' },
        { name: 'Lighting', slug: 'lighting', description: 'Decorative lights and chandeliers' },
        { name: 'Decoration', slug: 'decoration', description: 'Mandaps and decor' },
        { name: 'Stage', slug: 'stage', description: 'Stage equipment and decor' },
        { name: 'Catering', slug: 'catering', description: 'Event dining essentials' },
        { name: 'Other', slug: 'other', description: 'Other support items' }
      ]);

      const categoryMap = Object.fromEntries(created.map((category) => [category.name, category._id]));
      await Item.insertMany([
        {
          name: 'Royal Tent',
          category: categoryMap['Tents'],
          description: 'Premium royal tent for weddings and big family events.',
          images: ['https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80'],
          basePrice: 15000,
          priceUnit: 'Per Day',
          ownStock: 8,
          status: 'active'
        },
        {
          name: 'Banquet Chair',
          category: categoryMap['Furniture'],
          description: 'Elegant banquet chair for dining and reception arrangements.',
          images: ['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80'],
          basePrice: 220,
          priceUnit: 'Per Piece',
          ownStock: 120,
          status: 'active'
        },
        {
          name: 'Round Table',
          category: categoryMap['Furniture'],
          description: 'Classic round table setup for banquets and family functions.',
          images: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80'],
          basePrice: 950,
          priceUnit: 'Per Piece',
          ownStock: 60,
          status: 'active'
        },
        {
          name: 'Chandelier',
          category: categoryMap['Lighting'],
          description: 'Statement chandelier lighting for elegant event ambience.',
          images: ['https://images.unsplash.com/photo-1519162584292-56dfc390fc75?auto=format&fit=crop&w=1200&q=80'],
          basePrice: 4500,
          priceUnit: 'Per Setup',
          ownStock: 12,
          status: 'active'
        }
      ]);
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer().catch((error) => {
  console.error(`Server startup failed: ${error.name || 'Error'}${error.code ? ` (${error.code})` : ''}`);
  if (process.env.NODE_ENV !== 'production') {
    console.error(redactDiagnosticText(error.stack || error.message || ''));
  }
  process.exitCode = 1;
});
