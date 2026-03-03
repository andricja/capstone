import { useEffect, useState } from 'react';
import api from '../../lib/api';
import DataTable from '../../components/DataTable';
import { TableSkeleton } from '../../components/Skeleton';
import { Download, BarChart3, DollarSign, Tractor, TrendingUp } from 'lucide-react';

export default function AdminReports() {
  const [data, setData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchData = () => {
    setLoading(true);
    const params = { all: 1 };
    if (filter !== 'custom') params.filter = filter;
    if (filter === 'custom' && startDate && endDate) {
      params.start_date = startDate;
      params.end_date = endDate;
    }
    api.get('/admin/reports/revenue', { params })
      .then((r) => {
        setData(r.data);
        const txns = r.data?.transactions;
        setTransactions(Array.isArray(txns) ? txns : txns?.data ?? []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleFilter = () => { fetchData(); };

  const handleExportCsv = () => {
    const params = new URLSearchParams();
    if (filter !== 'custom') params.set('filter', filter);
    if (filter === 'custom' && startDate && endDate) {
      params.set('start_date', startDate);
      params.set('end_date', endDate);
    }
    const token = localStorage.getItem('token');
    window.open(`/api/admin/reports/revenue/csv?${params.toString()}&token=${token}`, '_blank');
  };

  const columns = [
    {
      key: 'id',
      label: 'Receipt No.',
      render: (row) => <span className="font-mono text-xs text-gray-500">RCP-{String(row.id).padStart(5, '0')}</span>,
      sortValue: (row) => row.id,
    },
    {
      key: 'approved_at',
      label: 'Approved Date',
      render: (row) => <span className="text-gray-600 text-sm">{row.approved_at ? new Date(row.approved_at).toLocaleDateString() : '—'}</span>,
    },
    {
      key: 'owner.name',
      label: 'Owner',
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900">{row.owner?.name ?? '—'}</p>
          <p className="text-xs text-gray-400">{row.owner?.email ?? ''}</p>
        </div>
      ),
    },
    {
      key: 'name',
      label: 'Equipment',
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.image ? (
            <img src={`/storage/${row.image}`} alt={row.name} className="w-8 h-8 rounded object-cover" />
          ) : (
            <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-sm text-gray-300">🚜</div>
          )}
          <div>
            <p className="font-medium text-gray-900">{row.name}</p>
            <p className="text-xs text-gray-400 capitalize">{row.category} • {row.location}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'daily_rate',
      label: 'Daily Rate',
      align: 'right',
      render: (row) => <span className="text-gray-600">₱{parseFloat(row.daily_rate).toLocaleString()}</span>,
      sortValue: (row) => parseFloat(row.daily_rate),
    },
    {
      key: 'approval_fee',
      label: 'Approval Fee',
      align: 'right',
      render: (row) => <span className="text-green-700 font-semibold">₱{parseFloat(row.approval_fee).toLocaleString()}</span>,
      sortValue: (row) => parseFloat(row.approval_fee),
    },
    {
      key: 'status',
      label: 'Status',
      align: 'center',
      render: () => (
        <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full">Approved</span>
      ),
    },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-7 h-7 text-green-600" />
          <h1 className="text-2xl font-bold text-gray-900">Revenue Reports</h1>
        </div>
        <button onClick={handleExportCsv}
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-1">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Time Period</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none">
            <option value="day">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>
        {filter === 'custom' && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none" />
            </div>
          </>
        )}
        <button onClick={handleFilter} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">Apply</button>
      </div>

      {/* Summary */}
      {data?.summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border p-5 flex items-center gap-4">
            <div className="bg-green-50 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">₱{parseFloat(data.summary.total_revenue).toLocaleString()}</p>
              <p className="text-sm text-gray-500">Total Revenue</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5 flex items-center gap-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <Tractor className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{data.summary.total_approvals}</p>
              <p className="text-sm text-gray-500">Equipment Approved</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5 flex items-center gap-4">
            <div className="bg-amber-50 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">₱{parseFloat(data.summary.average_fee).toLocaleString()}</p>
              <p className="text-sm text-gray-500">Average Fee</p>
            </div>
          </div>
        </div>
      )}

      {/* Transactions DataTable */}
      {loading ? (
        <TableSkeleton rows={8} cols={5} />
      ) : (
        <DataTable
          columns={columns}
          data={transactions}
          searchKeys={['name', 'category', 'location', 'owner.name', 'owner.email']}
          defaultSort={{ key: 'approved_at', dir: 'desc' }}
          emptyMessage="No approved equipment in this period."
        />
      )}
    </div>
  );
}
