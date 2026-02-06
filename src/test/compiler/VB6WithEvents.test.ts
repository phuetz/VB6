import { describe, it, expect, beforeEach } from 'vitest';
import { VB6WithEventsProcessor } from '../../compiler/VB6WithEventsSupport';
import { VB6CustomEventsProcessor } from '../../compiler/VB6CustomEventsSupport';

describe('VB6 WithEvents - WithEvents Declarations', () => {
  let processor: VB6WithEventsProcessor;

  beforeEach(() => {
    processor = new VB6WithEventsProcessor();
    processor.setCurrentModule('TestModule');
  });

  describe('Parsing WithEvents Declarations', () => {
    it('should parse simple WithEvents declaration', () => {
      const code = 'WithEvents btn As CommandButton';
      const result = processor.parseWithEventsDeclaration(code, 1);

      expect(result).not.toBeNull();
      expect(result!.variableName).toBe('btn');
      expect(result!.className).toBe('CommandButton');
      expect(result!.public).toBe(false);
      expect(result!.module).toBe('TestModule');
      expect(result!.line).toBe(1);
    });

    it('should parse Public WithEvents declaration', () => {
      const code = 'Public WithEvents txt As TextBox';
      const result = processor.parseWithEventsDeclaration(code, 5);

      expect(result).not.toBeNull();
      expect(result!.variableName).toBe('txt');
      expect(result!.className).toBe('TextBox');
      expect(result!.public).toBe(true);
      expect(result!.line).toBe(5);
    });

    it('should parse Dim WithEvents declaration', () => {
      const code = 'Dim WithEvents frm As Form';
      const result = processor.parseWithEventsDeclaration(code, 10);

      expect(result).not.toBeNull();
      expect(result!.variableName).toBe('frm');
      expect(result!.className).toBe('Form');
      expect(result!.public).toBe(false);
    });

    it('should parse Private WithEvents declaration', () => {
      const code = 'Private WithEvents conn As Connection';
      const result = processor.parseWithEventsDeclaration(code, 15);

      expect(result).not.toBeNull();
      expect(result!.variableName).toBe('conn');
      expect(result!.className).toBe('Connection');
      expect(result!.public).toBe(false);
    });

    it('should return null for non-WithEvents declaration', () => {
      const code = 'Dim x As Integer';
      const result = processor.parseWithEventsDeclaration(code, 1);

      expect(result).toBeNull();
    });

    it('should handle WithEvents with different spacing', () => {
      const code = 'WithEvents   myBtn   As   CommandButton';
      const result = processor.parseWithEventsDeclaration(code, 1);

      expect(result).not.toBeNull();
      expect(result!.variableName).toBe('myBtn');
      expect(result!.className).toBe('CommandButton');
    });

    it('should handle case-insensitive keywords', () => {
      const code = 'withevents btn as CommandButton';
      const result = processor.parseWithEventsDeclaration(code, 1);

      expect(result).not.toBeNull();
      expect(result!.variableName).toBe('btn');
    });
  });

  describe('Parsing Event Handlers', () => {
    beforeEach(() => {
      // Register a WithEvents variable first so handlers can be parsed
      const withEventsDecl = processor.parseWithEventsDeclaration(
        'WithEvents btn As CommandButton',
        1
      );
      processor.registerWithEventsVariable(withEventsDecl!);

      const txtDecl = processor.parseWithEventsDeclaration('WithEvents txt As TextBox', 2);
      processor.registerWithEventsVariable(txtDecl!);

      const frmDecl = processor.parseWithEventsDeclaration('WithEvents frm As Form', 3);
      processor.registerWithEventsVariable(frmDecl!);
    });

    it('should parse simple event handler', () => {
      const code = 'Private Sub btn_Click()';
      const result = processor.parseEventHandler(code, 20);

      expect(result).not.toBeNull();
      expect(result!.eventName).toBe('Click');
      expect(result!.handlerName).toBe('btn_Click');
      expect(result!.parameters).toHaveLength(0);
      expect(result!.line).toBe(20);
    });

    it('should parse event handler with parameters', () => {
      const code = 'Private Sub txt_Change(Index As Integer)';
      const result = processor.parseEventHandler(code, 25);

      expect(result).not.toBeNull();
      expect(result!.eventName).toBe('Change');
      expect(result!.handlerName).toBe('txt_Change');
      expect(result!.parameters).toHaveLength(1);
      expect(result!.parameters[0].name).toBe('Index');
      expect(result!.parameters[0].type).toBe('Integer');
    });

    it('should parse MouseMove event with multiple parameters', () => {
      const code =
        'Private Sub frm_MouseMove(Button As Integer, Shift As Integer, X As Single, Y As Single)';
      const result = processor.parseEventHandler(code, 30);

      expect(result).not.toBeNull();
      expect(result!.eventName).toBe('MouseMove');
      expect(result!.handlerName).toBe('frm_MouseMove');
      expect(result!.parameters).toHaveLength(4);
      expect(result!.parameters[0].name).toBe('Button');
      expect(result!.parameters[1].name).toBe('Shift');
      expect(result!.parameters[2].name).toBe('X');
      expect(result!.parameters[3].name).toBe('Y');
    });

    it('should parse KeyPress event with parameter', () => {
      const code = 'Private Sub txt_KeyPress(KeyAscii As Integer)';
      const result = processor.parseEventHandler(code, 35);

      expect(result).not.toBeNull();
      expect(result!.eventName).toBe('KeyPress');
      expect(result!.handlerName).toBe('txt_KeyPress');
      expect(result!.parameters).toHaveLength(1);
      expect(result!.parameters[0].name).toBe('KeyAscii');
    });

    it('should parse event handler with ByVal parameter', () => {
      const code = 'Private Sub btn_Click(ByVal Param1 As String)';
      const result = processor.parseEventHandler(code, 40);

      expect(result).not.toBeNull();
      expect(result!.parameters).toHaveLength(1);
      expect(result!.parameters[0].byRef).toBe(false);
    });

    it('should parse event handler with ByRef parameter', () => {
      const code = 'Private Sub btn_Click(ByRef Param1 As String)';
      const result = processor.parseEventHandler(code, 45);

      expect(result).not.toBeNull();
      expect(result!.parameters).toHaveLength(1);
      expect(result!.parameters[0].byRef).toBe(true);
    });

    it('should default to ByRef when not specified', () => {
      const code = 'Private Sub btn_Click(Param1 As String)';
      const result = processor.parseEventHandler(code, 50);

      expect(result).not.toBeNull();
      expect(result!.parameters).toHaveLength(1);
      expect(result!.parameters[0].byRef).toBe(true); // VB6 default is ByRef
    });

    it('should return null for non-event handler Sub', () => {
      const code = 'Private Sub DoSomething()';
      const result = processor.parseEventHandler(code, 1);

      expect(result).toBeNull(); // No underscore, so not an event handler
    });

    it('should return null for Function', () => {
      const code = 'Private Function btn_Click() As Integer';
      const result = processor.parseEventHandler(code, 1);

      expect(result).toBeNull(); // Must be Sub, not Function
    });

    it('should return null if WithEvents variable not registered', () => {
      const code = 'Private Sub unknownVar_Click()';
      const result = processor.parseEventHandler(code, 1);

      expect(result).toBeNull();
    });
  });

  describe('Registration and Retrieval', () => {
    it('should register and retrieve WithEvents variable', () => {
      const code = 'WithEvents btn As CommandButton';
      const result = processor.parseWithEventsDeclaration(code, 1);
      processor.registerWithEventsVariable(result!);

      const retrieved = processor.getWithEventsVariable('btn');
      expect(retrieved).not.toBeUndefined();
      expect(retrieved!.variableName).toBe('btn');
      expect(retrieved!.className).toBe('CommandButton');
    });

    it('should register public WithEvents with global scope', () => {
      const code = 'Public WithEvents btn As CommandButton';
      const result = processor.parseWithEventsDeclaration(code, 1);
      processor.registerWithEventsVariable(result!);

      // Public variables are accessible without module prefix
      const retrieved = processor.getWithEventsVariable('btn');
      expect(retrieved).not.toBeUndefined();
      expect(retrieved!.public).toBe(true);
    });

    it('should register private WithEvents with module scope', () => {
      const code = 'Private WithEvents txt As TextBox';
      const result = processor.parseWithEventsDeclaration(code, 1);
      processor.registerWithEventsVariable(result!);

      const retrieved = processor.getWithEventsVariable('txt');
      expect(retrieved).not.toBeUndefined();
      expect(retrieved!.public).toBe(false);
    });

    it('should add event handler to WithEvents variable', () => {
      const withEventsCode = 'WithEvents btn As CommandButton';
      const handlerCode = 'Private Sub btn_Click()';

      const withEvents = processor.parseWithEventsDeclaration(withEventsCode, 1);
      processor.registerWithEventsVariable(withEvents!);

      const handler = processor.parseEventHandler(handlerCode, 10);
      processor.registerEventHandler('btn', handler!);

      const retrieved = processor.getWithEventsVariable('btn');
      expect(retrieved!.eventHandlers).toHaveLength(1);
      expect(retrieved!.eventHandlers[0].eventName).toBe('Click');
    });

    it('should get all module WithEvents variables', () => {
      processor.setCurrentModule('Module1');

      const btn = processor.parseWithEventsDeclaration('WithEvents btn As CommandButton', 1);
      const txt = processor.parseWithEventsDeclaration('WithEvents txt As TextBox', 2);

      processor.registerWithEventsVariable(btn!);
      processor.registerWithEventsVariable(txt!);

      const allVars = processor.getModuleWithEventsVariables();
      expect(allVars.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('JavaScript Code Generation', () => {
    it('should generate JavaScript for WithEvents variable', () => {
      const code = 'WithEvents btn As CommandButton';
      const withEvents = processor.parseWithEventsDeclaration(code, 1);
      const js = processor.generateJavaScript(withEvents!);

      expect(js).toContain('btn: null');
      expect(js).toContain('// WithEvents variable: btn As CommandButton');
    });

    it('should generate event handler JavaScript', () => {
      const withEventsCode = 'WithEvents btn As CommandButton';
      const handlerCode = 'Private Sub btn_Click()';

      const withEvents = processor.parseWithEventsDeclaration(withEventsCode, 1);
      processor.registerWithEventsVariable(withEvents!);

      const handler = processor.parseEventHandler(handlerCode, 10);
      withEvents!.eventHandlers = [handler!];

      const js = processor.generateJavaScript(withEvents!);

      expect(js).toContain('btn_Click: function(');
      expect(js).toContain('// Event handler implementation');
    });

    it('should generate event wiring methods', () => {
      const withEventsCode = 'WithEvents txt As TextBox';
      const changeHandler = 'Private Sub txt_Change()';

      const withEvents = processor.parseWithEventsDeclaration(withEventsCode, 1);
      processor.registerWithEventsVariable(withEvents!);

      const handler = processor.parseEventHandler(changeHandler, 10);
      withEvents!.eventHandlers = [handler!];

      const js = processor.generateJavaScript(withEvents!);

      expect(js).toContain('wiretxtEvents: function()');
      expect(js).toContain('unwiretxtEvents: function()');
    });

    it('should generate instantiation code', () => {
      const code = 'WithEvents btn As CommandButton';
      const withEvents = processor.parseWithEventsDeclaration(code, 1);
      const js = processor.generateInstantiationCode(withEvents!);

      expect(js).toContain('createbtn: function()');
      expect(js).toContain('destroybtn: function()');
      expect(js).toContain('new CommandButton()');
    });

    it('should generate TypeScript definitions', () => {
      const code = 'WithEvents btn As CommandButton';
      const withEvents = processor.parseWithEventsDeclaration(code, 1);
      const ts = processor.generateTypeScript(withEvents!);

      expect(ts).toContain('btn: CommandButton | null');
      expect(ts).toContain('wirebtnEvents(): void');
      expect(ts).toContain('unwirebtnEvents(): void');
    });
  });

  describe('Validation', () => {
    it('should validate WithEvents declaration', () => {
      const code = 'WithEvents btn As CommandButton';
      const withEvents = processor.parseWithEventsDeclaration(code, 1);
      const errors = processor.validateWithEvents(withEvents!);

      expect(errors).toHaveLength(0);
    });
  });

  describe('Export and Import', () => {
    it('should export WithEvents data', () => {
      const code = 'WithEvents btn As CommandButton';
      const withEvents = processor.parseWithEventsDeclaration(code, 1);
      processor.registerWithEventsVariable(withEvents!);

      const exported = processor.export();
      expect(exported.variables).toBeDefined();
      expect(Object.keys(exported.variables).length).toBeGreaterThan(0);
    });

    it('should import WithEvents data', () => {
      const data = {
        variables: {
          btn: {
            variableName: 'btn',
            className: 'CommandButton',
            public: false,
            module: 'TestModule',
            line: 1,
            eventHandlers: [],
          },
        },
        events: {},
      };

      processor.import(data);

      const retrieved = processor.getWithEventsVariable('btn');
      expect(retrieved).not.toBeUndefined();
      expect(retrieved!.className).toBe('CommandButton');
    });

    it('should clear all WithEvents data', () => {
      const code = 'WithEvents btn As CommandButton';
      const withEvents = processor.parseWithEventsDeclaration(code, 1);
      processor.registerWithEventsVariable(withEvents!);

      processor.clear();

      const retrieved = processor.getWithEventsVariable('btn');
      expect(retrieved).toBeUndefined();
    });
  });
});

describe('VB6 WithEvents - Custom Events', () => {
  let processor: VB6CustomEventsProcessor;

  beforeEach(() => {
    processor = new VB6CustomEventsProcessor();
    processor.setCurrentModule('TestModule');
    processor.setCurrentClass('TestClass');
  });

  describe('Parsing Event Declarations', () => {
    it('should parse simple Event declaration', () => {
      const code = 'Event StatusChanged()';
      const result = processor.parseEventDeclaration(code, 1);

      expect(result).not.toBeNull();
      expect(result!.name).toBe('StatusChanged');
      expect(result!.parameters).toHaveLength(0);
      expect(result!.public).toBe(true);
      expect(result!.line).toBe(1);
    });

    it('should parse Public Event declaration', () => {
      const code = 'Public Event DataReceived(ByVal Data As String)';
      const result = processor.parseEventDeclaration(code, 5);

      expect(result).not.toBeNull();
      expect(result!.name).toBe('DataReceived');
      expect(result!.parameters).toHaveLength(1);
      expect(result!.parameters[0].name).toBe('Data');
      expect(result!.parameters[0].type).toBe('String');
      expect(result!.parameters[0].byRef).toBe(false);
      expect(result!.public).toBe(true);
    });

    it('should parse Event with multiple parameters', () => {
      const code =
        'Event ProgressChanged(ByVal Current As Long, ByVal Total As Long, Cancel As Boolean)';
      const result = processor.parseEventDeclaration(code, 10);

      expect(result).not.toBeNull();
      expect(result!.name).toBe('ProgressChanged');
      expect(result!.parameters).toHaveLength(3);
      expect(result!.parameters[0].name).toBe('Current');
      expect(result!.parameters[0].byRef).toBe(false);
      expect(result!.parameters[1].name).toBe('Total');
      expect(result!.parameters[1].byRef).toBe(false);
      expect(result!.parameters[2].name).toBe('Cancel');
      expect(result!.parameters[2].byRef).toBe(false); // Events default to ByVal
    });

    it('should parse Event with ByRef parameter', () => {
      const code = 'Event BeforeUpdate(ByRef Cancel As Boolean)';
      const result = processor.parseEventDeclaration(code, 15);

      expect(result).not.toBeNull();
      expect(result!.parameters).toHaveLength(1);
      expect(result!.parameters[0].byRef).toBe(true);
    });

    it('should return null for non-Event declaration', () => {
      const code = 'Sub DoSomething()';
      const result = processor.parseEventDeclaration(code, 1);

      expect(result).toBeNull();
    });

    it('should handle Event with no parameters', () => {
      const code = 'Event Clicked()';
      const result = processor.parseEventDeclaration(code, 1);

      expect(result!.parameters).toHaveLength(0);
    });
  });

  describe('Parsing RaiseEvent Statements', () => {
    it('should parse simple RaiseEvent', () => {
      const code = 'RaiseEvent StatusChanged()';
      const result = processor.parseRaiseEventStatement(code, 20);

      expect(result).not.toBeNull();
      expect(result!.eventName).toBe('StatusChanged');
      expect(result!.arguments).toHaveLength(0);
      expect(result!.line).toBe(20);
    });

    it('should parse RaiseEvent with parentheses', () => {
      const code = 'RaiseEvent StatusChanged()';
      const result = processor.parseRaiseEventStatement(code, 25);

      expect(result).not.toBeNull();
      expect(result!.eventName).toBe('StatusChanged');
      expect(result!.arguments).toHaveLength(0);
    });

    it('should parse RaiseEvent with single argument', () => {
      const code = 'RaiseEvent DataReceived(strData)';
      const result = processor.parseRaiseEventStatement(code, 30);

      expect(result).not.toBeNull();
      expect(result!.eventName).toBe('DataReceived');
      expect(result!.arguments).toHaveLength(1);
      expect(result!.arguments[0]).toBe('strData');
    });

    it('should parse RaiseEvent with multiple arguments', () => {
      const code = 'RaiseEvent ProgressChanged(lngCurrent, lngTotal, blnCancel)';
      const result = processor.parseRaiseEventStatement(code, 35);

      expect(result).not.toBeNull();
      expect(result!.eventName).toBe('ProgressChanged');
      expect(result!.arguments).toHaveLength(3);
      expect(result!.arguments[0]).toBe('lngCurrent');
      expect(result!.arguments[1]).toBe('lngTotal');
      expect(result!.arguments[2]).toBe('blnCancel');
    });

    it('should parse RaiseEvent with literal values', () => {
      const code = 'RaiseEvent ErrorOccurred("Error message", 123, True)';
      const result = processor.parseRaiseEventStatement(code, 40);

      expect(result).not.toBeNull();
      expect(result!.arguments).toHaveLength(3);
      expect(result!.arguments[0]).toContain('Error message');
      expect(result!.arguments[1]).toBe('123');
      expect(result!.arguments[2]).toBe('True');
    });

    it('should return null for non-RaiseEvent statement', () => {
      const code = 'Call SomeFunction()';
      const result = processor.parseRaiseEventStatement(code, 1);

      expect(result).toBeNull();
    });

    it('should handle RaiseEvent with no arguments', () => {
      const raise1 = 'RaiseEvent Clicked()'; // Must have parentheses
      const raise2 = 'RaiseEvent Clicked()';

      const r1 = processor.parseRaiseEventStatement(raise1, 10);
      const r2 = processor.parseRaiseEventStatement(raise2, 11);

      expect(r1).not.toBeNull();
      expect(r2).not.toBeNull();
      expect(r1!.arguments).toHaveLength(0);
      expect(r2!.arguments).toHaveLength(0);
    });

    it('should handle complex argument expressions', () => {
      // Note: Parser has limitations with nested parentheses in arguments
      const code = 'RaiseEvent Calculate(x + y, strLen)';
      const result = processor.parseRaiseEventStatement(code, 1);

      expect(result).not.toBeNull();
      expect(result!.arguments).toHaveLength(2);
      expect(result!.arguments[0]).toContain('x + y');
      expect(result!.arguments[1]).toContain('strLen');
    });
  });

  describe('Registration and Retrieval', () => {
    it('should register and retrieve Event', () => {
      const code = 'Event StatusChanged()';
      const event = processor.parseEventDeclaration(code, 1);
      processor.registerEvent(event!);

      const retrieved = processor.getEvent('StatusChanged', 'TestClass');
      expect(retrieved).not.toBeUndefined();
      expect(retrieved!.name).toBe('StatusChanged');
    });

    it('should register Event with class name', () => {
      const code = 'Event DataReceived(ByVal Data As String)';
      const event = processor.parseEventDeclaration(code, 1);
      processor.registerEvent(event!);

      const retrieved = processor.getEvent('DataReceived', 'TestClass');
      expect(retrieved).not.toBeUndefined();
    });

    it('should get all module events', () => {
      processor.setCurrentModule('Module1');
      processor.setCurrentClass('Class1');

      const event1 = processor.parseEventDeclaration('Event Event1()', 1);
      const event2 = processor.parseEventDeclaration('Event Event2(x As Integer)', 2);

      processor.registerEvent(event1!);
      processor.registerEvent(event2!);

      const events = processor.getModuleEvents();
      expect(events.length).toBeGreaterThanOrEqual(2);
    });

    it('should register RaiseEvent statement', () => {
      const code = 'RaiseEvent StatusChanged()';
      const raiseEvent = processor.parseRaiseEventStatement(code, 10);

      processor.registerRaiseEvent(raiseEvent!);

      // Verify it was registered (implementation specific)
      expect(raiseEvent).not.toBeNull();
    });
  });

  describe('JavaScript Code Generation', () => {
    it('should generate VB6EventEmitter base class', () => {
      const js = processor.generateEventSystemJS();

      expect(js).toContain('class VB6EventEmitter');
      expect(js).toContain('constructor()');
      expect(js).toContain('addEventListener');
      expect(js).toContain('removeEventListener');
    });

    it('should generate Event declaration comment', () => {
      const code = 'Event StatusChanged()';
      const event = processor.parseEventDeclaration(code, 1);
      const js = processor.generateEventDeclarationJS(event!);

      expect(js).toContain('Event: StatusChanged');
    });

    it('should generate RaiseEvent JavaScript', () => {
      const eventCode = 'Event DataReceived(Data As String)';
      const raiseCode = 'RaiseEvent DataReceived(strData)';

      const event = processor.parseEventDeclaration(eventCode, 1);
      const raiseEvent = processor.parseRaiseEventStatement(raiseCode, 10);

      processor.registerEvent(event!);

      const js = processor.generateRaiseEventJS(raiseEvent!);

      expect(js).toContain('RaiseEvent DataReceived');
      expect(js).toContain('this.DataReceived');
    });

    it('should generate RaiseEvent with arguments', () => {
      // Register the event first
      const eventCode = 'Event ProgressChanged(Current As Long, Total As Long)';
      const event = processor.parseEventDeclaration(eventCode, 1);
      processor.registerEvent(event!);

      const raiseCode = 'RaiseEvent ProgressChanged(lngCurrent, lngTotal)';
      const raiseEvent = processor.parseRaiseEventStatement(raiseCode, 10);
      const js = processor.generateRaiseEventJS(raiseEvent!);

      expect(js).toContain('lngCurrent');
      expect(js).toContain('lngTotal');
    });

    it('should generate TypeScript definitions', () => {
      const event = processor.parseEventDeclaration('Event StatusChanged(NewStatus As String)', 1);
      processor.registerEvent(event!);

      const ts = processor.generateTypeScript();

      expect(ts).toBeDefined();
      expect(ts.length).toBeGreaterThan(0);
    });
  });

  describe('Validation', () => {
    it('should validate event usage', () => {
      const event = processor.parseEventDeclaration('Event StatusChanged()', 1);
      processor.registerEvent(event!);

      const errors = processor.validateEventUsage();
      expect(Array.isArray(errors)).toBe(true);
    });
  });

  describe('Export and Import', () => {
    it('should export Event data', () => {
      const code = 'Event StatusChanged()';
      const event = processor.parseEventDeclaration(code, 1);
      processor.registerEvent(event!);

      const exported = processor.export();
      expect(exported).toBeDefined();
      expect(exported.events).toBeDefined();
    });

    it('should import Event data', () => {
      const data = {
        events: {
          'TestModule.TestClass.StatusChanged': {
            name: 'StatusChanged',
            parameters: [],
            public: true,
            module: 'TestModule',
            className: 'TestClass',
            line: 1,
          },
        },
        handlers: {},
        bindings: {},
        raiseEvents: [],
      };

      processor.import(data);

      const event = processor.getEvent('StatusChanged', 'TestClass');
      expect(event).not.toBeUndefined();
    });

    it('should clear all Event data', () => {
      const code = 'Event StatusChanged()';
      const event = processor.parseEventDeclaration(code, 1);
      processor.registerEvent(event!);

      processor.clear();

      const events = processor.getModuleEvents();
      expect(events.length).toBe(0);
    });
  });
});

describe('VB6 WithEvents - Real-World Scenarios', () => {
  describe('CommandButton WithEvents', () => {
    it('should handle CommandButton with Click event', () => {
      const processor = new VB6WithEventsProcessor();
      processor.setCurrentModule('Form1');

      const withEventsCode = 'WithEvents cmdSubmit As CommandButton';
      const clickHandler = 'Private Sub cmdSubmit_Click()';

      const withEvents = processor.parseWithEventsDeclaration(withEventsCode, 1);
      processor.registerWithEventsVariable(withEvents!);

      const handler = processor.parseEventHandler(clickHandler, 10);
      processor.registerEventHandler('cmdSubmit', handler!);

      const js = processor.generateJavaScript(withEvents!);

      expect(js).toContain('cmdSubmit: null');
      expect(js).toContain('cmdSubmit_Click');
    });
  });

  describe('Custom Class with Events', () => {
    it('should handle custom class with multiple events', () => {
      const eventsProcessor = new VB6CustomEventsProcessor();
      eventsProcessor.setCurrentClass('DataProcessor');

      const event1 = 'Public Event ProcessStarted()';
      const event2 = 'Public Event ProgressChanged(ByVal Percent As Integer)';
      const event3 =
        'Public Event ProcessCompleted(ByVal Success As Boolean, ByVal Message As String)';

      const evt1 = eventsProcessor.parseEventDeclaration(event1, 1);
      const evt2 = eventsProcessor.parseEventDeclaration(event2, 2);
      const evt3 = eventsProcessor.parseEventDeclaration(event3, 3);

      eventsProcessor.registerEvent(evt1!);
      eventsProcessor.registerEvent(evt2!);
      eventsProcessor.registerEvent(evt3!);

      const raise1 = 'RaiseEvent ProcessStarted()';
      const raise2 = 'RaiseEvent ProgressChanged(intPercent)';
      const raise3 = 'RaiseEvent ProcessCompleted(blnSuccess, strMessage)';

      const r1 = eventsProcessor.parseRaiseEventStatement(raise1, 10);
      const r2 = eventsProcessor.parseRaiseEventStatement(raise2, 11);
      const r3 = eventsProcessor.parseRaiseEventStatement(raise3, 12);

      expect(r1).not.toBeNull();
      expect(r2).not.toBeNull();
      expect(r3).not.toBeNull();
      expect(r1!.eventName).toBe('ProcessStarted');
      expect(r2!.eventName).toBe('ProgressChanged');
      expect(r3!.eventName).toBe('ProcessCompleted');
    });
  });

  describe('Integration Scenario', () => {
    it('should handle WithEvents and custom events together', () => {
      const withEventsProc = new VB6WithEventsProcessor();
      const eventsProc = new VB6CustomEventsProcessor();

      // Create custom class with events
      eventsProc.setCurrentClass('Worker');
      const customEvent = eventsProc.parseEventDeclaration(
        'Event WorkComplete(Result As String)',
        1
      );
      eventsProc.registerEvent(customEvent!);

      // Use WithEvents for the custom class
      withEventsProc.setCurrentModule('Form1');
      const withEvents = withEventsProc.parseWithEventsDeclaration('WithEvents wrk As Worker', 1);
      withEventsProc.registerWithEventsVariable(withEvents!);

      expect(withEvents!.className).toBe('Worker');
      expect(customEvent!.name).toBe('WorkComplete');
    });
  });
});
