import React, { useState, useCallback } from 'react';
import {
  FileText,
  Folder,
  Database,
  Globe,
  Package,
  Plus,
  Download,
  Upload,
  Star,
  Search,
  Filter,
} from 'lucide-react';

interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  tags: string[];
  preview: string;
  files: TemplateFile[];
  featured: boolean;
  downloads: number;
  rating: number;
  author: string;
}

interface TemplateFile {
  path: string;
  content: string;
  type: 'form' | 'module' | 'class' | 'resource';
}

const projectTemplates: ProjectTemplate[] = [
  {
    id: 'calculator',
    name: 'Calculator App',
    description: 'A complete calculator application with basic arithmetic operations',
    category: 'Utilities',
    icon: '🔢',
    difficulty: 'Beginner',
    tags: ['math', 'calculator', 'basic'],
    preview: 'A simple yet functional calculator with a clean interface',
    files: [],
    featured: true,
    downloads: 1250,
    rating: 4.8,
    author: 'VB6 Team',
  },
  {
    id: 'text-editor',
    name: 'Text Editor',
    description: 'Rich text editor with file operations and formatting',
    category: 'Productivity',
    icon: '📝',
    difficulty: 'Intermediate',
    tags: ['editor', 'text', 'files'],
    preview: 'Full-featured text editor with save/load capabilities',
    files: [],
    featured: true,
    downloads: 890,
    rating: 4.6,
    author: 'CodeMaster',
  },
  {
    id: 'database-manager',
    name: 'Database Manager',
    description: 'CRUD operations with database connectivity',
    category: 'Database',
    icon: '🗄️',
    difficulty: 'Advanced',
    tags: ['database', 'crud', 'data'],
    preview: 'Manage database records with an intuitive interface',
    files: [],
    featured: false,
    downloads: 567,
    rating: 4.4,
    author: 'DataPro',
  },
  {
    id: 'game-framework',
    name: 'Game Framework',
    description: 'Basic 2D game framework with sprites and collision detection',
    category: 'Games',
    icon: '🎮',
    difficulty: 'Advanced',
    tags: ['game', '2d', 'sprites'],
    preview: 'Foundation for creating 2D games',
    files: [],
    featured: true,
    downloads: 1456,
    rating: 4.9,
    author: 'GameDev Studio',
  },
  {
    id: 'web-scraper',
    name: 'Web Scraper',
    description: 'Extract data from websites with HTTP requests',
    category: 'Web',
    icon: '🌐',
    difficulty: 'Intermediate',
    tags: ['web', 'scraping', 'http'],
    preview: 'Automated web data extraction tool',
    files: [],
    featured: false,
    downloads: 334,
    rating: 4.2,
    author: 'WebTools',
  },
  {
    id: 'media-player',
    name: 'Media Player',
    description: 'Audio and video player with playlist support',
    category: 'Multimedia',
    icon: '🎵',
    difficulty: 'Advanced',
    tags: ['media', 'audio', 'video'],
    preview: 'Play your favorite media files',
    files: [],
    featured: false,
    downloads: 723,
    rating: 4.3,
    author: 'MediaTech',
  },
];

const categories = ['All', 'Utilities', 'Productivity', 'Database', 'Games', 'Web', 'Multimedia'];
const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced'];

interface ProjectTemplateManagerProps {
  visible: boolean;
  onClose: () => void;
  onCreateProject: (template: ProjectTemplate) => void;
}

