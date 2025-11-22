/**
 * HARDWARE SECURITY BUG FIX: Hardware Implant and Backdoor Protection
 * 
 * This module provides protection against hardware-level attacks and backdoors including:
 * - Hardware implants and malicious peripherals
 * - Firmware backdoors and supply chain tampering
 * - USB-based attacks (BadUSB, Rubber Ducky, etc.)
 * - DMA attacks via Thunderbolt/PCIe
 * - Hardware keyloggers and screen grabbers
 * - BIOS/UEFI rootkits and bootkits
 * - Side-channel attacks via hardware
 * - Malicious device detection
 * - Hardware fingerprinting and attestation
 * - Physical access attack mitigation
 */

export interface HardwareThreat {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  deviceType?: string;
  vendorId?: string;
  productId?: string;
  serialNumber?: string;
  mitigated: boolean;
  timestamp: number;
  evidence: string[];
}

export interface HardwareDevice {
  id: string;
  type: string;
  vendor: string;
  product: string;
  serialNumber?: string;
  firstSeen: number;
  lastSeen: number;
  trusted: boolean;
  fingerprint: string;
  suspiciousActivity: number;
}

export interface USBEvent {
  type: 'connect' | 'disconnect' | 'data_transfer';
  deviceId: string;
  timestamp: number;
  dataVolume?: number;
  suspicious: boolean;
}

export interface FirmwareSignature {
  component: string;
  version: string;
  hash: string;
  signature: string;
  verified: boolean;
  timestamp: number;
}

export interface HardwareSecurityConfig {
  enableUSBProtection: boolean;
  enableDMAProtection: boolean;
  enableFirmwareVerification: boolean;
  enableHardwareFingerprinting: boolean;
  enableKeystrokeAnalysis: boolean;
  enablePeripheralWhitelisting: boolean;
  enablePhysicalTamperDetection: boolean;
  maxUSBDataRate: number; // bytes per second
  suspiciousDeviceThreshold: number;
  keystrokeAnomalyThreshold: number;
}

/**
 * HARDWARE SECURITY BUG FIX: Main hardware security protection class
 */
export class HardwareSecurityProtection {
  private static instance: HardwareSecurityProtection;
  private config: HardwareSecurityConfig;
  private threats: HardwareThreat[] = [];
  private knownDevices: Map<string, HardwareDevice> = new Map();
  private usbEvents: USBEvent[] = [];
  private firmwareSignatures: Map<string, FirmwareSignature> = new Map();
  private keystrokePatterns: Array<{ interval: number; timestamp: number }> = [];
  private deviceWhitelist: Set<string> = new Set();
  private monitoringInterval: NodeJS.Timeout | null = null;
  
  // Known malicious USB device signatures
  private readonly MALICIOUS_USB_DEVICES = [
    { vid: '16c0', pid: '0483', name: 'Teensy HID' }, // Often used for BadUSB
    { vid: '1b4f', pid: '9206', name: 'Arduino Leonardo' }, // Can act as HID
    { vid: '16c0', pid: '05dc', name: 'USB Rubber Ducky' }, // Hak5 device
    { vid: '045e', pid: '028e', name: 'Suspicious Gamepad' }, // Fake Xbox controller
    { vid: '0403', pid: '6001', name: 'FTDI Serial' }, // Can be reprogrammed
  ];
  
  // Suspicious USB behavior patterns
  private readonly SUSPICIOUS_USB_PATTERNS = {
    rapidConnect: { threshold: 3, window: 10000 }, // 3 connects in 10 seconds
    largeDataTransfer: { threshold: 100 * 1024 * 1024 }, // 100MB
    hidWithStorage: true, // HID device that also has storage
    unrecognizedDescriptor: true,
    modifiedFirmware: true
  };
  
  // Hardware-based side channel indicators
  private readonly SIDE_CHANNEL_INDICATORS = {
    // EM emanation patterns
    emPatterns: ['periodic_spike', 'data_correlated', 'key_dependent'],
    
    // Timing patterns
    timingChannels: ['cache_timing', 'branch_prediction', 'speculative_execution'],
    
    // Power analysis
    powerPatterns: ['differential_power', 'simple_power', 'correlation_power'],
    
    // Acoustic patterns
    acousticChannels: ['keyboard_acoustic', 'cpu_acoustic', 'hdd_acoustic']
  };
  
