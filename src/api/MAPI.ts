import { EventEmitter } from 'events';

// MAPI Constants
export enum MAPILogonFlags {
  MAPI_LOGON_UI = 0x00000001,
  MAPI_PASSWORD_UI = 0x00000002,
  MAPI_NEW_SESSION = 0x00000004,
  MAPI_FORCE_DOWNLOAD = 0x00001000,
  MAPI_EXTENDED = 0x00000020
}

export enum MAPISendFlags {
  MAPI_DIALOG = 0x00000008,
  MAPI_LOGON_UI = 0x00000001,
  MAPI_NEW_SESSION = 0x00000004
}

export enum MAPIRecipientType {
  MAPI_ORIG = 0,
  MAPI_TO = 1,
  MAPI_CC = 2,
  MAPI_BCC = 3
}

export enum MAPIAttachmentType {
  MAPI_OLE = 0x00000001,
  MAPI_OLE_STATIC = 0x00000002,
  MAPI_EMBEDDED_MSG = 0x00000003
}

export enum MAPIErrorCode {
  SUCCESS_SUCCESS = 0,
  MAPI_USER_ABORT = 1,
  MAPI_E_FAILURE = 2,
  MAPI_E_LOGIN_FAILURE = 3,
  MAPI_E_DISK_FULL = 4,
  MAPI_E_INSUFFICIENT_MEMORY = 5,
  MAPI_E_ACCESS_DENIED = 6,
  MAPI_E_TOO_MANY_SESSIONS = 8,
  MAPI_E_TOO_MANY_FILES = 9,
  MAPI_E_TOO_MANY_RECIPIENTS = 10,
  MAPI_E_ATTACHMENT_NOT_FOUND = 11,
  MAPI_E_ATTACHMENT_OPEN_FAILURE = 12,
  MAPI_E_ATTACHMENT_WRITE_FAILURE = 13,
  MAPI_E_UNKNOWN_RECIPIENT = 14,
  MAPI_E_BAD_RECIPTYPE = 15,
  MAPI_E_NO_MESSAGES = 16,
  MAPI_E_INVALID_MESSAGE = 17,
  MAPI_E_TEXT_TOO_LARGE = 18,
  MAPI_E_INVALID_SESSION = 19,
  MAPI_E_TYPE_NOT_SUPPORTED = 20,
  MAPI_E_AMBIGUOUS_RECIPIENT = 21,
  MAPI_E_MESSAGE_IN_USE = 22,
  MAPI_E_NETWORK_FAILURE = 23,
  MAPI_E_INVALID_EDITFIELDS = 24,
  MAPI_E_INVALID_RECIPS = 25,
  MAPI_E_NOT_SUPPORTED = 26
}

// MAPI Structures
export interface MAPIRecipDesc {
  Reserved: number;
  RecipClass: MAPIRecipientType;
  Name: string;
  Address: string;
  EIDSize: number;
  EntryID: Uint8Array | null;
}

export interface MAPIFileDesc {
  Reserved: number;
  Flags: number;
  Position: number;
  PathName: string;
  FileName: string | null;
  FileType: MAPIAttachmentType | null;
}

export interface MAPIMessage {
  Reserved: number;
  Subject: string | null;
  NoteText: string | null;
  MessageType: string | null;
  DateReceived: string | null;
  ConversationID: string | null;
  Flags: number;
  Originator: MAPIRecipDesc | null;
  RecipCount: number;
  Recipients: MAPIRecipDesc[];
  FileCount: number;
  Files: MAPIFileDesc[];
}

// MAPI Session
export interface MAPISession {
  sessionId: string;
  userEmail: string;
  userName: string;
  isActive: boolean;
  loginTime: Date;
}

// Mail Provider Interface
export interface IMailProvider {
  sendMail(options: {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    body: string;
    attachments?: File[];
  }): Promise<void>;
  
  canSendMail(): boolean;
}

// Browser Mail Provider (using mailto:)
class BrowserMailProvider implements IMailProvider {
  public canSendMail(): boolean {
    return true; // mailto: is always available
  }
  
