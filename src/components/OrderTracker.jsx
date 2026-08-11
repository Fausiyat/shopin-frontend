import React, { useState } from 'react';
import axios from 'axios';

export default function OrderTracker({ orderStatus = 'PENDING_CONFIRMATION', activeOrder }) {
  // 🌟 NEW: State to manage the star rating system
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. We map out the exact order of the race
  const orderHierarchy = [
    'PENDING_CONFIRMATION',  // Checkpoint 1: Order Placed
    'SHOPPING',              // Checkpoint 2: Market Sourcing
    'SHUTTLE_DISPATCH',      // Checkpoint 3: On Corridor Shuttle
    'COMPLETED'              // Finish Line: Delivered
  ];

  // 2. These are the bubbles we show on the screen
  const steps = [
    { key: 'PENDING_CONFIRMATION', label: 'Order Placed', icon: '🛒' },
    { key: 'SHOPPING', label: 'Market Sourcing', icon: '🧺' },
    { key: 'SHUTTLE_DISPATCH', label: 'On Corridor Shuttle', icon: '🚀' },
    { key: 'COMPLETED', label: 'Delivered', icon: '📦' }
  ];

  // 3. A smart helper to figure out exactly where the runner is!
  const getCurrentIndex = (status) => {
    const index = orderHierarchy.indexOf(status);
    // If the remote control sends a weird status (like 'PENDING_PAYMENT'), 
    // we safely keep the runner at the very first bubble (Index 0).
    return index === -1 ? 0 : index;
  };

  const currentIndex = getCurrentIndex(orderStatus);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">📦 Live Delivery Tracking</h4>
      
      <div className="relative flex items-center justify-between max-w-md mx-auto py-2">
        {/* 🛤️ The Background Race Track (Connecting Line) */}
        <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 z-0"></div>
        
        {steps.map((step) => {
          const stepIndex = orderHierarchy.indexOf(step.key);
          
          let state = 'upcoming'; // Hasn't reached here yet!
          if (currentIndex > stepIndex) state = 'completed'; // Already passed this!
          if (currentIndex === stepIndex) state = 'current'; // Right here right now!

          // Give the bubbles different colors based on their state
          let circleStyle = "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold z-10 transition-all ";
          if (state === 'completed') circleStyle += "bg-emerald-600 text-white shadow-md";
          else if (state === 'current') circleStyle += "bg-emerald-500 text-white ring-4 ring-emerald-100 animate-pulse";
          else circleStyle += "bg-white text-slate-400 border-2 border-slate-200"; // Empty upcoming bubble

          return (
            <div key={step.key} className="flex flex-col items-center relative z-10 flex-1">
              <div className={circleStyle}>
                {step.icon}
              </div>
              <span className={`text-[11px] mt-2 text-center ${state === 'current' ? 'text-emerald-700 font-black' : 'text-slate-500 font-semibold'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* 🌟 LEAVE A REVIEW SECTION (Only visible when order is complete) */}
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
                // We fallback to 'v-prod-1' just to prevent a crash if the activeOrder isn't fully loaded yet
                const productId = activeOrder?.parsed_json?.product_id || 'v-prod-1';
                
                await axios.post(`${import.meta.env.VITE_API_URL || 'https://shopin-kwara-backend.onrender.com'}/api/vendors/reviews`, {
                  product_id: productId, 
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