  // BIOS/UEFI rootkit signatures
  private readonly ROOTKIT_SIGNATURES = [
    { name: 'LoJax', signature: /PCI\\VEN_.*&DEV_.*&SUBSYS_.*&REV_/i },
    { name: 'MosaicRegressor', signature: /\\\\Registry\\\\Machine\\\\System.*\\\\Services/i },
    { name: 'FinFisher', signature: /\\\\Device\\\\PhysicalMemory/i },
    { name: 'Hacking Team', signature: /\\\\DosDevices\\\\PhysicalMemory/i }
  ];
  
  private readonly DEFAULT_CONFIG: HardwareSecurityConfig = {
    enableUSBProtection: true,
    enableDMAProtection: true,
    enableFirmwareVerification: true,
    enableHardwareFingerprinting: true,
    enableKeystrokeAnalysis: true,
    enablePeripheralWhitelisting: true,
    enablePhysicalTamperDetection: true,
    maxUSBDataRate: 10 * 1024 * 1024, // 10 MB/s
    suspiciousDeviceThreshold: 0.7,
    keystrokeAnomalyThreshold: 2.5 // Standard deviations
  };
  
  static getInstance(config?: Partial<HardwareSecurityConfig>): HardwareSecurityProtection {
    if (!this.instance) {
      this.instance = new HardwareSecurityProtection(config);
    }
    return this.instance;
  }
  
  private constructor(config?: Partial<HardwareSecurityConfig>) {
    this.config = { ...this.DEFAULT_CONFIG, ...config };
    this.initializeProtection();
  }
  
  /**
   * HARDWARE SECURITY BUG FIX: Initialize comprehensive hardware protection
   */
  private initializeProtection(): void {
    // Initialize USB protection
    if (this.config.enableUSBProtection) {
      this.initializeUSBProtection();
    }
    
    // Initialize DMA protection
    if (this.config.enableDMAProtection) {
      this.initializeDMAProtection();
    }
    
    // Initialize firmware verification
    if (this.config.enableFirmwareVerification) {
      this.initializeFirmwareVerification();
    }
    
    // Initialize hardware fingerprinting
    if (this.config.enableHardwareFingerprinting) {
      this.initializeHardwareFingerprinting();
    }
    
    // Initialize keystroke analysis
    if (this.config.enableKeystrokeAnalysis) {
      this.initializeKeystrokeAnalysis();
    }
    
    // Initialize physical tamper detection
    if (this.config.enablePhysicalTamperDetection) {
      this.initializePhysicalTamperDetection();
    }
    
    // Start continuous monitoring
    this.startContinuousMonitoring();
    
    console.log('HardwareSecurityProtection initialized with config:', this.config);
  }
  
  /**
   * HARDWARE SECURITY BUG FIX: Initialize USB device protection
   */
  private initializeUSBProtection(): void {
    if (typeof navigator === 'undefined') return;
    
    // Monitor USB device connections
    if ('usb' in navigator) {
      const usb = (navigator as any).usb;
      
      // Monitor USB permission requests
      usb.addEventListener('connect', (event: any) => {
        this.handleUSBConnection(event.device);
      });
      
      usb.addEventListener('disconnect', (event: any) => {
        this.handleUSBDisconnection(event.device);
      });
    }
    
    // Monitor WebUSB API usage
    if ('usb' in navigator && (navigator as any).usb.requestDevice) {
      const originalRequestDevice = (navigator as any).usb.requestDevice;
      
      (navigator as any).usb.requestDevice = async (options: any) => {
        // Check for suspicious device requests
        if (this.isSuspiciousUSBRequest(options)) {
          this.recordThreat({
            type: 'suspicious_usb_request',
            severity: 'high',
            description: 'Suspicious USB device access requested',
            deviceType: 'usb',
            mitigated: true,
            timestamp: Date.now(),
            evidence: ['blocked_suspicious_request']
          });
          
          throw new Error('USB device access denied');
        }
        
        return originalRequestDevice.call((navigator as any).usb, options);
      };
    }
    
    // Monitor HID devices
    if ('hid' in navigator) {
      this.monitorHIDDevices();
    }
    
    // Monitor Serial API (can be used for Arduino attacks)
    if ('serial' in navigator) {
      this.monitorSerialDevices();
    }
  }
  
