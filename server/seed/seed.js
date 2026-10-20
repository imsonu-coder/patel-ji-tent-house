require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const connectDB = require('../config/db');
const User = require('../models/User');
const Category = require('../models/Category');
const Item = require('../models/Item');
const GalleryImage = require('../models/GalleryImage');
const Supplier = require('../models/Supplier');
const EventRequest = require('../models/EventRequest');
const Quotation = require('../models/Quotation');
const Booking = require('../models/Booking');

const seed = async () => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to run the destructive seed script in production.');
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const adminPhone = process.env.SEED_ADMIN_PHONE?.trim();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminEmail || !adminPhone || !adminPassword || adminPassword.length < 12) {
    throw new Error('Set SEED_ADMIN_EMAIL, SEED_ADMIN_PHONE, and a SEED_ADMIN_PASSWORD of at least 12 characters before seeding.');
  }

  await connectDB();
  await mongoose.connection.db.dropDatabase();

  const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
  const customerPassword = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);

  const admin = await User.create({
    name: 'Admin User',
    phone: adminPhone,
    email: adminEmail,
    password: hashedAdminPassword,
    role: 'admin'
  });

  const customer = await User.create({
    name: 'Demo Customer',
    phone: '8888888888',
    email: 'customer@example.com',
    password: customerPassword,
    role: 'customer'
  });

  const categories = await Category.insertMany([
    { name: 'Tents', slug: 'tents', description: 'Event tents and canopies' },
    { name: 'Furniture', slug: 'furniture', description: 'Chairs, tables, sofas' },
    { name: 'Lighting', slug: 'lighting', description: 'Decorative lights and chandeliers' },
    { name: 'Decoration', slug: 'decoration', description: 'Mandaps and decor' },
    { name: 'Stage', slug: 'stage', description: 'Stage equipment and decor' },
    { name: 'Catering', slug: 'catering', description: 'Event dining essentials' },
    { name: 'Other', slug: 'other', description: 'Other support items' }
  ]);

  const categoryMap = Object.fromEntries(categories.map((category) => [category.name, category._id]));

  const items = await Item.insertMany([
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
    },
    {
      name: 'LED String Light',
      category: categoryMap['Lighting'],
      description: 'Warm decorative string lights for open-air celebrations.',
      images: ['https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&w=1200&q=80'],
      basePrice: 320,
      priceUnit: 'Per Setup',
      ownStock: 40,
      status: 'active'
    },
    {
      name: 'Stage Decoration',
      category: categoryMap['Stage'],
      description: 'Premium stage draping and floral decoration settings.',
      images: ['https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80'],
      basePrice: 6000,
      priceUnit: 'Per Setup',
      ownStock: 10,
      status: 'active'
    },
    {
      name: 'Sofa Set',
      category: categoryMap['Furniture'],
      description: 'Luxury sofa seating for reception lounges and guest areas.',
      images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80'],
      basePrice: 1800,
      priceUnit: 'Per Set',
      ownStock: 18,
      status: 'active'
    }
  ]);

  await GalleryImage.insertMany([
    {
      title: 'Wedding setup',
      category: 'Weddings',
      description: 'Elegant venue styling for a family wedding.',
      imageUrl: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80',
      status: 'active'
    },
    {
      title: 'Royal tent',
      category: 'Tents',
      description: 'Premium tent and canopy arrangement.',
      imageUrl: 'https://images.unsplash.com/photo-1519162584292-56dfc390fc75?auto=format&fit=crop&w=1200&q=80',
      status: 'active'
    },
    {
      title: 'Lighting decor',
      category: 'Lighting',
      description: 'Warm ambient lights for evening function.',
      imageUrl: 'https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&w=1200&q=80',
      status: 'active'
    }
  ]);

  await Supplier.insertMany([
    {
      name: 'Jaipur Decor House',
      phone: '9876543210',
      email: 'decor@demo.com',
      address: 'Jaipur',
      categories: ['Decoration', 'Lighting'],
      notes: 'External decor supplier.',
      status: 'active'
    },
    {
      name: 'Royal Event Rentals',
      phone: '9876000011',
      email: 'rental@demo.com',
      address: 'Delhi',
      categories: ['Tents', 'Furniture'],
      notes: 'Supplementary rental arrangements.',
      status: 'active'
    }
  ]);

  const sampleRequest = await EventRequest.create({
    requestId: 'PJTH-1001',
    user: customer._id,
    eventType: 'Wedding',
    startDate: new Date('2026-11-15'),
    endDate: new Date('2026-11-17'),
    location: 'Jaipur',
    guestCount: 250,
    additionalRequirements: 'Need red and gold decor and large entrance gate.',
    description: 'Wedding event with family gathering.',
    items: [
      {
        item: items[0]._id,
        itemName: items[0].name,
        quantity: 3,
        unitPrice: items[0].basePrice,
        estimatedPrice: items[0].basePrice * 3
      },
      {
        item: items[1]._id,
        itemName: items[1].name,
        quantity: 120,
        unitPrice: items[1].basePrice,
        estimatedPrice: items[1].basePrice * 120
      }
    ],
    estimatedAmount: 80000,
    status: 'Submitted'
  });

  const sampleQuotation = await Quotation.create({
    request: sampleRequest._id,
    customer: customer._id,
    eventType: 'Wedding',
    eventDates: { start: new Date('2026-11-15'), end: new Date('2026-11-17') },
    items: [
      { itemName: items[0].name, quantity: 3, unitPrice: items[0].basePrice, subtotal: items[0].basePrice * 3 },
      { itemName: items[1].name, quantity: 120, unitPrice: items[1].basePrice, subtotal: items[1].basePrice * 120 }
    ],
    decorationServices: 3500,
    transportation: 2200,
    discount: 500,
    additionalCharges: 0,
    finalTotal: 76000,
    notes: 'Includes decor styling and setup support.',
    validityDate: new Date('2026-10-31'),
    status: 'Sent'
  });

  await Booking.create({
    bookingId: 'PJTHB-1001',
    customer: customer._id,
    request: sampleRequest._id,
    quotation: sampleQuotation._id,
    eventDates: { start: new Date('2026-11-15'), end: new Date('2026-11-17') },
    location: 'Jaipur',
    items: [{ itemName: items[0].name, quantity: 3 }, { itemName: items[1].name, quantity: 120 }],
    finalAmount: 76000,
    status: 'Confirmed'
  });

  console.log('Seed data inserted successfully');
  mongoose.connection.close();
};

seed();
