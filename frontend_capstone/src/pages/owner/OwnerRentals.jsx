import { useEffect, useState } from 'react';
import api from '../../lib/api';
import StatusBadge from '../../components/StatusBadge';
import Pagination from '../../components/Pagination';
import { Check, X } from 'lucide-react';

export default function OwnerRentals() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const fetch = (p = 1) => {
    setLoading(true);
    api.get('/owner/rental-requests', { params: { page: p } })
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(page); }, [page]);

  const handleAction = async (id, action) => {
    const confirmMsg = action === 'approve'
      ? 'Approve this rental? 1 point will be deducted from the renter and equipment will be marked as rented.'
      : 'Reject this rental request?';
    if (!confirm(confirmMsg)) return;
    try {
      await api.patch(`/owner/rental-requests/${id}/${action}`);
      setMessage(`Rental request ${action}d.`);
      fetch(page);
    } catch (err) {
      setMessage(err.response?.data?.message || `Failed to ${action} request.`);
    }
  };

  if (loading) return <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Rental Requests</h1>

      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${message.includes('Failed') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message}
        </div>
      )}

      {data?.data?.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No rental requests yet.</div>
      ) : (
        <div className="space-y-4">
          {data?.data?.map((r) => (
            <div key={r.id} className="bg-white rounded-xl shadow-sm border p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{r.equipment?.name}</h3>
                  <p className="text-sm text-gray-500 capitalize">{r.equipment?.category} • {r.equipment?.location}</p>
                </div>
                <StatusBadge status={r.status} />
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Renter Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                  <div><span className="text-gray-500">Name:</span> <span className="font-medium">{r.renter?.name}</span></div>
                  <div><span className="text-gray-500">Email:</span> <span className="font-medium">{r.renter?.email}</span></div>
                  <div><span className="text-gray-500">Phone:</span> <span className="font-medium">{r.contact_number}</span></div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-4">
                <div><span className="text-gray-500">Period:</span><br/><span className="font-medium">{r.start_date} — {r.end_date}</span></div>
                <div><span className="text-gray-500">Days:</span><br/><span className="font-medium">{r.rental_days}</span></div>
                <div><span className="text-gray-500">Total Cost:</span><br/><span className="font-medium text-green-700">₱{parseFloat(r.total_cost).toLocaleString()}</span></div>
                <div><span className="text-gray-500">Delivery:</span><br/><span className="font-medium">{r.delivery_address}</span></div>
              </div>

              {r.latitude && r.longitude && (
                <p className="text-xs text-gray-400 mb-3">📍 Coordinates: {r.latitude}, {r.longitude}</p>
              )}

              {r.status === 'forwarded' && (
                <div className="flex gap-2">
                  <button onClick={() => handleAction(r.id, 'approve')}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-1">
                    <Check /> Approve
                  </button>
                  <button onClick={() => handleAction(r.id, 'reject')}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 flex items-center gap-1">
                    <X /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
          <Pagination data={data} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
