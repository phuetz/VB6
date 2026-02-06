/**
 * DirectX API - Complete VB6 DirectX Implementation for Browser Environment
 * Provides DirectDraw, Direct3D, DirectSound, DirectInput, and DirectPlay functionality
 */

import { EventEmitter } from 'events';
import { COMObject, COM } from '../data/COMActiveXBridge';

// DirectX Constants
export enum D3DRENDERSTATETYPE {
  D3DRS_ZENABLE = 7,
  D3DRS_FILLMODE = 8,
  D3DRS_SHADEMODE = 9,
  D3DRS_ZWRITEENABLE = 14,
  D3DRS_ALPHATESTENABLE = 15,
  D3DRS_LASTPIXEL = 16,
  D3DRS_SRCBLEND = 19,
  D3DRS_DESTBLEND = 20,
  D3DRS_CULLMODE = 22,
  D3DRS_ZFUNC = 23,
  D3DRS_ALPHAREF = 24,
  D3DRS_ALPHAFUNC = 25,
  D3DRS_DITHERENABLE = 26,
  D3DRS_ALPHABLENDENABLE = 27,
  D3DRS_FOGENABLE = 28,
  D3DRS_SPECULARENABLE = 29,
  D3DRS_FOGCOLOR = 34,
  D3DRS_FOGTABLEMODE = 35,
  D3DRS_FOGSTART = 36,
  D3DRS_FOGEND = 37,
  D3DRS_FOGDENSITY = 38,
  D3DRS_LIGHTING = 137,
  D3DRS_AMBIENT = 139,
  D3DRS_COLORVERTEX = 141,
  D3DRS_LOCALVIEWER = 142,
  D3DRS_NORMALIZENORMALS = 143,
  D3DRS_DIFFUSEMATERIALSOURCE = 145,
  D3DRS_SPECULARMATERIALSOURCE = 146,
  D3DRS_AMBIENTMATERIALSOURCE = 147,
  D3DRS_EMISSIVEMATERIALSOURCE = 148,
}

export enum D3DPRIMITIVETYPE {
  D3DPT_POINTLIST = 1,
  D3DPT_LINELIST = 2,
  D3DPT_LINESTRIP = 3,
  D3DPT_TRIANGLELIST = 4,
  D3DPT_TRIANGLESTRIP = 5,
  D3DPT_TRIANGLEFAN = 6,
}

export enum DDSURFACEDESC2_FLAGS {
  DDSD_CAPS = 0x1,
  DDSD_HEIGHT = 0x2,
  DDSD_WIDTH = 0x4,
  DDSD_PITCH = 0x8,
  DDSD_BACKBUFFERCOUNT = 0x20,
  DDSD_ZBUFFERBITDEPTH = 0x40,
  DDSD_ALPHABITDEPTH = 0x80,
  DDSD_LPSURFACE = 0x800,
  DDSD_PIXELFORMAT = 0x1000,
  DDSD_CKDESTOVERLAY = 0x2000,
  DDSD_CKDESTBLT = 0x4000,
  DDSD_CKSRCOVERLAY = 0x8000,
  DDSD_CKSRCBLT = 0x10000,
  DDSD_MIPMAPCOUNT = 0x20000,
  DDSD_REFRESHRATE = 0x40000,
  DDSD_LINEARSIZE = 0x80000,
}

export enum DDSCAPS2_FLAGS {
  DDSCAPS_RESERVED1 = 0x1,
  DDSCAPS_ALPHA = 0x2,
  DDSCAPS_BACKBUFFER = 0x4,
  DDSCAPS_COMPLEX = 0x8,
  DDSCAPS_FLIP = 0x10,
  DDSCAPS_FRONTBUFFER = 0x20,
  DDSCAPS_OFFSCREENPLAIN = 0x40,
  DDSCAPS_OVERLAY = 0x80,
  DDSCAPS_PALETTE = 0x100,
  DDSCAPS_PRIMARYSURFACE = 0x200,
  DDSCAPS_RESERVED3 = 0x400,
  DDSCAPS_SYSTEMMEMORY = 0x800,
  DDSCAPS_TEXTURE = 0x1000,
  DDSCAPS_3DDEVICE = 0x2000,
  DDSCAPS_VIDEOMEMORY = 0x4000,
  DDSCAPS_VISIBLE = 0x8000,
  DDSCAPS_WRITEONLY = 0x10000,
  DDSCAPS_ZBUFFER = 0x20000,
  DDSCAPS_OWNDC = 0x40000,
  DDSCAPS_LIVEVIDEO = 0x80000,
  DDSCAPS_HWCODEC = 0x100000,
  DDSCAPS_MODEX = 0x200000,
  DDSCAPS_MIPMAP = 0x400000,
  DDSCAPS_RESERVED2 = 0x800000,
  DDSCAPS_ALLOCONLOAD = 0x4000000,
  DDSCAPS_VIDEOPORT = 0x8000000,
  DDSCAPS_LOCALVIDMEM = 0x10000000,
  DDSCAPS_NONLOCALVIDMEM = 0x20000000,
  DDSCAPS_STANDARDVGAMODE = 0x40000000,
  DDSCAPS_OPTIMIZED = 0x80000000,
}

export enum DSBCAPS_FLAGS {
  DSBCAPS_PRIMARYBUFFER = 0x1,
  DSBCAPS_STATIC = 0x2,
  DSBCAPS_LOCHARDWARE = 0x4,
  DSBCAPS_LOCSOFTWARE = 0x8,
  DSBCAPS_CTRL3D = 0x10,
  DSBCAPS_CTRLFREQUENCY = 0x20,
  DSBCAPS_CTRLPAN = 0x40,
  DSBCAPS_CTRLVOLUME = 0x80,
  DSBCAPS_CTRLPOSITIONNOTIFY = 0x100,
  DSBCAPS_CTRLFX = 0x200,
  DSBCAPS_STICKYFOCUS = 0x4000,
  DSBCAPS_GLOBALFOCUS = 0x8000,
  DSBCAPS_GETCURRENTPOSITION2 = 0x10000,
  DSBCAPS_MUTE3DATMAXDISTANCE = 0x20000,
  DSBCAPS_LOCDEFER = 0x40000,
}

// DirectX Structures
export interface RECT {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface POINT {
  x: number;
  y: number;
}

export interface D3DVECTOR {
  x: number;
  y: number;
  z: number;
}

export interface D3DMATRIX {
  _11: number;
  _12: number;
  _13: number;
  _14: number;
  _21: number;
  _22: number;
  _23: number;
  _24: number;
  _31: number;
  _32: number;
  _33: number;
  _34: number;
  _41: number;
  _42: number;
  _43: number;
  _44: number;
}

export interface D3DVERTEX {
  x: number;
  y: number;
  z: number;
  nx: number;
  ny: number;
  nz: number;
  tu: number;
  tv: number;
}

export interface DDSURFACEDESC2 {
  dwSize: number;
  dwFlags: number;
  dwHeight: number;
  dwWidth: number;
  lPitch: number;
  dwBackBufferCount: number;
  dwMipMapCount: number;
  dwAlphaBitDepth: number;
  dwReserved: number;
  lpSurface: any;
  ddckCKDestOverlay: any;
  ddckCKDestBlt: any;
  ddckCKSrcOverlay: any;
  ddckCKSrcBlt: any;
  ddpfPixelFormat: any;
  ddsCaps: any;
}

export interface DSBUFFERDESC {
  dwSize: number;
  dwFlags: number;
  dwBufferBytes: number;
  dwReserved: number;
  lpwfxFormat: WAVEFORMATEX;
  guid3DAlgorithm: string;
}

export interface WAVEFORMATEX {
  wFormatTag: number;
  nChannels: number;
  nSamplesPerSec: number;
  nAvgBytesPerSec: number;
  nBlockAlign: number;
  wBitsPerSample: number;
  cbSize: number;
}

// DirectDraw Surface Implementation
export class DirectDrawSurface extends COMObject {
  private _width: number = 640;
  private _height: number = 480;
  private _bitDepth: number = 32;
  private _canvas: HTMLCanvasElement;
  private _context: CanvasRenderingContext2D;
  private _imageData: ImageData;
  private _locked: boolean = false;
  private _lost: boolean = false;
  private _caps: number = 0;

