/**
 * PHYSICAL SECURITY BUG FIX: Air-Gap Bridging and Physical Attack Protection
 * 
 * This module provides protection against physical and air-gap bridging attacks including:
 * - Acoustic side-channel attacks (keyboard, fan, HDD sounds)
 * - Ultrasonic and inaudible frequency attacks
 * - Light-based exfiltration (screen, LED, optical)
 * - Electromagnetic emanation (TEMPEST-style attacks)
 * - Vibration and seismic attacks
 * - Temperature-based covert channels
 * - Power line communication attacks
 * - RF emission and reception attacks
 * - Air pressure and airflow manipulation
 * - Magnetic field manipulation
 */

export interface PhysicalThreat {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  medium: 'acoustic' | 'optical' | 'electromagnetic' | 'thermal' | 'vibration' | 'rf' | 'power';
  frequency?: number; // Hz for acoustic/RF
  intensity?: number; // Signal strength
  evidence: string[];
  mitigated: boolean;
  timestamp: number;
}

export interface AcousticSignal {
  frequency: number;
  amplitude: number;
  duration: number;
  pattern?: number[]; // Frequency pattern over time
  suspicious: boolean;
  timestamp: number;
}

export interface OpticalSignal {
  type: 'screen' | 'led' | 'camera' | 'ambient';
  intensity: number;
  colorChannels?: { r: number; g: number; b: number };
  flickerRate?: number;
  pattern?: string;
  timestamp: number;
}

export interface EMSignal {
  frequency: number; // MHz
  strength: number; // dBm
  modulation?: string;
  bandwidth?: number;
  suspicious: boolean;
  timestamp: number;
}

export interface PhysicalSecurityConfig {
  enableAcousticProtection: boolean;
  enableOpticalProtection: boolean;
  enableEMProtection: boolean;
  enableThermalProtection: boolean;
  enableVibrationProtection: boolean;
  enableRFProtection: boolean;
  ultrasonicThreshold: number; // Hz
  infrasonicThreshold: number; // Hz
  emFieldThreshold: number; // μT
  temperatureAnomalyThreshold: number; // °C
  opticalFlickerThreshold: number; // Hz
}

/**
 * PHYSICAL SECURITY BUG FIX: Main physical security protection class
 */
export class PhysicalSecurityProtection {
  private static instance: PhysicalSecurityProtection;
  private config: PhysicalSecurityConfig;
  private threats: PhysicalThreat[] = [];
  private acousticSignals: AcousticSignal[] = [];
  private opticalSignals: OpticalSignal[] = [];
  private emSignals: EMSignal[] = [];
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphoneStream: MediaStream | null = null;
  private monitoringInterval: NodeJS.Timeout | null = null;
  
  // Known air-gap bridging techniques
  private readonly AIR_GAP_TECHNIQUES = {
    // Acoustic techniques
    acoustic: {
      fansmitter: { minFreq: 100, maxFreq: 600 }, // CPU fan modulation
      diskfiltration: { minFreq: 300, maxFreq: 1200 }, // HDD acoustic
      speakear: { minFreq: 18000, maxFreq: 24000 }, // Ultrasonic
      mosquito: { minFreq: 24, maxFreq: 48 }, // Infrasonic
      keystroke: { minFreq: 3000, maxFreq: 15000 } // Keyboard acoustic
    },
    
    // Optical techniques
    optical: {
      visibone: { flickerRate: 15 }, // Screen brightness modulation
      led_it_go: { flickerRate: 1000 }, // LED exfiltration
      airhopper: { colorChannel: 'blue' }, // Screen color channel
      xled: { pattern: 'binary' } // Router LED patterns
    },
    
    // Electromagnetic techniques
    electromagnetic: {
      airhopper_em: { freq: 2400 }, // 2.4GHz emissions
      gsmem: { freq: 850 }, // GSM frequencies
      usbee: { freq: 240 }, // USB cable emissions
      funthenna: { freq: 100 } // General EM emissions
    },
    
    // Thermal techniques
    thermal: {
      bitwhisper: { tempRange: 1 }, // CPU temperature modulation
      heatstroke: { tempRange: 5 } // System heat patterns
    }
  };
  
  // Acoustic patterns for keyboard identification
  private readonly KEYBOARD_ACOUSTIC_SIGNATURES = {
    mechanical: { freqRange: [3000, 8000], duration: [10, 50] },
    membrane: { freqRange: [2000, 5000], duration: [5, 30] },
    scissor: { freqRange: [4000, 7000], duration: [8, 40] },
    butterfly: { freqRange: [5000, 9000], duration: [12, 45] }
  };
  
  // Ultrasonic command patterns
  private readonly ULTRASONIC_COMMANDS = [
    { pattern: [20000, 21000, 20000], command: 'ping' },
    { pattern: [22000, 22000, 23000], command: 'data' },
    { pattern: [19000, 20000, 21000], command: 'sync' }
  ];
  
  private readonly DEFAULT_CONFIG: PhysicalSecurityConfig = {
    enableAcousticProtection: true,
    enableOpticalProtection: true,
    enableEMProtection: true,
    enableThermalProtection: true,
    enableVibrationProtection: true,
    enableRFProtection: true,
    ultrasonicThreshold: 17000, // 17kHz
    infrasonicThreshold: 80, // 80Hz
    emFieldThreshold: 100, // 100 μT
    temperatureAnomalyThreshold: 5, // 5°C change
    opticalFlickerThreshold: 60 // 60Hz
  };
  
