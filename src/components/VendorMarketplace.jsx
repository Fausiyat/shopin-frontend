import React, { useState, useEffect } from 'react';
import axios from 'axios';
import shopinApi from '../services/api';

// 🌟 NEW: Define all your Service categories in one place!
const SERVICE_CATEGORIES = [
  'AB&S Services', 
  'Mini-Services', 
  'Artisans & Repairs', 
  'Beauty & Salons', 
  'Home Tutors', 
  'Event Planning',
  'Muaz-O-Botanicals'
];

const getSampleProducts = () => [
  {
    id: 'v-prod-1', product_name: 'AB&S Move-In / Move-Out Deep Cleaning', category: 'AB&S Services',
    price_ngn: null, stock_quantity: 1, is_verified: true, vendor_id: 'SHP-ILR-8812',
    vendor_name: 'AB&S Cleaning Services', phone_number: '08059876543', location: 'Ilorin Central Hub',
    contact_mode: 'DIRECT', is_pickup_available: false, service_type: 'service', rating: 4.9, review_count: 1
  },
  {
    id: 'v-prod-2', product_name: 'Pepper Blending & Food Processing', category: 'Mini-Services',
    price_ngn: null, stock_quantity: 1, is_verified: true, vendor_id: 'SHP-ILR-3044',
    vendor_name: 'Mama Alhaja Pepper Grinding', phone_number: '08031234567', location: 'Mandate Market',
    contact_mode: 'DIRECT', is_pickup_available: true, service_type: 'service'
  },
  {
    id: 'v-prod-3', product_name: 'Plumbing & Pipe Fixing', category: 'Artisans & Repairs',
    price_ngn: 5000, stock_quantity: 1, is_verified: true, vendor_id: 'SHP-ILR-9921',
    vendor_name: 'Baba Wale Plumber', phone_number: '08123456789', location: 'Tanke Hub',
    contact_mode: 'DIRECT', is_pickup_available: false, service_type: 'service'
  },
  {
    id: 'v-prod-6', product_name: 'Jollof Rice & Chicken', category: 'Restaurants',
    price_ngn: 2500, stock_quantity: 50, image_url: 'images/jollof.JPG', is_verified: true, vendor_id: 'VND-ILR-REST',
    vendor_name: 'Multiple Restaurants', location: 'Ilorin City', contact_mode: 'MIDDLEMAN', is_pickup_available: true
  },
  {
    id: 'v-prod-8', product_name: 'Shoprite Fresh Bread', category: 'Supermarkets',
    price_ngn: 1200, stock_quantity: 20, image_url: 'images/bread.JPG', is_verified: true, vendor_id: 'VND-ILR-MALL',
    vendor_name: 'Shoprite Kwara Mall', location: 'Fate Hub', contact_mode: 'MIDDLEMAN', is_pickup_available: true
  },
  {
    id: 'v-prod-9', product_name: 'Garri Ijebu (Paint Rubber)', category: 'Local Markets',
    price_ngn: 2800, stock_quantity: 500, image_url: 'images/garripaint.JPG', is_verified: true, vendor_id: 'VND-ILR-MANDATE',
    vendor_name: 'Iya Elelubo', location: 'Mandate Market', contact_mode: 'MIDDLEMAN', is_pickup_available: true
  }
];