  constructor(width: number = 640, height: number = 480, bitDepth: number = 32) {
    super('{DIRECTDRAW-SURFACE-CLSID}', 'DirectDraw.Surface');
    this._width = width;
    this._height = height;
    this._bitDepth = bitDepth;

    // Create canvas for surface
    this._canvas = document.createElement('canvas');
    this._canvas.width = width;
    this._canvas.height = height;
    this._context = this._canvas.getContext('2d')!;
    this._imageData = this._context.createImageData(width, height);

    this.setupSurfaceMethods();
  }

  private setupSurfaceMethods(): void {
    this.addMethod('Lock', (destRect?: RECT, flags?: number) => {
      if (!this._locked) {
        this._locked = true;
        this._imageData = this._context.getImageData(0, 0, this._width, this._height);
        return 0; // DD_OK
      }
      return 0x8876017c; // DDERR_SURFACEBUSY
    });

    this.addMethod('Unlock', (destRect?: RECT) => {
      if (this._locked) {
        this._context.putImageData(this._imageData, 0, 0);
        this._locked = false;
        return 0; // DD_OK
      }
      return 0x887601a2; // DDERR_NOTLOCKED
    });

    this.addMethod(
      'Blt',
      (destRect: RECT, srcSurface: DirectDrawSurface, srcRect: RECT, flags: number) => {
        if (srcSurface && srcSurface._canvas) {
          this._context.drawImage(
            srcSurface._canvas,
            srcRect.left,
            srcRect.top,
            srcRect.right - srcRect.left,
            srcRect.bottom - srcRect.top,
            destRect.left,
            destRect.top,
            destRect.right - destRect.left,
            destRect.bottom - destRect.top
          );
        }
        return 0; // DD_OK
      }
    );

    this.addMethod(
      'BltFast',
      (x: number, y: number, srcSurface: DirectDrawSurface, srcRect: RECT, flags: number) => {
        if (srcSurface && srcSurface._canvas) {
          this._context.drawImage(
            srcSurface._canvas,
            srcRect.left,
            srcRect.top,
            srcRect.right - srcRect.left,
            srcRect.bottom - srcRect.top,
            x,
            y,
            srcRect.right - srcRect.left,
            srcRect.bottom - srcRect.top
          );
        }
        return 0; // DD_OK
      }
    );

    this.addMethod('GetDC', () => {
      // Return canvas context handle (simplified)
      return this._context;
    });

    this.addMethod('ReleaseDC', (hdc: any) => {
      // Release device context (simplified)
      return 0; // DD_OK
    });

    this.addMethod('Flip', (targetSurface?: DirectDrawSurface, flags?: number) => {
      // Flip surfaces (simplified for canvas)
      if (targetSurface) {
        const tempImageData = this._context.getImageData(0, 0, this._width, this._height);
        this._context.putImageData(targetSurface._imageData, 0, 0);
        targetSurface._context.putImageData(tempImageData, 0, 0);
      }
      return 0; // DD_OK
    });

    this.addMethod('GetSurfaceDesc', () => {
      const desc: DDSURFACEDESC2 = {
        dwSize: 124,
        dwFlags:
          DDSURFACEDESC2_FLAGS.DDSD_WIDTH |
          DDSURFACEDESC2_FLAGS.DDSD_HEIGHT |
          DDSURFACEDESC2_FLAGS.DDSD_CAPS,
        dwHeight: this._height,
        dwWidth: this._width,
        lPitch: this._width * (this._bitDepth / 8),
        dwBackBufferCount: 0,
        dwMipMapCount: 0,
        dwAlphaBitDepth: 0,
        dwReserved: 0,
        lpSurface: this._imageData.data,
        ddckCKDestOverlay: null,
        ddckCKDestBlt: null,
        ddckCKSrcOverlay: null,
        ddckCKSrcBlt: null,
        ddpfPixelFormat: null,
        ddsCaps: this._caps,
      };
      return desc;
    });

    this.addMethod('IsLost', () => {
      return this._lost ? 0x876024c5 : 0; // DDERR_SURFACELOST : DD_OK
    });

    this.addMethod('Restore', () => {
      this._lost = false;
      return 0; // DD_OK
    });

    this.addMethod('SetColorKey', (flags: number, colorKey: any) => {
      // Set color key for transparency (simplified)
      return 0; // DD_OK
    });

    this.addMethod('GetColorKey', (flags: number) => {
      // Get color key (simplified)
      return { dwColorSpaceLowValue: 0, dwColorSpaceHighValue: 0 };
    });

    this.addMethod('SetPalette', (palette: any) => {
      // Set palette (simplified for modern displays)
      return 0; // DD_OK
    });

    this.addMethod('GetPalette', () => {
      // Get palette (simplified)
      return null;
    });
  }

  get Canvas(): HTMLCanvasElement {
    return this._canvas;
  }
  get Context(): CanvasRenderingContext2D {
    return this._context;
  }
  get Width(): number {
    return this._width;
  }
  get Height(): number {
    return this._height;
  }
  get BitDepth(): number {
    return this._bitDepth;
  }
  get IsLocked(): boolean {
    return this._locked;
  }
}

// DirectDraw Implementation
export class DirectDraw extends COMObject {
  private _displayMode: { width: number; height: number; bitDepth: number; refreshRate: number };
  private _primarySurface: DirectDrawSurface | null = null;
  private _surfaces: DirectDrawSurface[] = [];
  private _cooperativeLevel: number = 0;

  constructor() {
    super('{DIRECTDRAW-CLSID}', 'DirectDraw');
    this._displayMode = {
      width: window.screen.width,
      height: window.screen.height,
      bitDepth: 32,
      refreshRate: 60,
    };
    this.setupDirectDrawMethods();
  }

