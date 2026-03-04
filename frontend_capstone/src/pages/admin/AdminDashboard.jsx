import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { DashboardSkeleton } from '../../components/Skeleton';
import { ClipboardList, Truck, Coins, Mail, Users, UsersRound } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const PIE_COLORS = ['#22c55e', '#3b82f6', '#a855f7', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6'];

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('yearly');

  const periodLabels = { today: "Today's", weekly: "This Week's", monthly: "This Month's", yearly: 'Monthly' };

  useEffect(() => {
    setLoading(true);
    api.get(`/dashboard?period=${period}`).then((r) => setData(r.data)).finally(() => setLoading(false));
  }, [period]);

  if (loading) return <DashboardSkeleton statCount={6} />;

  const charts = data?.charts || {};
  const rentalChart = charts.rental_requests || [];
  const revenueChart = charts.revenue || [];
  const usersChart = charts.users || [];
  const topEquipment = charts.top_equipment || [];
  const categoryDistribution = charts.category_distribution || [];
  const paymentMethods = charts.payment_methods || [];

  // Rental status pie data
  const rentalStatusData = [
    { name: 'Forwarded', value: data?.rental_requests?.forwarded || 0 },
    { name: 'Approved', value: data?.rental_requests?.approved || 0 },
    { name: 'Rejected', value: data?.rental_requests?.rejected || 0 },
  ].filter((d) => d.value > 0);

  // Equipment status pie data
  const eqStatuses = data?.equipment_statuses || {};
  const equipmentStatusData = [
    { name: 'Available', value: eqStatuses.available || 0 },
    { name: 'Rented', value: eqStatuses.rented || 0 },
    { name: 'Maintenance', value: eqStatuses.maintenance || 0 },
    { name: 'Pending', value: eqStatuses.pending || 0 },
    { name: 'Rejected', value: eqStatuses.rejected || 0 },
  ].filter((d) => d.value > 0);

  // Payment method pie data
  const paymentData = paymentMethods.map((p) => ({
    name: p.payment_method === 'gcash' ? 'GCash' : 'COD',
    value: p.count,
  }));

  const fmt = (v) => '₱' + parseFloat(v || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Admin Dashboard</h1>

      {/* Overview stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard icon={<Users />} label="Renters" value={data?.total_renters || 0} />
        <StatCard icon={<UsersRound />} label="Owners" value={data?.total_owners || 0} />
        <StatCard icon={<Truck />} label="Equipment" value={data?.total_equipment || 0} />
        <StatCard icon={<ClipboardList />} label="Total Rentals" value={data?.total_rentals || 0} />
        <StatCard icon={<Coins />} label="Revenue (Month)" value={`₱${parseFloat(data?.revenue_this_month || 0).toLocaleString()}`} />
        <StatCard icon={<Mail />} label="Messages" value={data?.pending_message_requests || 0} />
      </div>

      {/* ═══════════ CHARTS ═══════════ */}

      {/* Period Filter */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mr-2">Period:</span>
        {['today', 'weekly', 'monthly', 'yearly'].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
              period === p
                ? 'bg-green-600 text-white shadow-sm'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Row 1: Rental Requests (bar) + Revenue (line) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-green-200 dark:border-green-700 p-5 transition-colors">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">{periodLabels[period]} Rental Requests</h2>
          {rentalChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={rentalChart} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
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

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-green-200 dark:border-green-700 p-5 transition-colors">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">{periodLabels[period]} Revenue</h2>
          {revenueChart.some((m) => m.revenue > 0) ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={revenueChart} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
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

      {/* Row 2: User Registrations (bar) + Top Equipment Revenue (horizontal bar) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-green-200 dark:border-green-700 p-5 transition-colors">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">{periodLabels[period]} User Registrations</h2>
          {usersChart.some((u) => u.renters > 0 || u.owners > 0) ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={usersChart} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="renters" name="Renters" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="owners" name="Owners" fill="#a855f7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-400 py-12">No user registration data.</p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-green-200 dark:border-green-700 p-5 transition-colors">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Top Equipment by Revenue</h2>
          {topEquipment.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topEquipment} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
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
      </div>

      {/* Row 3: Equipment Status (pie) + Rental Status (pie) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-green-200 dark:border-green-700 p-5 transition-colors">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Equipment Status</h2>
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

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-green-200 dark:border-green-700 p-5 transition-colors">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Rental Request Status</h2>
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

      {/* Row 4: Category Distribution (pie) + Payment Methods (pie) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-green-200 dark:border-green-700 p-5 transition-colors">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Equipment by Category</h2>
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

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-green-200 dark:border-green-700 p-5 transition-colors">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">{periodLabels[period]} Payment Methods</h2>
          {paymentData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={paymentData} cx="50%" cy="50%" innerRadius={55} outerRadius={100} paddingAngle={3}
                  dataKey="value" nameKey="name" label={({ name, value }) => `${name}: ${value}`}>
                  {paymentData.map((_, i) => <Cell key={i} fill={['#f59e0b', '#3b82f6'][i]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-400 py-12">No payment data yet.</p>
          )}
        </div>
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

function StatCard({ icon, label, value, color = 'green' }) {
  const borderColors = {
    green: 'border-l-green-500', blue: 'border-l-blue-500', amber: 'border-l-amber-500',
    purple: 'border-l-purple-500', red: 'border-l-red-500', yellow: 'border-l-yellow-500',
  };
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-md border border-green-200 dark:border-green-700 border-l-4 ${borderColors[color] || borderColors.green} p-4 text-center transition-colors`}>
      <div className="text-xl text-gray-400 dark:text-gray-500 flex justify-center mb-1">{icon}</div>
      <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}
