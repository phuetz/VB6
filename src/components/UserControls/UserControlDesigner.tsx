import React, { useState, useCallback } from 'react';
import { useVB6 } from '../../context/VB6Context';
import { Plus, Edit, Trash2, Copy, Package } from 'lucide-react';

interface UserControl {
  id: string;
  name: string;
  description: string;
  icon: string;
  controls: any[];
  events: string[];
  properties: UserControlProperty[];
  methods: UserControlMethod[];
  created: Date;
  modified: Date;
}

interface UserControlProperty {
  name: string;
  type: string;
  defaultValue: any;
  readOnly: boolean;
  description: string;
}

interface UserControlMethod {
  name: string;
  parameters: Array<{ name: string; type: string; optional: boolean }>;
  returnType: string;
  description: string;
}

interface UserControlDesignerProps {
  visible: boolean;
  onClose: () => void;
}

export const UserControlDesigner: React.FC<UserControlDesignerProps> = ({
  visible,
  onClose
}) => {
  const { state } = useVB6();
  const [userControls, setUserControls] = useState<UserControl[]>([
    {
      id: '1',
      name: 'CustomButton',
      description: 'Enhanced button with gradient effects',
      icon: '🔘',
      controls: [],
      events: ['Click', 'MouseEnter', 'MouseLeave'],
      properties: [
        { name: 'GradientStart', type: 'Color', defaultValue: '#0066CC', readOnly: false, description: 'Starting color for gradient' },
        { name: 'GradientEnd', type: 'Color', defaultValue: '#004499', readOnly: false, description: 'Ending color for gradient' },
        { name: 'BorderRadius', type: 'Integer', defaultValue: 5, readOnly: false, description: 'Corner radius in pixels' }
      ],
      methods: [
        { name: 'Animate', parameters: [{ name: 'duration', type: 'Integer', optional: false }], returnType: 'void', description: 'Animates the button' }
      ],
      created: new Date('2024-01-15'),
      modified: new Date('2024-01-20')
    },
    {
      id: '2',
      name: 'DataGrid',
      description: 'Advanced data grid with sorting and filtering',
      icon: '📊',
      controls: [],
      events: ['CellClick', 'CellEdit', 'ColumnSort'],
      properties: [
        { name: 'DataSource', type: 'Object', defaultValue: null, readOnly: false, description: 'Data source for the grid' },
        { name: 'AllowSorting', type: 'Boolean', defaultValue: true, readOnly: false, description: 'Enable column sorting' },
        { name: 'AllowFiltering', type: 'Boolean', defaultValue: true, readOnly: false, description: 'Enable row filtering' }
      ],
      methods: [
        { name: 'Refresh', parameters: [], returnType: 'void', description: 'Refreshes the grid data' },
        { name: 'Sort', parameters: [{ name: 'column', type: 'String', optional: false }, { name: 'ascending', type: 'Boolean', optional: true }], returnType: 'void', description: 'Sorts by column' }
      ],
      created: new Date('2024-01-10'),
      modified: new Date('2024-01-25')
    }
  ]);

  const [selectedControl, setSelectedControl] = useState<string | null>(null);
  const [showNewControlDialog, setShowNewControlDialog] = useState(false);
  const [newControlName, setNewControlName] = useState('');
  const [newControlDescription, setNewControlDescription] = useState('');

  const handleCreateControl = useCallback(() => {
    if (newControlName.trim()) {
      const newControl: UserControl = {
        id: Date.now().toString(),
        name: newControlName.trim(),
        description: newControlDescription.trim() || 'Custom user control',
        icon: '🎛️',
        controls: [],
        events: ['Click'],
        properties: [
          { name: 'Name', type: 'String', defaultValue: newControlName.trim(), readOnly: true, description: 'Control name' },
          { name: 'Enabled', type: 'Boolean', defaultValue: true, readOnly: false, description: 'Enable/disable control' },
          { name: 'Visible', type: 'Boolean', defaultValue: true, readOnly: false, description: 'Show/hide control' }
        ],
        methods: [],
        created: new Date(),
        modified: new Date()
      };

      setUserControls([...userControls, newControl]);
      setSelectedControl(newControl.id);
      setNewControlName('');
      setNewControlDescription('');
      setShowNewControlDialog(false);
    }
  }, [newControlName, newControlDescription, userControls]);

  const handleDeleteControl = useCallback((id: string) => {
    if (confirm('Are you sure you want to delete this user control?')) {
      setUserControls(userControls.filter(c => c.id !== id));
      if (selectedControl === id) {
        setSelectedControl(null);
      }
    }
  }, [userControls, selectedControl]);

  const handleDuplicateControl = useCallback((id: string) => {
    const original = userControls.find(c => c.id === id);
    if (original) {
      const duplicate: UserControl = {
        ...original,
        id: Date.now().toString(),
        name: original.name + '_Copy',
        created: new Date(),
        modified: new Date()
      };
      setUserControls([...userControls, duplicate]);
    }
  }, [userControls]);

  const selectedControlData = selectedControl ? userControls.find(c => c.id === selectedControl) : null;

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-200 border-2 border-gray-400 shadow-lg" style={{ width: '900px', height: '700px' }}>
        <div className="bg-blue-600 text-white text-sm font-bold p-2 flex items-center justify-between">
          <span>User Control Designer</span>
          <button onClick={onClose} className="text-white hover:bg-blue-700 px-2">×</button>
        </div>

        <div className="p-4 h-full flex gap-4">
          {/* User Controls List */}
          <div className="w-1/3 flex flex-col">
            <div className="bg-gray-100 border border-gray-400 p-2 text-xs font-bold mb-2 flex items-center justify-between">
              <span>User Controls</span>
              <button
                onClick={() => setShowNewControlDialog(true)}
                className="px-2 py-1 bg-green-500 text-white border border-green-600 text-xs hover:bg-green-600 flex items-center gap-1"
              >
                <Plus size={12} />
                New
              </button>
            </div>

            <div className="flex-1 bg-white border border-gray-400 overflow-y-auto">
              {userControls.map(control => (
                <div
                  key={control.id}
                  className={`p-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
                    selectedControl === control.id ? 'bg-blue-100' : ''
                  }`}
                  onClick={() => setSelectedControl(control.id)}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-lg">{control.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate">{control.name}</div>
                      <div className="text-xs text-gray-600 line-clamp-2">{control.description}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Modified: {control.modified.toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateControl(control.id);
                        }}
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                        title="Duplicate"
                      >
                        <Copy size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteControl(control.id);
                        }}
                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                        title="Delete"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Control Details */}
          <div className="flex-1 flex flex-col">
            {selectedControlData ? (
              <>
                {/* Header */}
                <div className="bg-gray-100 border border-gray-400 p-3 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{selectedControlData.icon}</span>
                    <div>
                      <div className="font-bold text-lg">{selectedControlData.name}</div>
                      <div className="text-sm text-gray-600">{selectedControlData.description}</div>
                    </div>
                    <div className="ml-auto">
                      <button className="px-3 py-1 bg-blue-500 text-white border border-blue-600 text-xs hover:bg-blue-600 flex items-center gap-1">
                        <Edit size={12} />
                        Edit
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-300 mb-4">
                  <button className="px-4 py-2 border-b-2 border-blue-500 font-semibold text-sm">
                    Properties
                  </button>
                  <button className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm">
                    Methods
                  </button>
                  <button className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm">
                    Events
                  </button>
                  <button className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm">
                    Designer
                  </button>
                </div>

                {/* Properties Tab */}
                <div className="flex-1 bg-white border border-gray-400 overflow-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="text-left p-2 border-b">Property</th>
                        <th className="text-left p-2 border-b">Type</th>
                        <th className="text-left p-2 border-b">Default</th>
                        <th className="text-left p-2 border-b">Read Only</th>
                        <th className="text-left p-2 border-b">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedControlData.properties.map((prop, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="p-2 border-b font-mono">{prop.name}</td>
                          <td className="p-2 border-b">{prop.type}</td>
                          <td className="p-2 border-b font-mono">{String(prop.defaultValue)}</td>
                          <td className="p-2 border-b">
                            <input type="checkbox" checked={prop.readOnly} readOnly />
                          </td>
                          <td className="p-2 border-b">{prop.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="flex-1 bg-white border border-gray-400 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <Package size={64} className="mx-auto mb-4 opacity-50" />
                  <div className="text-lg mb-2">No Control Selected</div>
                  <div>Select a user control to view its details</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* New Control Dialog */}
        {showNewControlDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-gray-200 border-2 border-gray-400 shadow-lg" style={{ width: '400px' }}>
              <div className="bg-blue-600 text-white text-sm font-bold p-2 flex items-center justify-between">
                <span>New User Control</span>
                <button
                  onClick={() => setShowNewControlDialog(false)}
                  className="text-white hover:bg-blue-700 px-2"
                >
                  ×
                </button>
              </div>
              <div className="p-4">
                <div className="mb-3">
                  <label className="block text-xs font-bold mb-1">Control Name:</label>
                  <input
                    type="text"
                    value={newControlName}
                    onChange={(e) => setNewControlName(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-400 text-sm"
                    placeholder="MyCustomControl"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-bold mb-1">Description:</label>
                  <textarea
                    value={newControlDescription}
                    onChange={(e) => setNewControlDescription(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-400 text-sm"
                    rows={3}
                    placeholder="Description of your custom control..."
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setShowNewControlDialog(false)}
                    className="px-4 py-1 bg-gray-300 border border-gray-400 text-xs hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateControl}
                    disabled={!newControlName.trim()}
                    className="px-4 py-1 bg-blue-500 text-white border border-blue-600 text-xs hover:bg-blue-600 disabled:opacity-50"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};