import { EventEmitter } from 'events';

// TAPI Constants
export enum TAPIVersion {
  TAPI_VERSION_1_0 = 0x00010003,
  TAPI_VERSION_1_4 = 0x00010004,
  TAPI_VERSION_2_0 = 0x00020000,
  TAPI_VERSION_2_1 = 0x00020001,
  TAPI_VERSION_2_2 = 0x00020002,
  TAPI_VERSION_3_0 = 0x00030000,
  TAPI_VERSION_3_1 = 0x00030001
}

export enum TAPILineState {
  LINEDEVSTATE_OTHER = 0x00000001,
  LINEDEVSTATE_RINGING = 0x00000002,
  LINEDEVSTATE_CONNECTED = 0x00000004,
  LINEDEVSTATE_DISCONNECTED = 0x00000008,
  LINEDEVSTATE_MSGWAITON = 0x00000010,
  LINEDEVSTATE_MSGWAITOFF = 0x00000020,
  LINEDEVSTATE_INSERVICE = 0x00000040,
  LINEDEVSTATE_OUTOFSERVICE = 0x00000080,
  LINEDEVSTATE_MAINTENANCE = 0x00000100,
  LINEDEVSTATE_OPEN = 0x00000200,
  LINEDEVSTATE_CLOSE = 0x00000400
}

export enum TAPICallState {
  LINECALLSTATE_IDLE = 0x00000001,
  LINECALLSTATE_OFFERING = 0x00000002,
  LINECALLSTATE_ACCEPTED = 0x00000004,
  LINECALLSTATE_DIALTONE = 0x00000008,
  LINECALLSTATE_DIALING = 0x00000010,
  LINECALLSTATE_RINGBACK = 0x00000020,
  LINECALLSTATE_BUSY = 0x00000040,
  LINECALLSTATE_SPECIALINFO = 0x00000080,
  LINECALLSTATE_CONNECTED = 0x00000100,
  LINECALLSTATE_PROCEEDING = 0x00000200,
  LINECALLSTATE_ONHOLD = 0x00000400,
  LINECALLSTATE_CONFERENCED = 0x00000800,
  LINECALLSTATE_ONHOLDPENDCONF = 0x00001000,
  LINECALLSTATE_ONHOLDPENDTRANSFER = 0x00002000,
  LINECALLSTATE_DISCONNECTED = 0x00004000,
  LINECALLSTATE_UNKNOWN = 0x00008000
}

export enum TAPIMediaMode {
  LINEMEDIAMODE_UNKNOWN = 0x00000001,
  LINEMEDIAMODE_INTERACTIVEVOICE = 0x00000002,
  LINEMEDIAMODE_AUTOMATEDVOICE = 0x00000004,
  LINEMEDIAMODE_DATAMODEM = 0x00000008,
  LINEMEDIAMODE_G3FAX = 0x00000010,
  LINEMEDIAMODE_TDD = 0x00000020,
  LINEMEDIAMODE_G4FAX = 0x00000040,
  LINEMEDIAMODE_DIGITALDATA = 0x00000080,
  LINEMEDIAMODE_TELETEX = 0x00000100,
  LINEMEDIAMODE_VIDEOTEX = 0x00000200,
  LINEMEDIAMODE_TELEX = 0x00000400,
  LINEMEDIAMODE_MIXED = 0x00000800,
  LINEMEDIAMODE_ADSI = 0x00001000,
  LINEMEDIAMODE_VOICEVIEW = 0x00002000
}

export enum TAPIBearerMode {
  LINEBEARERMODE_VOICE = 0x00000001,
  LINEBEARERMODE_SPEECH = 0x00000002,
  LINEBEARERMODE_MULTIUSE = 0x00000004,
  LINEBEARERMODE_DATA = 0x00000008,
  LINEBEARERMODE_ALTSPEECHDATA = 0x00000010,
  LINEBEARERMODE_NONCALLSIGNALING = 0x00000020,
  LINEBEARERMODE_PASSTHROUGH = 0x00000040
}

