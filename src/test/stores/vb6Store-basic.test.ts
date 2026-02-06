/**
 * Test basique du store VB6
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useVB6Store } from '../../stores/vb6Store';

describe('VB6 Store Basic Tests', () => {
  beforeEach(() => {
    // Reset le store avant chaque test
    useVB6Store.setState({
      controls: [],
      selectedControlIds: [],
      copiedControls: [],
      consoleOutput: [],
      eventCode: {},
      immediateCommand: '',
      executionMode: 'design',
      selectedEvent: 'Form_Load',
      history: [],
      historyIndex: -1,
      nextId: 1,
      debugState: {
        isDebugging: false,
        breakpoints: [],
        currentLine: null,
        callStack: [],
        variables: [],
        watchExpressions: [],
      },
    });
  });

  it('should have store defined', () => {
    const store = useVB6Store;
    expect(store).toBeDefined();
    expect(typeof store.getState).toBe('function');
    expect(typeof store.setState).toBe('function');
  });

  it('should get initial state', () => {
    const state = useVB6Store.getState();
    expect(state).toBeDefined();
    expect(state.controls).toEqual([]);
    expect(state.executionMode).toBe('design');
  });

  it('should create control', () => {
    const state = useVB6Store.getState();

    // Appeler createControl
    state.createControl('TextBox', 10, 10);

    // Vérifier que le contrôle a été ajouté
    const newState = useVB6Store.getState();
    expect(newState.controls.length).toBe(1);
    expect(newState.controls[0].type).toBe('TextBox');
  });

  it('should update control property', () => {
    const state = useVB6Store.getState();

    // Créer un contrôle
    state.createControl('Label', 20, 20);

    const control = useVB6Store.getState().controls[0];
    const controlId = control.id;

    // Mettre à jour une propriété
    state.updateControl(controlId, 'Text', 'Hello World');

    const updatedControl = useVB6Store.getState().controls[0];
    expect(updatedControl.properties.Text).toBe('Hello World');
  });

  it('should handle copy and paste', () => {
    const state = useVB6Store.getState();

    // Créer et sélectionner un contrôle
    state.createControl('Button', 30, 30);
    const controlId = useVB6Store.getState().controls[0].id;
    state.selectControls([controlId]);

    // Copier
    state.copyControls();
    expect(useVB6Store.getState().copiedControls.length).toBe(1);

    // Coller
    state.pasteControls();
    expect(useVB6Store.getState().controls.length).toBe(2);
  });

  it('should toggle execution mode', () => {
    const state = useVB6Store.getState();

    expect(state.executionMode).toBe('design');

    state.setExecutionMode('run');
    expect(useVB6Store.getState().executionMode).toBe('run');

    state.setExecutionMode('break');
    expect(useVB6Store.getState().executionMode).toBe('break');
  });

  it('should manage console output', () => {
    const state = useVB6Store.getState();

    state.addConsoleOutput('Test message 1');
    state.addConsoleOutput('Test message 2');

    expect(useVB6Store.getState().consoleOutput).toEqual(['Test message 1', 'Test message 2']);

    state.clearConsole();
    expect(useVB6Store.getState().consoleOutput).toEqual([]);
  });

  it('should handle undo/redo', () => {
    const state = useVB6Store.getState();

    // Ajouter un contrôle
    state.createControl('TextBox', 40, 40);
    const firstState = useVB6Store.getState().controls;

    // Ajouter un autre contrôle
    state.createControl('Label', 50, 50);

    // Undo
    state.undo();
    expect(useVB6Store.getState().controls).toEqual(firstState);

    // Redo
    state.redo();
    expect(useVB6Store.getState().controls.length).toBe(2);
  });
});
