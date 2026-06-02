import type {
  InterpolationKeys,
  ExtractInterpolationKeys,
} from '../src';

// ---------------------------------------------------------------------------
// Compile-time tests for the core type utilities.
//
// These assertions run entirely at type-check time. ts-jest type-checks every
// test file, so a broken type here produces a TS error that fails this suite.
// The runtime `it` block below exists only so Jest registers the file as a
// suite with a passing assertion.
// ---------------------------------------------------------------------------

// Exact type-equality helper (distinguishes `any`, unions, etc.).
type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

// --- InterpolationKeys -----------------------------------------------------

// Single placeholder.
type _Single = Expect<Equal<InterpolationKeys<'Hello, {{name}}!'>, 'name'>>;

// Multiple placeholders with surrounding text (README's documented example).
type _Multi = Expect<
  Equal<InterpolationKeys<'You have {{count}} messages from {{sender}}'>, 'count' | 'sender'>
>;

// Adjacent placeholders with no separating text.
type _Adjacent = Expect<Equal<InterpolationKeys<'{{a}}{{b}}'>, 'a' | 'b'>>;

// No placeholders resolves to `never`.
type _None = Expect<Equal<InterpolationKeys<'just a plain string'>, never>>;

// Empty string resolves to `never`.
type _Empty = Expect<Equal<InterpolationKeys<''>, never>>;

// --- ExtractInterpolationKeys ----------------------------------------------

// Plain string behaves like InterpolationKeys.
type _ExtractString = Expect<Equal<ExtractInterpolationKeys<'Hi {{name}}'>, 'name'>>;

// Flat record: union across all values.
type _ExtractFlat = Expect<
  Equal<
    ExtractInterpolationKeys<{ a: 'Hi {{x}}'; b: 'Bye {{y}}'; c: 'no placeholder' }>,
    'x' | 'y'
  >
>;

// Nested record: recursion descends into nested objects (documented feature).
type _ExtractNested = Expect<
  Equal<
    ExtractInterpolationKeys<{
      greeting: 'Hi {{name}}';
      nav: { profile: 'Welcome back, {{username}}'; home: 'Home' };
    }>,
    'name' | 'username'
  >
>;

// Record with no placeholders anywhere resolves to `never`.
type _ExtractNever = Expect<
  Equal<ExtractInterpolationKeys<{ a: 'plain'; b: { c: 'also plain' } }>, never>
>;

// Reference the type aliases so `noUnusedLocals`-style tooling keeps them.
const _typeChecks: [
  _Single,
  _Multi,
  _Adjacent,
  _None,
  _Empty,
  _ExtractString,
  _ExtractFlat,
  _ExtractNested,
  _ExtractNever,
] = [true, true, true, true, true, true, true, true, true];

describe('type utilities', () => {
  it('compile-time assertions hold', () => {
    expect(_typeChecks.every(Boolean)).toBe(true);
  });
});