export enum TAPIErrorCode {
  TAPI_SUCCESS = 0,
  LINEERR_INVALAPPHANDLE = 0x80000001,
  LINEERR_RESOURCEUNAVAIL = 0x80000002,
  LINEERR_INVALPOINTER = 0x80000003,
  LINEERR_INVALHANDLE = 0x80000004,
  LINEERR_INVALADDRESS = 0x80000005,
  LINEERR_INVALCALLHANDLE = 0x80000006,
  LINEERR_OPERATIONFAILED = 0x80000007,
  LINEERR_NOMEM = 0x80000008,
  LINEERR_NOTOWNER = 0x80000009,
  LINEERR_INVALRATE = 0x8000000A,
  LINEERR_INVALMEDIAMODE = 0x8000000B,
  LINEERR_INUSE = 0x8000000C,
  LINEERR_INVALLINESTATE = 0x8000000D,
  LINEERR_INVALCALLSTATE = 0x8000000E,
  LINEERR_LINEMAPPERFAILED = 0x8000000F
}

// TAPI Structures
export interface TAPILineDevCaps {
  dwTotalSize: number;
  dwNeededSize: number;
  dwUsedSize: number;
  dwProviderInfoSize: number;
  dwProviderInfoOffset: number;
  dwSwitchInfoSize: number;
  dwSwitchInfoOffset: number;
  dwPermanentLineID: number;
  dwLineNameSize: number;
  dwLineNameOffset: number;
  dwStringFormat: number;
  dwAddressModes: number;
  dwNumAddresses: number;
  dwBearerModes: number;
  dwMaxRate: number;
  dwMediaModes: number;
  LineName?: string;
  ProviderInfo?: string;
}

export interface TAPILineInfo {
  dwTotalSize: number;
  dwNeededSize: number;
  dwUsedSize: number;
  hLine: number;
  dwLineDeviceID: number;
  dwAddressID: number;
  dwBearerMode: TAPIBearerMode;
  dwRate: number;
  dwMediaMode: TAPIMediaMode;
  dwCallStates: number;
  dwNumActiveCalls: number;
  dwNumOnHoldCalls: number;
  dwNumOnHoldPendingCalls: number;
  dwNumCallCompletions: number;
  dwRingMode: number;
  dwSignalLevel: number;
  dwBatteryLevel: number;
  dwRoamMode: number;
}

export interface TAPICallInfo {
  dwTotalSize: number;
  dwNeededSize: number;
  dwUsedSize: number;
  hLine: number;
  dwLineDeviceID: number;
  dwAddressID: number;
  dwBearerMode: TAPIBearerMode;
  dwRate: number;
  dwMediaMode: TAPIMediaMode;
  dwCallStates: TAPICallState;
  dwMonitorDigitModes: number;
  dwMonitorMediaModes: number;
  dwOrigin: number;
  dwReason: number;
  dwCompletionID: number;
  dwCountryCode: number;
  dwTrunk: number;
  dwCallerIDFlags: number;
  dwCallerIDSize: number;
  dwCallerIDOffset: number;
  dwCallerIDNameSize: number;
  dwCallerIDNameOffset: number;
  dwConnectedIDFlags: number;
  dwConnectedIDSize: number;
  dwConnectedIDOffset: number;
  dwConnectedIDNameSize: number;
  dwConnectedIDNameOffset: number;
  CallerID?: string;
  CallerIDName?: string;
  ConnectedID?: string;
  ConnectedIDName?: string;
}

// Line Device
export interface TAPILine {
  hLine: number;
  dwDeviceID: number;
  dwAddressID: number;
  state: TAPILineState;
  caps: TAPILineDevCaps;
  info: TAPILineInfo;
  calls: Map<number, TAPICall>;
}

