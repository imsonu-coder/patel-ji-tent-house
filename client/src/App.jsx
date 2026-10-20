import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { AuthProvider, useAuth } from './context/AuthContext';
import { EventProvider } from './context/EventContext';
import AboutPage from './pages/AboutPage';
import BuildEventPage from './pages/BuildEventPage';
import ContactPage from './pages/ContactPage';
import GalleryPage from './pages/GalleryPage';
import HomePage from './pages/HomePage';
import ItemDetailPage from './pages/ItemDetailPage';
import ItemsPage from './pages/ItemsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import RequestSubmittedPage from './pages/RequestSubmittedPage';
import CustomerDashboardPage from './pages/CustomerDashboardPage';
import RequestDetailPage from './pages/RequestDetailPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import NotFoundPage from './pages/NotFoundPage';

function ProtectedRoute({ children, allow = 'all', redirectTo = '/login' }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="mx-auto max-w-7xl px-4 py-12 text-[#806C66] sm:px-6 lg:px-8">Loading...</div>;
  }

  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  if (allow === 'admin' && user.role !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }

  if (allow === 'customer' && user.role !== 'customer') {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AppLayout() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#FFFDF9]">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/items" element={<ItemsPage />} />
          <Route path="/items/:id" element={<ItemDetailPage />} />
          <Route path="/build-event" element={<BuildEventPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/request-success" element={<RequestSubmittedPage />} />
          <Route path="/dashboard" element={<ProtectedRoute allow="customer"><CustomerDashboardPage /></ProtectedRoute>} />
          <Route path="/requests/:id" element={<ProtectedRoute><RequestDetailPage /></ProtectedRoute>} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin-login" element={<Navigate to="/admin/login" replace />} />
          <Route path="/admin" element={<ProtectedRoute allow="admin"><AdminDashboardPage /></ProtectedRoute>} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <EventProvider>
          <AppLayout />
        </EventProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
