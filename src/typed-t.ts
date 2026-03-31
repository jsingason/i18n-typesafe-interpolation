import type {
  I18nInstance,
  Namespaces,
  NamespaceKeys,
  SimpleTranslationInterpolations,
} from './types';

/**
 * Creates a fully type-safe `t()` function bound to the given i18n instance.
 *
 * Keys follow the `"Namespace:key"` format. Interpolation options are required
 * (with exact placeholder names) when the string contains `{{...}}`, and
 * omitted otherwise.
 *
 * @example
 * const t = createTypedT<typeof resources>(i18n);
 * t('common:hello');
 * t('common:greeting', { name: 'Alice' });
 */
export function createTypedT<TResources>(i18n: I18nInstance) {
  return function t<
    K extends Namespaces<TResources>,
    Key extends NamespaceKeys<TResources, K>,
  >(
    key: `${K}:${Key}`,
    ...args: SimpleTranslationInterpolations<TResources, K>[Key] extends never
      ? [options?: undefined]
      : [
          options: {
            [P in SimpleTranslationInterpolations<TResources, K>[Key] & string]: string;
          },
        ]
  ): string {
    const [options] = args;
    return i18n.t(key, options as Record<string, string>);
  };
}