// Call Handle
export interface TAPICall {
  hCall: number;
  hLine: number;
  dwCallID: number;
  state: TAPICallState;
  info: TAPICallInfo;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
}

// Phone Device
export interface TAPIPhone {
  hPhone: number;
  dwDeviceID: number;
  state: number;
  caps: any;
}

export class TAPI extends EventEmitter {
  private static instance: TAPI;
  private initialized = false;
  private hLineApp = 0;
  private hPhoneApp = 0;
  private lines: Map<number, TAPILine> = new Map();
  private phones: Map<number, TAPIPhone> = new Map();
  private calls: Map<number, TAPICall> = new Map();
  private nextLineHandle = 1;
  private nextPhoneHandle = 1;
  private nextCallHandle = 1;
  
  // WebRTC support for modern telephony
  private peerConnections: Map<number, RTCPeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  
  private constructor() {
    super();
  }
  
  public static getInstance(): TAPI {
    if (!TAPI.instance) {
      TAPI.instance = new TAPI();
    }
    return TAPI.instance;
  }
  
  // lineInitialize - Initialize TAPI line devices
  public lineInitialize(
    appName: string,
    dwAPIVersion: TAPIVersion,
    dwNumDevs: { value: number }
  ): TAPIErrorCode {
    try {
      if (this.initialized) {
        return TAPIErrorCode.TAPI_SUCCESS;
      }
      
      this.hLineApp = Date.now();
      this.initialized = true;
      
      // Simulate available line devices
      this.createSimulatedDevices();
      
      dwNumDevs.value = this.lines.size;
      
      this.emit('lineInitialize', { appName, version: dwAPIVersion, numDevices: dwNumDevs.value });
      return TAPIErrorCode.TAPI_SUCCESS;
    } catch (error) {
      this.emit('error', error);
      return TAPIErrorCode.LINEERR_OPERATIONFAILED;
    }
  }
  
  // lineShutdown - Shutdown TAPI
  public lineShutdown(): TAPIErrorCode {
    try {
      if (!this.initialized) {
        return TAPIErrorCode.LINEERR_INVALAPPHANDLE;
      }
      
      // Close all open lines
      this.lines.forEach(line => {
        this.lineClose(line.hLine);
      });
      
      // Close all peer connections
      this.peerConnections.forEach(pc => pc.close());
      this.peerConnections.clear();
      
      // Stop local stream
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop());
        this.localStream = null;
      }
      
      this.initialized = false;
      this.hLineApp = 0;
      
