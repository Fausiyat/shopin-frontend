import React, { useState, useEffect } from 'react';
import shopinApi from '../services/api';

export default function DeliveryPooling({ activeOrderId, onShuttleSelected }) {
  const [deliveryPools, setDeliveryPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDeliveryPools();
  }, []);

  const getZoneFee = (routeName) => {
    if (!routeName) return 1800;
    const nameLower = routeName.toLowerCase();
    if (nameLower.includes('al-hikmah') || nameLower.includes('alhikmah') || nameLower.includes('apalara')) {
      return 1300;
    }
    return 1800; 
  };

  // 🌟 Max capacity reduced to 5 seats!
  const getSampleShuttles = () => [
    {
      id: 'ROUTE-1',
      pool_code: 'POL-ALHIKMAH-01',
      route_name: 'Mandate Market ➔ Al-Hikmah / Apalara Route',
      origin_market: 'Mandate Market',
      destination_zone: 'Al-Hikmah / Apalara',
      max_capacity: 5,
      current_orders: 0, 
      base_shuttle_fee: 1300, 
      status: 'OPEN'
    },
    {
      id: 'ROUTE-2',
      pool_code: 'POL-IREWOLEDE-01',
      route_name: 'Mandate Market ➔ Irewolede / Unity Road Route',
      origin_market: 'Mandate Market',
      destination_zone: 'Irewolede / Unity',
      max_capacity: 5,
      current_orders: 0, 
      base_shuttle_fee: 1800, 
      status: 'OPEN'
    },
    {
      id: 'ROUTE-3',
      pool_code: 'POL-UNILORIN-01',
      route_name: 'Mandate Market ➔ Tanke / Unilorin Gate Route',
      origin_market: 'Mandate Market',
      destination_zone: 'Tanke / Unilorin',
      max_capacity: 5,
      current_orders: 0, 
      base_shuttle_fee: 1800, 
      status: 'OPEN'
    },
    {
      id: 'ROUTE-4',
      pool_code: 'POL-CHALLENGE-01',
      route_name: 'Mandate Market ➔ Challenge / Fate Route',
      origin_market: 'Mandate Market',
      destination_zone: 'Challenge / Fate',
      max_capacity: 5,
      current_orders: 0, 
      base_shuttle_fee: 1800, 
      status: 'OPEN'
    }
  ];

  const fetchDeliveryPools = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await shopinApi.getActiveDeliveryPools();
      const data = res.data ? res.data : res;

      if (Array.isArray(data) && data.length > 0) {
        const poolsWithDynamicRates = data.map(pool => ({
          ...pool,
          base_shuttle_fee: getZoneFee(pool.route_name)
        }));
        setDeliveryPools(poolsWithDynamicRates); 
      } else {
        setDeliveryPools(getSampleShuttles());
      }
    } catch (err) {
      console.warn('Failed to fetch live delivery pools, using standards:', err);
      setDeliveryPools(getSampleShuttles()); 
    } finally {
      setLoading(false);
    }
  };

  const handleJoinShuttle = async (pool) => {
    setJoiningId(pool.id);
    setFeedback(null);
    const calculatedFee = pool.base_shuttle_fee || getZoneFee(pool.route_name);

    try {
      await shopinApi.joinDeliveryPool({
        pool_id: pool.id,
        order_id: activeOrderId || 'GUEST-ORDER'
      });

      setFeedback({ 
        type: 'success', 
        text: `Success! Order batched on ${pool.route_name}. Delivery fee locked at ₦${calculatedFee.toLocaleString()}!` 
      });

      if (onShuttleSelected) {
        onShuttleSelected({ ...pool, base_shuttle_fee: calculatedFee });
      }

      fetchDeliveryPools();
    } catch (err) {
      console.warn('API error during join, applying optimistic UI update');
      
      setDeliveryPools(prev => prev.map(p => 
        p.id === pool.id ? { ...p, current_orders: (p.current_orders || 0) + 1 } : p
      ));

      setFeedback({ 
        type: 'success', 
        text: `Batched on ${pool.route_name}! Zone delivery fee locked at ₦${calculatedFee.toLocaleString()}.` 
      });

      if (onShuttleSelected) {
        onShuttleSelected({ ...pool, base_shuttle_fee: calculatedFee });
      }
    } finally {
      setJoiningId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 text-sm">
        <span className="animate-spin inline-block mr-2">⏳</span> Loading active Ilorin express delivery corridors...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 p-4 sm:p-5 rounded-2xl shadow-sm">
        <h2 className="text-base sm:text-lg font-extrabold text-blue-950 flex items-center gap-2">
          <span>🚀</span> Express Delivery Corridors
        </h2>
        <p className="text-xs text-blue-800 mt-1 font-medium">
          Batch your delivery route with other buyers from Mandate Market to lower your dispatch fee to shared zone rates (₦1,300 - ₦1,800).
        </p>
        
        <div className="mt-4 bg-blue-100/80 border border-blue-300 p-3 rounded-xl flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <div className="text-[11px] sm:text-xs text-blue-900 font-semibold leading-relaxed space-y-1">
            <p><b>Strict Operating Hours:</b> Shuttles only operate between <b className="text-blue-950">2:00 PM and 6:00 PM</b>.</p>
            <p><b>Capacity Rule:</b> To maintain these heavily discounted rates, goods will <b className="text-blue-950">ONLY be dispatched when the shuttle reaches full capacity</b>.</p>
          </div>
        </div>
      </div>

      {feedback && (
        <div className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between ${
          feedback.type === 'success' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-red-100 text-red-800'
        }`}>
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="text-xs font-bold ml-2 cursor-pointer">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {deliveryPools.map((pool) => {
          const maxCap = Number(pool.max_capacity || 5); // Fallback changed to 5 as well to match
          const currentOrders = Number(pool.current_orders || 0);
          const capacityLeft = Math.max(0, maxCap - currentOrders);
          const progressPct = Math.min(100, Math.round((currentOrders / maxCap) * 100));
          const displayFee = pool.base_shuttle_fee || getZoneFee(pool.route_name);

          return (
            <div 
              key={pool.id} 
              className="border border-slate-200 rounded-xl p-5 bg-white shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-2 gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                    {pool.pool_code}
                  </span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${
                    capacityLeft === 0 
                      ? 'bg-slate-100 text-slate-600' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {capacityLeft > 0 ? `${capacityLeft} seat${capacityLeft > 1 ? 's' : ''} left` : 'Shuttle Full'}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight mb-1">
                  {pool.route_name}
                </h3>
                <p className="text-xs text-slate-500 mb-3 font-medium">
                  📍 {pool.origin_market || 'Mandate Market'} ➔ {pool.destination_zone}
                </p>

                <div className="w-full bg-slate-100 rounded-full h-2 mb-2 overflow-hidden">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-500 mb-4">
                  <span>{currentOrders} of {maxCap} batched</span>
                  <span className="font-semibold text-blue-700">{progressPct}% capacity</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Zone Shuttle Rate</span>
                  <span className="text-base sm:text-lg font-extrabold text-blue-700">
                    ₦{Number(displayFee).toLocaleString()}
                  </span>
                </div>

                <button
                  onClick={() => handleJoinShuttle(pool)}
                  disabled={capacityLeft <= 0 || joiningId === pool.id}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition disabled:bg-slate-300 disabled:cursor-not-allowed cursor-pointer"
                >
                  {joiningId === pool.id ? 'Boarding...' : capacityLeft > 0 ? 'Batch Delivery' : 'Full'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}