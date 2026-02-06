/**
 * VB6 Component Gallery UI - Complete Component and Add-in Management Interface
 * Provides browsing, installation, and management of VB6 components and add-ins
 * Combines Component Gallery and Add-in Manager functionality
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  VB6ComponentGalleryInstance,
  VB6ComponentInfo,
  VB6ComponentType,
  VB6ComponentCategory,
  VB6ComponentStatus,
  VB6ComponentSearchFilter,
  VB6ComponentInstallOptions,
} from '../../services/VB6ComponentGallery';
import {
  VB6AddInManagerInstance,
  VB6AddInInfo,
  VB6AddInType,
  VB6AddInState,
  VB6AddInEvent,
} from '../../services/VB6AddInManager';

interface VB6ComponentGalleryUIProps {
  visible: boolean;
  onClose: () => void;
}

type TabType = 'components' | 'addins' | 'installed' | 'settings';

export const VB6ComponentGalleryUI: React.FC<VB6ComponentGalleryUIProps> = ({
  visible,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('components');
  const [components, setComponents] = useState<VB6ComponentInfo[]>([]);
  const [addIns, setAddIns] = useState<VB6AddInInfo[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<VB6ComponentInfo | null>(null);
  const [selectedAddIn, setSelectedAddIn] = useState<VB6AddInInfo | null>(null);

  // Search and filter states
  const [searchText, setSearchText] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<VB6ComponentCategory | 'all'>('all');
  const [selectedType, setSelectedType] = useState<VB6ComponentType | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<VB6ComponentStatus | 'all'>('all');
  const [showCommercialOnly, setShowCommercialOnly] = useState<boolean>(false);
  const [minRating, setMinRating] = useState<number>(0);

  // Add-in filter states
  const [selectedAddInType, setSelectedAddInType] = useState<VB6AddInType | 'all'>('all');
  const [selectedAddInState, setSelectedAddInState] = useState<VB6AddInState | 'all'>('all');

  // Installation state
  const [isInstalling, setIsInstalling] = useState<boolean>(false);
  const [installProgress, setInstallProgress] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (visible) {
      refreshData();
    }
  }, [visible]);

  const refreshData = () => {
    setComponents(VB6ComponentGalleryInstance.getAllComponents());
    setAddIns(VB6AddInManagerInstance.getAllAddIns());
  };

  // Component operations
  const handleSearchComponents = useCallback(() => {
    const filter: VB6ComponentSearchFilter = {
      searchText: searchText || undefined,
      category: selectedCategory !== 'all' ? [selectedCategory] : undefined,
      type: selectedType !== 'all' ? [selectedType] : undefined,
      status: selectedStatus !== 'all' ? [selectedStatus] : undefined,
      commercial: showCommercialOnly ? true : undefined,
      minRating: minRating > 0 ? minRating : undefined,
    };

    const results = VB6ComponentGalleryInstance.searchComponents(filter);
    setComponents(results);
  }, [searchText, selectedCategory, selectedType, selectedStatus, showCommercialOnly, minRating]);

  useEffect(() => {
    handleSearchComponents();
  }, [handleSearchComponents]);

  const handleInstallComponent = async (componentId: string) => {
    try {
      setIsInstalling(true);
      setInstallProgress(`Installing ${componentId}...`);
      setError('');

      const options: VB6ComponentInstallOptions = {
        registerComponent: true,
        addToToolbox: true,
        createShortcuts: false,
        installDependencies: true,
        backupExisting: true,
      };

      const success = await VB6ComponentGalleryInstance.installComponent(componentId, options);

      if (success) {
        setInstallProgress(`Successfully installed ${componentId}`);
        refreshData();
        setTimeout(() => setInstallProgress(''), 3000);
      }
    } catch (err) {
      setError(`Installation failed: ${err}`);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleUninstallComponent = async (componentId: string) => {
    try {
      setIsInstalling(true);
      setInstallProgress(`Uninstalling ${componentId}...`);
      setError('');

      const success = await VB6ComponentGalleryInstance.uninstallComponent(componentId);

      if (success) {
        setInstallProgress(`Successfully uninstalled ${componentId}`);
        refreshData();
        setTimeout(() => setInstallProgress(''), 3000);
      }
    } catch (err) {
      setError(`Uninstallation failed: ${err}`);
    } finally {
      setIsInstalling(false);
    }
  };

  // Add-in operations
  const handleLoadAddIn = async (addInId: string) => {
    try {
      setIsInstalling(true);
      setInstallProgress(`Loading add-in ${addInId}...`);
      setError('');

      const success = await VB6AddInManagerInstance.loadAddIn(addInId);

      if (success) {
        setInstallProgress(`Successfully loaded ${addInId}`);
        refreshData();
        setTimeout(() => setInstallProgress(''), 3000);
      }
    } catch (err) {
      setError(`Loading failed: ${err}`);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleUnloadAddIn = async (addInId: string) => {
    try {
      setIsInstalling(true);
      setInstallProgress(`Unloading add-in ${addInId}...`);
      setError('');

      const success = await VB6AddInManagerInstance.unloadAddIn(addInId);

      if (success) {
        setInstallProgress(`Successfully unloaded ${addInId}`);
        refreshData();
        setTimeout(() => setInstallProgress(''), 3000);
      }
    } catch (err) {
      setError(`Unloading failed: ${err}`);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleToggleAddIn = (addInId: string) => {
    const addIn = VB6AddInManagerInstance.getAddIn(addInId);
    if (addIn) {
      addIn.enabled = !addIn.enabled;
      refreshData();
    }
  };

  // Filter add-ins
  const filteredAddIns = addIns.filter(addIn => {
    if (selectedAddInType !== 'all' && addIn.type !== selectedAddInType) return false;
    if (selectedAddInState !== 'all' && addIn.state !== selectedAddInState) return false;
    if (
      searchText &&
      !addIn.name.toLowerCase().includes(searchText.toLowerCase()) &&
      !addIn.description.toLowerCase().includes(searchText.toLowerCase())
    )
      return false;
    return true;
  });

  // Utility functions
  const getStatusColor = (status: VB6ComponentStatus): string => {
    switch (status) {
      case VB6ComponentStatus.INSTALLED:
        return '#00AA00';
      case VB6ComponentStatus.REGISTERED:
        return '#0080FF';
      case VB6ComponentStatus.AVAILABLE:
        return '#666666';
      case VB6ComponentStatus.BROKEN:
        return '#FF0000';
      case VB6ComponentStatus.NEEDS_UPDATE:
        return '#FF8800';
      case VB6ComponentStatus.DOWNLOADING:
        return '#8800FF';
      case VB6ComponentStatus.INSTALLING:
        return '#0088FF';
      default:
        return '#666666';
    }
  };

  const getStateColor = (state: VB6AddInState): string => {
    switch (state) {
      case VB6AddInState.LOADED:
        return '#00AA00';
      case VB6AddInState.UNLOADED:
        return '#666666';
      case VB6AddInState.DISABLED:
        return '#888888';
      case VB6AddInState.ERROR:
        return '#FF0000';
      case VB6AddInState.LOADING:
        return '#0088FF';
      case VB6AddInState.UNLOADING:
        return '#FF8800';
      default:
        return '#666666';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderStars = (rating: number): string => {
    return '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          width: '1100px',
          height: '750px',
          backgroundColor: '#F0F0F0',
          border: '2px outset #C0C0C0',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'MS Sans Serif',
          fontSize: '8pt',
        }}
      >
        {/* Title Bar */}
        <div
          style={{
            backgroundColor: '#0080FF',
            color: 'white',
            padding: '2px 6px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontWeight: 'bold',
          }}
        >
          <span>VB6 Component Gallery & Add-in Manager</span>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '0 4px',
              fontSize: '12px',
            }}
          >
            ×
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            backgroundColor: '#E0E0E0',
            padding: '2px 4px',
            borderBottom: '1px solid #C0C0C0',
            display: 'flex',
            gap: '0px',
          }}
        >
          {[
            { id: 'components', label: 'Components' },
            { id: 'addins', label: 'Add-ins' },
            { id: 'installed', label: 'Installed' },
            { id: 'settings', label: 'Settings' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              style={{
                padding: '4px 12px',
                fontSize: '8pt',
                backgroundColor: activeTab === tab.id ? '#FFFFFF' : '#E0E0E0',
                border: '1px outset #C0C0C0',
                borderBottom: activeTab === tab.id ? '1px solid #FFFFFF' : '1px solid #C0C0C0',
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
          {/* Components Tab */}
          {activeTab === 'components' && (
            <>
              {/* Filter Panel */}
              <div
                style={{
                  width: '250px',
                  backgroundColor: '#FFFFFF',
                  border: '1px inset #C0C0C0',
                  padding: '8px',
                  overflow: 'auto',
                }}
              >
                <div
                  style={{
                    fontWeight: 'bold',
                    marginBottom: '8px',
                    backgroundColor: '#C0C0C0',
                    padding: '2px',
                  }}
                >
                  Component Filters
                </div>

                <div style={{ marginBottom: '8px' }}>
                  <label style={{ display: 'block', fontSize: '7pt', fontWeight: 'bold' }}>
                    Search:
                  </label>
                  <input
                    type="text"
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '2px',
                      border: '1px inset #C0C0C0',
                      fontSize: '8pt',
                    }}
                    placeholder="Search components..."
                  />
                </div>

                <div style={{ marginBottom: '8px' }}>
                  <label style={{ display: 'block', fontSize: '7pt', fontWeight: 'bold' }}>
                    Category:
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value as any)}
                    style={{ width: '100%', border: '1px inset #C0C0C0', fontSize: '8pt' }}
                  >
                    <option value="all">All Categories</option>
                    {Object.values(VB6ComponentCategory).map(cat => (
                      <option key={cat} value={cat}>
                        {cat.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '8px' }}>
                  <label style={{ display: 'block', fontSize: '7pt', fontWeight: 'bold' }}>
                    Type:
                  </label>
                  <select
                    value={selectedType}
                    onChange={e => setSelectedType(e.target.value as any)}
                    style={{ width: '100%', border: '1px inset #C0C0C0', fontSize: '8pt' }}
                  >
                    <option value="all">All Types</option>
                    {Object.values(VB6ComponentType).map(type => (
                      <option key={type} value={type}>
                        {type.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '8px' }}>
                  <label style={{ display: 'block', fontSize: '7pt', fontWeight: 'bold' }}>
                    Status:
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={e => setSelectedStatus(e.target.value as any)}
                    style={{ width: '100%', border: '1px inset #C0C0C0', fontSize: '8pt' }}
                  >
                    <option value="all">All Status</option>
                    {Object.values(VB6ComponentStatus).map(status => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '8px' }}>
                  <label style={{ display: 'block', fontSize: '7pt', fontWeight: 'bold' }}>
                    Min Rating:
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.5"
                    value={minRating}
                    onChange={e => setMinRating(parseFloat(e.target.value))}
                    style={{ width: '100%' }}
                  />
                  <div style={{ fontSize: '7pt', textAlign: 'center' }}>{minRating} stars</div>
                </div>

                <div style={{ marginBottom: '8px' }}>
                  <label style={{ fontSize: '7pt' }}>
                    <input
                      type="checkbox"
                      checked={showCommercialOnly}
                      onChange={e => setShowCommercialOnly(e.target.checked)}
                    />{' '}
                    Commercial only
                  </label>
                </div>

                <div style={{ fontSize: '7pt', color: '#666', marginTop: '16px' }}>
                  Total: {components.length} components
                </div>
              </div>

              {/* Component List */}
              <div
                style={{
                  flex: 1,
                  backgroundColor: '#FFFFFF',
                  border: '1px inset #C0C0C0',
                  overflow: 'auto',
                }}
              >
                <div
                  style={{
                    fontWeight: 'bold',
                    backgroundColor: '#C0C0C0',
                    padding: '4px',
                    borderBottom: '1px solid #808080',
                  }}
                >
                  Components ({components.length})
                </div>

                {components.map(component => (
                  <div
                    key={component.id}
                    style={{
                      padding: '6px',
                      borderBottom: '1px solid #E0E0E0',
                      cursor: 'pointer',
                      backgroundColor:
                        selectedComponent?.id === component.id ? '#E0E0FF' : 'transparent',
                    }}
                    onClick={() => setSelectedComponent(component)}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'start',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold', fontSize: '8pt' }}>
                          {component.name} v{component.version}
                        </div>
                        <div style={{ fontSize: '7pt', color: '#666', marginBottom: '2px' }}>
                          by {component.author}
                        </div>
                        <div style={{ fontSize: '7pt', marginBottom: '2px' }}>
                          {component.description}
                        </div>
                        <div style={{ fontSize: '7pt', color: '#888' }}>
                          {component.type.toUpperCase()} • {component.category.replace('_', ' ')} •{' '}
                          {formatFileSize(component.fileSize)}
                        </div>
                        <div style={{ fontSize: '7pt', color: '#888' }}>
                          {renderStars(component.rating)} (
                          {component.downloadCount.toLocaleString()} downloads)
                        </div>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'end',
                          gap: '4px',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '7pt',
                            fontWeight: 'bold',
                            color: getStatusColor(component.status),
                            textTransform: 'uppercase',
                          }}
                        >
                          {component.status}
                        </div>
                        {component.status === VB6ComponentStatus.AVAILABLE && (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleInstallComponent(component.id);
                            }}
                            disabled={isInstalling}
                            style={{
                              padding: '2px 6px',
                              fontSize: '7pt',
                              backgroundColor: '#E0E0E0',
                              border: '1px outset #C0C0C0',
                              cursor: isInstalling ? 'not-allowed' : 'pointer',
                            }}
                          >
                            Install
                          </button>
                        )}
                        {(component.status === VB6ComponentStatus.INSTALLED ||
                          component.status === VB6ComponentStatus.REGISTERED) && (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleUninstallComponent(component.id);
                            }}
                            disabled={isInstalling}
                            style={{
                              padding: '2px 6px',
                              fontSize: '7pt',
                              backgroundColor: '#FFE0E0',
                              border: '1px outset #C0C0C0',
                              cursor: isInstalling ? 'not-allowed' : 'pointer',
                            }}
                          >
                            Uninstall
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Component Details */}
              <div
                style={{
                  width: '300px',
                  backgroundColor: '#FFFFFF',
                  border: '1px inset #C0C0C0',
                  padding: '8px',
                  overflow: 'auto',
                }}
              >
                <div
                  style={{
                    fontWeight: 'bold',
                    marginBottom: '8px',
                    backgroundColor: '#C0C0C0',
                    padding: '2px',
                  }}
                >
                  Component Details
                </div>

                {selectedComponent ? (
                  <div style={{ fontSize: '7pt' }}>
                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ fontWeight: 'bold' }}>{selectedComponent.name}</div>
                      <div>Version: {selectedComponent.version}</div>
                      <div>Author: {selectedComponent.author}</div>
                      <div>File: {selectedComponent.fileName}</div>
                      <div>Size: {formatFileSize(selectedComponent.fileSize)}</div>
                      <div>
                        Rating: {renderStars(selectedComponent.rating)} ({selectedComponent.rating}
                        /5)
                      </div>
                    </div>

                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Description:</div>
                      <div>{selectedComponent.description}</div>
                    </div>

                    {selectedComponent.properties && selectedComponent.properties.length > 0 && (
                      <div style={{ marginBottom: '8px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Properties:</div>
                        {selectedComponent.properties.slice(0, 5).map(prop => (
                          <div key={prop.name} style={{ marginLeft: '8px', fontSize: '6pt' }}>
                            • {prop.name} ({prop.type})
                          </div>
                        ))}
                        {selectedComponent.properties.length > 5 && (
                          <div style={{ marginLeft: '8px', fontSize: '6pt', fontStyle: 'italic' }}>
                            ... and {selectedComponent.properties.length - 5} more
                          </div>
                        )}
                      </div>
                    )}

                    {selectedComponent.methods && selectedComponent.methods.length > 0 && (
                      <div style={{ marginBottom: '8px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Methods:</div>
                        {selectedComponent.methods.slice(0, 5).map(method => (
                          <div key={method.name} style={{ marginLeft: '8px', fontSize: '6pt' }}>
                            • {method.name}()
                          </div>
                        ))}
                        {selectedComponent.methods.length > 5 && (
                          <div style={{ marginLeft: '8px', fontSize: '6pt', fontStyle: 'italic' }}>
                            ... and {selectedComponent.methods.length - 5} more
                          </div>
                        )}
                      </div>
                    )}

                    {selectedComponent.dependencies.length > 0 && (
                      <div style={{ marginBottom: '8px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Dependencies:</div>
                        {selectedComponent.dependencies.map(dep => (
                          <div key={dep.name} style={{ marginLeft: '8px', fontSize: '6pt' }}>
                            • {dep.name} v{dep.version} {dep.required ? '(required)' : '(optional)'}
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Compatibility:</div>
                      <div>VB6: {selectedComponent.vb6Version.join(', ')}</div>
                      <div>Windows: {selectedComponent.windowsVersion.join(', ')}</div>
                      <div>Platform: {selectedComponent.platformSupport.join(', ')}</div>
                    </div>

                    {selectedComponent.tags.length > 0 && (
                      <div style={{ marginBottom: '8px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Tags:</div>
                        <div>{selectedComponent.tags.join(', ')}</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    style={{
                      textAlign: 'center',
                      color: '#666',
                      fontSize: '7pt',
                      marginTop: '20px',
                    }}
                  >
                    Select a component to view details
                  </div>
                )}
              </div>
            </>
          )}

          {/* Add-ins Tab */}
          {activeTab === 'addins' && (
            <>
              {/* Add-in Filter Panel */}
              <div
                style={{
                  width: '200px',
                  backgroundColor: '#FFFFFF',
                  border: '1px inset #C0C0C0',
                  padding: '8px',
                  overflow: 'auto',
                }}
              >
                <div
                  style={{
                    fontWeight: 'bold',
                    marginBottom: '8px',
                    backgroundColor: '#C0C0C0',
                    padding: '2px',
                  }}
                >
                  Add-in Filters
                </div>

                <div style={{ marginBottom: '8px' }}>
                  <label style={{ display: 'block', fontSize: '7pt', fontWeight: 'bold' }}>
                    Type:
                  </label>
                  <select
                    value={selectedAddInType}
                    onChange={e => setSelectedAddInType(e.target.value as any)}
                    style={{ width: '100%', border: '1px inset #C0C0C0', fontSize: '8pt' }}
                  >
                    <option value="all">All Types</option>
                    {Object.values(VB6AddInType).map(type => (
                      <option key={type} value={type}>
                        {type.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '8px' }}>
                  <label style={{ display: 'block', fontSize: '7pt', fontWeight: 'bold' }}>
                    State:
                  </label>
                  <select
                    value={selectedAddInState}
                    onChange={e => setSelectedAddInState(e.target.value as any)}
                    style={{ width: '100%', border: '1px inset #C0C0C0', fontSize: '8pt' }}
                  >
                    <option value="all">All States</option>
                    {Object.values(VB6AddInState).map(state => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Add-in List */}
              <div
                style={{
                  flex: 1,
                  backgroundColor: '#FFFFFF',
                  border: '1px inset #C0C0C0',
                  overflow: 'auto',
                }}
              >
                <div
                  style={{
                    fontWeight: 'bold',
                    backgroundColor: '#C0C0C0',
                    padding: '4px',
                    borderBottom: '1px solid #808080',
                  }}
                >
                  Add-ins ({filteredAddIns.length})
                </div>

                {filteredAddIns.map(addIn => (
                  <div
                    key={addIn.id}
                    style={{
                      padding: '6px',
                      borderBottom: '1px solid #E0E0E0',
                      cursor: 'pointer',
                      backgroundColor: selectedAddIn?.id === addIn.id ? '#E0E0FF' : 'transparent',
                    }}
                    onClick={() => setSelectedAddIn(addIn)}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'start',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '2px',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={addIn.enabled}
                            onChange={e => {
                              e.stopPropagation();
                              handleToggleAddIn(addIn.id);
                            }}
                            style={{ margin: 0 }}
                          />
                          <div style={{ fontWeight: 'bold', fontSize: '8pt' }}>
                            {addIn.displayName}
                          </div>
                        </div>
                        <div style={{ fontSize: '7pt', color: '#666', marginBottom: '2px' }}>
                          {addIn.description}
                        </div>
                        <div style={{ fontSize: '7pt', color: '#888' }}>
                          {addIn.type.replace('_', ' ')} • v{addIn.version} • by {addIn.author}
                        </div>
                        <div style={{ fontSize: '7pt', color: '#888' }}>
                          Commands: {addIn.providesCommands.length} • Menus:{' '}
                          {addIn.providesMenus.length} • Toolbars: {addIn.providesToolbars.length}
                        </div>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'end',
                          gap: '4px',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '7pt',
                            fontWeight: 'bold',
                            color: getStateColor(addIn.state),
                            textTransform: 'uppercase',
                          }}
                        >
                          {addIn.state}
                        </div>
                        {addIn.state === VB6AddInState.UNLOADED && addIn.enabled && (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleLoadAddIn(addIn.id);
                            }}
                            disabled={isInstalling}
                            style={{
                              padding: '2px 6px',
                              fontSize: '7pt',
                              backgroundColor: '#E0FFE0',
                              border: '1px outset #C0C0C0',
                              cursor: isInstalling ? 'not-allowed' : 'pointer',
                            }}
                          >
                            Load
                          </button>
                        )}
                        {addIn.state === VB6AddInState.LOADED && (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleUnloadAddIn(addIn.id);
                            }}
                            disabled={isInstalling}
                            style={{
                              padding: '2px 6px',
                              fontSize: '7pt',
                              backgroundColor: '#FFE0E0',
                              border: '1px outset #C0C0C0',
                              cursor: isInstalling ? 'not-allowed' : 'pointer',
                            }}
                          >
                            Unload
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add-in Details */}
              <div
                style={{
                  width: '300px',
                  backgroundColor: '#FFFFFF',
                  border: '1px inset #C0C0C0',
                  padding: '8px',
                  overflow: 'auto',
                }}
              >
                <div
                  style={{
                    fontWeight: 'bold',
                    marginBottom: '8px',
                    backgroundColor: '#C0C0C0',
                    padding: '2px',
                  }}
                >
                  Add-in Details
                </div>

                {selectedAddIn ? (
                  <div style={{ fontSize: '7pt' }}>
                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ fontWeight: 'bold' }}>{selectedAddIn.displayName}</div>
                      <div>Version: {selectedAddIn.version}</div>
                      <div>Author: {selectedAddIn.author}</div>
                      <div>Type: {selectedAddIn.type.replace('_', ' ')}</div>
                      <div>State: {selectedAddIn.state}</div>
                      <div>Enabled: {selectedAddIn.enabled ? 'Yes' : 'No'}</div>
                      <div>Load Count: {selectedAddIn.loadCount}</div>
                    </div>

                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Description:</div>
                      <div>{selectedAddIn.description}</div>
                    </div>

                    {selectedAddIn.providesCommands.length > 0 && (
                      <div style={{ marginBottom: '8px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Commands:</div>
                        {selectedAddIn.providesCommands.map(cmd => (
                          <div key={cmd.id} style={{ marginLeft: '8px', fontSize: '6pt' }}>
                            • {cmd.caption} ({cmd.shortcut || 'no shortcut'})
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedAddIn.providesMenus.length > 0 && (
                      <div style={{ marginBottom: '8px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Menus:</div>
                        {selectedAddIn.providesMenus.map(menu => (
                          <div key={menu.id} style={{ marginLeft: '8px', fontSize: '6pt' }}>
                            • {menu.caption} (in {menu.parent})
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedAddIn.providesToolbars.length > 0 && (
                      <div style={{ marginBottom: '8px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Toolbars:</div>
                        {selectedAddIn.providesToolbars.map(toolbar => (
                          <div key={toolbar.id} style={{ marginLeft: '8px', fontSize: '6pt' }}>
                            • {toolbar.caption} ({toolbar.buttons.length} buttons)
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedAddIn.supportsEvents.length > 0 && (
                      <div style={{ marginBottom: '8px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
                          Supported Events:
                        </div>
                        {selectedAddIn.supportsEvents.slice(0, 8).map(event => (
                          <div key={event} style={{ marginLeft: '8px', fontSize: '6pt' }}>
                            • {event.replace('_', ' ')}
                          </div>
                        ))}
                        {selectedAddIn.supportsEvents.length > 8 && (
                          <div style={{ marginLeft: '8px', fontSize: '6pt', fontStyle: 'italic' }}>
                            ... and {selectedAddIn.supportsEvents.length - 8} more
                          </div>
                        )}
                      </div>
                    )}

                    {(selectedAddIn.requiredAddIns.length > 0 ||
                      selectedAddIn.conflictingAddIns.length > 0) && (
                      <div style={{ marginBottom: '8px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Dependencies:</div>
                        {selectedAddIn.requiredAddIns.map(req => (
                          <div key={req} style={{ marginLeft: '8px', fontSize: '6pt' }}>
                            • Requires: {req}
                          </div>
                        ))}
                        {selectedAddIn.conflictingAddIns.map(conf => (
                          <div
                            key={conf}
                            style={{ marginLeft: '8px', fontSize: '6pt', color: '#FF0000' }}
                          >
                            • Conflicts: {conf}
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedAddIn.lastError && (
                      <div style={{ marginBottom: '8px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '2px', color: '#FF0000' }}>
                          Last Error:
                        </div>
                        <div style={{ color: '#FF0000', fontSize: '6pt' }}>
                          {selectedAddIn.lastError}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    style={{
                      textAlign: 'center',
                      color: '#666',
                      fontSize: '7pt',
                      marginTop: '20px',
                    }}
                  >
                    Select an add-in to view details
                  </div>
                )}
              </div>
            </>
          )}

          {/* Installed Tab */}
          {activeTab === 'installed' && (
            <div style={{ flex: 1, padding: '8px' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px',
                  height: '100%',
                }}
              >
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px inset #C0C0C0',
                    padding: '8px',
                  }}
                >
                  <div
                    style={{
                      fontWeight: 'bold',
                      marginBottom: '8px',
                      backgroundColor: '#C0C0C0',
                      padding: '2px',
                    }}
                  >
                    Installed Components (
                    {VB6ComponentGalleryInstance.getInstalledComponents().length})
                  </div>
                  <div style={{ height: 'calc(100% - 30px)', overflow: 'auto' }}>
                    {VB6ComponentGalleryInstance.getInstalledComponents().map(component => (
                      <div
                        key={component.id}
                        style={{ padding: '4px', borderBottom: '1px solid #E0E0E0' }}
                      >
                        <div style={{ fontWeight: 'bold', fontSize: '8pt' }}>{component.name}</div>
                        <div style={{ fontSize: '7pt', color: '#666' }}>
                          v{component.version} • {component.type.toUpperCase()} • {component.status}
                        </div>
                        <div style={{ fontSize: '7pt', color: '#888' }}>
                          Installed: {component.installed?.toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px inset #C0C0C0',
                    padding: '8px',
                  }}
                >
                  <div
                    style={{
                      fontWeight: 'bold',
                      marginBottom: '8px',
                      backgroundColor: '#C0C0C0',
                      padding: '2px',
                    }}
                  >
                    Loaded Add-ins ({VB6AddInManagerInstance.getLoadedAddIns().length})
                  </div>
                  <div style={{ height: 'calc(100% - 30px)', overflow: 'auto' }}>
                    {VB6AddInManagerInstance.getLoadedAddIns().map(addIn => (
                      <div
                        key={addIn.id}
                        style={{ padding: '4px', borderBottom: '1px solid #E0E0E0' }}
                      >
                        <div style={{ fontWeight: 'bold', fontSize: '8pt' }}>
                          {addIn.displayName}
                        </div>
                        <div style={{ fontSize: '7pt', color: '#666' }}>
                          v{addIn.version} • {addIn.type.replace('_', ' ')} • {addIn.state}
                        </div>
                        <div style={{ fontSize: '7pt', color: '#888' }}>
                          Commands: {addIn.providesCommands.length} • Load Count: {addIn.loadCount}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div style={{ flex: 1, padding: '8px' }}>
              <div
                style={{ backgroundColor: '#FFFFFF', border: '1px inset #C0C0C0', padding: '16px' }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '16px', fontSize: '10pt' }}>
                  Component Gallery & Add-in Manager Settings
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                    Component Statistics:
                  </div>
                  <div style={{ fontSize: '8pt', marginLeft: '8px' }}>
                    Total Components: {VB6ComponentGalleryInstance.getComponentStats().total}
                    <br />
                    Installed Components:{' '}
                    {VB6ComponentGalleryInstance.getComponentStats().installed}
                    <br />
                    Total Add-ins: {VB6AddInManagerInstance.getAddInStats().total}
                    <br />
                    Loaded Add-ins: {VB6AddInManagerInstance.getAddInStats().loaded}
                    <br />
                    Enabled Add-ins: {VB6AddInManagerInstance.getAddInStats().enabled}
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                    Component Categories:
                  </div>
                  <div style={{ fontSize: '8pt', marginLeft: '8px' }}>
                    {Array.from(
                      VB6ComponentGalleryInstance.getComponentStats().byCategory.entries()
                    ).map(([cat, count]) => (
                      <div key={cat}>
                        {cat.replace('_', ' ')}: {count}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Add-in Types:</div>
                  <div style={{ fontSize: '8pt', marginLeft: '8px' }}>
                    {Array.from(VB6AddInManagerInstance.getAddInStats().byType.entries()).map(
                      ([type, count]) => (
                        <div key={type}>
                          {type.replace('_', ' ')}: {count}
                        </div>
                      )
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <button
                    onClick={() => {
                      VB6AddInManagerInstance.loadAutoStartAddIns();
                      refreshData();
                    }}
                    style={{
                      padding: '6px 12px',
                      fontSize: '8pt',
                      backgroundColor: '#E0E0E0',
                      border: '1px outset #C0C0C0',
                      cursor: 'pointer',
                      marginRight: '8px',
                    }}
                  >
                    Load Auto-Start Add-ins
                  </button>

                  <button
                    onClick={refreshData}
                    style={{
                      padding: '6px 12px',
                      fontSize: '8pt',
                      backgroundColor: '#E0E0E0',
                      border: '1px outset #C0C0C0',
                      cursor: 'pointer',
                    }}
                  >
                    Refresh Data
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div
          style={{
            backgroundColor: '#E0E0E0',
            padding: '2px 4px',
            borderTop: '1px solid #C0C0C0',
            fontSize: '8pt',
            color: error ? '#FF0000' : '#000080',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <div>{error || installProgress || 'Ready'}</div>
          <div>
            Components: {components.length} | Add-ins: {addIns.length} | Loaded:{' '}
            {VB6AddInManagerInstance.getLoadedAddIns().length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VB6ComponentGalleryUI;
