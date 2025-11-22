// Toolbar pour les outils de layout et distribution
// Interface utilisateur pour aligner et distribuer les contrôles

import React, { useState } from 'react';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  AlignHorizontalDistributeStart,
  AlignHorizontalDistributeCenter,
  AlignHorizontalDistributeEnd,
  AlignVerticalDistributeStart,
  AlignVerticalDistributeCenter,
  AlignVerticalDistributeEnd,
  Grid3X3,
  Maximize2,
  Move,
  Settings,
  ChevronDown
} from 'lucide-react';
import { VB6Control } from '../../types/VB6Types';
import { Control } from '../../context/types';
import { layoutToolsService, AlignmentOptions, DistributionOptions, SpacingOptions } from '../../services/LayoutToolsService';

interface LayoutToolbarProps {
  selectedControls: Control[];
  onControlsUpdate: (controls: Control[]) => void;
  visible?: boolean;
  onToggleVisibility?: () => void;
}

// Helper functions to convert between Control and VB6Control formats
const controlToVB6Control = (control: Control): VB6Control => ({
  Name: control.name,
  Left: control.x,
  Top: control.y,
  Width: control.width,
  Height: control.height,
  Visible: control.visible,
  Enabled: control.enabled,
  Caption: control.caption,
  Text: control.text,
  BackColor: control.backColor,
  ForeColor: control.foreColor,
  TabIndex: control.tabIndex,
  TabStop: control.tabStop,
  Tag: control.tag,
  ToolTipText: control.toolTipText
});

const vb6ControlToControl = (vb6Control: VB6Control, originalControl: Control): Control => ({
  ...originalControl,
  x: vb6Control.Left || originalControl.x,
  y: vb6Control.Top || originalControl.y,
  width: vb6Control.Width || originalControl.width,
  height: vb6Control.Height || originalControl.height,
  visible: vb6Control.Visible !== undefined ? vb6Control.Visible : originalControl.visible,
  enabled: vb6Control.Enabled !== undefined ? vb6Control.Enabled : originalControl.enabled,
  caption: vb6Control.Caption !== undefined ? vb6Control.Caption : originalControl.caption,
  text: vb6Control.Text !== undefined ? vb6Control.Text : originalControl.text,
  backColor: vb6Control.BackColor || originalControl.backColor,
  foreColor: vb6Control.ForeColor || originalControl.foreColor,
  tabIndex: vb6Control.TabIndex || originalControl.tabIndex,
  tabStop: vb6Control.TabStop !== undefined ? vb6Control.TabStop : originalControl.tabStop,
  tag: vb6Control.Tag || originalControl.tag,
  toolTipText: vb6Control.ToolTipText || originalControl.toolTipText
});

