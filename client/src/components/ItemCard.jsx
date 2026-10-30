import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Plus, Wrench } from 'lucide-react';
import ItemImage from './ItemImage';
import { getItemCategoryName } from '../utils/itemImages';
import { useAuth } from '../context/AuthContext';

export default function ItemCard({ item, onAdd }) {
  const { user } = useAuth();
  const [addFeedback, setAddFeedback] = useState(null);
  const categoryName = getItemCategoryName(item.category);
  const isAdmin = user?.role === 'admin';

  const handleAdd = () => {
    const added = onAdd?.(item);
    setAddFeedback({
      success: Boolean(added),
      message: added
        ? `${item.name} added to My Event. Open Build Your Event to review it.`
        : 'This item could not be added. Please try again.',
    });
  };

  return (
    <div className="group overflow-hidden rounded-3xl border border-[#E7CC91] bg-[#FFFDF9] shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative overflow-hidden bg-[#F7EBDD]">
        <ItemImage
          item={item}
          alt={`${item.name} for rent`}
          className="h-56 w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#321016]/30 via-transparent to-transparent" />
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-full bg-[#F7EBDD] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6B1E2B]">
            {categoryName}
          </span>
          <span className="font-semibold text-[#6B1E2B]">
            Starting ₹{item.basePrice}
          </span>
        </div>

        <div>
          <h3 className="font-[Playfair_Display] text-2xl text-[#45121C]">
            {item.name}
          </h3>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#806C66]">
            {item.description}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[#F0D7AF] pt-4">
          <Link
            to={`/items/${item._id}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#6B1E2B] transition hover:text-[#B76A32]"
          >
            View Details <ArrowRight size={16} />
          </Link>

          {isAdmin ? (
            <Link
              to="/admin"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-[#D7B46B] bg-[#FFF8ED] px-3.5 py-2 text-xs font-semibold text-[#6B1E2B] transition hover:bg-[#F7EBDD]"
            >
              <Wrench size={13} aria-hidden="true" />
              Stock: {item.ownStock ?? 0} · Manage
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleAdd}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#6B1E2B] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#45121C]"
            >
              {addFeedback?.success ? <Check size={16} /> : <Plus size={16} />}
              {addFeedback?.success ? 'Added' : 'Add to Event'}
            </button>
          )}
        </div>
        {addFeedback && !isAdmin && (
          <p
            role={addFeedback.success ? 'status' : 'alert'}
            aria-live={addFeedback.success ? 'polite' : 'assertive'}
            className="text-sm text-[#6B1E2B]"
          >
            {addFeedback.message}
          </p>
        )}
      </div>
    </div>
  );
}
