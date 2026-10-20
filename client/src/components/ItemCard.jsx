
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Plus } from 'lucide-react';

const fallbackImages = {
  'Royal Tent':
    'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=900&q=80',
  'Banquet Chair':
    'https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=900&q=80',
  'Round Table':
    'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=900&q=80',
  Chandelier:
    'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=900&q=80',
  'LED String Light':
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=900&q=80',
};

const defaultImage =
  'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=900&q=80';

export default function ItemCard({ item, onAdd }) {
  const [imageFailed, setImageFailed] = useState(false);

  const imageUrl =
    !imageFailed && item.images?.[0]
      ? item.images[0]
      : fallbackImages[item.name] || defaultImage;

  return (
    <div className="overflow-hidden rounded-2xl border border-[#F1DCC2] bg-white shadow-soft">
      <img
        src={imageUrl}
        alt={item.name}
        loading="lazy"
        onError={() => {
          if (!imageFailed) setImageFailed(true);
        }}
        className="h-52 w-full object-cover"
      />

      <div className="space-y-4 p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-full bg-[#F7EBDD] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6B1E2B]">
            {item.category?.name || item.category}
          </span>
          <span className="text-sm font-semibold text-[#6B1E2B]">
            ₹{item.basePrice}
          </span>
        </div>

        <div>
          <h3 className="font-[Playfair_Display] text-2xl text-[#33201D]">
            {item.name}
          </h3>
          <p className="mt-2 text-sm text-[#806C66]">
            {item.description}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <Link
            to={`/items/${item._id}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#6B1E2B]"
          >
            View Details <ArrowRight size={16} />
          </Link>

          <button
            onClick={() => onAdd(item)}
            className="inline-flex items-center gap-2 rounded-full bg-[#6B1E2B] px-4 py-2 text-sm text-white"
          >
            <Plus size={16} /> Add to Event
          </button>
        </div>
      </div>
    </div>
  );
}
