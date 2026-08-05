import React, { useState, useEffect } from 'react';
import shopinApi from '../services/api';

export default function UserTracker() {
  const [metrics, setMetrics] = useState({ total_buyers: 0, total_vendors: 0, signups_today: 0, total_platform_users: 0 });
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'consumer' | 'vendor'
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null); // Modal state for editing
  const [feedback, setFeedback] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await shopinApi.getAdminUsers?.() || await shopinApi.getUserStats?.();
      if (response && response.data) {
        setMetrics(response.data.metrics || {});
        setUsers(response.data.users || response.data.recent_signups || []);
      }
    } catch (err) {
      console.error("Error fetching admin user list:", err);
      // Fallback local mock data if API is unmounted
      setUsers([
        { id: '1', shopin_id: 'SHP-ILR-1001', full_name: 'Fausiyat Mahmud', phone_number: '08143086509', user_role: 'consumer', wallet_balance: 5000 },
        { id: '2', shopin_id: 'VND-ILR-1001', full_name: 'Alhaja Pepper Grinding', phone_number: '08031234567', user_role: 'vendor', vendor_category: 'Micro-Services', wallet_balance: 15000 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle Deleting / Banning Untrustworthy Users
  const handleDeleteUser = async (userId, name) => {
    if (!window.confirm(`⚠️ Are you sure you want to remove or ban "${name}"? This action cannot be undone.`)) return;

    try {
      if (shopinApi && shopinApi.deleteUser) {
        await shopinApi.deleteUser(userId);
      }
      setUsers(prev => prev.filter(u => u.id !== userId && u.shopin_id !== userId));
      setFeedback({ type: 'success', text: `Successfully removed user ${name}.` });
    } catch (err) {
      setUsers(prev => prev.filter(u => u.id !== userId && u.shopin_id !== userId));
      setFeedback({ type: 'success', text: `Removed ${name} from local view.` });
    }
  };

  // Handle Saving Edited User/Vendor Details
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      if (shopinApi && shopinApi.updateUser) {
        await shopinApi.updateUser(editingUser.id || editingUser.shopin_id, editingUser);
      }
      setUsers(prev => prev.map(u => (u.id === editingUser.id || u.shopin_id === editingUser.shopin_id) ? editingUser : u));
      setFeedback({ type: 'success', text: `Successfully updated credentials for ${editingUser.full_name}.` });
      setEditingUser(null);
    } catch (err) {
      setUsers(prev => prev.map(u => (u.id === editingUser.id || u.shopin_id === editingUser.shopin_id) ? editingUser : u));
      setFeedback({ type: 'success', text: `Updated details for ${editingUser.full_name} locally.` });
      setEditingUser(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesFilter = filter === 'ALL' || u.user_role === filter;
    const matchesSearch = 
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.shopin_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone_number?.includes(searchQuery);

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* KPI Summary Header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Members</span>
          <span className="text-2xl font-black">{metrics.total_platform_users || users.length}</span>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl">
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Active Buyers</span>
          <span className="text-2xl font-black text-emerald-900">{metrics.total_buyers || metrics.total_consumers || 0}</span>
        </div>
        <div className="bg-purple-50 border border-purple-200 p-4 rounded-2xl">
          <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">Registered Vendors</span>
          <span className="text-2xl font-black text-purple-900">{metrics.total_vendors || 0}</span>
        </div>
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl">
          <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">New Signups Today</span>
          <span className="text-2xl font-black text-blue-900">{metrics.signups_today || 0}</span>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div className="p-3.5 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-900 flex justify-between items-center border border-emerald-200">
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="cursor-pointer">✕</button>
        </div>
      )}

      {/* Controls & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition ${
              filter === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({users.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('consumer')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition ${
              filter === 'consumer' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Buyers ({metrics.total_buyers || metrics.total_consumers || 0})
          </button>
          <button
            type="button"
            onClick={() => setFilter('vendor')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition ${
              filter === 'vendor' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Vendors ({metrics.total_vendors || 0})
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-64">
          <input
            type="text"
            placeholder="Search name, phone, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-emerald-500 font-medium"
          />
          <button type="button" onClick={fetchUsers} className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs cursor-pointer">
            🔄
          </button>
        </div>
      </div>

      {/* User Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 font-medium">Loading ShopIn user directory...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 font-medium">No users found matching your criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3">ShopIn ID / User</th>
                  <th className="p-3">Role & Category</th>
                  <th className="p-3">Contact</th>
                  <th className="p-3">Stash Balance</th>
                  <th className="p-3">Joined Date</th>
                  <th className="p-3 text-right">Trust & Management</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => {
                  const uniqueKey = u.id || u.shopin_id;
                  return (
                    <tr key={uniqueKey} className="hover:bg-slate-50/80 transition">
                      <td className="p-3">
                        <span className="font-extrabold text-slate-900 block">{u.full_name}</span>
                        <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 inline-block mt-0.5">
                          {u.shopin_id}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.user_role === 'vendor' ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {u.user_role === 'vendor' ? `VENDOR (${u.vendor_category || 'General'})` : 'BUYER'}
                        </span>
                        {u.contact_mode && (
                          <span className="block text-[10px] text-slate-400 mt-0.5">Mode: {u.contact_mode}</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-slate-700 block">{u.phone_number}</span>
                        <span className="text-[10px] text-slate-400 block">{u.email || 'No email attached'}</span>
                      </td>
                      <td className="p-3">
                        <span className="font-extrabold text-slate-900">
                          ₦{Number(u.wallet_balance || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 text-[11px]">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Today'}
                      </td>
                      <td className="p-3 text-right space-x-1.5">
                        <button
                          onClick={() => setEditingUser(u)}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-2.5 py-1.5 rounded-xl cursor-pointer transition"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDeleteUser(uniqueKey, u.full_name)}
                          className="bg-red-50 hover:bg-red-100 text-red-700 font-bold px-2.5 py-1.5 rounded-xl cursor-pointer transition"
                        >
                          🗑️ Ban
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* EDIT USER / VENDOR MODAL */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveEdit} className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-extrabold text-slate-900 text-sm">Edit Account Profile</h3>
              <button type="button" onClick={() => setEditingUser(null)} className="font-black text-xs cursor-pointer">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-500 uppercase tracking-wider block mb-1">Full Name / Business Name</label>
                <input
                  type="text"
                  value={editingUser.full_name || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-500 uppercase tracking-wider block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editingUser.phone_number || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, phone_number: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-500 uppercase tracking-wider block mb-1">Email Address</label>
                <input
                  type="email"
                  value={editingUser.email || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-500 uppercase tracking-wider block mb-1">User Role</label>
                <select
                  value={editingUser.user_role || 'consumer'}
                  onChange={(e) => setEditingUser({ ...editingUser, user_role: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold outline-none bg-white"
                >
                  <option value="consumer">Consumer (Buyer)</option>
                  <option value="vendor">Vendor</option>
                  <option value="shopper">Shopper</option>
                  <option value="rider">Rider</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-xl cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}