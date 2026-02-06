/**
 * VB6 CommonDialog Control Implementation
 *
 * Common dialog control providing file, color, font, and print dialogs
 */

import React, { useState, useCallback, useRef } from 'react';

export interface CommonDialogControl {
  type: 'CommonDialog';
  name: string;
  left: number;
  top: number;
  width: number;
  height: number;

  // File Dialog Properties
  fileName: string;
  fileTitle: string;
  filter: string;
  filterIndex: number;
  initDir: string;
  defaultExt: string;
  dialogTitle: string;

  // Flags
  flags: number;

  // Color Dialog
  color: string;
  customColors: string[];

  // Font Dialog
  fontName: string;
  fontSize: number;
  fontBold: boolean;
  fontItalic: boolean;
  fontUnderline: boolean;
  fontStrikeThru: boolean;
  fontColor: string;

  // Print Dialog
  copies: number;
  fromPage: number;
  toPage: number;
  minPage: number;
  maxPage: number;
  printRange: number; // 0=All, 1=Selection, 2=Pages

  // Common
  cancelError: boolean;
  tag: string;

  // Events
  onError?: string;
}

interface CommonDialogControlProps {
  control: CommonDialogControl;
  isDesignMode?: boolean;
  onPropertyChange?: (property: string, value: any) => void;
  onEvent?: (eventName: string, eventData?: any) => void;
}

// Common Dialog Constants (VB6 compatible)
export const CommonDialogConstants = {
  // File Dialog Flags
  cdlOFNReadOnly: 0x1,
  cdlOFNOverwritePrompt: 0x2,
  cdlOFNHideReadOnly: 0x4,
  cdlOFNNoChangeDir: 0x8,
  cdlOFNShowHelp: 0x10,
  cdlOFNNoValidate: 0x100,
  cdlOFNAllowMultiselect: 0x200,
  cdlOFNExtensionDifferent: 0x400,
  cdlOFNPathMustExist: 0x800,
  cdlOFNFileMustExist: 0x1000,
  cdlOFNCreatePrompt: 0x2000,
  cdlOFNShareAware: 0x4000,
  cdlOFNNoReadOnlyReturn: 0x8000,
  cdlOFNNoTestFileCreate: 0x10000,
  cdlOFNNoNetworkButton: 0x20000,
  cdlOFNNoLongNames: 0x40000,
  cdlOFNExplorer: 0x80000,
  cdlOFNNoDereferenceLinks: 0x100000,
  cdlOFNLongNames: 0x200000,

  // Color Dialog Flags
  cdlCCRGBInit: 0x1,
  cdlCCFullOpen: 0x2,
  cdlCCPreventFullOpen: 0x4,
  cdlCCShowHelp: 0x8,

  // Font Dialog Flags
  cdlCFScreenFonts: 0x1,
  cdlCFPrinterFonts: 0x2,
  cdlCFBoth: 0x3,
  cdlCFShowHelp: 0x4,
  cdlCFEffects: 0x100,
  cdlCFApply: 0x200,
  cdlCFANSIOnly: 0x400,
  cdlCFScriptsOnly: 0x1000,
  cdlCFNoVectorFonts: 0x800,
  cdlCFNoSimulations: 0x1000,
  cdlCFLimitSize: 0x2000,
  cdlCFFixedPitchOnly: 0x4000,
  cdlCFWYSIWYG: 0x8000,
  cdlCFForceFontExist: 0x10000,
  cdlCFScalableOnly: 0x20000,
  cdlCFTTOnly: 0x40000,
  cdlCFNoFaceSel: 0x80000,
  cdlCFNoStyleSel: 0x100000,
  cdlCFNoSizeSel: 0x200000,

  // Print Dialog Flags
  cdlPDAllPages: 0x0,
  cdlPDSelection: 0x1,
  cdlPDPageNums: 0x2,
  cdlPDNoSelection: 0x4,
  cdlPDNoPageNums: 0x8,
  cdlPDCollate: 0x10,
  cdlPDPrintToFile: 0x20,
  cdlPDPrintSetup: 0x40,
  cdlPDNoWarning: 0x80,
  cdlPDReturnDC: 0x100,
  cdlPDReturnIC: 0x200,
  cdlPDReturnDefault: 0x400,
  cdlPDShowHelp: 0x800,
  cdlPDEnablePrintHook: 0x1000,
  cdlPDEnableSetupHook: 0x2000,
  cdlPDEnablePrintTemplate: 0x4000,
  cdlPDEnableSetupTemplate: 0x8000,
  cdlPDEnablePrintHookMsg: 0x10000,
  cdlPDEnableSetupHookMsg: 0x20000,
  cdlPDUseDevModeCopies: 0x40000,
};

export const CommonDialogControl: React.FC<CommonDialogControlProps> = ({
  control,
  isDesignMode = false,
  onPropertyChange,
  onEvent,
}) => {
  const {
    name,
    left = 0,
    top = 0,
    width = 32,
    height = 32,
    fileName = '',
    fileTitle = '',
    filter = '',
    filterIndex = 1,
    initDir = '',
    defaultExt = '',
    dialogTitle = '',
    flags = 0,
    color = '#000000',
    customColors = [],
    fontName = 'MS Sans Serif',
    fontSize = 8,
    fontBold = false,
    fontItalic = false,
    fontUnderline = false,
    fontStrikeThru = false,
    fontColor = '#000000',
    copies = 1,
    fromPage = 1,
    toPage = 1,
    minPage = 1,
    maxPage = 9999,
    printRange = 0,
    cancelError = false,
    tag = '',
  } = control;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Parse VB6 filter format: "Text Files (*.txt)|*.txt|All Files (*.*)|*.*"
  const parseFilter = useCallback((filterString: string) => {
    if (!filterString) return [];

    const parts = filterString.split('|');
    const filters = [];

    for (let i = 0; i < parts.length; i += 2) {
      if (i + 1 < parts.length) {
        const description = parts[i];
        const extension = parts[i + 1];

        // Convert VB6 wildcard to HTML accept format
        const accept = extension
          .split(';')
          .map(ext => {
            if (ext === '*.*') return '';
            if (ext.startsWith('*.')) return ext.substring(1);
            return ext;
          })
          .filter(ext => ext)
          .join(',');

        filters.push({ description, extension, accept });
      }
    }

    return filters;
  }, []);

  // Show Open File Dialog
  const showOpen = useCallback(() => {
    const filters = parseFilter(filter);
    const accept =
      filters.length > 0 && filterIndex > 0 && filterIndex <= filters.length
        ? filters[filterIndex - 1].accept
        : '';

    if (fileInputRef.current) {
      fileInputRef.current.accept = accept;
      fileInputRef.current.multiple = (flags & CommonDialogConstants.cdlOFNAllowMultiselect) !== 0;
      fileInputRef.current.click();
    }
  }, [filter, filterIndex, flags, parseFilter]);

  // Show Save File Dialog
  const showSave = useCallback(() => {
    // For save dialog, we'll create a download link
    // In a real implementation, this would show a proper save dialog
    const blob = new Blob([''], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || 'document.txt';
    a.click();
    URL.revokeObjectURL(url);

    onPropertyChange?.('fileName', a.download);
  }, [fileName, onPropertyChange]);

  // Show Color Dialog
  const showColor = useCallback(() => {
    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.value = color;
    colorInput.style.position = 'absolute';
    colorInput.style.top = '-1000px';
    document.body.appendChild(colorInput);

    colorInput.addEventListener('change', e => {
      const target = e.target as HTMLInputElement;
      onPropertyChange?.('color', target.value);
      document.body.removeChild(colorInput);
    });

    colorInput.addEventListener('cancel', () => {
      if (cancelError) {
        onEvent?.('Error', { number: 32755, description: 'User canceled operation' });
      }
      document.body.removeChild(colorInput);
    });

    colorInput.click();
  }, [color, cancelError, onPropertyChange, onEvent]);

  // Show Font Dialog (simplified)
  const showFont = useCallback(() => {
    // Since web browsers don't have a native font dialog,
    // we'll simulate it with a simple prompt or custom dialog
    const fontDialog = document.createElement('div');
    fontDialog.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border: 2px solid #333;
      padding: 20px;
      z-index: 10000;
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
    `;

    // Create font dialog content safely using DOM methods
    const title = document.createElement('h3');
    title.textContent = 'Font';

    // Font Name section
    const nameDiv = document.createElement('div');
    const nameLabel = document.createElement('label');
    nameLabel.textContent = 'Font Name: ';
    const nameSelect = document.createElement('select');
    nameSelect.id = 'fontName';

    const fonts = ['Arial', 'Times New Roman', 'Courier New', 'MS Sans Serif'];
    fonts.forEach(font => {
      const option = document.createElement('option');
      option.value = font;
      option.textContent = font;
      if (font === fontName) option.selected = true;
      nameSelect.appendChild(option);
    });
    nameLabel.appendChild(nameSelect);
    nameDiv.appendChild(nameLabel);

    // Font Size section
    const sizeDiv = document.createElement('div');
    const sizeLabel = document.createElement('label');
    sizeLabel.textContent = 'Size: ';
    const sizeInput = document.createElement('input');
    sizeInput.type = 'number';
    sizeInput.id = 'fontSize';
    sizeInput.value = fontSize.toString();
    sizeInput.min = '6';
    sizeInput.max = '72';
    sizeLabel.appendChild(sizeInput);
    sizeDiv.appendChild(sizeLabel);

    // Font Style section
    const styleDiv = document.createElement('div');

    const boldLabel = document.createElement('label');
    const boldInput = document.createElement('input');
    boldInput.type = 'checkbox';
    boldInput.id = 'fontBold';
    boldInput.checked = fontBold;
    boldLabel.appendChild(boldInput);
    boldLabel.appendChild(document.createTextNode(' Bold'));

    const italicLabel = document.createElement('label');
    const italicInput = document.createElement('input');
    italicInput.type = 'checkbox';
    italicInput.id = 'fontItalic';
    italicInput.checked = fontItalic;
    italicLabel.appendChild(italicInput);
    italicLabel.appendChild(document.createTextNode(' Italic'));

    const underlineLabel = document.createElement('label');
    const underlineInput = document.createElement('input');
    underlineInput.type = 'checkbox';
    underlineInput.id = 'fontUnderline';
    underlineInput.checked = fontUnderline;
    underlineLabel.appendChild(underlineInput);
    underlineLabel.appendChild(document.createTextNode(' Underline'));

    styleDiv.appendChild(boldLabel);
    styleDiv.appendChild(italicLabel);
    styleDiv.appendChild(underlineLabel);

    // Font Color section
    const colorDiv = document.createElement('div');
    const colorLabel = document.createElement('label');
    colorLabel.textContent = 'Color: ';
    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.id = 'fontColor';
    colorInput.value = fontColor;
    colorLabel.appendChild(colorInput);
    colorDiv.appendChild(colorLabel);

    // Buttons section
    const buttonDiv = document.createElement('div');
    buttonDiv.style.marginTop = '10px';
    const okBtn = document.createElement('button');
    okBtn.id = 'okBtn';
    okBtn.textContent = 'OK';
    const cancelBtn = document.createElement('button');
    cancelBtn.id = 'cancelBtn';
    cancelBtn.textContent = 'Cancel';
    buttonDiv.appendChild(okBtn);
    buttonDiv.appendChild(cancelBtn);

    // Assemble dialog
    fontDialog.appendChild(title);
    fontDialog.appendChild(nameDiv);
    fontDialog.appendChild(sizeDiv);
    fontDialog.appendChild(styleDiv);
    fontDialog.appendChild(colorDiv);
    fontDialog.appendChild(buttonDiv);

    document.body.appendChild(fontDialog);

    // Use the already created button references instead of querying

    okBtn.onclick = () => {
      const nameInput = fontDialog.querySelector('#fontName') as HTMLSelectElement;
      const sizeInput = fontDialog.querySelector('#fontSize') as HTMLInputElement;
      const boldInput = fontDialog.querySelector('#fontBold') as HTMLInputElement;
      const italicInput = fontDialog.querySelector('#fontItalic') as HTMLInputElement;
      const underlineInput = fontDialog.querySelector('#fontUnderline') as HTMLInputElement;
      const colorInput = fontDialog.querySelector('#fontColor') as HTMLInputElement;

      onPropertyChange?.('fontName', nameInput.value);
      onPropertyChange?.('fontSize', parseInt(sizeInput.value));
      onPropertyChange?.('fontBold', boldInput.checked);
      onPropertyChange?.('fontItalic', italicInput.checked);
      onPropertyChange?.('fontUnderline', underlineInput.checked);
      onPropertyChange?.('fontColor', colorInput.value);

      document.body.removeChild(fontDialog);
    };

    cancelBtn.onclick = () => {
      if (cancelError) {
        onEvent?.('Error', { number: 32755, description: 'User canceled operation' });
      }
      document.body.removeChild(fontDialog);
    };
  }, [
    fontName,
    fontSize,
    fontBold,
    fontItalic,
    fontUnderline,
    fontColor,
    cancelError,
    onPropertyChange,
    onEvent,
  ]);

  // Show Print Dialog (simplified)
  const showPrinter = useCallback(() => {
    // Trigger browser's print dialog
    window.print();
  }, []);

  // File input change handler
  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        const file = files[0];
        onPropertyChange?.('fileName', file.name);
        onPropertyChange?.('fileTitle', file.name);

        // For multiple files
        if (files.length > 1) {
          const fileNames = Array.from(files).map(f => f.name);
          onPropertyChange?.('fileName', fileNames.join(' '));
        }
      } else if (cancelError) {
        onEvent?.('Error', { number: 32755, description: 'User canceled operation' });
      }

      // Reset input
      event.target.value = '';
    },
    [cancelError, onPropertyChange, onEvent]
  );

  // VB6 Compatible methods
  const vb6Methods = {
    ShowOpen: showOpen,
    ShowSave: showSave,
    ShowColor: showColor,
    ShowFont: showFont,
    ShowPrinter: showPrinter,
    ShowHelp: () => {},
  };

  // Expose methods to parent
  React.useEffect(() => {
    if (onPropertyChange) {
      onPropertyChange('_methods', vb6Methods);
    }
  }, [onPropertyChange]);

  return (
    <>
      {/* Hidden file input for file dialogs */}
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Visual representation in design mode */}
      {isDesignMode ? (
        <div
          className="vb6-commondialog"
          style={{
            position: 'absolute',
            left: `${left}px`,
            top: `${top}px`,
            width: `${width}px`,
            height: `${height}px`,
            border: '1px solid #999',
            background: '#f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            color: '#666',
            cursor: 'default',
          }}
          data-name={name}
          data-type="CommonDialog"
        >
          📁
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              fontSize: '10px',
              color: '#666',
              background: 'rgba(255,255,255,0.9)',
              padding: '2px',
              border: '1px solid #ccc',
              whiteSpace: 'nowrap',
              zIndex: 1000,
            }}
          >
            {name} (CommonDialog)
          </div>
        </div>
      ) : null}
    </>
  );
};

export default CommonDialogControl;