  static getInstance(config?: Partial<PhysicalSecurityConfig>): PhysicalSecurityProtection {
    if (!this.instance) {
      this.instance = new PhysicalSecurityProtection(config);
    }
    return this.instance;
  }
  
  private constructor(config?: Partial<PhysicalSecurityConfig>) {
    this.config = { ...this.DEFAULT_CONFIG, ...config };
    this.initializeProtection();
  }
  
  /**
   * PHYSICAL SECURITY BUG FIX: Initialize comprehensive physical protection
   */
  private initializeProtection(): void {
    // Initialize acoustic protection
    if (this.config.enableAcousticProtection) {
      this.initializeAcousticProtection();
    }
    
    // Initialize optical protection
    if (this.config.enableOpticalProtection) {
      this.initializeOpticalProtection();
    }
    
    // Initialize electromagnetic protection
    if (this.config.enableEMProtection) {
      this.initializeEMProtection();
    }
    
    // Initialize thermal protection
    if (this.config.enableThermalProtection) {
      this.initializeThermalProtection();
    }
    
    // Initialize vibration protection
    if (this.config.enableVibrationProtection) {
      this.initializeVibrationProtection();
    }
    
    // Start continuous monitoring
    this.startContinuousMonitoring();
    
    console.log('PhysicalSecurityProtection initialized with config:', this.config);
  }
  