  private setupDirectDrawMethods(): void {
    this.addMethod('Initialize', (guid?: string) => {
      return 0; // DD_OK
    });

    this.addMethod('SetCooperativeLevel', (hWnd: any, flags: number) => {
      this._cooperativeLevel = flags;
      return 0; // DD_OK
    });

    this.addMethod(
      'SetDisplayMode',
      (width: number, height: number, bitDepth: number, refreshRate?: number, flags?: number) => {
        this._displayMode = { width, height, bitDepth, refreshRate: refreshRate || 60 };

        // In browser, we can't actually change display mode, so we simulate it
        if (this._primarySurface) {
          this._primarySurface = new DirectDrawSurface(width, height, bitDepth);
        }

        return 0; // DD_OK
      }
    );

    this.addMethod('RestoreDisplayMode', () => {
      this._displayMode = {
        width: window.screen.width,
        height: window.screen.height,
        bitDepth: 32,
        refreshRate: 60,
      };
      return 0; // DD_OK
    });

    this.addMethod('CreateSurface', (surfaceDesc: DDSURFACEDESC2, surface?: DirectDrawSurface) => {
      const newSurface = new DirectDrawSurface(
        surfaceDesc.dwWidth || this._displayMode.width,
        surfaceDesc.dwHeight || this._displayMode.height,
        this._displayMode.bitDepth
      );

      newSurface['_caps'] = surfaceDesc.ddsCaps;

      if (surfaceDesc.ddsCaps & DDSCAPS2_FLAGS.DDSCAPS_PRIMARYSURFACE) {
        this._primarySurface = newSurface;
        // For primary surface in browser, attach to document body
        document.body.appendChild(newSurface.Canvas);
        newSurface.Canvas.style.position = 'fixed';
        newSurface.Canvas.style.top = '0';
        newSurface.Canvas.style.left = '0';
        newSurface.Canvas.style.zIndex = '1000';
      }

      this._surfaces.push(newSurface);
      return newSurface;
    });

    this.addMethod(
      'EnumDisplayModes',
      (
        flags: number,
        surfaceDesc: DDSURFACEDESC2,
        context: any,
        callback: (mode: any, context: any) => void
      ) => {
        // Enumerate display modes (simplified)
        const modes = [
          { width: 640, height: 480, bitDepth: 32, refreshRate: 60 },
          { width: 800, height: 600, bitDepth: 32, refreshRate: 60 },
          { width: 1024, height: 768, bitDepth: 32, refreshRate: 60 },
          { width: 1280, height: 1024, bitDepth: 32, refreshRate: 60 },
          { width: 1920, height: 1080, bitDepth: 32, refreshRate: 60 },
        ];

        modes.forEach(mode => {
          const desc: DDSURFACEDESC2 = {
            dwSize: 124,
            dwFlags:
              DDSURFACEDESC2_FLAGS.DDSD_WIDTH |
              DDSURFACEDESC2_FLAGS.DDSD_HEIGHT |
              DDSURFACEDESC2_FLAGS.DDSD_REFRESHRATE,
            dwHeight: mode.height,
            dwWidth: mode.width,
            lPitch: 0,
            dwBackBufferCount: 0,
            dwMipMapCount: 0,
            dwAlphaBitDepth: 0,
            dwReserved: 0,
            lpSurface: null,
            ddckCKDestOverlay: null,
            ddckCKDestBlt: null,
            ddckCKSrcOverlay: null,
            ddckCKSrcBlt: null,
            ddpfPixelFormat: null,
            ddsCaps: null,
          };
          callback(desc, context);
        });

        return 0; // DD_OK
      }
    );

    this.addMethod('GetDisplayMode', () => {
      const desc: DDSURFACEDESC2 = {
        dwSize: 124,
        dwFlags:
          DDSURFACEDESC2_FLAGS.DDSD_WIDTH |
          DDSURFACEDESC2_FLAGS.DDSD_HEIGHT |
          DDSURFACEDESC2_FLAGS.DDSD_REFRESHRATE,
        dwHeight: this._displayMode.height,
        dwWidth: this._displayMode.width,
        lPitch: 0,
        dwBackBufferCount: 0,
        dwMipMapCount: 0,
        dwAlphaBitDepth: 0,
        dwReserved: 0,
        lpSurface: null,
        ddckCKDestOverlay: null,
        ddckCKDestBlt: null,
        ddckCKSrcOverlay: null,
        ddckCKSrcBlt: null,
        ddpfPixelFormat: null,
        ddsCaps: null,
      };
      return desc;
    });

    this.addMethod('WaitForVerticalBlank', (flags: number, hEvent?: any) => {
      // Simulate vertical blank wait
      return new Promise(resolve => {
        setTimeout(() => resolve(0), 16); // ~60 FPS
      });
    });

    this.addMethod('FlipToGDISurface', () => {
      return 0; // DD_OK
    });

    this.addMethod('GetGDISurface', () => {
      return this._primarySurface;
    });

    this.addMethod('TestCooperativeLevel', () => {
      return 0; // DD_OK
    });

    this.addMethod('GetAvailableVidMem', (caps: any) => {
      // Return simulated video memory info
      return {
        dwTotal: 256 * 1024 * 1024, // 256 MB
        dwFree: 128 * 1024 * 1024, // 128 MB
      };
    });
  }

  get PrimarySurface(): DirectDrawSurface | null {
    return this._primarySurface;
  }
  get DisplayMode() {
    return this._displayMode;
  }
  get Surfaces(): DirectDrawSurface[] {
    return this._surfaces;
  }

  /**
   * MEMORY LEAK BUG FIX: Clean up DOM elements to prevent memory leaks
   */
  destroy(): void {
    // Remove all canvas elements from DOM
    this._surfaces.forEach(surface => {
      if (surface.Canvas && surface.Canvas.parentNode) {
        surface.Canvas.parentNode.removeChild(surface.Canvas);
      }
    });

    // Clear surfaces array
    this._surfaces = [];
    this._primarySurface = null;
  }
}

// DirectSound Buffer Implementation
export class DirectSoundBuffer extends COMObject {
  private _audioContext: AudioContext;
  private _audioBuffer: AudioBuffer | null = null;
  private _source: AudioBufferSourceNode | null = null;
  private _gainNode: GainNode;
  private _panNode: StereoPannerNode;
  private _volume: number = 1.0;
  private _pan: number = 0.0;
  private _frequency: number = 44100;
  private _isPlaying: boolean = false;
  private _position: number = 0;
  private _bufferSize: number = 0;
  private _format: WAVEFORMATEX;

  constructor(audioContext: AudioContext, desc: DSBUFFERDESC) {
    super('{DIRECTSOUND-BUFFER-CLSID}', 'DirectSound.Buffer');
    this._audioContext = audioContext;
    this._format = desc.lpwfxFormat;
    this._bufferSize = desc.dwBufferBytes;

    this._gainNode = audioContext.createGain();
    this._panNode = audioContext.createStereoPanner();
    this._gainNode.connect(this._panNode);
    this._panNode.connect(audioContext.destination);

    this.setupBufferMethods();
  }

  private setupBufferMethods(): void {
    this.addMethod('Play', (priority: number, flags: number) => {
      if (this._audioBuffer && !this._isPlaying) {
        this._source = this._audioContext.createBufferSource();
        this._source.buffer = this._audioBuffer;
        this._source.connect(this._gainNode);

        this._source.onended = () => {
          this._isPlaying = false;
          this._position = 0;
        };

        this._source.start(0);
        this._isPlaying = true;
        return 0; // DS_OK
      }
      return 0x8878000a; // DSERR_BUFFERLOST
    });

    this.addMethod('Stop', () => {
      if (this._source && this._isPlaying) {
        this._source.stop();
        this._isPlaying = false;
        return 0; // DS_OK
      }
      return 0x88780014; // DSERR_INVALIDCALL
    });

    this.addMethod('SetVolume', (volume: number) => {
      this._volume = Math.max(-10000, Math.min(0, volume)) / 10000; // Convert from DirectSound volume
      this._gainNode.gain.value = Math.pow(10, this._volume);
      return 0; // DS_OK
    });

    this.addMethod('GetVolume', () => {
      return Math.round(Math.log10(this._gainNode.gain.value) * 10000);
    });

    this.addMethod('SetPan', (pan: number) => {
      this._pan = Math.max(-10000, Math.min(10000, pan)) / 10000; // Convert from DirectSound pan
      this._panNode.pan.value = this._pan;
      return 0; // DS_OK
    });

    this.addMethod('GetPan', () => {
      return Math.round(this._panNode.pan.value * 10000);
    });

    this.addMethod('SetFrequency', (frequency: number) => {
      this._frequency = frequency;
      if (this._source) {
        this._source.playbackRate.value = frequency / this._format.nSamplesPerSec;
      }
      return 0; // DS_OK
    });

    this.addMethod('GetFrequency', () => {
      return this._frequency;
    });

    this.addMethod('SetCurrentPosition', (position: number) => {
      this._position = position;
      return 0; // DS_OK
    });

    this.addMethod('GetCurrentPosition', () => {
      return {
        dwPlay: this._position,
        dwWrite: this._position,
      };
    });

    this.addMethod('Lock', (offset: number, bytes: number, flags: number) => {
      // Return buffer pointers for writing audio data
      // BUFFER OVERFLOW FIX: Validate buffer size to prevent excessive memory allocation\n      if (bytes < 0 || bytes > 100 * 1024 * 1024) { // 100MB limit\n        throw new Error(`Invalid buffer size: ${bytes}. Must be between 0 and 100MB`);\n      }\n      const buffer1 = new ArrayBuffer(bytes);
      return {
        lpvAudioPtr1: buffer1,
        dwAudioBytes1: bytes,
        lpvAudioPtr2: null,
        dwAudioBytes2: 0,
      };
    });

    this.addMethod(
      'Unlock',
      (
        audioPtr1: ArrayBuffer,
        audioBytes1: number,
        audioPtr2?: ArrayBuffer,
        audioBytes2?: number
      ) => {
        // Convert the raw audio data to AudioBuffer
        if (audioPtr1) {
          const channels = this._format.nChannels;
          const sampleRate = this._format.nSamplesPerSec;
          const frames = audioBytes1 / (this._format.wBitsPerSample / 8) / channels;

          this._audioBuffer = this._audioContext.createBuffer(channels, frames, sampleRate);

          // Copy audio data (simplified - assumes 16-bit PCM)
          const view = new Int16Array(audioPtr1);
          for (let channel = 0; channel < channels; channel++) {
            const channelData = this._audioBuffer.getChannelData(channel);
            for (let frame = 0; frame < frames; frame++) {
              channelData[frame] = view[frame * channels + channel] / 32768;
            }
          }
        }
        return 0; // DS_OK
      }
    );

    this.addMethod('GetStatus', () => {
      let status = 0;
      if (this._isPlaying) status |= 0x1; // DSBSTATUS_PLAYING
      return status;
    });

    this.addMethod('GetCaps', () => {
      return {
        dwSize: 28,
        dwFlags: 0,
        dwBufferBytes: this._bufferSize,
        dwUnlockTransferRate: 0,
        dwPlayCpuOverhead: 0,
      };
    });
  }

