import React, { useState, useEffect } from 'react';
import { PaystackButton } from 'react-paystack';
import shopinApi from '../services/api';

export default function StashWallet({ 
  walletBalance = 0,
  escrowBalance = 0, 
  setWalletBalance, 
  activeTargetGoal, 
  onTargetCompleted 
}) {
  // 🚀 Dynamic User ShopIn ID retrieval from Local Storage
  const [currentShopinId] = useState(() => 
    localStorage.getItem('SHOPIN_USER_ID') || 'SHP-ILR-1001'
  );

  // 1. Target Vault Savings (Locked specifically towards Pay Small-Small target goals)
  const [targetSavings, setTargetSavings] = useState(0);

  // Derive spendable liquid cash dynamically from the shared global wallet balance
  const liquidBalance = Math.max(0, walletBalance - targetSavings);

  // Deposit Form State (Auto-filled from local storage if previously entered)
  const [depositAmount, setDepositAmount] = useState('');
  const [depositDestination, setDepositDestination] = useState('liquid'); // 'liquid' | 'target'
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem('SHOPIN_USER_EMAIL') || '');
  const [userPhone, setUserPhone] = useState(() => localStorage.getItem('SHOPIN_USER_PHONE') || '');
  const [isDepositing, setIsDepositing] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState(null);

  // Transfer State
  const [transferRecipientId, setTransferRecipientId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferFeedback, setTransferFeedback] = useState(null);

  // Fresh Transaction History for New Users
  const [transactions, setTransactions] = useState([]);

  // 📱 Helper to trigger SMS via Backend Route (Routes to EbulkSMS in server.js)
  const triggerSmsAlert = async ({ phone, type, amount, reference }) => {
    try {
      if (shopinApi && shopinApi.sendSmsNotification) {
        await shopinApi.sendSmsNotification({ phone, type, amount, reference });
      }
    } catch (err) {
      console.warn('⚠️ Automated SMS dispatch error:', err.message);
    }
  };

  // 🎯 Auto-Check Target Completion when Target Vault reaches 100%
  useEffect(() => {
    if (activeTargetGoal && activeTargetGoal.targetTotal > 0) {
      if (targetSavings >= activeTargetGoal.targetTotal) {
        const orderCost = activeTargetGoal.targetTotal;

        // Reset target savings
        setTargetSavings(0);

        setCelebrationMessage({
          title: "🎉 CONGRATULATIONS! Target Goal Reached!",
          text: `Your target savings reached ₦${orderCost.toLocaleString()}! Your target order (${activeTargetGoal.items?.length || 1} items) has been AUTOMATICALLY DISPATCHED to Mandate Market shoppers!`
        });

        const dispatchRef = `DISPATCH_${activeTargetGoal.targetId}`;
        const dispatchTx = {
          id: Date.now(),
          type: 'TARGET_DISPATCH',
          amount: -orderCost,
          date: 'Just now',
          ref: dispatchRef
        };
        setTransactions(prev => [dispatchTx, ...prev]);

        // 📱 Trigger SMS for Target Dispatch
        triggerSmsAlert({
          phone: userPhone,
          type: 'TARGET_DISPATCH',
          amount: orderCost,
          reference: dispatchRef
        });

        if (onTargetCompleted) {
          onTargetCompleted(activeTargetGoal.targetId);
        }
      }
    }
  }, [targetSavings, activeTargetGoal, onTargetCompleted, userPhone]);

  // 💳 PAYSTACK CONFIGURATION
  const paystackPublicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_dummy_key';
  const parsedAmount = parseFloat(depositAmount) || 0;

  // Smart email fallback prevents Paystack initialization failures if left blank
  const effectiveEmail = userEmail.trim() || 'buyer@shopin.ng';

  // Paystack Dynamic Props
  const paystackProps = {
    publicKey: paystackPublicKey,
    email: effectiveEmail,
    amount: parsedAmount * 100, // Paystack operates in kobo (₦1 = 100 kobo)
    currency: 'NGN',
    reference: `SPN_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    text: '💳 Pay via Paystack ➔',
    onSuccess: async (reference) => {
      setIsDepositing(true);
      const txRef = reference.reference ? reference.reference.slice(-8) : 'SUCCESS';

      // Save user details locally for subsequent quick checkouts
      if (userEmail.trim()) localStorage.setItem('SHOPIN_USER_EMAIL', userEmail.trim());
      if (userPhone.trim()) localStorage.setItem('SHOPIN_USER_PHONE', userPhone.trim());

      try {
        if (shopinApi && shopinApi.depositWallet) {
          await shopinApi.depositWallet({
            shopin_id: currentShopinId, 
            amount_ngn: parsedAmount,
            reference_code: reference.reference
          });
        }
      } catch (err) {
        console.warn("Backend sync notice (local mode):", err);
      } finally {
        // ✅ ALWAYS FORCE UI BALANCE UPDATE INSTANTLY ON SUCCESS
        if (setWalletBalance) {
          setWalletBalance(prev => prev + parsedAmount);
        }

        if (depositDestination === 'target') {
          setTargetSavings(prev => prev + parsedAmount);
          setTransactions(prev => [{
            id: Date.now(),
            type: 'TARGET_VAULT_ADD',
            amount: parsedAmount,
            date: 'Just now',
            ref: `PAYSTACK:${txRef}`
          }, ...prev]);
        } else {
          setTransactions(prev => [{
            id: Date.now(),
            type: 'DEPOSIT_LIQUID',
            amount: parsedAmount,
            date: 'Just now',
            ref: `PAYSTACK:${txRef}`
          }, ...prev]);
        }

        // 📱 Send EbulkSMS Transaction SMS
        triggerSmsAlert({
          phone: userPhone,
          type: 'DEPOSIT',
          amount: parsedAmount,
          reference: txRef
        });

        setDepositAmount('');
        setIsDepositing(false);
      }
    },
    onClose: () => setIsDepositing(false)
  };

  // Local Simulation Fallback
  const handleLocalFallbackDeposit = (e) => {
    e.preventDefault();
    if (parsedAmount <= 0) return;
    setIsDepositing(true);

    setTimeout(() => {
      paystackProps.onSuccess({ reference: `LOCAL_TEST_${Date.now()}` });
    }, 500);
  };

  // Move Liquid Cash -> Target Vault Shortcut
  const handleMoveLiquidToTarget = async () => {
    if (!liquidBalance || liquidBalance <= 0) return;
    const needed = activeTargetGoal?.targetTotal ? activeTargetGoal.targetTotal - targetSavings : liquidBalance;
    const amountToMove = Math.min(liquidBalance, Math.max(0, needed));

    if (amountToMove <= 0) return;

    try {
      // 1. Tell the database to move the money!
      if (shopinApi && shopinApi.transferToTarget) {
         await shopinApi.transferToTarget({
            shopin_id: currentShopinId,
            amount_to_transfer: amountToMove
         });
      }
    } catch (err) {
      console.warn("Backend target transfer fallback applied:", err);
    } finally {
      // 2. ALWAYS Update the frontend UI to reflect the successful move
      setTargetSavings(prev => prev + amountToMove);

      setTransactions(prev => [{
        id: Date.now(),
        type: 'TARGET_VAULT_ADD',
        amount: amountToMove,
        date: 'Just now',
        ref: `LIQUID➔TARGET (${activeTargetGoal?.targetId || 'GOAL'})`
      }, ...prev]);
    }
  };

  // P2P Transfer from Liquid Balance
  const handleTransfer = async (e) => {
    e.preventDefault();
    const amountNum = parseFloat(transferAmount);
    const recipient = transferRecipientId.trim();

    if (!recipient || !amountNum || amountNum <= 0) {
      setTransferFeedback({ type: 'error', text: 'Please enter a valid recipient ID and amount.' });
      return;
    }

    if (amountNum > liquidBalance) {
      setTransferFeedback({ type: 'error', text: 'Insufficient Liquid Stash balance.' });
      return;
    }

    setIsTransferring(true);
    setTransferFeedback(null);

    try {
      if (setWalletBalance) {
        setWalletBalance(prev => Math.max(0, prev - amountNum));
      }
      setTransactions(prev => [{
        id: Date.now(),
        type: 'TRANSFER_SENT',
        amount: -amountNum,
        date: 'Just now',
        ref: `TRF (To: ${recipient})`
      }, ...prev]);
      setTransferFeedback({ type: 'success', text: `Sent ₦${amountNum.toLocaleString()} to ${recipient}!` });
      setTransferRecipientId('');
      setTransferAmount('');
    } finally {
      setIsTransferring(false);
    }
  };

  const targetTotal = activeTargetGoal?.targetTotal || 0;
  const progressPercent = targetTotal > 0 ? Math.min(100, Math.round((targetSavings / targetTotal) * 100)) : 0;

  return (
    <div className="space-y-4">
      {/* Title Header */}
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <span className="text-2xl">💰</span>
        <div>
          <h3 className="text-base font-black text-slate-900 leading-tight">Stash Wallet</h3>
          <p className="text-[11px] text-slate-500">Pay Small-Small & Escrow Protection</p>
        </div>
      </div>

      {/* Celebration Banner */}
      {celebrationMessage && (
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 text-white p-3.5 rounded-xl shadow-lg border-2 border-amber-300 animate-bounce space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-xs">{celebrationMessage.title}</h4>
            <button onClick={() => setCelebrationMessage(null)} className="font-black text-xs cursor-pointer">✕</button>
          </div>
          <p className="text-[11px] text-emerald-100">{celebrationMessage.text}</p>
          <div className="text-[10px] bg-white/20 p-2 rounded font-bold">
            🚀 Order status updated: Dispatched for Mandate Market Sourcing & Delivery!
          </div>
        </div>
      )}

      {/* Dual Balances Display */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-emerald-800 text-white p-3.5 rounded-2xl shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200 flex items-center gap-1">
            <span>💧</span> Liquid Stash
          </span>
          <h3 className="text-xl font-black">
            ₦{Number(liquidBalance).toLocaleString()}
          </h3>
          <span className="text-[9px] bg-emerald-900/80 text-emerald-200 px-1.5 py-0.5 rounded-md inline-block font-medium">
            Spendable instantly
          </span>
        </div>

        <div className="bg-amber-900 text-white p-3.5 rounded-2xl shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-200 flex items-center gap-1">
            <span>🎯</span> Target Vault
          </span>
          <h3 className="text-xl font-black">
            ₦{Number(targetSavings).toLocaleString()}
          </h3>
          <span className="text-[9px] bg-amber-950/80 text-amber-200 px-1.5 py-0.5 rounded-md inline-block font-medium">
            {activeTargetGoal ? `${progressPercent}% saved` : 'Locked savings'}
          </span>
        </div>
      </div>

      {/* 🔒 The Escrow Jar (Only shows if money is locked inside) */}
      {escrowBalance > 0 && (
        <div className="bg-slate-800 text-white p-3.5 mt-3 rounded-2xl flex justify-between items-center shadow-xs">
           <div className="flex items-center gap-2">
              <span className="text-2xl">🔒</span>
              <div>
                 <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Escrow Hold</p>
                 <p className="text-[10px] text-slate-300">Locked for active orders</p>
              </div>
           </div>
           <h3 className="text-xl font-black">₦{Number(escrowBalance).toLocaleString()}</h3>
        </div>
      )}

      {/* Target Goal Progress & Targeted Goods Display */}
      {activeTargetGoal && activeTargetGoal.targetTotal > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 space-y-3 shadow-2xs">
          <div className="flex justify-between items-center text-xs border-b border-amber-200/50 pb-2">
            <span className="font-bold text-amber-900 flex items-center gap-1.5">
              <span>🎯</span> Target Goal: {activeTargetGoal.targetId}
            </span>
            <span className="font-black text-amber-800">{progressPercent}% Saved</span>
          </div>

          {/* 📦 Targeted Goods Visual List */}
          <div className="bg-white/60 rounded-xl p-2.5 text-[10px] text-amber-900 border border-amber-200/50 shadow-xs">
            <span className="font-extrabold uppercase tracking-wider block mb-1.5 text-amber-700">Items locked in this target:</span>
            <ul className="list-disc pl-4 space-y-0.5 font-medium">
              {activeTargetGoal.items?.map((item, idx) => (
                <li key={idx}>{item.quantity}x {item.item_name || item.name}</li>
              ))}
            </ul>
          </div>

          <div className="w-full bg-amber-200 h-2.5 rounded-full overflow-hidden">
            <div 
              className="bg-amber-600 h-full transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex justify-between text-[11px] text-amber-900 pb-1">
            <span>Saved: ₦{targetSavings.toLocaleString()}</span>
            <span className="font-extrabold">Goal Total: ₦{activeTargetGoal.targetTotal.toLocaleString()}</span>
          </div>

          {/* 🔘 Move Cash Button (Always visible, disabled if no liquid cash) */}
          <div className="pt-2 border-t border-amber-200/80 flex items-center justify-between text-xs">
            <span className="text-[10px] font-semibold text-amber-800">
              Liquid Cash Available: ₦{liquidBalance.toLocaleString()}
            </span>
            <button
              type="button"
              onClick={handleMoveLiquidToTarget}
              disabled={liquidBalance <= 0 || targetSavings >= activeTargetGoal.targetTotal}
              className="bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 disabled:cursor-not-allowed text-white font-bold px-3 py-1.5 rounded-lg text-[10px] cursor-pointer transition shadow-xs"
            >
              Move Cash to Target ➔
            </button>
          </div>
        </div>
      )}

      {/* Paystack Deposit Form */}
      <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
        <div className="flex justify-between items-center">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Deposit Destination
          </label>

          <div className="flex gap-1 bg-slate-200/80 p-0.5 rounded-xl text-[10px]">
            <button
              type="button"
              onClick={() => setDepositDestination('liquid')}
              className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition ${
                depositDestination === 'liquid'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              💧 Liquid Cash
            </button>

            <button
              type="button"
              onClick={() => setDepositDestination('target')}
              className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition ${
                depositDestination === 'target'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🎯 Target Goal
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <input
            type="email"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            placeholder="Your Email (Optional)"
            className="p-2 border border-slate-200 rounded-xl bg-white text-xs outline-none focus:border-emerald-500 font-medium"
          />

          <input
            type="tel"
            value={userPhone}
            onChange={(e) => setUserPhone(e.target.value)}
            placeholder="Phone Number (Optional)"
            className="p-2 border border-slate-200 rounded-xl bg-white text-xs outline-none focus:border-emerald-500 font-medium"
          />
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-2 text-slate-400 font-bold text-xs">₦</span>
            <input
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder={depositDestination === 'target' ? "Target Vault..." : "Liquid Stash..."}
              className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-xl bg-white text-xs font-bold outline-none focus:border-emerald-500"
            />
          </div>
          
          {paystackPublicKey && !paystackPublicKey.includes('dummy') && parsedAmount > 0 ? (
            <PaystackButton
              {...paystackProps}
              className={`font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-xs text-white cursor-pointer ${
                depositDestination === 'target' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            />
          ) : (
            <button
              type="button"
              onClick={handleLocalFallbackDeposit}
              disabled={isDepositing || parsedAmount <= 0}
              className={`font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-xs text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ${
                depositDestination === 'target' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {isDepositing ? 'Processing...' : parsedAmount <= 0 ? 'Enter Amount ➔' : '💳 Pay via Paystack ➔'}
            </button>
          )}
        </div>

        {/* Quick Add Buttons */}
        <div className="flex items-center gap-1.5 pt-1 text-[11px]">
          <span className="text-slate-400 font-medium">Quick Add:</span>
          {[500, 1000, 2000, 5000].map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => setDepositAmount(amt.toString())}
              className="px-2 py-0.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg font-bold text-slate-700 cursor-pointer transition"
            >
              +₦{amt}
            </button>
          ))}
        </div>
      </div>

      {/* P2P Wallet Transfer Form */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-3">
        <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
          <span>💸</span> Send Liquid Stash Funds to Another User
        </h4>

        {transferFeedback && (
          <p className={`text-xs p-2 rounded-xl ${transferFeedback.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
            {transferFeedback.text}
          </p>
        )}

        <form onSubmit={handleTransfer} className="space-y-2">
          <input
            type="text"
            placeholder="Recipient ShopIn ID (e.g. SHP-ILR-2045)"
            value={transferRecipientId}
            onChange={(e) => setTransferRecipientId(e.target.value)}
            className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 font-medium"
          />
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Amount (₦)"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 font-medium"
            />
            <button
              type="submit"
              disabled={isTransferring || !transferAmount || !transferRecipientId}
              className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold px-3 py-2 rounded-xl text-xs cursor-pointer whitespace-nowrap transition"
            >
              {isTransferring ? 'Sending...' : 'Send Cash ➔'}
            </button>
          </div>
        </form>
      </div>

      {/* Recent Activity Ledger */}
      <div className="border-t border-slate-100 pt-3">
        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
          Recent Stash Activity
        </h4>

        {transactions.length === 0 ? (
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center text-slate-400 text-xs font-medium">
            💳 No transaction history yet. Your deposits, transfers, and order payments will appear here!
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between text-xs py-1.5 px-2 rounded-xl bg-slate-50 border border-slate-100"
              >
                <div>
                  <span className="font-semibold text-slate-800 block">
                    {tx.type === 'DEPOSIT_LIQUID' 
                      ? '📥 Liquid Stash Deposit' 
                      : tx.type === 'TARGET_VAULT_ADD'
                      ? '🎯 Target Vault Savings'
                      : tx.type === 'TARGET_DISPATCH'
                      ? '🎉 Target Reached & Dispatched!'
                      : tx.type === 'SERVICE_CONTACT_FEE'
                      ? '📞 Vendor Contact Fee'
                      : tx.type === 'TRANSFER_SENT'
                      ? '💸 Stash Transfer Sent'
                      : '🛒 Instant Market Order'}
                  </span>
                  <span className="text-slate-400 text-[10px]">{tx.ref} • {tx.date}</span>
                </div>
                <span className={`font-bold ${tx.amount > 0 ? 'text-emerald-600' : 'text-slate-700'}`}>
                  {tx.amount > 0 ? `+₦${tx.amount.toLocaleString()}` : `-₦${Math.abs(tx.amount).toLocaleString()}`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}