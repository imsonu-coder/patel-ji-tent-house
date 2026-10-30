import { useEffect, useState } from 'react';
import { X, Send, Calendar, MapPin, User, FileText, CheckCircle2 } from 'lucide-react';
import api from '../api/client';

const adjustments = [
  ['decorationServices', 'Decoration & Styling services'],
  ['transportation', 'Transportation & Logistics'],
  ['additionalCharges', 'Setup / Labor charges'],
  ['discount', 'Customer Discount (-)'],
];

export default function QuotationComposer({ request, onCancel, onCreated }) {
  const [items, setItems] = useState(() => (request?.items || []).map((item) => {
    const qty = Number(item.quantity) || 1;
    let defaultUnit = 0;
    if (Number(item.unitPrice) > 0) {
      defaultUnit = Number(item.unitPrice);
    } else if (Number.isFinite(Number(item.estimatedPrice)) && Number(item.estimatedPrice) > 0) {
      defaultUnit = Math.round(Number(item.estimatedPrice) / qty);
    }
    return {
      itemName: item.itemName || item.item?.name || item.name || 'Catalogue Item',
      quantity: qty,
      unitPrice: defaultUnit,
    };
  }));

  const [amounts, setAmounts] = useState({
    decorationServices: 0,
    transportation: 0,
    additionalCharges: 0,
    discount: 0,
  });
  const [notes, setNotes] = useState('');
  const [validityDate, setValidityDate] = useState(() => {
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 7);
    return defaultDate.toISOString().split('T')[0];
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Close on Escape & Lock body scroll
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [onCancel]);

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
          unitPrice: Number(item.unitPrice) || 0,
        })),
        ...Object.fromEntries(Object.entries(amounts).map(([field, value]) => [field, Number(value) || 0])),
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

  const itemTotal = items.reduce(
    (total, item) => total + (Number(item.unitPrice) || 0) * (Number(item.quantity) || 1),
    0
  );

  const finalTotal = Math.max(
    0,
    itemTotal
      + (Number(amounts.decorationServices) || 0)
      + (Number(amounts.transportation) || 0)
      + (Number(amounts.additionalCharges) || 0)
      - (Number(amounts.discount) || 0)
  );

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quotation-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-3 sm:p-6 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="relative my-auto w-full max-w-3xl overflow-hidden rounded-3xl border border-[#E6D3AD] bg-[#FFFDF9] shadow-2xl transition-all">
        {/* Header Bar */}
        <div className="flex items-start justify-between border-b border-[#F0D7AF] bg-[#FFF8ED] p-5 sm:p-6">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D7B46B] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#6B1E2B]">
              <FileText size={13} aria-hidden="true" /> Commercial Proposal
            </span>
            <h2 id="quotation-modal-title" className="mt-2 font-[Playfair_Display] text-2xl font-bold text-[#33201D] sm:text-3xl">
              Compose Quotation
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[#604D47]">
              {request.user?.name && (
                <span className="inline-flex items-center gap-1 font-medium">
                  <User size={13} className="text-[#6B1E2B]" /> {request.user.name} ({request.user.phone || request.user.email})
                </span>
              )}
              {request.eventType && (
                <span className="rounded bg-[#F7EBDD] px-2 py-0.5 font-semibold text-[#45121C]">
                  {request.eventType}
                </span>
              )}
              {(request.startDate || request.endDate) && (
                <span className="inline-flex items-center gap-1">
                  <Calendar size={13} className="text-[#6B1E2B]" />
                  {formatDate(request.startDate)} — {formatDate(request.endDate)}
                </span>
              )}
              {request.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={13} className="text-[#6B1E2B]" /> {request.location}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            aria-label="Close modal"
            className="rounded-full p-2 text-[#806C66] transition hover:bg-[#F0D7AF]/40 hover:text-[#33201D]"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="max-h-[calc(85vh-160px)] overflow-y-auto p-5 sm:p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#6B1E2B]">
                1. Item Unit Rates & Quantities
              </h3>
              <span className="text-xs text-[#806C66]">
                {items.length} requested {items.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            {items.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[#D7B46B] bg-white p-4 text-center text-sm text-[#604D47]">
                This inquiry has no catalogue items attached. You can add labor, styling, and transport charges below.
              </p>
            ) : (
              <div className="space-y-2.5">
                {items.map((item, index) => (
                  <div
                    key={`${item.itemName}-${index}`}
                    className="grid gap-3 rounded-2xl border border-[#F0D7AF] bg-white p-3.5 sm:grid-cols-[minmax(0,1fr)_10rem_9rem] sm:items-center"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-[#33201D] truncate">{item.itemName}</p>
                      <p className="text-xs text-[#806C66]">Requested: {item.quantity} units</p>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#806C66] mb-1">
                        Unit Rate (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={item.unitPrice}
                        onChange={(event) => updateItemPrice(index, event.target.value)}
                        className="min-h-10 w-full rounded-xl border border-[#D7B46B] bg-[#FFFDF9] px-3 text-sm font-medium text-[#33201D] outline-none focus:border-[#6B1E2B] focus:ring-1 focus:ring-[#6B1E2B]"
                      />
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="block text-[11px] font-semibold text-[#806C66]">Line Total</span>
                      <strong className="text-base text-[#45121C]">
                        ₹{((Number(item.unitPrice) || 0) * (Number(item.quantity) || 1)).toLocaleString('en-IN')}
                      </strong>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end rounded-xl bg-[#F7EBDD]/60 p-3 text-sm font-semibold text-[#45121C]">
              Items Subtotal: ₹{itemTotal.toLocaleString('en-IN')}
            </div>

            {/* Adjustments Section */}
            <div className="pt-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#6B1E2B] mb-3">
                2. Additional Services & Adjustments
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {adjustments.map(([field, label]) => (
                  <label key={field} className="block rounded-xl border border-[#F0D7AF] bg-white p-3 text-xs font-semibold text-[#33201D]">
                    {label} (₹)
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={amounts[field]}
                      onChange={(event) => updateAmount(field, event.target.value)}
                      className="mt-1.5 min-h-10 w-full rounded-lg border border-[#D7B46B] bg-[#FFFDF9] px-3 text-sm font-medium text-[#33201D] outline-none focus:border-[#6B1E2B]"
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* Notes & Validity */}
            <div className="grid gap-3 sm:grid-cols-2 pt-2">
              <label className="block text-xs font-semibold text-[#33201D]">
                Proposal Valid Until
                <input
                  type="date"
                  value={validityDate}
                  onChange={(event) => setValidityDate(event.target.value)}
                  className="mt-1.5 min-h-10 w-full rounded-xl border border-[#D7B46B] bg-white px-3 text-sm font-medium text-[#33201D] outline-none focus:border-[#6B1E2B]"
                />
              </label>

              <label className="block text-xs font-semibold text-[#33201D]">
                Special Terms / Customer Notes
                <input
                  type="text"
                  placeholder="e.g., Includes generator fuel and 24/7 technician"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className="mt-1.5 min-h-10 w-full rounded-xl border border-[#D7B46B] bg-white px-3 text-sm font-medium text-[#33201D] outline-none focus:border-[#6B1E2B]"
                />
              </label>
            </div>

            {/* Summary Banner */}
            <div className="rounded-2xl border border-[#D7B46B] bg-[#FFF8ED] p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <span className="text-xs uppercase tracking-wider text-[#806C66] font-semibold">Total Estimated Value</span>
                <div className="font-[Playfair_Display] text-3xl font-bold text-[#6B1E2B]">
                  ₹{finalTotal.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="text-xs text-[#806C66] text-right">
                <span className="inline-flex items-center gap-1 font-medium text-[#2E7D32]">
                  <CheckCircle2 size={14} /> Ready for customer approval
                </span>
                <p className="mt-0.5">Status will update to 'Quotation Sent'</p>
              </div>
            </div>

            {error && (
              <p role="alert" className="rounded-xl border border-[#e8b5ac] bg-[#FFF3F0] p-3 text-xs font-medium text-[#702721]">
                {error}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-[#F0D7AF] pt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="min-h-11 rounded-full border border-[#6B1E2B] px-6 py-2.5 text-sm font-semibold text-[#6B1E2B] transition hover:bg-[#FFF3E1] disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#6B1E2B] px-7 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-[#45121C] disabled:opacity-60"
            >
              <Send size={15} />
              {submitting ? 'Sending Proposal...' : 'Send Quotation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
