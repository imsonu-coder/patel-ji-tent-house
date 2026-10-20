import { Link, useLocation } from 'react-router-dom';

export default function RequestSubmittedPage() {
  const { state } = useLocation();
  const request = state?.request;

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-[#F0D7AF] bg-[#FFFDF9] p-8 shadow-soft text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#F7EBDD] text-3xl text-[#6B1E2B]">✓</div>
        <h1 className="font-[Playfair_Display] text-5xl text-[#33201D]">Requirement Received!</h1>
        <div className="mt-6 text-lg text-[#806C66]">Request ID: <span className="font-semibold text-[#6B1E2B]">{request?.requestId || 'PJTH-1024'}</span></div>
        <div className="mt-8 grid gap-4 text-left md:grid-cols-2">
          <div className="rounded-2xl bg-[#F7EBDD] p-5">
            <div className="font-semibold text-[#33201D]">Event details</div>
            <ul className="mt-3 space-y-2 text-sm text-[#33201D]">
              <li>Type: {request?.eventType || 'Wedding'}</li>
              <li>Dates: {request?.startDate || 'TBD'} to {request?.endDate || 'TBD'}</li>
              <li>Location: {request?.location || 'Jaipur'}</li>
            </ul>
          </div>
          <div className="rounded-2xl bg-[#F7EBDD] p-5">
            <div className="font-semibold text-[#33201D]">Estimated amount</div>
            <div className="mt-3 text-2xl font-bold text-[#6B1E2B]">₹{request?.estimatedAmount || '0'}</div>
          </div>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <a href="tel:+919999999999" className="rounded-full bg-[#6B1E2B] px-5 py-3 font-medium text-white">Call Us</a>
          <a href="https://wa.me/919999999999" target="_blank" rel="noreferrer" className="rounded-full bg-[#C79A3B] px-5 py-3 font-medium text-[#33201D]">WhatsApp</a>
          <Link to="/" className="rounded-full border border-[#E7CC91] px-5 py-3 font-medium text-[#33201D]">Back to Home</Link>
          <Link to="/login" className="rounded-full border border-[#6B1E2B] px-5 py-3 font-medium text-[#6B1E2B]">View My Requests</Link>
        </div>
      </div>
    </div>
  );
}
