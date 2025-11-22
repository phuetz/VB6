import React, { useState, useMemo } from 'react';
import { X, Search, Filter, Star, Clock, Code, Database, Palette, Wrench, Gamepad2, Briefcase } from 'lucide-react';
import { projectTemplates, ProjectTemplate } from '../../data/projectTemplates';
import { useVB6Store } from '../../stores/vb6Store';
import { VB6Control } from '../../types/vb6';

interface ProjectTemplateWizardProps {
  visible: boolean;
  onClose: () => void;
  onCreateProject: (template: ProjectTemplate) => void;
}

const categoryIcons = {
  standard: <Code size={20} />,
  database: <Database size={20} />,
  graphics: <Palette size={20} />,
  utilities: <Wrench size={20} />,
  games: <Gamepad2 size={20} />,
  business: <Briefcase size={20} />
};

const categoryColors = {
  standard: '#2196F3',
  database: '#4CAF50',
  graphics: '#FF9800',
  utilities: '#9C27B0',
  games: '#F44336',
  business: '#00BCD4'
};

export const ProjectTemplateWizard: React.FC<ProjectTemplateWizardProps> = ({
  visible,
  onClose,
  onCreateProject
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const { clearProject, addControl, updateFormProperties, updateCode } = useVB6Store();

  const filteredTemplates = useMemo(() => {
    let templates = [...projectTemplates];

    // Filter by category
    if (selectedCategory !== 'all') {
      templates = templates.filter(t => t.category === selectedCategory);
    }

    // Filter by difficulty
    if (selectedDifficulty !== 'all') {
      templates = templates.filter(t => t.difficulty === selectedDifficulty);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      templates = templates.filter(t =>
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return templates;
  }, [selectedCategory, selectedDifficulty, searchQuery]);

  const handleCreateProject = () => {
    if (!selectedTemplate) return;

    // Clear existing project
    clearProject();

    // Load the first form from template
    const firstForm = selectedTemplate.forms[0];
    if (firstForm) {
      // Update form properties
      updateFormProperties({
        Caption: firstForm.caption,
        Width: firstForm.width,
        Height: firstForm.height
      });

      // Add controls from template
      firstForm.controls.forEach(controlData => {
        const control: VB6Control = {
          id: `${controlData.type}_${Date.now()}_${Math.random()}`,
          type: controlData.type || 'Label',
          Name: controlData.Name || `${controlData.type}1`,
          Caption: controlData.Caption || '',
          Text: controlData.Text || '',
          Left: controlData.Left || 0,
          Top: controlData.Top || 0,
          Width: controlData.Width || 100,
          Height: controlData.Height || 30,
          Visible: true,
          Enabled: true,
          TabIndex: 0,
          Font: 'Segoe UI',
          FontSize: controlData.FontSize || 9,
          FontBold: controlData.FontBold || false,
          FontItalic: false,
          FontUnderline: false,
          ForeColor: controlData.ForeColor || '#000000',
          BackColor: controlData.BackColor !== undefined ? 
            `#${controlData.BackColor.toString(16).padStart(6, '0')}` : '#F0F0F0',
          BorderStyle: controlData.BorderStyle || 0,
          Value: controlData.Value || false,
          Min: 0,
          Max: 100,
          SmallChange: 1,
          LargeChange: 10,
          Orientation: 0,
          TickStyle: 0,
          TickFrequency: 1,
          ...controlData
        };
        addControl(control);
      });

      // Update code
      updateCode(firstForm.code);
    }

    // Notify parent
    onCreateProject(selectedTemplate);
    onClose();
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#4CAF50';
      case 'intermediate': return '#FF9800';
      case 'advanced': return '#F44336';
      default: return '#757575';
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg shadow-2xl w-[900px] h-[700px] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">Project Templates</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 border-b border-gray-200 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category and Difficulty Filters */}
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-500" />
              <span className="text-sm text-gray-600">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="all">All Categories</option>
                <option value="standard">Standard</option>
                <option value="database">Database</option>
                <option value="graphics">Graphics</option>
                <option value="utilities">Utilities</option>
                <option value="games">Games</option>
                <option value="business">Business</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Difficulty:</span>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="all">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>
        </div>

        {/* Template Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">No templates found</p>
              <p className="text-sm mt-2">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedTemplate?.id === template.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                  }`}
                  onClick={() => setSelectedTemplate(template)}
                  onDoubleClick={handleCreateProject}
                >
                  <div className="flex items-start gap-3">
                    <div 
                      className="text-3xl"
                      style={{ color: categoryColors[template.category] }}
                    >
                      {template.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{template.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                      
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-1">
                          <span style={{ color: categoryColors[template.category] }}>
                            {categoryIcons[template.category]}
                          </span>
                          <span className="text-xs text-gray-500 capitalize">{template.category}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Star 
                            size={14} 
                            style={{ color: getDifficultyColor(template.difficulty) }}
                            fill={getDifficultyColor(template.difficulty)}
                          />
                          <span 
                            className="text-xs capitalize"
                            style={{ color: getDifficultyColor(template.difficulty) }}
                          >
                            {template.difficulty}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <Clock size={14} className="text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {template.forms.length} form{template.forms.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1 mt-2">
                        {template.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {selectedTemplate ? (
              <span>Selected: <strong>{selectedTemplate.name}</strong></span>
            ) : (
              <span>Select a template to get started</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateProject}
              disabled={!selectedTemplate}
              className={`px-4 py-2 rounded transition-colors ${
                selectedTemplate
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Create Project
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectTemplateWizard;