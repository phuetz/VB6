import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import AuthService from '../../services/AuthService';

// Mock crypto API
global.crypto = {
  getRandomValues: (arr: Uint8Array) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  },
  subtle: {
    digest: async (algorithm: string, data: BufferSource) => {
      // Mock SHA-256
      return new ArrayBuffer(32);
    },
    encrypt: async (algorithm: any, key: any, data: BufferSource) => {
      return new ArrayBuffer(data.byteLength);
    },
    decrypt: async (algorithm: any, key: any, data: BufferSource) => {
      return new ArrayBuffer(data.byteLength);
    },
    generateKey: async (algorithm: any, extractable: boolean, keyUsages: string[]) => {
      return {} as CryptoKey;
    },
    importKey: async (format: string, keyData: any, algorithm: any, extractable: boolean, keyUsages: string[]) => {
      return {} as CryptoKey;
    }
  }
} as any;

// Mock fetch
global.fetch = vi.fn();

describe('Authentication Tests', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
    
    // Reset fetch mock
    (global.fetch as any).mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('User Authentication', () => {
    it('should login with valid credentials', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          token: 'test-token',
          user: {
            id: '123',
            username: 'testuser',
            email: 'test@example.com'
          }
        })
      });

      const result = await authService.login('testuser', 'password123');
      
      expect(result.success).toBe(true);
      expect(result.token).toBe('test-token');
      expect(result.user.username).toBe('testuser');
      expect(authService.isAuthenticated()).toBe(true);
    });

    it('should fail login with invalid credentials', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: 'Invalid credentials'
        })
      });

      const result = await authService.login('testuser', 'wrongpassword');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
      expect(authService.isAuthenticated()).toBe(false);
    });

    it('should logout user', async () => {
      // Login first
      authService.setAuthToken('test-token');
      authService.setCurrentUser({
        id: '123',
        username: 'testuser',
        email: 'test@example.com'
      });

      expect(authService.isAuthenticated()).toBe(true);
      
      await authService.logout();
      
      expect(authService.isAuthenticated()).toBe(false);
      expect(authService.getCurrentUser()).toBeNull();
      expect(localStorage.getItem('auth_token')).toBeNull();
    });

    it('should handle session timeout', async () => {
      authService.setAuthToken('test-token', { expiresIn: 1 }); // 1 second
      
      expect(authService.isAuthenticated()).toBe(true);
      
      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      expect(authService.isAuthenticated()).toBe(false);
    });

    it('should refresh token before expiration', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          token: 'new-token',
          expiresIn: 3600
        })
      });

      authService.setAuthToken('old-token', { expiresIn: 60 });
      
      const newToken = await authService.refreshToken();
      
      expect(newToken).toBe('new-token');
      expect(authService.getAuthToken()).toBe('new-token');
    });
  });

  describe('User Registration', () => {
    it('should register new user', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          user: {
            id: '456',
            username: 'newuser',
            email: 'new@example.com'
          }
        })
      });

      const result = await authService.register({
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123'
      });

      expect(result.success).toBe(true);
      expect(result.user.username).toBe('newuser');
    });

    it('should validate registration data', async () => {
      const invalidData = {
        username: 'a', // Too short
        email: 'invalid-email',
        password: '123' // Too weak
      };

      const validation = authService.validateRegistration(invalidData);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors).toHaveProperty('username');
      expect(validation.errors).toHaveProperty('email');
      expect(validation.errors).toHaveProperty('password');
    });

    it('should check username availability', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ available: true })
      });

      const available = await authService.checkUsernameAvailability('newuser');
      expect(available).toBe(true);
    });

    it('should enforce password requirements', () => {
      const weakPassword = '123';
      const strongPassword = 'MyStr0ng!Pass';
      
      expect(authService.checkPasswordStrength(weakPassword)).toBe('weak');
      expect(authService.checkPasswordStrength(strongPassword)).toBe('strong');
    });
  });

  describe('Password Management', () => {
    it('should hash passwords securely', async () => {
      const password = 'mypassword';
      const hash1 = await authService.hashPassword(password);
      const hash2 = await authService.hashPassword(password);
      
      expect(hash1).toBeDefined();
      expect(hash2).toBeDefined();
      expect(hash1).not.toBe(hash2); // Different salts
    });

    it('should verify password hash', async () => {
      const password = 'mypassword';
      const hash = await authService.hashPassword(password);
      
      const valid = await authService.verifyPassword(password, hash);
      const invalid = await authService.verifyPassword('wrongpassword', hash);
      
      expect(valid).toBe(true);
      expect(invalid).toBe(false);
    });

    it('should handle password reset request', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Reset email sent'
        })
      });

      const result = await authService.requestPasswordReset('test@example.com');
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Reset email sent');
    });

    it('should reset password with valid token', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true
        })
      });

      const result = await authService.resetPassword('reset-token', 'newpassword');
      
      expect(result.success).toBe(true);
    });

    it('should change password for authenticated user', async () => {
      authService.setAuthToken('test-token');
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true
        })
      });

      const result = await authService.changePassword('oldpass', 'newpass');
      
      expect(result.success).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token'
          })
        })
      );
    });
  });

  describe('OAuth Integration', () => {
    it('should initiate OAuth flow', async () => {
      const url = authService.getOAuthURL('google');
      
      expect(url).toContain('oauth/authorize');
      expect(url).toContain('provider=google');
      expect(url).toContain('redirect_uri=');
    });

    it('should handle OAuth callback', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          token: 'oauth-token',
          user: {
            id: '789',
            username: 'oauthuser',
            provider: 'google'
          }
        })
      });

      const result = await authService.handleOAuthCallback('auth-code', 'google');
      
      expect(result.success).toBe(true);
      expect(result.token).toBe('oauth-token');
      expect(result.user.provider).toBe('google');
    });

    it('should link OAuth account to existing user', async () => {
      authService.setAuthToken('existing-token');
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          linked: true
        })
      });

      const result = await authService.linkOAuthAccount('google', 'oauth-token');
      
      expect(result.success).toBe(true);
      expect(result.linked).toBe(true);
    });

    it('should unlink OAuth account', async () => {
      authService.setAuthToken('test-token');
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true
        })
      });

      const result = await authService.unlinkOAuthAccount('google');
      
      expect(result.success).toBe(true);
    });
  });

  describe('Two-Factor Authentication', () => {
    it('should enable 2FA', async () => {
      authService.setAuthToken('test-token');
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          secret: 'JBSWY3DPEHPK3PXP',
          qrCode: 'data:image/png;base64,...'
        })
      });

      const result = await authService.enable2FA();
      
      expect(result.secret).toBeDefined();
      expect(result.qrCode).toBeDefined();
    });

    it('should verify 2FA code', async () => {
      authService.setAuthToken('test-token');
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          valid: true
        })
      });

      const valid = await authService.verify2FA('123456');
      
      expect(valid).toBe(true);
    });

    it('should disable 2FA', async () => {
      authService.setAuthToken('test-token');
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true
        })
      });

      const result = await authService.disable2FA('123456');
      
      expect(result.success).toBe(true);
    });

    it('should generate backup codes', async () => {
      authService.setAuthToken('test-token');
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          codes: ['CODE1', 'CODE2', 'CODE3', 'CODE4', 'CODE5']
        })
      });

      const codes = await authService.generateBackupCodes();
      
      expect(codes).toHaveLength(5);
      expect(codes[0]).toBe('CODE1');
    });
  });

  describe('Session Management', () => {
    it('should track active sessions', async () => {
      authService.setAuthToken('test-token');
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sessions: [
            { id: 's1', device: 'Chrome on Windows', lastActive: Date.now() },
            { id: 's2', device: 'Safari on macOS', lastActive: Date.now() - 3600000 }
          ]
        })
      });

      const sessions = await authService.getActiveSessions();
      
      expect(sessions).toHaveLength(2);
      expect(sessions[0].device).toBe('Chrome on Windows');
    });

    it('should revoke specific session', async () => {
      authService.setAuthToken('test-token');
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true
        })
      });

      const result = await authService.revokeSession('session-id');
      
      expect(result.success).toBe(true);
    });

    it('should revoke all other sessions', async () => {
      authService.setAuthToken('test-token');
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          revoked: 3
        })
      });

      const result = await authService.revokeAllOtherSessions();
      
      expect(result.revoked).toBe(3);
    });

    it('should handle concurrent sessions limit', async () => {
      const sessions = await authService.checkConcurrentSessions();
      
      expect(sessions).toBeLessThanOrEqual(5); // Max 5 concurrent sessions
    });
  });

  describe('Permission System', () => {
    it('should check user permissions', () => {
      authService.setCurrentUser({
        id: '123',
        username: 'testuser',
        permissions: ['read', 'write']
      });

      expect(authService.hasPermission('read')).toBe(true);
      expect(authService.hasPermission('write')).toBe(true);
      expect(authService.hasPermission('delete')).toBe(false);
    });

    it('should check multiple permissions', () => {
      authService.setCurrentUser({
        id: '123',
        username: 'testuser',
        permissions: ['read', 'write']
      });

      expect(authService.hasAllPermissions(['read', 'write'])).toBe(true);
      expect(authService.hasAllPermissions(['read', 'write', 'delete'])).toBe(false);
    });

    it('should check any permission', () => {
      authService.setCurrentUser({
        id: '123',
        username: 'testuser',
        permissions: ['read']
      });

      expect(authService.hasAnyPermission(['read', 'write'])).toBe(true);
      expect(authService.hasAnyPermission(['write', 'delete'])).toBe(false);
    });

    it('should handle role-based permissions', () => {
      authService.setCurrentUser({
        id: '123',
        username: 'testuser',
        role: 'admin',
        permissions: []
      });

      // Admin role has all permissions
      expect(authService.hasRole('admin')).toBe(true);
      expect(authService.hasPermission('any-permission')).toBe(true);
    });
  });

  describe('Security Features', () => {
    it('should detect and prevent brute force attacks', async () => {
      const attempts = [];
      
      for (let i = 0; i < 5; i++) {
        (global.fetch as any).mockResolvedValueOnce({
          ok: false,
          status: 401
        });
        
        attempts.push(authService.login('user', 'wrong'));
      }

      await Promise.all(attempts);
      
      // Should be locked after 5 failed attempts
      const result = await authService.login('user', 'correct');
      expect(result.error).toContain('locked');
    });

    it('should implement rate limiting', async () => {
      const requests = [];
      
      for (let i = 0; i < 10; i++) {
        requests.push(authService.checkRateLimit('login'));
      }

      const results = await Promise.all(requests);
      const blocked = results.filter(r => !r);
      
      expect(blocked.length).toBeGreaterThan(0); // Some requests should be blocked
    });

    it('should validate CSRF tokens', () => {
      const token = authService.generateCSRFToken();
      
      expect(authService.validateCSRFToken(token)).toBe(true);
      expect(authService.validateCSRFToken('invalid-token')).toBe(false);
    });

    it('should sanitize user input', () => {
      const maliciousInput = '<script>alert("XSS")</script>';
      const sanitized = authService.sanitizeInput(maliciousInput);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('</script>');
    });

    it('should encrypt sensitive data', async () => {
      const sensitiveData = 'credit-card-number';
      const encrypted = await authService.encryptData(sensitiveData);
      
      expect(encrypted).not.toBe(sensitiveData);
      expect(encrypted).toBeDefined();
      
      const decrypted = await authService.decryptData(encrypted);
      expect(decrypted).toBe(sensitiveData);
    });
  });

  describe('Account Management', () => {
    it('should update user profile', async () => {
      authService.setAuthToken('test-token');
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          user: {
            id: '123',
            username: 'testuser',
            displayName: 'Test User'
          }
        })
      });

      const result = await authService.updateProfile({
        displayName: 'Test User'
      });

      expect(result.success).toBe(true);
      expect(result.user.displayName).toBe('Test User');
    });

    it('should verify email address', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          verified: true
        })
      });

      const result = await authService.verifyEmail('verification-token');
      
      expect(result.success).toBe(true);
      expect(result.verified).toBe(true);
    });

    it('should handle account deletion', async () => {
      authService.setAuthToken('test-token');
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          deleted: true
        })
      });

      const result = await authService.deleteAccount('password123');
      
      expect(result.success).toBe(true);
      expect(result.deleted).toBe(true);
      expect(authService.isAuthenticated()).toBe(false);
    });

    it('should export user data (GDPR)', async () => {
      authService.setAuthToken('test-token');
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            profile: {},
            projects: [],
            settings: {}
          }
        })
      });

      const data = await authService.exportUserData();
      
      expect(data).toHaveProperty('profile');
      expect(data).toHaveProperty('projects');
      expect(data).toHaveProperty('settings');
    });
  });

  describe('Token Storage', () => {
    it('should store tokens securely', () => {
      authService.setAuthToken('test-token', { secure: true });
      
      // Should not be in plain localStorage
      expect(localStorage.getItem('auth_token')).toBeNull();
      
      // Should be encrypted
      const stored = localStorage.getItem('auth_token_secure');
      expect(stored).toBeDefined();
      expect(stored).not.toBe('test-token');
    });

    it('should handle token rotation', async () => {
      authService.enableTokenRotation(60000); // Rotate every minute
      
      authService.setAuthToken('initial-token');
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          token: 'rotated-token'
        })
      });

      await new Promise(resolve => setTimeout(resolve, 61000));
      
      expect(authService.getAuthToken()).toBe('rotated-token');
    });

    it('should clear tokens on security breach', () => {
      authService.setAuthToken('test-token');
      authService.setCurrentUser({ id: '123', username: 'test' });
      
      authService.handleSecurityBreach();
      
      expect(authService.getAuthToken()).toBeNull();
      expect(authService.getCurrentUser()).toBeNull();
      expect(localStorage.length).toBe(0);
      expect(sessionStorage.length).toBe(0);
    });
  });

  describe('Audit Logging', () => {
    it('should log authentication events', async () => {
      const logs = [];
      authService.onAuditLog((log) => logs.push(log));
      
      await authService.login('testuser', 'password');
      
      expect(logs).toHaveLength(1);
      expect(logs[0].event).toBe('login_attempt');
      expect(logs[0].username).toBe('testuser');
    });

    it('should log security events', () => {
      const logs = [];
      authService.onAuditLog((log) => logs.push(log));
      
      authService.handleSecurityBreach();
      
      expect(logs.some(log => log.event === 'security_breach')).toBe(true);
    });

    it('should track failed login attempts', async () => {
      const logs = [];
      authService.onAuditLog((log) => logs.push(log));
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      await authService.login('testuser', 'wrongpass');
      
      const failedLogs = logs.filter(log => log.event === 'login_failed');
      expect(failedLogs).toHaveLength(1);
    });
  });
});