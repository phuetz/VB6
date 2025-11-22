// Ultra-Think AI IntelliSense Settings Panel
// ⚙️ Configuration avancée pour personnaliser l'expérience IA

import React, { useState, useEffect } from 'react';
import {
  Brain,
  Settings,
  Zap,
  Target,
  TrendingUp,
  Clock,
  Database,
  Sparkles,
  RotateCcw,
  Download,
  Upload,
  Eye,
  EyeOff,
  Sliders,
  BarChart3
} from 'lucide-react';
import { aiIntelliSenseEngine } from '../../services/AIIntelliSenseEngine';

interface AIIntelliSenseSettingsProps {
  visible: boolean;
  onClose: () => void;
}

interface AISettings {
  enableAI: boolean;
  personalizedSuggestions: boolean;
  contextWindow: number;
  maxSuggestions: number;
  confidenceThreshold: number;
  learningRate: number;
  enableSnippets: boolean;
  enablePatternLearning: boolean;
  enableProjectTypeDetection: boolean;
  enableTimeBasedSuggestions: boolean;
  showAIIndicators: boolean;
  autoTriggerDelay: number;
}

const DEFAULT_SETTINGS: AISettings = {
  enableAI: true,
  personalizedSuggestions: true,
  contextWindow: 1000,
  maxSuggestions: 50,
  confidenceThreshold: 0.3,
  learningRate: 0.1,
  enableSnippets: true,
  enablePatternLearning: true,
  enableProjectTypeDetection: true,
  enableTimeBasedSuggestions: false,
  showAIIndicators: true,
  autoTriggerDelay: 300
};

