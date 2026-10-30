const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const { assertConnectedSeedTarget } = require('./seedSafety');

const INDIAN_WEDDING_PHOTOS = {
  // Mandap & Royal Canopies
  mandap: [
    'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=1200&q=80'
  ],
  shamiana: [
    'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=1200&q=80'
  ],
  hangar: [
    'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80'
  ],
  gazebo: [
    'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80'
  ],
  silk_canopy: [
    'https://images.unsplash.com/photo-1587271407850-8d438ca9fdf2?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1591604466107-ec97de577aff?auto=format&fit=crop&w=1200&q=80'
  ],
  bedouin: [
    'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80'
  ],
  food_stall: [
    'https://images.unsplash.com/photo-1595475207225-428b62bda831?auto=format&fit=crop&w=1200&q=80'
  ],
  royal_tent_generic: [
    'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80'
  ],

  // Furniture & Seating
  throne: [
    'https://images.unsplash.com/photo-1607190074257-dd4b7af0309f?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80'
  ],
  baithak: [
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1591604466107-ec97de577aff?auto=format&fit=crop&w=1200&q=80'
  ],
  chiavari: [
    'https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=1200&q=80'
  ],
  banquet_chair: [
    'https://images.unsplash.com/photo-1567016432779-094069958ea5?auto=format&fit=crop&w=1200&q=80'
  ],
  sofa: [
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80'
  ],
  dining_table: [
    'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80'
  ],
  buffet_table: [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80'
  ],
  bar_table: [
    'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80'
  ],
  coffee_table: [
    'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=1200&q=80'
  ],

  // Lighting & Special FX
  crystal_chandelier: [
    'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=1200&q=80'
  ],
  brass_lighting: [
    'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=1200&q=80'
  ],
  fairy_lights: [
    'https://images.unsplash.com/photo-1569317002804-ab77bcf1bce4?auto=format&fit=crop&w=1200&q=80'
  ],
  par_uplight: [
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80'
  ],
  moving_beam: [
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80'
  ],
  floodlight: [
    'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1200&q=80'
  ]
};

function resolveItemImages(itemName, categoryName = '') {
  const text = `${itemName} ${categoryName}`.toLowerCase();

  // Mandap
  if (text.includes('mandap')) return INDIAN_WEDDING_PHOTOS.mandap;
  // Shamiana
  if (text.includes('shamiana')) return INDIAN_WEDDING_PHOTOS.shamiana;
  // Hangar / Marquee
  if (text.includes('hangar') || text.includes('marquee')) return INDIAN_WEDDING_PHOTOS.hangar;
  // Gazebo / Pagoda
  if (text.includes('pagoda') || text.includes('gazebo')) return INDIAN_WEDDING_PHOTOS.gazebo;
  // Silk / Sheer / Draped
  if (text.includes('sheer') || text.includes('silk') || text.includes('draped')) return INDIAN_WEDDING_PHOTOS.silk_canopy;
  // Bedouin / Arabian
  if (text.includes('bedouin') || text.includes('arabian')) return INDIAN_WEDDING_PHOTOS.bedouin;
  // Food stall
  if (text.includes('food stall') || text.includes('buffet folding')) return INDIAN_WEDDING_PHOTOS.food_stall;
  // Throne / Maharaja
  if (text.includes('throne') || text.includes('maharaja')) return INDIAN_WEDDING_PHOTOS.throne;
  // Baithak / Diwan
  if (text.includes('baithak') || text.includes('diwan')) return INDIAN_WEDDING_PHOTOS.baithak;
  // Chiavari
  if (text.includes('chiavari')) return INDIAN_WEDDING_PHOTOS.chiavari;
  // Chairs
  if (text.includes('chair') || text.includes('seat')) return INDIAN_WEDDING_PHOTOS.banquet_chair;
  // Sofa
  if (text.includes('sofa') || text.includes('lounge')) return INDIAN_WEDDING_PHOTOS.sofa;
  // Round table / Dining
  if (text.includes('dining table') || text.includes('round table') || text.includes('8-seater') || text.includes('10-seater')) return INDIAN_WEDDING_PHOTOS.dining_table;
  // Buffet table
  if (text.includes('buffet')) return INDIAN_WEDDING_PHOTOS.buffet_table;
  // Bar / Cocktail / Stool
  if (text.includes('bar table') || text.includes('cocktail') || text.includes('bar stool')) return INDIAN_WEDDING_PHOTOS.bar_table;
  // Coffee table
  if (text.includes('coffee table')) return INDIAN_WEDDING_PHOTOS.coffee_table;
  // Crystal Chandelier
  if (text.includes('crystal') || (text.includes('chandelier') && !text.includes('brass'))) return INDIAN_WEDDING_PHOTOS.crystal_chandelier;
  // Brass Chandelier / Lantern
  if (text.includes('brass') || text.includes('diya')) return INDIAN_WEDDING_PHOTOS.brass_lighting;
  // Fairy string light
  if (text.includes('fairy') || text.includes('led string') || text.includes('string light')) return INDIAN_WEDDING_PHOTOS.fairy_lights;
  // Moving head / Beam / Sharpy
  if (text.includes('beam') || text.includes('sharpy') || text.includes('moving head')) return INDIAN_WEDDING_PHOTOS.moving_beam;
  // Par Can Uplight
  if (text.includes('par can') || text.includes('uplight') || text.includes('rgb')) return INDIAN_WEDDING_PHOTOS.par_uplight;
  // Floodlight
  if (text.includes('floodlight') || text.includes('halogen')) return INDIAN_WEDDING_PHOTOS.floodlight;
  // Generic Tents
  if (text.includes('tent') || text.includes('canopy')) return INDIAN_WEDDING_PHOTOS.royal_tent_generic;
  // Generic Table
  if (text.includes('table')) return INDIAN_WEDDING_PHOTOS.dining_table;
  // Generic Lighting
  if (text.includes('light')) return INDIAN_WEDDING_PHOTOS.fairy_lights;

  return INDIAN_WEDDING_PHOTOS.royal_tent_generic;
}

const GALLERY_PORTFOLIO = [
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

async function updateAllMedia() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(process.env.MONGODB_URI);
  if (mongoose.connection.name !== 'patel_tent_house') {
    throw new Error('Safety guard: must connect to patel_tent_house');
  }

  const Item = require('../models/Item');
  const Category = require('../models/Category');
  const GalleryImage = require('../models/GalleryImage');

  // 1. Update Items
  console.log('Fetching items...');
  const items = await Item.find().populate('category', 'name');
  console.log(`Updating ${items.length} items with authentic Indian wedding photography...`);

  let updatedItems = 0;
  for (const item of items) {
    const categoryName = item.category?.name || '';
    const images = resolveItemImages(item.name, categoryName);
    item.images = images;
    await item.save();
    updatedItems++;
  }
  console.log(`Successfully updated ${updatedItems} items!`);

  // 2. Update Gallery
  console.log('Seeding / updating gallery items...');
  let galleryUpdated = 0;
  for (const entry of GALLERY_PORTFOLIO) {
    await GalleryImage.findOneAndUpdate(
      { title: entry.title },
      { $set: { ...entry, status: 'active' } },
      { upsert: true, new: true }
    );
    galleryUpdated++;
  }
  console.log(`Successfully upserted ${galleryUpdated} gallery portfolio items!`);

  await mongoose.disconnect();
  console.log('All updates completed successfully.');
}

updateAllMedia().catch((err) => {
  console.error('Update failed:', err);
  process.exit(1);
});
