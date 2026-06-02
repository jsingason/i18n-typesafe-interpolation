import { createTypedT, I18nInstance } from '../src';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockResources = {
  common: {
    hello: 'Hello',
    greeting: 'Hello, {{name}}!',
    welcome: 'Welcome to {{app}}',
    // Multiple placeholders in a single string (README's documented example).
    inbox: 'You have {{count}} messages from {{sender}}',
  },
  errors: {
    notFound: 'Not found',
    serverError: 'Server error: {{code}}',
  },
} as const;

type Resources = typeof mockResources;

function makeMockI18n(
  impl: (key: string, options?: Record<string, string>) => string,
): I18nInstance {
  return { t: jest.fn(impl) };
}

describe('createTypedT', () => {
  it('calls i18n.t with the correct key for a plain translation', () => {
    const i18n = makeMockI18n((key) => (key === 'common:hello' ? 'Hello' : key));
    const t = createTypedT<Resources>(i18n);

    expect(t('common:hello')).toBe('Hello');
    expect(i18n.t).toHaveBeenCalledWith('common:hello', undefined);
  });

  it('passes interpolation options through to i18n.t', () => {
    const i18n = makeMockI18n((key, opts) =>
      key === 'common:greeting' && opts?.name ? `Hello, ${opts.name}!` : key,
    );
    const t = createTypedT<Resources>(i18n);

    expect(t('common:greeting', { name: 'Alice' })).toBe('Hello, Alice!');
    expect(i18n.t).toHaveBeenCalledWith('common:greeting', { name: 'Alice' });
  });

  it('works across different namespaces', () => {
    const i18n = makeMockI18n((key, opts) => {
      if (key === 'errors:serverError' && opts?.code) return `Server error: ${opts.code}`;
      if (key === 'errors:notFound') return 'Not found';
      return key;
    });
    const t = createTypedT<Resources>(i18n);

    expect(t('errors:notFound')).toBe('Not found');
    expect(t('errors:serverError', { code: '500' })).toBe('Server error: 500');
  });

  it('passes undefined as options when no interpolation is provided', () => {
    const i18n = makeMockI18n(() => 'Not found');
    const t = createTypedT<Resources>(i18n);

    t('errors:notFound');
    expect(i18n.t).toHaveBeenCalledWith('errors:notFound', undefined);
  });

  it('forwards every value of a multi-placeholder string', () => {
    const i18n = makeMockI18n((key, opts) =>
      key === 'common:inbox' ? `You have ${opts?.count} messages from ${opts?.sender}` : key,
    );
    const t = createTypedT<Resources>(i18n);

    expect(t('common:inbox', { count: '3', sender: 'Bob' })).toBe('You have 3 messages from Bob');
    expect(i18n.t).toHaveBeenCalledWith('common:inbox', { count: '3', sender: 'Bob' });
  });
});

// ---------------------------------------------------------------------------
// Compile-time type safety
//
// Mirrors the contract enforced for `useNamespaceTranslation`. Each `t` call
// is intentionally invalid; the `@ts-expect-error` on the preceding line is
// expected to fire. If the types ever stop rejecting a bad call the directive
// becomes unused, TypeScript reports TS2578, and ts-jest fails this suite.
// ---------------------------------------------------------------------------

describe('createTypedT — compile-time type safety', () => {
  // A real i18n instance is unnecessary for type checking; these calls are
  // never executed.
  const t = createTypedT<Resources>({ t: (key) => key });

  it('accepts valid calls (no spurious errors)', () => {
    // These must compile cleanly — a stray @ts-expect-error here would fail.
    t('common:hello');
    t('common:greeting', { name: 'Alice' });
    t('common:inbox', { count: '3', sender: 'Bob' });
    t('errors:notFound');
    expect(true).toBe(true);
  });

  it('rejects a key with an unknown namespace', () => {
    // @ts-expect-error — 'nope' is not a namespace of Resources
    t('nope:hello');
  });

  it('rejects a key that does not exist in the namespace', () => {
    // @ts-expect-error — 'typo' is not a key of the 'common' namespace
    t('common:typo');
  });

  it('rejects a call with missing required interpolation values', () => {
    // @ts-expect-error — 'common:greeting' requires { name: string }
    t('common:greeting');
  });

  it('rejects a call with wrong interpolation property names', () => {
    // @ts-expect-error — 'common:greeting' requires { name: string }, not { wrong: string }
    t('common:greeting', { wrong: 'oops' });
  });

  it('rejects a call missing one value of a multi-placeholder string', () => {
    // @ts-expect-error — 'common:inbox' requires both { count, sender }
    t('common:inbox', { count: '3' });
  });

  it('rejects superfluous options on a key with no interpolation', () => {
    // @ts-expect-error — 'common:hello' accepts no interpolation options
    t('common:hello', { extra: 'oops' });
  });
});
