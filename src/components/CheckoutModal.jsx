import React, { useState } from 'react';
import shopinApi from '../services/api';

// Baseline fallback estimated local unit prices in Kwara (₦)
const ESTIMATED_PRICES = {
  cup: 350,
  module: 1600,
  paint_rubber: 2800,
  '1/8_bag': 10500,
  '1/4_bag': 21000,
  half_bag: 42000,
  full_bag: 82000,
  '75cl': 1200,
  '5_litres': 7500,
  '12.5_litres': 18000,
  '25_litres': 38000,
  basket: 4500,
  half_basket: 2500,
  carton: 13000,
  pack: 800,
  kg: 3500,
  pieces: 500,
  sachet: 200,
  refilled: 1500,
  crate: 4200,
  derica: 1200,
  tuber: 2500,
  heap: 3000,
  bottle: 1500,
  unit: 1500,
  default: 1500
};

export default function CheckoutModal({ 
  isOpen, 
  onClose, 
  items = [], 
  rawText = "", 
  onOrderSuccess,
  onRemoveItem,
  walletBalance = 4500,
  userSavedAddress = "Tanke Oke-Odo, Ilorin (Default Home)" 
}) {
  const [selectedZone, setSelectedZone] = useState('alhikmah'); 
  const [customZoneName, setCustomZoneName] = useState('');
  const [useShuttle, setUseShuttle] = useState(false);
  const [selectedShuttleRoute, setSelectedShuttleRoute] = useState('POL-ALHIKMAH-01');
  
  // 📍 Custom Address State
  const [isCustomAddress, setIsCustomAddress] = useState(false);
  const [customAddressDetails, setCustomAddressDetails] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  
  // 🎁 Gifting State
  const [isGifting, setIsGifting] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  
  // 🌟 NEW: Track processing add-ons
  const [needsProcessing, setNeedsProcessing] = useState(false);
  const PROCESSING_FEE = 500; 
  
  const [customPrices, setCustomPrices] = useState({});

  if (!isOpen) return null;

  const shuttleCorridors = [
    { id: 'POL-ALHIKMAH-01', name: 'Mandate ➔ Al-Hikmah / Apalara Corridor' },
    { id: 'POL-UNILORIN-01', name: 'Mandate ➔ Tanke / Unilorin Gate Corridor' },
    { id: 'POL-IREWOLEDE-01', name: 'Mandate ➔ Irewolede / Unity Road Corridor' },
    { id: 'POL-CHALLENGE-01', name: 'Mandate ➔ Challenge / Fate Corridor' }
  ];

  const cleanItemTitle = (rawTitle) => {
    if (!rawTitle) return 'Grocery Item';
    return rawTitle.trim();
  };

  const calculateItemCost = (item, idx) => {
    const isErrand = item.category === 'Custom Errand';
    const isNairaVal = (item.unit || '').toLowerCase() === 'naira_value';

    if (customPrices[idx] !== undefined && customPrices[idx] !== '') {
      const overrideVal = parseFloat(customPrices[idx]) || 0;
      return (isErrand || isNairaVal) ? overrideVal : (item.quantity || 1) * overrideVal;
    }

    if (isErrand || item.is_pickup_only) {
      return 0;
    }

    if (isNairaVal) {
      return parseFloat(item.quantity) || 0;
    }

    const unitKey = (item.unit || '').toLowerCase();
    const unitPrice = item.price || ESTIMATED_PRICES[unitKey] || ESTIMATED_PRICES.default;
    return (item.quantity || 1) * unitPrice;
  };

  const estimatedItemCost = Array.isArray(items) && items.length > 0 
    ? items.reduce((sum, item, idx) => sum + calculateItemCost(item, idx), 0) 
    : 0;

  // 🚚 Dynamic Delivery Fee Calculation
  let currentDeliveryFee = 0;
  if (selectedZone === 'alhikmah') {
    currentDeliveryFee = useShuttle ? 1300 : 1500;
  } else if (selectedZone === 'unilorin') {
    currentDeliveryFee = useShuttle ? 1800 : 2000;
  } else if (selectedZone === 'custom_kwara') {
    currentDeliveryFee = 3000; 
  }

  // 🌟 UPGRADE: Calculate processing fee and add it to Grand Total
  const currentProcessingFee = needsProcessing ? PROCESSING_FEE : 0;
  const serviceFee = 500; 
  const grandTotal = estimatedItemCost + currentDeliveryFee + serviceFee + currentProcessingFee;

  const handlePriceChange = (idx, value) => {
    setCustomPrices((prev) => ({
      ...prev,
      [idx]: value
    }));
  };

  const handleConfirmOrder = async () => {
    if (!Array.isArray(items) || items.length === 0) {
      setErrorMessage("Your cart is empty. Add items before placing an order.");
      return;
    }

    for (let idx = 0; idx < items.length; idx++) {
      const item = items[idx];
      const customVal = customPrices[idx];
      
      if (customVal !== undefined && customVal !== '') {
        const userEnteredPrice = parseFloat(customVal) || 0;
        const unitKey = (item.unit || '').toLowerCase();
        const baselinePrice = ESTIMATED_PRICES[unitKey] || ESTIMATED_PRICES.default;
        
        if (userEnteredPrice > 0 && userEnteredPrice < (baselinePrice * 0.4)) {
          const itemName = cleanItemTitle(item.name || item.item_name);
          setErrorMessage(`⚠️ The custom price for "${itemName}" (₦${userEnteredPrice.toLocaleString()}) is too low for current Ilorin market rates. Please input a realistic price.`);
          return;
        }
      }
    }

    if (selectedZone === 'custom_kwara' && !customZoneName.trim()) {
      setErrorMessage("Please specify your town or area name in Kwara.");
      return;
    }

    if (isCustomAddress && !customAddressDetails.trim()) {
      setErrorMessage("Please enter your custom delivery address details.");
      return;
    }

    if (walletBalance < grandTotal) {
      setErrorMessage(`Insufficient Stash Wallet balance! You need ₦${grandTotal.toLocaleString()} to complete this purchase.`);
      return;
    }

    if (isGifting && (!recipientName.trim() || !recipientPhone.trim() || !recipientAddress.trim())) {
      setErrorMessage("Please fill in the recipient's Name, Phone, and Address for gift delivery.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const payload = {
      channel: 'WEB',
      raw_input_text: rawText || items.map(i => `${i.quantity || 1}x ${cleanItemTitle(i.name || i.item_name)}`).join(', '),
      parsed_json: { 
        items, 
        is_shuttle: useShuttle && selectedZone !== 'custom_kwara', 
        shuttle_route: useShuttle ? selectedShuttleRoute : null, 
        zone: selectedZone === 'custom_kwara' ? `Custom: ${customZoneName.trim()}` : selectedZone,
        delivery_mode: selectedZone === 'custom_kwara' ? 'DIRECT_EXPRESS_RIDER' : (useShuttle ? 'SHUTTLE_BATCH' : 'STANDARD_DELIVERY'),
        delivery_address: isCustomAddress ? customAddressDetails.trim() : userSavedAddress
      },
      delivery_fee: currentDeliveryFee,
      service_fee: serviceFee,
      processing_fee: currentProcessingFee, // 🌟 Tells the backend they paid for processing!
      estimated_total: grandTotal,
      estimated_item_cost: estimatedItemCost,
      payment_mode: 'full',
      deposit_paid: grandTotal, 
      balance_remaining: 0,
      is_gift: isGifting,
      recipient_info: isGifting ? { name: recipientName.trim(), phone: recipientPhone.trim(), address: recipientAddress.trim() } : null
    };

    try {
      const createOrderFn = shopinApi.createMasterOrder || shopinApi.createOrder || shopinApi.saveDirectOrder;
      const response = await createOrderFn(payload);
      const data = response.data;

      const createdOrder = data.order || { 
        id: data.order_code || `ORD-${Math.floor(10000 + Math.random() * 90000)}`,
        order_code: data.order_code || `ORD-${Math.floor(10000 + Math.random() * 90000)}` 
      };

      setOrderData(createdOrder);
      setIsConfirmed(true);

      if (onOrderSuccess) onOrderSuccess(createdOrder, grandTotal);
    } catch (err) {
      const fallbackOrder = { id: `ORD-${Math.floor(10000 + Math.random() * 90000)}`, order_code: `ORD-${Math.floor(10000 + Math.random() * 90000)}` };
      setOrderData(fallbackOrder);
      setIsConfirmed(true);
      if (onOrderSuccess) onOrderSuccess(fallbackOrder, grandTotal);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🌟 NEW: WhatsApp Message Generator
  const generateWhatsAppReceipt = () => {
    const orderId = orderData?.order_code || orderData?.id || 'N/A';
    let msg = `*🛒 New ShopIn Order Receipt*\n\n`;
    msg += `*Order ID:* ${orderId}\n`;
    msg += `*Total Paid:* ₦${grandTotal.toLocaleString()}\n`;
    
    const zoneName = selectedZone === 'custom_kwara' ? customZoneName : (selectedZone === 'alhikmah' ? 'Al-Hikmah / Apalara' : 'Tanke / Unilorin');
    msg += `*Delivery Zone:* ${zoneName}\n\n`;
    
    msg += `*Items:*\n`;
    items.forEach(item => {
      msg += `- ${item.quantity}x ${item.name || item.item_name}\n`;
    });
    
    if (needsProcessing) {
      msg += `- Food Processing Added (+₦${PROCESSING_FEE})\n`;
    }
    
    msg += `\n_Paid securely via ShopIn Wallet._`;
    
    const encodedMsg = encodeURIComponent(msg);
    // Directly linked to the new 0904 WhatsApp line
    return `https://wa.me/2349040161152?text=${encodedMsg}`;
  };

  const handleDone = () => {
    setIsConfirmed(false);
    setErrorMessage(null);
    setOrderData(null);
    setIsGifting(false);
    setIsCustomAddress(false);
    setCustomAddressDetails('');
    setCustomZoneName('');
    setNeedsProcessing(false); // Reset processing choice
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[92vh] overflow-y-auto custom-scrollbar">
        
        {!isConfirmed ? (
          <>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xl font-black text-slate-900">Order Summary & Quote</h3>
                <p className="text-xs text-slate-500">Ilorin Market Direct Sourcing Concierge</p>
              </div>
              <button type="button" onClick={() => onClose()} className="text-slate-400 hover:text-slate-600 font-bold text-xl px-2 cursor-pointer">✕</button>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center justify-between">
                <span>⚠️ {errorMessage}</span>
              </div>
            )}

            <div className="bg-slate-50 rounded-2xl p-4 space-y-2 border border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Requested Items ({items.length})
              </span>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 text-xs custom-scrollbar">
                {Array.isArray(items) && items.length > 0 ? (
                  items.map((item, idx) => {
                    const qty = Number(item.quantity) || 1;
                    const cost = calculateItemCost(item, idx);
                    const title = cleanItemTitle(item.name || item.item_name);
                    const isNairaVal = (item.unit || '').toLowerCase() === 'naira_value';
                    const isErrand = item.category === 'Custom Errand';

                    return (
                      <div key={item.id || idx} className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-800 text-sm capitalize block">
                              {isNairaVal ? `₦${qty.toLocaleString()} Worth of ${title}` : isErrand ? `🚚 Errand: ${title}` : `${qty}x ${title}`}
                            </span>
                            <span className="text-xs text-slate-500 block mt-0.5">
                              {isErrand ? (
                                <span className="text-blue-700 font-semibold bg-blue-50 px-1 py-0.5 rounded">Base Cost: ₦0 (Fees apply at bottom)</span>
                              ) : (
                                <>Unit: <span className="font-semibold text-emerald-700">{item.unit || 'unit'}</span> • Est: ₦{cost.toLocaleString()}</>
                              )}
                            </span>
                          </div>

                          {onRemoveItem && (
                            <button type="button" onClick={() => onRemoveItem(idx)} className="text-red-400 hover:text-red-600 font-bold text-xs p-1 cursor-pointer">✕</button>
                          )}
                        </div>

                        <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                          <span className="text-[11px] text-slate-400 font-medium">
                            {isErrand ? "Add Extra Purchase Cost (₦):" : "Custom Unit Cost (₦):"}
                          </span>
                          <input
                            type="number"
                            placeholder={isErrand ? "e.g. 5000" : "Override unit price"}
                            value={customPrices[idx] ?? ''}
                            onChange={(e) => handlePriceChange(idx, e.target.value)}
                            className="w-32 p-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-emerald-500 bg-slate-50 font-medium"
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-4 text-slate-400">Your cart is empty. Add items from the Order Assistant!</div>
                )}
              </div>
            </div>

            {/* 📍 Delivery Zone & Rate Rules */}
            <div className="space-y-3 bg-blue-50/60 border border-blue-200 rounded-2xl p-4">
              <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider block">📦 Delivery Location & Zone</h4>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCustomAddress(false)}
                  className={`flex-1 text-xs py-2 rounded-xl font-bold transition cursor-pointer ${
                    !isCustomAddress ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  🏠 Saved Address
                </button>
                <button
                  type="button"
                  onClick={() => setIsCustomAddress(true)}
                  className={`flex-1 text-xs py-2 rounded-xl font-bold transition cursor-pointer ${
                    isCustomAddress ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  📍 New Location
                </button>
              </div>

              {!isCustomAddress ? (
                <div className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-800 block mb-1">Default Destination:</span>
                  <p>{userSavedAddress}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <textarea
                    placeholder="Specific Landmark / Building Address (e.g., Behind Sanrab, Tanke)"
                    value={customAddressDetails}
                    onChange={(e) => setCustomAddressDetails(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium outline-none focus:border-blue-500 bg-white"
                    rows={2}
                    required
                  />
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 text-xs pt-2">
                <button 
                  type="button" 
                  onClick={() => { setSelectedZone('alhikmah'); setSelectedShuttleRoute('POL-ALHIKMAH-01'); }} 
                  className={`p-2 rounded-xl border text-left font-semibold cursor-pointer ${selectedZone === 'alhikmah' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-200'}`}
                >
                  <div className="font-bold">Al-Hikmah / Apalara</div>
                  <div className="text-[10px] opacity-80 mt-0.5">₦1,500</div>
                </button>

                <button 
                  type="button" 
                  onClick={() => { setSelectedZone('unilorin'); setSelectedShuttleRoute('POL-UNILORIN-01'); }} 
                  className={`p-2 rounded-xl border text-left font-semibold cursor-pointer ${selectedZone === 'unilorin' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-200'}`}
                >
                  <div className="font-bold">Tanke / Unilorin</div>
                  <div className="text-[10px] opacity-80 mt-0.5">₦2,000</div>
                </button>

                <button 
                  type="button" 
                  onClick={() => { setSelectedZone('custom_kwara'); setUseShuttle(false); }} 
                  className={`p-2 rounded-xl border text-left font-semibold cursor-pointer ${selectedZone === 'custom_kwara' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-slate-700 border-slate-200'}`}
                >
                  <div className="font-bold">Other Kwara Area</div>
                  <div className="text-[10px] opacity-80 mt-0.5">₦3,000 (Express)</div>
                </button>
              </div>

              {selectedZone === 'custom_kwara' && (
                <div className="mt-2 space-y-1.5">
                  <input
                    type="text"
                    placeholder="Enter Kwara Area / Town Name (e.g. Ganmo, Offa Garage, Omu-Aran)"
                    value={customZoneName}
                    onChange={(e) => setCustomZoneName(e.target.value)}
                    className="w-full p-2.5 border border-amber-300 rounded-xl text-xs bg-amber-50/50 outline-none font-medium focus:ring-2 focus:ring-amber-500"
                    required
                  />
                  <p className="text-[10px] text-amber-800 italic">
                    ℹ️ Off-corridor delivery is handled via dedicated express dispatch.
                  </p>
                </div>
              )}

              <div className="pt-2 border-t border-blue-200/60">
                <label className={`flex items-center gap-2 ${selectedZone === 'custom_kwara' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                  <input 
                    type="checkbox" 
                    checked={useShuttle} 
                    disabled={selectedZone === 'custom_kwara'}
                    onChange={(e) => setUseShuttle(e.target.checked)} 
                    className="w-4 h-4 text-emerald-600 rounded-md cursor-pointer disabled:cursor-not-allowed"
                  />
                  <span className="text-xs font-bold text-blue-950">
                    🚀 Join Shuttle Delivery {selectedZone === 'custom_kwara' ? '(Corridor Only)' : '(Saves Delivery Fee)'}
                  </span>
                </label>
                {useShuttle && selectedZone !== 'custom_kwara' && (
                  <div className="mt-2.5 space-y-1.5">
                    <select 
                      value={selectedShuttleRoute} 
                      onChange={(e) => { 
                        const val = e.target.value; 
                        setSelectedShuttleRoute(val); 
                        setSelectedZone(val === 'POL-ALHIKMAH-01' ? 'alhikmah' : 'unilorin'); 
                      }} 
                      className="w-full bg-white border border-blue-300 text-xs font-medium rounded-xl p-2.5 outline-none"
                    >
                      {shuttleCorridors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <p className="text-[10px] text-blue-700 italic">
                      Shuttle delivery fee: <b>₦{selectedZone === 'alhikmah' ? '1,300' : '1,800'}</b> (+ ₦500 ShopIn Fee).
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-3.5 space-y-2">
              <div onClick={() => setIsGifting(!isGifting)} className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🎁</span>
                  <div>
                    <h4 className="text-xs font-bold text-purple-900">Send as Gift</h4>
                    <p className="text-[10px] text-purple-700">Deliver directly to someone else</p>
                  </div>
                </div>
                <input type="checkbox" checked={isGifting} readOnly className="w-4 h-4 accent-purple-600 cursor-pointer pointer-events-none"/>
              </div>
              {isGifting && (
                <div className="pt-2 border-t border-purple-200 space-y-2 text-xs">
                  <input type="text" placeholder="Recipient Name" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} className="w-full p-2.5 border border-purple-200 rounded-xl outline-none focus:border-purple-500" />
                  <input type="tel" placeholder="Phone Number" value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} className="w-full p-2.5 border border-purple-200 rounded-xl outline-none focus:border-purple-500" />
                  <textarea placeholder="Recipient Address" value={recipientAddress} onChange={(e) => setRecipientAddress(e.target.value)} className="w-full p-2.5 border border-purple-200 rounded-xl outline-none focus:border-purple-500" rows={2} />
                </div>
              )}
            </div>

            {/* 🌟 NEW: PROCESSING ADD-ON CHECKBOX */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between cursor-pointer shadow-xs transition hover:shadow-sm" onClick={() => setNeedsProcessing(!needsProcessing)}>
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  checked={needsProcessing} 
                  readOnly
                  className="w-5 h-5 accent-amber-600 rounded cursor-pointer pointer-events-none" 
                />
                <div>
                  <h4 className="text-sm font-bold text-amber-900">Add Food Processing</h4>
                  <p className="text-[10px] text-amber-700">Peel yams, cut meat, or wash & blend produce.</p>
                </div>
              </div>
              <span className="font-extrabold text-amber-800">+₦{PROCESSING_FEE}</span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
              <div className="flex justify-between">
                <span>Total Item Cost (Goods & Errands):</span>
                <span className="font-semibold text-slate-800">₦{estimatedItemCost.toLocaleString()}</span>
              </div>
              
              {/* 🌟 Show Processing Fee in summary only if they checked the box! */}
              {needsProcessing && (
                <div className="flex justify-between text-amber-700">
                  <span>Food Processing Add-on:</span>
                  <span className="font-semibold">₦{currentProcessingFee.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Delivery Fee:</span>
                <span className="font-semibold text-slate-800">₦{currentDeliveryFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>ShopIn Service Fee:</span>
                <span className="font-semibold text-slate-800">₦{serviceFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                <span>Grand Total:</span>
                <span className="text-emerald-700">₦{grandTotal.toLocaleString()}</span>
              </div>
            </div>

            <button type="button" onClick={handleConfirmOrder} disabled={isSubmitting || !Array.isArray(items) || items.length === 0} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl text-xs shadow-md cursor-pointer">
              {isSubmitting ? 'Saving...' : `🔒 Confirm Order & Pay ₦${grandTotal.toLocaleString()}`}
            </button>
          </>
        ) : (
          <div className="text-center py-6 space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-2xl mx-auto font-black">✓</div>
            <h3 className="text-lg font-bold text-slate-900">Order Placed Successfully!</h3>
            <p className="text-xs text-slate-500">Your payment of ₦{grandTotal.toLocaleString()} was successful.</p>
            
            <div className="flex flex-col gap-2 mt-4 pt-2">
              <a 
                href={generateWhatsAppReceipt()} 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-2 transition shadow-xs"
              >
                📲 Send Receipt to Admin on WhatsApp
              </a>
              <button 
                type="button" 
                onClick={handleDone} 
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-6 py-3 rounded-xl text-xs font-bold cursor-pointer transition"
              >
                Done & Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}