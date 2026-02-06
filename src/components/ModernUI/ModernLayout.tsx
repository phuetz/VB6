/**
 * Interface moderne 5 étoiles pour VB6 Studio
 * Design contemporain avec animations fluides, thème sombre/clair, et UX premium
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../UI/ToastManager';
import { useVB6Store } from '../../stores/vb6Store';

// Composants d'interface moderne
export const ModernTitleBar: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { addToast } = useToast();
  const { currentProject } = useVB6Store();
  const [isMaximized, setIsMaximized] = useState(false);

  return (
    <motion.div
      className="flex items-center justify-between h-8 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white px-4 select-none"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center space-x-3">
        <motion.div
          className="w-5 h-5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="text-xs font-bold">VB</span>
        </motion.div>
        <span className="text-sm font-medium">VB6 Studio</span>
        {currentProject && (
          <motion.span
            className="text-xs text-slate-300 bg-slate-700 px-2 py-0.5 rounded"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            {currentProject.name}
          </motion.span>
        )}
      </div>

      <div className="flex items-center space-x-1">
        <motion.button
          className="p-1 hover:bg-slate-700 rounded transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTheme}
        >
          {theme === 'dark' ? '🌙' : '☀️'}
        </motion.button>
        <motion.button
          className="p-1 hover:bg-slate-700 rounded transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsMaximized(!isMaximized)}
        >
          {isMaximized ? '⧉' : '🗖'}
        </motion.button>
        <motion.button
          className="p-1 hover:bg-red-600 rounded transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => addToast('Application fermée', 'info')}
        >
          ×
        </motion.button>
      </div>
    </motion.div>
  );
};

export const ModernMenuBar: React.FC = () => {
  const { theme } = useTheme();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const menus = [
    {
      id: 'file',
      title: 'Fichier',
      items: [
        { id: 'new', title: 'Nouveau projet', shortcut: 'Ctrl+N', icon: '📄' },
        { id: 'open', title: 'Ouvrir', shortcut: 'Ctrl+O', icon: '📂' },
        { id: 'save', title: 'Enregistrer', shortcut: 'Ctrl+S', icon: '💾' },
        { id: 'separator' },
        { id: 'recent', title: 'Récents', icon: '🕐' },
        { id: 'separator' },
        { id: 'exit', title: 'Quitter', shortcut: 'Alt+F4', icon: '🚪' },
      ],
    },
    {
      id: 'edit',
      title: 'Edition',
      items: [
        { id: 'undo', title: 'Annuler', shortcut: 'Ctrl+Z', icon: '↶' },
        { id: 'redo', title: 'Rétablir', shortcut: 'Ctrl+Y', icon: '↷' },
        { id: 'separator' },
        { id: 'cut', title: 'Couper', shortcut: 'Ctrl+X', icon: '✂️' },
        { id: 'copy', title: 'Copier', shortcut: 'Ctrl+C', icon: '📋' },
        { id: 'paste', title: 'Coller', shortcut: 'Ctrl+V', icon: '📌' },
        { id: 'separator' },
        { id: 'find', title: 'Rechercher', shortcut: 'Ctrl+F', icon: '🔍' },
        { id: 'replace', title: 'Remplacer', shortcut: 'Ctrl+H', icon: '🔄' },
      ],
    },
    {
      id: 'view',
      title: 'Affichage',
      items: [
        { id: 'designer', title: 'Concepteur', shortcut: 'Shift+F7', icon: '🎨' },
        { id: 'code', title: 'Code', shortcut: 'F7', icon: '💻' },
        { id: 'separator' },
        { id: 'toolbox', title: 'Boîte à outils', icon: '🧰' },
        { id: 'properties', title: 'Propriétés', shortcut: 'F4', icon: '⚙️' },
        { id: 'project', title: 'Explorateur de projet', icon: '📁' },
        { id: 'separator' },
        { id: 'grid', title: 'Grille', icon: '⊞' },
        { id: 'ruler', title: 'Règles', icon: '📏' },
      ],
    },
    {
      id: 'project',
      title: 'Projet',
      items: [
        { id: 'add-form', title: 'Ajouter une feuille', icon: '📄' },
        { id: 'add-module', title: 'Ajouter un module', icon: '📜' },
        { id: 'add-class', title: 'Ajouter une classe', icon: '🏛️' },
        { id: 'separator' },
        { id: 'references', title: 'Références', icon: '🔗' },
        { id: 'components', title: 'Composants', icon: '🧩' },
        { id: 'separator' },
        { id: 'compile', title: 'Compiler', shortcut: 'Ctrl+F5', icon: '⚙️' },
        { id: 'make', title: 'Générer EXE', shortcut: 'F5', icon: '📦' },
      ],
    },
    {
      id: 'format',
      title: 'Format',
      items: [
        { id: 'align-left', title: 'Aligner à gauche', icon: '⬅️' },
        { id: 'align-center', title: 'Centrer', icon: '↔️' },
        { id: 'align-right', title: 'Aligner à droite', icon: '➡️' },
        { id: 'separator' },
        { id: 'same-width', title: 'Même largeur', icon: '↔️' },
        { id: 'same-height', title: 'Même hauteur', icon: '↕️' },
        { id: 'same-size', title: 'Même taille', icon: '⬜' },
        { id: 'separator' },
        { id: 'order-front', title: 'Premier plan', icon: '🔝' },
        { id: 'order-back', title: 'Arrière-plan', icon: '⬇️' },
      ],
    },
    {
      id: 'debug',
      title: 'Débogage',
      items: [
        { id: 'start', title: 'Démarrer', shortcut: 'F5', icon: '▶️' },
        { id: 'pause', title: 'Pause', shortcut: 'Ctrl+Break', icon: '⏸️' },
        { id: 'stop', title: 'Arrêter', shortcut: 'Ctrl+F5', icon: '⏹️' },
        { id: 'separator' },
        { id: 'step-into', title: 'Pas à pas détaillé', shortcut: 'F8', icon: '⤵️' },
        { id: 'step-over', title: 'Pas à pas principal', shortcut: 'Shift+F8', icon: '⤴️' },
        { id: 'step-out', title: 'Sortir', shortcut: 'Ctrl+Shift+F8', icon: '⤴️' },
        { id: 'separator' },
        { id: 'breakpoint', title: "Basculer le point d'arrêt", shortcut: 'F9', icon: '🔴' },
        { id: 'clear-breakpoints', title: "Supprimer tous les points d'arrêt", icon: '🗑️' },
        { id: 'separator' },
        { id: 'immediate', title: 'Fenêtre immédiate', shortcut: 'Ctrl+G', icon: '⚡' },
        { id: 'watch', title: 'Fenêtre espion', icon: '👁️' },
      ],
    },
    {
      id: 'tools',
      title: 'Outils',
      items: [
        { id: 'menu-editor', title: 'Éditeur de menus', icon: '📋' },
        { id: 'resource-editor', title: 'Éditeur de ressources', icon: '🖼️' },
        { id: 'separator' },
        { id: 'options', title: 'Options', icon: '⚙️' },
        { id: 'macros', title: 'Macros', icon: '🔧' },
        { id: 'separator' },
        { id: 'performance', title: 'Moniteur de performance', icon: '📊' },
        { id: 'profiler', title: 'Profileur', icon: '📈' },
      ],
    },
    {
      id: 'help',
      title: 'Aide',
      items: [
        { id: 'contents', title: 'Sommaire', shortcut: 'F1', icon: '📖' },
        { id: 'search', title: "Rechercher dans l'aide", icon: '🔍' },
        { id: 'separator' },
        { id: 'samples', title: 'Exemples', icon: '📚' },
        { id: 'tips', title: 'Conseils du jour', icon: '💡' },
        { id: 'separator' },
        { id: 'about', title: 'À propos', icon: 'ℹ️' },
      ],
    },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <motion.div
      ref={menuRef}
      className={`flex items-center h-8 ${
        theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-900'
      } border-b border-slate-300 dark:border-slate-700 select-none`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      {menus.map(menu => (
        <div key={menu.id} className="relative">
          <motion.button
            className={`px-3 py-1 text-sm hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors ${
              activeMenu === menu.id ? 'bg-slate-200 dark:bg-slate-700' : ''
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveMenu(activeMenu === menu.id ? null : menu.id)}
          >
            {menu.title}
          </motion.button>

          <AnimatePresence>
            {activeMenu === menu.id && (
              <motion.div
                className={`absolute top-full left-0 min-w-48 ${
                  theme === 'dark' ? 'bg-slate-800' : 'bg-white'
                } shadow-xl border border-slate-300 dark:border-slate-700 rounded-lg overflow-hidden z-50`}
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {menu.items.map((item, index) => (
                  <div key={item.id || index}>
                    {item.id === 'separator' ? (
                      <div className="h-px bg-slate-300 dark:bg-slate-600 mx-2 my-1" />
                    ) : (
                      <motion.button
                        className={`w-full px-4 py-2 text-left text-sm flex items-center justify-between hover:${
                          theme === 'dark' ? 'bg-slate-700' : 'bg-slate-100'
                        } transition-colors`}
                        whileHover={{ x: 2 }}
                        onClick={() => {
                          setActiveMenu(null);
                        }}
                      >
                        <span className="flex items-center space-x-2">
                          <span className="text-base">{item.icon}</span>
                          <span>{item.title}</span>
                        </span>
                        {item.shortcut && (
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {item.shortcut}
                          </span>
                        )}
                      </motion.button>
                    )}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </motion.div>
  );
};

export const ModernToolbar: React.FC = () => {
  const { theme } = useTheme();
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  const toolGroups = [
    {
      name: 'Fichier',
      tools: [
        { id: 'new', icon: '📄', tooltip: 'Nouveau projet (Ctrl+N)' },
        { id: 'open', icon: '📂', tooltip: 'Ouvrir (Ctrl+O)' },
        { id: 'save', icon: '💾', tooltip: 'Enregistrer (Ctrl+S)' },
      ],
    },
    {
      name: 'Edition',
      tools: [
        { id: 'undo', icon: '↶', tooltip: 'Annuler (Ctrl+Z)' },
        { id: 'redo', icon: '↷', tooltip: 'Rétablir (Ctrl+Y)' },
        { id: 'cut', icon: '✂️', tooltip: 'Couper (Ctrl+X)' },
        { id: 'copy', icon: '📋', tooltip: 'Copier (Ctrl+C)' },
        { id: 'paste', icon: '📌', tooltip: 'Coller (Ctrl+V)' },
      ],
    },
    {
      name: 'Débogage',
      tools: [
        { id: 'start', icon: '▶️', tooltip: 'Démarrer (F5)' },
        { id: 'pause', icon: '⏸️', tooltip: 'Pause (Ctrl+Break)' },
        { id: 'stop', icon: '⏹️', tooltip: 'Arrêter (Ctrl+F5)' },
        { id: 'step', icon: '⤵️', tooltip: 'Pas à pas (F8)' },
      ],
    },
    {
      name: 'Affichage',
      tools: [
        { id: 'designer', icon: '🎨', tooltip: 'Concepteur (Shift+F7)' },
        { id: 'code', icon: '💻', tooltip: 'Code (F7)' },
        { id: 'properties', icon: '⚙️', tooltip: 'Propriétés (F4)' },
        { id: 'toolbox', icon: '🧰', tooltip: 'Boîte à outils' },
      ],
    },
    {
      name: 'Alignement',
      tools: [
        { id: 'align-left', icon: '⬅️', tooltip: 'Aligner à gauche' },
        { id: 'align-center', icon: '↔️', tooltip: 'Centrer' },
        { id: 'align-right', icon: '➡️', tooltip: 'Aligner à droite' },
        { id: 'same-size', icon: '⬜', tooltip: 'Même taille' },
      ],
    },
  ];

  const handleToolClick = (toolId: string) => {
    addToast(`Action: ${toolId}`, 'info');
  };

  return (
    <motion.div
      className={`flex items-center h-10 ${
        theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'
      } border-b border-slate-300 dark:border-slate-700 px-2 space-x-4`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      {toolGroups.map((group, groupIndex) => (
        <div key={group.name} className="flex items-center">
          {groupIndex > 0 && <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-2" />}
          <div className="flex items-center space-x-1">
            {group.tools.map(tool => (
              <motion.button
                key={tool.id}
                className={`p-2 rounded-lg hover:${
                  theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'
                } transition-colors relative group`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleToolClick(tool.id)}
                title={tool.tooltip}
              >
                <span className="text-lg">{tool.icon}</span>
                <motion.div
                  className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 0, y: 0 }}
                  whileHover={{ opacity: 1, y: -5 }}
                >
                  {tool.tooltip}
                </motion.div>
              </motion.button>
            ))}
          </div>
        </div>
      ))}

      <div className="flex-1" />

      <motion.div
        className="flex items-center space-x-2"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <div className="relative">
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className={`w-64 px-3 py-1 text-sm rounded-lg border ${
              theme === 'dark'
                ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          <motion.div
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400"
            whileHover={{ scale: 1.1 }}
          >
            🔍
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export const ModernStatusBar: React.FC = () => {
  const { theme } = useTheme();
  const { controls, selectedControls } = useVB6Store();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const statusItems = [
    { id: 'ready', text: 'Prêt', icon: '✓' },
    { id: 'objects', text: `${controls.length} objets`, icon: '📦' },
    { id: 'selected', text: `${selectedControls.length} sélectionnés`, icon: '🎯' },
    { id: 'caps', text: 'MAJ', active: false },
    { id: 'num', text: 'NUM', active: true },
    { id: 'ins', text: 'INS', active: false },
  ];

  return (
    <motion.div
      className={`flex items-center justify-between h-6 ${
        theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
      } border-t border-slate-300 dark:border-slate-700 px-2 text-xs`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.4 }}
    >
      <div className="flex items-center space-x-4">
        {statusItems.map(item => (
          <motion.div
            key={item.id}
            className={`flex items-center space-x-1 ${item.active === false ? 'opacity-50' : ''}`}
            whileHover={{ scale: 1.02 }}
          >
            <span>{item.icon}</span>
            <span>{item.text}</span>
          </motion.div>
        ))}
      </div>

      <div className="flex items-center space-x-4">
        <motion.div
          className="flex items-center space-x-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <span>🕐</span>
          <span>{time.toLocaleTimeString()}</span>
        </motion.div>
        <motion.div className="flex items-center space-x-1" whileHover={{ scale: 1.05 }}>
          <span>💾</span>
          <span>Enregistré</span>
        </motion.div>
        <motion.div className="flex items-center space-x-1" whileHover={{ scale: 1.05 }}>
          <span>🔌</span>
          <span>Connecté</span>
        </motion.div>
      </div>
    </motion.div>
  );
};

export const ModernSidebar: React.FC<{ side: 'left' | 'right'; children: React.ReactNode }> = ({
  side,
  children,
}) => {
  const { theme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <motion.div
      className={`${
        theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'
      } border-r border-slate-300 dark:border-slate-700 flex flex-col relative`}
      initial={{ width: isCollapsed ? 40 : 280 }}
      animate={{ width: isCollapsed ? 40 : 280 }}
      transition={{ duration: 0.3 }}
    >
      <motion.button
        className={`absolute ${side === 'left' ? 'right-2' : 'left-2'} top-2 p-1 rounded hover:${
          theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'
        } transition-colors z-10`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <span className="text-sm">
          {isCollapsed ? (side === 'left' ? '▶' : '◀') : side === 'left' ? '◀' : '▶'}
        </span>
      </motion.button>

      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            className="flex-1 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const ModernMainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme } = useTheme();

  return (
    <motion.div
      className={`flex-1 ${
        theme === 'dark' ? 'bg-slate-900' : 'bg-white'
      } relative overflow-hidden`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-900 dark:to-slate-800 opacity-30" />
      <div className="relative z-10 h-full">{children}</div>
    </motion.div>
  );
};

export const ModernFloatingPanel: React.FC<{
  title: string;
  children: React.ReactNode;
  defaultPosition: { x: number; y: number };
  defaultSize: { width: number; height: number };
}> = ({ title, children, defaultPosition, defaultSize }) => {
  const { theme } = useTheme();
  const [position, setPosition] = useState(defaultPosition);
  const [size, setSize] = useState(defaultSize);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  return (
    <motion.div
      className={`fixed ${
        theme === 'dark' ? 'bg-slate-800' : 'bg-white'
      } border border-slate-300 dark:border-slate-700 rounded-lg shadow-2xl overflow-hidden z-50`}
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      drag={isDragging}
      dragMomentum={false}
      onDragEnd={(_, info) => {
        setPosition({
          x: position.x + info.offset.x,
          y: position.y + info.offset.y,
        });
      }}
    >
      <div
        className={`flex items-center justify-between h-8 ${
          theme === 'dark' ? 'bg-slate-700' : 'bg-slate-100'
        } px-3 cursor-move select-none`}
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
      >
        <span className="text-sm font-medium">{title}</span>
        <div className="flex items-center space-x-1">
          <motion.button
            className="p-1 rounded hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            −
          </motion.button>
          <motion.button
            className="p-1 rounded hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            □
          </motion.button>
          <motion.button
            className="p-1 rounded hover:bg-red-500 hover:text-white transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            ×
          </motion.button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3">{children}</div>

      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-nw-resize"
        onMouseDown={() => setIsResizing(true)}
        onMouseUp={() => setIsResizing(false)}
      >
        <div className="w-full h-full bg-slate-400 dark:bg-slate-600 opacity-50 rounded-tl-lg" />
      </div>
    </motion.div>
  );
};

export default {
  ModernTitleBar,
  ModernMenuBar,
  ModernToolbar,
  ModernStatusBar,
  ModernSidebar,
  ModernMainLayout,
  ModernFloatingPanel,
};
