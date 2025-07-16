import { describe, it, expect } from 'vitest';
import { createRuntimeFunctions } from '../components/Runtime/VB6Runtime';

describe('CreateObject', () => {
  it('uses ActiveXObject when available', () => {
    (global as any).ActiveXObject = function (name: string) {
      this.name = name;
    } as any;
    const funcs = createRuntimeFunctions(
      () => {},
      () => {}
    );
    const obj = funcs.CreateObject('Scripting.FileSystemObject');
    expect(obj.name).toBe('Scripting.FileSystemObject');
    delete (global as any).ActiveXObject;
  });

  it('uses global constructor fallback', () => {
    (global as any).FakeCOM = function () {
      this.id = 1;
    };
    const funcs = createRuntimeFunctions(
      () => {},
      () => {}
    );
    const obj = funcs.CreateObject('FakeCOM');
    expect(obj.id).toBe(1);
    delete (global as any).FakeCOM;
  });
});
