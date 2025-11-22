/**
 * Multimedia API - Complete VB6 Multimedia Implementation for Browser Environment
 * Provides Windows Multimedia (winmm), MCI, Video, Audio, and Image capabilities
 */

import { EventEmitter } from 'events';
import { COMObject, COM } from '../data/COMActiveXBridge';

/**
 * BROWSER FINGERPRINTING BUG FIX: Multimedia fingerprinting protection
 */
class MultimediaFingerprintingProtection {
  private static instance: MultimediaFingerprintingProtection;
  private audioContextNoise: Map<string, number> = new Map();
  
  static getInstance(): MultimediaFingerprintingProtection {
    if (!this.instance) {
      this.instance = new MultimediaFingerprintingProtection();
    }
    return this.instance;
  }
  
  /**
   * BROWSER FINGERPRINTING BUG FIX: Obfuscate audio timing to prevent audio fingerprinting
   */
  obfuscateAudioTiming(timeMs: number): number {
    // Quantize audio timing to 10ms intervals
    const quantized = Math.round(timeMs / 10) * 10;
    
    // Add session-consistent noise
    const sessionNoise = this.getSessionNoise('audio_timing');
    const noisyTime = quantized + (sessionNoise - 0.5) * 20; // ±10ms noise
    
    return Math.max(0, noisyTime);
  }
  
  /**
   * BROWSER FINGERPRINTING BUG FIX: Anonymize audio device capabilities
   */
  anonymizeAudioDeviceCaps(): { channels: number, sampleRate: number } {
    // Return standardized capabilities instead of real hardware specs
    const standardConfigs = [
      { channels: 2, sampleRate: 44100 },
      { channels: 2, sampleRate: 48000 },
      { channels: 1, sampleRate: 44100 }
    ];
    
    const sessionIndex = this.getSessionNoise('audio_caps') * standardConfigs.length;
    return standardConfigs[Math.floor(sessionIndex)];
  }
  
  /**
   * BROWSER FINGERPRINTING BUG FIX: Obfuscate video capabilities
   */
  obfuscateVideoCapabilities(width: number, height: number, frameRate: number): { width: number, height: number, frameRate: number } {
    // Quantize to standard resolutions and frame rates
    const standardResolutions = [
      { width: 640, height: 480 },
      { width: 1280, height: 720 },
      { width: 1920, height: 1080 }
    ];
    
    const standardFrameRates = [24, 30, 60];
    
    // Find closest standard resolution
    let closestRes = standardResolutions[0];
    let minDiff = Math.abs(width - closestRes.width) + Math.abs(height - closestRes.height);
    
    for (const res of standardResolutions) {
      const diff = Math.abs(width - res.width) + Math.abs(height - res.height);
      if (diff < minDiff) {
        minDiff = diff;
        closestRes = res;
      }
    }
    
    // Find closest standard frame rate
    let closestFrameRate = standardFrameRates[0];
    let minFrameDiff = Math.abs(frameRate - closestFrameRate);
    
    for (const rate of standardFrameRates) {
      const diff = Math.abs(frameRate - rate);
      if (diff < minFrameDiff) {
        minFrameDiff = diff;
        closestFrameRate = rate;
      }
    }
    
    return {
      width: closestRes.width,
      height: closestRes.height,
      frameRate: closestFrameRate
    };
  }
  
  /**
   * BROWSER FINGERPRINTING BUG FIX: Add noise to audio data
   */
  addAudioNoise(audioData: ArrayBuffer): ArrayBuffer {
    // Add minimal noise to audio data (imperceptible)
    const view = new Int16Array(audioData);
    const noiseCount = Math.max(1, Math.floor(view.length / 1000)); // 0.1% of samples
    
    for (let i = 0; i < noiseCount; i++) {
      const sampleIndex = Math.floor(this.getSessionNoise(`audio_${i}`) * view.length);
      if (sampleIndex < view.length) {
        // Add ±1 LSB noise (imperceptible)
        const noise = (this.getSessionNoise(`noise_${i}`) - 0.5) * 2;
        view[sampleIndex] = Math.max(-32768, Math.min(32767, view[sampleIndex] + noise));
      }
    }
    
    return audioData;
  }
  
