import { useEffect, useState } from 'react';
import api from '../../lib/api';
import StatusBadge from '../../components/StatusBadge';
import { CardGridSkeleton } from '../../components/Skeleton';
import Pagination from '../../components/Pagination';
import ReceiptModal from '../../components/ReceiptModal';
import { Plus, Pencil, Trash2, Settings, CheckCircle, Eye, Archive } from 'lucide-react';
import { useToast } from '../../components/Toast';

const CATEGORIES = ['tractor', 'harvester', 'planter', 'irrigation', 'cultivator', 'sprayer', 'trailer', 'other'];
const MUNICIPALITIES = [
  'Baco', 'Bansud', 'Bongabong', 'Bulalacao', 'Calapan', 'Gloria',
  'Mansalay', 'Naujan', 'Pinamalayan', 'Pola', 'Puerto Galera',
  'Roxas', 'San Teodoro', 'Socorro', 'Victoria',
];

export default function MyEquipment() {
  const [equipment, setEquipment] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '', category: 'tractor', description: '', daily_rate: '',
    transportation_fee: '0', location: MUNICIPALITIES[0], image: null,
  });
  const [submitting, setSubmitting] = useState(false);

  // Receipt modal state
  const [receiptItem, setReceiptItem] = useState(null);

  const fetchEquipment = (p = 1) => {
    setLoading(true);
    api.get('/owner/equipment', { params: { page: p } })
      .then((r) => setEquipment(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchEquipment(page); }, [page]);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', category: 'tractor', description: '', daily_rate: '', transportation_fee: '0', location: MUNICIPALITIES[0], image: null });
    setShowModal(true);
  };

  const openEdit = (eq) => {
    setEditing(eq);
    setForm({
      name: eq.name, category: eq.category, description: eq.description || '',
      daily_rate: eq.daily_rate, transportation_fee: eq.transportation_fee || '0',
      location: eq.location, image: null,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== null && v !== undefined) fd.append(k, v);
      });

      if (editing) {
        fd.append('_method', 'PUT');
        await api.post(`/owner/equipment/${editing.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Equipment updated.');
      } else {
        await api.post('/owner/equipment', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Equipment submitted for admin review.');
      }
      setShowModal(false);
      fetchEquipment(page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save equipment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this equipment?')) return;
    try {
      await api.delete(`/owner/equipment/${id}`);
      toast.success('Equipment deleted.');
      fetchEquipment(page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete.');
    }
  };

  const handleArchive = async (id) => {
    if (!confirm('Archive this equipment?')) return;
    try {
      await api.patch(`/owner/archived/equipment/${id}`);
      toast.success('Equipment archived.');
      fetchEquipment(page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to archive.');
    }
  };

  const toggleStatus = async (id, action) => {
    try {
      await api.patch(`/owner/equipment/${id}/${action}`);
      toast.success('Equipment status updated.');
      fetchEquipment(page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status.');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Equipment</h1>
        <button onClick={openAdd} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-1">
          <Plus /> Add Equipment
        </button>
      </div>

      {loading ? (
        <CardGridSkeleton count={4} />
      ) : equipment?.data?.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p>You haven&apos;t listed any equipment yet.</p>
          <button onClick={openAdd} className="mt-3 text-green-600 hover:underline font-medium">Add your first equipment</button>
        </div>
      ) : (
        <div className="space-y-4">
          {equipment.data.map((eq) => (
            <div key={eq.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-5 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {eq.image ? (
                    <img src={`/storage/${eq.image}`} alt={eq.name} className="w-20 h-20 rounded-lg object-cover" />
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-2xl text-gray-300">🚜</div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{eq.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{eq.category} • {eq.location}</p>
                    <p className="text-sm font-medium text-green-700">₱{parseFloat(eq.daily_rate).toLocaleString()}/day</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge status={eq.status} />

                  {eq.status === 'available' && (
                    <button onClick={() => toggleStatus(eq.id, 'set-maintenance')}
                      className="text-amber-600 hover:bg-amber-50 px-2 py-1 rounded text-xs font-medium flex items-center gap-1 border border-amber-200">
                      <Settings /> Set Maintenance
                    </button>
                  )}
                  {(eq.status === 'rented' || eq.status === 'maintenance') && (
                    <button onClick={() => toggleStatus(eq.id, 'set-available')}
                      className="text-green-600 hover:bg-green-50 px-2 py-1 rounded text-xs font-medium flex items-center gap-1 border border-green-200">
                      <CheckCircle /> Set Available
                    </button>
                  )}
                  {eq.approval_fee != null && eq.approved_at && (
                    <button onClick={() => setReceiptItem(eq)}
                      className="text-blue-600 hover:bg-blue-50 px-2 py-1 rounded text-xs font-medium flex items-center gap-1 border border-blue-200">
                      <Eye /> View Receipt
                    </button>
                  )}
                  {(eq.status === 'pending' || eq.status === 'rejected') && (
                    <>
                      <button onClick={() => openEdit(eq)} className="text-blue-600 hover:bg-blue-50 px-2 py-1 rounded text-xs font-medium flex items-center gap-1 border border-blue-200">
                        <Pencil /> Edit
                      </button>
                      <button onClick={() => handleDelete(eq.id)} className="text-red-600 hover:bg-red-50 px-2 py-1 rounded text-xs font-medium flex items-center gap-1 border border-red-200">
                        <Trash2 /> Delete
                      </button>
                    </>
                  )}
                  <button onClick={() => handleArchive(eq.id)} className="text-amber-600 hover:bg-amber-50 px-2 py-1 rounded text-xs font-medium flex items-center gap-1 border border-amber-200">
                    <Archive className="w-3.5 h-3.5" /> Archive
                  </button>
                </div>
              </div>
            </div>
          ))}
          <Pagination data={equipment} onPageChange={setPage} />
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-gray-800 dark:text-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{editing ? 'Edit Equipment' : 'Add Equipment'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Equipment Name</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none dark:bg-gray-700 dark:text-gray-200" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none capitalize dark:bg-gray-700 dark:text-gray-200">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                  <select value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none dark:bg-gray-700 dark:text-gray-200">
                    {MUNICIPALITIES.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none resize-none dark:bg-gray-700 dark:text-gray-200" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Daily Rate (₱)</label>
                  <input type="number" min="0" step="0.01" required value={form.daily_rate}
                    onChange={(e) => setForm({ ...form, daily_rate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none dark:bg-gray-700 dark:text-gray-200" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Transport Fee (₱)</label>
                  <input type="number" min="0" step="0.01" value={form.transportation_fee}
                    onChange={(e) => setForm({ ...form, transportation_fee: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none dark:bg-gray-700 dark:text-gray-200" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Equipment Image</label>
                <input type="file" accept="image/*" onChange={(e) => setForm({ ...form, image: e.target.files[0] })}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                  {submitting ? 'Saving...' : editing ? 'Update Equipment' : 'Submit for Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      <ReceiptModal equipment={receiptItem} onClose={() => setReceiptItem(null)} />
    </div>
  );
}
