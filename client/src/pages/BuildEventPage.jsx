import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Minus, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import api from '../api/client';
import { industryNotice } from '../data/siteData';
import { useAuth } from '../context/AuthContext';
import { useEvent } from '../context/EventContext';

const eventTypes = ['Wedding', 'Engagement', 'Birthday', 'Reception', 'Corporate', 'Religious', 'Other'];
const steps = ['Event Details', 'Choose Items', 'Review', 'Submit'];

export default function BuildEventPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { eventData, setEventData, selectedItems, updateQuantity, removeItem, clearCart, estimatedTotal, addItem } = useEvent();
  const [currentStep, setCurrentStep] = useState(1);
  const [items, setItems] = useState([]);
  const [itemCategory, setItemCategory] = useState('Tents');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/items');
        setItems(data.filter((item) => item.category?.name === itemCategory || item.category === itemCategory));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [itemCategory]);

  const nextStep = () => setCurrentStep((value) => Math.min(value + 1, steps.length));
  const prevStep = () => setCurrentStep((value) => Math.max(value - 1, 1));

  const handleSubmit = async () => {
    try {
      const payload = {
        eventType: eventData.eventType,
        startDate: eventData.startDate,
        endDate: eventData.endDate,
        location: eventData.location,
        guestCount: Number(eventData.guestCount),
        description: eventData.description,
        additionalRequirements: eventData.additionalRequirements,
        items: selectedItems.map((entry) => ({ itemId: entry.itemId, quantity: entry.quantity }))
      };

      const { data } = await api.post('/requests', payload);
      clearCart();
      navigate('/request-success', { state: { request: data } });
    } catch (error) {
      alert(error.response?.data?.message || 'Your requirement could not be submitted.');
    }
  };

  if (user?.role === 'admin') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <div className="rounded-3xl border border-[#D7B46B] bg-[#FFF8ED] p-8 shadow-soft">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#6B1E2B]/10 text-[#6B1E2B]">
            <ShieldCheck size={28} aria-hidden="true" />
          </div>
          <h1 className="mt-4 font-[Playfair_Display] text-3xl font-bold text-[#45121C]">
            Admin Operations Center
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#755D53]">
            The <strong>Event Builder</strong> is a customer inquiry wizard. As an administrator, you manage event inquiries, create quotations, and verify bookings inside the Admin Dashboard.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/admin"
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#6B1E2B] px-6 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-[#45121C]"
            >
              <LayoutDashboard size={16} aria-hidden="true" />
              Open Admin Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const renderStep = () => {
    if (currentStep === 1) {
      return (
        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#33201D]">Event Type</label>
            <select value={eventData.eventType || ''} onChange={(e) => setEventData({ ...eventData, eventType: e.target.value })} className="w-full rounded-xl border border-[#E7CC91] bg-white p-3 outline-none">
              <option value="">Select event type</option>
              {eventTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#33201D]">Start Date</label>
              <input type="date" value={eventData.startDate || ''} onChange={(e) => setEventData({ ...eventData, startDate: e.target.value })} className="w-full rounded-xl border border-[#E7CC91] bg-white p-3 outline-none" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-[#33201D]">End Date</label>
              <input type="date" value={eventData.endDate || ''} onChange={(e) => setEventData({ ...eventData, endDate: e.target.value })} className="w-full rounded-xl border border-[#E7CC91] bg-white p-3 outline-none" />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#33201D]">Event Location</label>
            <input value={eventData.location || ''} onChange={(e) => setEventData({ ...eventData, location: e.target.value })} placeholder="Jaipur, Rajasthan" className="w-full rounded-xl border border-[#E7CC91] bg-white p-3 outline-none" />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#33201D]">Number of Guests</label>
            <input type="number" min="1" value={eventData.guestCount || ''} onChange={(e) => setEventData({ ...eventData, guestCount: e.target.value })} className="w-full rounded-xl border border-[#E7CC91] bg-white p-3 outline-none" />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#33201D]">Optional Event Description</label>
            <textarea value={eventData.description || ''} onChange={(e) => setEventData({ ...eventData, description: e.target.value })} rows="4" className="w-full rounded-xl border border-[#E7CC91] bg-white p-3 outline-none" />
          </div>
        </div>
      );
    }

    if (currentStep === 2) {
      return (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="mb-4 flex flex-wrap gap-2">
              {['Tents', 'Furniture', 'Lighting', 'Decoration', 'Stage', 'Catering', 'Other'].map((category) => (
                <button key={category} onClick={() => setItemCategory(category)} className={`rounded-full px-4 py-2 text-sm font-medium ${itemCategory === category ? 'bg-[#6B1E2B] text-white' : 'bg-[#F7EBDD] text-[#33201D]'}`}>
                  {category}
                </button>
              ))}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {loading ? <div>Loading items...</div> : items.map((item) => (
                <div key={item._id} className="rounded-2xl border border-[#F0D7AF] bg-white p-3">
                  <img src={item.images?.[0]} alt={item.name} className="h-28 w-full rounded-xl object-cover" />
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold text-[#33201D]">{item.name}</div>
                      <div className="text-sm text-[#806C66]">₹{item.basePrice}</div>
                    </div>
                    <button onClick={() => addItem(item)} className="rounded-full bg-[#6B1E2B] px-3 py-2 text-sm text-white">Add</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-2xl border border-[#F0D7AF] bg-[#FFFDF9] p-5 shadow-soft">
            <h3 className="font-[Playfair_Display] text-2xl text-[#33201D]">Event Cart</h3>
            <div className="mt-5 space-y-4">
              {selectedItems.length === 0 ? <p className="text-sm text-[#806C66]">No items selected yet.</p> : selectedItems.map((item) => (
                <div key={item.itemId} className="flex items-center justify-between gap-3 rounded-xl bg-white p-3 border border-[#F0D7AF]">
                  <div>
                    <div className="font-medium text-[#33201D]">{item.name}</div>
                    <div className="text-sm text-[#806C66]">₹{item.price} each</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQuantity(item.itemId, -1)} className="rounded-full bg-[#F7EBDD] p-2 text-[#6B1E2B]"><Minus size={14} /></button>
                    <span className="min-w-5 text-center font-semibold">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.itemId, 1)} className="rounded-full bg-[#F7EBDD] p-2 text-[#6B1E2B]"><Plus size={14} /></button>
                    <button onClick={() => removeItem(item.itemId)} className="text-[#6B1E2B]"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 border-t border-[#F0D7AF] pt-4">
              <div className="flex items-center justify-between text-sm text-[#806C66]">
                <span>Estimated Total</span>
                <span className="font-bold text-[#33201D]">₹{estimatedTotal}</span>
              </div>
            </div>
          </aside>
        </div>
      );
    }

    if (currentStep === 3) {
      return (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="rounded-2xl border border-[#F0D7AF] bg-[#FFFDF9] p-5">
              <h3 className="font-[Playfair_Display] text-2xl">Event information</h3>
              <ul className="mt-3 space-y-2 text-sm text-[#33201D]">
                <li><strong>Type:</strong> {eventData.eventType}</li>
                <li><strong>Dates:</strong> {eventData.startDate} to {eventData.endDate}</li>
                <li><strong>Location:</strong> {eventData.location}</li>
                <li><strong>Guests:</strong> {eventData.guestCount}</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-[#F0D7AF] bg-[#FFFDF9] p-5">
              <h3 className="font-[Playfair_Display] text-2xl">Selected items</h3>
              {selectedItems.map((item) => (
                <div key={item.itemId} className="mt-3 flex items-center justify-between text-sm text-[#33201D]">
                  <span>{item.name} x {item.quantity}</span>
                  <span>₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-[#F0D7AF] bg-[#FFFDF9] p-5">
              <label className="mb-2 block text-sm font-medium text-[#33201D]">Additional Requirements</label>
              <textarea value={eventData.additionalRequirements || ''} onChange={(e) => setEventData({ ...eventData, additionalRequirements: e.target.value })} rows="5" className="w-full rounded-xl border border-[#E7CC91] bg-white p-3 outline-none" placeholder="Need red and gold decoration and large entrance gate." />
            </div>
            <div className="rounded-2xl border border-[#F0D7AF] bg-[#FFFDF9] p-5">
              <h3 className="font-[Playfair_Display] text-2xl">Customer information</h3>
              <div className="mt-3 space-y-3 text-sm">
                <div><strong>Name:</strong> {user?.name || 'Not provided'}</div>
                <div><strong>Phone:</strong> {user?.phone || 'Not provided'}</div>
                <div><strong>Email:</strong> {user?.email || 'Not provided'}</div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-2xl border border-[#F0D7AF] bg-[#FFFDF9] p-6">
        <h3 className="font-[Playfair_Display] text-2xl">Submit requirement</h3>
        <p className="mt-4 text-[#33201D]">{industryNotice}</p>
        <div className="mt-6 rounded-2xl bg-[#F7EBDD] p-4 text-sm text-[#33201D]">
          By submitting this form, you agree that our team will review your requirement and contact you for confirmation and final quotation.
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <div className="text-xs uppercase tracking-[0.22em] text-[#6B1E2B]">Build your event</div>
        <h1 className="mt-2 font-[Playfair_Display] text-5xl text-[#33201D]">Create your custom requirement</h1>
      </div>

      <div className="mb-8 flex items-center justify-between overflow-x-auto">
        {steps.map((step, index) => (
          <div key={step} className={`flex min-w-[180px] items-center gap-3 ${currentStep === index + 1 ? 'text-[#6B1E2B]' : 'text-[#806C66]'}`}>
            <div className={`flex h-9 w-9 items-center justify-center rounded-full border ${currentStep >= index + 1 ? 'border-[#6B1E2B] bg-[#6B1E2B] text-white' : 'border-[#E7CC91] bg-white'}`}>
              {index + 1}
            </div>
            <span className="text-sm font-medium">{step}</span>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-[#F0D7AF] bg-white p-6 shadow-soft">{renderStep()}</div>

      <div className="mt-8 flex justify-between">
        <button onClick={prevStep} disabled={currentStep === 1} className="rounded-full border border-[#E7CC91] px-5 py-3 font-medium text-[#33201D] disabled:opacity-40">
          Back
        </button>
        {currentStep < steps.length ? (
          <button onClick={nextStep} className="rounded-full bg-[#6B1E2B] px-5 py-3 font-medium text-white">
            Next
          </button>
        ) : (
          <button onClick={handleSubmit} className="rounded-full bg-[#6B1E2B] px-5 py-3 font-medium text-white">
            Submit Requirement
          </button>
        )}
      </div>
    </div>
  );
}
