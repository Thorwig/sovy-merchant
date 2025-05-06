import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface Merchant {
  id: string;
  businessName: string;
  description?: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  latitude: number;
  longitude: number;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: 'MERCHANT';
}

interface AuthState {
  token: string | null;
  user: User | null;
  merchant: Merchant | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateMerchantProfile: (data: Partial<Merchant>) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(() => {
    const savedAuth = localStorage.getItem('auth');
    return savedAuth ? JSON.parse(savedAuth) : { token: null, user: null, merchant: null };
  });

  useEffect(() => {
    if (authState.token) {
      localStorage.setItem('auth', JSON.stringify(authState));
      axios.defaults.headers.common['Authorization'] = `Bearer ${authState.token}`;
    } else {
      localStorage.removeItem('auth');
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [authState]);

  const login = async (email: string, password: string) => {
    try {
      const { data } = await axios.post('/api/auth/login', {
        email,
        password,
        role: 'MERCHANT'
      });

      if (!data.token || !data.user || !data.merchant) {
        throw new Error('Invalid response from server');
      }

      // Only update state if we have valid data
      setAuthState({
        token: data.token,
        user: data.user,
        merchant: data.merchant
      });
    } catch (error: any) {
      // Don't update any state if there's an error
      if (error.response?.status === 401) {
        throw new Error('Invalid email or password');
      }
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Login failed. Please check your credentials.');
    }
  };

  const logout = () => {
    setAuthState({ token: null, user: null, merchant: null });
  };

  const updateMerchantProfile = async (data: Partial<Merchant>) => {
    try {
      const { data: updatedMerchant } = await axios.put('/api/merchants/profile', data);
      setAuthState(prev => ({
        ...prev,
        merchant: { ...prev.merchant!, ...updatedMerchant }
      }));
    } catch (error) {
      throw new Error('Failed to update profile');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        updateMerchantProfile,
        isAuthenticated: !!authState.token
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};