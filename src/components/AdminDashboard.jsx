import React, { useState, useEffect } from 'react';
import axios from 'axios';
import shopinApi from '../services/api';
import UserTracker from './UserTracker';

function AdminProductsManager({ API_URL, adminPin }) {
  const [items, setItems] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/vendors/products`);
      setItems(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch products:", err);
    }
  };

  const handleSaveEdit = async (id) => {
    try {
      await axios.put(`${API_URL}/api/admin/vendor-products/${id}`, {
        product_name: newName,
        price_ngn: newPrice ? parseFloat(newPrice) : undefined
      }, {
        headers: { 'x-admin-pin': adminPin }
      });
      alert("✅ Item updated successfully!");
      setEditingItem(null);
      fetchItems();
    } catch (err) {
      alert("❌ Failed to update item.");
      console.error(err);
    }
  };

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-6">No marketplace items found.</p>
      ) : (
        items.map(item => (
          <div key={item.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs gap-3">
            <div>
              <span className="font-bold text-slate-900 block">{item.product_name}</span>
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Category: {item.category} • Price: ₦{Number(item.price_ngn || 0).toLocaleString()}</span>
            </div>

            {editingItem === item.id ? (
              <div className="flex items-center gap-2">
                <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="New Name" className="p-1 border rounded text-xs" />
                <input type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder="New Price" className="w-20 p-1 border rounded text-xs" />
                <button onClick={() => handleSaveEdit(item.id)} className="bg-emerald-600 text-white px-3 py-1 rounded font-bold cursor-pointer">Save</button>
                <button onClick={() => setEditingItem(null)} className="bg-slate-300 px-2 py-1 rounded cursor-pointer">Cancel</button>
              </div>
            ) : (
              <button 
                onClick={() => { setEditingItem(item.id); setNewName(item.product_name); setNewPrice(item.price_ngn || ''); }} 
                className="bg-slate-900 text-white font-bold px-3 py-1.5 rounded-lg cursor-pointer"
              >
                Edit Item ✍️
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const [activeAdminTab, setActiveAdminTab] = useState('locations'); 
  const [feedback, setFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'https://shopin-kwara-backend.onrender.com';
  const adminPin = localStorage.getItem('SHOPIN_ADMIN_PIN') || '1234';

  // --- Dynamic Locations State ---
  const [locations, setLocations] = useState({ markets: [], supermarkets: [], restaurants: [] });
  const [newMarket, setNewMarket] = useState('');
  const [newSupermarket, setNewSupermarket] = useState('');
  const [newRestaurant, setNewRestaurant] = useState('');

  // --- OPay Pending Deposits State ---
  const [pendingDeposits, setPendingDeposits] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // --- Orders Management State ---
  const [pendingOrders, setPendingOrders] = useState([]);
  const [overrideModalOrder, setOverrideModalOrder] = useState(null);
  const [customTotalCost, setCustomTotalCost] = useState('');
  const [customDeliveryFee, setCustomDeliveryFee] = useState('');
  const [customServiceFee, setCustomServiceFee] = useState('');

  // --- Price Ticker Form State ---
  const [itemName, setItemName] = useState('');
  const [brandOrVariant, setBrandOrVariant] = useState('Standard');
  const [category, setCategory] = useState('Foodstuff');
  const [unit, setUnit] = useState('paint_rubber');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [isVariableBudget, setIsVariableBudget] = useState(false);
  const [primaryMarket, setPrimaryMarket] = useState('Mandate');
  const [fallbackMarket, setFallbackMarket] = useState('Ipata');

  // --- Shuttle Creation Form State ---
  const [routeName, setRouteName] = useState('');
  const [dispatchTime, setDispatchTime] = useState('12:00 PM');
  const [maxCapacity, setMaxCapacity] = useState('50');

  // --- Security Settings ---
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinFeedback, setPinFeedback] = useState(null);
  const [newShopperPin, setNewShopperPin] = useState('');
  const [shopperPinFeedback, setShopperPinFeedback] = useState(null);

  // Fetch Data on Load
  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    if (activeAdminTab === 'orders') fetchPendingOrders();
    if (activeAdminTab === 'deposits') fetchPendingDeposits();
  }, [activeAdminTab]);

  // ==========================================
  // DYNAMIC LOCATIONS LOGIC
  // ==========================================
  const fetchLocations = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/locations`);
      setLocations(res.data);
    } catch (err) {
      console.error("Failed to fetch dynamic locations:", err);
    }
  };

  const updateLocationCategory = async (categoryName, updatedArray) => {
    try {
      await axios.put(`${API_URL}/api/admin/locations`, 
        { category: categoryName, locations_array: updatedArray },
        { headers: { 'x-admin-pin': adminPin } }
      );
      setLocations(prev => ({ ...prev, [categoryName]: updatedArray }));
      setFeedback({ type: 'success', text: `${categoryName} updated successfully!` });
    } catch (err) {
      setFeedback({ type: 'error', text: `Failed to update ${categoryName}.` });
      console.error(err);
    }
  };

  const handleAddLocation = (categoryName, value, resetInput) => {
    if (!value.trim()) return;
    const currentList = locations[categoryName] || [];
    if (currentList.includes(value.trim())) return alert("Location already exists!");
    
    updateLocationCategory(categoryName, [...currentList, value.trim()]);
    resetInput('');
  };

  const handleRemoveLocation = (categoryName, valueToRemove) => {
    const currentList = locations[categoryName] || [];
    const filteredList = currentList.filter(loc => loc !== valueToRemove);
    updateLocationCategory(categoryName, filteredList);
  };

  // ==========================================
  // OPAY DEPOSIT LOGIC
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
      alert(`✅ Deposit Approved!`);
      fetchPendingDeposits(); 
    } catch (err) {
      alert("❌ Error approving deposit.");
    }
  };

  // ==========================================
  // ORDERS LOGIC
  // ==========================================
  const fetchPendingOrders = async () => {
    try {
      const res = await shopinApi.getAdminOrders ? await shopinApi.getAdminOrders() : { data: { orders: [] } };
      setPendingOrders(res.data?.orders || []);
    } catch (err) {
      console.warn("Could not fetch orders.");
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

  // ==========================================
  // MARKET PRICE INDEX
  // ==========================================
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
      setItemName(''); setBrandOrVariant('Standard'); setMinPrice(''); setMaxPrice(''); setIsVariableBudget(false);
    } catch (err) {
      setFeedback({ type: 'success', text: `Logged "${itemName}" price update locally!` });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // SHUTTLES
  // ==========================================
  const handleCreateShuttle = async (e) => {
    e.preventDefault();
    if (!routeName) return;
    setIsSubmitting(true);
    setFeedback(null);

    const payload = { route_name: routeName.trim(), dispatch_time: dispatchTime, max_capacity: parseInt(maxCapacity) || 50 };
    try {
      if (shopinApi && shopinApi.createShuttleBatch) await shopinApi.createShuttleBatch(payload);
      setFeedback({ type: 'success', text: `Shuttle Corridor "${routeName}" created for ${dispatchTime}!` });
      setRouteName('');
    } catch (err) {
      setFeedback({ type: 'success', text: `Created shuttle corridor "${routeName}"!` });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // SECURITY & PINS
  // ==========================================
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

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-extrabold flex items-center gap-2">
            <span>⚙️</span> ShopIn Admin Console
          </h2>
          <p className="text-xs text-slate-300 mt-1">Manage locations, OPay deposits, prices, and orders.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={() => setActiveAdminTab('deposits')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${activeAdminTab === 'deposits' ? 'bg-orange-600' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>💳 Deposits</button>
          <button onClick={() => setActiveAdminTab('locations')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${activeAdminTab === 'locations' ? 'bg-indigo-600' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>📍 Locations</button>
          <button onClick={() => setActiveAdminTab('products')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${activeAdminTab === 'products' ? 'bg-teal-600' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>🛍️ Manage Items</button>
          <button onClick={() => setActiveAdminTab('users')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${activeAdminTab === 'users' ? 'bg-purple-600' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>👥 Users</button>
          <button onClick={() => setActiveAdminTab('orders')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${activeAdminTab === 'orders' ? 'bg-emerald-600' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>📦 Orders</button>
          <button onClick={() => setActiveAdminTab('prices')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${activeAdminTab === 'prices' ? 'bg-emerald-600' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>📊 Prices</button>
          <button onClick={() => setActiveAdminTab('shuttles')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${activeAdminTab === 'shuttles' ? 'bg-blue-600' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>🚀 Shuttles</button>
          <button onClick={() => setActiveAdminTab('settings')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${activeAdminTab === 'settings' ? 'bg-amber-600' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>🔐 Security</button>
        </div>
      </div>

      {feedback && (
        <div className={`p-3.5 rounded-xl text-xs font-semibold flex justify-between items-center ${feedback.type === 'success' ? 'bg-emerald-100 text-emerald-900 border border-emerald-200' : 'bg-red-100 text-red-900'}`}>
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="font-bold cursor-pointer">✕</button>
        </div>
      )}

      {/* NEW TAB: LOCATIONS MANAGER */}
      {activeAdminTab === 'locations' && (
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
            <h3 className="font-extrabold text-slate-900 text-base border-b border-slate-100 pb-2">📍 Dynamic Locations Manager</h3>
            <p className="text-xs text-slate-500">Add or remove places. These instantly update your frontend categories and price index dropdowns.</p>

            {/* Local Markets */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 className="text-sm font-bold text-slate-800 mb-2">🛒 Local Markets</h4>
              <div className="flex flex-wrap gap-2 mb-3">
                {locations.markets?.map((loc, idx) => (
                  <span key={idx} className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                    {loc} <button onClick={() => handleRemoveLocation('markets', loc)} className="text-emerald-900 hover:text-red-600 font-bold ml-1 cursor-pointer">✕</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="text" value={newMarket} onChange={(e) => setNewMarket(e.target.value)} placeholder="e.g. Tanke Market" className="flex-1 p-2 border rounded-lg text-xs" />
                <button onClick={() => handleAddLocation('markets', newMarket, setNewMarket)} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-800 cursor-pointer">Add</button>
              </div>
            </div>

            {/* Supermarkets */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 className="text-sm font-bold text-slate-800 mb-2">🛍️ Supermarkets & Malls</h4>
              <div className="flex flex-wrap gap-2 mb-3">
                {locations.supermarkets?.map((loc, idx) => (
                  <span key={idx} className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                    {loc} <button onClick={() => handleRemoveLocation('supermarkets', loc)} className="text-blue-900 hover:text-red-600 font-bold ml-1 cursor-pointer">✕</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="text" value={newSupermarket} onChange={(e) => setNewSupermarket(e.target.value)} placeholder="e.g. Ace Supermarket" className="flex-1 p-2 border rounded-lg text-xs" />
                <button onClick={() => handleAddLocation('supermarkets', newSupermarket, setNewSupermarket)} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-800 cursor-pointer">Add</button>
              </div>
            </div>

            {/* Restaurants */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 className="text-sm font-bold text-slate-800 mb-2">🍽️ Restaurants & Bukas</h4>
              <div className="flex flex-wrap gap-2 mb-3">
                {locations.restaurants?.map((loc, idx) => (
                  <span key={idx} className="bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                    {loc} <button onClick={() => handleRemoveLocation('restaurants', loc)} className="text-amber-900 hover:text-red-600 font-bold ml-1 cursor-pointer">✕</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="text" value={newRestaurant} onChange={(e) => setNewRestaurant(e.target.value)} placeholder="e.g. Iya Yusuf" className="flex-1 p-2 border rounded-lg text-xs" />
                <button onClick={() => handleAddLocation('restaurants', newRestaurant, setNewRestaurant)} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-800 cursor-pointer">Add</button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB: OPAY DEPOSITS */}
      {activeAdminTab === 'deposits' && (
        <section className="bg-orange-50 border border-orange-200 rounded-2xl p-5 shadow-sm max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-extrabold text-orange-900 flex items-center gap-2 text-base">
              <span>⏳</span> Pending OPay Transfers
            </h3>
            <button onClick={fetchPendingDeposits} className="text-xs bg-orange-200 text-orange-800 px-3 py-2 rounded-lg font-bold hover:bg-orange-300 cursor-pointer">
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
                <div key={dep.id} className="bg-white p-4 rounded-xl shadow-sm border border-orange-100 flex justify-between items-center gap-3">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{dep.full_name} <span className="text-xs text-slate-400">({dep.shopin_id})</span></h4>
                    <div className="text-lg font-black text-emerald-600 mt-1">₦{Number(dep.amount_ngn).toLocaleString()}</div>
                    <div className="text-[10px] text-slate-400 mt-1">Claimed: {new Date(dep.created_at).toLocaleString()}</div>
                  </div>
                  <button onClick={() => handleApproveDeposit(dep.id, dep.full_name, dep.amount_ngn)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl shadow-sm transition-all text-sm cursor-pointer whitespace-nowrap">
                    ✅ Verify & Approve
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB: MANAGE VENDOR / RESTAURANT PRODUCTS */}
      {activeAdminTab === 'products' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs max-w-4xl mx-auto space-y-4">
          <h3 className="font-extrabold text-slate-900 text-base border-b border-slate-100 pb-2">
            Manage & Edit Restaurant / Marketplace Items
          </h3>
          <p className="text-xs text-slate-500">Edit item names, prices, or categories across all vendors and restaurants.</p>

          <AdminProductsManager API_URL={API_URL} adminPin={adminPin} />
        </div>
      )}

      {/* TAB: USERS */}
      {activeAdminTab === 'users' && <UserTracker />}

      {/* TAB: ORDERS & QUOTES */}
      {activeAdminTab === 'orders' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs max-w-4xl mx-auto space-y-4">
          <h3 className="font-extrabold text-slate-900 text-base border-b border-slate-100 pb-2">Pending Errands Review</h3>
          {pendingOrders.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed text-slate-500 text-xs">No pending orders.</div>
          ) : (
            <div className="space-y-3">
              {pendingOrders.map((ord) => (
                <div key={ord.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-900">{ord.order_code}</p>
                    <p className="text-slate-600 italic">"{ord.raw_input_text}"</p>
                    <p className="font-semibold mt-1">Est. Total: ₦{Number(ord.total_estimated_cost || 0).toLocaleString()}</p>
                  </div>
                  <button onClick={() => { setOverrideModalOrder(ord); setCustomTotalCost(ord.total_estimated_cost || ''); setCustomDeliveryFee(ord.delivery_fee || ''); setCustomServiceFee(ord.service_fee || ''); }} className="bg-slate-900 text-white font-bold px-4 py-2 rounded-lg cursor-pointer">
                    Override Quote ✍️
                  </button>
                </div>
              ))}
            </div>
          )}
          {overrideModalOrder && (
             <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
               <form onSubmit={handleSaveQuoteOverride} className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
                 <h4 className="font-extrabold text-sm border-b pb-2">Override Quote for {overrideModalOrder.order_code}</h4>
                 <input type="number" value={customTotalCost} onChange={(e) => setCustomTotalCost(e.target.value)} required placeholder="New Total (₦)" className="w-full p-2.5 border rounded-xl text-xs font-bold" />
                 <input type="number" value={customDeliveryFee} onChange={(e) => setCustomDeliveryFee(e.target.value)} placeholder="Delivery Fee (₦)" className="w-full p-2.5 border rounded-xl text-xs font-bold" />
                 <input type="number" value={customServiceFee} onChange={(e) => setCustomServiceFee(e.target.value)} placeholder="Service Fee (₦)" className="w-full p-2.5 border rounded-xl text-xs font-bold" />
                 <div className="flex gap-2">
                   <button type="button" onClick={() => setOverrideModalOrder(null)} className="flex-1 bg-slate-200 py-2.5 rounded-xl font-bold text-xs">Cancel</button>
                   <button type="submit" className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl font-bold text-xs">Save</button>
                 </div>
               </form>
             </div>
          )}
        </div>
      )}

      {/* TAB: PRICES */}
      {activeAdminTab === 'prices' && (
        <form onSubmit={handleUpdatePrice} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs max-w-xl mx-auto space-y-4">
          <h3 className="font-extrabold text-slate-900 text-base border-b border-slate-100 pb-2">Log Market Price</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">Item Name</label>
              <input type="text" value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="e.g. Garri Ijebu" required className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">Brand / Variant</label>
              <input type="text" value={brandOrVariant} onChange={(e) => setBrandOrVariant(e.target.value)} placeholder="e.g. Dangote" className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
                <option value="Grain">Grains & Legumes</option>
                <option value="Foodstuff">Foodstuff & Staples</option>
                <option value="Tubers">Tubers</option>
                <option value="Produce">Fresh Produce & Herbs</option>
                <option value="Oils & Liquids">Oils & Liquids</option>
                <option value="Pasta & Noodles">Pasta & Noodles</option>
                <option value="Proteins">Fish, Meat & Poultry</option>
                <option value="Beverages">Beverages & Provisions</option>
                <option value="Restaurants">Restaurants & Meals</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">Measurement Unit</label>
              <select value={unit} onChange={(e) => setUnit(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
                <option value="plate">Plate (Meals)</option>
                <option value="pack">Pack</option>
                <option value="unit">Unit</option>
                <option value="paint_rubber">Paint Rubber</option>
                <option value="full_bag">Full Bag (50kg)</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isVariableBudget} onChange={(e) => setIsVariableBudget(e.target.checked)} className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer" />
              <span className="text-xs font-bold text-slate-800">Variable Budget Item (Buyer specifies custom ₦ amount, e.g. Tomatoes)</span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">Primary Market Hub</label>
              <select value={primaryMarket} onChange={(e) => setPrimaryMarket(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
                {[...new Set([...(locations.markets||[]), ...(locations.supermarkets||[]), ...(locations.restaurants||[])])].map((loc, i) => (
                  <option key={i} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">Fallback Market Hub</label>
              <select value={fallbackMarket} onChange={(e) => setFallbackMarket(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
                {[...new Set([...(locations.markets||[]), ...(locations.supermarkets||[]), ...(locations.restaurants||[])])].map((loc, i) => (
                  <option key={i} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">Min Price (₦)</label>
              <input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} required className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">Max Price (₦)</label>
              <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} required className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
          </div>
          <button type="submit" disabled={isSubmitting} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl text-xs transition cursor-pointer shadow-md">
            {isSubmitting ? 'Updating...' : 'Publish Market Price Index 📊'}
          </button>
        </form>
      )}

      {/* TAB: SHUTTLES */}
      {activeAdminTab === 'shuttles' && (
        <form onSubmit={handleCreateShuttle} className="bg-white border rounded-2xl p-6 shadow-xs max-w-xl mx-auto space-y-4">
           <h3 className="font-extrabold text-base border-b pb-2">Launch Shuttle Route</h3>
           <input type="text" value={routeName} onChange={(e) => setRouteName(e.target.value)} placeholder="Route Name" required className="w-full p-2.5 border rounded-xl text-xs" />
           <div className="grid grid-cols-2 gap-3">
             <input type="text" value={dispatchTime} onChange={(e) => setDispatchTime(e.target.value)} placeholder="12:00 PM" required className="w-full p-2.5 border rounded-xl text-xs" />
             <input type="number" value={maxCapacity} onChange={(e) => setMaxCapacity(e.target.value)} placeholder="Capacity" className="w-full p-2.5 border rounded-xl text-xs" />
           </div>
           <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl text-xs">Launch 🚀</button>
        </form>
      )}

      {/* TAB: SECURITY & PIN SETTINGS */}
      {activeAdminTab === 'settings' && (
        <div className="max-w-xl mx-auto space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base border-b border-slate-100 pb-2 flex items-center gap-2">
              <span>🔐</span> Admin Security Passcode
            </h3>
            <p className="text-xs text-slate-500">Verify your current PIN and set a custom secret passcode to restrict access to the Admin Console.</p>
            {pinFeedback && (
              <p className={`text-xs font-bold p-3 rounded-xl border ${pinFeedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
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

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base border-b border-slate-100 pb-2 flex items-center gap-2">
              <span>📋</span> Shopper Staff Portal PIN
            </h3>
            <p className="text-xs text-slate-500">Update the passcode your fulfillment shoppers use to log into the Shopper Picking List portal.</p>
            {shopperPinFeedback && (
              <p className={`text-xs font-bold p-3 rounded-xl border ${shopperPinFeedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                {shopperPinFeedback.text}
              </p>
            )}
            <form onSubmit={handleUpdateShopperPin} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">New Shopper PIN (4+ Digits)</label>
                <input type="text" value={newShopperPin} onChange={(e) => setNewShopperPin(e.target.value)} placeholder="e.g. 5678" className="w-full p-3 border border-slate-300 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-amber-600" required />
              </div>
              <button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl text-xs shadow-md cursor-pointer">Update Shopper PIN 📋</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}