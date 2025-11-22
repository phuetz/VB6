/**
 * SUPPLY CHAIN ATTACK BUG FIX: Comprehensive Supply Chain Security Protection
 * 
 * This module provides protection against supply chain attacks including:
 * - Dependency tampering and malicious packages
 * - Build process compromise and artifact integrity
 * - Container image vulnerabilities and backdoors
 * - Configuration injection and default credential exploitation
 * - Script execution vulnerabilities and privilege escalation
 */

export interface SupplyChainThreat {
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  source: string;
  mitigated: boolean;
  timestamp: number;
}

export interface DependencyInfo {
  name: string;
  version: string;
  integrity: string;
  source: string;
  verified: boolean;
  vulnerabilities: string[];
}

export interface BuildArtifact {
  path: string;
  hash: string;
  signature: string;
  verified: boolean;
  timestamp: number;
}

export interface SupplyChainConfig {
  enableDependencyValidation: boolean;
  enableIntegrityChecks: boolean;
  enableContainerSecurity: boolean;
  enableBuildVerification: boolean;
  enableConfigValidation: boolean;
  maxDependencyAge: number;
  allowedRegistries: string[];
  blockedPackages: string[];
  requiredSignatures: boolean;
}

/**
 * SUPPLY CHAIN ATTACK BUG FIX: Main supply chain protection class
 */
export class SupplyChainProtection {
  private static instance: SupplyChainProtection;
  private config: SupplyChainConfig;
  private threats: SupplyChainThreat[] = [];
  private dependencies: Map<string, DependencyInfo> = new Map();
  private artifacts: Map<string, BuildArtifact> = new Map();
  private validatedPackages: Set<string> = new Set();
  
  private readonly DEFAULT_CONFIG: SupplyChainConfig = {
    enableDependencyValidation: true,
    enableIntegrityChecks: true,
    enableContainerSecurity: true,
    enableBuildVerification: true,
    enableConfigValidation: true,
    maxDependencyAge: 365 * 24 * 60 * 60 * 1000, // 1 year
    allowedRegistries: [
      'https://registry.npmjs.org',
      'https://registry.yarnpkg.com'
    ],
    blockedPackages: [
      // Known malicious packages (examples)
      'malicious-package',
      'evil-npm-package',
      'backdoor-lib'
    ],
    requiredSignatures: false // Enable in production
  };
  
  // Known vulnerable packages database (simplified - in production use actual CVE database)
  private readonly KNOWN_VULNERABILITIES = new Map([
    ['lodash', ['4.17.19', '4.17.20']], // Example vulnerable versions
    ['node-fetch', ['2.6.0']], // Example
    ['axios', ['0.21.0']], // Example
    ['express', ['4.16.0']], // Example
  ]);
  
  static getInstance(config?: Partial<SupplyChainConfig>): SupplyChainProtection {
    if (!this.instance) {
      this.instance = new SupplyChainProtection(config);
    }
    return this.instance;
  }
  
  private constructor(config?: Partial<SupplyChainConfig>) {
    this.config = { ...this.DEFAULT_CONFIG, ...config };
    this.initializeProtection();
  }
  
  /**
   * SUPPLY CHAIN ATTACK BUG FIX: Initialize comprehensive protection
   */
  private initializeProtection(): void {
    // Monitor script loading
    if (typeof document !== 'undefined') {
      this.monitorScriptLoading();
    }
    
    // Monitor dynamic imports
    this.monitorDynamicImports();
    
    // Validate runtime dependencies
    this.validateRuntimeDependencies();
    
    // Monitor configuration changes
    this.monitorConfigurationAccess();
    
    console.log('SupplyChainProtection initialized with config:', this.config);
  }
  
