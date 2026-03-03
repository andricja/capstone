import { useEffect, useState } from 'react';
import api from '../../lib/api';
import StatusBadge from '../../components/StatusBadge';
import { TableSkeleton } from '../../components/Skeleton';
import DataTable from '../../components/DataTable';
import ReceiptModal from '../../components/ReceiptModal';
import { Check, X, ListFilter, Clock, CheckCircle, LayoutList, DollarSign, Receipt, Eye } from 'lucide-react';

const FILTERS = [
  { key: 'all',      label: 'All',      icon: <LayoutList className="w-4 h-4" /> },
  { key: 'pending',  label: 'Pending',  icon: <Clock className="w-4 h-4" /> },
  { key: 'approved', label: 'Approved', icon: <CheckCircle className="w-4 h-4" /> },
];

export default function AdminEquipment() {
  const [data, setData] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Approval modal state
  const [approveItem, setApproveItem] = useState(null);
  const [approvalFee, setApprovalFee] = useState('');
  const [approving, setApproving] = useState(false);

  // Receipt modal state
  const [receipt, setReceipt] = useState(null);

  const fetchEquipment = (f = filter) => {
    setLoading(true);
    const params = { all: 1 };
    if (f === 'pending') params.status = 'pending';
    else if (f === 'approved') params.status = 'available';
    api.get('/admin/equipment/all', { params })
      .then((r) => setData(Array.isArray(r.data) ? r.data : r.data?.data ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchEquipment(filter); }, [filter]);

  /* Open approval modal instead of instant approve */
  const openApproveModal = (item, e) => {
    e?.stopPropagation();
    setApproveItem(item);
    setApprovalFee('');
  };

  /* Confirm approval with fee */
  const confirmApprove = async () => {
    if (!approvalFee || parseFloat(approvalFee) < 0) return;
    setApproving(true);
    try {
      const res = await api.patch(`/admin/equipment/${approveItem.id}/approve`, {
        approval_fee: parseFloat(approvalFee),
      });
      setReceipt(res.data.equipment);
      setApproveItem(null);
      setApprovalFee('');
      setMessage('Equipment approved.');
      fetchEquipment(filter);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to approve.');
    } finally {
      setApproving(false);
    }
  };

  /* Reject stays simple */
  const handleReject = async (id, e) => {
    e?.stopPropagation();
    if (!confirm('Reject this equipment?')) return;
    try {
      await api.patch(`/admin/equipment/${id}/reject`);
      setMessage('Equipment rejected.');
      fetchEquipment(filter);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to reject.');
    }
  };

  const columns = [
    {
      key: 'id',
      label: 'Transaction',
      render: (row) => <span className="font-mono text-xs text-gray-500">TXN-{String(row.id).padStart(5, '0')}</span>,
      sortValue: (row) => row.id,
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
      label: 'Amount',
      align: 'right',
      render: (row) => (
        <span className="font-medium text-gray-900">₱{parseFloat(row.daily_rate).toLocaleString()}<span className="text-xs text-gray-400">/day</span></span>
      ),
      sortValue: (row) => parseFloat(row.daily_rate),
    },
    {
      key: 'transportation_fee',
      label: 'Cash',
      align: 'right',
      render: (row) =>
        parseFloat(row.transportation_fee) > 0
          ? <span className="text-gray-600">₱{parseFloat(row.transportation_fee).toLocaleString()}</span>
          : <span className="text-gray-300">—</span>,
      sortValue: (row) => parseFloat(row.transportation_fee),
    },
    {
      key: 'created_at',
      label: 'Date',
      render: (row) => <span className="text-gray-500 text-xs">{new Date(row.created_at).toLocaleDateString()}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      align: 'center',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: '_action',
      label: 'Action',
      align: 'center',
      sortable: false,
      render: (row) =>
        row.status === 'pending' ? (
          <div className="flex items-center justify-center gap-1.5">
            <button
              onClick={(e) => openApproveModal(row, e)}
              className="inline-flex items-center gap-1 bg-green-50 text-green-700 hover:bg-green-100 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
            >
              <Check className="w-3.5 h-3.5" /> Approve
            </button>
            <button
              onClick={(e) => handleReject(row.id, e)}
              className="inline-flex items-center gap-1 bg-red-50 text-red-700 hover:bg-red-100 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Reject
            </button>
          </div>
        ) : row.approval_fee != null && row.approved_at ? (
          <button
            onClick={(e) => { e.stopPropagation(); setReceipt(row); }}
            className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 hover:bg-blue-100 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
          >
            <Eye className="w-3.5 h-3.5" /> View Receipt
          </button>
        ) : (
          <span className="text-xs text-gray-300">—</span>
        ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <ListFilter className="w-7 h-7 text-green-600" />
          <h1 className="text-2xl font-bold text-gray-900">Equipment Approvals</h1>
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

      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${message.includes('Failed') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message}
        </div>
      )}

      {loading ? (
        <TableSkeleton rows={8} cols={5} />
      ) : (
        <DataTable
          columns={columns}
          data={data}
          searchKeys={['name', 'category', 'location', 'owner.name', 'owner.email', 'status']}
          defaultSort={{ key: 'created_at', dir: 'desc' }}
          emptyMessage={filter === 'pending' ? 'No pending equipment to review.' : filter === 'approved' ? 'No approved equipment yet.' : 'No equipment found.'}
        />
      )}
      
      {/* ── Approval Fee Modal ── */}
      {approveItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setApproveItem(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-green-50 px-6 py-4 border-b flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Approve Equipment</h3>
                <p className="text-sm text-gray-500">Set the approval fee for this equipment</p>
              </div>
            </div>

            {/* Equipment info */}
            <div className="px-6 pt-4 pb-3 space-y-3">
              <div className="flex items-center gap-3">
                {approveItem.image ? (
                  <img src={`/storage/${approveItem.image}`} alt={approveItem.name} className="w-14 h-14 rounded-lg object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center text-2xl">🚜</div>
                )}
                <div>
                  <p className="font-semibold text-gray-900">{approveItem.name}</p>
                  <p className="text-sm text-gray-500 capitalize">{approveItem.category} • {approveItem.location}</p>
                  <p className="text-sm text-gray-500">Owner: {approveItem.owner?.name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 rounded-lg px-3 py-2">
                  <p className="text-gray-400 text-xs">Daily Rate</p>
                  <p className="font-semibold text-gray-800">₱{parseFloat(approveItem.daily_rate).toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 rounded-lg px-3 py-2">
                  <p className="text-gray-400 text-xs">Transport Fee</p>
                  <p className="font-semibold text-gray-800">₱{parseFloat(approveItem.transportation_fee).toLocaleString()}</p>
                </div>
              </div>

              {/* Fee input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Approval Fee (₱)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₱</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={approvalFee}
                    onChange={(e) => setApprovalFee(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                    autoFocus
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-2">
              <button
                onClick={() => setApproveItem(null)}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmApprove}
                disabled={!approvalFee || parseFloat(approvalFee) < 0 || approving}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {approving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Confirm Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Receipt Modal (shared component) ── */}
      <ReceiptModal equipment={receipt} onClose={() => setReceipt(null)} />
    </div>
  );
}
