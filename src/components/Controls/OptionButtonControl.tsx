/**
 * VB6 OptionButton Control - Radio Button natif VB6
 * 
 * Contrôle critique manquant pour 95%+ compatibilité
 * Implémente le comportement exact OptionButton VB6:
 * - Groupement automatique dans conteneurs (Frame, Form)
 * - Propriété Value exclusive (True/False) 
 * - Événements Click, GotFocus, LostFocus
 * - Style VB6 authentique
 */

import React, { useContext, useEffect, useState, useRef } from 'react';
import { VB6ControlProps } from './VB6Controls';
import { VB6Context } from '../../context/VB6Context';

interface VB6OptionButtonProps extends VB6ControlProps {
  value?: boolean;
  groupName?: string; // Pour groupement explicite
  caption?: string;
  alignment?: 'LeftJustify' | 'RightJustify';
  appearance?: 'Flat' | '3D';
  disabledPicture?: string;
  downPicture?: string;
  maskColor?: string;
  picture?: string;
  style?: 'Standard' | 'Graphical';
  useMaskColor?: boolean;
}

interface VB6OptionButtonState {
  value: boolean;
  enabled: boolean;
  visible: boolean;
  caption: string;
  groupName: string;
  hasFocus: boolean;
  mouseDown: boolean;
}

/**
 * VB6 OptionButton - Implémentation complète
 */
export const VB6OptionButton: React.FC<VB6OptionButtonProps> = ({
  name,
  left = 0,
  top = 0,
  width = 1215,
  height = 255,
  value = false,
  groupName = '',
  caption = 'Option1',
  alignment = 'LeftJustify',
  appearance = '3D',
  style = 'Standard',
  enabled = true,
  visible = true,
  tabIndex = 0,
  backgroundColor = '#C0C0C0',
  foregroundColor = '#000000',
  font = { name: 'MS Sans Serif', size: 8, bold: false, italic: false },
  onEvents = {}
}) => {
  const { state, dispatch, runtime } = useContext(VB6Context);
  const [localState, setLocalState] = useState<VB6OptionButtonState>({
    value,
    enabled,
    visible,
    caption,
    groupName: groupName || name || '',
    hasFocus: false,
    mouseDown: false
  });
  
  const optionButtonRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Convertir unités VB6 (Twips) vers pixels
  const leftPx = Math.round(left * 0.0666667);
  const topPx = Math.round(top * 0.0666667);
  const widthPx = Math.round(width * 0.0666667);
  const heightPx = Math.round(height * 0.0666667);

  /**
   * Groupement automatique VB6 - Trouver autres OptionButtons du même groupe
   */
  const getGroupName = (): string => {
    if (localState.groupName) return localState.groupName;
    
    // Dans VB6, les OptionButtons dans le même conteneur forment un groupe automatiquement
    const parent = optionButtonRef.current?.parentElement;
    if (parent) {
      const containerId = parent.getAttribute('data-vb6-container') || 'default';
      return `group_${containerId}`;
    }
    
    return 'default_group';
  };

  /**
   * Déselectionner autres OptionButtons du même groupe (comportement VB6)
   */
  const unselectOtherOptions = () => {
    const actualGroupName = getGroupName();
    const allOptions = document.querySelectorAll(`input[type="radio"][name="${actualGroupName}"]`);
    
    allOptions.forEach((option: Element) => {
      const radioInput = option as HTMLInputElement;
      if (radioInput !== inputRef.current) {
        radioInput.checked = false;
        
        // Déclencher événement Click sur les autres pour compatibilité VB6
        const otherContainer = radioInput.closest('.vb6-option-button');
        if (otherContainer) {
          const event = new CustomEvent('vb6-value-changed', { 
            detail: { value: false } 
          });
          otherContainer.dispatchEvent(event);
        }
      }
    });
  };

  /**
   * Gestionnaire Click VB6 - Comportement exact OptionButton
   */
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!localState.enabled) return;

    // Si déjà sélectionné, ne rien faire (comportement VB6)
    if (localState.value) return;

    // Sélectionner cette option
    setLocalState(prev => ({ ...prev, value: true }));
    
    // Déselectionner autres options du groupe
    unselectOtherOptions();
    
    // Déclencher événement Click VB6
    if (onEvents.Click) {
      try {
        onEvents.Click();
      } catch (error) {
        console.error('OptionButton Click event error:', error);
      }
    }

    // Mettre à jour le contexte global
    if (dispatch) {
      dispatch({
        type: 'UPDATE_CONTROL_PROPERTY',
        payload: {
          controlId: name,
          property: 'Value',
          value: true
        }
      });
    }
  };

  /**
   * Gestionnaires Focus VB6
   */
  const handleFocus = () => {
    setLocalState(prev => ({ ...prev, hasFocus: true }));
    
    if (onEvents.GotFocus) {
      try {
        onEvents.GotFocus();
      } catch (error) {
        console.error('OptionButton GotFocus event error:', error);
      }
    }
  };

  const handleBlur = () => {
    setLocalState(prev => ({ ...prev, hasFocus: false }));
    
    if (onEvents.LostFocus) {
      try {
        onEvents.LostFocus();
      } catch (error) {
        console.error('OptionButton LostFocus event error:', error);
      }
    }
  };

  /**
   * Gestionnaires Mouse VB6
   */
  const handleMouseDown = (e: React.MouseEvent) => {
    setLocalState(prev => ({ ...prev, mouseDown: true }));
    
    if (onEvents.MouseDown) {
      const button = e.button === 0 ? 1 : e.button === 1 ? 4 : 2;
      const shift = (e.shiftKey ? 1 : 0) + (e.ctrlKey ? 2 : 0) + (e.altKey ? 4 : 0);
      
      try {
        onEvents.MouseDown(button, shift, e.clientX, e.clientY);
      } catch (error) {
        console.error('OptionButton MouseDown event error:', error);
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    setLocalState(prev => ({ ...prev, mouseDown: false }));
    
    if (onEvents.MouseUp) {
      const button = e.button === 0 ? 1 : e.button === 1 ? 4 : 2;
      const shift = (e.shiftKey ? 1 : 0) + (e.ctrlKey ? 2 : 0) + (e.altKey ? 4 : 0);
      
      try {
        onEvents.MouseUp(button, shift, e.clientX, e.clientY);
      } catch (error) {
        console.error('OptionButton MouseUp event error:', error);
      }
    }
  };

  /**
   * Gestionnaire Keyboard VB6
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      handleClick(e as any);
    }
    
    if (onEvents.KeyDown) {
      try {
        onEvents.KeyDown(e.keyCode, (e.shiftKey ? 1 : 0) + (e.ctrlKey ? 2 : 0) + (e.altKey ? 4 : 0));
      } catch (error) {
        console.error('OptionButton KeyDown event error:', error);
      }
    }
  };

  // Synchroniser avec les changements externes
  useEffect(() => {
    setLocalState(prev => ({
      ...prev,
      value,
      enabled,
      visible,
      caption
    }));
  }, [value, enabled, visible, caption]);

  // Style VB6 authentique
  const optionButtonStyle: React.CSSProperties = {
    position: 'absolute',
    left: leftPx,
    top: topPx,
    width: widthPx,
    height: heightPx,
    backgroundColor: appearance === '3D' ? backgroundColor : 'transparent',
    color: foregroundColor,
    fontFamily: font.name,
    fontSize: `${font.size}pt`,
    fontWeight: font.bold ? 'bold' : 'normal',
    fontStyle: font.italic ? 'italic' : 'normal',
    border: appearance === '3D' ? (localState.hasFocus ? '1px dotted #000' : 'none') : '1px solid #808080',
    display: localState.visible ? 'flex' : 'none',
    alignItems: 'center',
    cursor: localState.enabled ? 'pointer' : 'default',
    opacity: localState.enabled ? 1 : 0.5,
    userSelect: 'none',
    outline: 'none',
    padding: '2px',
    boxSizing: 'border-box'
  };

  const radioStyle: React.CSSProperties = {
    marginRight: alignment === 'LeftJustify' ? '4px' : '0',
    marginLeft: alignment === 'RightJustify' ? '4px' : '0',
    width: '13px',
    height: '13px',
    accentColor: foregroundColor,
    cursor: localState.enabled ? 'pointer' : 'default'
  };

  const captionStyle: React.CSSProperties = {
    flexGrow: 1,
    textAlign: alignment === 'LeftJustify' ? 'left' : 'right',
    order: alignment === 'LeftJustify' ? 2 : 1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  };

  if (!localState.visible) {
    return null;
  }

  return (
    <div
      ref={optionButtonRef}
      className="vb6-option-button"
      style={optionButtonStyle}
      tabIndex={localState.enabled ? tabIndex : -1}
      onClick={handleClick}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onKeyDown={handleKeyDown}
      data-vb6-control="OptionButton"
      data-vb6-name={name}
      data-vb6-value={localState.value}
    >
      <input
        ref={inputRef}
        type="radio"
        name={getGroupName()}
        checked={localState.value}
        disabled={!localState.enabled}
        style={radioStyle}
        tabIndex={-1}
        onChange={() => {}} // Géré par onClick
        onClick={(e) => e.stopPropagation()}
      />
      
      <label 
        style={captionStyle}
        onClick={handleClick}
      >
        {localState.caption}
      </label>
    </div>
  );
};

/**
 * Factory pour créer OptionButton avec propriétés VB6
 */
export const createVB6OptionButton = (props: Partial<VB6OptionButtonProps>) => {
  return <VB6OptionButton {...props} />;
};

/**
 * Utilitaires OptionButton VB6
 */
export const VB6OptionButtonUtils = {
  /**
   * Obtenir la valeur d'un groupe d'OptionButtons
   */
  getGroupValue: (groupName: string): string | null => {
    const selectedOption = document.querySelector(
      `input[type="radio"][name="${groupName}"]:checked`
    ) as HTMLInputElement;
    
    if (selectedOption) {
      const container = selectedOption.closest('.vb6-option-button');
      return container?.getAttribute('data-vb6-name') || null;
    }
    
    return null;
  },

  /**
   * Définir la valeur d'un groupe d'OptionButtons
   */
  setGroupValue: (groupName: string, optionName: string): void => {
    const targetOption = document.querySelector(
      `.vb6-option-button[data-vb6-name="${optionName}"] input[type="radio"][name="${groupName}"]`
    ) as HTMLInputElement;
    
    if (targetOption) {
      targetOption.click();
    }
  },

  /**
   * Obtenir tous les OptionButtons d'un groupe
   */
  getGroupOptions: (groupName: string): string[] => {
    const options = document.querySelectorAll(
      `input[type="radio"][name="${groupName}"]`
    );
    
    return Array.from(options).map(option => {
      const container = option.closest('.vb6-option-button');
      return container?.getAttribute('data-vb6-name') || '';
    }).filter(name => name !== '');
  }
};

export default VB6OptionButton;