  get IsPlaying(): boolean {
    return this._isPlaying;
  }
  get Volume(): number {
    return this._volume;
  }
  get Pan(): number {
    return this._pan;
  }
  get Frequency(): number {
    return this._frequency;
  }
}

// DirectSound Implementation
export class DirectSound extends COMObject {
  private _audioContext: AudioContext;
  private _primaryBuffer: DirectSoundBuffer | null = null;
  private _buffers: DirectSoundBuffer[] = [];
  private _cooperativeLevel: number = 0;

  constructor() {
    super('{DIRECTSOUND-CLSID}', 'DirectSound');
    this._audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.setupDirectSoundMethods();
  }

  private setupDirectSoundMethods(): void {
    this.addMethod('Initialize', (guid?: string) => {
      return 0; // DS_OK
    });

    this.addMethod('SetCooperativeLevel', (hWnd: any, level: number) => {
      this._cooperativeLevel = level;
      return 0; // DS_OK
    });

    this.addMethod('CreateSoundBuffer', (desc: DSBUFFERDESC, buffer?: DirectSoundBuffer) => {
      const newBuffer = new DirectSoundBuffer(this._audioContext, desc);

      if (desc.dwFlags & DSBCAPS_FLAGS.DSBCAPS_PRIMARYBUFFER) {
        this._primaryBuffer = newBuffer;
      }

      this._buffers.push(newBuffer);
      return newBuffer;
    });

    this.addMethod('GetCaps', () => {
      return {
        dwSize: 60,
        dwFlags: 0x1, // DSCAPS_PRIMARYMONO
        dwMinSecondarySampleRate: 100,
        dwMaxSecondarySampleRate: 100000,
        dwPrimaryBuffers: 1,
        dwMaxHwMixingAllBuffers: 0,
        dwMaxHwMixingStaticBuffers: 0,
        dwMaxHwMixingStreamingBuffers: 0,
        dwFreeHwMixingAllBuffers: 0,
        dwFreeHwMixingStaticBuffers: 0,
        dwFreeHwMixingStreamingBuffers: 0,
        dwMaxHw3DAllBuffers: 0,
        dwMaxHw3DStaticBuffers: 0,
        dwMaxHw3DStreamingBuffers: 0,
        dwFreeHw3DAllBuffers: 0,
        dwFreeHw3DStaticBuffers: 0,
        dwFreeHw3DStreamingBuffers: 0,
        dwTotalHwMemBytes: 0,
        dwFreeHwMemBytes: 0,
        dwMaxContigFreeHwMemBytes: 0,
        dwUnlockTransferRateHwBuffers: 0,
        dwPlayCpuOverheadSwBuffers: 0,
        dwReserved1: 0,
        dwReserved2: 0,
      };
    });

    this.addMethod('Compact', () => {
      return 0; // DS_OK
    });

    this.addMethod('GetSpeakerConfig', () => {
      return 5; // DSSPEAKER_STEREO
    });

    this.addMethod('SetSpeakerConfig', (speakerConfig: number) => {
      return 0; // DS_OK
    });
  }

  get AudioContext(): AudioContext {
    return this._audioContext;
  }
  get PrimaryBuffer(): DirectSoundBuffer | null {
    return this._primaryBuffer;
  }
  get Buffers(): DirectSoundBuffer[] {
    return this._buffers;
  }
}

// DirectInput Device Implementation
export class DirectInputDevice extends COMObject {
  private _deviceType: number = 0;
  private _deviceGuid: string = '';
  private _acquired: boolean = false;
  private _dataFormat: any = null;
  private _cooperativeLevel: number = 0;
  private _keyboardState: Uint8Array = new Uint8Array(256);
  private _mouseState: { x: number; y: number; buttons: number[] } = {
    x: 0,
    y: 0,
    buttons: [0, 0, 0],
  };
  private _joystickState: any = null;
  private _eventListeners: Array<{
    element: Element | Document;
    event: string;
    handler: EventListener;
  }> = [];

  constructor(deviceType: number, deviceGuid: string) {
    super('{DIRECTINPUT-DEVICE-CLSID}', 'DirectInput.Device');
    this._deviceType = deviceType;
    this._deviceGuid = deviceGuid;
    this.setupDeviceMethods();
    this.setupEventListeners();
  }

  private setupDeviceMethods(): void {
    this.addMethod('SetDataFormat', (dataFormat: any) => {
      this._dataFormat = dataFormat;
      return 0; // DI_OK
    });

    this.addMethod('SetCooperativeLevel', (hWnd: any, flags: number) => {
      this._cooperativeLevel = flags;
      return 0; // DI_OK
    });

    this.addMethod('Acquire', () => {
      this._acquired = true;
      return 0; // DI_OK
    });

    this.addMethod('Unacquire', () => {
      this._acquired = false;
      return 0; // DI_OK
    });

    this.addMethod('GetDeviceState', (stateSize: number, state: any) => {
      if (!this._acquired) return 0x8007001e; // DIERR_NOTACQUIRED

      if (this._deviceType === 2) {
        // Keyboard
        if (state instanceof Uint8Array) {
          state.set(this._keyboardState);
        }
      } else if (this._deviceType === 3) {
        // Mouse
        if (state && typeof state === 'object') {
          state.lX = this._mouseState.x;
          state.lY = this._mouseState.y;
          state.lZ = 0;
          state.rgbButtons = this._mouseState.buttons;
        }
      }

      return 0; // DI_OK
    });

    this.addMethod(
      'GetDeviceData',
      (objectSize: number, data: any[], numElements: number, flags: number) => {
        // Return buffered input data (simplified)
        return 0; // DI_OK
      }
    );

    this.addMethod('SetProperty', (property: string, header: any) => {
      return 0; // DI_OK
    });

    this.addMethod('GetProperty', (property: string) => {
      return null;
    });

    this.addMethod('GetCapabilities', () => {
      return {
        dwSize: 44,
        dwFlags: 0,
        dwDevType: this._deviceType,
        dwAxes: this._deviceType === 3 ? 3 : 0, // Mouse has 3 axes
        dwButtons: this._deviceType === 3 ? 3 : this._deviceType === 2 ? 256 : 0,
        dwPOVs: 0,
        dwFFSamplePeriod: 0,
        dwFFMinTimeResolution: 0,
        dwFirmwareRevision: 0,
        dwHardwareRevision: 0,
        dwFFDriverVersion: 0,
      };
    });

    this.addMethod('Poll', () => {
      return 0; // DI_OK
    });

    this.addMethod('GetObjectInfo', (objectId: number) => {
      return {
        dwSize: 272,
        guidType: '',
        dwOfs: objectId,
        dwType: 0,
        dwFlags: 0,
        tszName: `Object${objectId}`,
        dwFFMaxForce: 0,
        dwFFForceResolution: 0,
        wCollectionNumber: 0,
        wDesignatorIndex: 0,
        wUsagePage: 0,
        wUsage: 0,
        dwDimension: 0,
        wExponent: 0,
        wReportId: 0,
      };
    });
  }

