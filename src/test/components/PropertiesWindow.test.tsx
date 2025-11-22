import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';

// Import Properties Window components
import PropertiesWindow from '../../components/Panels/PropertiesWindow/PropertiesWindow';
import PropertyGrid from '../../components/Panels/PropertiesWindow/PropertyGrid';
import PropertyEditors from '../../components/Panels/PropertiesWindow/PropertyEditors';

// Mock VB6 complete properties
vi.mock('../../data/VB6CompleteProperties', () => ({
  getControlProperties: vi.fn().mockReturnValue({
    Appearance: { type: 'enum', values: ['0 - Flat', '1 - 3D'], default: 1 },
    BackColor: { type: 'color', default: '&H8000000F&' },
    Caption: { type: 'string', default: 'Command1' },
    Enabled: { type: 'boolean', default: true },
    Font: { type: 'font', default: { name: 'MS Sans Serif', size: 8 } },
    Height: { type: 'number', default: 375, min: 0 },
    Left: { type: 'number', default: 0 },
    Name: { type: 'string', readonly: false },
    TabIndex: { type: 'number', default: 0, min: 0 },
    Top: { type: 'number', default: 0 },
    Visible: { type: 'boolean', default: true },
    Width: { type: 'number', default: 1215, min: 0 }
  })
}));

