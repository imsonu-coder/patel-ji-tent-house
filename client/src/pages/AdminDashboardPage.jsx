import AnalyticsVisualizations from '../components/AnalyticsVisualizations';
import { useEffect, useState, useMemo } from 'react';
import PaginationControls from '../components/PaginationControls';
import { Navigate } from 'react-router-dom';
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Database,
  FolderPlus,
  Image as ImageIcon,
  IndianRupee,
  Layers,
  PackageCheck,
  Pencil,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Truck,
  UsersRound,
  Wrench,
  X
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import QuotationComposer from '../components/QuotationComposer';

const requestStatusTransitions = {
  Submitted: ['Under Review', 'Rejected', 'Cancelled'],
  'Under Review': ['Rejected', 'Cancelled']
};
const requestStatusLabels = {
  'Quotation Accepted': 'Quotation accepted',
  'Quotation Draft': 'Quotation draft',
  'Quotation Expired': 'Quotation expired',
  'Quotation Sent': 'Quotation sent'
};

const galleryCategories = ['Weddings', 'Tents', 'Decoration', 'Lighting', 'Furniture', 'Other'];
const priceUnits = ['Per Day', 'Per Piece', 'Per Unit', 'Per Setup', 'Fixed', 'Other'];

const formatCurrency = (amount = 0) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

const todayFormatted = new Date().toLocaleDateString('en-IN', { dateStyle: 'full' });

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date not set';

const getDateInputValue = () => {
  const date = new Date();
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
};

