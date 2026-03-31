/** Extracts {{key}} interpolation placeholder names from a string literal type. */
export type InterpolationKeys<T extends string> =
  T extends `${string}{{${infer K}}}${infer Rest}`
    ? K | InterpolationKeys<Rest>
    : never;

/** Recursively extracts all interpolation keys from a string or a nested record of strings. */
export type ExtractInterpolationKeys<T> = T extends string
  ? InterpolationKeys<T>
  : T extends Record<string, unknown>
  ? { [K in keyof T]: ExtractInterpolationKeys<T[K]> }[keyof T]
  : never;

/** All top-level namespace keys of a translations resource. */
export type Namespaces<TResources> = keyof TResources & string;

/** The translation map for a single namespace. */
export type NamespaceTranslations<
  TResources,
  K extends keyof TResources,
> = TResources[K];

/** All translation keys within a namespace. */
export type NamespaceKeys<
  TResources,
  K extends keyof TResources,
> = keyof TResources[K] & string;

/** Maps every namespace key to the union of interpolation variable names it requires. */
export type SimpleTranslationInterpolations<
  TResources,
  K extends keyof TResources,
> = {
  [Key in keyof TResources[K]]: ExtractInterpolationKeys<TResources[K][Key]>;
};

/** Minimal interface for an i18next-compatible instance (no hard peer dependency). */
export interface I18nInstance {
  t(key: string, options?: Record<string, string>): string;
}
