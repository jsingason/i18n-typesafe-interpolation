import React from 'react';
import { renderHook } from '@testing-library/react';
import i18next, { type i18n as I18n } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { createTypedT } from '../src';
import { createNamespaceHook } from '../src/hooks';

// ---------------------------------------------------------------------------
// Integration tests against the REAL i18next / react-i18next stack (no mocks).
// These exercise actual key resolution and interpolation end-to-end, catching
// wiring issues that the unit-level mocks cannot.
// ---------------------------------------------------------------------------

const resources = {
  common: {
    hello: 'Hello',
    greeting: 'Hello, {{name}}!',
    inbox: 'You have {{count}} messages from {{sender}}',
  },
  errors: {
    notFound: 'Not found',
    serverError: 'Server error: {{code}}',
  },
} as const;

type Resources = typeof resources;

let i18n: I18n;

beforeAll(async () => {
  i18n = i18next.createInstance();
  await i18n.use(initReactI18next).init({
    lng: 'en',
    fallbackLng: 'en',
    ns: ['common', 'errors'],
    defaultNS: 'common',
    resources: { en: resources },
    interpolation: { escapeValue: false },
  });
});

describe('createTypedT — real i18next', () => {
  it('resolves plain keys and interpolates real values', () => {
    const t = createTypedT<Resources>(i18n);

    expect(t('common:hello')).toBe('Hello');
    expect(t('common:greeting', { name: 'Alice' })).toBe('Hello, Alice!');
    expect(t('common:inbox', { count: '3', sender: 'Bob' })).toBe(
      'You have 3 messages from Bob',
    );
    expect(t('errors:notFound')).toBe('Not found');
    expect(t('errors:serverError', { code: '500' })).toBe('Server error: 500');
  });
});

describe('useNamespaceTranslation — real react-i18next', () => {
  const useNS = createNamespaceHook<Resources>();
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(I18nextProvider, { i18n }, children);

  it('interpolates within a single namespace', () => {
    const { result } = renderHook(() => useNS('common'), { wrapper });

    expect(result.current.t('hello')).toBe('Hello');
    expect(result.current.t('greeting', { name: 'Alice' })).toBe('Hello, Alice!');
    expect(result.current.t('inbox', { count: '3', sender: 'Bob' })).toBe(
      'You have 3 messages from Bob',
    );
  });

  it('resolves namespaced keys in multi-namespace mode', () => {
    const { result } = renderHook(() => useNS(['common', 'errors'] as const), { wrapper });

    expect(result.current.t('common:greeting', { name: 'Bob' })).toBe('Hello, Bob!');
    expect(result.current.t('errors:serverError', { code: '404' })).toBe('Server error: 404');
  });
});
