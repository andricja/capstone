import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import { Coins, ClipboardList, Truck, AlertTriangle } from 'lucide-react';

export default function RenterDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then((r) => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Renter Dashboard</h1>

      {/* No points warning */}
      {user.points === 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-lg">
          <div className="flex items-center">
            <AlertTriangle className="text-yellow-400 text-xl mr-3" />
            <div>
              <p className="text-sm font-medium text-yellow-800">You have no points!</p>
              <p className="text-sm text-yellow-700">You need at least 1 point to request equipment rentals. <Link to="/renter/points" className="underline font-medium">Buy Points</Link></p>
            </div>
          </div>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<Coins />} label="Points Balance" value={user.points} color="yellow" />
        <StatCard icon={<ClipboardList />} label="Total Rentals" value={data?.rental_requests?.total || 0} color="blue" />
        <StatCard icon={<Truck />} label="Active Rentals" value={data?.rental_requests?.approved || 0} color="green" />
        <StatCard icon={<ClipboardList />} label="Pending Requests" value={data?.rental_requests?.forwarded || 0} color="purple" />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Link to="/renter/equipment" className="bg-white rounded-xl shadow-sm border p-6 text-center hover:shadow-md transition-shadow">
          <div className="text-3xl mb-2">🚜</div>
          <h3 className="font-semibold text-gray-900">Browse Equipment</h3>
          <p className="text-sm text-gray-500 mt-1">Find available equipment near you</p>
        </Link>
        <Link to="/renter/points" className="bg-white rounded-xl shadow-sm border p-6 text-center hover:shadow-md transition-shadow">
          <div className="text-3xl mb-2">💰</div>
          <h3 className="font-semibold text-gray-900">Buy Points</h3>
          <p className="text-sm text-gray-500 mt-1">Purchase points via GCash</p>
        </Link>
        <Link to="/renter/messages" className="bg-white rounded-xl shadow-sm border p-6 text-center hover:shadow-md transition-shadow">
          <div className="text-3xl mb-2">✉️</div>
          <h3 className="font-semibold text-gray-900">Contact Us</h3>
          <p className="text-sm text-gray-500 mt-1">Send an inquiry or question</p>
        </Link>
      </div>

      {/* Recent rentals */}
      {data?.recent_rentals?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h2 className="font-semibold text-gray-900">Recent Rentals</h2>
          </div>
          <div className="divide-y">
            {data.recent_rentals.map((r) => (
              <div key={r.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{r.equipment?.name}</p>
                  <p className="text-sm text-gray-500">{r.start_date} — {r.end_date}</p>
                </div>
                <StatusBadge status={r.status} />
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
    yellow: 'bg-yellow-50 text-yellow-600',
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <div className="bg-white rounded-xl shadow-sm border p-5">
      <div className={`inline-flex p-2 rounded-lg text-xl ${colors[color]}`}>{icon}</div>
      <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}
