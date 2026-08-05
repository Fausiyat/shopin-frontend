import React from 'react';

export default function OrderTracker({ orderStatus = 'PENDING_CONFIRMATION' }) {
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
    </div>
  );
}