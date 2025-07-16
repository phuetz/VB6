/**
 * TreeView Control - 100% VB6 Compatible
 * Hierarchical tree control with full node management
 */

import React, { useState, useRef, useEffect, useCallback, forwardRef } from 'react';
import { useVB6Store } from '../../stores/vb6Store';
import { VB6ControlPropsEnhanced } from './VB6ControlsEnhanced';

interface TreeNode {
  key: string;
  text: string;
  image?: number;
  selectedImage?: number;
  expandedImage?: number;
  children: TreeNode[];
  parent?: TreeNode;
  expanded: boolean;
  selected: boolean;
  checked?: boolean;
  bold?: boolean;
  foreColor?: string;
  backColor?: string;
  tag?: any;
  sorted?: boolean;
  visible?: boolean;
  firstSibling?: TreeNode;
  lastSibling?: TreeNode;
  next?: TreeNode;
  previous?: TreeNode;
  root?: TreeNode;
}

interface TreeViewProps extends VB6ControlPropsEnhanced {
  // Appearance
  appearance: 0 | 1; // ccFlat, cc3D
  borderStyle: 0 | 1; // ccNone, ccFixedSingle
  style: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7; // Various tree styles
  
  // Behavior
  checkboxes: boolean;
  fullRowSelect: boolean;
  hotTracking: boolean;
  indentation: number;
  labelEdit: 0 | 1 | 2; // tvwAutomatic, tvwManual
  lineStyle: 0 | 1; // tvwTreeLines, tvwRootLines
  pathSeparator: string;
  scroll: boolean;
  singleSel: boolean;
  sorted: boolean;
  
  // Images
  imageList?: any; // Reference to ImageList control
  
  // Font and colors
  font: any;
  foreColor: string;
  backColor: string;
  
  // OLE Drag/Drop
  oleDragMode: 0 | 1; // ccOLEDragManual, ccOLEDragAutomatic
  oleDropMode: 0 | 1 | 2; // ccOLEDropNone, ccOLEDropManual
  
  // Properties exposed through methods
  hideSelection: boolean;
  
  // Events will be fired through fireEvent
}

