'use client';

import { useState, useEffect } from 'react';
import { withAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { createVendor, getVendors, deleteVendor } from '@/lib/api';
import { Vendor } from '@/types/vendor';

// the withAuthenticator injects 'signOut' and 'user' as props automatically
function Home({signOut, user}: {signOut?:()=> void; user?:any}) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [form, setForm] = useState({ name: '', category: '', contactEmail: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadVendors = async () => {
    try {
      const data = await getVendors();
      setVendors(data);
    } catch {
      setError('Failed to load vendors.');
    }
  };

  // Load vendors once when the page first renders
  useEffect(() => {
    loadVendors();
  }, []);
  // The empty [] means this runs only once. Without it, the effect would
  // run after every render, causing an infinite loop of fetch requests.

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault(); // Prevent the browser from reloading the page on submit
    setLoading(true);
    setError('');
    try {
      await createVendor(form);
      setForm({ name: '', category: '', contactEmail: '' }); // Reset the form
      await loadVendors(); // Refresh the list from DynamoDB
    } catch {
      setError('Failed to add vendor. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (vendorId: string) => {
    try {
      await deleteVendor(vendorId);
      await loadVendors(); // Refresh after deleting
    } catch {
      setError('Failed to delete vendor.');
    }
  };

  return (
    <main className="p-10 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-2 text-gray-400">Vendor Tracker</h1>
      <p className="text-gray-500 mb-8">Manage your vendors, stored in AWS DynamoDB.</p>

      {/* ── Header ── */}
      <header className="flex justify-between items-center mb-8 p-4 bg-gray-100 rounded">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Vendor Tracker</h1>
          <p className="text-sm text-gray-500">Signed in as: {user?.signInDetails?.loginId}</p>
        </div>
        <button
          onClick={signOut}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
        >
          Sign Out
        </button>
      </header>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

        {/* ── Add Vendor Form ── */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-gray-400">Add New Vendor</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              className="w-full p-2 border rounded text-gray-400 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="Vendor Name"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
            />
            <input
              className="w-full p-2 border rounded text-gray-400 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="Category (e.g. SaaS, Hardware)"
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
              required
            />
            <input
              className="w-full p-2 border rounded text-gray-400 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="Contact Email"
              type="email"
              value={form.contactEmail}
              onChange={e => setForm({ ...form, contactEmail: e.target.value })}
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 text-white p-2 rounded hover:bg-orange-600 disabled:bg-gray-400 transition-colors"
            >
              {loading ? 'Saving...' : 'Add Vendor'}
            </button>
          </form>
        </section>

        {/* ── Vendor List ── */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-gray-400">
            Current Vendors ({vendors.length})
          </h2>
          <div className="space-y-3">
            {vendors.length === 0 ? (
              <p className="text-gray-400 italic">No vendors yet. Add one using the form.</p>
            ) : (
              vendors.map(v => (
                <div
                  key={v.vendorId}
                  className="p-4 border rounded shadow-sm bg-white flex justify-between items-start"
                >
                  <div>
                    <p className="font-semibold text-gray-900">{v.name}</p>
                    <p className="text-sm text-gray-500">{v.category} · {v.contactEmail}</p>
                  </div>
                  <button
                    onClick={() => v.vendorId && handleDelete(v.vendorId)}
                    className="ml-4 text-sm text-red-500 hover:text-red-700 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

      </div>
    </main>
  );
}

// wrapping home withAuthenticator means any user who is not logged in will see amplify's built-in login/signup screen instead of this component.
export default withAuthenticator(Home)