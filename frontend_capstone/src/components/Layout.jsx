import { Outlet } from 'react-router-dom';
import Sidebar from './Navbar';

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      {/* Main content offset by sidebar width */}
      <main className="md:ml-64 pt-14 md:pt-0 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
