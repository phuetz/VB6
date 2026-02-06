/**
 * VB6 MAPI Controls Implementation (MAPISession and MAPIMessages)
 *
 * Email integration controls with web-compatible simulation
 */

import React, { useState, useCallback, useRef } from 'react';

// MAPI Control Types
export interface MAPISessionControl {
  type: 'MAPISession';
  name: string;
  left: number;
  top: number;
  width: number;
  height: number;

  // MAPI Session Properties
  userName: string;
  password: string;
  sessionID: number;
  newSession: boolean;
  logonUI: boolean;
  downloadMail: boolean;

  // Connection State
  connected: boolean;

  // Behavior
  enabled: boolean;
  visible: boolean;
  tag: string;

  // Events
  onSignOn?: string;
  onSignOff?: string;
}

export interface MAPIMessage {
  id: string;
  subject: string;
  noteText: string;
  dateReceived: Date;
  timeReceived: string;
  msgType: string;
  msgIndex: number;
  attachmentCount: number;
  recipCount: number;
  origAddress: string;
  origDisplayName: string;
  msgID: string;
  conversationID: string;
  read: boolean;
}

export interface MAPIRecipient {
  name: string;
  address: string;
  type: number; // 1=To, 2=CC, 3=BCC
}

export interface MAPIMessagesControl {
  type: 'MAPIMessages';
  name: string;
  left: number;
  top: number;
  width: number;
  height: number;

  // Message Properties
  sessionID: number;
  msgIndex: number;
  fetchMsgType: string;
  fetchSorted: boolean;
  fetchUnreadOnly: boolean;

  // Current Message
  currentMessage: MAPIMessage | null;
  messageCount: number;

  // Behavior
  enabled: boolean;
  visible: boolean;
  tag: string;
}

// MAPI Constants
export const MAPIConstants = {
  // Message Types
  msgOriginal: '',
  msgForward: 'FW',
  msgReply: 'RE',

  // Recipient Types
  recipOriginal: 0,
  recipTo: 1,
  recipCC: 2,
  recipBCC: 3,

  // Attachment Types
  attachData: 0,
  attachEmbedded: 1,
  attachOLE: 2,

  // Logon Flags
  logonUI: 1,
  newSession: 2,
  forceDownload: 4,

  // Errors
  SUCCESS: 0,
  USER_ABORT: 1,
  FAILURE: 2,
  LOGIN_FAILURE: 3,
  DISK_FULL: 4,
  INSUFFICIENT_MEMORY: 5,
  ACCESS_DENIED: 9,
  TOO_MANY_SESSIONS: 8,
  TOO_MANY_FILES: 9,
  TOO_MANY_RECIPIENTS: 10,
  ATTACHMENT_NOT_FOUND: 11,
  ATTACHMENT_OPEN_FAILURE: 12,
  ATTACHMENT_WRITE_FAILURE: 13,
  UNKNOWN_RECIPIENT: 14,
  BAD_RECIPTYPE: 15,
  NO_MESSAGES: 16,
  INVALID_MESSAGE: 17,
  TEXT_TOO_LARGE: 18,
  INVALID_SESSION: 19,
  TYPE_NOT_SUPPORTED: 20,
  AMBIGUOUS_RECIPIENT: 21,
  MESSAGE_IN_USE: 22,
  NETWORK_FAILURE: 23,
  INVALID_EDITFIELDS: 24,
  INVALID_RECIPS: 25,
  NOT_SUPPORTED: 26,
};

interface MAPISessionProps {
  control: MAPISessionControl;
  isDesignMode?: boolean;
  onPropertyChange?: (property: string, value: any) => void;
  onEvent?: (eventName: string, eventData?: any) => void;
}

