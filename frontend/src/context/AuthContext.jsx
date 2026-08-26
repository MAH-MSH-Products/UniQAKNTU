import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';
import { jwtDecode } from 'jwt-decode';

/**
 * AuthContext - Authentication State Management
 * 
 * Provides authentication state and methods throughout the application.
 * Manages user session with JWT tokens (access/refresh), and role-based access control.
 * Decodes JWT tokens to extract user information (user_id, role, username).
 */

const AuthContext = createContext(null);

// Role-based access control helpers
export const canModerate = (role) => ['MODERATOR', 'ADMIN'].includes(role);
export const isAdmin = (role) => role === 'ADMIN';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Decode JWT token to extract user information
   * @param {string} token - JWT access token
   * @returns {Object|null} - Decoded user info or null if invalid
   */
  const decodeUserFromToken = (token) => {
    try {
      const decoded = jwtDecode(token);
      return {
        id: decoded.user_id || decoded.id,
        username: decoded.username,
        role: decoded.role || 'STUDENT',
      };
    } catch (error) {
      console.error('Failed to decode JWT token:', error);
      return null;
    }
  };

  /**
   * Initialize auth state from localStorage on mount
   */
  useEffect(() => {
    const storedToken = localStorage.getItem('accessToken');
    
    if (storedToken) {
      setAccessToken(storedToken);
      const userData = decodeUserFromToken(storedToken);
      if (userData) {
        setUser(userData);
      }
    }
    setIsLoading(false);
  }, []);

  /**
   * Login function - authenticates user and stores JWT tokens
   * @param {string} username - User's username
   * @param {string} password - User's password
   * @returns {Promise<Object>} - Login result with success status
   */
  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/token/', { username, password });
      const { access, refresh } = response.data;

      // Store tokens in localStorage
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
      
      // Set access token in state
      setAccessToken(access);
      
      // Decode user info from JWT token
      const userData = decodeUserFromToken(access);
      setUser(userData);

      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  /**
   * Logout function - clears all auth data including both tokens
   */
  const logout = () => {
    setAccessToken(null);
    setUser(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  };

  /**
   * Helper to check if user has moderator or admin role
   */
  const userRole = user?.role || 'STUDENT';
  const canModerateFlag = canModerate(userRole);
  
  /**
   * Helper to check if user is authenticated
   */
  const isAuthenticated = !!accessToken && !!user;

  const value = {
    user,
    accessToken,
    isLoading,
    login,
    logout,
    userRole,
    canModerate: canModerateFlag,
    isAdmin: isAdmin(userRole),
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
