const fallbackImages = {
  mandap:
    'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80',
  shamiana:
    'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
  hangar:
    'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80',
  throne:
    'https://images.unsplash.com/photo-1607190074257-dd4b7af0309f?auto=format&fit=crop&w=1200&q=80',
  baithak:
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80',
  chair:
    'https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=1200&q=80',
  banquet_chair:
    'https://images.unsplash.com/photo-1567016432779-094069958ea5?auto=format&fit=crop&w=1200&q=80',
  sofa:
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80',
  dining_table:
    'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80',
  buffet_table:
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
  chandelier:
    'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=1200&q=80',
  brass_lighting:
    'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=1200&q=80',
  fairy_lights:
    'https://images.unsplash.com/photo-1569317002804-ab77bcf1bce4?auto=format&fit=crop&w=1200&q=80',
  uplight:
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
  moving_beam:
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80',
  tent:
    'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=1200&q=80'
};

const localFallback = '/item-fallback.svg';

function getCategoryName(category) {
  return typeof category === 'object' ? category?.name || '' : category || '';
}

function getCategoryFallback(item) {
  const name = item?.name?.toLowerCase() || '';
  const category = getCategoryName(item?.category).toLowerCase();
  const text = `${name} ${category}`;

  if (text.includes('mandap')) return fallbackImages.mandap;
  if (text.includes('shamiana')) return fallbackImages.shamiana;
  if (text.includes('hangar') || text.includes('marquee')) return fallbackImages.hangar;
  if (text.includes('throne') || text.includes('maharaja')) return fallbackImages.throne;
  if (text.includes('baithak') || text.includes('diwan')) return fallbackImages.baithak;
  if (text.includes('chiavari')) return fallbackImages.chair;
  if (text.includes('chair') || text.includes('seat')) return fallbackImages.banquet_chair;
  if (text.includes('sofa') || text.includes('lounge')) return fallbackImages.sofa;
  if (text.includes('buffet')) return fallbackImages.buffet_table;
  if (text.includes('table')) return fallbackImages.dining_table;
  if (text.includes('crystal') || (text.includes('chandelier') && !text.includes('brass'))) return fallbackImages.chandelier;
  if (text.includes('brass') || text.includes('diya')) return fallbackImages.brass_lighting;
  if (text.includes('fairy') || text.includes('string')) return fallbackImages.fairy_lights;
  if (text.includes('beam') || text.includes('sharpy')) return fallbackImages.moving_beam;
  if (text.includes('uplight') || text.includes('par can')) return fallbackImages.uplight;
  return fallbackImages.tent;
}

export function getItemImageSources(item) {
  const itemImage = Array.isArray(item?.images)
    ? item.images.find(
        (image) => typeof image === 'string' && image.trim()
      )
    : null;

  return [...new Set([itemImage, getCategoryFallback(item), localFallback].filter(Boolean))];
}

export function getItemCategoryName(category) {
  return getCategoryName(category);
}
