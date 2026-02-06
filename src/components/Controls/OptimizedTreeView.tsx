import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, File } from 'lucide-react';
import { VB6Control } from '../../types/vb6';

interface TreeNode {
  key: string;
  text: string;
  children?: TreeNode[];
  expanded?: boolean;
  selected?: boolean;
  checked?: boolean;
  icon?: number;
  level?: number;
  parent?: string;
  isLoading?: boolean;
}

interface OptimizedTreeViewProps {
  control: VB6Control;
  isSelected: boolean;
  isRunning: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<VB6Control>) => void;
}

interface FlatNode extends TreeNode {
  level: number;
  hasChildren: boolean;
  visible: boolean;
}

const OptimizedTreeView: React.FC<OptimizedTreeViewProps> = ({
  control,
  isSelected,
  isRunning,
  onSelect,
  onUpdate,
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [checkedNodes, setCheckedNodes] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const loadingNodes = useRef<Set<string>>(new Set());

  // Parse tree data from control properties
  const treeData = useMemo<TreeNode[]>(() => {
    return control.properties.Nodes || [];
  }, [control.properties.Nodes]);

  // Flatten tree for virtual scrolling
  const flattenedNodes = useMemo<FlatNode[]>(() => {
    const flat: FlatNode[] = [];

    const flatten = (nodes: TreeNode[], level: number = 0, parentExpanded: boolean = true) => {
      nodes.forEach(node => {
        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = expandedNodes.has(node.key);

        flat.push({
          ...node,
          level,
          hasChildren,
          visible: parentExpanded,
        });

        if (hasChildren && isExpanded) {
          flatten(node.children!, level + 1, parentExpanded);
        }
      });
    };

    flatten(treeData);
    return flat;
  }, [treeData, expandedNodes]);

  // Get visible nodes for virtual scrolling
  const visibleNodes = useMemo(() => {
    return flattenedNodes.filter(node => node.visible);
  }, [flattenedNodes]);

  // Calculate visible range
  const itemHeight = 24;
  const overscan = 5;

  const visibleRange = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const end = Math.min(
      visibleNodes.length,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    return { start, end };
  }, [scrollTop, containerHeight, visibleNodes.length]);

  // Get nodes to render
  const nodesToRender = useMemo(() => {
    return visibleNodes.slice(visibleRange.start, visibleRange.end);
  }, [visibleNodes, visibleRange]);

  // Handle node expansion with lazy loading
  const handleNodeExpand = useCallback(
    async (nodeKey: string, node: FlatNode) => {
      const newExpanded = new Set(expandedNodes);

      if (newExpanded.has(nodeKey)) {
        newExpanded.delete(nodeKey);
        setExpandedNodes(newExpanded);
      } else {
        // Check if we need to lazy load children
        if (control.properties.LazyLoad && !node.children && !loadingNodes.current.has(nodeKey)) {
          loadingNodes.current.add(nodeKey);

          // Update node to show loading state
          const updatedNodes = [...treeData];
          const updateNode = (nodes: TreeNode[]): boolean => {
            for (let i = 0; i < nodes.length; i++) {
              if (nodes[i].key === nodeKey) {
                nodes[i].isLoading = true;
                return true;
              }
              if (nodes[i].children && updateNode(nodes[i].children!)) {
                return true;
              }
            }
            return false;
          };

          updateNode(updatedNodes);
          onUpdate({ Nodes: updatedNodes });

          // Simulate async loading
          setTimeout(() => {
            // Generate mock children
            const children: TreeNode[] = [];
            for (let i = 0; i < 5; i++) {
              children.push({
                key: `${nodeKey}-child-${i}`,
                text: `Child ${i + 1}`,
                parent: nodeKey,
              });
            }

            // Update tree with loaded children
            const finalNodes = [...treeData];
            const addChildren = (nodes: TreeNode[]): boolean => {
              for (let i = 0; i < nodes.length; i++) {
                if (nodes[i].key === nodeKey) {
                  nodes[i].children = children;
                  nodes[i].isLoading = false;
                  return true;
                }
                if (nodes[i].children && addChildren(nodes[i].children!)) {
                  return true;
                }
              }
              return false;
            };

            addChildren(finalNodes);
            onUpdate({ Nodes: finalNodes });
            loadingNodes.current.delete(nodeKey);

            // Expand after loading
            newExpanded.add(nodeKey);
            setExpandedNodes(newExpanded);
          }, 500);
        } else {
          newExpanded.add(nodeKey);
          setExpandedNodes(newExpanded);
        }
      }

      // Fire Expand/Collapse event
      if (control.events?.Expand && !expandedNodes.has(nodeKey)) {
        try {
          const fn = new Function('Node', control.events.Expand);
          fn(node);
        } catch (error) {
          console.error('Error in Expand event:', error);
        }
      } else if (control.events?.Collapse && expandedNodes.has(nodeKey)) {
        try {
          const fn = new Function('Node', control.events.Collapse);
          fn(node);
        } catch (error) {
          console.error('Error in Collapse event:', error);
        }
      }
    },
    [expandedNodes, control.properties.LazyLoad, control.events, treeData, onUpdate]
  );

  // Handle node selection
  const handleNodeSelect = useCallback(
    (nodeKey: string, node: FlatNode) => {
      if (!isRunning) {
        onSelect();
        return;
      }

      setSelectedNode(nodeKey);

      // Fire NodeClick event
      if (control.events?.NodeClick) {
        try {
          const fn = new Function('Node', control.events.NodeClick);
          fn(node);
        } catch (error) {
          console.error('Error in NodeClick event:', error);
        }
      }
    },
    [isRunning, control.events?.NodeClick, onSelect]
  );

  // Handle checkbox change
  const handleCheckChange = useCallback(
    (nodeKey: string, checked: boolean) => {
      const newChecked = new Set(checkedNodes);

      if (checked) {
        newChecked.add(nodeKey);
      } else {
        newChecked.delete(nodeKey);
      }

      setCheckedNodes(newChecked);

      // Update node checked state
      const updatedNodes = [...treeData];
      const updateNodeCheck = (nodes: TreeNode[]): boolean => {
        for (let i = 0; i < nodes.length; i++) {
          if (nodes[i].key === nodeKey) {
            nodes[i].checked = checked;
            return true;
          }
          if (nodes[i].children && updateNodeCheck(nodes[i].children!)) {
            return true;
          }
        }
        return false;
      };

      updateNodeCheck(updatedNodes);
      onUpdate({ Nodes: updatedNodes });
    },
    [checkedNodes, treeData, onUpdate]
  );

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Update container height
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // Render node icon
  const renderNodeIcon = (node: FlatNode) => {
    if (node.isLoading) {
      return (
        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
      );
    }

    if (node.hasChildren) {
      return expandedNodes.has(node.key) ? (
        <FolderOpen size={16} className="text-yellow-600" />
      ) : (
        <Folder size={16} className="text-yellow-600" />
      );
    }

    return <File size={16} className="text-gray-500" />;
  };

  const width = control.properties.Width || 250;
  const height = control.properties.Height || 300;

  return (
    <div
      className={`absolute bg-white border border-gray-300 ${
        isSelected && !isRunning ? 'ring-2 ring-blue-500' : ''
      }`}
      style={{
        left: control.properties.Left,
        top: control.properties.Top,
        width,
        height,
      }}
    >
      <div ref={containerRef} className="h-full overflow-auto" onScroll={handleScroll}>
        {/* Virtual spacer */}
        <div style={{ height: visibleNodes.length * itemHeight }}>
          {/* Rendered nodes */}
          <div
            style={{
              transform: `translateY(${visibleRange.start * itemHeight}px)`,
            }}
          >
            {nodesToRender.map((node, index) => {
              const actualIndex = visibleRange.start + index;
              const isSelected = selectedNode === node.key;
              const isChecked = checkedNodes.has(node.key);

              return (
                <div
                  key={node.key}
                  className={`flex items-center px-1 hover:bg-gray-100 cursor-pointer ${
                    isSelected ? 'bg-blue-100' : ''
                  }`}
                  style={{
                    height: itemHeight,
                    paddingLeft: `${node.level * 20 + 4}px`,
                  }}
                  onClick={() => handleNodeSelect(node.key, node)}
                >
                  {/* Expand/Collapse button */}
                  {node.hasChildren ? (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleNodeExpand(node.key, node);
                      }}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      {expandedNodes.has(node.key) ? (
                        <ChevronDown size={14} />
                      ) : (
                        <ChevronRight size={14} />
                      )}
                    </button>
                  ) : (
                    <div className="w-6" />
                  )}

                  {/* Checkbox */}
                  {control.properties.Checkboxes && (
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={e => handleCheckChange(node.key, e.target.checked)}
                      onClick={e => e.stopPropagation()}
                      className="mr-2"
                    />
                  )}

                  {/* Icon */}
                  <div className="mr-2">{renderNodeIcon(node)}</div>

                  {/* Text */}
                  <span className="text-sm truncate flex-1">{node.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Performance indicator */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-0 right-0 text-xs bg-black bg-opacity-50 text-white p-1">
          Visible: {nodesToRender.length}/{visibleNodes.length}
        </div>
      )}
    </div>
  );
};

export default OptimizedTreeView;