export const AIIntelliSenseSettings: React.FC<AIIntelliSenseSettingsProps> = ({
  visible,
  onClose
}) => {
  const [settings, setSettings] = useState<AISettings>(DEFAULT_SETTINGS);
  const [activeTab, setActiveTab] = useState<'general' | 'performance' | 'learning' | 'advanced'>('general');
  const [isExporting, setIsExporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);

  // Load settings on mount
  useEffect(() => {
    const saved = localStorage.getItem('ai-intellisense-settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch (error) {
        console.error('Failed to load AI IntelliSense settings:', error);
      }
    }
  }, []);

  // Save settings when changed
  const updateSettings = (updates: Partial<AISettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    localStorage.setItem('ai-intellisense-settings', JSON.stringify(newSettings));
    
    // Update the AI engine configuration
    aiIntelliSenseEngine.updateConfig({
      enableAI: newSettings.enableAI,
      personalizedSuggestions: newSettings.personalizedSuggestions,
      contextWindow: newSettings.contextWindow,
      maxSuggestions: newSettings.maxSuggestions,
      confidenceThreshold: newSettings.confidenceThreshold,
      learningRate: newSettings.learningRate
    });
  };

  // Reset to defaults
  const resetToDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem('ai-intellisense-settings');
    aiIntelliSenseEngine.resetLearning();
  };

  // Export settings
  const exportSettings = async () => {
    setIsExporting(true);
    
    try {
      const exportData = {
        settings,
        timestamp: new Date().toISOString(),
        version: '1.0'
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-intellisense-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export settings:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Import settings
  const importSettings = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.settings) {
          setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
          localStorage.setItem('ai-intellisense-settings', JSON.stringify(data.settings));
        }
      } catch (error) {
        console.error('Failed to import settings:', error);
        alert('Failed to import settings. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  if (!visible) return null;

  const TabButton: React.FC<{ id: string; icon: React.ReactNode; label: string; active: boolean }> = ({
    id,
    icon,
    label,
    active
  }) => (
    <button
      onClick={() => setActiveTab(id as any)}
      className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors ${
        active
          ? 'bg-purple-600 text-white'
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  const SettingRow: React.FC<{
    icon: React.ReactNode;
    title: string;
    description: string;
    children: React.ReactNode;
  }> = ({ icon, title, description, children }) => (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div className="flex items-start gap-3">
        <div className="text-purple-600 mt-1">{icon}</div>
        <div>
          <h4 className="font-medium text-gray-800">{title}</h4>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
      <div>{children}</div>
    </div>
  );

  const Toggle: React.FC<{ checked: boolean; onChange: (checked: boolean) => void }> = ({
    checked,
    onChange
  }) => (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
    </label>
  );

  const Slider: React.FC<{
    value: number;
    min: number;
    max: number;
    step?: number;
    onChange: (value: number) => void;
    unit?: string;
  }> = ({ value, min, max, step = 1, onChange, unit = '' }) => (
    <div className="flex items-center gap-3">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-32 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
      />
      <span className="text-sm text-gray-600 font-mono w-16">
        {value}{unit}
      </span>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
      <div className="bg-white rounded-lg shadow-2xl w-[800px] h-[600px] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="text-purple-600" size={24} />
            <h2 className="text-xl font-semibold text-gray-800">
              AI IntelliSense Settings
            </h2>
            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm">
              Ultra-Think
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-6 py-4 border-b border-gray-200">
          <TabButton
            id="general"
            icon={<Settings size={16} />}
            label="General"
            active={activeTab === 'general'}
          />
          <TabButton
            id="performance"
            icon={<Zap size={16} />}
            label="Performance"
            active={activeTab === 'performance'}
          />
          <TabButton
            id="learning"
            icon={<TrendingUp size={16} />}
            label="Learning"
            active={activeTab === 'learning'}
          />
          <TabButton
            id="advanced"
            icon={<Sliders size={16} />}
            label="Advanced"
            active={activeTab === 'advanced'}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'general' && (
            <div className="space-y-4">
              <SettingRow
                icon={<Brain size={18} />}
                title="Enable AI Suggestions"
                description="Use artificial intelligence to provide smart code completions"
              >
                <Toggle
                  checked={settings.enableAI}
                  onChange={(checked) => updateSettings({ enableAI: checked })}
                />
              </SettingRow>

              <SettingRow
                icon={<Sparkles size={18} />}
                title="Show AI Indicators"
                description="Display visual indicators for AI-generated suggestions"
              >
                <Toggle
                  checked={settings.showAIIndicators}
                  onChange={(checked) => updateSettings({ showAIIndicators: checked })}
                />
              </SettingRow>

              <SettingRow
                icon={<Database size={18} />}
                title="Enable Code Snippets"
                description="Include common VB6 code patterns and templates"
              >
                <Toggle
                  checked={settings.enableSnippets}
                  onChange={(checked) => updateSettings({ enableSnippets: checked })}
                />
              </SettingRow>

              <SettingRow
                icon={<Target size={18} />}
                title="Project Type Detection"
                description="Automatically adjust suggestions based on project type"
              >
                <Toggle
                  checked={settings.enableProjectTypeDetection}
                  onChange={(checked) => updateSettings({ enableProjectTypeDetection: checked })}
                />
              </SettingRow>

              <SettingRow
                icon={<Clock size={18} />}
                title="Auto-Trigger Delay"
                description="Milliseconds to wait before showing suggestions"
              >
                <Slider
                  value={settings.autoTriggerDelay}
                  min={0}
                  max={1000}
                  step={50}
                  onChange={(value) => updateSettings({ autoTriggerDelay: value })}
                  unit="ms"
                />
              </SettingRow>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="space-y-4">
              <SettingRow
                icon={<BarChart3 size={18} />}
                title="Max Suggestions"
                description="Maximum number of suggestions to show at once"
              >
                <Slider
                  value={settings.maxSuggestions}
                  min={10}
                  max={200}
                  step={10}
                  onChange={(value) => updateSettings({ maxSuggestions: value })}
                />
              </SettingRow>

              <SettingRow
                icon={<Target size={18} />}
                title="Confidence Threshold"
                description="Minimum confidence score for suggestions (0-1)"
              >
                <Slider
                  value={settings.confidenceThreshold}
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={(value) => updateSettings({ confidenceThreshold: value })}
                />
              </SettingRow>

              <SettingRow
                icon={<Eye size={18} />}
                title="Context Window"
                description="Characters of code to analyze around cursor"
              >
                <Slider
                  value={settings.contextWindow}
                  min={100}
                  max={5000}
                  step={100}
                  onChange={(value) => updateSettings({ contextWindow: value })}
                />
              </SettingRow>

              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-start gap-3">
                  <Zap className="text-yellow-600 mt-0.5" size={16} />
                  <div>
                    <h4 className="font-medium text-yellow-800">Performance Tips</h4>
                    <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                      <li>• Lower confidence threshold = more suggestions but slower</li>
                      <li>• Smaller context window = faster but less accurate</li>
                      <li>• Max 100 suggestions recommended for best performance</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'learning' && (
            <div className="space-y-4">
              <SettingRow
                icon={<TrendingUp size={18} />}
                title="Personalized Suggestions"
                description="Learn from your coding patterns to improve suggestions"
              >
                <Toggle
                  checked={settings.personalizedSuggestions}
                  onChange={(checked) => updateSettings({ personalizedSuggestions: checked })}
                />
              </SettingRow>

              <SettingRow
                icon={<Brain size={18} />}
                title="Pattern Learning"
                description="Automatically detect and learn from code patterns"
              >
                <Toggle
                  checked={settings.enablePatternLearning}
                  onChange={(checked) => updateSettings({ enablePatternLearning: checked })}
                />
              </SettingRow>

              <SettingRow
                icon={<Clock size={18} />}
                title="Time-Based Suggestions"
                description="Adjust suggestions based on time of day patterns"
              >
                <Toggle
                  checked={settings.enableTimeBasedSuggestions}
                  onChange={(checked) => updateSettings({ enableTimeBasedSuggestions: checked })}
                />
              </SettingRow>

              <SettingRow
                icon={<Sliders size={18} />}
                title="Learning Rate"
                description="How quickly the AI adapts to your patterns (0-1)"
              >
                <Slider
                  value={settings.learningRate}
                  min={0.01}
                  max={0.5}
                  step={0.01}
                  onChange={(value) => updateSettings({ learningRate: value })}
                />
              </SettingRow>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <Brain className="text-blue-600 mt-0.5" size={16} />
                  <div>
                    <h4 className="font-medium text-blue-800">Learning Status</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      The AI has learned from your coding patterns and will continue to improve suggestions over time.
                    </p>
                    <button
                      onClick={() => {
                        aiIntelliSenseEngine.resetLearning();
                        alert('Learning data has been reset.');
                      }}
                      className="mt-2 text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                    >
                      Reset Learning Data
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-start gap-3">
                  <Settings className="text-red-600 mt-0.5" size={16} />
                  <div>
                    <h4 className="font-medium text-red-800">Advanced Settings</h4>
                    <p className="text-sm text-red-700 mt-1">
                      These settings affect core AI behavior. Change with caution.
                    </p>
                  </div>
                </div>
              </div>

              {/* Cache Management */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-800">Cache Management</h4>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      aiIntelliSenseEngine.clearCache();
                      alert('Cache cleared successfully.');
                    }}
                    className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm"
                  >
                    Clear Cache
                  </button>
                </div>
              </div>

              {/* Import/Export */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-800">Settings Backup</h4>
                <div className="flex gap-2">
                  <button
                    onClick={exportSettings}
                    disabled={isExporting}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm disabled:opacity-50"
                  >
                    <Download size={14} />
                    {isExporting ? 'Exporting...' : 'Export Settings'}
                  </button>
                  
                  <label className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm cursor-pointer">
                    <Upload size={14} />
                    Import Settings
                    <input
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          importSettings(file);
                          e.target.value = '';
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* Debug Information */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-800">Debug Information</h4>
                <div className="bg-gray-100 rounded p-3 font-mono text-sm">
                  <div>AI Engine: Active</div>
                  <div>Learning Mode: {settings.personalizedSuggestions ? 'Enabled' : 'Disabled'}</div>
                  <div>Cache Size: Dynamic</div>
                  <div>Version: 1.0.0-ultra</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
          <button
            onClick={resetToDefaults}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 text-sm"
          >
            <RotateCcw size={14} />
            Reset to Defaults
          </button>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Save & Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIIntelliSenseSettings;