import React, { useState, useEffect, useCallback } from 'react';
import { useVB6Store } from '../../stores/vb6Store';
import { VB6Control } from '../../types/vb6';

interface ADODCControlProps {
  control: VB6Control;
}

export const ADODCControl: React.FC<ADODCControlProps> = ({ control }) => {
  const updateControl = useVB6Store((state) => state.updateControl);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [recordset, setRecordset] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [editMode, setEditMode] = useState<'None' | 'Edit' | 'AddNew'>('None');

  // Propriétés ADO spécifiques
  const connectionString = control.properties?.connectionString || '';
  const recordSource = control.properties?.recordSource || '';
  const caption = control.properties?.caption || 'ADODC1';
  const commandType = control.properties?.commandType || 8; // adCmdUnknown
  const cursorLocation = control.properties?.cursorLocation || 3; // adUseClient
  const cursorType = control.properties?.cursorType || 1; // adOpenKeyset
  const lockType = control.properties?.lockType || 3; // adLockOptimistic
  const bofAction = control.properties?.bofAction || 0; // adDoMoveFirst
  const eofAction = control.properties?.eofAction || 0; // adDoMoveLast
  const orientation = control.properties?.orientation || 0; // Horizontal

  // Connexion à la base de données
  useEffect(() => {
    if (connectionString && recordSource) {
      console.log('ADO Connection:', connectionString);
      console.log('Record Source:', recordSource);
      setIsConnected(true);
      
      // Simuler des données ADO
      setRecordset([
        { id: 1, CustomerName: 'Microsoft Corp.', City: 'Redmond', Country: 'USA' },
        { id: 2, CustomerName: 'Apple Inc.', City: 'Cupertino', Country: 'USA' },
        { id: 3, CustomerName: 'Google LLC', City: 'Mountain View', Country: 'USA' },
        { id: 4, CustomerName: 'Amazon.com', City: 'Seattle', Country: 'USA' },
      ]);
    }
  }, [connectionString, recordSource]);

  // Navigation methods
  const moveFirst = useCallback(() => {
    setCurrentIndex(0);
    updateControl(control.id, { 
      properties: { 
        ...control.properties, 
        absolutePosition: 1,
        bof: false,
        eof: false 
      } 
    });
  }, [control.id, control.properties, updateControl]);

  const moveLast = useCallback(() => {
    setCurrentIndex(recordset.length - 1);
    updateControl(control.id, { 
      properties: { 
        ...control.properties, 
        absolutePosition: recordset.length,
        bof: false,
        eof: false 
      } 
    });
  }, [recordset.length, control.id, control.properties, updateControl]);

  const addNew = useCallback(() => {
    setEditMode('AddNew');
    // Ajouter un nouvel enregistrement vide
    const newRecord = { id: recordset.length + 1, CustomerName: '', City: '', Country: '' };
    setRecordset([...recordset, newRecord]);
    setCurrentIndex(recordset.length);
  }, [recordset]);

  const movePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      updateControl(control.id, { 
        properties: { 
          ...control.properties, 
          absolutePosition: currentIndex,
          bof: false,
          eof: false 
        } 
      });
    } else {
      updateControl(control.id, { 
        properties: { 
          ...control.properties, 
          bof: true 
        } 
      });
      if (bofAction === 0) { // adDoMoveFirst
        moveFirst();
      }
    }
  }, [currentIndex, control.id, control.properties, updateControl, bofAction, moveFirst]);

  const moveNext = useCallback(() => {
    if (currentIndex < recordset.length - 1) {
      setCurrentIndex(currentIndex + 1);
      updateControl(control.id, { 
        properties: { 
          ...control.properties, 
          absolutePosition: currentIndex + 2,
          bof: false,
          eof: false 
        } 
      });
    } else {
      updateControl(control.id, { 
        properties: { 
          ...control.properties, 
          eof: true 
        } 
      });
      if (eofAction === 0) { // adDoMoveLast
        moveLast();
      } else if (eofAction === 2) { // adDoAddNew
        addNew();
      }
    }
  }, [currentIndex, recordset.length, control.id, control.properties, updateControl, eofAction, moveLast, addNew]);

  const updateRecord = () => {
    setEditMode('None');
    // Sauvegarder les modifications
    console.log('Saving record changes...');
  };

  const cancelUpdate = () => {
    setEditMode('None');
    // Annuler les modifications
    if (editMode === 'AddNew') {
      setRecordset(recordset.slice(0, -1));
      setCurrentIndex(Math.max(0, currentIndex - 1));
    }
  };

  const deleteRecord = () => {
    if (recordset.length > 0) {
      const newRecordset = [...recordset];
      newRecordset.splice(currentIndex, 1);
      setRecordset(newRecordset);
      if (currentIndex >= newRecordset.length) {
        setCurrentIndex(Math.max(0, newRecordset.length - 1));
      }
    }
  };

  const style: React.CSSProperties = {
    position: 'absolute',
    left: control.x,
    top: control.y,
    width: control.width,
    height: control.height || (orientation === 0 ? 32 : 100),
    backgroundColor: control.properties?.backColor || '#8080FF',
    border: control.properties?.appearance === 0 ? '1px solid #000' : '2px inset #ccc',
    display: 'flex',
    flexDirection: orientation === 0 ? 'row' : 'column',
    alignItems: 'center',
    padding: '2px',
    fontFamily: control.properties?.font?.name || 'MS Sans Serif',
    fontSize: control.properties?.font?.size || 8,
    color: control.properties?.foreColor || '#000000',
    visibility: control.visible ? 'visible' : 'hidden',
    cursor: control.enabled ? 'default' : 'not-allowed',
    opacity: control.enabled ? 1 : 0.5,
  };

  const buttonStyle: React.CSSProperties = {
    width: orientation === 0 ? '24px' : '90%',
    height: orientation === 0 ? '24px' : '24px',
    border: '1px outset #ccc',
    backgroundColor: '#C0C0C0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '14px',
    margin: orientation === 0 ? '0 1px' : '1px 0',
    fontFamily: 'Arial',
    userSelect: 'none',
  };

  const captionStyle: React.CSSProperties = {
    flex: orientation === 0 ? 1 : 'none',
    width: orientation === 0 ? 'auto' : '100%',
    textAlign: 'center',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    padding: '0 4px',
  };

  const renderButtons = () => {
    const buttons = [
      { onClick: moveFirst, title: 'Move First', icon: '⏮' },
      { onClick: movePrevious, title: 'Move Previous', icon: '◀' },
      { onClick: moveNext, title: 'Move Next', icon: '▶' },
      { onClick: moveLast, title: 'Move Last', icon: '⏭' },
    ];

    return buttons.map((btn, index) => (
      <button
        key={index}
        style={buttonStyle}
        onClick={btn.onClick}
        title={btn.title}
        disabled={!control.enabled || !isConnected}
      >
        {btn.icon}
      </button>
    ));
  };

  return (
    <div style={style}>
      {orientation === 0 && renderButtons()}
      <div style={captionStyle}>
        {caption} {isConnected && recordset.length > 0 ? `[${currentIndex + 1} / ${recordset.length}]` : '[No records]'}
      </div>
      {orientation === 1 && renderButtons()}
    </div>
  );
};