import { renderHook } from '@testing-library/react';
import { useLocalizedDate } from '../src/hooks/useDateHook';
import { useTranslation } from 'react-i18next';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({
    i18n: { language: 'en-US' }
  }))
}));

describe('useLocalizedDate', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    // The hook logs to console.error on its fallback paths; keep test output
    // clean while still asserting it was called where relevant.
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should format date according to locale', () => {
    // Mock implementation
    (useTranslation as jest.Mock).mockReturnValue({
      i18n: { language: 'en-US' }
    });
    
    const testDate = new Date('2023-01-15T12:00:00Z');
    const { result } = renderHook(() => useLocalizedDate());
    
    expect(result.current(testDate)).toMatch(/1\/15\/2023/);
  });
  
  it('should format date with Japanese locale', () => {
    // Mock implementation for Japanese
    (useTranslation as jest.Mock).mockReturnValue({
      i18n: { language: 'ja-JP' }
    });
    
    const testDate = new Date('2023-01-15T12:00:00Z');
    const { result } = renderHook(() => 
      // Use standard options instead of dateStyle
      useLocalizedDate({ 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    );
    
    // This is a simplified test - actual format would depend on browser implementation
    const formattedDate = result.current(testDate);
    expect(formattedDate).toContain('2023');
  });
  
  it('should handle formatting errors gracefully', () => {
    // Mock implementation with an invalid locale
    (useTranslation as jest.Mock).mockReturnValue({
      i18n: { language: 'not-a-real-locale-xyz' }
    });
    
    // Create a spy on Intl.DateTimeFormat that will throw for our test case
    const originalDateTimeFormat = Intl.DateTimeFormat;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockDateTimeFormat = function(this: any, locale?: string | string[], options?: Intl.DateTimeFormatOptions) {
      if (locale === 'not-a-real-locale-xyz') {
        throw new Error('Invalid language tag');
      }
      return new originalDateTimeFormat(locale, options);
    } as unknown as typeof Intl.DateTimeFormat;
    
    // Copy over static methods
    mockDateTimeFormat.supportedLocalesOf = originalDateTimeFormat.supportedLocalesOf;
    
    // Replace the constructor
    const spy = jest.spyOn(Intl, 'DateTimeFormat').mockImplementation(mockDateTimeFormat);
    
    const testDate = new Date('2023-01-15T12:00:00Z');
    const { result } = renderHook(() => useLocalizedDate());
    
    // Should fall back to ISO string
    expect(result.current(testDate)).toBe(testDate.toISOString());
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error creating DateTimeFormat:',
      expect.any(Error),
    );

    // Restore the original implementation
    spy.mockRestore();
  });

  it('falls back to ISO string when formatting (not construction) throws', () => {
    (useTranslation as jest.Mock).mockReturnValue({
      i18n: { language: 'en-US' },
    });

    // The formatter is constructed successfully, but .format() throws. This
    // exercises the formatDate catch branch (distinct from the constructor
    // catch branch covered above).
    const throwingFormatter = {
      format: () => {
        throw new Error('format boom');
      },
    } as unknown as Intl.DateTimeFormat;
    const spy = jest
      .spyOn(Intl, 'DateTimeFormat')
      .mockImplementation(() => throwingFormatter);

    const testDate = new Date('2023-01-15T12:00:00Z');
    const { result } = renderHook(() => useLocalizedDate());

    expect(result.current(testDate)).toBe(testDate.toISOString());
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error formatting date:',
      expect.any(Error),
    );

    spy.mockRestore();
  });

  it('reuses the same formatter across re-renders when locale and options are stable', () => {
    (useTranslation as jest.Mock).mockReturnValue({
      i18n: { language: 'en-US' },
    });

    const constructorSpy = jest.spyOn(Intl, 'DateTimeFormat');
    // A stable options reference is required for useMemo to cache the formatter.
    const options = { year: 'numeric' } as const;

    const { rerender } = renderHook(() => useLocalizedDate(options));
    const callsAfterFirstRender = constructorSpy.mock.calls.length;

    rerender();

    // No new formatter should be constructed on re-render.
    expect(constructorSpy.mock.calls.length).toBe(callsAfterFirstRender);

    constructorSpy.mockRestore();
  });
});
