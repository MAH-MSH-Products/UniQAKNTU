import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

/**
 * AuthContext - Authentication State Management
 * 
 * Provides authentication state and methods throughout the application.
 * Manages user session, token storage, and role-based access.
 */

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Initialize auth state from localStorage on mount
   */
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('authUser');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  /**
   * Login function - authenticates user and stores token
   * @param {string} username - User's username
   * @param {string} password - User's password
   * @returns {Promise<Object>} - Login response data
   */
  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login/', { username, password });
      const { token: authToken, user: userData } = response.data;

      // Save to state
      setToken(authToken);
      setUser(userData);

      // Save to localStorage
      localStorage.setItem('authToken', authToken);
      localStorage.setItem('authUser', JSON.stringify(userData));

      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  /**
   * Logout function - clears all auth data
   */
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
  };

  /**
   * Helper to check if user is an instructor
   */
  const isInstructor = user?.is_instructor || false;

  /**
   * Helper to check if user is authenticated
   */
  const isAuthenticated = !!token && !!user;

  const value = {
    user,
    token,
    isLoading,
    login,
    logout,
    isInstructor,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook to access auth context
 * @returns {Object} - Auth context value
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
