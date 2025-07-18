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
    },
    DriveListBox: {
      width: 121,
      height: 97,
      backColor: '#FFFFFF',
      foreColor: '#000000',
      font: { name: 'MS Sans Serif', size: 8, bold: false, italic: false, underline: false },
      items: ['C:', 'D:', 'E:'],
      value: 'C:'
    },
    DirListBox: {
      width: 121,
      height: 97,
      backColor: '#FFFFFF',
      foreColor: '#000000',
      font: { name: 'MS Sans Serif', size: 8, bold: false, italic: false, underline: false },
      items: ['Folder1', 'Folder2'],
      value: 'Folder1'
    },
    FileListBox: {
      width: 121,
      height: 97,
      backColor: '#FFFFFF',
      foreColor: '#000000',
      font: { name: 'MS Sans Serif', size: 8, bold: false, italic: false, underline: false },
      items: ['File1.txt', 'File2.txt'],
      value: 'File1.txt'
    },
    Data: {
      width: 121,
      height: 21,
      databaseName: '',
      recordSource: '',
      recordset: null
    },
    OLE: {
      width: 121,
      height: 97,
      class: '',
      displayType: 0,
      autoActivate: true
    },
    ProgressBar: {
      width: 121,
      height: 21,
      min: 0,
      max: 100,
      value: 0,
      backColor: '#C0C0C0',
      foreColor: '#0078D4'
    },
    Slider: {
      width: 121,
      height: 21,
      min: 0,
      max: 100,
      value: 0,
      orientation: 'horizontal',
      backColor: '#C0C0C0',
      foreColor: '#000000'
    },
    UpDown: {
      width: 17,
      height: 21,
      min: 0,
      max: 100,
      value: 0,
      increment: 1,
      orientation: 'vertical'
    },
    TabStrip: {
      width: 241,
      height: 145,
      tabs: ['Tab1', 'Tab2'],
      selectedIndex: 0,
      backColor: '#C0C0C0',
      foreColor: '#000000',
      font: { name: 'MS Sans Serif', size: 8, bold: false, italic: false, underline: false }
    },
    Toolbar: {
      width: 241,
      height: 25,
      buttons: ['New', 'Open', 'Save'],
      backColor: '#C0C0C0',
      foreColor: '#000000'
    },
    ListView: {
      width: 121,
      height: 97,
      columns: ['Column1', 'Column2'],
      items: [
        { text: 'Item1', subItems: ['Sub1', 'Sub2'] },
        { text: 'Item2', subItems: ['Sub1', 'Sub2'] }
      ],
      view: 'report',
      backColor: '#FFFFFF',
      foreColor: '#000000',
      font: { name: 'MS Sans Serif', size: 8, bold: false, italic: false, underline: false }
    },
    StatusBar: {
      width: 241,
      height: 21,
      panels: ['Ready'],
      backColor: '#C0C0C0',
      foreColor: '#000000'
    },
    ImageList: {
      width: 32,
      height: 32,
      images: [],
      imageWidth: 16,
      imageHeight: 16,
      backColor: '#FFFFFF',
      foreColor: '#000000'
    },
    TreeView: {
      width: 121,
      height: 97,
      nodes: ['Node1', 'Node2'],
      backColor: '#FFFFFF',
      foreColor: '#000000',
      font: { name: 'MS Sans Serif', size: 8, bold: false, italic: false, underline: false }
    },
    DateTimePicker: {
      width: 121,
      height: 21,
      value: new Date().toISOString(),
      backColor: '#FFFFFF',
      foreColor: '#000000',
      font: { name: 'MS Sans Serif', size: 8, bold: false, italic: false, underline: false }
    },
    MonthView: {
      width: 161,
      height: 161,
      value: new Date().toISOString().substring(0, 10),
      backColor: '#FFFFFF',
      foreColor: '#000000',
      font: { name: 'MS Sans Serif', size: 8, bold: false, italic: false, underline: false }
    },
    RichTextBox: {
      width: 121,
      height: 97,
      text: '',
      scrollBars: 3,
      backColor: '#FFFFFF',
      foreColor: '#000000',
      font: { name: 'MS Sans Serif', size: 8, bold: false, italic: false, underline: false },
      locked: false,
      borderStyle: 1
    },
    ImageCombo: {
      width: 121,
      height: 21,
      text: '',
      items: [],
      images: [],
      imageWidth: 16,
      imageHeight: 16,
      style: 0,
      sorted: false,
      backColor: '#FFFFFF',
      foreColor: '#000000',
      font: { name: 'MS Sans Serif', size: 8, bold: false, italic: false, underline: false }
    },
    Animation: {
      width: 121,
      height: 97,
      file: '',
      autoPlay: true,
      loop: true,
      backColor: '#000000'
    },
    FlatScrollBar: {
      width: 121,
      height: 17,
      min: 0,
      max: 32767,
      value: 0,
      smallChange: 1,
      largeChange: 1,
      orientation: 'horizontal',
      backColor: '#C0C0C0',
      foreColor: '#000000'
    },
    MaskedEdit: {
      width: 121,
      height: 21,
      text: '',
      mask: '',
      backColor: '#FFFFFF',
      foreColor: '#000000',
      font: { name: 'MS Sans Serif', size: 8, bold: false, italic: false, underline: false }
    },
    WebBrowser: {
      width: 241,
      height: 181,
      url: 'about:blank'
    },
    Inet: {
      width: 32,
      height: 32,
      url: '',
      method: 'GET'
    },
    Winsock: {
      width: 32,
      height: 32,
      protocol: 'TCP',
      remoteHost: '',
      remotePort: 0
    },
    DataGrid: {
      width: 241,
      height: 145,
      columns: [],
      data: []
    },
    DataList: {
      width: 121,
      height: 97,
      rows: []
    },
    DataCombo: {
      width: 121,
      height: 21,
      text: '',
      items: []
    },
    DataRepeater: {
      width: 241,
      height: 145,
      dataSource: '',
      repeatedControl: ''
    },
    DataEnvironment: {
      width: 32,
      height: 32
    },
    DataReport: {
      width: 241,
      height: 181
    },
    CrystalReport: {
      width: 32,
      height: 32
    },
    MediaPlayer: {
      width: 241,
      height: 181,
      file: ''
    },
    MMControl: {
      width: 241,
      height: 25,
      file: ''
    }
  };

  return { ...baseProps, ...(typeSpecificProps[type] || {}) };
};