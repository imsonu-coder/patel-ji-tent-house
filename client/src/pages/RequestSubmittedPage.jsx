import { Link, useLocation } from 'react-router-dom';

export default function RequestSubmittedPage() {
  const { state } = useLocation();
  const request = state?.request;

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-[#F0D7AF] bg-[#FFFDF9] p-8 shadow-soft text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#F7EBDD] text-3xl text-[#6B1E2B]">✓</div>
        <h1 className="font-[Playfair_Display] text-5xl text-[#33201D]">
          {request ? 'Requirement Received!' : 'Request status'}
        </h1>
        {request ? (
          <>
            <div className="mt-6 text-lg text-[#604D47]">
              Request ID: <span className="font-semibold text-[#6B1E2B]">{request.requestId}</span>
            </div>
            <div className="mt-8 grid gap-4 text-left md:grid-cols-2">
              <div className="rounded-2xl bg-[#F7EBDD] p-5">
                <div className="font-semibold text-[#33201D]">Event details</div>
                <ul className="mt-3 space-y-2 text-sm text-[#33201D]">
                  <li>Type: {request.eventType}</li>
                  <li>Dates: {request.startDate} to {request.endDate}</li>
                  <li>Location: {request.location}</li>
                </ul>
              </div>
              <div className="rounded-2xl bg-[#F7EBDD] p-5">
                <div className="font-semibold text-[#33201D]">Estimated amount</div>
                <div className="mt-3 text-2xl font-bold text-[#6B1E2B]">
                  ₹{Number(request.estimatedAmount || 0).toLocaleString('en-IN')}
                </div>
                <p className="mt-2 text-sm text-[#604D47]">This is an estimate; a final quotation will follow after review.</p>
              </div>
            </div>
          </>
        ) : (
          <p className="mx-auto mt-5 max-w-xl text-[#604D47]">
            Request details are not available in this page session. Sign in to view the current request status from your dashboard.
          </p>
        )}
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <a href="tel:+919829012345" className="rounded-full bg-[#6B1E2B] px-5 py-3 font-medium text-white">Call Us</a>
          <a href="https://wa.me/919829012345" target="_blank" rel="noreferrer" className="rounded-full bg-[#C79A3B] px-5 py-3 font-medium text-[#33201D]">WhatsApp</a>
          <Link to="/" className="rounded-full border border-[#E7CC91] px-5 py-3 font-medium text-[#33201D]">Back to Home</Link>
          <Link to="/dashboard" className="rounded-full border border-[#6B1E2B] px-5 py-3 font-medium text-[#6B1E2B]">View My Requests</Link>
        </div>
      </div>
    </div>
  );
}
