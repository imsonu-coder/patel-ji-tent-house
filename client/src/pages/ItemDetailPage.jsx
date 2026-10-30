import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check, LayoutDashboard, Minus, Plus, ShieldCheck } from 'lucide-react';
import api from '../api/client';
import ItemImage from '../components/ItemImage';
import { useEvent } from '../context/EventContext';
import { useAuth } from '../context/AuthContext';

export default function ItemDetailPage() {
  const { id } = useParams();
  const { addItem } = useEvent();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [addFeedback, setAddFeedback] = useState(null);

  useEffect(() => {
    const fetchItem = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get(`/items/${id}`);
        setItem(data);
      } catch (error) {
        console.error(error);
        setError('This item could not be loaded. Please return to the catalogue and try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  if (loading) return <div role="status" className="py-16 text-center text-[#604d47]">Loading item...</div>;
  if (error || !item) return <div role="alert" className="py-16 text-center text-[#702721]">{error || 'Item not found.'}</div>;

  const handleAdd = () => {
    const added = addItem(item, quantity);
    setAddFeedback({
      success: Boolean(added),
      message: added
        ? `${quantity} unit(s) of ${item.name} added to My Event. Open Build Your Event to review your selections.`
        : 'This item could not be added. Please try again.'
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <Link to="/items" className="text-sm font-semibold text-[#6B1E2B]">← Back to catalogue</Link>
      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <div>
          <ItemImage
            item={item}
            alt={`${item.name} for rent`}
            className="h-[420px] w-full rounded-2xl bg-[#F7EBDD] object-cover shadow-soft"
          />
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.22em] text-[#6B1E2B]">{item.category?.name || item.category}</div>
          <h1 className="mt-3 font-[Playfair_Display] text-4xl text-[#33201D]">{item.name}</h1>
          <p className="mt-4 text-[#806C66]">{item.description}</p>
          <div className="mt-6 rounded-2xl bg-[#F7EBDD] p-5">
            <div className="text-sm text-[#806C66]">Starting/base price</div>
            <div className="mt-2 text-3xl font-bold text-[#6B1E2B]">₹{item.basePrice}</div>
            <div className="mt-1 text-sm text-[#806C66]">{item.priceUnit}</div>
          </div>

          {isAdmin ? (
            /* ADMIN INVENTORY MANAGEMENT PANEL */
            <div className="mt-6 rounded-2xl border border-[#D7B46B] bg-[#FFF8ED] p-5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#6B1E2B]">
                <ShieldCheck size={16} aria-hidden="true" />
                Administrator Stock Control
              </div>
              <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-xs text-[#806C66]">Owned Stock</span>
                  <div className="text-xl font-bold text-[#45121C]">{item.ownStock ?? 0} units</div>
                </div>
                <div>
                  <span className="text-xs text-[#806C66]">Catalogue Status</span>
                  <div className="text-xl font-bold capitalize text-[#28583C]">{item.status || 'active'}</div>
                </div>
              </div>
              <Link
                to="/admin"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#6B1E2B] px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-[#45121C]"
              >
                <LayoutDashboard size={16} aria-hidden="true" />
                Manage In Admin Dashboard
              </Link>
            </div>
          ) : (
            /* CUSTOMER QUANTITY SELECTOR & ADD TO EVENT */
            <div className="mt-6 flex items-center gap-4">
              <div className="flex items-center rounded-full border border-[#E7CC91]">
                <button type="button" aria-label="Decrease quantity" onClick={() => setQuantity((current) => Math.max(1, current - 1))} className="p-3 text-[#6B1E2B]">
                  <Minus size={18} />
                </button>
                <div className="min-w-12 text-center font-semibold">{quantity}</div>
                <button type="button" aria-label="Increase quantity" onClick={() => setQuantity((current) => current + 1)} className="p-3 text-[#6B1E2B]">
                  <Plus size={18} />
                </button>
              </div>
              <button type="button" onClick={handleAdd} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#6B1E2B] px-5 py-3 font-semibold text-white">
                {addFeedback?.success && <Check size={17} aria-hidden="true" />}
                {addFeedback?.success ? 'Added' : 'Add to Event'}
              </button>
            </div>
          )}

          {addFeedback && !isAdmin && (
            <p
              role={addFeedback.success ? 'status' : 'alert'}
              aria-live={addFeedback.success ? 'polite' : 'assertive'}
              className="mt-3 text-sm text-[#6B1E2B]"
            >
              {addFeedback.message}
            </p>
          )}

          <p className="mt-6 text-sm text-[#806C66]">
            Price shown is indicative. Final quotation may vary depending on event requirements, duration, location and arrangements.
          </p>
        </div>
      </div>
    </div>
  );
}
