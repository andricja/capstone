import { useEffect, useState } from 'react';
import api from '../../lib/api';
import StatusBadge from '../../components/StatusBadge';
import { TableSkeleton } from '../../components/Skeleton';
import DataTable from '../../components/DataTable';
import { Trash2, MessageSquare, Eye, X, Archive } from 'lucide-react';
import { useToast } from '../../components/Toast';

export default function AdminMessages() {
  const [data, setData] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const [selected, setSelected] = useState(null);

  const fetchMessages = (f = filter) => {
    setLoading(true);
    const params = { all: 1 };
    if (f) params.status = f;
    api.get('/admin/messages', { params })
      .then((r) => setData(Array.isArray(r.data) ? r.data : r.data?.data ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchMessages(filter); }, [filter]);

  const updateStatus = async (id, status, e) => {
    e?.stopPropagation();
    try {
      await api.patch(`/admin/messages/${id}/status`, { status });
      toast.success('Status updated.');
      fetchMessages(filter);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update.');
    }
  };

  const handleDelete = async (id, e) => {
    e?.stopPropagation();
    if (!confirm('Delete this message?')) return;
    try {
      await api.delete(`/admin/messages/${id}`);
      toast.success('Message deleted.');
      fetchMessages(filter);
      if (selected?.id === id) setSelected(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete.');
    }
  };

  const handleArchive = async (id, e) => {
    e?.stopPropagation();
    if (!confirm('Archive this message?')) return;
    try {
      await api.patch(`/admin/archived/messages/${id}`);
      toast.success('Message archived.');
      fetchMessages(filter);
      if (selected?.id === id) setSelected(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to archive.');
    }
  };

  const columns = [
    {
      key: 'created_at',
      label: 'Date',
      render: (row) => <span className="text-gray-500 dark:text-gray-400 text-xs">{new Date(row.created_at).toLocaleDateString()}</span>,
    },
    {
      key: 'name',
      label: 'Name',
      render: (row) => <span className="font-medium text-gray-900 dark:text-white">{row.name}</span>,
    },
    {
      key: 'renter.email',
      label: 'Email',
      render: (row) => <span className="text-gray-500 dark:text-gray-400">{row.renter?.email}</span>,
    },
    {
      key: 'contact_number',
      label: 'Contact',
      render: (row) => <span className="text-gray-500 dark:text-gray-400">{row.contact_number}</span>,
    },
    {
      key: 'location',
      label: 'Location',
      render: (row) => <span className="text-gray-500 dark:text-gray-400 text-xs">{row.location}</span>,
    },
    {
      key: 'message',
      label: 'Message',
      render: (row) => <p className="text-gray-600 dark:text-gray-400 text-xs truncate max-w-[200px]">{row.message}</p>,
      sortable: false,
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
      render: (row) => (
        <div className="flex items-center justify-center gap-1.5">
          {row.status === 'pending' && (
            <button onClick={(e) => updateStatus(row.id, 'reviewed', e)}
              className="text-purple-600 hover:bg-purple-50 px-2 py-1 rounded text-xs font-medium border border-purple-200">
              Reviewed
            </button>
          )}
          {row.status === 'reviewed' && (
            <button onClick={(e) => updateStatus(row.id, 'responded', e)}
              className="text-green-600 hover:bg-green-50 px-2 py-1 rounded text-xs font-medium border border-green-200">
              Responded
            </button>
          )}
          <button onClick={(e) => handleDelete(row.id, e)}
            className="text-red-500 hover:bg-red-50 p-1 rounded border border-red-200">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={(e) => handleArchive(row.id, e)}
            className="text-amber-600 hover:bg-amber-50 p-1 rounded border border-amber-200">
            <Archive className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <MessageSquare className="w-7 h-7 text-green-600" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Message Requests</h1>
      </div>

      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {[
          { label: 'All', value: '' },
          { label: 'Pending', value: 'pending' },
          { label: 'Reviewed', value: 'reviewed' },
          { label: 'Responded', value: 'responded' },
        ].map((btn) => (
          <button
            key={btn.value}
            onClick={() => setFilter(btn.value)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
              filter === btn.value
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {loading ? (
        <TableSkeleton rows={8} cols={5} />
      ) : (
        <DataTable
          columns={columns}
          data={data}
          onRowClick={(row) => setSelected(row)}
          searchKeys={['name', 'renter.email', 'contact_number', 'location', 'message', 'status']}
          defaultSort={{ key: 'created_at', dir: 'desc' }}
          emptyMessage="No messages found."
        />
      )}

      {/* ── Detail Modal ── */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setSelected(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{selected.name}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{selected.renter?.email} • {selected.contact_number}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <StatusBadge status={selected.status} />
                <span className="text-xs text-gray-400">{new Date(selected.created_at).toLocaleString()}</span>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Location</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{selected.location}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Message</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded-lg p-3 whitespace-pre-wrap">{selected.message}</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap pt-2 border-t dark:border-gray-700">
                {selected.status === 'pending' && (
                  <button onClick={(e) => { updateStatus(selected.id, 'reviewed', e); setSelected((s) => ({ ...s, status: 'reviewed' })); }}
                    className="text-purple-600 hover:bg-purple-50 px-3 py-1.5 rounded-lg text-xs font-medium border border-purple-200">
                    Mark Reviewed
                  </button>
                )}
                {selected.status === 'reviewed' && (
                  <button onClick={(e) => { updateStatus(selected.id, 'responded', e); setSelected((s) => ({ ...s, status: 'responded' })); }}
                    className="text-green-600 hover:bg-green-50 px-3 py-1.5 rounded-lg text-xs font-medium border border-green-200">
                    Mark Responded
                  </button>
                )}
                <button onClick={(e) => handleDelete(selected.id, e)}
                  className="text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg text-xs font-medium border border-red-200 flex items-center gap-1 ml-auto">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
                <button onClick={(e) => handleArchive(selected.id, e)}
                  className="text-amber-600 hover:bg-amber-50 px-3 py-1.5 rounded-lg text-xs font-medium border border-amber-200 flex items-center gap-1">
                  <Archive className="w-3.5 h-3.5" /> Archive
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
