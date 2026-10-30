import { useState } from 'react';
import api from '../api/client';

const adjustments = [
  ['decorationServices', 'Decoration services'],
  ['transportation', 'Transportation'],
  ['additionalCharges', 'Additional charges'],
  ['discount', 'Discount'],
];

export default function QuotationComposer({ request, onCancel, onCreated }) {
  const [items, setItems] = useState(() => (request.items || []).map((item) => ({
    itemName: item.itemName,
    quantity: item.quantity,
    unitPrice: Number.isFinite(Number(item.estimatedPrice))
      ? Number(item.estimatedPrice) / item.quantity
      : 0,
  })));
  const [amounts, setAmounts] = useState({
    decorationServices: 0,
    transportation: 0,
    additionalCharges: 0,
    discount: 0,
  });
  const [notes, setNotes] = useState('');
  const [validityDate, setValidityDate] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const updateItemPrice = (index, value) => {
    setItems((current) => current.map((item, itemIndex) => (
      itemIndex === index ? { ...item, unitPrice: value } : item
    )));
  };

  const updateAmount = (field, value) => {
    setAmounts((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { data } = await api.post('/admin/quotations', {
        request: request._id,
        status: 'Sent',
        items: items.map((item) => ({
          itemName: item.itemName,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
        })),
        ...Object.fromEntries(Object.entries(amounts).map(([field, value]) => [field, Number(value)])),
        notes,
        ...(validityDate ? { validityDate } : {}),
      });
      onCreated(data);
    } catch (submitError) {
      setError(submitError.response?.data?.message || 'Quotation could not be sent. Please review and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const itemTotal = items.reduce((total, item) => total + Number(item.unitPrice || 0) * item.quantity, 0);

  return (
    <form onSubmit={handleSubmit} className="mt-4 rounded-2xl border border-[#E6D3AD] bg-[#FFF8ED] p-4 sm:p-6">
      <div className="mb-5">
        <h3 className="font-[Playfair_Display] text-2xl text-[#45121C]">Prepare quotation</h3>
        <p className="mt-1 text-sm text-[#604D47]">
          Review each line and set the proposed unit prices before sending to the customer.
        </p>
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="rounded-xl bg-white p-4 text-sm text-[#604D47]">
            This request has no catalogue items. Add charges below if needed.
          </p>
        ) : items.map((item, index) => (
          <div key={`${item.itemName}-${index}`} className="grid gap-3 rounded-xl border border-[#E6D3AD] bg-white p-4 sm:grid-cols-[minmax(0,1fr)_8rem_10rem] sm:items-center">
            <div className="min-w-0">
              <p className="font-semibold text-[#33201D]">{item.itemName}</p>
              <p className="text-sm text-[#604D47]">Requested quantity: {item.quantity}</p>
            </div>
            <label className="text-sm font-medium text-[#33201D]">
              Unit price (₹)
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={item.unitPrice}
                onChange={(event) => updateItemPrice(index, event.target.value)}
                className="mt-1 min-h-11 w-full rounded-lg border border-[#D7B46B] bg-white px-3"
              />
            </label>
            <p className="text-sm text-[#604D47] sm:text-right">
              Line total: <strong className="text-[#45121C]">₹{(Number(item.unitPrice || 0) * item.quantity).toLocaleString('en-IN')}</strong>
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {adjustments.map(([field, label]) => (
          <label key={field} className="text-sm font-medium text-[#33201D]">
            {label} (₹)
            <input
              type="number"
              min="0"
              step="0.01"
              required
              value={amounts[field]}
              onChange={(event) => updateAmount(field, event.target.value)}
              className="mt-1 min-h-11 w-full rounded-lg border border-[#D7B46B] bg-white px-3"
            />
          </label>
        ))}
        <label className="text-sm font-medium text-[#33201D]">
          Valid until (optional)
          <input
            type="date"
            value={validityDate}
            onChange={(event) => setValidityDate(event.target.value)}
            className="mt-1 min-h-11 w-full rounded-lg border border-[#D7B46B] bg-white px-3"
          />
        </label>
        <label className="text-sm font-medium text-[#33201D] sm:col-span-2">
          Notes (optional)
          <textarea
            rows="2"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="mt-1 w-full rounded-lg border border-[#D7B46B] bg-white px-3 py-2"
          />
        </label>
      </div>

      <p className="mt-4 border-t border-[#E6D3AD] pt-4 text-right text-lg font-semibold text-[#45121C]">
        Item subtotal before adjustments: ₹{itemTotal.toLocaleString('en-IN')}
      </p>
      {error && <p role="alert" className="mt-3 rounded-xl bg-[#FFF3F0] p-3 text-sm text-[#702721]">{error}</p>}
      <div className="mt-5 flex flex-wrap justify-end gap-3">
        <button type="button" onClick={onCancel} disabled={submitting} className="min-h-11 rounded-full border border-[#6B1E2B] px-5 py-2 font-semibold text-[#6B1E2B]">
          Cancel
        </button>
        <button type="submit" disabled={submitting} className="min-h-11 rounded-full bg-[#6B1E2B] px-5 py-2 font-semibold text-white disabled:opacity-60">
          {submitting ? 'Sending...' : 'Send quotation'}
        </button>
      </div>
    </form>
  );
}
