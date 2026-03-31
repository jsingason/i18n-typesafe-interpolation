# Contributing

Bug reports, feature requests, and pull requests are all welcome.

## Reporting Issues

[Search existing issues](https://github.com/jsingason/i18n-typesafe-interpolation/issues) first. When filing a bug, include your Node.js / TypeScript / react-i18next versions, a minimal reproduction, and the expected vs. actual behaviour.

## Development Setup

**Prerequisites:** Node.js ≥ 18.

```bash
git clone https://github.com/jsingason/i18n-typesafe-interpolation.git
cd i18n-typesafe-interpolation
pnpm install
pnpm test    # run tests
pnpm build   # CJS + ESM output
pnpm lint
```

## Making Changes

1. Fork and branch from `main`.
2. Add or update tests in `tests/` for any behaviour change.
3. Run `pnpm test` and `pnpm lint` before opening a PR.
4. Reference related issues with `Closes #<number>`.

## Code Style

- TypeScript strict mode — avoid `any`.
- Format with Prettier (`pnpm format`), lint with ESLint (`pnpm lint`).
- Prefer type-level solutions over runtime code.

## License

By contributing, you agree your changes will be licensed under the [MIT License](LICENSE).
