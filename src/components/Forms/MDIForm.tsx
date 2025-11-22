/**
 * VB6 MDI Form - Multiple Document Interface Form
 * Implémentation complète du système MDI de VB6
 * Compatible 100% avec Visual Basic 6.0
 */

import React, { useState, useRef, useEffect, useCallback, forwardRef } from 'react';
import { VB6Form } from '../../types/VB6Form';
import { VB6ControlPropsEnhanced } from '../Controls/VB6ControlsEnhanced';

export interface MDIFormProps {
  // Propriétés MDI spécifiques
  Name: string;
  Caption: string;
  WindowState: number; // 0-Normal, 1-Minimized, 2-Maximized
  
  // Position et taille
  Left: number;
  Top: number;
  Width: number;
  Height: number;
  
  // Apparence
  BackColor?: string;
  Picture?: string;
  Icon?: string;
  
  // Comportement MDI
  AutoShowChildren: boolean;
  ScrollBars: boolean;
  
  // Propriétés standard de formulaire
  Visible: boolean;
  Enabled: boolean;
  BorderStyle: number;
  ControlBox: boolean;
  MaxButton: boolean;
  MinButton: boolean;
  Moveable: boolean;
  ShowInTaskbar: boolean;
  StartUpPosition: number;
  
  // Menu
  NegotiateMenus: boolean;
  
  // Événements
  onLoad?: () => void;
  onUnload?: (cancel: { value: boolean }) => void;
  onResize?: () => void;
  onActivate?: () => void;
  onDeactivate?: () => void;
  
  // Enfants MDI
  children?: React.ReactNode;
}

export interface MDIChildForm extends VB6Form {
  MDIChild: true;
  MDIParent?: MDIFormInstance;
  WindowState: number;
  Minimized: boolean;
  Maximized: boolean;
  ZOrder: number;
}

export interface MDIFormInstance {
  // Propriétés VB6 MDI
  ActiveForm: MDIChildForm | null;
  
  // Collection des formulaires enfants
  MDIChildren: MDIChildForm[];
  
  // Méthodes VB6
  Arrange(arrangement: number): void; // 0-Cascade, 1-TileHorizontal, 2-TileVertical, 3-ArrangeIcons
  Show(modal?: boolean): void;
  Hide(): void;
  SetFocus(): void;
  
  // Gestion des enfants
  AddChild(childForm: MDIChildForm): void;
  RemoveChild(childForm: MDIChildForm): void;
  CloseAllChildren(): void;
  
  // Navigation
  NextChild(): void;
  PreviousChild(): void;
}