export default function VendorMarketplace({ marketFilter, searchTerm, onAddToCart, openCheckout }) {
  
  const [unlockedPhones, setUnlockedPhones] = useState({});
  
  const handleUnlockContact = (vendorProd) => {
    setUnlockedPhones(prev => ({ 
      ...prev, 
      [vendorProd.id]: vendorProd.phone_number 
    }));
  };

  const [activeSubTab, setActiveSubTab] = useState('browse'); 
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState(getSampleProducts());
  const [feedback, setFeedback] = useState(null);

  const [locations, setLocations] = useState({ restaurants: ['Item 7', 'Aroma', 'Food 101', 'Captain Cook', 'K-Bakes'] });
  const [selectedRestaurants, setSelectedRestaurants] = useState({});

  const API_URL = import.meta.env.VITE_API_URL || 'https://shopin-kwara-backend.onrender.com';

  const [regFullName, setRegFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regCategory, setRegCategory] = useState('Wearables');
  const [regContactMode, setRegContactMode] = useState('MIDDLEMAN'); 

  const [vendorShopinId, setVendorShopinId] = useState('VND-ILR-1001');
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('Wearables');
  const [priceNgn, setPriceNgn] = useState('');
  const [stockQty, setStockQty] = useState('10');
  const [locationHub, setLocationHub] = useState('Ilorin Central Hub');
  const [imageUrl, setImageUrl] = useState(''); 
  const [allowDirectContact, setAllowDirectContact] = useState(false);
  const [isPickupAvailable, setIsPickupAvailable] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (marketFilter === 'MARKETS') setSelectedCategory('Local Markets');
    if (marketFilter === 'SUPERMARKETS') setSelectedCategory('Supermarkets');
    if (marketFilter === 'RESTAURANTS') setSelectedCategory('Restaurants');
    if (marketFilter === 'ALL') setSelectedCategory('All');
  }, [marketFilter]);

  useEffect(() => {
    const fetchDynamicLocations = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/locations`);
        if (res.data && res.data.restaurants) {
          setLocations(res.data);
        }
      } catch (err) {
        console.warn("Could not fetch locations, using fallbacks.");
      }
    };
    fetchDynamicLocations();
  }, [API_URL]);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        if (shopinApi && shopinApi.getVendorProducts) {
          const response = await shopinApi.getVendorProducts();
          if (response.data && response.data.data && response.data.data.length > 0) {
            setProducts(response.data.data);
          }
        }
      } catch (err) {
        console.warn("Using sample catalog products due to fetch error:", err.message);
      }
    };
    fetchCatalog();
  }, []);

  const handleRegisterVendor = async (e) => {
    e.preventDefault();
    if (!regFullName || !regPhone) return;
    setIsSubmitting(true);
    setFeedback(null);

    const payload = { full_name: regFullName.trim(), phone_number: regPhone.trim(), email: regEmail.trim() || null, vendor_category: regCategory, contact_mode: regContactMode };

    try {
      const res = await shopinApi.registerVendor(payload);
      setVendorShopinId(res.data.vendor_data?.shopin_id || `VND-ILR-${Math.floor(1000 + Math.random() * 9000)}`);
      setFeedback({ type: 'success', text: `Vendor Registration Successful!` });
      setActiveSubTab('list_product');
    } catch (err) {
      setVendorShopinId(`VND-ILR-${Math.floor(1000 + Math.random() * 9000)}`);
      setFeedback({ type: 'success', text: `Vendor registered locally!` });
      setActiveSubTab('list_product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleListProduct = async (e) => {
    e.preventDefault();
    if (!productName) return;

    setIsSubmitting(true);
    setFeedback(null);

    // 🌟 SMART CHECK: If the selected category is in our Service list, treat it as a service!
    const isServiceCategory = SERVICE_CATEGORIES.includes(category);

    const payload = {
      shopin_id: vendorShopinId.trim(), product_name: productName.trim(), category: category,
      price_ngn: priceNgn ? parseFloat(priceNgn) : null, stock_quantity: parseInt(stockQty) || 1,
      image_url: imageUrl.trim() || null, location: locationHub, service_type: isServiceCategory ? 'service' : 'product',
      allow_direct_contact: allowDirectContact || isServiceCategory, is_pickup_available: isPickupAvailable
    };

    try {
      const res = await shopinApi.addVendorProduct(payload);
      setProducts(prev => [res.data.product, ...prev]);
      setFeedback({ type: 'success', text: `Success! "${productName}" is now live!` });
      resetListingForm();
    } catch (err) {
      const fallbackProd = { ...payload, id: `v-prod-${Date.now()}`, is_verified: true, contact_mode: (allowDirectContact || isServiceCategory) ? 'DIRECT' : 'MIDDLEMAN' };
      setProducts(prev => [fallbackProd, ...prev]);
      setFeedback({ type: 'success', text: `Listed "${productName}" successfully!` });
      resetListingForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetListingForm = () => {
    setProductName(''); setPriceNgn(''); setImageUrl(''); setActiveSubTab('browse');
  };

  const handleBuyWithEscrow = (prod, isPickup = false) => {
    const chosenRestaurant = prod.category === 'Restaurants' 
      ? (selectedRestaurants[prod.id] || locations.restaurants[0] || 'Selected Restaurant')
      : prod.vendor_name;
      
    const finalName = prod.category === 'Restaurants' 
      ? `${prod.product_name} (from ${chosenRestaurant})` 
      : prod.product_name;

    const cartItem = {
      id: prod.id + (prod.category === 'Restaurants' ? `-${chosenRestaurant}` : ''),
      name: finalName, 
      item_name: finalName, 
      price: Number(prod.price_ngn),
      quantity: 1, 
      category: prod.category, 
      image_url: prod.image_url, 
      isEscrowItem: true, 
      vendorId: prod.vendor_id,
      vendor_name: chosenRestaurant,
      is_pickup_only: isPickup, 
      vendor_fee: 200 
    };
    if (onAddToCart) onAddToCart([cartItem]);
    if (openCheckout) openCheckout();
  };

  // 🌟 DYNAMIC FILTER TABS: Combines shopping categories with our new Service categories
  const filterTabs = ['All', 'Local Markets', 'Supermarkets', 'Restaurants', 'Foodstuff', 'Wearables', 'Electronics', ...SERVICE_CATEGORIES, 'Provisions'];

 const filteredProducts = products.filter(prod => {
    // 🌟 Normalizes both strings (lowercases them and removes spaces/hyphens) so they always match
    const normalize = (str) => (str || '').replace(/[\s-]/g, '').toLowerCase();
    
    const matchesCategory = selectedCategory === 'All' || 
      normalize(prod.category) === normalize(selectedCategory);

    // 🌟 UPGRADE: Use the Home Search (searchTerm) OR the Marketplace Search (searchQuery)
    const activeSearch = searchQuery || searchTerm || '';
    
    const matchesSearch = activeSearch === '' ||
                          prod.product_name.toLowerCase().includes(activeSearch.toLowerCase()) ||
                          prod.category.toLowerCase().includes(activeSearch.toLowerCase()) ||
                          (prod.vendor_name && prod.vendor_name.toLowerCase().includes(activeSearch.toLowerCase())) ||
                          (prod.location && prod.location.toLowerCase().includes(activeSearch.toLowerCase()));
                          
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-teal-800 to-emerald-900 p-5 rounded-2xl text-white shadow-md">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div>
            <h2 className="text-lg font-extrabold flex items-center gap-2">
              <span>🏪</span> ShopIn Vendor Marketplace
            </h2>
            <p className="text-xs text-teal-100 mt-1">Buy from Local Markets, Supermarkets, Restaurants, or book Services.</p>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setActiveSubTab('browse')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${activeSubTab === 'browse' ? 'bg-white text-teal-900 shadow-xs' : 'bg-teal-900/50 text-teal-100 hover:bg-teal-900/80'}`}>🛒 Browse</button>
            <button onClick={() => setActiveSubTab('register_vendor')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${activeSubTab === 'register_vendor' ? 'bg-white text-teal-900 shadow-xs' : 'bg-teal-900/50 text-teal-100 hover:bg-teal-900/80'}`}>📝 Register Vendor</button>
            <button onClick={() => setActiveSubTab('list_product')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${activeSubTab === 'list_product' ? 'bg-white text-teal-900 shadow-xs' : 'bg-teal-900/50 text-teal-100 hover:bg-teal-900/80'}`}>➕ List Item</button>
          </div>
        </div>
      </div>

      {feedback && (
        <div className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between ${feedback.type === 'success' ? 'bg-emerald-100 text-emerald-900 border border-emerald-200' : 'bg-red-100 text-red-900'}`}>
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="font-bold cursor-pointer">✕</button>
        </div>
      )}

      {/* SUB-TAB 1: Browse Marketplace */}
      {activeSubTab === 'browse' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <input type="text" placeholder="Search markets, restaurants, artisans..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full sm:w-64 p-2.5 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500 bg-white" />

            <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto text-xs pb-1 custom-scrollbar">
              {filterTabs.map((cat) => (
                <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium cursor-pointer transition ${selectedCategory === cat ? 'bg-teal-700 text-white font-bold shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((prod) => (
                <div key={prod.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-3">
                  <div>
                    {prod.image_url && (
                      <div className="w-full h-32 bg-slate-100 rounded-xl mb-3 overflow-hidden">
                        <img src={prod.image_url} alt={prod.product_name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    
                    <div className="flex justify-between items-start mb-1.5 gap-2">
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded ${
                        prod.category === 'Restaurants' ? 'bg-amber-100 text-amber-800' :
                        prod.category === 'Supermarkets' ? 'bg-blue-100 text-blue-800' :
                        SERVICE_CATEGORIES.includes(prod.category) ? 'bg-purple-100 text-purple-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {prod.category}
                      </span>
                     {prod.contact_mode === 'DIRECT' || prod.service_type === 'service' || SERVICE_CATEGORIES.some(c => c.toLowerCase() === (prod.category || '').toLowerCase()) ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full flex items-center gap-1">📞 Direct Phone</span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full flex items-center gap-1">🛡️ Escrow (₦200)</span>
                      )}
                    </div>

                    <h3 className="font-bold text-slate-900 text-base leading-snug">{prod.product_name}</h3>

                    {/* ⭐ DYNAMIC RATING SYSTEM */}
                    <div className="flex items-center gap-1 mt-1 mb-1">
                      {prod.rating > 0 ? (
                        <>
                          <div className="flex text-amber-500 text-[10px]">
                            {'⭐'.repeat(Math.round(prod.rating))}
                          </div>
                          <span className="text-[10px] text-slate-500 font-bold ml-1">
                            {prod.rating} <span className="font-normal">({prod.review_count} reviews)</span>
                          </span>
                        </>
                      ) : (
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
                          🌟 New Vendor
                        </span>
                      )}
                    </div>
                    
                    {prod.category === 'Restaurants' ? (
                      <div className="mt-2 mb-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Select Restaurant:</label>
                        <select
                          value={selectedRestaurants[prod.id] || locations.restaurants[0] || 'Item 7'}
                          onChange={(e) => setSelectedRestaurants({ ...selectedRestaurants, [prod.id]: e.target.value })}
                          className="w-full mt-1 p-1.5 border border-amber-200 rounded-lg text-xs bg-amber-50 text-amber-900 font-bold outline-none"
                        >
                          {locations.restaurants.map((r, i) => <option key={i} value={r}>{r}</option>)}
                        </select>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs text-slate-500 mt-1 font-medium flex items-center gap-1"><span>📍</span> {prod.location || 'Ilorin Hub'}</p>
                        {prod.vendor_name && <p className="text-[10px] font-bold text-teal-700 mt-1">Vendor: {prod.vendor_name}</p>}
                      </>
                    )}
                  </div>

                  {/* 🌟 SMART BUTTON RENDERER: If it's in our Service Categories list, show the purple button! */}
                  {SERVICE_CATEGORIES.includes(prod.category) || prod.contact_mode === 'DIRECT' || prod.service_type === 'service' ? (
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <div className="text-xs text-slate-600">
                        Price: <span className="font-bold text-purple-900">
                          {prod.price_ngn ? `₦${Number(prod.price_ngn).toLocaleString()}` : 'Negotiable'}
                        </span>
                      </div>
                      
                      {unlockedPhones[prod.id] ? (
                        <div className="bg-emerald-100 text-emerald-900 font-bold p-3 rounded-xl text-center border border-emerald-300 shadow-sm animate-pulse">
                          <a href={`tel:${unlockedPhones[prod.id]}`} className="font-extrabold text-lg block text-emerald-800 hover:text-emerald-600">
                            📞 {unlockedPhones[prod.id]}
                          </a>
                          <p className="text-[10px] text-emerald-700 font-normal mt-1">Click number to call directly!</p>
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleUnlockContact(prod)}
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
                        >
                          📞 Unlock Phone Number (Free)
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="pt-3 border-t border-slate-100 flex flex-col space-y-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">Est. Price</span>
                          <span className="text-lg font-extrabold text-emerald-700">₦{Number(prod.price_ngn).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="pt-1">
                        <button onClick={() => handleBuyWithEscrow(prod, false)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[12px] py-2.5 rounded-xl text-center cursor-pointer shadow-sm">
                          🚚 Add to Cart
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-slate-400 text-sm">
                No items found matching "{searchQuery}".
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: Vendor Registration Form */}
      {activeSubTab === 'register_vendor' && (
        <form onSubmit={handleRegisterVendor} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs max-w-lg mx-auto space-y-4">
          <h3 className="font-extrabold text-slate-900 text-base border-b border-slate-100 pb-2">Register as a ShopIn Verified Vendor</h3>
          <div><label className="text-xs font-semibold text-slate-600 block mb-1">Full Name / Business Name</label><input type="text" value={regFullName} onChange={(e) => setRegFullName(e.target.value)} required className="w-full p-2.5 border rounded-xl text-xs" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-semibold text-slate-600 block mb-1">Phone Number</label><input type="tel" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} required className="w-full p-2.5 border rounded-xl text-xs" /></div>
            <div><label className="text-xs font-semibold text-slate-600 block mb-1">Email (Optional)</label><input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} className="w-full p-2.5 border rounded-xl text-xs" /></div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Vendor Category</label>
            <select value={regCategory} onChange={(e) => setRegCategory(e.target.value)} className="w-full p-2.5 border rounded-xl text-xs bg-white font-medium">
              <option value="Restaurants">Restaurants & Bukas</option>
              <option value="Supermarkets">Supermarkets</option>
              <option value="Local Markets">Local Markets</option>
              <option value="Wearables">Wearables</option>
              <option value="Electronics">Electronics</option>
              {/* 🌟 Automatically populate dropdown with all our Service Categories! */}
              {SERVICE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <button type="submit" disabled={isSubmitting} className="w-full bg-teal-700 text-white font-bold py-3.5 rounded-xl text-xs">Register as Vendor ➔</button>
        </form>
      )}

      {/* SUB-TAB 3: List Product Form */}
      {activeSubTab === 'list_product' && (
        <form onSubmit={handleListProduct} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs max-w-lg mx-auto space-y-4">
          <h3 className="font-extrabold text-slate-900 text-base border-b border-slate-100 pb-2">List Item or Service</h3>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-semibold text-slate-600 block mb-1">Vendor ShopIn ID</label><input type="text" value={vendorShopinId} onChange={(e) => setVendorShopinId(e.target.value)} required className="w-full p-2.5 border rounded-xl text-xs font-bold" /></div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-2.5 border rounded-xl text-xs bg-white font-medium">
                <option value="Restaurants">Restaurants & Meals</option>
                <option value="Supermarkets">Supermarket Items</option>
                <option value="Local Markets">Local Market Goods</option>
                <option value="Wearables">Wearables</option>
                <option value="Electronics">Electronics</option>
                {/* 🌟 Automatically populate dropdown with all our Service Categories! */}
                {SERVICE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          </div>
          <div><label className="text-xs font-semibold text-slate-600 block mb-1">Item / Service Name</label><input type="text" value={productName} onChange={(e) => setProductName(e.target.value)} required className="w-full p-2.5 border rounded-xl text-xs" /></div>
          <div><label className="text-xs font-semibold text-slate-600 block mb-1">Image URL (Optional)</label><input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="w-full p-2.5 border rounded-xl text-xs" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-semibold text-slate-600 block mb-1">Price (₦ NGN)</label><input type="number" value={priceNgn} onChange={(e) => setPriceNgn(e.target.value)} placeholder="Blank = Negotiable" className="w-full p-2.5 border rounded-xl text-xs" /></div>
            <div><label className="text-xs font-semibold text-slate-600 block mb-1">Location / Market Hub</label><input type="text" value={locationHub} onChange={(e) => setLocationHub(e.target.value)} className="w-full p-2.5 border rounded-xl text-xs" /></div>
          </div>
          <button type="submit" disabled={isSubmitting} className="w-full bg-teal-700 text-white font-bold py-3.5 rounded-xl text-xs">Publish Listing 🔒</button>
        </form>
      )}
    </div>
  );
}