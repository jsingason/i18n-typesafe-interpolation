import { useTranslation } from 'react-i18next';
import type {
  ExtractInterpolationKeys,
  Namespaces,
  NamespaceKeys,
  NamespaceTranslations,
  SimpleTranslationInterpolations,
} from '../types';

type ComplexInterpolations<TResources, K extends Namespaces<TResources>> = {
  [Key in keyof NamespaceTranslations<TResources, K>]: ExtractInterpolationKeys<
    NamespaceTranslations<TResources, K>[Key]
  >;
};

type NSKeyUnion<TResources, K extends Namespaces<TResources>> = {
  [N in K & string]: `${N}:${NamespaceKeys<TResources, N> & string}`;
}[K & string];

type SingleReturn<TResources, K extends Namespaces<TResources>> = {
  t: <Key extends NamespaceKeys<TResources, K>>(
    key: Key,
    ...args: SimpleTranslationInterpolations<TResources, K>[Key] extends never
      ? [options?: undefined]
      : [options: { [P in SimpleTranslationInterpolations<TResources, K>[Key] & string]: string }]
  ) => string;
};

type MultiReturn<TResources, K extends Namespaces<TResources>> = {
  t: <Key extends NSKeyUnion<TResources, K>>(
    key: Key,
    ...args: Key extends `${infer N}:${infer KStr}`
      ? N extends Namespaces<TResources>
        ? KStr extends keyof NamespaceTranslations<TResources, N>
          ? ComplexInterpolations<TResources, N>[KStr] extends never
            ? [options?: undefined]
            : [options: { [P in ComplexInterpolations<TResources, N>[KStr] & string]: string }]
          : never
        : never
      : never
  ) => string;
};

/**
 * Returns a factory for the `useNamespaceTranslation` hook bound to `TResources`.
 *
 * Call once at the module level to bind the resource type, then use the
 * returned hook inside components to load specific namespaces without
 * pulling in the entire resource.
 *
 * @example
 * // i18n.ts
 * export const useNS = createNamespaceHook<typeof resources>();
 *
 * // MyComponent.tsx
 * const { t } = useNS('common');
 * t('greeting', { name: 'Alice' });
 *
 * const { t } = useNS(['common', 'errors']);
 * t('common:greeting', { name: 'Alice' });
 * t('errors:notFound');
 */
export function createNamespaceHook<TResources>() {
  function useNamespaceTranslation<TNs extends Namespaces<TResources> | readonly Namespaces<TResources>[]>(
    ns: TNs,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): TNs extends readonly any[]
    ? MultiReturn<TResources, TNs[number]>
    : SingleReturn<TResources, Extract<TNs, Namespaces<TResources>>> {
    const { t: i18nT } = useTranslation(ns as string | readonly string[]);

    const t = (key: string, options?: Record<string, string>): string => i18nT(key, options) as string;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { t } as any;
  }

  return useNamespaceTranslation;
}
