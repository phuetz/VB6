/**
 * useAuth Hook
 * React hook for authentication state management
 */

import { useState, useEffect } from 'react';
import { authService, AuthState, User } from '../services/AuthService';

export function useAuth() {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔐 useAuth hook initializing...');
  }
  const [authState, setAuthState] = useState<AuthState>(() => {
    const state = authService.getState();
    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 Initial auth state:', state);
    }
    return state;
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [requiredFeature, setRequiredFeature] = useState<string | undefined>();

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 Setting up auth state subscription...');
    }
    // Subscribe to auth state changes
    const unsubscribe = authService.subscribe((state) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔐 Auth state changed:', state);
      }
      setAuthState(state);
    });

    return () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔐 Cleaning up auth subscription');
      }
      unsubscribe();
    };
  }, []);

  // Check if user is authenticated
  const isAuthenticated = authState.isAuthenticated;

  // Get current user
  const user = authState.user;

  // Check if user has permission for a feature
  const hasPermission = (feature: string): boolean => {
    return authService.hasPermission(feature);
  };

  // Require authentication for a feature
  const requireAuth = (feature?: string): boolean => {
    if (!isAuthenticated) {
      setRequiredFeature(feature);
      setShowAuthModal(true);
      return false;
    }

    if (feature && !hasPermission(feature)) {
      // User is authenticated but doesn't have permission
      // Show upgrade prompt
      setRequiredFeature(feature);
      setShowAuthModal(true);
      return false;
    }

    return true;
  };

  // Login
  const login = async (email: string, password: string): Promise<User> => {
    return authService.login(email, password);
  };

  // Register
  const register = async (email: string, password: string, name: string): Promise<User> => {
    return authService.register(email, password, name);
  };

  // Logout
  const logout = async () => {
    await authService.logout();
  };

  // Update profile
  const updateProfile = async (updates: Partial<User>): Promise<User> => {
    return authService.updateProfile(updates);
  };

  // Update subscription
  const updateSubscription = async (plan: 'free' | 'pro' | 'enterprise') => {
    return authService.updateSubscription(plan);
  };

  // Close auth modal
  const closeAuthModal = () => {
    setShowAuthModal(false);
    setRequiredFeature(undefined);
  };

  return {
    // State
    isAuthenticated,
    user,
    loading: authState.loading,
    error: authState.error,
    
    // Modal state
    showAuthModal,
    requiredFeature,
    
    // Actions
    login,
    register,
    logout,
    updateProfile,
    updateSubscription,
    hasPermission,
    requireAuth,
    closeAuthModal,
  };
}

// Hook for requiring authentication in components
export function useRequireAuth(feature?: string) {
  const { requireAuth, isAuthenticated, hasPermission } = useAuth();

  useEffect(() => {
    requireAuth(feature);
  }, [feature, isAuthenticated]);

  return {
    isAuthenticated,
    hasAccess: feature ? hasPermission(feature) : isAuthenticated,
  };
}