  private setupEventListeners(): void {
    if (this._deviceType === 2) {
      // Keyboard
      const keydownHandler = (e: Event) => {
        if (this._acquired) {
          this._keyboardState[(e as KeyboardEvent).keyCode] = 0x80;
        }
      };
      const keyupHandler = (e: Event) => {
        if (this._acquired) {
          this._keyboardState[(e as KeyboardEvent).keyCode] = 0x00;
        }
      };

      document.addEventListener('keydown', keydownHandler);
      document.addEventListener('keyup', keyupHandler);

      this._eventListeners.push(
        { element: document, event: 'keydown', handler: keydownHandler },
        { element: document, event: 'keyup', handler: keyupHandler }
      );
    } else if (this._deviceType === 3) {
      // Mouse
      const mousemoveHandler = (e: Event) => {
        if (this._acquired) {
          const mouseEvent = e as MouseEvent;
          this._mouseState.x = mouseEvent.movementX || 0;
          this._mouseState.y = mouseEvent.movementY || 0;
        }
      };
      const mousedownHandler = (e: Event) => {
        if (this._acquired) {
          this._mouseState.buttons[(e as MouseEvent).button] = 0x80;
        }
      };
      const mouseupHandler = (e: Event) => {
        if (this._acquired) {
          this._mouseState.buttons[(e as MouseEvent).button] = 0x00;
        }
      };

      document.addEventListener('mousemove', mousemoveHandler);
      document.addEventListener('mousedown', mousedownHandler);
      document.addEventListener('mouseup', mouseupHandler);

      this._eventListeners.push(
        { element: document, event: 'mousemove', handler: mousemoveHandler },
        { element: document, event: 'mousedown', handler: mousedownHandler },
        { element: document, event: 'mouseup', handler: mouseupHandler }
      );
    }
  }

  public destroy(): void {
    // Remove all event listeners
    this._eventListeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this._eventListeners = [];

    // Release the device
    this._acquired = false;
  }

  get DeviceType(): number {
    return this._deviceType;
  }
  get DeviceGuid(): string {
    return this._deviceGuid;
  }
  get IsAcquired(): boolean {
    return this._acquired;
  }
}

// DirectInput Implementation
export class DirectInput extends COMObject {
  private _devices: DirectInputDevice[] = [];
  private _version: number = 0x0800;

  constructor() {
    super('{DIRECTINPUT-CLSID}', 'DirectInput');
    this.setupDirectInputMethods();
  }

  private setupDirectInputMethods(): void {
    this.addMethod('Initialize', (hInst: any, version: number) => {
      this._version = version;
      return 0; // DI_OK
    });

    this.addMethod(
      'EnumDevices',
      (deviceType: number, callback: (device: any, ref: any) => void, ref: any, flags: number) => {
        // Enumerate input devices
        const devices = [
          {
            deviceType: 2,
            guid: '{SYS-KEYBOARD}',
            instanceName: 'System Keyboard',
            productName: 'Keyboard',
          },
          {
            deviceType: 3,
            guid: '{SYS-MOUSE}',
            instanceName: 'System Mouse',
            productName: 'Mouse',
          },
        ];

        devices.forEach(device => {
          if (deviceType === 0 || deviceType === device.deviceType) {
            const deviceInstance = {
              dwSize: 268,
              guidInstance: device.guid,
              guidProduct: device.guid,
              dwDevType: device.deviceType,
              tszInstanceName: device.instanceName,
              tszProductName: device.productName,
              guidFFDriver: '',
              wUsagePage: 0,
              wUsage: 0,
            };
            callback(deviceInstance, ref);
          }
        });

        return 0; // DI_OK
      }
    );

    this.addMethod('CreateDevice', (guid: string, device?: DirectInputDevice, outer?: any) => {
      let deviceType = 0;
      if (guid.includes('KEYBOARD')) deviceType = 2;
      else if (guid.includes('MOUSE')) deviceType = 3;
      else if (guid.includes('JOYSTICK')) deviceType = 4;

      const newDevice = new DirectInputDevice(deviceType, guid);
      this._devices.push(newDevice);
      return newDevice;
    });

    this.addMethod('GetDeviceStatus', (guid: string) => {
      const device = this._devices.find(d => d.DeviceGuid === guid);
      return device ? 0 : 0x80070057; // DI_OK : DIERR_INVALIDPARAM
    });

    this.addMethod('RunControlPanel', (hWnd: any, flags: number) => {
      // Open DirectInput control panel (simplified)
      return 0; // DI_OK
    });
  }

  get Devices(): DirectInputDevice[] {
    return this._devices;
  }
  get Version(): number {
    return this._version;
  }
}

// Direct3D Device Implementation
export class Direct3DDevice extends COMObject {
  private _renderTarget: DirectDrawSurface | null = null;
  private _viewport: {
    x: number;
    y: number;
    width: number;
    height: number;
    minZ: number;
    maxZ: number;
  };
  private _worldMatrix: D3DMATRIX;
  private _viewMatrix: D3DMATRIX;
  private _projectionMatrix: D3DMATRIX;
  private _renderStates: Map<D3DRENDERSTATETYPE, any> = new Map();
  private _lighting: boolean = true;
  private _zbuffer: boolean = true;

  constructor() {
    super('{DIRECT3D-DEVICE-CLSID}', 'Direct3D.Device');
    this._viewport = { x: 0, y: 0, width: 640, height: 480, minZ: 0.0, maxZ: 1.0 };
    this._worldMatrix = this.createIdentityMatrix();
    this._viewMatrix = this.createIdentityMatrix();
    this._projectionMatrix = this.createIdentityMatrix();
    this.setupDeviceMethods();
    this.initializeRenderStates();
  }

