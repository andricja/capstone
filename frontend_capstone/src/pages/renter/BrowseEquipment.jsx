import { useEffect, useState } from 'react';
import api from '../../lib/api';
import StatusBadge from '../../components/StatusBadge';
import Pagination from '../../components/Pagination';
import { useAuth } from '../../contexts/AuthContext';
import { Search, MapPin } from 'lucide-react';

const CATEGORIES = ['', 'tractor', 'harvester', 'planter', 'irrigation', 'cultivator', 'sprayer', 'trailer', 'other'];
const MUNICIPALITIES = [
  '', 'Baco', 'Bansud', 'Bongabong', 'Bulalacao', 'Calapan', 'Gloria',
  'Mansalay', 'Naujan', 'Pinamalayan', 'Pola', 'Puerto Galera',
  'Roxas', 'San Teodoro', 'Socorro', 'Victoria',
];

export default function BrowseEquipment() {
  const { user } = useAuth();
  const [equipment, setEquipment] = useState(null);
  const [filters, setFilters] = useState({ location: '', category: '', status: 'available' });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Rental modal
  const [selected, setSelected] = useState(null);
  const [rentalForm, setRentalForm] = useState({
    contact_number: '', rental_days: 1, start_date: '', end_date: '',
    delivery_address: '', latitude: '', longitude: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const fetchEquipment = (p = 1) => {
    setLoading(true);
    const params = { page: p };
    if (filters.location) params.location = filters.location;
    if (filters.category) params.category = filters.category;
    if (filters.status) params.status = filters.status;
    api.get('/equipment', { params })
      .then((r) => setEquipment(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchEquipment(page); }, [page]);

  const handleFilter = (e) => {
    e.preventDefault();
    setPage(1);
    fetchEquipment(1);
  };

  const openRentalModal = (eq) => {
    setSelected(eq);
    setRentalForm({ contact_number: '', rental_days: 1, start_date: '', end_date: '', delivery_address: '', latitude: '', longitude: '' });
    setMessage('');
  };

  const calcTotal = () => {
    if (!selected) return 0;
    return (parseFloat(selected.daily_rate) * rentalForm.rental_days) + parseFloat(selected.transportation_fee || 0);
  };

  const submitRental = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      await api.post('/renter/rental-requests', {
        equipment_id: selected.id,
        ...rentalForm,
        rental_days: parseInt(rentalForm.rental_days),
        latitude: rentalForm.latitude ? parseFloat(rentalForm.latitude) : null,
        longitude: rentalForm.longitude ? parseFloat(rentalForm.longitude) : null,
      });
      setMessage('Rental request submitted and forwarded to the owner!');
      setSelected(null);
      fetchEquipment(page);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to submit rental request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Browse Equipment</h1>

      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${message.includes('Failed') || message.includes('need') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message}
        </div>
      )}

      {/* Filters */}
      <form onSubmit={handleFilter} className="bg-white rounded-xl shadow-sm border p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-medium text-gray-500 mb-1"><MapPin className="inline mr-1" />Municipality</label>
          <select value={filters.location} onChange={(e) => setFilters({ ...filters, location: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none">
            {MUNICIPALITIES.map((m) => <option key={m} value={m}>{m || 'All Locations'}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
          <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none">
            {CATEGORIES.map((c) => <option key={c} value={c}>{c ? c.charAt(0).toUpperCase() + c.slice(1) : 'All Categories'}</option>)}
          </select>
        </div>
        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-1">
          <Search /> Filter
        </button>
      </form>

      {/* Equipment grid */}
      {loading ? (
        <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto" /></div>
      ) : (
        <>
          {equipment?.data?.length === 0 && (
            <div className="text-center py-12 text-gray-500">No equipment found matching your filters.</div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {equipment?.data?.map((eq) => (
              <div key={eq.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                {eq.image ? (
                  <img src={`/storage/${eq.image}`} alt={eq.name} className="w-full h-48 object-cover" />
                ) : (
                  <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-4xl text-gray-300">🚜</div>
                )}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{eq.name}</h3>
                    <StatusBadge status={eq.status} />
                  </div>
                  <p className="text-xs text-gray-500 mb-1 capitalize">{eq.category} • {eq.location}</p>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">{eq.description || 'No description provided.'}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold text-green-700">₱{parseFloat(eq.daily_rate).toLocaleString()}<span className="text-xs font-normal text-gray-500">/day</span></p>
                      {parseFloat(eq.transportation_fee) > 0 && (
                        <p className="text-xs text-gray-500">+ ₱{parseFloat(eq.transportation_fee).toLocaleString()} transport</p>
                      )}
                    </div>
                    {eq.status === 'available' && user.points >= 1 && (
                      <button onClick={() => openRentalModal(eq)}
                        className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700">
                        Request Rental
                      </button>
                    )}
                    {eq.status === 'available' && user.points < 1 && (
                      <span className="text-xs text-red-500 font-medium">No points</span>
                    )}
                  </div>
                  {eq.owner && <p className="text-xs text-gray-400 mt-2">Owner: {eq.owner.name}</p>}
                </div>
              </div>
            ))}
          </div>
          <Pagination data={equipment} onPageChange={setPage} />
        </>
      )}

      {/* Rental modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Request Rental</h2>
            <p className="text-sm text-gray-500 mb-4">{selected.name} — ₱{parseFloat(selected.daily_rate).toLocaleString()}/day</p>

            <form onSubmit={submitRental} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                <input type="text" required value={rentalForm.contact_number}
                  onChange={(e) => setRentalForm({ ...rentalForm, contact_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rental Days</label>
                  <input type="number" min="1" required value={rentalForm.rental_days}
                    onChange={(e) => setRentalForm({ ...rentalForm, rental_days: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input type="date" required value={rentalForm.start_date}
                    onChange={(e) => setRentalForm({ ...rentalForm, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input type="date" required value={rentalForm.end_date}
                    onChange={(e) => setRentalForm({ ...rentalForm, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
                <input type="text" required value={rentalForm.delivery_address}
                  onChange={(e) => setRentalForm({ ...rentalForm, delivery_address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Latitude (optional)</label>
                  <input type="text" value={rentalForm.latitude}
                    onChange={(e) => setRentalForm({ ...rentalForm, latitude: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="e.g. 13.0039" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longitude (optional)</label>
                  <input type="text" value={rentalForm.longitude}
                    onChange={(e) => setRentalForm({ ...rentalForm, longitude: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="e.g. 121.4052" />
                </div>
              </div>

              {/* Cost breakdown */}
              <div className="bg-gray-50 rounded-lg p-4 text-sm">
                <div className="flex justify-between mb-1"><span className="text-gray-600">Daily Rate</span><span>₱{parseFloat(selected.daily_rate).toLocaleString()}</span></div>
                <div className="flex justify-between mb-1"><span className="text-gray-600">× {rentalForm.rental_days} day(s)</span><span>₱{(parseFloat(selected.daily_rate) * rentalForm.rental_days).toLocaleString()}</span></div>
                {parseFloat(selected.transportation_fee) > 0 && (
                  <div className="flex justify-between mb-1"><span className="text-gray-600">Transportation Fee</span><span>₱{parseFloat(selected.transportation_fee).toLocaleString()}</span></div>
                )}
                <div className="border-t mt-2 pt-2 flex justify-between font-bold text-green-700">
                  <span>Total Cost</span><span>₱{calcTotal().toLocaleString()}</span>
                </div>
                <p className="text-xs text-gray-400 mt-2">1 point will be deducted upon owner approval.</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setSelected(null)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
