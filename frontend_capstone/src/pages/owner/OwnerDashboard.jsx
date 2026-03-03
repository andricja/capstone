import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { Truck, ClipboardCheck, Settings, CheckCircle } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const PIE_COLORS = ['#22c55e', '#3b82f6', '#a855f7', '#f59e0b', '#ef4444', '#06b6d4'];

export default function OwnerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('yearly');

  const periodLabels = { today: "Today's", weekly: "This Week's", monthly: "This Month's", yearly: 'Monthly' };

  useEffect(() => {
    setLoading(true);
    api.get(`/dashboard?period=${period}`).then((r) => setData(r.data)).finally(() => setLoading(false));
  }, [period]);

  if (loading) return <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto" /></div>;

  const charts = data?.charts || {};
  const monthlyRentals = charts.monthly_rentals || [];
  const monthlyRevenue = charts.monthly_revenue || [];
  const revenueByEquipment = charts.revenue_by_equipment || [];
  const categoryDistribution = charts.category_distribution || [];

  // Equipment status data for pie chart
  const equipmentStatusData = [
    { name: 'Available', value: data?.equipment?.available || 0 },
    { name: 'Rented', value: data?.equipment?.rented || 0 },
    { name: 'Maintenance', value: data?.equipment?.maintenance || 0 },
    { name: 'Pending', value: data?.equipment?.pending || 0 },
  ].filter((d) => d.value > 0);

  // Rental request status data for pie chart
  const rentalStatusData = [
    { name: 'Forwarded', value: data?.rental_requests?.forwarded || 0 },
    { name: 'Approved', value: data?.rental_requests?.approved || 0 },
    { name: 'Rejected', value: data?.rental_requests?.rejected || 0 },
  ].filter((d) => d.value > 0);

  const fmt = (v) => '₱' + parseFloat(v || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

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

      {/* ═══════════ CHARTS ═══════════ */}

      {/* Period Filter */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-sm font-medium text-gray-500 mr-2">Period:</span>
        {['today', 'weekly', 'monthly', 'yearly'].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
              period === p
                ? 'bg-green-600 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Row 1: Rental Requests (bar) + Revenue (line) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        {/* Monthly Rental Requests */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h2 className="font-semibold text-gray-900 mb-4">{periodLabels[period]} Rental Requests</h2>
          {monthlyRentals.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyRentals} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="forwarded" name="Pending" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="approved" name="Approved" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="rejected" name="Rejected" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-400 py-12">No rental data yet.</p>
          )}
        </div>

        {/* Monthly Revenue */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h2 className="font-semibold text-gray-900 mb-4">{periodLabels[period]} Revenue</h2>
          {monthlyRevenue.some((m) => m.revenue > 0) ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={monthlyRevenue} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => fmt(v)} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => fmt(v)} />
                <Legend />
                <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-400 py-12">No revenue data yet.</p>
          )}
        </div>
      </div>

      {/* Row 2: Equipment Status (pie) + Rental Status (pie) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        {/* Equipment Status Distribution */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Equipment Status</h2>
          {equipmentStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={equipmentStatusData} cx="50%" cy="50%" innerRadius={55} outerRadius={100} paddingAngle={3}
                  dataKey="value" nameKey="name" label={({ name, value }) => `${name}: ${value}`}>
                  {equipmentStatusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-400 py-12">No equipment data.</p>
          )}
        </div>

        {/* Rental Request Status Distribution */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Rental Request Status</h2>
          {rentalStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={rentalStatusData} cx="50%" cy="50%" innerRadius={55} outerRadius={100} paddingAngle={3}
                  dataKey="value" nameKey="name" label={({ name, value }) => `${name}: ${value}`}>
                  {rentalStatusData.map((_, i) => <Cell key={i} fill={['#3b82f6', '#22c55e', '#ef4444'][i]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-400 py-12">No rental requests yet.</p>
          )}
        </div>
      </div>

      {/* Row 3: Revenue by Equipment (bar) + Category Distribution (pie) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        {/* Revenue by Equipment */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Top Equipment by Revenue</h2>
          {revenueByEquipment.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={revenueByEquipment} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tickFormatter={(v) => fmt(v)} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v, n) => n === 'revenue' ? fmt(v) : v} />
                <Legend />
                <Bar dataKey="revenue" name="Revenue" fill="#22c55e" radius={[0, 4, 4, 0]} />
                <Bar dataKey="rentals" name="Rentals" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-400 py-12">No revenue data yet.</p>
          )}
        </div>

        {/* Category Distribution */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Equipment by Category</h2>
          {categoryDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={categoryDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={100} paddingAngle={3}
                  dataKey="count" nameKey="category" label={({ category, count }) => `${category}: ${count}`}>
                  {categoryDistribution.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-400 py-12">No equipment data.</p>
          )}
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
