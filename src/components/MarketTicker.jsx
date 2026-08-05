import React, { useState, useEffect } from 'react';
import shopinApi from '../services/api';

export default function MarketTicker() {
  const [prices, setPrices] = useState([
    { item_name: 'Garri Ijebu', unit: 'paint_rubber', min_price_ngn: 2800, max_price_ngn: 3200, sourcing_market: 'Mandate' },
    { item_name: 'Yellow Garri', unit: 'paint_rubber', min_price_ngn: 2500, max_price_ngn: 2900, sourcing_market: 'Mandate' },
    { item_name: 'Yam', unit: 'tuber', min_price_ngn: 1800, max_price_ngn: 2400, sourcing_market: 'Ago Market' },
    { item_name: 'Rice (Foreign)', unit: 'derica', min_price_ngn: 1100, max_price_ngn: 1300, sourcing_market: 'Mandate' },
    { item_name: 'Beans (Oloyin)', unit: 'congo', min_price_ngn: 3000, max_price_ngn: 3400, sourcing_market: 'Ganmo Market' }
  ]);

  useEffect(() => {
    fetchPrices();
  }, []);

  const fetchPrices = async () => {
    try {
      const res = await shopinApi.getMarketTicker();
      const data = res.data;
      if (data.status === 'success' && Array.isArray(data.data) && data.data.length > 0) {
        setPrices(data.data);
      }
    } catch (err) {
      console.warn("Using live local market price defaults:", err);
    }
  };

  return (
    <div className="bg-slate-900 text-slate-100 text-xs py-2 px-4 shadow-inner overflow-hidden border-b border-slate-800">
      <div className="max-w-6xl mx-auto flex items-center gap-3">
        {/* Ticker Badge */}
        <div className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-bold whitespace-nowrap shrink-0 z-10">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          LIVE MARKET TICKER
        </div>

        {/* Scrolling Ticker Line */}
        <div className="flex items-center gap-6 overflow-x-auto no-scrollbar whitespace-nowrap py-0.5 scroll-smooth">
          {prices.map((item, idx) => (
            <div key={idx} className="flex items-center gap-1.5 text-slate-300 shrink-0">
              <span className="font-semibold text-white capitalize">{item.item_name}</span>
              <span className="text-slate-400 text-[11px]">({item.unit ? item.unit.replace('_', ' ') : 'unit'})</span>
              <span className="font-bold text-emerald-400">
                ₦{Number(item.min_price_ngn || 0).toLocaleString()} - ₦{Number(item.max_price_ngn || 0).toLocaleString()}
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
                {item.sourcing_market || 'Mandate'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}