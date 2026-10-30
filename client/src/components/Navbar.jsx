import { Link, NavLink } from 'react-router-dom';
import {
  Eye,
  LayoutDashboard,
  Menu,
  ShieldCheck,
  ShoppingBasket,
  X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useEvent } from '../context/EventContext';

const customerNavItems = [
  { to: '/', label: 'Home' },
  { to: '/items', label: 'Items' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' }
];

const adminNavItems = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/items', label: 'Items Catalogue' },
  { to: '/gallery', label: 'Gallery Showcase' },
  { to: '/', label: 'Preview Client Site', icon: Eye }
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { selectedItems } = useEvent();
  const isAdmin = user?.role === 'admin';

  const selectedUnitCount = selectedItems.reduce(
    (total, item) => total + (Number(item.quantity) || 0),
    0
  );

  const activeNavItems = isAdmin ? adminNavItems : customerNavItems;

  useEffect(() => {
    if (!menuOpen) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-[#F0D7AF] bg-[#FFFDF9]/95 shadow-sm backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:py-4">
        {/* Brand / Logo */}
        <Link to={isAdmin ? '/admin' : '/'} className="flex min-w-0 items-center gap-2 sm:gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#6B1E2B] text-lg font-bold text-white shadow-soft sm:h-12 sm:w-12">
            PJ
          </div>
          <div className="min-w-0">
            <div className="whitespace-nowrap font-[Playfair_Display] text-base font-bold leading-tight text-[#33201D] sm:text-xl">
              Patel Ji Tent House
            </div>
            <div className="hidden text-[10px] uppercase tracking-[0.16em] text-[#806C66] sm:block sm:text-xs sm:tracking-[0.22em]">
              {isAdmin ? 'Admin Portal • Operations Center' : 'Weddings • Events • Decorations'}
            </div>
          </div>
        </Link>

        {/* Desktop Main Navigation */}
        <nav aria-label="Main navigation" className="hidden items-center gap-4 xl:flex">
          {activeNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-medium transition ${
                    isActive ? 'font-semibold text-[#6B1E2B]' : 'text-[#33201D] hover:text-[#6B1E2B]'
                  }`
                }
              >
                {Icon && <Icon size={15} aria-hidden="true" />}
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Desktop Right Actions */}
        <div className="hidden items-center gap-2 xl:flex xl:gap-3">
          {isAdmin ? (
            /* ADMIN-ONLY HEADER ACTIONS */
            <>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-[#D7B46B] bg-[#FFF8ED] px-3.5 py-2 text-xs font-semibold text-[#6B1E2B]">
                <ShieldCheck size={15} aria-hidden="true" />
                <span>Administrator</span>
              </div>
              <Link
                to="/admin"
                className="inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-full bg-[#6B1E2B] px-4 py-2.5 text-sm font-medium text-white shadow-soft transition hover:bg-[#45121C]"
              >
                <LayoutDashboard size={16} aria-hidden="true" />
                Operations Dashboard
              </Link>
              <button
                type="button"
                onClick={logout}
                className="min-h-11 whitespace-nowrap rounded-full border border-[#6B1E2B] px-4 py-2 text-sm font-medium text-[#6B1E2B] transition hover:bg-[#FFF3E1]"
              >
                Logout
              </button>
            </>
          ) : (
            /* CLIENT / VISITOR HEADER ACTIONS */
            <>
              <Link
                to="/cart"
                className="inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-full border border-[#D7B46B] bg-[#FFF8ED] px-4 py-2.5 text-sm font-medium text-[#6B1E2B] transition hover:bg-[#F7EBDD] xl:px-4"
              >
                <ShoppingBasket size={17} aria-hidden="true" />
                My Cart
                <span
                  aria-label={`${selectedUnitCount} selected units`}
                  className="rounded-full bg-[#6B1E2B] px-2 py-0.5 text-xs tabular-nums text-white"
                >
                  {selectedUnitCount}
                </span>
              </Link>
              <Link
                to="/build-event"
                className="inline-flex min-h-11 items-center whitespace-nowrap rounded-full bg-[#6B1E2B] px-4 py-2.5 text-sm font-medium text-white shadow-soft transition hover:bg-[#45121C] xl:px-4"
              >
                Build Your Event
              </Link>
              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    className="inline-flex min-h-11 items-center whitespace-nowrap px-2 text-sm font-medium text-[#6B1E2B]"
                  >
                    My Bookings
                  </Link>
                  <button
                    type="button"
                    onClick={logout}
                    className="min-h-11 whitespace-nowrap rounded-full border border-[#6B1E2B] px-4 py-2 text-sm font-medium text-[#6B1E2B] transition hover:bg-[#FFF3E1]"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="inline-flex min-h-11 items-center whitespace-nowrap rounded-full border border-[#6B1E2B] px-4 py-2 text-sm font-medium text-[#6B1E2B] transition hover:bg-[#FFF3E1]"
                  >
                    Login
                  </Link>
                  <Link
                    to="/admin/login"
                    className="inline-flex min-h-11 items-center whitespace-nowrap px-2 text-sm font-medium text-[#6B1E2B] hover:text-[#45121C]"
                  >
                    Admin
                  </Link>
                </>
              )}
            </>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#E7CC91] bg-white text-[#6B1E2B] transition hover:bg-[#FFF3E1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6B1E2B] xl:hidden"
          onClick={() => setMenuOpen((value) => !value)}
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
        >
          {menuOpen ? <X size={23} aria-hidden="true" /> : <Menu size={23} aria-hidden="true" />}
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      <div
        id="mobile-navigation"
        hidden={!menuOpen}
        className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-[#F0D7AF] bg-[#FFFDF9] px-4 py-4 shadow-lg sm:px-6 xl:hidden"
      >
        <nav aria-label="Mobile navigation" className="mx-auto flex max-w-7xl flex-col gap-1">
          {activeNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `flex min-h-12 items-center gap-2 rounded-xl px-4 text-base font-medium transition ${
                    isActive
                      ? 'bg-[#F7EBDD] font-semibold text-[#6B1E2B]'
                      : 'text-[#33201D] hover:bg-[#FFF3E1] hover:text-[#6B1E2B]'
                  }`
                }
              >
                {Icon && <Icon size={18} aria-hidden="true" />}
                {item.label}
              </NavLink>
            );
          })}

          {isAdmin ? (
            /* ADMIN MOBILE ACTIONS */
            <div className="mt-3 border-t border-[#F0D7AF] pt-3">
              <div className="mb-2 flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#6B1E2B]">
                <ShieldCheck size={16} aria-hidden="true" /> Logged in as Administrator
              </div>
              <Link
                to="/admin"
                onClick={() => setMenuOpen(false)}
                className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#6B1E2B] px-4 py-3 text-center font-semibold text-white shadow-soft transition hover:bg-[#45121C]"
              >
                <LayoutDashboard size={18} aria-hidden="true" /> Open Admin Dashboard
              </Link>
              <button
                type="button"
                onClick={() => {
                  logout();
                  setMenuOpen(false);
                }}
                className="mt-2 flex min-h-12 w-full items-center justify-center rounded-full border border-[#6B1E2B] px-4 py-3 font-semibold text-[#6B1E2B] transition hover:bg-[#FFF3E1]"
              >
                Logout
              </button>
            </div>
          ) : (
            /* CLIENT MOBILE ACTIONS */
            <>
              <Link
                to="/cart"
                onClick={() => setMenuOpen(false)}
                className="mt-2 inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#D7B46B] bg-[#FFF8ED] px-4 py-3 text-center font-semibold text-[#6B1E2B] transition hover:bg-[#F7EBDD]"
              >
                <ShoppingBasket size={18} aria-hidden="true" />
                My Cart
                <span
                  aria-label={`${selectedUnitCount} selected units`}
                  className="rounded-full bg-[#6B1E2B] px-2 py-0.5 text-xs tabular-nums text-white"
                >
                  {selectedUnitCount}
                </span>
              </Link>
              <Link
                to="/build-event"
                onClick={() => setMenuOpen(false)}
                className="mt-2 inline-flex min-h-12 items-center justify-center rounded-full bg-[#6B1E2B] px-4 py-3 text-center font-semibold text-white shadow-soft transition hover:bg-[#45121C]"
              >
                Build Your Event
              </Link>
              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="mt-2 flex min-h-12 items-center rounded-xl px-4 font-medium text-[#6B1E2B] hover:bg-[#FFF3E1]"
                  >
                    My Bookings
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setMenuOpen(false);
                    }}
                    className="flex min-h-12 items-center rounded-xl px-4 text-left font-medium text-[#6B1E2B] hover:bg-[#FFF3E1]"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="mt-2 flex min-h-12 items-center rounded-xl px-4 font-medium text-[#6B1E2B] hover:bg-[#FFF3E1]"
                  >
                    Login
                  </Link>
                  <Link
                    to="/admin/login"
                    onClick={() => setMenuOpen(false)}
                    className="flex min-h-12 items-center rounded-xl px-4 font-medium text-[#6B1E2B] hover:bg-[#FFF3E1]"
                  >
                    Admin login
                  </Link>
                </>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
