/**
 * Designer visuel Crystal Reports pour VB6 Studio
 * Interface moderne et intuitive pour la création de rapports
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVB6Store } from '../../stores/vb6Store';
import { useTheme } from '../../context/ThemeContext';
import { CrystalReport, ReportSection, ReportObject, ReportDataSource, ReportParameter, ReportChart } from '../../server/src/services/CrystalReportsService';

interface CrystalReportDesignerProps {
  report?: CrystalReport;
  onSave?: (report: CrystalReport) => void;
  onClose?: () => void;
}

export const CrystalReportDesigner: React.FC<CrystalReportDesignerProps> = ({
  report,
  onSave,
  onClose,
}) => {
  const { theme } = useTheme();
  const { addToast } = useVB6Store();
  const [currentReport, setCurrentReport] = useState<CrystalReport>(
    report || {
      id: `report_${Date.now()}`,
      name: 'Nouveau Rapport',
      title: 'Nouveau Rapport',
      dataSources: [],
      sections: [
        {
          type: 'ReportHeader',
          name: 'En-tête de rapport',
          height: 50,
          visible: true,
          keepTogether: false,
          newPageBefore: false,
          newPageAfter: false,
          suppressBlankSection: false,
          objects: [],
        },
        {
          type: 'PageHeader',
          name: 'En-tête de page',
          height: 30,
          visible: true,
          keepTogether: false,
          newPageBefore: false,
          newPageAfter: false,
          suppressBlankSection: false,
          objects: [],
        },
        {
          type: 'Details',
          name: 'Détails',
          height: 20,
          visible: true,
          keepTogether: false,
          newPageBefore: false,
          newPageAfter: false,
          suppressBlankSection: false,
          objects: [],
        },
        {
          type: 'ReportFooter',
          name: 'Pied de rapport',
          height: 50,
          visible: true,
          keepTogether: false,
          newPageBefore: false,
          newPageAfter: false,
          suppressBlankSection: false,
          objects: [],
        },
        {
          type: 'PageFooter',
          name: 'Pied de page',
          height: 30,
          visible: true,
          keepTogether: false,
          newPageBefore: false,
          newPageAfter: false,
          suppressBlankSection: false,
          objects: [],
        },
      ],
      parameters: [],
      formulas: [],
      charts: [],
      subReports: [],
      pageSettings: {
        width: 612,
        height: 792,
        marginTop: 72,
        marginBottom: 72,
        marginLeft: 72,
        marginRight: 72,
        orientation: 'portrait',
      },
      formatting: {
        font: {
          name: 'Arial',
          size: 10,
          bold: false,
          italic: false,
          underline: false,
          color: '#000000',
        },
        background: {
          color: '#FFFFFF',
          transparent: true,
        },
      },
      filters: [],
      groups: [],
      summary: [],
    }
  );

  const [selectedSection, setSelectedSection] = useState<string>('Details');
  const [selectedObject, setSelectedObject] = useState<ReportObject | null>(null);
  const [activeTab, setActiveTab] = useState<'design' | 'preview' | 'data'>('design');
  const [draggedTool, setDraggedTool] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [showGrid, setShowGrid] = useState(true);
  const [gridSize, setGridSize] = useState(8);
  const [showRuler, setShowRuler] = useState(true);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const designerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Outils de la palette
  const toolboxItems = [
    { id: 'text', name: 'Texte', icon: '📝', type: 'text' },
    { id: 'field', name: 'Champ', icon: '📋', type: 'field' },
    { id: 'formula', name: 'Formule', icon: '🧮', type: 'formula' },
    { id: 'image', name: 'Image', icon: '🖼️', type: 'image' },
    { id: 'line', name: 'Ligne', icon: '📏', type: 'line' },
    { id: 'box', name: 'Boîte', icon: '⬜', type: 'box' },
    { id: 'chart', name: 'Graphique', icon: '📊', type: 'chart' },
    { id: 'subreport', name: 'Sous-rapport', icon: '📄', type: 'subReport' },
  ];

  // Gestion du glisser-déposer
  const handleDragStart = useCallback((e: React.DragEvent, toolId: string) => {
    setDraggedTool(toolId);
    e.dataTransfer.setData('text/plain', toolId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, sectionType: string) => {
    e.preventDefault();
    
    if (!draggedTool) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newObject: ReportObject = {
      id: `obj_${Date.now()}`,
      type: draggedTool as any,
      x,
      y,
      width: 100,
      height: 20,
      content: draggedTool === 'text' ? 'Nouveau texte' : '',
      formatting: {
        font: {
          name: 'Arial',
          size: 10,
          bold: false,
          italic: false,
          underline: false,
          color: '#000000',
        },
        background: {
          color: '#FFFFFF',
          transparent: true,
        },
        alignment: 'left',
        verticalAlignment: 'top',
        wordWrap: false,
        canGrow: false,
        canShrink: false,
      },
      border: {
        left: { style: 'none', width: 0, color: '#000000' },
        right: { style: 'none', width: 0, color: '#000000' },
        top: { style: 'none', width: 0, color: '#000000' },
        bottom: { style: 'none', width: 0, color: '#000000' },
      },
      conditions: [],
    };

    setCurrentReport(prev => ({
      ...prev,
      sections: prev.sections.map(section => 
        section.type === sectionType 
          ? { ...section, objects: [...section.objects, newObject] }
          : section
      ),
    }));

    setSelectedObject(newObject);
    setDraggedTool(null);
  }, [draggedTool]);

  // Gestion de la sélection d'objets
  const handleObjectSelect = useCallback((obj: ReportObject) => {
    setSelectedObject(obj);
  }, []);

  // Gestion des propriétés d'objets
  const updateObjectProperty = useCallback((property: string, value: any) => {
    if (!selectedObject) return;

    setCurrentReport(prev => ({
      ...prev,
      sections: prev.sections.map(section => ({
        ...section,
        objects: section.objects.map(obj => 
          obj.id === selectedObject.id 
            ? { ...obj, [property]: value }
            : obj
        ),
      })),
    }));

    setSelectedObject(prev => prev ? { ...prev, [property]: value } : null);
  }, [selectedObject]);

  // Rendu des sections
  const renderSection = useCallback((section: ReportSection) => {
    return (
      <motion.div
        key={section.type}
        className={`relative border-b border-gray-300 ${
          selectedSection === section.type ? 'bg-blue-50' : 'bg-white'
        }`}
        style={{ 
          height: section.height,
          display: section.visible ? 'block' : 'none',
        }}
        onClick={() => setSelectedSection(section.type)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, section.type)}
        layout
      >
        {/* En-tête de section */}
        <div className="absolute left-0 top-0 w-24 h-full bg-gray-100 border-r border-gray-300 flex items-center justify-center text-xs font-medium">
          {section.name}
        </div>

        {/* Zone de conception */}
        <div
          className="absolute left-24 top-0 right-0 bottom-0 relative"
          style={{
            backgroundImage: showGrid ? 
              `linear-gradient(to right, #e5e7eb 1px, transparent 1px),
               linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)` : 'none',
            backgroundSize: showGrid ? `${gridSize}px ${gridSize}px` : 'none',
          }}
        >
          {/* Objets de la section */}
          {section.objects.map((obj) => (
            <motion.div
              key={obj.id}
              className={`absolute border cursor-pointer ${
                selectedObject?.id === obj.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              style={{
                left: obj.x,
                top: obj.y,
                width: obj.width,
                height: obj.height,
                backgroundColor: obj.formatting.background.transparent 
                  ? 'transparent' 
                  : obj.formatting.background.color,
                fontSize: obj.formatting.font.size,
                fontFamily: obj.formatting.font.name,
                fontWeight: obj.formatting.font.bold ? 'bold' : 'normal',
                fontStyle: obj.formatting.font.italic ? 'italic' : 'normal',
                textDecoration: obj.formatting.font.underline ? 'underline' : 'none',
                color: obj.formatting.font.color,
                textAlign: obj.formatting.alignment,
                display: 'flex',
                alignItems: obj.formatting.verticalAlignment === 'top' ? 'flex-start' :
                           obj.formatting.verticalAlignment === 'bottom' ? 'flex-end' : 'center',
                justifyContent: obj.formatting.alignment === 'left' ? 'flex-start' :
                               obj.formatting.alignment === 'right' ? 'flex-end' : 'center',
                padding: '2px',
                overflow: 'hidden',
                whiteSpace: obj.formatting.wordWrap ? 'normal' : 'nowrap',
              }}
              onClick={() => handleObjectSelect(obj)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {obj.type === 'text' && (
                <span>{obj.content}</span>
              )}
              {obj.type === 'field' && (
                <span className="text-blue-600">{obj.fieldName || '[Champ]'}</span>
              )}
              {obj.type === 'formula' && (
                <span className="text-green-600">{obj.formulaName || '[Formule]'}</span>
              )}
              {obj.type === 'image' && (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs">
                  📷
                </div>
              )}
              {obj.type === 'line' && (
                <div className="w-full h-px bg-black" />
              )}
              {obj.type === 'box' && (
                <div className="w-full h-full border border-black" />
              )}
              {obj.type === 'chart' && (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xs">
                  📊
                </div>
              )}
              {obj.type === 'subReport' && (
                <div className="w-full h-full bg-yellow-100 flex items-center justify-center text-xs">
                  📄
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  }, [selectedSection, selectedObject, handleDragOver, handleDrop, handleObjectSelect, showGrid, gridSize]);

  // Panneau de propriétés
  const renderPropertyPanel = () => {
    if (!selectedObject) {
      return (
        <div className="p-4 text-gray-500">
          Sélectionnez un objet pour voir ses propriétés
        </div>
      );
    }

    return (
      <div className="p-4 space-y-4">
        <h3 className="font-semibold">Propriétés - {selectedObject.type}</h3>
        
        {/* Propriétés de base */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Position X</label>
          <input
            type="number"
            value={selectedObject.x}
            onChange={(e) => updateObjectProperty('x', parseInt(e.target.value))}
            className="w-full px-2 py-1 border rounded"
          />
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium">Position Y</label>
          <input
            type="number"
            value={selectedObject.y}
            onChange={(e) => updateObjectProperty('y', parseInt(e.target.value))}
            className="w-full px-2 py-1 border rounded"
          />
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium">Largeur</label>
          <input
            type="number"
            value={selectedObject.width}
            onChange={(e) => updateObjectProperty('width', parseInt(e.target.value))}
            className="w-full px-2 py-1 border rounded"
          />
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium">Hauteur</label>
          <input
            type="number"
            value={selectedObject.height}
            onChange={(e) => updateObjectProperty('height', parseInt(e.target.value))}
            className="w-full px-2 py-1 border rounded"
          />
        </div>

        {/* Propriétés spécifiques au type */}
        {selectedObject.type === 'text' && (
          <div className="space-y-2">
            <label className="block text-sm font-medium">Contenu</label>
            <textarea
              value={selectedObject.content || ''}
              onChange={(e) => updateObjectProperty('content', e.target.value)}
              className="w-full px-2 py-1 border rounded"
              rows={3}
            />
          </div>
        )}

        {selectedObject.type === 'field' && (
          <div className="space-y-2">
            <label className="block text-sm font-medium">Nom du champ</label>
            <input
              type="text"
              value={selectedObject.fieldName || ''}
              onChange={(e) => updateObjectProperty('fieldName', e.target.value)}
              className="w-full px-2 py-1 border rounded"
            />
          </div>
        )}

        {selectedObject.type === 'formula' && (
          <div className="space-y-2">
            <label className="block text-sm font-medium">Nom de la formule</label>
            <input
              type="text"
              value={selectedObject.formulaName || ''}
              onChange={(e) => updateObjectProperty('formulaName', e.target.value)}
              className="w-full px-2 py-1 border rounded"
            />
          </div>
        )}

        {/* Propriétés de formatage */}
        <div className="border-t pt-4">
          <h4 className="font-medium mb-2">Formatage</h4>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium">Police</label>
            <select
              value={selectedObject.formatting.font.name}
              onChange={(e) => updateObjectProperty('formatting', {
                ...selectedObject.formatting,
                font: { ...selectedObject.formatting.font, name: e.target.value }
              })}
              className="w-full px-2 py-1 border rounded"
            >
              <option value="Arial">Arial</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Courier New">Courier New</option>
              <option value="Verdana">Verdana</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium">Taille</label>
            <input
              type="number"
              value={selectedObject.formatting.font.size}
              onChange={(e) => updateObjectProperty('formatting', {
                ...selectedObject.formatting,
                font: { ...selectedObject.formatting.font, size: parseInt(e.target.value) }
              })}
              className="w-full px-2 py-1 border rounded"
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium">Couleur</label>
            <input
              type="color"
              value={selectedObject.formatting.font.color}
              onChange={(e) => updateObjectProperty('formatting', {
                ...selectedObject.formatting,
                font: { ...selectedObject.formatting.font, color: e.target.value }
              })}
              className="w-full px-2 py-1 border rounded"
            />
          </div>
          
          <div className="flex space-x-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={selectedObject.formatting.font.bold}
                onChange={(e) => updateObjectProperty('formatting', {
                  ...selectedObject.formatting,
                  font: { ...selectedObject.formatting.font, bold: e.target.checked }
                })}
                className="mr-1"
              />
              Gras
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={selectedObject.formatting.font.italic}
                onChange={(e) => updateObjectProperty('formatting', {
                  ...selectedObject.formatting,
                  font: { ...selectedObject.formatting.font, italic: e.target.checked }
                })}
                className="mr-1"
              />
              Italique
            </label>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium">Alignement</label>
            <select
              value={selectedObject.formatting.alignment}
              onChange={(e) => updateObjectProperty('formatting', {
                ...selectedObject.formatting,
                alignment: e.target.value as 'left' | 'center' | 'right' | 'justified'
              })}
              className="w-full px-2 py-1 border rounded"
            >
              <option value="left">Gauche</option>
              <option value="center">Centre</option>
              <option value="right">Droite</option>
              <option value="justified">Justifié</option>
            </select>
          </div>
        </div>
      </div>
    );
  };

  // Sauvegarde du rapport
  const handleSave = useCallback(() => {
    if (onSave) {
      onSave(currentReport);
    }
    addToast('Rapport sauvegardé avec succès', 'success');
  }, [currentReport, onSave, addToast]);

  // Aperçu du rapport
  const handlePreview = useCallback(() => {
    setIsPreviewMode(true);
    setActiveTab('preview');
  }, []);

  return (
    <div className={`flex h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Boîte à outils */}
      <motion.div
        className={`w-64 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border-r border-gray-300`}
        initial={{ x: -264 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">Boîte à outils</h2>
          <div className="grid grid-cols-2 gap-2">
            {toolboxItems.map((tool) => (
              <motion.div
                key={tool.id}
                className={`p-3 border rounded cursor-pointer ${
                  theme === 'dark' ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-100'
                }`}
                draggable
                onDragStart={(e) => handleDragStart(e, tool.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="text-center">
                  <div className="text-2xl mb-1">{tool.icon}</div>
                  <div className="text-xs">{tool.name}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Zone de conception principale */}
      <div className="flex-1 flex flex-col">
        {/* Barre d'outils */}
        <div className={`flex items-center justify-between p-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border-b border-gray-300`}>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              💾 Sauvegarder
            </button>
            <button
              onClick={handlePreview}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            >
              👁️ Aperçu
            </button>
            <div className="flex items-center space-x-2">
              <span className="text-sm">Zoom:</span>
              <input
                type="range"
                min="25"
                max="200"
                value={zoom}
                onChange={(e) => setZoom(parseInt(e.target.value))}
                className="w-20"
              />
              <span className="text-sm">{zoom}%</span>
            </div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
              />
              <span className="text-sm">Grille</span>
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">{currentReport.name}</span>
            {onClose && (
              <button
                onClick={onClose}
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Onglets */}
        <div className={`flex border-b ${theme === 'dark' ? 'border-gray-600' : 'border-gray-300'}`}>
          {['design', 'preview', 'data'].map((tab) => (
            <button
              key={tab}
              className={`px-6 py-2 font-medium ${
                activeTab === tab
                  ? theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-blue-600'
                  : theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-blue-600'
              }`}
              onClick={() => setActiveTab(tab as 'design' | 'preview' | 'data')}
            >
              {tab === 'design' ? '🎨 Conception' : tab === 'preview' ? '👁️ Aperçu' : '📊 Données'}
            </button>
          ))}
        </div>

        {/* Contenu principal */}
        <div className="flex-1 flex">
          {activeTab === 'design' && (
            <>
              {/* Règle (si activée) */}
              {showRuler && (
                <div className="absolute top-0 left-0 w-full h-6 bg-gray-200 border-b border-gray-300 z-10">
                  {/* Marques de règle */}
                  <div className="relative h-full">
                    {Array.from({ length: Math.ceil(currentReport.pageSettings.width / 10) }, (_, i) => (
                      <div
                        key={i}
                        className="absolute top-0 w-px h-full bg-gray-400"
                        style={{ left: i * 10 }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Zone de conception */}
              <div
                ref={canvasRef}
                className="flex-1 overflow-auto p-4"
                style={{ 
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: 'top left',
                }}
              >
                <div
                  className="bg-white shadow-lg border border-gray-300 mx-auto"
                  style={{
                    width: currentReport.pageSettings.width,
                    minHeight: currentReport.pageSettings.height,
                  }}
                >
                  {currentReport.sections.map(renderSection)}
                </div>
              </div>
            </>
          )}

          {activeTab === 'preview' && (
            <div className="flex-1 p-4">
              <div className="bg-white shadow-lg border border-gray-300 mx-auto p-8">
                <h1 className="text-2xl font-bold mb-4">{currentReport.title}</h1>
                <div className="text-gray-600">
                  Aperçu du rapport - Fonctionnalité à implémenter avec les données réelles
                </div>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="flex-1 p-4">
              <div className="bg-white shadow-lg border border-gray-300 p-6">
                <h2 className="text-xl font-semibold mb-4">Sources de données</h2>
                <div className="text-gray-600">
                  Configuration des sources de données - Fonctionnalité à implémenter
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Panneau de propriétés */}
      <motion.div
        className={`w-80 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border-l border-gray-300`}
        initial={{ x: 320 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">Propriétés</h2>
          {renderPropertyPanel()}
        </div>
      </motion.div>
    </div>
  );
};

export default CrystalReportDesigner;