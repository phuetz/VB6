/**
 * VB6 SysInfo Control Implementation
 * 
 * System information control with web-compatible system data
 */

import React, { useState, useCallback, useEffect } from 'react';

export interface SysInfoControl {
  type: 'SysInfo';
  name: string;
  left: number;
  top: number;
  width: number;
  height: number;
  
  // System Properties (read-only)
  acStatus: number; // AC power status
  batteryFullTime: number; // Battery full time in seconds
  batteryLifePercent: number; // Battery life percentage
  batteryLifeTime: number; // Battery life time in seconds
  batteryStatus: number; // Battery status
  
  // OS Properties
  osVersion: string; // Operating system version
  osBuild: string; // OS build number
  osCompatible: string; // Compatible OS
  osPlatform: number; // Platform ID
  
  // Computer Properties
  computerName: string; // Computer name
  userName: string; // Current user name
  workingArea: { left: number; top: number; width: number; height: number }; // Working area
  
  // Screen Properties
  screenWidth: number; // Screen width in pixels
  screenHeight: number; // Screen height in pixels
  screenColorDepth: number; // Color depth
  
  // Input Properties
  mouseButtons: number; // Number of mouse buttons
  mousePresent: boolean; // Mouse present
  mouseWheelPresent: boolean; // Mouse wheel present
  keyboardType: number; // Keyboard type
  
  // Behavior
  enabled: boolean;
  visible: boolean;
  tag: string;
}

// SysInfo Constants
export const SysInfoConstants = {
  // AC Status
  AC_LINE_OFFLINE: 0,
  AC_LINE_ONLINE: 1,
  AC_LINE_BACKUP_POWER: 2,
  AC_LINE_UNKNOWN: 255,
  
  // Battery Status
  BATTERY_HIGH: 1,
  BATTERY_LOW: 2,
  BATTERY_CRITICAL: 4,
  BATTERY_CHARGING: 8,
  BATTERY_NO_SYSTEM: 128,
  BATTERY_UNKNOWN: 255,
  
  // Platform IDs
  VER_PLATFORM_WIN32s: 0,
  VER_PLATFORM_WIN32_WINDOWS: 1,
  VER_PLATFORM_WIN32_NT: 2,
  
  // Keyboard Types
  KB_84KEY: 1,
  KB_102KEY: 2,
  KB_106KEY: 3,
  KB_ENHANCED: 4,
  KB_UNKNOWN: 0
};

interface SysInfoControlProps {
  control: SysInfoControl;
  isDesignMode?: boolean;
  onPropertyChange?: (property: string, value: any) => void;
  onEvent?: (eventName: string, eventData?: any) => void;
}

