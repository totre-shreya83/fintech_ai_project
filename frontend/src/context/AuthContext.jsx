import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const API_URL = 'http://127.0.0.1:8000/auth';

  // Configure axios interceptor for token
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Load user if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const userRes = await axios.get(`${API_URL}/me`);
        const prefRes = await axios.get(`${API_URL}/preferences`);
        
        setUser(userRes.data);
        setPreferences(prefRes.data);
        
        // Save to localStorage for dashboard
        localStorage.setItem('userType', prefRes.data.user_type);
        localStorage.setItem('darkMode', prefRes.data.dark_mode === 1 ? 'true' : 'false');
      } catch (error) {
        console.error('Auth error:', error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  const login = async (email, password) => {
    try {
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);

      const response = await axios.post(`${API_URL}/login`, formData);
      const { access_token, user, preferences } = response.data;

      localStorage.setItem('token', access_token);
      setToken(access_token);
      setUser(user);
      setPreferences(preferences);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Login failed' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post(`${API_URL}/register`, userData);
      const { access_token, user, preferences } = response.data;

      localStorage.setItem('token', access_token);
      setToken(access_token);
      setUser(user);
      setPreferences(preferences);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Registration failed' 
      };
    }
  };

  // ✅ LOGOUT FUNCTION - SIRF YEH ADD KARNA HAI
  const logout = () => {
    // localStorage se token hatao
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    localStorage.removeItem('darkMode');
    
    // state se bhi hatao
    setToken(null);
    setUser(null);
    setPreferences(null);
    
    // axios headers se bhi hatao
    delete axios.defaults.headers.common['Authorization'];
    
    console.log('✅ Logout successful');
  };

  const updatePreferences = async (newPreferences) => {
    try {
      const response = await axios.put(`${API_URL}/preferences`, newPreferences);
      setPreferences(response.data);
      
      // Update localStorage
      localStorage.setItem('userType', response.data.user_type);
      localStorage.setItem('darkMode', response.data.dark_mode === 1 ? 'true' : 'false');
      
      return { success: true, preferences: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Failed to update preferences' 
      };
    }
  };

  const value = {
    user,
    preferences,
    token,
    loading,
    login,
    register,
    logout,  // ✅ YEH EXPORT KARO
    updatePreferences
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};