import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';

export default function RequestDetailPage() {
  const { id } = useParams();
  const [request, setRequest] = useState(null);

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const { data } = await api.get(`/requests/${id}`);
        setRequest(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchRequest();
  }, [id]);

  if (!request) return <div className="py-16 text-center text-[#806C66]">Loading request details...</div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-[#F0D7AF] bg-[#FFFDF9] p-8 shadow-soft">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-[#6B1E2B]">{request.requestId}</div>
            <h1 className="mt-2 font-[Playfair_Display] text-5xl text-[#33201D]">{request.eventType}</h1>
          </div>
          <div className="rounded-full bg-[#F7EBDD] px-3 py-1 text-sm font-medium text-[#33201D]">{request.status || 'Submitted'}</div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl bg-white p-5 border border-[#F0D7AF]">
            <div className="font-semibold text-[#33201D]">Event Details</div>
            <ul className="mt-4 space-y-2 text-sm text-[#806C66]">
              <li><strong className="text-[#33201D]">Location:</strong> {request.location}</li>
              <li><strong className="text-[#33201D]">Dates:</strong> {request.startDate} to {request.endDate}</li>
              <li><strong className="text-[#33201D]">Guests:</strong> {request.guestCount}</li>
              <li><strong className="text-[#33201D]">Description:</strong> {request.description}</li>
            </ul>
          </div>
          <div className="rounded-2xl bg-white p-5 border border-[#F0D7AF]">
            <div className="font-semibold text-[#33201D]">Quotation</div>
            <div className="mt-4 text-3xl font-bold text-[#6B1E2B]">₹{request.estimatedAmount || 0}</div>
            <p className="mt-3 text-sm text-[#806C66]">The final quotation will be confirmed by our team after review.</p>
          </div>
        </div>

        <div className="mt-8 rounded-2xl bg-[#F7EBDD] p-5">
          <div className="font-semibold text-[#33201D]">Selected Items</div>
          <div className="mt-4 space-y-3 text-sm text-[#33201D]">
            {(request.items || []).map((entry) => (
              <div key={entry._id || entry.item} className="flex items-center justify-between border-b border-[#E7CC91] pb-2">
                <span>{entry.itemName || 'Item'}</span>
                <span>{entry.quantity} x ₹{entry.unitPrice || 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