  /**
   * BROWSER FINGERPRINTING BUG FIX: Get session-consistent noise
   */
  private getSessionNoise(key: string): number {
    if (!this.audioContextNoise.has(key)) {
      // Generate session-consistent pseudo-random noise
      let hash = 0;
      const sessionKey = key + (sessionStorage.getItem('vb6_multimedia_session') || 'multimedia_default');
      for (let i = 0; i < sessionKey.length; i++) {
        const char = sessionKey.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      this.audioContextNoise.set(key, Math.abs(hash % 1000) / 1000);
    }
    return this.audioContextNoise.get(key)!;
  }
}

// Multimedia Constants
export enum MMSYSERR {
  MMSYSERR_NOERROR = 0,
  MMSYSERR_ERROR = 1,
  MMSYSERR_BADDEVICEID = 2,
  MMSYSERR_NOTENABLED = 3,
  MMSYSERR_ALLOCATED = 4,
  MMSYSERR_INVALHANDLE = 5,
  MMSYSERR_NODRIVER = 6,
  MMSYSERR_NOMEM = 7,
  MMSYSERR_NOTSUPPORTED = 8,
  MMSYSERR_BADERRNUM = 9,
  MMSYSERR_INVALFLAG = 10,
  MMSYSERR_INVALPARAM = 11,
  MMSYSERR_HANDLEBUSY = 12,
  MMSYSERR_INVALIDALIAS = 13,
  MMSYSERR_BADDB = 14,
  MMSYSERR_KEYNOTFOUND = 15,
  MMSYSERR_READERROR = 16,
  MMSYSERR_WRITEERROR = 17,
  MMSYSERR_DELETEERROR = 18,
  MMSYSERR_VALNOTFOUND = 19,
  MMSYSERR_NODRIVERCB = 20
}

export enum WAVE_FORMAT {
  WAVE_FORMAT_PCM = 1,
  WAVE_FORMAT_ADPCM = 2,
  WAVE_FORMAT_IEEE_FLOAT = 3,
  WAVE_FORMAT_ALAW = 6,
  WAVE_FORMAT_MULAW = 7,
  WAVE_FORMAT_EXTENSIBLE = 0xFFFE
}

export enum MCI_COMMAND {
  MCI_OPEN = 0x0803,
  MCI_CLOSE = 0x0804,
  MCI_ESCAPE = 0x0805,
  MCI_PLAY = 0x0806,
  MCI_SEEK = 0x0807,
  MCI_STOP = 0x0808,
  MCI_PAUSE = 0x0809,
  MCI_INFO = 0x080A,
  MCI_GETDEVCAPS = 0x080B,
  MCI_SPIN = 0x080C,
  MCI_SET = 0x080D,
  MCI_STEP = 0x080E,
  MCI_RECORD = 0x080F,
  MCI_SYSINFO = 0x0810,
  MCI_BREAK = 0x0811,
  MCI_SAVE = 0x0813,
  MCI_STATUS = 0x0814,
  MCI_CUE = 0x0830,
  MCI_REALIZE = 0x0840,
  MCI_WINDOW = 0x0841,
  MCI_PUT = 0x0842,
  MCI_WHERE = 0x0843,
  MCI_FREEZE = 0x0844,
  MCI_UNFREEZE = 0x0845,
  MCI_LOAD = 0x0850,
  MCI_CUT = 0x0851,
  MCI_COPY = 0x0852,
  MCI_PASTE = 0x0853,
  MCI_UPDATE = 0x0854,
  MCI_RESUME = 0x0855,
  MCI_DELETE = 0x0856
}

export enum MCI_MODE {
  MCI_MODE_NOT_READY = 524,
  MCI_MODE_STOP = 525,
  MCI_MODE_PLAY = 526,
  MCI_MODE_RECORD = 527,
  MCI_MODE_SEEK = 528,
  MCI_MODE_PAUSE = 529,
  MCI_MODE_OPEN = 530
}

// Multimedia Structures
export interface WAVEFORMATEX {
  wFormatTag: number;
  nChannels: number;
  nSamplesPerSec: number;
  nAvgBytesPerSec: number;
  nBlockAlign: number;
  wBitsPerSample: number;
  cbSize: number;
}

export interface WAVEHDR {
  lpData: ArrayBuffer;
  dwBufferLength: number;
  dwBytesRecorded: number;
  dwUser: number;
  dwFlags: number;
  dwLoops: number;
  lpNext: WAVEHDR | null;
  reserved: number;
}

export interface WAVEINCAPS {
  wMid: number;
  wPid: number;
  vDriverVersion: number;
  szPname: string;
  dwFormats: number;
  wChannels: number;
  wReserved1: number;
}

export interface WAVEOUTCAPS {
  wMid: number;
  wPid: number;
  vDriverVersion: number;
  szPname: string;
  dwFormats: number;
  wChannels: number;
  wReserved1: number;
  dwSupport: number;
}

export interface MCI_OPEN_PARMS {
  dwCallback: number;
  wDeviceID: number;
  lpstrDeviceType: string;
  lpstrElementName: string;
  lpstrAlias: string;
}

export interface MCI_PLAY_PARMS {
  dwCallback: number;
  dwFrom: number;
  dwTo: number;
}

export interface MCI_STATUS_PARMS {
  dwCallback: number;
  dwReturn: number;
  dwItem: number;
  dwTrack: number;
}

// Wave Out Implementation
export class WaveOut extends EventEmitter {
  private _audioContext: AudioContext;
  private _deviceId: number = 0;
  private _format: WAVEFORMATEX;
  private _isOpen: boolean = false;
  private _isPaused: boolean = false;
  private _volume: number = 0xFFFF;
  private _pitch: number = 0x10000;
  private _playbackRate: number = 0x10000;
  private _headers: WAVEHDR[] = [];
  private _currentBuffer: AudioBufferSourceNode | null = null;
  private _gainNode: GainNode;

  constructor(deviceId: number = 0) {
    super();
    this._deviceId = deviceId;
    this._audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this._gainNode = this._audioContext.createGain();
    this._gainNode.connect(this._audioContext.destination);
    
    // BROWSER FINGERPRINTING BUG FIX: Use anonymized audio capabilities
    const protection = MultimediaFingerprintingProtection.getInstance();
    const anonymizedCaps = protection.anonymizeAudioDeviceCaps();
    
    this._format = {
      wFormatTag: WAVE_FORMAT.WAVE_FORMAT_PCM,
      nChannels: anonymizedCaps.channels,
      nSamplesPerSec: anonymizedCaps.sampleRate,
      nAvgBytesPerSec: anonymizedCaps.sampleRate * anonymizedCaps.channels * 2,
      nBlockAlign: anonymizedCaps.channels * 2,
      wBitsPerSample: 16,
      cbSize: 0
    };
  }

  waveOutOpen(format: WAVEFORMATEX, callback?: (msg: number, param1: number, param2: number) => void): number {
    try {
      this._format = format;
      this._isOpen = true;
      
      if (callback) {
        this.on('message', callback);
      }
      
      this.emit('message', { message: 0x3BB, instance: this, param1: 0, param2: 0 }); // WOM_OPEN
      return MMSYSERR.MMSYSERR_NOERROR;
    } catch (error) {
      return MMSYSERR.MMSYSERR_ERROR;
    }
  }

  waveOutClose(): number {
    try {
      this.waveOutReset();
      this._isOpen = false;
      this.emit('message', { message: 0x3BC, instance: this, param1: 0, param2: 0 }); // WOM_CLOSE
      return MMSYSERR.MMSYSERR_NOERROR;
    } catch (error) {
      return MMSYSERR.MMSYSERR_ERROR;
    }
  }

  waveOutPrepareHeader(header: WAVEHDR): number {
    try {
      header.dwFlags |= 0x2; // WHDR_PREPARED
      return MMSYSERR.MMSYSERR_NOERROR;
    } catch (error) {
      return MMSYSERR.MMSYSERR_ERROR;
    }
  }

  waveOutUnprepareHeader(header: WAVEHDR): number {
    try {
      header.dwFlags &= ~0x2; // Remove WHDR_PREPARED
      return MMSYSERR.MMSYSERR_ERROR;
    } catch (error) {
      return MMSYSERR.MMSYSERR_ERROR;
    }
  }

