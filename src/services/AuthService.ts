/**
 * Authentication Service
 * Manages user authentication and authorization
 */

import { eventSystem } from './VB6EventSystem';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'user' | 'developer' | 'admin';
  createdAt: Date;
  lastLogin: Date;
  preferences: UserPreferences;
  subscription?: Subscription;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  autoSave: boolean;
  collaborationNotifications: boolean;
  marketplaceNotifications: boolean;
}

export interface Subscription {
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'cancelled' | 'expired';
  expiresAt: Date;
  features: string[];
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

class AuthService {
  private static instance: AuthService;
  private state: AuthState = {
    isAuthenticated: false,
    user: null,
    token: null,
    loading: false,
    error: null,
  };
  
  private listeners: Set<(state: AuthState) => void> = new Set();
  private refreshTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.loadStoredAuth();
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Subscribe to auth state changes
  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.add(listener);
    listener(this.state); // Call immediately with current state
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Notify all listeners of state change
  private notify() {
    this.listeners.forEach(listener => listener(this.state));
  }

  // Update state
  private setState(updates: Partial<AuthState>) {
    this.state = { ...this.state, ...updates };
    this.notify();
  }

  // Load stored authentication
  private loadStoredAuth() {
    const storedToken = localStorage.getItem('vb6_auth_token');
    const storedUser = localStorage.getItem('vb6_auth_user');

    if (storedToken && storedUser) {
      try {
        const user = JSON.parse(storedUser);
        this.setState({
          isAuthenticated: true,
          user,
          token: storedToken,
        });
        this.scheduleTokenRefresh();
      } catch (error) {
        this.clearAuth();
      }
    }
  }

  // Login
  async login(email: string, password: string): Promise<User> {
    this.setState({ loading: true, error: null });

    try {
      // In production, this would call the actual auth API
      const response = await this.mockAuthAPI('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      const { user, token } = response;

      // Store auth data
      localStorage.setItem('vb6_auth_token', token);
      localStorage.setItem('vb6_auth_user', JSON.stringify(user));

      this.setState({
        isAuthenticated: true,
        user,
        token,
        loading: false,
      });

      this.scheduleTokenRefresh();
      eventSystem.fire('Auth', 'Login', { user });

      return user;
    } catch (error: any) {
      this.setState({
        loading: false,
        error: error.message || 'Login failed',
      });
      throw error;
    }
  }

  // Register
  async register(email: string, password: string, name: string): Promise<User> {
    this.setState({ loading: true, error: null });

    try {
      const response = await this.mockAuthAPI('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name }),
      });

      const { user, token } = response;

      localStorage.setItem('vb6_auth_token', token);
      localStorage.setItem('vb6_auth_user', JSON.stringify(user));

      this.setState({
        isAuthenticated: true,
        user,
        token,
        loading: false,
      });

      this.scheduleTokenRefresh();
      eventSystem.fire('Auth', 'Register', { user });

      return user;
    } catch (error: any) {
      this.setState({
        loading: false,
        error: error.message || 'Registration failed',
      });
      throw error;
    }
  }

  // Logout
  async logout() {
    this.clearAuth();
    eventSystem.fire('Auth', 'Logout', {});
  }

  // Clear authentication
  private clearAuth() {
    localStorage.removeItem('vb6_auth_token');
    localStorage.removeItem('vb6_auth_user');
    
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    this.setState({
      isAuthenticated: false,
      user: null,
      token: null,
      error: null,
    });
  }

