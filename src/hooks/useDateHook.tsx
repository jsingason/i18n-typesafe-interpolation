// src/hooks/useDateHook.tsx
import { useTranslation } from 'react-i18next';

// Extended options type that includes newer Intl features
interface ExtendedDateTimeFormatOptions extends Intl.DateTimeFormatOptions {
  dateStyle?: 'full' | 'long' | 'medium' | 'short';
  timeStyle?: 'full' | 'long' | 'medium' | 'short';
}

/**
 * Hook for formatting dates based on the current locale from i18next
 * @param options - Extended DateTimeFormatOptions to customize date formatting
 * @returns A function that takes a Date and returns a localized string
 */
export function useLocalizedDate(options: ExtendedDateTimeFormatOptions = {}) {
  const { i18n } = useTranslation();

  const formatDate = (date: Date): string => {
    const locale = i18n.language;

    try {
      return new Intl.DateTimeFormat(locale, options as Intl.DateTimeFormatOptions).format(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      // Fallback to ISO string if formatting fails
      return date.toISOString();
    }
  };

  return formatDate;
}
