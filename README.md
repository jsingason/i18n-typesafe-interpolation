# i18n-typesafe-interpolation

> Fully type-safe i18n: autocomplete for translation keys and interpolation variables, minimal footprint, no codegen.

TypeScript infers required `{{placeholder}}` variables directly from your translation strings, so every `t()` call is validated at compile time with no build step or runtime overhead.

## Features

- Extracts `{{key}}` interpolation variable names from string literal types
- Enforces required interpolation options at the call-site, with exact key names
- Forbids passing options when the translation has no placeholders
- Works with any i18next-compatible instance (no hard peer dep required)
- Zero runtime overhead, pure TypeScript generics
- `useNamespaceTranslation` hook: type-safe `t()` scoped to one or multiple namespaces
- `useLocalizedDate` hook: locale-aware date formatting that follows the active i18next language

## Installation

```bash
npm install i18n-typesafe-interpolation
# or
pnpm add i18n-typesafe-interpolation
# or
bun add i18n-typesafe-interpolation
```

## Usage

### 1. Define your resources

```ts
// translations.ts
const EN = {
  common: {
    greeting: "Hello",
    welcome: "Welcome, {{name}}!",
    inbox: "You have {{count}} messages from {{sender}}",
  },
} as const;

export const resources = { EN } as const;
export type Translations = typeof resources.EN;
```

### 2. Create a typed `t` function

```ts
// i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { createTypedT } from 'i18n-typesafe-interpolation';
import { createNamespaceHook } from 'i18n-typesafe-interpolation/hooks';
import { resources, Translations } from './translations';

i18n.use(initReactI18next).init({
  resources,
  lng: 'EN',
  fallbackLng: 'EN',
  interpolation: {
    escapeValue: false, // React already escapes values
  },
});

export const t = createTypedT<Translations>(i18n);
export const useNS = createNamespaceHook<Translations>();

export default i18n;
```

### 3. Call with full type safety

```ts
import { t } from './i18n';

t("common:greeting");                          // ✅ no options needed
t("common:welcome", { name: "Alice" });        // ✅ typed options
t("common:inbox", { count: "3", sender: "Bob" }); // ✅ all placeholders required

t("common:welcome");                           // ❌ TS error: missing { name }
t("common:greeting", { name: "Alice" });       // ❌ TS error: no placeholders expected
t("common:welcome", { typo: "Alice" });        // ❌ TS error: wrong key name
```

## API

### `createTypedT<TResources>(i18n: I18nInstance)`

Factory that returns a typed `t()` function scoped to `TResources`.

```ts
const t = createTypedT<typeof resources.EN>(i18nInstance);
```

The returned `t` accepts keys in `"Namespace:key"` format and infers the required interpolation options from the translation string.

### Utility types

| Type | Description |
|---|---|
| `InterpolationKeys<T>` | Extracts `{{key}}` names from a string literal |
| `ExtractInterpolationKeys<T>` | Recursively extracts from strings or nested records |
| `Namespaces<TResources>` | Top-level namespace keys of a resource |
| `NamespaceKeys<TResources, K>` | Translation keys within namespace `K` |
| `NamespaceTranslations<TResources, K>` | Translation map for namespace `K` |
| `SimpleTranslationInterpolations<TResources, K>` | Maps each key to its interpolation variable union |

### `I18nInstance`

Minimal interface the factory requires, any object with a `t(key, options?)` method qualifies:

```ts
interface I18nInstance {
  t(key: string, options?: Record<string, string>): string;
}
```

## React Hooks

The hooks are React-specific and depend on `react-i18next`. They live in `i18n-typesafe-interpolation/hooks` and complement the core type utilities by bringing the same type-safety directly into components.

### `createNamespaceHook<TResources>()`

A factory that returns a `useNamespaceTranslation` hook bound to your resource type. Call it once at the module level (next to your i18n setup) so the generic is inferred from your actual translations everywhere in the app.

```ts
// i18n.ts
import { createNamespaceHook } from 'i18n-typesafe-interpolation/hooks';
import type { Translations } from './translations';

export const useNS = createNamespaceHook<Translations>();
```

#### Single namespace

Pass a single namespace string. The returned `t` accepts only the keys that belong to that namespace, no prefix required.

```ts
// MyComponent.tsx
const { t } = useNS('common');

t('greeting');                    // ✅ no options needed
t('welcome', { name: 'Alice' });  // ✅ typed, only 'name' accepted
t('welcome');                     // ❌ TS error: missing { name }
t('welcome', { typo: 'Alice' });  // ❌ TS error: wrong key name
```

This is the preferred pattern for components that only ever need one namespace, it keeps keys short and ensures you can never accidentally address a key from another namespace.

#### Array of namespaces

Pass a `readonly` tuple of namespace strings. The returned `t` requires fully-qualified `"namespace:key"` strings, and each call is still validated against the correct namespace's interpolation variables.

```ts
const { t } = useNS(['common', 'errors']);

t('common:welcome', { name: 'Alice' }); // ✅
t('errors:notFound');                   // ✅
t('common:welcome');                    // ❌ TS error: missing { name }
t('errors:nonExistent');                // ❌ TS error: key doesn't exist
t('form:submit');                       // ❌ TS error: namespace not included
```

Use the array form in shared layout components or pages that compose several unrelated namespaces, while keeping a single `useTranslation` call under the hood (which avoids unnecessary re-renders compared to calling the hook multiple times).

---

### `useLocalizedDate(options?)`

Reads the active locale from `i18next` and returns a `formatDate(date: Date) => string` function powered by `Intl.DateTimeFormat`. The formatter is recreated whenever the language changes, so locale-switches are reflected immediately.

```ts
import { useLocalizedDate } from 'i18n-typesafe-interpolation/hooks';
```

#### Basic usage

```ts
const formatDate = useLocalizedDate();
formatDate(new Date()); // e.g. "3/31/2026" for en-US, "31.3.2026" for pl-PL
```

#### With formatting options

All standard `Intl.DateTimeFormatOptions` are accepted, plus the convenient `dateStyle` / `timeStyle` shorthands:

```ts
const formatDate = useLocalizedDate({ dateStyle: 'long', timeStyle: 'short' });
formatDate(new Date()); // e.g. "March 31, 2026 at 10:30 AM"
```

```ts
const formatDate = useLocalizedDate({
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});
formatDate(new Date()); // e.g. "Tuesday, March 31, 2026"
```

#### Why use this over inline `Intl.DateTimeFormat`?

- Automatically stays in sync with the i18next locale, no manual locale prop threading.
- Centralizes date formatting so changing locale triggers a re-render once rather than at each call-site.
- Falls back gracefully to the ISO string if the locale or options are invalid.