  waveOutWrite(header: WAVEHDR): number {
    try {
      if (!this._isOpen) return MMSYSERR.MMSYSERR_INVALHANDLE;
      
      header.dwFlags |= 0x1; // WHDR_INQUEUE
      this._headers.push(header);
      
      // BROWSER FINGERPRINTING BUG FIX: Add noise to audio data
      const protection = MultimediaFingerprintingProtection.getInstance();
      const noisyAudioData = protection.addAudioNoise(header.lpData.slice(0));
      
      // Convert wave data to AudioBuffer
      const audioBuffer = this._audioContext.createBuffer(
        this._format.nChannels,
        header.dwBufferLength / (this._format.wBitsPerSample / 8) / this._format.nChannels,
        this._format.nSamplesPerSec
      );
      
      // Convert raw audio data with fingerprinting protection
      const view = new Int16Array(noisyAudioData);
      for (let channel = 0; channel < this._format.nChannels; channel++) {
        const channelData = audioBuffer.getChannelData(channel);
        for (let frame = 0; frame < audioBuffer.length; frame++) {
          channelData[frame] = view[frame * this._format.nChannels + channel] / 32768;
        }
      }
      
      // Play the buffer
      this._currentBuffer = this._audioContext.createBufferSource();
      this._currentBuffer.buffer = audioBuffer;
      this._currentBuffer.connect(this._gainNode);
      
      this._currentBuffer.onended = () => {
        header.dwFlags &= ~0x1; // Remove WHDR_INQUEUE
        header.dwFlags |= 0x4; // WHDR_DONE
        this._headers = this._headers.filter(h => h !== header);
        this.emit('message', { message: 0x3BD, instance: this, param1: header, param2: 0 }); // WOM_DONE
      };
      
      this._currentBuffer.start();
      return MMSYSERR.MMSYSERR_NOERROR;
    } catch (error) {
      return MMSYSERR.MMSYSERR_ERROR;
    }
  }

  waveOutPause(): number {
    try {
      this._isPaused = true;
      if (this._currentBuffer) {
        this._audioContext.suspend();
      }
      return MMSYSERR.MMSYSERR_NOERROR;
    } catch (error) {
      return MMSYSERR.MMSYSERR_ERROR;
    }
  }

  waveOutRestart(): number {
    try {
      this._isPaused = false;
      if (this._currentBuffer) {
        this._audioContext.resume();
      }
      return MMSYSERR.MMSYSERR_NOERROR;
    } catch (error) {
      return MMSYSERR.MMSYSERR_ERROR;
    }
  }

  waveOutReset(): number {
    try {
      if (this._currentBuffer) {
        this._currentBuffer.stop();
        this._currentBuffer = null;
      }
      
      // Mark all headers as done
      this._headers.forEach(header => {
        header.dwFlags &= ~0x1; // Remove WHDR_INQUEUE
        header.dwFlags |= 0x4; // WHDR_DONE
        this.emit('message', { message: 0x3BD, instance: this, param1: header, param2: 0 }); // WOM_DONE
      });
      
      this._headers = [];
      return MMSYSERR.MMSYSERR_NOERROR;
    } catch (error) {
      return MMSYSERR.MMSYSERR_ERROR;
    }
  }

  waveOutSetVolume(volume: number): number {
    try {
      this._volume = volume;
      const leftVolume = (volume & 0xFFFF) / 0xFFFF;
      const rightVolume = ((volume >> 16) & 0xFFFF) / 0xFFFF;
      this._gainNode.gain.value = (leftVolume + rightVolume) / 2;
      return MMSYSERR.MMSYSERR_NOERROR;
    } catch (error) {
      return MMSYSERR.MMSYSERR_ERROR;
    }
  }

  waveOutGetVolume(): number {
    return this._volume;
  }

  waveOutSetPitch(pitch: number): number {
    this._pitch = pitch;
    return MMSYSERR.MMSYSERR_NOERROR;
  }

  waveOutGetPitch(): number {
    return this._pitch;
  }

  waveOutSetPlaybackRate(rate: number): number {
    this._playbackRate = rate;
    if (this._currentBuffer) {
      this._currentBuffer.playbackRate.value = rate / 0x10000;
    }
    return MMSYSERR.MMSYSERR_NOERROR;
  }

  waveOutGetPlaybackRate(): number {
    return this._playbackRate;
  }

  get DeviceId(): number { return this._deviceId; }
  get IsOpen(): boolean { return this._isOpen; }
  get IsPaused(): boolean { return this._isPaused; }
  get Format(): WAVEFORMATEX { return this._format; }
}

// Wave In Implementation
export class WaveIn extends EventEmitter {
  private _deviceId: number = 0;
  private _format: WAVEFORMATEX;
  private _isOpen: boolean = false;
  private _isRecording: boolean = false;
  private _mediaRecorder: MediaRecorder | null = null;
  private _stream: MediaStream | null = null;
  private _headers: WAVEHDR[] = [];
  private _recordedChunks: Blob[] = [];

  constructor(deviceId: number = 0) {
    super();
    this._deviceId = deviceId;
    
    this._format = {
      wFormatTag: WAVE_FORMAT.WAVE_FORMAT_PCM,
      nChannels: 1,
      nSamplesPerSec: 44100,
      nAvgBytesPerSec: 88200,
      nBlockAlign: 2,
      wBitsPerSample: 16,
      cbSize: 0
    };
  }

  async waveInOpen(format: WAVEFORMATEX, callback?: (msg: number, param1: number, param2: number) => void): Promise<number> {
    try {
      this._format = format;
      
      // Request microphone access
      this._stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: format.nChannels,
          sampleRate: format.nSamplesPerSec,
          sampleSize: format.wBitsPerSample
        }
      });
      
      this._isOpen = true;
      
      if (callback) {
        this.on('message', callback);
      }
      
