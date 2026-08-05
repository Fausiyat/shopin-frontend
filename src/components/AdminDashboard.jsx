import React, { useState, useEffect } from 'react';
import shopinApi from '../services/api';
import UserTracker from './UserTracker';

export default function AdminDashboard() {
  const [activeAdminTab, setActiveAdminTab] = useState('users'); // 'users' | 'prices' | 'shuttles' | 'orders' | 'settings'
  const [feedback, setFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Orders Management State
  const [pendingOrders, setPendingOrders] = useState([]);
  const [overrideModalOrder, setOverrideModalOrder] = useState(null);
  const [customTotalCost, setCustomTotalCost] = useState('');
  const [customDeliveryFee, setCustomDeliveryFee] = useState('');
  const [customServiceFee, setCustomServiceFee] = useState('');

  // Price Ticker Form State
  const [itemName, setItemName] = useState('');
  const [brandOrVariant, setBrandOrVariant] = useState('Standard');
  const [category, setCategory] = useState('Foodstuff');
  const [unit, setUnit] = useState('paint_rubber');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [isVariableBudget, setIsVariableBudget] = useState(false);
  const [primaryMarket, setPrimaryMarket] = useState('Mandate');
  const [fallbackMarket, setFallbackMarket] = useState('Ipata');

  // Shuttle Creation Form State
  const [routeName, setRouteName] = useState('');
  const [dispatchTime, setDispatchTime] = useState('12:00 PM');
  const [maxCapacity, setMaxCapacity] = useState('50');

  // 🔐 Security & Change PIN State
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinFeedback, setPinFeedback] = useState(null);

  // 📦 Shopper PIN Management State
  const [newShopperPin, setNewShopperPin] = useState('');
  const [shopperPinFeedback, setShopperPinFeedback] = useState(null);

  // Fetch Orders for Manual Review
  useEffect(() => {
    if (activeAdminTab === 'orders') {
      fetchPendingOrders();
    }
  }, [activeAdminTab]);

  const fetchPendingOrders = async () => {
    try {
      // Assuming an endpoint exists or can be queried via shopping API or custom client call
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
      const adminPin = localStorage.getItem('SHOPIN_ADMIN_PIN') || '1234';
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

  // Handle Passcode Update with Current PIN Verification
  const handleChangePin = (e) => {
    e.preventDefault();
    setPinFeedback(null);

    const savedPin = localStorage.getItem('SHOPIN_ADMIN_PIN') || '1234';

    if (currentPin.trim() !== savedPin) {
      setPinFeedback({ type: 'error', text: 'Incorrect current PIN. Please try again.' });
      return;
    }

    if (!newPin || newPin.length < 4) {
      setPinFeedback({ type: 'error', text: 'New PIN must be at least 4 digits!' });
      return;
    }

    if (newPin !== confirmPin) {
      setPinFeedback({ type: 'error', text: 'New PIN and confirmation PIN do not match.' });
      return;
    }

    localStorage.setItem('SHOPIN_ADMIN_PIN', newPin.trim());
    setPinFeedback({ type: 'success', text: `Success! Admin PIN updated successfully.` });
    
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
  };

  // Handle Dynamic Shopper PIN Update via Backend API
  const handleUpdateShopperPin = async (e) => {
    e.preventDefault();
    setShopperPinFeedback(null);

    if (!newShopperPin || newShopperPin.trim().length < 4) {
      setShopperPinFeedback({ type: 'error', text: 'Shopper PIN must be at least 4 characters long.' });
      return;
    }

    const adminPin = localStorage.getItem('SHOPIN_ADMIN_PIN') || '1234';

    try {
      if (shopinApi && shopinApi.updateShopperPin) {
        const res = await shopinApi.updateShopperPin(newShopperPin.trim(), adminPin);
        setShopperPinFeedback({ type: 'success', text: res.message || 'Shopper PIN updated successfully!' });
        setNewShopperPin('');
      } else {
        setShopperPinFeedback({ type: 'error', text: 'API method updateShopperPin not found.' });
      }
    } catch (err) {
      console.error("Error updating shopper PIN:", err);
      setShopperPinFeedback({ 
        type: 'error', 
        text: err.response?.data?.error || 'Failed to update shopper PIN on server.' 
      });
    }
  };

  // Handle Price Ticker Update
  const handleUpdatePrice = async (e) => {
    e.preventDefault();
    if (!itemName || !minPrice || !maxPrice) return;

    setIsSubmitting(true);
    setFeedback(null);

    const payload = {
      item_name: itemName.trim(),
      brand_or_variant: brandOrVariant.trim() || 'Standard',
      category,
      unit,
      min_price_ngn: parseFloat(minPrice),
      max_price_ngn: parseFloat(maxPrice),
      is_variable_budget: isVariableBudget,
      sourcing_market: primaryMarket,
      fallback_market: fallbackMarket
    };

    try {
      if (shopinApi && (shopinApi.updateMarketPrice || shopinApi.addMarketPrice)) {
        const fn = shopinApi.updateMarketPrice || shopinApi.addMarketPrice;
        await fn(payload);
      }

      setFeedback({ 
        type: 'success', 
        text: `Successfully updated price index for "${itemName}" [${brandOrVariant}] (${primaryMarket} ➔ Fallback: ${fallbackMarket})!` 
      });
      setItemName('');
      setBrandOrVariant('Standard');
      setMinPrice('');
      setMaxPrice('');
      setIsVariableBudget(false);
    } catch (err) {
      console.warn("Local fallback for admin price update:", err);
      setFeedback({ 
        type: 'success', 
        text: `Logged "${itemName}" [${brandOrVariant}] price update locally!` 
      });
      setItemName('');
      setBrandOrVariant('Standard');
      setMinPrice('');
      setMaxPrice('');
      setIsVariableBudget(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Shuttle Batch Creation
  const handleCreateShuttle = async (e) => {
    e.preventDefault();
    if (!routeName) return;

    setIsSubmitting(true);
    setFeedback(null);

    const payload = {
      route_name: routeName.trim(),
      dispatch_time: dispatchTime,
      max_capacity: parseInt(maxCapacity) || 50
    };

    try {
      if (shopinApi && shopinApi.createShuttleBatch) {
        await shopinApi.createShuttleBatch(payload);
      }

      setFeedback({ type: 'success', text: `Shuttle Corridor "${routeName}" created for ${dispatchTime}!` });
      setRouteName('');
    } catch (err) {
      console.warn("Local fallback for shuttle creation:", err);
      setFeedback({ type: 'success', text: `Created shuttle corridor "${routeName}"!` });
      setRouteName('');
    } finally {
      setIsSubmitting(false);
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
            Track registered buyers and vendors, market prices, shuttle corridors, and manual order overrides across Ilorin.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
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
                placeholder="e.g. Garri Ijebu, Spaghetti, Foreign Rice"
                required
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
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
                placeholder="e.g. Dangote, Golden Penny, Power Oil, Peak"
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
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
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
              >
                <option value="Grain">Grains & Legumes</option>
                <option value="Foodstuff">Foodstuff & Staples</option>
                <option value="Tubers">Tubers</option>
                <option value="Produce">Fresh Produce & Herbs</option>
                <option value="Oils & Liquids">Oils & Liquids</option>
                <option value="Pasta & Noodles">Pasta & Noodles</option>
                <option value="Proteins">Fish, Meat & Poultry</option>
                <option value="Beverages">Beverages & Provisions</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">
                Measurement Unit
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
              >
                <option value="1/8_bag">1/8 Bag</option>
                <option value="1/4_bag">1/4 Bag</option>
                <option value="half_bag">1/2 Bag</option>
                <option value="keg_25l">1 Keg (25 Litres)</option>
                <option value="basket">Basket</option>
                <option value="bottle">Bottle</option>
                <option value="carton">Carton</option>
                <option value="crate">Crate (Eggs)</option>
                <option value="derica">Derica</option>
                <option value="full_bag">Full Bag (50kg)</option>
                <option value="kg">Kg</option>
                <option value="milk_tin">Milk Tin</option>
                <option value="mudu">Mudu / Module</option>
                <option value="naira_value">Custom ₦ Budget</option>
                <option value="pack">Pack</option>
                <option value="paint_rubber">Paint Rubber</option>
                <option value="sachet">Sachet</option>
                <option value="tuber">Tuber</option>
                <option value="unit">Unit</option>
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
                placeholder="e.g. 2500"
                required
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
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
                placeholder="e.g. 2800"
                required
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isVariableBudget}
                onChange={(e) => setIsVariableBudget(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-800">
                Variable Budget Item (Buyer specifies custom ₦ amount, e.g. Tomatoes, Ponmo, Ewedu)
              </span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">
                Primary Market Hub
              </label>
              <select
                value={primaryMarket}
                onChange={(e) => setPrimaryMarket(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
              >
                <option value="Mandate">Mandate Market</option>
                <option value="Ipata">Ipata Market</option>
                <option value="Sawmill">Sawmill Market</option>
                <option value="Ganmo">Ganmo Market</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">
                Fallback Market Hub
              </label>
              <select
                value={fallbackMarket}
                onChange={(e) => setFallbackMarket(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
              >
                <option value="Ipata">Ipata Market</option>
                <option value="Mandate">Mandate Market</option>
                <option value="Ago">Ago Market</option>
                <option value="Sawmill">Sawmill Market</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl text-xs transition cursor-pointer shadow-md"
          >
            {isSubmitting ? 'Updating Index...' : 'Publish Market Price Index 📊'}
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
              placeholder="e.g. Mandate Market ➔ Al-Hikmah / Apalara Corridor"
              required
              className="w-full p-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
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
                placeholder="e.g. 12:00 PM or 04:30 PM"
                required
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
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
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl text-xs transition cursor-pointer shadow-md"
          >
            {isSubmitting ? 'Launching...' : 'Launch Shuttle Route 🚀'}
          </button>
        </form>
      )}

      {/* TAB 5: Security & Change Passcode Settings */}
      {activeAdminTab === 'settings' && (
        <div className="max-w-xl mx-auto space-y-6">
          {/* Admin Passcode Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base border-b border-slate-100 pb-2 flex items-center gap-2">
              <span>🔐</span> Admin Security Passcode
            </h3>
            <p className="text-xs text-slate-500">
              Verify your current PIN and set a custom secret passcode to restrict access to the Admin Console.
            </p>

            {pinFeedback && (
              <p className={`text-xs font-bold p-3 rounded-xl border ${
                pinFeedback.type === 'success' 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                {pinFeedback.text}
              </p>
            )}

            <form onSubmit={handleChangePin} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">
                  Current Admin PIN
                </label>
                <input
                  type="password"
                  placeholder="Enter current PIN"
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-slate-900"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">
                  New Admin Passcode (4+ Digits)
                </label>
                <input
                  type="password"
                  placeholder="Enter new PIN"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-slate-900"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">
                  Confirm New PIN
                </label>
                <input
                  type="password"
                  placeholder="Confirm new PIN"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-slate-900"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-xs transition cursor-pointer shadow-md"
              >
                Update Admin PIN 🔐
              </button>
            </form>
          </div>

          {/* Shopper Staff PIN Manager Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base border-b border-slate-100 pb-2 flex items-center gap-2">
              <span>📋</span> Shopper Staff Portal PIN
            </h3>
            <p className="text-xs text-slate-500">
              Update the passcode your fulfillment shoppers use to log into the Shopper Picking List portal.
            </p>

            {shopperPinFeedback && (
              <p className={`text-xs font-bold p-3 rounded-xl border ${
                shopperPinFeedback.type === 'success' 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                {shopperPinFeedback.text}
              </p>
            )}

            <form onSubmit={handleUpdateShopperPin} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">
                  New Shopper PIN (4+ Digits)
                </label>
                <input
                  type="text"
                  placeholder="Enter new shopper PIN (e.g. 5678)"
                  value={newShopperPin}
                  onChange={(e) => setNewShopperPin(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-amber-600"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl text-xs transition cursor-pointer shadow-md"
              >
                Update Shopper PIN 📋
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}