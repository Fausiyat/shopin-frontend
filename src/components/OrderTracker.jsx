import React, { useState } from 'react';
import axios from 'axios';

export default function OrderTracker({ orderStatus = 'PENDING_CONFIRMATION', activeOrder }) {
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const orderHierarchy = [
    'PENDING_CONFIRMATION',
    'SHOPPING',
    'SHUTTLE_DISPATCH',
    'COMPLETED'
  ];

  const steps = [
    { key: 'PENDING_CONFIRMATION', label: 'Order Placed', icon: '🛒' },
    { key: 'SHOPPING', label: 'Market Sourcing', icon: '🧺' },
    { key: 'SHUTTLE_DISPATCH', label: 'On Corridor Shuttle', icon: '🚀' },
    { key: 'COMPLETED', label: 'Delivered', icon: '📦' }
  ];

  const getCurrentIndex = (status) => {
    if (status === 'ACTION_REQUIRED') return 1; 
    const index = orderHierarchy.indexOf(status);
    return index === -1 ? 0 : index;
  };

  const currentIndex = getCurrentIndex(orderStatus);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">📦 Live Delivery Tracking</h4>
      
      <div className="relative flex items-center justify-between max-w-md mx-auto py-2">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 z-0"></div>
        
        {steps.map((step) => {
          const stepIndex = orderHierarchy.indexOf(step.key);
          
          let state = 'upcoming'; 
          if (currentIndex > stepIndex) state = 'completed'; 
          if (currentIndex === stepIndex) state = 'current'; 

          let circleStyle = "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold z-10 transition-all ";
          
          if (state === 'completed') {
            circleStyle += "bg-emerald-600 text-white shadow-md";
          } else if (state === 'current') {
            circleStyle += orderStatus === 'ACTION_REQUIRED' 
              ? "bg-amber-500 text-white ring-4 ring-amber-100 animate-pulse" 
              : "bg-emerald-500 text-white ring-4 ring-emerald-100 animate-pulse";
          } else {
            circleStyle += "bg-white text-slate-400 border-2 border-slate-200"; 
          }

          return (
            <div key={step.key} className="flex flex-col items-center relative z-10 flex-1">
              <div className={circleStyle}>
                {step.icon}
              </div>
              <span className={`text-[11px] mt-2 text-center ${state === 'current' ? (orderStatus === 'ACTION_REQUIRED' ? 'text-amber-700 font-black' : 'text-emerald-700 font-black') : 'text-slate-500 font-semibold'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* ⚠️ ACTION REQUIRED BLOCK FOR BALANCE UP */}
      {orderStatus === 'ACTION_REQUIRED' && (() => {
        const revisedTotal = Number(activeOrder?.total_estimated_cost || activeOrder?.estimated_total || 0);

        // 🌟 Bulletproof Fix: Check database fields FIRST, then fallback to LocalStorage session data!
        const localCheckoutTotal = Number(localStorage.getItem('SHOPIN_LAST_PAID_AMOUNT') || 0);

        const alreadyPaid = Number(
          activeOrder?.deposit_paid ??
          activeOrder?.amount_paid ??
          activeOrder?.parsed_json?.deposit_paid ??
          localCheckoutTotal ?? 
          0
        );

        if (alreadyPaid === 0) {
          alreadyPaid = Number(activeOrder?.estimated_item_cost || activeOrder?.parsed_json?.estimated_total || 0);
        }

        
        // 🌟 Ensure we subtract correctly so only the remaining balance is shown
        const balanceRemaining = Math.max(0, revisedTotal - alreadyPaid);

        return (
          <div className="mt-6 bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl animate-bounce">⚠️</span>
              <div>
                <h4 className="font-extrabold text-amber-900 text-sm">Action Required: Balance Needed</h4>
                <p className="text-[11px] text-amber-800 font-medium leading-relaxed mt-0.5">
                  Market prices adjusted or custom items were updated. Please transfer the remaining balance below so your shopper can proceed.
                </p>
              </div>
            </div>

           {/* 💰 ITEMIZED BALANCE BREAKDOWN */}
            <div className="bg-amber-100/60 border border-amber-200 rounded-xl p-3.5 mb-3 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-700">
                <span>Revised Total Cost:</span>
                <span className="font-bold">₦{revisedTotal.toLocaleString()}</span>
              </div>

              {alreadyPaid > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Initial Amount Paid:</span>
                  <span className="font-semibold text-emerald-700">- ₦{alreadyPaid.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between text-amber-950 font-black border-t border-amber-200 pt-2 text-sm">
                <span>Balance to Transfer:</span>
                <span className="bg-amber-300 text-amber-950 px-2.5 py-0.5 rounded-md font-mono">
                  {/* 🌟 FIX: Use balanceRemaining here instead of revisedTotal! */}
                  ₦{balanceRemaining.toLocaleString()}
                </span>
              </div>
            </div>

            {/* 🏦 BANK TRANSFER DETAILS */}
            <div className="bg-white border border-amber-200 rounded-xl p-4">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Transfer Balance To:
              </h4>
              
              <div className="flex justify-between items-center bg-slate-50 border border-slate-100 p-3 rounded-lg mb-2">
                <div>
                  <p className="text-[9px] text-slate-500 uppercase tracking-wider">Bank Name</p>
                  <p className="font-bold text-slate-900 text-sm">OPay</p>
                </div>
              </div>

              <div className="flex justify-between items-center bg-slate-50 border border-slate-100 p-3 rounded-lg mb-2">
                <div>
                  <p className="text-[9px] text-slate-500 uppercase tracking-wider">Account Name</p>
                  <p className="font-bold text-slate-900 text-sm capitalize">Mahmood Fausiyat Ayobami</p>
                </div>
              </div>

              <div className="flex justify-between items-center bg-slate-50 border border-slate-100 p-3 rounded-lg">
                <div>
                  <p className="text-[9px] text-slate-500 uppercase tracking-wider">Account Number</p>
                  <p className="font-black text-slate-900 text-xl tracking-widest">8143086509</p>
                </div>
                <button 
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText('8143086509');
                    alert("Account number copied to clipboard!");
                  }}
                  className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold px-4 py-2 rounded-lg text-xs transition cursor-pointer"
                >
                  Copy
                </button>
              </div>
              
              <div className="mt-3 text-center bg-amber-100/50 p-2.5 rounded-lg border border-amber-100">
                <p className="text-[10px] text-amber-800 font-bold">
                  📲 Send a WhatsApp message with your receipt to Admin after transferring so our shopper can instantly proceed!
                </p>
                <a 
                  href={`https://wa.me/2349040161152?text=${encodeURIComponent(
                    `Hello ShopIn Admin, I have paid the balance of ₦${(alreadyPaid > 0 ? balanceRemaining : revisedTotal).toLocaleString()} for order ${activeOrder?.order_code || ''}.`
                  )}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block mt-2 bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-lg text-[10px] transition cursor-pointer"
                >
                  Message Admin Now ➔
                </a>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 🌟 LEAVE A REVIEW SECTION */}
      {(orderStatus === 'DELIVERED' || orderStatus === 'COMPLETED') && !reviewSubmitted && (
        <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-5 shadow-sm text-center">
          <h4 className="font-extrabold text-emerald-900 text-sm mb-1">Rate your experience!</h4>
          <p className="text-xs text-emerald-700 mb-4">How was the service or product you received?</p>
          
          <div className="flex justify-center gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button 
                key={star}
                type="button"
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
                onClick={() => setRating(star)}
                className="text-4xl transition-transform hover:scale-110 cursor-pointer outline-none"
              >
                <span className={star <= (hoveredStar || rating) ? "text-amber-500 drop-shadow-sm" : "text-slate-300 grayscale opacity-50"}>
                  ⭐
                </span>
              </button>
            ))}
          </div>

          <button 
            disabled={rating === 0 || isSubmitting}
            onClick={async () => {
              setIsSubmitting(true);
              try {
                const firstItem = activeOrder?.parsed_json?.items?.[0];
                const productId = firstItem?.id || activeOrder?.product_id || 'v-prod-1';
                const vendorId = firstItem?.vendorId || activeOrder?.vendor_id || null;
                            
                const API_ENDPOINT = import.meta.env.VITE_API_URL || 'https://shopin-kwara-backend.onrender.com'; 

                await axios.post(`${API_ENDPOINT}/api/vendors/reviews`, {
                  order_id: activeOrder?.id,
                  product_id: productId,
                  vendor_id: vendorId,
                  rating: rating
                });
                setReviewSubmitted(true);
              } catch (err) {
                alert("Failed to submit review. Try again.");
              } finally {
                setIsSubmitting(false);
              }
            }}
            className="w-full max-w-xs mx-auto bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold py-3 rounded-xl shadow-md transition cursor-pointer"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      )}

      {/* 🎉 SUCCESS MESSAGE */}
      {reviewSubmitted && (
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-sm text-center">
          <span className="text-3xl block mb-2">🎉</span>
          <h4 className="font-extrabold text-amber-900 text-sm">Review Submitted!</h4>
          <p className="text-xs text-amber-700 mt-1">Thank you for keeping the ShopIn community safe and reliable.</p>
        </div>
      )}

    </div>
  );
}