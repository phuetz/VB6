import React, { useState, useEffect } from 'react';
import { useVB6Store } from '../../stores/vb6Store';
import { VB6Control } from '../../types/vb6';

interface DataControlProps {
  control: VB6Control;
}

export const DataControl: React.FC<DataControlProps> = ({ control }) => {
  const updateControl = useVB6Store((state) => state.updateControl);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [recordset, setRecordset] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // Propriétés spécifiques au Data Control
  const databaseName = control.properties?.databaseName || '';
  const recordSource = control.properties?.recordSource || '';
  const caption = control.properties?.caption || 'Data1';
  const connect = control.properties?.connect || '';
  const recordsetType = control.properties?.recordsetType || 1; // Dynaset par défaut
  const bofAction = control.properties?.bofAction || 0; // MoveFirst
  const eofAction = control.properties?.eofAction || 0; // MoveLast

  useEffect(() => {
    // Simuler la connexion à la base de données
    if (databaseName && recordSource) {
      // Dans une vraie implémentation, on se connecterait au serveur
      console.log('Connecting to database:', databaseName, 'with source:', recordSource);
      setIsConnected(true);
      
      // Données de démonstration
      setRecordset([
        { id: 1, name: 'Record 1', value: 100 },
        { id: 2, name: 'Record 2', value: 200 },
        { id: 3, name: 'Record 3', value: 300 },
      ]);
    }
  }, [databaseName, recordSource]);

  const moveFirst = () => {
    setCurrentIndex(0);
    updateControl(control.id, { properties: { ...control.properties, recordPosition: 0 } });
  };

  const movePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      updateControl(control.id, { properties: { ...control.properties, recordPosition: currentIndex - 1 } });
    } else if (bofAction === 0) {
      moveFirst();
    }
  };

  const moveNext = () => {
    if (currentIndex < recordset.length - 1) {
      setCurrentIndex(currentIndex + 1);
      updateControl(control.id, { properties: { ...control.properties, recordPosition: currentIndex + 1 } });
    } else if (eofAction === 0) {
      moveLast();
    } else if (eofAction === 2) {
      // AddNew
      console.log('Add new record');
    }
  };

  const moveLast = () => {
    setCurrentIndex(recordset.length - 1);
    updateControl(control.id, { properties: { ...control.properties, recordPosition: recordset.length - 1 } });
  };

  const style: React.CSSProperties = {
    position: 'absolute',
    left: control.x,
    top: control.y,
    width: control.width,
    height: control.height || 32,
    backgroundColor: control.properties?.backColor || '#8080FF',
    border: '1px solid #000',
    display: 'flex',
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
    width: '20px',
    height: '20px',
    border: '1px solid #000',
    backgroundColor: '#C0C0C0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '12px',
    marginRight: '2px',
  };

  const captionStyle: React.CSSProperties = {
    flex: 1,
    textAlign: 'center',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  return (
    <div style={style}>
      <button style={buttonStyle} onClick={moveFirst} title="First Record">
        |◀
      </button>
      <button style={buttonStyle} onClick={movePrevious} title="Previous Record">
        ◀
      </button>
      <div style={captionStyle}>
        {caption} {isConnected && recordset.length > 0 ? `(${currentIndex + 1}/${recordset.length})` : ''}
      </div>
      <button style={buttonStyle} onClick={moveNext} title="Next Record">
        ▶
      </button>
      <button style={buttonStyle} onClick={moveLast} title="Last Record">
        ▶|
      </button>
    </div>
  );
};