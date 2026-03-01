import { useEffect, useState } from 'react';
import api from '../../lib/api';
import StatusBadge from '../../components/StatusBadge';
import Pagination from '../../components/Pagination';

export default function MyRentals() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetch = (p = 1) => {
    setLoading(true);
    api.get('/renter/rental-requests', { params: { page: p } })
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(page); }, [page]);

  if (loading) return <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Rentals</h1>

      {data?.data?.length === 0 && (
        <div className="text-center py-12 text-gray-500">You have no rental requests yet.</div>
      )}

      <div className="space-y-4">
        {data?.data?.map((r) => (
          <div key={r.id} className="bg-white rounded-xl shadow-sm border p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">{r.equipment?.name}</h3>
                <p className="text-sm text-gray-500 capitalize">{r.equipment?.category} • {r.equipment?.location}</p>
              </div>
              <StatusBadge status={r.status} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div><span className="text-gray-500">Period:</span> <span className="font-medium">{r.start_date} — {r.end_date}</span></div>
              <div><span className="text-gray-500">Days:</span> <span className="font-medium">{r.rental_days}</span></div>
              <div><span className="text-gray-500">Total:</span> <span className="font-medium text-green-700">₱{parseFloat(r.total_cost).toLocaleString()}</span></div>
              <div><span className="text-gray-500">Contact:</span> <span className="font-medium">{r.contact_number}</span></div>
            </div>
            <p className="text-sm text-gray-500 mt-2">Delivery: {r.delivery_address}</p>
            {r.equipment?.owner && <p className="text-xs text-gray-400 mt-1">Owner: {r.equipment.owner.name} ({r.equipment.owner.email})</p>}
          </div>
        ))}
      </div>

      <Pagination data={data} onPageChange={setPage} />
    </div>
  );
}