      this.emit('message', { message: 0x3BE, instance: this, param1: 0, param2: 0 }); // WIM_OPEN
      return MMSYSERR.MMSYSERR_NOERROR;
    } catch (error) {
      return MMSYSERR.MMSYSERR_ERROR;
    }
  }

  waveInClose(): number {
    try {
      this.waveInStop();
      this.waveInReset();
      
      if (this._stream) {
        this._stream.getTracks().forEach(track => track.stop());
        this._stream = null;
      }
      
      this._isOpen = false;
      this.emit('message', { message: 0x3BF, instance: this, param1: 0, param2: 0 }); // WIM_CLOSE
      return MMSYSERR.MMSYSERR_NOERROR;
    } catch (error) {
      return MMSYSERR.MMSYSERR_ERROR;
    }
  }

  waveInPrepareHeader(header: WAVEHDR): number {
    try {
      header.dwFlags |= 0x2; // WHDR_PREPARED
      header.dwBytesRecorded = 0;
      return MMSYSERR.MMSYSERR_NOERROR;
    } catch (error) {
      return MMSYSERR.MMSYSERR_ERROR;
    }
  }

  waveInUnprepareHeader(header: WAVEHDR): number {
    try {
      header.dwFlags &= ~0x2; // Remove WHDR_PREPARED
      return MMSYSERR.MMSYSERR_NOERROR;
    } catch (error) {
      return MMSYSERR.MMSYSERR_ERROR;
    }
  }

  waveInAddBuffer(header: WAVEHDR): number {
    try {
      if (!this._isOpen) return MMSYSERR.MMSYSERR_INVALHANDLE;
      
      header.dwFlags |= 0x1; // WHDR_INQUEUE
      this._headers.push(header);
      
      return MMSYSERR.MMSYSERR_NOERROR;
    } catch (error) {
      return MMSYSERR.MMSYSERR_ERROR;
    }
  }

  waveInStart(): number {
    try {
      if (!this._isOpen || !this._stream) return MMSYSERR.MMSYSERR_INVALHANDLE;
      
      this._isRecording = true;
      this._recordedChunks = [];
      
      this._mediaRecorder = new MediaRecorder(this._stream);
      
      this._mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this._recordedChunks.push(event.data);
          
          // Process available headers
          if (this._headers.length > 0) {
            const header = this._headers.shift()!;
            
            // Convert blob to ArrayBuffer (simplified)
            event.data.arrayBuffer().then(buffer => {
              header.lpData = buffer;
              header.dwBytesRecorded = buffer.byteLength;
              header.dwFlags &= ~0x1; // Remove WHDR_INQUEUE
              header.dwFlags |= 0x4; // WHDR_DONE
              
              this.emit('message', { message: 0x3C0, instance: this, param1: header, param2: 0 }); // WIM_DATA
            });
          }
        }
      };
      
      this._mediaRecorder.start(100); // Capture in 100ms chunks
      return MMSYSERR.MMSYSERR_NOERROR;
    } catch (error) {
      return MMSYSERR.MMSYSERR_ERROR;
    }
  }

  waveInStop(): number {
    try {
      this._isRecording = false;
      
      if (this._mediaRecorder && this._mediaRecorder.state !== 'inactive') {
        this._mediaRecorder.stop();
      }
      
      return MMSYSERR.MMSYSERR_NOERROR;
    } catch (error) {
      return MMSYSERR.MMSYSERR_ERROR;
    }
  }

  waveInReset(): number {
    try {
      this.waveInStop();
      
      // Mark all headers as done
      this._headers.forEach(header => {
        header.dwFlags &= ~0x1; // Remove WHDR_INQUEUE
        header.dwFlags |= 0x4; // WHDR_DONE
        this.emit('message', { message: 0x3C0, instance: this, param1: header, param2: 0 }); // WIM_DATA
      });
      
      this._headers = [];
      this._recordedChunks = [];
      return MMSYSERR.MMSYSERR_NOERROR;
    } catch (error) {
      return MMSYSERR.MMSYSERR_ERROR;
    }
  }

  get DeviceId(): number { return this._deviceId; }
  get IsOpen(): boolean { return this._isOpen; }
  get IsRecording(): boolean { return this._isRecording; }
  get Format(): WAVEFORMATEX { return this._format; }
  get RecordedData(): Blob[] { return this._recordedChunks; }
}

// MCI Device Implementation
export class MCIDevice extends EventEmitter {
  private _deviceId: number = 0;
  private _deviceType: string = '';
  private _elementName: string = '';
  private _alias: string = '';
  private _mode: MCI_MODE = MCI_MODE.MCI_MODE_NOT_READY;
  private _position: number = 0;
  private _length: number = 0;
  private _timeFormat: string = 'milliseconds';
  private _mediaElement: HTMLVideoElement | HTMLAudioElement | null = null;
  private _isOpen: boolean = false;
  
  // Event handlers for cleanup
  private _loadedMetadataHandler: (() => void) | null = null;
  private _endedHandler: (() => void) | null = null;
  private _errorHandler: ((error: Event) => void) | null = null;
  private _timeupdateHandler: (() => void) | null = null;

  constructor() {
    super();
  }

  mciOpen(params: MCI_OPEN_PARMS): number {
    try {
      this._deviceId = params.wDeviceID;
      this._deviceType = params.lpstrDeviceType || '';
      this._elementName = params.lpstrElementName || '';
      this._alias = params.lpstrAlias || '';
      
      // Create appropriate media element
      if (this._deviceType.toLowerCase().includes('waveaudio') || 
          this._elementName.toLowerCase().match(/\.(wav|mp3|ogg|m4a)$/)) {
        this._mediaElement = document.createElement('audio');
      } else if (this._deviceType.toLowerCase().includes('avivideo') ||
                 this._elementName.toLowerCase().match(/\.(avi|mp4|mov|wmv)$/)) {
        this._mediaElement = document.createElement('video');
      } else {
        this._mediaElement = document.createElement('audio'); // Default to audio
      }
      
      if (this._elementName) {
        this._mediaElement.src = this._elementName;
      }
      
      this.setupMediaElementEvents();
      this._isOpen = true;
      this._mode = MCI_MODE.MCI_MODE_OPEN;
      
      return MMSYSERR.MMSYSERR_NOERROR;
    } catch (error) {
      return MMSYSERR.MMSYSERR_ERROR;
    }
  }

  mciClose(): number {
    try {
      if (this._mediaElement) {
        this._mediaElement.pause();
        
        // Remove event listeners to prevent memory leaks
        this.removeMediaElementEvents();
        
        this._mediaElement.src = '';
        this._mediaElement = null;
      }
      
      this._isOpen = false;
      this._mode = MCI_MODE.MCI_MODE_NOT_READY;
      
      return MMSYSERR.MMSYSERR_NOERROR;
    } catch (error) {
      return MMSYSERR.MMSYSERR_ERROR;
    }
  }

  mciPlay(params?: MCI_PLAY_PARMS): number {
    try {
      if (!this._isOpen || !this._mediaElement) return MMSYSERR.MMSYSERR_INVALHANDLE;
      
      if (params) {
        if (params.dwFrom > 0) {
          this._mediaElement.currentTime = params.dwFrom / 1000;
        }
        
        if (params.dwTo > 0) {
          // Set up event to stop at specified time
          const stopTime = params.dwTo / 1000;
          const checkTime = () => {
            if (this._mediaElement && this._mediaElement.currentTime >= stopTime) {
              this._mediaElement.pause();
              this._mode = MCI_MODE.MCI_MODE_STOP;
            }
          };
          this._mediaElement.addEventListener('timeupdate', checkTime);
        }
      }
      
      this._mediaElement.play().then(() => {
        this._mode = MCI_MODE.MCI_MODE_PLAY;
        this.emit('notify', { command: 'play', deviceId: this._deviceId });
      }).catch(error => {
        console.warn('MCI Play failed:', error);
      });
      
      return MMSYSERR.MMSYSERR_NOERROR;
    } catch (error) {
      return MMSYSERR.MMSYSERR_ERROR;
    }
  }

