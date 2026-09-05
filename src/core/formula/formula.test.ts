import { describe, expect, it } from 'vitest';
import { evaluateFormula, isFormula } from './index';
import { evaluateFormula as legacyEvaluate } from '@/test/oracle/formula.legacy';

// guardrail-exception: the previous app printed an em dash for empty results; the oracle must match it
const LEGACY_EMPTY = '\u2014';
const TYPES = ['mnt', 'hrs', 'sec', 'dur', 'sum', 'avg', 'max', 'min', 'cnt', 'diff', 'days', 'weeks', 'last', 'first', 'pct', 'inc', 'streak'];
const RANGES = ['all', '1', '2', '3', '5', '10'];

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomValue(rnd: () => number): string {
  const r = rnd();
  const pick = <T,>(arr: T[]) => arr[Math.floor(rnd() * arr.length)]!;
  if (r < 0.25) return String(Math.floor(rnd() * 2000 - 500) / (rnd() < 0.5 ? 1 : 4));
  if (r < 0.4) return `${String(Math.floor(rnd() * 24)).padStart(2, '0')}:${String(Math.floor(rnd() * 60)).padStart(2, '0')}`;
  if (r < 0.5) return `${String(Math.floor(rnd() * 24)).padStart(2, '0')}:${String(Math.floor(rnd() * 60)).padStart(2, '0')}:${String(Math.floor(rnd() * 60)).padStart(2, '0')}`;
  if (r < 0.65) return `2026-${String(1 + Math.floor(rnd() * 12)).padStart(2, '0')}-${String(1 + Math.floor(rnd() * 28)).padStart(2, '0')}`;
  if (r < 0.75) return pick(['', ' ', 'abc', '$1,200', '12abc', 'n/a']);
  if (r < 0.85) return pick(['sum//all', 'avg//2', 'cnt//all', 'x//y']);
  return pick(['1', '1', '2', 'done', 'done', 'done']);
}

describe('formula engine', () => {
  it('recognises the legacy grammar', () => {
    expect(isFormula('sum//all')).toBe(true);
    expect(isFormula('SUM//3')).toBe(true);
    expect(isFormula(' dur//all ')).toBe(true);
    expect(isFormula('sum//')).toBe(false);
    expect(isFormula('total//all')).toBe(false);
    expect(isFormula('sum/all')).toBe(false);
  });

  it('matches hand written expectations', () => {
    expect(evaluateFormula('sum//all', ['1', '2', '3.5'])).toBe('6.50');
    expect(evaluateFormula('sum//2', ['1', '2', '3'])).toBe('5');
    expect(evaluateFormula('avg//all', ['1', '2'])).toBe('1.50');
    expect(evaluateFormula('cnt//all', [])).toBe('0');
    expect(evaluateFormula('dur//all', ['09:00', '10:30'])).toBe('1h 30m');
    expect(evaluateFormula('mnt//all', ['09:00', '09:45'])).toBe('45.0');
    expect(evaluateFormula('days//all', ['2026-01-01', '2026-01-31'])).toBe('30');
    expect(evaluateFormula('diff//1', ['10', '12'])).toBe('+2');
    expect(evaluateFormula('pct//2', ['50', '25'])).toBe('50.0%');
    expect(evaluateFormula('inc//1', ['41'])).toBe('42');
    expect(evaluateFormula('streak//all', ['a', 'b', 'b', 'b'])).toBe('3');
    expect(evaluateFormula('sum//all', ['abc'])).toBe('');
    expect(evaluateFormula('not a formula', ['1'])).toBe('not a formula');
  });

  it('is identical to the previous implementation, except empty results', () => {
    const rnd = mulberry32(20260905);
    let cases = 0;
    let emptyCases = 0;
    for (let n = 0; n < 5000; n += 1) {
      const len = Math.floor(rnd() * 12);
      const values = Array.from({ length: len }, () => randomValue(rnd));
      const type = TYPES[Math.floor(rnd() * TYPES.length)]!;
      const range = RANGES[Math.floor(rnd() * RANGES.length)]!;
      const formula = `${type}//${range}`;
      const expected = legacyEvaluate(formula, values);
      const actual = evaluateFormula(formula, values);
      cases += 1;
      if (expected === LEGACY_EMPTY) {
        emptyCases += 1;
        expect(actual, `${formula} ${JSON.stringify(values)}`).toBe('');
      } else {
        expect(actual, `${formula} ${JSON.stringify(values)}`).toBe(expected);
      }
    }
    expect(cases).toBe(5000);
    expect(emptyCases).toBeGreaterThan(100);
  });
});
