/**
 * VB6 Microsoft Equation Editor Control (MSEE)
 * Provides mathematical equation editing and display capabilities
 * Compatible with Microsoft Equation 3.0
 */

import React, { useEffect, useRef, useState, forwardRef } from 'react';
import { Control } from '../../types/Control';

interface MSEEControlProps {
  control: Control;
  isDesignMode?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
  onChange?: (value: any) => void;
}

// Equation types
export enum EquationType {
  Inline = 0,
  Display = 1,
  Numbered = 2,
}

// Symbol categories
export enum SymbolCategory {
  Relation = 'relation',
  Operator = 'operator',
  Greek = 'greek',
  Arrow = 'arrow',
  Delimiter = 'delimiter',
  Miscellaneous = 'misc',
}

// Template types
export enum TemplateType {
  Fraction = 'fraction',
  Subscript = 'subscript',
  Superscript = 'superscript',
  SubSuperscript = 'subsuperscript',
  Radical = 'radical',
  Integral = 'integral',
  Sum = 'sum',
  Product = 'product',
  Matrix = 'matrix',
  Limit = 'limit',
  Parentheses = 'parentheses',
  Brackets = 'brackets',
  Braces = 'braces',
  Vector = 'vector',
  Binomial = 'binomial',
}

export interface EquationElement {
  type: 'text' | 'symbol' | 'template' | 'space';
  content: string;
  category?: SymbolCategory;
  templateType?: TemplateType;
  children?: EquationElement[];
  fontSize?: number;
  bold?: boolean;
  italic?: boolean;
  color?: string;
}

export interface EquationDocument {
  elements: EquationElement[];
  fontSize: number;
  color: string;
  backgroundColor: string;
  type: EquationType;
  alignment: 'left' | 'center' | 'right';
}

