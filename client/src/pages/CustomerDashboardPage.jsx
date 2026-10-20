import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

export default function CustomerDashboardPage() {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const fetchMyRequests = async () => {
      try {
        const { data } = await api.get('/requests/my');
        setRequests(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchMyRequests();
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="text-xs uppercase tracking-[0.22em] text-[#6B1E2B]">Dashboard</div>
        <h1 className="mt-2 font-[Playfair_Display] text-5xl text-[#33201D]">My Requests</h1>
      </div>

      <div className="space-y-4">
        {requests.length === 0 ? (
          <div className="rounded-2xl border border-[#F0D7AF] bg-[#FFFDF9] p-8 text-[#806C66]">No requests yet. Start by creating your event requirement.</div>
        ) : (
          requests.map((request) => (
            <Link key={request._id} to={`/requests/${request._id}`} className="block rounded-2xl border border-[#F0D7AF] bg-white p-5 shadow-soft">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-[#6B1E2B]">{request.requestId}</div>
                  <div className="mt-2 font-[Playfair_Display] text-3xl text-[#33201D]">{request.eventType}</div>
                </div>
                <div className="rounded-full bg-[#F7EBDD] px-3 py-1 text-sm text-[#33201D]">{request.status || 'Submitted'}</div>
              </div>
              <div className="mt-4 grid gap-2 text-sm text-[#806C66] md:grid-cols-3">
                <span>{request.location}</span>
                <span>{request.startDate} to {request.endDate}</span>
                <span>₹{request.estimatedAmount || 0}</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