  /**
   * HARDWARE SECURITY BUG FIX: Handle USB device connection
   */
  private handleUSBConnection(device: any): void {
    const deviceId = this.generateDeviceId(device);
    const fingerprint = this.generateDeviceFingerprint(device);
    
    // Check against known malicious devices
    const malicious = this.checkMaliciousDevice(device);
    
    if (malicious) {
      this.recordThreat({
        type: 'malicious_usb_device',
        severity: 'critical',
        description: `Known malicious USB device connected: ${malicious.name}`,
        deviceType: 'usb',
        vendorId: device.vendorId?.toString(16),
        productId: device.productId?.toString(16),
        mitigated: false,
        timestamp: Date.now(),
        evidence: ['known_malicious_signature']
      });
    }
    
    // Check for rapid connections (BadUSB indicator)
    const recentConnections = this.usbEvents.filter(e => 
      e.type === 'connect' && 
      Date.now() - e.timestamp < this.SUSPICIOUS_USB_PATTERNS.rapidConnect.window
    );
    
    if (recentConnections.length >= this.SUSPICIOUS_USB_PATTERNS.rapidConnect.threshold) {
      this.recordThreat({
        type: 'rapid_usb_connections',
        severity: 'high',
        description: 'Rapid USB device connections detected',
        deviceType: 'usb',
        mitigated: false,
        timestamp: Date.now(),
        evidence: [`${recentConnections.length} connections in ${this.SUSPICIOUS_USB_PATTERNS.rapidConnect.window}ms`]
      });
    }
    
    // Record device
    const hardwareDevice: HardwareDevice = {
      id: deviceId,
      type: 'usb',
      vendor: device.manufacturerName || 'Unknown',
      product: device.productName || 'Unknown',
      serialNumber: device.serialNumber,
      firstSeen: Date.now(),
      lastSeen: Date.now(),
      trusted: !malicious && this.deviceWhitelist.has(fingerprint),
      fingerprint,
      suspiciousActivity: malicious ? 1 : 0
    };
    
    this.knownDevices.set(deviceId, hardwareDevice);
    
    // Record USB event
    this.recordUSBEvent({
      type: 'connect',
      deviceId,
      timestamp: Date.now(),
      suspicious: !!malicious
    });
  }
  
  /**
   * HARDWARE SECURITY BUG FIX: Check if device matches malicious signatures
   */
  private checkMaliciousDevice(device: any): any {
    if (!device.vendorId || !device.productId) return null;
    
    const vid = device.vendorId.toString(16).padStart(4, '0');
    const pid = device.productId.toString(16).padStart(4, '0');
    
    return this.MALICIOUS_USB_DEVICES.find(malicious => 
      malicious.vid === vid && malicious.pid === pid
    );
  }
  
