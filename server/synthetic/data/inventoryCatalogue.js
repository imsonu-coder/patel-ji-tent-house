/**
 * Master inventory catalog template for 300 realistic tent-house rental items.
 * Categorized with authentic descriptions, INR pricing, price units, and initial owned stocks.
 */

const ITEM_BLUEPRINTS = {
  'tents': [
    { prefix: 'Royal Waterproof Shamiana Tent', priceRange: [12000, 35000], unit: 'Per Day', stockRange: [5, 20] },
    { prefix: 'German Aluminum Hangar Marquee', priceRange: [45000, 150000], unit: 'Per Setup', stockRange: [2, 8] },
    { prefix: 'Traditional Rajasthani Printed Mandap Canopy', priceRange: [18000, 40000], unit: 'Per Setup', stockRange: [4, 15] },
    { prefix: 'Waterproof Pagoda Gazebo Tent (10x10 ft)', priceRange: [3500, 8500], unit: 'Per Day', stockRange: [15, 45] },
    { prefix: 'Waterproof Pagoda Gazebo Tent (15x15 ft)', priceRange: [5500, 12000], unit: 'Per Day', stockRange: [10, 30] },
    { prefix: 'Sheer Silk Draped Canopy Tent', priceRange: [8000, 22000], unit: 'Per Day', stockRange: [6, 20] },
    { prefix: 'Heavy Duty Food Stall Canopy Tent', priceRange: [2500, 6000], unit: 'Per Day', stockRange: [20, 60] },
    { prefix: 'Arabian Style Luxury Bedouin Tent', priceRange: [28000, 65000], unit: 'Per Setup', stockRange: [3, 10] },
    { prefix: 'Dome Canopy with Center Pole', priceRange: [15000, 32000], unit: 'Per Day', stockRange: [5, 18] },
    { prefix: 'Side Wall Tarpaulin Curtain with Windows', priceRange: [800, 2200], unit: 'Per Piece', stockRange: [40, 120] }
  ],
  'furniture': [
    { prefix: 'Gold Chiavari Chair with Cushion', priceRange: [120, 280], unit: 'Per Piece', stockRange: [150, 600] },
    { prefix: 'White Resin Padded Folding Chair', priceRange: [60, 140], unit: 'Per Piece', stockRange: [200, 800] },
    { prefix: 'Banquet Cushioned Chair with Red/Gold Slipcover', priceRange: [80, 180], unit: 'Per Piece', stockRange: [300, 1200] },
    { prefix: 'Stainless Steel Banquet Chair (Deluxe)', priceRange: [50, 120], unit: 'Per Piece', stockRange: [250, 900] },
    { prefix: 'Round Banquet Dining Table (5ft / 8-Seater)', priceRange: [350, 750], unit: 'Per Piece', stockRange: [40, 150] },
    { prefix: 'Round Banquet Dining Table (6ft / 10-Seater)', priceRange: [500, 1100], unit: 'Per Piece', stockRange: [30, 100] },
    { prefix: 'Rectangular Buffet Folding Table (6x2.5 ft)', priceRange: [250, 600], unit: 'Per Piece', stockRange: [50, 180] },
    { prefix: 'Maharaja Royal Throne Sofa Set (2-Seater + 2 Chairs)', priceRange: [4500, 14000], unit: 'Per Setup', stockRange: [4, 15] },
    { prefix: 'Contemporary Chesterfield Velvet Lounge Sofa', priceRange: [3500, 9000], unit: 'Per Piece', stockRange: [8, 25] },
    { prefix: 'Traditional Baithak Low-Height Diwan with Bolsters', priceRange: [1200, 3200], unit: 'Per Setup', stockRange: [15, 40] },
    { prefix: 'Cocktail High-Top Bar Table with Lycra Cover', priceRange: [450, 950], unit: 'Per Piece', stockRange: [20, 60] },
    { prefix: 'LED Illuminated Bar Stool', priceRange: [350, 750], unit: 'Per Piece', stockRange: [25, 70] },
    { prefix: 'VIP Wooden Executive Chair with Armrest', priceRange: [300, 650], unit: 'Per Piece', stockRange: [30, 90] },
    { prefix: 'Classic Wooden Coffee Table', priceRange: [200, 500], unit: 'Per Piece', stockRange: [20, 50] }
  ],
  'lighting': [
    { prefix: 'Bohemian Crystal Chandelier (3-Tier)', priceRange: [2500, 7500], unit: 'Per Setup', stockRange: [8, 25] },
    { prefix: 'Vintage Brass Chandelier (5-Arm)', priceRange: [3500, 9500], unit: 'Per Setup', stockRange: [6, 20] },
    { prefix: 'LED RGB Par Can Uplight (54W)', priceRange: [180, 450], unit: 'Per Piece', stockRange: [60, 200] },
    { prefix: 'Outdoor Halogen Floodlight (500W/1000W)', priceRange: [250, 550], unit: 'Per Piece', stockRange: [40, 120] },
    { prefix: 'Warm White Fairy String Lights (100-meter Roll)', priceRange: [400, 1200], unit: 'Per Piece', stockRange: [30, 90] },
    { prefix: 'Moving Head Beam Spot Light (Sharpy 7R)', priceRange: [1800, 4500], unit: 'Per Piece', stockRange: [10, 35] },
    { prefix: 'Curtain Rice Light Backdrop (20x10 ft)', priceRange: [1200, 2800], unit: 'Per Setup', stockRange: [15, 45] },
    { prefix: 'Antique Edison Filament Bulb String (50ft)', priceRange: [650, 1500], unit: 'Per Piece', stockRange: [20, 60] },
    { prefix: 'Decorative Garden Floor Lanterns (Set of 4)', priceRange: [800, 2200], unit: 'Per Setup', stockRange: [15, 50] },
    { prefix: 'Laser Light Pattern Projector', priceRange: [1500, 4000], unit: 'Per Setup', stockRange: [6, 18] }
  ],
  'decoration': [
    { prefix: 'Royal Carved Pillar Wedding Mandap Setup', priceRange: [35000, 95000], unit: 'Per Setup', stockRange: [3, 8] },
    { prefix: 'Floral Entrance Archway with Fresh Artificial Marigolds', priceRange: [8500, 24000], unit: 'Per Setup', stockRange: [6, 18] },
    { prefix: 'Thematic Royal Rajwada Backdrop Wall (30x12 ft)', priceRange: [14000, 38000], unit: 'Per Setup', stockRange: [4, 12] },
    { prefix: 'Selfie Photo-Booth Ring with Foliage & Neon Sign', priceRange: [4500, 12500], unit: 'Per Setup', stockRange: [6, 20] },
    { prefix: 'Carved Wooden Welcome Gate with Kalash Motifs', priceRange: [6500, 16000], unit: 'Per Setup', stockRange: [5, 15] },
    { prefix: 'Red Carpet Aisle Runner (50x6 ft)', priceRange: [1200, 3000], unit: 'Per Piece', stockRange: [20, 60] },
    { prefix: 'Artificial Rose & Orchid Stage Backdrop (20x10 ft)', priceRange: [12000, 32000], unit: 'Per Setup', stockRange: [5, 14] },
    { prefix: 'Traditional Brass Urli Stand with Floating Tea Lights', priceRange: [450, 1200], unit: 'Per Piece', stockRange: [25, 75] },
    { prefix: 'Draped Fabric Ceiling Canopy (Multi-Color Rajasthani)', priceRange: [8000, 20000], unit: 'Per Setup', stockRange: [6, 18] },
    { prefix: 'Aisle Roman Pillars with Floral Urns (Set of 6)', priceRange: [3500, 9000], unit: 'Per Setup', stockRange: [8, 22] }
  ],
  'stage': [
    { prefix: 'Modular Wooden Stage Platform (8x4 ft, H: 2ft)', priceRange: [900, 2200], unit: 'Per Piece', stockRange: [30, 100] },
    { prefix: 'Heavy Aluminum Goal-Post Lighting Truss (20x15 ft)', priceRange: [8500, 22000], unit: 'Per Setup', stockRange: [4, 12] },
    { prefix: 'Acrylic Transparent Podium with Mic Stand', priceRange: [1200, 3000], unit: 'Per Piece', stockRange: [6, 20] },
    { prefix: 'Crowd Control Barricade Barrier (Steel, 8ft)', priceRange: [350, 750], unit: 'Per Piece', stockRange: [40, 120] },
    { prefix: 'Ramp Walk Stage Extension Platform (10x4 ft)', priceRange: [1400, 3200], unit: 'Per Piece', stockRange: [15, 45] },
    { prefix: 'Velvet Stage Skirting with Pleats (40ft Run)', priceRange: [800, 1800], unit: 'Per Piece', stockRange: [15, 50] },
    { prefix: 'Staircase Steps with Handrail for 3ft Stage', priceRange: [1200, 2800], unit: 'Per Piece', stockRange: [8, 25] }
  ],
  'catering': [
    { prefix: 'Deluxe Roll-Top Stainless Steel Chafing Dish (9L)', priceRange: [350, 750], unit: 'Per Piece', stockRange: [40, 150] },
    { prefix: 'Round Soup Tureen Chafing Dish with Ladle (5L)', priceRange: [250, 550], unit: 'Per Piece', stockRange: [25, 80] },
    { prefix: 'Beverage & Juice Dispenser (Twin Tank, 16L)', priceRange: [450, 1100], unit: 'Per Piece', stockRange: [15, 50] },
    { prefix: 'Commercial Live Dosa/Tawa Counter Station with Burner', priceRange: [1500, 3500], unit: 'Per Setup', stockRange: [10, 30] },
    { prefix: 'Commercial Electric Bain-Marie Food Warmer (4-Pot)', priceRange: [1200, 2800], unit: 'Per Piece', stockRange: [10, 35] },
    { prefix: 'Bone China Dinner Plates Set (Pack of 50)', priceRange: [600, 1400], unit: 'Per Unit', stockRange: [30, 100] },
    { prefix: 'Stainless Steel Cutlery Set (Spoons/Forks, 100 Pcs)', priceRange: [300, 700], unit: 'Per Unit', stockRange: [40, 120] },
    { prefix: 'Water Dispensing Insulated Camper (20L)', priceRange: [120, 280], unit: 'Per Piece', stockRange: [50, 180] }
  ],
  'sound-systems': [
    { prefix: 'Active JBL 15-inch Powered PA Speaker Pair (1000W)', priceRange: [3500, 8500], unit: 'Per Day', stockRange: [8, 24] },
    { prefix: 'Dual 18-inch Subwoofer Bass Cabinet (2000W)', priceRange: [4500, 11000], unit: 'Per Day', stockRange: [6, 18] },
    { prefix: '16-Channel Audio Mixing Console with Effects', priceRange: [2200, 5500], unit: 'Per Day', stockRange: [5, 15] },
    { prefix: 'Shure Cordless UHF Handheld Microphone Set (Pair)', priceRange: [850, 2000], unit: 'Per Day', stockRange: [12, 35] },
    { prefix: 'Collar / Lapel Wireless Clip-on Microphone Set', priceRange: [900, 2200], unit: 'Per Day', stockRange: [8, 25] },
    { prefix: 'Heavy Duty Heavy Speaker Tripod Stand Pair', priceRange: [250, 600], unit: 'Per Piece', stockRange: [20, 60] }
  ],
  'utilities': [
    { prefix: 'Silent Soundproof Diesel Generator (30 kVA)', priceRange: [4500, 11000], unit: 'Per Day', stockRange: [4, 12] },
    { prefix: 'Silent Soundproof Diesel Generator (62.5 kVA)', priceRange: [8500, 19000], unit: 'Per Day', stockRange: [3, 8] },
    { prefix: 'Industrial High-Velocity Pedestal Fan (30-inch)', priceRange: [350, 750], unit: 'Per Piece', stockRange: [35, 120] },
    { prefix: 'Outdoor Water Mist Cooler Fan with Tank (Heavy Duty)', priceRange: [850, 2200], unit: 'Per Piece', stockRange: [20, 70] },
    { prefix: 'Main Distribution Electrical Switchboard (100 Amp)', priceRange: [1200, 2800], unit: 'Per Setup', stockRange: [10, 30] },
    { prefix: 'Armored Power Cable Extension Bundle (3-Phase, 50m)', priceRange: [900, 2200], unit: 'Per Unit', stockRange: [15, 45] }
  ]
};

