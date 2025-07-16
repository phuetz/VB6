import React, { useState, useCallback } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Settings,
  Folder,
  FileText,
  Package,
  Database,
} from 'lucide-react';

interface ProjectSetupWizardProps {
  visible: boolean;
  onClose: () => void;
  onComplete: (config: ProjectConfig) => void;
}

interface ProjectConfig {
  name: string;
  location: string;
  type: 'exe' | 'dll' | 'ocx';
  description: string;
  version: string;
  author: string;
  company: string;
  features: string[];
  references: string[];
  startupForm: string;
  icon: string;
}

const projectTypes = [
  {
    id: 'exe',
    name: 'Standard EXE',
    description: 'Create a standalone Windows executable application',
    icon: '🖥️',
    features: ['Forms', 'Modules', 'Classes', 'Resources'],
  },
  {
    id: 'dll',
    name: 'ActiveX DLL',
    description: 'Create a dynamic link library component',
    icon: '📚',
    features: ['Classes', 'Modules', 'COM Interfaces'],
  },
  {
    id: 'ocx',
    name: 'ActiveX Control',
    description: 'Create a reusable ActiveX control',
    icon: '🎛️',
    features: ['User Controls', 'Property Pages', 'Events'],
  },
];

const availableFeatures = [
  { id: 'database', name: 'Database Support', description: 'ADO/DAO connectivity' },
  { id: 'networking', name: 'Networking', description: 'Winsock and HTTP support' },
  { id: 'multimedia', name: 'Multimedia', description: 'Audio/Video capabilities' },
  { id: 'graphics', name: 'Graphics', description: 'Enhanced drawing and imaging' },
  { id: 'encryption', name: 'Encryption', description: 'Data security features' },
  { id: 'logging', name: 'Logging', description: 'Application logging framework' },
];

const availableReferences = [
  { id: 'vba', name: 'Visual Basic For Applications', checked: true, required: true },
  { id: 'vbruntime', name: 'Visual Basic Runtime', checked: true, required: true },
  { id: 'oleaut', name: 'OLE Automation', checked: true, required: false },
  { id: 'msxml', name: 'Microsoft XML Parser', checked: false, required: false },
  { id: 'adodb', name: 'Microsoft ActiveX Data Objects', checked: false, required: false },
  { id: 'scripting', name: 'Microsoft Scripting Runtime', checked: false, required: false },
  { id: 'shell', name: 'Microsoft Shell Controls', checked: false, required: false },
];