describe('Properties Window Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;
  let mockControl: any;

  beforeEach(() => {
    user = userEvent.setup();
    mockControl = {
      id: 'Command1',
      type: 'CommandButton',
      properties: {
        Name: 'Command1',
        Caption: 'Click Me',
        Left: 120,
        Top: 240,
        Width: 1215,
        Height: 375,
        Enabled: true,
        Visible: true,
        BackColor: '&H8000000F&',
        Font: { name: 'MS Sans Serif', size: 8, bold: false },
        TabIndex: 0
      }
    };
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Properties Window Layout', () => {
    it('should render properties window with all sections', () => {
      render(<PropertiesWindow selectedControl={mockControl} />);
      
      expect(screen.getByTestId('properties-window')).toBeInTheDocument();
      expect(screen.getByTestId('object-selector')).toBeInTheDocument();
      expect(screen.getByTestId('property-grid')).toBeInTheDocument();
      expect(screen.getByTestId('property-description')).toBeInTheDocument();
    });

    it('should show selected control information', () => {
      render(<PropertiesWindow selectedControl={mockControl} />);
      
      const objectSelector = screen.getByTestId('object-selector');
      expect(within(objectSelector).getByText('Command1')).toBeInTheDocument();
      expect(within(objectSelector).getByText('CommandButton')).toBeInTheDocument();
    });

    it('should display message when no control selected', () => {
      render(<PropertiesWindow selectedControl={null} />);
      
      expect(screen.getByText('No object selected')).toBeInTheDocument();
    });

    it('should handle multiple control selection', () => {
      const multipleControls = [mockControl, { ...mockControl, id: 'Command2' }];
      render(<PropertiesWindow selectedControls={multipleControls} />);
      
      expect(screen.getByText('Multiple objects (2)')).toBeInTheDocument();
      expect(screen.getByText('CommandButton')).toBeInTheDocument();
    });

    it('should categorize properties', () => {
      render(<PropertiesWindow selectedControl={mockControl} categorized={true} />);
      
      expect(screen.getByText('Appearance')).toBeInTheDocument();
      expect(screen.getByText('Behavior')).toBeInTheDocument();
      expect(screen.getByText('Data')).toBeInTheDocument();
      expect(screen.getByText('Font')).toBeInTheDocument();
      expect(screen.getByText('Position')).toBeInTheDocument();
    });

    it('should support alphabetical view', async () => {
      render(<PropertiesWindow selectedControl={mockControl} />);
      
      const alphabeticalButton = screen.getByTestId('alphabetical-view');
      await user.click(alphabeticalButton);
      
      const propertyNames = screen.getAllByTestId(/property-name-/);
      const names = propertyNames.map(el => el.textContent);
      
      // Should be sorted alphabetically
      expect(names).toEqual([...names].sort());
    });
  });

  describe('Property Grid Functionality', () => {
    it('should display all properties with values', () => {
      render(<PropertyGrid control={mockControl} />);
      
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Command1')).toBeInTheDocument();
      expect(screen.getByText('Caption')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Click Me')).toBeInTheDocument();
      expect(screen.getByText('Width')).toBeInTheDocument();
      expect(screen.getByDisplayValue('1215')).toBeInTheDocument();
    });

    it('should show property descriptions on selection', async () => {
      render(<PropertyGrid control={mockControl} />);
      
      const captionProperty = screen.getByText('Caption');
      await user.click(captionProperty);
      
      const description = screen.getByTestId('property-description');
      expect(description).toHaveTextContent(
        'Returns/sets the text displayed in an object\'s title bar or below an object\'s icon.'
      );
    });

    it('should handle property editing', async () => {
      const onPropertyChange = vi.fn();
      render(<PropertyGrid control={mockControl} onPropertyChange={onPropertyChange} />);
      
      const captionInput = screen.getByDisplayValue('Click Me');
      await user.clear(captionInput);
      await user.type(captionInput, 'New Caption');
      await user.keyboard('{Enter}');
      
      expect(onPropertyChange).toHaveBeenCalledWith('Caption', 'New Caption');
    });

    it('should validate property values', async () => {
      const onPropertyChange = vi.fn();
      render(<PropertyGrid control={mockControl} onPropertyChange={onPropertyChange} />);
      
      const widthInput = screen.getByDisplayValue('1215');
      await user.clear(widthInput);
      await user.type(widthInput, '-10');
      await user.keyboard('{Enter}');
      
      expect(screen.getByText('Value must be greater than or equal to 0')).toBeInTheDocument();
      expect(onPropertyChange).not.toHaveBeenCalled();
    });

    it('should show readonly properties', () => {
      const controlWithReadonly = {
        ...mockControl,
        properties: {
          ...mockControl.properties,
          hWnd: { value: '123456', readonly: true }
        }
      };
      
      render(<PropertyGrid control={controlWithReadonly} />);
      
      const hWndValue = screen.getByText('123456');
      expect(hWndValue.closest('.property-row')).toHaveClass('readonly');
    });

    it('should handle property reset to default', async () => {
      const onPropertyChange = vi.fn();
      const modifiedControl = {
        ...mockControl,
        properties: {
          ...mockControl.properties,
          Caption: 'Modified Caption'
        }
      };
      
      render(<PropertyGrid control={modifiedControl} onPropertyChange={onPropertyChange} />);
      
      const captionProperty = screen.getByText('Caption');
      fireEvent.contextMenu(captionProperty);
      
      await user.click(screen.getByText('Reset to Default'));
      
      expect(onPropertyChange).toHaveBeenCalledWith('Caption', 'Command1');
    });
  });

  describe('Property Editors', () => {
    describe('String Editor', () => {
      it('should edit string properties inline', async () => {
        render(<PropertyEditors property="Caption" value="Test" type="string" />);
        
        const input = screen.getByRole('textbox');
        expect(input).toHaveValue('Test');
        
        await user.clear(input);
        await user.type(input, 'New Value');
        
        expect(input).toHaveValue('New Value');
      });

      it('should handle multiline strings', async () => {
        render(<PropertyEditors property="Text" value="Line 1\nLine 2" type="string" multiline />);
        
        const textarea = screen.getByRole('textbox');
        expect(textarea.tagName).toBe('TEXTAREA');
        expect(textarea).toHaveValue('Line 1\nLine 2');
      });

      it('should open text editor for long strings', async () => {
        const longText = 'A'.repeat(1000);
        render(<PropertyEditors property="Text" value={longText} type="string" />);
        
        const expandButton = screen.getByTestId('expand-text-editor');
        await user.click(expandButton);
        
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Text Editor')).toBeInTheDocument();
      });
    });

    describe('Number Editor', () => {
      it('should edit numeric properties', async () => {
        const onChange = vi.fn();
        render(<PropertyEditors property="Width" value={100} type="number" onChange={onChange} />);
        
        const input = screen.getByRole('spinbutton');
        await user.clear(input);
        await user.type(input, '200');
        
        expect(onChange).toHaveBeenCalledWith('Width', 200);
      });

      it('should respect min/max constraints', async () => {
        render(<PropertyEditors property="Width" value={100} type="number" min={0} max={1000} />);
        
        const input = screen.getByRole('spinbutton');
        await user.clear(input);
        await user.type(input, '2000');
        await user.keyboard('{Enter}');
        
        expect(screen.getByText('Value must be between 0 and 1000')).toBeInTheDocument();
      });

      it('should support increment/decrement buttons', async () => {
        const onChange = vi.fn();
        render(<PropertyEditors property="TabIndex" value={5} type="number" onChange={onChange} />);
        
        const incrementButton = screen.getByTestId('increment-button');
        await user.click(incrementButton);
        
        expect(onChange).toHaveBeenCalledWith('TabIndex', 6);
        
        const decrementButton = screen.getByTestId('decrement-button');
        await user.click(decrementButton);
        
        expect(onChange).toHaveBeenCalledWith('TabIndex', 4);
      });
    });

    describe('Boolean Editor', () => {
      it('should toggle boolean properties', async () => {
        const onChange = vi.fn();
        render(<PropertyEditors property="Enabled" value={true} type="boolean" onChange={onChange} />);
        
        const checkbox = screen.getByRole('checkbox');
        expect(checkbox).toBeChecked();
        
        await user.click(checkbox);
        expect(onChange).toHaveBeenCalledWith('Enabled', false);
      });

      it('should use dropdown for boolean properties', async () => {
        render(<PropertyEditors property="Visible" value={true} type="boolean" useDropdown />);
        
        const select = screen.getByRole('combobox');
        expect(select).toHaveValue('True');
        
        await user.selectOptions(select, 'False');
        expect(select).toHaveValue('False');
      });
    });

    describe('Enum Editor', () => {
      it('should display enum options', async () => {
        const enumValues = ['0 - Flat', '1 - 3D'];
        render(<PropertyEditors property="Appearance" value={1} type="enum" enumValues={enumValues} />);
        
        const select = screen.getByRole('combobox');
        await user.click(select);
        
        expect(screen.getByText('0 - Flat')).toBeInTheDocument();
        expect(screen.getByText('1 - 3D')).toBeInTheDocument();
      });

      it('should handle enum value changes', async () => {
        const onChange = vi.fn();
        const enumValues = ['0 - Flat', '1 - 3D'];
        render(<PropertyEditors 
          property="Appearance" 
          value={1} 
          type="enum" 
          enumValues={enumValues}
          onChange={onChange}
        />);
        
        const select = screen.getByRole('combobox');
        await user.selectOptions(select, '0');
        
        expect(onChange).toHaveBeenCalledWith('Appearance', 0);
      });
    });

    describe('Color Editor', () => {
      it('should display color picker', async () => {
        render(<PropertyEditors property="BackColor" value="&H8000000F&" type="color" />);
        
        const colorButton = screen.getByTestId('color-button');
        expect(colorButton).toHaveStyle({ backgroundColor: 'rgb(240, 240, 240)' });
        
        await user.click(colorButton);
        expect(screen.getByTestId('color-picker')).toBeInTheDocument();
      });

      it('should support system colors', async () => {
        render(<PropertyEditors property="ForeColor" value="&H80000012&" type="color" />);
        
        const colorButton = screen.getByTestId('color-button');
        await user.click(colorButton);
        
        expect(screen.getByText('System Colors')).toBeInTheDocument();
        expect(screen.getByText('Button Text')).toBeInTheDocument();
      });

      it('should allow custom color input', async () => {
        const onChange = vi.fn();
        render(<PropertyEditors property="BackColor" value="#FF0000" type="color" onChange={onChange} />);
        
        const hexInput = screen.getByPlaceholderText('#RRGGBB');
        await user.clear(hexInput);
        await user.type(hexInput, '#00FF00');
        
        expect(onChange).toHaveBeenCalledWith('BackColor', '#00FF00');
      });
    });

    describe('Font Editor', () => {
      it('should display font dialog', async () => {
        const font = { name: 'Arial', size: 10, bold: true, italic: false };
        render(<PropertyEditors property="Font" value={font} type="font" />);
        
        const fontButton = screen.getByTestId('font-button');
        expect(fontButton).toHaveTextContent('Arial, 10pt, Bold');
        
        await user.click(fontButton);
        expect(screen.getByText('Font')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Arial')).toBeInTheDocument();
      });

      it('should handle font changes', async () => {
        const onChange = vi.fn();
        const font = { name: 'Times New Roman', size: 12, bold: false, italic: true };
        render(<PropertyEditors property="Font" value={font} type="font" onChange={onChange} />);
        
        const fontButton = screen.getByTestId('font-button');
        await user.click(fontButton);
        
        const fontSelect = screen.getByTestId('font-family-select');
        await user.selectOptions(fontSelect, 'Courier New');
        
        const sizeInput = screen.getByTestId('font-size-input');
        await user.clear(sizeInput);
        await user.type(sizeInput, '14');
        
        await user.click(screen.getByText('OK'));
        
        expect(onChange).toHaveBeenCalledWith('Font', {
          name: 'Courier New',
          size: 14,
          bold: false,
          italic: true
        });
      });
    });

    describe('Picture Editor', () => {
      it('should handle image selection', async () => {
        render(<PropertyEditors property="Picture" value={null} type="picture" />);
        
        const browseButton = screen.getByText('Browse...');
        await user.click(browseButton);
        
        expect(screen.getByText('Select Picture')).toBeInTheDocument();
      });

      it('should display current picture', () => {
        render(<PropertyEditors property="Icon" value="/icon.ico" type="picture" />);
        
        const preview = screen.getByTestId('picture-preview');
        expect(preview).toHaveAttribute('src', '/icon.ico');
      });

      it('should clear picture', async () => {
        const onChange = vi.fn();
        render(<PropertyEditors property="Picture" value="/image.png" type="picture" onChange={onChange} />);
        
        const clearButton = screen.getByText('Clear');
        await user.click(clearButton);
        
        expect(onChange).toHaveBeenCalledWith('Picture', null);
      });
    });

    describe('Collection Editor', () => {
      it('should open collection editor', async () => {
        const items = ['Item 1', 'Item 2', 'Item 3'];
        render(<PropertyEditors property="Items" value={items} type="collection" />);
        
        const editButton = screen.getByText('(Collection)');
        await user.click(editButton);
        
        expect(screen.getByText('String Collection Editor')).toBeInTheDocument();
        expect(screen.getByText('Item 1')).toBeInTheDocument();
      });

      it('should modify collection items', async () => {
        const onChange = vi.fn();
        const items = ['Item 1', 'Item 2'];
        render(<PropertyEditors property="Items" value={items} type="collection" onChange={onChange} />);
        
        const editButton = screen.getByText('(Collection)');
        await user.click(editButton);
        
        const addButton = screen.getByText('Add');
        await user.click(addButton);
        
        const newItemInput = screen.getByDisplayValue('');
        await user.type(newItemInput, 'Item 3');
        
        await user.click(screen.getByText('OK'));
        
        expect(onChange).toHaveBeenCalledWith('Items', ['Item 1', 'Item 2', 'Item 3']);
      });
    });
  });

  describe('Advanced Features', () => {
    it('should support property binding', async () => {
      render(<PropertiesWindow selectedControl={mockControl} supportBinding />);
      
      const captionProperty = screen.getByText('Caption');
      fireEvent.contextMenu(captionProperty);
      
      await user.click(screen.getByText('Bind to Data'));
      
      expect(screen.getByText('Data Binding')).toBeInTheDocument();
    });

    it('should show property inheritance', () => {
      const inheritedControl = {
        ...mockControl,
        baseClass: 'UserControl',
        inheritedProperties: ['Name', 'Left', 'Top']
      };
      
      render(<PropertiesWindow selectedControl={inheritedControl} />);
      
      const nameProperty = screen.getByText('Name').closest('.property-row');
      expect(nameProperty).toHaveClass('inherited');
    });

    it('should support property expressions', async () => {
      render(<PropertiesWindow selectedControl={mockControl} supportExpressions />);
      
      const widthProperty = screen.getByText('Width');
      fireEvent.contextMenu(widthProperty);
      
      await user.click(screen.getByText('Expression...'));
      
      expect(screen.getByText('Property Expression')).toBeInTheDocument();
      
      const expressionInput = screen.getByPlaceholderText('Enter expression...');
      await user.type(expressionInput, 'Parent.Width * 0.5');
      
      await user.click(screen.getByText('OK'));
      
      expect(screen.getByText('fx')).toBeInTheDocument(); // Expression indicator
    });

    it('should validate property dependencies', async () => {
      const onPropertyChange = vi.fn();
      render(<PropertiesWindow selectedControl={mockControl} onPropertyChange={onPropertyChange} />);
      
      // Disabling control should affect other properties
      const enabledCheckbox = screen.getByLabelText('Enabled');
      await user.click(enabledCheckbox);
      
      expect(onPropertyChange).toHaveBeenCalledWith('Enabled', false);
      
      // Other properties might become readonly
      const tabIndexInput = screen.getByDisplayValue('0');
      expect(tabIndexInput).toBeDisabled();
    });

    it('should group related properties', () => {
      render(<PropertiesWindow selectedControl={mockControl} groupProperties />);
      
      expect(screen.getByText('Position & Size')).toBeInTheDocument();
      expect(screen.getByText('Appearance & Style')).toBeInTheDocument();
      expect(screen.getByText('Behavior')).toBeInTheDocument();
    });

    it('should search properties', async () => {
      render(<PropertiesWindow selectedControl={mockControl} />);
      
      const searchInput = screen.getByPlaceholderText('Search properties...');
      await user.type(searchInput, 'cap');
      
      expect(screen.getByText('Caption')).toBeInTheDocument();
      expect(screen.queryByText('Width')).not.toBeInTheDocument();
    });

    it('should show property change history', async () => {
      render(<PropertiesWindow selectedControl={mockControl} trackHistory />);
      
      const captionInput = screen.getByDisplayValue('Click Me');
      await user.clear(captionInput);
      await user.type(captionInput, 'New Caption');
      await user.keyboard('{Enter}');
      
      const historyButton = screen.getByTestId('property-history');
      await user.click(historyButton);
      
      expect(screen.getByText('Property History')).toBeInTheDocument();
      expect(screen.getByText('Caption: "Click Me" → "New Caption"')).toBeInTheDocument();
    });

    it('should export/import property sets', async () => {
      render(<PropertiesWindow selectedControl={mockControl} />);
      
      const moreButton = screen.getByTestId('properties-menu');
      await user.click(moreButton);
      
      await user.click(screen.getByText('Export Properties'));
      
      expect(screen.getByText('Export Property Set')).toBeInTheDocument();
    });

    it('should support custom property editors', () => {
      const customEditors = {
        CustomProperty: ({ value, onChange }: any) => (
          <button onClick={() => onChange('CustomProperty', 'custom value')}>
            Custom Editor
          </button>
        )
      };
      
      const controlWithCustom = {
        ...mockControl,
        properties: {
          ...mockControl.properties,
          CustomProperty: 'initial value'
        }
      };
      
      render(<PropertiesWindow selectedControl={controlWithCustom} customEditors={customEditors} />);
      
      expect(screen.getByText('Custom Editor')).toBeInTheDocument();
    });
  });

  describe('Performance and Optimization', () => {
    it('should virtualize large property lists', () => {
      const controlWithManyProps = {
        ...mockControl,
        properties: Object.fromEntries(
          Array.from({ length: 1000 }, (_, i) => [`Property${i}`, `Value${i}`])
        )
      };
      
      const { container } = render(<PropertiesWindow selectedControl={controlWithManyProps} />);
      
      expect(container.querySelector('.virtual-list')).toBeInTheDocument();
    });

    it('should debounce property changes', async () => {
      const onChange = vi.fn();
      render(<PropertyGrid control={mockControl} onPropertyChange={onChange} debounceMs={100} />);
      
      const captionInput = screen.getByDisplayValue('Click Me');
      
      await user.type(captionInput, ' Updated');
      
      // Should not call immediately
      expect(onChange).not.toHaveBeenCalled();
      
      // Should call after debounce
      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith('Caption', 'Click Me Updated');
      }, { timeout: 200 });
    });

    it('should memoize property calculations', () => {
      const expensiveControl = {
        ...mockControl,
        properties: {
          ...mockControl.properties,
          computedProperty: 'expensive calculation result'
        }
      };
      
      const { rerender } = render(<PropertiesWindow selectedControl={expensiveControl} />);
      
      // Re-render with same control
      rerender(<PropertiesWindow selectedControl={expensiveControl} />);
      
      // Should not recalculate expensive properties
      expect(screen.getByText('expensive calculation result')).toBeInTheDocument();
    });
  });
});