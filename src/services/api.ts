import axios from 'axios';

// Configure axios defaults
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
axios.defaults.withCredentials = true; // Enable sending cookies and auth headers
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Add request interceptor for auth token
axios.interceptors.request.use(
  (config) => {
    const auth = localStorage.getItem('auth');
    if (auth) {
      const { token } = JSON.parse(auth);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Types
export interface FoodItem {
  id: string;
  name: string;
  description: string;
  originalPrice: number;
  price: number;
  quantity: number;
  expiryDate: string;
  imageUrl?: string;
  merchantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  foodItem: FoodItem;
}

export interface Order {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'PICKED_UP' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'PAID';
  pickupTime: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface MerchantStats {
  totalOrders: number;
  revenue: number;
  itemsSaved: number;
  totalFoodItems: number;
  totalSales: number;
}

export interface MerchantProfile {
  id: string;
  businessName: string;
  address: string;
  city: string;
  description: string;
  postalCode: string;
  phone: string;
  latitude: number;
  longitude: number;
  foodItems: FoodItem[];
}

// API methods
export const api = {
  // Food Items
  getMerchantProfile: async () => {
    const response = await axios.get<MerchantProfile>('/api/merchants/profile');
    return response.data;
  },

  createFoodItem: async (data: FormData) => {
    const response = await axios.post<FoodItem>('/api/food-items', data);
    return response.data;
  },

  updateFoodItem: async (id: string, data: FormData) => {
    const response = await axios.put<FoodItem>(`/api/food-items/${id}`, data);
    return response.data;
  },

  deleteFoodItem: async (id: string) => {
    await axios.delete(`/api/food-items/${id}`);
  },

  // Orders
  getOrders: async (params?: { status?: string; page?: number; limit?: number }) => {
    const response = await axios.get<{ orders: Order[]; total: number }>('/api/orders/merchant', { params });
    return response.data;
  },

  updateOrderStatus: async (orderId: string, status: Order['status']) => {
    const response = await axios.patch<Order>(`/api/orders/${orderId}/status`, { status });
    return response.data;
  },

  updateOrderPaymentStatus: async (orderId: string, status: 'PAID') => {
    const response = await axios.patch<Order>(`/api/orders/${orderId}/payment`, { status });
    return response.data;
  },

  // Stats
  getMerchantStats: async () => {
    const response = await axios.get<MerchantStats>('/api/merchants/stats');
    return response.data;
  },
};