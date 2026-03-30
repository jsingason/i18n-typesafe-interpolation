// Core types
export type BaseTranslations = Record<string, Record<string, unknown>>;

// Utility types to extract interpolation keys
export type InterpolationKeys<T extends string> = T extends `${string}{{${infer K}}}${infer Rest}`
  ? K extends `${infer Key}` // Trim spaces from K
    ? Key | InterpolationKeys<Rest>
    : never
  : never;

export type ExtractInterpolationKeys<T> = T extends string
  ? InterpolationKeys<T>
  : T extends Record<string, unknown>
    ? { [K in keyof T]: ExtractInterpolationKeys<T[K]> }[keyof T]
    : never;
