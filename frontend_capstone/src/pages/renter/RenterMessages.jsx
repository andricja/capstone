import { useEffect, useState } from 'react';
import api from '../../lib/api';
import StatusBadge from '../../components/StatusBadge';
import Pagination from '../../components/Pagination';

export default function RenterMessages() {
  const [messages, setMessages] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({ name: '', contact_number: '', location: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');

  const fetchMessages = (p = 1) => {
    setLoading(true);
    api.get('/renter/messages', { params: { page: p } })
      .then((r) => setMessages(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchMessages(page); }, [page]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback('');
    try {
      await api.post('/renter/messages', form);
      setFeedback('Your inquiry has been submitted.');
      setForm({ name: '', contact_number: '', location: '', message: '' });
      fetchMessages(1);
    } catch (err) {
      setFeedback(err.response?.data?.message || 'Failed to submit.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Contact Us</h1>

      {feedback && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${feedback.includes('Failed') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {feedback}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Send an Inquiry</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
              <input type="text" required value={form.contact_number} onChange={(e) => setForm({ ...form, contact_number: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input type="text" required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea rows="4" required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none resize-none" />
            </div>
            <button type="submit" disabled={submitting}
              className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50">
              {submitting ? 'Sending...' : 'Send Inquiry'}
            </button>
          </form>
        </div>

        {/* History */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h2 className="font-semibold text-gray-900">My Inquiries</h2>
          </div>
          {loading ? (
            <div className="p-6 text-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto" /></div>
          ) : messages?.data?.length === 0 ? (
            <div className="p-6 text-center text-gray-500 text-sm">No inquiries yet.</div>
          ) : (
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {messages.data.map((m) => (
                <div key={m.id} className="px-6 py-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400">{new Date(m.created_at).toLocaleDateString()}</span>
                    <StatusBadge status={m.status} />
                  </div>
                  <p className="text-sm text-gray-800">{m.message}</p>
                </div>
              ))}
            </div>
          )}
          <Pagination data={messages} onPageChange={setPage} />
        </div>
      </div>
    </div>
  );
}