export const ProjectTemplateManager: React.FC<ProjectTemplateManagerProps> = ({
  visible,
  onClose,
  onCreateProject,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'downloads' | 'rating'>('downloads');

  const filteredTemplates = projectTemplates
    .filter(template => {
      const matchesSearch =
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory;
      const matchesDifficulty =
        selectedDifficulty === 'All' || template.difficulty === selectedDifficulty;
      const matchesFeatured = !showFeaturedOnly || template.featured;

      return matchesSearch && matchesCategory && matchesDifficulty && matchesFeatured;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'downloads':
          return b.downloads - a.downloads;
        case 'rating':
          return b.rating - a.rating;
        default:
          return 0;
      }
    });

  const handleCreateProject = useCallback(() => {
    if (selectedTemplate) {
      onCreateProject(selectedTemplate);
      onClose();
    }
  }, [selectedTemplate, onCreateProject, onClose]);

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: React.ReactNode } = {
      Utilities: <Package size={16} />,
      Productivity: <FileText size={16} />,
      Database: <Database size={16} />,
      Games: <span className="text-purple-600">🎮</span>,
      Web: <Globe size={16} />,
      Multimedia: <span className="text-pink-600">🎵</span>,
    };
    return icons[category] || <Folder size={16} />;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return 'text-green-600 bg-green-100';
      case 'Intermediate':
        return 'text-yellow-600 bg-yellow-100';
      case 'Advanced':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={12}
        className={i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}
      />
    ));
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className="bg-gray-200 border-2 border-gray-400 shadow-lg"
        style={{ width: '1000px', height: '700px' }}
      >
        <div className="bg-blue-600 text-white text-sm font-bold p-2 flex items-center justify-between">
          <span>Project Templates</span>
          <button onClick={onClose} className="text-white hover:bg-blue-700 px-2">
            ×
          </button>
        </div>

        <div className="p-4 h-full flex flex-col">
          {/* Search and Filters */}
          <div className="mb-4 space-y-3">
            <div className="flex gap-4 items-center">
              <div className="flex-1 relative">
                <Search
                  size={16}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500"
                />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-gray-400 text-sm rounded"
                />
              </div>

              <label className="flex items-center text-xs">
                <input
                  type="checkbox"
                  checked={showFeaturedOnly}
                  onChange={e => setShowFeaturedOnly(e.target.checked)}
                  className="mr-1"
                />
                Featured only
              </label>
            </div>

            <div className="flex gap-4 items-center text-xs">
              <div className="flex items-center gap-2">
                <Filter size={14} />
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="border border-gray-400 px-2 py-1"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <select
                value={selectedDifficulty}
                onChange={e => setSelectedDifficulty(e.target.value)}
                className="border border-gray-400 px-2 py-1"
              >
                {difficulties.map(diff => (
                  <option key={diff} value={diff}>
                    {diff}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-2">
                <span>Sort by:</span>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className="border border-gray-400 px-2 py-1"
                >
                  <option value="downloads">Downloads</option>
                  <option value="rating">Rating</option>
                  <option value="name">Name</option>
                </select>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex gap-4">
            {/* Templates List */}
            <div className="w-1/2 bg-white border border-gray-400 overflow-auto">
              <div className="grid grid-cols-1 gap-2 p-2">
                {filteredTemplates.map(template => (
                  <div
                    key={template.id}
                    className={`p-3 border border-gray-300 cursor-pointer hover:border-blue-500 transition-colors ${
                      selectedTemplate?.id === template.id ? 'border-blue-500 bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{template.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-sm truncate">{template.name}</span>
                          {template.featured && (
                            <Star size={12} className="text-yellow-500 fill-current" />
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                          {template.description}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(template.category)}
                            <span className="text-xs text-gray-500">{template.category}</span>
                          </div>

                          <div
                            className={`px-2 py-1 rounded text-xs ${getDifficultyColor(template.difficulty)}`}
                          >
                            {template.difficulty}
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1">
                            {renderStars(template.rating)}
                            <span className="text-xs text-gray-500 ml-1">({template.rating})</span>
                          </div>

                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Download size={12} />
                            <span>{template.downloads}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Template Details */}
            <div className="w-1/2 bg-white border border-gray-400 flex flex-col">
              {selectedTemplate ? (
                <>
                  <div className="p-4 border-b border-gray-300">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="text-3xl">{selectedTemplate.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold">{selectedTemplate.name}</h3>
                          {selectedTemplate.featured && (
                            <Star size={16} className="text-yellow-500 fill-current" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{selectedTemplate.description}</p>

                        <div className="flex items-center gap-4 text-xs">
                          <div className="flex items-center gap-1">
                            {getCategoryIcon(selectedTemplate.category)}
                            <span>{selectedTemplate.category}</span>
                          </div>
                          <div
                            className={`px-2 py-1 rounded ${getDifficultyColor(selectedTemplate.difficulty)}`}
                          >
                            {selectedTemplate.difficulty}
                          </div>
                          <span className="text-gray-500">by {selectedTemplate.author}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded text-sm">
                      <div className="font-semibold mb-1">Preview:</div>
                      <p>{selectedTemplate.preview}</p>
                    </div>
                  </div>

                  <div className="p-4 flex-1">
                    <div className="mb-3">
                      <div className="text-sm font-semibold mb-2">Tags:</div>
                      <div className="flex flex-wrap gap-1">
                        {selectedTemplate.tags.map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="text-sm font-semibold mb-2">Statistics:</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1">
                          <Download size={12} />
                          <span>{selectedTemplate.downloads} downloads</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {renderStars(selectedTemplate.rating)}
                          <span className="ml-1">{selectedTemplate.rating}/5</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-sm">
                      <div className="font-semibold mb-2">What's included:</div>
                      <ul className="list-disc list-inside text-xs space-y-1 text-gray-600">
                        <li>Complete project structure</li>
                        <li>Well-documented source code</li>
                        <li>Ready-to-use forms and modules</li>
                        <li>Example data and resources</li>
                        <li>Build and deployment scripts</li>
                      </ul>
                    </div>
                  </div>

                  <div className="p-4 border-t border-gray-300">
                    <button
                      onClick={handleCreateProject}
                      className="w-full py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition-colors"
                    >
                      Create Project from Template
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <FileText size={48} className="mx-auto mb-3 opacity-50" />
                    <div className="text-lg mb-1">Select a Template</div>
                    <div className="text-sm">Choose a template to see its details</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 pt-3 border-t border-gray-300 flex justify-between items-center text-xs">
            <div className="text-gray-600">
              {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} found
            </div>

            <div className="flex gap-2">
              <button className="px-3 py-1 border border-gray-400 bg-gray-100 hover:bg-gray-300 flex items-center gap-1">
                <Upload size={12} />
                Import Template
              </button>
              <button className="px-3 py-1 border border-gray-400 bg-gray-100 hover:bg-gray-300 flex items-center gap-1">
                <Plus size={12} />
                Create Template
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