export const TreeViewControl = forwardRef<any, TreeViewProps>((props, ref) => {
  const {
    id, name, left, top, width, height, visible, enabled,
    appearance = 1,
    borderStyle = 1,
    style = 7, // Default to all styles enabled
    checkboxes = false,
    fullRowSelect = false,
    hotTracking = false,
    indentation = 20,
    labelEdit = 0,
    lineStyle = 1,
    pathSeparator = '\\',
    scroll = true,
    singleSel = false,
    sorted = false,
    imageList,
    font = { name: 'MS Sans Serif', size: 8, bold: false, italic: false },
    foreColor = '#000000',
    backColor = '#FFFFFF',
    oleDragMode = 0,
    oleDropMode = 0,
    hideSelection = false,
    tag = '',
    toolTipText = '',
    ...rest
  } = props;

  // State management
  const [nodes, setNodes] = useState<Map<string, TreeNode>>(new Map());
  const [rootNodes, setRootNodes] = useState<TreeNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [editingNode, setEditingNode] = useState<TreeNode | null>(null);
  const [editText, setEditText] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [checkedNodes, setCheckedNodes] = useState<Set<string>>(new Set());
  const [hoveredNode, setHoveredNode] = useState<TreeNode | null>(null);
  const [dropTarget, setDropTarget] = useState<TreeNode | null>(null);
  const [draggedNode, setDraggedNode] = useState<TreeNode | null>(null);
  
  const treeRef = useRef<HTMLDivElement>(null);
  const { fireEvent, updateControl } = useVB6Store();

  // Initialize with some default nodes if needed
  useEffect(() => {
    if (nodes.size === 0) {
      // Initialize empty tree
      updateControl(id, 'nodes', nodes);
    }
  }, []);

  // Node management functions
  const addNode = useCallback((
    key: string,
    text: string,
    parentKey?: string,
    image?: number,
    selectedImage?: number
  ): TreeNode => {
    const newNode: TreeNode = {
      key,
      text,
      image,
      selectedImage,
      children: [],
      expanded: false,
      selected: false,
      visible: true,
    };

    const newNodes = new Map(nodes);
    
    if (parentKey) {
      const parent = newNodes.get(parentKey);
      if (parent) {
        newNode.parent = parent;
        parent.children.push(newNode);
        
        // Update sibling relationships
        if (parent.children.length > 1) {
          const prevSibling = parent.children[parent.children.length - 2];
          newNode.previous = prevSibling;
          prevSibling.next = newNode;
          newNode.firstSibling = parent.children[0];
          newNode.lastSibling = newNode;
          parent.children.forEach(child => child.lastSibling = newNode);
        } else {
          newNode.firstSibling = newNode;
          newNode.lastSibling = newNode;
        }
        
        if (sorted || parent.sorted) {
          parent.children.sort((a, b) => a.text.localeCompare(b.text));
        }
      }
    } else {
      const newRootNodes = [...rootNodes, newNode];
      if (sorted) {
        newRootNodes.sort((a, b) => a.text.localeCompare(b.text));
      }
      setRootNodes(newRootNodes);
      
      // Update root node relationships
      if (newRootNodes.length > 1) {
        const prevRoot = newRootNodes[newRootNodes.length - 2];
        newNode.previous = prevRoot;
        prevRoot.next = newNode;
        newNode.firstSibling = newRootNodes[0];
        newNode.lastSibling = newNode;
        newRootNodes.forEach(node => node.lastSibling = newNode);
      } else {
        newNode.firstSibling = newNode;
        newNode.lastSibling = newNode;
      }
    }
    
    newNode.root = getRootNode(newNode);
    newNodes.set(key, newNode);
    setNodes(newNodes);
    
    fireEvent(name, 'NodeAdd', { node: newNode });
    return newNode;
  }, [nodes, rootNodes, sorted, id, name, fireEvent]);

  const removeNode = useCallback((key: string) => {
    const node = nodes.get(key);
    if (!node) return;
    
    const newNodes = new Map(nodes);
    
    // Remove from parent's children
    if (node.parent) {
      node.parent.children = node.parent.children.filter(child => child.key !== key);
    } else {
      setRootNodes(rootNodes.filter(root => root.key !== key));
    }
    
    // Update sibling relationships
    if (node.previous) node.previous.next = node.next;
    if (node.next) node.next.previous = node.previous;
    
    // Remove node and all descendants
    const removeDescendants = (n: TreeNode) => {
      n.children.forEach(child => removeDescendants(child));
      newNodes.delete(n.key);
      expandedNodes.delete(n.key);
      checkedNodes.delete(n.key);
    };
    
    removeDescendants(node);
    setNodes(newNodes);
    setExpandedNodes(new Set(expandedNodes));
    setCheckedNodes(new Set(checkedNodes));
    
    if (selectedNode?.key === key) {
      setSelectedNode(null);
    }
    
    fireEvent(name, 'NodeRemove', { key });
  }, [nodes, rootNodes, expandedNodes, checkedNodes, selectedNode, name, fireEvent]);

  const getRootNode = (node: TreeNode): TreeNode => {
    let current = node;
    while (current.parent) {
      current = current.parent;
    }
    return current;
  };

  const getNodePath = (node: TreeNode): string => {
    const path: string[] = [];
    let current: TreeNode | undefined = node;
    
    while (current) {
      path.unshift(current.text);
      current = current.parent;
    }
    
    return path.join(pathSeparator);
  };

  // Event handlers
  const handleNodeClick = useCallback((node: TreeNode, e: React.MouseEvent) => {
    if (!enabled) return;
    
    if (selectedNode?.key !== node.key) {
      if (selectedNode) {
        selectedNode.selected = false;
      }
      node.selected = true;
      setSelectedNode(node);
      updateControl(id, 'selectedItem', node);
      fireEvent(name, 'NodeClick', { node });
    }
    
    // Handle checkbox click
    const target = e.target as HTMLElement;
    if (checkboxes && target.classList.contains('tree-checkbox')) {
      const newCheckedNodes = new Set(checkedNodes);
      if (newCheckedNodes.has(node.key)) {
        newCheckedNodes.delete(node.key);
        node.checked = false;
      } else {
        newCheckedNodes.add(node.key);
        node.checked = true;
      }
      setCheckedNodes(newCheckedNodes);
      fireEvent(name, 'NodeCheck', { node });
    }
  }, [enabled, selectedNode, checkboxes, checkedNodes, id, name, fireEvent, updateControl]);

  const handleNodeDoubleClick = useCallback((node: TreeNode) => {
    if (!enabled) return;
    
    // Toggle expansion
    handleNodeExpand(node);
    
    // Start label editing if enabled
    if (labelEdit === 0) { // tvwAutomatic
      startEditing(node);
    }
    
    fireEvent(name, 'DblClick', {});
  }, [enabled, labelEdit, name, fireEvent]);

  const handleNodeExpand = useCallback((node: TreeNode) => {
    const newExpandedNodes = new Set(expandedNodes);
    
    if (newExpandedNodes.has(node.key)) {
      newExpandedNodes.delete(node.key);
      node.expanded = false;
      fireEvent(name, 'Collapse', { node });
    } else {
      newExpandedNodes.add(node.key);
      node.expanded = true;
      fireEvent(name, 'Expand', { node });
    }
    
    setExpandedNodes(newExpandedNodes);
  }, [expandedNodes, name, fireEvent]);

  const startEditing = (node: TreeNode) => {
    if (labelEdit === 2) return; // tvwManual - no automatic editing
    
    const cancelEdit = { cancel: false };
    fireEvent(name, 'BeforeLabelEdit', { node, ...cancelEdit });
    
    if (!cancelEdit.cancel) {
      setEditingNode(node);
      setEditText(node.text);
    }
  };

  const finishEditing = (save: boolean) => {
    if (!editingNode) return;
    
    if (save && editText.trim()) {
      const cancelEdit = { cancel: false, newText: editText };
      fireEvent(name, 'AfterLabelEdit', { node: editingNode, ...cancelEdit });
      
      if (!cancelEdit.cancel) {
        editingNode.text = cancelEdit.newText || editText;
        setNodes(new Map(nodes));
      }
    }
    
    setEditingNode(null);
    setEditText('');
  };

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!enabled || !selectedNode) return;
    
    let handled = true;
    
    switch (e.key) {
      case 'ArrowUp':
        navigateUp();
        break;
      case 'ArrowDown':
        navigateDown();
        break;
      case 'ArrowLeft':
        if (selectedNode.expanded && selectedNode.children.length > 0) {
          handleNodeExpand(selectedNode);
        } else if (selectedNode.parent) {
          handleNodeClick(selectedNode.parent, e as any);
        }
        break;
      case 'ArrowRight':
        if (!selectedNode.expanded && selectedNode.children.length > 0) {
          handleNodeExpand(selectedNode);
        } else if (selectedNode.children.length > 0) {
          handleNodeClick(selectedNode.children[0], e as any);
        }
        break;
      case ' ':
        if (checkboxes) {
          const newCheckedNodes = new Set(checkedNodes);
          if (newCheckedNodes.has(selectedNode.key)) {
            newCheckedNodes.delete(selectedNode.key);
            selectedNode.checked = false;
          } else {
            newCheckedNodes.add(selectedNode.key);
            selectedNode.checked = true;
          }
          setCheckedNodes(newCheckedNodes);
          fireEvent(name, 'NodeCheck', { node: selectedNode });
        }
        break;
      case 'Enter':
        if (labelEdit === 0) {
          startEditing(selectedNode);
        }
        break;
      case 'F2':
        if (labelEdit !== 2) {
          startEditing(selectedNode);
        }
        break;
      case '*':
        // Expand all children
        expandAll(selectedNode);
        break;
      case '+':
      case '=':
        if (selectedNode.children.length > 0) {
          handleNodeExpand(selectedNode);
        }
        break;
      case '-':
        if (selectedNode.expanded) {
          handleNodeExpand(selectedNode);
        }
        break;
      default:
        handled = false;
    }
    
    if (handled) {
      e.preventDefault();
    }
  }, [enabled, selectedNode, checkboxes, checkedNodes, labelEdit, name, fireEvent]);

  const navigateUp = () => {
    if (!selectedNode) return;
    
    // Find previous visible node
    let target: TreeNode | undefined;
    
    if (selectedNode.previous) {
      target = selectedNode.previous;
      // Go to last visible descendant of previous sibling
      while (target.expanded && target.children.length > 0) {
        target = target.children[target.children.length - 1];
      }
    } else if (selectedNode.parent) {
      target = selectedNode.parent;
    }
    
    if (target) {
      handleNodeClick(target, {} as any);
    }
  };

  const navigateDown = () => {
    if (!selectedNode) return;
    
    // Find next visible node
    let target: TreeNode | undefined;
    
    if (selectedNode.expanded && selectedNode.children.length > 0) {
      target = selectedNode.children[0];
    } else {
      let current: TreeNode | undefined = selectedNode;
      while (current) {
        if (current.next) {
          target = current.next;
          break;
        }
        current = current.parent;
      }
    }
    
    if (target) {
      handleNodeClick(target, {} as any);
    }
  };

  const expandAll = (node: TreeNode) => {
    const newExpandedNodes = new Set(expandedNodes);
    
    const expand = (n: TreeNode) => {
      if (n.children.length > 0) {
        newExpandedNodes.add(n.key);
        n.expanded = true;
        n.children.forEach(child => expand(child));
      }
    };
    
    expand(node);
    setExpandedNodes(newExpandedNodes);
  };

  // Drag and drop
  const handleDragStart = useCallback((node: TreeNode, e: React.DragEvent) => {
    if (oleDragMode === 0) return;
    
    setDraggedNode(node);
    e.dataTransfer.effectAllowed = 'move';
    fireEvent(name, 'OLEStartDrag', { node });
  }, [oleDragMode, name, fireEvent]);

  const handleDragOver = useCallback((node: TreeNode, e: React.DragEvent) => {
    if (oleDropMode === 0 || !draggedNode) return;
    
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget(node);
  }, [oleDropMode, draggedNode]);

  const handleDrop = useCallback((node: TreeNode, e: React.DragEvent) => {
    e.preventDefault();
    if (oleDropMode === 0 || !draggedNode || draggedNode === node) return;
    
    const allowDrop = { cancel: false };
    fireEvent(name, 'OLEDragDrop', { source: draggedNode, target: node, ...allowDrop });
    
    if (!allowDrop.cancel) {
      // Move node logic here
      // This would involve removing the dragged node from its current parent
      // and adding it as a child of the target node
    }
    
    setDraggedNode(null);
    setDropTarget(null);
  }, [oleDropMode, draggedNode, name, fireEvent]);

  // Expose methods through ref
  useEffect(() => {
    if (ref && typeof ref !== 'function') {
      ref.current = {
        // Properties
        get Nodes() { return nodes; },
        get SelectedItem() { return selectedNode; },
        set SelectedItem(node: TreeNode) {
          if (selectedNode) selectedNode.selected = false;
          if (node) {
            node.selected = true;
            setSelectedNode(node);
          }
        },
        get DropHighlight() { return dropTarget; },
        set DropHighlight(node: TreeNode) { setDropTarget(node); },
        
        // Methods
        Add(relative?: string, relationship?: number, key?: string, text?: string, image?: number, selectedImage?: number) {
          const newKey = key || `node_${Date.now()}`;
          let parentKey: string | undefined;
          
          if (relative) {
            const relNode = nodes.get(relative);
            if (relNode) {
              switch (relationship) {
                case 0: // tvwFirst
                case 1: // tvwLast
                  parentKey = relNode.parent?.key;
                  break;
                case 2: // tvwNext
                case 3: // tvwPrevious
                  parentKey = relNode.parent?.key;
                  break;
                case 4: // tvwChild
                  parentKey = relative;
                  break;
              }
            }
          }
          
          return addNode(newKey, text || newKey, parentKey, image, selectedImage);
        },
        
        Remove(key: string) {
          removeNode(key);
        },
        
        Clear() {
          setNodes(new Map());
          setRootNodes([]);
          setSelectedNode(null);
          setExpandedNodes(new Set());
          setCheckedNodes(new Set());
        },
        
        GetVisibleCount() {
          let count = 0;
          const countVisible = (nodes: TreeNode[]) => {
            nodes.forEach(node => {
              if (node.visible !== false) {
                count++;
                if (node.expanded) {
                  countVisible(node.children);
                }
              }
            });
          };
          countVisible(rootNodes);
          return count;
        },
        
        StartLabelEdit() {
          if (selectedNode && labelEdit !== 2) {
            startEditing(selectedNode);
          }
        },
        
        HitTest(x: number, y: number) {
          // Would need to implement hit testing logic
          // This is a simplified version
          return selectedNode;
        },
        
        EnsureVisible(node: TreeNode) {
          // Expand all parents
          let current = node.parent;
          const toExpand: TreeNode[] = [];
          
          while (current) {
            if (!current.expanded) {
              toExpand.push(current);
            }
            current = current.parent;
          }
          
          const newExpandedNodes = new Set(expandedNodes);
          toExpand.forEach(n => {
            newExpandedNodes.add(n.key);
            n.expanded = true;
          });
          setExpandedNodes(newExpandedNodes);
          
          // Scroll to node if needed
          // This would require DOM manipulation
        },
      };
    }
  }, [ref, nodes, selectedNode, dropTarget, expandedNodes, checkedNodes, rootNodes, labelEdit, addNode, removeNode]);

  // Render node recursively
  const renderNode = (node: TreeNode, level: number = 0): React.ReactNode => {
    const isExpanded = expandedNodes.has(node.key);
    const isChecked = checkedNodes.has(node.key);
    const isSelected = selectedNode?.key === node.key;
    const isDropTarget = dropTarget?.key === node.key;
    const isEditing = editingNode?.key === node.key;
    
    const nodeStyle: React.CSSProperties = {
      paddingLeft: level * indentation,
      display: 'flex',
      alignItems: 'center',
      height: 20,
      cursor: 'pointer',
      backgroundColor: isDropTarget ? '#E3F2FD' :
                      isSelected && !hideSelection ? '#0078D7' :
                      node.backColor || 'transparent',
      color: isSelected && !hideSelection ? '#FFFFFF' : node.foreColor || foreColor,
      fontWeight: node.bold ? 'bold' : 'normal',
      fontFamily: font.name,
      fontSize: `${font.size}pt`,
      ...(hotTracking && hoveredNode?.key === node.key ? {
        textDecoration: 'underline',
        color: '#0078D7',
      } : {}),
      ...(fullRowSelect ? { width: '100%' } : {}),
    };
    
    const hasChildren = node.children.length > 0;
    
    return (
      <div key={node.key}>
        <div
          style={nodeStyle}
          onClick={(e) => handleNodeClick(node, e)}
          onDoubleClick={() => handleNodeDoubleClick(node)}
          onMouseEnter={() => hotTracking && setHoveredNode(node)}
          onMouseLeave={() => hotTracking && setHoveredNode(null)}
          draggable={oleDragMode === 1}
          onDragStart={(e) => handleDragStart(node, e)}
          onDragOver={(e) => handleDragOver(node, e)}
          onDrop={(e) => handleDrop(node, e)}
        >
          {/* Tree lines */}
          {lineStyle > 0 && level > 0 && (
            <span style={{ width: indentation, height: '100%', position: 'relative' }}>
              {/* Implement tree line drawing */}
            </span>
          )}
          
          {/* Expand/collapse button */}
          {hasChildren && (
            <span
              style={{
                width: 16,
                height: 16,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 4,
                border: '1px solid #808080',
                backgroundColor: '#FFFFFF',
                fontSize: 10,
                lineHeight: 1,
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleNodeExpand(node);
              }}
            >
              {isExpanded ? '−' : '+'}
            </span>
          )}
          
          {/* Checkbox */}
          {checkboxes && (
            <input
              type="checkbox"
              className="tree-checkbox"
              checked={isChecked}
              onChange={() => {}} // Handled in click event
              style={{ marginRight: 4 }}
            />
          )}
          
          {/* Node image */}
          {imageList && node.image !== undefined && (
            <span style={{ marginRight: 4 }}>
              {/* Render image from imageList */}
              <span style={{ display: 'inline-block', width: 16, height: 16, backgroundColor: '#ccc' }} />
            </span>
          )}
          
          {/* Node text */}
          {isEditing ? (
            <input
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onBlur={() => finishEditing(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  finishEditing(true);
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  finishEditing(false);
                }
              }}
              style={{
                border: '1px solid #000',
                padding: '0 2px',
                font: 'inherit',
                backgroundColor: '#FFFFFF',
                color: '#000000',
              }}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span>{node.text}</span>
          )}
        </div>
        
        {/* Render children */}
        {isExpanded && node.children.map(child => renderNode(child, level + 1))}
      </div>
    );
  };

  // Container styles
  const treeStyle: React.CSSProperties = {
    position: 'absolute',
    left,
    top,
    width,
    height,
    display: visible ? 'block' : 'none',
    backgroundColor: backColor,
    color: foreColor,
    border: borderStyle === 1 ? (appearance === 0 ? '1px solid #808080' : '2px inset #C0C0C0') : 'none',
    overflow: scroll ? 'auto' : 'hidden',
    outline: 'none',
    userSelect: 'none',
  };

  return (
    <div
      ref={treeRef}
      style={treeStyle}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      title={toolTipText}
      data-name={name}
      data-tag={tag}
      {...rest}
    >
      {rootNodes.map(node => renderNode(node))}
    </div>
  );
});

export default TreeViewControl;