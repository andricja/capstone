import { useEffect, useState } from 'react';
import api from '../../lib/api';
import DataTable from '../../components/DataTable';
import { ListPageSkeleton } from '../../components/Skeleton';
import { Users, UserPlus, Tractor, Mail, Calendar, LayoutGrid, Table, ClipboardList, Plus, X, MapPin, DollarSign, Eye, Truck, Tag, FileText, Clock, Archive } from 'lucide-react';

const CATEGORIES = ['tractor','harvester','planter','irrigation','cultivator','sprayer','trailer','other'];

const initialForm = {
  name: '', category: 'tractor', description: '', daily_rate: '', transportation_fee: '', location: '', image: null,
};

export default function AdminOwners() {
  const [data, setData] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('card'); // 'card' | 'table'

  // Add-equipment modal state
  const [modalOwner, setModalOwner] = useState(null); // owner object or null
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState('');

  // Owner detail modal state
  const [detailOwner, setDetailOwner] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);



  const fetchOwners = () => {
    setLoading(true);
    api.get('/admin/owners', { params: { all: 1 } })
      .then((r) => setData(Array.isArray(r.data) ? r.data : r.data?.data ?? []))
      .finally(() => setLoading(false));
  };

  const fetchStats = () => {
    api.get('/admin/owners/stats').then((r) => setStats(r.data));
  };

  useEffect(() => { fetchStats(); fetchOwners(); }, []);

  const openModal = (owner, e) => {
    e?.stopPropagation();
    setModalOwner(owner);
    setForm(initialForm);
    setFormMsg('');
  };

  const closeModal = () => {
    setModalOwner(null);
    setForm(initialForm);
    setFormMsg('');
  };

  const openDetail = (owner) => {
    setDetailLoading(true);
    setDetailOwner(null);
    api.get(`/admin/owners/${owner.id}`)
      .then((r) => setDetailOwner(r.data))
      .catch(() => setDetailOwner(null))
      .finally(() => setDetailLoading(false));
  };

  const closeDetail = () => {
    setDetailOwner(null);
  };

  const handleArchive = async (id, e) => {
    e?.stopPropagation();
    try {
      await api.patch(`/admin/owners/${id}/archive`);
      fetchOwners();
      fetchStats();
      if (detailOwner?.owner?.id === id) {
        setDetailOwner((prev) => prev ? { ...prev, owner: { ...prev.owner, archived_at: prev.owner.archived_at ? null : new Date().toISOString() } } : prev);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to archive.');
    }
  };

  const handleFormChange = (e) => {
    const { name, value, files } = e.target;
    setForm((prev) => ({ ...prev, [name]: files ? files[0] : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormMsg('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([key, val]) => {
        if (val !== null && val !== '') fd.append(key, val);
      });
      await api.post(`/admin/owners/${modalOwner.id}/equipment`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFormMsg('Equipment added successfully!');
      fetchOwners();
      fetchStats();
      setTimeout(closeModal, 1200);
    } catch (err) {
      setFormMsg(err.response?.data?.message || 'Failed to add equipment.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <ListPageSkeleton statCount={4} cols={5} rows={6} />;

  const statCards = [
    { label: 'Total Owners',      value: stats?.total_owners ?? 0,          icon: <Users className="w-6 h-6" />,          color: 'green' },
    { label: 'Total Equipment',   value: stats?.total_equipment ?? 0,       icon: <Tractor className="w-6 h-6" />,        color: 'amber' },
    { label: 'Active Rentals',    value: stats?.active_rentals ?? 0,        icon: <ClipboardList className="w-6 h-6" />,  color: 'purple' },
    { label: 'New Owners (Month)',value: stats?.new_owners_this_month ?? 0, icon: <UserPlus className="w-6 h-6" />,       color: 'emerald' },
  ];

  const colorMap = {
    green:   { bg: 'bg-green-50',   text: 'text-green-600',   ring: 'ring-green-200' },
    blue:    { bg: 'bg-blue-50',    text: 'text-blue-600',    ring: 'ring-blue-200' },
    amber:   { bg: 'bg-amber-50',   text: 'text-amber-600',   ring: 'ring-amber-200' },
    purple:  { bg: 'bg-purple-50',  text: 'text-purple-600',  ring: 'ring-purple-200' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'ring-emerald-200' },
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Users className="w-7 h-7 text-green-600" />
        <h1 className="text-2xl font-bold text-gray-900">Equipment Owners</h1>
        <span className="text-sm text-gray-500">{data.length} total owners</span>

        {/* Toggle buttons */}
        <div className="ml-auto flex items-center bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setView('card')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              view === 'card'
                ? 'bg-white text-green-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Cards
          </button>
          <button
            onClick={() => setView('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              view === 'table'
                ? 'bg-white text-green-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Table className="w-4 h-4" />
            Table
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => {
          const c = colorMap[card.color];
          return (
            <div key={card.label} className="bg-white rounded-xl shadow-sm border p-4 flex items-center gap-3">
              <div className={`${c.bg} ${c.text} p-2.5 rounded-lg ring-1 ${c.ring}`}>
                {card.icon}
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="text-xs text-gray-500">{card.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {data.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No registered owners yet.</div>
      ) : view === 'card' ? (
        /* ── Card View ── */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((owner) => (
            <div
              key={owner.id}
              onClick={() => openDetail(owner)}
              className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition-shadow cursor-pointer"
            >
              {/* Avatar + Name */}
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-lg">
                  {owner.name?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{owner.name}</p>
                  <p className="text-sm text-gray-500 truncate flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" />
                    {owner.email}
                  </p>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-green-50 rounded-lg px-3 py-2 text-center">
                  <Tractor className="w-4 h-4 text-green-600 mx-auto mb-1" />
                  <span className="font-semibold text-green-700">{owner.equipment_count ?? 0}</span>
                  <p className="text-gray-500 text-xs">Equipment</p>
                </div>
                <div className="bg-blue-50 rounded-lg px-3 py-2 text-center">
                  <Tractor className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                  <span className="font-semibold text-blue-700">{owner.approved_equipment_count ?? 0}</span>
                  <p className="text-gray-500 text-xs">Approved</p>
                </div>
              </div>

              {/* Joined date + Add button */}
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Calendar className="w-3.5 h-3.5" />
                  Joined {new Date(owner.created_at).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleArchive(owner.id, e)}
                    className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors ${
                      owner.archived_at
                        ? 'text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100'
                        : 'text-gray-600 hover:text-gray-700 bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <Archive className="w-3.5 h-3.5" />
                    {owner.archived_at ? 'Unarchive' : 'Archive'}
                  </button>
                  <button
                    onClick={(e) => openModal(owner, e)}
                    className="flex items-center gap-1 text-xs font-medium text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Equipment
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ── Table View (DataTable) ── */
        <DataTable
          columns={[
            {
              key: 'id',
              label: '#',
              render: (row, idx) => <span className="text-gray-400">{idx + 1}</span>,
              sortValue: (row) => row.id,
            },
            {
              key: 'name',
              label: 'Owner',
              render: (row) => (
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm shrink-0">
                    {row.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-gray-900">{row.name}</span>
                </div>
              ),
            },
            { key: 'email', label: 'Email', render: (row) => <span className="text-gray-500">{row.email}</span> },
            {
              key: 'equipment_count',
              label: 'Equipment',
              align: 'center',
              render: (row) => (
                <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                  <Tractor className="w-3.5 h-3.5" />
                  {row.equipment_count ?? 0}
                </span>
              ),
              sortValue: (row) => row.equipment_count ?? 0,
            },
            {
              key: 'approved_equipment_count',
              label: 'Approved',
              align: 'center',
              render: (row) => (
                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                  {row.approved_equipment_count ?? 0}
                </span>
              ),
              sortValue: (row) => row.approved_equipment_count ?? 0,
            },
            {
              key: 'created_at',
              label: 'Joined',
              render: (row) => <span className="text-gray-400 text-xs">{new Date(row.created_at).toLocaleDateString()}</span>,
            },
            {
              key: '_action',
              label: 'Action',
              align: 'center',
              sortable: false,
              render: (row) => (
                <div className="flex items-center justify-center gap-1.5">
                  <button
                    onClick={(e) => handleArchive(row.id, e)}
                    className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors ${
                      row.archived_at
                        ? 'text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100'
                        : 'text-gray-600 hover:text-gray-700 bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <Archive className="w-3.5 h-3.5" />
                    {row.archived_at ? 'Unarchive' : 'Archive'}
                  </button>
                  <button
                    onClick={(e) => openModal(row, e)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Equipment
                  </button>
                </div>
              ),
            },
          ]}
          data={data}
          onRowClick={(row) => openDetail(row)}
          searchKeys={['name', 'email']}
          defaultSort={{ key: 'created_at', dir: 'desc' }}
          emptyMessage="No registered owners yet."
        />
      )}

      {/* ── Add Equipment Modal ── */}
      {modalOwner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Add Equipment</h2>
                <p className="text-sm text-gray-500">For owner: <span className="font-medium text-gray-700">{modalOwner.name}</span></p>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formMsg && (
                <div className={`px-4 py-2 rounded-lg text-sm ${
                  formMsg.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {formMsg}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Equipment Name *</label>
                <input name="name" value={form.name} onChange={handleFormChange} required
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select name="category" value={form.category} onChange={handleFormChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                  <input name="location" value={form.location} onChange={handleFormChange} required
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea name="description" value={form.description} onChange={handleFormChange} rows={3}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Daily Rate (₱) *</label>
                  <input name="daily_rate" type="number" step="0.01" min="0" value={form.daily_rate} onChange={handleFormChange} required
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transport Fee (₱)</label>
                  <input name="transportation_fee" type="number" step="0.01" min="0" value={form.transportation_fee} onChange={handleFormChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                <input name="image" type="file" accept="image/*" onChange={handleFormChange}
                  className="w-full border rounded-lg px-3 py-2 text-sm file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100" />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-2">
                  {submitting ? (
                    <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Saving...</>
                  ) : (
                    <><Plus className="w-4 h-4" /> Add Equipment</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Owner Detail Modal ── */}
      {(detailOwner || detailLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={closeDetail}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {detailLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
              </div>
            ) : (
              <>
                {/* Modal header */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xl">
                      {detailOwner.owner.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">{detailOwner.owner.name}</h2>
                      <p className="text-sm text-gray-500 flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {detailOwner.owner.email}</p>
                    </div>
                  </div>
                  <button onClick={closeDetail} className="text-gray-400 hover:text-gray-600 p-1">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Owner stats */}
                <div className="px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-green-700">{detailOwner.owner.equipment_count ?? 0}</p>
                    <p className="text-xs text-gray-500">Total Equipment</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-blue-700">{detailOwner.owner.approved_equipment_count ?? 0}</p>
                    <p className="text-xs text-gray-500">Approved</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-purple-700">{detailOwner.active_rentals}</p>
                    <p className="text-xs text-gray-500">Active Rentals</p>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-amber-700">₱{Number(detailOwner.total_revenue).toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Total Revenue</p>
                  </div>
                </div>

                {/* Owner info + Archive action */}
                <div className="px-6 pb-3">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Calendar className="w-4 h-4 shrink-0" />
                      <span>Joined {new Date(detailOwner.owner.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <ClipboardList className="w-4 h-4 shrink-0" />
                      <span>{detailOwner.total_rentals} total rental requests</span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <button
                      onClick={(e) => handleArchive(detailOwner.owner.id, e)}
                      className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                        detailOwner.owner.archived_at
                          ? 'text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200'
                          : 'text-gray-600 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      <Archive className="w-3.5 h-3.5" />
                      {detailOwner.owner.archived_at ? 'Unarchive Owner' : 'Archive Owner'}
                    </button>
                  </div>
                </div>

                {/* Equipment list */}
                <div className="px-6 pb-6 pt-2">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Tractor className="w-4 h-4 text-green-600" />
                    Equipment ({detailOwner.equipment.length})
                  </h3>

                  {detailOwner.equipment.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">No equipment listed yet.</p>
                  ) : (
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                      {detailOwner.equipment.map((eq) => (
                        <div key={eq.id} className="flex gap-3 bg-gray-50 rounded-xl p-3 border border-gray-100">
                          {/* Equipment image */}
                          {eq.image ? (
                            <img
                              src={`/storage/${eq.image}`}
                              alt={eq.name}
                              className="w-16 h-16 rounded-lg object-cover shrink-0 bg-gray-200"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center shrink-0">
                              <Tractor className="w-6 h-6 text-gray-400" />
                            </div>
                          )}

                          {/* Equipment info */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-semibold text-gray-900 text-sm truncate">{eq.name}</p>
                              <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                                eq.status === 'available' ? 'bg-green-100 text-green-700' :
                                eq.status === 'rented' ? 'bg-blue-100 text-blue-700' :
                                eq.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                eq.status === 'maintenance' ? 'bg-orange-100 text-orange-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {eq.status}
                              </span>
                            </div>

                            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                              <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> {eq.category}</span>
                              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {eq.location}</span>
                              <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> ₱{Number(eq.daily_rate).toLocaleString()}/day</span>
                              {eq.transportation_fee > 0 && (
                                <span className="flex items-center gap-1"><Truck className="w-3 h-3" /> ₱{Number(eq.transportation_fee).toLocaleString()}</span>
                              )}
                            </div>

                            {eq.description && (
                              <p className="mt-1 text-xs text-gray-400 line-clamp-2">{eq.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