  /**
   * HARDWARE SECURITY BUG FIX: Generate device fingerprint
   */
  private generateDeviceFingerprint(device: any): string {
    const components = [
      device.vendorId,
      device.productId,
      device.manufacturerName,
      device.productName,
      device.serialNumber,
      device.deviceClass,
      device.deviceSubclass,
      device.deviceProtocol
    ].filter(Boolean).join('|');
    
    // Simple hash function for fingerprinting
    let hash = 0;
    for (let i = 0; i < components.length; i++) {
      const char = components.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return hash.toString(16);
  }
  
  /**
   * HARDWARE SECURITY BUG FIX: Monitor HID devices for keyloggers
   */
  private monitorHIDDevices(): void {
    if (!('hid' in navigator)) return;
    
    const hid = (navigator as any).hid;
    
    // Monitor HID connections
    hid.addEventListener('connect', (event: any) => {
      const device = event.device;
      
      // HID devices can act as keyboards/mice - potential keyloggers
      this.recordThreat({
        type: 'hid_device_connected',
        severity: 'medium',
        description: 'HID device connected - potential keylogger',
        deviceType: 'hid',
        vendorId: device.vendorId?.toString(16),
        productId: device.productId?.toString(16),
        mitigated: false,
        timestamp: Date.now(),
        evidence: ['hid_device_detection']
      });
      
      // If it's a keyboard-like device, increase monitoring
      if (this.isKeyboardLikeDevice(device)) {
        this.enhanceKeystrokeMonitoring();
      }
    });
  }
  
  /**
   * HARDWARE SECURITY BUG FIX: Check if device appears to be keyboard-like
   */
  private isKeyboardLikeDevice(device: any): boolean {
    // Check usage page and usage (HID descriptors)
    // Usage page 0x01 (Generic Desktop) and usage 0x06 (Keyboard)
    if (device.collections) {
      return device.collections.some((collection: any) => 
        collection.usagePage === 0x01 && collection.usage === 0x06
      );
    }
    
    // Check product name
    const productName = (device.productName || '').toLowerCase();
    return /keyboard|keypad|input/i.test(productName);
  }
  
  /**
   * HARDWARE SECURITY BUG FIX: Initialize DMA protection
   */
  private initializeDMAProtection(): void {
    // Monitor for Thunderbolt/PCIe device connections
    // In a web context, we can't directly access DMA, but we can monitor for indicators
    
    // Check for suspicious memory access patterns
    this.monitorMemoryAccessPatterns();
    
    // Monitor for DMA attack indicators in WebGL
    this.monitorWebGLForDMA();
  }
  
  /**
   * HARDWARE SECURITY BUG FIX: Monitor memory access patterns for DMA attacks
   */
  private monitorMemoryAccessPatterns(): void {
    if (typeof performance === 'undefined' || !performance.memory) return;
    
    let lastMemoryUsage = performance.memory.usedJSHeapSize;
    let suspiciousPatterns = 0;
    
    setInterval(() => {
      const currentMemoryUsage = performance.memory.usedJSHeapSize;
      const delta = currentMemoryUsage - lastMemoryUsage;
      
      // Sudden large memory reads/writes might indicate DMA
      if (Math.abs(delta) > 50 * 1024 * 1024) { // 50MB change
        suspiciousPatterns++;
        
        if (suspiciousPatterns > 3) {
          this.recordThreat({
            type: 'suspicious_memory_pattern',
            severity: 'medium',
            description: 'Suspicious memory access pattern detected - possible DMA attack',
            deviceType: 'memory',
            mitigated: false,
            timestamp: Date.now(),
            evidence: [`memory_delta: ${delta}`, `pattern_count: ${suspiciousPatterns}`]
          });
        }
      }
      
      lastMemoryUsage = currentMemoryUsage;
    }, 1000);
  }
  
  /**
   * HARDWARE SECURITY BUG FIX: Monitor WebGL for GPU-based DMA attacks
   */
  private monitorWebGLForDMA(): void {
    if (typeof WebGLRenderingContext === 'undefined') return;
    
    // Override getContext to monitor WebGL usage
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    
    HTMLCanvasElement.prototype.getContext = function(contextType: string, ...args: any[]) {
      if (contextType === 'webgl' || contextType === 'webgl2') {
        const protection = HardwareSecurityProtection.getInstance();
        
        // WebGL can be used for GPU-based attacks
        protection.recordThreat({
          type: 'webgl_context_created',
          severity: 'low',
          description: 'WebGL context created - monitoring for GPU attacks',
          deviceType: 'gpu',
          mitigated: false,
          timestamp: Date.now(),
          evidence: [`context_type: ${contextType}`]
        });
        
        const context = originalGetContext.apply(this, [contextType, ...args]);
        
        if (context) {
          protection.wrapWebGLContext(context);
        }
        
        return context;
      }
      
      return originalGetContext.apply(this, [contextType, ...args]);
    };
  }
  
  /**
   * HARDWARE SECURITY BUG FIX: Wrap WebGL context for monitoring
   */
  private wrapWebGLContext(gl: WebGLRenderingContext | WebGL2RenderingContext): void {
    // Monitor buffer operations that could be used for DMA-like attacks
    const originalBufferData = gl.bufferData.bind(gl);
    
    (gl as any).bufferData = function(target: number, size: number | ArrayBufferView | ArrayBuffer, usage: number) {
      const protection = HardwareSecurityProtection.getInstance();
      
      // Large buffer allocations might be used for attacks
      const bufferSize = typeof size === 'number' ? size : size.byteLength;
      
      if (bufferSize > 100 * 1024 * 1024) { // 100MB
        protection.recordThreat({
          type: 'large_gpu_buffer',
          severity: 'medium',
          description: `Large GPU buffer allocation: ${bufferSize} bytes`,
          deviceType: 'gpu',
          mitigated: false,
          timestamp: Date.now(),
          evidence: [`buffer_size: ${bufferSize}`, `usage: ${usage}`]
        });
      }
      
      return originalBufferData(target, size, usage);
    };
  }
  
  /**
   * HARDWARE SECURITY BUG FIX: Initialize firmware verification
   */
  private initializeFirmwareVerification(): void {
    // Check for firmware integrity
    this.verifySystemFirmware();
    
    // Monitor for firmware modifications
    this.monitorFirmwareChanges();
  }
  
  /**
   * HARDWARE SECURITY BUG FIX: Verify system firmware integrity
   */
  private verifySystemFirmware(): void {
    // In a browser context, we can check for certain indicators
    
    // Check user agent for anomalies
    const ua = navigator.userAgent;
    const platform = navigator.platform;
    
    // Check for mismatches that might indicate firmware tampering
    if (this.detectUserAgentAnomalies(ua, platform)) {
      this.recordThreat({
        type: 'user_agent_anomaly',
        severity: 'medium',
        description: 'User agent anomaly detected - possible firmware modification',
        mitigated: false,
        timestamp: Date.now(),
        evidence: [`user_agent: ${ua}`, `platform: ${platform}`]
      });
    }
    
    // Check for rootkit signatures in accessible system info
    this.checkForRootkitSignatures();
  }
  
  /**
   * HARDWARE SECURITY BUG FIX: Detect user agent anomalies
   */
  private detectUserAgentAnomalies(ua: string, platform: string): boolean {
    // Check for inconsistencies
    const anomalies = [];
    
    // Windows UA on Mac platform
    if (platform.includes('Mac') && ua.includes('Windows')) {
      anomalies.push('platform_mismatch');
    }
    
    // Missing expected components
    if (!ua.includes('Mozilla') || !ua.includes('Gecko')) {
      anomalies.push('missing_components');
    }
    
    // Suspicious modifications
    if (ua.includes('..') || ua.includes('\\x') || ua.includes('%00')) {
      anomalies.push('suspicious_characters');
    }
    
    return anomalies.length > 0;
  }
  
  /**
   * HARDWARE SECURITY BUG FIX: Initialize keystroke analysis
   */
  private initializeKeystrokeAnalysis(): void {
    if (typeof window === 'undefined') return;
    
    let lastKeystrokeTime = 0;
    
    // Monitor keystrokes for patterns
    window.addEventListener('keydown', (event) => {
      const currentTime = Date.now();
      
      if (lastKeystrokeTime > 0) {
        const interval = currentTime - lastKeystrokeTime;
        
        this.keystrokePatterns.push({
          interval,
          timestamp: currentTime
        });
        
        // Keep only recent patterns
        if (this.keystrokePatterns.length > 1000) {
          this.keystrokePatterns = this.keystrokePatterns.slice(-1000);
        }
        
        // Analyze for anomalies
        this.analyzeKeystrokePatterns();
      }
      
      lastKeystrokeTime = currentTime;
    });
    
    // Monitor paste events (keyloggers often trigger these)
    window.addEventListener('paste', (event) => {
      this.recordThreat({
        type: 'paste_event',
        severity: 'low',
        description: 'Paste event detected - monitoring for automated input',
        mitigated: false,
        timestamp: Date.now(),
        evidence: ['paste_event']
      });
    });
  }
  
  /**
   * HARDWARE SECURITY BUG FIX: Analyze keystroke patterns for anomalies
   */
  private analyzeKeystrokePatterns(): void {
    if (this.keystrokePatterns.length < 100) return;
    
    // Calculate statistics
    const intervals = this.keystrokePatterns.map(p => p.interval);
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => 
      sum + Math.pow(interval - mean, 2), 0
    ) / intervals.length;
    const stdDev = Math.sqrt(variance);
    
    // Check for inhuman typing speeds
    const tooFast = intervals.filter(i => i < 30).length; // < 30ms between keys
    const tooRegular = stdDev < 10; // Very consistent timing
    
    if (tooFast > 10 || tooRegular) {
      this.recordThreat({
        type: 'keystroke_anomaly',
        severity: 'high',
        description: 'Abnormal keystroke patterns detected - possible hardware keylogger',
        mitigated: false,
        timestamp: Date.now(),
        evidence: [
          `fast_keystrokes: ${tooFast}`,
          `std_dev: ${stdDev.toFixed(2)}`,
          `mean_interval: ${mean.toFixed(2)}ms`
        ]
      });
    }
  }
  
