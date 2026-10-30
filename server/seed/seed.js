const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Category = require('../models/Category');
const Item = require('../models/Item');
const GalleryImage = require('../models/GalleryImage');
const Supplier = require('../models/Supplier');
const {
  SAFE_DATABASE_NAME,
  SeedSafetyError,
  assertSafeSeedTarget,
  assertConnectedSeedTarget
} = require('./seedSafety');

async function upsertDemoRecord(Model, filter, document) {
  return Model.findOneAndUpdate(
    filter,
    { $setOnInsert: document },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
  );
}

const categories = [
  { name: 'Tents', slug: 'tents', description: 'Event tents and canopies' },
  { name: 'Furniture', slug: 'furniture', description: 'Chairs, tables, sofas' },
  { name: 'Lighting', slug: 'lighting', description: 'Decorative lights and chandeliers' },
  { name: 'Decoration', slug: 'decoration', description: 'Mandaps and decor' },
  { name: 'Stage', slug: 'stage', description: 'Stage equipment and decor' },
  { name: 'Catering', slug: 'catering', description: 'Event dining essentials' },
  { name: 'Other', slug: 'other', description: 'Other support items' }
];

const demoItems = [
  {
    name: 'Royal Tent',
    category: 'Tents',
    description: 'Premium royal tent for weddings and big family events.',
    images: ['https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80'],
    basePrice: 15000,
    priceUnit: 'Per Day',
    ownStock: 8
  },
  {
    name: 'Banquet Chair',
    category: 'Furniture',
    description: 'Elegant banquet chair for dining and reception arrangements.',
    images: ['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80'],
    basePrice: 220,
    priceUnit: 'Per Piece',
    ownStock: 120
  },
  {
    name: 'Round Table',
    category: 'Furniture',
    description: 'Classic round table setup for banquets and family functions.',
    images: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80'],
    basePrice: 950,
    priceUnit: 'Per Piece',
    ownStock: 60
  },
  {
    name: 'Chandelier',
    category: 'Lighting',
    description: 'Statement chandelier lighting for elegant event ambience.',
    images: ['https://images.unsplash.com/photo-1519162584292-56dfc390fc75?auto=format&fit=crop&w=1200&q=80'],
    basePrice: 4500,
    priceUnit: 'Per Setup',
    ownStock: 12
  },
  {
    name: 'LED String Light',
    category: 'Lighting',
    description: 'Warm decorative string lights for open-air celebrations.',
    images: ['https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&w=1200&q=80'],
    basePrice: 320,
    priceUnit: 'Per Setup',
    ownStock: 40
  },
  {
    name: 'Stage Decoration',
    category: 'Stage',
    description: 'Premium stage draping and floral decoration settings.',
    images: ['https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80'],
    basePrice: 6000,
    priceUnit: 'Per Setup',
    ownStock: 10
  },
  {
    name: 'Sofa Set',
    category: 'Furniture',
    description: 'Luxury sofa seating for reception lounges and guest areas.',
    images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80'],
    basePrice: 1800,
    priceUnit: 'Per Unit',
    ownStock: 18
  }
];

const demoGalleryImages = [
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
];

const demoSuppliers = [
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
];

async function seed() {
  assertSafeSeedTarget();
  await connectDB();
  assertConnectedSeedTarget(mongoose);

  const categoryByName = new Map();
  for (const categoryData of categories) {
    const category = await upsertDemoRecord(
      Category,
      { slug: categoryData.slug },
      categoryData
    );
    if (category.name !== categoryData.name) {
      throw new SeedSafetyError('A category slug conflicts with the expected development demo category.');
    }
    categoryByName.set(categoryData.name, category._id);
  }

  for (const itemData of demoItems) {
    const categoryId = categoryByName.get(itemData.category);
    await upsertDemoRecord(
      Item,
      { name: itemData.name, category: categoryId },
      { ...itemData, category: categoryId, status: 'active' }
    );
  }

  for (const image of demoGalleryImages) {
    await upsertDemoRecord(
      GalleryImage,
      { title: image.title, imageUrl: image.imageUrl },
      image
    );
  }

  for (const supplier of demoSuppliers) {
    await upsertDemoRecord(Supplier, { email: supplier.email }, supplier);
  }

  console.log(`Development demo catalog seeded idempotently in ${SAFE_DATABASE_NAME}.`);
}

async function main() {
  let failed = false;
  try {
    await seed();
  } catch (error) {
    failed = true;
    if (error instanceof SeedSafetyError) {
      console.error(error.message);
    } else {
      console.error('Development seed failed; database error details were suppressed.');
    }
  } finally {
    try {
      await mongoose.disconnect();
    } catch {
      console.error('Could not close the MongoDB connection cleanly.');
      failed = true;
    }
  }

  if (failed) process.exitCode = 1;
}

main();