  public async sendMail(options: {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    body: string;
    attachments?: File[];
  }): Promise<void> {
    const { to, cc, bcc, subject, body } = options;
    
    // Build mailto URL
    const params = new URLSearchParams();
    if (cc && cc.length > 0) params.set('cc', cc.join(','));
    if (bcc && bcc.length > 0) params.set('bcc', bcc.join(','));
    if (subject) params.set('subject', subject);
    if (body) params.set('body', body);
    
    const mailtoUrl = `mailto:${to.join(',')}?${params.toString()}`;
    
    // Note: Attachments cannot be added via mailto
    if (options.attachments && options.attachments.length > 0) {
      console.warn('MAPI: Attachments are not supported with mailto: links');
    }
    
    // Open default mail client
    window.open(mailtoUrl, '_blank');
  }
}

// Web API Mail Provider (if available)
class WebAPIMailProvider implements IMailProvider {
  public canSendMail(): boolean {
    // Check if Web Share API with files is available
    return 'share' in navigator && 'canShare' in navigator;
  }
  
  public async sendMail(options: {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    body: string;
    attachments?: File[];
  }): Promise<void> {
    const { to, subject, body, attachments } = options;
    
    if (!this.canSendMail()) {
      throw new Error('Web Share API not available');
    }
    
    const shareData: ShareData = {
      title: subject,
      text: `To: ${to.join(', ')}\n\n${body}`
    };
    
    if (attachments && attachments.length > 0) {
      shareData.files = attachments;
    }
    
    // Check if can share
    if (navigator.canShare && !navigator.canShare(shareData)) {
      throw new Error('Cannot share this data');
    }
    
    try {
      await navigator.share(shareData);
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        throw error;
      }
    }
  }
}

export class MAPI extends EventEmitter {
  private static instance: MAPI;
  private sessions: Map<number, MAPISession> = new Map();
  private nextSessionId = 1;
  private mailProvider: IMailProvider;
  
  private constructor() {
    super();
    
    // Select appropriate mail provider
    const webProvider = new WebAPIMailProvider();
    if (webProvider.canSendMail()) {
      this.mailProvider = webProvider;
    } else {
      this.mailProvider = new BrowserMailProvider();
    }
  }
  
  public static getInstance(): MAPI {
    if (!MAPI.instance) {
      MAPI.instance = new MAPI();
    }
    return MAPI.instance;
  }
  
  // MAPILogon - Establishes a mail session
  public MAPILogon(
    uiParam: number,
    profileName: string | null,
    password: string | null,
    flags: number,
    reserved: number
  ): { session: number; errorCode: MAPIErrorCode } {
    try {
      // Simulate login
      const sessionId = this.nextSessionId++;
      const session: MAPISession = {
        sessionId: sessionId.toString(),
        userEmail: profileName || 'user@example.com',
        userName: profileName || 'User',
        isActive: true,
        loginTime: new Date()
      };
      
      this.sessions.set(sessionId, session);
      this.emit('logon', session);
      
      return { session: sessionId, errorCode: MAPIErrorCode.SUCCESS_SUCCESS };
    } catch (error) {
      this.emit('error', error);
      return { session: 0, errorCode: MAPIErrorCode.MAPI_E_LOGIN_FAILURE };
    }
  }
  
  // MAPILogoff - Ends a mail session
  public MAPILogoff(
    session: number,
    uiParam: number,
    flags: number,
    reserved: number
  ): MAPIErrorCode {
    try {
      const sessionData = this.sessions.get(session);
      if (!sessionData) {
        return MAPIErrorCode.MAPI_E_INVALID_SESSION;
      }
      
      sessionData.isActive = false;
      this.sessions.delete(session);
      this.emit('logoff', sessionData);
      
      return MAPIErrorCode.SUCCESS_SUCCESS;
    } catch (error) {
      this.emit('error', error);
      return MAPIErrorCode.MAPI_E_FAILURE;
    }
  }
  