  mciStop(): number {
    try {
      if (!this._isOpen || !this._mediaElement) return MMSYSERR.MMSYSERR_INVALHANDLE;
      
      this._mediaElement.pause();
      this._mediaElement.currentTime = 0;
      this._mode = MCI_MODE.MCI_MODE_STOP;
      
      this.emit('notify', { command: 'stop', deviceId: this._deviceId });
      return MMSYSERR.MMSYSERR_NOERROR;
    } catch (error) {
      return MMSYSERR.MMSYSERR_ERROR;
    }
  }

  mciPause(): number {
    try {
      if (!this._isOpen || !this._mediaElement) return MMSYSERR.MMSYSERR_INVALHANDLE;
      
      this._mediaElement.pause();
      this._mode = MCI_MODE.MCI_MODE_PAUSE;
      
      this.emit('notify', { command: 'pause', deviceId: this._deviceId });
      return MMSYSERR.MMSYSERR_NOERROR;
    } catch (error) {
      return MMSYSERR.MMSYSERR_ERROR;
    }
  }

  mciResume(): number {
    try {
      if (!this._isOpen || !this._mediaElement) return MMSYSERR.MMSYSERR_INVALHANDLE;
      
      this._mediaElement.play().then(() => {
        this._mode = MCI_MODE.MCI_MODE_PLAY;
        this.emit('notify', { command: 'resume', deviceId: this._deviceId });
      });
      
      return MMSYSERR.MMSYSERR_NOERROR;
    } catch (error) {
      return MMSYSERR.MMSYSERR_ERROR;
    }
  }

  mciSeek(position: number): number {
    try {
      if (!this._isOpen || !this._mediaElement) return MMSYSERR.MMSYSERR_INVALHANDLE;
      
      this._mediaElement.currentTime = position / 1000;
      this._mode = MCI_MODE.MCI_MODE_SEEK;
      
      return MMSYSERR.MMSYSERR_NOERROR;
    } catch (error) {
      return MMSYSERR.MMSYSERR_ERROR;
    }
  }

  mciStatus(params: MCI_STATUS_PARMS): number {
    try {
      if (!this._isOpen) return MMSYSERR.MMSYSERR_INVALHANDLE;
      
      switch (params.dwItem) {
        case 1: // MCI_STATUS_MODE
          params.dwReturn = this._mode;
          break;
        case 2: // MCI_STATUS_POSITION
          params.dwReturn = this._mediaElement ? Math.round(this._mediaElement.currentTime * 1000) : 0;
          break;
        case 3: // MCI_STATUS_LENGTH
          params.dwReturn = this._mediaElement && isFinite(this._mediaElement.duration) ? 
                           Math.round(this._mediaElement.duration * 1000) : 0;
          break;
        case 4: // MCI_STATUS_READY
          params.dwReturn = this._mediaElement ? (this._mediaElement.readyState >= 2 ? 1 : 0) : 0;
          break;
        case 5: // MCI_STATUS_TIME_FORMAT
          params.dwReturn = 0; // milliseconds
          break;
        default:
          params.dwReturn = 0;
      }
      
      return MMSYSERR.MMSYSERR_NOERROR;
    } catch (error) {
      return MMSYSERR.MMSYSERR_ERROR;
    }
  }

  mciSet(command: string, value: any): number {
    try {
      if (!this._isOpen) return MMSYSERR.MMSYSERR_INVALHANDLE;
      
      switch (command.toLowerCase()) {
        case 'time format':
          this._timeFormat = value;
          break;
        case 'video':
          if (this._mediaElement instanceof HTMLVideoElement) {
            this._mediaElement.style.display = value === 'on' ? 'block' : 'none';
          }
          break;
        case 'audio':
          if (this._mediaElement) {
            this._mediaElement.muted = value === 'off';
          }
          break;
        case 'door':
          // CD-ROM door control (not applicable in browser)
          break;
      }
      
      return MMSYSERR.MMSYSERR_NOERROR;
    } catch (error) {
      return MMSYSERR.MMSYSERR_ERROR;
    }
  }

  mciInfo(infoType: string): string {
    switch (infoType.toLowerCase()) {
      case 'product':
        return 'Browser Multimedia Player';
      case 'file':
        return this._elementName;
      case 'name':
        return this._alias || this._deviceType;
      default:
        return '';
    }
  }

  private setupMediaElementEvents(): void {
    if (!this._mediaElement) return;
    
    // Create event handlers
    this._loadedMetadataHandler = () => {
      this._length = this._mediaElement!.duration * 1000;
      this.emit('notify', { command: 'ready', deviceId: this._deviceId });
    };
    
    this._endedHandler = () => {
      this._mode = MCI_MODE.MCI_MODE_STOP;
      this.emit('notify', { command: 'stop', deviceId: this._deviceId });
    };
    
    this._errorHandler = (error: Event) => {
      this.emit('error', { error, deviceId: this._deviceId });
    };
    
    this._timeupdateHandler = () => {
      this._position = this._mediaElement!.currentTime * 1000;
    };
    
    // Add event listeners
    this._mediaElement.addEventListener('loadedmetadata', this._loadedMetadataHandler);
    this._mediaElement.addEventListener('ended', this._endedHandler);
    this._mediaElement.addEventListener('error', this._errorHandler);
    this._mediaElement.addEventListener('timeupdate', this._timeupdateHandler);
  }
  
  private removeMediaElementEvents(): void {
    if (!this._mediaElement) return;
    
    // Remove event listeners
    if (this._loadedMetadataHandler) {
      this._mediaElement.removeEventListener('loadedmetadata', this._loadedMetadataHandler);
      this._loadedMetadataHandler = null;
    }
    if (this._endedHandler) {
      this._mediaElement.removeEventListener('ended', this._endedHandler);
      this._endedHandler = null;
    }
    if (this._errorHandler) {
      this._mediaElement.removeEventListener('error', this._errorHandler);
      this._errorHandler = null;
    }
    if (this._timeupdateHandler) {
      this._mediaElement.removeEventListener('timeupdate', this._timeupdateHandler);
      this._timeupdateHandler = null;
    }
  }

  get DeviceId(): number { return this._deviceId; }
  get DeviceType(): string { return this._deviceType; }
  get ElementName(): string { return this._elementName; }
  get Alias(): string { return this._alias; }
  get Mode(): MCI_MODE { return this._mode; }
  get Position(): number { return this._position; }
  get Length(): number { return this._length; }
  get IsOpen(): boolean { return this._isOpen; }
  get MediaElement(): HTMLVideoElement | HTMLAudioElement | null { return this._mediaElement; }
}