export const SysInfoControl: React.FC<SysInfoControlProps> = ({
  control,
  isDesignMode = false,
  onPropertyChange,
  onEvent
}) => {
  const {
    name,
    left = 0,
    top = 0,
    width = 32,
    height = 32,
    acStatus = SysInfoConstants.AC_LINE_UNKNOWN,
    batteryFullTime = 0,
    batteryLifePercent = 0,
    batteryLifeTime = 0,
    batteryStatus = SysInfoConstants.BATTERY_UNKNOWN,
    osVersion = '',
    osBuild = '',
    osCompatible = '',
    osPlatform = SysInfoConstants.VER_PLATFORM_WIN32_NT,
    computerName = '',
    userName = '',
    workingArea = { left: 0, top: 0, width: 0, height: 0 },
    screenWidth = 0,
    screenHeight = 0,
    screenColorDepth = 0,
    mouseButtons = 0,
    mousePresent = true,
    mouseWheelPresent = true,
    keyboardType = SysInfoConstants.KB_ENHANCED,
    enabled = true,
    visible = true,
    tag = ''
  } = control;

  const [systemInfo, setSystemInfo] = useState({
    acStatus,
    batteryFullTime,
    batteryLifePercent,
    batteryLifeTime,
    batteryStatus,
    osVersion,
    osBuild,
    osCompatible,
    osPlatform,
    computerName,
    userName,
    workingArea,
    screenWidth,
    screenHeight,
    screenColorDepth,
    mouseButtons,
    mousePresent,
    mouseWheelPresent,
    keyboardType
  });

  // Get system information using modern web APIs
  const updateSystemInfo = useCallback(async () => {
    const info = { ...systemInfo };

    try {
      // Screen information
      info.screenWidth = window.screen.width;
      info.screenHeight = window.screen.height;
      info.screenColorDepth = window.screen.colorDepth;

      // Working area (available screen space)
      info.workingArea = {
        left: window.screen.availLeft || 0,
        top: window.screen.availTop || 0,
        width: window.screen.availWidth,
        height: window.screen.availHeight
      };

      // User agent parsing for OS information
      const userAgent = navigator.userAgent;
      const platform = navigator.platform;

      if (userAgent.includes('Windows NT')) {
        const match = userAgent.match(/Windows NT ([0-9.]+)/);
        if (match) {
          const version = match[1];
          info.osVersion = `Windows ${getWindowsName(version)} (${version})`;
          info.osBuild = version;
          info.osCompatible = 'Windows';
          info.osPlatform = SysInfoConstants.VER_PLATFORM_WIN32_NT;
        }
      } else if (userAgent.includes('Mac OS X')) {
        const match = userAgent.match(/Mac OS X ([0-9_]+)/);
        if (match) {
          const version = match[1].replace(/_/g, '.');
          info.osVersion = `macOS ${version}`;
          info.osBuild = version;
          info.osCompatible = 'macOS';
          info.osPlatform = SysInfoConstants.VER_PLATFORM_WIN32_NT; // Simulated
        }
      } else if (userAgent.includes('Linux')) {
        info.osVersion = 'Linux';
        info.osBuild = 'Unknown';
        info.osCompatible = 'Linux';
        info.osPlatform = SysInfoConstants.VER_PLATFORM_WIN32_NT; // Simulated
      } else {
        info.osVersion = platform || 'Unknown';
        info.osBuild = 'Unknown';
        info.osCompatible = 'Unknown';
        info.osPlatform = SysInfoConstants.VER_PLATFORM_WIN32_NT;
      }

      // Computer name (simulated)
      info.computerName = 'WEB-CLIENT';

      // User name (simulated - real user info not available in browser)
      info.userName = 'WebUser';

      // Mouse information
      info.mousePresent = 'onmousedown' in window;
      info.mouseButtons = 3; // Assume 3-button mouse
      info.mouseWheelPresent = 'onwheel' in document;

      // Keyboard type (simulated)
      info.keyboardType = SysInfoConstants.KB_ENHANCED;

      // Battery information (if available)
      if ('getBattery' in navigator) {
        try {
          const battery = await (navigator as any).getBattery();
          info.batteryLifePercent = Math.round(battery.level * 100);
          info.batteryLifeTime = battery.dischargingTime === Infinity ? 0 : battery.dischargingTime;
          info.batteryFullTime = battery.chargingTime === Infinity ? 0 : battery.chargingTime;
          
          if (battery.charging) {
            info.batteryStatus = SysInfoConstants.BATTERY_CHARGING;
            info.acStatus = SysInfoConstants.AC_LINE_ONLINE;
          } else {
            info.acStatus = SysInfoConstants.AC_LINE_OFFLINE;
            
            if (battery.level > 0.5) {
              info.batteryStatus = SysInfoConstants.BATTERY_HIGH;
            } else if (battery.level > 0.2) {
              info.batteryStatus = SysInfoConstants.BATTERY_LOW;
            } else {
              info.batteryStatus = SysInfoConstants.BATTERY_CRITICAL;
            }
          }
        } catch (error) {
          // Battery API not supported or denied
          info.batteryStatus = SysInfoConstants.BATTERY_UNKNOWN;
          info.acStatus = SysInfoConstants.AC_LINE_UNKNOWN;
        }
      } else {
        // No battery API support (likely desktop)
        info.batteryStatus = SysInfoConstants.BATTERY_NO_SYSTEM;
        info.acStatus = SysInfoConstants.AC_LINE_ONLINE;
      }

    } catch (error) {
      console.warn('Error getting system information:', error);
    }

    setSystemInfo(info);

    // Update control properties
    Object.entries(info).forEach(([key, value]) => {
      onPropertyChange?.(key, value);
    });

  }, [systemInfo, onPropertyChange]);

  // Helper function to get Windows version name
  const getWindowsName = (version: string): string => {
    const versionMap: { [key: string]: string } = {
      '10.0': '10/11',
      '6.3': '8.1',
      '6.2': '8',
      '6.1': '7',
      '6.0': 'Vista',
      '5.2': 'XP x64',
      '5.1': 'XP',
      '5.0': '2000'
    };
    return versionMap[version] || version;
  };

  // Refresh system information
  const refresh = useCallback(() => {
    updateSystemInfo();
  }, [updateSystemInfo]);

  // Initialize system info on mount
  useEffect(() => {
    if (!isDesignMode) {
      updateSystemInfo();
    }
  }, [isDesignMode, updateSystemInfo]);

  // Update system info periodically
  useEffect(() => {
    if (!isDesignMode) {
      const interval = setInterval(() => {
        updateSystemInfo();
      }, 30000); // Update every 30 seconds

      return () => clearInterval(interval);
    }
  }, [isDesignMode, updateSystemInfo]);

  // Handle double click to refresh
  const handleDoubleClick = useCallback(() => {
    if (!enabled) return;
    refresh();
  }, [enabled, refresh]);

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
    fontFamily: 'Tahoma, Arial, sans-serif'
  };

  return (
    <div
      className={`vb6-sysinfo ${!enabled ? 'disabled' : ''}`}
      style={containerStyle}
      onDoubleClick={handleDoubleClick}
      data-name={name}
      data-type="SysInfo"
      title={`SysInfo - ${systemInfo.osVersion} - ${systemInfo.screenWidth}x${systemInfo.screenHeight}`}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '12px', marginBottom: '2px' }}>
          💻
        </div>
        <div>SysInfo</div>
        <div style={{ fontSize: '8px' }}>
          {systemInfo.screenWidth}x{systemInfo.screenHeight}
        </div>
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
            zIndex: 1000
          }}
        >
          {name} - {systemInfo.osVersion}
        </div>
      )}
    </div>
  );
};