function AnalyticsBar({ label, value, maxValue, color = 'bg-[#6B1E2B]' }) {
  const width = maxValue > 0 ? Math.max(value > 0 ? 2 : 0, (value / maxValue) * 100) : 0;
  return (
    <div className="grid grid-cols-[minmax(4.5rem,7rem)_minmax(0,1fr)_2.5rem] items-center gap-2 text-xs">
      <span className="truncate text-[#604D47]">{label}</span>
      <div className="h-2.5 overflow-hidden rounded-full bg-[#F0E7D7]" aria-hidden="true">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${width}%` }} />
      </div>
      <span className="text-right tabular-nums text-[#33201D]">{value}</span>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();

  // Navigation tab state
  const [activeTab, setActiveTab] = useState('overview');

  // Scope filter: 'all' (combined demo + real), 'synthetic' (demo dataset), 'real' (production)
  const [scope, setScope] = useState('all');

  // Global alerts
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Overview metrics state
  const [overview, setOverview] = useState(null);

  // Event Requests state
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestsError, setRequestsError] = useState('');
  const [requestsPage, setRequestsPage] = useState(1);
  const [requestsPageSize] = useState(10);
  const [requestsTotal, setRequestsTotal] = useState(0);
  const [requestsTotalPages, setRequestsTotalPages] = useState(1);
  const [requestStatusFilter, setRequestStatusFilter] = useState('');
  const [requestSearch, setRequestSearch] = useState('');
  const [updatingRequestId, setUpdatingRequestId] = useState('');
  const [quotingRequest, setQuotingRequest] = useState(null);

  // Quotations state
  const [quotations, setQuotations] = useState([]);
  const [quotationsLoading, setQuotationsLoading] = useState(true);
  const [quotationsError, setQuotationsError] = useState('');
  const [quotationsPage, setQuotationsPage] = useState(1);
  const [quotationsPageSize] = useState(10);
  const [quotationsTotal, setQuotationsTotal] = useState(0);
  const [quotationsTotalPages, setQuotationsTotalPages] = useState(1);
  const [quotationStatusFilter, setQuotationStatusFilter] = useState('');
  const [creatingBookingId, setCreatingBookingId] = useState('');

  // Bookings state
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsError, setBookingsError] = useState('');
  const [bookingsPage, setBookingsPage] = useState(1);
  const [bookingsPageSize] = useState(10);
  const [bookingsTotal, setBookingsTotal] = useState(0);
  const [bookingsTotalPages, setBookingsTotalPages] = useState(1);
  const [bookingStatusFilter, setBookingStatusFilter] = useState('');
  const [updatingBookingId, setUpdatingBookingId] = useState('');

  // Inventory & Shortage Radar state
  const [inventory, setInventory] = useState(null);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [inventoryError, setInventoryError] = useState('');
  const [inventoryStart, setInventoryStart] = useState(getDateInputValue);
  const [inventoryEnd, setInventoryEnd] = useState(getDateInputValue);
  const [inventoryPage, setInventoryPage] = useState(1);
  const [inventoryPageSize] = useState(10);

  // Analytics & Forecast state
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState('');
  const [eventStats, setEventStats] = useState([]);
  const [qcStats, setQcStats] = useState([]);
  const [funnelStats, setFunnelStats] = useState(null);

  // Suppliers state
  const [suppliers, setSuppliers] = useState([]);
  const [suppliersLoading, setSuppliersLoading] = useState(true);
  const [suppliersError, setSuppliersError] = useState('');
  const [suppliersPage, setSuppliersPage] = useState(1);
  const [suppliersPageSize] = useState(10);
  const [suppliersTotal, setSuppliersTotal] = useState(0);
  const [suppliersTotalPages, setSuppliersTotalPages] = useState(1);

  // Inspections & QC state
  const [inspections, setInspections] = useState([]);
  const [inspectionsLoading, setInspectionsLoading] = useState(false);
  const [inspectionsPage, setInspectionsPage] = useState(1);
  const [inspectionsPageSize] = useState(10);
  const [inspectionsTotal, setInspectionsTotal] = useState(0);
  const [inspectionsTotalPages, setInspectionsTotalPages] = useState(1);

  // ==========================================
  // NEW: CLIENT-SIDE MANAGEMENT (ITEMS & GALLERY)
  // ==========================================
  // Catalog items management
  const [catalogItems, setCatalogItems] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogPageSize] = useState(12);
  const [catalogTotal, setCatalogTotal] = useState(0);
  const [catalogTotalPages, setCatalogTotalPages] = useState(1);
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState('All');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemSaving, setItemSaving] = useState(false);
  const [itemForm, setItemForm] = useState({
    name: '',
    category: '',
    description: '',
    basePrice: '',
    priceUnit: 'Per Day',
    ownStock: '',
    imageUrl: '',
    status: 'active'
  });

  // Gallery management
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryPage, setGalleryPage] = useState(1);
  const [galleryPageSize] = useState(12);
  const [galleryTotal, setGalleryTotal] = useState(0);
  const [galleryTotalPages, setGalleryTotalPages] = useState(1);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [gallerySaving, setGallerySaving] = useState(false);
  const [galleryForm, setGalleryForm] = useState({
    title: '',
    category: 'Weddings',
    imageUrl: '',
    description: '',
    status: 'active'
  });

  // Categories list
  const [categories, setCategories] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categorySaving, setCategorySaving] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    status: 'active'
  });

  // Clear success notification after 4 seconds
  useEffect(() => {
    if (!successMessage) return undefined;
    const timer = setTimeout(() => setSuccessMessage(''), 4000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  const [categoriesRefresh, setCategoriesRefresh] = useState(0);
  const [catalogRefresh, setCatalogRefresh] = useState(0);
  const [galleryRefresh, setGalleryRefresh] = useState(0);

  // Load Categories for dropdowns
  useEffect(() => {
    if (authLoading || !user || user.role !== 'admin') return undefined;
    let cancelled = false;
    const loadCategories = async () => {
      try {
        const response = await api.get('/categories', { params: { pageSize: 50 } });
        if (!cancelled) {
          setCategories(response.data);
          if (response.data.length > 0) {
            setItemForm((prev) => (!prev.category ? { ...prev, category: response.data[0]._id } : prev));
          }
        }
      } catch (err) {
        if (!cancelled) console.error('Failed to load categories:', err);
      }
    };
    loadCategories();
    return () => { cancelled = true; };
  }, [authLoading, user, categoriesRefresh]);

  // Load Overview KPIs
  useEffect(() => {
    if (authLoading || !user || user.role !== 'admin' || activeTab !== 'overview') return undefined;
    let cancelled = false;
    const loadOverview = async () => {
      try {
        const response = await api.get('/admin/analytics/overview', { params: { scope } });
        if (!cancelled) setOverview(response.data);
      } catch (err) {
        if (!cancelled) console.error(err);
      }
    };
    loadOverview();
    return () => { cancelled = true; };
  }, [authLoading, user, activeTab, scope]);

  // Load Event Requests
  useEffect(() => {
    if (authLoading || !user || user.role !== 'admin' || (activeTab !== 'requests' && !quotingRequest)) return undefined;
    let cancelled = false;
    const fetchRequests = async () => {
      setRequestsLoading(true);
      setRequestsError('');
      try {
        const params = { page: requestsPage, pageSize: requestsPageSize, scope };
        if (requestStatusFilter) params.status = requestStatusFilter;
        const response = await api.get('/admin/requests', { params });
        if (!cancelled) {
          const rawTotal = response.headers['x-total-count'];
          const rawPages = response.headers['x-total-pages'];
          const count = rawTotal ? Number(rawTotal) : response.data.length;
          setRequests(response.data);
          setRequestsTotal(count);
          setRequestsTotalPages(rawPages ? Number(rawPages) : Math.ceil(count / requestsPageSize) || 1);
        }
      } catch (err) {
        if (!cancelled) setRequestsError(err.response?.data?.message || 'Dashboard requests could not be loaded.');
      } finally {
        if (!cancelled) setRequestsLoading(false);
      }
    };
    fetchRequests();
    return () => { cancelled = true; };
  }, [authLoading, user, activeTab, quotingRequest, requestsPage, requestsPageSize, requestStatusFilter, scope]);

  // Load Quotations
  useEffect(() => {
    if (authLoading || !user || user.role !== 'admin' || activeTab !== 'quotations') return undefined;
    let cancelled = false;
    const fetchQuotations = async () => {
      setQuotationsLoading(true);
      setQuotationsError('');
      try {
        const params = { page: quotationsPage, pageSize: quotationsPageSize, scope };
        if (quotationStatusFilter) params.status = quotationStatusFilter;
        const response = await api.get('/admin/quotations', { params });
        if (!cancelled) {
          const rawTotal = response.headers['x-total-count'];
          const rawPages = response.headers['x-total-pages'];
          const count = rawTotal ? Number(rawTotal) : response.data.length;
          setQuotations(response.data);
          setQuotationsTotal(count);
          setQuotationsTotalPages(rawPages ? Number(rawPages) : Math.ceil(count / quotationsPageSize) || 1);
        }
      } catch (err) {
        if (!cancelled) setQuotationsError(err.response?.data?.message || 'Quotations could not be loaded.');
      } finally {
        if (!cancelled) setQuotationsLoading(false);
      }
    };
    fetchQuotations();
    return () => { cancelled = true; };
  }, [authLoading, user, activeTab, quotationsPage, quotationsPageSize, quotationStatusFilter, scope]);

  // Load Bookings
  useEffect(() => {
    if (authLoading || !user || user.role !== 'admin' || activeTab !== 'bookings') return undefined;
    let cancelled = false;
    const fetchBookings = async () => {
      setBookingsLoading(true);
      setBookingsError('');
      try {
        const params = { page: bookingsPage, pageSize: bookingsPageSize, scope };
        if (bookingStatusFilter) params.status = bookingStatusFilter;
        const response = await api.get('/admin/bookings', { params });
        if (!cancelled) {
          const rawTotal = response.headers['x-total-count'];
          const rawPages = response.headers['x-total-pages'];
          const count = rawTotal ? Number(rawTotal) : response.data.length;
          setBookings(response.data);
          setBookingsTotal(count);
          setBookingsTotalPages(rawPages ? Number(rawPages) : Math.ceil(count / bookingsPageSize) || 1);
        }
      } catch (err) {
        if (!cancelled) setBookingsError(err.response?.data?.message || 'Bookings could not be loaded.');
      } finally {
        if (!cancelled) setBookingsLoading(false);
      }
    };
    fetchBookings();
    return () => { cancelled = true; };
  }, [authLoading, user, activeTab, bookingsPage, bookingsPageSize, bookingStatusFilter, scope]);

  // Load Inventory
  useEffect(() => {
    if (authLoading || !user || user.role !== 'admin' || activeTab !== 'inventory' || !inventoryStart || !inventoryEnd) return undefined;
    if (inventoryEnd < inventoryStart) return undefined;
    let cancelled = false;
    const loadInventory = async () => {
      setInventoryLoading(true);
      setInventoryError('');
      try {
        const { data } = await api.get('/admin/inventory', {
          params: { start: inventoryStart, end: inventoryEnd, scope }
        });
        if (!cancelled) setInventory(data);
      } catch (err) {
        if (!cancelled) {
          setInventoryError(err.response?.data?.message || 'Inventory overview could not be loaded.');
        }
      } finally {
        if (!cancelled) setInventoryLoading(false);
      }
    };
    loadInventory();
    return () => { cancelled = true; };
  }, [authLoading, user, activeTab, inventoryStart, inventoryEnd, scope]);

  // Load Analytics
  useEffect(() => {
    if (authLoading || !user || user.role !== 'admin' || activeTab !== 'overview' || !inventoryStart || !inventoryEnd) return undefined;
    if (inventoryEnd < inventoryStart) return undefined;
    let cancelled = false;
    const loadAnalytics = async () => {
      setAnalyticsLoading(true);
      setAnalyticsError('');
      try {
        const { data } = await api.get('/admin/analytics/insights', {
          params: { start: inventoryStart, end: inventoryEnd, scope }
        });
        if (!cancelled) setAnalytics(data);
      } catch (err) {
        if (!cancelled) {
          setAnalyticsError(err.response?.data?.message || 'Analytics could not be loaded.');
        }
      } finally {
        if (!cancelled) setAnalyticsLoading(false);
      }
    };
    loadAnalytics();
    return () => { cancelled = true; };
  }, [authLoading, user, activeTab, inventoryStart, inventoryEnd, scope]);

  // Load Advanced Analytics (Events, QC, Funnel)
  useEffect(() => {
    if (authLoading || !user || user.role !== 'admin' || activeTab !== 'overview') return undefined;
    let cancelled = false;
    const loadAdvancedStats = async () => {
      try {
        const [eventsRes, qcRes, funnelRes] = await Promise.all([
          api.get('/admin/analytics/events', { params: { scope } }).catch(() => ({ data: [] })),
          api.get('/admin/analytics/qc', { params: { scope } }).catch(() => ({ data: [] })),
          api.get('/admin/analytics/funnel', { params: { scope } }).catch(() => ({ data: null }))
        ]);
        if (!cancelled) {
          setEventStats(eventsRes.data || []);
          setQcStats(qcRes.data || []);
          setFunnelStats(funnelRes.data || null);
        }
      } catch (err) {
        if (!cancelled) console.error(err);
      }
    };
    loadAdvancedStats();
    return () => { cancelled = true; };
  }, [authLoading, user, activeTab, scope]);

  const handleDownloadDataset = async (datasetKey, filename) => {
    try {
      const response = await api.get('/admin/analytics/export', {
        params: { dataset: datasetKey },
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename || `${datasetKey}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setSuccessMessage(`Dataset ${filename || datasetKey + '.csv'} downloaded successfully.`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to download dataset.');
    }
  };

  // Load Suppliers
  useEffect(() => {
    if (authLoading || !user || user.role !== 'admin' || activeTab !== 'suppliers') return undefined;
    let cancelled = false;
    const fetchSuppliers = async () => {
      setSuppliersLoading(true);
      setSuppliersError('');
      try {
        const response = await api.get('/admin/suppliers', {
          params: { page: suppliersPage, pageSize: suppliersPageSize, scope }
        });
        if (!cancelled) {
          const rawTotal = response.headers['x-total-count'];
          const rawPages = response.headers['x-total-pages'];
          const count = rawTotal ? Number(rawTotal) : response.data.length;
          setSuppliers(response.data);
          setSuppliersTotal(count);
          setSuppliersTotalPages(rawPages ? Number(rawPages) : Math.ceil(count / suppliersPageSize) || 1);
        }
      } catch (err) {
        if (!cancelled) setSuppliersError(err.response?.data?.message || 'Suppliers could not be loaded.');
      } finally {
        if (!cancelled) setSuppliersLoading(false);
      }
    };
    fetchSuppliers();
    return () => { cancelled = true; };
  }, [authLoading, user, activeTab, suppliersPage, suppliersPageSize, scope]);

  // Load Inspections
  useEffect(() => {
    if (authLoading || !user || user.role !== 'admin' || activeTab !== 'inspections') return undefined;
    let cancelled = false;
    const fetchInspections = async () => {
      setInspectionsLoading(true);
      try {
        const response = await api.get('/admin/inventory/inspections', {
          params: { page: inspectionsPage, pageSize: inspectionsPageSize, scope }
        });
        if (!cancelled) {
          const rawTotal = response.headers['x-total-count'];
          const rawPages = response.headers['x-total-pages'];
          const count = rawTotal ? Number(rawTotal) : response.data.length;
          setInspections(response.data);
          setInspectionsTotal(count);
          setInspectionsTotalPages(rawPages ? Number(rawPages) : Math.ceil(count / inspectionsPageSize) || 1);
        }
      } catch (err) {
        if (!cancelled) console.error(err);
      } finally {
        if (!cancelled) setInspectionsLoading(false);
      }
    };
    fetchInspections();
    return () => { cancelled = true; };
  }, [authLoading, user, activeTab, inspectionsPage, inspectionsPageSize, scope]);

  // Load Catalog Items for Admin Management
  useEffect(() => {
    if (authLoading || !user || user.role !== 'admin' || activeTab !== 'items') return undefined;
    let cancelled = false;
    const loadCatalogItems = async () => {
      setCatalogLoading(true);
      try {
        const params = {
          page: catalogPage,
          pageSize: catalogPageSize,
          status: 'all',
          scope
        };
        if (catalogCategoryFilter !== 'All') params.category = catalogCategoryFilter;
        if (catalogSearch.trim()) params.search = catalogSearch.trim();

        const response = await api.get('/items', { params });
        if (!cancelled) {
          const rawTotal = response.headers['x-total-count'];
          const rawPages = response.headers['x-total-pages'];
          const count = rawTotal ? Number(rawTotal) : response.data.length;
          setCatalogItems(response.data);
          setCatalogTotal(count);
          setCatalogTotalPages(rawPages ? Number(rawPages) : Math.ceil(count / catalogPageSize) || 1);
        }
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setError('Failed to load catalog items.');
        }
      } finally {
        if (!cancelled) setCatalogLoading(false);
      }
    };
    loadCatalogItems();
    return () => { cancelled = true; };
  }, [authLoading, user, activeTab, catalogPage, catalogPageSize, catalogCategoryFilter, catalogSearch, scope, catalogRefresh]);

  // Load Gallery Images for Admin Management
  useEffect(() => {
    if (authLoading || !user || user.role !== 'admin' || activeTab !== 'gallery') return undefined;
    let cancelled = false;
    const loadGallery = async () => {
      setGalleryLoading(true);
      try {
        const response = await api.get('/gallery', {
          params: { page: galleryPage, pageSize: galleryPageSize, status: 'all' }
        });
        if (!cancelled) {
          const rawTotal = response.headers['x-total-count'];
          const rawPages = response.headers['x-total-pages'];
          const count = rawTotal ? Number(rawTotal) : response.data.length;
          setGalleryImages(response.data);
          setGalleryTotal(count);
          setGalleryTotalPages(rawPages ? Number(rawPages) : Math.ceil(count / galleryPageSize) || 1);
        }
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setError('Failed to load gallery images.');
        }
      } finally {
        if (!cancelled) setGalleryLoading(false);
      }
    };
    loadGallery();
    return () => { cancelled = true; };
  }, [authLoading, user, activeTab, galleryPage, galleryPageSize, galleryRefresh]);

  // ==========================================
  // HANDLERS FOR ITEMS, GALLERY & CATEGORIES
  // ==========================================
  const handleOpenAddItem = () => {
    setEditingItem(null);
    setItemForm({
      name: '',
      category: categories[0]?._id || '',
      description: '',
      basePrice: '',
      priceUnit: 'Per Day',
      ownStock: '10',
      imageUrl: '',
      status: 'active'
    });
    setShowItemModal(true);
  };

  const handleOpenEditItem = (item) => {
    setEditingItem(item);
    setItemForm({
      name: item.name || '',
      category: item.category?._id || item.category || categories[0]?._id || '',
      description: item.description || '',
      basePrice: item.basePrice || '',
      priceUnit: item.priceUnit || 'Per Day',
      ownStock: item.ownStock ?? '',
      imageUrl: item.images?.[0] || '',
      status: item.status || 'active'
    });
    setShowItemModal(true);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    setItemSaving(true);
    setError('');
    try {
      const payload = {
        name: itemForm.name.trim(),
        category: itemForm.category,
        description: itemForm.description.trim(),
        basePrice: Number(itemForm.basePrice),
        priceUnit: itemForm.priceUnit,
        ownStock: Number(itemForm.ownStock),
        images: itemForm.imageUrl?.trim() ? [itemForm.imageUrl.trim()] : [],
        status: itemForm.status
      };

      if (editingItem) {
        await api.put(`/items/${editingItem._id}`, payload);
        setSuccessMessage(`Item "${payload.name}" updated successfully!`);
      } else {
        await api.post('/items', payload);
        setSuccessMessage(`New item "${payload.name}" added to rental catalogue!`);
      }
      setShowItemModal(false);
      setCatalogRefresh((c) => c + 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save item details.');
    } finally {
      setItemSaving(false);
    }
  };

  const handleDeleteItem = async (item) => {
    if (!window.confirm(`Are you sure you want to delete "${item.name}" from catalogue?`)) return;
    try {
      await api.delete(`/items/${item._id}`);
      setSuccessMessage(`Item "${item.name}" deleted successfully.`);
      setCatalogRefresh((c) => c + 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete item.');
    }
  };

  const handleSaveGallery = async (e) => {
    e.preventDefault();
    setGallerySaving(true);
    setError('');
    try {
      const payload = {
        title: galleryForm.title.trim(),
        category: galleryForm.category,
        imageUrl: galleryForm.imageUrl.trim(),
        description: galleryForm.description.trim(),
        status: galleryForm.status
      };
      await api.post('/gallery', payload);
      setSuccessMessage('New photo added to the event gallery showcase!');
      setShowGalleryModal(false);
      setGalleryForm({ title: '', category: 'Weddings', imageUrl: '', description: '', status: 'active' });
      setGalleryRefresh((g) => g + 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add gallery photo.');
    } finally {
      setGallerySaving(false);
    }
  };

  const handleDeleteGallery = async (image) => {
    if (!window.confirm(`Delete photo "${image.title}"?`)) return;
    try {
      await api.delete(`/gallery/${image._id}`);
      setSuccessMessage('Gallery photo removed successfully.');
      setGalleryRefresh((g) => g + 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete gallery photo.');
    }
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    setCategorySaving(true);
    setError('');
    try {
      const payload = {
        name: categoryForm.name.trim(),
        description: categoryForm.description.trim(),
        status: categoryForm.status
      };
      await api.post('/categories', payload);
      setSuccessMessage(`Category "${payload.name}" created successfully!`);
      setShowCategoryModal(false);
      setCategoryForm({ name: '', description: '', status: 'active' });
      setCategoriesRefresh((c) => c + 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create category.');
    } finally {
      setCategorySaving(false);
    }
  };

  const handleDeleteCategory = async (cat) => {
    if (!window.confirm(`Delete category "${cat.name}"?`)) return;
    try {
      await api.delete(`/categories/${cat._id}`);
      setSuccessMessage(`Category "${cat.name}" deleted.`);
      setCategoriesRefresh((c) => c + 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete category.');
    }
  };

  // Pipeline Actions
  const updateRequestStatus = async (request, status) => {
    if (!requestStatusTransitions[request.status]?.includes(status)) return;
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

  const handleQuotationCreated = (quotation) => {
    setQuotations((current) => [quotation, ...current]);
    setRequests((current) => current.map((request) => (
      request._id === quotation.request ? { ...request, status: 'Quotation Sent' } : request
    )));
    setQuotingRequest(null);
    setSuccessMessage('Quotation created and sent to customer!');
  };

  const createPendingBooking = async (quotation) => {
    setCreatingBookingId(quotation._id);
    setError('');
    try {
      const { data } = await api.post('/create', {
        request: quotation.request,
        quotation: quotation._id
      });
      setBookings((current) => (
        current.some((b) => b._id === data._id) ? current.map((b) => b._id === data._id ? data : b) : [data, ...current]
      ));
      setSuccessMessage('Pending booking created successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Pending booking could not be created.');
    } finally {
      setCreatingBookingId('');
    }
  };

  const cancelPendingBooking = async (booking) => {
    setUpdatingBookingId(booking._id);
    setError('');
    try {
      const { data } = await api.put(`/admin/bookings/${booking._id}/status`, { status: 'Cancelled' });
      setBookings((current) => current.map((entry) => entry._id === booking._id ? data : entry));
      setRequests((current) => current.map((r) => r._id === booking.request ? { ...r, status: 'Cancelled' } : r));
      setSuccessMessage('Booking cancelled.');
    } catch (err) {
      setError(err.response?.data?.message || 'Pending booking could not be cancelled.');
    } finally {
      setUpdatingBookingId('');
    }
  };

  const filteredRequests = useMemo(() => {
    if (!requestSearch.trim()) return requests;
    const q = requestSearch.toLowerCase();
    return requests.filter((r) =>
      r.requestId?.toLowerCase().includes(q)
      || r.user?.name?.toLowerCase().includes(q)
      || r.user?.phone?.includes(q)
      || r.location?.toLowerCase().includes(q)
      || r.eventType?.toLowerCase().includes(q)
    );
  }, [requests, requestSearch]);

  if (authLoading) {
    return <div className="mx-auto max-w-7xl px-4 py-12 text-[#806C66] sm:px-6 lg:px-8">Loading dashboard...</div>;
  }
  if (!user || user.role !== 'admin') return <Navigate to="/admin/login" replace />;

  const metrics = [
    { label: 'Event requests', value: overview?.totalRequests ?? 0, icon: ClipboardList, color: 'text-[#6B1E2B]' },
    { label: 'Awaiting review', value: overview?.pendingRequests ?? 0, icon: CalendarDays, color: 'text-[#C47D2B]' },
    { label: 'Quotations', value: quotationsTotal || quotations.length, icon: Layers, color: 'text-[#2D5A7B]' },
    { label: 'Bookings', value: bookingsTotal || bookings.length, icon: PackageCheck, color: 'text-[#2B6B40]' },
    { label: 'Customers', value: overview?.totalCustomers ?? 0, icon: UsersRound, color: 'text-[#7B3A68]' },
    { label: 'Confirmed value', value: formatCurrency(overview?.revenue), icon: IndianRupee, color: 'text-[#9A6A28]' }
  ];

  const invalidInventoryRange = Boolean(inventoryStart && inventoryEnd && inventoryEnd < inventoryStart);
  const paginatedInventoryItems = (inventory?.items || []).slice(
    (inventoryPage - 1) * inventoryPageSize,
    inventoryPage * inventoryPageSize
  );

  const tabs = [
    { id: 'overview', label: 'Overview & Analytics', icon: BarChart3 },
    { id: 'requests', label: 'Event Requests', icon: ClipboardList, badge: overview?.pendingRequests || 0 },
    { id: 'quotations', label: 'Quotations', icon: Layers },
    { id: 'bookings', label: 'Bookings & Gatekeeper', icon: PackageCheck },
    { id: 'items', label: 'Manage Catalogue & Items', icon: PackageCheck },
    { id: 'gallery', label: 'Manage Gallery Showcase', icon: ImageIcon },
    { id: 'categories', label: 'Categories', icon: FolderPlus },
    { id: 'inventory', label: 'Inventory & Shortage Radar', icon: PackageCheck },
    { id: 'suppliers', label: 'Supplier Network', icon: Truck },
    { id: 'inspections', label: 'QC & Inspections', icon: Wrench }
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Header & Scope Selector */}
      <header className="mb-6 flex flex-col gap-4 border-b border-[#E7CC91] pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6B1E2B]">Operations Center</span>
            <span className="rounded-full bg-[#E7CC91]/40 px-2.5 py-0.5 text-[11px] font-semibold text-[#45121C]">
              Patel Ji Tent House · Jaipur
            </span>
          </div>
          <h1 className="mt-1 font-[Playfair_Display] text-3xl text-[#33201D] sm:text-4xl">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-[#806C66]">Welcome back, <span className="font-semibold text-[#33201D]">{user.name}</span></p>
        </div>

        {/* Dataset Scope Toggle & Today Badge */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-xl border border-[#D7B46B] bg-white p-1 shadow-sm">
            <span className="flex items-center gap-1 px-2 text-xs font-medium text-[#806C66]">
              <Database size={13} aria-hidden="true" /> Scope:
            </span>
            {[
              { id: 'real', label: 'Production (Real)' },
              { id: 'synthetic', label: 'Synthetic Test' },
              { id: 'all', label: 'Combined View' }
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setScope(s.id)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  scope === s.id
                    ? 'bg-[#6B1E2B] text-white shadow-sm'
                    : 'text-[#604D47] hover:bg-[#F7EBDD]'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="text-xs font-medium text-[#806C66]">{todayFormatted}</div>
        </div>
      </header>

      {/* Notifications */}
      {error && (
        <div role="alert" className="mb-6 flex items-center justify-between rounded-xl border-l-4 border-[#9E3D36] bg-[#FBEFEC] px-4 py-3 text-sm text-[#702721]">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} /> {error}
          </div>
          <button type="button" onClick={() => setError('')}><X size={15} /></button>
        </div>
      )}
      {successMessage && (
        <div role="status" className="mb-6 flex items-center justify-between rounded-xl border-l-4 border-[#28583C] bg-[#E8F3E9] px-4 py-3 text-sm text-[#28583C]">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} /> {successMessage}
          </div>
          <button type="button" onClick={() => setSuccessMessage('')}><X size={15} /></button>
        </div>
      )}

      {/* Navigation Tabs Bar */}
      <nav aria-label="Dashboard views" className="mb-8 flex gap-2 overflow-x-auto border-b border-[#F0D7AF] pb-2 text-sm">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 font-medium transition ${
                isActive
                  ? 'bg-[#6B1E2B] text-white shadow-sm'
                  : 'text-[#604D47] hover:bg-[#F7EBDD]'
              }`}
            >
              <Icon size={16} aria-hidden="true" />
              <span>{tab.label}</span>
              {Boolean(tab.badge) && (
                <span className={`ml-1 rounded-full px-2 py-0.5 text-xs font-bold ${
                  isActive ? 'bg-white text-[#6B1E2B]' : 'bg-[#6B1E2B] text-white'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ============================================================== */}
      {/* TAB 1: OVERVIEW & ANALYTICS                                    */}
      {/* ============================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <section aria-label="Business overview" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {metrics.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="rounded-2xl border border-[#E7CC91] bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg">
                <div className="flex items-center justify-between text-sm text-[#806C66]">
                  <span>{label}</span>
                  <Icon size={18} className={color} />
                </div>
                <div className="mt-3 text-3xl font-semibold text-[#33201D]">{value}</div>
              </div>
            ))}
          </section>

          <section aria-labelledby="analytics-heading" className="rounded-2xl border border-[#E7CC91] bg-white p-4 shadow-soft sm:p-6">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#6B1E2B]">
              <BarChart3 size={16} aria-hidden="true" /> Business Intelligence
            </div>
            <h2 id="analytics-heading" className="mt-1 font-[Playfair_Display] text-3xl text-[#33201D]">
              Demand Outlook & Forecasting
            </h2>
            <p className="mt-1 text-sm text-[#604D47]">
              Live analytics calculated from active {scope === 'real' ? 'production' : scope === 'synthetic' ? 'synthetic' : 'combined'} records.
            </p>

            {invalidInventoryRange && (
              <p role="alert" className="mt-4 rounded-xl border border-[#d7aaa2] bg-[#fff3f0] p-4 text-sm text-[#702721]">
                Select an end date on or after the start date to load analytics.
              </p>
            )}
            {!invalidInventoryRange && analyticsError && (
              <p role="alert" className="mt-4 rounded-xl border border-[#d7aaa2] bg-[#fff3f0] p-4 text-sm text-[#702721]">{analyticsError}</p>
            )}
            {!invalidInventoryRange && analyticsLoading ? (
              <p role="status" className="py-6 text-sm text-[#604D47]">Loading analytics...</p>
            ) : !invalidInventoryRange && analytics && (
              <>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    ['Request conversion rate', `${analytics.conversion.ratePercent}%`, `${analytics.conversion.convertedRequestCount} of ${analytics.conversion.requestCount} inquiries booked`],
                    ['Booking cancellation rate', `${analytics.cancellation.ratePercent}%`, `${analytics.cancellation.cancelledCount} of ${analytics.cancellation.bookingCount} bookings cancelled`],
                    ['Committed booking value', formatCurrency(analytics.bookedValue.amount), 'Confirmed and completed contracts (excludes cancellations)'],
                    ['Seasonality sample', `${analytics.seasonality.reduce((total, entry) => total + entry.bookingCount, 0)} bookings`, 'Grouped by event start month']
                  ].map(([label, value, detail]) => (
                    <div key={label} className="rounded-xl border border-[#F0D7AF] bg-[#FFFDF9] p-4">
                      <p className="text-xs font-medium text-[#806C66]">{label}</p>
                      <p className="mt-2 text-2xl font-semibold text-[#33201D]">{value}</p>
                      <p className="mt-1 text-xs text-[#806C66]">{detail}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <AnalyticsVisualizations
                    analytics={analytics}
                    eventStats={eventStats}
                    qcStats={qcStats}
                    funnelStats={funnelStats}
                    scope={scope}
                    onDownloadDataset={handleDownloadDataset}
                  />
                </div>

                <div className="mt-5 grid gap-5 xl:grid-cols-2">
                  <article className="rounded-xl border border-[#F0D7AF] p-4">
                    <h3 className="font-semibold text-[#45121C]">Three-Month Demand Forecast</h3>
                    {analytics.forecast.status === 'Available' ? (
                      <>
                        <p className="mt-1 text-sm text-[#604D47]">
                          Moving average · {analytics.forecast.historyBookingCount} bookings across {analytics.forecast.historyMonths} active months.
                        </p>
                        <div className="mt-3 grid gap-2 sm:grid-cols-3">
                          {analytics.forecast.forecastMonths.map((month) => (
                            <div key={month.month} className="rounded-lg bg-[#F7EBDD] p-3">
                              <p className="text-xs text-[#604D47]">{month.label}</p>
                              <p className="mt-1 text-xl font-semibold text-[#45121C]">{month.predictedBookings}</p>
                              <p className="text-xs text-[#604D47]">predicted bookings</p>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="mt-2 rounded-lg bg-[#FFF3D9] p-4 text-sm text-[#6B4B0D]">
                        Need at least {analytics.forecast.requiredHistoryMonths} active months with booking history to compute moving average forecast.
                      </p>
                    )}
                  </article>

                  <article className="rounded-xl border border-[#F0D7AF] p-4">
                    <h3 className="font-semibold text-[#45121C]">Rajasthan Seasonal Demand Curve</h3>
                    <p className="mt-1 text-xs text-[#806C66]">Monthly distribution highlighting winter wedding peaks.</p>
                    <div className="mt-4 space-y-2.5" role="img" aria-label="Booking counts by event start month">
                      {analytics.seasonality.map((month) => (
                        <AnalyticsBar
                          key={month.month}
                          label={month.label}
                          value={month.bookingCount}
                          maxValue={Math.max(...analytics.seasonality.map((entry) => entry.bookingCount), 1)}
                          color="bg-[#9A6A28]"
                        />
                      ))}
                    </div>
                  </article>
                </div>
              </>
            )}
          </section>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: EVENT REQUESTS                                         */}
      {/* ============================================================== */}
      {activeTab === 'requests' && (
        <section className="rounded-2xl border border-[#E7CC91] bg-white p-6 shadow-soft">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6B1E2B]">Customer Pipeline</div>
              <h2 className="mt-1 font-[Playfair_Display] text-3xl text-[#33201D]">Event Inquiries & Requests</h2>
              <p className="mt-1 text-sm text-[#806C66]">{requestsTotal} total requests in {scope} scope</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-3 text-[#806C66]" />
                <input
                  type="text"
                  placeholder="Search ID, name, venue..."
                  value={requestSearch}
                  onChange={(e) => setRequestSearch(e.target.value)}
                  className="rounded-lg border border-[#D7B46B] py-1.5 pl-9 pr-3 text-sm focus:outline-[#6B1E2B]"
                />
              </div>
              <select
                value={requestStatusFilter}
                onChange={(e) => { setRequestStatusFilter(e.target.value); setRequestsPage(1); }}
                className="rounded-lg border border-[#D7B46B] px-3 py-1.5 text-sm font-medium text-[#33201D]"
              >
                <option value="">All Statuses</option>
                <option value="Submitted">Submitted (New)</option>
                <option value="Under Review">Under Review</option>
                <option value="Quotation Sent">Quotation Sent</option>
                <option value="Quotation Accepted">Quotation Accepted</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          {requestsError && (
            <div role="alert" className="mb-4 rounded-xl border border-[#d7aaa2] bg-[#fff3f0] p-4 text-sm text-[#702721]">
              {requestsError}
            </div>
          )}

          <div className="divide-y divide-[#F0D7AF] overflow-hidden rounded-xl border border-[#F0D7AF]">
            {requestsLoading ? (
              <div className="py-8 text-center text-sm text-[#806C66]">Loading requests...</div>
            ) : filteredRequests.length === 0 ? (
              <div className="py-8 text-center text-sm text-[#806C66]">No event requests matching filter.</div>
            ) : filteredRequests.map((request) => (
              <article key={request._id} className="grid gap-4 p-4 transition hover:bg-[#FFFDF9] md:grid-cols-[minmax(0,1.2fr)_minmax(180px,0.8fr)_200px] md:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#6B1E2B]">{request.requestId}</span>
                    <span className="rounded-md bg-[#F0E7D7] px-2 py-0.5 text-xs font-semibold text-[#33201D]">{request.eventType}</span>
                    {request.isSynthetic && (
                      <span className="rounded-md bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">Synthetic</span>
                    )}
                  </div>
                  <div className="mt-1 text-sm font-medium text-[#33201D]">{request.user?.name || 'Customer'}</div>
                  <div className="text-xs text-[#806C66]">{request.user?.phone || request.user?.email || 'No contact'}</div>
                </div>

                <div className="text-xs text-[#604D47]">
                  <div className="font-medium text-[#33201D]">{formatDate(request.startDate)} – {formatDate(request.endDate)}</div>
                  <div className="mt-0.5">{request.location || 'Jaipur'} · {request.guestCount} guests</div>
                  <div className="mt-0.5 text-[#806C66]">{request.items?.length || 0} requested line items</div>
                </div>

                <div className="space-y-2">
                  <select
                    value={request.status}
                    disabled={updatingRequestId === request._id || !requestStatusTransitions[request.status]?.length}
                    onChange={(e) => updateRequestStatus(request, e.target.value)}
                    className="w-full rounded-md border border-[#D7B46B] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#33201D] disabled:opacity-60"
                  >
                    {[request.status, ...(requestStatusTransitions[request.status] || [])].map((status, index) => (
                      <option key={status} value={status} disabled={index === 0}>
                        {requestStatusLabels[status] || status}
                      </option>
                    ))}
                  </select>
                  {['Submitted', 'Under Review'].includes(request.status) && (
                    <button
                      type="button"
                      onClick={() => setQuotingRequest(request)}
                      className="w-full rounded-lg bg-[#6B1E2B] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#8A2B3D]"
                    >
                      Compose Quotation
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>

          <PaginationControls
            page={requestsPage}
            totalPages={requestsTotalPages}
            totalItems={requestsTotal}
            pageSize={requestsPageSize}
            onPageChange={setRequestsPage}
            className="mt-4"
          />

          {quotingRequest && (
            <QuotationComposer
              request={quotingRequest}
              onCancel={() => setQuotingRequest(null)}
              onCreated={handleQuotationCreated}
            />
          )}
        </section>
      )}

      {/* ============================================================== */}
      {/* TAB 3: QUOTATIONS                                             */}
      {/* ============================================================== */}
      {activeTab === 'quotations' && (
        <section className="rounded-2xl border border-[#E7CC91] bg-white p-6 shadow-soft">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6B1E2B]">Commercial Proposals</div>
              <h2 className="mt-1 font-[Playfair_Display] text-3xl text-[#33201D]">Quotations</h2>
              <p className="mt-1 text-sm text-[#806C66]">{quotationsTotal} quotations composed</p>
            </div>
            <select
              value={quotationStatusFilter}
              onChange={(e) => { setQuotationStatusFilter(e.target.value); setQuotationsPage(1); }}
              className="rounded-lg border border-[#D7B46B] px-3 py-1.5 text-sm font-medium text-[#33201D]"
            >
              <option value="">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Accepted">Accepted</option>
              <option value="Expired">Expired</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {quotationsError && (
            <div role="alert" className="mb-4 rounded-xl border border-[#d7aaa2] bg-[#fff3f0] p-4 text-sm text-[#702721]">
              {quotationsError}
            </div>
          )}

          <div className="divide-y divide-[#F0D7AF] overflow-hidden rounded-xl border border-[#F0D7AF]">
            {quotationsLoading ? (
              <p className="py-8 text-center text-sm text-[#806C66]">Loading quotations...</p>
            ) : quotations.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#806C66]">No quotations found.</p>
            ) : quotations.map((quotation) => {
              const booking = bookings.find((b) => b.request === quotation.request && b.quotation === quotation._id);
              return (
                <article key={quotation._id} className="flex flex-col gap-3 p-4 transition hover:bg-[#FFFDF9] sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#33201D]">Request ID: {String(quotation.request).slice(-8)}</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        quotation.status === 'Accepted'
                          ? 'bg-[#E8F3E9] text-[#28583C]'
                          : quotation.status === 'Sent'
                            ? 'bg-[#EAF1F7] text-[#24527A]'
                            : 'bg-[#F7EBDD] text-[#806C66]'
                      }`}>
                        {quotation.status}
                      </span>
                      {quotation.isSynthetic && (
                        <span className="rounded-md bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">Synthetic</span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-[#604D47]">
                      {quotation.items?.length || 0} line items · Final Quote: <strong className="text-[#33201D]">{formatCurrency(quotation.finalTotal)}</strong>
                      {booking && <span className="ml-2 font-medium text-[#2B6B40]">· Converted to Booking ({booking.status})</span>}
                    </p>
                  </div>
                  {quotation.status === 'Accepted' && !booking && (
                    <button
                      type="button"
                      disabled={creatingBookingId === quotation._id}
                      onClick={() => createPendingBooking(quotation)}
                      className="rounded-lg bg-[#6B1E2B] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#8A2B3D] disabled:opacity-60"
                    >
                      {creatingBookingId === quotation._id ? 'Creating...' : 'Create Pending Booking'}
                    </button>
                  )}
                </article>
              );
            })}
          </div>

          <PaginationControls
            page={quotationsPage}
            totalPages={quotationsTotalPages}
            totalItems={quotationsTotal}
            pageSize={quotationsPageSize}
            onPageChange={setQuotationsPage}
            className="mt-4"
          />
        </section>
      )}

      {/* ============================================================== */}
      {/* TAB 4: BOOKINGS & INVENTORY GATEKEEPER                         */}
      {/* ============================================================== */}
      {activeTab === 'bookings' && (
        <section className="rounded-2xl border border-[#E7CC91] bg-white p-6 shadow-soft">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6B1E2B]">Execution Lifecycle</div>
              <h2 className="mt-1 font-[Playfair_Display] text-3xl text-[#33201D]">Event Bookings</h2>
              <p className="mt-1 text-sm text-[#806C66]">{bookingsTotal} bookings in database</p>
            </div>
            <select
              value={bookingStatusFilter}
              onChange={(e) => { setBookingStatusFilter(e.target.value); setBookingsPage(1); }}
              className="rounded-lg border border-[#D7B46B] px-3 py-1.5 text-sm font-medium text-[#33201D]"
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="mb-6 flex items-start gap-3 rounded-xl border border-[#F0D7AF] bg-[#FFFDF9] p-4 text-xs text-[#604D47]">
            <ShieldCheck size={18} className="mt-0.5 text-[#6B1E2B]" />
            <div>
              <p className="font-semibold text-[#45121C]">Automated Inventory Verification Gatekeeper (HTTP 409 Safety Invariant)</p>
              <p className="mt-0.5 text-[#806C66]">
                Bookings require verified physical inventory reservations before transitioning to <strong className="text-[#33201D]">Confirmed</strong>. Unverified stock triggers an automatic HTTP 409 conflict, preventing double-booking during peak Rajasthan wedding dates.
              </p>
            </div>
          </div>

          {bookingsError && (
            <div role="alert" className="mb-4 rounded-xl border border-[#d7aaa2] bg-[#fff3f0] p-4 text-sm text-[#702721]">
              {bookingsError}
            </div>
          )}

          <div className="divide-y divide-[#F0D7AF] overflow-hidden rounded-xl border border-[#F0D7AF]">
            {bookingsLoading ? (
              <p className="py-8 text-center text-sm text-[#806C66]">Loading bookings...</p>
            ) : bookings.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#806C66]">No bookings found.</p>
            ) : bookings.map((booking) => (
              <article key={booking._id} className="flex flex-col gap-3 p-4 transition hover:bg-[#FFFDF9] sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#6B1E2B]">{booking.bookingId}</span>
                    <span className="font-semibold text-[#33201D]">{booking.customer?.name || 'Customer'}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      booking.status === 'Confirmed'
                        ? 'bg-[#E8F3E9] text-[#28583C]'
                        : booking.status === 'Completed'
                          ? 'bg-[#EAF1F7] text-[#24527A]'
                          : booking.status === 'Cancelled'
                            ? 'bg-[#FBEFEC] text-[#9E3D36]'
                            : 'bg-[#FFF3D9] text-[#6B4B0D]'
                    }`}>
                      {booking.status}
                    </span>
                    {booking.isSynthetic && (
                      <span className="rounded-md bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">Synthetic</span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-[#604D47]">
                    Amount: <strong className="text-[#33201D]">{formatCurrency(booking.finalAmount)}</strong> · {booking.items?.length || 0} lines
                    {booking.inventoryVerificationStatus && (
                      <span className="ml-2 text-xs text-[#806C66]">
                        Stock: {booking.inventoryVerificationStatus}
                      </span>
                    )}
                  </p>
                </div>
                {booking.status === 'Pending' && (
                  <button
                    type="button"
                    disabled={updatingBookingId === booking._id}
                    onClick={() => cancelPendingBooking(booking)}
                    className="rounded-lg border border-[#9E3D36] px-3 py-1.5 text-xs font-semibold text-[#9E3D36] hover:bg-[#FBEFEC] disabled:opacity-60"
                  >
                    {updatingBookingId === booking._id ? 'Cancelling...' : 'Cancel Pending Booking'}
                  </button>
                )}
              </article>
            ))}
          </div>

          <PaginationControls
            page={bookingsPage}
            totalPages={bookingsTotalPages}
            totalItems={bookingsTotal}
            pageSize={bookingsPageSize}
            onPageChange={setBookingsPage}
            className="mt-4"
          />
        </section>
      )}

      {/* ============================================================== */}
      {/* TAB 5: MANAGE CATALOGUE & ITEMS (ADMIN POWER)                 */}
      {/* ============================================================== */}
      {activeTab === 'items' && (
        <section className="rounded-2xl border border-[#E7CC91] bg-white p-6 shadow-soft">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6B1E2B]">Client Services & Rentals</div>
              <h2 className="mt-1 font-[Playfair_Display] text-3xl text-[#33201D]">Rental Catalogue Management</h2>
              <p className="mt-1 text-sm text-[#806C66]">
                Add, edit pricing, update stock, and control visibility for items displayed on the customer-facing rental catalogue.
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenAddItem}
              className="flex items-center gap-2 rounded-xl bg-[#6B1E2B] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#8A2B3D]"
            >
              <Plus size={16} /> Add Rental Item
            </button>
          </div>

          {/* Search & Category Filter */}
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <div className="relative min-w-[240px]">
              <Search size={15} className="absolute left-3 top-3 text-[#806C66]" />
              <input
                type="text"
                placeholder="Search items by name..."
                value={catalogSearch}
                onChange={(e) => { setCatalogSearch(e.target.value); setCatalogPage(1); }}
                className="w-full rounded-lg border border-[#D7B46B] py-1.5 pl-9 pr-3 text-sm focus:outline-[#6B1E2B]"
              />
            </div>
            <select
              value={catalogCategoryFilter}
              onChange={(e) => { setCatalogCategoryFilter(e.target.value); setCatalogPage(1); }}
              className="rounded-lg border border-[#D7B46B] px-3 py-1.5 text-sm font-medium text-[#33201D]"
            >
              <option value="All">All Categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto rounded-xl border border-[#F0D7AF] bg-white">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-[#F7EBDD] text-xs uppercase tracking-wide text-[#604D47]">
                <tr>
                  <th className="px-4 py-3">Item Details</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Rental Rate</th>
                  <th className="px-4 py-3">Warehouse Stock</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0D7AF]">
                {catalogLoading ? (
                  <tr><td colSpan="6" className="py-8 text-center text-[#806C66]">Loading items...</td></tr>
                ) : catalogItems.length === 0 ? (
                  <tr><td colSpan="6" className="py-8 text-center text-[#806C66]">No items found.</td></tr>
                ) : catalogItems.map((item) => (
                  <tr key={item._id} className="hover:bg-[#FFFDF9]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {item.images?.[0] ? (
                          <img src={item.images[0]} alt={item.name} className="h-10 w-10 rounded-lg object-cover" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F0E7D7] text-xs text-[#806C66]">No img</div>
                        )}
                        <div>
                          <p className="font-semibold text-[#33201D]">{item.name}</p>
                          <p className="line-clamp-1 max-w-xs text-xs text-[#806C66]">{item.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-[#604D47]">
                      {item.category?.name || 'Uncategorized'}
                    </td>
                    <td className="px-4 py-3 tabular-nums font-semibold text-[#6B1E2B]">
                      {formatCurrency(item.basePrice)} <span className="text-xs font-normal text-[#806C66]">/ {item.priceUnit}</span>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-sm font-medium text-[#33201D]">
                      {item.ownStock} units
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        item.status === 'active' ? 'bg-[#E8F3E9] text-[#28583C]' : 'bg-[#F7EBDD] text-[#806C66]'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditItem(item)}
                          className="rounded-lg border border-[#D7B46B] p-1.5 text-[#604D47] hover:bg-[#F7EBDD]"
                          title="Edit Item"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item)}
                          className="rounded-lg border border-[#9E3D36] p-1.5 text-[#9E3D36] hover:bg-[#FBEFEC]"
                          title="Delete Item"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <PaginationControls
            page={catalogPage}
            totalPages={catalogTotalPages}
            totalItems={catalogTotal}
            pageSize={catalogPageSize}
            onPageChange={setCatalogPage}
            className="mt-4"
          />

          {/* Add / Edit Item Modal */}
          {showItemModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
              <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
                <div className="flex items-center justify-between border-b border-[#F0D7AF] pb-3">
                  <h3 className="font-[Playfair_Display] text-2xl font-bold text-[#33201D]">
                    {editingItem ? 'Edit Catalogue Item' : 'Add New Rental Item'}
                  </h3>
                  <button type="button" onClick={() => setShowItemModal(false)} className="rounded-lg p-1 text-[#806C66] hover:bg-[#F7EBDD]">
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSaveItem} className="mt-4 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#604D47]">Item Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Royal Wedding Mandap Canopy"
                      value={itemForm.name}
                      onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-[#D7B46B] px-3 py-2 text-sm focus:outline-[#6B1E2B]"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#604D47]">Category</label>
                      <select
                        required
                        value={itemForm.category}
                        onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-[#D7B46B] bg-white px-3 py-2 text-sm focus:outline-[#6B1E2B]"
                      >
                        {categories.map((c) => (
                          <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#604D47]">Status</label>
                      <select
                        value={itemForm.status}
                        onChange={(e) => setItemForm({ ...itemForm, status: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-[#D7B46B] bg-white px-3 py-2 text-sm focus:outline-[#6B1E2B]"
                      >
                        <option value="active">Active (Visible in Catalogue)</option>
                        <option value="inactive">Inactive (Hidden)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#604D47]">Base Price (₹)</label>
                      <input
                        type="number"
                        min="0"
                        required
                        placeholder="e.g. 15000"
                        value={itemForm.basePrice}
                        onChange={(e) => setItemForm({ ...itemForm, basePrice: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-[#D7B46B] px-3 py-2 text-sm focus:outline-[#6B1E2B]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#604D47]">Price Unit</label>
                      <select
                        value={itemForm.priceUnit}
                        onChange={(e) => setItemForm({ ...itemForm, priceUnit: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-[#D7B46B] bg-white px-3 py-2 text-sm focus:outline-[#6B1E2B]"
                      >
                        {priceUnits.map((u) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#604D47]">Owned Stock</label>
                      <input
                        type="number"
                        min="0"
                        required
                        placeholder="e.g. 50"
                        value={itemForm.ownStock}
                        onChange={(e) => setItemForm({ ...itemForm, ownStock: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-[#D7B46B] px-3 py-2 text-sm focus:outline-[#6B1E2B]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#604D47]">Image URL</label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={itemForm.imageUrl}
                      onChange={(e) => setItemForm({ ...itemForm, imageUrl: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-[#D7B46B] px-3 py-2 text-sm focus:outline-[#6B1E2B]"
                    />
                    {itemForm.imageUrl && (
                      <div className="mt-2 flex items-center gap-3">
                        <img src={itemForm.imageUrl} alt="Preview" className="h-14 w-14 rounded-lg object-cover border" onError={(e) => { e.target.style.display = 'none'; }} />
                        <span className="text-xs text-[#806C66]">Live image preview</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#604D47]">Description</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="High quality description of materials, colors, setup dimensions..."
                      value={itemForm.description}
                      onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-[#D7B46B] px-3 py-2 text-sm focus:outline-[#6B1E2B]"
                    />
                  </div>

                  <div className="flex justify-end gap-3 border-t border-[#F0D7AF] pt-4">
                    <button
                      type="button"
                      onClick={() => setShowItemModal(false)}
                      className="rounded-lg border border-[#D7B46B] px-4 py-2 text-xs font-semibold text-[#604D47]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={itemSaving}
                      className="rounded-lg bg-[#6B1E2B] px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#8A2B3D] disabled:opacity-60"
                    >
                      {itemSaving ? 'Saving...' : editingItem ? 'Update Item' : 'Add Item'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ============================================================== */}
      {/* TAB 6: MANAGE GALLERY SHOWCASE (ADMIN POWER)                   */}
      {/* ============================================================== */}
      {activeTab === 'gallery' && (
        <section className="rounded-2xl border border-[#E7CC91] bg-white p-6 shadow-soft">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6B1E2B]">Visual Portfolio</div>
              <h2 className="mt-1 font-[Playfair_Display] text-3xl text-[#33201D]">Gallery Showcase Management</h2>
              <p className="mt-1 text-sm text-[#806C66]">
                Upload and organize event photos displayed on the client-facing event gallery (/gallery).
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowGalleryModal(true)}
              className="flex items-center gap-2 rounded-xl bg-[#6B1E2B] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#8A2B3D]"
            >
              <Plus size={16} /> Add Showcase Photo
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {galleryLoading ? (
              <p className="col-span-full py-8 text-center text-sm text-[#806C66]">Loading gallery photos...</p>
            ) : galleryImages.length === 0 ? (
              <p className="col-span-full py-8 text-center text-sm text-[#806C66]">No photos uploaded yet.</p>
            ) : galleryImages.map((photo) => (
              <div key={photo._id} className="group relative overflow-hidden rounded-xl border border-[#F0D7AF] bg-[#FFFDF9] shadow-sm">
                <img src={photo.imageUrl} alt={photo.title} className="h-44 w-full object-cover transition group-hover:scale-105" />
                <div className="p-3">
                  <div className="flex items-center justify-between gap-1">
                    <span className="rounded bg-[#F0E7D7] px-2 py-0.5 text-[10px] font-bold text-[#6B1E2B]">
                      {photo.category}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteGallery(photo)}
                      className="rounded p-1 text-[#9E3D36] hover:bg-[#FBEFEC]"
                      title="Delete Photo"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <h4 className="mt-1 font-semibold text-[#33201D] text-sm truncate">{photo.title}</h4>
                  {photo.description && (
                    <p className="line-clamp-2 text-xs text-[#806C66] mt-0.5">{photo.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <PaginationControls
            page={galleryPage}
            totalPages={galleryTotalPages}
            totalItems={galleryTotal}
            pageSize={galleryPageSize}
            onPageChange={setGalleryPage}
            className="mt-6"
          />

          {/* Add Gallery Photo Modal */}
          {showGalleryModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
              <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
                <div className="flex items-center justify-between border-b border-[#F0D7AF] pb-3">
                  <h3 className="font-[Playfair_Display] text-2xl font-bold text-[#33201D]">Add Photo to Gallery</h3>
                  <button type="button" onClick={() => setShowGalleryModal(false)} className="rounded-lg p-1 text-[#806C66] hover:bg-[#F7EBDD]">
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSaveGallery} className="mt-4 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#604D47]">Photo Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Royal Wedding Night Decor at Diggi Palace"
                      value={galleryForm.title}
                      onChange={(e) => setGalleryForm({ ...galleryForm, title: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-[#D7B46B] px-3 py-2 text-sm focus:outline-[#6B1E2B]"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#604D47]">Category</label>
                      <select
                        value={galleryForm.category}
                        onChange={(e) => setGalleryForm({ ...galleryForm, category: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-[#D7B46B] bg-white px-3 py-2 text-sm focus:outline-[#6B1E2B]"
                      >
                        {galleryCategories.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#604D47]">Status</label>
                      <select
                        value={galleryForm.status}
                        onChange={(e) => setGalleryForm({ ...galleryForm, status: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-[#D7B46B] bg-white px-3 py-2 text-sm focus:outline-[#6B1E2B]"
                      >
                        <option value="active">Active (Visible)</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#604D47]">Image URL</label>
                    <input
                      type="url"
                      required
                      placeholder="https://images.unsplash.com/..."
                      value={galleryForm.imageUrl}
                      onChange={(e) => setGalleryForm({ ...galleryForm, imageUrl: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-[#D7B46B] px-3 py-2 text-sm focus:outline-[#6B1E2B]"
                    />
                    {galleryForm.imageUrl && (
                      <div className="mt-2 flex items-center gap-3">
                        <img src={galleryForm.imageUrl} alt="Preview" className="h-16 w-24 rounded-lg object-cover border" onError={(e) => { e.target.style.display = 'none'; }} />
                        <span className="text-xs text-[#806C66]">Live photo preview</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#604D47]">Description (Optional)</label>
                    <textarea
                      rows={2}
                      placeholder="Short note about the setup, venue, lighting mood..."
                      value={galleryForm.description}
                      onChange={(e) => setGalleryForm({ ...galleryForm, description: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-[#D7B46B] px-3 py-2 text-sm focus:outline-[#6B1E2B]"
                    />
                  </div>

                  <div className="flex justify-end gap-3 border-t border-[#F0D7AF] pt-4">
                    <button
                      type="button"
                      onClick={() => setShowGalleryModal(false)}
                      className="rounded-lg border border-[#D7B46B] px-4 py-2 text-xs font-semibold text-[#604D47]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={gallerySaving}
                      className="rounded-lg bg-[#6B1E2B] px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#8A2B3D] disabled:opacity-60"
                    >
                      {gallerySaving ? 'Saving...' : 'Upload to Gallery'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ============================================================== */}
      {/* TAB 7: CATEGORIES (ADMIN POWER)                                */}
      {/* ============================================================== */}
      {activeTab === 'categories' && (
        <section className="rounded-2xl border border-[#E7CC91] bg-white p-6 shadow-soft">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6B1E2B]">Service Structure</div>
              <h2 className="mt-1 font-[Playfair_Display] text-3xl text-[#33201D]">Item Categories & Services</h2>
              <p className="mt-1 text-sm text-[#806C66]">
                Manage product groups and services offered on the rental platform.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCategoryModal(true)}
              className="flex items-center gap-2 rounded-xl bg-[#6B1E2B] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#8A2B3D]"
            >
              <Plus size={16} /> Add Category
            </button>
          </div>

          {requestsError && (
            <div role="alert" className="mb-4 rounded-xl border border-[#d7aaa2] bg-[#fff3f0] p-4 text-sm text-[#702721]">
              {requestsError}
            </div>
          )}

          <div className="divide-y divide-[#F0D7AF] overflow-hidden rounded-xl border border-[#F0D7AF]">
            {categories.map((cat) => (
              <div key={cat._id} className="flex items-center justify-between p-4 transition hover:bg-[#FFFDF9]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#33201D]">{cat.name}</span>
                    <span className="font-mono text-xs text-[#806C66]">slug: {cat.slug}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      cat.status === 'active' ? 'bg-[#E8F3E9] text-[#28583C]' : 'bg-[#F7EBDD] text-[#806C66]'
                    }`}>
                      {cat.status}
                    </span>
                  </div>
                  {cat.description && (
                    <p className="mt-1 text-xs text-[#806C66]">{cat.description}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteCategory(cat)}
                  className="rounded-lg border border-[#9E3D36] p-1.5 text-[#9E3D36] hover:bg-[#FBEFEC]"
                  title="Delete Category"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Add Category Modal */}
          {showCategoryModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                <div className="flex items-center justify-between border-b border-[#F0D7AF] pb-3">
                  <h3 className="font-[Playfair_Display] text-2xl font-bold text-[#33201D]">Add New Category</h3>
                  <button type="button" onClick={() => setShowCategoryModal(false)} className="rounded-lg p-1 text-[#806C66] hover:bg-[#F7EBDD]">
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSaveCategory} className="mt-4 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#604D47]">Category Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Royal Stage Backdrops"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-[#D7B46B] px-3 py-2 text-sm focus:outline-[#6B1E2B]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#604D47]">Description</label>
                    <textarea
                      rows={2}
                      placeholder="Category description..."
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-[#D7B46B] px-3 py-2 text-sm focus:outline-[#6B1E2B]"
                    />
                  </div>
                  <div className="flex justify-end gap-3 border-t border-[#F0D7AF] pt-4">
                    <button
                      type="button"
                      onClick={() => setShowCategoryModal(false)}
                      className="rounded-lg border border-[#D7B46B] px-4 py-2 text-xs font-semibold text-[#604D47]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={categorySaving}
                      className="rounded-lg bg-[#6B1E2B] px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#8A2B3D] disabled:opacity-60"
                    >
                      {categorySaving ? 'Saving...' : 'Create Category'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ============================================================== */}
      {/* TAB 8: INVENTORY CONTROL & SHORTAGE RADAR                     */}
      {/* ============================================================== */}
      {activeTab === 'inventory' && (
        <section aria-labelledby="inventory-heading" className="rounded-2xl border border-[#E7CC91] bg-white p-6 shadow-soft">
          <div className="flex flex-col gap-4 border-b border-[#F0D7AF] pb-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#6B1E2B]">
                <PackageCheck size={16} aria-hidden="true" /> Real-time Warehouse Allocation
              </div>
              <h2 id="inventory-heading" className="mt-1 font-[Playfair_Display] text-3xl text-[#33201D]">
                Inventory & Shortage Radar
              </h2>
              <p className="mt-1 max-w-3xl text-sm text-[#604D47]">
                Live date-range availability calculations. Evaluates concurrent bookings against owned warehouse stock and verified external supplier commitments.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#604D47]">
                Event window start
                <input
                  type="date"
                  value={inventoryStart}
                  onChange={(e) => setInventoryStart(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-[#D7B46B] bg-white px-3 py-1.5 text-sm"
                />
              </label>
              <label className="text-xs font-semibold uppercase tracking-wider text-[#604D47]">
                Event window end
                <input
                  type="date"
                  value={inventoryEnd}
                  onChange={(e) => setInventoryEnd(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-[#D7B46B] bg-white px-3 py-1.5 text-sm"
                />
              </label>
            </div>
          </div>

          {invalidInventoryRange && (
            <p role="alert" className="mt-4 rounded-xl border border-[#d7aaa2] bg-[#fff3f0] p-4 text-sm text-[#702721]">
              End date must be on or after start date.
            </p>
          )}
          {!invalidInventoryRange && inventoryError && (
            <p role="alert" className="mt-4 rounded-xl border border-[#d7aaa2] bg-[#fff3f0] p-4 text-sm text-[#702721]">{inventoryError}</p>
          )}

          {!invalidInventoryRange && inventoryLoading ? (
            <p className="py-8 text-center text-sm text-[#806C66]">Calculating inventory availability across date window...</p>
          ) : !invalidInventoryRange && inventory && (
            <>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {[
                  ['Catalogue Items', inventory.totals.items],
                  ['Owned Warehouse Stock', inventory.totals.ownedStock],
                  ['Verified Supplier Stock', inventory.totals.verifiedSupplierAvailable],
                  ['Unverified Items', inventory.totals.unverifiedItems],
                  ['Over-allocated Alerts', inventory.totals.overAllocatedItems]
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-[#F0D7AF] bg-[#FFFDF9] p-4">
                    <p className="text-xs font-medium text-[#806C66]">{label}</p>
                    <p className="mt-1 text-2xl font-semibold text-[#33201D]">{value}</p>
                  </div>
                ))}
              </div>

              {analytics?.inventoryRecommendations?.length > 0 && (
                <div className="mt-6 rounded-xl border border-[#F0D7AF] bg-[#FFFDF9] p-4">
                  <h3 className="flex items-center gap-2 font-semibold text-[#45121C]">
                    <AlertTriangle size={16} className="text-[#C47D2B]" /> Shortage Risk Radar for Selected Window
                  </h3>
                  <div className="mt-3 space-y-2">
                    {analytics.inventoryRecommendations.slice(0, 5).map((rec) => (
                      <div key={rec.itemId} className="flex flex-col gap-2 rounded-lg border border-[#F0D7AF]/60 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-medium text-[#33201D]">{rec.itemName}</p>
                          <p className="text-xs text-[#806C66]">
                            Requested: {rec.requestedQuantity} units across {rec.requestCount} inquiries · Peak single request: {rec.largestSingleRequest}
                          </p>
                        </div>
                        <div className="text-sm sm:text-right">
                          <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-semibold ${
                            rec.status === 'PotentialShortage' ? 'bg-[#FBEFEC] text-[#9E3D36]' : 'bg-[#E8F3E9] text-[#28583C]'
                          }`}>
                            {rec.status === 'PotentialShortage' ? 'Potential Shortage Alert' : 'Adequate Capacity'}
                          </span>
                          <p className="mt-0.5 text-xs text-[#806C66]">
                            {rec.verifiedAvailableQuantity !== null ? `${rec.verifiedAvailableQuantity} verified units available` : 'Capacity unverified'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6">
                <h3 className="mb-3 font-semibold text-[#45121C]">Item Stock & Concurrent Usage Breakdown</h3>
                <div className="overflow-x-auto rounded-xl border border-[#F0D7AF] bg-white">
                  <table className="w-full min-w-[700px] text-left text-sm">
                    <thead className="bg-[#F7EBDD] text-xs uppercase tracking-wide text-[#604D47]">
                      <tr>
                        <th className="px-4 py-3">Item Name</th>
                        <th className="px-4 py-3">Owned Stock</th>
                        <th className="px-4 py-3">Reserved</th>
                        <th className="px-4 py-3">Available</th>
                        <th className="px-4 py-3">Supplier Verified</th>
                        <th className="px-4 py-3">Verification State</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0D7AF]">
                      {paginatedInventoryItems.map((item) => (
                        <tr key={item._id} className="hover:bg-[#FFFDF9]">
                          <td className="px-4 py-3 font-semibold text-[#33201D]">
                            {item.name}
                            {item.category?.name && <span className="block text-xs font-normal text-[#806C66]">{item.category.name}</span>}
                          </td>
                          <td className="px-4 py-3 tabular-nums">{item.ownStock ?? '0'}</td>
                          <td className="px-4 py-3 tabular-nums">{item.ownedReservedQuantity ?? '0'}</td>
                          <td className="px-4 py-3 tabular-nums font-semibold text-[#2B6B40]">{item.ownedAvailableQuantity ?? '0'}</td>
                          <td className="px-4 py-3 tabular-nums">{item.supplierAvailableQuantity ?? '0'}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                              item.availabilityStatus === 'Verified' ? 'bg-[#E8F3E9] text-[#28583C]' : 'bg-[#FFF3D9] text-[#6B4B0D]'
                            }`}>
                              {item.availabilityStatus === 'Verified' ? <CheckCircle2 size={12} /> : <ShieldAlert size={12} />}
                              {item.availabilityStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <PaginationControls
                  page={inventoryPage}
                  totalPages={Math.ceil((inventory.items?.length || 0) / inventoryPageSize) || 1}
                  totalItems={inventory.items?.length || 0}
                  pageSize={inventoryPageSize}
                  onPageChange={setInventoryPage}
                  className="mt-3 px-2"
                />
              </div>
            </>
          )}
        </section>
      )}

      {/* ============================================================== */}
      {/* TAB 9: SUPPLIERS NETWORK                                       */}
      {/* ============================================================== */}
      {activeTab === 'suppliers' && (
        <section className="rounded-2xl border border-[#E7CC91] bg-white p-6 shadow-soft">
          <div className="mb-6">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6B1E2B]">Vendor Ecosystem</div>
            <h2 className="mt-1 font-[Playfair_Display] text-3xl text-[#33201D]">External Suppliers & Partners</h2>
            <p className="mt-1 text-sm text-[#806C66]">{suppliersTotal} registered equipment and decor partners</p>
          </div>

          {suppliersError && (
            <div role="alert" className="mb-4 rounded-xl border border-[#d7aaa2] bg-[#fff3f0] p-4 text-sm text-[#702721]">
              {suppliersError}
            </div>
          )}

          <div className="space-y-3">
            {suppliersLoading ? (
              <p className="py-8 text-center text-sm text-[#806C66]">Loading suppliers...</p>
            ) : suppliers.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#806C66]">No suppliers found.</p>
            ) : suppliers.map((supplier) => (
              <article key={supplier._id} className="flex flex-col gap-3 rounded-xl border border-[#F0D7AF] bg-[#FFFDF9] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#33201D]">{supplier.name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      supplier.status === 'active' ? 'bg-[#E8F3E9] text-[#28583C]' : 'bg-[#F7EBDD] text-[#806C66]'
                    }`}>
                      {supplier.status}
                    </span>
                    {supplier.isSynthetic && (
                      <span className="rounded-md bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">Synthetic</span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-[#806C66]">
                    {supplier.phone && `Phone: ${supplier.phone}`} · {supplier.email && `Email: ${supplier.email}`}
                  </p>
                  {supplier.categories?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {supplier.categories.map((cat) => (
                        <span key={cat} className="rounded bg-[#F0E7D7] px-2 py-0.5 text-xs text-[#604D47]">{cat}</span>
                      ))}
                    </div>
                  )}
                </div>
                {supplier.address && (
                  <p className="max-w-xs text-xs text-[#806C66]">{supplier.address}</p>
                )}
              </article>
            ))}
          </div>

          <PaginationControls
            page={suppliersPage}
            totalPages={suppliersTotalPages}
            totalItems={suppliersTotal}
            pageSize={suppliersPageSize}
            onPageChange={setSuppliersPage}
            className="mt-4"
          />
        </section>
      )}

      {/* ============================================================== */}
      {/* TAB 10: QUALITY CONTROL & RETURN INSPECTIONS                   */}
      {/* ============================================================== */}
      {activeTab === 'inspections' && (
        <section className="rounded-2xl border border-[#E7CC91] bg-white p-6 shadow-soft">
          <div className="mb-6">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6B1E2B]">Warehouse Operations</div>
            <h2 className="mt-1 font-[Playfair_Display] text-3xl text-[#33201D]">Post-Event Return & Quality Control</h2>
            <p className="mt-1 text-sm text-[#806C66]">
              All returned equipment undergoes formal inspection before release back to active stock. Damaged items remain quarantined.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#F0D7AF] bg-white">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-[#F7EBDD] text-xs uppercase tracking-wide text-[#604D47]">
                <tr>
                  <th className="px-4 py-3">Rental Item</th>
                  <th className="px-4 py-3">Booking Reference</th>
                  <th className="px-4 py-3">Returned Qty</th>
                  <th className="px-4 py-3">Inspection Outcome</th>
                  <th className="px-4 py-3">Stock Release Status</th>
                  <th className="px-4 py-3">Inspected By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0D7AF]">
                {inspectionsLoading ? (
                  <tr><td colSpan="6" className="py-8 text-center text-[#806C66]">Loading return inspections...</td></tr>
                ) : inspections.length === 0 ? (
                  <tr><td colSpan="6" className="py-8 text-center text-[#806C66]">No return inspections recorded.</td></tr>
                ) : inspections.map((insp) => (
                  <tr key={insp._id} className="hover:bg-[#FFFDF9]">
                    <td className="px-4 py-3 font-semibold text-[#33201D]">
                      {insp.item?.name || 'Item'}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[#6B1E2B]">
                      {insp.booking?.bookingId || String(insp.booking || '').slice(-8)}
                    </td>
                    <td className="px-4 py-3 tabular-nums font-medium text-[#33201D]">
                      {insp.returnedQuantity} units
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        insp.inspectionOutcome === 'Passed'
                          ? 'bg-[#E8F3E9] text-[#28583C]'
                          : insp.inspectionOutcome === 'NeedsRepair'
                            ? 'bg-[#FFF3D9] text-[#6B4B0D]'
                            : 'bg-[#FBEFEC] text-[#9E3D36]'
                      }`}>
                        {insp.inspectionOutcome}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${
                        insp.releaseStatus === 'Released' ? 'bg-[#E8F3E9] text-[#28583C]' : 'bg-[#F7EBDD] text-[#806C66]'
                      }`}>
                        {insp.releaseStatus === 'Released' ? `Released (${insp.releasedQuantity} units)` : 'Quarantined / Held'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#806C66]">
                      {insp.inspectedBy?.name || 'Staff'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <PaginationControls
            page={inspectionsPage}
            totalPages={inspectionsTotalPages}
            totalItems={inspectionsTotal}
            pageSize={inspectionsPageSize}
            onPageChange={setInspectionsPage}
            className="mt-4"
          />
        </section>
      )}
    </div>
  );
}
