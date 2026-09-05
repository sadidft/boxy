/**
 * Table formula engine. Grammar is kept identical to the previous Boxy:
 *   ^(mnt|hrs|sec|dur|sum|avg|max|min|cnt|diff|days|weeks|last|first|pct|inc|streak)//(all|\d+)$  (case-insensitive)
 * Semantics are identical to the previous implementation, with one deliberate difference:
 * an empty result is returned as "" (the UI renders a muted placeholder) instead of a dash character.
 */
export const FORMULA_REGEX = /^(mnt|hrs|sec|dur|sum|avg|max|min|cnt|diff|days|weeks|last|first|pct|inc|streak)\/\/(all|\d+)$/i;

export type FormulaType = 'mnt' | 'hrs' | 'sec' | 'dur' | 'sum' | 'avg' | 'max' | 'min' | 'cnt' | 'diff' | 'days' | 'weeks' | 'last' | 'first' | 'pct' | 'inc' | 'streak';

export const EMPTY = '';

export function isFormula(value: string): boolean {
  return FORMULA_REGEX.test(value.trim());
}

export function parseFormula(value: string): { type: FormulaType; range: string } | null {
  const m = value.trim().match(FORMULA_REGEX);
  if (!m) return null;
  return { type: m[1]!.toLowerCase() as FormulaType, range: m[2]!.toLowerCase() };
}

function parseTimeToMinutes(timeStr: string): number | null {
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return null;
  const hours = parseInt(parts[0]!, 10);
  const minutes = parseInt(parts[1]!, 10);
  const seconds = parts.length > 2 ? parseInt(parts[2]!, 10) : 0;
  if (Number.isNaN(hours) || Number.isNaN(minutes) || Number.isNaN(seconds)) return null;
  return hours * 60 + minutes + seconds / 60;
}

function parseDate(dateStr: string): Date | null {
  const date = new Date(dateStr.trim());
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseNumber(value: string): number | null {
  const num = parseFloat(value.trim().replace(/[,$]/g, ''));
  return Number.isNaN(num) ? null : num;
}

export function formatDuration(totalMinutes: number): string {
  const absMinutes = Math.abs(totalMinutes);
  if (absMinutes < 1) return `${Math.round(absMinutes * 60)}s`;
  if (absMinutes < 60) {
    const mins = Math.floor(absMinutes);
    const secs = Math.round((absMinutes - mins) * 60);
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  }
  const hours = Math.floor(absMinutes / 60);
  const mins = Math.round(absMinutes % 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function getValuesForRange(values: string[], range: string): string[] {
  if (range === 'all') return values;
  const n = parseInt(range, 10);
  if (Number.isNaN(n) || n <= 0) return [];
  return values.slice(-n);
}

function spanMinutes(times: number[], range: string): number | null {
  if (times.length < 2) return null;
  if (range === 'all') return times[times.length - 1]! - times[0]!;
  const n = parseInt(range, 10);
  if (times.length < n + 1) return null;
  return times[times.length - 1]! - times[times.length - 1 - n]!;
}

function spanMs(dates: Date[], range: string): number | null {
  if (dates.length < 2) return null;
  if (range === 'all') return dates[dates.length - 1]!.getTime() - dates[0]!.getTime();
  const n = parseInt(range, 10);
  if (dates.length < n + 1) return null;
  return dates[dates.length - 1]!.getTime() - dates[dates.length - 1 - n]!.getTime();
}

/**
 * @param formula      DSL string such as "sum//all"
 * @param columnValues values of the same column above the formula cell, top to bottom
 * @returns the rendered result, or "" when there is nothing to compute
 */
export function evaluateFormula(formula: string, columnValues: string[]): string {
  const parsed = parseFormula(formula);
  if (!parsed) return formula;
  const { type, range } = parsed;
  const cleanValues = columnValues.filter((v) => v.trim() && !isFormula(v));
  const values = getValuesForRange(cleanValues, range);
  if (values.length === 0 && type !== 'cnt') return EMPTY;

  try {
    switch (type) {
      case 'sum': {
        const nums = values.map(parseNumber).filter((n): n is number => n !== null);
        if (nums.length === 0) return EMPTY;
        const total = nums.reduce((a, b) => a + b, 0);
        return Number.isInteger(total) ? total.toString() : total.toFixed(2);
      }
      case 'avg': {
        const nums = values.map(parseNumber).filter((n): n is number => n !== null);
        if (nums.length === 0) return EMPTY;
        return (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2);
      }
      case 'max': {
        const nums = values.map(parseNumber).filter((n): n is number => n !== null);
        if (nums.length === 0) return EMPTY;
        return Math.max(...nums).toString();
      }
      case 'min': {
        const nums = values.map(parseNumber).filter((n): n is number => n !== null);
        if (nums.length === 0) return EMPTY;
        return Math.min(...nums).toString();
      }
      case 'cnt':
        return values.length.toString();
      case 'diff': {
        const n = parseInt(range, 10);
        if (Number.isNaN(n) || n <= 0 || cleanValues.length < n + 1) return EMPTY;
        const current = parseNumber(cleanValues[cleanValues.length - 1]!);
        const previous = parseNumber(cleanValues[cleanValues.length - 1 - n]!);
        if (current === null || previous === null) return EMPTY;
        const diff = current - previous;
        const result = Number.isInteger(diff) ? diff.toString() : diff.toFixed(2);
        return diff >= 0 ? `+${result}` : result;
      }
      case 'mnt': {
        const span = spanMinutes(values.map(parseTimeToMinutes).filter((t): t is number => t !== null), range);
        return span === null ? EMPTY : span.toFixed(1);
      }
      case 'hrs': {
        const span = spanMinutes(values.map(parseTimeToMinutes).filter((t): t is number => t !== null), range);
        return span === null ? EMPTY : (span / 60).toFixed(2);
      }
      case 'sec': {
        const span = spanMinutes(values.map(parseTimeToMinutes).filter((t): t is number => t !== null), range);
        return span === null ? EMPTY : Math.round(span * 60).toString();
      }
      case 'dur': {
        const span = spanMinutes(values.map(parseTimeToMinutes).filter((t): t is number => t !== null), range);
        return span === null ? EMPTY : formatDuration(span);
      }
      case 'days': {
        const ms = spanMs(values.map(parseDate).filter((d): d is Date => d !== null), range);
        return ms === null ? EMPTY : Math.round(ms / 86_400_000).toString();
      }
      case 'weeks': {
        const ms = spanMs(values.map(parseDate).filter((d): d is Date => d !== null), range);
        return ms === null ? EMPTY : (ms / (86_400_000 * 7)).toFixed(1);
      }
      case 'last': {
        const n = parseInt(range, 10);
        if (Number.isNaN(n) || n <= 0 || cleanValues.length < n) return EMPTY;
        return cleanValues[cleanValues.length - n]!;
      }
      case 'first': {
        const n = parseInt(range, 10);
        if (Number.isNaN(n) || n <= 0 || cleanValues.length < n) return EMPTY;
        return cleanValues[n - 1]!;
      }
      case 'pct': {
        const n = parseInt(range, 10);
        if (Number.isNaN(n) || n < 2) return EMPTY;
        const nums = values.map(parseNumber).filter((num): num is number => num !== null);
        if (nums.length < 2) return EMPTY;
        const numerator = nums[nums.length - 1]!;
        const denominator = nums[nums.length - 2]!;
        if (denominator === 0) return EMPTY;
        return `${((numerator / denominator) * 100).toFixed(1)}%`;
      }
      case 'inc': {
        const n = parseInt(range, 10);
        if (Number.isNaN(n) || n <= 0 || cleanValues.length < n) return '1';
        const num = parseNumber(cleanValues[cleanValues.length - n]!);
        return num !== null ? (num + 1).toString() : '1';
      }
      case 'streak': {
        if (cleanValues.length === 0) return '0';
        const lastValue = cleanValues[cleanValues.length - 1];
        let streak = 1;
        for (let i = cleanValues.length - 2; i >= 0; i -= 1) {
          if (cleanValues[i] === lastValue) streak += 1;
          else break;
        }
        return streak.toString();
      }
      default:
        return EMPTY;
    }
  } catch {
    return EMPTY;
  }
}

export interface FormulaGuideEntry {
  syntax: string;
  key: string; // i18n key under formula.guide.*
}

export const formulaGuide: { category: string; entries: FormulaGuideEntry[] }[] = [
  {
    category: 'numeric',
    entries: [
      { syntax: 'sum//all', key: 'sum' },
      { syntax: 'avg//all', key: 'avg' },
      { syntax: 'max//all', key: 'max' },
      { syntax: 'min//all', key: 'min' },
      { syntax: 'cnt//all', key: 'cnt' },
      { syntax: 'diff//N', key: 'diff' },
    ],
  },
  {
    category: 'time',
    entries: [
      { syntax: 'mnt//all', key: 'mnt' },
      { syntax: 'hrs//all', key: 'hrs' },
      { syntax: 'sec//all', key: 'sec' },
      { syntax: 'dur//all', key: 'dur' },
    ],
  },
  {
    category: 'date',
    entries: [
      { syntax: 'days//all', key: 'days' },
      { syntax: 'weeks//all', key: 'weeks' },
    ],
  },
  {
    category: 'special',
    entries: [
      { syntax: 'last//N', key: 'last' },
      { syntax: 'first//N', key: 'first' },
      { syntax: 'pct//2', key: 'pct' },
      { syntax: 'inc//N', key: 'inc' },
      { syntax: 'streak//all', key: 'streak' },
    ],
  },
];