// Video Capture Implementation
export class VideoCapture extends EventEmitter {
  private _deviceId: number = 0;
  private _isCapturing: boolean = false;
  private _stream: MediaStream | null = null;
  private _mediaRecorder: MediaRecorder | null = null;
  private _canvas: HTMLCanvasElement;
  private _context: CanvasRenderingContext2D;
  private _video: HTMLVideoElement;
  private _recordedChunks: Blob[] = [];
  private _frameRate: number = 30;
  private _resolution: { width: number; height: number } = { width: 640, height: 480 };

  constructor(deviceId: number = 0) {
    super();
    this._deviceId = deviceId;
    this._canvas = document.createElement('canvas');
    this._context = this._canvas.getContext('2d')!;
    this._video = document.createElement('video');
    this._video.autoplay = true;
    this._video.muted = true;
  }

  async initializeCapture(constraints?: MediaStreamConstraints): Promise<number> {
    try {
      const defaultConstraints: MediaStreamConstraints = {
        video: {
          width: this._resolution.width,
          height: this._resolution.height,
          frameRate: this._frameRate
        },
        audio: true
      };
      
      this._stream = await navigator.mediaDevices.getUserMedia(constraints || defaultConstraints);
      this._video.srcObject = this._stream;
      
      await this._video.play();
      
      this._canvas.width = this._resolution.width;
      this._canvas.height = this._resolution.height;
      
      return MMSYSERR.MMSYSERR_NOERROR;
    } catch (error) {
      console.error('Video capture initialization failed:', error);
      return MMSYSERR.MMSYSERR_ERROR;
    }
  }

  startCapture(): number {
    try {
      if (!this._stream) return MMSYSERR.MMSYSERR_INVALHANDLE;
      
      this._isCapturing = true;
      this._recordedChunks = [];
      
      this._mediaRecorder = new MediaRecorder(this._stream);
      
      this._mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this._recordedChunks.push(event.data);
          this.emit('dataAvailable', { data: event.data });
        }
      };
      
      this._mediaRecorder.onstop = () => {
        const blob = new Blob(this._recordedChunks, { type: 'video/webm' });
        this.emit('captureStopped', { data: blob });
      };
      
      this._mediaRecorder.start(100); // Capture in 100ms chunks
      
      // Start frame capture for preview
      this.captureFrame();
      
      return MMSYSERR.MMSYSERR_NOERROR;
    } catch (error) {
      return MMSYSERR.MMSYSERR_ERROR;
    }
  }

  stopCapture(): number {
    try {
      this._isCapturing = false;
      
      if (this._mediaRecorder && this._mediaRecorder.state !== 'inactive') {
        this._mediaRecorder.stop();
      }
      
      return MMSYSERR.MMSYSERR_NOERROR;
    } catch (error) {
      return MMSYSERR.MMSYSERR_ERROR;
    }
  }

  captureFrame(): ImageData | null {
    try {
      if (!this._isCapturing || !this._video) return null;
      
      this._context.drawImage(this._video, 0, 0, this._canvas.width, this._canvas.height);
      const imageData = this._context.getImageData(0, 0, this._canvas.width, this._canvas.height);
      
      this.emit('frameCapture', { imageData });
      
      if (this._isCapturing) {
        setTimeout(() => this.captureFrame(), 1000 / this._frameRate);
      }
      
      return imageData;
    } catch (error) {
      return null;
    }
  }

  setResolution(width: number, height: number): number {
    this._resolution = { width, height };
    this._canvas.width = width;
    this._canvas.height = height;
    return MMSYSERR.MMSYSERR_NOERROR;
  }

  setFrameRate(frameRate: number): number {
    this._frameRate = frameRate;
    return MMSYSERR.MMSYSERR_NOERROR;
  }

  dispose(): number {
    try {
      this.stopCapture();
      
      if (this._stream) {
        this._stream.getTracks().forEach(track => track.stop());
        this._stream = null;
      }
      
      return MMSYSERR.MMSYSERR_NOERROR;
    } catch (error) {
      return MMSYSERR.MMSYSERR_ERROR;
    }
  }

  get DeviceId(): number { return this._deviceId; }
  get IsCapturing(): boolean { return this._isCapturing; }
  get Canvas(): HTMLCanvasElement { return this._canvas; }
  get Video(): HTMLVideoElement { return this._video; }
  get RecordedData(): Blob[] { return this._recordedChunks; }
  get Resolution() { return this._resolution; }
  get FrameRate(): number { return this._frameRate; }
}

// Image Processing Implementation
export class ImageProcessor {
  private _canvas: HTMLCanvasElement;
  private _context: CanvasRenderingContext2D;

  constructor() {
    this._canvas = document.createElement('canvas');
    this._context = this._canvas.getContext('2d')!;
  }

  loadImage(source: string | HTMLImageElement | ImageData): Promise<ImageData> {
    return new Promise((resolve, reject) => {
      if (typeof source === 'string') {
        const img = new Image();
        img.onload = () => {
          this._canvas.width = img.width;
          this._canvas.height = img.height;
          this._context.drawImage(img, 0, 0);
          resolve(this._context.getImageData(0, 0, img.width, img.height));
        };
        img.onerror = reject;
        img.src = source;
      } else if (source instanceof HTMLImageElement) {
        this._canvas.width = source.width;
        this._canvas.height = source.height;
        this._context.drawImage(source, 0, 0);
        resolve(this._context.getImageData(0, 0, source.width, source.height));
      } else if (source instanceof ImageData) {
        this._canvas.width = source.width;
        this._canvas.height = source.height;
        this._context.putImageData(source, 0, 0);
        resolve(source);
      } else {
        reject(new Error('Invalid image source'));
      }
    });
  }

  resize(imageData: ImageData, newWidth: number, newHeight: number): ImageData {
    const tempCanvas = document.createElement('canvas');
    const tempContext = tempCanvas.getContext('2d')!;
    
    tempCanvas.width = imageData.width;
    tempCanvas.height = imageData.height;
    tempContext.putImageData(imageData, 0, 0);
    
    this._canvas.width = newWidth;
    this._canvas.height = newHeight;
    this._context.drawImage(tempCanvas, 0, 0, newWidth, newHeight);
    
    return this._context.getImageData(0, 0, newWidth, newHeight);
  }

  rotate(imageData: ImageData, angle: number): ImageData {
    const centerX = imageData.width / 2;
    const centerY = imageData.height / 2;
    
    this._canvas.width = imageData.width;
    this._canvas.height = imageData.height;
    
    this._context.save();
    this._context.translate(centerX, centerY);
    this._context.rotate(angle * Math.PI / 180);
    this._context.translate(-centerX, -centerY);
    this._context.putImageData(imageData, 0, 0);
    this._context.restore();
    
    return this._context.getImageData(0, 0, imageData.width, imageData.height);
  }