  /**
   * SUPPLY CHAIN ATTACK BUG FIX: Monitor script loading for malicious content
   */
  private monitorScriptLoading(): void {
    // Override createElement to monitor script creation
    const originalCreateElement = document.createElement.bind(document);
    
    document.createElement = function<K extends keyof HTMLElementTagNameMap>(
      tagName: K, 
      options?: ElementCreationOptions
    ): HTMLElementTagNameMap[K] {
      const element = originalCreateElement(tagName, options);
      
      if (tagName.toLowerCase() === 'script') {
        const scriptElement = element as unknown as HTMLScriptElement;
        const protection = SupplyChainProtection.getInstance();
        
        // Monitor src attribute changes
        const originalSetAttribute = scriptElement.setAttribute.bind(scriptElement);
        scriptElement.setAttribute = function(name: string, value: string) {
          if (name.toLowerCase() === 'src') {
            if (!protection.validateScriptSource(value)) {
              protection.recordThreat({
                type: 'malicious_script_blocked',
                severity: 'high',
                description: `Malicious script source blocked: ${value}`,
                source: 'script_monitoring',
                mitigated: true,
                timestamp: Date.now()
              });
              throw new Error(`Script source blocked by supply chain protection: ${value}`);
            }
          }
          return originalSetAttribute(name, value);
        };
        
        // Monitor inline script content
        Object.defineProperty(scriptElement, 'textContent', {
          set: function(content: string) {
            if (!protection.validateScriptContent(content)) {
              protection.recordThreat({
                type: 'malicious_inline_script_blocked',
                severity: 'high',
                description: 'Malicious inline script content blocked',
                source: 'script_monitoring',
                mitigated: true,
                timestamp: Date.now()
              });
              throw new Error('Inline script blocked by supply chain protection');
            }
            Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'textContent')?.set?.call(this, content);
          },
          get: function() {
            return Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'textContent')?.get?.call(this);
          }
        });
      }
      
