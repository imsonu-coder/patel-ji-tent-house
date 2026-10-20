import { Link, NavLink } from 'react-router-dom';
import { Menu, PhoneCall } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/items', label: 'Items' },
  { to: '/build-event', label: 'Build Your Event' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' }
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-[#F0D7AF] bg-[#FFFDF9]/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#6B1E2B] text-lg font-bold text-white shadow-soft">
            PJ
          </div>
          <div>
            <div className="font-[Playfair_Display] text-xl font-bold text-[#33201D]">Patel Ji Tent House</div>
            <div className="text-xs uppercase tracking-[0.22em] text-[#806C66]">Weddings • Events • Decorations</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `text-sm font-medium transition ${isActive ? 'text-[#6B1E2B]' : 'text-[#33201D] hover:text-[#6B1E2B]'}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <a href="tel:+919999999999" className="inline-flex items-center gap-2 rounded-full border border-[#D7B46B] px-4 py-2 text-sm font-medium text-[#6B1E2B]">
            <PhoneCall size={16} /> Call
          </a>
          <Link to="/build-event" className="rounded-full bg-[#6B1E2B] px-5 py-2.5 text-sm font-medium text-white shadow-soft hover:bg-[#45121C]">
            Build Your Event
          </Link>
          {user ? (
            <>
              <Link to={user.role === 'admin' ? '/admin' : '/dashboard'} className="text-sm font-medium text-[#6B1E2B]">
                Dashboard
              </Link>
              <button onClick={logout} className="rounded-full border border-[#6B1E2B] px-4 py-2 text-sm font-medium text-[#6B1E2B]">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="rounded-full border border-[#6B1E2B] px-4 py-2 text-sm font-medium text-[#6B1E2B]">
                Login
              </Link>
              <Link to="/admin/login" className="text-sm font-medium text-[#6B1E2B]">
                Admin
              </Link>
            </>
          )}
        </div>

        <button className="lg:hidden" onClick={() => setMenuOpen((value) => !value)} aria-label="Toggle menu">
          <Menu size={24} />
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-[#F0D7AF] bg-[#FFFDF9] px-4 py-4 lg:hidden">
          <div className="flex flex-col gap-4">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} onClick={() => setMenuOpen(false)} className="text-[#33201D]">
                {item.label}
              </NavLink>
            ))}
            <Link to="/build-event" onClick={() => setMenuOpen(false)} className="rounded-full bg-[#6B1E2B] px-4 py-2 text-center text-white">
              Build Your Event
            </Link>
            {user ? (
              <>
                <Link to={user.role === 'admin' ? '/admin' : '/dashboard'} onClick={() => setMenuOpen(false)} className="text-[#6B1E2B]">
                  Dashboard
                </Link>
                <button onClick={() => { logout(); setMenuOpen(false); }} className="text-left text-[#6B1E2B]">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)} className="text-[#6B1E2B]">
                  Login
                </Link>
                <Link to="/admin/login" onClick={() => setMenuOpen(false)} className="text-[#6B1E2B]">
                  Admin login
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
