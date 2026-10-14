// Parsing what students type. Accepts whole numbers, decimals with a comma
// or a point, and fractions such as 60/7.

import { Frac } from './fraction.js';

export function parseNumber(raw) {
  if (raw === undefined || raw === null) return null;
  const s = String(raw).trim().replace(/−/g, '-').replace(/\s+/g, '');
  if (s === '') return null;
  let m = s.match(/^([+-]?)(\d+)$/);
  if (m) return { value: new Frac(Number(m[1] + m[2])), form: 'int' };
  m = s.match(/^([+-]?)(\d*)[.,](\d+)$/);
  if (m) {
    const digits = m[3];
    const n = Number((m[2] || '0') + digits);
    const value = new Frac((m[1] === '-' ? -1 : 1) * n, 10 ** digits.length);
    return { value, form: 'dec', dp: digits.length };
  }
  m = s.match(/^([+-]?\d+)\/([+-]?\d+)$/);
  if (m && Number(m[2]) !== 0) return { value: new Frac(Number(m[1]), Number(m[2])), form: 'frac' };
  return null;
}

// Exact items (1-4, 6): any form whose value is exactly right.
export function matchesExact(parsed, truth) {
  return !!parsed && parsed.value.eq(truth);
}

// Average items (7-8): the exact fraction, or a decimal equal to the true
// value rounded to 1 decimal place. A whole number fits either.
export function matchesAverage(parsed, truth) {
  if (!parsed) return false;
  if (parsed.form === 'frac') return parsed.value.eq(truth);
  if (parsed.form === 'int') return parsed.value.eq(truth) || parsed.value.eq(truth.round1());
  return parsed.value.eq(truth.round1());
}

// True when a vector mixes a fraction with a decimal. Whole numbers are neutral.
export function isMixedForm(parsedList) {
  const forms = new Set(parsedList.filter(Boolean).map((p) => p.form));
  return forms.has('frac') && forms.has('dec');
}

export function isFilled(raw) {
  return raw !== undefined && raw !== null && String(raw).trim() !== '';
}
