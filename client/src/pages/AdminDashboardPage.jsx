import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { CalendarDays, ClipboardList, IndianRupee, UsersRound } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const requestStatuses = ['Submitted', 'Under Review', 'Quotation Sent', 'Confirmed', 'Completed', 'Rejected', 'Cancelled'];

const formatCurrency = (amount = 0) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date not set';

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [overview, setOverview] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingRequestId, setUpdatingRequestId] = useState('');

  useEffect(() => {
    if (authLoading || !user || user.role !== 'admin') return undefined;

    let cancelled = false;
    const loadDashboard = async () => {
      setLoading(true);
      setError('');
      try {
        const [overviewResponse, requestsResponse] = await Promise.all([
          api.get('/admin/analytics/overview'),
          api.get('/admin/requests')
        ]);
        if (!cancelled) {
          setOverview(overviewResponse.data);
          setRequests(requestsResponse.data);
        }
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Dashboard data could not be loaded.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadDashboard();
    return () => { cancelled = true; };
  }, [authLoading, user]);

  const updateRequestStatus = async (request, status) => {
    setUpdatingRequestId(request._id);
    setError('');
    try {
      const { data } = await api.put(`/admin/requests/${request._id}/status`, { status });
      setRequests((current) => current.map((entry) => entry._id === request._id ? { ...entry, ...data } : entry));
      setOverview((current) => current && ({
        ...current,
        pendingRequests: Math.max(0, current.pendingRequests + (request.status === 'Submitted' ? -1 : 0) + (status === 'Submitted' ? 1 : 0))
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Request status could not be updated.');
    } finally {
      setUpdatingRequestId('');
    }
  };

  if (authLoading) {
    return <div className="mx-auto max-w-7xl px-4 py-12 text-[#806C66] sm:px-6 lg:px-8">Loading dashboard...</div>;
  }
  if (!user || user.role !== 'admin') return <Navigate to="/admin-login" replace />;

  const metrics = [
    { label: 'Event requests', value: overview?.totalRequests ?? 0, icon: ClipboardList },
    { label: 'Awaiting review', value: overview?.pendingRequests ?? 0, icon: CalendarDays },
    { label: 'Customers', value: overview?.totalCustomers ?? 0, icon: UsersRound },
    { label: 'Confirmed revenue', value: formatCurrency(overview?.revenue), icon: IndianRupee }
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-col gap-4 border-b border-[#E7CC91] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6B1E2B]">Operations</div>
          <h1 className="mt-2 font-[Playfair_Display] text-4xl text-[#33201D] sm:text-5xl">Admin dashboard</h1>
          <p className="mt-2 text-sm text-[#806C66]">Welcome, {user.name}</p>
        </div>
        <div className="text-sm text-[#806C66]">{new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })}</div>
      </header>

      {error && <div role="alert" className="mb-6 border-l-4 border-[#9E3D36] bg-[#FBEFEC] px-4 py-3 text-sm text-[#702721]">{error}</div>}

      <section aria-label="Business overview" className="mb-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon }) => (
          <div key={label} className="border border-[#E7CC91] bg-white p-5">
            <div className="flex items-center justify-between text-sm text-[#806C66]">
              <span>{label}</span>
              <Icon size={18} className="text-[#6B1E2B]" />
            </div>
            <div className="mt-4 text-3xl font-semibold text-[#33201D]">{loading ? '...' : value}</div>
          </div>
        ))}
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6B1E2B]">Customer enquiries</div>
            <h2 className="mt-1 font-[Playfair_Display] text-3xl text-[#33201D]">Event requests</h2>
          </div>
          <span className="text-sm text-[#806C66]">{requests.length} total</span>
        </div>

        <div className="divide-y divide-[#F0D7AF] border-y border-[#F0D7AF]">
          {loading ? (
            <div className="py-8 text-sm text-[#806C66]">Loading event requests...</div>
          ) : requests.length === 0 ? (
            <div className="py-8 text-sm text-[#806C66]">No event requests yet.</div>
          ) : requests.map((request) => (
            <article key={request._id} className="grid gap-4 py-5 md:grid-cols-[minmax(0,1fr)_minmax(180px,0.7fr)_180px] md:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[#6B1E2B]">{request.requestId}</span>
                  <span className="font-semibold text-[#33201D]">{request.eventType}</span>
                </div>
                <div className="mt-1 text-sm text-[#806C66]">
                  {request.user?.name || 'Customer'} · {request.user?.phone || request.user?.email || 'No contact details'}
                </div>
              </div>
              <div className="text-sm text-[#806C66]">
                <div>{formatDate(request.startDate)} – {formatDate(request.endDate)}</div>
                <div className="mt-1">{request.location} · {request.guestCount} guests</div>
              </div>
              <label className="sr-only" htmlFor={`status-${request._id}`}>Status for {request.requestId}</label>
              <select
                id={`status-${request._id}`}
                value={request.status}
                disabled={updatingRequestId === request._id}
                onChange={(event) => updateRequestStatus(request, event.target.value)}
                className="w-full rounded-md border border-[#D7B46B] bg-white px-3 py-2 text-sm text-[#33201D] disabled:opacity-60"
              >
                {requestStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}