import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export const canModerate = (role) => ['MODERATOR', 'ADMIN'].includes(role);
export const isAdmin = (role) => role === 'ADMIN';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const decodeUserFromToken = (token) => {
    try {
      const decoded = jwtDecode(token);
      let assignedRole = decoded.role;
      if (!assignedRole) {
        if (decoded.is_superuser || decoded.is_staff) {
          assignedRole = 'ADMIN';
        } else {
          assignedRole = 'STUDENT';
        }
      }
      return {
        id: decoded.user_id || decoded.id,
        username: decoded.username || 'User',
        role: assignedRole,
      };
    } catch (error) {
      console.error('Failed to decode JWT token:', error);
      return null;
    }
  };

  const fetchUserProfile = async (basicUserData) => {
    try {
      // Fetch complete user data to supplement missing JWT claims
      const response = await api.get('/users/me/');
      return {
        ...basicUserData,
        username: response.data.username || basicUserData.username,
        role: response.data.role || basicUserData.role
      };
    } catch (error) {
      console.error('Failed to fetch user profile for role verification:', error);
      return basicUserData;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('accessToken');
      if (storedToken) {
        setAccessToken(storedToken);
        let userData = decodeUserFromToken(storedToken);
        if (userData) {
          setUser(userData); // Set basic data immediately for UI
          userData = await fetchUserProfile(userData); // Update with accurate DB data
          setUser(userData);
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/token/', { username, password });
      const { access, refresh } = response.data;
      
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
      setAccessToken(access);
      
      let userData = decodeUserFromToken(access);
      if (userData) {
        setUser(userData);
        userData = await fetchUserProfile(userData);
        setUser(userData);
      }
      
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const logout = () => {
    setAccessToken(null);
    setUser(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  };

  const userRole = user?.role || 'STUDENT';
  const canModerateFlag = canModerate(userRole);
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};