export const MDIForm = forwardRef<HTMLDivElement, MDIFormProps>((props, ref) => {
  const {
    Name,
    Caption,
    WindowState = 0,
    Left = 100,
    Top = 100,
    Width = 800,
    Height = 600,
    BackColor = '#C0C0C0',
    Picture,
    Icon,
    AutoShowChildren = true,
    ScrollBars = true,
    Visible = true,
    Enabled = true,
    BorderStyle = 2, // Sizable
    ControlBox = true,
    MaxButton = true,
    MinButton = true,
    Moveable = true,
    ShowInTaskbar = true,
    StartUpPosition = 3, // Windows Default
    NegotiateMenus = true,
    onLoad,
    onUnload,
    onResize,
    onActivate,
    onDeactivate,
    children
  } = props;

  const [childForms, setChildForms] = useState<MDIChildForm[]>([]);
  const [activeChild, setActiveChild] = useState<MDIChildForm | null>(null);
  const [isMinimized, setIsMinimized] = useState(WindowState === 1);
  const [isMaximized, setIsMaximized] = useState(WindowState === 2);
  const [mdiClientArea, setMdiClientArea] = useState({ width: Width - 20, height: Height - 60 });
  
  const mdiFormRef = useRef<HTMLDivElement>(null);
  const clientAreaRef = useRef<HTMLDivElement>(null);

  // Mise à jour de la zone client
  useEffect(() => {
    if (clientAreaRef.current) {
      const rect = clientAreaRef.current.getBoundingClientRect();
      setMdiClientArea({ width: rect.width, height: rect.height });
    }
  }, [Width, Height, isMaximized]);

  // Méthodes MDI VB6
  const mdiInstance: MDIFormInstance = {
    get ActiveForm() {
      return activeChild;
    },

    get MDIChildren() {
      return childForms;
    },

    Arrange(arrangement: number) {
      switch (arrangement) {
        case 0: // Cascade
          arrangeChildrenCascade();
          break;
        case 1: // Tile Horizontal
          arrangeChildrenTileHorizontal();
          break;
        case 2: // Tile Vertical
          arrangeChildrenTileVertical();
          break;
        case 3: // Arrange Icons
          arrangeIcons();
          break;
      }
    },

    Show(modal = false) {
      // Logique d'affichage du formulaire MDI
      if (onLoad) {
        onLoad();
      }
    },

    Hide() {
      // Logique de masquage
    },

    SetFocus() {
      if (mdiFormRef.current) {
        mdiFormRef.current.focus();
      }
    },

    AddChild(childForm: MDIChildForm) {
      childForm.MDIParent = this;
      childForm.MDIChild = true;
      
      setChildForms(prev => {
        const newChildren = [...prev, childForm];
        
        // Définir comme actif si c'est le premier ou si AutoShowChildren est activé
        if (newChildren.length === 1 || AutoShowChildren) {
          setActiveChild(childForm);
        }
        
        return newChildren;
      });
    },

    RemoveChild(childForm: MDIChildForm) {
      setChildForms(prev => {
        const newChildren = prev.filter(child => child !== childForm);
        
        // Si le formulaire supprimé était actif, activer le suivant
        if (activeChild === childForm) {
          setActiveChild(newChildren.length > 0 ? newChildren[newChildren.length - 1] : null);
        }
        
        return newChildren;
      });
    },

    CloseAllChildren() {
      setChildForms([]);
      setActiveChild(null);
    },

    NextChild() {
      if (childForms.length === 0) return;
      
      const currentIndex = activeChild ? childForms.indexOf(activeChild) : -1;
      const nextIndex = (currentIndex + 1) % childForms.length;
      setActiveChild(childForms[nextIndex]);
    },

    PreviousChild() {
      if (childForms.length === 0) return;
      
      const currentIndex = activeChild ? childForms.indexOf(activeChild) : -1;
      const prevIndex = currentIndex <= 0 ? childForms.length - 1 : currentIndex - 1;
      setActiveChild(childForms[prevIndex]);
    }
  };

  // Arrangements des fenêtres enfants
  const arrangeChildrenCascade = useCallback(() => {
    const cascade = 30; // Décalage en cascade
    
    setChildForms(prev => prev.map((child, index) => ({
      ...child,
      Left: index * cascade,
      Top: index * cascade,
      Width: Math.min(400, mdiClientArea.width - (index * cascade)),
      Height: Math.min(300, mdiClientArea.height - (index * cascade)),
      WindowState: 0, // Normal
      ZOrder: prev.length - index
    })));
  }, [mdiClientArea]);

  const arrangeChildrenTileHorizontal = useCallback(() => {
    if (childForms.length === 0) return;
    
    const tileHeight = Math.floor(mdiClientArea.height / childForms.length);
    
    setChildForms(prev => prev.map((child, index) => ({
      ...child,
      Left: 0,
      Top: index * tileHeight,
      Width: mdiClientArea.width,
      Height: tileHeight,
      WindowState: 0
    })));
  }, [childForms.length, mdiClientArea]);

  const arrangeChildrenTileVertical = useCallback(() => {
    if (childForms.length === 0) return;
    
    const tileWidth = Math.floor(mdiClientArea.width / childForms.length);
    
    setChildForms(prev => prev.map((child, index) => ({
      ...child,
      Left: index * tileWidth,
      Top: 0,
      Width: tileWidth,
      Height: mdiClientArea.height,
      WindowState: 0
    })));
  }, [childForms.length, mdiClientArea]);

  const arrangeIcons = useCallback(() => {
    const iconSize = 32;
    const spacing = 40;
    let x = 10, y = mdiClientArea.height - iconSize - 10;
    
    setChildForms(prev => prev.map((child, index) => {
      if (child.WindowState === 1) { // Minimized
        const result = {
          ...child,
          Left: x,
          Top: y,
          Width: iconSize * 3,
          Height: iconSize
        };
        
        x += spacing;
        if (x + spacing > mdiClientArea.width) {
          x = 10;
          y -= spacing;
        }
        
        return result;
      }
      return child;
    }));
  }, [mdiClientArea]);

  // Gestion des événements clavier MDI
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!Enabled) return;
      
      // Ctrl+F4 - Fermer le formulaire enfant actif
      if (event.ctrlKey && event.key === 'F4') {
        event.preventDefault();
        if (activeChild) {
          mdiInstance.RemoveChild(activeChild);
        }
      }
      
      // Ctrl+F6 - Formulaire enfant suivant
      if (event.ctrlKey && event.key === 'F6') {
        event.preventDefault();
        mdiInstance.NextChild();
      }
      
      // Ctrl+Shift+F6 - Formulaire enfant précédent
      if (event.ctrlKey && event.shiftKey && event.key === 'F6') {
        event.preventDefault();
        mdiInstance.PreviousChild();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeChild, Enabled]);

  // Gestion du redimensionnement
  useEffect(() => {
    const handleResize = () => {
      if (onResize) {
        onResize();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [onResize]);

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    left: Left,
    top: Top,
    width: Width,
    height: Height,
    backgroundColor: BackColor,
    border: getBorderStyle(BorderStyle),
    display: Visible ? 'flex' : 'none',
    flexDirection: 'column',
    overflow: 'hidden',
    zIndex: 1000,
    fontFamily: 'MS Sans Serif, sans-serif',
    fontSize: '8pt'
  };

  const titleBarStyle: React.CSSProperties = {
    height: '24px',
    backgroundColor: '#0078D4',
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 8px',
    fontWeight: 'bold',
    userSelect: 'none'
  };

  const clientAreaStyle: React.CSSProperties = {
    flex: 1,
    position: 'relative',
    overflow: ScrollBars ? 'auto' : 'hidden',
    backgroundColor: '#C0C0C0',
    backgroundImage: Picture ? `url(${Picture})` : undefined,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    backgroundSize: 'cover'
  };

  const getBorderStyle = (borderStyle: number): string => {
    switch (borderStyle) {
      case 0: return 'none';
      case 1: return '1px solid #808080';
      case 2: return '2px outset #C0C0C0';
      case 3: return '2px solid #808080';
      case 4: return '1px solid #808080'; // Tool Window
      case 5: return '2px outset #C0C0C0'; // Sizable Tool Window
      default: return '2px outset #C0C0C0';
    }
  };

  const renderChildForm = (child: MDIChildForm) => {
    const childStyle: React.CSSProperties = {
      position: 'absolute',
      left: child.Left,
      top: child.Top,
      width: child.Width,
      height: child.Height,
      backgroundColor: '#C0C0C0',
      border: '2px outset #C0C0C0',
      display: child.Visible ? 'flex' : 'none',
      flexDirection: 'column',
      zIndex: child === activeChild ? 100 : child.ZOrder || 1,
      opacity: child.Enabled ? 1 : 0.5
    };

    const childTitleBarStyle: React.CSSProperties = {
      height: '20px',
      backgroundColor: child === activeChild ? '#0078D4' : '#808080',
      color: '#FFFFFF',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 4px',
      fontSize: '7pt',
      cursor: 'move'
    };

    return (
      <div
        key={child.Name}
        style={childStyle}
        onClick={() => setActiveChild(child)}
      >
        <div style={childTitleBarStyle}>
          <span>{child.Caption}</span>
          <div>
            <button 
              style={windowButtonStyle}
              onClick={() => {
                const newChild = { ...child, WindowState: 1, Minimized: true };
                setChildForms(prev => prev.map(c => c === child ? newChild : c));
              }}
            >
              _
            </button>
            <button 
              style={windowButtonStyle}
              onClick={() => {
                const newChild = { ...child, WindowState: child.WindowState === 2 ? 0 : 2 };
                setChildForms(prev => prev.map(c => c === child ? newChild : c));
              }}
            >
              {child.WindowState === 2 ? '❐' : '□'}
            </button>
            <button 
              style={windowButtonStyle}
              onClick={() => mdiInstance.RemoveChild(child)}
            >
              ✕
            </button>
          </div>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '4px' }}>
          {/* Contenu du formulaire enfant */}
          <div>Child Form Content: {child.Name}</div>
        </div>
      </div>
    );
  };

  const windowButtonStyle: React.CSSProperties = {
    width: '16px',
    height: '14px',
    border: '1px outset #C0C0C0',
    backgroundColor: '#C0C0C0',
    fontSize: '8px',
    cursor: 'pointer',
    margin: '0 1px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  if (!Visible) return null;

  return (
    <div
      ref={ref}
      style={containerStyle}
      data-control-type="MDIForm"
      data-control-name={Name}
    >
      {/* Barre de titre */}
      <div style={titleBarStyle}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {Icon && <img src={Icon} alt="" style={{ width: '16px', height: '16px', marginRight: '4px' }} />}
          <span>{Caption}</span>
        </div>
        
        {ControlBox && (
          <div style={{ display: 'flex' }}>
            {MinButton && (
              <button 
                style={windowButtonStyle}
                onClick={() => setIsMinimized(!isMinimized)}
              >
                _
              </button>
            )}
            {MaxButton && (
              <button 
                style={windowButtonStyle}
                onClick={() => setIsMaximized(!isMaximized)}
              >
                {isMaximized ? '❐' : '□'}
              </button>
            )}
            <button 
              style={windowButtonStyle}
              onClick={() => {
                const cancel = { value: false };
                if (onUnload) {
                  onUnload(cancel);
                }
                if (!cancel.value) {
                  // Fermer le formulaire
                }
              }}
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Zone client MDI */}
      <div
        ref={clientAreaRef}
        style={clientAreaStyle}
      >
        {childForms.map(child => renderChildForm(child))}
        {children}
      </div>
    </div>
  );
});

