/**
 * Système de menu complet pour VB6 Studio
 * Menus contextuels, barres de menus, raccourcis clavier, et système de commandes
 */

import React, { useState, useRef, useEffect, useCallback, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVB6Store } from '../../stores/vb6Store';
import { useTheme } from '../../context/ThemeContext';

// Types pour le système de menu
interface MenuItem {
  id: string;
  text: string;
  icon?: string;
  shortcut?: string;
  enabled?: boolean;
  visible?: boolean;
  checked?: boolean;
  separator?: boolean;
  submenu?: MenuItem[];
  action?: () => void;
  description?: string;
  tag?: any;
}

interface MenuBarItem extends MenuItem {
  popup?: MenuItem[];
}

interface MenuPosition {
  x: number;
  y: number;
}

// Contexte du système de menu
const MenuContext = createContext<{
  activeMenu: string | null;
  setActiveMenu: (menu: string | null) => void;
  executeCommand: (commandId: string) => void;
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
}>({
  activeMenu: null,
  setActiveMenu: () => {},
  executeCommand: () => {},
  isMenuOpen: false,
  setIsMenuOpen: () => {},
});

// Provider du système de menu
export const MenuProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { fireEvent } = useVB6Store();

  const executeCommand = useCallback((commandId: string) => {
    console.log(`Executing command: ${commandId}`);
    fireEvent('MenuSystem', 'CommandExecuted', { commandId });
  }, [fireEvent]);

  return (
    <MenuContext.Provider value={{
      activeMenu,
      setActiveMenu,
      executeCommand,
      isMenuOpen,
      setIsMenuOpen,
    }}>
      {children}
    </MenuContext.Provider>
  );
};

// Hook pour utiliser le contexte de menu
const useMenu = () => {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('useMenu must be used within a MenuProvider');
  }
  return context;
};