  flip(imageData: ImageData, horizontal: boolean = true): ImageData {
    this._canvas.width = imageData.width;
    this._canvas.height = imageData.height;
    
    this._context.save();
    if (horizontal) {
      this._context.scale(-1, 1);
      this._context.translate(-imageData.width, 0);
    } else {
      this._context.scale(1, -1);
      this._context.translate(0, -imageData.height);
    }
    this._context.putImageData(imageData, 0, 0);
    this._context.restore();
    
    return this._context.getImageData(0, 0, imageData.width, imageData.height);
  }

  adjustBrightness(imageData: ImageData, brightness: number): ImageData {
    const data = imageData.data;
    const adjustment = brightness * 255 / 100;
    
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, Math.max(0, data[i] + adjustment));     // Red
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + adjustment)); // Green
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + adjustment)); // Blue
    }
    
    return imageData;
  }

  adjustContrast(imageData: ImageData, contrast: number): ImageData {
    const data = imageData.data;
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
    
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));     // Red
      data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128)); // Green
      data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128)); // Blue
    }
    
    return imageData;
  }

  toGrayscale(imageData: ImageData): ImageData {
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      data[i] = gray;     // Red
      data[i + 1] = gray; // Green
      data[i + 2] = gray; // Blue
    }
    
    return imageData;
  }

  applyFilter(imageData: ImageData, filterType: string): ImageData {
    switch (filterType.toLowerCase()) {
      case 'blur':
        return this.blur(imageData);
      case 'sharpen':
        return this.sharpen(imageData);
      case 'edge':
        return this.edgeDetection(imageData);
      case 'emboss':
        return this.emboss(imageData);
      default:
        return imageData;
    }
  }

  private blur(imageData: ImageData): ImageData {
    // Simple box blur implementation
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const output = new Uint8ClampedArray(data);
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        for (let c = 0; c < 3; c++) {
          let sum = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const i = ((y + dy) * width + (x + dx)) * 4 + c;
              sum += data[i];
            }
          }
          const i = (y * width + x) * 4 + c;
          output[i] = sum / 9;
        }
      }
    }
    
    return new ImageData(output, width, height);
  }

  private sharpen(imageData: ImageData): ImageData {
    return this.convolution(imageData, [
      0, -1, 0,
      -1, 5, -1,
      0, -1, 0
    ]);
  }

  private edgeDetection(imageData: ImageData): ImageData {
    return this.convolution(imageData, [
      -1, -1, -1,
      -1, 8, -1,
      -1, -1, -1
    ]);
  }

  private emboss(imageData: ImageData): ImageData {
    return this.convolution(imageData, [
      -2, -1, 0,
      -1, 1, 1,
      0, 1, 2
    ]);
  }

  private convolution(imageData: ImageData, kernel: number[]): ImageData {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const output = new Uint8ClampedArray(data);
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        for (let c = 0; c < 3; c++) {
          let sum = 0;
          for (let ky = 0; ky < 3; ky++) {
            for (let kx = 0; kx < 3; kx++) {
              const i = ((y + ky - 1) * width + (x + kx - 1)) * 4 + c;
              sum += data[i] * kernel[ky * 3 + kx];
            }
          }
          const i = (y * width + x) * 4 + c;
          output[i] = Math.min(255, Math.max(0, sum));
        }
      }
    }
    
    return new ImageData(output, width, height);
  }

  saveAsBlob(imageData: ImageData, format: string = 'image/png', quality: number = 0.9): Blob {
    this._canvas.width = imageData.width;
    this._canvas.height = imageData.height;
    this._context.putImageData(imageData, 0, 0);
    
    return new Promise<Blob>((resolve) => {
      this._canvas.toBlob((blob) => {
        resolve(blob!);
      }, format, quality);
    }) as any;
  }

  get Canvas(): HTMLCanvasElement { return this._canvas; }
}

// Multimedia API Functions
export class MultimediaAPI {
  private static _waveOutDevices: WaveOut[] = [];
  private static _waveInDevices: WaveIn[] = [];
  private static _mciDevices: Map<number, MCIDevice> = new Map();
  private static _videoCaptureDevices: VideoCapture[] = [];
  private static _nextDeviceId: number = 1;

  // Wave Output Functions
  static waveOutGetNumDevs(): number {
    return 1; // Simplified - browser has one output device
  }

  static waveOutGetDevCaps(deviceId: number): WAVEOUTCAPS {
    return {
      wMid: 1,
      wPid: 1,
      vDriverVersion: 0x0100,
      szPname: 'Browser Audio Output',
      dwFormats: 0xFFF, // Support all common formats
      wChannels: 2,
      wReserved1: 0,
      dwSupport: 0x001E // WAVECAPS_VOLUME | WAVECAPS_LRVOLUME | WAVECAPS_PITCH | WAVECAPS_PLAYBACKRATE
    };
  }

