import { renderHook } from '@testing-library/react';
import { createNamespaceHook } from '../src/hooks';

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({
    t: (key: string) => key,
  })),
}));

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockResources = {
  common: {
    hello: 'Hello',
    greeting: 'Hello, {{name}}!',
  },
  errors: {
    notFound: 'Not found',
    serverError: 'Server error: {{code}}',
  },
} as const;

type Resources = typeof mockResources;

const useNS = createNamespaceHook<Resources>();

// ---------------------------------------------------------------------------
// Runtime behaviour
// ---------------------------------------------------------------------------

describe('useNamespaceTranslation — runtime', () => {
  it('returns the key for a plain translation', () => {
    const { result } = renderHook(() => useNS('common'));
    expect(result.current.t('hello')).toBe('hello');
  });

  it('returns the key when interpolation options are supplied', () => {
    const { result } = renderHook(() => useNS('common'));
    expect(result.current.t('greeting', { name: 'Alice' })).toBe('greeting');
  });

  it('supports multi-namespace mode', () => {
    const { result } = renderHook(() => useNS(['common', 'errors'] as const));
    expect(result.current.t('common:hello')).toBe('common:hello');
    expect(result.current.t('errors:notFound')).toBe('errors:notFound');
  });
});

// ---------------------------------------------------------------------------
// Compile-time type safety
//
// Each test below passes an intentionally wrong call to `t`.  A directive on
// the preceding line suppresses the expected TypeScript error.  If the types
// ever stop rejecting a bad call the directive becomes "unused", TypeScript
// reports TS2578, and ts-jest turns that into a test failure — keeping the
// type contract enforced automatically.
// ---------------------------------------------------------------------------

describe('useNamespaceTranslation — compile-time type safety', () => {
  it('rejects a key that does not exist in the namespace', () => {
    const { result } = renderHook(() => useNS('common'));
    const { t } = result.current;

    // @ts-expect-error — 'typo' is not a key of the 'common' namespace
    t('typo');
  });

  it('rejects a call with missing required interpolation values', () => {
    const { result } = renderHook(() => useNS('common'));
    const { t } = result.current;

    // @ts-expect-error — 'greeting' requires { name: string } but no options are given
    t('greeting');
  });

  it('rejects a call with wrong interpolation property names', () => {
    const { result } = renderHook(() => useNS('common'));
    const { t } = result.current;

    // @ts-expect-error — 'greeting' requires { name: string }, not { wrong: string }
    t('greeting', { wrong: 'oops' });
  });

  it('rejects superfluous options on a key with no interpolation', () => {
    const { result } = renderHook(() => useNS('common'));
    const { t } = result.current;

    // @ts-expect-error — 'hello' accepts no interpolation options
    t('hello', { extra: 'oops' });
  });

  it('rejects an invalid namespaced key in multi-namespace mode', () => {
    const { result } = renderHook(() => useNS(['common', 'errors'] as const));
    const { t } = result.current;

    // @ts-expect-error — 'common:typo' is not a valid key in any loaded namespace
    t('common:typo');
  });

  it('rejects missing interpolation in multi-namespace mode', () => {
    const { result } = renderHook(() => useNS(['common', 'errors'] as const));
    const { t } = result.current;

    // @ts-expect-error — 'errors:serverError' requires { code: string }
    t('errors:serverError');
  });
});