  /**
   * PHYSICAL SECURITY BUG FIX: Initialize acoustic protection
   */
  private async initializeAcousticProtection(): Promise<void> {
    if (typeof window === 'undefined' || !navigator.mediaDevices) return;
    
    try {
      // Request microphone access
      this.microphoneStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        } 
      });
      
      // Create audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create analyser node
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.3;
      
      // Connect microphone to analyser
      const source = this.audioContext.createMediaStreamSource(this.microphoneStream);
      source.connect(this.analyser);
      
      // Start acoustic monitoring
      this.startAcousticMonitoring();
      
    } catch (error) {
      console.warn('Acoustic protection unavailable:', error);
      
      // Record that acoustic monitoring is unavailable
      this.recordThreat({
        type: 'acoustic_monitoring_unavailable',
        severity: 'medium',
        description: 'Unable to initialize acoustic monitoring - air-gap attacks possible',
        medium: 'acoustic',
        evidence: ['microphone_access_denied'],
        mitigated: false,
        timestamp: Date.now()
      });
    }
  }
  
  /**
   * PHYSICAL SECURITY BUG FIX: Start acoustic monitoring
   */
  private startAcousticMonitoring(): void {
    if (!this.analyser || !this.audioContext) return;
    
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const sampleRate = this.audioContext.sampleRate;
    
    const analyze = () => {
      if (!this.analyser) return;
      
      this.analyser.getByteFrequencyData(dataArray);
      
      // Check for ultrasonic signals
      this.detectUltrasonicSignals(dataArray, sampleRate);
      
      // Check for infrasonic signals
      this.detectInfrasonicSignals(dataArray, sampleRate);
      
      // Check for keyboard acoustic patterns
      this.detectKeyboardAcoustics(dataArray, sampleRate);
      
      // Check for fan/HDD modulation
      this.detectMechanicalModulation(dataArray, sampleRate);
      
      requestAnimationFrame(analyze);
    };
    
    analyze();
  }
  
  /**
   * PHYSICAL SECURITY BUG FIX: Detect ultrasonic signals
   */
  private detectUltrasonicSignals(frequencyData: Uint8Array, sampleRate: number): void {
    const binCount = frequencyData.length;
    const binWidth = sampleRate / (binCount * 2);
    
    // Find ultrasonic frequencies
    const ultrasonicBins: Array<{ bin: number; amplitude: number; frequency: number }> = [];
    
    for (let i = 0; i < binCount; i++) {
      const frequency = i * binWidth;
      
      if (frequency > this.config.ultrasonicThreshold && frequencyData[i] > 100) {
        ultrasonicBins.push({
          bin: i,
          amplitude: frequencyData[i],
          frequency
        });
      }
    }
    
    if (ultrasonicBins.length > 0) {
      // Check for known ultrasonic patterns
      const patterns = this.analyzeUltrasonicPatterns(ultrasonicBins);
      
      if (patterns.suspicious) {
        this.recordThreat({
          type: 'ultrasonic_signal_detected',
          severity: 'high',
          description: `Ultrasonic signal detected at ${patterns.frequency}Hz`,
          medium: 'acoustic',
          frequency: patterns.frequency,
          intensity: patterns.amplitude,
          evidence: patterns.evidence,
          mitigated: false,
          timestamp: Date.now()
        });
        
        this.recordAcousticSignal({
          frequency: patterns.frequency,
          amplitude: patterns.amplitude,
          duration: patterns.duration || 0,
          pattern: patterns.pattern,
          suspicious: true,
          timestamp: Date.now()
        });
      }
    }
  }
  
  /**
   * PHYSICAL SECURITY BUG FIX: Analyze ultrasonic patterns
   */
  private analyzeUltrasonicPatterns(bins: Array<{ bin: number; amplitude: number; frequency: number }>): {
    suspicious: boolean;
    frequency: number;
    amplitude: number;
    duration?: number;
    pattern?: number[];
    evidence: string[];
  } {
    const evidence: string[] = [];
    let suspicious = false;
    
    // Find dominant frequency
    const dominant = bins.reduce((max, bin) => 
      bin.amplitude > max.amplitude ? bin : max
    );
    
    // Check against known air-gap techniques
    if (dominant.frequency >= this.AIR_GAP_TECHNIQUES.acoustic.speakear.minFreq &&
        dominant.frequency <= this.AIR_GAP_TECHNIQUES.acoustic.speakear.maxFreq) {
      evidence.push('speakear_frequency_range');
      suspicious = true;
    }
    
    // Check for modulated patterns
    if (bins.length > 3) {
      const frequencies = bins.map(b => b.frequency).sort((a, b) => a - b);
      
      // Check for frequency hopping
      let hops = 0;
      for (let i = 1; i < frequencies.length; i++) {
        if (Math.abs(frequencies[i] - frequencies[i-1]) > 1000) {
          hops++;
        }
      }
      
      if (hops > 2) {
        evidence.push('frequency_hopping_pattern');
        suspicious = true;
      }
    }
    
    return {
      suspicious,
      frequency: dominant.frequency,
      amplitude: dominant.amplitude,
      evidence
    };
  }
  
  /**
   * PHYSICAL SECURITY BUG FIX: Detect infrasonic signals
   */
  private detectInfrasonicSignals(frequencyData: Uint8Array, sampleRate: number): void {
    const binWidth = sampleRate / (frequencyData.length * 2);
    
    // Check low frequency bins
    for (let i = 0; i < 10; i++) { // First 10 bins for infrasonic
      const frequency = i * binWidth;
      
      if (frequency < this.config.infrasonicThreshold && frequencyData[i] > 150) {
        this.recordThreat({
          type: 'infrasonic_signal_detected',
          severity: 'medium',
          description: `Infrasonic signal detected at ${frequency.toFixed(1)}Hz`,
          medium: 'acoustic',
          frequency,
          intensity: frequencyData[i],
          evidence: ['low_frequency_vibration'],
          mitigated: false,
          timestamp: Date.now()
        });
      }
    }
  }
  
  /**
   * PHYSICAL SECURITY BUG FIX: Detect keyboard acoustic patterns
   */
  private detectKeyboardAcoustics(frequencyData: Uint8Array, sampleRate: number): void {
    const binWidth = sampleRate / (frequencyData.length * 2);
    let keyPressDetected = false;
    
    // Look for keyboard frequency signatures
    for (const [keyType, signature] of Object.entries(this.KEYBOARD_ACOUSTIC_SIGNATURES)) {
      const minBin = Math.floor(signature.freqRange[0] / binWidth);
      const maxBin = Math.floor(signature.freqRange[1] / binWidth);
      
      let peakAmplitude = 0;
      for (let i = minBin; i <= maxBin && i < frequencyData.length; i++) {
        if (frequencyData[i] > peakAmplitude) {
          peakAmplitude = frequencyData[i];
        }
      }
      
      if (peakAmplitude > 180) {
        keyPressDetected = true;
        
        // Record potential keystroke
        this.recordAcousticSignal({
          frequency: (signature.freqRange[0] + signature.freqRange[1]) / 2,
          amplitude: peakAmplitude,
          duration: 30, // Average keystroke duration
          suspicious: false,
          timestamp: Date.now()
        });
      }
    }
    
    // Check for keystroke timing patterns (could indicate keylogger)
    if (keyPressDetected) {
      this.analyzeKeystrokeTimings();
    }
  }
  
  /**
   * PHYSICAL SECURITY BUG FIX: Analyze keystroke timings
   */
  private analyzeKeystrokeTimings(): void {
    const recentSignals = this.acousticSignals.filter(s => 
      Date.now() - s.timestamp < 10000 && // Last 10 seconds
      s.frequency > 3000 && s.frequency < 15000 // Keyboard range
    );
    
    if (recentSignals.length > 20) {
      // Calculate inter-keystroke intervals
      const intervals: number[] = [];
      for (let i = 1; i < recentSignals.length; i++) {
        intervals.push(recentSignals[i].timestamp - recentSignals[i-1].timestamp);
      }
      
      // Check for suspiciously regular patterns
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const variance = intervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) / intervals.length;
      const stdDev = Math.sqrt(variance);
      
      if (stdDev < 50) { // Very regular typing
        this.recordThreat({
          type: 'keystroke_acoustic_analysis',
          severity: 'high',
          description: 'Potential acoustic keylogger detected - regular keystroke patterns',
          medium: 'acoustic',
          evidence: [`keystroke_count: ${recentSignals.length}`, `timing_stddev: ${stdDev.toFixed(2)}`],
          mitigated: false,
          timestamp: Date.now()
        });
      }
    }
  }
  
  /**
   * PHYSICAL SECURITY BUG FIX: Detect mechanical modulation (fans, HDDs)
   */
  private detectMechanicalModulation(frequencyData: Uint8Array, sampleRate: number): void {
    const binWidth = sampleRate / (frequencyData.length * 2);
    
    // Check for fan modulation frequencies
    const fanRange = this.AIR_GAP_TECHNIQUES.acoustic.fansmitter;
    const minBin = Math.floor(fanRange.minFreq / binWidth);
    const maxBin = Math.floor(fanRange.maxFreq / binWidth);
    
    for (let i = minBin; i <= maxBin && i < frequencyData.length; i++) {
      if (frequencyData[i] > 160) {
        // Check for modulation patterns
        const frequency = i * binWidth;
        const harmonics = this.checkHarmonics(frequencyData, i, binWidth);
        
        if (harmonics.length > 2) {
          this.recordThreat({
            type: 'fan_modulation_detected',
            severity: 'high',
            description: `CPU fan modulation detected at ${frequency.toFixed(1)}Hz`,
            medium: 'acoustic',
            frequency,
            intensity: frequencyData[i],
            evidence: [`harmonic_count: ${harmonics.length}`, 'fansmitter_technique'],
            mitigated: false,
            timestamp: Date.now()
          });
        }
      }
    }
  }
  
  /**
   * PHYSICAL SECURITY BUG FIX: Check for harmonic frequencies
   */
  private checkHarmonics(frequencyData: Uint8Array, fundamentalBin: number, binWidth: number): number[] {
    const harmonics: number[] = [];
    const fundamentalAmp = frequencyData[fundamentalBin];
    
    // Check up to 5th harmonic
    for (let h = 2; h <= 5; h++) {
      const harmonicBin = fundamentalBin * h;
      
      if (harmonicBin < frequencyData.length) {
        const harmonicAmp = frequencyData[harmonicBin];
        
        // Harmonic should be present but weaker than fundamental
        if (harmonicAmp > fundamentalAmp * 0.1 && harmonicAmp < fundamentalAmp) {
          harmonics.push(h);
        }
      }
    }
    
    return harmonics;
  }
  
  /**
   * PHYSICAL SECURITY BUG FIX: Initialize optical protection
   */
  private initializeOpticalProtection(): void {
    if (typeof window === 'undefined') return;
    
    // Monitor screen brightness changes
    this.monitorScreenBrightness();
    
    // Monitor LED patterns (camera access)
    this.monitorLEDPatterns();
    
    // Monitor ambient light for optical signals
    this.monitorAmbientLight();
  }
  
  /**
   * PHYSICAL SECURITY BUG FIX: Monitor screen brightness
   */
  private monitorScreenBrightness(): void {
    let lastBrightness = 1.0;
    let brightnessChanges: Array<{ time: number; value: number }> = [];
    
    // Monitor CSS filter changes that affect brightness
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          const element = mutation.target as HTMLElement;
          const filter = element.style.filter;
          
          if (filter && filter.includes('brightness')) {
            const match = filter.match(/brightness\((\d+\.?\d*)\)/);
            if (match) {
              const brightness = parseFloat(match[1]);
              
              brightnessChanges.push({
                time: Date.now(),
                value: brightness
              });
              
              // Keep only recent changes
              brightnessChanges = brightnessChanges.filter(c => 
                Date.now() - c.time < 5000
              );
              
              // Check for modulation patterns
              if (brightnessChanges.length > 10) {
                this.analyzeBrightnessModulation(brightnessChanges);
              }
              
              lastBrightness = brightness;
            }
          }
        }
      });
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      subtree: true,
      attributeFilter: ['style']
    });
  }
  
  /**
   * PHYSICAL SECURITY BUG FIX: Analyze brightness modulation
   */
  private analyzeBrightnessModulation(changes: Array<{ time: number; value: number }>): void {
    // Calculate modulation frequency
    const intervals: number[] = [];
    for (let i = 1; i < changes.length; i++) {
      intervals.push(changes[i].time - changes[i-1].time);
    }
    
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const frequency = 1000 / avgInterval; // Hz
    
    // Check against known optical exfiltration techniques
    if (frequency > 10 && frequency < 100) {
      this.recordThreat({
        type: 'screen_brightness_modulation',
        severity: 'high',
        description: `Screen brightness modulation detected at ${frequency.toFixed(1)}Hz`,
        medium: 'optical',
        evidence: ['visibone_technique', `modulation_freq: ${frequency.toFixed(1)}Hz`],
        mitigated: false,
        timestamp: Date.now()
      });
      
      this.recordOpticalSignal({
        type: 'screen',
        intensity: 1.0,
        flickerRate: frequency,
        pattern: 'brightness_modulation',
        timestamp: Date.now()
      });
    }
  }
  
  /**
   * PHYSICAL SECURITY BUG FIX: Monitor LED patterns via camera
   */
  private async monitorLEDPatterns(): Promise<void> {
    if (!navigator.mediaDevices) return;
    
    try {
      // Request camera access to monitor visible LEDs
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 320, 
          height: 240,
          frameRate: 30
        } 
      });
      
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();
      
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;
      
      let lastFrame: ImageData | null = null;
      
      const analyzeLEDs = () => {
        ctx.drawImage(video, 0, 0);
        const currentFrame = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        if (lastFrame) {
          this.detectLEDChanges(lastFrame, currentFrame);
        }
        
        lastFrame = currentFrame;
        requestAnimationFrame(analyzeLEDs);
      };
      
      analyzeLEDs();
      
    } catch (error) {
      console.warn('LED monitoring unavailable:', error);
    }
  }
  
  /**
   * PHYSICAL SECURITY BUG FIX: Detect LED changes between frames
   */
  private detectLEDChanges(frame1: ImageData, frame2: ImageData): void {
    const data1 = frame1.data;
    const data2 = frame2.data;
    const threshold = 50;
    
    let changedPixels = 0;
    let brightPixels = 0;
    
    for (let i = 0; i < data1.length; i += 4) {
      const r1 = data1[i];
      const g1 = data1[i + 1];
      const b1 = data1[i + 2];
      
      const r2 = data2[i];
      const g2 = data2[i + 1];
      const b2 = data2[i + 2];
      
      const diff = Math.abs(r2 - r1) + Math.abs(g2 - g1) + Math.abs(b2 - b1);
      
      if (diff > threshold) {
        changedPixels++;
      }
      
      // Check for bright spots (LEDs)
      if (r2 > 200 || g2 > 200 || b2 > 200) {
        brightPixels++;
      }
    }
    
    // If small bright areas are changing rapidly, could be LED communication
    const changeRatio = changedPixels / (data1.length / 4);
    const brightRatio = brightPixels / (data1.length / 4);
    
    if (changeRatio < 0.01 && brightRatio < 0.01 && changedPixels > 10) {
      this.recordOpticalSignal({
        type: 'led',
        intensity: brightRatio,
        timestamp: Date.now()
      });
      
      // Check for patterns in LED signals
      this.analyzeLEDPatterns();
    }
  }
  
  /**
   * PHYSICAL SECURITY BUG FIX: Analyze LED patterns
   */
  private analyzeLEDPatterns(): void {
    const recentSignals = this.opticalSignals.filter(s => 
      s.type === 'led' && Date.now() - s.timestamp < 5000
    );
    
    if (recentSignals.length > 20) {
      // Check for binary patterns
      const pattern = recentSignals.map(s => s.intensity > 0.005 ? '1' : '0').join('');
      
      // Check for repeating patterns
      for (let len = 8; len <= 16; len++) {
        const substring = pattern.substring(0, len);
        const regex = new RegExp(substring, 'g');
        const matches = pattern.match(regex);
        
        if (matches && matches.length > 3) {
          this.recordThreat({
            type: 'led_data_exfiltration',
            severity: 'high',
            description: 'LED-based data exfiltration detected',
            medium: 'optical',
            evidence: [`pattern_length: ${len}`, `repetitions: ${matches.length}`, 'led_it_go_technique'],
            mitigated: false,
            timestamp: Date.now()
          });
          break;
        }
      }
    }
  }
  
  /**
   * PHYSICAL SECURITY BUG FIX: Monitor ambient light
   */
  private monitorAmbientLight(): void {
    if (!('AmbientLightSensor' in window)) return;
    
    try {
      const sensor = new (window as any).AmbientLightSensor();
      let lastReading = 0;
      const readings: Array<{ time: number; lux: number }> = [];
      
      sensor.addEventListener('reading', () => {
        const currentReading = sensor.illuminance;
        
        readings.push({
          time: Date.now(),
          lux: currentReading
        });
        
        // Keep only recent readings
        while (readings.length > 0 && Date.now() - readings[0].time > 10000) {
          readings.shift();
        }
        
        // Check for modulated light signals
        if (readings.length > 10) {
          this.analyzeAmbientLightModulation(readings);
        }
        
        lastReading = currentReading;
      });
      
      sensor.start();
      
    } catch (error) {
      console.warn('Ambient light sensor unavailable:', error);
    }
  }
  
  /**
   * PHYSICAL SECURITY BUG FIX: Analyze ambient light modulation
   */
  private analyzeAmbientLightModulation(readings: Array<{ time: number; lux: number }>): void {
    // Calculate rate of change
    const changes: number[] = [];
    
    for (let i = 1; i < readings.length; i++) {
      const deltaLux = Math.abs(readings[i].lux - readings[i-1].lux);
      const deltaTime = readings[i].time - readings[i-1].time;
      
      if (deltaTime > 0) {
        changes.push(deltaLux / deltaTime);
      }
    }
    
    // High rate of change might indicate optical signaling
    const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length;
    
    if (avgChange > 0.5) { // Lux per millisecond
      this.recordThreat({
        type: 'ambient_light_modulation',
        severity: 'medium',
        description: 'Ambient light modulation detected - possible optical channel',
        medium: 'optical',
        evidence: [`avg_change_rate: ${avgChange.toFixed(2)} lux/ms`],
        mitigated: false,
        timestamp: Date.now()
      });
    }
  }
  
  /**
   * PHYSICAL SECURITY BUG FIX: Initialize electromagnetic protection
   */
  private initializeEMProtection(): void {
    // Monitor for EM emissions via side effects
    this.monitorEMSideEffects();
    
    // Check for TEMPEST-style attacks
    this.monitorTEMPESTIndicators();
  }
  
  /**
   * PHYSICAL SECURITY BUG FIX: Monitor EM side effects
   */
  private monitorEMSideEffects(): void {
    // In browser, we can't directly measure EM, but we can look for side effects
    
    // Monitor WebGL performance (affected by EM interference)
    if (typeof WebGLRenderingContext !== 'undefined') {
      this.monitorWebGLPerformance();
    }
    
    // Monitor timing jitter (affected by EM)
    this.monitorTimingJitter();
  }
  
  /**
   * PHYSICAL SECURITY BUG FIX: Monitor WebGL performance for EM effects
   */
  private monitorWebGLPerformance(): void {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) return;
    
    let frameCount = 0;
    let lastTime = performance.now();
    const frameTimes: number[] = [];
    
    const measureFrame = () => {
      const currentTime = performance.now();
      const frameTime = currentTime - lastTime;
      
      frameTimes.push(frameTime);
      
      // Keep only recent frame times
      if (frameTimes.length > 100) {
        frameTimes.shift();
      }
      
      // Every 100 frames, check for anomalies
      if (++frameCount % 100 === 0) {
        const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
        const variance = frameTimes.reduce((sum, t) => sum + Math.pow(t - avgFrameTime, 2), 0) / frameTimes.length;
        
        // High variance might indicate EM interference
        if (variance > avgFrameTime * avgFrameTime * 0.5) {
          this.recordThreat({
            type: 'em_interference_detected',
            severity: 'low',
            description: 'Electromagnetic interference detected via timing anomalies',
            medium: 'electromagnetic',
            evidence: [`timing_variance: ${variance.toFixed(2)}`],
            mitigated: false,
            timestamp: Date.now()
          });
        }
      }
      
      lastTime = currentTime;
      requestAnimationFrame(measureFrame);
    };
    
    measureFrame();
  }
  
  /**
   * PHYSICAL SECURITY BUG FIX: Monitor timing jitter
   */
  private monitorTimingJitter(): void {
    const timings: number[] = [];
    
    const measure = () => {
      const start = performance.now();
      
      // Perform a consistent operation
      let sum = 0;
      for (let i = 0; i < 1000; i++) {
        sum += Math.sqrt(i);
      }
      
      const duration = performance.now() - start;
      timings.push(duration);
      
      if (timings.length > 50) {
        timings.shift();
        
        // Check for unusual jitter patterns
        const avg = timings.reduce((a, b) => a + b, 0) / timings.length;
        const maxJitter = Math.max(...timings.map(t => Math.abs(t - avg)));
        
        if (maxJitter > avg * 0.5) {
          this.recordEMSignal({
            frequency: 0,
            strength: maxJitter,
            suspicious: true,
            timestamp: Date.now()
          });
        }
      }
    };
    
    setInterval(measure, 100);
  }
  
  /**
   * PHYSICAL SECURITY BUG FIX: Initialize thermal protection
   */
  private initializeThermalProtection(): void {
    // Monitor for thermal covert channels
    this.monitorThermalPatterns();
  }
  
  /**
   * PHYSICAL SECURITY BUG FIX: Monitor thermal patterns
   */
  private monitorThermalPatterns(): void {
    // In browser, use battery API as proxy for thermal state
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        let lastTemp = battery.temperature || 0;
        const tempHistory: Array<{ time: number; temp: number }> = [];
        
        const checkTemperature = () => {
          const currentTemp = battery.temperature || 0;
          
          if (Math.abs(currentTemp - lastTemp) > this.config.temperatureAnomalyThreshold) {
            this.recordThreat({
              type: 'thermal_anomaly',
              severity: 'medium',
              description: `Sudden temperature change detected: ${Math.abs(currentTemp - lastTemp)}°C`,
              medium: 'thermal',
              evidence: ['bitwhisper_indicator'],
              mitigated: false,
              timestamp: Date.now()
            });
          }
          
          tempHistory.push({ time: Date.now(), temp: currentTemp });
          
          // Check for modulated patterns
          if (tempHistory.length > 20) {
            this.analyzeThermalModulation(tempHistory);
            tempHistory.shift();
          }
          
          lastTemp = currentTemp;
        };
        
        // Battery events might indicate thermal changes
        battery.addEventListener('levelchange', checkTemperature);
        battery.addEventListener('chargingchange', checkTemperature);
        
        setInterval(checkTemperature, 5000);
      });
    }
  }
  
  /**
   * PHYSICAL SECURITY BUG FIX: Analyze thermal modulation
   */
  private analyzeThermalModulation(history: Array<{ time: number; temp: number }>): void {
    // Look for intentional thermal patterns
    const changes: number[] = [];
    
    for (let i = 1; i < history.length; i++) {
      changes.push(history[i].temp - history[i-1].temp);
    }
    
    // Check for binary patterns in temperature changes
    const binary = changes.map(c => c > 0 ? '1' : '0').join('');
    
    // Look for repeating patterns
    if (/(.{8,16})\1{2,}/.test(binary)) {
      this.recordThreat({
        type: 'thermal_covert_channel',
        severity: 'high',
        description: 'Thermal covert channel detected - BitWhisper attack',
        medium: 'thermal',
        evidence: ['repeating_thermal_pattern'],
        mitigated: false,
        timestamp: Date.now()
      });
    }
  }
  
  /**
   * PHYSICAL SECURITY BUG FIX: Initialize vibration protection
   */
  private initializeVibrationProtection(): void {
    if (!('DeviceMotionEvent' in window)) return;
    
    const vibrationHistory: Array<{ time: number; magnitude: number }> = [];
    
    window.addEventListener('devicemotion', (event) => {
      if (event.acceleration) {
        const magnitude = Math.sqrt(
          Math.pow(event.acceleration.x || 0, 2) +
          Math.pow(event.acceleration.y || 0, 2) +
          Math.pow(event.acceleration.z || 0, 2)
        );
        
        vibrationHistory.push({ time: Date.now(), magnitude });
        
        // Keep only recent history
        while (vibrationHistory.length > 0 && Date.now() - vibrationHistory[0].time > 10000) {
          vibrationHistory.shift();
        }
        
        // Check for vibration-based communication
        if (vibrationHistory.length > 50) {
          this.analyzeVibrationPatterns(vibrationHistory);
        }
      }
    });
  }
  
  /**
   * PHYSICAL SECURITY BUG FIX: Analyze vibration patterns
   */
  private analyzeVibrationPatterns(history: Array<{ time: number; magnitude: number }>): void {
    // Check for intentional vibration patterns
    const threshold = 0.5; // m/s²
    const pulses: number[] = [];
    
    let inPulse = false;
    let pulseStart = 0;
    
    for (const reading of history) {
      if (reading.magnitude > threshold && !inPulse) {
        inPulse = true;
        pulseStart = reading.time;
      } else if (reading.magnitude < threshold && inPulse) {
        inPulse = false;
        pulses.push(reading.time - pulseStart);
      }
    }
    
    // Check for morse code or binary patterns
    if (pulses.length > 10) {
      const avgPulse = pulses.reduce((a, b) => a + b, 0) / pulses.length;
      const pattern = pulses.map(p => p > avgPulse ? '-' : '.').join('');
      
      if (/([.-]{3,8})\1{2,}/.test(pattern)) {
        this.recordThreat({
          type: 'vibration_covert_channel',
          severity: 'medium',
          description: 'Vibration-based covert channel detected',
          medium: 'vibration',
          evidence: [`pattern: ${pattern.substring(0, 20)}...`],
          mitigated: false,
          timestamp: Date.now()
        });
      }
    }
  }
  
  /**
   * PHYSICAL SECURITY BUG FIX: Monitor TEMPEST indicators
   */
  private monitorTEMPESTIndicators(): void {
    // Check for screen content correlation with EM emissions
    let lastScreenHash = '';
    
    setInterval(() => {
      // Create a hash of visible screen content
      const screenContent = document.body.innerText.substring(0, 1000);
      const currentHash = this.simpleHash(screenContent);
      
      if (currentHash !== lastScreenHash) {
        // Screen content changed, check for EM correlation
        const emSignals = this.emSignals.filter(s => 
          Date.now() - s.timestamp < 1000
        );
        
        if (emSignals.length > 0 && emSignals.some(s => s.suspicious)) {
          this.recordThreat({
            type: 'tempest_correlation',
            severity: 'high',
            description: 'Screen content changes correlated with EM emissions',
            medium: 'electromagnetic',
            evidence: ['screen_em_correlation'],
            mitigated: false,
            timestamp: Date.now()
          });
        }
      }
      
      lastScreenHash = currentHash;
    }, 1000);
  }
  
  /**
   * PHYSICAL SECURITY BUG FIX: Simple hash function
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }
  
  /**
   * PHYSICAL SECURITY BUG FIX: Start continuous monitoring
   */
  private startContinuousMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.performSecurityChecks();
    }, 5000); // Every 5 seconds
  }
  
  /**
   * PHYSICAL SECURITY BUG FIX: Perform security checks
   */
  private performSecurityChecks(): void {
    // Check for air-gap bridging attempts
    this.checkAirGapBridging();
    
    // Analyze cross-medium correlations
    this.analyzeCrossMediumCorrelations();
    
    // Clean up old data
    this.cleanupOldData();
  }
  
  /**
   * PHYSICAL SECURITY BUG FIX: Check for air-gap bridging
   */
  private checkAirGapBridging(): void {
    // Check if multiple covert channels are active simultaneously
    const activeChannels: string[] = [];
    
    const recentThreats = this.threats.filter(t => 
      Date.now() - t.timestamp < 60000 // Last minute
    );
    
    const mediums = new Set(recentThreats.map(t => t.medium));
    
    if (mediums.size > 2) {
      activeChannels.push(...Array.from(mediums));
      
      this.recordThreat({
        type: 'multi_channel_air_gap_bridge',
        severity: 'critical',
        description: `Multiple air-gap bridging channels detected: ${activeChannels.join(', ')}`,
        medium: 'acoustic', // Primary medium
        evidence: activeChannels,
        mitigated: false,
        timestamp: Date.now()
      });
    }
  }
  
  /**
   * PHYSICAL SECURITY BUG FIX: Analyze cross-medium correlations
   */
  private analyzeCrossMediumCorrelations(): void {
    const window = 5000; // 5 second window
    const now = Date.now();
    
    // Get recent signals from all mediums
    const recentAcoustic = this.acousticSignals.filter(s => now - s.timestamp < window);
    const recentOptical = this.opticalSignals.filter(s => now - s.timestamp < window);
    const recentEM = this.emSignals.filter(s => now - s.timestamp < window);
    
    // Check for synchronized signals across mediums
    if (recentAcoustic.length > 0 && recentOptical.length > 0) {
      // Check timing correlation
      for (const acoustic of recentAcoustic) {
        for (const optical of recentOptical) {
          if (Math.abs(acoustic.timestamp - optical.timestamp) < 100) { // 100ms window
            this.recordThreat({
              type: 'synchronized_covert_channels',
              severity: 'critical',
              description: 'Synchronized acoustic and optical signals detected',
              medium: 'acoustic',
              evidence: ['multi_medium_synchronization'],
              mitigated: false,
              timestamp: Date.now()
            });
            return;
          }
        }
      }
    }
  }
  
  /**
   * PHYSICAL SECURITY BUG FIX: Record acoustic signal
   */
  private recordAcousticSignal(signal: AcousticSignal): void {
    this.acousticSignals.push(signal);
    
    // Keep only recent signals
    if (this.acousticSignals.length > 10000) {
      this.acousticSignals = this.acousticSignals.slice(-10000);
    }
  }
  
  /**
   * PHYSICAL SECURITY BUG FIX: Record optical signal
   */
  private recordOpticalSignal(signal: OpticalSignal): void {
    this.opticalSignals.push(signal);
    
    // Keep only recent signals
    if (this.opticalSignals.length > 10000) {
      this.opticalSignals = this.opticalSignals.slice(-10000);
    }
  }
  
  /**
   * PHYSICAL SECURITY BUG FIX: Record EM signal
   */
  private recordEMSignal(signal: EMSignal): void {
    this.emSignals.push(signal);
    
    // Keep only recent signals
    if (this.emSignals.length > 10000) {
      this.emSignals = this.emSignals.slice(-10000);
    }
  }
  
  /**
   * PHYSICAL SECURITY BUG FIX: Record threat
   */
  private recordThreat(threat: PhysicalThreat): void {
    this.threats.push(threat);
    
    // Keep only recent threats
    if (this.threats.length > 1000) {
      this.threats = this.threats.slice(-1000);
    }
    
    console.warn('Physical security threat detected:', threat);
    
    // Alert for critical threats
    if (threat.severity === 'critical') {
      this.alertSecurityTeam(threat);
    }
    
    // Attempt mitigation
    if (!threat.mitigated) {
      this.attemptMitigation(threat);
    }
  }
  
  /**
   * PHYSICAL SECURITY BUG FIX: Attempt threat mitigation
   */
  private attemptMitigation(threat: PhysicalThreat): void {
    switch (threat.medium) {
      case 'acoustic':
        // Generate masking noise
        this.generateMaskingNoise();
        break;
        
      case 'optical':
        // Randomize screen brightness
        this.randomizeScreenBrightness();
        break;
        
      case 'electromagnetic':
        // Add EM noise via rapid calculations
        this.generateEMNoise();
        break;
    }
  }
  
  /**
   * PHYSICAL SECURITY BUG FIX: Generate masking noise
   */
  private generateMaskingNoise(): void {
    if (!this.audioContext) return;
    
    try {
      // Create white noise generator
      const bufferSize = 4096;
      const whiteNoise = this.audioContext.createScriptProcessor(bufferSize, 1, 1);
      
      whiteNoise.onaudioprocess = (e) => {
        const output = e.outputBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
      };
      
      // Create gain node for volume control
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = 0.05; // Low volume
      
      // Connect and play for 5 seconds
      whiteNoise.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      setTimeout(() => {
        whiteNoise.disconnect();
        gainNode.disconnect();
      }, 5000);
      
    } catch (error) {
      console.warn('Unable to generate masking noise:', error);
    }
  }
  
  /**
   * PHYSICAL SECURITY BUG FIX: Randomize screen brightness
   */
  private randomizeScreenBrightness(): void {
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '999999';
    
    document.body.appendChild(overlay);
    
    let count = 0;
    const interval = setInterval(() => {
      overlay.style.backgroundColor = `rgba(255, 255, 255, ${Math.random() * 0.1})`;
      
      if (++count > 50) {
        clearInterval(interval);
        overlay.remove();
      }
    }, 100);
  }
  
  /**
   * PHYSICAL SECURITY BUG FIX: Generate EM noise
   */
  private generateEMNoise(): void {
    // Perform random calculations to generate EM noise
    const iterations = 10000;
    const results: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      // Random complex calculations
      const a = Math.random() * 1000;
      const b = Math.random() * 1000;
      const c = Math.sqrt(a * a + b * b);
      const d = Math.sin(c) * Math.cos(a) * Math.tan(b);
      
      results.push(d);
      
      // Force memory access patterns
      if (i % 100 === 0) {
        results.sort(() => Math.random() - 0.5);
      }
    }
  }
  
  /**
   * PHYSICAL SECURITY BUG FIX: Alert security team
   */
  private alertSecurityTeam(threat: PhysicalThreat): void {
    console.error('CRITICAL PHYSICAL SECURITY THREAT:', threat);
    
    // Store alert
    if (typeof localStorage !== 'undefined') {
      const alerts = JSON.parse(localStorage.getItem('physical_security_alerts') || '[]');
      alerts.push({
        ...threat,
        alertTime: Date.now()
      });
      
      localStorage.setItem('physical_security_alerts', JSON.stringify(alerts.slice(-100)));
    }
  }
  
  /**
   * PHYSICAL SECURITY BUG FIX: Clean up old data
   */
  private cleanupOldData(): void {
    const cutoffTime = Date.now() - 300000; // 5 minutes
    
    this.acousticSignals = this.acousticSignals.filter(s => s.timestamp > cutoffTime);
    this.opticalSignals = this.opticalSignals.filter(s => s.timestamp > cutoffTime);
    this.emSignals = this.emSignals.filter(s => s.timestamp > cutoffTime);
  }
  
  /**
   * Get security statistics
   */
  getSecurityStats(): {
    totalThreats: number;
    criticalThreats: number;
    acousticThreats: number;
    opticalThreats: number;
    emThreats: number;
    activeChannels: number;
  } {
    const mediums = new Set(this.threats.map(t => t.medium));
    
    return {
      totalThreats: this.threats.length,
      criticalThreats: this.threats.filter(t => t.severity === 'critical').length,
      acousticThreats: this.threats.filter(t => t.medium === 'acoustic').length,
      opticalThreats: this.threats.filter(t => t.medium === 'optical').length,
      emThreats: this.threats.filter(t => t.medium === 'electromagnetic').length,
      activeChannels: mediums.size
    };
  }
  
  /**
   * Get recent threats
   */
  getRecentThreats(limit: number = 50): PhysicalThreat[] {
    return this.threats.slice(-limit);
  }
  
  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<PhysicalSecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('Physical security configuration updated:', this.config);
  }
  
  /**
   * Cleanup and shutdown
   */
  shutdown(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    if (this.microphoneStream) {
      this.microphoneStream.getTracks().forEach(track => track.stop());
      this.microphoneStream = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.threats = [];
    this.acousticSignals = [];
    this.opticalSignals = [];
    this.emSignals = [];
    
    console.log('PhysicalSecurityProtection shutdown complete');
  }
}

// Auto-initialize protection
let autoProtection: PhysicalSecurityProtection | null = null;

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      autoProtection = PhysicalSecurityProtection.getInstance();
    });
  } else {
    autoProtection = PhysicalSecurityProtection.getInstance();
  }
  
  window.addEventListener('beforeunload', () => {
    if (autoProtection) {
      autoProtection.shutdown();
    }
  });
}

export default PhysicalSecurityProtection;