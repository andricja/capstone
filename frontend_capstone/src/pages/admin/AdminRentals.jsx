import { useEffect, useState } from 'react';
import api from '../../lib/api';
import StatusBadge from '../../components/StatusBadge';
import { TableSkeleton } from '../../components/Skeleton';
import DataTable from '../../components/DataTable';
import { ClipboardList, CheckCircle, XCircle, LayoutList, X, User, Mail, Phone, MapPin, Calendar, Tractor, DollarSign, Truck } from 'lucide-react';

const FILTERS = [
  { key: 'all',      label: 'All',      icon: <LayoutList className="w-4 h-4" /> },
  { key: 'approved', label: 'Approved', icon: <CheckCircle className="w-4 h-4" /> },
  { key: 'rejected', label: 'Rejected', icon: <XCircle className="w-4 h-4" /> },
];

export default function AdminRentals() {
  const [data, setData] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const fetchRentals = (f = filter) => {
    setLoading(true);
    const params = { all: 1 };
    if (f !== 'all') params.status = f;
    api.get('/admin/rental-requests', { params })
      .then((r) => setData(Array.isArray(r.data) ? r.data : r.data?.data ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRentals(filter); }, [filter]);

  const columns = [
    {
      key: 'created_at',
      label: 'Date',
      render: (row) => <span className="text-gray-600">{new Date(row.created_at).toLocaleDateString()}</span>,
    },
    {
      key: 'renter.name',
      label: 'Renter',
      render: (row) => <span className="font-medium">{row.renter?.name}</span>,
    },
    {
      key: 'equipment.name',
      label: 'Equipment',
      render: (row) => (
        <div>
          {row.equipment?.name}
          <br />
          <span className="text-xs text-gray-400 capitalize">{row.equipment?.category}</span>
        </div>
      ),
    },
    {
      key: 'equipment.owner.name',
      label: 'Owner',
      render: (row) => <span className="text-gray-600">{row.equipment?.owner?.name}</span>,
    },
    {
      key: 'start_date',
      label: 'Period',
      render: (row) => (
        <div className="text-gray-600">
          {row.start_date} — {row.end_date}
          <br />
          <span className="text-xs">{row.rental_days} days</span>
        </div>
      ),
    },
    {
      key: 'total_cost',
      label: 'Total',
      render: (row) => <span className="text-green-700 font-medium">₱{parseFloat(row.total_cost).toLocaleString()}</span>,
      sortValue: (row) => parseFloat(row.total_cost),
    },
    {
      key: 'status',
      label: 'Status',
      align: 'center',
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <ClipboardList className="w-7 h-7 text-green-600" />
          <h1 className="text-2xl font-bold text-gray-900">All Rental Requests</h1>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filter === f.key
                  ? 'bg-white text-green-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f.icon}
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : (
        <DataTable
          columns={columns}
          data={data}
          onRowClick={(row) => setSelected(row)}
          searchKeys={['renter.name', 'renter.email', 'equipment.name', 'equipment.category', 'equipment.owner.name', 'status']}
          defaultSort={{ key: 'created_at', dir: 'desc' }}
          emptyMessage={filter === 'all' ? 'No rental requests found.' : `No ${filter} rental requests.`}
        />
      )}

      {/* ── Detail Modal ── */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Rental Request Details</h2>
                <p className="text-xs text-gray-400 font-mono">TXN-{String(selected.id).padStart(5, '0')}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Status */}
              <div className="flex justify-center">
                <StatusBadge status={selected.status} />
              </div>

              {/* Renter Info */}
              <div>
                <h3 className="text-xs font-semibold uppercase text-gray-400 mb-2">Renter Information</h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-gray-900">{selected.renter?.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-green-600" />
                    <span className="text-gray-600">{selected.renter?.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-green-600" />
                    <span className="text-gray-600">{selected.contact_number}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-green-600 mt-0.5" />
                    <span className="text-gray-600">{selected.delivery_address}</span>
                  </div>
                  {(selected.latitude && selected.longitude) && (
                    <div className="flex items-center gap-2 text-xs text-gray-400 pl-6">
                      GPS: {selected.latitude}, {selected.longitude}
                    </div>
                  )}
                </div>
              </div>

              {/* Equipment Info */}
              <div>
                <h3 className="text-xs font-semibold uppercase text-gray-400 mb-2">Equipment Details</h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Tractor className="w-4 h-4 text-amber-600" />
                    <span className="font-medium text-gray-900">{selected.equipment?.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm pl-6">
                    <span className="text-gray-500 capitalize">{selected.equipment?.category} • {selected.equipment?.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-amber-600" />
                    <span className="text-gray-600">Owner: <span className="font-medium">{selected.equipment?.owner?.name}</span></span>
                  </div>
                </div>
              </div>

              {/* Rental Period & Cost */}
              <div>
                <h3 className="text-xs font-semibold uppercase text-gray-400 mb-2">Rental Period & Cost</h3>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <div>
                        <p className="text-xs text-gray-400">Start Date</p>
                        <p className="font-medium text-gray-900">{selected.start_date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <div>
                        <p className="text-xs text-gray-400">End Date</p>
                        <p className="font-medium text-gray-900">{selected.end_date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <ClipboardList className="w-4 h-4 text-blue-600" />
                      <div>
                        <p className="text-xs text-gray-400">Duration</p>
                        <p className="font-medium text-gray-900">{selected.rental_days} day{selected.rental_days > 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <div>
                        <p className="text-xs text-gray-400">Total Cost</p>
                        <p className="font-bold text-green-700 text-lg">₱{parseFloat(selected.total_cost).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t">
                <span>Created: {new Date(selected.created_at).toLocaleString()}</span>
                <span>Updated: {new Date(selected.updated_at).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
