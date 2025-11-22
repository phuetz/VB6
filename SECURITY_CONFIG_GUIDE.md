# Security Configuration Guide

## Overview

This guide documents the security configuration fixes applied to prevent common deployment vulnerabilities.

## Fixed Vulnerabilities

### 1. Development Server Exposure (vite.config.ts)
**Issue**: `host: true` exposed development server to all network interfaces
**Fix**: Conditional host binding based on environment
```typescript
host: process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost'
```

### 2. Weak Content Security Policy (server/src/index.js)
**Issue**: CSP allowed `'unsafe-inline'` styles and unrestricted image sources
**Fix**: 
- Removed `'unsafe-inline'` and replaced with nonce-based CSP
- Restricted image sources to `'self'` and `data:`
- Added comprehensive CSP directives

### 3. Unvalidated CORS Origins (server/src/index.js)
**Issue**: CORS origin accepted any value from environment variable
**Fix**: 
- Whitelist of allowed origins
- URL validation for CLIENT_URL
- HTTPS enforcement for production origins

### 4. Excessive Body Size Limits (server/src/index.js)
**Issue**: 50MB body size limit enabled potential DoS attacks
**Fix**: 
- Reduced default limit to 10MB (configurable)
- Added request monitoring for large bodies
- Parameter limit enforcement

### 5. Insecure Environment Defaults (.env.example)
**Issue**: Production defaults and weak placeholder values
**Fix**: 
- Development environment defaults
- Strong placeholder generation commands
- Security warnings and validation

## Security Checklist for Deployment

### Before Production:
- [ ] Generate secure CSP_NONCE: `openssl rand -hex 16`
- [ ] Generate secure SESSION_SECRET: `openssl rand -hex 32`
- [ ] Change default GRAFANA_ADMIN_USER
- [ ] Set strong GRAFANA_PASSWORD (minimum 12 characters)
- [ ] Configure appropriate CORS_ORIGIN for production domain
- [ ] Set NODE_ENV=production and VITE_APP_ENV=production
- [ ] Configure SSL certificates if using HTTPS
- [ ] Review and adjust MAX_BODY_SIZE based on application needs
- [ ] Set appropriate RATE_LIMIT_REQUESTS and RATE_LIMIT_WINDOW

### Monitoring and Maintenance:
- [ ] Monitor large request logs for potential abuse
- [ ] Regularly rotate CSP nonces and session secrets
- [ ] Review CORS origins periodically
- [ ] Update security headers as needed
- [ ] Monitor rate limiting effectiveness

## Environment Variables Reference

### Security Headers
- `CSP_NONCE`: Content Security Policy nonce for inline scripts/styles
- `SESSION_SECRET`: Secret key for session encryption
- `MAX_BODY_SIZE`: Maximum request body size (default: 10mb)

### CORS Configuration
- `CLIENT_URL`: Allowed client origin (must be HTTPS in production)
- `CORS_ORIGIN`: Primary CORS origin

### Rate Limiting
- `RATE_LIMIT_REQUESTS`: Number of requests per window (default: 100)
- `RATE_LIMIT_WINDOW`: Time window in seconds (default: 60)

### Monitoring
- `GRAFANA_ADMIN_USER`: Admin username (change from default)
- `GRAFANA_PASSWORD`: Admin password (minimum 12 characters)

## Additional Security Recommendations

1. **Use HTTPS in Production**: Always use SSL/TLS in production environments
2. **Regular Security Updates**: Keep all dependencies updated
3. **Network Security**: Use firewalls and proper network segmentation
4. **Access Control**: Implement proper authentication and authorization
5. **Monitoring**: Set up comprehensive logging and monitoring
6. **Backup Security**: Encrypt backups and secure backup storage

## Testing Security Configuration

```bash
# Test CSP headers
curl -I http://localhost:8080 | grep -i content-security-policy

# Test CORS configuration
curl -H "Origin: https://malicious-site.com" -I http://localhost:8080

# Test rate limiting
for i in {1..105}; do curl http://localhost:8080/api/test; done

# Test body size limits
curl -X POST -H "Content-Type: application/json" \
  -d "$(head -c 15M /dev/zero | base64)" \
  http://localhost:8080/api/test
```

## Incident Response

If security vulnerabilities are discovered:
1. Document the vulnerability
2. Assess impact and affected systems
3. Apply fixes immediately
4. Update this guide
5. Notify relevant stakeholders
6. Review and improve security practices