// tests/useI18nHooks.test.tsx
import { renderHook } from '@testing-library/react-hooks';
import { createI18nTypes } from '../src/hooks/useNSTranslation';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';

// Mock resources for testing
const mockResources = {
  EN: {
    common: {
      hello: 'Hello',
      greeting: 'Hello, {{name}}!',
      welcome: 'Welcome to {{app}}',
    },
    errors: {
      notFound: 'Not found',
      serverError: 'Server error: {{code}}',
    },
  },
  JP: {
    common: {
      hello: 'こんにちは',
      greeting: 'こんにちは、{{name}}さん！',
      welcome: '{{app}}へようこそ',
    },
    errors: {
      notFound: '見つかりません',
      serverError: 'サーバーエラー: {{code}}',
    },
  },
} as const;

// Create the i18n utilities with our mock resources
const { useNSTranslation, createTypedTranslator } = createI18nTypes(mockResources);

// Create a properly typed mock TFunction
const createMockTFunction = (implementation: (key: string, options?: any) => string): TFunction => {
  const mockFn = jest.fn(implementation) as unknown as TFunction;
  // Add the brand property required by TFunction
  (mockFn as any).$TFunctionBrand = 'i18next.t';
  return mockFn;
};

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({
    t: createMockTFunction((key, options) => {
      // Simple mock implementation of t function
      if (key === 'hello') return 'Hello';
      if (key === 'greeting' && options?.name) return `Hello, ${options.name}!`;
      if (key === 'welcome' && options?.app) return `Welcome to ${options.app}`;
      if (key === 'notFound') return 'Not found';
      if (key === 'serverError' && options?.code) return `Server error: ${options.code}`;
      if (key === 'common:hello') return 'Hello';
      if (key === 'common:greeting' && options?.name) return `Hello, ${options.name}!`;
      if (key === 'errors:notFound') return 'Not found';
      if (key === 'errors:serverError' && options?.code) return `Server error: ${options.code}`;
      return key; // Fallback
    }),
  })),
}));

describe('useNSTranslation', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('Single namespace', () => {
    it('should translate simple keys', () => {
      // Setup mock for single namespace
      (useTranslation as jest.Mock).mockReturnValue({
        t: createMockTFunction((key) => {
          if (key === 'hello') return 'Hello';
          return key;
        }),
      });

      const { result } = renderHook(() => useNSTranslation('common'));
      
      expect(result.current.t('hello')).toBe('Hello');
      expect(useTranslation).toHaveBeenCalledWith('common');
    });

    it('should handle interpolation correctly', () => {
      // Setup mock for interpolation
      (useTranslation as jest.Mock).mockReturnValue({
        t: createMockTFunction((key, options) => {
          if (key === 'greeting' && options?.name) return `Hello, ${options.name}!`;
          return key;
        }),
      });

      const { result } = renderHook(() => useNSTranslation('common'));
      
      expect(result.current.t('greeting', { name: 'John' })).toBe('Hello, John!');
    });

    it('should make options optional when no interpolation is needed', () => {
      // Setup mock for no interpolation
      (useTranslation as jest.Mock).mockReturnValue({
        t: createMockTFunction((key) => {
          if (key === 'hello') return 'Hello';
          return key;
        }),
      });

      const { result } = renderHook(() => useNSTranslation('common'));
      
      // This should compile without errors - options are optional
      expect(result.current.t('hello')).toBe('Hello');
    });
  });

  describe('Multiple namespaces', () => {
    it('should translate keys from multiple namespaces', () => {
      // Setup mock for multiple namespaces
      (useTranslation as jest.Mock).mockReturnValue({
        t: createMockTFunction((key) => {
          if (key === 'common:hello') return 'Hello';
          if (key === 'errors:notFound') return 'Not found';
          return key;
        }),
      });

      const { result } = renderHook(() => useNSTranslation(['common', 'errors']));
      
      expect(result.current.t('common:hello')).toBe('Hello');
      expect(result.current.t('errors:notFound')).toBe('Not found');
      expect(useTranslation).toHaveBeenCalledWith(['common', 'errors']);
    });

    it('should handle interpolation correctly with multiple namespaces', () => {
      // Setup mock for interpolation with multiple namespaces
      (useTranslation as jest.Mock).mockReturnValue({
        t: createMockTFunction((key, options) => {
          if (key === 'common:greeting' && options?.name) return `Hello, ${options.name}!`;
          if (key === 'errors:serverError' && options?.code) return `Server error: ${options.code}`;
          return key;
        }),
      });

      const { result } = renderHook(() => useNSTranslation(['common', 'errors']));
      
      expect(result.current.t('common:greeting', { name: 'John' })).toBe('Hello, John!');
      expect(result.current.t('errors:serverError', { code: '500' })).toBe('Server error: 500');
    });
  });
});

describe('createTypedTranslator', () => {
  it('should create a typed translator function', () => {
    // Mock t function
    const mockT = createMockTFunction((key, options) => {
      if (key === 'common:hello') return 'Hello';
      if (key === 'common:greeting' && options?.name) return `Hello, ${options.name}!`;
      return key;
    });

    const typedT = createTypedTranslator(mockT);
    
    expect(typedT('common:hello')).toBe('Hello');
    expect(typedT('common:greeting', { name: 'John' })).toBe('Hello, John!');
    expect(mockT).toHaveBeenCalledWith('common:hello', undefined);
    expect(mockT).toHaveBeenCalledWith('common:greeting', { name: 'John' });
  });

  it('should handle optional options correctly', () => {
    // Mock t function
    const mockT = createMockTFunction((key) => {
      if (key === 'common:hello') return 'Hello';
      return key;
    });

    const typedT = createTypedTranslator(mockT);
    
    // This should compile without errors - options are optional for keys without interpolation
    expect(typedT('common:hello')).toBe('Hello');
    expect(mockT).toHaveBeenCalledWith('common:hello', undefined);
  });

  it('should enforce required options for keys with interpolation', () => {
    // Mock t function
    const mockT = createMockTFunction((key, options) => {
      if (key === 'common:greeting' && options?.name) return `Hello, ${options.name}!`;
      return key;
    });

    const typedT = createTypedTranslator(mockT);
    
    // This would cause a TypeScript error if we tried to call without options
    // typedT('common:greeting'); // Error: Expected 2 arguments, but got 1
    
    // But with options it works
    expect(typedT('common:greeting', { name: 'John' })).toBe('Hello, John!');
    expect(mockT).toHaveBeenCalledWith('common:greeting', { name: 'John' });
  });
});

// Test error handling
describe('Error handling', () => {
  it('should handle missing keys gracefully', () => {
    // Setup mock for missing keys
    (useTranslation as jest.Mock).mockReturnValue({
      t: createMockTFunction((key) => key), // Just return the key for missing translations
    });

    const { result } = renderHook(() => useNSTranslation('common'));
    
    // This key doesn't exist in our mock resources
    expect(result.current.t('nonExistentKey' as any)).toBe('nonExistentKey');
  });  
});
