import React, { useState } from 'react';
import shopinApi from '../services/api';

export default function UserProfileModal({ onClose, onProfileUpdated }) {
  // Load existing data from localStorage or default state
  const [fullName, setFullName] = useState(() => localStorage.getItem('SHOPIN_USER_NAME') || '');
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem('SHOPIN_USER_EMAIL') || '');
  const [userPhone, setUserPhone] = useState(() => localStorage.getItem('SHOPIN_USER_PHONE') || '');
  const [address, setAddress] = useState(() => localStorage.getItem('SHOPIN_USER_ADDRESS') || '');
  
  // The unique ShopIn ID (Read-only, pulled from local storage)
  const [shopinId] = useState(() => getOrCreateShopinId());
 
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Helper to copy ID to clipboard
  const handleCopyId = () => {
    navigator.clipboard.writeText(shopinId);
    setFeedback({ type: 'success', text: 'ShopIn ID copied to clipboard!' });
    setTimeout(() => setFeedback(null), 2000);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    const payload = {
      shopin_id: shopinId,
      full_name: fullName.trim(),
      email: userEmail.trim(),
      phone_number: userPhone.trim(),
      address: address.trim()
    };

    try {
      if (shopinApi && shopinApi.updateUserProfile) {
        await shopinApi.updateUserProfile(payload);
      }

      // 🌟 PERSIST SHOPIN_ID LOCALLY SO THE APP ALWAYS REMEMBERS WHO YOU ARE!
      localStorage.setItem('SHOPIN_USER_ID', shopinId); // <--- ADD THIS LINE
      localStorage.setItem('SHOPIN_USER_NAME', fullName.trim());
      localStorage.setItem('SHOPIN_USER_EMAIL', userEmail.trim());
      localStorage.setItem('SHOPIN_USER_PHONE', userPhone.trim());
      localStorage.setItem('SHOPIN_USER_ADDRESS', address.trim());

      setFeedback({ type: 'success', text: 'Profile updated successfully!' });

      if (onProfileUpdated) {
        onProfileUpdated(payload);
      }

      setTimeout(() => {
        if (onClose) onClose();
      }, 1200);
    } catch (err) {
      console.warn('Backend update fallback applied:', err);
      
      // 🌟 PERSIST SHOPIN_ID LOCALLY ON FALLBACK TOO
      localStorage.setItem('SHOPIN_USER_ID', shopinId); // <--- ADD THIS LINE TOO
      localStorage.setItem('SHOPIN_USER_NAME', fullName.trim());
      localStorage.setItem('SHOPIN_USER_EMAIL', userEmail.trim());
      localStorage.setItem('SHOPIN_USER_PHONE', userPhone.trim());
      localStorage.setItem('SHOPIN_USER_ADDRESS', address.trim());

      setFeedback({ type: 'success', text: 'Profile updated locally!' });
      setTimeout(() => {
        if (onClose) onClose();
      }, 1200);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl">
        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
            <span>👤</span> Edit Profile & Address
          </h3>
          <button type="button" onClick={onClose} className="font-black text-xs cursor-pointer text-slate-400 hover:text-slate-800 transition-colors">✕</button>
        </div>

        {feedback && (
          <p className="text-xs font-bold bg-emerald-100 text-emerald-800 p-2.5 rounded-xl text-center">
            {feedback.text}
          </p>
        )}

        <div className="space-y-3 text-xs">
          
          {/* 🏷️ The Exposed ShopIn ID Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
             <div>
                <label className="font-bold text-slate-500 uppercase tracking-wider block mb-0.5 text-[10px]">Your Unique ShopIn ID</label>
                <p className="font-black text-slate-800 font-mono tracking-tight text-sm">{shopinId}</p>
                <p className="text-[9px] text-slate-400 mt-0.5">Share this to receive foodstuff or funds.</p>
             </div>
             <button 
                type="button" 
                onClick={handleCopyId}
                className="bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-xs"
             >
                Copy
             </button>
          </div>

          <div>
            <label className="font-bold text-slate-500 uppercase tracking-wider block mb-1">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Fausiyat Mahmud"
              className="w-full p-2.5 border border-slate-300 rounded-xl font-medium outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="font-bold text-slate-500 uppercase tracking-wider block mb-1">Email Address</label>
            <input
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              placeholder="e.g. user@gmail.com"
              className="w-full p-2.5 border border-slate-300 rounded-xl font-medium outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="font-bold text-slate-500 uppercase tracking-wider block mb-1">Phone Number</label>
            <input
              type="tel"
              value={userPhone}
              onChange={(e) => setUserPhone(e.target.value)}
              placeholder="e.g. 08143086509"
              className="w-full p-2.5 border border-slate-300 rounded-xl font-medium outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="font-bold text-slate-500 uppercase tracking-wider block mb-1">Default Delivery Checkpoint</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Tanke/Unilorin Axis, Behind Sanrab hostel"
              rows="2"
              className="w-full p-2.5 border border-slate-300 rounded-xl font-medium outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-xl cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold py-2.5 rounded-xl cursor-pointer"
          >
            {isSaving ? 'Saving...' : 'Save Profile ➔'}
          </button>
        </div>
      </form>
    </div>
  );
}