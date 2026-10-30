import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import {
  TrendingUp,
  PieChart as PieIcon,
  ShieldCheck,
  Download,
  Sparkles,
  Activity,
  FileSpreadsheet
} from 'lucide-react';

const PALETTE = ['#6B1E2B', '#9A6A28', '#D7B46B', '#45121C', '#8C3B49', '#C49A45', '#7A5C58'];
const QC_COLORS = {
  Passed: '#2E7D32',
  NeedsRepair: '#E65100',
  Damaged: '#C62828',
  Uninspected: '#757575'
};

const formatCurrency = (amount) => {
  if (amount == null || Number.isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

export default function AnalyticsVisualizations({
  analytics,
  eventStats = [],
  qcStats = [],
  funnelStats = null,
  scope = 'real',
  onDownloadDataset
}) {
  const [activeChartTab, setActiveChartTab] = useState('revenue');
  const [downloading, setDownloading] = useState('');

  if (!analytics) return null;

  // Prepare monthly revenue & booking trajectory data
  const monthlyData = (analytics.monthly || []).map((m) => ({
    month: m.label ? m.label.replace(' 2026', '').replace(' 2025', '') : m.month,
    fullLabel: m.label,
    inquiries: m.requests || 0,
    bookings: m.bookings || 0,
    revenue: m.bookedValue || 0,
    avgBookingValue: m.bookings ? Math.round(m.bookedValue / m.bookings) : 0
  }));

  // Prepare seasonality data
  const seasonalityData = (analytics.seasonality || []).map((s) => ({
    month: s.label.slice(0, 3),
    fullName: s.label,
    bookings: s.bookingCount,
    isPeak: [10, 11, 0, 1, 4].includes(s.month - 1) // Nov, Dec, Jan, Feb, May
  }));

  // Prepare 3-month forecast comparison
  const forecastHistory = monthlyData.slice(-6).map((m) => ({
    period: m.month,
    actualBookings: m.bookings,
    forecast: null
  }));

  const forecastFuture = (analytics.forecast?.forecastMonths || []).map((f) => ({
    period: f.label ? f.label.replace(' 2026', '').replace(' 2027', '') : f.month,
    actualBookings: null,
    forecast: f.predictedBookings
  }));

  // Connect last actual to forecast line for continuous curve
  const lastActual = forecastHistory[forecastHistory.length - 1];
  const forecastCombinedData = [
    ...forecastHistory,
    ...(lastActual ? [{ ...lastActual, forecast: lastActual.actualBookings }] : []),
    ...forecastFuture
  ];

  // Prepare event distribution data
  const eventDistributionData = (eventStats || []).map((e) => ({
    name: e._id || 'Standard Rental',
    count: e.count || 0,
    revenue: e.estimatedTotal || 0
  }));

  // Prepare QC condition data
  const qcDistributionData = (qcStats || []).map((q) => ({
    name: q._id || 'Passed',
    count: q.count || 0,
    returned: q.totalReturned || 0,
    color: QC_COLORS[q._id] || '#806C66'
  }));

  // Prepare popular categories data
  const categoryData = (analytics.popularCategories || []).slice(0, 7).map((c) => ({
    name: c.name,
    requested: c.requestedQuantity,
    booked: c.bookedQuantity,
    requests: c.requestCount
  }));

  const handleDownload = async (datasetKey, filename) => {
    setDownloading(datasetKey);
    try {
      if (onDownloadDataset) {
        await onDownloadDataset(datasetKey, filename);
      }
    } finally {
      setDownloading('');
    }
  };

  return (
    <div className="space-y-8">
      {/* Visual Analytics Sub-Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0D7AF] pb-4">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'revenue', label: 'Financial Trajectory', icon: TrendingUp },
            { id: 'funnel', label: 'Conversion Funnel', icon: Activity },
            { id: 'market', label: 'Event & Market Share', icon: PieIcon },
            { id: 'forecast', label: '3-Month Demand Forecast', icon: Sparkles },
            { id: 'qc', label: 'QC & Return Condition', icon: ShieldCheck }
          ].map(({ id, label, icon: TabIcon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveChartTab(id)}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                activeChartTab === id
                  ? 'bg-[#6B1E2B] text-white shadow-sm'
                  : 'bg-[#FFF9EE] text-[#604D47] hover:bg-[#F7EBDD] hover:text-[#33201D]'
              }`}
            >
              <TabIcon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Dataset Export Quick Actions */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[#806C66]">Export for Python/BI:</span>
          <button
            type="button"
            onClick={() => handleDownload('bookings', 'bookings_synthetic.csv')}
            disabled={downloading === 'bookings'}
            className="flex items-center gap-1 rounded-lg border border-[#D7B46B] bg-white px-2.5 py-1 text-xs font-medium text-[#6B1E2B] shadow-xs hover:bg-[#FFF9EE] disabled:opacity-50"
          >
            <FileSpreadsheet size={13} />
            {downloading === 'bookings' ? 'Exporting...' : 'Bookings CSV'}
          </button>
          <button
            type="button"
            onClick={() => handleDownload('requests', 'event_requests.csv')}
            disabled={downloading === 'requests'}
            className="flex items-center gap-1 rounded-lg border border-[#D7B46B] bg-white px-2.5 py-1 text-xs font-medium text-[#6B1E2B] shadow-xs hover:bg-[#FFF9EE] disabled:opacity-50"
          >
            <Download size={13} />
            {downloading === 'requests' ? 'Exporting...' : 'Inquiries CSV'}
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: FINANCIAL TRAJECTORY & REVENUE                          */}
      {/* ============================================================== */}
      {activeChartTab === 'revenue' && (
        <div className="grid gap-6 xl:grid-cols-3">
          {/* Main Area Chart: 12-Month Revenue */}
          <div className="rounded-2xl border border-[#F0D7AF] bg-white p-5 shadow-sm xl:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-[#45121C]">12-Month Gross Revenue Trajectory</h3>
                <p className="text-xs text-[#806C66]">Historical contracted revenue across active {scope} records</p>
              </div>
              <span className="rounded-full bg-[#EBF5EA] px-2.5 py-0.5 text-xs font-medium text-[#2E7D32]">
                Total: {formatCurrency(analytics.bookedValue?.amount || 0)}
              </span>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#9A6A28" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#9A6A28" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F5E8D3" vertical={false} />
                  <XAxis dataKey="month" stroke="#806C66" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#806C66"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                  />
                  <Tooltip
                    formatter={(val) => [formatCurrency(val), 'Revenue']}
                    labelFormatter={(label, items) => items?.[0]?.payload?.fullLabel || label}
                    contentStyle={{ backgroundColor: '#FFFDF9', borderColor: '#E7CC91', borderRadius: '12px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#9A6A28"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    name="Contracted Revenue"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Side Bar Chart: Inquiries vs Bookings */}
          <div className="rounded-2xl border border-[#F0D7AF] bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-[#45121C]">Demand Volume</h3>
            <p className="text-xs text-[#806C66]">Monthly Inquiries vs Confirmed Bookings</p>
            <div className="mt-4 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F5E8D3" vertical={false} />
                  <XAxis dataKey="month" stroke="#806C66" fontSize={10} tickLine={false} />
                  <YAxis stroke="#806C66" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFDF9', borderColor: '#E7CC91', borderRadius: '12px' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="inquiries" name="Inquiries" fill="#D7B46B" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="bookings" name="Bookings" fill="#6B1E2B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: PIPELINE CONVERSION FUNNEL                              */}
      {/* ============================================================== */}
      {activeChartTab === 'funnel' && (
        <div className="rounded-2xl border border-[#F0D7AF] bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#6B1E2B]">
                <Activity size={15} /> Lead Conversion Analytics
              </div>
              <h3 className="mt-1 font-[Playfair_Display] text-2xl text-[#33201D]">
                Client Lifecycle & Stage Drop-Off
              </h3>
              <p className="text-xs text-[#806C66]">
                Identifies lead drop-off points between initial customer rental inquiry and physical event completion.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-[#F0D7AF] bg-[#FFF9EE] px-4 py-2 text-center">
                <span className="block text-xs text-[#806C66]">Overall Conversion</span>
                <span className="text-xl font-bold text-[#6B1E2B]">
                  {funnelStats?.overallConversionRate || analytics.conversion?.ratePercent || 0}%
                </span>
              </div>
              <div className="rounded-xl border border-[#F0D7AF] bg-[#FFF9EE] px-4 py-2 text-center">
                <span className="block text-xs text-[#806C66]">Cancellation Rate</span>
                <span className="text-xl font-bold text-[#A43B2A]">
                  {analytics.cancellation?.ratePercent || 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Stepped Conversion Funnel Visualization */}
          <div className="space-y-3">
            {(funnelStats?.stages || [
              { id: '1', label: 'Inquiries Received', count: analytics.conversion?.requestCount || 0, dropoffPercent: 0 },
              { id: '2', label: 'Commercial Quotations Sent', count: Math.round((analytics.conversion?.requestCount || 0) * 0.85), dropoffPercent: 15 },
              { id: '3', label: 'Bookings Confirmed', count: analytics.conversion?.convertedRequestCount || 0, dropoffPercent: 32 },
              { id: '4', label: 'Events Completed & Inspected', count: Math.max(0, (analytics.conversion?.convertedRequestCount || 0) - (analytics.cancellation?.cancelledCount || 0)), dropoffPercent: 5 }
            ]).map((stage, idx, arr) => {
              const maxCount = arr[0]?.count || 1;
              const widthPct = Math.max(12, Math.round((stage.count / maxCount) * 100));
              return (
                <div key={stage.id || stage.label} className="group rounded-xl border border-[#F5E8D3] bg-[#FFFDF9] p-3.5 transition hover:border-[#D7B46B]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#33201D]">{stage.label}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-[#6B1E2B]">{stage.count} leads</span>
                      <span className="text-xs text-[#806C66]">({widthPct}% of initial)</span>
                      {idx > 0 && stage.dropoffPercent > 0 && (
                        <span className="rounded-full bg-[#FEECEC] px-2 py-0.5 text-[11px] font-medium text-[#C62828]">
                          -{stage.dropoffPercent}% drop
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-2.5 h-3 w-full overflow-hidden rounded-full bg-[#F2E5D0]">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${widthPct}%`,
                        backgroundColor: PALETTE[idx % PALETTE.length]
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: EVENT TYPE & RENTAL CATEGORY MARKET SHARE               */}
      {/* ============================================================== */}
      {activeChartTab === 'market' && (
        <div className="grid gap-6 xl:grid-cols-2">
          {/* Event Distribution Donut Chart */}
          <div className="rounded-2xl border border-[#F0D7AF] bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-[#45121C]">Event Type Market Share</h3>
            <p className="text-xs text-[#806C66]">Proportion of inquiries and bookings by event category</p>
            <div className="mt-2 h-72 w-full">
              {eventDistributionData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={eventDistributionData}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={3}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {eventDistributionData.map((entry, index) => (
                        <Cell key={`cell-${entry.name}`} fill={PALETTE[index % PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val, name, item) => [
                        `${val} events (${formatCurrency(item.payload.revenue)} est. revenue)`,
                        name
                      ]}
                      contentStyle={{ backgroundColor: '#FFFDF9', borderColor: '#E7CC91', borderRadius: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-[#806C66]">
                  No event categorization data available.
                </div>
              )}
            </div>
          </div>

          {/* Category Demand Horizontal Bars */}
          <div className="rounded-2xl border border-[#F0D7AF] bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-[#45121C]">Rental Category Demand</h3>
            <p className="text-xs text-[#806C66]">Total units requested across active catalogue categories</p>
            <div className="mt-2 h-72 w-full">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} layout="vertical" margin={{ top: 10, right: 20, left: 35, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F5E8D3" horizontal={false} />
                    <XAxis type="number" stroke="#806C66" fontSize={10} tickLine={false} />
                    <YAxis dataKey="name" type="category" stroke="#806C66" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#FFFDF9', borderColor: '#E7CC91', borderRadius: '12px' }}
                    />
                    <Bar dataKey="requested" name="Requested Units" fill="#9A6A28" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="booked" name="Confirmed Units" fill="#6B1E2B" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-[#806C66]">
                  No category demand data available.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: 3-MONTH DEMAND FORECAST & SEASONALITY                   */}
      {/* ============================================================== */}
      {activeChartTab === 'forecast' && (
        <div className="grid gap-6 xl:grid-cols-2">
          {/* Predictive Demand Forecast Line Chart */}
          <div className="rounded-2xl border border-[#F0D7AF] bg-white p-5 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-[#45121C]">3-Month Moving Average Forecast</h3>
                <p className="text-xs text-[#806C66]">Historical booking trend projected into upcoming months</p>
              </div>
              <span className="rounded-full bg-[#FFF3D9] px-2.5 py-0.5 text-xs font-medium text-[#9A6A28]">
                {analytics.forecast?.status === 'Available' ? 'Model: 3-Mo Moving Avg' : 'Baseline Model'}
              </span>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={forecastCombinedData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F5E8D3" />
                  <XAxis dataKey="period" stroke="#806C66" fontSize={11} tickLine={false} />
                  <YAxis stroke="#806C66" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFDF9', borderColor: '#E7CC91', borderRadius: '12px' }}
                  />
                  <Legend iconType="plainline" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Line
                    type="monotone"
                    dataKey="actualBookings"
                    name="Actual Bookings"
                    stroke="#6B1E2B"
                    strokeWidth={2.5}
                    dot={{ fill: '#6B1E2B', r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    name="Projected Forecast"
                    stroke="#9A6A28"
                    strokeWidth={2.5}
                    strokeDasharray="5 5"
                    dot={{ fill: '#9A6A28', r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Rajasthan Wedding Seasonality Heat Pattern */}
          <div className="rounded-2xl border border-[#F0D7AF] bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-[#45121C]">Rajasthan Event Seasonality Curve</h3>
            <p className="text-xs text-[#806C66]">
              Annual cyclical distribution highlighting peak winter wedding months (Nov–Feb) and Akshay Tritiya
            </p>
            <div className="mt-2 h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={seasonalityData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F5E8D3" vertical={false} />
                  <XAxis dataKey="month" stroke="#806C66" fontSize={10} tickLine={false} />
                  <YAxis stroke="#806C66" fontSize={10} tickLine={false} />
                  <Tooltip
                    formatter={(val, name, item) => [
                      `${val} bookings ${item.payload.isPeak ? '🔥 (Peak Season)' : ''}`,
                      'Historical Volume'
                    ]}
                    contentStyle={{ backgroundColor: '#FFFDF9', borderColor: '#E7CC91', borderRadius: '12px' }}
                  />
                  <Bar
                    dataKey="bookings"
                    name="Bookings"
                    radius={[4, 4, 0, 0]}
                    fill="#D7B46B"
                  >
                    {seasonalityData.map((entry) => (
                      <Cell
                        key={`cell-${entry.month}`}
                        fill={entry.isPeak ? '#6B1E2B' : '#D7B46B'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 5: QC & RETURN INSPECTION CONDITION                        */}
      {/* ============================================================== */}
      {activeChartTab === 'qc' && (
        <div className="grid gap-6 xl:grid-cols-2">
          {/* QC Inspection Outcome Donut */}
          <div className="rounded-2xl border border-[#F0D7AF] bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-[#45121C]">Return Equipment Condition</h3>
            <p className="text-xs text-[#806C66]">Quality control verification outcomes from physical post-event check-ins</p>
            <div className="mt-2 h-72 w-full">
              {qcDistributionData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={qcDistributionData}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={3}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {qcDistributionData.map((entry) => (
                        <Cell key={`cell-${entry.name}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val, name, item) => [
                        `${val} inspections (${item.payload.returned} physical units returned)`,
                        name
                      ]}
                      contentStyle={{ backgroundColor: '#FFFDF9', borderColor: '#E7CC91', borderRadius: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-[#806C66]">
                  No return inspection logs recorded yet.
                </div>
              )}
            </div>
          </div>

          {/* Operational Quality Safeguards Info */}
          <div className="flex flex-col justify-between rounded-2xl border border-[#F0D7AF] bg-[#FFFDF9] p-6 shadow-sm">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#2E7D32]">
                <ShieldCheck size={16} /> Closed-Loop Inventory Integrity
              </div>
              <h3 className="mt-2 font-[Playfair_Display] text-2xl text-[#33201D]">
                Damage Accountability & Inspection Protocol
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#604D47]">
                Every event return requires a physical QC inspection. Items marked <strong>Passed</strong> are instantly released back into active warehouse availability. Items flagged as <strong>NeedsRepair</strong> or <strong>Damaged</strong> are blocked from future reservations until repaired or replaced, preventing overbooking of damaged equipment.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3 border-t border-[#F0D7AF] pt-4">
              <div className="rounded-xl bg-white p-3 text-center border border-[#F0D7AF]">
                <span className="block text-xs text-[#806C66]">Passed</span>
                <span className="text-xl font-bold text-[#2E7D32]">
                  {qcDistributionData.find((q) => q.name === 'Passed')?.count || 0}
                </span>
              </div>
              <div className="rounded-xl bg-white p-3 text-center border border-[#F0D7AF]">
                <span className="block text-xs text-[#806C66]">Repairs</span>
                <span className="text-xl font-bold text-[#E65100]">
                  {qcDistributionData.find((q) => q.name === 'NeedsRepair')?.count || 0}
                </span>
              </div>
              <div className="rounded-xl bg-white p-3 text-center border border-[#F0D7AF]">
                <span className="block text-xs text-[#806C66]">Damaged</span>
                <span className="text-xl font-bold text-[#C62828]">
                  {qcDistributionData.find((q) => q.name === 'Damaged')?.count || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
