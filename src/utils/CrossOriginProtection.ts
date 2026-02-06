/**
 * CROSS-ORIGIN RESOURCE TIMING ATTACK BUG FIX: Comprehensive cross-origin security protection
 *
 * This module provides protection against:
 * - Cross-origin resource timing attacks
 * - CORS bypass attempts
 * - Cross-origin information leakage
 * - Timing-based side-channel attacks via network requests
 * - DNS timing attacks
 */

export interface CrossOriginThreat {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  origin: string;
  timestamp: number;
  blocked: boolean;
}

export interface ResourceTimingEntry {
  name: string;
  startTime: number;
  duration: number;
  transferSize: number;
  origin: string;
  suspicious: boolean;
}

export interface CORSConfiguration {
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  maxAge: number;
  credentials: boolean;
  enableResourceTimingProtection: boolean;
  enableTimingJitter: boolean;
}

/**
 * CROSS-ORIGIN RESOURCE TIMING ATTACK BUG FIX: Main protection class
 */
export class CrossOriginProtection {
  private static instance: CrossOriginProtection;
  private config: CORSConfiguration;
  private threats: CrossOriginThreat[] = [];
  private resourceTimings: ResourceTimingEntry[] = [];
  private originalFetch: typeof fetch;
  private originalXMLHttpRequest: typeof XMLHttpRequest;
  private timingObfuscationMap: Map<string, number> = new Map();
  private originValidationCache: Map<string, { valid: boolean; timestamp: number }> = new Map();

  private readonly DEFAULT_CONFIG: CORSConfiguration = {
    allowedOrigins: ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000'],
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    maxAge: 86400, // 24 hours
    credentials: true,
    enableResourceTimingProtection: true,
    enableTimingJitter: true,
  };

  static getInstance(config?: Partial<CORSConfiguration>): CrossOriginProtection {
    if (!this.instance) {
      this.instance = new CrossOriginProtection(config);
    }
    return this.instance;
  }

  private constructor(config?: Partial<CORSConfiguration>) {
    this.config = { ...this.DEFAULT_CONFIG, ...config };
    this.initializeProtection();
  }

  /**
   * CROSS-ORIGIN RESOURCE TIMING ATTACK BUG FIX: Initialize comprehensive protection
   */
  private initializeProtection(): void {
    // Store original implementations
    if (typeof fetch !== 'undefined') {
      this.originalFetch = fetch.bind(window);
      this.patchFetch();
    }

    if (typeof XMLHttpRequest !== 'undefined') {
      this.originalXMLHttpRequest = XMLHttpRequest;
      this.patchXMLHttpRequest();
    }

    // Monitor performance timing APIs
    if (this.config.enableResourceTimingProtection) {
      this.monitorResourceTiming();
    }

    // Block dangerous CSP bypasses
    this.blockCSPBypass();

    // Monitor postMessage for cross-origin attacks
    this.monitorPostMessage();
  }