export const MAPISessionControl: React.FC<MAPISessionProps> = ({
  control,
  isDesignMode = false,
  onPropertyChange,
  onEvent,
}) => {
  const {
    name,
    left = 0,
    top = 0,
    width = 32,
    height = 32,
    userName = '',
    password = '',
    sessionID = 0,
    newSession = false,
    logonUI = true,
    downloadMail = true,
    connected = false,
    enabled = true,
    visible = true,
    tag = '',
  } = control;

  const [isConnected, setIsConnected] = useState(connected);
  const [currentSessionID, setCurrentSessionID] = useState(sessionID);
  const [lastError, setLastError] = useState<number>(MAPIConstants.SUCCESS);

  // Sign On to MAPI session
  const signOn = useCallback(() => {
    if (!enabled) return MAPIConstants.ACCESS_DENIED;

    try {
      // Simulate MAPI logon
      if (logonUI && (!userName || !password)) {
        // In real VB6, this would show logon dialog
        const mockUserName = prompt('Enter email username:') || '';
        const mockPassword = prompt('Enter password:') || '';

        if (!mockUserName || !mockPassword) {
          setLastError(MAPIConstants.USER_ABORT);
          return MAPIConstants.USER_ABORT;
        }

        onPropertyChange?.('userName', mockUserName);
        onPropertyChange?.('password', mockPassword);
      }

      // Generate session ID
      const newSessionID = Math.floor(Math.random() * 1000000);
      setCurrentSessionID(newSessionID);
      onPropertyChange?.('sessionID', newSessionID);

      setIsConnected(true);
      onPropertyChange?.('connected', true);
      setLastError(MAPIConstants.SUCCESS);

      onEvent?.('SignOn', { sessionID: newSessionID });

      return MAPIConstants.SUCCESS;
    } catch (error) {
      setLastError(MAPIConstants.LOGIN_FAILURE);
      return MAPIConstants.LOGIN_FAILURE;
    }
  }, [enabled, logonUI, userName, password, onPropertyChange, onEvent]);

  // Sign Off from MAPI session
  const signOff = useCallback(() => {
    if (!isConnected) return MAPIConstants.SUCCESS;

    try {
      setIsConnected(false);
      setCurrentSessionID(0);
      onPropertyChange?.('connected', false);
      onPropertyChange?.('sessionID', 0);
      setLastError(MAPIConstants.SUCCESS);

      onEvent?.('SignOff');

      return MAPIConstants.SUCCESS;
    } catch (error) {
      setLastError(MAPIConstants.FAILURE);
      return MAPIConstants.FAILURE;
    }
  }, [isConnected, onPropertyChange, onEvent]);

  const handleDoubleClick = useCallback(() => {
    if (!enabled) return;

    if (isConnected) {
      signOff();
    } else {
      signOn();
    }
  }, [enabled, isConnected, signOn, signOff]);

  if (!visible) {
    return null;
  }

  const containerStyle = {
    position: 'absolute' as const,
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`,
    border: '1px solid #808080',
    background: isConnected ? '#90EE90' : '#F0F0F0',
    cursor: enabled ? 'pointer' : 'default',
    opacity: enabled ? 1 : 0.5,
    outline: isDesignMode ? '1px dotted #333' : 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    fontFamily: 'Tahoma, Arial, sans-serif',
  };

  return (
    <div
      className={`vb6-mapi-session ${!enabled ? 'disabled' : ''}`}
      style={containerStyle}
      onDoubleClick={handleDoubleClick}
      data-name={name}
      data-type="MAPISession"
      title={`MAPI Session - ${isConnected ? 'Connected' : 'Disconnected'}`}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '12px', marginBottom: '2px' }}>{isConnected ? '📧' : '📪'}</div>
        <div>MAPI</div>
      </div>

      {isDesignMode && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            fontSize: '10px',
            color: '#666',
            background: 'rgba(255,255,255,0.9)',
            padding: '2px',
            border: '1px solid #ccc',
            whiteSpace: 'nowrap',
            zIndex: 1000,
          }}
        >
          {name} - {isConnected ? `Session ${currentSessionID}` : 'Disconnected'}
        </div>
      )}
    </div>
  );
};

interface MAPIMessagesProps {
  control: MAPIMessagesControl;
  isDesignMode?: boolean;
  onPropertyChange?: (property: string, value: any) => void;
  onEvent?: (eventName: string, eventData?: any) => void;
}

export const MAPIMessagesControl: React.FC<MAPIMessagesProps> = ({
  control,
  isDesignMode = false,
  onPropertyChange,
  onEvent,
}) => {
  const {
    name,
    left = 0,
    top = 0,
    width = 32,
    height = 32,
    sessionID = 0,
    msgIndex = -1,
    fetchMsgType = '',
    fetchSorted = true,
    fetchUnreadOnly = false,
    currentMessage = null,
    messageCount = 0,
    enabled = true,
    visible = true,
    tag = '',
  } = control;

  const [messages, setMessages] = useState<MAPIMessage[]>([]);
  const [currentMsgIndex, setCurrentMsgIndex] = useState(msgIndex);
  const [lastError, setLastError] = useState<number>(MAPIConstants.SUCCESS);

  // Mock message data for demonstration
  const mockMessages: MAPIMessage[] = [
    {
      id: '1',
      subject: 'Welcome to MAPI Integration',
      noteText: 'This is a demonstration email message.',
      dateReceived: new Date(),
      timeReceived: new Date().toLocaleTimeString(),
      msgType: MAPIConstants.msgOriginal,
      msgIndex: 0,
      attachmentCount: 0,
      recipCount: 1,
      origAddress: 'demo@example.com',
      origDisplayName: 'Demo User',
      msgID: 'msg_1',
      conversationID: 'conv_1',
      read: false,
    },
    {
      id: '2',
      subject: 'Test Email with Attachment',
      noteText: 'This email has an attachment.',
      dateReceived: new Date(Date.now() - 86400000),
      timeReceived: new Date(Date.now() - 86400000).toLocaleTimeString(),
      msgType: MAPIConstants.msgOriginal,
      msgIndex: 1,
      attachmentCount: 1,
      recipCount: 2,
      origAddress: 'test@example.com',
      origDisplayName: 'Test User',
      msgID: 'msg_2',
      conversationID: 'conv_2',
      read: true,
    },
  ];

  // Fetch messages
  const fetch = useCallback(
    (downloadHeaders: boolean = true) => {
      if (!enabled || sessionID === 0) {
        setLastError(MAPIConstants.INVALID_SESSION);
        return MAPIConstants.INVALID_SESSION;
      }

      try {
        let filteredMessages = [...mockMessages];

        // Apply filters
        if (fetchUnreadOnly) {
          filteredMessages = filteredMessages.filter(msg => !msg.read);
        }

        if (fetchMsgType && fetchMsgType !== MAPIConstants.msgOriginal) {
          filteredMessages = filteredMessages.filter(msg => msg.msgType === fetchMsgType);
        }

        // Sort if requested
        if (fetchSorted) {
          filteredMessages.sort((a, b) => b.dateReceived.getTime() - a.dateReceived.getTime());
        }

        setMessages(filteredMessages);
        onPropertyChange?.('messageCount', filteredMessages.length);
        setLastError(MAPIConstants.SUCCESS);

        return MAPIConstants.SUCCESS;
      } catch (error) {
        setLastError(MAPIConstants.FAILURE);
        return MAPIConstants.FAILURE;
      }
    },
    [enabled, sessionID, fetchMsgType, fetchSorted, fetchUnreadOnly, onPropertyChange]
  );

  // Delete message
  const deleteMessage = useCallback(
    (msgIndex?: number) => {
      const indexToDelete = msgIndex !== undefined ? msgIndex : currentMsgIndex;

      if (indexToDelete < 0 || indexToDelete >= messages.length) {
        setLastError(MAPIConstants.INVALID_MESSAGE);
        return MAPIConstants.INVALID_MESSAGE;
      }

      try {
        const newMessages = [...messages];
        newMessages.splice(indexToDelete, 1);
        setMessages(newMessages);
        onPropertyChange?.('messageCount', newMessages.length);

        // Adjust current index if necessary
        if (currentMsgIndex >= newMessages.length) {
          setCurrentMsgIndex(Math.max(0, newMessages.length - 1));
        }

        setLastError(MAPIConstants.SUCCESS);
        return MAPIConstants.SUCCESS;
      } catch (error) {
        setLastError(MAPIConstants.FAILURE);
        return MAPIConstants.FAILURE;
      }
    },
    [currentMsgIndex, messages, onPropertyChange]
  );

  // Save message
  const save = useCallback(
    (showDialog: boolean = true) => {
      if (currentMsgIndex < 0 || currentMsgIndex >= messages.length) {
        setLastError(MAPIConstants.INVALID_MESSAGE);
        return MAPIConstants.INVALID_MESSAGE;
      }

      try {
        const message = messages[currentMsgIndex];

        if (showDialog) {
          // Simulate save dialog
          const fileName = prompt('Save message as:', `${message.subject}.txt`);
          if (!fileName) {
            setLastError(MAPIConstants.USER_ABORT);
            return MAPIConstants.USER_ABORT;
          }
        }

        // Create downloadable content
        const content = [
          `Subject: ${message.subject}`,
          `From: ${message.origDisplayName} <${message.origAddress}>`,
          `Date: ${message.dateReceived.toLocaleString()}`,
          ``,
          message.noteText,
        ].join('\n');

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${message.subject}.txt`;
        a.click();
        URL.revokeObjectURL(url);

        setLastError(MAPIConstants.SUCCESS);
        return MAPIConstants.SUCCESS;
      } catch (error) {
        setLastError(MAPIConstants.FAILURE);
        return MAPIConstants.FAILURE;
      }
    },
    [currentMsgIndex, messages]
  );

  // Send mail
  const send = useCallback((showDialog: boolean = true) => {
    try {
      if (showDialog) {
        // Use mailto: to open default email client
        const recipient = prompt('Send to:') || '';
        const subject = prompt('Subject:') || '';
        const body = prompt('Message:') || '';

        if (!recipient) {
          setLastError(MAPIConstants.USER_ABORT);
          return MAPIConstants.USER_ABORT;
        }

        const mailtoUrl = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(mailtoUrl);
      }

      setLastError(MAPIConstants.SUCCESS);
      return MAPIConstants.SUCCESS;
    } catch (error) {
      setLastError(MAPIConstants.FAILURE);
      return MAPIConstants.FAILURE;
    }
  }, []);

  const handleDoubleClick = useCallback(() => {
    if (!enabled) return;
    fetch();
  }, [enabled, fetch]);

  if (!visible) {
    return null;
  }

  const containerStyle = {
    position: 'absolute' as const,
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`,
    border: '1px solid #808080',
    background: '#F0F0F0',
    cursor: enabled ? 'pointer' : 'default',
    opacity: enabled ? 1 : 0.5,
    outline: isDesignMode ? '1px dotted #333' : 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    fontFamily: 'Tahoma, Arial, sans-serif',
  };

  return (
    <div
      className={`vb6-mapi-messages ${!enabled ? 'disabled' : ''}`}
      style={containerStyle}
      onDoubleClick={handleDoubleClick}
      data-name={name}
      data-type="MAPIMessages"
      title={`MAPI Messages - ${messages.length} messages`}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '12px', marginBottom: '2px' }}>📨</div>
        <div>Messages</div>
        {messages.length > 0 && <div style={{ fontSize: '8px' }}>({messages.length})</div>}
      </div>

      {isDesignMode && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            fontSize: '10px',
            color: '#666',
            background: 'rgba(255,255,255,0.9)',
            padding: '2px',
            border: '1px solid #ccc',
            whiteSpace: 'nowrap',
            zIndex: 1000,
          }}
        >
          {name} - {messages.length} messages
        </div>
      )}
    </div>
  );
};

// MAPI Helper Functions
export const MAPIHelpers = {
  /**
   * Initialize MAPI session
   */
  createSession: (
    userName?: string,
    password?: string,
    newSession: boolean = false
  ): MAPISessionControl => {
    return {
      type: 'MAPISession',
      name: 'MAPISession1',
      left: 0,
      top: 0,
      width: 32,
      height: 32,
      userName: userName || '',
      password: password || '',
      sessionID: 0,
      newSession,
      logonUI: true,
      downloadMail: true,
      connected: false,
      enabled: true,
      visible: true,
      tag: '',
    };
  },

  /**
   * Create messages control
   */
  createMessages: (sessionID: number = 0): MAPIMessagesControl => {
    return {
      type: 'MAPIMessages',
      name: 'MAPIMessages1',
      left: 0,
      top: 0,
      width: 32,
      height: 32,
      sessionID,
      msgIndex: -1,
      fetchMsgType: '',
      fetchSorted: true,
      fetchUnreadOnly: false,
      currentMessage: null,
      messageCount: 0,
      enabled: true,
      visible: true,
      tag: '',
    };
  },

  /**
   * Format MAPI error message
   */
  formatError: (errorCode: number): string => {
    const errorMessages: { [key: number]: string } = {
      [MAPIConstants.SUCCESS]: 'Success',
      [MAPIConstants.USER_ABORT]: 'User cancelled operation',
      [MAPIConstants.FAILURE]: 'General failure',
      [MAPIConstants.LOGIN_FAILURE]: 'Login failed',
      [MAPIConstants.DISK_FULL]: 'Disk full',
      [MAPIConstants.INSUFFICIENT_MEMORY]: 'Insufficient memory',
      [MAPIConstants.ACCESS_DENIED]: 'Access denied',
      [MAPIConstants.TOO_MANY_SESSIONS]: 'Too many sessions',
      [MAPIConstants.UNKNOWN_RECIPIENT]: 'Unknown recipient',
      [MAPIConstants.NO_MESSAGES]: 'No messages',
      [MAPIConstants.INVALID_MESSAGE]: 'Invalid message',
      [MAPIConstants.INVALID_SESSION]: 'Invalid session',
      [MAPIConstants.NOT_SUPPORTED]: 'Not supported',
    };

    return errorMessages[errorCode] || `MAPI Error ${errorCode}`;
  },

  /**
   * Parse email address
   */
  parseAddress: (address: string): { name: string; email: string } => {
    const match = address.match(/^(.+?)\s*<(.+?)>$/);
    if (match) {
      return { name: match[1].trim(), email: match[2].trim() };
    }
    return { name: '', email: address.trim() };
  },

  /**
   * Format email address
   */
  formatAddress: (name: string, email: string): string => {
    if (name) {
      return `${name} <${email}>`;
    }
    return email;
  },

  /**
   * Create recipient
   */
  createRecipient: (
    name: string,
    address: string,
    type: number = MAPIConstants.recipTo
  ): MAPIRecipient => {
    return { name, address, type };
  },
};

// VB6 MAPI Methods simulation
export const MAPIMethods = {
  /**
   * Resolve recipient name
   */
  resolveName: (sessionID: number, name: string): { resolved: boolean; address: string } => {
    // Simulate address book lookup
    const mockAddresses: { [key: string]: string } = {
      admin: 'admin@company.com',
      support: 'support@company.com',
      sales: 'sales@company.com',
    };

    const address = mockAddresses[name.toLowerCase()];
    return {
      resolved: !!address,
      address: address || name,
    };
  },

  /**
   * Show address book
   */
  showAddressBook: (sessionID: number): string[] => {
    // Return mock address list
    return ['admin@company.com', 'support@company.com', 'sales@company.com', 'user@example.com'];
  },

  /**
   * Show details dialog
   */
  showDetails: (sessionID: number, recipientID: number): boolean => {
    // Simulate showing recipient details
    alert('Recipient details would be shown here');
    return true;
  },
};

export default { MAPISessionControl, MAPIMessagesControl, MAPIHelpers, MAPIMethods, MAPIConstants };
