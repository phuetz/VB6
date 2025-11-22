// Ultra-Think AST Diff Visualizer
// 🔍 Visualisation avancée des différences AST pour debugging hot-reload

import React, { useState, useMemo } from 'react';
import {
  GitBranch,
  Plus,
  Minus,
  Edit3,
  Move,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  Code,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  Hash,
  FileText,
  Settings
} from 'lucide-react';
import { ASTDiff, ASTNode, AffectedArea } from '../../services/HotReloadEngine';

interface ASTDiffVisualizerProps {
  visible: boolean;
  onClose: () => void;
  diffs: ASTDiff[];
  oldAST?: ASTNode;
  newAST?: ASTNode;
  onNodeSelect?: (node: ASTNode) => void;
  onDiffSelect?: (diff: ASTDiff) => void;
}

interface TreeViewNode {
  id: string;
  type: string;
  name?: string;
  children: TreeViewNode[];
  expanded: boolean;
  diff?: ASTDiff;
  highlighted: boolean;
  depth: number;
}

export const ASTDiffVisualizer: React.FC<ASTDiffVisualizerProps> = ({
  visible,
  onClose,
  diffs,
  oldAST,
  newAST,
  onNodeSelect,
  onDiffSelect
}) => {
  const [activeTab, setActiveTab] = useState<'diffs' | 'tree' | 'analysis'>('diffs');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedDiff, setSelectedDiff] = useState<ASTDiff | null>(null);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'added' | 'removed' | 'modified' | 'moved'>('all');

  // Filter diffs based on type
  const filteredDiffs = useMemo(() => {
    if (filterType === 'all') return diffs;
    return diffs.filter(diff => diff.type === filterType);
  }, [diffs, filterType]);

  // Convert AST to tree view format
  const treeViewData = useMemo(() => {
    if (!newAST) return null;
    return convertASTToTreeView(newAST, diffs, 0);
  }, [newAST, diffs]);

  // Analyze impact of changes
  const impactAnalysis = useMemo(() => {
    const analysis = {
      totalChanges: diffs.length,
      affectedAreas: new Map<string, number>(),
      riskLevel: 'low' as 'low' | 'medium' | 'high',
      recompileRequired: false,
      rerenderRequired: false,
      statePreservationRequired: false
    };

    diffs.forEach(diff => {
      diff.affects.forEach(area => {
        const key = `${area.type}:${area.scope}`;
        analysis.affectedAreas.set(key, (analysis.affectedAreas.get(key) || 0) + 1);
        
        if (area.requiresRecompile) analysis.recompileRequired = true;
        if (area.requiresRerender) analysis.rerenderRequired = true;
        if (area.requiresStatePreservation) analysis.statePreservationRequired = true;
      });
    });

    // Determine risk level
    if (analysis.totalChanges > 10 || analysis.recompileRequired) {
      analysis.riskLevel = 'high';
    } else if (analysis.totalChanges > 5 || analysis.rerenderRequired) {
      analysis.riskLevel = 'medium';
    }

    return analysis;
  }, [diffs]);

  const toggleNodeExpansion = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const handleDiffClick = (diff: ASTDiff) => {
    setSelectedDiff(diff);
    onDiffSelect?.(diff);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10001]">
      <div className="bg-white rounded-lg shadow-2xl w-[900px] h-[700px] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
          <div className="flex items-center gap-3">
            <GitBranch size={20} />
            <h2 className="text-lg font-semibold">AST Diff Visualizer</h2>
            <span className="px-2 py-1 bg-white bg-opacity-20 rounded text-sm">
              {diffs.length} changes
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                showTechnicalDetails 
                  ? 'bg-white bg-opacity-20' 
                  : 'hover:bg-white hover:bg-opacity-10'
              }`}
            >
              {showTechnicalDetails ? <EyeOff size={14} /> : <Eye size={14} />}
              {showTechnicalDetails ? 'Hide Details' : 'Show Details'}
            </button>
            <button
              onClick={onClose}
              className="hover:bg-white hover:bg-opacity-20 p-2 rounded transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'diffs', label: 'Changes', icon: Edit3, count: diffs.length },
            { id: 'tree', label: 'AST Tree', icon: GitBranch, count: newAST ? 1 : 0 },
            { id: 'analysis', label: 'Impact Analysis', icon: Zap, count: impactAnalysis.affectedAreas.size }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-500'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
              {tab.count > 0 && (
                <span className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'diffs' && (
            <div className="h-full flex">
              {/* Diff List */}
              <div className="w-1/2 border-r border-gray-200 overflow-y-auto">
                {/* Filter Controls */}
                <div className="p-3 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Filter:</span>
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value as any)}
                      className="text-sm border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="all">All Changes ({diffs.length})</option>
                      <option value="added">Added ({diffs.filter(d => d.type === 'added').length})</option>
                      <option value="removed">Removed ({diffs.filter(d => d.type === 'removed').length})</option>
                      <option value="modified">Modified ({diffs.filter(d => d.type === 'modified').length})</option>
                      <option value="moved">Moved ({diffs.filter(d => d.type === 'moved').length})</option>
                    </select>
                  </div>
                </div>

                {/* Diff Items */}
                <div className="p-3 space-y-2">
                  {filteredDiffs.map((diff, index) => (
                    <DiffItem
                      key={index}
                      diff={diff}
                      isSelected={selectedDiff === diff}
                      onClick={() => handleDiffClick(diff)}
                      showDetails={showTechnicalDetails}
                    />
                  ))}
                  
                  {filteredDiffs.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <FileText size={32} className="mx-auto mb-2 opacity-50" />
                      <p>No changes of this type</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Diff Details */}
              <div className="w-1/2 overflow-y-auto">
                {selectedDiff ? (
                  <DiffDetails diff={selectedDiff} showTechnical={showTechnicalDetails} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <Code size={48} className="mx-auto mb-4 opacity-50" />
                      <p>Select a change to view details</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'tree' && (
            <div className="p-4 overflow-y-auto h-full">
              {treeViewData ? (
                <TreeView
                  node={treeViewData}
                  expandedNodes={expandedNodes}
                  onToggleExpand={toggleNodeExpansion}
                  onNodeSelect={onNodeSelect}
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <GitBranch size={32} className="mx-auto mb-2 opacity-50" />
                  <p>No AST data available</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'analysis' && (
            <div className="p-4 overflow-y-auto h-full">
              <ImpactAnalysis analysis={impactAnalysis} diffs={diffs} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Diff Item Component
const DiffItem: React.FC<{
  diff: ASTDiff;
  isSelected: boolean;
  onClick: () => void;
  showDetails: boolean;
}> = ({ diff, isSelected, onClick, showDetails }) => {
  const getChangeIcon = (type: string) => {
    switch (type) {
      case 'added': return <Plus size={14} className="text-green-600" />;
      case 'removed': return <Minus size={14} className="text-red-600" />;
      case 'modified': return <Edit3 size={14} className="text-blue-600" />;
      case 'moved': return <Move size={14} className="text-purple-600" />;
      default: return <Code size={14} className="text-gray-600" />;
    }
  };

  const getChangeColor = (type: string) => {
    switch (type) {
      case 'added': return 'border-l-green-500 bg-green-50';
      case 'removed': return 'border-l-red-500 bg-red-50';
      case 'modified': return 'border-l-blue-500 bg-blue-50';
      case 'moved': return 'border-l-purple-500 bg-purple-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`p-3 border-l-4 rounded cursor-pointer transition-all ${
        getChangeColor(diff.type)
      } ${isSelected ? 'ring-2 ring-blue-300' : 'hover:shadow-md'}`}
    >
      <div className="flex items-center gap-2 mb-1">
        {getChangeIcon(diff.type)}
        <span className="font-medium capitalize text-sm">{diff.type}</span>
        <span className="text-xs text-gray-500">
          {diff.path.join(' → ') || 'Root'}
        </span>
      </div>
      
      <div className="text-sm text-gray-700">
        {diff.newNode?.name || diff.oldNode?.name || 'Unnamed node'}
      </div>
      
      <div className="text-xs text-gray-500 mt-1">
        {diff.affects.length} area{diff.affects.length !== 1 ? 's' : ''} affected
      </div>

      {showDetails && (
        <div className="mt-2 text-xs font-mono bg-white bg-opacity-50 p-2 rounded">
          <div>Path: {diff.path.join('.')}</div>
          {diff.newNode && <div>Hash: {diff.newNode.hash.slice(0, 8)}...</div>}
        </div>
      )}
    </div>
  );
};

// Diff Details Component
const DiffDetails: React.FC<{
  diff: ASTDiff;
  showTechnical: boolean;
}> = ({ diff, showTechnical }) => {
  return (
    <div className="p-4">
      <div className="mb-4">
        <h3 className="font-semibold text-lg mb-2">Change Details</h3>
        <div className="bg-gray-100 rounded p-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><strong>Type:</strong> {diff.type}</div>
            <div><strong>Path:</strong> {diff.path.join(' → ') || 'Root'}</div>
            <div><strong>Affected Areas:</strong> {diff.affects.length}</div>
          </div>
        </div>
      </div>

      {/* Affected Areas */}
      <div className="mb-4">
        <h4 className="font-medium mb-2">Affected Areas</h4>
        <div className="space-y-2">
          {diff.affects.map((area, index) => (
            <AffectedAreaItem key={index} area={area} />
          ))}
        </div>
      </div>

      {/* Technical Details */}
      {showTechnical && (
        <div className="mb-4">
          <h4 className="font-medium mb-2">Technical Details</h4>
          <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-xs overflow-auto max-h-40">
            <pre>{JSON.stringify(diff, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

// Affected Area Item
const AffectedAreaItem: React.FC<{ area: AffectedArea }> = ({ area }) => {
  const getAreaIcon = (type: string) => {
    switch (type) {
      case 'form': return <FileText size={14} />;
      case 'control': return <Settings size={14} />;
      case 'procedure': return <Code size={14} />;
      case 'variable': return <Hash size={14} />;
      case 'property': return <Edit3 size={14} />;
      default: return <AlertTriangle size={14} />;
    }
  };

  return (
    <div className="flex items-center gap-3 p-2 bg-gray-50 rounded">
      <div className="text-gray-600">
        {getAreaIcon(area.type)}
      </div>
      <div className="flex-1">
        <div className="font-medium text-sm">{area.name}</div>
        <div className="text-xs text-gray-500">{area.type} in {area.scope}</div>
      </div>
      <div className="flex gap-1">
        {area.requiresRecompile && (
          <span className="px-1 py-0.5 bg-red-100 text-red-700 text-xs rounded">Recompile</span>
        )}
        {area.requiresRerender && (
          <span className="px-1 py-0.5 bg-orange-100 text-orange-700 text-xs rounded">Rerender</span>
        )}
        {area.requiresStatePreservation && (
          <span className="px-1 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">Preserve</span>
        )}
      </div>
    </div>
  );
};

// Tree View Component
const TreeView: React.FC<{
  node: TreeViewNode;
  expandedNodes: Set<string>;
  onToggleExpand: (nodeId: string) => void;
  onNodeSelect?: (node: ASTNode) => void;
}> = ({ node, expandedNodes, onToggleExpand, onNodeSelect }) => {
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedNodes.has(node.id);

  return (
    <div>
      <div
        className={`flex items-center gap-2 py-1 px-2 rounded cursor-pointer hover:bg-gray-100 ${
          node.highlighted ? 'bg-yellow-100 border border-yellow-300' : ''
        }`}
        style={{ marginLeft: node.depth * 20 }}
        onClick={() => hasChildren && onToggleExpand(node.id)}
      >
        {hasChildren ? (
          isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
        ) : (
          <div className="w-[14px]" />
        )}
        
        <Code size={14} className="text-gray-600" />
        
        <span className="font-medium text-sm">{node.type}</span>
        
        {node.name && (
          <span className="text-gray-600 text-sm">({node.name})</span>
        )}
        
        {node.diff && (
          <span className={`px-1 py-0.5 text-xs rounded ${
            node.diff.type === 'added' ? 'bg-green-100 text-green-700' :
            node.diff.type === 'removed' ? 'bg-red-100 text-red-700' :
            node.diff.type === 'modified' ? 'bg-blue-100 text-blue-700' :
            'bg-purple-100 text-purple-700'
          }`}>
            {node.diff.type}
          </span>
        )}
      </div>
      
      {hasChildren && isExpanded && (
        <div>
          {node.children.map(child => (
            <TreeView
              key={child.id}
              node={child}
              expandedNodes={expandedNodes}
              onToggleExpand={onToggleExpand}
              onNodeSelect={onNodeSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Impact Analysis Component
const ImpactAnalysis: React.FC<{
  analysis: any;
  diffs: ASTDiff[];
}> = ({ analysis, diffs }) => {
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Risk Assessment */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Zap size={16} />
          Risk Assessment
        </h3>
        
        <div className={`p-3 border rounded ${getRiskColor(analysis.riskLevel)}`}>
          <div className="flex items-center gap-2 mb-2">
            {analysis.riskLevel === 'high' && <AlertTriangle size={16} />}
            {analysis.riskLevel === 'medium' && <Clock size={16} />}
            {analysis.riskLevel === 'low' && <CheckCircle size={16} />}
            <span className="font-medium capitalize">{analysis.riskLevel} Risk</span>
          </div>
          <p className="text-sm">
            {analysis.riskLevel === 'high' && 'Significant changes detected. Manual testing recommended.'}
            {analysis.riskLevel === 'medium' && 'Moderate changes. Automated testing should be sufficient.'}
            {analysis.riskLevel === 'low' && 'Minor changes. Hot-reload should work seamlessly.'}
          </p>
        </div>
      </div>

      {/* Requirements */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-semibold mb-3">Requirements</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className={`p-3 rounded text-center ${
            analysis.recompileRequired ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-500'
          }`}>
            <div className="font-medium">Recompilation</div>
            <div className="text-sm">{analysis.recompileRequired ? 'Required' : 'Not needed'}</div>
          </div>
          <div className={`p-3 rounded text-center ${
            analysis.rerenderRequired ? 'bg-orange-50 text-orange-700' : 'bg-gray-50 text-gray-500'
          }`}>
            <div className="font-medium">Re-render</div>
            <div className="text-sm">{analysis.rerenderRequired ? 'Required' : 'Not needed'}</div>
          </div>
          <div className={`p-3 rounded text-center ${
            analysis.statePreservationRequired ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-500'
          }`}>
            <div className="font-medium">State Preservation</div>
            <div className="text-sm">{analysis.statePreservationRequired ? 'Required' : 'Not needed'}</div>
          </div>
        </div>
      </div>

      {/* Affected Areas Summary */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-semibold mb-3">Affected Areas</h3>
        {analysis.affectedAreas.size > 0 ? (
          <div className="space-y-2">
            {Array.from(analysis.affectedAreas.entries()).map(([area, count]) => (
              <div key={area} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-sm">{area.replace(':', ' in ')}</span>
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">{count}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No specific areas affected</p>
        )}
      </div>
    </div>
  );
};

// Helper function to convert AST to tree view
function convertASTToTreeView(
  node: ASTNode,
  diffs: ASTDiff[],
  depth: number
): TreeViewNode {
  const nodeDiff = diffs.find(diff => 
    diff.newNode?.id === node.id || diff.oldNode?.id === node.id
  );

  return {
    id: node.id,
    type: node.type,
    name: node.name,
    children: node.children.map(child => convertASTToTreeView(child, diffs, depth + 1)),
    expanded: depth < 2, // Auto-expand first 2 levels
    diff: nodeDiff,
    highlighted: !!nodeDiff,
    depth
  };
}

export default ASTDiffVisualizer;