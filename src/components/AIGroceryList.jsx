import React, { useState } from 'react';
import shopinApi from '../services/api';

export default function AIGroceryList({ onAddToCart, openCheckout }) {
  const [mode, setMode] = useState('grocery'); // 'grocery' | 'errand'
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [parsedResult, setParsedResult] = useState(null);

  // Helper function to sanitize raw item titles & extract quantity if embedded
  const sanitizeItemAndExtractQty = (rawName, originalQty) => {
    if (!rawName) return { cleanName: '', qty: originalQty || 1 };
    let clean = rawName.trim();

    let extractedQty = originalQty || 1;

    // 1. Check if the string starts with a number (e.g., "2 Paint Garri" or "5 Tubers")
    const leadingNumberMatch = clean.match(/^(\d+)\s*(?:x|X)?\s*/);
    if (leadingNumberMatch) {
      extractedQty = parseInt(leadingNumberMatch[1], 10);
      clean = clean.replace(/^(\d+)\s*(?:x|X)?\s*/, '');
    }

    // 2. Remove measurement words and modifiers
    const unitWords = [
      'paint rubber', 'paint', 'rubber', 'tuber', 'tubers', 'mudu', 'module', 'congo',
      'cup', 'tin', 'tins', 'bag', 'bags', 'kg', 'unit', 'units', 'pieces', 'piece',
      'crate', 'crates', 'keg', 'kegs', 'litres', 'liter', 'liters', 'l', 'cl',
      'pack', 'packs', 'carton', 'cartons', 'basket', 'sachet', 'sachets', 'refilled'
    ];
    
    unitWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      clean = clean.replace(regex, '');
    });

    // 3. Cleanup extra spaces and leading "of"
    clean = clean
      .replace(/\(\s*\d*\s*\)/g, '')
      .replace(/^\s*of\s+/i, '')
      .replace(/\s+/g, ' ')
      .trim();

    return {
      cleanName: clean || rawName,
      qty: extractedQty
    };
  };

  // Presets for Grocery Mode
  const groceryPresets = [
    "2 paint rubber garri ijebu and 5 tubers of yam",
    "2 packs of Dangote Spaghetti, 1 keg of Power Oil, and 1 crate of eggs",
    "500 naira tomatoes, 300 naira ewedu, and 1kg chicken"
  ];

  // Presets for Custom Errand Mode
  const errandPresets = [
    "Buy 2 bags of specialized fish feed from Challenge and deliver to Tanke",
    "Pick up document package at Post Office and bring to Taiwo Road",
    "Buy fresh catfish 3kg at Ipata Market and drop at Unilorin gate"
  ];

  const currentPresets = mode === 'grocery' ? groceryPresets : errandPresets;

  const handleParse = async () => {
    if (!inputText.trim() || loading) return; 
    setLoading(true);
    setError(null);

    try {
      const queryText = mode === 'errand' && !inputText.toLowerCase().includes('errand')
        ? `[SPECIAL ERRAND REQUEST]: ${inputText}`
        : inputText;

      const response = await shopinApi.parseGroceryList(queryText);
      const data = response.data;

      const rawItemsList = data.parsed_data?.items || data.items || [];

      // Clean item titles and automatically extract quantities if embedded
      const cleanedItemsList = rawItemsList.map((item, idx) => {
        const rawTitle = item.item_name || item.name || '';
        const { cleanName, qty } = sanitizeItemAndExtractQty(rawTitle, item.quantity);

        return {
          ...item,
          id: item.id || `item_${Date.now()}_${idx}`,
          item_name: cleanName,
          brand_or_variant: item.brand_or_variant || item.brand || '',
          quantity: Math.max(1, qty),
          unit: item.unit || 'unit',
          category: item.category || (mode === 'errand' ? 'Custom Errand' : 'General Foodstuff')
        };
      });

      if ((data.status === 'success' || data.success) && cleanedItemsList.length > 0) {
        setParsedResult({
          items: cleanedItemsList,
          is_service_request: data.parsed_data?.is_service_request || mode === 'errand',
          ...(data.parsed_data || {})
        });
      } else if (cleanedItemsList.length > 0) {
        setParsedResult({ 
          items: cleanedItemsList,
          is_service_request: mode === 'errand'
        });
      } else {
        throw new Error(data.error || data.message || 'Could not interpret request');
      }
    } catch (err) {
      console.error("Parsing Error:", err);
      
      if (!err.response || err.message === 'Network Error') {
        setError("🚨 Whoops! Our Kwara Market servers are currently offline or restarting. Please check your internet or call our emergency support line at 081-4308-6509.");
      } else {
        setError("Could not understand that list. Please check your spelling and try again.");
      }
    } finally {
      setLoading(false); // 👈 Fixed from setIsLoading to setLoading
    }
  };

  const handleAddNewItem = () => {
    if (!parsedResult) return;
    const newItem = {
      item_name: 'New Item',
      brand_or_variant: '',
      quantity: 1,
      unit: 'unit',
      category: mode === 'errand' ? 'Custom Errand' : 'General Foodstuff'
    };
    setParsedResult({
      ...parsedResult,
      items: [...(parsedResult.items || []), newItem]
    });
  };

  const handleProceedToCheckout = () => {
    if (parsedResult?.items && parsedResult.items.length > 0) {
      const normalizedItems = parsedResult.items.map((item) => ({
        ...item,
        name: item.item_name || item.name || 'Grocery Item',
        item_name: item.item_name || item.name || 'Grocery Item',
        brand_or_variant: item.brand_or_variant || item.brand || '',
        quantity: Math.max(1, Number(item.quantity) || 1),
        unit: item.unit || 'unit',
        is_service_request: parsedResult.is_service_request || false
      }));

      if (onAddToCart) {
        onAddToCart(normalizedItems);
      }
      if (openCheckout) {
        openCheckout();
      }
    }
  };

  return (
    <div className="space-y-5">
      {/* Mode Selector Toggle */}
      <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
        <button
          onClick={() => {
            setMode('grocery');
            setInputText('');
            setParsedResult(null);
          }}
          className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
            mode === 'grocery' 
              ? 'bg-white text-emerald-800 shadow-xs font-bold' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          🛒 Standard Grocery List
        </button>
        <button
          onClick={() => {
            setMode('errand');
            setInputText('');
            setParsedResult(null);
          }}
          className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
            mode === 'errand' 
              ? 'bg-white text-blue-800 shadow-xs font-bold' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          🚚 Custom Errand / Special Request
        </button>
      </div>

      {/* Quick Presets */}
      <div>
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
          {mode === 'grocery' ? 'Try Grocery Examples' : 'Try Custom Errand Examples'}
        </label>
        <div className="flex flex-wrap gap-2">
          {currentPresets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInputText(preset);
                setError(null);
              }}
              className={`text-xs border px-3 py-1.5 rounded-lg transition-colors text-left cursor-pointer ${
                mode === 'grocery' 
                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200' 
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-200'
              }`}
            >
              "{preset}"
            </button>
          ))}
        </div>
      </div>

      {/* Text Area */}
      <div>
        <textarea
          rows="4"
          value={inputText}
          onChange={(e) => {
            setInputText(e.target.value);
            if (error) setError(null);
          }}
          placeholder={
            mode === 'grocery'
              ? "Type or paste your market list here (e.g., '2 paint garri ijebu and 5 tubers of yam')..."
              : "Describe your custom errand (e.g., 'Buy 2 bags of specialized fish feed from Challenge and deliver to Tanke')..."
          }
          className={`w-full p-3.5 border rounded-xl focus:ring-2 outline-none text-slate-800 text-sm transition-all shadow-xs ${
            mode === 'grocery'
              ? 'border-slate-300 focus:ring-emerald-500 focus:border-emerald-500'
              : 'border-blue-200 focus:ring-blue-500 focus:border-blue-500 bg-blue-50/20'
          }`}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button 
            onClick={handleParse} 
            className="underline font-bold text-red-800 hover:text-red-900 ml-2 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={handleParse}
        disabled={loading || !inputText.trim()}
        className={`w-full disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 text-sm cursor-pointer ${
          mode === 'grocery' 
            ? 'bg-emerald-600 hover:bg-emerald-700' 
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {loading ? (
          <>
            <span className="animate-spin">⏳</span> Processing with Gemini AI...
          </>
        ) : (
          <>
            <span>✨</span> {mode === 'grocery' ? 'Parse Grocery List' : 'Process Custom Request'}
          </>
        )}
      </button>

      {/* Parsed Output Display */}
      {parsedResult && (
        <div className="mt-6 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span>📋</span> Review & Edit Request
            </h4>
            <div className="flex items-center gap-2">
              {parsedResult.is_service_request && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                  🚀 Special Errand Detected
                </span>
              )}
              <button 
                onClick={() => setParsedResult(null)}
                className="text-xs text-red-600 hover:underline font-medium cursor-pointer"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* VISUAL MEASUREMENT REFERENCE GUIDE RIBBON */}
          {mode === 'grocery' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
              <p className="text-xs font-bold text-emerald-800 mb-1.5 flex items-center gap-1">
                <span>💡</span> Standard Ilorin Measurement Guide:
              </p>
              <div className="flex flex-wrap gap-1.5 text-[11px]">
                <span className="bg-white px-2 py-0.5 rounded-md border border-emerald-200 text-emerald-900 font-medium">
                  🥛 <b>Milk Tin</b> (1 Cup)
                </span>
                <span className="bg-white px-2 py-0.5 rounded-md border border-emerald-200 text-emerald-900 font-medium">
                  🥣 <b>Mudu / Module</b> (8 Tins)
                </span>
                <span className="bg-white px-2 py-0.5 rounded-md border border-emerald-200 text-emerald-900 font-medium">
                  🪣 <b>Paint Rubber</b> (3 Mudus + 2 Tins)
                </span>
                <span className="bg-white px-2 py-0.5 rounded-md border border-emerald-200 text-emerald-900 font-medium">
                  🥔 <b>Tuber</b> (Single Yam)
                </span>
                <span className="bg-white px-2 py-0.5 rounded-md border border-emerald-200 text-emerald-900 font-medium">
                  🥚 <b>Crate</b> (Eggs)
                </span>
                <span className="bg-white px-2 py-0.5 rounded-md border border-emerald-200 text-emerald-900 font-medium">
                  🛢️ <b>1 Keg</b> (25 Litres)
                </span>
                <span className="bg-white px-2 py-0.5 rounded-md border border-emerald-200 text-emerald-900 font-medium">
                  📦 <b>1/4 Bag</b> (3 Paint Rubbers)
                </span>
              </div>
            </div>
          )}

          {/* Special Errand Notification Banner */}
          {parsedResult.is_service_request && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-center justify-between">
              <div>
                <p className="font-bold">Dispatch Errand Service Applied</p>
                <p className="text-blue-700 mt-0.5">Standard ₦500 service fee + delivery fee (₦1,500 - ₦3,000 depending on your selected route corridor) will be calculated at checkout.</p>
              </div>
              <span className="text-xl">🛵</span>
            </div>
          )}

          {/* Parsed Items List with Brand Selector */}
          <div className="space-y-2">
            {parsedResult.items?.map((item, index) => (
              <div
                key={index}
                className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-sm shadow-2xs gap-3"
              >
                {/* Item Name & Brand Input */}
                <div className="flex-1 space-y-1">
                  <input
                    type="text"
                    value={item.item_name || ''}
                    onChange={(e) => {
                      const updated = [...parsedResult.items];
                      updated[index].item_name = e.target.value;
                      setParsedResult({ ...parsedResult, items: updated });
                    }}
                    placeholder="Item Name (e.g. Spaghetti)"
                    className="font-bold text-slate-800 capitalize border-b border-transparent hover:border-slate-300 focus:border-emerald-500 outline-none w-full text-xs sm:text-sm"
                  />
                  
                  {/* Brand / Variant Selector Input */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide">Brand:</span>
                    <input
                      type="text"
                      value={item.brand_or_variant || ''}
                      onChange={(e) => {
                        const updated = [...parsedResult.items];
                        updated[index].brand_or_variant = e.target.value;
                        setParsedResult({ ...parsedResult, items: updated });
                      }}
                      placeholder="e.g. Dangote, Golden Penny, Power Oil, Peak"
                      className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-0.5 w-full focus:bg-white focus:border-emerald-500 outline-none font-medium"
                    />
                  </div>
                </div>

                {/* Quantity & Unit Controls */}
                <div className="flex items-center gap-2 justify-between sm:justify-end">
                  {/* Quantity Counter */}
                  <div className="flex items-center border border-slate-200 rounded-md overflow-hidden bg-slate-50">
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...parsedResult.items];
                        const step = updated[index].unit === 'naira_value' ? 100 : 1;
                        if (updated[index].quantity > step) {
                          updated[index].quantity = Number(updated[index].quantity) - step;
                          setParsedResult({ ...parsedResult, items: updated });
                        }
                      }}
                      className="px-2 py-1 text-slate-600 hover:bg-slate-200 font-bold cursor-pointer"
                    >
                      -
                    </button>
                    
                    <input
                      type="number"
                      value={item.quantity || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const updated = [...parsedResult.items];
                        updated[index].quantity = val === '' ? '' : Math.max(1, parseInt(val, 10));
                        setParsedResult({ ...parsedResult, items: updated });
                      }}
                      className="w-14 text-center text-xs font-bold text-slate-800 bg-transparent outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500 py-1"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...parsedResult.items];
                        const step = updated[index].unit === 'naira_value' ? 100 : 1;
                        updated[index].quantity = Number(updated[index].quantity || 0) + step;
                        setParsedResult({ ...parsedResult, items: updated });
                      }}
                      className="px-2 py-1 text-slate-600 hover:bg-slate-200 font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  {/* Kwara Unit Selector Dropdown (Includes Crate for Eggs) */}
                  <select
                    value={item.unit || 'unit'}
                    onChange={(e) => {
                      const updated = [...parsedResult.items];
                      updated[index].unit = e.target.value;
                      setParsedResult({ ...parsedResult, items: updated });
                    }}
                    className="bg-slate-50 border border-slate-300 text-slate-700 text-xs rounded-md p-1 font-semibold focus:ring-1 focus:ring-emerald-500 outline-none cursor-pointer"
                  >
                    <optgroup label="Grains & Beans">
                      <option value="cup">Cup / Tin</option>
                      <option value="module">Module / Mudu / Congo</option>
                      <option value="paint_rubber">Paint Rubber</option>
                      <option value="1/8_bag">1/8 Bag (6.25kg)</option>
                      <option value="1/4_bag">1/4 Bag (12.5kg)</option>
                      <option value="half_bag">1/2 Bag (25kg)</option>
                      <option value="full_bag">1 Bag (50kg)</option>
                    </optgroup>
                    <optgroup label="Oils & Liquids">
                      <option value="75cl">75cl</option>
                      <option value="5_litres">5 Litres</option>
                      <option value="12.5_litres">12.5 Litres</option>
                      <option value="25_litres">25 Litres</option>
                    </optgroup>
                    <optgroup label="Produce & Proteins">
                      <option value="crate">Crate (Eggs)</option>
                      <option value="basket">Basket</option>
                      <option value="half_basket">Half Basket</option>
                      <option value="naira_value">Custom ₦ Amount</option>
                    </optgroup>
                    <optgroup label="Pasta & Other">
                      <option value="carton">Carton (20 Units)</option>
                      <option value="pack">Pack</option>
                      <option value="kg">Kg (Meat/Fish)</option>
                      <option value="pieces">Pieces (Wara/Yam/SweetPotato)</option>
                    </optgroup>
                    <optgroup label="Miscellaneous">
                      <option value="sachet">Sachet</option>
                      <option value="refilled">Refilled</option>
                      <option value="unit">Unit</option>
                    </optgroup>
                  </select>

                  <button
                    type="button"
                    onClick={() => {
                      const updated = parsedResult.items.filter((_, i) => i !== index);
                      setParsedResult(updated.length > 0 ? { ...parsedResult, items: updated } : null);
                    }}
                    className="text-red-500 hover:text-red-700 text-xs font-bold p-1 ml-1 cursor-pointer"
                    title="Remove Item"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Item & Checkout Buttons */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleAddNewItem}
              className="px-3 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg text-xs transition-all cursor-pointer"
            >
              + Add Item
            </button>
            <button 
              type="button"
              onClick={handleProceedToCheckout}
              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-lg text-xs transition-all cursor-pointer"
            >
              Get Price Quote & Checkout →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}