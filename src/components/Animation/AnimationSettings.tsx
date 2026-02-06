// Animation Settings Component
// Allows users to configure animation preferences

import React from 'react';
import { Zap, Clock, Eye, EyeOff } from 'lucide-react';

interface AnimationSettingsProps {
  visible: boolean;
  onClose: () => void;
  settings: {
    enableAnimations: boolean;
    animationSpeed: 'slow' | 'normal' | 'fast';
    showAnimationOverlay: boolean;
    enableSnapAnimations: boolean;
    enableAlignmentAnimations: boolean;
    enableResizeAnimations: boolean;
    enableFadeAnimations: boolean;
  };
  onUpdateSettings: (settings: any) => void;
}

export const AnimationSettings: React.FC<AnimationSettingsProps> = ({
  visible,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!visible) return null;

  const handleToggle = (key: string) => {
    onUpdateSettings({
      ...settings,
      [key]: !settings[key as keyof typeof settings],
    });
  };

  const handleSpeedChange = (speed: 'slow' | 'normal' | 'fast') => {
    onUpdateSettings({
      ...settings,
      animationSpeed: speed,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
      <div className="bg-white rounded-lg shadow-2xl w-[500px] max-h-[600px] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="text-purple-500" size={24} />
            <h2 className="text-xl font-semibold text-gray-800">Animation Settings</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Master Toggle */}
          <div className="mb-6">
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center gap-3">
                <Zap className="text-purple-600" size={20} />
                <div>
                  <h3 className="font-semibold text-gray-800">Enable Animations</h3>
                  <p className="text-sm text-gray-600">
                    Turn on/off all transition animations in the designer
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableAnimations}
                  onChange={() => handleToggle('enableAnimations')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
          </div>

          {/* Animation Speed */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Clock size={18} />
              Animation Speed
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {(['slow', 'normal', 'fast'] as const).map(speed => (
                <button
                  key={speed}
                  onClick={() => handleSpeedChange(speed)}
                  disabled={!settings.enableAnimations}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    settings.animationSpeed === speed
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } ${!settings.enableAnimations ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {speed.charAt(0).toUpperCase() + speed.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Animation Types */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800 mb-3">Animation Types</h3>

            {/* Show Animation Overlay */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Eye className="text-blue-600" size={18} />
                <div>
                  <div className="font-medium text-gray-800">Animation Overlay</div>
                  <div className="text-sm text-gray-600">Show visual effects during animations</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showAnimationOverlay}
                  onChange={() => handleToggle('showAnimationOverlay')}
                  disabled={!settings.enableAnimations}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Snap Animations */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 border-2 border-blue-500 rounded"></div>
                <div>
                  <div className="font-medium text-gray-800">Snap-to-Grid</div>
                  <div className="text-sm text-gray-600">Animate snapping to grid lines</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableSnapAnimations}
                  onChange={() => handleToggle('enableSnapAnimations')}
                  disabled={!settings.enableAnimations}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Alignment Animations */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-pink-500 rounded"></div>
                <div>
                  <div className="font-medium text-gray-800">Alignment</div>
                  <div className="text-sm text-gray-600">Animate control alignment operations</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableAlignmentAnimations}
                  onChange={() => handleToggle('enableAlignmentAnimations')}
                  disabled={!settings.enableAnimations}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
              </label>
            </div>

            {/* Resize Animations */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 border-2 border-orange-500"></div>
                <div>
                  <div className="font-medium text-gray-800">Resize</div>
                  <div className="text-sm text-gray-600">Animate control resizing operations</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableResizeAnimations}
                  onChange={() => handleToggle('enableResizeAnimations')}
                  disabled={!settings.enableAnimations}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
              </label>
            </div>

            {/* Fade Animations */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-purple-500 rounded-full opacity-60"></div>
                <div>
                  <div className="font-medium text-gray-800">Fade Effects</div>
                  <div className="text-sm text-gray-600">Animate create/delete operations</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableFadeAnimations}
                  onChange={() => handleToggle('enableFadeAnimations')}
                  disabled={!settings.enableAnimations}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
          </div>

          {/* Performance Note */}
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-start gap-3">
              <Clock className="text-yellow-600 mt-0.5" size={16} />
              <div>
                <h4 className="font-medium text-yellow-800">Performance Note</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Animations may impact performance with many controls. Disable animations if you
                  experience slowdowns during complex operations.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={() =>
              onUpdateSettings({
                enableAnimations: false,
                animationSpeed: 'normal',
                showAnimationOverlay: false,
                enableSnapAnimations: false,
                enableAlignmentAnimations: false,
                enableResizeAnimations: false,
                enableFadeAnimations: false,
              })
            }
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
          >
            Disable All
          </button>
          <button
            onClick={() =>
              onUpdateSettings({
                enableAnimations: true,
                animationSpeed: 'normal',
                showAnimationOverlay: true,
                enableSnapAnimations: true,
                enableAlignmentAnimations: true,
                enableResizeAnimations: true,
                enableFadeAnimations: true,
              })
            }
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Enable All
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnimationSettings;