export const MSEEControl = forwardRef<HTMLDivElement, MSEEControlProps>(
  ({ control, isDesignMode = false, onClick, onDoubleClick, onChange }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [equation, setEquation] = useState<EquationDocument>({
      elements: control.equation?.elements || [],
      fontSize: control.equation?.fontSize || 12,
      color: control.equation?.color || '#000000',
      backgroundColor: control.equation?.backgroundColor || '#FFFFFF',
      type: control.equation?.type || EquationType.Inline,
      alignment: control.equation?.alignment || 'center',
    });

    const [isEditing, setIsEditing] = useState(false);
    const [selectedElement, setSelectedElement] = useState<number | null>(null);
    const [cursorPosition, setCursorPosition] = useState(0);

    // Symbol palettes
    const symbolPalettes = {
      relation: [
        { symbol: '=', name: 'equals' },
        { symbol: '≠', name: 'not equal' },
        { symbol: '<', name: 'less than' },
        { symbol: '>', name: 'greater than' },
        { symbol: '≤', name: 'less than or equal' },
        { symbol: '≥', name: 'greater than or equal' },
        { symbol: '≈', name: 'approximately' },
        { symbol: '≡', name: 'identical' },
        { symbol: '∝', name: 'proportional' },
        { symbol: '⊂', name: 'subset' },
        { symbol: '⊃', name: 'superset' },
        { symbol: '∈', name: 'element of' },
        { symbol: '∉', name: 'not element of' },
      ],
      operator: [
        { symbol: '+', name: 'plus' },
        { symbol: '−', name: 'minus' },
        { symbol: '×', name: 'multiply' },
        { symbol: '÷', name: 'divide' },
        { symbol: '±', name: 'plus minus' },
        { symbol: '∓', name: 'minus plus' },
        { symbol: '·', name: 'dot' },
        { symbol: '∘', name: 'composition' },
        { symbol: '⊕', name: 'direct sum' },
        { symbol: '⊗', name: 'tensor product' },
        { symbol: '∧', name: 'wedge' },
        { symbol: '∨', name: 'vee' },
      ],
      greek: [
        { symbol: 'α', name: 'alpha' },
        { symbol: 'β', name: 'beta' },
        { symbol: 'γ', name: 'gamma' },
        { symbol: 'δ', name: 'delta' },
        { symbol: 'ε', name: 'epsilon' },
        { symbol: 'ζ', name: 'zeta' },
        { symbol: 'η', name: 'eta' },
        { symbol: 'θ', name: 'theta' },
        { symbol: 'ι', name: 'iota' },
        { symbol: 'κ', name: 'kappa' },
        { symbol: 'λ', name: 'lambda' },
        { symbol: 'μ', name: 'mu' },
        { symbol: 'ν', name: 'nu' },
        { symbol: 'ξ', name: 'xi' },
        { symbol: 'π', name: 'pi' },
        { symbol: 'ρ', name: 'rho' },
        { symbol: 'σ', name: 'sigma' },
        { symbol: 'τ', name: 'tau' },
        { symbol: 'φ', name: 'phi' },
        { symbol: 'χ', name: 'chi' },
        { symbol: 'ψ', name: 'psi' },
        { symbol: 'ω', name: 'omega' },
        { symbol: 'Γ', name: 'Gamma' },
        { symbol: 'Δ', name: 'Delta' },
        { symbol: 'Θ', name: 'Theta' },
        { symbol: 'Λ', name: 'Lambda' },
        { symbol: 'Ξ', name: 'Xi' },
        { symbol: 'Π', name: 'Pi' },
        { symbol: 'Σ', name: 'Sigma' },
        { symbol: 'Φ', name: 'Phi' },
        { symbol: 'Ψ', name: 'Psi' },
        { symbol: 'Ω', name: 'Omega' },
      ],
      arrow: [
        { symbol: '→', name: 'right arrow' },
        { symbol: '←', name: 'left arrow' },
        { symbol: '↑', name: 'up arrow' },
        { symbol: '↓', name: 'down arrow' },
        { symbol: '↔', name: 'left right arrow' },
        { symbol: '⇒', name: 'right double arrow' },
        { symbol: '⇐', name: 'left double arrow' },
        { symbol: '⇔', name: 'left right double arrow' },
        { symbol: '↦', name: 'maps to' },
      ],
      delimiter: [
        { symbol: '(', name: 'left parenthesis' },
        { symbol: ')', name: 'right parenthesis' },
        { symbol: '[', name: 'left bracket' },
        { symbol: ']', name: 'right bracket' },
        { symbol: '{', name: 'left brace' },
        { symbol: '}', name: 'right brace' },
        { symbol: '⟨', name: 'left angle' },
        { symbol: '⟩', name: 'right angle' },
        { symbol: '|', name: 'vertical bar' },
        { symbol: '‖', name: 'double vertical bar' },
      ],
      misc: [
        { symbol: '∞', name: 'infinity' },
        { symbol: '∂', name: 'partial' },
        { symbol: '∇', name: 'nabla' },
        { symbol: '∫', name: 'integral' },
        { symbol: '∮', name: 'contour integral' },
        { symbol: '∑', name: 'sum' },
        { symbol: '∏', name: 'product' },
        { symbol: '√', name: 'square root' },
        { symbol: '∛', name: 'cube root' },
        { symbol: '∀', name: 'for all' },
        { symbol: '∃', name: 'exists' },
        { symbol: '∅', name: 'empty set' },
        { symbol: 'ℝ', name: 'real numbers' },
        { symbol: 'ℂ', name: 'complex numbers' },
        { symbol: 'ℕ', name: 'natural numbers' },
        { symbol: 'ℤ', name: 'integers' },
      ],
    };

    // Render equation to canvas
    useEffect(() => {
      if (canvasRef.current) {
        renderEquation();
      }
    }, [equation, control.width, control.height]);

    const renderEquation = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size
      canvas.width = control.width || 400;
      canvas.height = control.height || 100;

      // Clear canvas
      ctx.fillStyle = equation.backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Set default font
      ctx.font = `${equation.fontSize}px "Cambria Math", "Times New Roman", serif`;
      ctx.fillStyle = equation.color;
      ctx.textBaseline = 'middle';

      // Calculate total width for alignment
      let totalWidth = 0;
      equation.elements.forEach(element => {
        totalWidth += getElementWidth(ctx, element);
      });

      // Starting position based on alignment
      let x = 10;
      if (equation.alignment === 'center') {
        x = (canvas.width - totalWidth) / 2;
      } else if (equation.alignment === 'right') {
        x = canvas.width - totalWidth - 10;
      }

      const y = canvas.height / 2;

      // Render each element
      equation.elements.forEach((element, index) => {
        x += renderElement(ctx, element, x, y, index === selectedElement);
      });

      // Draw cursor if editing
      if (isEditing && cursorPosition >= 0) {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y - equation.fontSize / 2);
        ctx.lineTo(x, y + equation.fontSize / 2);
        ctx.stroke();
      }
    };

    const getElementWidth = (ctx: CanvasRenderingContext2D, element: EquationElement): number => {
      switch (element.type) {
        case 'text':
        case 'symbol':
          return ctx.measureText(element.content).width;
        case 'space':
          return parseInt(element.content) || 10;
        case 'template':
          return getTemplateWidth(ctx, element);
        default:
          return 0;
      }
    };

    const getTemplateWidth = (ctx: CanvasRenderingContext2D, element: EquationElement): number => {
      // Calculate width based on template type and children
      switch (element.templateType) {
        case TemplateType.Fraction:
          if (element.children && element.children.length >= 2) {
            const numeratorWidth = getElementWidth(ctx, element.children[0]);
            const denominatorWidth = getElementWidth(ctx, element.children[1]);
            return Math.max(numeratorWidth, denominatorWidth) + 10;
          }
          break;
        case TemplateType.Superscript:
        case TemplateType.Subscript:
          if (element.children && element.children.length >= 2) {
            const baseWidth = getElementWidth(ctx, element.children[0]);
            const scriptWidth = getElementWidth(ctx, element.children[1]) * 0.7;
            return baseWidth + scriptWidth;
          }
          break;
        case TemplateType.Radical:
          if (element.children && element.children.length >= 1) {
            const contentWidth = getElementWidth(ctx, element.children[0]);
            return contentWidth + 20;
          }
          break;
        // Add more template width calculations as needed
      }
      return 50; // Default width
    };

    const renderElement = (
      ctx: CanvasRenderingContext2D,
      element: EquationElement,
      x: number,
      y: number,
      isSelected: boolean
    ): number => {
      // Highlight selected element
      if (isSelected) {
        ctx.fillStyle = 'rgba(0, 123, 255, 0.1)';
        const width = getElementWidth(ctx, element);
        ctx.fillRect(x - 2, y - equation.fontSize / 2 - 2, width + 4, equation.fontSize + 4);
        ctx.fillStyle = equation.color;
      }

      switch (element.type) {
        case 'text':
        case 'symbol':
          ctx.fillText(element.content, x, y);
          return ctx.measureText(element.content).width;

        case 'space':
          return parseInt(element.content) || 10;

        case 'template':
          return renderTemplate(ctx, element, x, y);

        default:
          return 0;
      }
    };

    const renderTemplate = (
      ctx: CanvasRenderingContext2D,
      element: EquationElement,
      x: number,
      y: number
    ): number => {
      switch (element.templateType) {
        case TemplateType.Fraction:
          return renderFraction(ctx, element, x, y);
        case TemplateType.Superscript:
          return renderSuperscript(ctx, element, x, y);
        case TemplateType.Subscript:
          return renderSubscript(ctx, element, x, y);
        case TemplateType.Radical:
          return renderRadical(ctx, element, x, y);
        case TemplateType.Integral:
          return renderIntegral(ctx, element, x, y);
        // Add more template renderers as needed
        default:
          return 50;
      }
    };

    const renderFraction = (
      ctx: CanvasRenderingContext2D,
      element: EquationElement,
      x: number,
      y: number
    ): number => {
      if (!element.children || element.children.length < 2) return 0;

      const numerator = element.children[0];
      const denominator = element.children[1];

      const numWidth = getElementWidth(ctx, numerator);
      const denWidth = getElementWidth(ctx, denominator);
      const maxWidth = Math.max(numWidth, denWidth);

      // Save current font
      const savedFont = ctx.font;
      ctx.font = `${equation.fontSize * 0.8}px "Cambria Math", "Times New Roman", serif`;

      // Render numerator
      renderElement(
        ctx,
        numerator,
        x + (maxWidth - numWidth) / 2,
        y - equation.fontSize * 0.4,
        false
      );

      // Draw fraction line
      ctx.strokeStyle = equation.color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + maxWidth, y);
      ctx.stroke();

      // Render denominator
      renderElement(
        ctx,
        denominator,
        x + (maxWidth - denWidth) / 2,
        y + equation.fontSize * 0.4,
        false
      );

      // Restore font
      ctx.font = savedFont;

      return maxWidth + 10;
    };

    const renderSuperscript = (
      ctx: CanvasRenderingContext2D,
      element: EquationElement,
      x: number,
      y: number
    ): number => {
      if (!element.children || element.children.length < 2) return 0;

      const base = element.children[0];
      const superscript = element.children[1];

      // Render base
      const baseWidth = renderElement(ctx, base, x, y, false);

      // Save and modify font for superscript
      const savedFont = ctx.font;
      ctx.font = `${equation.fontSize * 0.7}px "Cambria Math", "Times New Roman", serif`;

      // Render superscript
      const scriptWidth = renderElement(
        ctx,
        superscript,
        x + baseWidth,
        y - equation.fontSize * 0.3,
        false
      );

      // Restore font
      ctx.font = savedFont;

      return baseWidth + scriptWidth;
    };

    const renderSubscript = (
      ctx: CanvasRenderingContext2D,
      element: EquationElement,
      x: number,
      y: number
    ): number => {
      if (!element.children || element.children.length < 2) return 0;

      const base = element.children[0];
      const subscript = element.children[1];

      // Render base
      const baseWidth = renderElement(ctx, base, x, y, false);

      // Save and modify font for subscript
      const savedFont = ctx.font;
      ctx.font = `${equation.fontSize * 0.7}px "Cambria Math", "Times New Roman", serif`;

      // Render subscript
      const scriptWidth = renderElement(
        ctx,
        subscript,
        x + baseWidth,
        y + equation.fontSize * 0.3,
        false
      );

      // Restore font
      ctx.font = savedFont;

      return baseWidth + scriptWidth;
    };

    const renderRadical = (
      ctx: CanvasRenderingContext2D,
      element: EquationElement,
      x: number,
      y: number
    ): number => {
      if (!element.children || element.children.length < 1) return 0;

      const content = element.children[0];
      const contentWidth = getElementWidth(ctx, content);

      // Draw radical symbol
      ctx.strokeStyle = equation.color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 5, y + equation.fontSize * 0.3);
      ctx.lineTo(x + 10, y - equation.fontSize * 0.5);
      ctx.lineTo(x + 15 + contentWidth, y - equation.fontSize * 0.5);
      ctx.stroke();

      // Render content under radical
      renderElement(ctx, content, x + 15, y, false);

      return contentWidth + 20;
    };

    const renderIntegral = (
      ctx: CanvasRenderingContext2D,
      element: EquationElement,
      x: number,
      y: number
    ): number => {
      // Draw integral symbol
      ctx.font = `${equation.fontSize * 1.5}px "Cambria Math", "Times New Roman", serif`;
      ctx.fillText('∫', x, y);
      const integralWidth = ctx.measureText('∫').width;

      // Reset font
      ctx.font = `${equation.fontSize}px "Cambria Math", "Times New Roman", serif`;

      return integralWidth + 5;
    };

    // VB6 Methods implementation
    const vb6Methods = {
      // Properties
      get Equation() {
        return equation;
      },
      set Equation(value: EquationDocument) {
        setEquation(value);
        onChange?.({ equation: value });
      },

      get IsEditing() {
        return isEditing;
      },
      set IsEditing(value: boolean) {
        setIsEditing(value);
      },

      // Methods
      InsertSymbol: (symbol: string, category?: SymbolCategory) => {
        const newElement: EquationElement = {
          type: 'symbol',
          content: symbol,
          category,
        };
        insertElement(newElement);
      },

      InsertText: (text: string) => {
        const newElement: EquationElement = {
          type: 'text',
          content: text,
        };
        insertElement(newElement);
      },

      InsertTemplate: (templateType: TemplateType) => {
        const newElement: EquationElement = {
          type: 'template',
          content: '',
          templateType,
          children: getDefaultTemplateChildren(templateType),
        };
        insertElement(newElement);
      },

      InsertSpace: (width: number = 10) => {
        const newElement: EquationElement = {
          type: 'space',
          content: width.toString(),
        };
        insertElement(newElement);
      },

      Clear: () => {
        setEquation(prev => ({ ...prev, elements: [] }));
        setCursorPosition(0);
        setSelectedElement(null);
      },

      GetLaTeX: (): string => {
        return convertToLaTeX(equation.elements);
      },

      GetMathML: (): string => {
        return convertToMathML(equation.elements);
      },

      LoadFromLaTeX: (latex: string) => {
        const elements = parseLaTeX(latex);
        setEquation(prev => ({ ...prev, elements }));
      },

      LoadFromMathML: (mathml: string) => {
        const elements = parseMathML(mathml);
        setEquation(prev => ({ ...prev, elements }));
      },

      Print: () => {
        if (canvasRef.current) {
          const dataUrl = canvasRef.current.toDataURL();
          const win = window.open();
          if (win) {
            win.document.write(`<img src="${dataUrl}" />`);
            win.print();
          }
        }
      },

      SaveAsImage: (format: 'png' | 'jpeg' = 'png'): string => {
        if (canvasRef.current) {
          return canvasRef.current.toDataURL(`image/${format}`);
        }
        return '';
      },
    };

    const insertElement = (element: EquationElement) => {
      setEquation(prev => {
        const newElements = [...prev.elements];
        newElements.splice(cursorPosition, 0, element);
        return { ...prev, elements: newElements };
      });
      setCursorPosition(prev => prev + 1);
    };

    const getDefaultTemplateChildren = (templateType: TemplateType): EquationElement[] => {
      switch (templateType) {
        case TemplateType.Fraction:
          return [
            { type: 'text', content: '' },
            { type: 'text', content: '' },
          ];
        case TemplateType.Superscript:
        case TemplateType.Subscript:
          return [
            { type: 'text', content: '' },
            { type: 'text', content: '' },
          ];
        case TemplateType.Radical:
          return [{ type: 'text', content: '' }];
        default:
          return [];
      }
    };

    const convertToLaTeX = (elements: EquationElement[]): string => {
      return elements
        .map(element => {
          switch (element.type) {
            case 'text':
              return element.content;
            case 'symbol':
              return `\\${element.content}`;
            case 'space':
              return '\\,';
            case 'template':
              return convertTemplateToLaTeX(element);
            default:
              return '';
          }
        })
        .join('');
    };

    const convertTemplateToLaTeX = (element: EquationElement): string => {
      if (!element.children) return '';

      switch (element.templateType) {
        case TemplateType.Fraction:
          return `\\frac{${convertToLaTeX(element.children[0] ? [element.children[0]] : [])}}{${convertToLaTeX(element.children[1] ? [element.children[1]] : [])}}`;
        case TemplateType.Superscript:
          return `{${convertToLaTeX(element.children[0] ? [element.children[0]] : [])}}^{${convertToLaTeX(element.children[1] ? [element.children[1]] : [])}}`;
        case TemplateType.Subscript:
          return `{${convertToLaTeX(element.children[0] ? [element.children[0]] : [])}}_{${convertToLaTeX(element.children[1] ? [element.children[1]] : [])}}`;
        case TemplateType.Radical:
          return `\\sqrt{${convertToLaTeX(element.children)}}`;
        default:
          return '';
      }
    };

    const convertToMathML = (elements: EquationElement[]): string => {
      // Simplified MathML conversion
      const content = elements
        .map(element => {
          switch (element.type) {
            case 'text':
              return `<mi>${element.content}</mi>`;
            case 'symbol':
              return `<mo>${element.content}</mo>`;
            case 'space':
              return '<mspace width="1em"/>';
            case 'template':
              return convertTemplateToMathML(element);
            default:
              return '';
          }
        })
        .join('');

      return `<math xmlns="http://www.w3.org/1998/Math/MathML">${content}</math>`;
    };

    const convertTemplateToMathML = (element: EquationElement): string => {
      if (!element.children) return '';

      switch (element.templateType) {
        case TemplateType.Fraction:
          return `<mfrac><mrow>${convertToMathML(element.children[0] ? [element.children[0]] : [])}</mrow><mrow>${convertToMathML(element.children[1] ? [element.children[1]] : [])}</mrow></mfrac>`;
        case TemplateType.Superscript:
          return `<msup><mrow>${convertToMathML(element.children[0] ? [element.children[0]] : [])}</mrow><mrow>${convertToMathML(element.children[1] ? [element.children[1]] : [])}</mrow></msup>`;
        case TemplateType.Subscript:
          return `<msub><mrow>${convertToMathML(element.children[0] ? [element.children[0]] : [])}</mrow><mrow>${convertToMathML(element.children[1] ? [element.children[1]] : [])}</mrow></msub>`;
        case TemplateType.Radical:
          return `<msqrt>${convertToMathML(element.children)}</msqrt>`;
        default:
          return '';
      }
    };

    const parseLaTeX = (latex: string): EquationElement[] => {
      // Simplified LaTeX parser - would need full implementation
      const elements: EquationElement[] = [];
      // Basic text parsing
      elements.push({ type: 'text', content: latex });
      return elements;
    };

    const parseMathML = (mathml: string): EquationElement[] => {
      // Simplified MathML parser - would need full implementation
      const elements: EquationElement[] = [];
      return elements;
    };

    // Expose methods to parent
    useEffect(() => {
      if (control.ref && typeof control.ref === 'object' && 'current' in control.ref) {
        control.ref.current = vb6Methods;
      }
    }, [control.ref, vb6Methods]);

    const containerStyle: React.CSSProperties = {
      position: 'absolute',
      left: control.x || 0,
      top: control.y || 0,
      width: control.width || 400,
      height: control.height || 100,
      backgroundColor: control.backColor || '#FFFFFF',
      border: control.borderStyle
        ? `${control.borderWidth || 1}px solid ${control.borderColor || '#000000'}`
        : '1px solid #808080',
      boxShadow:
        control.appearance === '3D' ? 'inset -1px -1px #404040, inset 1px 1px #ffffff' : 'none',
      overflow: 'hidden',
      cursor: isEditing ? 'text' : 'default',
      opacity: control.visible !== false ? 1 : 0,
      zIndex: control.zIndex || 'auto',
    };

    const handleClick = (e: React.MouseEvent) => {
      if (!isDesignMode) {
        setIsEditing(true);
      }
      onClick?.(e);
    };

    const handleDoubleClick = (e: React.MouseEvent) => {
      if (!isDesignMode) {
        setIsEditing(true);
        // Open equation editor dialog
      }
      onDoubleClick?.(e);
    };

    return (
      <div
        ref={ref}
        style={containerStyle}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        data-control-type="MSEEControl"
        data-control-name={control.name}
      >
        {isDesignMode && equation.elements.length === 0 ? (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#808080',
              fontSize: '14px',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', marginBottom: '4px' }}>∑</div>
              <div>Equation Editor</div>
            </div>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              height: '100%',
            }}
          />
        )}
      </div>
    );
  }
);

MSEEControl.displayName = 'MSEEControl';

export default MSEEControl;
