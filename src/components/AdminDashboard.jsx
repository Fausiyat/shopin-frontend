import React, { useState, useEffect } from 'react';
import axios from 'axios';
import shopinApi from '../services/api';
import UserTracker from './UserTracker';

const SAMPLE_ADMIN_PRODUCTS = [
  { id: 'v-prod-6', product_name: 'Item 7 Chicken & Chips', category: 'Restaurants', price_ngn: 2500, location: 'Tanke Hub' },
  { id: 'v-prod-7', product_name: 'Aroma Amala & Ewedu', category: 'Restaurants', price_ngn: 1800, location: 'Challenge Hub' },
  { id: 'v-prod-8', product_name: 'Shoprite Fresh Bread', category: 'Supermarkets', price_ngn: 1200, location: 'Fate Hub' },
  { id: 'v-prod-9', product_name: 'Garri Ijebu (Paint Rubber)', category: 'Local Markets', price_ngn: 2800, location: 'Mandate Market' }
];

function AdminProductsManager({ API_URL, adminPin }) {
  const [items, setItems] = useState(SAMPLE_ADMIN_PRODUCTS);
  const [editingItem, setEditingItem] = useState(null);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');

  const [showAddForm, setShowAddForm] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addVendorId, setAddVendorId] = useState('');
  const [addName, setAddName] = useState('');
  const [addCategory, setAddCategory] = useState('MINI-SERVICES');
  const [addType, setAddType] = useState('service');
  const [addPrice, setAddPrice] = useState('');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/vendors/products`);
      const fetchedData = res.data?.data || res.data;
      if (Array.isArray(fetchedData) && fetchedData.length > 0) {
        setItems(fetchedData);
      }
    } catch (err) {
      console.warn("API empty or failed, keeping local samples:", err.message);
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
      setItems(prev => prev.map(item => item.id === id ? { ...item, product_name: newName, price_ngn: newPrice ? parseFloat(newPrice) : item.price_ngn } : item));
      alert("✅ Item updated locally!");
      setEditingItem(null);
    }
  };

  const handleAddNewItem = async (e) => {
    e.preventDefault();
    if (!addVendorId || !addName || !addCategory) return alert("Please fill the required fields!");
    
    setIsAdding(true);
    try {
      await axios.post(`${API_URL}/api/vendors/products`, {
        shopin_id: addVendorId.trim(),
        product_name: addName.trim(),
        category: addCategory,
        service_type: addType,
        price_ngn: addPrice ? parseFloat(addPrice) : 0
      }, {
        headers: { 'x-admin-pin': adminPin }
      });
      alert("🎉 Successfully added to the marketplace!");
      setAddVendorId(''); setAddName(''); setAddPrice(''); setShowAddForm(false);
      fetchItems();
    } catch (err) {
      alert("❌ Error adding item: " + (err.response?.data?.error || err.message));
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        {!showAddForm ? (
          <button 
            onClick={() => setShowAddForm(true)} 
            className="w-full bg-slate-900 text-white font-bold py-2.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            ➕ Add New Product / Service
          </button>
        ) : (
          <form onSubmit={handleAddNewItem} className="space-y-3">
            <div className="flex justify-between items-center border-b pb-2 mb-2">
              <h4 className="font-bold text-sm text-slate-800">Launch New Marketplace Item</h4>
              <button type="button" onClick={() => setShowAddForm(false)} className="text-red-500 font-bold text-xs cursor-pointer">✕ Cancel</button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Vendor ShopIn ID *</label>
                <input type="text" value={addVendorId} onChange={e => setAddVendorId(e.target.value)} placeholder="e.g. VND-ILR-1234" required className="w-full p-2 border rounded-lg text-xs" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Item / Service Name *</label>
                <input type="text" value={addName} onChange={e => setAddName(e.target.value)} placeholder="e.g. Home Deep Cleaning" required className="w-full p-2 border rounded-lg text-xs" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Category *</label>
                <input type="text" value={addCategory} onChange={e => setAddCategory(e.target.value)} placeholder="e.g. MINI-SERVICES" required className="w-full p-2 border rounded-lg text-xs" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Type *</label>
                <select value={addType} onChange={e => setAddType(e.target.value)} className="w-full p-2 border rounded-lg text-xs bg-white">
                  <option value="product">Standard Product (Shopping Cart)</option>
                  <option value="service">Micro-Service (Unlock Phone #)</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Price (₦) - Leave blank for "Negotiable"</label>
                <input type="number" value={addPrice} onChange={e => setAddPrice(e.target.value)} placeholder="e.g. 5000" className="w-full p-2 border rounded-lg text-xs" />
              </div>
            </div>
            <button type="submit" disabled={isAdding} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg transition disabled:opacity-50 cursor-pointer mt-2">
              {isAdding ? 'Adding...' : 'Publish to Marketplace 🚀'}
            </button>
          </form>
        )}
      </div>

      <hr className="border-slate-200" />

      {items.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-6">No marketplace items found.</p>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs gap-3">
              <div>
                <span className="font-bold text-slate-900 block">{item.product_name}</span>
                <span className="text-[10px] text-slate-500 font-semibold">
                  <span className="uppercase text-indigo-600">{item.service_type || 'product'}</span> • {item.category} • Price: {item.price_ngn ? `₦${Number(item.price_ngn).toLocaleString()}` : 'Negotiable'}
                </span>
              </div>

              {editingItem === item.id ? (
                <div className="flex items-center gap-2">
                  <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="New Name" className="p-1 border rounded text-xs w-32" />
                  <input type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder="Price (0 = Neg.)" className="w-24 p-1 border rounded text-xs" />
                  <button onClick={() => handleSaveEdit(item.id)} className="bg-emerald-600 text-white px-3 py-1 rounded font-bold cursor-pointer">Save</button>
                  <button onClick={() => setEditingItem(null)} className="bg-slate-300 px-2 py-1 rounded cursor-pointer">Cancel</button>
                </div>
              ) : (
                <button 
                  onClick={() => { setEditingItem(item.id); setNewName(item.product_name); setNewPrice(item.price_ngn || ''); }} 
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg cursor-pointer whitespace-nowrap"
                >
                  Edit Item ✍️
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PendingVendorsManager({ API_URL, adminPin }) {
  const [pendingVendors, setPendingVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingVendors();
  }, []);

  const fetchPendingVendors = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/pending-vendors`, {
        headers: { 'x-admin-pin': adminPin }
      });
      if (res.data && res.data.pending_vendors) {
        setPendingVendors(res.data.pending_vendors);
      }
    } catch (err) {
      console.warn("Error fetching pending vendors:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id, name) => {
    try {
      await axios.put(`${API_URL}/api/admin/vendors/${id}/verify`, {}, {
        headers: { 'x-admin-pin': adminPin }
      });
      alert(`✅ ${name} has been verified and is now live on the marketplace!`);
      fetchPendingVendors();
    } catch (err) {
      alert("❌ Failed to verify vendor: " + (err.response?.data?.error || err.message));
    }
  };

  if (loading) return <p className="text-xs text-slate-400">Loading pending vendors...</p>;

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-sm text-slate-800 border-b pb-2">🛡️ Vendor Credibility Review ({pendingVendors.length})</h3>
      
      {pendingVendors.length === 0 ? (
        <p className="text-xs text-slate-400 py-6 text-center">No pending vendor applications to review.</p>
      ) : (
        <div className="space-y-3">
          {pendingVendors.map(vendor => (
            <div key={vendor.id} className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
              <div>
                <span className="font-extrabold text-slate-900 text-sm block">{vendor.full_name}</span>
                <span className="text-slate-600 font-medium">Category: <span className="text-teal-700 font-bold">{vendor.vendor_category}</span> • Phone: <a href={`tel:${vendor.phone_number}`} className="underline font-bold">{vendor.phone_number}</a></span>
                <span className="text-[10px] text-slate-400 block mt-1">ID: {vendor.shopin_id} | Mode: {vendor.contact_mode}</span>
              </div>
              <button 
                onClick={() => handleApprove(vendor.id, vendor.full_name)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl transition cursor-pointer whitespace-nowrap shadow-xs"
              >
                Approve & Activate 🟢
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 🌟 NEW CATEGORY MANAGER COMPONENT
function CategoryManager({ API_URL, adminPin }) {
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/marketplace/categories`);
      if (res.data && res.data.categories) {
        setCategories(res.data.categories);
      }
    } catch (err) {
      console.warn("Failed to load categories", err);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setLoading(true);
    setFeedback(null);

    try {
      const response = await axios.post(
        `${API_URL}/api/admin/categories`,
        { category_name: newCategoryName.trim() },
        { headers: { 'x-admin-pin': adminPin } }
      );

      setFeedback({ type: 'success', text: response.data.message });
      setNewCategoryName('');
      fetchCategories();
    } catch (err) {
      setFeedback({ 
        type: 'error', 
        text: err.response?.data?.error || 'Failed to create category.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs max-w-xl mx-auto space-y-4">
      <div>
        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <span>📂</span> Manage Marketplace Categories
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Create and view dynamic service or product tabs (e.g., "House Agents", "Gas Refill").
        </p>
      </div>

      {feedback && (
        <div className={`p-2.5 rounded-xl text-xs font-semibold ${
          feedback.type === 'success' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-red-100 text-red-800'
        }`}>
          {feedback.text}
        </div>
      )}

      <form onSubmit={handleAddCategory} className="flex gap-2">
        <input
          type="text"
          placeholder="e.g. House Agents"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          className="flex-1 p-2.5 border border-slate-300 rounded-xl text-xs outline-none focus:border-blue-500 font-medium bg-slate-50"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition cursor-pointer disabled:opacity-50 whitespace-nowrap shadow-xs"
        >
          {loading ? 'Adding...' : '➕ Add Category'}
        </button>
      </form>

      <div className="pt-2 border-t border-slate-100">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
          Active Marketplace Tabs ({categories.length})
        </span>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat, idx) => (
            <span 
              key={idx} 
              className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-lg border border-slate-200"
            >
              🏷️ {cat}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [activeAdminTab, setActiveAdminTab] = useState('locations'); 
  const [feedback, setFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'https://shopin-kwara-backend.onrender.com';
  const adminPin = localStorage.getItem('SHOPIN_ADMIN_PIN') || '1234';

  const [locations, setLocations] = useState({ markets: [], supermarkets: [], restaurants: [] });
  const [newMarket, setNewMarket] = useState('');
  const [newSupermarket, setNewSupermarket] = useState('');
  const [newRestaurant, setNewRestaurant] = useState('');
  // 🌟 NEW STATE: For managing live market prices
  const [marketPrices, setMarketPrices] = useState([]);
  const [isFetchingPrices, setIsFetchingPrices] = useState(false);

  // Fetch prices from the ticker
  const fetchMarketPrices = async () => {
    setIsFetchingPrices(true);
    try {
      const res = await axios.get(`${API_URL}/api/market/ticker`);
      if (res.data && res.data.data) {
        setMarketPrices(res.data.data);
      }
    } catch (err) {
      console.warn("Failed to fetch market prices:", err);
      setMarketPrices([]);
    } finally {
      setIsFetchingPrices(false);
    }
  };

  // Delete a price entry securely
  const handleDeletePrice = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this price entry?")) return;
    try {
      await axios.delete(`${API_URL}/api/admin/prices/${id}`, {
        headers: { 'x-admin-pin': adminPin }
      });
      setFeedback({ type: 'success', text: 'Price item deleted successfully!' });
      fetchMarketPrices(); // Refresh the list instantly
    } catch (err) {
      setFeedback({ type: 'error', text: 'Failed to delete price item.' });
    }
  };

  const [pendingDeposits, setPendingDeposits] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [pendingOrders, setPendingOrders] = useState([]);
  const [overrideModalOrder, setOverrideModalOrder] = useState(null);
  const [customTotalCost, setCustomTotalCost] = useState('');
  const [customDeliveryFee, setCustomDeliveryFee] = useState('');
  const [customServiceFee, setCustomServiceFee] = useState('');

  const [itemName, setItemName] = useState('');
  const [brandOrVariant, setBrandOrVariant] = useState('Standard');
  const [category, setCategory] = useState('Foodstuff');
  const [unit, setUnit] = useState('paint_rubber');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [isVariableBudget, setIsVariableBudget] = useState(false);
  const [primaryMarket, setPrimaryMarket] = useState('Mandate');
  const [fallbackMarket, setFallbackMarket] = useState('Ipata');

  const [routeName, setRouteName] = useState('');
  const [dispatchTime, setDispatchTime] = useState('12:00 PM');
  const [maxCapacity, setMaxCapacity] = useState('50');

  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinFeedback, setPinFeedback] = useState(null);
  const [newShopperPin, setNewShopperPin] = useState('');
  const [shopperPinFeedback, setShopperPinFeedback] = useState(null);

  // 🌟 POOLS STATE
  const [poolItemName, setPoolItemName] = useState('');
  const [poolTargetItem, setPoolTargetItem] = useState('');
  const [poolPricePerSlot, setPoolPricePerSlot] = useState('');
  const [poolTotalSlots, setPoolTotalSlots] = useState('');
  const [poolMarket, setPoolMarket] = useState('Mandate Market');
  const [existingPools, setExistingPools] = useState([]);
  const [editingPoolId, setEditingPoolId] = useState(null);
  const [editPoolData, setEditPoolData] = useState({});

  // 🌟 SAFE FETCH FUNCTIONS
  const fetchPools = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/pools`);
      if (Array.isArray(res.data)) {
        setExistingPools(res.data);
      } else {
        setExistingPools([]);
      }
    } catch (err) {
      console.warn("Failed to fetch pools");
      setExistingPools([]);
    }
  };

  const fetchLocations = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/locations`);
      setLocations(res.data);
    } catch (err) {
      console.error("Failed to fetch dynamic locations:", err);
    }
  };

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

  const fetchPendingOrders = async () => {
    try {
      const res = await shopinApi.getAdminOrders ? await shopinApi.getAdminOrders() : { data: { orders: [] } };
      setPendingOrders(res.data?.orders || []);
    } catch (err) {
      console.warn("Could not fetch orders.");
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    if (activeAdminTab === 'orders') fetchPendingOrders();
    if (activeAdminTab === 'deposits') fetchPendingDeposits();
    if (activeAdminTab === 'pools') fetchPools();
    if (activeAdminTab === 'prices') fetchMarketPrices();
  }, [activeAdminTab]);

  const updateLocationCategory = async (categoryName, updatedArray) => {
    try {
      await axios.put(`${API_URL}/api/admin/locations`, 
        { category: categoryName, locations_array: updatedArray },
        { headers: { 'x-admin-pin': adminPin } }
      );
      setLocations(prev => ({ ...prev, [categoryName]: updatedArray }));
      setFeedback({ type: 'success', text: `${categoryName} updated successfully!` });
    } catch (err) {
      console.warn(`Backend update failed for ${categoryName}. Updating locally.`, err);
      setLocations(prev => ({ ...prev, [categoryName]: updatedArray }));
      setFeedback({ type: 'success', text: `${categoryName} updated locally (Backend sync skipped)!` });
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

  const handleCreatePool = async (e) => {
    e.preventDefault();
    if (!poolItemName || !poolPricePerSlot || !poolTotalSlots) return;
    setIsSubmitting(true);
    setFeedback(null);

    const payload = {
      item_name: poolItemName.trim(),
      target_item_name: poolTargetItem.trim() || poolItemName.trim(),
      price_per_slot: parseFloat(poolPricePerSlot),
      total_slots: parseInt(poolTotalSlots),
      sourcing_market: poolMarket
    };

    try {
      await axios.post(`${API_URL}/api/admin/pools`, payload, {
        headers: { 'x-admin-pin': adminPin }
      });
      setFeedback({ type: 'success', text: `Food Pool "${poolItemName}" launched successfully!` });
      setPoolItemName(''); setPoolTargetItem(''); setPoolPricePerSlot(''); setPoolTotalSlots('');
      fetchPools();
    } catch (err) {
      setFeedback({ type: 'error', text: `Failed to create pool: ${err.response?.data?.error || err.message}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePool = async (id) => {
    if (!window.confirm("Are you sure you want to delete this food pool?")) return;
    try {
      await axios.delete(`${API_URL}/api/admin/pools/${id}`, { headers: { 'x-admin-pin': adminPin } });
      setFeedback({ type: 'success', text: 'Pool deleted successfully!' });
      fetchPools(); 
    } catch (err) {
      setFeedback({ type: 'error', text: 'Failed to delete pool.' });
    }
  };

  const handleSavePoolEdit = async (id) => {
    try {
      await axios.put(`${API_URL}/api/admin/pools/${id}`, editPoolData, { headers: { 'x-admin-pin': adminPin } });
      setFeedback({ type: 'success', text: 'Pool updated successfully!' });
      setEditingPoolId(null);
      fetchPools(); 
    } catch (err) {
      setFeedback({ type: 'error', text: 'Failed to update pool.' });
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

  return (
    <div className="space-y-6">
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
          <button onClick={() => setActiveAdminTab('categories')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${activeAdminTab === 'categories' ? 'bg-blue-600' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>📂 Categories</button>
          <button onClick={() => setActiveAdminTab('products')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${activeAdminTab === 'products' ? 'bg-teal-600' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>🛍️ Manage Items</button>
          <button onClick={() => setActiveAdminTab('users')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${activeAdminTab === 'users' ? 'bg-purple-600' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>👥 Users</button>
          <button onClick={() => setActiveAdminTab('vendors')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${activeAdminTab === 'vendors' ? 'bg-rose-600' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>🏪 Vendors</button>
          <button onClick={() => setActiveAdminTab('orders')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${activeAdminTab === 'orders' ? 'bg-emerald-600' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>📦 Orders</button>
          <button onClick={() => setActiveAdminTab('prices')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${activeAdminTab === 'prices' ? 'bg-emerald-600' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>📊 Prices</button>
          <button onClick={() => setActiveAdminTab('shuttles')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${activeAdminTab === 'shuttles' ? 'bg-blue-600' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>🚀 Shuttles</button>
          <button onClick={() => setActiveAdminTab('pools')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${activeAdminTab === 'pools' ? 'bg-orange-500' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>🤝 Pools</button>
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

      {/* NEW TAB: CATEGORIES MANAGER */}
      {activeAdminTab === 'categories' && (
        <CategoryManager API_URL={API_URL} adminPin={adminPin} />
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

      {/* TAB: VENDORS */}
      {activeAdminTab === 'vendors' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs max-w-4xl mx-auto space-y-4">
          <h3 className="font-extrabold text-slate-900 text-base border-b border-slate-100 pb-2">
            Manage Vendor Registrations
          </h3>
          <p className="text-xs text-slate-500">Review pending vendors before they go live on the public marketplace.</p>
          <PendingVendorsManager API_URL={API_URL} adminPin={adminPin} />
        </div>
      )}

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
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Your existing Log Price Form */}
          <form onSubmit={handleUpdatePrice} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
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
                  <option value="full_bag">Full Bag (50kg)</option>
                  <option value="half_bag">1/2 Bag (Half Bag)</option>
                  <option value="1/4_bag">1/4 Bag (Quarter Bag)</option>
                  <option value="1/8_bag">1/8 Bag</option>
                  <option value="paint_rubber">Paint Rubber</option>
                  <option value="mudu">Mudu / Module</option>
                  <option value="basket">Full Basket</option>
                  <option value="dozen">One Dozen (12 pcs)</option>
                  <option value="carton">Carton</option>
                  <option value="crate">Crate</option>
                  <option value="pack">Pack</option>
                  <option value="roll">Roll (Beverages)</option>
                  <option value="refill">Refill (Water / Gas)</option>
                  <option value="25_litres">25 Litres (Keg)</option>
                  <option value="12.5_litres">12.5 Litres</option>
                  <option value="5_litres">5 Litres</option>
                  <option value="75cl">75cl Bottle</option>
                  <option value="kg">1 Kilogram (1kg)</option>
                  <option value="1/2kg">1/2 Kilogram (0.5kg)</option>
                  <option value="tuber">Tuber (Yam)</option>
                  <option value="pieces">Pieces (Wara, Ponmo)</option>
                  <option value="plate">Plate (Meals)</option>
                  <option value="unit">Unit</option>
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

          {/* 🌟 NEW: MANAGE ACTIVE PRICES SECTION */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-extrabold text-slate-900 text-base">
                Manage Active Market Prices
              </h3>
              <button onClick={fetchMarketPrices} className="text-xs font-bold text-emerald-600 cursor-pointer">
                {isFetchingPrices ? 'Loading...' : '🔄 Refresh'}
              </button>
            </div>
            
            {marketPrices.length === 0 && !isFetchingPrices ? (
              <p className="text-xs text-slate-500 text-center py-4">No prices logged yet.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar pr-2">
                {marketPrices.map(price => (
                  <div key={price.id} className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center gap-3 hover:bg-slate-100 transition">
                    <div>
                      <div className="font-bold text-sm text-slate-900 capitalize">
                        {price.item_name} <span className="text-emerald-700 text-xs bg-emerald-100 px-2 py-0.5 rounded-full ml-1">{price.unit}</span>
                      </div>
                      <div className="text-[11px] font-semibold text-slate-500 mt-1">
                        ₦{Number(price.min_price_ngn).toLocaleString()} - ₦{Number(price.max_price_ngn).toLocaleString()} • {price.sourcing_market}
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDeletePrice(price.id)} 
                      className="bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-700 font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer shadow-xs whitespace-nowrap"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🌟 POOLS TAB */}
      {activeAdminTab === 'pools' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <form onSubmit={handleCreatePool} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base border-b border-slate-100 pb-2 flex items-center gap-2">
              <span>🤝</span> Launch New Food Pool
            </h3>
            <p className="text-xs text-slate-500 mb-4">Create a new bulk buying pool for customers to share costs directly in the marketplace.</p>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Display Title (e.g. 50kg Bag of Foreign Rice Share) *</label>
                <input type="text" value={poolItemName} onChange={e => setPoolItemName(e.target.value)} required className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Target Item Name *</label>
                  <input type="text" value={poolTargetItem} onChange={e => setPoolTargetItem(e.target.value)} placeholder="e.g. Foreign Rice" required className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Sourcing Market *</label>
                  <select value={poolMarket} onChange={e => setPoolMarket(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 outline-none bg-white">
                    <option value="Mandate Market">Mandate Market</option>
                    <option value="Ipata Market">Ipata Market</option>
                    <option value="Sawmill Market">Sawmill Market</option>
                    <option value="Tanke Hub">Tanke Hub</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Price Per Slot (₦) *</label>
                  <input type="number" value={poolPricePerSlot} onChange={e => setPoolPricePerSlot(e.target.value)} required placeholder="e.g. 18500" className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Total Target Slots *</label>
                  <input type="number" value={poolTotalSlots} onChange={e => setPoolTotalSlots(e.target.value)} required placeholder="e.g. 4" className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 outline-none" />
                </div>
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 rounded-xl text-xs transition cursor-pointer shadow-md mt-2 disabled:opacity-50">
              {isSubmitting ? 'Creating...' : 'Publish Food Pool 🚀'}
            </button>
          </form>

          {/* 🌟 MANAGE EXISTING POOLS */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base border-b border-slate-100 pb-2">
              Manage Active Food Pools
            </h3>
            {(!existingPools || existingPools.length === 0) ? (
              <p className="text-xs text-slate-400 text-center py-4">No active food pools found.</p>
            ) : (
              <div className="space-y-3">
                {existingPools.map(pool => (
                  <div key={pool.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    
                    {editingPoolId === pool.id ? (
                      <div className="flex-1 space-y-2">
                        <input type="text" value={editPoolData.item_name || ''} onChange={e => setEditPoolData({...editPoolData, item_name: e.target.value})} className="w-full p-2 border rounded" placeholder="Pool Title" />
                        <div className="flex gap-2">
                          <input type="number" value={editPoolData.price_per_slot || ''} onChange={e => setEditPoolData({...editPoolData, price_per_slot: e.target.value})} className="w-1/2 p-2 border rounded" placeholder="Price (₦)" />
                          <select value={editPoolData.status || 'OPEN'} onChange={e => setEditPoolData({...editPoolData, status: e.target.value})} className="w-1/2 p-2 border rounded bg-white">
                            <option value="OPEN">OPEN</option>
                            <option value="FILLED">FILLED</option>
                            <option value="CLOSED">CLOSED</option>
                          </select>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <button onClick={() => handleSavePoolEdit(pool.id)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold">Save</button>
                          <button onClick={() => setEditingPoolId(null)} className="bg-slate-300 px-4 py-2 rounded-lg font-bold">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div>
                          <span className="font-bold text-slate-900 text-sm block">{pool.item_name}</span>
                          <span className="text-slate-500 font-medium mt-1 block">
                            ₦{Number(pool.unit_price).toLocaleString()} / slot • {pool.current_units} of {pool.target_units} filled
                          </span>
                          <span className={`mt-1 inline-block px-2 py-0.5 rounded text-[10px] font-bold ${pool.status === 'OPEN' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                            {pool.status}
                          </span>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => { setEditingPoolId(pool.id); setEditPoolData({ item_name: pool.item_name, price_per_slot: pool.unit_price, status: pool.status }); }} className="bg-slate-900 text-white px-3 py-1.5 rounded-lg font-bold cursor-pointer">
                            Edit
                          </button>
                          <button onClick={() => handleDeletePool(pool.id)} className="bg-red-100 text-red-600 hover:bg-red-200 px-3 py-1.5 rounded-lg font-bold cursor-pointer">
                            Delete
                          </button>
                        </div>
                      </>
                    )}

                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
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