  private setupDeviceMethods(): void {
    this.addMethod('BeginScene', () => {
      return 0; // D3D_OK
    });

    this.addMethod('EndScene', () => {
      return 0; // D3D_OK
    });

    this.addMethod(
      'Clear',
      (count: number, rects: RECT[], flags: number, color: number, z: number, stencil: number) => {
        if (this._renderTarget && this._renderTarget.Context) {
          const ctx = this._renderTarget.Context;
          const r = (color >> 16) & 0xff;
          const g = (color >> 8) & 0xff;
          const b = color & 0xff;
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillRect(0, 0, this._renderTarget.Width, this._renderTarget.Height);
        }
        return 0; // D3D_OK
      }
    );

    this.addMethod('SetRenderTarget', (renderTarget: DirectDrawSurface) => {
      this._renderTarget = renderTarget;
      return 0; // D3D_OK
    });

    this.addMethod('GetRenderTarget', () => {
      return this._renderTarget;
    });

    this.addMethod('SetViewport', (viewport: any) => {
      this._viewport = viewport;
      return 0; // D3D_OK
    });

    this.addMethod('GetViewport', () => {
      return this._viewport;
    });

    this.addMethod('SetTransform', (transformType: number, matrix: D3DMATRIX) => {
      switch (transformType) {
        case 256: // D3DTS_WORLD
          this._worldMatrix = matrix;
          break;
        case 2: // D3DTS_VIEW
          this._viewMatrix = matrix;
          break;
        case 3: // D3DTS_PROJECTION
          this._projectionMatrix = matrix;
          break;
      }
      return 0; // D3D_OK
    });

    this.addMethod('GetTransform', (transformType: number) => {
      switch (transformType) {
        case 256:
          return this._worldMatrix;
        case 2:
          return this._viewMatrix;
        case 3:
          return this._projectionMatrix;
        default:
          return this.createIdentityMatrix();
      }
    });

    this.addMethod('MultiplyTransform', (transformType: number, matrix: D3DMATRIX) => {
      const current = this.getMethod('GetTransform')(transformType);
      const result = this.multiplyMatrices(current, matrix);
      this.getMethod('SetTransform')(transformType, result);
      return 0; // D3D_OK
    });

    this.addMethod('SetRenderState', (state: D3DRENDERSTATETYPE, value: any) => {
      this._renderStates.set(state, value);

      // Handle specific render states
      if (state === D3DRENDERSTATETYPE.D3DRS_LIGHTING) {
        this._lighting = !!value;
      } else if (state === D3DRENDERSTATETYPE.D3DRS_ZENABLE) {
        this._zbuffer = !!value;
      }

      return 0; // D3D_OK
    });

    this.addMethod('GetRenderState', (state: D3DRENDERSTATETYPE) => {
      return this._renderStates.get(state);
    });

    this.addMethod(
      'DrawPrimitive',
      (
        primitiveType: D3DPRIMITIVETYPE,
        vertexType: number,
        vertices: D3DVERTEX[],
        vertexCount: number,
        flags: number
      ) => {
        // Simplified primitive drawing using canvas
        if (this._renderTarget && this._renderTarget.Context) {
          const ctx = this._renderTarget.Context;
          ctx.beginPath();

          switch (primitiveType) {
            case D3DPRIMITIVETYPE.D3DPT_TRIANGLELIST:
              this.drawTriangles(ctx, vertices, vertexCount);
              break;
            case D3DPRIMITIVETYPE.D3DPT_LINELIST:
              this.drawLines(ctx, vertices, vertexCount);
              break;
            case D3DPRIMITIVETYPE.D3DPT_POINTLIST:
              this.drawPoints(ctx, vertices, vertexCount);
              break;
          }

          ctx.stroke();
        }
        return 0; // D3D_OK
      }
    );

    this.addMethod(
      'DrawIndexedPrimitive',
      (
        primitiveType: D3DPRIMITIVETYPE,
        vertexType: number,
        vertices: D3DVERTEX[],
        vertexCount: number,
        indices: number[],
        indexCount: number,
        flags: number
      ) => {
        // Draw indexed primitives
        const indexedVertices: D3DVERTEX[] = [];
        for (let i = 0; i < indexCount; i++) {
          indexedVertices.push(vertices[indices[i]]);
        }

        return this.getMethod('DrawPrimitive')(
          primitiveType,
          vertexType,
          indexedVertices,
          indexCount,
          flags
        );
      }
    );

    this.addMethod('SetTexture', (stage: number, texture: any) => {
      // Set texture for texture stage (simplified)
      return 0; // D3D_OK
    });

    this.addMethod('GetTexture', (stage: number) => {
      return null; // Simplified
    });

    this.addMethod('SetLight', (index: number, light: any) => {
      // Set light properties (simplified)
      return 0; // D3D_OK
    });

    this.addMethod('GetLight', (index: number) => {
      return null; // Simplified
    });

    this.addMethod('LightEnable', (index: number, enable: boolean) => {
      // Enable/disable light (simplified)
      return 0; // D3D_OK
    });

    this.addMethod('SetMaterial', (material: any) => {
      // Set material properties (simplified)
      return 0; // D3D_OK
    });

    this.addMethod('GetMaterial', () => {
      return null; // Simplified
    });
  }

  private createIdentityMatrix(): D3DMATRIX {
    return {
      _11: 1,
      _12: 0,
      _13: 0,
      _14: 0,
      _21: 0,
      _22: 1,
      _23: 0,
      _24: 0,
      _31: 0,
      _32: 0,
      _33: 1,
      _34: 0,
      _41: 0,
      _42: 0,
      _43: 0,
      _44: 1,
    };
  }

  private multiplyMatrices(a: D3DMATRIX, b: D3DMATRIX): D3DMATRIX {
    return {
      _11: a._11 * b._11 + a._12 * b._21 + a._13 * b._31 + a._14 * b._41,
      _12: a._11 * b._12 + a._12 * b._22 + a._13 * b._32 + a._14 * b._42,
      _13: a._11 * b._13 + a._12 * b._23 + a._13 * b._33 + a._14 * b._43,
      _14: a._11 * b._14 + a._12 * b._24 + a._13 * b._34 + a._14 * b._44,
      _21: a._21 * b._11 + a._22 * b._21 + a._23 * b._31 + a._24 * b._41,
      _22: a._21 * b._12 + a._22 * b._22 + a._23 * b._32 + a._24 * b._42,
      _23: a._21 * b._13 + a._22 * b._23 + a._23 * b._33 + a._24 * b._43,
      _24: a._21 * b._14 + a._22 * b._24 + a._23 * b._34 + a._24 * b._44,
      _31: a._31 * b._11 + a._32 * b._21 + a._33 * b._31 + a._34 * b._41,
      _32: a._31 * b._12 + a._32 * b._22 + a._33 * b._32 + a._34 * b._42,
      _33: a._31 * b._13 + a._32 * b._23 + a._33 * b._33 + a._34 * b._43,
      _34: a._31 * b._14 + a._32 * b._24 + a._33 * b._34 + a._34 * b._44,
      _41: a._41 * b._11 + a._42 * b._21 + a._43 * b._31 + a._44 * b._41,
      _42: a._41 * b._12 + a._42 * b._22 + a._43 * b._32 + a._44 * b._42,
      _43: a._41 * b._13 + a._42 * b._23 + a._43 * b._33 + a._44 * b._43,
      _44: a._41 * b._14 + a._42 * b._24 + a._43 * b._34 + a._44 * b._44,
    };
  }

  private initializeRenderStates(): void {
    this._renderStates.set(D3DRENDERSTATETYPE.D3DRS_ZENABLE, true);
    this._renderStates.set(D3DRENDERSTATETYPE.D3DRS_LIGHTING, true);
    this._renderStates.set(D3DRENDERSTATETYPE.D3DRS_CULLMODE, 2); // CCW
    this._renderStates.set(D3DRENDERSTATETYPE.D3DRS_SHADEMODE, 2); // Gouraud
    this._renderStates.set(D3DRENDERSTATETYPE.D3DRS_FILLMODE, 3); // Solid
  }

  private drawTriangles(
    ctx: CanvasRenderingContext2D,
    vertices: D3DVERTEX[],
    vertexCount: number
  ): void {
    for (let i = 0; i < vertexCount; i += 3) {
      const v1 = this.projectVertex(vertices[i]);
      const v2 = this.projectVertex(vertices[i + 1]);
      const v3 = this.projectVertex(vertices[i + 2]);

      ctx.moveTo(v1.x, v1.y);
      ctx.lineTo(v2.x, v2.y);
      ctx.lineTo(v3.x, v3.y);
      ctx.closePath();
    }
  }

  private drawLines(
    ctx: CanvasRenderingContext2D,
    vertices: D3DVERTEX[],
    vertexCount: number
  ): void {
    for (let i = 0; i < vertexCount; i += 2) {
      const v1 = this.projectVertex(vertices[i]);
      const v2 = this.projectVertex(vertices[i + 1]);

      ctx.moveTo(v1.x, v1.y);
      ctx.lineTo(v2.x, v2.y);
    }
  }