  // Refresh token
  async refreshToken() {
    if (!this.state.token) return;

    try {
      const response = await this.mockAuthAPI('/auth/refresh', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.state.token}`,
        },
      });

      const { token } = response;
      localStorage.setItem('vb6_auth_token', token);
      
      this.setState({ token });
      this.scheduleTokenRefresh();
    } catch (error) {
      this.clearAuth();
    }
  }

  // Schedule token refresh
  private scheduleTokenRefresh() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    // Refresh token every 30 minutes
    this.refreshTimer = setTimeout(() => {
      this.refreshToken();
    }, 30 * 60 * 1000);
  }

  // Update user profile
  async updateProfile(updates: Partial<User>): Promise<User> {
    if (!this.state.user) throw new Error('Not authenticated');

    this.setState({ loading: true, error: null });

    try {
      const response = await this.mockAuthAPI('/auth/profile', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${this.state.token}`,
        },
        body: JSON.stringify(updates),
      });

      const { user } = response;
      localStorage.setItem('vb6_auth_user', JSON.stringify(user));

      this.setState({
        user,
        loading: false,
      });

      eventSystem.fire('Auth', 'ProfileUpdated', { user });

      return user;
    } catch (error: any) {
      this.setState({
        loading: false,
        error: error.message || 'Update failed',
      });
      throw error;
    }
  }

  // Update subscription
  async updateSubscription(plan: 'free' | 'pro' | 'enterprise'): Promise<Subscription> {
    if (!this.state.user) throw new Error('Not authenticated');

    this.setState({ loading: true, error: null });

    try {
      const response = await this.mockAuthAPI('/auth/subscription', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.state.token}`,
        },
        body: JSON.stringify({ plan }),
      });

      const { subscription } = response;
      
      const updatedUser = {
        ...this.state.user,
        subscription,
      };

      localStorage.setItem('vb6_auth_user', JSON.stringify(updatedUser));

      this.setState({
        user: updatedUser,
        loading: false,
      });

      eventSystem.fire('Auth', 'SubscriptionUpdated', { subscription });

      return subscription;
    } catch (error: any) {
      this.setState({
        loading: false,
        error: error.message || 'Subscription update failed',
      });
      throw error;
    }
  }

  // Check if user has permission
  hasPermission(feature: string): boolean {
    if (!this.state.user) return false;

    // Admin has all permissions
    if (this.state.user.role === 'admin') return true;

    // Check subscription features
    if (this.state.user.subscription?.status === 'active') {
      return this.state.user.subscription.features.includes(feature);
    }

    // Free tier permissions
    const freeFeatures = [
      'basic_editor',
      'basic_debugging',
      'marketplace_browse',
      'collaboration_view',
    ];

    return freeFeatures.includes(feature);
  }

  // Get current state
  getState(): AuthState {
    return this.state;
  }

  // Mock Auth API (replace with real API in production)
  private async mockAuthAPI(endpoint: string, options: RequestInit): Promise<any> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const mockUser: User = {
      id: 'user_' + Date.now(),
      email: 'user@example.com',
      name: 'John Doe',
      avatar: 'https://i.pravatar.cc/150',
      role: 'developer',
      createdAt: new Date(),
      lastLogin: new Date(),
      preferences: {
        theme: 'dark',
        language: 'en',
        autoSave: true,
        collaborationNotifications: true,
        marketplaceNotifications: true,
      },
      subscription: {
        plan: 'pro',
        status: 'active',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        features: [
          'advanced_editor',
          'advanced_debugging',
          'marketplace_full',
          'collaboration_full',
          'ai_assistant',
          'cloud_sync',
          'priority_support',
        ],
      },
    };

    const mockToken = 'mock_jwt_token_' + Date.now();

    switch (endpoint) {
      case '/auth/login':
      case '/auth/register':
        return { user: mockUser, token: mockToken };
      
      case '/auth/refresh':
        return { token: 'refreshed_' + mockToken };
      
      case '/auth/profile': {
        const updates = JSON.parse(options.body as string);
        return { user: { ...mockUser, ...updates } };
      }
      
      case '/auth/subscription': {
        const { plan } = JSON.parse(options.body as string);
        return {
          subscription: {
            ...mockUser.subscription,
            plan,
          },
        };
      }
      
      default:
        throw new Error('Unknown endpoint');
    }
  }
}

export const authService = AuthService.getInstance();