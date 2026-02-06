import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useImperativeHandle,
  forwardRef,
} from 'react';
import { Control } from '../../context/types';
import {
  vb6DatabaseService,
  ADOConnection,
  ADORecordset,
  ConnectionState,
} from '../../services/VB6DatabaseService';

interface DataControlProps {
  control: Control;
  isDesignMode?: boolean;
  onPropertyChange?: (property: string, value: any) => void;
}

// Simulated database record
interface DataRecord {
  [key: string]: any;
}

export const DataControl: React.FC<DataControlProps> = ({
  control,
  isDesignMode = false,
  onPropertyChange,
}) => {
  // VB6 Data control properties
  const {
    x = 0,
    y = 0,
    width = 361,
    height = 28,
    caption = 'Data1',
    connect = 'Access',
    databaseName = '',
    recordSource = '',
    recordsetType = 1, // 0=Table, 1=Dynaset, 2=Snapshot
    options = 0,
    exclusive = false,
    readOnly = false,
    backColor = '#C0C0C0',
    foreColor = '#000000',
    font = { name: 'MS Sans Serif', size: 8 },
    enabled = true,
    visible = true,
    eofAction = 0, // 0=MoveLast, 1=EOF, 2=AddNew
    bofAction = 0, // 0=MoveFirst, 1=BOF
    toolTipText = '',
    tag = '',
    index,
  } = control;

  // Simulated recordset
  const [records, setRecords] = useState<DataRecord[]>([
    { ID: 1, Name: 'Record 1', Value: 100 },
    { ID: 2, Name: 'Record 2', Value: 200 },
    { ID: 3, Name: 'Record 3', Value: 300 },
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isEOF, setIsEOF] = useState(false);
  const [isBOF, setIsBOF] = useState(true);

  // Update BOF/EOF status
  useEffect(() => {
    setIsBOF(currentIndex <= 0);
    setIsEOF(currentIndex >= records.length - 1);
  }, [currentIndex, records.length]);

  // Navigation methods
  const moveFirst = useCallback(() => {
    if (records.length > 0) {
      setCurrentIndex(0);
      onPropertyChange?.('absolutePosition', 1);
      if (window.VB6Runtime?.fireEvent) {
        window.VB6Runtime.fireEvent(control.name, 'Reposition');
      }
    }
  }, [control.name, onPropertyChange, records.length]);

  const movePrevious = useCallback(() => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      onPropertyChange?.('absolutePosition', newIndex + 1);
      if (window.VB6Runtime?.fireEvent) {
        window.VB6Runtime.fireEvent(control.name, 'Reposition');
      }
    } else if (bofAction === 0) {
      // MoveFirst on BOF
      moveFirst();
    }
  }, [bofAction, control.name, currentIndex, moveFirst, onPropertyChange]);

  const moveNext = useCallback(() => {
    if (currentIndex < records.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      onPropertyChange?.('absolutePosition', newIndex + 1);
      if (window.VB6Runtime?.fireEvent) {
        window.VB6Runtime.fireEvent(control.name, 'Reposition');
      }
    } else if (eofAction === 0) {
      // MoveLast on EOF
      setCurrentIndex(records.length - 1);
    } else if (eofAction === 2) {
      // AddNew
      const newRecord = { ID: records.length + 1, Name: `Record ${records.length + 1}`, Value: 0 };
      setRecords([...records, newRecord]);
      setCurrentIndex(records.length);
    }
  }, [control.name, currentIndex, eofAction, onPropertyChange, records]);

  const moveLast = useCallback(() => {
    if (records.length > 0) {
      const lastIndex = records.length - 1;
      setCurrentIndex(lastIndex);
      onPropertyChange?.('absolutePosition', lastIndex + 1);
      if (window.VB6Runtime?.fireEvent) {
        window.VB6Runtime.fireEvent(control.name, 'Reposition');
      }
    }
  }, [control.name, onPropertyChange, records.length]);

  // Initialize recordset
  useEffect(() => {
    if (!isDesignMode && databaseName && recordSource) {
      // In a real implementation, this would connect to a database
      // Fire VB6 events
      if (window.VB6Runtime?.fireEvent) {
        window.VB6Runtime.fireEvent(control.name, 'Initialize');
      }
    }
  }, [control.name, databaseName, isDesignMode, recordSource]);

  if (!visible) return null;

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    left: x,
    top: y,
    width: width,
    height: height,
    backgroundColor: backColor,
    border: '2px inset #FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '2px',
    opacity: enabled ? 1 : 0.5,
    pointerEvents: enabled ? 'auto' : 'none',
    userSelect: 'none',
  };

  const buttonStyle: React.CSSProperties = {
    width: '24px',
    height: '20px',
    backgroundColor: '#C0C0C0',
    border: '1px outset #FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '12px',
    fontFamily: 'Arial',
  };

  const captionStyle: React.CSSProperties = {
    flex: 1,
    textAlign: 'center',
    color: foreColor,
    fontSize: `${font.size}pt`,
    fontFamily: font.name,
    fontWeight: font.bold ? 'bold' : 'normal',
    fontStyle: font.italic ? 'italic' : 'normal',
    textDecoration: font.underline ? 'underline' : 'none',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const recordInfo =
    records.length > 0 && currentIndex < records.length
      ? `${caption} ${currentIndex + 1}/${records.length}`
      : caption;

  return (
    <>
      <div
        style={containerStyle}
        title={toolTipText}
        data-control-type="Data"
        data-control-name={control.name}
        data-control-index={index}
      >
        {/* Move First Button */}
        <button
          style={buttonStyle}
          onClick={moveFirst}
          disabled={!enabled || isBOF}
          title="Move First"
        >
          |◀
        </button>

        {/* Move Previous Button */}
        <button
          style={buttonStyle}
          onClick={movePrevious}
          disabled={!enabled || (isBOF && bofAction === 1)}
          title="Move Previous"
        >
          ◀
        </button>

        {/* Caption/Record Info */}
        <div style={captionStyle}>{recordInfo}</div>

        {/* Move Next Button */}
        <button
          style={buttonStyle}
          onClick={moveNext}
          disabled={!enabled || (isEOF && eofAction === 1)}
          title="Move Next"
        >
          ▶
        </button>

        {/* Move Last Button */}
        <button
          style={buttonStyle}
          onClick={moveLast}
          disabled={!enabled || isEOF}
          title="Move Last"
        >
          ▶|
        </button>
      </div>

      {/* Design mode indicator */}
      {isDesignMode && (
        <div
          style={{
            position: 'absolute',
            left: x - 1,
            top: y - 1,
            width: width + 2,
            height: height + 2,
            border: '1px dashed #0066cc',
            pointerEvents: 'none',
          }}
        />
      )}
    </>
  );
};