export const ProjectSetupWizard: React.FC<ProjectSetupWizardProps> = ({
  visible,
  onClose,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [config, setConfig] = useState<ProjectConfig>({
    name: 'Project1',
    location: 'C:\\VB6Projects\\',
    type: 'exe',
    description: '',
    version: '1.0.0',
    author: '',
    company: '',
    features: [],
    references: availableReferences.filter(r => r.checked).map(r => r.id),
    startupForm: 'Form1',
    icon: '',
  });

  const totalSteps = 5;

  const updateConfig = useCallback((updates: Partial<ProjectConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(config);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return config.name.trim() !== '' && config.location.trim() !== '';
      case 2:
        return config.type !== '';
      case 3:
        return true; // Optional step
      case 4:
        return true; // Optional step
      case 5:
        return true; // Review step
      default:
        return false;
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <FileText size={20} />
          Project Information
        </h3>
        <p className="text-sm text-gray-600 mb-4">Enter basic information about your project.</p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-semibold mb-1">Project Name *</label>
          <input
            type="text"
            value={config.name}
            onChange={e => updateConfig({ name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-400 rounded"
            placeholder="Enter project name"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Location *</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={config.location}
              onChange={e => updateConfig({ location: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-400 rounded"
              placeholder="C:\\VB6Projects\\"
            />
            <button className="px-3 py-2 border border-gray-400 bg-gray-100 hover:bg-gray-200 rounded">
              <Folder size={16} />
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Description</label>
          <textarea
            value={config.description}
            onChange={e => updateConfig({ description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-400 rounded"
            rows={3}
            placeholder="Brief description of your project"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold mb-1">Version</label>
            <input
              type="text"
              value={config.version}
              onChange={e => updateConfig({ version: e.target.value })}
              className="w-full px-3 py-2 border border-gray-400 rounded"
              placeholder="1.0.0"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Author</label>
            <input
              type="text"
              value={config.author}
              onChange={e => updateConfig({ author: e.target.value })}
              className="w-full px-3 py-2 border border-gray-400 rounded"
              placeholder="Your name"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Package size={20} />
          Project Type
        </h3>
        <p className="text-sm text-gray-600 mb-4">Choose the type of project you want to create.</p>
      </div>

      <div className="space-y-3">
        {projectTypes.map(type => (
          <div
            key={type.id}
            className={`p-4 border-2 rounded cursor-pointer transition-colors ${
              config.type === type.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onClick={() => updateConfig({ type: type.id as any })}
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl">{type.icon}</div>
              <div className="flex-1">
                <div className="font-bold text-sm mb-1">{type.name}</div>
                <div className="text-sm text-gray-600 mb-2">{type.description}</div>
                <div className="flex flex-wrap gap-1">
                  {type.features.map(feature => (
                    <span key={feature} className="px-2 py-1 bg-gray-200 text-xs rounded">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
              {config.type === type.id && <Check size={20} className="text-blue-600" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Settings size={20} />
          Features
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Select additional features to include in your project.
        </p>
      </div>

      <div className="space-y-2">
        {availableFeatures.map(feature => (
          <label
            key={feature.id}
            className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded cursor-pointer"
          >
            <input
              type="checkbox"
              checked={config.features.includes(feature.id)}
              onChange={e => {
                const features = e.target.checked
                  ? [...config.features, feature.id]
                  : config.features.filter(f => f !== feature.id);
                updateConfig({ features });
              }}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="font-semibold text-sm">{feature.name}</div>
              <div className="text-sm text-gray-600">{feature.description}</div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Database size={20} />
          References
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Choose which references to include in your project.
        </p>
      </div>

      <div className="space-y-2">
        {availableReferences.map(ref => (
          <label
            key={ref.id}
            className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded cursor-pointer"
          >
            <input
              type="checkbox"
              checked={config.references.includes(ref.id)}
              onChange={e => {
                if (ref.required) return; // Can't uncheck required references

                const references = e.target.checked
                  ? [...config.references, ref.id]
                  : config.references.filter(r => r !== ref.id);
                updateConfig({ references });
              }}
              disabled={ref.required}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="font-semibold text-sm flex items-center gap-2">
                {ref.name}
                {ref.required && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    Required
                  </span>
                )}
              </div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Check size={20} />
          Review & Create
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Review your project configuration before creating.
        </p>
      </div>

      <div className="bg-gray-50 p-4 rounded border">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-semibold mb-2">Project Details</div>
            <div className="space-y-1">
              <div>
                <strong>Name:</strong> {config.name}
              </div>
              <div>
                <strong>Type:</strong> {projectTypes.find(t => t.id === config.type)?.name}
              </div>
              <div>
                <strong>Version:</strong> {config.version}
              </div>
              <div>
                <strong>Location:</strong> {config.location}
              </div>
            </div>
          </div>

          <div>
            <div className="font-semibold mb-2">Configuration</div>
            <div className="space-y-1">
              <div>
                <strong>Features:</strong> {config.features.length || 'None'}
              </div>
              <div>
                <strong>References:</strong> {config.references.length}
              </div>
              <div>
                <strong>Author:</strong> {config.author || 'Not specified'}
              </div>
            </div>
          </div>
        </div>

        {config.description && (
          <div className="mt-3 pt-3 border-t border-gray-300">
            <div className="font-semibold mb-1">Description</div>
            <div className="text-sm text-gray-600">{config.description}</div>
          </div>
        )}

        {config.features.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-300">
            <div className="font-semibold mb-2">Selected Features</div>
            <div className="flex flex-wrap gap-1">
              {config.features.map(featureId => {
                const feature = availableFeatures.find(f => f.id === featureId);
                return feature ? (
                  <span
                    key={featureId}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                  >
                    {feature.name}
                  </span>
                ) : null;
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      case 5:
        return renderStep5();
      default:
        return null;
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className="bg-gray-200 border-2 border-gray-400 shadow-lg"
        style={{ width: '700px', height: '600px' }}
      >
        <div className="bg-blue-600 text-white text-sm font-bold p-2 flex items-center justify-between">
          <span>New Project Wizard</span>
          <button onClick={onClose} className="text-white hover:bg-blue-700 px-2">
            ×
          </button>
        </div>

        <div className="p-6 h-full flex flex-col">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold">
                Step {currentStep} of {totalSteps}
              </span>
              <span className="text-sm text-gray-600">
                {Math.round((currentStep / totalSteps) * 100)}% Complete
              </span>
            </div>
            <div className="w-full bg-gray-300 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          {/* Step Content */}
          <div className="flex-1 overflow-auto">{renderCurrentStep()}</div>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-300">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-4 py-2 border border-gray-400 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded"
            >
              <ArrowLeft size={16} />
              Previous
            </button>

            <div className="text-xs text-gray-500">
              {currentStep === totalSteps
                ? 'Ready to create your project'
                : 'Complete all required fields to continue'}
            </div>

            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded"
            >
              {currentStep === totalSteps ? 'Create Project' : 'Next'}
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