  // MAPISendMail - Sends a mail message
  public async MAPISendMail(
    session: number,
    uiParam: number,
    message: MAPIMessage,
    flags: number,
    reserved: number
  ): Promise<MAPIErrorCode> {
    try {
      // Validate session if provided
      if (session !== 0) {
        const sessionData = this.sessions.get(session);
        if (!sessionData || !sessionData.isActive) {
          return MAPIErrorCode.MAPI_E_INVALID_SESSION;
        }
      }
      
      // Extract recipients
      const to: string[] = [];
      const cc: string[] = [];
      const bcc: string[] = [];
      
      message.Recipients.forEach(recip => {
        const email = recip.Address || recip.Name;
        switch (recip.RecipClass) {
          case MAPIRecipientType.MAPI_TO:
            to.push(email);
            break;
          case MAPIRecipientType.MAPI_CC:
            cc.push(email);
            break;
          case MAPIRecipientType.MAPI_BCC:
            bcc.push(email);
            break;
        }
      });
      
      // Handle attachments
      const attachments: File[] = [];
      if (message.Files.length > 0) {
        // Note: In browser environment, we can't access file system directly
        console.warn('MAPI: File attachments from paths are not supported in browser');
      }
      
      // Send mail
      await this.mailProvider.sendMail({
        to,
        cc,
        bcc,
        subject: message.Subject || '',
        body: message.NoteText || '',
        attachments
      });
      
      this.emit('mailSent', { message, session });
      return MAPIErrorCode.SUCCESS_SUCCESS;
      
    } catch (error) {
      this.emit('error', error);
      return MAPIErrorCode.MAPI_E_FAILURE;
    }
  }
  
  // MAPISendDocuments - Sends documents as mail attachments
  public async MAPISendDocuments(
    uiParam: number,
    delimitChar: string,
    filePaths: string,
    fileNames: string,
    reserved: number
  ): Promise<MAPIErrorCode> {
    try {
      // Parse file paths
      const paths = filePaths.split(delimitChar).filter(p => p.trim());
      const names = fileNames.split(delimitChar).filter(n => n.trim());
      
      // Create message with attachments
      const message: MAPIMessage = {
        Reserved: 0,
        Subject: 'Documents',
        NoteText: 'Please find attached documents.',
        MessageType: null,
        DateReceived: null,
        ConversationID: null,
        Flags: 0,
        Originator: null,
        RecipCount: 0,
        Recipients: [],
        FileCount: paths.length,
        Files: paths.map((path, index) => ({
          Reserved: 0,
          Flags: 0,
          Position: -1,
          PathName: path,
          FileName: names[index] || null,
          FileType: null
        }))
      };
      
      // Show compose dialog
      return await this.MAPISendMail(0, uiParam, message, MAPISendFlags.MAPI_DIALOG, 0);
      
    } catch (error) {
      this.emit('error', error);
      return MAPIErrorCode.MAPI_E_FAILURE;
    }
  }
  
  // MAPIFindNext - Finds the next message (not implemented in browser)
  public MAPIFindNext(
    session: number,
    uiParam: number,
    messageType: string | null,
    seedMessageID: string | null,
    flags: number,
    reserved: number
  ): { messageID: string | null; errorCode: MAPIErrorCode } {
    // Not implemented in browser environment
    return { messageID: null, errorCode: MAPIErrorCode.MAPI_E_NOT_SUPPORTED };
  }
  
  // MAPIReadMail - Reads a message (not implemented in browser)
  public MAPIReadMail(
    session: number,
    uiParam: number,
    messageID: string,
    flags: number,
    reserved: number
  ): { message: MAPIMessage | null; errorCode: MAPIErrorCode } {
    // Not implemented in browser environment
    return { message: null, errorCode: MAPIErrorCode.MAPI_E_NOT_SUPPORTED };
  }
  
