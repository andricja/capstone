import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { Truck, ClipboardCheck, Settings, CheckCircle } from 'lucide-react';

export default function OwnerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then((r) => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Owner Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<Truck />} label="Total Equipment" value={data?.equipment?.total || 0} color="blue" />
        <StatCard icon={<CheckCircle />} label="Available" value={data?.equipment?.available || 0} color="green" />
        <StatCard icon={<ClipboardCheck />} label="Rented" value={data?.equipment?.rented || 0} color="purple" />
        <StatCard icon={<Settings />} label="Maintenance" value={data?.equipment?.maintenance || 0} color="amber" />
      </div>

      {/* Rental request stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border p-5 text-center">
          <p className="text-3xl font-bold text-blue-600">{data?.rental_requests?.forwarded || 0}</p>
          <p className="text-sm text-gray-500 mt-1">Pending Requests</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-5 text-center">
          <p className="text-3xl font-bold text-green-600">{data?.rental_requests?.approved || 0}</p>
          <p className="text-sm text-gray-500 mt-1">Approved Rentals</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-5 text-center">
          <p className="text-3xl font-bold text-gray-600">{data?.rental_requests?.total || 0}</p>
          <p className="text-sm text-gray-500 mt-1">Total Requests</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Link to="/owner/equipment" className="bg-white rounded-xl shadow-sm border p-6 text-center hover:shadow-md transition-shadow">
          <div className="text-3xl mb-2">🚜</div>
          <h3 className="font-semibold text-gray-900">Manage Equipment</h3>
          <p className="text-sm text-gray-500 mt-1">Add, edit, or toggle equipment status</p>
        </Link>
        <Link to="/owner/rentals" className="bg-white rounded-xl shadow-sm border p-6 text-center hover:shadow-md transition-shadow">
          <div className="text-3xl mb-2">📋</div>
          <h3 className="font-semibold text-gray-900">Rental Requests</h3>
          <p className="text-sm text-gray-500 mt-1">Review and manage incoming requests</p>
        </Link>
        <Link to="/owner/gcash" className="bg-white rounded-xl shadow-sm border p-6 text-center hover:shadow-md transition-shadow">
          <div className="text-3xl mb-2">💳</div>
          <h3 className="font-semibold text-gray-900">GCash Settings</h3>
          <p className="text-sm text-gray-500 mt-1">Configure your payment details</p>
        </Link>
      </div>

      {/* Recent requests */}
      {data?.recent_requests?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="px-6 py-4 border-b"><h2 className="font-semibold text-gray-900">Recent Rental Requests</h2></div>
          <div className="divide-y">
            {data.recent_requests.map((r) => (
              <div key={r.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{r.equipment?.name}</p>
                  <p className="text-sm text-gray-500">From: {r.renter?.name} ({r.renter?.email})</p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                  r.status === 'forwarded' ? 'bg-blue-100 text-blue-800' :
                  r.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>{r.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600',
  };
  return (
    <div className="bg-white rounded-xl shadow-sm border p-5">
      <div className={`inline-flex p-2 rounded-lg text-xl ${colors[color]}`}>{icon}</div>
      <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}
