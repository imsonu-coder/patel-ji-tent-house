require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const path = require('path');

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
const contactRoutes = require('./routes/contactRoutes');

const app = express();
const PORT = process.env.PORT || 5001;

const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174'
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
  })
);
app.use(helmet());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests, please try again later.'
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api', requestRoutes);
app.use('/api', quotationRoutes);
app.use('/api', bookingRoutes);
app.use('/api/admin/suppliers', supplierRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/admin/analytics', analyticsRoutes);
app.use('/api/contact', contactRoutes);

app.get('/api/health', (req, res) => {
  const database = getDatabaseStatus();
  const status = database.connected ? 'ok' : 'unavailable';
  res.status(database.connected ? 200 : 503).json({
    status,
    message: 'Patel Ji Tent House API health status.',
    database
  });
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong on the server.' });
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

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer().catch((error) => {
  console.error(`Server startup failed: ${error.message}`);
  process.exitCode = 1;
});
