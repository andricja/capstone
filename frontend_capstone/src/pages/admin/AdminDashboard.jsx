import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { ClipboardList, Truck, Coins, Mail, Users, UsersRound } from 'lucide-react';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then((r) => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>

      {/* Pending items requiring attention */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <PendingCard count={data?.pending_points_requests || 0} label="Pending Points Requests" color="yellow" />
        <PendingCard count={data?.pending_equipment_approvals || 0} label="Pending Equipment Approvals" color="blue" />
        <PendingCard count={data?.pending_message_requests || 0} label="Pending Messages" color="purple" />
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard icon={<Users />} label="Renters" value={data?.total_renters || 0} />
        <StatCard icon={<UsersRound />} label="Owners" value={data?.total_owners || 0} />
        <StatCard icon={<Truck />} label="Equipment" value={data?.total_equipment || 0} />
        <StatCard icon={<ClipboardList />} label="Total Rentals" value={data?.total_rentals || 0} />
        <StatCard icon={<Coins />} label="Revenue (Month)" value={`₱${parseFloat(data?.revenue_this_month || 0).toLocaleString()}`} />
        <StatCard icon={<Mail />} label="Messages" value={data?.pending_message_requests || 0} />
      </div>
    </div>
  );
}

function PendingCard({ count, label, color }) {
  const colors = {
    yellow: 'border-yellow-400 bg-yellow-50',
    blue: 'border-blue-400 bg-blue-50',
    purple: 'border-purple-400 bg-purple-50',
  };
  const textColors = {
    yellow: 'text-yellow-700',
    blue: 'text-blue-700',
    purple: 'text-purple-700',
  };
  return (
    <div className={`rounded-xl border-l-4 p-5 ${colors[color]}`}>
      <p className={`text-3xl font-bold ${textColors[color]}`}>{count}</p>
      <p className="text-sm text-gray-600 mt-1">{label}</p>
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
      <div className="text-xl text-gray-400 flex justify-center mb-1">{icon}</div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
