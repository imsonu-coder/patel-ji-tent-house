require('dotenv').config({
  path: require('path').resolve(__dirname, '../.env')
});

const connectDB = require('../config/db');
const GalleryImage = require('../models/GalleryImage');

const galleryItems = [
  {
    title: 'Royal Rajputana Wedding Mandap',
    category: 'Weddings',
    description: 'Traditional Jaipuri royal wedding mandap with hand-tied fresh marigold chains, red silk drapery, and carved wooden pillars.',
    imageUrl: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80'
  },
  {
    title: 'Sacred Vedic Phere & Havan Altar',
    category: 'Weddings',
    description: 'Vedic ceremonial havan kund and sacred holy fire arrangement surrounded by rose petals and royal low seating.',
    imageUrl: 'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=1200&q=80'
  },
  {
    title: 'Royal Palace Courtyard Wedding',
    category: 'Weddings',
    description: 'Grand heritage palace courtyard setup illuminated for evening wedding celebrations in Jaipur with royal lighting.',
    imageUrl: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=1200&q=80'
  },
  {
    title: 'Varmala Stage & Floral Chandelier',
    category: 'Weddings',
    description: 'Grand wedding stage featuring cascading floral chandeliers and red velvet backdrop for the royal varmala ceremony.',
    imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80'
  },
  {
    title: 'Traditional Jaipuri Printed Shamiana',
    category: 'Tents',
    description: 'Classic Rajasthani block-printed waterproof shamiana tent with scalloped valance borders for grand wedding feasts.',
    imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80'
  },
  {
    title: 'German Aluminum Hangar AC Pavilion',
    category: 'Tents',
    description: 'Climate-controlled luxury German hangar marquee accommodating over 1,000 guests with elegant ivory roof lining.',
    imageUrl: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80'
  },
  {
    title: 'Desert Oasis Royal Bedouin Tent',
    category: 'Tents',
    description: 'Authentic Arabian-Rajasthani Bedouin tent featuring ambient lantern illumination and low-height carpeted baithak.',
    imageUrl: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80'
  },
  {
    title: 'Silk Draped Haldi & Mehndi Canopy',
    category: 'Tents',
    description: 'Vibrant yellow, pink, and orange sheer silk draped canopy for cheerful daytime Haldi & Mehndi celebrations.',
    imageUrl: 'https://images.unsplash.com/photo-1587271407850-8d438ca9fdf2?auto=format&fit=crop&w=1200&q=80'
  },
  {
    title: 'Genda Phool & Marigold Backdrop',
    category: 'Decoration',
    description: 'Lush, traditional Indian marigold and genda phool floral backdrop with brass urli and floating diya lamps.',
    imageUrl: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?auto=format&fit=crop&w=1200&q=80'
  },
  {
    title: 'Grand Floral Toran Entrance Gateway',
    category: 'Decoration',
    description: 'Festive entrance toran arch decorated with natural tuberose, marigolds, and warm fairy lights welcoming the baraat.',
    imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=80'
  },
  {
    title: 'Traditional Shehnai & Nagada Pavilion',
    category: 'Decoration',
    description: 'Acoustic musician stage setup for traditional folk shehnai and dholak artists at the palace entrance.',
    imageUrl: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1200&q=80'
  },
  {
    title: 'Heritage Brass Urli & Diya Walkway',
    category: 'Decoration',
    description: 'Aisle lighting featuring carved brass samai lamps, traditional diyas, and floating flower petals.',
    imageUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=1200&q=80'
  },
  {
    title: 'Starry Night Fairy Light Roof Canopy',
    category: 'Lighting',
    description: 'Over 100 meters of warm white fairy string lights woven into an enchanting night sky ceiling canopy.',
    imageUrl: 'https://images.unsplash.com/photo-1569317002804-ab77bcf1bce4?auto=format&fit=crop&w=1200&q=80'
  },
  {
    title: 'Sangeet Moving Head Beam & Truss Show',
    category: 'Lighting',
    description: 'Sharpy 7R high-intensity beam fixtures and dynamic RGB par cans synchronised for high-energy Sangeet performances.',
    imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80'
  },
  {
    title: 'Imperial Maharaja Gold Throne Suite',
    category: 'Furniture',
    description: 'Ornate hand-carved gold leaf throne chairs with rich crimson velvet upholstery for bride and groom.',
    imageUrl: 'https://images.unsplash.com/photo-1607190074257-dd4b7af0309f?auto=format&fit=crop&w=1200&q=80'
  },
  {
    title: 'Traditional Rajasthani Baithak Seating',
    category: 'Furniture',
    description: 'Low-height diwans with cylindrical gola takiyas, block-print cotton mattresses, and brass tables.',
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80'
  }
];

async function main() {
  try {
    await connectDB();

    let added = 0;
    let updated = 0;

    for (const item of galleryItems) {
      const res = await GalleryImage.findOneAndUpdate(
        { title: item.title },
        { $set: item },
        { upsert: true, new: true }
      );
      if (res) added++;
    }

    console.log(`Gallery seeding complete: ${added} items processed.`);
    process.exit(0);
  } catch (error) {
    console.error('Error adding demo gallery:', error);
    process.exit(1);
  }
}

main();
