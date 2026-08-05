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
import UserProfileModal from './components/UserProfileModal'; // 👤 Added User Profile Modal import

import shopinApi from './services/api'; // 🔌 Imported shopinApi service

function App() {
  // Navigation active tab: 'orders' | 'pooling' | 'shuttles' | 'marketplace' | 'picking' | 'admin'
  const [activeTab, setActiveTab] = useState('orders');
  const [cartItems, setCartItems] = useState([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [activeOrderStatus, setActiveOrderStatus] = useState('PENDING_CONFIRMATION');
  
  // 🎯 Persistent Target Goal State (Survives Page Refreshes!)
  const [activeTargetGoal, setActiveTargetGoal] = useState(() => {
    const saved = localStorage.getItem('SHOPIN_ACTIVE_TARGET');
    return saved ? JSON.parse(saved) : null;
  });

  // 👤 User Profile Modal State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [currentUserName, setCurrentUserName] = useState(() => localStorage.getItem('SHOPIN_USER_NAME') || 'My Profile');

  // 🔒 Admin Authentication State
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [showAdminPasscodeModal, setShowAdminPasscodeModal] = useState(false);
  const [adminPasscodeInput, setAdminPasscodeInput] = useState('');
  const [adminPasscodeError, setAdminPasscodeError] = useState(false);

  // 📦 Shopper Authentication State (Separate from Admin)
  const [isShopperUnlocked, setIsShopperUnlocked] = useState(false);
  const [showShopperPasscodeModal, setShowShopperPasscodeModal] = useState(false);
  const [shopperPasscodeInput, setShopperPasscodeInput] = useState('');
  const [shopperPasscodeError, setShopperPasscodeError] = useState(false);

  // Global Wallet Balance (Default NGN 0 demo balance)
  const [walletBalance, setWalletBalance] = useState(0);
  const [escrowBalance, setEscrowBalance] = useState(0);
  
  // 🔄 Fetch Real Wallet Balances on Load
  useEffect(() => {
    const fetchBalances = async () => {
      const shopinId = localStorage.getItem('SHOPIN_USER_ID') || 'SHP-ILR-1001';
      try {
        const response = await shopinApi.getWalletBalance(shopinId);
        if (response.data) {
          setWalletBalance(Number(response.data.available_balance) || 0);
          setEscrowBalance(Number(response.data.escrow_balance) || 0);
        }
      } catch (err) {
        console.warn("Could not fetch wallet balances:", err.message);
      }
    };

    fetchBalances();
  }, []);

  // Handle Secure Secret Admin Passcode Unlock
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
      console.warn("Admin passcode verification failed:", err);
      setAdminPasscodeError(true);
    }
  };

  // Handle Secret Shopper Passcode Unlock
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

  // Robust Cart Handler
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
          updatedCart[existingIndex] = {
            ...updatedCart[existingIndex],
            quantity: currentQty + addedQty
          };
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

  // Remove individual item from cart
  const handleRemoveCartItem = (idxToRemove) => {
    setCartItems((prevCart) => prevCart.filter((_, i) => i !== idxToRemove));
  };

  // Order Success Handler: Deducts total from wallet & moves it to Escrow
  const handleOrderSuccess = (createdOrder, amountDeducted) => {
    if (createdOrder?.id || createdOrder?.order_code) {
      setActiveOrderId(createdOrder.id || createdOrder.order_code);
      setActiveOrderStatus(createdOrder.order_status || 'PENDING_CONFIRMATION'); 
    }

    if (amountDeducted) {
      // 👇 Subtract from Liquid, Add to Escrow!
      setWalletBalance((prev) => Math.max(0, prev - amountDeducted));
      setEscrowBalance((prev) => prev + amountDeducted);

      // 👇 Check if there is a remaining balance to pay later
      const grandTotal = createdOrder.total_estimated_cost || 0;
      const remainingBalance = Math.max(0, grandTotal - amountDeducted);
      
      if (remainingBalance > 0) {
        // Set the active target goal for the remaining balance and save it to memory
        const newGoal = {
          targetId: createdOrder.order_code || createdOrder.id,
          targetTotal: remainingBalance,
          items: createdOrder.parsed_json?.items || cartItems
        };
        setActiveTargetGoal(newGoal);
        localStorage.setItem('SHOPIN_ACTIVE_TARGET', JSON.stringify(newGoal));
      }
    }

    setCartItems([]);
  };

  // Calculate cart count correctly, treating Custom Naira Budgets as 1 item
  const getCartCount = () => {
    return cartItems.reduce((acc, item) => {
      const isNairaVal = (item.unit || '').toLowerCase() === 'naira_value';
      return acc + (isNairaVal ? 1 : (Number(item.quantity) || 1));
    }, 0);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* 1. Market Ticker Bar */}
      <MarketTicker />

      {/* 2. Main Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="ShopIn Logo"
                className="h-10 w-auto object-contain max-w-[160px]"
              />
              <div>
                <div className="flex items-center gap-2">
                {/* 🔒 Secret Admin Lock Icon */}
                <button
                  onClick={() => {
                    if (isAdminUnlocked) {
                      setActiveTab('admin');
                    } else {
                      setShowAdminPasscodeModal(true);
                    }
                  }}
                  title="Operations & Admin Lock"
                  className="text-xs opacity-40 hover:opacity-100 transition cursor-pointer"
                >
                  {isAdminUnlocked ? '🔓' : '🔒'}
                </button>

                {/* 📋 Shopper Portal Lock Icon */}
                <button
                  onClick={() => {
                    if (isShopperUnlocked) {
                      setActiveTab('picking');
                    } else {
                      setShowShopperPasscodeModal(true);
                    }
                  }}
                  title="Shopper Picking Portal"
                  className="text-xs opacity-40 hover:opacity-100 transition cursor-pointer"
                >
                  {isShopperUnlocked ? '📋🔓' : '📋🔒'}
                </button>
              </div>
              <span className="text-xs text-emerald-600 font-semibold tracking-wide">ILORIN HUB ACTIVE</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 👤 User Profile Trigger Button */}
            <button
              onClick={() => setShowProfileModal(true)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
              title="Edit Profile & Address"
            >
              <span>👤</span> {currentUserName}
            </button>

            {/* Cart Button */}
            <button
              onClick={() => setIsCheckoutOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <span>🛒 Cart</span>
              <span className="bg-white text-emerald-800 rounded-full px-1.5 py-0.2 text-xs font-black">
                {getCartCount()}
              </span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="max-w-6xl mx-auto px-4 flex items-center gap-1 overflow-x-auto text-xs font-semibold py-2 border-t border-slate-100 custom-scrollbar">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'orders' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🛒 Order Assistant
          </button>

          <button
            onClick={() => setActiveTab('pooling')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'pooling' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🤝 Food Pooling
          </button>

          <button
            onClick={() => setActiveTab('shuttles')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'shuttles' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🚀 Shuttle Corridors
          </button>

          <button
            onClick={() => setActiveTab('marketplace')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'marketplace' ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🏪 Marketplace
          </button>

          {/* 📋 SHOPPER PICKING TAB (Unlocked by Shopper OR Admin) */}
          {(isShopperUnlocked || isAdminUnlocked) && (
            <button
              onClick={() => setActiveTab('picking')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'picking' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📋 Shopper Picking
            </button>
          )}

          {/* ⚙️ ADMIN CONSOLE TAB (Strictly Admin Only) */}
          {isAdminUnlocked && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'admin' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ⚙️ Admin Console
            </button>
          )}
        </div>
      </nav>

      {/* 3. Hero Sub-header */}
      <header className="bg-gradient-to-b from-emerald-900 to-emerald-800 text-white py-6 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Your Kwara Market Concierge
          </h2>
          <p className="text-emerald-100 mt-1 text-xs sm:text-sm">
            AI-powered market direct sourcing, Stash Wallet savings, and shared corridor batch delivery.
          </p>
        </div>
      </header>

      {/* 4. Main Dashboard Workspace */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Content Area */}
          <section className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
            {activeTab === 'orders' && (
              <>
                <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                  <span className="text-2xl">🤖</span>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Smart AI List Parser</h3>
                    <p className="text-xs text-slate-500">Paste your raw text, voice note text, or WhatsApp list.</p>
                  </div>
                </div>
                <AIGroceryList 
                  onAddToCart={handleAddToCart} 
                  openCheckout={() => setIsCheckoutOpen(true)} 
                />
              </>
            )}

            {activeTab === 'pooling' && (
              <>
                <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                  <span className="text-2xl">🤝</span>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Bulk Food Pooling</h3>
                    <p className="text-xs text-slate-500">Share bulk bags of rice or garri with neighbors at wholesale prices.</p>
                  </div>
                </div>
                <PoolingTab onAddToCart={handleAddToCart} openCheckout={() => setIsCheckoutOpen(true)} />
              </>
            )}

            {activeTab === 'shuttles' && (
              <>
                <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                  <span className="text-2xl">🚀</span>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Express Delivery Corridors</h3>
                    <p className="text-xs text-slate-500">Batch delivery with nearby buyers along Ilorin routes to save on fees.</p>
                  </div>
                </div>
                <DeliveryPooling activeOrderId={activeOrderId} />
              </>
            )}

            {activeTab === 'marketplace' && (
              <VendorMarketplace onAddToCart={handleAddToCart} openCheckout={() => setIsCheckoutOpen(true)} />
            )}

            {activeTab === 'picking' && (isShopperUnlocked || isAdminUnlocked) && (
              <ShopperPickingList />
            )}

            {activeTab === 'admin' && isAdminUnlocked && (
              <AdminDashboard />
            )}
          </section>

          {/* Side Panel (Stash Wallet, Live Order Tracker & Shuttle Card) */}
          <aside className="lg:col-span-5 space-y-6">
            {/* Clean Stash Wallet Container */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
              <StashWallet 
                walletBalance={walletBalance} 
                setWalletBalance={setWalletBalance} 
                escrowBalance={escrowBalance} 
                activeTargetGoal={activeTargetGoal}
                onTargetCompleted={(orderId) => {
                   setActiveTargetGoal(null);
                   localStorage.removeItem('SHOPIN_ACTIVE_TARGET'); // Clear memory when done!
                   setActiveOrderStatus('SHOPPING'); 
                }}
              />
            </div>

            {/* Live Order Tracker Widget */}
            {activeOrderId ? (
              <OrderTracker orderStatus={activeOrderStatus} />
            ) : (
              <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 text-center text-slate-400 text-xs font-medium">
                🛒 No active order tracking. Place an order to view live delivery status!
              </div>
            )}

            {/* Shuttle Quick Access */}
            <div className="bg-blue-50 rounded-2xl border border-blue-200 p-5 text-blue-900">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">
                  Batch Shuttle
                </span>
                <span className="text-xs font-semibold text-blue-700">Next Run: 12:00 PM</span>
              </div>
              <h4 className="font-bold text-sm">Unilorin / Tanke Shuttle Active</h4>
              <p className="text-xs text-blue-700 mt-1 mb-3">
                Pool delivery fees with nearby orders to lock in shared zone rates!
              </p>
              <button
                onClick={() => setActiveTab('shuttles')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 px-3 rounded-xl transition cursor-pointer"
              >
                View Available Corridors ➔
              </button>
            </div>
          </aside>

        </div>
      </main>

      {/* 5. Secret Admin Passcode Modal */}
      {showAdminPasscodeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleUnlockAdmin} className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <div className="text-center">
              <span className="text-3xl block mb-1">🔐</span>
              <h3 className="font-extrabold text-slate-900 text-base">ShopIn Admin Access</h3>
              <p className="text-xs text-slate-500 mt-0.5">Enter secret PIN to unlock operations console.</p>
            </div>

            {adminPasscodeError && (
              <p className="text-xs text-red-600 font-bold text-center bg-red-50 p-2 rounded-lg border border-red-200">
                Incorrect admin passcode. Try again.
              </p>
            )}

            <input
              type="password"
              placeholder="Enter PIN (e.g. 1234)"
              value={adminPasscodeInput}
              onChange={(e) => setAdminPasscodeInput(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-xl text-center font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              autoFocus
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowAdminPasscodeModal(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-xl cursor-pointer"
              >
                Unlock
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 5b. Secret Shopper Passcode Modal */}
      {showShopperPasscodeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleUnlockShopper} className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <div className="text-center">
              <span className="text-3xl block mb-1">📋</span>
              <h3 className="font-extrabold text-slate-900 text-base">Shopper Portal Access</h3>
              <p className="text-xs text-slate-500 mt-0.5">Enter shopper staff PIN (Default: 5678).</p>
            </div>

            {shopperPasscodeError && (
              <p className="text-xs text-red-600 font-bold text-center bg-red-50 p-2 rounded-lg border border-red-200">
                Incorrect shopper passcode. Try again.
              </p>
            )}

            <input
              type="password"
              placeholder="Enter PIN (e.g. 5678)"
              value={shopperPasscodeInput}
              onChange={(e) => setShopperPasscodeInput(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-xl text-center font-bold text-sm outline-none focus:ring-2 focus:ring-amber-500"
              autoFocus
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowShopperPasscodeModal(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2.5 rounded-xl cursor-pointer"
              >
                Unlock
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 6. Checkout Modal */}
      <CheckoutModal 
        isOpen={isCheckoutOpen}
        items={cartItems} 
        walletBalance={walletBalance}
        onClose={() => setIsCheckoutOpen(false)} 
        onOrderSuccess={handleOrderSuccess}
        onRemoveItem={handleRemoveCartItem}
      />

      {/* 7. User Profile Modal */}
      {showProfileModal && (
        <UserProfileModal 
          onClose={() => setShowProfileModal(false)}
          onProfileUpdated={(data) => {
            if (data && data.full_name) {
              setCurrentUserName(data.full_name);
            }
          }}
        />
      )}
    </div>
  );
}

export default App;