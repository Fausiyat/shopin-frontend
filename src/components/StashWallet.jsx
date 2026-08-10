import React, { useState } from 'react';

const StashWallet = ({ walletBalance, setWalletBalance, escrowBalance, activeTargetGoal, onTargetCompleted }) => {
  const [depositAmount, setDepositAmount] = useState('');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [pendingDeposits, setPendingDeposits] = useState([]); // Tracks unverified transfers

  // Your OPay Details (Change these to your real details!)
  const OPAY_ACCOUNT_NUMBER = "8143086509"; 
  const OPAY_ACCOUNT_NAME = "ShopIn Kwara (Mahmood Fausiyat Ayobami)";

  const handleInitiateDeposit = (e) => {
    e.preventDefault();
    const amountNum = Number(depositAmount);
    if (!amountNum || amountNum < 100) {
      alert("Please enter a valid amount of at least ₦100.");
      return;
    }
    setShowTransferModal(true);
  };

  const handleConfirmSent = () => {
    // 1. Add to pending list (In a real app, this saves to your Neon Database via Render)
    const newPending = {
      id: Date.now(),
      amount: Number(depositAmount),
      date: new Date().toLocaleTimeString(),
      status: 'Pending Verification'
    };
    setPendingDeposits([newPending, ...pendingDeposits]);
    
    // 2. Close modal and reset
    setShowTransferModal(false);
    setDepositAmount('');
  };

  return (
    <div className="space-y-6">
      {/* 1. Wallet Balance Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-emerald-700 text-white p-4 rounded-2xl shadow-sm">
          <div className="text-emerald-100 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
            <span>💧</span> Liquid Stash
          </div>
          <div className="text-2xl font-black">
            ₦{walletBalance.toLocaleString()}
          </div>
          <div className="text-xs text-emerald-200 mt-1">Spendable instantly</div>
        </div>

        <div className="bg-amber-700 text-white p-4 rounded-2xl shadow-sm">
          <div className="text-amber-100 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
            <span>🎯</span> Target Vault
          </div>
          <div className="text-2xl font-black">
            ₦{escrowBalance.toLocaleString()}
          </div>
          <div className="text-xs text-amber-200 mt-1">Locked in Escrow</div>
        </div>
      </div>

      {/* 2. Deposit Form */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
        <h4 className="text-sm font-bold text-slate-800 mb-3">Fund Your Stash</h4>
        <form onSubmit={handleInitiateDeposit} className="space-y-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₦</span>
            <input
              type="number"
              min="100"
              placeholder="Amount to deposit"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-semibold"
            />
          </div>
          
          {/* Quick Add Buttons */}
          <div className="flex gap-2">
            {[1000, 2000, 5000].map(amt => (
              <button
                key={amt}
                type="button"
                onClick={() => setDepositAmount(amt.toString())}
                className="flex-1 bg-white border border-slate-200 text-slate-600 hover:border-emerald-500 hover:text-emerald-600 text-xs font-bold py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                +₦{amt.toLocaleString()}
              </button>
            ))}
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg text-sm transition-colors cursor-pointer"
          >
            Deposit via OPay Transfer ➔
          </button>
        </form>
      </div>

      {/* 3. Pending Transactions List */}
      {pendingDeposits.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <h4 className="text-xs font-bold text-orange-800 uppercase tracking-wider mb-2 flex items-center gap-1">
            <span>⏳</span> Pending Verifications
          </h4>
          <div className="space-y-2">
            {pendingDeposits.map((dep) => (
              <div key={dep.id} className="flex justify-between items-center bg-white p-2 rounded-lg border border-orange-100 shadow-sm text-sm">
                <div>
                  <span className="font-bold text-slate-800">₦{dep.amount.toLocaleString()}</span>
                  <div className="text-xs text-slate-400">{dep.date}</div>
                </div>
                <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold">
                  Awaiting Admin
                </span>
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
                <span className="text-lg font-black text-emerald-700 tracking-wider">{OPAY_ACCOUNT_NUMBER}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-500 font-medium">Account Name</span>
                <span className="text-sm font-bold text-slate-800">{OPAY_ACCOUNT_NAME}</span>
              </div>
            </div>

            <div className="bg-amber-50 text-amber-800 text-xs p-3 rounded-lg border border-amber-200 font-medium text-center">
              ⚠️ Only click the button below <strong>AFTER</strong> you have completed the transfer on your bank app.
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleConfirmSent}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-sm transition-all cursor-pointer"
              >
                ✅ I Have Made the Transfer
              </button>
              <button
                onClick={() => setShowTransferModal(false)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl cursor-pointer"
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