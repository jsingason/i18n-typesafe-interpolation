# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-03-31

### Added

- `TypedT` utility type: extracts `{{placeholder}}` variable names from string literal types and enforces them at the call-site
- `useNamespaceTranslation` hook: type-safe `t()` scoped to one or multiple i18next namespaces
- `useLocalizedDate` hook: locale-aware date formatting that follows the active i18next language
- Dual CJS/ESM build output (`dist/` and `dist/esm/`)
- Full TypeScript declaration files (`.d.ts` + `.d.ts.map`)
- ESLint configuration with `@typescript-eslint` rules
- Jest test suite covering interpolation types, `useNamespaceTranslation`, and `useLocalizedDate`

[1.0.0]: https://github.com/jsingason/i18n-typesafe-interpolation/releases/tag/v1.0.0
