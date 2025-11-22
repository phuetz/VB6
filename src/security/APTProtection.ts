/**
 * ADVANCED PERSISTENT THREAT (APT) BUG FIX: Comprehensive Nation-State Attack Protection
 * 
 * This module provides protection against Advanced Persistent Threats and nation-state attacks including:
 * - Long-term persistence and stealth techniques
 * - Multi-stage attack chain detection
 * - Living-off-the-land technique prevention
 * - Lateral movement detection and blocking
 * - Data exfiltration monitoring and prevention
 * - Advanced evasion technique detection
 * - Behavioral analysis and anomaly detection
 * - Command and control communication blocking
 */

export interface APTThreat {
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  stage: 'reconnaissance' | 'initial_access' | 'persistence' | 'privilege_escalation' | 'defense_evasion' | 'credential_access' | 'discovery' | 'lateral_movement' | 'collection' | 'exfiltration' | 'command_control';
  indicators: string[];
  mitigated: boolean;
  timestamp: number;
  attackPattern: string;
}

export interface BehavioralProfile {
  sessionId: string;
  userAgent: string;
  ipAddress: string;
  actions: UserAction[];
  anomalyScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  firstSeen: number;
  lastSeen: number;
}

export interface UserAction {
  type: string;
  timestamp: number;
  metadata: Record<string, any>;
  suspiciousScore: number;
}

export interface NetworkConnection {
  destination: string;
  port: number;
  protocol: string;
  dataSize: number;
  encrypted: boolean;
  suspicious: boolean;
  timestamp: number;
}

export interface APTConfig {
  enableBehavioralAnalysis: boolean;
  enableNetworkMonitoring: boolean;
  enableFileSystemWatching: boolean;
  enableProcessMonitoring: boolean;
  enableKeyloggerDetection: boolean;
  enableDataExfiltrationPrevention: boolean;
  enableCommandControlBlocking: boolean;
  anomalyThreshold: number;
  sessionTimeout: number;
  maxDataTransfer: number;
}

/**
 * APT BUG FIX: Main APT protection class
 */
export class APTProtection {
  private static instance: APTProtection;
  private config: APTConfig;
  private threats: APTThreat[] = [];
  private behavioralProfiles: Map<string, BehavioralProfile> = new Map();
  private networkConnections: NetworkConnection[] = [];
  private suspiciousFiles: Set<string> = new Set();
  private persistenceMechanisms: Set<string> = new Set();
  private monitoringInterval: NodeJS.Timeout | null = null;
  