  static waveOutOpen(deviceId: number, format: WAVEFORMATEX, callback?: (msg: number, param1: number, param2: number) => void): WaveOut | null {
    try {
      const device = new WaveOut(deviceId);
      const result = device.waveOutOpen(format, callback);
      
      if (result === MMSYSERR.MMSYSERR_NOERROR) {
        this._waveOutDevices.push(device);
        return device;
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  // Wave Input Functions
  static waveInGetNumDevs(): number {
    return 1; // Simplified - browser has one input device
  }

  static waveInGetDevCaps(deviceId: number): WAVEINCAPS {
    return {
      wMid: 1,
      wPid: 1,
      vDriverVersion: 0x0100,
      szPname: 'Browser Audio Input',
      dwFormats: 0xFFF, // Support all common formats
      wChannels: 2,
      wReserved1: 0
    };
  }

  static async waveInOpen(deviceId: number, format: WAVEFORMATEX, callback?: (msg: number, param1: number, param2: number) => void): Promise<WaveIn | null> {
    try {
      const device = new WaveIn(deviceId);
      const result = await device.waveInOpen(format, callback);
      
      if (result === MMSYSERR.MMSYSERR_NOERROR) {
        this._waveInDevices.push(device);
        return device;
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  // MCI Functions
  static mciSendCommand(deviceId: number, command: MCI_COMMAND, flags: number, params: any): number {
    try {
      let device = this._mciDevices.get(deviceId);
      
      if (command === MCI_COMMAND.MCI_OPEN) {
        device = new MCIDevice();
        const result = device.mciOpen(params);
        if (result === MMSYSERR.MMSYSERR_NOERROR) {
          params.wDeviceID = this._nextDeviceId++;
          this._mciDevices.set(params.wDeviceID, device);
          return MMSYSERR.MMSYSERR_NOERROR;
        }
        return result;
      }
      
      if (!device) return MMSYSERR.MMSYSERR_INVALHANDLE;
      
      switch (command) {
        case MCI_COMMAND.MCI_CLOSE: {
          const result = device.mciClose();
          this._mciDevices.delete(deviceId);
          return result;
        }
        case MCI_COMMAND.MCI_PLAY:
          return device.mciPlay(params);
        case MCI_COMMAND.MCI_STOP:
          return device.mciStop();
        case MCI_COMMAND.MCI_PAUSE:
          return device.mciPause();
        case MCI_COMMAND.MCI_RESUME:
          return device.mciResume();
        case MCI_COMMAND.MCI_SEEK:
          return device.mciSeek(params.dwTo || 0);
        case MCI_COMMAND.MCI_STATUS:
          return device.mciStatus(params);
        case MCI_COMMAND.MCI_SET:
          return device.mciSet(params.command, params.value);
        default:
          return MMSYSERR.MMSYSERR_NOTSUPPORTED;
      }
    } catch (error) {
      return MMSYSERR.MMSYSERR_ERROR;
    }
  }

  static mciSendString(command: string, returnBuffer?: string[], bufferSize?: number, callback?: any): number {
    try {
      // Parse MCI command string (simplified)
      const parts = command.toLowerCase().split(' ');
      const cmd = parts[0];
      
      if (cmd === 'open') {
        const filename = parts.find(p => p.includes('.')) || '';
        const alias = parts[parts.indexOf('alias') + 1] || '';
        const type = parts[parts.indexOf('type') + 1] || '';
        
        const params: MCI_OPEN_PARMS = {
          dwCallback: 0,
          wDeviceID: 0,
          lpstrDeviceType: type,
          lpstrElementName: filename,
          lpstrAlias: alias
        };
        
        return this.mciSendCommand(0, MCI_COMMAND.MCI_OPEN, 0, params);
      } else if (cmd === 'play') {
        const alias = parts[1];
        const device = Array.from(this._mciDevices.values()).find(d => d.Alias === alias);
        return device ? this.mciSendCommand(device.DeviceId, MCI_COMMAND.MCI_PLAY, 0, {}) : MMSYSERR.MMSYSERR_INVALHANDLE;
      } else if (cmd === 'stop') {
        const alias = parts[1];
        const device = Array.from(this._mciDevices.values()).find(d => d.Alias === alias);
        return device ? this.mciSendCommand(device.DeviceId, MCI_COMMAND.MCI_STOP, 0, {}) : MMSYSERR.MMSYSERR_INVALHANDLE;
      } else if (cmd === 'close') {
        const alias = parts[1];
        const device = Array.from(this._mciDevices.values()).find(d => d.Alias === alias);
        return device ? this.mciSendCommand(device.DeviceId, MCI_COMMAND.MCI_CLOSE, 0, {}) : MMSYSERR.MMSYSERR_INVALHANDLE;
      }
      
      return MMSYSERR.MMSYSERR_NOTSUPPORTED;
    } catch (error) {
      return MMSYSERR.MMSYSERR_ERROR;
    }
  }

  // Video Capture Functions
  static async createVideoCapture(deviceId: number = 0): Promise<VideoCapture | null> {
    try {
      const device = new VideoCapture(deviceId);
      const result = await device.initializeCapture();
      
      if (result === MMSYSERR.MMSYSERR_NOERROR) {
        this._videoCaptureDevices.push(device);
        return device;
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  // Utility Functions
  static timeGetTime(): number {
    // BROWSER FINGERPRINTING BUG FIX: Obfuscate timing
    const protection = MultimediaFingerprintingProtection.getInstance();
    return protection.obfuscateAudioTiming(Date.now());
  }

  static timeBeginPeriod(period: number): number {
    // Set timer resolution (simplified)
    return MMSYSERR.MMSYSERR_NOERROR;
  }

  static timeEndPeriod(period: number): number {
    // End timer resolution (simplified)
    return MMSYSERR.MMSYSERR_NOERROR;
  }

  static PlaySound(soundName: string, module: any, flags: number): boolean {
    try {
      const audio = new Audio(soundName);
      audio.play();
      return true;
    } catch (error) {
      return false;
    }
  }

  static sndPlaySound(soundName: string, flags: number): boolean {
    return this.PlaySound(soundName, null, flags);
  }

  // Get device arrays
  static get WaveOutDevices(): WaveOut[] { return this._waveOutDevices; }
  static get WaveInDevices(): WaveIn[] { return this._waveInDevices; }
  static get MCIDevices(): Map<number, MCIDevice> { return this._mciDevices; }
  static get VideoCaptureDevices(): VideoCapture[] { return this._videoCaptureDevices; }
}

// Register Multimedia classes with COM registry
const registry = COM['_registry'] || COM;

// Register Wave Audio
registry.registerClass(
  '{WAVE-AUDIO-CLSID}',
  'WaveAudio',
  class extends COMObject {
    constructor() {
      super('{WAVE-AUDIO-CLSID}', 'WaveAudio');
      
      this.addMethod('PlaySound', MultimediaAPI.PlaySound);
      this.addMethod('RecordSound', async (format: WAVEFORMATEX) => {
        const device = await MultimediaAPI.waveInOpen(0, format);
        return device;
      });
    }
  }
);

// Register MCI
registry.registerClass(
  '{MCI-CLSID}',
  'MCI',
  class extends COMObject {
    constructor() {
      super('{MCI-CLSID}', 'MCI');
      
      this.addMethod('SendCommand', MultimediaAPI.mciSendCommand);
      this.addMethod('SendString', MultimediaAPI.mciSendString);
    }
  }
);

// Register Video Capture
registry.registerClass(
  '{VIDEO-CAPTURE-CLSID}',
  'VideoCapture',
  class extends COMObject {
    constructor() {
      super('{VIDEO-CAPTURE-CLSID}', 'VideoCapture');
      
      this.addMethod('CreateCapture', MultimediaAPI.createVideoCapture);
    }
  }
);

// Export main objects
export {
  MultimediaAPI,
  WaveOut,
  WaveIn,
  MCIDevice,
  VideoCapture,
  ImageProcessor,
  MMSYSERR,
  WAVE_FORMAT,
  MCI_COMMAND,
  MCI_MODE
};

export default MultimediaAPI;