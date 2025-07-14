import { describe, it, expect } from 'vitest';
import { vb6Reducer, initialState } from '../context/vb6Reducer';

describe('Form actions', () => {
  it('adds a form and sets it active', () => {
    const state = vb6Reducer(initialState, { type: 'ADD_FORM', payload: { name: 'Form2' } });
    expect(state.forms).toHaveLength(2);
    expect(state.forms[1].name).toBe('Form2');
    expect(state.activeFormId).toBe(state.forms[1].id);
    expect(state.formProperties.Caption).toBe('Form2');
  });

  it('switches active form', () => {
    const state1 = vb6Reducer(initialState, { type: 'ADD_FORM', payload: { name: 'Form2' } });
    const state2 = vb6Reducer(state1, { type: 'SET_ACTIVE_FORM', payload: { id: 1 } });
    expect(state2.activeFormId).toBe(1);
  });

  it('renames a form and updates caption when active', () => {
    const state1 = vb6Reducer(initialState, { type: 'ADD_FORM', payload: { name: 'Form2' } });
    const id = state1.forms[1].id;
    const state2 = vb6Reducer(state1, { type: 'RENAME_FORM', payload: { id, name: 'MainForm' } });
    expect(state2.forms[1].name).toBe('MainForm');
    expect(state2.formProperties.Caption).toBe('MainForm');
  });
});