// SysInfo Helper Functions
export const SysInfoHelpers = {
  /**
   * Create default SysInfo control
   */
  createSysInfo: (): SysInfoControl => {
    return {
      type: 'SysInfo',
      name: 'SysInfo1',
      left: 0,
      top: 0,
      width: 32,
      height: 32,
      acStatus: SysInfoConstants.AC_LINE_UNKNOWN,
      batteryFullTime: 0,
      batteryLifePercent: 0,
      batteryLifeTime: 0,
      batteryStatus: SysInfoConstants.BATTERY_UNKNOWN,
      osVersion: '',
      osBuild: '',
      osCompatible: '',
      osPlatform: SysInfoConstants.VER_PLATFORM_WIN32_NT,
      computerName: '',
      userName: '',
      workingArea: { left: 0, top: 0, width: 0, height: 0 },
      screenWidth: 0,
      screenHeight: 0,
      screenColorDepth: 0,
      mouseButtons: 3,
      mousePresent: true,
      mouseWheelPresent: true,
      keyboardType: SysInfoConstants.KB_ENHANCED,
      enabled: true,
      visible: true,
      tag: ''
    };
  },

  /**
   * Get AC status description
   */
  getACStatusDescription: (status: number): string => {
    const descriptions: { [key: number]: string } = {
      [SysInfoConstants.AC_LINE_OFFLINE]: 'Offline',
      [SysInfoConstants.AC_LINE_ONLINE]: 'Online',
      [SysInfoConstants.AC_LINE_BACKUP_POWER]: 'Backup Power',
      [SysInfoConstants.AC_LINE_UNKNOWN]: 'Unknown'
    };
    return descriptions[status] || 'Unknown';
  },

  /**
   * Get battery status description
   */
  getBatteryStatusDescription: (status: number): string => {
    const descriptions: { [key: number]: string } = {
      [SysInfoConstants.BATTERY_HIGH]: 'High',
      [SysInfoConstants.BATTERY_LOW]: 'Low',
      [SysInfoConstants.BATTERY_CRITICAL]: 'Critical',
      [SysInfoConstants.BATTERY_CHARGING]: 'Charging',
      [SysInfoConstants.BATTERY_NO_SYSTEM]: 'No Battery',
      [SysInfoConstants.BATTERY_UNKNOWN]: 'Unknown'
    };
    return descriptions[status] || 'Unknown';
  },

  /**
   * Get platform description
   */
  getPlatformDescription: (platform: number): string => {
    const descriptions: { [key: number]: string } = {
      [SysInfoConstants.VER_PLATFORM_WIN32s]: 'Win32s',
      [SysInfoConstants.VER_PLATFORM_WIN32_WINDOWS]: 'Windows 9x',
      [SysInfoConstants.VER_PLATFORM_WIN32_NT]: 'Windows NT'
    };
    return descriptions[platform] || 'Unknown';
  },

  /**
   * Get keyboard type description
   */
  getKeyboardTypeDescription: (type: number): string => {
    const descriptions: { [key: number]: string } = {
      [SysInfoConstants.KB_84KEY]: '84-key',
      [SysInfoConstants.KB_102KEY]: '102-key',
      [SysInfoConstants.KB_106KEY]: '106-key',
      [SysInfoConstants.KB_ENHANCED]: 'Enhanced',
      [SysInfoConstants.KB_UNKNOWN]: 'Unknown'
    };
    return descriptions[type] || 'Unknown';
  },

  /**
   * Format time in seconds to readable format
   */
  formatTime: (seconds: number): string => {
    if (seconds === 0 || seconds === Infinity) return 'Unknown';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  },

  /**
   * Get system capabilities
   */
  getSystemCapabilities: (sysInfo: SysInfoControl) => {
    return {
      hasBattery: sysInfo.batteryStatus !== SysInfoConstants.BATTERY_NO_SYSTEM,
      hasMouseWheel: sysInfo.mouseWheelPresent,
      isPortable: sysInfo.batteryStatus !== SysInfoConstants.BATTERY_NO_SYSTEM,
      colorDepth: sysInfo.screenColorDepth,
      resolution: `${sysInfo.screenWidth}x${sysInfo.screenHeight}`,
      workingAreaSize: `${sysInfo.workingArea.width}x${sysInfo.workingArea.height}`
    };
  }
};

