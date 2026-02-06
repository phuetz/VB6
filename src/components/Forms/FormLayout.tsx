import React, { useState, useCallback } from 'react';
import { useVB6 } from '../../context/VB6Context';
import { Move, RotateCw, Square } from 'lucide-react';

interface FormLayoutProps {
  visible: boolean;
  onClose: () => void;
}

export const FormLayout: React.FC<FormLayoutProps> = ({ visible, onClose }) => {
  const { state } = useVB6();
  const [selectedForm, setSelectedForm] = useState(state.forms[0]?.id || null);
  const [zoom, setZoom] = useState(100);

  const handleFormClick = useCallback((formId: number) => {
    setSelectedForm(formId);
    // Switch to form designer for this form
  }, []);

  const getFormPreview = useCallback(
    (form: any) => {
      const scale = zoom / 100;
      return (
        <div
          className="bg-gray-100 border border-gray-400 shadow-md cursor-pointer hover:border-blue-500 relative"
          style={{
            width: Math.max(50, form.Width * scale * 0.1),
            height: Math.max(30, form.Height * scale * 0.1),
            backgroundColor: form.BackColor || '#8080FF',
          }}
          onClick={() => handleFormClick(form.id)}
          title={form.name}
        >
          <div className="absolute inset-0 p-1">
            <div className="text-xs font-bold truncate" style={{ fontSize: `${8 * scale}px` }}>
              {form.caption || form.name}
            </div>

            {/* Miniature controls */}
            {state.controls
              .filter(c => c.formId === form.id)
              .slice(0, 10) // Limit to first 10 controls for performance
              .map(control => (
                <div
                  key={control.id}
                  className="absolute bg-white border border-gray-300"
                  style={{
                    left: control.x * scale * 0.1,
                    top: (control.y + 20) * scale * 0.1, // Offset for title bar
                    width: Math.max(2, control.width * scale * 0.1),
                    height: Math.max(2, control.height * scale * 0.1),
                    backgroundColor:
                      control.type === 'CommandButton'
                        ? '#C0C0C0'
                        : control.type === 'TextBox'
                          ? '#FFFFFF'
                          : control.type === 'Label'
                            ? 'transparent'
                            : '#E0E0E0',
                  }}
                />
              ))}
          </div>

          {selectedForm === form.id && (
            <div className="absolute inset-0 border-2 border-blue-500 pointer-events-none" />
          )}
        </div>
      );
    },
    [zoom, selectedForm, state.controls, handleFormClick]
  );

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className="bg-gray-200 border-2 border-gray-400 shadow-lg"
        style={{ width: '700px', height: '500px' }}
      >
        <div className="bg-blue-600 text-white text-sm font-bold p-2 flex items-center justify-between">
          <span>Form Layout</span>
          <button onClick={onClose} className="text-white hover:bg-blue-700 px-2">
            ×
          </button>
        </div>

        <div className="p-4 h-full flex flex-col">
          {/* Toolbar */}
          <div className="mb-4 flex items-center gap-2">
            <div className="flex items-center gap-1">
              <button
                className="p-1 border border-gray-400 bg-gray-100 hover:bg-gray-300"
                title="Move"
              >
                <Move size={16} />
              </button>
              <button
                className="p-1 border border-gray-400 bg-gray-100 hover:bg-gray-300"
                title="Rotate"
              >
                <RotateCw size={16} />
              </button>
              <button
                className="p-1 border border-gray-400 bg-gray-100 hover:bg-gray-300"
                title="Resize"
              >
                <Square size={16} />
              </button>
            </div>

            <div className="w-px h-6 bg-gray-400 mx-2" />

            <div className="flex items-center gap-2">
              <span className="text-xs">Zoom:</span>
              <select
                value={zoom}
                onChange={e => setZoom(parseInt(e.target.value))}
                className="border border-gray-400 px-1 py-0.5 text-xs"
              >
                <option value={25}>25%</option>
                <option value={50}>50%</option>
                <option value={75}>75%</option>
                <option value={100}>100%</option>
                <option value={150}>150%</option>
                <option value={200}>200%</option>
              </select>
            </div>

            <div className="ml-auto text-xs text-gray-600">
              {state.forms.length} form{state.forms.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Forms grid */}
          <div className="flex-1 bg-white border border-gray-400 p-4 overflow-auto">
            <div className="grid grid-cols-4 gap-4">
              {state.forms.map(form => (
                <div key={form.id} className="text-center">
                  {getFormPreview(form)}
                  <div className="mt-2 text-xs font-mono truncate" title={form.name}>
                    {form.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {form.Width || 640}×{form.Height || 480}
                  </div>
                </div>
              ))}

              {/* Add new form placeholder */}
              <div className="text-center">
                <div
                  className="bg-gray-50 border-2 border-dashed border-gray-300 cursor-pointer hover:border-blue-400 flex items-center justify-center"
                  style={{ width: 60, height: 40 }}
                  onClick={() => {
                    // Add new form logic
                  }}
                >
                  <span className="text-gray-400 text-lg">+</span>
                </div>
                <div className="mt-2 text-xs text-gray-500">Add Form</div>
              </div>
            </div>
          </div>

          {/* Properties panel for selected form */}
          {selectedForm && (
            <div className="mt-4 pt-4 border-t border-gray-300">
              <div className="text-xs font-bold mb-2">Form Properties</div>
              <div className="grid grid-cols-4 gap-4 text-xs">
                <div>
                  <strong>Name:</strong>
                  <br />
                  {state.forms.find(f => f.id === selectedForm)?.name}
                </div>
                <div>
                  <strong>Caption:</strong>
                  <br />
                  {state.forms.find(f => f.id === selectedForm)?.caption}
                </div>
                <div>
                  <strong>Size:</strong>
                  <br />
                  {state.formProperties.Width}×{state.formProperties.Height}
                </div>
                <div>
                  <strong>Controls:</strong>
                  <br />
                  {state.controls.filter(c => c.formId === selectedForm).length}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
