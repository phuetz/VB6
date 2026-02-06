/**
 * Test simplifié du store VB6
 */

import { describe, it, expect } from 'vitest';
import { useVB6Store } from '../../stores/vb6Store';

describe('Simple VB6 Store Tests', () => {
  it('should access store without errors', () => {
    const store = useVB6Store.getState();
    expect(store).toBeDefined();
  });

  it('should have initial values', () => {
    const store = useVB6Store.getState();

    // Vérifier quelques valeurs initiales
    expect(store.currentCode).toBe('');
    expect(store.controls).toEqual([]);
    expect(store.isDesignMode).toBe(true);
    expect(store.projectName).toBe('VB6 Project');
  });

  it('should update code', () => {
    const store = useVB6Store.getState();

    store.updateCode('test code');

    const newState = useVB6Store.getState();
    expect(newState.currentCode).toBe('test code');
    expect(newState.isDirty).toBe(true);
  });

  it('should add control', () => {
    const store = useVB6Store.getState();

    const control = {
      id: 'test1',
      type: 'TextBox' as const,
      name: 'TextBox1',
      left: 10,
      top: 10,
      width: 100,
      height: 24,
      properties: {},
    };

    store.addControl(control);

    const newState = useVB6Store.getState();
    expect(newState.controls).toHaveLength(1);
    expect(newState.controls[0].id).toBe('test1');
  });

  it('should reset store', () => {
    const store = useVB6Store.getState();

    // Ajouter des données
    store.updateCode('some code');
    store.addControl({
      id: 'test2',
      type: 'Label' as const,
      name: 'Label1',
      left: 0,
      top: 0,
      width: 50,
      height: 20,
      properties: {},
    });

    // Reset
    if (store.resetStore) {
      store.resetStore();
    }

    const resetState = useVB6Store.getState();
    expect(resetState.currentCode).toBe('');
    expect(resetState.controls).toEqual([]);
  });
});