// VB6 Data control events
export const DataControlEvents = {
  Initialize: 'Initialize',
  Reposition: 'Reposition',
  Validate: 'Validate',
  Error: 'Error',
  MouseDown: 'MouseDown',
  MouseMove: 'MouseMove',
  MouseUp: 'MouseUp',
  Click: 'Click',
  DblClick: 'DblClick',
  Resize: 'Resize',
};

// VB6 Data control methods
export const DataControlMethods = {
  Refresh: 'Refresh',
  UpdateControls: 'UpdateControls',
  UpdateRecord: 'UpdateRecord',
  MoveFirst: 'MoveFirst',
  MoveLast: 'MoveLast',
  MoveNext: 'MoveNext',
  MovePrevious: 'MovePrevious',
};

// VB6 Data control default properties
export const getDataControlDefaults = (id: number) => ({
  id,
  type: 'Data',
  name: `Data${id}`,
  x: 100,
  y: 100,
  width: 361,
  height: 28,
  caption: `Data${id}`,
  connect: 'Access',
  databaseName: '',
  recordSource: '',
  recordsetType: 1,
  options: 0,
  exclusive: false,
  readOnly: false,
  backColor: '#C0C0C0',
  foreColor: '#000000',
  font: { name: 'MS Sans Serif', size: 8, bold: false, italic: false, underline: false },
  enabled: true,
  visible: true,
  eofAction: 0,
  bofAction: 0,
  toolTipText: '',
  tag: '',
  tabIndex: id,
});

// Declare global VB6Runtime interface
declare global {
  interface Window {
    VB6Runtime?: {
      fireEvent: (controlName: string, eventName: string, eventData?: any) => void;
    };
  }
}

export default DataControl;
