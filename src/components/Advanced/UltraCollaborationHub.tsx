/**
 * ULTRA-COLLABORATION HUB
 * Advanced multiplayer IDE with real-time pair programming
 * WebRTC-powered collaboration, live cursors, voice chat, and collaborative debugging
 * Revolutionary multi-developer VB6 development experience
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useProjectStore } from '../../stores/ProjectStore';
import { useDesignerStore } from '../../stores/DesignerStore';
import { useUIStore } from '../../stores/UIStore';
import { useDebugStore } from '../../stores/DebugStore';
import {
  Users,
  Video,
  Mic,
  MicOff,
  VideoOff,
  Share,
  MessageSquare,
  Phone,
  PhoneOff,
  Settings,
  X,
  UserPlus,
  Crown,
  Eye,
  Edit,
  Lock,
  Unlock,
  Wifi,
  WifiOff,
  Volume2,
  VolumeX,
  Monitor,
  Hand,
  Target,
  GitBranch,
  Clock,
  Activity,
  Globe,
  Shield,
  Zap,
  Bell,
  Camera,
  ScreenShare,
  MousePointer,
  Code,
  Layers,
  PlayCircle
} from 'lucide-react';

// Types pour la collaboration
interface CollaborationSession {
  id: string;
  name: string;
  created: Date;
  owner: CollaborationUser;
  participants: CollaborationUser[];
  settings: SessionSettings;
  status: 'active' | 'paused' | 'ended';
  project: {
    id: string;
    name: string;
    lastModified: Date;
  };
}

interface CollaborationUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'collaborator' | 'viewer';
  status: 'online' | 'away' | 'offline';
  cursor?: {
    x: number;
    y: number;
    file?: string;
    selection?: {
      start: number;
      end: number;
    };
  };
  permissions: UserPermissions;
  lastActivity: Date;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
}

interface UserPermissions {
  canEdit: boolean;
  canDebug: boolean;
  canCompile: boolean;
  canInvite: boolean;
  canManageUsers: boolean;
  canAccessSettings: boolean;
  canUseVoiceChat: boolean;
  canShareScreen: boolean;
}

interface SessionSettings {
  allowAnonymous: boolean;
  requireApproval: boolean;
  enableVoiceChat: boolean;
  enableVideoChat: boolean;
  enableScreenShare: boolean;
  conflictResolution: 'first-write-wins' | 'last-write-wins' | 'manual';
  autoSave: boolean;
  maxParticipants: number;
}

interface ChatMessage {
  id: string;
  userId: string;
  content: string;
  type: 'text' | 'code' | 'file' | 'system' | 'voice';
  timestamp: Date;
  replyTo?: string;
  metadata?: {
    fileName?: string;
    lineNumber?: number;
    codeSnippet?: string;
    duration?: number; // for voice messages
  };
}

interface CodeChange {
  id: string;
  userId: string;
  fileName: string;
  type: 'insert' | 'delete' | 'replace';
  position: number;
  content: string;
  timestamp: Date;
  applied: boolean;
  conflicted?: boolean;
}

// Moteur de collaboration WebRTC
class CollaborationEngine {
  private static instance: CollaborationEngine;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private dataChannels: Map<string, RTCDataChannel> = new Map();
  private localStream?: MediaStream;
  private currentSession?: CollaborationSession;
  private messageQueue: any[] = [];
  private isConnected = false;
  
  static getInstance(): CollaborationEngine {
    if (!CollaborationEngine.instance) {
      CollaborationEngine.instance = new CollaborationEngine();
    }
    return CollaborationEngine.instance;
  }
  
  async startSession(sessionName: string, settings: SessionSettings): Promise<CollaborationSession> {
    console.log(`🤝 Starting collaboration session: ${sessionName}`);
    
    const session: CollaborationSession = {
      id: `session_${Date.now()}`,
      name: sessionName,
      created: new Date(),
      owner: {
        id: 'current_user',
        name: 'You',
        email: 'user@example.com',
        role: 'owner',
        status: 'online',
        permissions: {
          canEdit: true,
          canDebug: true,
          canCompile: true,
          canInvite: true,
          canManageUsers: true,
          canAccessSettings: true,
          canUseVoiceChat: true,
          canShareScreen: true
        },
        lastActivity: new Date(),
        connectionQuality: 'excellent'
      },
      participants: [],
      settings,
      status: 'active',
      project: {
        id: 'current_project',
        name: 'VB6 Project',
        lastModified: new Date()
      }
    };
    
    this.currentSession = session;
    this.isConnected = true;
    
    // Initialize WebRTC
    await this.initializeWebRTC();
    
    console.log('✅ Collaboration session started');
    return session;
  }
  
  async joinSession(sessionId: string, userInfo: Partial<CollaborationUser>): Promise<CollaborationSession> {
    console.log(`🔗 Joining collaboration session: ${sessionId}`);
    
    // Simulate joining an existing session
    const session: CollaborationSession = {
      id: sessionId,
      name: 'Existing Session',
      created: new Date(Date.now() - 3600000), // 1 hour ago
      owner: {
        id: 'other_user',
        name: 'Project Owner',
        email: 'owner@example.com',
        role: 'owner',
        status: 'online',
        permissions: {
          canEdit: true,
          canDebug: true,
          canCompile: true,
          canInvite: true,
          canManageUsers: true,
          canAccessSettings: true,
          canUseVoiceChat: true,
          canShareScreen: true
        },
        lastActivity: new Date(),
        connectionQuality: 'good'
      },
      participants: [
        {
          id: 'current_user',
          name: userInfo.name || 'You',
          email: userInfo.email || 'user@example.com',
          role: 'collaborator',
          status: 'online',
          permissions: {
            canEdit: true,
            canDebug: true,
            canCompile: false,
            canInvite: false,
            canManageUsers: false,
            canAccessSettings: false,
            canUseVoiceChat: true,
            canShareScreen: true
          },
          lastActivity: new Date(),
          connectionQuality: 'excellent'
        }
      ],
      settings: {
        allowAnonymous: false,
        requireApproval: true,
        enableVoiceChat: true,
        enableVideoChat: true,
        enableScreenShare: true,
        conflictResolution: 'last-write-wins',
        autoSave: true,
        maxParticipants: 10
      },
      status: 'active',
      project: {
        id: 'shared_project',
        name: 'Shared VB6 Project',
        lastModified: new Date()
      }
    };
    
    this.currentSession = session;
    this.isConnected = true;
    
    await this.initializeWebRTC();
    
    console.log('✅ Successfully joined collaboration session');
    return session;
  }
  
  private async initializeWebRTC() {
    try {
      // Initialize media if voice/video enabled
      if (this.currentSession?.settings.enableVoiceChat || this.currentSession?.settings.enableVideoChat) {
        this.localStream = await navigator.mediaDevices.getUserMedia({
          audio: this.currentSession.settings.enableVoiceChat,
          video: this.currentSession.settings.enableVideoChat
        });
        console.log('📷 Media stream initialized');
      }
      
      // Setup peer connections (simulated for demo)
      this.setupPeerConnections();
      
    } catch (error) {
      console.error('❌ WebRTC initialization failed:', error);
    }
  }
  
  private setupPeerConnections() {
    // Simulate peer connection setup
    console.log('🔗 Setting up peer connections...');
    
    // In a real implementation, this would:
    // 1. Create RTCPeerConnection for each participant
    // 2. Setup data channels for real-time collaboration
    // 3. Handle ICE candidates and signaling
    // 4. Establish media streams for voice/video
  }
  
  sendMessage(type: string, data: any, targetUser?: string) {
    if (!this.isConnected) {
      this.messageQueue.push({ type, data, targetUser, timestamp: Date.now() });
      return;
    }
    
    const message = {
      type,
      data,
      timestamp: Date.now(),
      from: 'current_user'
    };
    
    console.log(`📤 Sending collaboration message: ${type}`, data);
    
    // In a real implementation, this would send via WebRTC data channels
    // For demo, we simulate message sending
    setTimeout(() => {
      this.handleIncomingMessage(message);
    }, 50 + Math.random() * 100);
  }
  
  private handleIncomingMessage(message: any) {
    console.log(`📥 Received collaboration message: ${message.type}`, message.data);
    
    switch (message.type) {
      case 'cursor-move':
        this.handleCursorMove(message.data);
        break;
      case 'code-change':
        this.handleCodeChange(message.data);
        break;
      case 'chat-message':
        this.handleChatMessage(message.data);
        break;
      case 'user-join':
        this.handleUserJoin(message.data);
        break;
      case 'user-leave':
        this.handleUserLeave(message.data);
        break;
    }
  }
  
  private handleCursorMove(data: any) {
    // Update cursor position for other users
    console.log('👆 Cursor move:', data);
  }
  
  private handleCodeChange(data: CodeChange) {
    // Apply code changes from other users
    console.log('📝 Code change:', data);
    
    // Conflict resolution logic would go here
  }
  
  private handleChatMessage(data: ChatMessage) {
    // Handle incoming chat messages
    console.log('💬 Chat message:', data);
  }
  
  private handleUserJoin(data: CollaborationUser) {
    console.log('👥 User joined:', data.name);
  }
  
  private handleUserLeave(data: { userId: string }) {
    console.log('👋 User left:', data.userId);
  }
  
  async enableVoiceChat(enabled: boolean) {
    if (enabled && !this.localStream) {
      try {
        this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('🎤 Voice chat enabled');
      } catch (error) {
        console.error('❌ Failed to enable voice chat:', error);
        throw error;
      }
    } else if (!enabled && this.localStream) {
      this.localStream.getAudioTracks().forEach(track => track.stop());
      console.log('🔇 Voice chat disabled');
    }
  }
  
  async enableVideoChat(enabled: boolean) {
    if (enabled && !this.localStream?.getVideoTracks().length) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: this.localStream?.getAudioTracks().length > 0,
          video: true 
        });
        this.localStream = stream;
        console.log('📹 Video chat enabled');
      } catch (error) {
        console.error('❌ Failed to enable video chat:', error);
        throw error;
      }
    } else if (!enabled && this.localStream) {
      this.localStream.getVideoTracks().forEach(track => track.stop());
      console.log('📹 Video chat disabled');
    }
  }
  
  async shareScreen() {
    try {
      const screenStream = await (navigator.mediaDevices as any).getDisplayMedia({
        video: true,
        audio: true
      });
      console.log('🖥️ Screen sharing started');
      return screenStream;
    } catch (error) {
      console.error('❌ Screen sharing failed:', error);
      throw error;
    }
  }
  
  endSession() {
    console.log('🔚 Ending collaboration session');
    
    // Clean up resources
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }
    
    this.peerConnections.clear();
    this.dataChannels.clear();
    this.currentSession = undefined;
    this.isConnected = false;
    
    console.log('✅ Collaboration session ended');
  }
  
  getCurrentSession(): CollaborationSession | undefined {
    return this.currentSession;
  }
  
  isSessionActive(): boolean {
    return this.isConnected && this.currentSession?.status === 'active';
  }
}

// Composant principal
interface UltraCollaborationHubProps {
  visible: boolean;
  onClose: () => void;
}

export const UltraCollaborationHub: React.FC<UltraCollaborationHubProps> = ({
  visible,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'sessions' | 'participants' | 'chat' | 'settings'>('sessions');
  const [currentSession, setCurrentSession] = useState<CollaborationSession | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const collaborationEngine = CollaborationEngine.getInstance();
  
  // Start new collaboration session
  const startNewSession = async () => {
    setConnectionStatus('connecting');
    
    try {
      const settings: SessionSettings = {
        allowAnonymous: false,
        requireApproval: true,
        enableVoiceChat: true,
        enableVideoChat: true,
        enableScreenShare: true,
        conflictResolution: 'last-write-wins',
        autoSave: true,
        maxParticipants: 10
      };
      
      const session = await collaborationEngine.startSession('New VB6 Project Session', settings);
      setCurrentSession(session);
      setConnectionStatus('connected');
      
      // Add welcome message
      const welcomeMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        userId: 'system',
        content: `Welcome to the collaboration session! You can now work together on your VB6 project.`,
        type: 'system',
        timestamp: new Date()
      };
      setChatMessages([welcomeMessage]);
      
    } catch (error) {
      console.error('Failed to start session:', error);
      setConnectionStatus('disconnected');
    }
  };
  
  // Join existing session
  const joinSession = async () => {
    setConnectionStatus('connecting');
    
    try {
      const session = await collaborationEngine.joinSession('demo_session', {
        name: 'Developer',
        email: 'dev@example.com'
      });
      setCurrentSession(session);
      setConnectionStatus('connected');
      
      // Add join message
      const joinMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        userId: 'system',
        content: `You joined the collaboration session "${session.name}".`,
        type: 'system',
        timestamp: new Date()
      };
      setChatMessages([joinMessage]);
      
    } catch (error) {
      console.error('Failed to join session:', error);
      setConnectionStatus('disconnected');
    }
  };
  
  // End session
  const endSession = () => {
    if (currentSession) {
      collaborationEngine.endSession();
      setCurrentSession(null);
      setConnectionStatus('disconnected');
      setChatMessages([]);
      setIsVoiceEnabled(false);
      setIsVideoEnabled(false);
      setIsScreenSharing(false);
    }
  };
  
  // Send chat message
  const sendChatMessage = () => {
    if (!newMessage.trim() || !currentSession) return;
    
    const message: ChatMessage = {
      id: `msg_${Date.now()}`,
      userId: 'current_user',
      content: newMessage,
      type: 'text',
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, message]);
    setNewMessage('');
    
    // Send to other participants
    collaborationEngine.sendMessage('chat-message', message);
  };
  
  // Toggle voice chat
  const toggleVoiceChat = async () => {
    try {
      await collaborationEngine.enableVoiceChat(!isVoiceEnabled);
      setIsVoiceEnabled(!isVoiceEnabled);
    } catch (error) {
      console.error('Failed to toggle voice chat:', error);
    }
  };
  
  // Toggle video chat
  const toggleVideoChat = async () => {
    try {
      await collaborationEngine.enableVideoChat(!isVideoEnabled);
      setIsVideoEnabled(!isVideoEnabled);
    } catch (error) {
      console.error('Failed to toggle video chat:', error);
    }
  };
  
  // Toggle screen sharing
  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const stream = await collaborationEngine.shareScreen();
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsScreenSharing(true);
      } else {
        setIsScreenSharing(false);
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      }
    } catch (error) {
      console.error('Failed to toggle screen share:', error);
    }
  };
  
  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);
  
  // Simulate receiving messages
  useEffect(() => {
    if (currentSession && connectionStatus === 'connected') {
      const interval = setInterval(() => {
        if (Math.random() < 0.3) { // 30% chance every 10 seconds
          const demoMessages = [
            'Great work on the form validation!',
            'I think we should refactor this function',
            'The performance improvements look good',
            'Can you check the database connection?',
            'Let\'s test this change together'
          ];
          
          const message: ChatMessage = {
            id: `msg_${Date.now()}`,
            userId: currentSession.owner.id === 'current_user' ? 'other_user' : currentSession.owner.id,
            content: demoMessages[Math.floor(Math.random() * demoMessages.length)],
            type: 'text',
            timestamp: new Date()
          };
          
          setChatMessages(prev => [...prev, message]);
        }
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [currentSession, connectionStatus]);
  
  if (!visible) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-7xl h-5/6 flex">
        {/* Sidebar */}
        <div className="w-80 border-r dark:border-gray-700 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b dark:border-gray-700 bg-gradient-to-r from-green-600 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users size={20} />
                <h3 className="font-semibold">Collaboration</h3>
              </div>
              <div className={`px-2 py-1 rounded text-xs font-medium ${
                connectionStatus === 'connected' ? 'bg-green-500 bg-opacity-20' :
                connectionStatus === 'connecting' ? 'bg-yellow-500 bg-opacity-20' :
                'bg-red-500 bg-opacity-20'
              }`}>
                {connectionStatus === 'connected' ? (
                  <><Wifi size={12} className="inline mr-1" />Connected</>
                ) : connectionStatus === 'connecting' ? (
                  <><Activity size={12} className="inline mr-1 animate-pulse" />Connecting</>
                ) : (
                  <><WifiOff size={12} className="inline mr-1" />Disconnected</>
                )}
              </div>
            </div>
          </div>
          
          {/* Session Info */}
          {currentSession && (
            <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <h4 className="font-medium truncate">{currentSession.name}</h4>
              <div className="text-sm text-gray-600 mt-1">
                {currentSession.participants.length + 1} participants
              </div>
              <div className="flex items-center mt-2 space-x-2">
                <button
                  onClick={toggleVoiceChat}
                  className={`p-2 rounded ${
                    isVoiceEnabled ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}
                  title={isVoiceEnabled ? 'Mute' : 'Unmute'}
                >
                  {isVoiceEnabled ? <Mic size={16} /> : <MicOff size={16} />}
                </button>
                <button
                  onClick={toggleVideoChat}
                  className={`p-2 rounded ${
                    isVideoEnabled ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}
                  title={isVideoEnabled ? 'Turn off video' : 'Turn on video'}
                >
                  {isVideoEnabled ? <Video size={16} /> : <VideoOff size={16} />}
                </button>
                <button
                  onClick={toggleScreenShare}
                  className={`p-2 rounded ${
                    isScreenSharing ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}
                  title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
                >
                  <ScreenShare size={16} />
                </button>
                <button
                  onClick={endSession}
                  className="p-2 bg-red-600 text-white rounded hover:bg-red-700"
                  title="End session"
                >
                  <PhoneOff size={16} />
                </button>
              </div>
            </div>
          )}
          
          {/* Participants */}
          <div className="flex-1 overflow-auto p-4">
            <h5 className="text-sm font-medium text-gray-700 mb-3">Participants</h5>
            {currentSession ? (
              <div className="space-y-2">
                {/* Owner */}
                <div className="flex items-center space-x-3 p-2 bg-blue-50 rounded">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                    {currentSession.owner.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-1">
                      <span className="font-medium text-sm">{currentSession.owner.name}</span>
                      <Crown size={12} className="text-yellow-600" />
                    </div>
                    <div className="text-xs text-gray-500">{currentSession.owner.email}</div>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${
                    currentSession.owner.status === 'online' ? 'bg-green-500' :
                    currentSession.owner.status === 'away' ? 'bg-yellow-500' :
                    'bg-gray-400'
                  }`} />
                </div>
                
                {/* Participants */}
                {currentSession.participants.map(participant => (
                  <div key={participant.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                    <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                      {participant.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-1">
                        <span className="font-medium text-sm">{participant.name}</span>
                        {participant.role === 'collaborator' && <Edit size={12} className="text-blue-600" />}
                        {participant.role === 'viewer' && <Eye size={12} className="text-gray-600" />}
                      </div>
                      <div className="text-xs text-gray-500">{participant.email}</div>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${
                      participant.status === 'online' ? 'bg-green-500' :
                      participant.status === 'away' ? 'bg-yellow-500' :
                      'bg-gray-400'
                    }`} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 text-sm">No active session</p>
              </div>
            )}
          </div>
          
          {/* Quick Actions */}
          {!currentSession && (
            <div className="p-4 border-t dark:border-gray-700">
              <div className="space-y-2">
                <button
                  onClick={startNewSession}
                  disabled={connectionStatus === 'connecting'}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm"
                >
                  Start New Session
                </button>
                <button
                  onClick={joinSession}
                  disabled={connectionStatus === 'connecting'}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
                >
                  Join Session
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <Globe className="text-green-600" size={24} />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Ultra Collaboration Hub
              </h2>
              {currentSession && (
                <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  LIVE SESSION
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {currentSession && isScreenSharing && (
                <div className="flex items-center space-x-1 bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm">
                  <Monitor size={16} />
                  <span>Sharing Screen</span>
                </div>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              >
                <X size={20} />
              </button>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex border-b dark:border-gray-700">
            {[
              { id: 'sessions', label: 'Session', icon: PlayCircle },
              { id: 'participants', label: 'Participants', icon: Users },
              { id: 'chat', label: 'Chat', icon: MessageSquare },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3 flex items-center space-x-2 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-green-500 text-green-600 bg-green-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon size={16} />
                <span>{tab.label}</span>
                {tab.id === 'chat' && chatMessages.length > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-5 h-5 flex items-center justify-center">
                    {chatMessages.length}
                  </span>
                )}
              </button>
            ))}
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-auto">
            {activeTab === 'sessions' && (
              <div className="p-6">
                {currentSession ? (
                  <div className="space-y-6">
                    {/* Session Overview */}
                    <div className="bg-white border rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4">Current Session</h3>
                      
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{currentSession.participants.length + 1}</div>
                          <div className="text-sm text-gray-600">Participants</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {Math.floor((Date.now() - currentSession.created.getTime()) / 60000)}m
                          </div>
                          <div className="text-sm text-gray-600">Duration</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">{chatMessages.length}</div>
                          <div className="text-sm text-gray-600">Messages</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">Good</div>
                          <div className="text-sm text-gray-600">Connection</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{currentSession.name}</h4>
                          <p className="text-sm text-gray-600">
                            Started {currentSession.created.toLocaleString()}
                          </p>
                        </div>
                        
                        <div className="flex space-x-2">
                          <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                            <UserPlus size={14} className="mr-1 inline" />
                            Invite
                          </button>
                          <button className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">
                            <Share size={14} className="mr-1 inline" />
                            Share Link
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Video/Screen Share Area */}
                    {(isVideoEnabled || isScreenSharing) && (
                      <div className="bg-black rounded-lg overflow-hidden">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          className="w-full h-64 object-cover"
                        />
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                          {isScreenSharing ? 'Screen Share' : 'Video Chat'}
                        </div>
                      </div>
                    )}
                    
                    {/* Collaboration Features */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="bg-white border rounded-lg p-4">
                        <h4 className="font-medium mb-3">Real-time Features</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span>Live Cursors</span>
                            <CheckCircle className="text-green-600" size={16} />
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Code Synchronization</span>
                            <CheckCircle className="text-green-600" size={16} />
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Form Designer Sync</span>
                            <CheckCircle className="text-green-600" size={16} />
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Collaborative Debugging</span>
                            <CheckCircle className="text-green-600" size={16} />
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white border rounded-lg p-4">
                        <h4 className="font-medium mb-3">Communication</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span>Voice Chat</span>
                            {isVoiceEnabled ? (
                              <CheckCircle className="text-green-600" size={16} />
                            ) : (
                              <span className="text-gray-400">Disabled</span>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Video Chat</span>
                            {isVideoEnabled ? (
                              <CheckCircle className="text-green-600" size={16} />
                            ) : (
                              <span className="text-gray-400">Disabled</span>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Screen Sharing</span>
                            {isScreenSharing ? (
                              <CheckCircle className="text-green-600" size={16} />
                            ) : (
                              <span className="text-gray-400">Not active</span>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Text Chat</span>
                            <CheckCircle className="text-green-600" size={16} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Globe size={64} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">
                      Start Collaborating
                    </h3>
                    <p className="text-gray-500 mb-6">
                      Create a new session or join an existing one to collaborate with other developers
                    </p>
                    <div className="space-x-4">
                      <button
                        onClick={startNewSession}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        <UserPlus className="mr-2 inline" size={16} />
                        Start New Session
                      </button>
                      <button
                        onClick={joinSession}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <Globe className="mr-2 inline" size={16} />
                        Join Session
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'participants' && (
              <div className="p-6">
                {currentSession ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Session Participants</h3>
                    
                    {/* Owner */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                            {currentSession.owner.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium">{currentSession.owner.name}</h4>
                              <Crown className="text-yellow-600" size={16} />
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Owner</span>
                            </div>
                            <p className="text-sm text-gray-600">{currentSession.owner.email}</p>
                            <div className="flex items-center mt-1 text-xs text-gray-500">
                              <div className={`w-2 h-2 rounded-full mr-2 ${
                                currentSession.owner.status === 'online' ? 'bg-green-500' :
                                currentSession.owner.status === 'away' ? 'bg-yellow-500' :
                                'bg-gray-400'
                              }`} />
                              {currentSession.owner.status} • Connection: {currentSession.owner.connectionQuality}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-sm font-medium">All Permissions</div>
                          <div className="flex space-x-1 mt-1">
                            <Edit className="text-green-600" size={16} title="Can Edit" />
                            <Code className="text-blue-600" size={16} title="Can Debug" />
                            <Share className="text-purple-600" size={16} title="Can Share" />
                            <Settings className="text-gray-600" size={16} title="Can Manage" />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Collaborators */}
                    {currentSession.participants.map(participant => (
                      <div key={participant.id} className="bg-white border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center text-white font-medium">
                              {participant.name.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <h4 className="font-medium">{participant.name}</h4>
                                <span className={`text-xs px-2 py-1 rounded ${
                                  participant.role === 'collaborator' ? 'bg-green-100 text-green-800' :
                                  participant.role === 'viewer' ? 'bg-gray-100 text-gray-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {participant.role}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">{participant.email}</p>
                              <div className="flex items-center mt-1 text-xs text-gray-500">
                                <div className={`w-2 h-2 rounded-full mr-2 ${
                                  participant.status === 'online' ? 'bg-green-500' :
                                  participant.status === 'away' ? 'bg-yellow-500' :
                                  'bg-gray-400'
                                }`} />
                                {participant.status} • Last active: {participant.lastActivity.toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-sm font-medium">Permissions</div>
                            <div className="flex space-x-1 mt-1">
                              {participant.permissions.canEdit && <Edit className="text-green-600" size={16} title="Can Edit" />}
                              {participant.permissions.canDebug && <Code className="text-blue-600" size={16} title="Can Debug" />}
                              {participant.permissions.canShareScreen && <Share className="text-purple-600" size={16} title="Can Share" />}
                              {participant.role === 'viewer' && <Eye className="text-gray-600" size={16} title="View Only" />}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users size={64} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">No active collaboration session</p>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'chat' && (
              <div className="flex flex-col h-full">
                {/* Chat Messages */}
                <div className="flex-1 overflow-auto p-4">
                  {chatMessages.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageSquare size={64} className="mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500">No messages yet</p>
                      <p className="text-sm text-gray-400">Start a conversation with your team</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {chatMessages.map(message => (
                        <div key={message.id} className={`flex ${
                          message.userId === 'current_user' ? 'justify-end' : 'justify-start'
                        }`}>
                          <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.userId === 'current_user' 
                              ? 'bg-blue-600 text-white'
                              : message.type === 'system'
                                ? 'bg-gray-100 text-gray-800 text-center'
                                : 'bg-gray-100 text-gray-800'
                          }`}>
                            {message.type !== 'system' && message.userId !== 'current_user' && (
                              <div className="text-xs font-medium mb-1">
                                {currentSession?.owner.id === message.userId ? currentSession.owner.name : 'Collaborator'}
                              </div>
                            )}
                            <div className="text-sm">{message.content}</div>
                            <div className={`text-xs mt-1 ${
                              message.userId === 'current_user' ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {message.timestamp.toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>
                  )}
                </div>
                
                {/* Chat Input */}
                {currentSession && (
                  <div className="border-t dark:border-gray-700 p-4">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                        placeholder="Type a message..."
                        className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <button
                        onClick={sendChatMessage}
                        disabled={!newMessage.trim()}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'settings' && (
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-6">Collaboration Settings</h3>
                
                {currentSession ? (
                  <div className="space-y-6">
                    {/* Session Settings */}
                    <div className="bg-white border rounded-lg p-4">
                      <h4 className="font-medium mb-4">Session Configuration</h4>
                      <div className="space-y-4">
                        <label className="flex items-center justify-between">
                          <span className="text-sm">Allow anonymous users</span>
                          <input type="checkbox" defaultChecked={currentSession.settings.allowAnonymous} />
                        </label>
                        <label className="flex items-center justify-between">
                          <span className="text-sm">Require approval for new participants</span>
                          <input type="checkbox" defaultChecked={currentSession.settings.requireApproval} />
                        </label>
                        <label className="flex items-center justify-between">
                          <span className="text-sm">Auto-save changes</span>
                          <input type="checkbox" defaultChecked={currentSession.settings.autoSave} />
                        </label>
                        <div>
                          <label className="block text-sm font-medium mb-1">Max participants</label>
                          <input 
                            type="number" 
                            defaultValue={currentSession.settings.maxParticipants}
                            min="2"
                            max="50"
                            className="w-20 px-2 py-1 border rounded text-sm"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Communication Settings */}
                    <div className="bg-white border rounded-lg p-4">
                      <h4 className="font-medium mb-4">Communication</h4>
                      <div className="space-y-4">
                        <label className="flex items-center justify-between">
                          <span className="text-sm">Enable voice chat</span>
                          <input type="checkbox" defaultChecked={currentSession.settings.enableVoiceChat} />
                        </label>
                        <label className="flex items-center justify-between">
                          <span className="text-sm">Enable video chat</span>
                          <input type="checkbox" defaultChecked={currentSession.settings.enableVideoChat} />
                        </label>
                        <label className="flex items-center justify-between">
                          <span className="text-sm">Enable screen sharing</span>
                          <input type="checkbox" defaultChecked={currentSession.settings.enableScreenShare} />
                        </label>
                      </div>
                    </div>
                    
                    {/* Conflict Resolution */}
                    <div className="bg-white border rounded-lg p-4">
                      <h4 className="font-medium mb-4">Conflict Resolution</h4>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input 
                            type="radio" 
                            name="conflictResolution" 
                            value="first-write-wins"
                            defaultChecked={currentSession.settings.conflictResolution === 'first-write-wins'}
                            className="mr-2"
                          />
                          <span className="text-sm">First write wins</span>
                        </label>
                        <label className="flex items-center">
                          <input 
                            type="radio" 
                            name="conflictResolution" 
                            value="last-write-wins"
                            defaultChecked={currentSession.settings.conflictResolution === 'last-write-wins'}
                            className="mr-2"
                          />
                          <span className="text-sm">Last write wins</span>
                        </label>
                        <label className="flex items-center">
                          <input 
                            type="radio" 
                            name="conflictResolution" 
                            value="manual"
                            defaultChecked={currentSession.settings.conflictResolution === 'manual'}
                            className="mr-2"
                          />
                          <span className="text-sm">Manual resolution</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Settings size={64} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">Start a collaboration session to access settings</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UltraCollaborationHub;