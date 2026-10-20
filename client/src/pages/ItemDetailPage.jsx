import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Minus, Plus } from 'lucide-react';
import api from '../api/client';
import { useEvent } from '../context/EventContext';

export default function ItemDetailPage() {
  const { id } = useParams();
  const { addItem } = useEvent();
  const [item, setItem] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const { data } = await api.get(`/items/${id}`);
        setItem(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchItem();
  }, [id]);

  if (!item) return <div className="py-16 text-center text-[#806C66]">Loading item...</div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <img src={item.images?.[0]} alt={item.name} className="h-[420px] w-full rounded-2xl object-cover shadow-soft" />
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
          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center rounded-full border border-[#E7CC91]">
              <button onClick={() => setQuantity((current) => Math.max(1, current - 1))} className="p-3 text-[#6B1E2B]">
                <Minus size={18} />
              </button>
              <div className="min-w-12 text-center font-semibold">{quantity}</div>
              <button onClick={() => setQuantity((current) => current + 1)} className="p-3 text-[#6B1E2B]">
                <Plus size={18} />
              </button>
            </div>
            <button onClick={() => addItem({ ...item, quantity })} className="rounded-full bg-[#6B1E2B] px-5 py-3 font-semibold text-white">
              Add to Event
            </button>
          </div>
          <p className="mt-6 text-sm text-[#806C66]">
            Price shown is indicative. Final quotation may vary depending on event requirements, duration, location and arrangements.
          </p>
        </div>
      </div>
    </div>
  );
}
