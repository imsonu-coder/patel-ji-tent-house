
require('dotenv').config({
  path: require('path').resolve(__dirname, '../.env')
});

const connectDB = require('../config/db');
const GalleryImage = require('../models/GalleryImage');

const galleryItems = [
  {
    title: 'Royal Wedding Celebration',
    category: 'Weddings',
    description: 'A beautiful wedding celebration setup.',
    imageUrl: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80'
  },
  {
    title: 'Traditional Wedding Tent',
    category: 'Tents',
    description: 'Elegant tent arrangements for special events.',
    imageUrl: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80'
  },
  {
    title: 'Floral Stage Decoration',
    category: 'Decoration',
    description: 'Decorative floral arrangements for celebrations.',
    imageUrl: 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?auto=format&fit=crop&w=1200&q=80'
  },
  {
    title: 'Evening Event Lighting',
    category: 'Lighting',
    description: 'Lighting ideas for evening functions.',
    imageUrl: 'https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=1200&q=80'
  },
  {
    title: 'Wedding Reception Setup',
    category: 'Furniture',
    description: 'A stylish reception arrangement.',
    imageUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80'
  },
  {
    title: 'Festive Event Ambience',
    category: 'Other',
    description: 'An atmospheric setup for a memorable event.',
    imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80'
  }
];

async function main() {
  try {
    await connectDB();

    let added = 0;
    let skipped = 0;

    for (const item of galleryItems) {
      const existing = await GalleryImage.findOne({
        title: item.title
      });

      if (existing) {
        skipped++;
        continue;
      }

      await GalleryImage.create({
        ...item,
        status: 'active'
      });

      added++;
    }

    console.log(
      `Gallery setup complete. Added: ${added}; skipped existing: ${skipped}.`
    );
  } catch (error) {
    console.error('Gallery setup failed:', error.message);
    process.exitCode = 1;
  } finally {
    const mongoose = require('mongoose');
    await mongoose.disconnect();
  }
}

main();
