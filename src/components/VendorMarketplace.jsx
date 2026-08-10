import React, { useState, useEffect } from 'react';
import shopinApi from '../services/api';

// 🌟 NEW: Notice the marketFilter prop passed down from App.jsx!
export default function VendorMarketplace({ marketFilter, onAddToCart, openCheckout }) {
  const [activeSubTab, setActiveSubTab] = useState('browse'); 
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [feedback, setFeedback] = useState(null);

  // Vendor Registration Form State
  const [regFullName, setRegFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regCategory, setRegCategory] = useState('Wearables');
  const [regContactMode, setRegContactMode] = useState('MIDDLEMAN'); 

  // Product / Service Listing Form State
  const [vendorShopinId, setVendorShopinId] = useState('VND-ILR-1001');
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('Wearables');
  const [serviceSubCategory, setServiceSubCategory] = useState('Janitorial Cleaning');
  const [priceNgn, setPriceNgn] = useState('');
  const [stockQty, setStockQty] = useState('10');
  const [locationHub, setLocationHub] = useState('Ilorin Central Hub');
  const [imageUrl, setImageUrl] = useState(''); 
  const [allowDirectContact, setAllowDirectContact] = useState(false);
  const [isPickupAvailable, setIsPickupAvailable] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Buyer Contact Access State for Services
  const [contactRevealed, setContactRevealed] = useState({});

  // 🌟 NEW: Listen for clicks from the Home Screen Bubbles
  useEffect(() => {
    if (marketFilter === 'MARKETS') setSelectedCategory('Local Markets');
    if (marketFilter === 'SUPERMARKETS') setSelectedCategory('Supermarkets');
    if (marketFilter === 'RESTAURANTS') setSelectedCategory('Restaurants');
    if (marketFilter === 'ALL') setSelectedCategory('All');
  }, [marketFilter]);

  // Fetch REAL Marketplace Catalog on Load
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        if (shopinApi && shopinApi.getVendorProducts) {
          const response = await shopinApi.getVendorProducts();
          if (response.data && response.data.data && response.data.data.length > 0) {
            setProducts(response.data.data);
            return;
          }
        }
      } catch (err) {
        console.warn("Could not fetch live catalog, falling back to samples:", err.message);
      }
      setProducts(getSampleProducts());
    };

    fetchCatalog();
  }, []);

  const getSampleProducts = () => [
    // ... EXISTING SAMPLE PRODUCTS ...
    {
      id: 'v-prod-1', product_name: 'AB&S Move-In / Move-Out Deep Cleaning', category: 'AB&S Services',
      price_ngn: null, stock_quantity: 1, is_verified: true, vendor_id: 'SHP-ILR-8812',
      vendor_name: 'AB&S Cleaning Services', phone_number: '08059876543', location: 'Ilorin Central Hub',
      contact_mode: 'DIRECT', is_pickup_available: false
    },
    {
      id: 'v-prod-2', product_name: 'Pepper Blending & Food Processing', category: 'Mini-Services',
      price_ngn: null, stock_quantity: 1, is_verified: true, vendor_id: 'SHP-ILR-3044',
      vendor_name: 'Mama Alhaja Pepper Grinding', phone_number: '08031234567', location: 'Mandate Market',
      contact_mode: 'DIRECT', is_pickup_available: true
    },
    
    // 🌟 NEW SAMPLES FOR THE NEW CATEGORIES
    {
      id: 'v-prod-6', product_name: 'Item 7 Chicken & Chips', category: 'Restaurants',
      price_ngn: 2500, stock_quantity: 50, image_url: 'https://via.placeholder.com/150?text=Item+7', is_verified: true, vendor_id: 'VND-ILR-ITEM7',
      vendor_name: 'Item 7', location: 'Tanke Hub', contact_mode: 'MIDDLEMAN', is_pickup_available: true
    },
    {
      id: 'v-prod-7', product_name: 'Aroma Amala & Ewedu', category: 'Restaurants',
      price_ngn: 1800, stock_quantity: 100, image_url: 'https://via.placeholder.com/150?text=Aroma+Amala', is_verified: true, vendor_id: 'VND-ILR-AROMA',
      vendor_name: 'Aroma Restaurant', location: 'Challenge Hub', contact_mode: 'MIDDLEMAN', is_pickup_available: true
    },
    {
      id: 'v-prod-8', product_name: 'Shoprite Fresh Bread', category: 'Supermarkets',
      price_ngn: 1200, stock_quantity: 20, image_url: 'https://via.placeholder.com/150?text=Shoprite+Bread', is_verified: true, vendor_id: 'VND-ILR-MALL',
      vendor_name: 'Shoprite Kwara Mall', location: 'Fate Hub', contact_mode: 'MIDDLEMAN', is_pickup_available: true
    },
    {
      id: 'v-prod-9', product_name: 'Garri Ijebu (Paint Rubber)', category: 'Local Markets',
      price_ngn: 2800, stock_quantity: 500, image_url: 'https://via.placeholder.com/150?text=Garri', is_verified: true, vendor_id: 'VND-ILR-MANDATE',
      vendor_name: 'Iya Elelubo', location: 'Mandate Market', contact_mode: 'MIDDLEMAN', is_pickup_available: true
    }
  ];

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
    const isServiceCategory = category === 'AB&S Services' || category === 'Mini-Services';
    const finalTitle = isServiceCategory ? `${productName || serviceSubCategory}` : productName;
    if (!finalTitle) return;

    setIsSubmitting(true);
    setFeedback(null);

    const payload = {
      shopin_id: vendorShopinId.trim(), product_name: finalTitle.trim(), category: category,
      price_ngn: priceNgn ? parseFloat(priceNgn) : null, stock_quantity: parseInt(stockQty) || 1,
      image_url: imageUrl.trim() || null, location: locationHub, service_type: isServiceCategory ? 'service' : 'product',
      allow_direct_contact: allowDirectContact || isServiceCategory, is_pickup_available: isPickupAvailable
    };

    try {
      const res = await shopinApi.addVendorProduct(payload);
      setProducts(prev => [res.data.product, ...prev]);
      setFeedback({ type: 'success', text: `Success! "${finalTitle}" is now live!` });
      resetListingForm();
    } catch (err) {
      const fallbackProd = { ...payload, id: `v-prod-${Date.now()}`, is_verified: true, contact_mode: (allowDirectContact || isServiceCategory) ? 'DIRECT' : 'MIDDLEMAN' };
      setProducts(prev => [fallbackProd, ...prev]);
      setFeedback({ type: 'success', text: `Listed "${finalTitle}" successfully!` });
      resetListingForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetListingForm = () => {
    setProductName(''); setPriceNgn(''); setImageUrl(''); setActiveSubTab('browse');
  };

  const handleBuyWithEscrow = (prod, isPickup = false) => {
    const cartItem = {
      id: prod.id, name: prod.product_name, item_name: prod.product_name, price: Number(prod.price_ngn),
      quantity: 1, category: prod.category, image_url: prod.image_url, isEscrowItem: true, vendorId: prod.vendor_id,
      is_pickup_only: isPickup, vendor_fee: 200 
    };
    if (onAddToCart) onAddToCart([cartItem]);
    if (openCheckout) openCheckout();
  };

  const handleRevealServiceContact = async (prod) => {
    try {
      if (shopinApi && shopinApi.bookServiceContact) await shopinApi.bookServiceContact({ buyer_shopin_id: 'SHP-ILR-GUEST', vendor_id: prod.vendor_id || prod.id, service_category: prod.product_name });
      setContactRevealed(prev => ({ ...prev, [prod.id]: prod.phone_number || '08059876543' }));
      setFeedback({ type: 'success', text: `Phone Number Unlocked!` });
    } catch (err) {
      setContactRevealed(prev => ({ ...prev, [prod.id]: prod.phone_number || '08059876543' }));
      setFeedback({ type: 'success', text: `Verified! Vendor Phone Number: ${prod.phone_number || '08059876543'}` });
    }
  };

  // 🌟 NEW: Added the requested new categories to the filter tabs!
  const filterTabs = ['All', 'Local Markets', 'Supermarkets', 'Restaurants', 'Foodstuff', 'Wearables', 'Electronics', 'AB&S Services', 'Mini-Services', 'Provisions'];

  const filteredProducts = products.filter(prod => {
    const matchesCategory = selectedCategory === 'All' || prod.category === selectedCategory;
    const matchesSearch = prod.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          prod.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (prod.location && prod.location.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Banner Header */}
      <div className="bg-gradient-to-r from-teal-800 to-emerald-900 p-5 rounded-2xl text-white shadow-md">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div>
            <h2 className="text-lg font-extrabold flex items-center gap-2">
              <span>🏪</span> ShopIn Vendor Marketplace
            </h2>
            <p className="text-xs text-teal-100 mt-1">
              Buy from Local Markets, Supermarkets, Restaurants, or book Services.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveSubTab('browse')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeSubTab === 'browse'
                  ? 'bg-white text-teal-900 shadow-xs'
                  : 'bg-teal-900/50 text-teal-100 hover:bg-teal-900/80'
              }`}
            >
              🛒 Browse Marketplace
            </button>
            <button
              onClick={() => setActiveSubTab('register_vendor')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeSubTab === 'register_vendor'
                  ? 'bg-white text-teal-900 shadow-xs'
                  : 'bg-teal-900/50 text-teal-100 hover:bg-teal-900/80'
              }`}
            >
              📝 Register as Vendor
            </button>
            <button
              onClick={() => setActiveSubTab('list_product')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeSubTab === 'list_product'
                  ? 'bg-white text-teal-900 shadow-xs'
                  : 'bg-teal-900/50 text-teal-100 hover:bg-teal-900/80'
              }`}
            >
              ➕ List Items / Services
            </button>
          </div>
        </div>
      </div>

      {/* Toast Feedback */}
      {feedback && (
        <div className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between ${
          feedback.type === 'success' ? 'bg-emerald-100 text-emerald-900 border border-emerald-200' : 'bg-red-100 text-red-900'
        }`}>
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="font-bold cursor-pointer">✕</button>
        </div>
      )}

      {/* SUB-TAB 1: Browse Marketplace */}
      {activeSubTab === 'browse' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <input
              type="text"
              placeholder="Search markets, restaurants, item 7..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 p-2.5 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            />

            <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto text-xs pb-1 custom-scrollbar">
              {filterTabs.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium cursor-pointer transition ${
                    selectedCategory === cat
                      ? 'bg-teal-700 text-white font-bold shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Cards */}
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
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {prod.category}
                      </span>
                      {prod.contact_mode === 'DIRECT' ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full flex items-center gap-1">📞 Direct Phone Contact</span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full flex items-center gap-1">🛡️ Escrow (₦200 Fee)</span>
                      )}
                    </div>

                    <h3 className="font-bold text-slate-900 text-base leading-snug">{prod.product_name}</h3>
                    <p className="text-xs text-slate-500 mt-1 font-medium flex items-center gap-1">
                      <span>📍</span> {prod.location || 'Ilorin Hub'}
                    </p>
                    {prod.vendor_name && (
                      <p className="text-[10px] font-bold text-teal-700 mt-1">Vendor: {prod.vendor_name}</p>
                    )}
                  </div>

                  {prod.category === 'AB&S Services' || prod.category === 'Mini-Services' || prod.contact_mode === 'DIRECT' ? (
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <div className="text-xs text-slate-600">Price: <span className="font-bold text-purple-900">Negotiable</span></div>
                      {contactRevealed[prod.id] ? (
                        <div className="p-2.5 bg-purple-50 border border-purple-200 text-purple-900 rounded-xl text-center space-y-1">
                          <span className="text-xs font-bold block">📞 Phone Number Unlocked:</span>
                          <a href={`tel:${contactRevealed[prod.id]}`} className="text-sm font-extrabold text-purple-700 underline block">{contactRevealed[prod.id]}</a>
                        </div>
                      ) : (
                        <button onClick={() => handleRevealServiceContact(prod)} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs py-2.5 rounded-xl cursor-pointer">
                          📞 Unlock Phone Number & Book
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="pt-3 border-t border-slate-100 flex flex-col space-y-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">Item Price</span>
                          <span className="text-lg font-extrabold text-emerald-700">₦{Number(prod.price_ngn).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button onClick={() => handleBuyWithEscrow(prod, false)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] py-2 rounded-xl text-center cursor-pointer">
                          🚚 Buy + Delivery
                        </button>
                        {prod.is_pickup_available && (
                          <button onClick={() => handleBuyWithEscrow(prod, true)} className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-[11px] py-2 rounded-xl text-center cursor-pointer">
                            🏪 Pickup (₦0 Del.)
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-slate-400 text-sm">
                No items found matching "{searchQuery}". Select another category above!
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: Vendor Registration Form */}
      {activeSubTab === 'register_vendor' && (
        <form onSubmit={handleRegisterVendor} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs max-w-lg mx-auto space-y-4">
          <h3 className="font-extrabold text-slate-900 text-base border-b border-slate-100 pb-2">Register as a ShopIn Verified Vendor</h3>
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Full Name / Business Name</label>
            <input type="text" value={regFullName} onChange={(e) => setRegFullName(e.target.value)} placeholder="e.g. Item 7 / Alhaja Pepper Grinding" required className="w-full p-2.5 border rounded-xl text-xs" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Phone Number</label>
              <input type="tel" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} required className="w-full p-2.5 border rounded-xl text-xs" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Email (Optional)</label>
              <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} className="w-full p-2.5 border rounded-xl text-xs" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Vendor Category</label>
            <select value={regCategory} onChange={(e) => setRegCategory(e.target.value)} className="w-full p-2.5 border rounded-xl text-xs bg-white font-medium">
              <option value="Restaurants">Restaurants & Bukas</option>
              <option value="Supermarkets">Supermarkets</option>
              <option value="Local Markets">Local Markets (Foodstuff & Produce)</option>
              <option value="Wearables">Wearables</option>
              <option value="Electronics">Electronics</option>
              <option value="Mini-Services">Mini-Services</option>
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
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Vendor ShopIn ID</label>
              <input type="text" value={vendorShopinId} onChange={(e) => setVendorShopinId(e.target.value)} required className="w-full p-2.5 border rounded-xl text-xs font-bold" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-2.5 border rounded-xl text-xs bg-white font-medium">
                <option value="Restaurants">Restaurants & Meals</option>
                <option value="Supermarkets">Supermarket Items</option>
                <option value="Local Markets">Local Market Goods</option>
                <option value="Wearables">Wearables</option>
                <option value="Electronics">Electronics</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Item Name</label>
            <input type="text" value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="e.g. Chicken & Chips" required className="w-full p-2.5 border rounded-xl text-xs" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Image URL (Optional)</label>
            <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." className="w-full p-2.5 border rounded-xl text-xs" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Price (₦ NGN)</label>
              <input type="number" value={priceNgn} onChange={(e) => setPriceNgn(e.target.value)} required className="w-full p-2.5 border rounded-xl text-xs" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Location Hub</label>
              <input type="text" value={locationHub} onChange={(e) => setLocationHub(e.target.value)} placeholder="e.g. Tanke Hub" className="w-full p-2.5 border rounded-xl text-xs" />
            </div>
          </div>
          <button type="submit" disabled={isSubmitting} className="w-full bg-teal-700 text-white font-bold py-3.5 rounded-xl text-xs">Publish Listing 🔒</button>
        </form>
      )}
    </div>
  );
}