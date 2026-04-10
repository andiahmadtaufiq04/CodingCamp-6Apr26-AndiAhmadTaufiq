import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { oppositeTheme, formatGreeting, isValidDuration } from '../js/pure.js';

// ---------------------------------------------------------------------------
// Task 2.4 — Property test: oppositeTheme is an involution
// Validates: Requirements 1.2
// ---------------------------------------------------------------------------
describe('oppositeTheme — Property 1: involution', () => {
  it('oppositeTheme(oppositeTheme(t)) === t for any theme value', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('light', 'dark'),
        (t) => {
          expect(oppositeTheme(oppositeTheme(t))).toBe(t);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Task 2.5 — Unit tests for oppositeTheme
// Validates: Requirements 1.6, 1.7
// ---------------------------------------------------------------------------
describe('oppositeTheme — unit tests', () => {
  it("oppositeTheme('light') → 'dark'", () => {
    expect(oppositeTheme('light')).toBe('dark');
  });

  it("oppositeTheme('dark') → 'light'", () => {
    expect(oppositeTheme('dark')).toBe('light');
  });
});

// ---------------------------------------------------------------------------
// Task 3.3 — Property tests: formatGreeting
// Validates: Requirements 2.2, 2.3, 2.6
// ---------------------------------------------------------------------------
describe('formatGreeting — Property 3: greeting with name', () => {
  it('returns "<phrase>, <trimmed name>" for any non-empty, non-whitespace name', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.string().filter((s) => s.trim().length > 0),
        (phrase, name) => {
          const result = formatGreeting(phrase, name);
          expect(result).toBe(`${phrase}, ${name.trim()}`);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('formatGreeting — Property 4: greeting without name', () => {
  it('returns exactly the phrase for whitespace-only or empty name', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.stringOf(fc.constantFrom(' ', '\t', '\n')),
        (phrase, name) => {
          const result = formatGreeting(phrase, name);
          expect(result).toBe(phrase);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Task 3.4 — Unit tests for formatGreeting
// Validates: Requirements 2.3, 2.5, 2.6
// ---------------------------------------------------------------------------
describe('formatGreeting — unit tests', () => {
  it("formatGreeting('Good Morning', 'Alex') → 'Good Morning, Alex'", () => {
    expect(formatGreeting('Good Morning', 'Alex')).toBe('Good Morning, Alex');
  });

  it("formatGreeting('Good Morning', '  ') → 'Good Morning'", () => {
    expect(formatGreeting('Good Morning', '  ')).toBe('Good Morning');
  });

  it("formatGreeting('Good Morning', '') → 'Good Morning'", () => {
    expect(formatGreeting('Good Morning', '')).toBe('Good Morning');
  });

  it('formatGreeting with undefined name → phrase only', () => {
    expect(formatGreeting('Good Morning', undefined)).toBe('Good Morning');
  });
});

// ---------------------------------------------------------------------------
// Task 5.2 — Property tests: isValidDuration
// Validates: Requirements 3.2, 3.3
// ---------------------------------------------------------------------------

/**
 * Property 6: Valid timer duration is accepted
 * Validates: Requirements 3.2
 */
describe('isValidDuration — Property 6: valid duration accepted', () => {
  it('returns true for any integer in [1, 180]', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 180 }),
        (n) => {
          expect(isValidDuration(n)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 7: Invalid timer duration is rejected
 * Validates: Requirements 3.3
 */
describe('isValidDuration — Property 7: invalid duration rejected', () => {
  it('returns false for integers outside [1, 180]', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.integer({ max: 0 }),
          fc.integer({ min: 181 })
        ),
        (n) => {
          expect(isValidDuration(n)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns false for non-integer numbers', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 1, max: 180, noNaN: true }).filter((n) => !Number.isInteger(n)),
        (n) => {
          expect(isValidDuration(n)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Task 5.2 — Unit tests for isValidDuration
// Validates: Requirements 3.2, 3.3
// ---------------------------------------------------------------------------
describe('isValidDuration — unit tests', () => {
  it('isValidDuration(1) → true', () => expect(isValidDuration(1)).toBe(true));
  it('isValidDuration(180) → true', () => expect(isValidDuration(180)).toBe(true));
  it('isValidDuration(25) → true', () => expect(isValidDuration(25)).toBe(true));
  it('isValidDuration(0) → false', () => expect(isValidDuration(0)).toBe(false));
  it('isValidDuration(181) → false', () => expect(isValidDuration(181)).toBe(false));
  it('isValidDuration(1.5) → false', () => expect(isValidDuration(1.5)).toBe(false));
  it('isValidDuration("45") → true (string coercion)', () => expect(isValidDuration('45')).toBe(true));
  it('isValidDuration("abc") → false', () => expect(isValidDuration('abc')).toBe(false));
  it('isValidDuration(null) → false', () => expect(isValidDuration(null)).toBe(false));
});
