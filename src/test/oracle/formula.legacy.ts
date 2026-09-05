// @ts-nocheck
/* eslint-disable */
// Verbatim copy of the previous formula implementation, used only as a test oracle. Not shipped.
/**
 * Boxy Formula Parser and Evaluator
 * 
 * Formula format: type//range
 * Examples: sum//all, avg//3, mnt//1, dur//all
 */

// Formula regex pattern
const FORMULA_REGEX = /^(mnt|hrs|sec|dur|sum|avg|max|min|cnt|diff|days|weeks|last|first|pct|inc|streak)\/\/(all|\d+)$/i;

/**
 * Check if a string is a formula
 */
export function isFormula(value: string): boolean {
  return FORMULA_REGEX.test(value.trim());
}

/**
 * Parse time string (HH:mm or HH:mm:ss) to minutes
 */
function parseTimeToMinutes(timeStr: string): number | null {
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return null;
  
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const seconds = parts.length > 2 ? parseInt(parts[2], 10) : 0;
  
  if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) return null;
  
  return hours * 60 + minutes + seconds / 60;
}

/**
 * Parse date string (YYYY-MM-DD) to Date object
 */
function parseDate(dateStr: string): Date | null {
  const date = new Date(dateStr.trim());
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Parse numeric value
 */
function parseNumber(value: string): number | null {
  const num = parseFloat(value.trim().replace(/[,$]/g, ''));
  return isNaN(num) ? null : num;
}

/**
 * Format duration in smart way
 */
function formatDuration(totalMinutes: number): string {
  const absMinutes = Math.abs(totalMinutes);
  
  if (absMinutes < 1) {
    const seconds = Math.round(absMinutes * 60);
    return `${seconds}s`;
  }
  
  if (absMinutes < 60) {
    const mins = Math.floor(absMinutes);
    const secs = Math.round((absMinutes - mins) * 60);
    if (secs > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${mins}m`;
  }
  
  const hours = Math.floor(absMinutes / 60);
  const mins = Math.round(absMinutes % 60);
  
  if (mins > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${hours}h`;
}

/**
 * Get values based on range parameter
 * @param values All column values above the formula cell
 * @param range 'all' or a number
 */
function getValuesForRange(values: string[], range: string): string[] {
  if (range === 'all') {
    return values;
  }
  
  const n = parseInt(range, 10);
  if (isNaN(n) || n <= 0) return [];
  
  return values.slice(-n);
}

/**
 * Evaluate a formula against column values
 * @param formula The formula string (e.g., "sum//all")
 * @param columnValues Array of values from the same column, above the formula cell
 * @returns Calculated result or "—" for errors
 */
export function evaluateFormula(formula: string, columnValues: string[]): string {
  const match = formula.trim().match(FORMULA_REGEX);
  if (!match) return formula; // Not a formula, return as-is
  
  const type = match[1].toLowerCase();
  const range = match[2].toLowerCase();
  
  // Filter out empty values and other formula cells
  const cleanValues = columnValues.filter(v => v.trim() && !isFormula(v));
  const values = getValuesForRange(cleanValues, range);
  
  if (values.length === 0 && type !== 'cnt') {
    return '—';
  }
  
  try {
    switch (type) {
      // ============ NUMERIC FORMULAS ============
      case 'sum': {
        const nums = values.map(parseNumber).filter((n): n is number => n !== null);
        if (nums.length === 0) return '—';
        const total = nums.reduce((a, b) => a + b, 0);
        return Number.isInteger(total) ? total.toString() : total.toFixed(2);
      }
      
      case 'avg': {
        const nums = values.map(parseNumber).filter((n): n is number => n !== null);
        if (nums.length === 0) return '—';
        const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
        return avg.toFixed(2);
      }
      
      case 'max': {
        const nums = values.map(parseNumber).filter((n): n is number => n !== null);
        if (nums.length === 0) return '—';
        return Math.max(...nums).toString();
      }
      
      case 'min': {
        const nums = values.map(parseNumber).filter((n): n is number => n !== null);
        if (nums.length === 0) return '—';
        return Math.min(...nums).toString();
      }
      
      case 'cnt': {
        return values.length.toString();
      }
      
      case 'diff': {
        const n = parseInt(range, 10);
        if (isNaN(n) || n <= 0 || cleanValues.length < n + 1) return '—';
        
        const current = parseNumber(cleanValues[cleanValues.length - 1]);
        const previous = parseNumber(cleanValues[cleanValues.length - 1 - n]);
        
        if (current === null || previous === null) return '—';
        
        const diff = current - previous;
        const result = Number.isInteger(diff) ? diff.toString() : diff.toFixed(2);
        return diff >= 0 ? `+${result}` : result;
      }
      
      // ============ TIME FORMULAS ============
      case 'mnt': {
        const times = values.map(parseTimeToMinutes).filter((t): t is number => t !== null);
        if (times.length < 2) return '—';
        
        if (range === 'all') {
          // Total difference from first to last
          const totalDiff = times[times.length - 1] - times[0];
          return totalDiff.toFixed(1);
        } else {
          // Difference between last N times
          const n = parseInt(range, 10);
          if (times.length < n + 1) return '—';
          const diff = times[times.length - 1] - times[times.length - 1 - n];
          return diff.toFixed(1);
        }
      }
      
      case 'hrs': {
        const times = values.map(parseTimeToMinutes).filter((t): t is number => t !== null);
        if (times.length < 2) return '—';
        
        let totalMinutes: number;
        if (range === 'all') {
          totalMinutes = times[times.length - 1] - times[0];
        } else {
          const n = parseInt(range, 10);
          if (times.length < n + 1) return '—';
          totalMinutes = times[times.length - 1] - times[times.length - 1 - n];
        }
        
        return (totalMinutes / 60).toFixed(2);
      }
      
      case 'sec': {
        const times = values.map(parseTimeToMinutes).filter((t): t is number => t !== null);
        if (times.length < 2) return '—';
        
        let totalMinutes: number;
        if (range === 'all') {
          totalMinutes = times[times.length - 1] - times[0];
        } else {
          const n = parseInt(range, 10);
          if (times.length < n + 1) return '—';
          totalMinutes = times[times.length - 1] - times[times.length - 1 - n];
        }
        
        return Math.round(totalMinutes * 60).toString();
      }
      
      case 'dur': {
        const times = values.map(parseTimeToMinutes).filter((t): t is number => t !== null);
        if (times.length < 2) return '—';
        
        let totalMinutes: number;
        if (range === 'all') {
          totalMinutes = times[times.length - 1] - times[0];
        } else {
          const n = parseInt(range, 10);
          if (times.length < n + 1) return '—';
          totalMinutes = times[times.length - 1] - times[times.length - 1 - n];
        }
        
        return formatDuration(totalMinutes);
      }
      
      // ============ DATE FORMULAS ============
      case 'days': {
        const dates = values.map(parseDate).filter((d): d is Date => d !== null);
        if (dates.length < 2) return '—';
        
        let diffMs: number;
        if (range === 'all') {
          diffMs = dates[dates.length - 1].getTime() - dates[0].getTime();
        } else {
          const n = parseInt(range, 10);
          if (dates.length < n + 1) return '—';
          diffMs = dates[dates.length - 1].getTime() - dates[dates.length - 1 - n].getTime();
        }
        
        const days = Math.round(diffMs / (1000 * 60 * 60 * 24));
        return days.toString();
      }
      
      case 'weeks': {
        const dates = values.map(parseDate).filter((d): d is Date => d !== null);
        if (dates.length < 2) return '—';
        
        let diffMs: number;
        if (range === 'all') {
          diffMs = dates[dates.length - 1].getTime() - dates[0].getTime();
        } else {
          const n = parseInt(range, 10);
          if (dates.length < n + 1) return '—';
          diffMs = dates[dates.length - 1].getTime() - dates[dates.length - 1 - n].getTime();
        }
        
        const weeks = diffMs / (1000 * 60 * 60 * 24 * 7);
        return weeks.toFixed(1);
      }
      
      // ============ SPECIAL FORMULAS ============
      case 'last': {
        const n = parseInt(range, 10);
        if (isNaN(n) || n <= 0 || cleanValues.length < n) return '—';
        return cleanValues[cleanValues.length - n];
      }
      
      case 'first': {
        const n = parseInt(range, 10);
        if (isNaN(n) || n <= 0 || cleanValues.length < n) return '—';
        return cleanValues[n - 1];
      }
      
      case 'pct': {
        const n = parseInt(range, 10);
        if (isNaN(n) || n < 2) return '—';
        
        const nums = values.map(parseNumber).filter((num): num is number => num !== null);
        if (nums.length < 2) return '—';
        
        // Last value / second-to-last value * 100
        const numerator = nums[nums.length - 1];
        const denominator = nums[nums.length - 2];
        
        if (denominator === 0) return '—';
        
        const pct = (numerator / denominator) * 100;
        return `${pct.toFixed(1)}%`;
      }
      
      case 'inc': {
        const n = parseInt(range, 10);
        if (isNaN(n) || n <= 0 || cleanValues.length < n) return '1';
        
        const prevValue = cleanValues[cleanValues.length - n];
        const num = parseNumber(prevValue);
        
        return num !== null ? (num + 1).toString() : '1';
      }
      
      case 'streak': {
        if (cleanValues.length === 0) return '0';
        
        const lastValue = cleanValues[cleanValues.length - 1];
        let streak = 1;
        
        for (let i = cleanValues.length - 2; i >= 0; i--) {
          if (cleanValues[i] === lastValue) {
            streak++;
          } else {
            break;
          }
        }
        
        return streak.toString();
      }
      
      default:
        return '—';
    }
  } catch {
    return '—';
  }
}

/**
 * Get all formulas with their descriptions for the formula guide
 */
export function _legacyGetFormulaGuide(): { category: string; formulas: { syntax: string; description: string }[] }[] {
  return [
    {
      category: 'Numeric Formulas',
      formulas: [
        { syntax: 'sum//all or sum//N', description: 'Sum all values or last N values' },
        { syntax: 'avg//all or avg//N', description: 'Average of all or last N values' },
        { syntax: 'max//all', description: 'Maximum value' },
        { syntax: 'min//all', description: 'Minimum value' },
        { syntax: 'cnt//all', description: 'Count non-empty cells' },
        { syntax: 'diff//N', description: 'Difference between current and N rows above' },
      ]
    },
    {
      category: 'Time Formulas (HH:mm format)',
      formulas: [
        { syntax: 'mnt//all or mnt//N', description: 'Time difference in minutes' },
        { syntax: 'hrs//all or hrs//N', description: 'Time difference in hours' },
        { syntax: 'sec//all or sec//N', description: 'Time difference in seconds' },
        { syntax: 'dur//all', description: 'Smart duration format (e.g., "1h 30m")' },
      ]
    },
    {
      category: 'Date Formulas (YYYY-MM-DD format)',
      formulas: [
        { syntax: 'days//all or days//N', description: 'Difference in days' },
        { syntax: 'weeks//all or weeks//N', description: 'Difference in weeks' },
      ]
    },
    {
      category: 'Special Formulas',
      formulas: [
        { syntax: 'last//N', description: 'Value from N rows above' },
        { syntax: 'first//N', description: 'Value from row N (1-indexed)' },
        { syntax: 'pct//2', description: 'Percentage (current/previous * 100)' },
        { syntax: 'inc//N', description: 'Increment value from N rows above' },
        { syntax: 'streak//all', description: 'Count consecutive matching values' },
      ]
    }
  ];
}
