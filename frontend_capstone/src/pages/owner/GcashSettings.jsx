import { useEffect, useState } from 'react';
import api from '../../lib/api';

export default function GcashSettings() {
  const [setting, setSetting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ account_name: '', account_number: '', qr_code_image: null });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get('/owner/gcash-settings')
      .then((r) => {
        setSetting(r.data);
        setForm({ account_name: r.data.account_name, account_number: r.data.account_number, qr_code_image: null });
      })
      .catch(() => { /* no settings yet */ })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      const fd = new FormData();
      fd.append('account_name', form.account_name);
      fd.append('account_number', form.account_number);
      if (form.qr_code_image) fd.append('qr_code_image', form.qr_code_image);

      const res = await api.post('/owner/gcash-settings', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSetting(res.data.setting);
      setMessage('GCash settings saved successfully.');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to save settings.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto" /></div>;

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">GCash Settings</h1>

      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${message.includes('Failed') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message}
        </div>
      )}

      <div className="bg-blue-50 rounded-lg p-4 mb-6 text-sm text-blue-800">
        <p>These details will be shown to renters when they purchase points. Payments go directly to your GCash account.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">GCash Account Name</label>
            <input type="text" required value={form.account_name}
              onChange={(e) => setForm({ ...form, account_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
              placeholder="e.g. Juan Cruz" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">GCash Account Number</label>
            <input type="text" required value={form.account_number}
              onChange={(e) => setForm({ ...form, account_number: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
              placeholder="e.g. 09123456789" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">QR Code Image</label>
            {setting?.qr_code_image && (
              <div className="mb-2">
                <img src={`/storage/${setting.qr_code_image}`} alt="Current QR" className="w-40 h-40 object-contain border rounded-lg" />
                <p className="text-xs text-gray-400 mt-1">Current QR code</p>
              </div>
            )}
            <input type="file" accept="image/*" onChange={(e) => setForm({ ...form, qr_code_image: e.target.files[0] })}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100" />
          </div>
          <button type="submit" disabled={submitting}
            className="w-full bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50">
            {submitting ? 'Saving...' : 'Save GCash Settings'}
          </button>
        </form>
      </div>
    </div>
  );
}
