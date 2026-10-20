require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Category = require('../models/Category');
const Item = require('../models/Item');

const categories = [
  {
    name: 'Tents & Canopies',
    slug: 'tents-canopies',
    description: 'Tents and canopies for events'
  },
  {
    name: 'Furniture',
    slug: 'furniture',
    description: 'Chairs, tables and sofas'
  },
  {
    name: 'Lighting & Decoration',
    slug: 'lighting-decoration',
    description: 'Event lighting and decoration'
  }
];

const demoItems = [
  {
    name: 'Royal Tent',
    category: 'Tents & Canopies',
    description: 'Decorative tent for weddings and events.',
    basePrice: 15000,
    priceUnit: 'Per Day',
    ownStock: 2
  },
  {
    name: 'Banquet Chair',
    category: 'Furniture',
    description: 'Banquet chairs for guests and functions.',
    basePrice: 220,
    priceUnit: 'Per Piece',
    ownStock: 200
  },
  {
    name: 'Round Table',
    category: 'Furniture',
    description: 'Round tables for weddings and parties.',
    basePrice: 950,
    priceUnit: 'Per Piece',
    ownStock: 30
  },
  {
    name: 'Chandelier',
    category: 'Lighting & Decoration',
    description: 'Decorative chandelier for event venues.',
    basePrice: 4500,
    priceUnit: 'Per Setup',
    ownStock: 5
  },
  {
    name: 'LED String Light',
    category: 'Lighting & Decoration',
    description: 'LED string lighting for event decoration.',
    basePrice: 320,
    priceUnit: 'Per Unit',
    ownStock: 50
  }
];

async function addDemoItems() {
  try {
    await connectDB();

    const categoryIds = {};

    for (const categoryData of categories) {
      const category = await Category.findOneAndUpdate(
        { slug: categoryData.slug },
        { $setOnInsert: categoryData },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      categoryIds[categoryData.name] = category._id;
    }

    let added = 0;
    let skipped = 0;

    for (const itemData of demoItems) {
      const existing = await Item.findOne({ name: itemData.name });

      if (existing) {
        skipped++;
        continue;
      }

      await Item.create({
        ...itemData,
        category: categoryIds[itemData.category],
        status: 'active',
        images: []
      });

      added++;
    }

    console.log(`Demo inventory complete. Added: ${added}; skipped existing: ${skipped}.`);
  } catch (error) {
    console.error('Could not add demo inventory:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

addDemoItems();
