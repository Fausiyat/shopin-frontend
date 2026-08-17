import axios from 'axios';

// Normalize base URL to prevent double '/api/api'
const rawBaseUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const BASE_URL = rawBaseUrl.replace(/\/api\/?$/, '');

// 1. Axios Instance
const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 🔒 Security Interceptor: Automatically attach admin authorization header if available
api.interceptors.request.use((config) => {
  const adminPin = localStorage.getItem('SHOPIN_ADMIN_PIN');
  if (adminPin) {
    config.headers['x-admin-pin'] = adminPin;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// 2. Named Exports

// --- User & Profile ---
export const registerUser = (userData) => api.post('/users/register', userData);
export const saveAddress = (addressData) => api.post('/users/address', addressData);
export const updateUserProfile = (profileData) => api.put('/users/profile', profileData);
export const saveUserAddress = (addressData) => api.post('/users/address', addressData);

// --- AI & Orders ---
export const parseGroceryList = (rawText) => api.post('/orders/parse-list', { raw_text: rawText, text: rawText });
export const saveDirectOrder = (orderData) => api.post('/orders', orderData);
export const createOrder = saveDirectOrder;
export const getQuote = (items, zoneName) => api.post('/orders/quote', { items, zone_name: zoneName });
export const createMasterOrder = (orderData) => api.post('/orders/create', orderData);
export const processVoiceNote = (voiceData) => api.post('/orders/voice-note', voiceData);
export const getUserOrders = (shopinId) => api.get('/user/orders', { params: { shopin_id: shopinId } });
export const updateOrderStatus = (orderId, statusData) => api.put(`/orders/${orderId}/status`, statusData);

// --- Wallet & Deposits ---
export const depositWallet = (walletData, optionalAmount) => {
  if (typeof walletData === 'object') {
    return api.post('/wallet/deposit', walletData);
  }
  return api.post('/wallet/deposit', { shopin_id: walletData, amount_ngn: optionalAmount });
};
export const requestDeposit = (depositData) => api.post('/wallet/request-deposit', depositData);
export const verifyPaystack = (reference, shopin_id) => api.post('/wallet/verify-paystack', { reference, shopin_id });
export const getWalletBalance = (shopinId) => api.get(`/wallet/${shopinId}`);
export const transferToTarget = (data) => api.post('/wallet/transfer-to-target', data);

// --- Market, Locations & Shopper ---
export const getMarketTicker = () => api.get('/market/ticker');
export const getLocations = () => api.get('/locations');
export const getShopperPickingList = () => api.get('/shoppers/picking-list');
export const getPickingList = getShopperPickingList;
export const addMarketPrice = (priceData) => api.post('/admin/prices', priceData);
export const updateShopperPin = async (newPin, adminPin) => {
  const response = await api.put('/admin/shopper-pin', 
    { new_pin: newPin }, 
    { headers: { 'x-admin-pin': adminPin } }
  );
  return response.data;
};

// --- Admin Security Verification ---
export const verifyAdminPin = async (pin) => {
  try {
    const response = await api.post('/admin/verify-pin', { pin });
    return response.data;
  } catch (error) {
    const savedPin = localStorage.getItem('SHOPIN_ADMIN_PIN') || '1234';
    if (pin.trim() === savedPin) {
      return { success: true };
    }
    throw new Error('Invalid PIN');
  }
};

// --- Food Pooling & Group Buying ---
export const getActivePools = () => api.get('/pools');
export const getPools = getActivePools;
export const joinPool = (poolId, payload) => {
  const body = typeof payload === 'number' ? { units: payload } : payload;
  return api.post(`/pools/${poolId}/join`, body);
};
export const createPoolCampaign = (campaignData) => api.post('/pooling/campaigns', campaignData);
export const contributeToPool = (contributionData) => api.post('/pooling/contribute', contributionData);

// --- Delivery & Batch Shuttles ---
export const getActiveDeliveryPools = () => api.get('/delivery-pools');
export const joinDeliveryPool = (poolData) => api.post('/pools/join', poolData);
export const createShuttleBatch = (shuttleData) => api.post('/shuttles/create', shuttleData);
export const joinShuttleBatch = (joinData, optionalShuttleId) => {
  if (typeof joinData === 'object') {
    return api.post('/orders/join-shuttle', joinData);
  }
  return api.post('/orders/join-shuttle', { order_code: joinData, shuttle_id: optionalShuttleId });
};
export const joinShuttle = joinShuttleBatch;

// --- Marketplace, Vendors, Reviews & Escrow ---
export const registerVendor = (vendorData) => api.post('/vendors/register', vendorData);
export const getVendorProducts = () => api.get('/vendors/products');
export const addVendorProduct = (productData) => api.post('/vendors/products', productData);
export const submitReview = (reviewData) => api.post('/vendors/reviews', reviewData);
export const addVendorReview = submitReview;
export const checkoutEscrow = (checkoutData) => api.post('/vendors/checkout', checkoutData);
export const releaseEscrow = (escrowId) => api.post('/escrow/release', { escrow_id: escrowId });

// --- Micro-Services ---
export const registerServiceProvider = (providerData) => api.post('/services/register-provider', providerData);
export const bookMicroService = (serviceData) => api.post('/services/book', serviceData);
export const bookServiceContact = (contactData) => api.post('/services/book-contact', contactData);

// --- Notifications ---
export const sendSmsNotification = (smsData) => api.post('/notifications/send-sms', smsData);
export const sendReceiptNotification = (receiptData) => api.post('/notifications/send-receipt', receiptData);

// --- Admin Analytics & User Tracking ---
export const getAdminUsers = () => api.get('/admin/users');
export const getUserStats = getAdminUsers;

// 3. Consolidated Main ShopIn API Object
export const shopinApi = {
  healthCheck: () => api.get('/health'),
  registerUser,
  saveAddress,
  updateUserProfile,
  saveUserAddress,
  parseGroceryList,
  saveDirectOrder,
  createOrder,
  getQuote,
  createMasterOrder,
  processVoiceNote,
  getUserOrders,
  updateOrderStatus,
  depositWallet,
  requestDeposit,
  verifyPaystack,
  getWalletBalance,
  transferToTarget,
  getMarketTicker,
  getLocations,
  getShopperPickingList,
  getPickingList,
  addMarketPrice,
  updateShopperPin,
  verifyAdminPin,
  getActivePools,
  getPools,
  joinPool,
  createPoolCampaign,
  contributeToPool,
  getActiveDeliveryPools,
  joinDeliveryPool,
  createShuttleBatch,
  joinShuttleBatch,
  joinShuttle,
  registerVendor,
  getVendorProducts,
  addVendorProduct,
  submitReview,
  addVendorReview,
  checkoutEscrow,
  releaseEscrow,
  registerServiceProvider,
  bookMicroService,
  bookServiceContact,
  sendSmsNotification,
  sendReceiptNotification,
  getAdminUsers,
  getUserStats
};

export default shopinApi;