export const LayoutToolbar: React.FC<LayoutToolbarProps> = ({
  selectedControls,
  onControlsUpdate,
  visible = true,
  onToggleVisibility
}) => {
  const [showSpacingDialog, setShowSpacingDialog] = useState(false);
  const [showGridDialog, setShowGridDialog] = useState(false);
  const [spacingValues, setSpacingValues] = useState({ horizontal: 8, vertical: 8 });
  const [gridColumns, setGridColumns] = useState(3);

  const hasSelection = selectedControls.length > 0;
  const hasMultipleSelection = selectedControls.length > 1;

  // Fonctions d'alignement
  const handleAlign = (type: AlignmentOptions['type']) => {
    if (!hasMultipleSelection) return;

    const options: AlignmentOptions = {
      direction: ['left', 'center', 'right'].includes(type) ? 'horizontal' : 'vertical',
      type,
      reference: 'selection'
    };

    // Convert to VB6Control format for layout operations
    const vb6Controls = selectedControls.map(controlToVB6Control);
    const updatedVB6Controls = layoutToolsService.alignControls(vb6Controls, options);
    
    // Convert back to Control format
    const updatedControls = updatedVB6Controls.map((vb6Control, index) => 
      vb6ControlToControl(vb6Control, selectedControls[index])
    );
    
    onControlsUpdate(updatedControls);
  };

  // Fonctions de distribution
  const handleDistribute = (direction: 'horizontal' | 'vertical', type: DistributionOptions['type']) => {
    if (selectedControls.length < 3) return;

    const options: DistributionOptions = {
      direction,
      type
    };

    // Convert to VB6Control format for layout operations
    const vb6Controls = selectedControls.map(controlToVB6Control);
    const updatedVB6Controls = layoutToolsService.distributeControls(vb6Controls, options);
    
    // Convert back to Control format
    const updatedControls = updatedVB6Controls.map((vb6Control, index) => 
      vb6ControlToControl(vb6Control, selectedControls[index])
    );
    
    onControlsUpdate(updatedControls);
  };

  // Appliquer un espacement personnalisé
  const applySpacing = () => {
    if (!hasMultipleSelection) return;

    const options: SpacingOptions = {
      horizontal: spacingValues.horizontal,
      vertical: spacingValues.vertical
    };

    // Convert to VB6Control format for layout operations
    const vb6Controls = selectedControls.map(controlToVB6Control);
    const updatedVB6Controls = layoutToolsService.applySpacing(vb6Controls, options);
    
    // Convert back to Control format
    const updatedControls = updatedVB6Controls.map((vb6Control, index) => 
      vb6ControlToControl(vb6Control, selectedControls[index])
    );
    
    onControlsUpdate(updatedControls);
    setShowSpacingDialog(false);
  };

  // Créer une grille
  const createGrid = () => {
    if (!hasSelection) return;

    // Convert to VB6Control format for layout operations
    const vb6Controls = selectedControls.map(controlToVB6Control);
    const suggestions = layoutToolsService.getSuggestedSpacing(vb6Controls);
    const updatedVB6Controls = layoutToolsService.arrangeInGrid(
      vb6Controls,
      gridColumns,
      suggestions.gridSpacing
    );
    
    // Convert back to Control format
    const updatedControls = updatedVB6Controls.map((vb6Control, index) => 
      vb6ControlToControl(vb6Control, selectedControls[index])
    );
    
    onControlsUpdate(updatedControls);
    setShowGridDialog(false);
  };

  // Redimensionner les contrôles
  const handleResize = (width?: 'max' | 'min' | 'average', height?: 'max' | 'min' | 'average') => {
    if (!hasMultipleSelection) return;

    // Convert to VB6Control format for layout operations
    const vb6Controls = selectedControls.map(controlToVB6Control);
    const updatedVB6Controls = layoutToolsService.resizeControls(vb6Controls, {
      width,
      height
    });
    
    // Convert back to Control format
    const updatedControls = updatedVB6Controls.map((vb6Control, index) => 
      vb6ControlToControl(vb6Control, selectedControls[index])
    );
    
    onControlsUpdate(updatedControls);
  };

  if (!visible) {
    return (
      <div className="fixed top-20 right-4 z-[1000]">
        <button
          onClick={onToggleVisibility}
          className="bg-white border border-gray-300 rounded-lg p-2 shadow-lg hover:bg-gray-50"
          title="Show Layout Tools"
        >
          <Grid3X3 size={16} />
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="fixed top-20 right-4 z-[1000] bg-white border border-gray-300 rounded-lg shadow-lg p-2">
        <div className="flex items-center gap-1 mb-2">
          <Grid3X3 size={16} className="text-gray-600" />
          <span className="text-xs font-semibold text-gray-700">Layout Tools</span>
          <button
            onClick={onToggleVisibility}
            className="ml-auto text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        {/* Section Alignement */}
        <div className="mb-3">
          <div className="text-xs text-gray-500 mb-1">Align</div>
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => handleAlign('left')}
              disabled={!hasMultipleSelection}
              className={`p-1.5 rounded border hover:bg-gray-50 ${
                !hasMultipleSelection ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Align Left"
            >
              <AlignLeft size={14} />
            </button>
            <button
              onClick={() => handleAlign('center')}
              disabled={!hasMultipleSelection}
              className={`p-1.5 rounded border hover:bg-gray-50 ${
                !hasMultipleSelection ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Align Center"
            >
              <AlignCenter size={14} />
            </button>
            <button
              onClick={() => handleAlign('right')}
              disabled={!hasMultipleSelection}
              className={`p-1.5 rounded border hover:bg-gray-50 ${
                !hasMultipleSelection ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Align Right"
            >
              <AlignRight size={14} />
            </button>
            <button
              onClick={() => handleAlign('top')}
              disabled={!hasMultipleSelection}
              className={`p-1.5 rounded border hover:bg-gray-50 ${
                !hasMultipleSelection ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Align Top"
            >
              <AlignHorizontalDistributeStart size={14} className="rotate-90" />
            </button>
            <button
              onClick={() => handleAlign('middle')}
              disabled={!hasMultipleSelection}
              className={`p-1.5 rounded border hover:bg-gray-50 ${
                !hasMultipleSelection ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Align Middle"
            >
              <AlignHorizontalDistributeCenter size={14} className="rotate-90" />
            </button>
            <button
              onClick={() => handleAlign('bottom')}
              disabled={!hasMultipleSelection}
              className={`p-1.5 rounded border hover:bg-gray-50 ${
                !hasMultipleSelection ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Align Bottom"
            >
              <AlignHorizontalDistributeEnd size={14} className="rotate-90" />
            </button>
          </div>
        </div>

        {/* Section Distribution */}
        <div className="mb-3">
          <div className="text-xs text-gray-500 mb-1">Distribute</div>
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => handleDistribute('horizontal', 'edges')}
              disabled={selectedControls.length < 3}
              className={`p-1.5 rounded border hover:bg-gray-50 ${
                selectedControls.length < 3 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Distribute Horizontally by Edges"
            >
              <AlignHorizontalDistributeStart size={14} />
            </button>
            <button
              onClick={() => handleDistribute('horizontal', 'centers')}
              disabled={selectedControls.length < 3}
              className={`p-1.5 rounded border hover:bg-gray-50 ${
                selectedControls.length < 3 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Distribute Horizontally by Centers"
            >
              <AlignHorizontalDistributeCenter size={14} />
            </button>
            <button
              onClick={() => handleDistribute('horizontal', 'space')}
              disabled={selectedControls.length < 3}
              className={`p-1.5 rounded border hover:bg-gray-50 ${
                selectedControls.length < 3 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Distribute Horizontally by Space"
            >
              <AlignHorizontalDistributeEnd size={14} />
            </button>
            <button
              onClick={() => handleDistribute('vertical', 'edges')}
              disabled={selectedControls.length < 3}
              className={`p-1.5 rounded border hover:bg-gray-50 ${
                selectedControls.length < 3 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Distribute Vertically by Edges"
            >
              <AlignVerticalDistributeStart size={14} />
            </button>
            <button
              onClick={() => handleDistribute('vertical', 'centers')}
              disabled={selectedControls.length < 3}
              className={`p-1.5 rounded border hover:bg-gray-50 ${
                selectedControls.length < 3 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Distribute Vertically by Centers"
            >
              <AlignVerticalDistributeCenter size={14} />
            </button>
            <button
              onClick={() => handleDistribute('vertical', 'space')}
              disabled={selectedControls.length < 3}
              className={`p-1.5 rounded border hover:bg-gray-50 ${
                selectedControls.length < 3 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Distribute Vertically by Space"
            >
              <AlignVerticalDistributeEnd size={14} />
            </button>
          </div>
        </div>

        {/* Section Size */}
        <div className="mb-3">
          <div className="text-xs text-gray-500 mb-1">Size</div>
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => handleResize('max', undefined)}
              disabled={!hasMultipleSelection}
              className={`p-1.5 rounded border hover:bg-gray-50 text-xs ${
                !hasMultipleSelection ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Same Width (Max)"
            >
              W↔
            </button>
            <button
              onClick={() => handleResize(undefined, 'max')}
              disabled={!hasMultipleSelection}
              className={`p-1.5 rounded border hover:bg-gray-50 text-xs ${
                !hasMultipleSelection ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Same Height (Max)"
            >
              H↕
            </button>
          </div>
        </div>

        {/* Section Tools */}
        <div className="mb-2">
          <div className="text-xs text-gray-500 mb-1">Tools</div>
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => setShowSpacingDialog(true)}
              disabled={!hasMultipleSelection}
              className={`p-1.5 rounded border hover:bg-gray-50 ${
                !hasMultipleSelection ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Custom Spacing"
            >
              <Move size={14} />
            </button>
            <button
              onClick={() => setShowGridDialog(true)}
              disabled={!hasSelection}
              className={`p-1.5 rounded border hover:bg-gray-50 ${
                !hasSelection ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Arrange in Grid"
            >
              <Grid3X3 size={14} />
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="text-xs text-gray-400 text-center">
          {selectedControls.length === 0 && 'Select controls to use tools'}
          {selectedControls.length === 1 && '1 control selected'}
          {selectedControls.length > 1 && `${selectedControls.length} controls selected`}
        </div>
      </div>

      {/* Dialog Espacement */}
      {showSpacingDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10001]">
          <div className="bg-white rounded-lg shadow-xl p-4 w-80">
            <h3 className="font-semibold mb-3">Custom Spacing</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Horizontal Spacing</label>
                <input
                  type="number"
                  value={spacingValues.horizontal}
                  onChange={(e) => setSpacingValues(prev => ({
                    ...prev,
                    horizontal: parseInt(e.target.value) || 0
                  }))}
                  className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Vertical Spacing</label>
                <input
                  type="number"
                  value={spacingValues.vertical}
                  onChange={(e) => setSpacingValues(prev => ({
                    ...prev,
                    vertical: parseInt(e.target.value) || 0
                  }))}
                  className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                  min="0"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={applySpacing}
                className="flex-1 bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600"
              >
                Apply
              </button>
              <button
                onClick={() => setShowSpacingDialog(false)}
                className="flex-1 bg-gray-300 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog Grille */}
      {showGridDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10001]">
          <div className="bg-white rounded-lg shadow-xl p-4 w-80">
            <h3 className="font-semibold mb-3">Arrange in Grid</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Number of Columns</label>
                <input
                  type="number"
                  value={gridColumns}
                  onChange={(e) => setGridColumns(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                  min="1"
                  max="10"
                />
              </div>
              <div className="text-xs text-gray-500">
                {selectedControls.length} controls will be arranged in a {gridColumns}-column grid
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={createGrid}
                className="flex-1 bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600"
              >
                Create Grid
              </button>
              <button
                onClick={() => setShowGridDialog(false)}
                className="flex-1 bg-gray-300 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LayoutToolbar;