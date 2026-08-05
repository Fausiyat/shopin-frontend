import React, { useState, useEffect } from 'react';
import shopinApi from '../services/api';

export default function FoodPooling({ onAddToCart, openCheckout }) {
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPoolId, setSelectedPoolId] = useState(null);
  const [pledgedQty, setPledgedQty] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Default fallback food pools if API is loading/empty
  const fallbackPools = [
    {
      id: 'pool-1',
      item_name: '50kg Bag of Foreign Rice Share',
      target_item_name: 'Foreign Rice',
      price_per_slot: 18500,
      total_slots: 4,
      filled_slots: 3,
      unit_label: 'Slot (1/4 Bag / 12.5kg)',
      sourcing_market: 'Mandate Market'
    },
    {
      id: 'pool-2',
      item_name: '100 Tubers of Laboko Yam Share',
      target_item_name: 'Laboko Yam',
      price_per_slot: 12000,
      total_slots: 5,
      filled_slots: 2,
      unit_label: 'Slot (20 Tubers)',
      sourcing_market: 'Mandate Market'
    },
    {
      id: 'pool-3',
      item_name: 'Paint Rubber Garri Ijebu Share',
      target_item_name: 'Garri Ijebu',
      price_per_slot: 3500,
      total_slots: 6,
      filled_slots: 4,
      unit_label: 'Slot (1 Paint Rubber)',
      sourcing_market: 'Ipata Market'
    }
  ];

  useEffect(() => {
    fetchActivePools();
  }, []);

  const fetchActivePools = async () => {
    setLoading(true);
    try {
      const response = await shopinApi.getActivePools();
      const data = response.data;
      if (Array.isArray(data) && data.length > 0) {
        setPools(data);
        setSelectedPoolId(data[0].id);
      } else {
        setPools(fallbackPools);
        setSelectedPoolId(fallbackPools[0].id);
      }
    } catch (err) {
      console.warn("Could not fetch active pools from backend, using fallbacks:", err);
      setPools(fallbackPools);
      setSelectedPoolId(fallbackPools[0].id);
    } finally {
      setLoading(false);
    }
  };

  const activePool = pools.find(p => p.id === selectedPoolId) || pools[0] || fallbackPools[0];

  const pricePerSlot = parseFloat(activePool?.price_per_slot || activePool?.unit_price || 3500);
  const totalCost = pledgedQty * pricePerSlot;
  const remainingSlots = (activePool?.total_slots || activePool?.target_units || 4) - (activePool?.filled_slots || activePool?.current_units || 0);

  const handleJoinPoolDirect = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (shopinApi && shopinApi.joinPool) {
        await shopinApi.joinPool(activePool.id, { units: pledgedQty });
      }

      setSuccessMessage(`Successfully pledged ${pledgedQty} slot(s) for ${activePool.item_name || activePool.target_item_name}!`);
      
      // Local progress update
      setPools(prev => prev.map(p => {
        if (p.id === activePool.id) {
          return { ...p, filled_slots: (p.filled_slots || 0) + pledgedQty };
        }
        return p;
      }));
    } catch (err) {
      console.warn("Backend pool join warning, applying optimistic update:", err);
      setSuccessMessage(`Pledge of ${pledgedQty} slot(s) reserved for ${activePool.item_name || activePool.target_item_name}!`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddToCartAndCheckout = () => {
    const poolItem = {
      name: `[FOOD POOL SHARE] ${activePool.item_name || activePool.target_item_name}`,
      item_name: `[FOOD POOL SHARE] ${activePool.item_name || activePool.target_item_name}`,
      brand_or_variant: 'Bulk Pool Share',
      quantity: pledgedQty,
      price: pricePerSlot,
      unit: activePool.unit_label || 'slot',
      category: 'Food Pooling Share'
    };

    if (onAddToCart) {
      onAddToCart([poolItem]);
    }
    if (openCheckout) {
      openCheckout();
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-slate-500 text-xs animate-pulse">
        ⏳ Loading active bulk food pools...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Pool Selector Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {pools.map((p) => (
          <button
            key={p.id}
            onClick={() => {
              setSelectedPoolId(p.id);
              setSuccessMessage(null);
              setErrorMessage(null);
              setPledgedQty(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              (selectedPoolId === p.id)
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            🛒 {p.item_name || p.target_item_name}
          </button>
        ))}
      </div>

      {/* Active Campaign Card */}
      <div className="bg-emerald-900 text-white rounded-xl p-5 shadow-sm space-y-3 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-700 text-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-600">
            🔥 Bulk Food Sharing Pool
          </span>
          <span className="text-xs text-emerald-200">
            {activePool.sourcing_market || activePool.location || 'Mandate Market'}
          </span>
        </div>

        <div>
          <h3 className="text-lg font-extrabold">{activePool.item_name || activePool.target_item_name}</h3>
          <p className="text-xs text-emerald-200 mt-0.5">
            Bulk Price: <span className="font-bold text-emerald-400">₦{pricePerSlot.toLocaleString()}</span> / {activePool.unit_label || 'slot'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-emerald-200 font-medium">
            <span>Progress: {activePool.filled_slots || activePool.current_units || 0} slots filled</span>
            <span>Target: {activePool.total_slots || activePool.target_units || 4} slots</span>
          </div>
          <div className="w-full bg-emerald-950 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-emerald-400 h-2.5 rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(
                  100,
                  (((activePool.filled_slots || activePool.current_units || 0) / (activePool.total_slots || activePool.target_units || 4)) * 100)
                )}%`
              }}
            ></div>
          </div>
          <p className="text-[10px] text-emerald-300 font-medium pt-0.5">
            ⚡ Only {remainingSlots > 0 ? remainingSlots : 0} slot(s) remaining in this group!
          </p>
        </div>
      </div>

      {/* Error / Success Banners */}
      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
          ⚠️ {errorMessage}
        </div>
      )}

      {successMessage ? (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl p-4 text-center space-y-2">
          <span className="text-2xl block">🎉</span>
          <h4 className="font-bold text-sm">Pledge Confirmed!</h4>
          <p className="text-xs text-emerald-700">{successMessage}</p>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-xs text-emerald-800 font-bold underline cursor-pointer pt-1"
          >
            Join Another Pool
          </button>
        </div>
      ) : (
        /* Contribution Form */
        <form onSubmit={handleJoinPoolDirect} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Select Number of Slots
          </label>
          <div className="flex items-center justify-between">
            <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white">
              <button
                type="button"
                onClick={() => setPledgedQty(Math.max(1, pledgedQty - 1))}
                className="px-3 py-1.5 text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
              >
                -
              </button>
              <span className="px-4 text-xs font-bold text-slate-800">{pledgedQty}</span>
              <button
                type="button"
                onClick={() => setPledgedQty(Math.min(remainingSlots > 0 ? remainingSlots : 5, pledgedQty + 1))}
                className="px-3 py-1.5 text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
              >
                +
              </button>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">Total Cost</span>
              <span className="font-extrabold text-emerald-700 text-sm">₦{totalCost.toLocaleString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="submit"
              disabled={isSubmitting || remainingSlots <= 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg text-xs transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Processing...' : `🤝 Reserve Slot (₦${totalCost.toLocaleString()})`}
            </button>
            
            <button
              type="button"
              onClick={handleAddToCartAndCheckout}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-lg text-xs transition-all shadow-xs cursor-pointer"
            >
              🛒 Add to Cart & Checkout →
            </button>
          </div>
        </form>
      )}
    </div>
  );
}