  private drawPoints(
    ctx: CanvasRenderingContext2D,
    vertices: D3DVERTEX[],
    vertexCount: number
  ): void {
    for (let i = 0; i < vertexCount; i++) {
      const v = this.projectVertex(vertices[i]);
      ctx.rect(v.x - 1, v.y - 1, 2, 2);
    }
  }

  private projectVertex(vertex: D3DVERTEX): { x: number; y: number } {
    // Simplified vertex projection
    const x = ((vertex.x + 1) * this._viewport.width) / 2 + this._viewport.x;
    const y = ((1 - vertex.y) * this._viewport.height) / 2 + this._viewport.y;
    return { x, y };
  }

  get RenderTarget(): DirectDrawSurface | null {
    return this._renderTarget;
  }
  get Viewport() {
    return this._viewport;
  }
  get WorldMatrix(): D3DMATRIX {
    return this._worldMatrix;
  }
  get ViewMatrix(): D3DMATRIX {
    return this._viewMatrix;
  }
  get ProjectionMatrix(): D3DMATRIX {
    return this._projectionMatrix;
  }
}

// Direct3D Implementation
export class Direct3D extends COMObject {
  private _devices: Direct3DDevice[] = [];
  private _adapters: any[] = [];

  constructor() {
    super('{DIRECT3D-CLSID}', 'Direct3D');
    this.setupDirect3DMethods();
    this.initializeAdapters();
  }

  private setupDirect3DMethods(): void {
    this.addMethod('Initialize', () => {
      return 0; // D3D_OK
    });

    this.addMethod('EnumDevices', (callback: (device: any, context: any) => void, context: any) => {
      // Enumerate 3D devices
      const devices = [
        {
          guid: '{D7B71E3E-4340-11CF-B063-0020AFC2CD35}',
          description: 'Software Rasterizer',
          name: 'RGB Software Emulation',
          hardware: false,
        },
        {
          guid: '{D7B71EE0-4340-11CF-B063-0020AFC2CD35}',
          description: 'Hardware Accelerated',
          name: 'Hardware T&L',
          hardware: true,
        },
      ];

      devices.forEach(device => {
        const deviceDesc = {
          dwSize: 164,
          guid: device.guid,
          lpszDeviceDesc: device.description,
          lpszDeviceName: device.name,
          dcmColorModel: 1,
          dwDevCaps: 0x1ff,
          dtcTransformCaps: { dwSize: 32, dwCaps: 0xffff },
          bClipping: true,
          dlcLightingCaps: { dwSize: 16, dwCaps: 0xff, dwLightingModel: 1, dwNumLights: 8 },
          dpcLineCaps: { dwSize: 88, dwMiscCaps: 0xff, dwRasterCaps: 0xff, dwZCmpCaps: 0xff },
          dpcTriCaps: { dwSize: 88, dwMiscCaps: 0xff, dwRasterCaps: 0xff, dwZCmpCaps: 0xff },
        };
        callback(deviceDesc, context);
      });

      return 0; // D3D_OK
    });

    this.addMethod(
      'CreateDevice',
      (deviceGuid: string, surface: DirectDrawSurface, device?: Direct3DDevice) => {
        const newDevice = new Direct3DDevice();
        newDevice.getMethod('SetRenderTarget')(surface);
        this._devices.push(newDevice);
        return newDevice;
      }
    );

    this.addMethod('CreateViewport', (viewport?: any) => {
      return {
        dwSize: 32,
        dwX: 0,
        dwY: 0,
        dwWidth: 640,
        dwHeight: 480,
        dvScaleX: 320.0,
        dvScaleY: 240.0,
        dvMaxX: 1.0,
        dvMaxY: 1.0,
        dvMinZ: 0.0,
        dvMaxZ: 1.0,
      };
    });

    this.addMethod('CreateLight', (light?: any) => {
      return {
        dwSize: 88,
        dltType: 1, // D3DLIGHT_DIRECTIONAL
        dcvDiffuse: { r: 1.0, g: 1.0, b: 1.0, a: 1.0 },
        dcvSpecular: { r: 1.0, g: 1.0, b: 1.0, a: 1.0 },
        dcvAmbient: { r: 0.2, g: 0.2, b: 0.2, a: 1.0 },
        dvPosition: { x: 0.0, y: 10.0, z: 0.0 },
        dvDirection: { x: 0.0, y: -1.0, z: 0.0 },
        dvRange: 1000.0,
        dvFalloff: 1.0,
        dvAttenuation0: 1.0,
        dvAttenuation1: 0.0,
        dvAttenuation2: 0.0,
        dvTheta: 0.0,
        dvPhi: 0.0,
      };
    });

    this.addMethod('CreateMaterial', (material?: any) => {
      return {
        dwSize: 64,
        dcvDiffuse: { r: 0.8, g: 0.8, b: 0.8, a: 1.0 },
        dcvAmbient: { r: 0.2, g: 0.2, b: 0.2, a: 1.0 },
        dcvSpecular: { r: 1.0, g: 1.0, b: 1.0, a: 1.0 },
        dcvEmissive: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
        dvPower: 20.0,
        hTexture: null,
        dwRampSize: 256,
      };
    });

    this.addMethod('CreateTexture', (surface: DirectDrawSurface, texture?: any) => {
      return {
        surface: surface,
        dwSize: 20,
        dwCaps: 0x1000, // D3DTEXTURECAPS_PERSPECTIVE
        dwWidth: surface.Width,
        dwHeight: surface.Height,
      };
    });

    this.addMethod('FindDevice', (findDevice: any) => {
      return {
        dwSize: 164,
        guid: '{D7B71EE0-4340-11CF-B063-0020AFC2CD35}',
        lpszDeviceDesc: 'Hardware Accelerated',
        lpszDeviceName: 'Hardware T&L',
        dcmColorModel: 1,
        dwDevCaps: 0x1ff,
        dtcTransformCaps: { dwSize: 32, dwCaps: 0xffff },
        bClipping: true,
        dlcLightingCaps: { dwSize: 16, dwCaps: 0xff, dwLightingModel: 1, dwNumLights: 8 },
      };
    });
  }

  private initializeAdapters(): void {
    this._adapters = [
      {
        ordinal: 0,
        identifier: {
          Driver: 'Browser WebGL',
          Description: 'WebGL Graphics Adapter',
          DeviceName: '\\\\.\\DISPLAY1',
          DriverVersion: { HighPart: 1, LowPart: 0 },
          VendorId: 0x1414,
          DeviceId: 0x008c,
          SubSysId: 0,
          Revision: 0,
          DeviceIdentifier: '{12345678-1234-1234-1234-123456789012}',
          WHQLLevel: 1,
        },
      },
    ];
  }

  get Devices(): Direct3DDevice[] {
    return this._devices;
  }
  get Adapters(): any[] {
    return this._adapters;
  }
}

// DirectPlay Implementation (Simplified for Networking)
export class DirectPlay extends COMObject {
  private _sessionInfo: any = null;
  private _playerInfo: Map<number, any> = new Map();
  private _connectionInfo: any = null;
  private _localPlayerID: number = 0;
  private _isHost: boolean = false;
  private _webSocket: WebSocket | null = null;

  constructor() {
    super('{DIRECTPLAY-CLSID}', 'DirectPlay');
    this.setupDirectPlayMethods();
  }

