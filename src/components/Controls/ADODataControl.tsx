import React, { useState, useEffect, useCallback } from 'react';
import { Control } from '../../context/types';

interface ADODataControlProps {
  control: Control;
  isDesignMode?: boolean;
  onPropertyChange?: (property: string, value: any) => void;
}

// ADO Recordset simulation
interface ADORecord {
  [key: string]: any;
}

export const ADODataControl: React.FC<ADODataControlProps> = ({
  control,
  isDesignMode = false,
  onPropertyChange,
}) => {
  // VB6 ADO Data control properties
  const {
    x = 0,
    y = 0,
    width = 385,
    height = 28,
    caption = 'Adodc1',
    connectionString = '',
    commandType = 8, // 1=adCmdText, 2=adCmdTable, 4=adCmdStoredProc, 8=adCmdUnknown
    recordSource = '',
    cursorLocation = 3, // 2=adUseServer, 3=adUseClient
    cursorType = 3, // 0=adOpenForwardOnly, 1=adOpenKeyset, 2=adOpenDynamic, 3=adOpenStatic
    lockType = 3, // 1=adLockReadOnly, 2=adLockPessimistic, 3=adLockOptimistic, 4=adLockBatchOptimistic
    mode = 0, // Connection mode
    backColor = '#C0C0C0',
    foreColor = '#000000',
    font = { name: 'MS Sans Serif', size: 8 },
    enabled = true,
    visible = true,
    eofAction = 0, // 0=adDoMoveLast, 1=adStayEOF, 2=adDoAddNew
    bofAction = 0, // 0=adDoMoveFirst, 1=adStayBOF
    toolTipText = '',
    tag = '',
    index,
  } = control;

  // ADO Recordset state
  const [records, setRecords] = useState<ADORecord[]>([
    {
      CustomerID: 'ALFKI',
      CompanyName: 'Alfreds Futterkiste',
      ContactName: 'Maria Anders',
      Country: 'Germany',
    },
    {
      CustomerID: 'ANATR',
      CompanyName: 'Ana Trujillo Emparedados',
      ContactName: 'Ana Trujillo',
      Country: 'Mexico',
    },
    {
      CustomerID: 'ANTON',
      CompanyName: 'Antonio Moreno Taquería',
      ContactName: 'Antonio Moreno',
      Country: 'Mexico',
    },
    {
      CustomerID: 'AROUT',
      CompanyName: 'Around the Horn',
      ContactName: 'Thomas Hardy',
      Country: 'UK',
    },
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isEOF, setIsEOF] = useState(false);
  const [isBOF, setIsBOF] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  // Update BOF/EOF status
  useEffect(() => {
    setIsBOF(currentIndex <= 0);
    setIsEOF(currentIndex >= records.length - 1);
  }, [currentIndex, records.length]);

  // ADO Connection simulation
  useEffect(() => {
    if (!isDesignMode && connectionString) {
      setIsConnected(true);

      // Fire ADO events
      if (window.VB6Runtime?.fireEvent) {
        window.VB6Runtime.fireEvent(control.name, 'WillConnect');
        window.VB6Runtime.fireEvent(control.name, 'ConnectComplete');

        if (recordSource) {
          window.VB6Runtime.fireEvent(control.name, 'WillExecute');
          window.VB6Runtime.fireEvent(control.name, 'ExecuteComplete');
        }
      }
    }
  }, [connectionString, control.name, isDesignMode, recordSource]);

  // Navigation methods
  const moveFirst = useCallback(() => {
    if (records.length > 0) {
      const oldPosition = currentIndex;
      setCurrentIndex(0);
      onPropertyChange?.('absolutePosition', 1);

      if (window.VB6Runtime?.fireEvent) {
        window.VB6Runtime.fireEvent(control.name, 'WillMove');
        window.VB6Runtime.fireEvent(control.name, 'MoveComplete');
      }
    }
  }, [control.name, currentIndex, onPropertyChange, records.length]);

  const movePrevious = useCallback(() => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      onPropertyChange?.('absolutePosition', newIndex + 1);

      if (window.VB6Runtime?.fireEvent) {
        window.VB6Runtime.fireEvent(control.name, 'WillMove');
        window.VB6Runtime.fireEvent(control.name, 'MoveComplete');
      }
    } else if (bofAction === 0) {
      moveFirst();
    }
  }, [bofAction, control.name, currentIndex, moveFirst, onPropertyChange]);

  const moveNext = useCallback(() => {
    if (currentIndex < records.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      onPropertyChange?.('absolutePosition', newIndex + 1);

      if (window.VB6Runtime?.fireEvent) {
        window.VB6Runtime.fireEvent(control.name, 'WillMove');
        window.VB6Runtime.fireEvent(control.name, 'MoveComplete');
      }
    } else if (eofAction === 0) {
      // MoveLast on EOF
      setCurrentIndex(records.length - 1);
    } else if (eofAction === 2) {
      // AddNew
      const newRecord: ADORecord = {
        CustomerID: `NEW${records.length + 1}`,
        CompanyName: 'New Company',
        ContactName: 'New Contact',
        Country: 'Unknown',
      };
      setRecords([...records, newRecord]);
      setCurrentIndex(records.length);

      if (window.VB6Runtime?.fireEvent) {
        window.VB6Runtime.fireEvent(control.name, 'WillChangeRecord');
        window.VB6Runtime.fireEvent(control.name, 'RecordChangeComplete');
      }
    }
  }, [control.name, currentIndex, eofAction, onPropertyChange, records]);

  const moveLast = useCallback(() => {
    if (records.length > 0) {
      const lastIndex = records.length - 1;
      setCurrentIndex(lastIndex);
      onPropertyChange?.('absolutePosition', lastIndex + 1);

      if (window.VB6Runtime?.fireEvent) {
        window.VB6Runtime.fireEvent(control.name, 'WillMove');
        window.VB6Runtime.fireEvent(control.name, 'MoveComplete');
      }
    }
  }, [control.name, onPropertyChange, records.length]);

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

  const statusDot = isConnected ? '🟢' : '🔴';
  const recordInfo =
    isConnected && records.length > 0 && currentIndex < records.length
      ? `${statusDot} ${caption} [${currentIndex + 1}/${records.length}]`
      : `${statusDot} ${caption}`;

  return (
    <>
      <div
        style={containerStyle}
        title={toolTipText || `Connection: ${connectionString || 'Not connected'}`}
        data-control-type="ADODataControl"
        data-control-name={control.name}
        data-control-index={index}
      >
        {/* Move First Button */}
        <button
          style={buttonStyle}
          onClick={moveFirst}
          disabled={!enabled || !isConnected || isBOF}
          title="Move First"
        >
          |◀
        </button>

        {/* Move Previous Button */}
        <button
          style={buttonStyle}
          onClick={movePrevious}
          disabled={!enabled || !isConnected || (isBOF && bofAction === 1)}
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
          disabled={!enabled || !isConnected || (isEOF && eofAction === 1)}
          title="Move Next"
        >
          ▶
        </button>

        {/* Move Last Button */}
        <button
          style={buttonStyle}
          onClick={moveLast}
          disabled={!enabled || !isConnected || isEOF}
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

// VB6 ADO Data control events (more comprehensive than classic Data control)
export const ADODataControlEvents = {
  // Connection Events
  WillConnect: 'WillConnect',
  ConnectComplete: 'ConnectComplete',
  Disconnect: 'Disconnect',

  // Command Events
  WillExecute: 'WillExecute',
  ExecuteComplete: 'ExecuteComplete',

  // Recordset Events
  WillChangeField: 'WillChangeField',
  FieldChangeComplete: 'FieldChangeComplete',
  WillMove: 'WillMove',
  MoveComplete: 'MoveComplete',
  EndOfRecordset: 'EndOfRecordset',
  FetchProgress: 'FetchProgress',
  FetchComplete: 'FetchComplete',
  WillChangeRecord: 'WillChangeRecord',
  RecordChangeComplete: 'RecordChangeComplete',
  WillChangeRecordset: 'WillChangeRecordset',
  RecordsetChangeComplete: 'RecordsetChangeComplete',

  // Error Event
  InfoMessage: 'InfoMessage',
  Error: 'Error',
};

// ADO Command Types
export const ADOCommandTypes = {
  adCmdUnknown: 8,
  adCmdText: 1,
  adCmdTable: 2,
  adCmdStoredProc: 4,
  adCmdFile: 256,
  adCmdTableDirect: 512,
};

// VB6 ADO Data control default properties
export const getADODataControlDefaults = (id: number) => ({
  id,
  type: 'ADODataControl',
  name: `Adodc${id}`,
  x: 100,
  y: 100,
  width: 385,
  height: 28,
  caption: `Adodc${id}`,
  connectionString: '',
  commandType: 8,
  recordSource: '',
  cursorLocation: 3,
  cursorType: 3,
  lockType: 3,
  mode: 0,
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

export default ADODataControl;
