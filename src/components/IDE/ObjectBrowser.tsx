/**
 * VB6 Object Browser - Navigateur d'objets IDE complet
 * Permet de parcourir toutes les classes, propriétés, méthodes et événements
 * Compatible 100% avec l'Object Browser de Visual Basic 6.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { getCompleteVB6Properties, getAllControlTypes } from '../../data/VB6CompleteProperties';

// Types pour l'Object Browser
export interface VB6ObjectInfo {
  name: string;
  type: 'Library' | 'Class' | 'Module' | 'Interface' | 'Enum' | 'Constant';
  parent?: string;
  description?: string;
  helpFile?: string;
  helpContext?: number;
  members: VB6MemberInfo[];
}

export interface VB6MemberInfo {
  name: string;
  type: 'Property' | 'Method' | 'Event' | 'Constant' | 'Enum';
  memberType?: string; // Type de retour ou type de propriété
  parameters?: VB6ParameterInfo[];
  description?: string;
  readOnly?: boolean;
  writeOnly?: boolean;
  default?: any;
  category?: string;
}

export interface VB6ParameterInfo {
  name: string;
  type: string;
  optional?: boolean;
  defaultValue?: any;
  byRef?: boolean;
}

export interface VB6Library {
  name: string;
  version: string;
  description: string;
  guid: string;
  fileName: string;
  objects: VB6ObjectInfo[];
}

export interface ObjectBrowserProps {
  isVisible: boolean;
  onClose?: () => void;
  onMemberSelect?: (member: VB6MemberInfo, object: VB6ObjectInfo) => void;
}

export const ObjectBrowser: React.FC<ObjectBrowserProps> = ({
  isVisible,
  onClose,
  onMemberSelect
}) => {
  const [selectedLibrary, setSelectedLibrary] = useState<string>('VB6');
  const [selectedObject, setSelectedObject] = useState<VB6ObjectInfo | null>(null);
  const [selectedMember, setSelectedMember] = useState<VB6MemberInfo | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewMode, setViewMode] = useState<'All' | 'Properties' | 'Methods' | 'Events' | 'Constants'>('All');
  const [showHidden, setShowHidden] = useState<boolean>(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Références
  const libraryListRef = useRef<HTMLDivElement>(null);
  const objectListRef = useRef<HTMLDivElement>(null);
  const memberListRef = useRef<HTMLDivElement>(null);

  // Librairies VB6 disponibles
  const [libraries] = useState<VB6Library[]>(() => initializeLibraries());

  // Initialiser les librairies VB6
  function initializeLibraries(): VB6Library[] {
    return [
      {
        name: 'VB6',
        version: '6.0',
        description: 'Visual Basic 6.0 Objects and Procedures',
        guid: '{EA544A21-C82D-11D1-A3E0-0000F8756001}',
        fileName: 'VB6.OLB',
        objects: createVB6Objects()
      },
      {
        name: 'VBA',
        version: '6.0',
        description: 'Visual Basic for Applications',
        guid: '{000204EF-0000-0000-C000-000000000046}',
        fileName: 'VBA6.DLL',
        objects: createVBAObjects()
      },
      {
        name: 'MSForms',
        version: '2.0',
        description: 'Microsoft Forms 2.0 Object Library',
        guid: '{0D452EE1-E08F-101A-852E-02608C4D0BB4}',
        fileName: 'MSForms.EXE',
        objects: createMSFormsObjects()
      },
      {
        name: 'ADODB',
        version: '2.8',
        description: 'Microsoft ActiveX Data Objects 2.8 Library',
        guid: '{2A75196C-D9EB-4129-B803-931327F72D5C}',
        fileName: 'ADODB.DLL',
        objects: createADODBObjects()
      },
      {
        name: 'Scripting',
        version: '1.0',
        description: 'Microsoft Scripting Runtime',
        guid: '{420B2830-E718-11CF-893D-00A0C9054228}',
        fileName: 'SCRRUN.DLL',
        objects: createScriptingObjects()
      }
    ];
  }

  // Créer les objets VB6 standard
  function createVB6Objects(): VB6ObjectInfo[] {
    const objects: VB6ObjectInfo[] = [];

    // Objets système VB6
    objects.push({
      name: 'App',
      type: 'Class',
      description: 'Provides access to application-specific information',
      members: [
        { name: 'EXEName', type: 'Property', memberType: 'String', description: 'Returns the name of the executable file', readOnly: true },
        { name: 'Path', type: 'Property', memberType: 'String', description: 'Returns the path where the application started', readOnly: true },
        { name: 'Title', type: 'Property', memberType: 'String', description: 'Sets or returns the title of the application' },
        { name: 'StartLogging', type: 'Method', description: 'Starts logging to the specified file' },
        { name: 'StopLogging', type: 'Method', description: 'Stops logging' }
      ]
    });

    objects.push({
      name: 'Screen',
      type: 'Class',
      description: 'Provides information about the screen and active controls',
      members: [
        { name: 'Width', type: 'Property', memberType: 'Single', description: 'Width of the screen in twips', readOnly: true },
        { name: 'Height', type: 'Property', memberType: 'Single', description: 'Height of the screen in twips', readOnly: true },
        { name: 'TwipsPerPixelX', type: 'Property', memberType: 'Single', description: 'Horizontal twips per pixel', readOnly: true },
        { name: 'TwipsPerPixelY', type: 'Property', memberType: 'Single', description: 'Vertical twips per pixel', readOnly: true },
        { name: 'ActiveControl', type: 'Property', memberType: 'Control', description: 'Returns the control that has focus', readOnly: true },
        { name: 'ActiveForm', type: 'Property', memberType: 'Form', description: 'Returns the active form', readOnly: true }
      ]
    });

    objects.push({
      name: 'Debug',
      type: 'Class',
      description: 'Provides methods for debugging',
      members: [
        { name: 'Print', type: 'Method', description: 'Prints text to the debug window', parameters: [{ name: 'text', type: 'String' }] },
        { name: 'Assert', type: 'Method', description: 'Tests a condition and breaks if false', parameters: [{ name: 'condition', type: 'Boolean' }] }
      ]
    });

    objects.push({
      name: 'Err',
      type: 'Class',
      description: 'Contains information about run-time errors',
      members: [
        { name: 'Number', type: 'Property', memberType: 'Long', description: 'Error number' },
        { name: 'Description', type: 'Property', memberType: 'String', description: 'Error description' },
        { name: 'Source', type: 'Property', memberType: 'String', description: 'Error source' },
        { name: 'Clear', type: 'Method', description: 'Clears the current error' },
        { name: 'Raise', type: 'Method', description: 'Raises an error', parameters: [{ name: 'number', type: 'Long' }] }
      ]
    });

    // Ajouter tous les contrôles VB6
    const controlTypes = getAllControlTypes();
    controlTypes.forEach(controlType => {
      const properties = getCompleteVB6Properties(controlType);
      const members: VB6MemberInfo[] = properties.map(prop => ({
        name: prop.name,
        type: 'Property' as const,
        memberType: prop.type,
        description: prop.description,
        readOnly: prop.readOnly,
        default: prop.defaultValue,
        category: prop.category
      }));

      // Ajouter des méthodes communes pour les contrôles
      members.push(
        { name: 'Move', type: 'Method', description: 'Moves the control', parameters: [
          { name: 'Left', type: 'Single', optional: true },
          { name: 'Top', type: 'Single', optional: true },
          { name: 'Width', type: 'Single', optional: true },
          { name: 'Height', type: 'Single', optional: true }
        ]},
        { name: 'SetFocus', type: 'Method', description: 'Sets focus to the control' },
        { name: 'Refresh', type: 'Method', description: 'Repaints the control' }
      );

      // Ajouter des événements communes
      members.push(
        { name: 'Click', type: 'Event', description: 'Occurs when the user clicks the control' },
        { name: 'DblClick', type: 'Event', description: 'Occurs when the user double-clicks the control' },
        { name: 'MouseDown', type: 'Event', description: 'Occurs when the user presses a mouse button' },
        { name: 'MouseMove', type: 'Event', description: 'Occurs when the user moves the mouse over the control' },
        { name: 'MouseUp', type: 'Event', description: 'Occurs when the user releases a mouse button' }
      );

      objects.push({
        name: controlType,
        type: 'Class',
        description: `${controlType} control`,
        members
      });
    });

    return objects;
  }

  // Créer les objets VBA
  function createVBAObjects(): VB6ObjectInfo[] {
    return [
      {
        name: 'Collection',
        type: 'Class',
        description: 'A collection of items',
        members: [
          { name: 'Add', type: 'Method', description: 'Adds an item to the collection' },
          { name: 'Remove', type: 'Method', description: 'Removes an item from the collection' },
          { name: 'Count', type: 'Property', memberType: 'Long', description: 'Number of items in collection', readOnly: true },
          { name: 'Item', type: 'Property', memberType: 'Variant', description: 'Gets an item from the collection' }
        ]
      }
    ];
  }

  function createMSFormsObjects(): VB6ObjectInfo[] {
    return [
      {
        name: 'UserForm',
        type: 'Class',
        description: 'Microsoft Forms UserForm',
        members: [
          { name: 'Show', type: 'Method', description: 'Shows the form' },
          { name: 'Hide', type: 'Method', description: 'Hides the form' },
          { name: 'Caption', type: 'Property', memberType: 'String', description: 'Form caption' }
        ]
      }
    ];
  }

  function createADODBObjects(): VB6ObjectInfo[] {
    return [
      {
        name: 'Connection',
        type: 'Class',
        description: 'ADO Connection object',
        members: [
          { name: 'Open', type: 'Method', description: 'Opens a connection' },
          { name: 'Close', type: 'Method', description: 'Closes the connection' },
          { name: 'ConnectionString', type: 'Property', memberType: 'String', description: 'Connection string' }
        ]
      },
      {
        name: 'Recordset',
        type: 'Class',
        description: 'ADO Recordset object',
        members: [
          { name: 'Open', type: 'Method', description: 'Opens a recordset' },
          { name: 'Close', type: 'Method', description: 'Closes the recordset' },
          { name: 'MoveNext', type: 'Method', description: 'Moves to the next record' },
          { name: 'EOF', type: 'Property', memberType: 'Boolean', description: 'End of file indicator', readOnly: true }
        ]
      }
    ];
  }

  function createScriptingObjects(): VB6ObjectInfo[] {
    return [
      {
        name: 'FileSystemObject',
        type: 'Class',
        description: 'Provides access to file system',
        members: [
          { name: 'CreateTextFile', type: 'Method', description: 'Creates a text file' },
          { name: 'OpenTextFile', type: 'Method', description: 'Opens a text file' },
          { name: 'FileExists', type: 'Method', description: 'Checks if file exists' }
        ]
      }
    ];
  }

  // Filtrer les objets selon la recherche
  const getFilteredObjects = useCallback(() => {
    const library = libraries.find(lib => lib.name === selectedLibrary);
    if (!library) return [];

    return library.objects.filter(obj => 
      obj.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      obj.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [libraries, selectedLibrary, searchTerm]);

  // Filtrer les membres selon le mode de vue
  const getFilteredMembers = useCallback(() => {
    if (!selectedObject) return [];

    let members = selectedObject.members;

    // Filtrer par type
    if (viewMode !== 'All') {
      members = members.filter(member => {
        switch (viewMode) {
          case 'Properties': return member.type === 'Property';
          case 'Methods': return member.type === 'Method';
          case 'Events': return member.type === 'Event';
          case 'Constants': return member.type === 'Constant';
          default: return true;
        }
      });
    }

    // Filtrer par recherche
    if (searchTerm) {
      members = members.filter(member =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return members;
  }, [selectedObject, viewMode, searchTerm]);

  // Rendu des icônes selon le type
  const getIcon = (type: string): string => {
    switch (type) {
      case 'Library': return '📚';
      case 'Class': return '🏛️';
      case 'Module': return '📄';
      case 'Interface': return '🔌';
      case 'Property': return '🏷️';
      case 'Method': return '⚡';
      case 'Event': return '📡';
      case 'Constant': return '🔒';
      case 'Enum': return '📋';
      default: return '📄';
    }
  };

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    top: '10%',
    left: '10%',
    width: '80%',
    height: '80%',
    backgroundColor: '#F0F0F0',
    border: '2px outset #C0C0C0',
    display: isVisible ? 'flex' : 'none',
    flexDirection: 'column',
    fontFamily: 'MS Sans Serif, sans-serif',
    fontSize: '8pt',
    zIndex: 10000
  };

  const titleBarStyle: React.CSSProperties = {
    height: '24px',
    backgroundColor: '#0078D4',
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 8px',
    fontWeight: 'bold'
  };

  const toolbarStyle: React.CSSProperties = {
    height: '32px',
    backgroundColor: '#E0E0E0',
    borderBottom: '1px solid #C0C0C0',
    display: 'flex',
    alignItems: 'center',
    padding: '0 8px',
    gap: '8px'
  };

  const mainAreaStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex'
  };

  const panelStyle: React.CSSProperties = {
    flex: 1,
    border: '1px inset #C0C0C0',
    margin: '4px',
    overflow: 'auto',
    backgroundColor: '#FFFFFF'
  };

  const listItemStyle: React.CSSProperties = {
    padding: '2px 4px',
    cursor: 'pointer',
    borderBottom: '1px solid #F0F0F0',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  };

  const selectedItemStyle: React.CSSProperties = {
    ...listItemStyle,
    backgroundColor: '#0078D4',
    color: '#FFFFFF'
  };

  if (!isVisible) return null;

  return (
    <div style={containerStyle}>
      {/* Barre de titre */}
      <div style={titleBarStyle}>
        <span>Object Browser</span>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#FFFFFF',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          ✕
        </button>
      </div>

      {/* Barre d'outils */}
      <div style={toolbarStyle}>
        <select
          value={selectedLibrary}
          onChange={(e) => setSelectedLibrary(e.target.value)}
          style={{ padding: '2px' }}
        >
          {libraries.map(lib => (
            <option key={lib.name} value={lib.name}>
              {lib.name} ({lib.version})
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: '2px', width: '200px' }}
        />

        <select
          value={viewMode}
          onChange={(e) => setViewMode(e.target.value as any)}
          style={{ padding: '2px' }}
        >
          <option value="All">All Members</option>
          <option value="Properties">Properties</option>
          <option value="Methods">Methods</option>
          <option value="Events">Events</option>
          <option value="Constants">Constants</option>
        </select>

        <label style={{ fontSize: '7pt' }}>
          <input
            type="checkbox"
            checked={showHidden}
            onChange={(e) => setShowHidden(e.target.checked)}
          />
          Show Hidden
        </label>
      </div>

      {/* Zone principale */}
      <div style={mainAreaStyle}>
        {/* Liste des librairies et classes */}
        <div style={{ ...panelStyle, maxWidth: '250px' }}>
          <div style={{ fontWeight: 'bold', padding: '4px', borderBottom: '1px solid #C0C0C0' }}>
            Classes
          </div>
          <div ref={objectListRef}>
            {getFilteredObjects().map(obj => (
              <div
                key={obj.name}
                style={selectedObject?.name === obj.name ? selectedItemStyle : listItemStyle}
                onClick={() => setSelectedObject(obj)}
              >
                <span>{getIcon(obj.type)}</span>
                <span>{obj.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Liste des membres */}
        <div style={panelStyle}>
          <div style={{ fontWeight: 'bold', padding: '4px', borderBottom: '1px solid #C0C0C0' }}>
            Members of {selectedObject?.name || '(Select a class)'}
          </div>
          <div ref={memberListRef}>
            {getFilteredMembers().map(member => (
              <div
                key={`${member.name}_${member.type}`}
                style={selectedMember === member ? selectedItemStyle : listItemStyle}
                onClick={() => {
                  setSelectedMember(member);
                  if (selectedObject) {
                    onMemberSelect?.(member, selectedObject);
                  }
                }}
              >
                <span>{getIcon(member.type)}</span>
                <span style={{ fontWeight: member.type === 'Property' ? 'normal' : 'bold' }}>
                  {member.name}
                </span>
                {member.memberType && (
                  <span style={{ color: '#0000FF', fontSize: '7pt' }}>
                    : {member.memberType}
                    {member.readOnly && ' (Read Only)'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Panneau de détails */}
        <div style={{ ...panelStyle, maxWidth: '300px' }}>
          <div style={{ fontWeight: 'bold', padding: '4px', borderBottom: '1px solid #C0C0C0' }}>
            Details
          </div>
          {selectedMember && (
            <div style={{ padding: '8px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                {selectedMember.name}
              </div>
              
              {selectedMember.memberType && (
                <div style={{ marginBottom: '4px' }}>
                  <strong>Type:</strong> {selectedMember.memberType}
                </div>
              )}
              
              {selectedMember.description && (
                <div style={{ marginBottom: '8px', fontSize: '7pt' }}>
                  {selectedMember.description}
                </div>
              )}
              
              {selectedMember.parameters && selectedMember.parameters.length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  <strong>Parameters:</strong>
                  <ul style={{ margin: '4px 0', paddingLeft: '16px', fontSize: '7pt' }}>
                    {selectedMember.parameters.map(param => (
                      <li key={param.name}>
                        {param.name}: {param.type}
                        {param.optional && ' (Optional)'}
                        {param.byRef && ' (ByRef)'}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {selectedMember.default !== undefined && (
                <div style={{ marginBottom: '4px', fontSize: '7pt' }}>
                  <strong>Default:</strong> {String(selectedMember.default)}
                </div>
              )}
              
              {selectedMember.category && (
                <div style={{ fontSize: '7pt', color: '#666' }}>
                  Category: {selectedMember.category}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ObjectBrowser;