  private setupDirectPlayMethods(): void {
    this.addMethod('Initialize', (guid?: string) => {
      return 0; // DP_OK
    });

    this.addMethod(
      'EnumConnections',
      (callback: (connection: any, context: any) => void, context: any, flags: number) => {
        // Enumerate available connection types
        const connections = [
          {
            dwSize: 80,
            dwFlags: 0,
            guid: '{36E95EE0-8577-11CF-960C-0080C7534E83}',
            lpszName: 'WebSocket Connection',
            lpszLocalName: 'Local WebSocket',
          },
          {
            dwSize: 80,
            dwFlags: 0,
            guid: '{685BC400-9D2C-11CF-A9CD-00AA006886E3}',
            lpszName: 'HTTP Connection',
            lpszLocalName: 'Local HTTP',
          },
        ];

        connections.forEach(conn => callback(conn, context));
        return 0; // DP_OK
      }
    );

    this.addMethod('InitializeConnection', (connectionData: any, flags: number) => {
      this._connectionInfo = connectionData;
      return 0; // DP_OK
    });

    this.addMethod(
      'EnumSessions',
      (
        sessionDesc: any,
        timeout: number,
        callback: (session: any, context: any) => void,
        context: any,
        flags: number
      ) => {
        // Enumerate available sessions (simplified)
        const sessions = [
          {
            dwSize: 80,
            dwFlags: 0,
            guidInstance: '{12345678-1234-1234-1234-123456789012}',
            guidApplication: '{87654321-4321-4321-4321-210987654321}',
            dwMaxPlayers: 8,
            dwCurrentPlayers: 2,
            lpszSessionNameA: 'Test Game Session',
            lpszPasswordA: '',
            dwReserved1: 0,
            dwReserved2: 0,
            dwUser1: 0,
            dwUser2: 0,
            dwUser3: 0,
            dwUser4: 0,
          },
        ];

        sessions.forEach(session => callback(session, context, flags));
        return 0; // DP_OK
      }
    );

    this.addMethod('Open', (sessionDesc: any, flags: number) => {
      this._sessionInfo = sessionDesc;
      this._isHost = !!(flags & 0x1); // DPOPEN_CREATE

      // Simulate network connection
      if (sessionDesc.lpszSessionNameA && sessionDesc.lpszSessionNameA.includes('ws://')) {
        try {
          this._webSocket = new WebSocket(sessionDesc.lpszSessionNameA);
          this._webSocket.onopen = () => {
            this.fireEvent('Connected', { session: sessionDesc });
          };
          this._webSocket.onmessage = event => {
            this.fireEvent('MessageReceived', { data: event.data });
          };
          this._webSocket.onclose = () => {
            this.fireEvent('Disconnected', {});
          };
        } catch (error) {
          console.warn('WebSocket connection failed:', error);
        }
      }

      return 0; // DP_OK
    });

    this.addMethod('Close', () => {
      if (this._webSocket) {
        this._webSocket.close();
        this._webSocket = null;
      }
      this._sessionInfo = null;
      this._playerInfo.clear();
      this._localPlayerID = 0;
      this._isHost = false;
      return 0; // DP_OK
    });

    this.addMethod(
      'CreatePlayer',
      (playerID: number, playerName: string, event?: any, data?: any) => {
        const player = {
          dwID: playerID,
          dwFlags: 0,
          lpszShortNameA: playerName,
          lpszLongNameA: playerName,
          lpData: data,
        };

        this._playerInfo.set(playerID, player);
        if (this._localPlayerID === 0) {
          this._localPlayerID = playerID;
        }

        this.fireEvent('PlayerCreated', { player });
        return 0; // DP_OK
      }
    );

    this.addMethod('DestroyPlayer', (playerID: number) => {
      const player = this._playerInfo.get(playerID);
      if (player) {
        this._playerInfo.delete(playerID);
        this.fireEvent('PlayerDestroyed', { player });
        return 0; // DP_OK
      }
      return 0x80158110; // DPERR_INVALIDPLAYER
    });

    this.addMethod(
      'EnumPlayers',
      (
        callback: (id: number, playerType: number, player: any, context: any) => void,
        context: any,
        flags: number
      ) => {
        for (const [id, player] of this._playerInfo) {
          callback(id, 0, player, context);
        }
        return 0; // DP_OK
      }
    );

    this.addMethod('Send', (fromPlayerID: number, toPlayerID: number, flags: number, data: any) => {
      if (this._webSocket && this._webSocket.readyState === WebSocket.OPEN) {
        const message = {
          from: fromPlayerID,
          to: toPlayerID,
          flags: flags,
          data: data,
          timestamp: Date.now(),
        };
        this._webSocket.send(JSON.stringify(message));
        return 0; // DP_OK
      }
      return 0x80158050; // DPERR_GENERIC
    });

    this.addMethod(
      'Receive',
      (fromPlayerID: number, toPlayerID: number, flags: number, data: any) => {
        // Simplified receive - in real implementation would return queued messages
        return 0; // DP_OK
      }
    );

    this.addMethod('GetCaps', () => {
      return {
        dwSize: 40,
        dwFlags: 0,
        dwMaxBufferSize: 65536,
        dwMaxQueueSize: 256,
        dwMaxPlayers: 32,
        dwHundredBaud: 28800,
        dwLatency: 100,
        dwMaxLocalPlayers: 8,
        dwHeaderLength: 16,
        dwTimeout: 5000,
      };
    });

    this.addMethod('GetPlayerCaps', (playerID: number) => {
      return {
        dwSize: 16,
        dwFlags: 0,
        dwLatency: 50,
        dwBandwidth: 56000,
        dwMaxQueueSize: 64,
      };
    });

    this.addMethod('SetPlayerData', (playerID: number, data: any, flags: number) => {
      const player = this._playerInfo.get(playerID);
      if (player) {
        player.lpData = data;
        return 0; // DP_OK
      }
      return 0x80158110; // DPERR_INVALIDPLAYER
    });

    this.addMethod('GetPlayerData', (playerID: number) => {
      const player = this._playerInfo.get(playerID);
      return player ? player.lpData : null;
    });
  }

  get SessionInfo(): any {
    return this._sessionInfo;
  }
  get Players(): Map<number, any> {
    return this._playerInfo;
  }
  get LocalPlayerID(): number {
    return this._localPlayerID;
  }
  get IsHost(): boolean {
    return this._isHost;
  }
  get WebSocket(): WebSocket | null {
    return this._webSocket;
  }
}

// Register DirectX classes with COM registry
const registry = COM['_registry'] || COM;

// Register DirectDraw
registry.registerClass(
  '{D7B70EE0-4340-11CF-B063-0020AFC2CD35}',
  'DirectDraw',
  class extends DirectDraw {
    constructor() {
      super();
    }
  }
);

// Register DirectSound
registry.registerClass(
  '{47D4D946-62E8-11CF-93BC-444553540000}',
  'DirectSound',
  class extends DirectSound {
    constructor() {
      super();
    }
  }
);

// Register DirectInput
registry.registerClass(
  '{25E609E4-B259-11CF-BFC7-444553540000}',
  'DirectInput',
  class extends DirectInput {
    constructor() {
      super();
    }
  }
);

// Register Direct3D
registry.registerClass(
  '{3BBA0080-2421-11CF-A31A-00AA00B93356}',
  'Direct3D',
  class extends Direct3D {
    constructor() {
      super();
    }
  }
);

// Register DirectPlay
registry.registerClass(
  '{5454E9A0-DB65-11CE-921C-00AA006C4972}',
  'DirectPlay',
  class extends DirectPlay {
    constructor() {
      super();
    }
  }
);

// Export main DirectX objects
export const DirectX = {
  DirectDraw: () => new DirectDraw(),
  DirectSound: () => new DirectSound(),
  DirectInput: () => new DirectInput(),
  Direct3D: () => new Direct3D(),
  DirectPlay: () => new DirectPlay(),
};

export {
  DirectDraw,
  DirectSound,
  DirectInput,
  Direct3D,
  DirectPlay,
  DirectDrawSurface,
  DirectSoundBuffer,
  DirectInputDevice,
  Direct3DDevice,
};

export default DirectX;
