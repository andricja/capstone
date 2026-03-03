import { useEffect, useState, useMemo } from 'react';
import api from '../../lib/api';
import StatusBadge from '../../components/StatusBadge';
import { Check, X, Ruler, Clock, Calendar, Truck, MapPin, LayoutGrid, Table, Banknote } from 'lucide-react';

export default function OwnerRentals() {
  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [proofImage, setProofImage] = useState(null);
  const [viewMode, setViewMode] = useState('card'); // 'card' | 'table'
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRow, setSelectedRow] = useState(null); // row detail modal

  // DataTable state
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState('id');
  const [sortDir, setSortDir] = useState('desc');
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);

  const fetchAll = () => {
    setLoading(true);
    api.get('/owner/rental-requests', { params: { all: 1 } })
      .then((r) => setAllData(Array.isArray(r.data) ? r.data : r.data?.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const handleAction = async (id, action) => {
    const confirmMsg = action === 'approve'
      ? 'Approve this rental? Equipment will be marked as rented.'
      : 'Reject this rental request?';
    if (!confirm(confirmMsg)) return;
    try {
      await api.patch(`/owner/rental-requests/${id}/${action}`);
      setMessage(`Rental request ${action}d.`);
      fetchAll();
    } catch (err) {
      setMessage(err.response?.data?.message || `Failed to ${action} request.`);
    }
  };

  const fmt = (v) => parseFloat(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

  // Filtered + sorted data
  const processed = useMemo(() => {
    let rows = [...allData];
    if (statusFilter !== 'all') {
      rows = rows.filter((r) => r.status === statusFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
        (r.equipment?.name || '').toLowerCase().includes(q) ||
        (r.renter?.name || '').toLowerCase().includes(q) ||
        (r.renter?.email || '').toLowerCase().includes(q) ||
        (r.contact_number || '').toLowerCase().includes(q) ||
        (r.delivery_address || '').toLowerCase().includes(q) ||
        (r.status || '').toLowerCase().includes(q)
      );
    }
    rows.sort((a, b) => {
      let va, vb;
      switch (sortCol) {
        case 'equipment': va = a.equipment?.name || ''; vb = b.equipment?.name || ''; break;
        case 'renter': va = a.renter?.name || ''; vb = b.renter?.name || ''; break;
        case 'farm_size': va = parseFloat(a.farm_size_sqm || 0); vb = parseFloat(b.farm_size_sqm || 0); break;
        case 'total_cost': va = parseFloat(a.total_cost || 0); vb = parseFloat(b.total_cost || 0); break;
        case 'status': va = a.status || ''; vb = b.status || ''; break;
        case 'start_date': va = a.start_date || ''; vb = b.start_date || ''; break;
        default: va = a.id; vb = b.id;
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return rows;
  }, [allData, search, sortCol, sortDir, statusFilter]);

  const totalPages = Math.ceil(processed.length / perPage) || 1;
  const paginated = processed.slice((page - 1) * perPage, page * perPage);

  const toggleSort = (col) => {
    if (sortCol === col) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };
  const sortIcon = (col) => sortCol === col ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '';

  if (loading) return <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Rental Requests</h1>
        <button
          onClick={() => { setViewMode(viewMode === 'card' ? 'table' : 'card'); setPage(1); }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 transition-colors"
        >
          {viewMode === 'card' ? <><Table className="w-4 h-4" /> Table View</> : <><LayoutGrid className="w-4 h-4" /> Card View</>}
        </button>
      </div>

      {/* Status filter buttons */}
      <div className="flex items-center gap-2 mb-6">
        {[
          { key: 'all', label: 'All' },
          { key: 'forwarded', label: 'Pending' },
          { key: 'approved', label: 'Approved' },
          { key: 'rejected', label: 'Rejected' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => { setStatusFilter(f.key); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              statusFilter === f.key
                ? f.key === 'approved' ? 'bg-green-600 text-white shadow-sm'
                  : f.key === 'rejected' ? 'bg-red-500 text-white shadow-sm'
                  : f.key === 'forwarded' ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-green-600 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${message.includes('Failed') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message}
        </div>
      )}

      {allData.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No rental requests yet.</div>
      ) : viewMode === 'card' ? (
        /* ══════════ CARD VIEW ══════════ */
        processed.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No {statusFilter !== 'all' ? statusFilter : ''} rental requests found.</div>
        ) : (
        <div className="space-y-4">
          {processed.map((r) => (
            <div key={r.id} className="bg-white rounded-xl shadow-sm border p-5">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{r.equipment?.name}</h3>
                  <p className="text-sm text-gray-500 capitalize">{r.equipment?.category} • {r.equipment?.location}</p>
                </div>
                <StatusBadge status={r.status} />
              </div>

              {/* Renter Information */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Renter Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                  <div><span className="text-gray-500">Name:</span> <span className="font-medium">{r.renter?.name}</span></div>
                  <div><span className="text-gray-500">Email:</span> <span className="font-medium">{r.renter?.email}</span></div>
                  <div><span className="text-gray-500">Phone:</span> <span className="font-medium">{r.contact_number}</span></div>
                </div>
              </div>

              {/* Farm & Rental Details */}
              <div className="bg-green-50 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Farm & Rental Details</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div className="flex items-start gap-1.5">
                    <Ruler className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-gray-500 block text-xs">Farm Size</span>
                      <span className="font-semibold text-gray-900">{parseFloat(r.farm_size_sqm || 0).toLocaleString()} sqm</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <Clock className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-gray-500 block text-xs">Est. Hours</span>
                      <span className="font-semibold text-gray-900">{parseFloat(r.estimated_hours || 0)} hrs</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <Calendar className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-gray-500 block text-xs">Rental Days</span>
                      <span className="font-semibold text-gray-900">{r.rental_days} day(s)</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <Calendar className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-gray-500 block text-xs">Period</span>
                      <span className="font-semibold text-gray-900">{fmtDate(r.start_date)}{r.rental_days > 1 ? ` — ${fmtDate(r.end_date)}` : ''}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Details */}
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Delivery Details</h4>
                <div className="flex items-start gap-1.5 text-sm">
                  <Truck className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900">{r.delivery_address}</span>
                    {r.latitude && r.longitude && (
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {r.latitude}, {r.longitude}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Cost Breakdown</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Base Cost (₱{fmt(r.equipment?.daily_rate)} × {r.rental_days} day{r.rental_days > 1 ? 's' : ''})</span>
                    <span className="font-medium">₱{fmt(r.base_cost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Delivery Fee</span>
                    <span className="font-medium">₱{fmt(r.delivery_fee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Service Charge (5%)</span>
                    <span className="font-medium">₱{fmt(r.service_charge)}</span>
                  </div>
                  <div className="border-t pt-2 mt-2 flex justify-between">
                    <span className="font-semibold text-gray-700">Total Cost</span>
                    <span className="font-bold text-green-700 text-base">₱{fmt(r.total_cost)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 pt-2">
                    <Banknote className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-500">Payment:</span>
                    <span className={`font-medium px-2 py-0.5 rounded-full text-xs ${
                      r.payment_method === 'gcash' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>{r.payment_method === 'gcash' ? 'GCash' : 'COD'}</span>
                    {r.payment_method === 'gcash' && r.payment_proof && (
                      <button onClick={() => setProofImage(`/storage/${r.payment_proof}`)}
                        className="text-xs text-blue-600 underline hover:text-blue-800 ml-1">View Proof</button>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              {r.status === 'forwarded' && (
                <div className="flex gap-2">
                  <button onClick={() => handleAction(r.id, 'approve')}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-1">
                    <Check className="w-4 h-4" /> Approve
                  </button>
                  <button onClick={() => handleAction(r.id, 'reject')}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 flex items-center gap-1">
                    <X className="w-4 h-4" /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        )
      ) : (
        /* ══════════ TABLE VIEW ══════════ */
        <div className="bg-white rounded-xl shadow-sm border">
          {/* Toolbar */}
          <div className="p-4 border-b flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <label className="text-gray-500">Show</label>
              <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
                className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-green-500 outline-none">
                {[5, 10, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
              <span className="text-gray-500">entries</span>
            </div>
            <input
              type="text" placeholder="Search requests..."
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none w-64"
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    ['id', '#'],
                    ['equipment', 'Equipment'],
                    ['renter', 'Renter'],
                    ['farm_size', 'Farm Size'],
                    ['start_date', 'Period'],
                    ['total_cost', 'Total Cost'],
                    ['status', 'Status'],
                  ].map(([col, label]) => (
                    <th key={col} onClick={() => toggleSort(col)}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700 select-none whitespace-nowrap">
                      {label}{sortIcon(col)}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paginated.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No matching requests.</td></tr>
                ) : paginated.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedRow(r)}>
                    <td className="px-4 py-3 font-mono text-gray-400">{r.id}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{r.equipment?.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{r.equipment?.category}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{r.renter?.name}</p>
                      <p className="text-xs text-gray-500">{r.contact_number}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="font-medium">{parseFloat(r.farm_size_sqm || 0).toLocaleString()} sqm</p>
                      <p className="text-xs text-gray-500">{parseFloat(r.estimated_hours || 0)} hrs • {r.rental_days}d</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="font-medium">{fmtDate(r.start_date)}</p>
                      {r.rental_days > 1 && <p className="text-xs text-gray-500">to {fmtDate(r.end_date)}</p>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-bold text-green-700">₱{fmt(r.total_cost)}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3">
                      {r.status === 'forwarded' ? (
                        <div className="flex gap-1">
                          <button onClick={(e) => { e.stopPropagation(); handleAction(r.id, 'approve'); }}
                            className="bg-green-600 text-white px-2.5 py-1 rounded text-xs font-medium hover:bg-green-700 flex items-center gap-0.5">
                            <Check className="w-3 h-3" /> Approve
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleAction(r.id, 'reject'); }}
                            className="bg-red-500 text-white px-2.5 py-1 rounded text-xs font-medium hover:bg-red-600 flex items-center gap-0.5">
                            <X className="w-3 h-3" /> Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination footer */}
          <div className="px-4 py-3 border-t flex items-center justify-between text-sm text-gray-500">
            <span>Showing {((page - 1) * perPage) + 1}–{Math.min(page * perPage, processed.length)} of {processed.length}</span>
            <div className="flex gap-1">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)}
                className="px-3 py-1 rounded border text-sm disabled:opacity-40 hover:bg-gray-50">Prev</button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i + 1} onClick={() => setPage(i + 1)}
                  className={`px-3 py-1 rounded border text-sm ${page === i + 1 ? 'bg-green-600 text-white border-green-600' : 'hover:bg-gray-50'}`}>
                  {i + 1}
                </button>
              ))}
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}
                className="px-3 py-1 rounded border text-sm disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        </div>
      )}

      {/* Payment proof image modal */}
      {proofImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setProofImage(null)}>
          <div className="relative max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setProofImage(null)}
              className="absolute -top-3 -right-3 bg-white text-gray-600 rounded-full w-8 h-8 flex items-center justify-center shadow-lg hover:bg-gray-100 text-lg font-bold z-10">&times;</button>
            <div className="bg-white rounded-2xl overflow-hidden shadow-xl">
              <div className="bg-blue-600 px-4 py-3 text-white text-sm font-semibold text-center">GCash Payment Proof</div>
              <div className="p-4">
                <img src={proofImage} alt="Payment Proof" className="w-full rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Row detail modal */}
      {selectedRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setSelectedRow(null)}>
          <div className="relative max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelectedRow(null)}
              className="absolute top-3 right-3 bg-white text-gray-600 rounded-full w-8 h-8 flex items-center justify-center shadow-lg hover:bg-gray-100 text-lg font-bold z-10">&times;</button>
            <div className="bg-white rounded-2xl overflow-hidden shadow-xl p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedRow.equipment?.name}</h3>
                  <p className="text-sm text-gray-500 capitalize">{selectedRow.equipment?.category} • {selectedRow.equipment?.location}</p>
                </div>
                <StatusBadge status={selectedRow.status} />
              </div>

              {/* Renter Information */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Renter Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                  <div><span className="text-gray-500">Name:</span> <span className="font-medium">{selectedRow.renter?.name}</span></div>
                  <div><span className="text-gray-500">Email:</span> <span className="font-medium">{selectedRow.renter?.email}</span></div>
                  <div><span className="text-gray-500">Phone:</span> <span className="font-medium">{selectedRow.contact_number}</span></div>
                </div>
              </div>

              {/* Farm & Rental Details */}
              <div className="bg-green-50 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Farm & Rental Details</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div className="flex items-start gap-1.5">
                    <Ruler className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-gray-500 block text-xs">Farm Size</span>
                      <span className="font-semibold text-gray-900">{parseFloat(selectedRow.farm_size_sqm || 0).toLocaleString()} sqm</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <Clock className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-gray-500 block text-xs">Est. Hours</span>
                      <span className="font-semibold text-gray-900">{parseFloat(selectedRow.estimated_hours || 0)} hrs</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <Calendar className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-gray-500 block text-xs">Rental Days</span>
                      <span className="font-semibold text-gray-900">{selectedRow.rental_days} day(s)</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <Calendar className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-gray-500 block text-xs">Period</span>
                      <span className="font-semibold text-gray-900">{fmtDate(selectedRow.start_date)}{selectedRow.rental_days > 1 ? ` — ${fmtDate(selectedRow.end_date)}` : ''}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Details */}
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Delivery Details</h4>
                <div className="flex items-start gap-1.5 text-sm">
                  <Truck className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900">{selectedRow.delivery_address}</span>
                    {selectedRow.latitude && selectedRow.longitude && (
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {selectedRow.latitude}, {selectedRow.longitude}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Cost Breakdown</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Base Cost (₱{fmt(selectedRow.equipment?.daily_rate)} × {selectedRow.rental_days} day{selectedRow.rental_days > 1 ? 's' : ''})</span>
                    <span className="font-medium">₱{fmt(selectedRow.base_cost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Delivery Fee</span>
                    <span className="font-medium">₱{fmt(selectedRow.delivery_fee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Service Charge (5%)</span>
                    <span className="font-medium">₱{fmt(selectedRow.service_charge)}</span>
                  </div>
                  <div className="border-t pt-2 mt-2 flex justify-between">
                    <span className="font-semibold text-gray-700">Total Cost</span>
                    <span className="font-bold text-green-700 text-base">₱{fmt(selectedRow.total_cost)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 pt-2">
                    <Banknote className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-500">Payment:</span>
                    <span className={`font-medium px-2 py-0.5 rounded-full text-xs ${
                      selectedRow.payment_method === 'gcash' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>{selectedRow.payment_method === 'gcash' ? 'GCash' : 'COD'}</span>
                    {selectedRow.payment_method === 'gcash' && selectedRow.payment_proof && (
                      <button onClick={() => { setSelectedRow(null); setProofImage(`/storage/${selectedRow.payment_proof}`); }}
                        className="text-xs text-blue-600 underline hover:text-blue-800 ml-1">View Proof</button>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              {selectedRow.status === 'forwarded' && (
                <div className="flex gap-2">
                  <button onClick={() => { handleAction(selectedRow.id, 'approve'); setSelectedRow(null); }}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-1">
                    <Check className="w-4 h-4" /> Approve
                  </button>
                  <button onClick={() => { handleAction(selectedRow.id, 'reject'); setSelectedRow(null); }}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 flex items-center gap-1">
                    <X className="w-4 h-4" /> Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