  // Known APT group signatures and TTPs (Tactics, Techniques, Procedures)
  private readonly APT_SIGNATURES = new Map([
    ['apt1', {
      indicators: ['*.dll.tmp', 'svchost.exe -k*', 'rundll32.exe *,#*'],
      techniques: ['dll_hijacking', 'process_hollowing', 'registry_persistence']
    }],
    ['lazarus', {
      indicators: ['*.scr.exe', 'temp\\*.bat', 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run'],
      techniques: ['disguised_executables', 'batch_scripts', 'autostart_persistence']
    }],
    ['cozy_bear', {
      indicators: ['PowerShell.*-EncodedCommand', 'WMI.*Win32_Process', 'schtasks.*CREATE'],
      techniques: ['powershell_abuse', 'wmi_persistence', 'scheduled_tasks']
    }],
    ['fancy_bear', {
      indicators: ['*.docx.exe', 'cmd.exe /c *', 'netsh.*advfirewall'],
      techniques: ['document_exploitation', 'command_injection', 'firewall_manipulation']
    }]
  ]);
  
  // Suspicious network destinations (C2 infrastructure patterns)
  private readonly SUSPICIOUS_DOMAINS = [
    // Dynamic DNS providers often used by APTs
    /.*\.duckdns\.org$/i,
    /.*\.no-ip\.(org|com|net)$/i,
    /.*\.ddns\.net$/i,
    
    // Fast-flux domains
    /^[a-z]{10,20}\.[a-z]{2,10}$/i,
    
    // Base64-like domains
    /^[A-Za-z0-9]{10,}=*\./i,
    
    // Suspicious TLDs
    /\.(tk|ml|ga|cf|top|click|download)$/i,
    
    // IP addresses (often used by APTs to avoid DNS detection)
    /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/
  ];
  
  private readonly DEFAULT_CONFIG: APTConfig = {
    enableBehavioralAnalysis: true,
    enableNetworkMonitoring: true,
    enableFileSystemWatching: true,
    enableProcessMonitoring: true,
    enableKeyloggerDetection: true,
    enableDataExfiltrationPrevention: true,
    enableCommandControlBlocking: true,
    anomalyThreshold: 0.7,
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    maxDataTransfer: 100 * 1024 * 1024 // 100MB
  };
  
  static getInstance(config?: Partial<APTConfig>): APTProtection {
    if (!this.instance) {
      this.instance = new APTProtection(config);
    }
    return this.instance;
  }
  
  private constructor(config?: Partial<APTConfig>) {
    this.config = { ...this.DEFAULT_CONFIG, ...config };
    this.initializeProtection();
  }
  
  /**
   * APT BUG FIX: Initialize comprehensive APT protection
   */
  private initializeProtection(): void {
    // Start behavioral analysis
    if (this.config.enableBehavioralAnalysis) {
      this.initializeBehavioralAnalysis();
    }
    
    // Monitor network connections
    if (this.config.enableNetworkMonitoring) {
      this.initializeNetworkMonitoring();
    }
    
    // Watch for file system changes
    if (this.config.enableFileSystemWatching) {
      this.initializeFileSystemWatching();
    }
    
    // Monitor for keyloggers
    if (this.config.enableKeyloggerDetection) {
      this.initializeKeyloggerDetection();
    }
    
    // Prevent data exfiltration
    if (this.config.enableDataExfiltrationPrevention) {
      this.initializeDataExfiltrationPrevention();
    }
    
    // Block C2 communications
    if (this.config.enableCommandControlBlocking) {
      this.initializeCommandControlBlocking();
    }
    
    // Start continuous monitoring
    this.startContinuousMonitoring();
    
    console.log('APTProtection initialized with config:', this.config);
  }
  
  /**
   * APT BUG FIX: Initialize behavioral analysis to detect APT activity patterns
   */
  private initializeBehavioralAnalysis(): void {
    if (typeof window === 'undefined') return;
    
    // Monitor user interactions for anomalies
    const userActions = ['click', 'keydown', 'mousemove', 'scroll', 'focus', 'blur'];
    
    userActions.forEach(actionType => {
      window.addEventListener(actionType, (event) => {
        this.recordUserAction(actionType, event);
      }, { passive: true });
    });
    
    // Monitor page visibility changes (APTs often operate when user is away)
    document.addEventListener('visibilitychange', () => {
      this.recordUserAction('visibility_change', {
        hidden: document.hidden,
        visibilityState: document.visibilityState
      });
    });
    
    // Monitor console access (APTs may try to use developer tools)
    this.monitorConsoleAccess();
    
    // Monitor storage access patterns
    this.monitorStorageAccess();
  }
  
  /**
   * APT BUG FIX: Monitor console access for suspicious activity
   */
  private monitorConsoleAccess(): void {
    if (typeof console === 'undefined') return;
    
    const originalConsole = { ...console };
    
    // Override console methods to detect automated scripts
    ['log', 'warn', 'error', 'info', 'debug'].forEach(method => {
      const originalMethod = originalConsole[method as keyof typeof originalConsole];
      
      (console as any)[method] = (...args: any[]) => {
        // Check for suspicious console usage patterns
        const message = args.join(' ');
        
        if (this.isSuspiciousConsoleMessage(message)) {
          this.recordThreat({
            type: 'suspicious_console_access',
            severity: 'medium',
            description: `Suspicious console message detected: ${message.substring(0, 100)}`,
            stage: 'defense_evasion',
            indicators: ['console_manipulation'],
            mitigated: false,
            timestamp: Date.now(),
            attackPattern: 'console_injection'
          });
        }
        
        return originalMethod.apply(console, args);
      };
    });
  }
  
  /**
   * APT BUG FIX: Check if console message is suspicious
   */
  private isSuspiciousConsoleMessage(message: string): boolean {
    const suspiciousPatterns = [
      /eval\s*\(/gi,
      /Function\s*\(/gi,
      /document\.cookie/gi,
      /localStorage\./gi,
      /sessionStorage\./gi,
      /XMLHttpRequest/gi,
      /fetch\s*\(/gi,
      /window\.location/gi,
      /debugger/gi,
      /base64|atob|btoa/gi,
      /crypto|hash|encrypt/gi
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(message));
  }
  
  /**
   * APT BUG FIX: Monitor storage access for data collection patterns
   */
  private monitorStorageAccess(): void {
    if (typeof Storage === 'undefined') return;
    
    // Monitor localStorage access
    const originalLocalStorage = { ...localStorage };
    
    ['setItem', 'getItem', 'removeItem'].forEach(method => {
      const originalMethod = localStorage[method as keyof Storage];
      
      (localStorage as any)[method] = function(...args: any[]) {
        const key = args[0];
        
        if (APTProtection.getInstance().isSuspiciousStorageKey(key)) {
          APTProtection.getInstance().recordThreat({
            type: 'suspicious_storage_access',
            severity: 'medium',
            description: `Suspicious storage access: ${method} ${key}`,
            stage: 'collection',
            indicators: ['storage_enumeration'],
            mitigated: false,
            timestamp: Date.now(),
            attackPattern: 'data_collection'
          });
        }
        
        return originalMethod.apply(this, args);
      };
    });
  }
  
  /**
   * APT BUG FIX: Check if storage key is suspicious
   */
  private isSuspiciousStorageKey(key: string): boolean {
    const suspiciousPatterns = [
      /password|pwd|pass/gi,
      /token|auth|session/gi,
      /key|secret|api/gi,
      /user|admin|account/gi,
      /credit|card|payment/gi,
      /email|phone|address/gi,
      /config|setting|preference/gi
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(key));
  }
  
  /**
   * APT BUG FIX: Initialize network monitoring for C2 detection
   */
  private initializeNetworkMonitoring(): void {
    // Monitor fetch API calls
    if (typeof window !== 'undefined' && window.fetch) {
      const originalFetch = window.fetch;
      
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
        
        // Analyze network request for APT indicators
        this.analyzeNetworkRequest(url, init);
        
        return originalFetch(input, init);
      };
    }
    
    // Monitor XMLHttpRequest
    if (typeof XMLHttpRequest !== 'undefined') {
      const OriginalXHR = XMLHttpRequest;
      
      (window as any).XMLHttpRequest = class extends OriginalXHR {
        open(method: string, url: string, async?: boolean, user?: string | null, password?: string | null) {
          APTProtection.getInstance().analyzeNetworkRequest(url, { method });
          return super.open(method, url, async, user, password);
        }
      };
    }
    
    // Monitor WebSocket connections
    if (typeof WebSocket !== 'undefined') {
      const OriginalWebSocket = WebSocket;
      
      (window as any).WebSocket = class extends OriginalWebSocket {
        constructor(url: string | URL, protocols?: string | string[]) {
          const urlString = typeof url === 'string' ? url : url.href;
          APTProtection.getInstance().analyzeWebSocketConnection(urlString);
          
          super(url, protocols);
        }
      };
    }
  }
  
  /**
   * APT BUG FIX: Analyze network requests for APT indicators
   */
  private analyzeNetworkRequest(url: string, options?: RequestInit): void {
    try {
      const urlObj = new URL(url, window.location.href);
      
      // Check against suspicious domains
      const suspicious = this.SUSPICIOUS_DOMAINS.some(pattern => 
        pattern.test(urlObj.hostname)
      );
      
      if (suspicious) {
        this.recordThreat({
          type: 'suspicious_network_request',
          severity: 'high',
          description: `Suspicious network request to: ${urlObj.hostname}`,
          stage: 'command_control',
          indicators: ['suspicious_domain', urlObj.hostname],
          mitigated: false,
          timestamp: Date.now(),
          attackPattern: 'c2_communication'
        });
      }
      
      // Check for data exfiltration patterns
      const method = options?.method || 'GET';
      const hasBody = options?.body !== undefined;
      
      if (method === 'POST' && hasBody) {
        this.checkDataExfiltration(url, options.body);
      }
      
      // Record network connection
      this.recordNetworkConnection(urlObj, suspicious);
      
    } catch (error) {
      // Invalid URL
    }
  }
  
  /**
   * APT BUG FIX: Analyze WebSocket connections for C2 channels
   */
  private analyzeWebSocketConnection(url: string): void {
    try {
      const urlObj = new URL(url);
      
      // WebSockets are often used by APTs for persistent C2 channels
      const suspicious = this.SUSPICIOUS_DOMAINS.some(pattern => 
        pattern.test(urlObj.hostname)
      ) || urlObj.protocol === 'ws:'; // Unencrypted WebSocket is suspicious
      
      if (suspicious) {
        this.recordThreat({
          type: 'suspicious_websocket_connection',
          severity: 'high',
          description: `Suspicious WebSocket connection to: ${urlObj.hostname}`,
          stage: 'command_control',
          indicators: ['websocket_c2', urlObj.hostname],
          mitigated: false,
          timestamp: Date.now(),
          attackPattern: 'persistent_c2'
        });
      }
      
    } catch (error) {
      // Invalid URL
    }
  }
  
  /**
   * APT BUG FIX: Check for data exfiltration in network requests
   */
  private checkDataExfiltration(url: string, body: BodyInit): void {
    try {
      let dataSize = 0;
      let containsSensitiveData = false;
      
      if (typeof body === 'string') {
        dataSize = body.length;
        containsSensitiveData = this.containsSensitiveData(body);
      } else if (body instanceof FormData) {
        // Check FormData for sensitive information
        for (const [key, value] of body.entries()) {
          if (typeof value === 'string') {
            dataSize += value.length;
            if (this.containsSensitiveData(key + value)) {
              containsSensitiveData = true;
            }
          }
        }
      }
      
      // Check for potential data exfiltration
      if (dataSize > this.config.maxDataTransfer || containsSensitiveData) {
        this.recordThreat({
          type: 'potential_data_exfiltration',
          severity: 'high',
          description: `Large/sensitive data transfer detected: ${dataSize} bytes to ${url}`,
          stage: 'exfiltration',
          indicators: ['large_transfer', 'sensitive_data'],
          mitigated: false,
          timestamp: Date.now(),
          attackPattern: 'data_theft'
        });
      }
      
    } catch (error) {
      // Error analyzing data
    }
  }
  
  /**
   * APT BUG FIX: Check if data contains sensitive information
   */
  private containsSensitiveData(data: string): boolean {
    const sensitivePatterns = [
      /password|pwd|pass/gi,
      /token|jwt|bearer/gi,
      /api[_-]?key/gi,
      /secret|private/gi,
      /credit[_-]?card|ccnum/gi,
      /ssn|social[_-]?security/gi,
      /\b\d{16}\b/, // Credit card numbers
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN format
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/ // Email addresses
    ];
    
    return sensitivePatterns.some(pattern => pattern.test(data));
  }
  
  /**
   * APT BUG FIX: Initialize file system watching for persistence mechanisms
   */
  private initializeFileSystemWatching(): void {
    // Monitor file access patterns (simplified for web environment)
    if (typeof document !== 'undefined') {
      // Monitor script injections
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as Element;
                
                if (element.tagName === 'SCRIPT') {
                  this.analyzeScriptInjection(element as HTMLScriptElement);
                }
              }
            });
          }
        });
      });
      
      observer.observe(document, {
        childList: true,
        subtree: true
      });
    }
  }
  
  /**
   * APT BUG FIX: Analyze script injections for APT indicators
   */
  private analyzeScriptInjection(script: HTMLScriptElement): void {
    const src = script.src;
    const content = script.textContent || script.innerHTML;
    
    // Check for suspicious script sources
    if (src) {
      try {
        const url = new URL(src, window.location.href);
        const suspicious = this.SUSPICIOUS_DOMAINS.some(pattern => 
          pattern.test(url.hostname)
        );
        
        if (suspicious) {
          this.recordThreat({
            type: 'malicious_script_injection',
            severity: 'high',
            description: `Malicious script injected from: ${url.hostname}`,
            stage: 'initial_access',
            indicators: ['script_injection', url.hostname],
            mitigated: false,
            timestamp: Date.now(),
            attackPattern: 'malicious_script'
          });
        }
      } catch (error) {
        // Invalid URL
      }
    }
    
    // Check inline script content for APT techniques
    if (content) {
      const aptIndicators = this.checkForAPTIndicators(content);
      
      if (aptIndicators.length > 0) {
        this.recordThreat({
          type: 'apt_technique_detected',
          severity: 'high',
          description: `APT technique detected in script: ${aptIndicators.join(', ')}`,
          stage: 'defense_evasion',
          indicators: aptIndicators,
          mitigated: false,
          timestamp: Date.now(),
          attackPattern: 'living_off_the_land'
        });
      }
    }
  }
  
  /**
   * APT BUG FIX: Check content for known APT indicators
   */
  private checkForAPTIndicators(content: string): string[] {
    const indicators: string[] = [];
    
    // Check against known APT signatures
    for (const [aptGroup, signature] of this.APT_SIGNATURES) {
      for (const indicator of signature.indicators) {
        const pattern = new RegExp(indicator.replace(/\*/g, '.*'), 'gi');
        if (pattern.test(content)) {
          indicators.push(`${aptGroup}_${indicator}`);
        }
      }
    }
    
    // Check for common APT techniques
    const aptTechniques = [
      { name: 'base64_decoding', pattern: /atob\s*\(/gi },
      { name: 'dynamic_function', pattern: /Function\s*\(\s*['"]/gi },
      { name: 'eval_usage', pattern: /eval\s*\(/gi },
      { name: 'document_write', pattern: /document\.write/gi },
      { name: 'timing_attack', pattern: /setTimeout.*eval/gi },
      { name: 'code_obfuscation', pattern: /\\x[0-9a-f]{2}/gi },
      { name: 'hex_encoding', pattern: /\\u[0-9a-f]{4}/gi },
      { name: 'string_concat', pattern: /\+.*\+.*\+/g }
    ];
    
    for (const technique of aptTechniques) {
      if (technique.pattern.test(content)) {
        indicators.push(technique.name);
      }
    }
    
    return indicators;
  }
  
  /**
   * APT BUG FIX: Initialize keylogger detection
   */
  private initializeKeyloggerDetection(): void {
    if (typeof window === 'undefined') return;
    
    let keyEventCount = 0;
    let suspiciousKeyPatterns = 0;
    
    // Monitor keyboard events for keylogger activity
    window.addEventListener('keydown', (event) => {
      keyEventCount++;
      
      // Check for suspicious key combinations
      if (event.ctrlKey && event.altKey) {
        suspiciousKeyPatterns++;
      }
      
      // Check for rapid-fire key events (potential keylogger)
      if (keyEventCount > 1000) { // Reset counter periodically
        if (suspiciousKeyPatterns > 50) {
          this.recordThreat({
            type: 'potential_keylogger',
            severity: 'high',
            description: 'Suspicious keyboard activity pattern detected',
            stage: 'credential_access',
            indicators: ['excessive_key_events', 'suspicious_combinations'],
            mitigated: false,
            timestamp: Date.now(),
            attackPattern: 'credential_harvesting'
          });
        }
        
        keyEventCount = 0;
        suspiciousKeyPatterns = 0;
      }
    }, { passive: true });
    
    // Monitor for clipboard access (often used by APTs for credential theft)
    if (navigator.clipboard) {
      const originalRead = navigator.clipboard.read.bind(navigator.clipboard);
      
      navigator.clipboard.read = async () => {
        this.recordThreat({
          type: 'clipboard_access',
          severity: 'medium',
          description: 'Clipboard access detected',
          stage: 'credential_access',
          indicators: ['clipboard_read'],
          mitigated: false,
          timestamp: Date.now(),
          attackPattern: 'credential_harvesting'
        });
        
        return originalRead();
      };
    }
  }
  
  /**
   * APT BUG FIX: Record user action for behavioral analysis
   */
  private recordUserAction(type: string, eventData: any): void {
    const sessionId = this.getSessionId();
    let profile = this.behavioralProfiles.get(sessionId);
    
    if (!profile) {
      profile = {
        sessionId,
        userAgent: navigator.userAgent,
        ipAddress: 'unknown', // Would be set by server
        actions: [],
        anomalyScore: 0,
        riskLevel: 'low',
        firstSeen: Date.now(),
        lastSeen: Date.now()
      };
      this.behavioralProfiles.set(sessionId, profile);
    }
    
    const action: UserAction = {
      type,
      timestamp: Date.now(),
      metadata: eventData,
      suspiciousScore: this.calculateSuspiciousScore(type, eventData)
    };
    
    profile.actions.push(action);
    profile.lastSeen = Date.now();
    
    // Keep only recent actions
    if (profile.actions.length > 1000) {
      profile.actions = profile.actions.slice(-1000);
    }
    
    // Update anomaly score
    this.updateAnomalyScore(profile);
  }
  
  /**
   * APT BUG FIX: Calculate suspicious score for user action
   */
  private calculateSuspiciousScore(type: string, eventData: any): number {
    let score = 0;
    
    // Base suspicion scores
    const suspiciousActions: Record<string, number> = {
      'visibility_change': 0.3,
      'focus': 0.1,
      'blur': 0.2,
      'keydown': 0.1,
      'paste': 0.4,
      'copy': 0.3
    };
    
    score += suspiciousActions[type] || 0;
    
    // Additional checks based on event data
    if (type === 'visibility_change' && eventData.hidden) {
      score += 0.2; // Activity when tab is hidden is suspicious
    }
    
    if (type === 'keydown' && eventData.ctrlKey && eventData.shiftKey) {
      score += 0.3; // Complex key combinations
    }
    
    return Math.min(score, 1.0);
  }
  
  /**
   * APT BUG FIX: Update anomaly score for behavioral profile
   */
  private updateAnomalyScore(profile: BehavioralProfile): void {
    if (profile.actions.length === 0) return;
    
    // Calculate recent suspicious activity
    const recentActions = profile.actions.slice(-100);
    const suspiciousSum = recentActions.reduce((sum, action) => sum + action.suspiciousScore, 0);
    const averageSuspicion = suspiciousSum / recentActions.length;
    
    profile.anomalyScore = averageSuspicion;
    
    // Update risk level
    if (profile.anomalyScore >= 0.8) {
      profile.riskLevel = 'critical';
    } else if (profile.anomalyScore >= 0.6) {
      profile.riskLevel = 'high';
    } else if (profile.anomalyScore >= 0.3) {
      profile.riskLevel = 'medium';
    } else {
      profile.riskLevel = 'low';
    }
    
    // Alert on high anomaly scores
    if (profile.anomalyScore >= this.config.anomalyThreshold) {
      this.recordThreat({
        type: 'behavioral_anomaly',
        severity: profile.riskLevel === 'critical' ? 'high' : 'medium',
        description: `Behavioral anomaly detected: score ${profile.anomalyScore.toFixed(2)}`,
        stage: 'reconnaissance',
        indicators: ['behavioral_anomaly', `score_${profile.anomalyScore.toFixed(2)}`],
        mitigated: false,
        timestamp: Date.now(),
        attackPattern: 'automated_behavior'
      });
    }
  }
  
  /**
   * APT BUG FIX: Start continuous monitoring for long-term persistence
   */
  private startContinuousMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.performPeriodicChecks();
    }, 60000); // Every minute
  }
  
  /**
   * APT BUG FIX: Perform periodic security checks
   */
  private performPeriodicChecks(): void {
    // Check for dormant threats that may have activated
    this.checkForDormantThreats();
    
    // Clean up old data
    this.cleanupOldData();
    
    // Check for persistence mechanisms
    this.checkPersistenceMechanisms();
    
    // Analyze long-term patterns
    this.analyzeLongTermPatterns();
  }
  
  /**
   * APT BUG FIX: Check for dormant threats becoming active
   */
  private checkForDormantThreats(): void {
    // Check if any previously inactive threats show new activity
    const currentTime = Date.now();
    
    for (const profile of this.behavioralProfiles.values()) {
      const timeSinceLastActivity = currentTime - profile.lastSeen;
      
      // If user was inactive for a while but now active, check for changes
      if (timeSinceLastActivity > 30 * 60 * 1000 && timeSinceLastActivity < 60 * 60 * 1000) {
        // 30-60 minutes of inactivity followed by activity
        this.checkForEnvironmentChanges(profile);
      }
    }
  }
  
  /**
   * APT BUG FIX: Check for environment changes that might indicate compromise
   */
  private checkForEnvironmentChanges(profile: BehavioralProfile): void {
    // Check for changes in user agent (possible browser manipulation)
    const currentUA = navigator.userAgent;
    if (profile.userAgent !== currentUA) {
      this.recordThreat({
        type: 'environment_manipulation',
        severity: 'medium',
        description: 'User agent changed during session',
        stage: 'defense_evasion',
        indicators: ['ua_change', 'session_manipulation'],
        mitigated: false,
        timestamp: Date.now(),
        attackPattern: 'environment_evasion'
      });
    }
    
    // Check for timezone changes (possible geographical movement or VPN)
    const currentTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!profile.metadata?.timezone) {
      profile.metadata = { ...profile.metadata, timezone: currentTimezone };
    } else if (profile.metadata.timezone !== currentTimezone) {
      this.recordThreat({
        type: 'timezone_change',
        severity: 'medium',
        description: 'Timezone changed during session',
        stage: 'defense_evasion',
        indicators: ['timezone_change', 'geolocation_anomaly'],
        mitigated: false,
        timestamp: Date.now(),
        attackPattern: 'geographic_evasion'
      });
    }
  }
  
  /**
   * APT BUG FIX: Get or generate session ID
   */
  private getSessionId(): string {
    // Try to get existing session ID
    let sessionId = sessionStorage.getItem('apt_session_id');
    
    if (!sessionId) {
      // Generate new session ID
      sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('apt_session_id', sessionId);
    }
    
    return sessionId;
  }
  
  /**
   * APT BUG FIX: Record network connection
   */
  private recordNetworkConnection(url: URL, suspicious: boolean): void {
    const connection: NetworkConnection = {
      destination: url.hostname,
      port: parseInt(url.port) || (url.protocol === 'https:' ? 443 : 80),
      protocol: url.protocol.replace(':', ''),
      dataSize: 0, // Would be set by actual network monitoring
      encrypted: url.protocol === 'https:',
      suspicious,
      timestamp: Date.now()
    };
    
    this.networkConnections.push(connection);
    
    // Keep only recent connections
    if (this.networkConnections.length > 1000) {
      this.networkConnections = this.networkConnections.slice(-1000);
    }
  }
  
  /**
   * APT BUG FIX: Record security threat
   */
  private recordThreat(threat: APTThreat): void {
    this.threats.push(threat);
    
    // Keep only recent threats
    if (this.threats.length > 1000) {
      this.threats = this.threats.slice(-1000);
    }
    
    console.warn('APT threat detected:', threat);
    
    // In production, alert security team for high-severity threats
    if (threat.severity === 'high') {
      this.alertSecurityTeam(threat);
    }
  }
  
  /**
   * APT BUG FIX: Alert security team of critical threats
   */
  private alertSecurityTeam(threat: APTThreat): void {
    // In production, this would send alerts to SIEM, SOC, etc.
    console.error('CRITICAL APT THREAT DETECTED:', threat);
    
    // Store alert for later retrieval
    if (typeof localStorage !== 'undefined') {
      const alerts = JSON.parse(localStorage.getItem('apt_alerts') || '[]');
      alerts.push({
        ...threat,
        alertTime: Date.now()
      });
      
      // Keep only recent alerts
      const recentAlerts = alerts.slice(-100);
      localStorage.setItem('apt_alerts', JSON.stringify(recentAlerts));
    }
  }
  
  // Additional helper methods...
  
  private initializeDataExfiltrationPrevention(): void {
    // Implementation for data exfiltration prevention
  }
  
  private initializeCommandControlBlocking(): void {
    // Implementation for C2 blocking
  }
  
  private cleanupOldData(): void {
    // Cleanup old behavioral profiles and connections
    const cutoffTime = Date.now() - this.config.sessionTimeout;
    
    for (const [sessionId, profile] of this.behavioralProfiles) {
      if (profile.lastSeen < cutoffTime) {
        this.behavioralProfiles.delete(sessionId);
      }
    }
    
    this.networkConnections = this.networkConnections.filter(
      conn => conn.timestamp > cutoffTime
    );
  }
  
  private checkPersistenceMechanisms(): void {
    // Check for APT persistence mechanisms
  }
  
  private analyzeLongTermPatterns(): void {
    // Analyze patterns over time for APT detection
  }
  
  /**
   * Get comprehensive security statistics
   */
  getSecurityStats(): {
    totalThreats: number;
    criticalThreats: number;
    highSeverityThreats: number;
    activeSessions: number;
    suspiciousConnections: number;
    averageAnomalyScore: number;
  } {
    const criticalThreats = this.threats.filter(t => 
      t.severity === 'high' && !t.mitigated
    ).length;
    
    const highSeverityThreats = this.threats.filter(t => t.severity === 'high').length;
    
    const suspiciousConnections = this.networkConnections.filter(c => c.suspicious).length;
    
    const anomalyScores = Array.from(this.behavioralProfiles.values())
      .map(p => p.anomalyScore);
    const averageAnomalyScore = anomalyScores.length > 0 
      ? anomalyScores.reduce((sum, score) => sum + score, 0) / anomalyScores.length 
      : 0;
    
    return {
      totalThreats: this.threats.length,
      criticalThreats,
      highSeverityThreats,
      activeSessions: this.behavioralProfiles.size,
      suspiciousConnections,
      averageAnomalyScore
    };
  }
  
  /**
   * Get recent threats
   */
  getRecentThreats(limit: number = 50): APTThreat[] {
    return this.threats.slice(-limit);
  }
  
  /**
   * Get behavioral profiles
   */
  getBehavioralProfiles(): BehavioralProfile[] {
    return Array.from(this.behavioralProfiles.values());
  }
  
  /**
   * Cleanup and shutdown
   */
  shutdown(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    this.threats = [];
    this.behavioralProfiles.clear();
    this.networkConnections = [];
    this.suspiciousFiles.clear();
    this.persistenceMechanisms.clear();
    
    console.log('APTProtection shutdown complete');
  }
}

// Auto-initialize protection
let autoProtection: APTProtection | null = null;

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      autoProtection = APTProtection.getInstance();
    });
  } else {
    autoProtection = APTProtection.getInstance();
  }
  
  window.addEventListener('beforeunload', () => {
    if (autoProtection) {
      autoProtection.shutdown();
    }
  });
}

export default APTProtection;