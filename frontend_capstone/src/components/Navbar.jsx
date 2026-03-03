import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Menu, X, Tractor, LogOut,
  Home, Search, ClipboardList, Mail,
  Package, ClipboardCheck, Settings, Users, BarChart3,
  CheckCircle, UserCheck, Server, Bell,
} from 'lucide-react';
import { useState } from 'react';

const HEADER_H = 'h-14'; // shared height token
const HEADER_PX = '56px';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navLinks = getNavLinks(user?.role);
  const isActive = (path) => location.pathname === path;

  // Derive page title from current route
  const currentLink = navLinks.find((l) => l.to === location.pathname);
  const pageTitle = currentLink?.label || 'Dashboard';

  return (
    <>
      {/* ═══════ Top Header Bar (always visible) ═══════ */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 ${HEADER_H} bg-green-800 text-white flex items-center justify-between px-4 md:pl-[272px] shadow-sm`}
      >
        {/* Mobile: logo + hamburger */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden text-white hover:text-green-200"
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <Link to="/" className="md:hidden flex items-center gap-2 text-white font-bold text-lg">
            <Tractor className="w-5 h-5" />
            <span>FERMs</span>
          </Link>
          {/* Desktop: page title */}
          <h1 className="hidden md:block text-lg font-semibold text-white">{pageTitle}</h1>
        </div>

        {/* Right side: user info */}
        {user && (
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-white leading-tight">{user.name}</p>
              <p className="text-xs text-green-300 capitalize">{user.role}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold">
              {user.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
      </header>

      {/* Mobile overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 bg-black/40 z-40" style={{ top: HEADER_PX }} onClick={() => setOpen(false)} />
      )}

      {/* ═══════ Sidebar (below header) ═══════ */}
      <aside
        className={`fixed left-0 z-40 w-64 bg-green-800 text-white flex flex-col transition-transform duration-200 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
        style={{ top: HEADER_PX, height: `calc(100vh - ${HEADER_PX})` }}
      >
        {/* Logo area inside sidebar (desktop) */}
        <div className="hidden md:flex items-center gap-2 px-5 h-14 border-b border-green-700 shrink-0">
          <Tractor className="w-6 h-6 text-green-300" />
          <span className="text-xl font-bold tracking-wide">FERMs</span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(link.to)
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'text-green-100 hover:bg-green-700'
              }`}
            >
              <span className="text-lg">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        {user && (
          <div className="px-3 py-4 border-t border-green-700 shrink-0">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-300 hover:bg-green-700 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

function getNavLinks(role) {
  if (!role) return [];
  switch (role) {
    case 'renter':
      return [
        { to: '/renter/dashboard', label: 'Dashboard', icon: <Home className="w-5 h-5" /> },
        { to: '/renter/browse', label: 'Browse Equipment', icon: <Search className="w-5 h-5" /> },
        { to: '/renter/rentals', label: 'My Rentals', icon: <ClipboardList className="w-5 h-5" /> },
        { to: '/renter/messages', label: 'Contact Us', icon: <Mail className="w-5 h-5" /> },
      ];
    case 'owner':
      return [
        { to: '/owner/dashboard', label: 'Dashboard', icon: <Home className="w-5 h-5" /> },
        { to: '/owner/equipment', label: 'My Equipment', icon: <Package className="w-5 h-5" /> },
        { to: '/owner/rentals', label: 'Rental Requests', icon: <ClipboardCheck className="w-5 h-5" /> },
        { to: '/owner/gcash', label: 'GCash Settings', icon: <Settings className="w-5 h-5" /> },
      ];
    case 'admin':
      return [
        { to: '/admin/dashboard', label: 'Dashboard', icon: <Home className="w-5 h-5" /> },
        { to: '/admin/owners', label: 'Owners', icon: <Users className="w-5 h-5" /> },
        { to: '/admin/equipment', label: 'Equipment Approvals', icon: <CheckCircle className="w-5 h-5" /> },
        { to: '/admin/rentals', label: 'All Rentals', icon: <ClipboardList className="w-5 h-5" /> },
        { to: '/admin/messages', label: 'Messages', icon: <Mail className="w-5 h-5" /> },
        { to: '/admin/reports', label: 'Revenue Reports', icon: <BarChart3 className="w-5 h-5" /> },
        { to: '/admin/accounts', label: 'Accounts', icon: <UserCheck className="w-5 h-5" /> },
        { to: '/admin/smtp-settings', label: 'Email Settings', icon: <Server className="w-5 h-5" /> },
      ];
    default:
      return [];
  }
}