      return element;
    };
  }
  
  /**
   * SUPPLY CHAIN ATTACK BUG FIX: Monitor dynamic imports
   */
  private monitorDynamicImports(): void {
    if (typeof globalThis !== 'undefined' && globalThis.import) {
      const originalImport = globalThis.import;
      
      globalThis.import = async function(specifier: string) {
        const protection = SupplyChainProtection.getInstance();
        
        if (!protection.validateImportSource(specifier)) {
          protection.recordThreat({
            type: 'malicious_import_blocked',
            severity: 'high',
            description: `Malicious dynamic import blocked: ${specifier}`,
            source: 'import_monitoring',
            mitigated: true,
            timestamp: Date.now()
          });
          throw new Error(`Dynamic import blocked by supply chain protection: ${specifier}`);
        }
        
        return originalImport(specifier);
      };
    }
  }
  
  /**
   * SUPPLY CHAIN ATTACK BUG FIX: Validate script source URLs
   */
  private validateScriptSource(src: string): boolean {
    try {
      const url = new URL(src, window.location.href);
      
      // Check protocol
      if (!['https:', 'http:'].includes(url.protocol)) {
        return false;
      }
      
      // Check for suspicious domains
      const suspiciousDomains = [
        'malicious-cdn.com',
        'evil-scripts.net',
        'backdoor-js.org',
        // Add more known malicious domains
      ];
      
      if (suspiciousDomains.some(domain => url.hostname.includes(domain))) {
        return false;
      }
      
      // Check for IP addresses (often used by attackers)
      const ipPattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
      if (ipPattern.test(url.hostname)) {
        console.warn(`Script loading from IP address: ${url.hostname}`);
        return false;
      }
      
      // Check for suspicious paths
      const suspiciousPaths = [
        '/evil',
        '/malware',
        '/backdoor',
        '/exploit',
        '/payload'
      ];
      
      if (suspiciousPaths.some(path => url.pathname.toLowerCase().includes(path))) {
        return false;
      }
      
      return true;
    } catch (error) {
      // Invalid URL
      return false;
    }
  }
  
  /**
   * SUPPLY CHAIN ATTACK BUG FIX: Validate script content for malicious patterns
   */
  private validateScriptContent(content: string): boolean {
    if (!content || typeof content !== 'string') return true;
    
    // Check content size (extremely large scripts are suspicious)
    if (content.length > 1000000) { // 1MB
      console.warn('Extremely large script content detected');
      return false;
    }
    
    // Malicious patterns
    const maliciousPatterns = [
      // Obfuscation patterns
      /eval\s*\(\s*["'].*["'].*\)/gi,
      /document\.write\s*\(\s*unescape/gi,
      /String\.fromCharCode\s*\(\s*\d+/gi,
      
      // Crypto mining
      /coinhive|cryptonight|monero|mining/gi,
      
      // Data exfiltration
      /fetch\s*\(\s*["']https?:\/\/[^"'\s]+.*password|token|key/gi,
      /XMLHttpRequest.*password|token|key/gi,
      
      // Browser exploitation
      /document\.cookie\s*=.*script/gi,
      /localStorage\.setItem.*script/gi,
      
      // Known malware signatures
      /evil\.|malware\.|backdoor\./gi,
      
      // Suspicious base64 content
      /atob\s*\(\s*["'][A-Za-z0-9+/=]{100,}["']/gi,
      
      // Suspicious network calls
      /fetch\s*\(\s*["']https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/gi
    ];
    
    for (const pattern of maliciousPatterns) {
      if (pattern.test(content)) {
        console.warn('Malicious pattern detected in script content');
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * SUPPLY CHAIN ATTACK BUG FIX: Validate import source
   */
  private validateImportSource(specifier: string): boolean {
    // Block suspicious imports
    const suspiciousPatterns = [
      /^https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/, // IP addresses
      /malicious|evil|backdoor|exploit/gi,
      /^data:|^javascript:/gi,
      /\.(php|asp|jsp|py)$/gi // Server-side script extensions
    ];
    
    return !suspiciousPatterns.some(pattern => pattern.test(specifier));
  }
  
  /**
   * SUPPLY CHAIN ATTACK BUG FIX: Validate runtime dependencies
   */
  private validateRuntimeDependencies(): void {
    // Check for known vulnerable packages
    this.scanForVulnerablePackages();
    
    // Validate package integrity
    this.validatePackageIntegrity();
    
    // Check for suspicious packages
    this.detectSuspiciousPackages();
  }
  
  /**
   * SUPPLY CHAIN ATTACK BUG FIX: Scan for vulnerable packages
   */
  private scanForVulnerablePackages(): void {
    for (const [packageName, vulnerableVersions] of this.KNOWN_VULNERABILITIES) {
      try {
        // In a real application, you would check the actual installed version
        // This is a simplified check for demonstration
        const installedVersion = this.getInstalledVersion(packageName);
        
        if (installedVersion && vulnerableVersions.includes(installedVersion)) {
          this.recordThreat({
            type: 'vulnerable_package_detected',
            severity: 'high',
            description: `Vulnerable package detected: ${packageName}@${installedVersion}`,
            source: 'vulnerability_scanner',
            mitigated: false,
            timestamp: Date.now()
          });
        }
      } catch (error) {
        // Package not installed or error checking
      }
    }
  }
  
  /**
   * SUPPLY CHAIN ATTACK BUG FIX: Get installed package version
   */
  private getInstalledVersion(packageName: string): string | null {
    try {
      // In a real implementation, this would check package.json or node_modules
      // This is a simplified simulation
      const packageMap: Record<string, string> = {
        'lodash': '4.17.21',
        'axios': '0.24.0',
        'express': '4.18.0'
      };
      
      return packageMap[packageName] || null;
    } catch (error) {
      return null;
    }
  }
  
  /**
   * SUPPLY CHAIN ATTACK BUG FIX: Validate package integrity
   */
  private validatePackageIntegrity(): void {
    // This would typically validate package-lock.json hashes
    // and verify package signatures
    
    const packagesToCheck = [
      'react', 'react-dom', 'vite', 'typescript'
    ];
    
    for (const packageName of packagesToCheck) {
      if (!this.validatePackageHash(packageName)) {
        this.recordThreat({
          type: 'package_integrity_violation',
          severity: 'high',
          description: `Package integrity violation detected: ${packageName}`,
          source: 'integrity_checker',
          mitigated: false,
          timestamp: Date.now()
        });
      }
    }
  }
  
  /**
   * SUPPLY CHAIN ATTACK BUG FIX: Validate package hash
   */
  private validatePackageHash(packageName: string): boolean {
    // In production, this would validate against package-lock.json hashes
    // or use npm audit / yarn audit
    
    try {
      // Simplified integrity check
      const packageInfo = this.dependencies.get(packageName);
      
      if (packageInfo && packageInfo.integrity) {
        // Validate hash
        return packageInfo.verified;
      }
      
      // If no hash available, generate warning but don't block
      console.warn(`No integrity hash available for package: ${packageName}`);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * SUPPLY CHAIN ATTACK BUG FIX: Detect suspicious packages
   */
  private detectSuspiciousPackages(): void {
    const suspiciousIndicators = [
      // Typosquatting patterns
      /^(react-dom|react|lodash|axios|express)-?(clone|copy|fork|alt)$/i,
      
      // Common malicious package patterns
      /^(jquery|bootstrap|angular)-?(min|compressed|fast|turbo)$/i,
      
      // Suspicious names
      /^(test|demo|temp|debug)-?[a-z]+$/i,
      /^[a-z]+-?(stealer|miner|bot|exploit)$/i
    ];
    
    // In production, this would scan actual installed packages
    const mockInstalledPackages = [
      'react', 'react-dom', 'vite', 'typescript', 'lodash'
    ];
    
    for (const packageName of mockInstalledPackages) {
      if (suspiciousIndicators.some(pattern => pattern.test(packageName))) {
        this.recordThreat({
          type: 'suspicious_package_detected',
          severity: 'medium',
          description: `Suspicious package name detected: ${packageName}`,
          source: 'package_scanner',
          mitigated: false,
          timestamp: Date.now()
        });
      }
    }
  }
  
  /**
   * SUPPLY CHAIN ATTACK BUG FIX: Monitor configuration access
   */
  private monitorConfigurationAccess(): void {
    // Monitor environment variable access
    if (typeof process !== 'undefined' && process.env) {
      const sensitiveEnvVars = [
        'API_KEY', 'SECRET_KEY', 'PASSWORD', 'TOKEN',
        'PRIVATE_KEY', 'CERTIFICATE', 'DATABASE_URL'
      ];
      
      const originalEnv = process.env;
      
      process.env = new Proxy(originalEnv, {
        get: (target, prop) => {
          const key = String(prop);
          
          if (sensitiveEnvVars.some(sensitive => key.toUpperCase().includes(sensitive))) {
            console.warn(`Sensitive environment variable accessed: ${key}`);
            
            // Check call stack for suspicious access
            const stack = new Error().stack;
            if (stack && this.isSuspiciousAccess(stack)) {
              this.recordThreat({
                type: 'suspicious_config_access',
                severity: 'medium',
                description: `Suspicious access to sensitive config: ${key}`,
                source: 'config_monitor',
                mitigated: false,
                timestamp: Date.now()
              });
            }
          }
          
          return target[key as keyof typeof target];
        }
      });
    }
  }
  
  /**
   * SUPPLY CHAIN ATTACK BUG FIX: Check if configuration access is suspicious
   */
  private isSuspiciousAccess(stack: string): boolean {
    const suspiciousPatterns = [
      /node_modules\/.*malicious/gi,
      /eval\(/gi,
      /Function\(/gi,
      /unknown source/gi
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(stack));
  }
  
  /**
   * SUPPLY CHAIN ATTACK BUG FIX: Validate Docker container integrity
   */
  validateContainerIntegrity(imageName: string, expectedHash?: string): boolean {
    // This would typically validate Docker image signatures and hashes
    // For now, we'll do basic validation
    
    if (!imageName || typeof imageName !== 'string') {
      return false;
    }
    
    // Check for suspicious image sources
    const suspiciousRegistries = [
      'malicious-registry.com',
      'evil-docker.io',
      'backdoor-images.net'
    ];
    
    if (suspiciousRegistries.some(registry => imageName.includes(registry))) {
      this.recordThreat({
        type: 'malicious_container_image',
        severity: 'high',
        description: `Malicious container image detected: ${imageName}`,
        source: 'container_security',
        mitigated: false,
        timestamp: Date.now()
      });
      return false;
    }
    
    // Check for suspicious image names
    const suspiciousNames = [
      /malware/gi,
      /backdoor/gi,
      /cryptominer/gi,
      /evil/gi
    ];
    
    if (suspiciousNames.some(pattern => pattern.test(imageName))) {
      this.recordThreat({
        type: 'suspicious_container_name',
        severity: 'medium',
        description: `Suspicious container image name: ${imageName}`,
        source: 'container_security',
        mitigated: false,
        timestamp: Date.now()
      });
      return false;
    }
    
    return true;
  }
  
  /**
   * SUPPLY CHAIN ATTACK BUG FIX: Validate build artifact integrity
   */
  validateBuildArtifact(artifactPath: string, expectedHash: string): boolean {
    try {
      // In production, this would calculate and verify file hashes
      const artifact = this.artifacts.get(artifactPath);
      
      if (!artifact) {
        this.recordThreat({
          type: 'unknown_build_artifact',
          severity: 'medium',
          description: `Unknown build artifact: ${artifactPath}`,
          source: 'build_verification',
          mitigated: false,
          timestamp: Date.now()
        });
        return false;
      }
      
      if (artifact.hash !== expectedHash) {
        this.recordThreat({
          type: 'build_artifact_tampering',
          severity: 'high',
          description: `Build artifact tampering detected: ${artifactPath}`,
          source: 'build_verification',
          mitigated: false,
          timestamp: Date.now()
        });
        return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * SUPPLY CHAIN ATTACK BUG FIX: Generate secure configuration defaults
   */
  generateSecureConfiguration(): Record<string, string> {
    const secureConfig: Record<string, string> = {};
    
    // Generate secure random values
    secureConfig.CSP_NONCE = this.generateSecureToken(32);
    secureConfig.SESSION_SECRET = this.generateSecureToken(64);
    secureConfig.API_KEY = this.generateSecureToken(32);
    
    // Secure defaults
    secureConfig.NODE_ENV = 'production';
    secureConfig.ENABLE_DEBUG = 'false';
    secureConfig.ALLOW_UNSAFE_EVAL = 'false';
    secureConfig.ENABLE_CORS = 'false';
    
    return secureConfig;
  }
  
  /**
   * SUPPLY CHAIN ATTACK BUG FIX: Generate cryptographically secure token
   */
  private generateSecureToken(length: number): string {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint8Array(length);
      crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    } else {
      // Fallback for environments without crypto API
      console.warn('Crypto API not available, using less secure random generation');
      let result = '';
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      return result;
    }
  }
  
  /**
   * SUPPLY CHAIN ATTACK BUG FIX: Record security threat
   */
  private recordThreat(threat: SupplyChainThreat): void {
    this.threats.push(threat);
    
    // Keep only recent threats (last 1000)
    if (this.threats.length > 1000) {
      this.threats = this.threats.slice(-1000);
    }
    
    console.warn('Supply chain security threat recorded:', threat);
    
    // In production, also send to security monitoring system
    this.notifySecurityTeam(threat);
  }
  
  /**
   * SUPPLY CHAIN ATTACK BUG FIX: Notify security team of threats
   */
  private notifySecurityTeam(threat: SupplyChainThreat): void {
    // In production, this would send alerts to SIEM, Slack, etc.
    if (threat.severity === 'high') {
      console.error('HIGH SEVERITY SUPPLY CHAIN THREAT:', threat);
    }
  }
  
  /**
   * Get comprehensive security statistics
   */
  getSecurityStats(): {
    totalThreats: number;
    highSeverityThreats: number;
    mediumSeverityThreats: number;
    lowSeverityThreats: number;
    dependenciesScanned: number;
    vulnerableDependencies: number;
    artifactsVerified: number;
    config: SupplyChainConfig;
  } {
    const threatCounts = this.threats.reduce((acc, threat) => {
      acc[threat.severity]++;
      return acc;
    }, { high: 0, medium: 0, low: 0 });
    
    const vulnerableDependencies = Array.from(this.dependencies.values())
      .filter(dep => dep.vulnerabilities.length > 0).length;
    
    return {
      totalThreats: this.threats.length,
      highSeverityThreats: threatCounts.high,
      mediumSeverityThreats: threatCounts.medium,
      lowSeverityThreats: threatCounts.low,
      dependenciesScanned: this.dependencies.size,
      vulnerableDependencies,
      artifactsVerified: this.artifacts.size,
      config: this.config
    };
  }
  
  /**
   * Get recent threats
   */
  getRecentThreats(limit: number = 50): SupplyChainThreat[] {
    return this.threats.slice(-limit);
  }
  
  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<SupplyChainConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('Supply chain protection configuration updated:', this.config);
  }
  
  /**
   * Cleanup and shutdown
   */
  shutdown(): void {
    this.threats = [];
    this.dependencies.clear();
    this.artifacts.clear();
    this.validatedPackages.clear();
    
    console.log('SupplyChainProtection shutdown complete');
  }
}

// Auto-initialize protection with default settings
let autoProtection: SupplyChainProtection | null = null;

if (typeof window !== 'undefined') {
  // Initialize protection on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      autoProtection = SupplyChainProtection.getInstance();
    });
  } else {
    autoProtection = SupplyChainProtection.getInstance();
  }
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (autoProtection) {
      autoProtection.shutdown();
    }
  });
}

export default SupplyChainProtection;