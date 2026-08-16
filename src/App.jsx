import React, { useState, useEffect } from 'react';
import MarketTicker from './components/MarketTicker';
import AIGroceryList from './components/AIGroceryList';
import StashWallet from './components/StashWallet';
import CheckoutModal from './components/CheckoutModal';
import PoolingTab from './components/PoolingTab';
import DeliveryPooling from './components/DeliveryPooling';
import ShopperPickingList from './components/ShopperPickingList';
import VendorMarketplace from './components/VendorMarketplace';
import AdminDashboard from './components/AdminDashboard';
import OrderTracker from './components/OrderTracker';
import UserProfileModal from './components/UserProfileModal'; 
import shopinApi from './services/api'; 

function App() {
  const [activeTab, setActiveTab] = useState('home'); 
  const [searchTerm, setSearchTerm] = useState('');
  
  // 🌟 NEW: This state remembers WHICH bubble you clicked so the marketplace can filter it!
  const [marketFilter, setMarketFilter] = useState('ALL');

  // 🛒 1. Initialize cart from localStorage so it survives refreshes
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem('SHOPIN_CART');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // 🛒 2. Anytime the cart changes, save it securely to localStorage
  useEffect(() => {
    localStorage.setItem('SHOPIN_CART', JSON.stringify(cartItems));
  }, [cartItems]);

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [activeOrderStatus, setActiveOrderStatus] = useState('PENDING_CONFIRMATION');
  
  const [activeTargetGoal, setActiveTargetGoal] = useState(() => {
    const saved = localStorage.getItem('SHOPIN_ACTIVE_TARGET');
    return saved ? JSON.parse(saved) : null;
  });

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [currentUserName, setCurrentUserName] = useState(() => localStorage.getItem('SHOPIN_USER_NAME') || 'My Profile');

  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [showAdminPasscodeModal, setShowAdminPasscodeModal] = useState(false);
  const [adminPasscodeInput, setAdminPasscodeInput] = useState('');
  const [adminPasscodeError, setAdminPasscodeError] = useState(false);

  const [isShopperUnlocked, setIsShopperUnlocked] = useState(false);
  const [showShopperPasscodeModal, setShowShopperPasscodeModal] = useState(false);
  const [shopperPasscodeInput, setShopperPasscodeInput] = useState('');
  const [shopperPasscodeError, setShopperPasscodeError] = useState(false);

  const [walletBalance, setWalletBalance] = useState(0);
  
 // 🌟 UPGRADED: LIVE ORDER & WALLET POLLING
  // This replaces the old fetchBalances and adds auto-updating every 10 seconds!
  useEffect(() => {
    // 🌟 IF NO USER IS LOGGED IN, DO NOT FETCH!
    const shopinId = localStorage.getItem('SHOPIN_USER_ID');
    if (!shopinId) {
      setWalletBalance(0);
      return; 
    }

    const fetchLiveUpdates = async () => {
      try {
        // 1. Auto-fetch Order Status for the Tracker
        const orderRes = await shopinApi.getUserOrders(shopinId);
        const orders = orderRes.data?.orders || [];
        const currentActive = orders.find(o => o.order_status !== 'COMPLETED');
        
        if (currentActive) {
          setActiveOrderId(currentActive.id || currentActive.order_code);
          setActiveOrderStatus(currentActive.order_status);
        } else {
          setActiveOrderId(null);
          setActiveOrderStatus('PENDING_CONFIRMATION');
        }

        // 2. Auto-fetch Wallet Balance (No more manual refreshing needed!)
        const walletRes = await shopinApi.getWalletBalance(shopinId);
        if (walletRes.data) {
          setWalletBalance(Number(walletRes.data.available_balance) || 0);
        }

      } catch (err) {
        console.warn("Live polling failed:", err.message);
      }
    };

    // Run immediately on load (just like your old code did)
    fetchLiveUpdates();

    // The Magic: Check again silently every 10 seconds
    const interval = setInterval(fetchLiveUpdates, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const handleUnlockAdmin = async (e) => {
    e.preventDefault();
    setAdminPasscodeError(false);
    try {
      await shopinApi.verifyAdminPin(adminPasscodeInput);
      setIsAdminUnlocked(true);
      setShowAdminPasscodeModal(false);
      setAdminPasscodeInput('');
      setActiveTab('admin');
    } catch (err) {
      setAdminPasscodeError(true);
    }
  };

  const handleUnlockShopper = (e) => {
    e.preventDefault();
    setShopperPasscodeError(false);
    const savedShopperPin = localStorage.getItem('SHOPIN_SHOPPER_PIN') || '5678';
    if (shopperPasscodeInput.trim() === savedShopperPin) {
      setIsShopperUnlocked(true);
      setShowShopperPasscodeModal(false);
      setShopperPasscodeInput('');
      setActiveTab('picking');
    } else {
      setShopperPasscodeError(true);
    }
  };

  const handleAddToCart = (incoming) => {
    const itemsToAdd = Array.isArray(incoming) ? incoming : [incoming];
    setCartItems((prevCart) => {
      const updatedCart = [...prevCart];
      itemsToAdd.forEach((newItem) => {
        const existingIndex = updatedCart.findIndex(
          (item) => item.id && newItem.id && item.id === newItem.id
        );
        if (existingIndex > -1) {
          const currentQty = updatedCart[existingIndex].quantity || 1;
          const addedQty = newItem.quantity || 1;
          updatedCart[existingIndex] = { ...updatedCart[existingIndex], quantity: currentQty + addedQty };
        } else {
          updatedCart.push({
            ...newItem,
            id: newItem.id || `cart_${Date.now()}_${Math.random()}`,
            quantity: newItem.quantity || 1
          });
        }
      });
      return updatedCart;
    });
    setIsCheckoutOpen(true);
  };

  const handleRemoveCartItem = (idxToRemove) => {
    setCartItems((prevCart) => prevCart.filter((_, i) => i !== idxToRemove));
  };

  const handleOrderSuccess = (createdOrder, amountDeducted) => {
    if (createdOrder?.id || createdOrder?.order_code) {
      setActiveOrderId(createdOrder.id || createdOrder.order_code);
      setActiveOrderStatus(createdOrder.order_status || 'PENDING_CONFIRMATION'); 
    }
    if (amountDeducted) {
      setWalletBalance((prev) => Math.max(0, prev - amountDeducted));
    }
    setCartItems([]);
  };

  const getCartCount = () => {
    return cartItems.length;
  };

  // 🌟 HELPER TO HANDLE BUBBLE CLICKS
  const openMarketplaceWithFilter = (filterType) => {
    setMarketFilter(filterType);
    setActiveTab('marketplace');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <MarketTicker />

      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="ShopIn Logo"
                className="h-10 w-auto object-contain max-w-[160px] cursor-pointer"
                onClick={() => setActiveTab('home')}
              />
              <div>
                <div className="flex items-center gap-2">
                <button onClick={() => { isAdminUnlocked ? setActiveTab('admin') : setShowAdminPasscodeModal(true); }} className="text-xs opacity-40 hover:opacity-100 transition cursor-pointer">
                  {isAdminUnlocked ? '🔓' : '🔒'}
                </button>
                <button onClick={() => { isShopperUnlocked ? setActiveTab('picking') : setShowShopperPasscodeModal(true); }} className="text-xs opacity-40 hover:opacity-100 transition cursor-pointer">
                  {isShopperUnlocked ? '📋🔓' : '📋🔒'}
                </button>
              </div>
              <span className="text-xs text-emerald-600 font-semibold tracking-wide">ILORIN HUB ACTIVE</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setActiveTab('wallet')} 
              className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 font-extrabold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
            >
              <span className="text-[14px]">💳</span> 
              ₦{Number(walletBalance).toLocaleString()}
            </button>

            <button onClick={() => setShowProfileModal(true)} className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer">
              <span>👤</span> <span className="hidden sm:inline">{currentUserName}</span>
            </button>
            
            <button onClick={() => setIsCheckoutOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer">
              <span>🛒 <span className="hidden sm:inline">Cart</span></span>
              <span className="bg-white text-emerald-800 rounded-full px-1.5 py-0.2 text-[10px] font-black">{getCartCount()}</span>
            </button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 flex items-center gap-1 overflow-x-auto text-xs font-semibold py-2 border-t border-slate-100 custom-scrollbar">
          <button onClick={() => setActiveTab('home')} className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${activeTab === 'home' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>🏠 Home</button>
          <button onClick={() => openMarketplaceWithFilter('ALL')} className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${activeTab === 'marketplace' ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>🏪 Marketplace</button>
          <button onClick={() => setActiveTab('orders')} className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${activeTab === 'orders' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>🤖 AI Errand</button>
          <button onClick={() => setActiveTab('pooling')} className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${activeTab === 'pooling' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>🤝 Food Pooling</button>
          <button onClick={() => setActiveTab('shuttles')} className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${activeTab === 'shuttles' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>🚀 Corridors</button>
          <button onClick={() => setActiveTab('wallet')} className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${activeTab === 'wallet' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>💳 Stash Wallet</button>
          {(isShopperUnlocked || isAdminUnlocked) && ( <button onClick={() => setActiveTab('picking')} className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${activeTab === 'picking' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>📋 Picking</button> )}
          {isAdminUnlocked && ( <button onClick={() => setActiveTab('admin')} className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${activeTab === 'admin' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>⚙️ Admin</button> )}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        
        {activeTab === 'home' ? (
          <div className="w-full space-y-6">
            <section className="bg-emerald-800 text-white p-8 md:p-12 text-center rounded-3xl shadow-md">
              <h1 className="text-3xl md:text-4xl font-extrabold mb-6 tracking-tight">What do you need today?</h1>
              
              {/* 🌟 UPGRADED LIVE SEARCH BAR */}
              <div className="max-w-2xl mx-auto bg-white rounded-full flex items-center overflow-hidden pl-4 pr-1.5 py-1.5 shadow-lg border-2 border-transparent focus-within:border-emerald-400 transition-all">
                <span className="text-slate-400 text-xl mr-2">🔍</span>
                <input 
                  type="text" 
                  placeholder="Search for yams, item 7, or a market..." 
                  className="w-full p-2 text-slate-800 focus:outline-none font-medium bg-transparent" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setActiveTab('marketplace');
                  }}
                />
                <button 
                  onClick={() => setActiveTab('marketplace')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-full text-sm transition cursor-pointer shadow-sm hidden sm:block"
                >
                  Search
                </button>
              </div>
            </section>

            {/* 🛟 ADMIN SUPPORT & HELP BANNER */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-xs max-w-5xl mx-auto">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🛟</span>
                <div>
                  <span className="font-extrabold text-amber-900 text-sm block">Need Help or Have an Issue?</span>
                  <span className="text-amber-700 font-medium">Contact ShopIn Admin instantly for order, delivery, or wallet support.</span>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <a 
                  href="tel:08143086509" 
                  className="flex-1 sm:flex-initial bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2.5 rounded-xl text-center transition cursor-pointer shadow-xs whitespace-nowrap active:scale-95"
                >
                  📞 Call Admin
                </a>
                <a 
                  href="https://wa.me/2349040161152?text=Hello%20ShopIn%20Admin,%20I%20need%20help%20with%20an%20issue:" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-center transition cursor-pointer shadow-xs whitespace-nowrap active:scale-95"
                >
                  💬 WhatsApp Chat
                </a>
              </div>
            </div>

            {/* 🌟 MOBILE-OPTIMIZED GRID */}
            <section className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 max-w-5xl mx-auto">
              
              <div onClick={() => openMarketplaceWithFilter('MARKETS')} className="bg-white p-4 sm:p-5 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-center text-center cursor-pointer border border-slate-100 hover:border-emerald-200 active:scale-95">
                <span className="text-4xl sm:text-5xl mb-2 sm:mb-3">🛒</span>
                <span className="font-bold text-slate-800 text-xs sm:text-sm mb-1">Local Markets</span>
                <span className="text-[9px] sm:text-[10px] text-slate-500 font-medium leading-tight px-1">Mandate, Ipata, Oja Oba, Oja Tuntun</span>
              </div>
              
              <div onClick={() => openMarketplaceWithFilter('SUPERMARKETS')} className="bg-white p-4 sm:p-5 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-center text-center cursor-pointer border border-slate-100 hover:border-emerald-200 active:scale-95">
                <span className="text-4xl sm:text-5xl mb-2 sm:mb-3">🛍️</span>
                <span className="font-bold text-slate-800 text-xs sm:text-sm mb-1">Supermarkets</span>
                <span className="text-[9px] sm:text-[10px] text-slate-500 font-medium leading-tight px-1">Shoprite, Emirate Mall, Shopmall</span>
              </div>

              <div onClick={() => openMarketplaceWithFilter('RESTAURANTS')} className="bg-white p-4 sm:p-5 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-center text-center cursor-pointer border border-slate-100 hover:border-emerald-200 active:scale-95">
                <span className="text-4xl sm:text-5xl mb-2 sm:mb-3">🍽️</span>
                <span className="font-bold text-slate-800 text-xs sm:text-sm mb-1">Restaurants</span>
                <span className="text-[9px] sm:text-[10px] text-slate-500 font-medium leading-tight px-1">Aroma, Captain Cook, Item 7, Sheshede</span>
              </div>

              <div onClick={() => setActiveTab('pooling')} className="bg-white p-4 sm:p-5 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-center text-center cursor-pointer border border-slate-100 hover:border-emerald-200 active:scale-95">
                <span className="text-4xl sm:text-5xl mb-2 sm:mb-3">🍲</span>
                <span className="font-bold text-slate-800 text-xs sm:text-sm mb-1">Food Pooling</span>
                <span className="text-[9px] sm:text-[10px] text-slate-500 font-medium leading-tight px-1">Share bulk bags of rice or garri</span>
              </div>

              <div onClick={() => setActiveTab('orders')} className="col-span-2 md:col-span-2 bg-emerald-50 p-4 sm:p-5 rounded-3xl border-2 border-emerald-200 shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-center text-center cursor-pointer hover:bg-emerald-100 active:scale-95">
                <span className="text-4xl sm:text-5xl mb-2 sm:mb-3">✨</span>
                <span className="font-extrabold text-emerald-800 text-xs sm:text-sm mb-1">Custom AI Errand</span>
                <span className="text-[9px] sm:text-[10px] text-emerald-600 font-medium max-w-sm leading-tight">
                  Type your custom grocery list, pharmacy run, or special request and we'll handle it!
                </span>
              </div>

            </section>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* 🌟 DYNAMIC MAIN SECTION: Full width for Wallet/Admin, 7-columns for others */}
            <section className={`bg-white rounded-2xl border border-slate-200 shadow-xs p-6 ${activeTab === 'wallet' || activeTab === 'admin' ? 'lg:col-span-12' : 'lg:col-span-7'}`}>
              
              {activeTab === 'wallet' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <span className="text-2xl">💳</span>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Your Stash Wallet</h3>
                      <p className="text-xs text-slate-500">Manage your funds, target savings, and escrow.</p>
                    </div>
                  </div>
                  <StashWallet 
                    walletBalance={walletBalance} 
                    setWalletBalance={setWalletBalance} 
                  />
                </div>
              )}

              {activeTab === 'marketplace' && (
                <VendorMarketplace 
                  marketFilter={marketFilter} 
                  searchTerm={searchTerm} 
                  onAddToCart={handleAddToCart} 
                  openCheckout={() => setIsCheckoutOpen(true)} 
                />
              )}

              {activeTab === 'orders' && (
                <>
                  <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                    <span className="text-2xl">🤖</span>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Smart AI List Parser</h3>
                      <p className="text-xs text-slate-500">Paste your raw text, voice note text, or WhatsApp list.</p>
                    </div>
                  </div>
                  <AIGroceryList onAddToCart={handleAddToCart} openCheckout={() => setIsCheckoutOpen(true)} />
                </>
              )}

              {activeTab === 'pooling' && (
                <PoolingTab onAddToCart={handleAddToCart} openCheckout={() => setIsCheckoutOpen(true)} />
              )}

              {activeTab === 'shuttles' && (
                <DeliveryPooling activeOrderId={activeOrderId} />
              )}

              {activeTab === 'picking' && (isShopperUnlocked || isAdminUnlocked) && (
                <ShopperPickingList />
              )}

              {activeTab === 'admin' && isAdminUnlocked && (
                <AdminDashboard />
              )}
            </section>

            {/* 🌟 CONDITIONALLY RENDER THE SIDEBAR */}
            {activeTab !== 'wallet' && activeTab !== 'admin' && (
              <aside className="lg:col-span-5 space-y-6">
                
                {activeOrderId ? (
                  <OrderTracker orderStatus={activeOrderStatus} activeOrder={null} />
                ) : (
                  <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 text-center text-slate-400 text-xs font-medium">
                    🛒 No active order tracking. Place an order to view live delivery status!
                  </div>
                )}

                <div className="bg-blue-50 rounded-2xl border border-blue-200 p-5 text-blue-900">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">Batch Shuttle</span>
                    <span className="text-xs font-semibold text-blue-700">2:00 PM - 6:00 PM</span>
                  </div>
                  <h4 className="font-bold text-sm">Express Delivery Corridors</h4>
                  <p className="text-xs text-blue-700 mt-1 mb-3">
                    Join a route anytime! To keep fees low, batched orders are dispatched strictly between <b>2:00 PM and 6:00 PM</b> when the shuttle fills up.
                  </p>
                  <button onClick={() => setActiveTab('shuttles')} className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 px-3 rounded-xl transition cursor-pointer">
                    View Available Corridors ➔
                  </button>
                </div>
              </aside>
            )}

          </div>
        )}
      </main>

      {/* Security Modals */}
      {showAdminPasscodeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleUnlockAdmin} className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <div className="text-center">
              <span className="text-3xl block mb-1">🔐</span>
              <h3 className="font-extrabold text-slate-900 text-base">ShopIn Admin Access</h3>
            </div>
            {adminPasscodeError && <p className="text-xs text-red-600 font-bold text-center bg-red-50 p-2 rounded-lg border border-red-200">Incorrect admin passcode.</p>}
            <input type="password" placeholder="Enter PIN" value={adminPasscodeInput} onChange={(e) => setAdminPasscodeInput(e.target.value)} className="w-full p-3 border rounded-xl text-center font-bold text-sm" autoFocus />
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowAdminPasscodeModal(false)} className="flex-1 bg-slate-100 text-slate-700 text-xs font-bold py-2.5 rounded-xl">Cancel</button>
              <button type="submit" className="flex-1 bg-slate-900 text-white text-xs font-bold py-2.5 rounded-xl">Unlock</button>
            </div>
          </form>
        </div>
      )}

      {showShopperPasscodeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleUnlockShopper} className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <div className="text-center">
              <span className="text-3xl block mb-1">📋</span>
              <h3 className="font-extrabold text-slate-900 text-base">Shopper Portal Access</h3>
            </div>
            {shopperPasscodeError && <p className="text-xs text-red-600 font-bold text-center bg-red-50 p-2 rounded-lg border border-red-200">Incorrect shopper passcode.</p>}
            <input type="password" placeholder="Enter PIN" value={shopperPasscodeInput} onChange={(e) => setShopperPasscodeInput(e.target.value)} className="w-full p-3 border rounded-xl text-center font-bold text-sm" autoFocus />
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowShopperPasscodeModal(false)} className="flex-1 bg-slate-100 text-slate-700 text-xs font-bold py-2.5 rounded-xl">Cancel</button>
              <button type="submit" className="flex-1 bg-amber-600 text-white text-xs font-bold py-2.5 rounded-xl">Unlock</button>
            </div>
          </form>
        </div>
      )}

      <CheckoutModal isOpen={isCheckoutOpen} items={cartItems} walletBalance={walletBalance} onClose={() => setIsCheckoutOpen(false)} onOrderSuccess={handleOrderSuccess} onRemoveItem={handleRemoveCartItem} />

      {showProfileModal && (
        <UserProfileModal onClose={() => setShowProfileModal(false)} onProfileUpdated={(data) => { if (data && data.full_name) setCurrentUserName(data.full_name); }} />
      )}
    </div>
  );
}

export default App;