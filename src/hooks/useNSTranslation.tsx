import { useTranslation } from 'react-i18next';
import { BaseTranslations, ExtractInterpolationKeys, InterpolationKeys } from '../types';
import { TFunction } from 'i18next';

export function createI18nTypes<T extends BaseTranslations>(resources: T) {
  type Translations = T[keyof T];
  type Namespaces = keyof Translations;
  type NamespaceTranslations<K extends Namespaces> = Translations[K];
  type NamespaceKeys<K extends Namespaces> = keyof NamespaceTranslations<K>;

  // Map each namespace and key to its interpolation keys
  type TranslationInterpolations = {
    [K in Namespaces]: {
      [Key in keyof Translations[K]]: ExtractInterpolationKeys<NamespaceTranslations<K>[Key]>;
    };
  };

  type ComplexTranslationInterpolations<K extends Namespaces> = {
    [Key in keyof NamespaceTranslations<K>]: ExtractInterpolationKeys<NamespaceTranslations<K>[Key]>;
  };

  type SimpleTranslationInterpolations<K extends Namespaces> = {
    [Key in NamespaceKeys<K>]: ExtractInterpolationKeys<NamespaceTranslations<K>[Key]>;
  };

  // Create a type-safe translation function
  function createTypedTranslator(t: TFunction) {
    return function typedT<
      K extends Namespaces, 
      Key extends NamespaceKeys<K> & (string | number | symbol)
    >(
      key: `${K & string}:${Key & string}`,
      ...args: SimpleTranslationInterpolations<K>[Key] extends never
        ? [options?: undefined] // No interpolation keys, so options is optional
        : [options: { [key in SimpleTranslationInterpolations<K>[Key]]: string }] // Interpolation keys exist, so options is required
    ): string {
      const [options] = args;
      return t(key, options as Record<string, string> as any) as string;
    };
  }

  /**
   * Hook for translations within a single namespace.
   *
   * @param namespace - The specific namespace for translations.
   * @returns An object with a `t` function for translations.
   */
  function useSingleNamespaceTranslation<K extends Namespaces>(namespace: K) {
    const { t: i18nT } = useTranslation(namespace as string);

    // Type-safe translation function for the given namespace
    const t = <Key extends NamespaceKeys<K> & string>(
      key: Key,
      ...args: SimpleTranslationInterpolations<K>[Key] extends never
        ? [options?: undefined] // Optional options if no interpolation keys
        : [options: { [key in SimpleTranslationInterpolations<K>[Key]]: string }] // Required options if interpolation keys exist
    ): string => {
      const [options] = args;
      // Use i18next `t` function with the specified key and options
      return i18nT(key, options as Record<string, string> as any) as string;
    };

    return { t };
  }

  /**
   * Hook for translations across multiple namespaces.
   *
   * @param namespaces - Array of namespaces for translations.
   * @returns An object with a `t` function for translations using `namespace:key` syntax.
   */
  function useMultipleNamespacesTranslation<K extends Namespaces[]>(namespaces: K) {
    const { t: i18nT } = useTranslation(namespaces as string[]);

    // Union type for all possible `namespace:key` combinations
    type NamespaceKeyUnion = {
      [N in K[number] & string]: `${N}:${NamespaceKeys<N> & string}`;
    }[K[number] & string];

    // Type-safe translation function for multiple namespaces
    const t = <Key extends NamespaceKeyUnion>(
      key: Key,
      ...args: Key extends `${infer N}:${infer K}`
        ? N extends Namespaces
          ? K extends keyof NamespaceTranslations<N>
            ? ComplexTranslationInterpolations<N>[K & keyof NamespaceTranslations<N>] extends never
              ? [options?: undefined] // Optional options if no interpolation keys
              : [options: { [key in ComplexTranslationInterpolations<N>[K & keyof NamespaceTranslations<N>]]: string }] // Required options if interpolation keys exist
            : never
          : never
        : never
    ): string => {
      const [options] = args;
      // Use i18next `t` function with the specified key and options
      return i18nT(key, options as unknown as Record<string, string>) as string;
    };

    return { t };
  }

  // Create the useNSTranslation hook with proper overloads
  function createNSTranslationHook() {
    // Overload signatures
    function useNSTranslation<K extends Namespaces>(ns: K): ReturnType<typeof useSingleNamespaceTranslation<K>>;
    function useNSTranslation<K extends Namespaces[]>(ns: K): ReturnType<typeof useMultipleNamespacesTranslation<K>>;
    
    // Implementation
    function useNSTranslation<K extends Namespaces | Namespaces[]>(ns: K) {
      if (Array.isArray(ns)) {
        return useMultipleNamespacesTranslation(ns as Namespaces[]);
      } else {
        return useSingleNamespaceTranslation(ns as Namespaces);
      }
    }
    
    return useNSTranslation;
  }

  // Create the hook with the current types
  const useNSTranslation = createNSTranslationHook();

  return {
    createTypedTranslator,
    useNSTranslation,
    types: {} as {
      Translations: Translations;
      Namespaces: Namespaces;
      NamespaceTranslations: NamespaceTranslations<Namespaces>;
      NamespaceKeys: NamespaceKeys<Namespaces>;
      TranslationInterpolations: TranslationInterpolations;
      ComplexTranslationInterpolations: ComplexTranslationInterpolations<Namespaces>;
      SimpleTranslationInterpolations: SimpleTranslationInterpolations<Namespaces>;
    },
  };
}
