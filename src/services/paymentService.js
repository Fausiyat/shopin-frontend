// src/services/paymentService.js

import { initializePaystack } from './paystackGateway';
import { initializeFlutterwave } from './flutterwaveGateway'; // Added in Phase 2!

export const processWalletDeposit = async ({ amount, email, provider = 'paystack' }) => {
  if (provider === 'paystack') {
    return await initializePaystack({ amount, email });
  } else if (provider === 'flutterwave') {
    return await initializeFlutterwave({ amount, email });
  }
};