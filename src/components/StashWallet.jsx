import React, { useState } from 'react';

const StashWallet = ({ walletBalance, setWalletBalance }) => {
  const [depositAmount, setDepositAmount] = useState('');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [pendingDeposits, setPendingDeposits] = useState([]); 
  
  // 🌟 NEW: State to hold the sender's account name
  const [senderName, setSenderName] = useState('');

  // Your OPay Details
  const OPAY_ACCOUNT_NUMBER = "8143086509"; 
  const OPAY_ACCOUNT_NAME = "Mahmood Fausiyat Ayobami";

  const handleInitiateDeposit = (e) => {
    e.preventDefault();
    const amountNum = Number(depositAmount);
    if (!amountNum || amountNum < 100) {
      alert("Please enter a valid amount of at least ₦100.");
      return;
    }
    setShowTransferModal(true);
  };

  const handleConfirmSent = async () => {
    // 🌟 Require the sender name before proceeding!
    if (!senderName.trim()) {
      alert("Please enter the Account Name you transferred the money from.");
      return;
    }

    const currentShopinId = localStorage.getItem('SHOPIN_USER_ID') || 'SHP-ILR-1001';
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'https://shopin-kwara-backend.onrender.com';
      await fetch(`${API_URL}/api/wallet/request-deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopin_id: currentShopinId,
          amount_ngn: Number(depositAmount),
          sender_name: senderName.trim() // 🌟 Sending the new data to the backend!
        })
      });

      const newPending = {
        id: Date.now(),
        amount: Number(depositAmount),
        date: new Date().toLocaleTimeString(),
        status: 'Pending Verification',
        sender_name: senderName.trim()
      };
      setPendingDeposits([newPending, ...pendingDeposits]);

      alert("Transfer claim submitted! Waiting for Admin verification.");
      setShowTransferModal(false);
      setDepositAmount('');
      setSenderName(''); // Reset the input
      
    } catch (err) {
      alert("Error submitting claim. Please check your connection.");
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Single Wallet Balance Card */}
      <div className="bg-emerald-700 text-white p-6 rounded-2xl shadow-sm text-center">
        <div className="text-emerald-100 text-xs font-bold uppercase tracking-wider mb-2 flex items-center justify-center gap-1">
          <span>💰</span> Stash Wallet Balance
        </div>
        <div className="text-4xl font-black mb-1">
          ₦{Number(walletBalance || 0).toLocaleString()}
        </div>
        <div className="text-xs text-emerald-200">Available for instant purchases</div>
      </div>

      {/* 2. Deposit Form */}
      <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
        <h4 className="text-sm font-bold text-slate-800 mb-3">Fund Your Wallet</h4>
        <form onSubmit={handleInitiateDeposit} className="space-y-4">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₦</span>
            <input
              type="number"
              min="100"
              placeholder="Amount to deposit"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-semibold shadow-sm bg-white"
            />
          </div>
          
          <div className="flex gap-2">
            {[1000, 2000, 5000].map(amt => (
              <button
                key={amt}
                type="button"
                onClick={() => setDepositAmount(amt.toString())}
                className="flex-1 bg-white border border-slate-200 text-slate-600 hover:border-emerald-500 hover:text-emerald-600 text-xs font-bold py-2 rounded-xl transition-colors cursor-pointer shadow-sm"
              >
                +₦{amt.toLocaleString()}
              </button>
            ))}
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-sm transition-colors cursor-pointer shadow-md"
          >
            Deposit via Bank Transfer ➔
          </button>
        </form>
      </div>

      {/* 3. Pending Transactions List */}
      {pendingDeposits.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <h4 className="text-xs font-bold text-orange-800 uppercase tracking-wider mb-3 flex items-center gap-1">
            <span>⏳</span> Pending Verifications
          </h4>
          <div className="space-y-2">
            {pendingDeposits.map((dep) => (
              <div key={dep.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-orange-100 shadow-sm text-sm">
                <div>
                  <span className="font-bold text-slate-800">₦{dep.amount.toLocaleString()}</span>
                  <div className="text-xs text-slate-400 mt-0.5">
                    From: <span className="font-semibold text-slate-600 capitalize">{dep.sender_name}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-[10px] uppercase font-black tracking-wide">
                    Awaiting Admin
                  </span>
                  <span className="text-[9px] text-slate-400 mt-1">{dep.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. OPay Transfer Modal Overlay */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-5 shadow-2xl">
            
            <div className="text-center">
              <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl block">🏦</span>
              </div>
              <h3 className="font-extrabold text-slate-900 text-lg">Direct Bank Transfer</h3>
              <p className="text-sm text-slate-500 mt-1">
                Please transfer exactly <strong className="text-slate-800">₦{Number(depositAmount).toLocaleString()}</strong> to the account below.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-xs text-slate-500 font-medium">Bank Name</span>
                <span className="text-sm font-bold text-slate-800">OPay</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-xs text-slate-500 font-medium">Account Number</span>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black text-emerald-700 tracking-wider">{OPAY_ACCOUNT_NUMBER}</span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(OPAY_ACCOUNT_NUMBER);
                      alert('Account Number Copied!');
                    }}
                    className="bg-slate-200 text-slate-600 px-2 py-1 rounded text-[10px] font-bold cursor-pointer"
                  >
                    COPY
                  </button>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-500 font-medium">Account Name</span>
                <span className="text-xs font-bold text-slate-800 uppercase">{OPAY_ACCOUNT_NAME}</span>
              </div>
            </div>

            {/* 🌟 NEW: SENDER NAME INPUT BOX */}
            <div className="bg-white border-2 border-amber-200 rounded-xl p-3">
              <label className="text-[11px] font-bold text-amber-800 uppercase block mb-1">
                What is the Account Name you sent the money from? *
              </label>
              <input
                type="text"
                placeholder="e.g., Samuel Doe"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg focus:border-amber-500 outline-none text-xs font-bold bg-slate-50"
              />
              <p className="text-[9px] text-amber-700 font-medium mt-1">
                We need this to match the transfer in our bank app so we can credit your wallet!
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleConfirmSent}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-sm transition-all cursor-pointer"
              >
                ✅ I Have Made the Transfer
              </button>
              <button
                onClick={() => {
                  setShowTransferModal(false);
                  setSenderName(''); // Clear it if they cancel
                }}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default StashWallet;