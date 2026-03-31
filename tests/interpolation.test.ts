import { createTypedT, I18nInstance } from '../src';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockResources = {
  common: {
    hello: 'Hello',
    greeting: 'Hello, {{name}}!',
    welcome: 'Welcome to {{app}}',
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
});
