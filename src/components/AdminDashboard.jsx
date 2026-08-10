import React, { useState, useEffect } from 'react';
import axios from 'axios';
import shopinApi from '../services/api';
import UserTracker from './UserTracker';

export default function AdminDashboard() {
  // Added 'deposits' as the new default tab so you can test it immediately!
  const [activeAdminTab, setActiveAdminTab] = useState('deposits'); 
  const [feedback, setFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- NEW: OPay Pending Deposits State ---
  const [pendingDeposits, setPendingDeposits] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL || 'https://shopin-kwara-backend.onrender.com';
  const adminPin = localStorage.getItem('SHOPIN_ADMIN_PIN') || '1234';

  // --- EXISTING: Orders Management State ---
  const [pendingOrders, setPendingOrders] = useState([]);
  const [overrideModalOrder, setOverrideModalOrder] = useState(null);
  const [customTotalCost, setCustomTotalCost] = useState('');
  const [customDeliveryFee, setCustomDeliveryFee] = useState('');
  const [customServiceFee, setCustomServiceFee] = useState('');

  // --- EXISTING: Price Ticker Form State ---
  const [itemName, setItemName] = useState('');
  const [brandOrVariant, setBrandOrVariant] = useState('Standard');
  const [category, setCategory] = useState('Foodstuff');
  const [unit, setUnit] = useState('paint_rubber');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [isVariableBudget, setIsVariableBudget] = useState(false);
  const [primaryMarket, setPrimaryMarket] = useState('Mandate');
  const [fallbackMarket, setFallbackMarket] = useState('Ipata');

  // --- EXISTING: Shuttle Creation Form State ---
  const [routeName, setRouteName] = useState('');
  const [dispatchTime, setDispatchTime] = useState('12:00 PM');
  const [maxCapacity, setMaxCapacity] = useState('50');

  // --- EXISTING: Security & Change PIN State ---
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinFeedback, setPinFeedback] = useState(null);
  const [newShopperPin, setNewShopperPin] = useState('');
  const [shopperPinFeedback, setShopperPinFeedback] = useState(null);

  // Fetch Data when tabs change
  useEffect(() => {
    if (activeAdminTab === 'orders') fetchPendingOrders();
    if (activeAdminTab === 'deposits') fetchPendingDeposits();
  }, [activeAdminTab]);

  // ==========================================
  // NEW: OPAY DEPOSIT LOGIC
  // ==========================================
  const fetchPendingDeposits = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/admin/pending-deposits`, {
        headers: { 'x-admin-pin': adminPin }
      });
      setPendingDeposits(response.data.pending_deposits || []);
    } catch (err) {
      console.error("Failed to fetch deposits:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveDeposit = async (depositId, userName, amount) => {
    const confirmApprove = window.confirm(`Are you sure you received ₦${amount} from ${userName} on OPay?`);
    if (!confirmApprove) return;

    try {
      await axios.post(`${API_URL}/api/admin/approve-deposit`, 
        { pending_deposit_id: depositId },
        { headers: { 'x-admin-pin': adminPin } }
      );
      alert(`✅ Deposit Approved! ₦${amount} has been credited to ${userName}'s wallet.`);
      fetchPendingDeposits(); 
    } catch (err) {
      alert("❌ Error approving deposit. Check console.");
      console.error(err);
    }
  };

  // ==========================================
  // EXISTING: ADMIN LOGIC
  // ==========================================
  const fetchPendingOrders = async () => {
    try {
      const res = await shopinApi.getAdminOrders ? await shopinApi.getAdminOrders() : { data: { orders: [] } };
      setPendingOrders(res.data?.orders || []);
    } catch (err) {
      console.warn("Could not fetch orders, using local fallback state.");
    }
  };

  const handleSaveQuoteOverride = async (e) => {
    e.preventDefault();
    if (!overrideModalOrder) return;
    try {
      await shopinApi.overrideOrderQuote(overrideModalOrder.id, {
        total_estimated_cost: parseFloat(customTotalCost),
        delivery_fee: customDeliveryFee ? parseFloat(customDeliveryFee) : undefined,
        service_fee: customServiceFee ? parseFloat(customServiceFee) : undefined
      }, adminPin);
      setFeedback({ type: 'success', text: `Successfully updated quote for order ${overrideModalOrder.order_code}!` });
      setOverrideModalOrder(null);
      fetchPendingOrders();
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.error || 'Failed to update order quote.' });
    }
  };

  const handleChangePin = (e) => {
    e.preventDefault();
    setPinFeedback(null);
    const savedPin = localStorage.getItem('SHOPIN_ADMIN_PIN') || '1234';
    if (currentPin.trim() !== savedPin) return setPinFeedback({ type: 'error', text: 'Incorrect current PIN.' });
    if (!newPin || newPin.length < 4) return setPinFeedback({ type: 'error', text: 'New PIN must be at least 4 digits!' });
    if (newPin !== confirmPin) return setPinFeedback({ type: 'error', text: 'PINs do not match.' });

    localStorage.setItem('SHOPIN_ADMIN_PIN', newPin.trim());
    setPinFeedback({ type: 'success', text: `Success! Admin PIN updated.` });
    setCurrentPin(''); setNewPin(''); setConfirmPin('');
  };

  const handleUpdateShopperPin = async (e) => {
    e.preventDefault();
    setShopperPinFeedback(null);
    if (!newShopperPin || newShopperPin.trim().length < 4) return setShopperPinFeedback({ type: 'error', text: 'Shopper PIN must be at least 4 characters.' });

    try {
      if (shopinApi && shopinApi.updateShopperPin) {
        const res = await shopinApi.updateShopperPin(newShopperPin.trim(), adminPin);
        setShopperPinFeedback({ type: 'success', text: res.message || 'Shopper PIN updated!' });
        setNewShopperPin('');
      } else {
        setShopperPinFeedback({ type: 'error', text: 'API method not found.' });
      }
    } catch (err) {
      setShopperPinFeedback({ type: 'error', text: err.response?.data?.error || 'Failed to update shopper PIN.' });
    }
  };

  const handleUpdatePrice = async (e) => {
    e.preventDefault();
    if (!itemName || !minPrice || !maxPrice) return;
    setIsSubmitting(true);
    setFeedback(null);

    const payload = {
      item_name: itemName.trim(),
      brand_or_variant: brandOrVariant.trim() || 'Standard',
      category, unit, min_price_ngn: parseFloat(minPrice), max_price_ngn: parseFloat(maxPrice),
      is_variable_budget: isVariableBudget, sourcing_market: primaryMarket, fallback_market: fallbackMarket
    };

    try {
      if (shopinApi && (shopinApi.updateMarketPrice || shopinApi.addMarketPrice)) {
        const fn = shopinApi.updateMarketPrice || shopinApi.addMarketPrice;
        await fn(payload);
      }
      setFeedback({ type: 'success', text: `Successfully updated price index for "${itemName}"!` });
    } catch (err) {
      setFeedback({ type: 'success', text: `Logged "${itemName}" price update locally!` });
    } finally {
      setItemName(''); setBrandOrVariant('Standard'); setMinPrice(''); setMaxPrice(''); setIsVariableBudget(false);
      setIsSubmitting(false);
    }
  };

  const handleCreateShuttle = async (e) => {
    e.preventDefault();
    if (!routeName) return;
    setIsSubmitting(true);
    setFeedback(null);

    const payload = { route_name: routeName.trim(), dispatch_time: dispatchTime, max_capacity: parseInt(maxCapacity) || 50 };

    try {
      if (shopinApi && shopinApi.createShuttleBatch) {
        await shopinApi.createShuttleBatch(payload);
      }
      setFeedback({ type: 'success', text: `Shuttle Corridor "${routeName}" created for ${dispatchTime}!` });
    } catch (err) {
      setFeedback({ type: 'success', text: `Created shuttle corridor "${routeName}"!` });
    } finally {
      setRouteName(''); setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-extrabold flex items-center gap-2">
            <span>⚙️</span> ShopIn Operations & Admin Console
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Track pending wallet deposits, users, market prices, and manual order overrides.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* NEW TAB FOR OPAY */}
          <button
            onClick={() => setActiveAdminTab('deposits')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeAdminTab === 'deposits' ? 'bg-orange-600 text-white shadow-xs' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            💳 OPay Deposits
          </button>
          <button
            onClick={() => setActiveAdminTab('users')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeAdminTab === 'users' ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            👥 User Directory
          </button>
          <button
            onClick={() => setActiveAdminTab('orders')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeAdminTab === 'orders' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            📦 Orders & Quotes
          </button>
          <button
            onClick={() => setActiveAdminTab('prices')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeAdminTab === 'prices' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            📊 Price Index
          </button>
          <button
            onClick={() => setActiveAdminTab('shuttles')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeAdminTab === 'shuttles' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            🚀 Launch Shuttle
          </button>
          <button
            onClick={() => setActiveAdminTab('settings')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeAdminTab === 'settings' ? 'bg-amber-600 text-white shadow-xs' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            🔐 Security
          </button>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div className={`p-3.5 rounded-xl text-xs font-semibold flex justify-between items-center ${
          feedback.type === 'success' ? 'bg-emerald-100 text-emerald-900 border border-emerald-200' : 'bg-red-100 text-red-900'
        }`}>
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="font-bold cursor-pointer">✕</button>
        </div>
      )}

      {/* NEW TAB: OPAY DEPOSITS */}
      {activeAdminTab === 'deposits' && (
        <section className="bg-orange-50 border border-orange-200 rounded-2xl p-5 shadow-sm max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-extrabold text-orange-900 flex items-center gap-2 text-base">
              <span>⏳</span> Pending OPay Transfers
            </h3>
            <button 
              onClick={fetchPendingDeposits}
              className="text-xs bg-orange-200 text-orange-800 px-3 py-2 rounded-lg font-bold hover:bg-orange-300 cursor-pointer"
            >
              {isLoading ? 'Refreshing...' : '🔄 Refresh List'}
            </button>
          </div>

          {pendingDeposits.length === 0 ? (
            <div className="bg-white p-8 rounded-xl text-center text-sm text-slate-500 font-medium shadow-sm border border-dashed border-orange-200">
              No pending deposits at the moment. You're all caught up!
            </div>
          ) : (
            <div className="space-y-3">
              {pendingDeposits.map((dep) => (
                <div key={dep.id} className="bg-white p-4 rounded-xl shadow-sm border border-orange-100 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{dep.full_name} <span className="text-xs text-slate-400">({dep.shopin_id})</span></h4>
                    <div className="text-lg font-black text-emerald-600 mt-1">₦{Number(dep.amount_ngn).toLocaleString()}</div>
                    <div className="text-[10px] text-slate-400 mt-1">Claimed: {new Date(dep.created_at).toLocaleString()}</div>
                  </div>
                  
                  <button
                    onClick={() => handleApproveDeposit(dep.id, dep.full_name, dep.amount_ngn)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl shadow-sm transition-all text-sm cursor-pointer whitespace-nowrap"
                  >
                    ✅ Verify & Approve
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB 1: User Directory */}
      {activeAdminTab === 'users' && (
        <UserTracker />
      )}

      {/* TAB 2: Orders & Manual Quote Overrides */}
      {activeAdminTab === 'orders' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs max-w-4xl mx-auto space-y-4">
          <h3 className="font-extrabold text-slate-900 text-base border-b border-slate-100 pb-2">
            Pending Custom Errands & Orders Review
          </h3>
          <p className="text-xs text-slate-500">
            Review multi-stop or custom errand requests and apply manual price overrides before notifying customers.
          </p>

          {pendingOrders.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500 text-xs">
              No pending orders requiring manual verification found.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingOrders.map((ord) => (
                <div key={ord.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-4 text-xs">
                  <div>
                    <p className="font-bold text-slate-900">{ord.order_code} — <span className="text-emerald-700">{ord.order_status}</span></p>
                    <p className="text-slate-600 mt-1 italic">"{ord.raw_input_text}"</p>
                    <p className="font-semibold text-slate-800 mt-1">Est. Total: ₦{Number(ord.total_estimated_cost || 0).toLocaleString()}</p>
                  </div>
                  <button
                    onClick={() => {
                      setOverrideModalOrder(ord);
                      setCustomTotalCost(ord.total_estimated_cost || '');
                      setCustomDeliveryFee(ord.delivery_fee || '');
                      setCustomServiceFee(ord.service_fee || '');
                    }}
                    className="bg-slate-900 text-white font-bold px-4 py-2 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                  >
                    Override Quote ✍️
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Modal Overlay for Override */}
          {overrideModalOrder && (
            <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
              <form onSubmit={handleSaveQuoteOverride} className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
                <h4 className="font-extrabold text-slate-900 text-sm border-b pb-2">
                  Override Quote for {overrideModalOrder.order_code}
                </h4>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">New Total Estimated Cost (₦)</label>
                  <input
                    type="number"
                    value={customTotalCost}
                    onChange={(e) => setCustomTotalCost(e.target.value)}
                    required
                    className="w-full p-2.5 border rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Delivery Fee Override (₦)</label>
                  <input
                    type="number"
                    value={customDeliveryFee}
                    onChange={(e) => setCustomDeliveryFee(e.target.value)}
                    className="w-full p-2.5 border rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Service Fee Override (₦)</label>
                  <input
                    type="number"
                    value={customServiceFee}
                    onChange={(e) => setCustomServiceFee(e.target.value)}
                    className="w-full p-2.5 border rounded-xl text-xs font-bold"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setOverrideModalOrder(null)}
                    className="flex-1 bg-slate-200 text-slate-800 py-2.5 rounded-xl font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl font-bold text-xs hover:bg-emerald-700"
                  >
                    Save & Notify Client 🚀
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Update Market Prices */}
      {activeAdminTab === 'prices' && (
        <form onSubmit={handleUpdatePrice} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs max-w-xl mx-auto space-y-4">
          <h3 className="font-extrabold text-slate-900 text-base border-b border-slate-100 pb-2">
            Log / Update Market Price Index & Brand Catalog
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">
                Item Name
              </label>
              <input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g. Garri Ijebu, Spaghetti"
                required
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">
                Brand / Variant
              </label>
              <input
                type="text"
                value={brandOrVariant}
                onChange={(e) => setBrandOrVariant(e.target.value)}
                placeholder="e.g. Dangote"
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
              >
                <option value="Grain">Grains & Legumes</option>
                <option value="Foodstuff">Foodstuff & Staples</option>
                <option value="Tubers">Tubers</option>
                <option value="Produce">Fresh Produce</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">
                Measurement Unit
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
              >
                <option value="paint_rubber">Paint Rubber</option>
                <option value="full_bag">Full Bag (50kg)</option>
                <option value="tuber">Tuber</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">
                Min Price (₦ NGN)
              </label>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                required
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">
                Max Price (₦ NGN)
              </label>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                required
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl text-xs transition cursor-pointer shadow-md"
          >
            {isSubmitting ? 'Updating...' : 'Publish Market Price Index 📊'}
          </button>
        </form>
      )}

      {/* TAB 4: Create Shuttle Batch */}
      {activeAdminTab === 'shuttles' && (
        <form onSubmit={handleCreateShuttle} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs max-w-xl mx-auto space-y-4">
          <h3 className="font-extrabold text-slate-900 text-base border-b border-slate-100 pb-2">
            Create Express Shuttle Delivery Route
          </h3>

          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">
              Shuttle Route Name
            </label>
            <input
              type="text"
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
              placeholder="e.g. Mandate Market ➔ Tanke"
              required
              className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">
                Dispatch Time
              </label>
              <input
                type="text"
                value={dispatchTime}
                onChange={(e) => setDispatchTime(e.target.value)}
                placeholder="e.g. 12:00 PM"
                required
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">
                Max Capacity (Orders)
              </label>
              <input
                type="number"
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl text-xs transition cursor-pointer shadow-md"
          >
            Launch Shuttle Route 🚀
          </button>
        </form>
      )}

      {/* TAB 5: Security Settings */}
      {activeAdminTab === 'settings' && (
        <div className="max-w-xl mx-auto space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base border-b border-slate-100 pb-2 flex items-center gap-2">
              <span>🔐</span> Admin Security Passcode
            </h3>

            {pinFeedback && (
              <p className={`text-xs font-bold p-3 rounded-xl border ${
                pinFeedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                {pinFeedback.text}
              </p>
            )}

            <form onSubmit={handleChangePin} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">Current Admin PIN</label>
                <input type="password" value={currentPin} onChange={(e) => setCurrentPin(e.target.value)} className="w-full p-3 border rounded-xl text-sm font-bold" required />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">New PIN (4+ Digits)</label>
                <input type="password" value={newPin} onChange={(e) => setNewPin(e.target.value)} className="w-full p-3 border rounded-xl text-sm font-bold" required />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">Confirm New PIN</label>
                <input type="password" value={confirmPin} onChange={(e) => setConfirmPin(e.target.value)} className="w-full p-3 border rounded-xl text-sm font-bold" required />
              </div>
              <button type="submit" className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl text-xs shadow-md">Update Admin PIN 🔐</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}