      this.emit('lineShutdown');
      return TAPIErrorCode.TAPI_SUCCESS;
    } catch (error) {
      this.emit('error', error);
      return TAPIErrorCode.LINEERR_OPERATIONFAILED;
    }
  }
  
  // lineOpen - Open a line device
  public lineOpen(
    dwDeviceID: number,
    dwMediaModes: TAPIMediaMode,
    dwCallbackInstance: number
  ): { hLine: number; errorCode: TAPIErrorCode } {
    try {
      if (!this.initialized) {
        return { hLine: 0, errorCode: TAPIErrorCode.LINEERR_INVALAPPHANDLE };
      }
      
      const hLine = this.nextLineHandle++;
      const line: TAPILine = {
        hLine,
        dwDeviceID,
        dwAddressID: 0,
        state: TAPILineState.LINEDEVSTATE_OPEN,
        caps: this.getLineDevCaps(dwDeviceID),
        info: this.createLineInfo(hLine, dwDeviceID),
        calls: new Map()
      };
      
      this.lines.set(hLine, line);
      
      this.emit('lineOpen', { hLine, deviceID: dwDeviceID });
      return { hLine, errorCode: TAPIErrorCode.TAPI_SUCCESS };
    } catch (error) {
      this.emit('error', error);
      return { hLine: 0, errorCode: TAPIErrorCode.LINEERR_OPERATIONFAILED };
    }
  }
  
  // lineClose - Close a line device
  public lineClose(hLine: number): TAPIErrorCode {
    try {
      const line = this.lines.get(hLine);
      if (!line) {
        return TAPIErrorCode.LINEERR_INVALHANDLE;
      }
      
      // Drop all calls on this line
      line.calls.forEach(call => {
        this.lineDrop(call.hCall, null, 0);
      });
      
      line.state = TAPILineState.LINEDEVSTATE_CLOSE;
      this.lines.delete(hLine);
      
      this.emit('lineClose', { hLine });
      return TAPIErrorCode.TAPI_SUCCESS;
    } catch (error) {
      this.emit('error', error);
      return TAPIErrorCode.LINEERR_OPERATIONFAILED;
    }
  }
  
  // lineMakeCall - Make an outgoing call
  public async lineMakeCall(
    hLine: number,
    dwDestAddress: string,
    dwCountryCode: number
  ): Promise<{ hCall: number; errorCode: TAPIErrorCode }> {
    try {
      const line = this.lines.get(hLine);
      if (!line) {
        return { hCall: 0, errorCode: TAPIErrorCode.LINEERR_INVALHANDLE };
      }
      
      const hCall = this.nextCallHandle++;
      const call: TAPICall = {
        hCall,
        hLine,
        dwCallID: hCall,
        state: TAPICallState.LINECALLSTATE_DIALING,
        info: this.createCallInfo(hCall, hLine, dwDestAddress),
        startTime: new Date()
      };
      
      this.calls.set(hCall, call);
      line.calls.set(hCall, call);
      
      // Simulate call progress
      setTimeout(() => {
        call.state = TAPICallState.LINECALLSTATE_RINGBACK;
        this.emit('callStateChange', { hCall, state: call.state });
      }, 1000);
      
      setTimeout(() => {
        call.state = TAPICallState.LINECALLSTATE_CONNECTED;
        this.emit('callStateChange', { hCall, state: call.state });
      }, 3000);
      
      // Try to establish WebRTC connection if supported
      if (this.isWebRTCSupported()) {
        await this.establishWebRTCCall(hCall, dwDestAddress);
      }
      
      this.emit('lineMakeCall', { hCall, hLine, destination: dwDestAddress });
      return { hCall, errorCode: TAPIErrorCode.TAPI_SUCCESS };
    } catch (error) {
      this.emit('error', error);
      return { hCall: 0, errorCode: TAPIErrorCode.LINEERR_OPERATIONFAILED };
    }
  }
  
  // lineAnswer - Answer an incoming call
  public async lineAnswer(hCall: number, userInfo: string | null, dwSize: number): Promise<TAPIErrorCode> {
    try {
      const call = this.calls.get(hCall);
      if (!call) {
        return TAPIErrorCode.LINEERR_INVALCALLHANDLE;
      }
      
      if (call.state !== TAPICallState.LINECALLSTATE_OFFERING) {
        return TAPIErrorCode.LINEERR_INVALCALLSTATE;
      }
      
      call.state = TAPICallState.LINECALLSTATE_CONNECTED;
      call.startTime = new Date();
      
      // Get user media if WebRTC is supported
      if (this.isWebRTCSupported()) {
        await this.getUserMedia();
      }
      
      this.emit('lineAnswer', { hCall });
      this.emit('callStateChange', { hCall, state: call.state });
      
      return TAPIErrorCode.TAPI_SUCCESS;
    } catch (error) {
      this.emit('error', error);
      return TAPIErrorCode.LINEERR_OPERATIONFAILED;
    }
  }
  
  // lineDrop - Drop a call
  public lineDrop(hCall: number, userInfo: string | null, dwSize: number): TAPIErrorCode {
    try {
      const call = this.calls.get(hCall);
      if (!call) {
        return TAPIErrorCode.LINEERR_INVALCALLHANDLE;
      }
      
      call.state = TAPICallState.LINECALLSTATE_DISCONNECTED;
      call.endTime = new Date();
      call.duration = call.startTime ? 
        (call.endTime.getTime() - call.startTime.getTime()) / 1000 : 0;
      
      // Close WebRTC connection if exists
      const pc = this.peerConnections.get(hCall);
      if (pc) {
        pc.close();
        this.peerConnections.delete(hCall);
      }
      
      // Remove from line
      const line = this.lines.get(call.hLine);
      if (line) {
        line.calls.delete(hCall);
      }
      
      this.emit('lineDrop', { hCall, duration: call.duration });
      this.emit('callStateChange', { hCall, state: call.state });
      
      // Clean up after a delay
      setTimeout(() => {
        this.calls.delete(hCall);
      }, 5000);
      
      return TAPIErrorCode.TAPI_SUCCESS;
    } catch (error) {
      this.emit('error', error);
      return TAPIErrorCode.LINEERR_OPERATIONFAILED;
    }
  }
  
  // lineGetDevCaps - Get device capabilities
  public lineGetDevCaps(dwDeviceID: number): { caps: TAPILineDevCaps | null; errorCode: TAPIErrorCode } {
    try {
      const caps = this.getLineDevCaps(dwDeviceID);
      return { caps, errorCode: TAPIErrorCode.TAPI_SUCCESS };
    } catch (error) {
      this.emit('error', error);
      return { caps: null, errorCode: TAPIErrorCode.LINEERR_OPERATIONFAILED };
    }
  }
  
  // lineGetCallInfo - Get call information
  public lineGetCallInfo(hCall: number): { info: TAPICallInfo | null; errorCode: TAPIErrorCode } {
    try {
      const call = this.calls.get(hCall);
      if (!call) {
        return { info: null, errorCode: TAPIErrorCode.LINEERR_INVALCALLHANDLE };
      }
      
      return { info: call.info, errorCode: TAPIErrorCode.TAPI_SUCCESS };
    } catch (error) {
      this.emit('error', error);
      return { info: null, errorCode: TAPIErrorCode.LINEERR_OPERATIONFAILED };
    }
  }
  
  // lineGetCallStatus - Get call status
  public lineGetCallStatus(hCall: number): { state: TAPICallState; errorCode: TAPIErrorCode } {
    try {
      const call = this.calls.get(hCall);
      if (!call) {
        return { state: TAPICallState.LINECALLSTATE_UNKNOWN, errorCode: TAPIErrorCode.LINEERR_INVALCALLHANDLE };
      }
      
      return { state: call.state, errorCode: TAPIErrorCode.TAPI_SUCCESS };
    } catch (error) {
      this.emit('error', error);
      return { state: TAPICallState.LINECALLSTATE_UNKNOWN, errorCode: TAPIErrorCode.LINEERR_OPERATIONFAILED };
    }
  }
  
  // lineDial - Dial additional digits
  public lineDial(hCall: number, dwDestAddress: string): TAPIErrorCode {
    try {
      const call = this.calls.get(hCall);
      if (!call) {
        return TAPIErrorCode.LINEERR_INVALCALLHANDLE;
      }
      
      if (call.state !== TAPICallState.LINECALLSTATE_CONNECTED) {
        return TAPIErrorCode.LINEERR_INVALCALLSTATE;
      }
      
      // Send DTMF tones if WebRTC is available
      const pc = this.peerConnections.get(hCall);
      if (pc && pc.getSenders) {
        const audioSender = pc.getSenders().find(sender => 
          sender.track && sender.track.kind === 'audio'
        );
        
        if (audioSender && audioSender.dtmf) {
          audioSender.dtmf.insertDTMF(dwDestAddress, 100, 50);
        }
      }
      
      this.emit('lineDial', { hCall, digits: dwDestAddress });
      return TAPIErrorCode.TAPI_SUCCESS;
    } catch (error) {
      this.emit('error', error);
      return TAPIErrorCode.LINEERR_OPERATIONFAILED;
    }
  }
  
  // lineHold - Place call on hold
  public lineHold(hCall: number): TAPIErrorCode {
    try {
      const call = this.calls.get(hCall);
      if (!call) {
        return TAPIErrorCode.LINEERR_INVALCALLHANDLE;
      }
      
      if (call.state !== TAPICallState.LINECALLSTATE_CONNECTED) {
        return TAPIErrorCode.LINEERR_INVALCALLSTATE;
      }
      
      call.state = TAPICallState.LINECALLSTATE_ONHOLD;
      
      // Mute audio if WebRTC
      const pc = this.peerConnections.get(hCall);
      if (pc && this.localStream) {
        this.localStream.getAudioTracks().forEach(track => {
          track.enabled = false;
        });
      }
      
      this.emit('lineHold', { hCall });
      this.emit('callStateChange', { hCall, state: call.state });
      
      return TAPIErrorCode.TAPI_SUCCESS;
    } catch (error) {
      this.emit('error', error);
      return TAPIErrorCode.LINEERR_OPERATIONFAILED;
    }
  }
  
  // lineUnhold - Resume held call
  public lineUnhold(hCall: number): TAPIErrorCode {
    try {
      const call = this.calls.get(hCall);
      if (!call) {
        return TAPIErrorCode.LINEERR_INVALCALLHANDLE;
      }
      
      if (call.state !== TAPICallState.LINECALLSTATE_ONHOLD) {
        return TAPIErrorCode.LINEERR_INVALCALLSTATE;
      }
      
      call.state = TAPICallState.LINECALLSTATE_CONNECTED;
      
      // Unmute audio if WebRTC
      const pc = this.peerConnections.get(hCall);
      if (pc && this.localStream) {
        this.localStream.getAudioTracks().forEach(track => {
          track.enabled = true;
        });
      }
      
      this.emit('lineUnhold', { hCall });
      this.emit('callStateChange', { hCall, state: call.state });
      
      return TAPIErrorCode.TAPI_SUCCESS;
    } catch (error) {
      this.emit('error', error);
      return TAPIErrorCode.LINEERR_OPERATIONFAILED;
    }
  }
  
  // Helper methods
  private createSimulatedDevices(): void {
    // Create simulated line devices
    const devices = [
      { id: 0, name: 'Primary Line', bearerModes: TAPIBearerMode.LINEBEARERMODE_VOICE },
      { id: 1, name: 'Data/Fax Line', bearerModes: TAPIBearerMode.LINEBEARERMODE_DATA },
      { id: 2, name: 'VoIP Line', bearerModes: TAPIBearerMode.LINEBEARERMODE_VOICE | TAPIBearerMode.LINEBEARERMODE_DATA }
    ];
    
    devices.forEach(device => {
      const line: TAPILine = {
        hLine: 0, // Not opened yet
        dwDeviceID: device.id,
        dwAddressID: 0,
        state: TAPILineState.LINEDEVSTATE_INSERVICE,
        caps: {
          dwTotalSize: 256,
          dwNeededSize: 256,
          dwUsedSize: 256,
          dwProviderInfoSize: 0,
          dwProviderInfoOffset: 0,
          dwSwitchInfoSize: 0,
          dwSwitchInfoOffset: 0,
          dwPermanentLineID: device.id,
          dwLineNameSize: device.name.length,
          dwLineNameOffset: 0,
          dwStringFormat: 1,
          dwAddressModes: 1,
          dwNumAddresses: 1,
          dwBearerModes: device.bearerModes,
          dwMaxRate: 64000,
          dwMediaModes: TAPIMediaMode.LINEMEDIAMODE_INTERACTIVEVOICE,
          LineName: device.name,
          ProviderInfo: 'VB6 TAPI Provider'
        },
        info: this.createLineInfo(0, device.id),
        calls: new Map()
      };
      
      this.lines.set(device.id, line);
    });
  }
  
  private getLineDevCaps(dwDeviceID: number): TAPILineDevCaps {
    const line = this.lines.get(dwDeviceID);
    return line ? line.caps : {
      dwTotalSize: 0,
      dwNeededSize: 0,
      dwUsedSize: 0,
      dwProviderInfoSize: 0,
      dwProviderInfoOffset: 0,
      dwSwitchInfoSize: 0,
      dwSwitchInfoOffset: 0,
      dwPermanentLineID: dwDeviceID,
      dwLineNameSize: 0,
      dwLineNameOffset: 0,
      dwStringFormat: 0,
      dwAddressModes: 0,
      dwNumAddresses: 0,
      dwBearerModes: 0,
      dwMaxRate: 0,
      dwMediaModes: 0
    };
  }
  
  private createLineInfo(hLine: number, dwDeviceID: number): TAPILineInfo {
    return {
      dwTotalSize: 256,
      dwNeededSize: 256,
      dwUsedSize: 256,
      hLine,
      dwLineDeviceID: dwDeviceID,
      dwAddressID: 0,
      dwBearerMode: TAPIBearerMode.LINEBEARERMODE_VOICE,
      dwRate: 64000,
      dwMediaMode: TAPIMediaMode.LINEMEDIAMODE_INTERACTIVEVOICE,
      dwCallStates: 0xFFFFFFFF, // All call states supported
      dwNumActiveCalls: 0,
      dwNumOnHoldCalls: 0,
      dwNumOnHoldPendingCalls: 0,
      dwNumCallCompletions: 0,
      dwRingMode: 0,
      dwSignalLevel: 100,
      dwBatteryLevel: 100,
      dwRoamMode: 0
    };
  }
  
  private createCallInfo(hCall: number, hLine: number, destAddress: string): TAPICallInfo {
    return {
      dwTotalSize: 512,
      dwNeededSize: 512,
      dwUsedSize: 512,
      hLine,
      dwLineDeviceID: 0,
      dwAddressID: 0,
      dwBearerMode: TAPIBearerMode.LINEBEARERMODE_VOICE,
      dwRate: 64000,
      dwMediaMode: TAPIMediaMode.LINEMEDIAMODE_INTERACTIVEVOICE,
      dwCallStates: TAPICallState.LINECALLSTATE_IDLE,
      dwMonitorDigitModes: 0,
      dwMonitorMediaModes: 0,
      dwOrigin: 1, // Outbound
      dwReason: 0,
      dwCompletionID: 0,
      dwCountryCode: 1,
      dwTrunk: 0,
      dwCallerIDFlags: 0,
      dwCallerIDSize: 0,
      dwCallerIDOffset: 0,
      dwCallerIDNameSize: 0,
      dwCallerIDNameOffset: 0,
      dwConnectedIDFlags: 0,
      dwConnectedIDSize: destAddress.length,
      dwConnectedIDOffset: 0,
      dwConnectedIDNameSize: 0,
      dwConnectedIDNameOffset: 0,
      ConnectedID: destAddress
    };
  }
  
  // WebRTC support
  private isWebRTCSupported(): boolean {
    return !!(
      typeof window !== 'undefined' &&
      window.RTCPeerConnection &&
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia
    );
  }
  
  private async getUserMedia(): Promise<MediaStream | null> {
    if (!this.isWebRTCSupported()) return null;
    
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      });
      return this.localStream;
    } catch (error) {
      console.error('Failed to get user media:', error);
      return null;
    }
  }
  
  private async establishWebRTCCall(hCall: number, remoteAddress: string): Promise<void> {
    if (!this.isWebRTCSupported()) return;
    
    try {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      
      this.peerConnections.set(hCall, pc);
      
      // Get user media
      const stream = await this.getUserMedia();
      if (stream) {
        stream.getTracks().forEach(track => {
          pc.addTrack(track, stream);
        });
      }
      
      // Set up event handlers
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          this.emit('iceCandidate', { hCall, candidate: event.candidate });
        }
      };
      
      pc.ontrack = (event) => {
        this.emit('remoteStream', { hCall, stream: event.streams[0] });
      };
      
      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      this.emit('webRTCOffer', { hCall, offer, remoteAddress });
    } catch (error) {
      console.error('Failed to establish WebRTC call:', error);
    }
  }
  
  // Simulate incoming call
  public simulateIncomingCall(callerID: string, callerName?: string): number {
    if (!this.initialized) return 0;
    
    // Find an available line
    const line = Array.from(this.lines.values()).find(l => l.hLine !== 0);
    if (!line) return 0;
    
    const hCall = this.nextCallHandle++;
    const call: TAPICall = {
      hCall,
      hLine: line.hLine,
      dwCallID: hCall,
      state: TAPICallState.LINECALLSTATE_OFFERING,
      info: {
        ...this.createCallInfo(hCall, line.hLine, ''),
        dwOrigin: 2, // Inbound
        CallerID: callerID,
        CallerIDName: callerName || callerID
      }
    };
    
    this.calls.set(hCall, call);
    line.calls.set(hCall, call);
    
    this.emit('incomingCall', { hCall, callerID, callerName });
    this.emit('callStateChange', { hCall, state: call.state });
    
    return hCall;
  }
}