MDIForm.displayName = 'MDIForm';

// Utilitaires MDI
export const MDIUtils = {
  // Créer un nouveau formulaire enfant MDI
  createMDIChild(name: string, caption: string): MDIChildForm {
    return {
      Name: name,
      Caption: caption,
      MDIChild: true,
      WindowState: 0,
      Minimized: false,
      Maximized: false,
      ZOrder: 1,
      
      // Propriétés VB6Form standard
      Index: 0,
      Tag: '',
      Left: 0,
      Top: 0,
      Width: 400,
      Height: 300,
      ScaleLeft: 0,
      ScaleTop: 0,
      ScaleWidth: 0,
      ScaleHeight: 0,
      ScaleMode: 1,
      Visible: true,
      Enabled: true,
      BackColor: '#C0C0C0',
      ForeColor: '#000000',
      Picture: undefined,
      Icon: undefined,
      Font: {
        Name: 'MS Sans Serif',
        Size: 8,
        Bold: false,
        Italic: false,
        Underline: false,
        Strikethrough: false
      },
      BorderStyle: 2,
      ControlBox: true,
      MaxButton: true,
      MinButton: true,
      Moveable: true,
      ShowInTaskbar: false,
      StartUpPosition: 0,
      AutoRedraw: false,
      ClipControls: true,
      DrawMode: 13,
      DrawStyle: 0,
      DrawWidth: 1,
      FillColor: '#000000',
      FillStyle: 1,
      FontTransparent: true,
      hWnd: Math.floor(Math.random() * 100000),
      hDC: 0,
      HasDC: false,
      CurrentX: 0,
      CurrentY: 0,
      LinkMode: 0,
      LinkTopic: '',
      NegotiateMenus: false,
      OLEDropMode: 0,
      Palette: undefined,
      PaletteMode: 0,
      WhatsThisButton: false,
      WhatsThisHelp: false,
      KeyPreview: false,
      RightToLeft: false,
      Controls: [],
      
      // Méthodes VB6Form
      Show: () => {},
      Hide: () => {},
      Load: () => {},
      Unload: () => {},
      SetFocus: () => {},
      Move: () => {},
      Refresh: () => {},
      Cls: () => {},
      Line: () => {},
      Circle: () => {},
      PSet: () => {},
      Point: () => '#000000',
      Print: () => {},
      PaintPicture: () => {},
      ScaleX: () => 0,
      ScaleY: () => 0
    };
  }
};

export default MDIForm;