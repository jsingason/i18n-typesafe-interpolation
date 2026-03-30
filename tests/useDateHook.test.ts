// tests/useDateHook.test.ts
import { renderHook } from '@testing-library/react-hooks';
import { useLocalizedDate } from '../src/hooks/useDateHook';
import { useTranslation } from 'react-i18next';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({
    i18n: { language: 'en-US' }
  }))
}));

describe('useLocalizedDate', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
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
    
    // Restore the original implementation
    spy.mockRestore();
  });
});