// VB6-compatible Simple TAPI wrapper
export class SimpleTAPI {
  private static tapi = TAPI.getInstance();
  private static currentLine = 0;
  
  // Initialize TAPI
  public static Initialize(): number {
    const numDevices = { value: 0 };
    const result = this.tapi.lineInitialize(
      'VB6 Application',
      TAPIVersion.TAPI_VERSION_2_0,
      numDevices
    );
    
    if (result !== TAPIErrorCode.TAPI_SUCCESS) {
      throw new Error(`TAPI initialization failed: ${result}`);
    }
    
    return numDevices.value;
  }
  
  // Shutdown TAPI
  public static Shutdown(): void {
    this.tapi.lineShutdown();
    this.currentLine = 0;
  }
  
  // Open line
  public static OpenLine(deviceID: number): number {
    const result = this.tapi.lineOpen(
      deviceID,
      TAPIMediaMode.LINEMEDIAMODE_INTERACTIVEVOICE,
      0
    );
    
    if (result.errorCode !== TAPIErrorCode.TAPI_SUCCESS) {
      throw new Error(`Failed to open line: ${result.errorCode}`);
    }
    
    this.currentLine = result.hLine;
    return result.hLine;
  }
  
  // Make call
  public static async MakeCall(phoneNumber: string): Promise<number> {
    if (!this.currentLine) {
      throw new Error('No line open');
    }
    
    const result = await this.tapi.lineMakeCall(
      this.currentLine,
      phoneNumber,
      1 // US country code
    );
    
    if (result.errorCode !== TAPIErrorCode.TAPI_SUCCESS) {
      throw new Error(`Failed to make call: ${result.errorCode}`);
    }
    
    return result.hCall;
  }
  
  // Answer call
  public static async AnswerCall(hCall: number): Promise<void> {
    const result = await this.tapi.lineAnswer(hCall, null, 0);
    
    if (result !== TAPIErrorCode.TAPI_SUCCESS) {
      throw new Error(`Failed to answer call: ${result}`);
    }
  }
  
  // Drop call
  public static DropCall(hCall: number): void {
    const result = this.tapi.lineDrop(hCall, null, 0);
    
    if (result !== TAPIErrorCode.TAPI_SUCCESS) {
      throw new Error(`Failed to drop call: ${result}`);
    }
  }
  
  // Get call status
  public static GetCallStatus(hCall: number): TAPICallState {
    const result = this.tapi.lineGetCallStatus(hCall);
    
    if (result.errorCode !== TAPIErrorCode.TAPI_SUCCESS) {
      throw new Error(`Failed to get call status: ${result.errorCode}`);
    }
    
    return result.state;
  }
}

export default TAPI;