  // MAPIResolveName - Resolves a recipient name
  public MAPIResolveName(
    session: number,
    uiParam: number,
    name: string,
    flags: number,
    reserved: number
  ): { recipient: MAPIRecipDesc | null; errorCode: MAPIErrorCode } {
    try {
      // Simple email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      if (emailRegex.test(name)) {
        const recipient: MAPIRecipDesc = {
          Reserved: 0,
          RecipClass: MAPIRecipientType.MAPI_TO,
          Name: name,
          Address: name,
          EIDSize: 0,
          EntryID: null
        };
        
        return { recipient, errorCode: MAPIErrorCode.SUCCESS_SUCCESS };
      }
      
      // Could not resolve
      return { recipient: null, errorCode: MAPIErrorCode.MAPI_E_UNKNOWN_RECIPIENT };
      
    } catch (error) {
      this.emit('error', error);
      return { recipient: null, errorCode: MAPIErrorCode.MAPI_E_FAILURE };
    }
  }
  
  // Helper method to create a message
  public createMessage(options: {
    to?: string[];
    cc?: string[];
    bcc?: string[];
    subject?: string;
    body?: string;
    attachments?: Array<{ path: string; name?: string }>;
  }): MAPIMessage {
    const recipients: MAPIRecipDesc[] = [];
    
    // Add TO recipients
    options.to?.forEach(email => {
      recipients.push({
        Reserved: 0,
        RecipClass: MAPIRecipientType.MAPI_TO,
        Name: email,
        Address: email,
        EIDSize: 0,
        EntryID: null
      });
    });
    
    // Add CC recipients
    options.cc?.forEach(email => {
      recipients.push({
        Reserved: 0,
        RecipClass: MAPIRecipientType.MAPI_CC,
        Name: email,
        Address: email,
        EIDSize: 0,
        EntryID: null
      });
    });
    
    // Add BCC recipients
    options.bcc?.forEach(email => {
      recipients.push({
        Reserved: 0,
        RecipClass: MAPIRecipientType.MAPI_BCC,
        Name: email,
        Address: email,
        EIDSize: 0,
        EntryID: null
      });
    });
    
    // Create file descriptors
    const files: MAPIFileDesc[] = options.attachments?.map(att => ({
      Reserved: 0,
      Flags: 0,
      Position: -1,
      PathName: att.path,
      FileName: att.name || null,
      FileType: null
    })) || [];
    
    return {
      Reserved: 0,
      Subject: options.subject || null,
      NoteText: options.body || null,
      MessageType: null,
      DateReceived: null,
      ConversationID: null,
      Flags: 0,
      Originator: null,
      RecipCount: recipients.length,
      Recipients: recipients,
      FileCount: files.length,
      Files: files
    };
  }
  
  // Get active sessions
  public getActiveSessions(): MAPISession[] {
    return Array.from(this.sessions.values()).filter(s => s.isActive);
  }
  
  // Check if mail client is available
  public isMailAvailable(): boolean {
    return this.mailProvider.canSendMail();
  }
}

// VB6-compatible Simple MAPI functions
export class SimpleMAPI {
  private static mapi = MAPI.getInstance();
  private static currentSession = 0;
  
  // Logon to mail system
  public static Logon(profileName?: string, password?: string): number {
    const result = this.mapi.MAPILogon(
      0,
      profileName || null,
      password || null,
      MAPILogonFlags.MAPI_LOGON_UI,
      0
    );
    
    if (result.errorCode === MAPIErrorCode.SUCCESS_SUCCESS) {
      this.currentSession = result.session;
      return result.session;
    }
    
    throw new Error(`MAPI Logon failed: ${MAPIErrorCode[result.errorCode]}`);
  }
  
  // Logoff from mail system
  public static Logoff(): void {
    if (this.currentSession) {
      this.mapi.MAPILogoff(this.currentSession, 0, 0, 0);
      this.currentSession = 0;
    }
  }
  
  // Send mail
  public static async SendMail(
    recipients: string | string[],
    subject: string,
    body: string,
    attachments?: string[]
  ): Promise<void> {
    const to = Array.isArray(recipients) ? recipients : [recipients];
    
    const message = this.mapi.createMessage({
      to,
      subject,
      body,
      attachments: attachments?.map(path => ({ path }))
    });
    
    const errorCode = await this.mapi.MAPISendMail(
      this.currentSession,
      0,
      message,
      MAPISendFlags.MAPI_DIALOG,
      0
    );
    
    if (errorCode !== MAPIErrorCode.SUCCESS_SUCCESS) {
      throw new Error(`MAPI SendMail failed: ${MAPIErrorCode[errorCode]}`);
    }
  }
  
  // Send mail with UI
  public static async ComposeNEW(
    to?: string,
    subject?: string,
    body?: string
  ): Promise<void> {
    const message = this.mapi.createMessage({
      to: to ? [to] : [],
      subject,
      body
    });
    
    const errorCode = await this.mapi.MAPISendMail(
      this.currentSession,
      0,
      message,
      MAPISendFlags.MAPI_DIALOG,
      0
    );
    
    if (errorCode !== MAPIErrorCode.SUCCESS_SUCCESS && 
        errorCode !== MAPIErrorCode.MAPI_USER_ABORT) {
      throw new Error(`MAPI Compose failed: ${MAPIErrorCode[errorCode]}`);
    }
  }
}

export default MAPI;