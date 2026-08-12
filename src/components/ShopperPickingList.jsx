import React, { useState, useEffect } from 'react';
import shopinApi from '../services/api';

export default function ShopperPickingList() {
  const [pickingList, setPickingList] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkedItems, setCheckedItems] = useState({});
  const [selectedMarket, setSelectedMarket] = useState('ALL'); // 'ALL' | 'Mandate' | 'Ipata' | 'Sawmill'

  useEffect(() => {
    fetchPickingList();
  }, []);

  const fetchPickingList = async () => {
    try {
      setLoading(true);
      setError(null);

      // Call Route 21: GET /api/shoppers/picking-list
      const response = await shopinApi.getShopperPickingList();
      const data = response.data;

      if (data.status === 'success' && data.data) {
        setPickingList(data.data);
      } else {
        setPickingList(getSamplePickingList());
      }
    } catch (err) {
      console.warn("Using sample picking list data while backend connects:", err);
      setPickingList(getSamplePickingList());
    } finally {
      setLoading(false);
    }
  };

  // Sample fallback data for Ilorin shopper dispatch testing
  const getSamplePickingList = () => ({
    "Foodstuff": [
      {
        name: "Garri Ijebu",
        quantity: 2,
        unit: "paint_rubber",
        sourcing_info: "Sourced from Mandate Market (Fallback: Ipata Market)",
        primary_market: "Mandate",
        fallback_market: "Ipata"
      },
      {
        name: "Foreign Rice",
        quantity: 1,
        unit: "congo",
        sourcing_info: "Sourced from Sawmill Market (Fallback: Mandate Market)",
        primary_market: "Sawmill",
        fallback_market: "Mandate"
      }
    ],
    "Fresh Produce": [
      {
        name: "Yam (Laboko)",
        quantity: 5,
        unit: "tuber",
        sourcing_info: "Sourced from Ipata Market (Fallback: Mandate Market)",
        primary_market: "Ipata",
        fallback_market: "Mandate"
      }
    ],
    "Poultry / Livestock": [
      {
        name: "Fresh Eggs",
        quantity: 2,
        unit: "crate",
        sourcing_info: "Sourced from Mandate Market (Fallback: Ipata Market)",
        primary_market: "Mandate",
        fallback_market: "Ipata"
      }
    ]
  });

  const toggleCheck = (category, idx) => {
    const key = `${category}-${idx}`;
    setCheckedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const categories = Object.keys(pickingList);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 text-sm">
        <span className="animate-spin inline-block mr-2">⏳</span> Loading active shopper picking lists...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dispatcher Notice Header */}
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-amber-900 flex items-center gap-2">
            <span>📋</span> Shopper Master Picking List (Ilorin Markets)
          </h2>
          <p className="text-xs text-amber-700 mt-1">
            Aggregated pending order items grouped by category. Sourced primarily from Mandate Market with Ipata/Sawmill fallbacks.
          </p>
        </div>
        <button
          onClick={fetchPickingList}
          className="text-xs bg-amber-200 hover:bg-amber-300 text-amber-900 font-bold px-3 py-1.5 rounded-lg transition cursor-pointer shrink-0"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Filter by Primary Market */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] shrink-0">Filter Sourcing:</span>
        {['ALL', 'Mandate', 'Ipata', 'Sawmill'].map((market) => (
          <button
            key={market}
            onClick={() => setSelectedMarket(market)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer border whitespace-nowrap ${
              selectedMarket === market
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {market === 'ALL' ? 'All Hubs' : `${market} Market`}
          </button>
        ))}
      </div>

      {/* Picking List Content */}
      {categories.length === 0 ? (
        <div className="p-8 border border-dashed border-slate-300 rounded-xl text-center text-slate-500 text-xs">
          No active items to pick. All orders are fulfilled!
        </div>
      ) : (
        <div className="space-y-5">
          {categories.map((category) => {
            const items = pickingList[category] || [];
            
            // Apply market filtering
            const filteredItems = items.filter(item => {
              if (selectedMarket === 'ALL') return true;
              return item.primary_market === selectedMarket || item.fallback_market === selectedMarket;
            });

            if (filteredItems.length === 0) return null;

            return (
              <div key={category} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                {/* Category Header */}
                <div className="bg-slate-100/80 px-4 py-2.5 border-b border-slate-200 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 text-xs sm:text-sm uppercase tracking-wider">
                    📦 {category}
                  </h3>
                  <span className="text-xs font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {filteredItems.length} item{filteredItems.length > 1 ? 's' : ''}
                  </span>
                </div>

                {/* Category Items List */}
                <div className="divide-y divide-slate-100">
                  {filteredItems.map((item, idx) => {
                    const isChecked = !!checkedItems[`${category}-${idx}`];

                    return (
                      <div
                        key={idx}
                        onClick={() => toggleCheck(category, idx)}
                        className={`p-3 sm:p-4 flex items-center justify-between transition cursor-pointer hover:bg-slate-50/80 ${
                          isChecked ? 'bg-emerald-50/40 opacity-60' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3 flex-1">
                          {/* 🌟 FIX: Added readOnly and pointer-events-none to stop the double-click bug */}
                          <input
                            type="checkbox"
                            checked={isChecked}
                            readOnly
                            className="mt-1 w-4 h-4 accent-emerald-600 rounded cursor-pointer pointer-events-none"
                          />
                          <div>
                            <h4 className={`font-bold text-sm ${isChecked ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                              {item.quantity} {item.unit?.replace('_', ' ')} x {item.name}
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded text-[10px]">
                                📍 {item.primary_market || 'Mandate'}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                (Fallback: <span className="font-medium text-slate-600">{item.fallback_market || 'Ipata'}</span>)
                              </span>
                            </p>
                          </div>
                        </div>

                        {/* Item Pick Status Tag */}
                        <div className="ml-2">
                          {isChecked ? (
                            <span className="text-xs bg-emerald-600 text-white font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                              ✓ Picked
                            </span>
                          ) : (
                            <span className="text-xs bg-slate-100 text-slate-600 font-semibold px-2.5 py-1 rounded-full border border-slate-200">
                              Pending
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}