import React, { useState, useEffect } from 'react';
import shopinApi from '../services/api';

export default function PoolingTab({ onAddToCart, openCheckout }) {
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPools();
  }, []);

  const fetchPools = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Calls endpoint GET /api/pools via centralized Axios service
      const res = await shopinApi.getActivePools();
      const data = res.data ? res.data : res;
      
      if (Array.isArray(data) && data.length > 0) {
        setPools(data);
      } else {
        setPools(getSamplePools());
      }
    } catch (err) {
      console.warn("Using sample pooling data while API connects:", err);
      setPools(getSamplePools());
    } finally {
      setLoading(false);
    }
  };

  // Sample local Kwara bulk-buy pools fallback
  const getSamplePools = () => [
    {
      id: 'pool-1',
      item_name: '50kg Bag of Foreign Rice',
      location: 'Challenge / Post Office Hub',
      target_units: 4,
      current_units: 3,
      unit_price: 18500,
      unit_label: '1/4 Bag Share',
      deadline: '2026-08-01'
    },
    {
      id: 'pool-2',
      item_name: '100 Tubers of Laboko Yam',
      location: 'Gaa Odota / Mandate Market Hub',
      target_units: 5,
      current_units: 2,
      unit_price: 12000,
      unit_label: '20 Tubers Share',
      deadline: '2026-08-02'
    }
  ];

  const handleJoin = (pool) => {
    const numericPrice = Number(pool.unit_price || pool.price_per_slot || 0);
    
    const itemToCart = {
      id: pool.id,
      name: `[BULK POOL] ${pool.item_name || pool.target_item_name} (${pool.unit_label || 'Share'})`,
      item_name: `[BULK POOL] ${pool.item_name || pool.target_item_name} (${pool.unit_label || 'Share'})`,
      price: numericPrice,
      quantity: 1,
      isPoolItem: true,
      hubLocation: pool.location || pool.sourcing_market || 'Mandate Market'
    };
    
    if (onAddToCart) {
      onAddToCart(itemToCart);
    }
    if (openCheckout) {
      openCheckout();
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 text-sm">
        <span className="animate-spin inline-block mr-2">⏳</span> Loading active Kwara produce pools...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex justify-between items-center gap-3">
        <div>
          <h2 className="text-base font-bold text-emerald-900 flex items-center gap-2">
            <span>🤝</span> Bulk Freight & Produce Pooling
          </h2>
          <p className="text-xs text-emerald-700 mt-1">
            Split bulk agricultural purchases and freight charges with nearby buyers at Mandate, Ipata, or Challenge hubs.
          </p>
        </div>
        <button
          onClick={fetchPools}
          className="text-xs bg-emerald-200 hover:bg-emerald-300 text-emerald-900 font-bold px-3 py-1.5 rounded-lg transition cursor-pointer shrink-0"
        >
          🔄 Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pools.map((pool) => {
          // Normalize keys between SQL response and dev mock fallback
          const targetUnits = Number(pool.target_units || pool.total_slots || 10);
          const currentUnits = Number(pool.current_units ?? pool.filled_slots ?? pool.joined_units ?? 0);
          const spotsLeft = Math.max(0, targetUnits - currentUnits);
          const progressPct = Math.min(100, Math.round((currentUnits / targetUnits) * 100));
          const unitPrice = Number(pool.unit_price || pool.price_per_slot || 0);

          return (
            <div 
              key={pool.id} 
              className="border border-slate-200 rounded-xl p-5 bg-white shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-2 gap-2">
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                    {pool.item_name || pool.target_item_name}
                  </h3>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${
                    spotsLeft === 0 
                      ? 'bg-slate-100 text-slate-600' 
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {spotsLeft === 0 ? 'Pool Full' : `${spotsLeft} spot${spotsLeft > 1 ? 's' : ''} left`}
                  </span>
                </div>

                <p className="text-xs text-slate-500 mb-3 font-medium">
                  📍 {pool.location || pool.sourcing_market || 'Ilorin Hub'}
                </p>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 rounded-full h-2 mb-2 overflow-hidden">
                  <div 
                    className="bg-emerald-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                
                <div className="flex justify-between text-xs text-slate-500 mb-4">
                  <span>{currentUnits} of {targetUnits} filled</span>
                  <span className="font-semibold text-emerald-700">{progressPct}% complete</span>
                </div>
              </div>

              {/* Price & Action Button */}
              <div className="flex justify-between items-center pt-3 border-t border-slate-100 mt-2">
                <div>
                  <span className="text-xs text-slate-400 block font-medium">
                    {pool.unit_label || 'Per Slot Share'}
                  </span>
                  <span className="text-base sm:text-lg font-extrabold text-emerald-700">
                    ₦{unitPrice.toLocaleString()}
                  </span>
                </div>
                
                <button
                  onClick={() => handleJoin(pool)}
                  disabled={spotsLeft === 0}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-lg transition cursor-pointer"
                >
                  {spotsLeft === 0 ? 'Filled' : 'Join Pool'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}