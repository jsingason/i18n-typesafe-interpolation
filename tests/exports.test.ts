import * as rootEntry from '../src';
import * as hooksEntry from '../src/hooks';

// Guards the public API surface: these are the entry points consumers import
// (mirroring the `exports` map in package.json). A rename or accidental removal
// breaks this suite.

describe('public API surface', () => {
  it('exposes createTypedT from the root entry', () => {
    expect(typeof rootEntry.createTypedT).toBe('function');
  });

  it('exposes the hooks from the /hooks entry', () => {
    expect(typeof hooksEntry.createNamespaceHook).toBe('function');
    expect(typeof hooksEntry.useLocalizedDate).toBe('function');
  });
});