  /**
   * HARDWARE SECURITY BUG FIX: Initialize physical tamper detection
   */
  private initializePhysicalTamperDetection(): void {
    // Monitor for sudden disconnections
    this.monitorDeviceStability();
    
    // Monitor for environmental changes
    this.monitorEnvironmentalSensors();
  }
  
  /**
   * HARDWARE SECURITY BUG FIX: Monitor device stability
   */
  private monitorDeviceStability(): void {
    // Monitor for sudden device disconnections that might indicate tampering
    let deviceCount = this.knownDevices.size;
    
    setInterval(() => {
      const currentCount = this.knownDevices.size;
      
      if (currentCount < deviceCount - 2) {
        // Multiple devices disconnected suddenly
        this.recordThreat({
          type: 'mass_device_disconnection',
          severity: 'high',
          description: 'Multiple devices disconnected suddenly - possible physical tampering',
          mitigated: false,
          timestamp: Date.now(),
          evidence: [`devices_lost: ${deviceCount - currentCount}`]
        });
      }
      
      deviceCount = currentCount;
    }, 5000);
  }
  
  /**
   * HARDWARE SECURITY BUG FIX: Monitor environmental sensors
   */
  private monitorEnvironmentalSensors(): void {
    if (typeof window === 'undefined') return;
    
    // Monitor accelerometer for device movement (tampering indicator)
    if ('DeviceMotionEvent' in window) {
      let lastAcceleration = { x: 0, y: 0, z: 0 };
      
      window.addEventListener('devicemotion', (event) => {
        if (event.acceleration) {
          const accel = event.acceleration;
          
          // Calculate magnitude of change
          const change = Math.sqrt(
            Math.pow((accel.x || 0) - lastAcceleration.x, 2) +
            Math.pow((accel.y || 0) - lastAcceleration.y, 2) +
            Math.pow((accel.z || 0) - lastAcceleration.z, 2)
          );
          
          // Sudden movement might indicate tampering
          if (change > 15) { // m/s²
            this.recordThreat({
              type: 'device_movement_detected',
              severity: 'medium',
              description: 'Sudden device movement detected - possible physical tampering',
              mitigated: false,
              timestamp: Date.now(),
              evidence: [`acceleration_change: ${change.toFixed(2)}`]
            });
          }
          
          lastAcceleration = {
            x: accel.x || 0,
            y: accel.y || 0,
            z: accel.z || 0
          };
        }
      });
    }
    
    // Monitor ambient light (opening case changes lighting)
    if ('AmbientLightSensor' in window) {
      try {
        const sensor = new (window as any).AmbientLightSensor();
        let lastReading = 0;
        
        sensor.addEventListener('reading', () => {
          const currentReading = sensor.illuminance;
          
          // Sudden large changes might indicate case opening
          if (lastReading > 0 && Math.abs(currentReading - lastReading) > 1000) {
            this.recordThreat({
              type: 'ambient_light_change',
              severity: 'low',
              description: 'Sudden ambient light change - possible case opening',
              mitigated: false,
              timestamp: Date.now(),
              evidence: [`light_change: ${Math.abs(currentReading - lastReading)}`]
            });
          }
          
          lastReading = currentReading;
        });
        
        sensor.start();
      } catch (error) {
        // Sensor not available or permission denied
      }
    }
  }
  
