import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Menu, X, Tractor, LogOut,
  Home, Search, ClipboardList, Coins, Mail,
  Package, ClipboardCheck, Settings, Users, BarChart3,
  CheckCircle,
} from 'lucide-react';
import { useState } from 'react';

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

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-green-700 text-white flex items-center justify-between h-14 px-4 shadow-lg">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <Tractor className="w-5 h-5" />
          <span>FERMs</span>
        </Link>
        <button onClick={() => setOpen(!open)} className="text-2xl">
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 bg-black/40 z-40" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-green-800 text-white flex flex-col transition-transform duration-200 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-5 h-16 border-b border-green-700 shrink-0">
          <Tractor className="w-6 h-6 text-green-300" />
          <span className="text-xl font-bold tracking-wide">FERMs</span>
        </div>

        {/* User info */}
        {user && (
          <div className="px-5 py-4 border-b border-green-700 shrink-0">
            <p className="text-sm font-semibold truncate">{user.name}</p>
            <p className="text-xs text-green-300 capitalize">{user.role}</p>
            {user.role === 'renter' && (
              <span className="inline-block mt-1 bg-yellow-500 text-black rounded px-2 py-0.5 text-xs font-bold">
                {user.points} pts
              </span>
            )}
          </div>
        )}

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
        { to: '/renter/points', label: 'Buy Points', icon: <Coins className="w-5 h-5" /> },
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
      ];
    default:
      return [];
  }
}