const VARIANT_MODIFIERS = [
  'Standard Grade', 'Premium Heritage', 'Royal Gold Finish', 'Imperial Series',
  'Commercial Heavy Duty', 'Classic White', 'Regal Velvet Edition', 'Contemporary Matte',
  'Export Quality', 'Festival Special'
];

/**
 * Builds 300 complete, categorized inventory items deterministically.
 */
function generate300InventoryItems(categoryMap, rng) {
  const items = [];
  const categories = Object.keys(ITEM_BLUEPRINTS);
  let itemCounter = 1;

  for (const catSlug of categories) {
    const categoryDoc = categoryMap[catSlug];
    if (!categoryDoc) continue;
    const blueprints = ITEM_BLUEPRINTS[catSlug];

    for (const bp of blueprints) {
      for (const modifier of VARIANT_MODIFIERS) {
        if (items.length >= 300) break;

        const basePrice = Math.round(
          bp.priceRange[0] + rng() * (bp.priceRange[1] - bp.priceRange[0])
        );
        const ownStock = Math.round(
          bp.stockRange[0] + rng() * (bp.stockRange[1] - bp.stockRange[0])
        );

        items.push({
          itemCode: `ITEM-SYN-${String(itemCounter).padStart(4, '0')}`,
          name: `${bp.prefix} - ${modifier}`,
          category: categoryDoc._id,
          categorySlug: catSlug,
          categoryName: categoryDoc.name,
          description: `Authentic ${bp.prefix.toLowerCase()} featuring ${modifier.toLowerCase()} finish for weddings, receptions, and corporate banquets across Rajasthan.`,
          images: [
            'https://images.unsplash.com/photo-1519162584292-56dfc390fc75?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80'
          ],
          basePrice,
          priceUnit: bp.unit,
          ownStock,
          inventoryVersion: 0,
          status: 'active'
        });
        itemCounter++;
      }
      if (items.length >= 300) break;
    }
    if (items.length >= 300) break;
  }

  return items.slice(0, 300);
}

module.exports = {
  ITEM_BLUEPRINTS,
  VARIANT_MODIFIERS,
  generate300InventoryItems
};

