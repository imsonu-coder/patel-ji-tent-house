import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import PaginationControls from '../components/PaginationControls';
import api from '../api/client';

const requestDateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

function parseRequestDate(value) {
  if (typeof value !== 'string' || !value.trim()) return null;

  const isoDate = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T)/);
  if (isoDate) {
    const [, year, month, day] = isoDate;
    const date = new Date(0);
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCFullYear(Number(year), Number(month) - 1, Number(day));

    if (
      date.getUTCFullYear() !== Number(year) ||
      date.getUTCMonth() !== Number(month) - 1 ||
      date.getUTCDate() !== Number(day)
    ) {
      return null;
    }

    return date;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function formatRequestDateRange(startValue, endValue) {
  const startDate = parseRequestDate(startValue);
  const endDate = parseRequestDate(endValue);
  const formatDate = (date) => date ? requestDateFormatter.format(date) : 'Date not available';

  if (startDate && endDate && startDate.getTime() === endDate.getTime()) {
    return formatDate(startDate);
  }

  return `${formatDate(startDate)} – ${formatDate(endDate)}`;
}

export default function CustomerDashboardPage() {
  const [activeTab, setActiveTab] = useState('requests');
  const [requests, setRequests] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [respondingQuotationId, setRespondingQuotationId] = useState('');

  // Requests pagination
  const [requestsPage, setRequestsPage] = useState(1);
  const [requestsPageSize] = useState(10);
  const [totalRequests, setTotalRequests] = useState(0);
  const [requestsTotalPages, setRequestsTotalPages] = useState(1);

  // Quotations pagination
  const [quotationsPage, setQuotationsPage] = useState(1);
  const [quotationsPageSize] = useState(10);
  const [totalQuotations, setTotalQuotations] = useState(0);
  const [quotationsTotalPages, setQuotationsTotalPages] = useState(1);

  // Bookings pagination
  const [bookingsPage, setBookingsPage] = useState(1);
  const [bookingsPageSize] = useState(10);
  const [totalBookings, setTotalBookings] = useState(0);
  const [bookingsTotalPages, setBookingsTotalPages] = useState(1);

  // Fetch Requests
  useEffect(() => {
    let cancelled = false;
    const fetchRequests = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await api.get('/requests/my', {
          params: { page: requestsPage, pageSize: requestsPageSize }
        });
        if (!cancelled) {
          const rawTotal = response.headers['x-total-count'];
          const rawPages = response.headers['x-total-pages'];
          const count = rawTotal ? Number(rawTotal) : response.data.length;
          setRequests(response.data);
          setTotalRequests(count);
          setRequestsTotalPages(rawPages ? Number(rawPages) : Math.ceil(count / requestsPageSize) || 1);
        }
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setError(err.response?.data?.message || 'Your requests could not be loaded. Please try again later.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchRequests();
    return () => { cancelled = true; };
  }, [requestsPage, requestsPageSize]);

  // Fetch Quotations
  useEffect(() => {
    let cancelled = false;
    const fetchQuotations = async () => {
      try {
        const response = await api.get('/quotations/my', {
          params: { page: quotationsPage, pageSize: quotationsPageSize }
        });
        if (!cancelled) {
          const rawTotal = response.headers['x-total-count'];
          const rawPages = response.headers['x-total-pages'];
          const count = rawTotal ? Number(rawTotal) : response.data.length;
          setQuotations(response.data);
          setTotalQuotations(count);
          setQuotationsTotalPages(rawPages ? Number(rawPages) : Math.ceil(count / quotationsPageSize) || 1);
        }
      } catch (err) {
        if (!cancelled) console.error(err);
      }
    };
    fetchQuotations();
    return () => { cancelled = true; };
  }, [quotationsPage, quotationsPageSize]);

  // Fetch Bookings
  useEffect(() => {
    let cancelled = false;
    const fetchBookings = async () => {
      try {
        const response = await api.get('/my', {
          params: { page: bookingsPage, pageSize: bookingsPageSize }
        });
        if (!cancelled) {
          const rawTotal = response.headers['x-total-count'];
          const rawPages = response.headers['x-total-pages'];
          const count = rawTotal ? Number(rawTotal) : response.data.length;
          setBookings(response.data);
          setTotalBookings(count);
          setBookingsTotalPages(rawPages ? Number(rawPages) : Math.ceil(count / bookingsPageSize) || 1);
        }
      } catch (err) {
        if (!cancelled) console.error(err);
      }
    };
    fetchBookings();
    return () => { cancelled = true; };
  }, [bookingsPage, bookingsPageSize]);

  const respondToQuotation = async (quotation, status) => {
    setRespondingQuotationId(quotation._id);
    setError('');
    try {
      const { data } = await api.put(`/quotations/${quotation._id}/respond`, { status });
      setQuotations((current) => current.map((entry) => (
        entry._id === quotation._id ? data : entry
      )));
      const requestStatus = status === 'Accepted' ? 'Quotation Accepted' : 'Rejected';
      setRequests((current) => current.map((request) => (
        request._id === quotation.request
          ? { ...request, status: requestStatus }
          : request
      )));
    } catch (err) {
      setError(err.response?.data?.message || 'Your quotation response could not be saved.');
    } finally {
      setRespondingQuotationId('');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.22em] text-[#6B1E2B]">Customer Area</div>
          <h1 className="mt-2 font-[Playfair_Display] text-5xl text-[#33201D]">My Dashboard</h1>
        </div>
        <Link
          to="/build-event"
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#6B1E2B] px-5 py-3 font-semibold text-white transition-opacity hover:opacity-90"
        >
          New Event Request <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>

      <div className="mb-6 flex border-b border-[#F0D7AF] gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('requests')}
          className={`pb-3 px-4 font-semibold text-sm transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'requests'
              ? 'border-[#6B1E2B] text-[#6B1E2B]'
              : 'border-transparent text-[#604D47] hover:text-[#33201D]'
          }`}
        >
          <Calendar size={16} /> My Requests {totalRequests > 0 && `(${totalRequests})`}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('quotations')}
          className={`pb-3 px-4 font-semibold text-sm transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'quotations'
              ? 'border-[#6B1E2B] text-[#6B1E2B]'
              : 'border-transparent text-[#604D47] hover:text-[#33201D]'
          }`}
        >
          <FileText size={16} /> My Quotations {totalQuotations > 0 && `(${totalQuotations})`}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('bookings')}
          className={`pb-3 px-4 font-semibold text-sm transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'bookings'
              ? 'border-[#6B1E2B] text-[#6B1E2B]'
              : 'border-transparent text-[#604D47] hover:text-[#33201D]'
          }`}
        >
          <CheckCircle2 size={16} /> My Bookings {totalBookings > 0 && `(${totalBookings})`}
        </button>
      </div>

      {error && <p role="alert" className="mb-5 rounded-2xl border border-[#d7aaa2] bg-[#fff3f0] p-5 text-[#702721]">{error}</p>}

      {/* Requests Tab */}
      {activeTab === 'requests' && (
        <div>
          {loading ? (
            <p role="status" className="rounded-2xl border border-[#e6d3ad] bg-white p-6 text-[#604d47]">Loading your requests...</p>
          ) : requests.length === 0 ? (
            <div className="rounded-2xl border border-[#F0D7AF] bg-[#FFFDF9] p-8 shadow-soft">
              <p className="text-[#604d47]">No requests yet. Start by creating your event requirement.</p>
              <Link to="/build-event" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#6B1E2B] px-5 py-3 font-semibold text-white">
                Build an event <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => {
                const requestQuotations = quotations.filter((quotation) => quotation.request === request._id);
                const requestBookings = bookings.filter((booking) => booking.request === request._id);
                return (
                  <article key={request._id} className="rounded-2xl border border-[#F0D7AF] bg-white p-5 shadow-soft">
                    <Link to={`/requests/${request._id}`} className="block rounded-xl focus-visible:outline">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="text-xs uppercase tracking-[0.18em] text-[#6B1E2B]">{request.requestId}</div>
                          <div className="mt-2 font-[Playfair_Display] text-3xl text-[#33201D]">{request.eventType}</div>
                        </div>
                        <div className="rounded-full bg-[#F7EBDD] px-3 py-1 text-sm text-[#33201D]">{request.status || 'Submitted'}</div>
                      </div>
                      <div className="mt-4 grid gap-2 text-sm text-[#604D47] sm:grid-cols-2 md:grid-cols-3">
                        <span>{request.location}</span>
                        <span className="whitespace-nowrap tabular-nums">
                          {formatRequestDateRange(request.startDate, request.endDate)}
                        </span>
                        <span>₹{request.estimatedAmount || 0}</span>
                      </div>
                    </Link>

                    {requestQuotations.map((quotation) => (
                      <section key={quotation._id} aria-label={`Quotation ${quotation.status}`} className="mt-5 rounded-xl border border-[#E6D3AD] bg-[#FFF8ED] p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h2 className="font-[Playfair_Display] text-2xl text-[#45121C]">Quotation</h2>
                            <p className="mt-1 text-sm text-[#604D47]">Status: {quotation.status}</p>
                          </div>
                          <p className="text-lg font-bold text-[#6B1E2B]">
                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(quotation.finalTotal || 0)}
                          </p>
                        </div>
                        <ul className="mt-3 space-y-2 text-sm text-[#33201D]">
                          {(quotation.items || []).map((item, index) => (
                            <li key={`${item.item || item.itemName}-${index}`} className="flex justify-between gap-3">
                              <span>{item.itemName} × {item.quantity}</span>
                              <span>₹{Number(item.subtotal || 0).toLocaleString('en-IN')}</span>
                            </li>
                          ))}
                        </ul>
                        {quotation.notes && <p className="mt-3 text-sm text-[#604D47]">{quotation.notes}</p>}
                        {quotation.validityDate && (
                          <p className="mt-2 text-xs text-[#604D47]">
                            Valid until {new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(quotation.validityDate))}
                          </p>
                        )}
                        {quotation.status === 'Sent' && (
                          <div className="mt-4 flex flex-wrap gap-3">
                            <button
                              type="button"
                              disabled={respondingQuotationId === quotation._id}
                              onClick={() => respondToQuotation(quotation, 'Accepted')}
                              className="min-h-11 rounded-full bg-[#6B1E2B] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
                            >
                              Accept quotation
                            </button>
                            <button
                              type="button"
                              disabled={respondingQuotationId === quotation._id}
                              onClick={() => respondToQuotation(quotation, 'Rejected')}
                              className="min-h-11 rounded-full border border-[#6B1E2B] px-5 py-2 text-sm font-semibold text-[#6B1E2B] disabled:opacity-60"
                            >
                              Decline quotation
                            </button>
                          </div>
                        )}
                      </section>
                    ))}

                    {requestBookings.map((booking) => (
                      <section key={booking._id} aria-label="Booking Details" className="mt-5 rounded-xl border border-[#8FB339] bg-[#F7FAF0] p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h2 className="font-[Playfair_Display] text-2xl text-[#2F4F1E]">Booking Record</h2>
                            <p className="mt-1 text-sm text-[#4E6E34]">ID: {booking.bookingId} | Status: {booking.status}</p>
                          </div>
                          <p className="text-lg font-bold text-[#2F4F1E]">
                            ₹{Number(booking.finalAmount || 0).toLocaleString('en-IN')}
                          </p>
                        </div>
                      </section>
                    ))}
                  </article>
                );
              })}
              <PaginationControls
                page={requestsPage}
                totalPages={requestsTotalPages}
                totalItems={totalRequests}
                pageSize={requestsPageSize}
                onPageChange={setRequestsPage}
                className="mt-6"
              />
            </div>
          )}
        </div>
      )}

      {/* Quotations Tab */}
      {activeTab === 'quotations' && (
        <div>
          {quotations.length === 0 ? (
            <div className="rounded-2xl border border-[#F0D7AF] bg-[#FFFDF9] p-8 shadow-soft">
              <p className="text-[#604d47]">No quotations received yet. Quotations will appear once your requests are reviewed.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {quotations.map((quotation) => (
                <article key={quotation._id} className="rounded-2xl border border-[#E6D3AD] bg-[#FFF8ED] p-6 shadow-soft">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-[0.18em] text-[#6B1E2B]">Quotation</div>
                      <h2 className="mt-1 font-[Playfair_Display] text-2xl text-[#45121C]">Status: {quotation.status}</h2>
                    </div>
                    <p className="text-xl font-bold text-[#6B1E2B]">
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(quotation.finalTotal || 0)}
                    </p>
                  </div>
                  <ul className="mt-4 space-y-2 text-sm text-[#33201D]">
                    {(quotation.items || []).map((item, index) => (
                      <li key={`${item.item || item.itemName}-${index}`} className="flex justify-between gap-3 border-b border-[#F0E7D7] pb-1">
                        <span>{item.itemName} × {item.quantity}</span>
                        <span>₹{Number(item.subtotal || 0).toLocaleString('en-IN')}</span>
                      </li>
                    ))}
                  </ul>
                  {quotation.notes && <p className="mt-3 text-sm text-[#604D47]">{quotation.notes}</p>}
                  {quotation.validityDate && (
                    <p className="mt-2 text-xs text-[#604D47]">
                      Valid until {new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(quotation.validityDate))}
                    </p>
                  )}
                  {quotation.status === 'Sent' && (
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        disabled={respondingQuotationId === quotation._id}
                        onClick={() => respondToQuotation(quotation, 'Accepted')}
                        className="min-h-11 rounded-full bg-[#6B1E2B] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
                      >
                        Accept quotation
                      </button>
                      <button
                        type="button"
                        disabled={respondingQuotationId === quotation._id}
                        onClick={() => respondToQuotation(quotation, 'Rejected')}
                        className="min-h-11 rounded-full border border-[#6B1E2B] px-5 py-2 text-sm font-semibold text-[#6B1E2B] disabled:opacity-60"
                      >
                        Decline quotation
                      </button>
                    </div>
                  )}
                </article>
              ))}
              <PaginationControls
                page={quotationsPage}
                totalPages={quotationsTotalPages}
                totalItems={totalQuotations}
                pageSize={quotationsPageSize}
                onPageChange={setQuotationsPage}
                className="mt-6"
              />
            </div>
          )}
        </div>
      )}

      {/* Bookings Tab */}
      {activeTab === 'bookings' && (
        <div>
          {bookings.length === 0 ? (
            <div className="rounded-2xl border border-[#F0D7AF] bg-[#FFFDF9] p-8 shadow-soft">
              <p className="text-[#604d47]">No bookings yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <article key={booking._id} className="rounded-2xl border border-[#8FB339] bg-[#F7FAF0] p-6 shadow-soft">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-[0.18em] text-[#2F4F1E]">{booking.bookingId}</div>
                      <h2 className="mt-1 font-[Playfair_Display] text-2xl text-[#2F4F1E]">Booking Status: {booking.status}</h2>
                    </div>
                    <p className="text-xl font-bold text-[#2F4F1E]">
                      ₹{Number(booking.finalAmount || 0).toLocaleString('en-IN')}
                    </p>
                  </div>
                  {booking.location && <p className="mt-2 text-sm text-[#4E6E34]">Location: {booking.location}</p>}
                  {booking.eventDates?.start && (
                    <p className="mt-1 text-sm text-[#4E6E34]">
                      Dates: {formatRequestDateRange(booking.eventDates.start, booking.eventDates.end)}
                    </p>
                  )}
                  {booking.items?.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#4E6E34]">Reserved Items</p>
                      <ul className="mt-1 space-y-1 text-sm text-[#2F4F1E]">
                        {booking.items.map((item, idx) => (
                          <li key={`${item.itemName}-${idx}`}>{item.itemName} × {item.quantity}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </article>
              ))}
              <PaginationControls
                page={bookingsPage}
                totalPages={bookingsTotalPages}
                totalItems={totalBookings}
                pageSize={bookingsPageSize}
                onPageChange={setBookingsPage}
                className="mt-6"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