  /**
   * CROSS-ORIGIN RESOURCE TIMING ATTACK BUG FIX: Patch fetch API
   */
  private patchFetch(): void {
    const win = window as Window & Record<string, unknown>;
    win.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      const origin = this.extractOrigin(url);

      // Validate cross-origin request
      if (!this.validateCrossOriginRequest(origin, 'fetch')) {
        const threat: CrossOriginThreat = {
          type: 'blocked_fetch_request',
          severity: 'high',
          description: `Blocked cross-origin fetch request to: ${origin}`,
          origin,
          timestamp: Date.now(),
          blocked: true,
        };

        this.recordThreat(threat);
        throw new Error(`Cross-origin request blocked: ${origin}`);
      }

      // Add timing jitter
      if (this.config.enableTimingJitter) {
        await this.addNetworkTimingJitter();
      }

      // Execute request with resource timing protection
      const startTime = performance.now();

      try {
        // Add secure headers
        const secureInit = this.addSecureHeaders(init, origin);

        const response = await this.originalFetch(input, secureInit);

        // Record and obfuscate timing
        const duration = performance.now() - startTime;
        this.recordResourceTiming(
          url,
          startTime,
          duration,
          response.headers.get('content-length'),
          origin
        );

        // Validate response
        this.validateResponse(response, origin);

        return response;
      } catch (error) {
        // Record failed request
        const duration = performance.now() - startTime;
        this.recordResourceTiming(url, startTime, duration, 0, origin, true);
        throw error;
      }
    };
  }

  /**
   * CROSS-ORIGIN RESOURCE TIMING ATTACK BUG FIX: Patch XMLHttpRequest
   */
  private patchXMLHttpRequest(): void {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const CrossOriginProtectionInstance = this;

    const win = window as Window & Record<string, unknown>;
    win.XMLHttpRequest = class extends CrossOriginProtectionInstance.originalXMLHttpRequest {
      private _url: string = '';
      private _origin: string = '';
      private _startTime: number = 0;

      constructor() {
        super();

        // Override addEventListener to monitor events
        const originalAddEventListener = this.addEventListener.bind(this);
        this.addEventListener = function (
          type: string,
          listener: EventListenerOrEventListenerObject,
          options?: boolean | AddEventListenerOptions
        ) {
          // Wrap listener to add timing protection
          const wrappedListener = CrossOriginProtectionInstance.wrapXHREventListener(
            type,
            listener,
            this._origin
          );
          return originalAddEventListener(type, wrappedListener, options);
        };
      }

      open(
        method: string,
        url: string,
        async?: boolean,
        user?: string | null,
        password?: string | null
      ): void {
        this._url = url;
        this._origin = CrossOriginProtectionInstance.extractOrigin(url);

        // Validate cross-origin request
        if (
          !CrossOriginProtectionInstance.validateCrossOriginRequest(this._origin, 'XMLHttpRequest')
        ) {
          const threat: CrossOriginThreat = {
            type: 'blocked_xhr_request',
            severity: 'high',
            description: `Blocked cross-origin XHR request to: ${this._origin}`,
            origin: this._origin,
            timestamp: Date.now(),
            blocked: true,
          };

          CrossOriginProtectionInstance.recordThreat(threat);
          throw new Error(`Cross-origin XHR request blocked: ${this._origin}`);
        }

        return super.open(method, url, async, user, password);
      }

      send(body?: Document | XMLHttpRequestBodyInit | null): void {
        this._startTime = performance.now();

        // Add timing jitter before send
        if (CrossOriginProtectionInstance.config.enableTimingJitter) {
          setTimeout(() => {
            super.send(body);
          }, CrossOriginProtectionInstance.getTimingJitter());
        } else {
          super.send(body);
        }
      }

      setRequestHeader(name: string, value: string): void {
        // Validate headers for security
        if (CrossOriginProtectionInstance.isSecureHeader(name, value, this._origin)) {
          super.setRequestHeader(name, value);
        } else {
          console.warn(`Insecure header blocked: ${name}`);
        }
      }
    };
  }

  /**
   * CROSS-ORIGIN RESOURCE TIMING ATTACK BUG FIX: Wrap XHR event listeners
   */
  private wrapXHREventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    origin: string
  ): EventListenerOrEventListenerObject {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const protection = this;

    return function (this: XMLHttpRequest, event: Event) {
      // Record timing for monitoring
      if (type === 'loadend' || type === 'load') {
        const xhrWithMeta = this as XMLHttpRequest & { _startTime: number; _url: string };
        const duration = performance.now() - xhrWithMeta._startTime;
        const contentLength = this.getResponseHeader('content-length');
        const size = contentLength ? parseInt(contentLength, 10) : 0;

        protection.recordResourceTiming(
          xhrWithMeta._url,
          xhrWithMeta._startTime,
          duration,
          size,
          origin
        );
      }

      // Add timing jitter before calling original listener
      if (protection.config.enableTimingJitter) {
        setTimeout(() => {
          if (typeof listener === 'function') {
            listener.call(this, event);
          } else {
            listener.handleEvent.call(listener, event);
          }
        }, protection.getTimingJitter());
      } else {
        if (typeof listener === 'function') {
          listener.call(this, event);
        } else {
          listener.handleEvent.call(listener, event);
        }
      }
    };
  }

  /**
   * CROSS-ORIGIN RESOURCE TIMING ATTACK BUG FIX: Monitor resource timing API
   */
  private monitorResourceTiming(): void {
    if (typeof PerformanceObserver !== 'undefined') {
      try {
        const observer = new PerformanceObserver(list => {
          const entries = list.getEntries();

          for (const entry of entries) {
            if (entry.entryType === 'resource') {
              const resourceEntry = entry as PerformanceResourceTiming;
              const origin = this.extractOrigin(resourceEntry.name);

              // Check for suspicious timing patterns
              const isSuspicious = this.detectSuspiciousResourceTiming(resourceEntry);

              if (isSuspicious) {
                this.recordThreat({
                  type: 'suspicious_resource_timing',
                  severity: 'medium',
                  description: `Suspicious resource timing pattern detected: ${resourceEntry.name}`,
                  origin,
                  timestamp: Date.now(),
                  blocked: false,
                });
              }

              // Obfuscate timing information
              this.obfuscateResourceTiming(resourceEntry);
            }
          }
        });

        observer.observe({ entryTypes: ['resource'] });
      } catch (error) {
        console.warn('PerformanceObserver not supported or failed to initialize');
      }
    }

    // Also patch performance.getEntriesByType
    if (typeof performance !== 'undefined' && performance.getEntriesByType) {
      const originalGetEntriesByType = performance.getEntriesByType.bind(performance);

      performance.getEntriesByType = (type: string): PerformanceEntry[] => {
        const entries = originalGetEntriesByType(type);

        if (type === 'resource') {
          // Return obfuscated timing data
          return entries.map(entry =>
            this.createObfuscatedResourceEntry(entry as PerformanceResourceTiming)
          );
        }

        return entries;
      };
    }
  }

  /**
   * CROSS-ORIGIN RESOURCE TIMING ATTACK BUG FIX: Block CSP bypass attempts
   */
  private blockCSPBypass(): void {
    // Monitor dynamic script creation
    if (typeof document !== 'undefined') {
      const originalCreateElement = document.createElement.bind(document);

      document.createElement = function <K extends keyof HTMLElementTagNameMap>(
        tagName: K,
        options?: ElementCreationOptions
      ): HTMLElementTagNameMap[K] {
        const element = originalCreateElement(tagName, options);

        if (tagName.toLowerCase() === 'script') {
          const scriptElement = element as unknown as HTMLScriptElement;

          // Monitor src attribute changes
          const originalSetAttribute = scriptElement.setAttribute.bind(scriptElement);
          scriptElement.setAttribute = function (name: string, value: string) {
            if (name.toLowerCase() === 'src') {
              const origin = CrossOriginProtection.getInstance().extractOrigin(value);

              if (
                !CrossOriginProtection.getInstance().validateCrossOriginRequest(origin, 'script')
              ) {
                CrossOriginProtection.getInstance().recordThreat({
                  type: 'blocked_script_injection',
                  severity: 'critical',
                  description: `Blocked cross-origin script injection: ${value}`,
                  origin,
                  timestamp: Date.now(),
                  blocked: true,
                });

                throw new Error(`Cross-origin script blocked: ${origin}`);
              }
            }

            return originalSetAttribute(name, value);
          };
        }

        return element;
      };
    }
  }

  /**
   * CROSS-ORIGIN RESOURCE TIMING ATTACK BUG FIX: Monitor postMessage
   */
  private monitorPostMessage(): void {
    if (typeof window !== 'undefined') {
      // Monitor outgoing postMessage
      const originalPostMessage = window.postMessage.bind(window);

      window.postMessage = (message: any, targetOrigin: string, transfer?: Transferable[]) => {
        // Validate target origin
        if (targetOrigin !== '*' && !this.validateOrigin(targetOrigin)) {
          this.recordThreat({
            type: 'blocked_postmessage',
            severity: 'medium',
            description: `Blocked postMessage to unauthorized origin: ${targetOrigin}`,
            origin: targetOrigin,
            timestamp: Date.now(),
            blocked: true,
          });

          throw new Error(`postMessage blocked to unauthorized origin: ${targetOrigin}`);
        }

        // Sanitize message data
        const sanitizedMessage = this.sanitizePostMessageData(message);

        return originalPostMessage(sanitizedMessage, targetOrigin, transfer);
      };

      // Monitor incoming postMessage
      window.addEventListener(
        'message',
        (event: MessageEvent) => {
          if (!this.validateOrigin(event.origin)) {
            this.recordThreat({
              type: 'untrusted_postmessage_received',
              severity: 'high',
              description: `Received postMessage from untrusted origin: ${event.origin}`,
              origin: event.origin,
              timestamp: Date.now(),
              blocked: false,
            });

            // Don't process the message
            event.stopImmediatePropagation();
            return;
          }

          // Validate message data
          if (!this.validatePostMessageData(event.data)) {
            this.recordThreat({
              type: 'malicious_postmessage_data',
              severity: 'high',
              description: `Malicious postMessage data from: ${event.origin}`,
              origin: event.origin,
              timestamp: Date.now(),
              blocked: false,
            });
          }
        },
        true
      ); // Use capture phase
    }
  }

  /**
   * CROSS-ORIGIN RESOURCE TIMING ATTACK BUG FIX: Validate cross-origin requests
   */
  private validateCrossOriginRequest(origin: string, requestType: string): boolean {
    // Check cache first
    const cacheKey = `${origin}_${requestType}`;
    const cached = this.originValidationCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < 300000) {
      // 5 minute cache
      return cached.valid;
    }

    // Same-origin is always allowed
    if (this.isSameOrigin(origin)) {
      this.originValidationCache.set(cacheKey, { valid: true, timestamp: Date.now() });
      return true;
    }

    // Check against allowed origins
    const isValid = this.config.allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin === '*') return true;
      if (allowedOrigin === origin) return true;

      // Support wildcard subdomains
      if (allowedOrigin.startsWith('*.')) {
        const domain = allowedOrigin.substring(2);
        return origin.endsWith('.' + domain) || origin === domain;
      }

      return false;
    });

    // Cache result
    this.originValidationCache.set(cacheKey, { valid: isValid, timestamp: Date.now() });

    return isValid;
  }

  /**
   * CROSS-ORIGIN RESOURCE TIMING ATTACK BUG FIX: Extract origin from URL
   */
  private extractOrigin(url: string): string {
    try {
      const urlObj = new URL(url, window.location.href);
      return `${urlObj.protocol}//${urlObj.host}`;
    } catch (error) {
      // If URL parsing fails, treat as same-origin
      return window.location.origin;
    }
  }

  /**
   * CROSS-ORIGIN RESOURCE TIMING ATTACK BUG FIX: Check if origin is same-origin
   */
  private isSameOrigin(origin: string): boolean {
    return origin === window.location.origin;
  }

  /**
   * CROSS-ORIGIN RESOURCE TIMING ATTACK BUG FIX: Validate origin
   */
  private validateOrigin(origin: string): boolean {
    // Null origin check
    if (!origin || origin === 'null') {
      return false;
    }

    return this.validateCrossOriginRequest(origin, 'general');
  }

  /**
   * CROSS-ORIGIN RESOURCE TIMING ATTACK BUG FIX: Add secure headers
   */
  private addSecureHeaders(init?: RequestInit, origin?: string): RequestInit {
    const secureInit: RequestInit = { ...init };

    if (!secureInit.headers) {
      secureInit.headers = {};
    }

    const headers = secureInit.headers as Record<string, string>;

    // Add CORS headers if cross-origin
    if (origin && !this.isSameOrigin(origin)) {
      headers['X-Requested-With'] = 'XMLHttpRequest';

      if (this.config.credentials) {
        secureInit.credentials = 'include';
      }
    }

    // Add security headers
    headers['X-Content-Type-Options'] = 'nosniff';
    headers['X-Frame-Options'] = 'DENY';
    headers['X-XSS-Protection'] = '1; mode=block';

    return secureInit;
  }

  /**
   * CROSS-ORIGIN RESOURCE TIMING ATTACK BUG FIX: Validate response
   */
  private validateResponse(response: Response, origin: string): void {
    // Check for suspicious response patterns
    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('text/html') && !this.isSameOrigin(origin)) {
      this.recordThreat({
        type: 'suspicious_html_response',
        severity: 'medium',
        description: `Cross-origin HTML response from: ${origin}`,
        origin,
        timestamp: Date.now(),
        blocked: false,
      });
    }

    // Check for missing CORS headers
    if (!this.isSameOrigin(origin)) {
      const corsOrigin = response.headers.get('access-control-allow-origin');
      if (!corsOrigin) {
        this.recordThreat({
          type: 'missing_cors_headers',
          severity: 'low',
          description: `Missing CORS headers from: ${origin}`,
          origin,
          timestamp: Date.now(),
          blocked: false,
        });
      }
    }
  }

  /**
   * CROSS-ORIGIN RESOURCE TIMING ATTACK BUG FIX: Check if header is secure
   */
  private isSecureHeader(name: string, value: string, origin: string): boolean {
    const lowerName = name.toLowerCase();

    // Block dangerous headers
    const dangerousHeaders = ['cookie', 'set-cookie', 'x-forwarded-for', 'x-real-ip', 'host'];

    if (dangerousHeaders.includes(lowerName)) {
      return false;
    }

    // Validate CORS headers
    if (!this.isSameOrigin(origin)) {
      const allowedCorsHeaders = this.config.allowedHeaders.map(h => h.toLowerCase());
      if (!allowedCorsHeaders.includes(lowerName) && !lowerName.startsWith('x-')) {
        return false;
      }
    }

    return true;
  }

  /**
   * CROSS-ORIGIN RESOURCE TIMING ATTACK BUG FIX: Add network timing jitter
   */
  private async addNetworkTimingJitter(): Promise<void> {
    const jitter = this.getTimingJitter();

    if (jitter > 0) {
      await new Promise(resolve => setTimeout(resolve, jitter));
    }
  }

  /**
   * CROSS-ORIGIN RESOURCE TIMING ATTACK BUG FIX: Get timing jitter
   */
  private getTimingJitter(): number {
    if (!this.config.enableTimingJitter) return 0;

    // Generate cryptographically secure jitter between 0-50ms
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint32Array(1);
      crypto.getRandomValues(array);
      return (array[0] / 0xffffffff) * 50;
    } else {
      return Math.random() * 50;
    }
  }

  /**
   * CROSS-ORIGIN RESOURCE TIMING ATTACK BUG FIX: Record resource timing
   */
  private recordResourceTiming(
    name: string,
    startTime: number,
    duration: number,
    transferSize: number | string | null,
    origin: string,
    failed: boolean = false
  ): void {
    const size = typeof transferSize === 'string' ? parseInt(transferSize, 10) : transferSize || 0;

    const entry: ResourceTimingEntry = {
      name,
      startTime: this.obfuscateTimingValue(startTime),
      duration: this.obfuscateTimingValue(duration),
      transferSize: size,
      origin,
      suspicious: failed || this.detectSuspiciousNetworkPattern(name, duration, size),
    };

    this.resourceTimings.push(entry);

    // Keep only recent entries
    if (this.resourceTimings.length > 1000) {
      this.resourceTimings = this.resourceTimings.slice(-1000);
    }
  }

  /**
   * CROSS-ORIGIN RESOURCE TIMING ATTACK BUG FIX: Detect suspicious resource timing
   */
  private detectSuspiciousResourceTiming(entry: PerformanceResourceTiming): boolean {
    // Check for unusually precise timing
    const precision = this.getTimingPrecision(entry.responseEnd - entry.responseStart);
    if (precision > 0.1) {
      // More than 0.1ms precision is suspicious
      return true;
    }

    // Check for timing patterns that might indicate probing
    const duration = entry.responseEnd - entry.requestStart;
    if (duration < 1 || duration > 30000) {
      // Less than 1ms or more than 30s
      return true;
    }

    // Check for suspicious size patterns
    if (entry.transferSize === 0 && entry.responseEnd > entry.responseStart) {
      return true; // Response took time but no data transferred
    }

    return false;
  }

  /**
   * CROSS-ORIGIN RESOURCE TIMING ATTACK BUG FIX: Detect suspicious network patterns
   */
  private detectSuspiciousNetworkPattern(name: string, duration: number, size: number): boolean {
    // Check for timing attack patterns
    if (duration < 0.5 && size === 0) {
      return true; // Extremely fast request with no data
    }

    // Check for probe-like requests
    const url = new URL(name, window.location.href);
    const suspiciousPatterns = [
      /\\.(git|svn|env|backup|config)$/i,
      /admin|test|debug|internal/i,
      /\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}/, // IP addresses
    ];

    return suspiciousPatterns.some(pattern => pattern.test(url.pathname));
  }

  /**
   * CROSS-ORIGIN RESOURCE TIMING ATTACK BUG FIX: Get timing precision
   */
  private getTimingPrecision(value: number): number {
    const str = value.toString();
    const decimalIndex = str.indexOf('.');

    if (decimalIndex === -1) return 0;

    return str.length - decimalIndex - 1;
  }

  /**
   * CROSS-ORIGIN RESOURCE TIMING ATTACK BUG FIX: Obfuscate timing values
   */
  private obfuscateTimingValue(value: number): number {
    const key = value.toFixed(2);

    if (!this.timingObfuscationMap.has(key)) {
      // Add random jitter ±2ms
      const jitter = (Math.random() - 0.5) * 4;
      const obfuscated = Math.max(0, value + jitter);

      // Round to reduce precision
      const rounded = Math.round(obfuscated * 10) / 10; // 0.1ms precision

      this.timingObfuscationMap.set(key, rounded);
    }

    return this.timingObfuscationMap.get(key)!;
  }

  /**
   * CROSS-ORIGIN RESOURCE TIMING ATTACK BUG FIX: Create obfuscated resource entry
   */
  private createObfuscatedResourceEntry(
    original: PerformanceResourceTiming
  ): PerformanceResourceTiming {
    // Create a proxy object that obfuscates timing values
    return new Proxy(original, {
      get: (target, prop) => {
        const timingProps = [
          'connectEnd',
          'connectStart',
          'domainLookupEnd',
          'domainLookupStart',
          'fetchStart',
          'redirectEnd',
          'redirectStart',
          'requestStart',
          'responseEnd',
          'responseStart',
          'secureConnectionStart',
          'startTime',
          'duration',
        ];

        if (timingProps.includes(prop as string)) {
          const value = target[prop as keyof PerformanceResourceTiming] as number;
          return this.obfuscateTimingValue(value);
        }

        return target[prop as keyof PerformanceResourceTiming];
      },
    });
  }

  /**
   * CROSS-ORIGIN RESOURCE TIMING ATTACK BUG FIX: Sanitize postMessage data
   */
  private sanitizePostMessageData(data: unknown): unknown {
    if (typeof data === 'string') {
      // Remove dangerous patterns
      return data
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/data:text\/html/gi, '')
        .replace(/vbscript:/gi, '');
    }

    if (data && typeof data === 'object') {
      // Remove dangerous properties
      const sanitized = { ...data };
      const dangerousProps = ['__proto__', 'constructor', 'prototype'];

      dangerousProps.forEach(prop => {
        delete sanitized[prop];
      });

      return sanitized;
    }

    return data;
  }

  /**
   * CROSS-ORIGIN RESOURCE TIMING ATTACK BUG FIX: Validate postMessage data
   */
  private validatePostMessageData(data: unknown): boolean {
    if (typeof data === 'string') {
      // Check for dangerous patterns
      const dangerousPatterns = [
        /<script[^>]*>/i,
        /javascript:/i,
        /data:text\\/hlmt / i,
        /vbscript:/i,
        /on[a-z]+\\s*=/i,
      ];

      return !dangerousPatterns.some(pattern => pattern.test(data));
    }

    if (data && typeof data === 'object') {
      // Check for prototype pollution
      const dangerousProps = ['__proto__', 'constructor', 'prototype'];
      return !dangerousProps.some(prop => prop in data);
    }

    return true;
  }

  /**
   * CROSS-ORIGIN RESOURCE TIMING ATTACK BUG FIX: Record security threat
   */
  private recordThreat(threat: CrossOriginThreat): void {
    this.threats.push(threat);

    // Keep only recent threats (last 1000)
    if (this.threats.length > 1000) {
      this.threats = this.threats.slice(-1000);
    }

    console.warn('Cross-origin security threat recorded:', threat);
  }

  /**
   * Get security statistics
   */
  getSecurityStats(): {
    totalThreats: number;
    blockedRequests: number;
    suspiciousTimings: number;
    config: CORSConfiguration;
    recentThreats: CrossOriginThreat[];
  } {
    const blockedRequests = this.threats.filter(t => t.blocked).length;
    const suspiciousTimings = this.resourceTimings.filter(r => r.suspicious).length;

    return {
      totalThreats: this.threats.length,
      blockedRequests,
      suspiciousTimings,
      config: this.config,
      recentThreats: this.threats.slice(-50),
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<CORSConfiguration>): void {
    this.config = { ...this.config, ...newConfig };

    // Clear cache when config changes
    this.originValidationCache.clear();
  }

  /**
   * Cleanup and restore original implementations
   */
  cleanup(): void {
    if (this.originalFetch && typeof window !== 'undefined') {
      const win = window as Window & Record<string, unknown>;
      win.fetch = this.originalFetch;
    }

    if (this.originalXMLHttpRequest && typeof window !== 'undefined') {
      const win = window as Window & Record<string, unknown>;
      win.XMLHttpRequest = this.originalXMLHttpRequest;
    }

    this.threats = [];
    this.resourceTimings = [];
    this.timingObfuscationMap.clear();
    this.originValidationCache.clear();
  }
}

// Auto-initialize protection with default settings
let autoProtection: CrossOriginProtection | null = null;

if (typeof window !== 'undefined') {
  // Initialize protection on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      autoProtection = CrossOriginProtection.getInstance();
    });
  } else {
    autoProtection = CrossOriginProtection.getInstance();
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (autoProtection) {
      autoProtection.cleanup();
    }
  });
}

export default CrossOriginProtection;