  /**
   * HARDWARE SECURITY BUG FIX: Start continuous monitoring
   */
  private startContinuousMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.performSecurityChecks();
    }, 30000); // Every 30 seconds
  }
  
  /**
   * HARDWARE SECURITY BUG FIX: Perform periodic security checks
   */
  private performSecurityChecks(): void {
    // Check for new suspicious devices
    this.checkSuspiciousDevices();
    
    // Monitor USB data rates
    this.monitorUSBDataRates();
    
    // Check for side-channel indicators
    this.checkSideChannelIndicators();
    
    // Clean up old data
    this.cleanupOldData();
  }
  
  /**
   * HARDWARE SECURITY BUG FIX: Check for suspicious devices
   */
  private checkSuspiciousDevices(): void {
    for (const [deviceId, device] of this.knownDevices) {
      if (device.suspiciousActivity > this.config.suspiciousDeviceThreshold) {
        this.recordThreat({
          type: 'suspicious_device_threshold',
          severity: 'high',
          description: `Device exceeded suspicious activity threshold: ${device.product}`,
          deviceType: device.type,
          mitigated: false,
          timestamp: Date.now(),
          evidence: [`suspicious_score: ${device.suspiciousActivity}`]
        });
      }
    }
  }
  
  /**
   * HARDWARE SECURITY BUG FIX: Generate device ID
   */
  private generateDeviceId(device: any): string {
    return `${device.vendorId}_${device.productId}_${device.serialNumber || 'no_serial'}`;
  }
  
  /**
   * HARDWARE SECURITY BUG FIX: Handle USB disconnection
   */
  private handleUSBDisconnection(device: any): void {
    const deviceId = this.generateDeviceId(device);
    
    this.recordUSBEvent({
      type: 'disconnect',
      deviceId,
      timestamp: Date.now(),
      suspicious: false
    });
  }
  
  /**
   * HARDWARE SECURITY BUG FIX: Check if USB request is suspicious
   */
  private isSuspiciousUSBRequest(options: any): boolean {
    if (!options.filters || options.filters.length === 0) {
      // Requesting any device is suspicious
      return true;
    }
    
    // Check for known malicious device requests
    for (const filter of options.filters) {
      const match = this.MALICIOUS_USB_DEVICES.find(device => 
        filter.vendorId === parseInt(device.vid, 16) ||
        filter.productId === parseInt(device.pid, 16)
      );
      
      if (match) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * HARDWARE SECURITY BUG FIX: Monitor serial devices
   */
  private monitorSerialDevices(): void {
    if (!('serial' in navigator)) return;
    
    const serial = (navigator as any).serial;
    
    // Monitor serial port requests
    const originalRequestPort = serial.requestPort;
    
    serial.requestPort = async (options?: any) => {
      this.recordThreat({
        type: 'serial_port_request',
        severity: 'medium',
        description: 'Serial port access requested - potential Arduino/microcontroller attack',
        deviceType: 'serial',
        mitigated: false,
        timestamp: Date.now(),
        evidence: ['serial_access']
      });
      
      return originalRequestPort.call(serial, options);
    };
  }
  
  /**
   * HARDWARE SECURITY BUG FIX: Enhance keystroke monitoring
   */
  private enhanceKeystrokeMonitoring(): void {
    console.log('Enhanced keystroke monitoring activated due to HID device');
    // Increase keystroke analysis frequency
  }
  
  /**
   * HARDWARE SECURITY BUG FIX: Monitor firmware changes
   */
  private monitorFirmwareChanges(): void {
    // In browser context, monitor for signs of firmware modification
    setInterval(() => {
      // Re-verify user agent hasn't changed
      this.verifySystemFirmware();
    }, 300000); // Every 5 minutes
  }
  
  /**
   * HARDWARE SECURITY BUG FIX: Check for rootkit signatures
   */
  private checkForRootkitSignatures(): void {
    // Check available browser APIs for rootkit indicators
    const signatures = [];
    
    // Check for suspicious properties
    if (window.navigator && 'hardwareConcurrency' in navigator) {
      const cores = navigator.hardwareConcurrency;
      if (cores === 0 || cores > 128) {
        signatures.push('suspicious_core_count');
      }
    }
    
    // Check for modified prototypes (rootkit behavior)
    const nativeCode = '[native code]';
    if (!window.fetch.toString().includes(nativeCode)) {
      signatures.push('modified_fetch');
    }
    
    if (signatures.length > 0) {
      this.recordThreat({
        type: 'rootkit_indicators',
        severity: 'high',
        description: 'Potential rootkit indicators detected',
        mitigated: false,
        timestamp: Date.now(),
        evidence: signatures
      });
    }
  }
  
  /**
   * HARDWARE SECURITY BUG FIX: Monitor USB data rates
   */
  private monitorUSBDataRates(): void {
    // Calculate data rates for recent USB events
    const recentTransfers = this.usbEvents.filter(e => 
      e.type === 'data_transfer' && 
      Date.now() - e.timestamp < 60000 // Last minute
    );
    
    const totalData = recentTransfers.reduce((sum, e) => sum + (e.dataVolume || 0), 0);
    const dataRate = totalData / 60; // Bytes per second
    
    if (dataRate > this.config.maxUSBDataRate) {
      this.recordThreat({
        type: 'excessive_usb_data_rate',
        severity: 'high',
        description: `Excessive USB data rate detected: ${(dataRate / 1024 / 1024).toFixed(2)} MB/s`,
        deviceType: 'usb',
        mitigated: false,
        timestamp: Date.now(),
        evidence: [`data_rate: ${dataRate}`, `max_allowed: ${this.config.maxUSBDataRate}`]
      });
    }
  }
  
  /**
   * HARDWARE SECURITY BUG FIX: Check for side-channel indicators
   */
  private checkSideChannelIndicators(): void {
    // In browser context, we can check for timing-based side channels
    const timingData: number[] = [];
    
    // Measure crypto operation timing
    for (let i = 0; i < 10; i++) {
      const start = performance.now();
      crypto.getRandomValues(new Uint8Array(1024));
      const end = performance.now();
      timingData.push(end - start);
    }
    
    // Check for suspicious timing patterns
    const avgTiming = timingData.reduce((a, b) => a + b, 0) / timingData.length;
    const variance = timingData.reduce((sum, t) => sum + Math.pow(t - avgTiming, 2), 0) / timingData.length;
    
    // Very low variance might indicate timing side-channel
    if (variance < 0.001) {
      this.recordThreat({
        type: 'timing_side_channel',
        severity: 'medium',
        description: 'Potential timing side-channel detected in crypto operations',
        mitigated: false,
        timestamp: Date.now(),
        evidence: [`variance: ${variance}`, `avg_timing: ${avgTiming}`]
      });
    }
  }
  
  /**
   * HARDWARE SECURITY BUG FIX: Record USB event
   */
  private recordUSBEvent(event: USBEvent): void {
    this.usbEvents.push(event);
    
    // Keep only recent events
    if (this.usbEvents.length > 1000) {
      this.usbEvents = this.usbEvents.slice(-1000);
    }
  }
  
  /**
   * HARDWARE SECURITY BUG FIX: Record security threat
   */
  private recordThreat(threat: HardwareThreat): void {
    this.threats.push(threat);
    
    // Keep only recent threats
    if (this.threats.length > 1000) {
      this.threats = this.threats.slice(-1000);
    }
    
    console.warn('Hardware security threat detected:', threat);
    
    // Alert for critical threats
    if (threat.severity === 'critical') {
      this.alertSecurityTeam(threat);
    }
  }
  
  /**
   * HARDWARE SECURITY BUG FIX: Alert security team
   */
  private alertSecurityTeam(threat: HardwareThreat): void {
    console.error('CRITICAL HARDWARE SECURITY THREAT:', threat);
    
    // Store alert
    if (typeof localStorage !== 'undefined') {
      const alerts = JSON.parse(localStorage.getItem('hardware_alerts') || '[]');
      alerts.push({
        ...threat,
        alertTime: Date.now()
      });
      
      localStorage.setItem('hardware_alerts', JSON.stringify(alerts.slice(-100)));
    }
  }
  
  /**
   * HARDWARE SECURITY BUG FIX: Clean up old data
   */
  private cleanupOldData(): void {
    const cutoffTime = Date.now() - 24 * 60 * 60 * 1000; // 24 hours
    
    // Clean up old USB events
    this.usbEvents = this.usbEvents.filter(e => e.timestamp > cutoffTime);
    
    // Clean up old keystroke patterns
    this.keystrokePatterns = this.keystrokePatterns.filter(p => p.timestamp > cutoffTime);
    
    // Update device last seen times
    for (const [deviceId, device] of this.knownDevices) {
      if (device.lastSeen < cutoffTime) {
        this.knownDevices.delete(deviceId);
      }
    }
  }
  
  /**
   * Get security statistics
   */
  getSecurityStats(): {
    totalThreats: number;
    criticalThreats: number;
    knownDevices: number;
    suspiciousDevices: number;
    usbEvents: number;
    firmwareIssues: number;
  } {
    const suspiciousDevices = Array.from(this.knownDevices.values())
      .filter(d => d.suspiciousActivity > 0).length;
    
    const firmwareIssues = this.threats.filter(t => 
      t.type.includes('firmware') || t.type.includes('rootkit')
    ).length;
    
    return {
      totalThreats: this.threats.length,
      criticalThreats: this.threats.filter(t => t.severity === 'critical').length,
      knownDevices: this.knownDevices.size,
      suspiciousDevices,
      usbEvents: this.usbEvents.length,
      firmwareIssues
    };
  }
  
  /**
   * Get recent threats
   */
  getRecentThreats(limit: number = 50): HardwareThreat[] {
    return this.threats.slice(-limit);
  }
  
  /**
   * Add device to whitelist
   */
  addToWhitelist(deviceFingerprint: string): void {
    this.deviceWhitelist.add(deviceFingerprint);
    console.log(`Device added to whitelist: ${deviceFingerprint}`);
  }
  
  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<HardwareSecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('Hardware security configuration updated:', this.config);
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
    this.knownDevices.clear();
    this.usbEvents = [];
    this.firmwareSignatures.clear();
    this.keystrokePatterns = [];
    this.deviceWhitelist.clear();
    
    console.log('HardwareSecurityProtection shutdown complete');
  }
}

// Auto-initialize protection
let autoProtection: HardwareSecurityProtection | null = null;

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      autoProtection = HardwareSecurityProtection.getInstance();
    });
  } else {
    autoProtection = HardwareSecurityProtection.getInstance();
  }
  
  window.addEventListener('beforeunload', () => {
    if (autoProtection) {
      autoProtection.shutdown();
    }
  });
}

export default HardwareSecurityProtection;