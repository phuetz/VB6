export const getDefaultProperties = (type: string, id: number) => {
  console.log('Getting default properties for:', type, id);
  
  const baseProps = {
    id,
    type,
    name: `${type}${id}`,
    x: 100,
    y: 100,
    visible: true,
    enabled: true,
    tabIndex: id,
    tabStop: true,
    tag: '',
    toolTipText: ''
  };

  const typeSpecificProps: { [key: string]: any } = {
    CommandButton: {
      width: 89,
      height: 25,
      caption: `Command${id}`,
      default: false,
      cancel: false,
      style: 0,
      backColor: '#C0C0C0',
      foreColor: '#000000',
      font: { name: 'MS Sans Serif', size: 8, bold: false, italic: false, underline: false }
    },
    Label: {
      width: 65,
      height: 17,
      caption: `Label${id}`,
      autoSize: false,
      alignment: 0,
      backStyle: 0,
      backColor: '#8080FF',
      foreColor: '#000000',
      font: { name: 'MS Sans Serif', size: 8, bold: false, italic: false, underline: false },
      wordWrap: false,
      borderStyle: 0
    },
    TextBox: {
      width: 121,
      height: 21,
      text: '',
      multiLine: false,
      scrollBars: 0,
      alignment: 0,
      backColor: '#FFFFFF',
      foreColor: '#000000',
      font: { name: 'MS Sans Serif', size: 8, bold: false, italic: false, underline: false },
      maxLength: 0,
      passwordChar: '',
      locked: false,
      borderStyle: 1
    },
    Frame: {
      width: 121,
      height: 97,
      caption: `Frame${id}`,
      backColor: '#C0C0C0',
      foreColor: '#000000',
      font: { name: 'MS Sans Serif', size: 8, bold: false, italic: false, underline: false }
    },
    CheckBox: {
      width: 121,
      height: 17,
      caption: `Check${id}`,
      value: 0,
      alignment: 0,
      backColor: 'transparent',
      foreColor: '#000000',
      font: { name: 'MS Sans Serif', size: 8, bold: false, italic: false, underline: false }
    },
    OptionButton: {
      width: 121,
      height: 17,
      caption: `Option${id}`,
      value: false,
      alignment: 0,
      backColor: 'transparent',
      foreColor: '#000000',
      font: { name: 'MS Sans Serif', size: 8, bold: false, italic: false, underline: false }
    },
    ListBox: {
      width: 121,
      height: 97,
      backColor: '#FFFFFF',
      foreColor: '#000000',
      font: { name: 'MS Sans Serif', size: 8, bold: false, italic: false, underline: false },
      multiSelect: 0,
      sorted: false,
      style: 0,
      items: []
    },
    ComboBox: {
      width: 121,
      height: 21,
      text: '',
      backColor: '#FFFFFF',
      foreColor: '#000000',
      font: { name: 'MS Sans Serif', size: 8, bold: false, italic: false, underline: false },
      style: 0,
      sorted: false,
      items: []
    },
    Timer: {
      width: 32,
      height: 32,
      interval: 0,
      enabled: true
    },
    PictureBox: {
      width: 121,
      height: 97,
      backColor: '#C0C0C0',
      borderStyle: 1,
      picture: null,
      autoSize: false
    },
    Image: {
      width: 121,
      height: 97,
      picture: null,
      stretch: false,
      borderStyle: 0
    },
    Shape: {
      width: 65,
      height: 65,
      shape: 0,
      backStyle: 0,
      backColor: '#C0C0C0',
      borderStyle: 1,
      borderColor: '#000000',
      borderWidth: 1
    },
    Line: {
      width: 100,
      height: 2,
      x2: 200,
      y2: 102,
      borderColor: '#000000',
      borderStyle: 1,
      borderWidth: 1
    },
    HScrollBar: {
      width: 121,
      height: 17,
      min: 0,
      max: 32767,
      value: 0,
      smallChange: 1,
      largeChange: 1
    },
    VScrollBar: {
      width: 17,
      height: 121,
      min: 0,
      max: 32767,
      value: 0,
      smallChange: 1,
      largeChange: 1
    }
  };

  return { ...baseProps, ...(typeSpecificProps[type] || {}) };
};