// VB6 SysInfo Methods simulation
export const SysInfoMethods = {
  /**
   * Refresh all system information
   */
  refresh: (control: SysInfoControl): Promise<SysInfoControl> => {
    // This would trigger the component to refresh its data
    return Promise.resolve(control);
  },

  /**
   * Get specific system metric
   */
  getSystemMetric: (metric: string): number => {
    switch (metric.toLowerCase()) {
      case 'screenwidth':
        return window.screen.width;
      case 'screenheight':
        return window.screen.height;
      case 'colordepth':
        return window.screen.colorDepth;
      case 'mousebuttons':
        return 3; // Assume 3-button mouse
      default:
        return 0;
    }
  },

  /**
   * Check if feature is available
   */
  isFeatureAvailable: (feature: string): boolean => {
    switch (feature.toLowerCase()) {
      case 'battery':
        return 'getBattery' in navigator;
      case 'mousewheel':
        return 'onwheel' in document;
      case 'touch':
        return 'ontouchstart' in window;
      case 'geolocation':
        return 'geolocation' in navigator;
      default:
        return false;
    }
  },

  /**
   * Get environment variable (simulated)
   */
  getEnvironmentVariable: (name: string): string => {
    // Browser environment variables are limited
    const mockEnvVars: { [key: string]: string } = {
      'COMPUTERNAME': 'WEB-CLIENT',
      'USERNAME': 'WebUser',
      'OS': 'Web Browser',
      'PROCESSOR_ARCHITECTURE': navigator.platform,
      'USERDOMAIN': 'LOCAL'
    };
    
    return mockEnvVars[name.toUpperCase()] || '';
  }
};

export default SysInfoControl;