// Composant de menu contextuel
export const ContextMenu: React.FC<{
  items: MenuItem[];
  position: MenuPosition;
  onClose: () => void;
  parentId?: string;
}> = ({ items, position, onClose, parentId }) => {
  const { theme } = useTheme();
  const { executeCommand } = useMenu();
  const menuRef = useRef<HTMLDivElement>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [submenuPosition, setSubmenuPosition] = useState<MenuPosition | null>(null);

  // Fermer le menu si on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Gestion des raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleItemClick = useCallback((item: MenuItem) => {
    if (!item.enabled || item.separator) return;

    if (item.action) {
      item.action();
    } else if (item.id) {
      executeCommand(item.id);
    }

    if (!item.submenu) {
      onClose();
    }
  }, [executeCommand, onClose]);

  const handleItemHover = useCallback((item: MenuItem, event: React.MouseEvent) => {
    if (!item.enabled || item.separator) return;

    setHoveredItem(item.id);

    if (item.submenu) {
      const rect = event.currentTarget.getBoundingClientRect();
      setSubmenuPosition({
        x: rect.right + 5,
        y: rect.top
      });
    } else {
      setSubmenuPosition(null);
    }
  }, []);

  const renderMenuItem = useCallback((item: MenuItem, index: number) => {
    if (item.separator) {
      return (
        <div
          key={`sep-${index}`}
          className="h-px bg-gray-300 dark:bg-gray-600 my-1 mx-2"
        />
      );
    }

    const isHovered = hoveredItem === item.id;
    const isDisabled = item.enabled === false;

    return (
      <motion.div
        key={item.id}
        className={`flex items-center justify-between px-3 py-2 cursor-pointer ${
          isDisabled ? 'opacity-50 cursor-not-allowed' : ''
        } ${
          isHovered && !isDisabled 
            ? theme === 'dark' ? 'bg-blue-600' : 'bg-blue-100'
            : ''
        }`}
        onClick={() => handleItemClick(item)}
        onMouseEnter={(e) => handleItemHover(item, e)}
        onMouseLeave={() => setHoveredItem(null)}
        whileHover={!isDisabled ? { backgroundColor: theme === 'dark' ? '#2563eb' : '#dbeafe' } : {}}
      >
        <div className="flex items-center space-x-3">
          {/* Icône de vérification */}
          <div className="w-4 h-4 flex items-center justify-center">
            {item.checked && (
              <span className="text-green-500">✓</span>
            )}
          </div>
          
          {/* Icône */}
          {item.icon && (
            <span className="text-base">{item.icon}</span>
          )}
          
          {/* Texte */}
          <span className={`text-sm ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            {item.text}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Raccourci clavier */}
          {item.shortcut && (
            <span className={`text-xs ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {item.shortcut}
            </span>
          )}
          
          {/* Flèche de sous-menu */}
          {item.submenu && (
            <span className={`text-xs ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              ▶
            </span>
          )}
        </div>
      </motion.div>
    );
  }, [theme, hoveredItem, handleItemClick, handleItemHover]);

  return (
    <>
      <motion.div
        ref={menuRef}
        className={`fixed z-50 min-w-48 ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        } border border-gray-300 dark:border-gray-600 rounded-lg shadow-2xl overflow-hidden`}
        style={{
          left: position.x,
          top: position.y,
        }}
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.15 }}
      >
        {items.map(renderMenuItem)}
      </motion.div>

      {/* Sous-menu */}
      {submenuPosition && hoveredItem && (
        <AnimatePresence>
          {items.find(item => item.id === hoveredItem)?.submenu && (
            <ContextMenu
              items={items.find(item => item.id === hoveredItem)!.submenu!}
              position={submenuPosition}
              onClose={() => setSubmenuPosition(null)}
              parentId={hoveredItem}
            />
          )}
        </AnimatePresence>
      )}
    </>
  );
};

// Composant de barre de menu
export const MenuBar: React.FC<{
  items: MenuBarItem[];
  onItemClick?: (item: MenuBarItem) => void;
}> = ({ items, onItemClick }) => {
  const { theme } = useTheme();
  const { activeMenu, setActiveMenu, isMenuOpen, setIsMenuOpen } = useMenu();
  const [contextMenu, setContextMenu] = useState<{
    items: MenuItem[];
    position: MenuPosition;
  } | null>(null);

  const handleMenuClick = useCallback((item: MenuBarItem) => {
    if (!item.enabled) return;

    if (item.popup) {
      // Calculer la position du menu contextuel
      const rect = document.querySelector(`[data-menu-id="${item.id}"]`)?.getBoundingClientRect();
      if (rect) {
        setContextMenu({
          items: item.popup,
          position: {
            x: rect.left,
            y: rect.bottom + 2
          }
        });
        setActiveMenu(item.id);
        setIsMenuOpen(true);
      }
    } else if (item.action) {
      item.action();
    }

    if (onItemClick) {
      onItemClick(item);
    }
  }, [setActiveMenu, setIsMenuOpen, onItemClick]);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
    setActiveMenu(null);
    setIsMenuOpen(false);
  }, [setActiveMenu, setIsMenuOpen]);

  return (
    <>
      <div className={`flex items-center h-8 ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
      } border-b border-gray-300 dark:border-gray-600 px-2`}>
        {items.map((item) => (
          <motion.button
            key={item.id}
            data-menu-id={item.id}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              item.enabled === false ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            } ${
              activeMenu === item.id 
                ? theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'
                : theme === 'dark' ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => handleMenuClick(item)}
            disabled={item.enabled === false}
            whileHover={item.enabled !== false ? { scale: 1.02 } : {}}
            whileTap={item.enabled !== false ? { scale: 0.98 } : {}}
          >
            {item.icon && <span className="mr-1">{item.icon}</span>}
            {item.text}
          </motion.button>
        ))}
      </div>

      {/* Menu contextuel */}
      <AnimatePresence>
        {contextMenu && (
          <ContextMenu
            items={contextMenu.items}
            position={contextMenu.position}
            onClose={closeContextMenu}
          />
        )}
      </AnimatePresence>
    </>
  );
};

// Composant de menu contextuel déclenché par clic droit
export const RightClickMenu: React.FC<{
  children: React.ReactNode;
  items: MenuItem[];
  disabled?: boolean;
}> = ({ children, items, disabled = false }) => {
  const [contextMenu, setContextMenu] = useState<{
    items: MenuItem[];
    position: MenuPosition;
  } | null>(null);

  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    if (disabled) return;

    event.preventDefault();
    setContextMenu({
      items,
      position: {
        x: event.clientX,
        y: event.clientY
      }
    });
  }, [items, disabled]);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  return (
    <>
      <div onContextMenu={handleContextMenu}>
        {children}
      </div>

      <AnimatePresence>
        {contextMenu && (
          <ContextMenu
            items={contextMenu.items}
            position={contextMenu.position}
            onClose={closeContextMenu}
          />
        )}
      </AnimatePresence>
    </>
  );
};

// Hook pour les raccourcis clavier
export const useKeyboardShortcuts = (shortcuts: Record<string, () => void>) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const ctrl = event.ctrlKey;
      const shift = event.shiftKey;
      const alt = event.altKey;

      // Construire la chaîne de raccourci
      let shortcut = '';
      if (ctrl) shortcut += 'ctrl+';
      if (shift) shortcut += 'shift+';
      if (alt) shortcut += 'alt+';
      shortcut += key;

      // Exécuter l'action si le raccourci existe
      if (shortcuts[shortcut]) {
        event.preventDefault();
        shortcuts[shortcut]();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

// Composant de gestionnaire de raccourcis
export const ShortcutManager: React.FC<{
  shortcuts: Record<string, () => void>;
}> = ({ shortcuts }) => {
  useKeyboardShortcuts(shortcuts);
  return null;
};

// Exemple d'utilisation complète
export const CompleteMenuSystem: React.FC = () => {
  const { theme } = useTheme();
  const { executeCommand } = useMenu();

  // Définition des menus
  const menuItems: MenuBarItem[] = [
    {
      id: 'file',
      text: 'Fichier',
      icon: '📁',
      popup: [
        { id: 'new', text: 'Nouveau', icon: '📄', shortcut: 'Ctrl+N', action: () => executeCommand('file.new') },
        { id: 'open', text: 'Ouvrir', icon: '📂', shortcut: 'Ctrl+O', action: () => executeCommand('file.open') },
        { id: 'save', text: 'Enregistrer', icon: '💾', shortcut: 'Ctrl+S', action: () => executeCommand('file.save') },
        { id: 'saveas', text: 'Enregistrer sous...', icon: '💾', shortcut: 'Ctrl+Shift+S', action: () => executeCommand('file.saveas') },
        { separator: true },
        { id: 'recent', text: 'Récents', icon: '🕐', submenu: [
          { id: 'recent1', text: 'Projet1.vbp', action: () => executeCommand('file.recent.1') },
          { id: 'recent2', text: 'Projet2.vbp', action: () => executeCommand('file.recent.2') },
        ]},
        { separator: true },
        { id: 'exit', text: 'Quitter', icon: '🚪', shortcut: 'Alt+F4', action: () => executeCommand('file.exit') },
      ]
    },
    {
      id: 'edit',
      text: 'Edition',
      icon: '✏️',
      popup: [
        { id: 'undo', text: 'Annuler', icon: '↶', shortcut: 'Ctrl+Z', action: () => executeCommand('edit.undo') },
        { id: 'redo', text: 'Rétablir', icon: '↷', shortcut: 'Ctrl+Y', action: () => executeCommand('edit.redo') },
        { separator: true },
        { id: 'cut', text: 'Couper', icon: '✂️', shortcut: 'Ctrl+X', action: () => executeCommand('edit.cut') },
        { id: 'copy', text: 'Copier', icon: '📋', shortcut: 'Ctrl+C', action: () => executeCommand('edit.copy') },
        { id: 'paste', text: 'Coller', icon: '📌', shortcut: 'Ctrl+V', action: () => executeCommand('edit.paste') },
        { separator: true },
        { id: 'selectall', text: 'Tout sélectionner', icon: '🔘', shortcut: 'Ctrl+A', action: () => executeCommand('edit.selectall') },
        { id: 'find', text: 'Rechercher', icon: '🔍', shortcut: 'Ctrl+F', action: () => executeCommand('edit.find') },
        { id: 'replace', text: 'Remplacer', icon: '🔄', shortcut: 'Ctrl+H', action: () => executeCommand('edit.replace') },
      ]
    },
    {
      id: 'view',
      text: 'Affichage',
      icon: '👁️',
      popup: [
        { id: 'code', text: 'Code', icon: '💻', shortcut: 'F7', action: () => executeCommand('view.code') },
        { id: 'object', text: 'Objet', icon: '🎨', shortcut: 'Shift+F7', action: () => executeCommand('view.object') },
        { separator: true },
        { id: 'project', text: 'Explorateur de projet', icon: '📁', checked: true, action: () => executeCommand('view.project') },
        { id: 'properties', text: 'Propriétés', icon: '⚙️', shortcut: 'F4', checked: true, action: () => executeCommand('view.properties') },
        { id: 'toolbox', text: 'Boîte à outils', icon: '🧰', checked: true, action: () => executeCommand('view.toolbox') },
        { id: 'immediate', text: 'Exécution', icon: '⚡', shortcut: 'Ctrl+G', action: () => executeCommand('view.immediate') },
        { separator: true },
        { id: 'toolbar', text: 'Barre d\'outils', icon: '🔧', checked: true, action: () => executeCommand('view.toolbar') },
        { id: 'statusbar', text: 'Barre d\'état', icon: '📊', checked: true, action: () => executeCommand('view.statusbar') },
        { separator: true },
        { id: 'zoom', text: 'Zoom', icon: '🔍', submenu: [
          { id: 'zoom25', text: '25%', action: () => executeCommand('view.zoom.25') },
          { id: 'zoom50', text: '50%', action: () => executeCommand('view.zoom.50') },
          { id: 'zoom75', text: '75%', action: () => executeCommand('view.zoom.75') },
          { id: 'zoom100', text: '100%', checked: true, action: () => executeCommand('view.zoom.100') },
          { id: 'zoom150', text: '150%', action: () => executeCommand('view.zoom.150') },
          { id: 'zoom200', text: '200%', action: () => executeCommand('view.zoom.200') },
        ]},
      ]
    },
    {
      id: 'project',
      text: 'Projet',
      icon: '📦',
      popup: [
        { id: 'addform', text: 'Ajouter une feuille', icon: '📄', action: () => executeCommand('project.addform') },
        { id: 'addmodule', text: 'Ajouter un module', icon: '📜', action: () => executeCommand('project.addmodule') },
        { id: 'addclass', text: 'Ajouter une classe', icon: '🏛️', action: () => executeCommand('project.addclass') },
        { separator: true },
        { id: 'references', text: 'Références', icon: '🔗', action: () => executeCommand('project.references') },
        { id: 'components', text: 'Composants', icon: '🧩', action: () => executeCommand('project.components') },
        { separator: true },
        { id: 'properties', text: 'Propriétés du projet', icon: '⚙️', action: () => executeCommand('project.properties') },
        { separator: true },
        { id: 'compile', text: 'Compiler le projet', icon: '⚙️', shortcut: 'Ctrl+F5', action: () => executeCommand('project.compile') },
        { id: 'make', text: 'Générer l\'EXE', icon: '📦', shortcut: 'F5', action: () => executeCommand('project.make') },
      ]
    },
    {
      id: 'debug',
      text: 'Débogage',
      icon: '🐛',
      popup: [
        { id: 'start', text: 'Démarrer', icon: '▶️', shortcut: 'F5', action: () => executeCommand('debug.start') },
        { id: 'restart', text: 'Redémarrer', icon: '🔄', shortcut: 'Ctrl+Shift+F5', action: () => executeCommand('debug.restart') },
        { id: 'stop', text: 'Arrêter le débogage', icon: '⏹️', shortcut: 'Shift+F5', action: () => executeCommand('debug.stop') },
        { separator: true },
        { id: 'stepinto', text: 'Pas à pas détaillé', icon: '⤵️', shortcut: 'F8', action: () => executeCommand('debug.stepinto') },
        { id: 'stepover', text: 'Pas à pas principal', icon: '⤴️', shortcut: 'Shift+F8', action: () => executeCommand('debug.stepover') },
        { id: 'stepout', text: 'Sortir', icon: '⤴️', shortcut: 'Ctrl+Shift+F8', action: () => executeCommand('debug.stepout') },
        { separator: true },
        { id: 'breakpoint', text: 'Basculer le point d\'arrêt', icon: '🔴', shortcut: 'F9', action: () => executeCommand('debug.breakpoint') },
        { id: 'deletebreakpoints', text: 'Supprimer tous les points d\'arrêt', icon: '🗑️', shortcut: 'Ctrl+Shift+F9', action: () => executeCommand('debug.deletebreakpoints') },
        { separator: true },
        { id: 'quickwatch', text: 'Espion express', icon: '👁️', shortcut: 'Shift+F9', action: () => executeCommand('debug.quickwatch') },
      ]
    },
    {
      id: 'tools',
      text: 'Outils',
      icon: '🔧',
      popup: [
        { id: 'menueditor', text: 'Éditeur de menus', icon: '📋', action: () => executeCommand('tools.menueditor') },
        { id: 'options', text: 'Options', icon: '⚙️', action: () => executeCommand('tools.options') },
        { separator: true },
        { id: 'macros', text: 'Macros', icon: '🤖', submenu: [
          { id: 'record', text: 'Enregistrer une macro', action: () => executeCommand('tools.macros.record') },
          { id: 'stop', text: 'Arrêter l\'enregistrement', action: () => executeCommand('tools.macros.stop') },
          { id: 'play', text: 'Exécuter la macro', action: () => executeCommand('tools.macros.play') },
        ]},
        { separator: true },
        { id: 'addins', text: 'Gestionnaire de compléments', icon: '🔌', action: () => executeCommand('tools.addins') },
      ]
    },
    {
      id: 'help',
      text: 'Aide',
      icon: '❓',
      popup: [
        { id: 'contents', text: 'Sommaire de l\'aide', icon: '📖', shortcut: 'F1', action: () => executeCommand('help.contents') },
        { id: 'index', text: 'Index de l\'aide', icon: '📑', action: () => executeCommand('help.index') },
        { id: 'search', text: 'Rechercher dans l\'aide', icon: '🔍', action: () => executeCommand('help.search') },
        { separator: true },
        { id: 'msdn', text: 'MSDN Online', icon: '🌐', action: () => executeCommand('help.msdn') },
        { id: 'samples', text: 'Exemples', icon: '📚', action: () => executeCommand('help.samples') },
        { separator: true },
        { id: 'tipofday', text: 'Conseil du jour', icon: '💡', action: () => executeCommand('help.tipofday') },
        { id: 'about', text: 'À propos de VB6 Studio', icon: 'ℹ️', action: () => executeCommand('help.about') },
      ]
    }
  ];

  // Raccourcis clavier
  const shortcuts = {
    'ctrl+n': () => executeCommand('file.new'),
    'ctrl+o': () => executeCommand('file.open'),
    'ctrl+s': () => executeCommand('file.save'),
    'ctrl+shift+s': () => executeCommand('file.saveas'),
    'ctrl+z': () => executeCommand('edit.undo'),
    'ctrl+y': () => executeCommand('edit.redo'),
    'ctrl+x': () => executeCommand('edit.cut'),
    'ctrl+c': () => executeCommand('edit.copy'),
    'ctrl+v': () => executeCommand('edit.paste'),
    'ctrl+a': () => executeCommand('edit.selectall'),
    'ctrl+f': () => executeCommand('edit.find'),
    'ctrl+h': () => executeCommand('edit.replace'),
    'f1': () => executeCommand('help.contents'),
    'f4': () => executeCommand('view.properties'),
    'f5': () => executeCommand('debug.start'),
    'f7': () => executeCommand('view.code'),
    'f8': () => executeCommand('debug.stepinto'),
    'f9': () => executeCommand('debug.breakpoint'),
    'shift+f5': () => executeCommand('debug.stop'),
    'shift+f7': () => executeCommand('view.object'),
    'shift+f8': () => executeCommand('debug.stepover'),
    'shift+f9': () => executeCommand('debug.quickwatch'),
    'ctrl+f5': () => executeCommand('project.compile'),
    'ctrl+g': () => executeCommand('view.immediate'),
    'ctrl+shift+f5': () => executeCommand('debug.restart'),
    'ctrl+shift+f8': () => executeCommand('debug.stepout'),
    'ctrl+shift+f9': () => executeCommand('debug.deletebreakpoints'),
    'alt+f4': () => executeCommand('file.exit'),
  };

  return (
    <div className={`${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'} min-h-screen`}>
      <MenuBar items={menuItems} />
      <ShortcutManager shortcuts={shortcuts} />
      
      {/* Contenu principal avec menu contextuel */}
      <div className="p-8">
        <RightClickMenu
          items={[
            { id: 'cut', text: 'Couper', icon: '✂️', shortcut: 'Ctrl+X', action: () => executeCommand('edit.cut') },
            { id: 'copy', text: 'Copier', icon: '📋', shortcut: 'Ctrl+C', action: () => executeCommand('edit.copy') },
            { id: 'paste', text: 'Coller', icon: '📌', shortcut: 'Ctrl+V', action: () => executeCommand('edit.paste') },
            { separator: true },
            { id: 'properties', text: 'Propriétés', icon: '⚙️', action: () => executeCommand('view.properties') },
          ]}
        >
          <div className={`p-8 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg`}>
            <h1 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Système de Menu Complet VB6 Studio
            </h1>
            <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
              Clic droit pour ouvrir le menu contextuel ou utilisez la barre de menu ci-dessus.
            </p>
            <div className="space-y-2">
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                Raccourcis disponibles :
              </p>
              <ul className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} space-y-1`}>
                <li>• Ctrl+N - Nouveau fichier</li>
                <li>• Ctrl+O - Ouvrir</li>
                <li>• Ctrl+S - Enregistrer</li>
                <li>• F5 - Démarrer le débogage</li>
                <li>• F7 - Voir le code</li>
                <li>• F4 - Propriétés</li>
                <li>• Et beaucoup d'autres...</li>
              </ul>
            </div>
          </div>
        </RightClickMenu>
      </div>
    </div>
  );
};

export default {
  MenuProvider,
  MenuBar,
  ContextMenu,
  RightClickMenu,
  useKeyboardShortcuts,
  ShortcutManager,
  CompleteMenuSystem,
};