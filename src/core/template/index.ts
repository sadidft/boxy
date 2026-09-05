/**
 * Template engine (variables inside card text).
 *
 * Grammar:
 *   template := { text | "\{{" | expr }
 *   expr     := "{{" name { "|" filter } "}}"
 *   name     := builtin | ident | "global:" ident | "counter:" ident | ("date"|"today") ("+"|"-") digits
 *   filter   := "default:" value | "choice:" a,b,c | "fmt:" pattern | upper | lower | title | trim
 */

export const BUILTINS = ['date', 'today', 'time', 'now', 'datetime', 'timestamp', 'random', 'uuid', 'weekday', 'month', 'year', 'clipboard'] as const;
export type Builtin = (typeof BUILTINS)[number];

export type Filter =
  | { kind: 'default'; value: string }
  | { kind: 'choice'; options: string[] }
  | { kind: 'fmt'; pattern: string }
  | { kind: 'upper' }
  | { kind: 'lower' }
  | { kind: 'title' }
  | { kind: 'trim' };

export type Node =
  | { kind: 'text'; value: string }
  | { kind: 'builtin'; name: Builtin; offsetDays: number; filters: Filter[]; raw: string }
  | { kind: 'var'; name: string; filters: Filter[]; raw: string }
  | { kind: 'global'; name: string; filters: Filter[]; raw: string }
  | { kind: 'counter'; name: string; filters: Filter[]; raw: string };

export interface VarSpec {
  name: string;
  defaultValue?: string;
  choices?: string[];
  /** Position of the first occurrence, used to order form fields. */
  index: number;
}

export interface ParseIssue {
  start: number;
  end: number;
  message: string;
}

export interface ParsedTemplate {
  nodes: Node[];
  vars: VarSpec[];
  usesClipboard: boolean;
  counters: string[];
  globals: string[];
  errors: ParseIssue[];
}

const IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/;
const DATE_TOKEN = /(YYYY|MMMM|MMM|MM|M|DD|D|dddd|ddd|HH|mm|ss)/;

export function parseTemplate(src: string): ParsedTemplate {
  const nodes: Node[] = [];
  const vars = new Map<string, VarSpec>();
  const counters = new Set<string>();
  const globals = new Set<string>();
  const errors: ParseIssue[] = [];
  let usesClipboard = false;
  let text = '';
  let i = 0;
  const flush = () => {
    if (text) nodes.push({ kind: 'text', value: text });
    text = '';
  };
  while (i < src.length) {
    if (src.startsWith('\\{{', i)) {
      text += '{{';
      i += 3;
      continue;
    }
    if (src.startsWith('{{', i)) {
      const close = src.indexOf('}}', i + 2);
      if (close === -1) {
        text += src.slice(i);
        break;
      }
      const raw = src.slice(i, close + 2);
      const inner = src.slice(i + 2, close);
      const node = parseExpr(inner, raw);
      if (!node) {
        // Not a valid expression: keep it verbatim (same behaviour as the previous app).
        text += raw;
        errors.push({ start: i, end: close + 2, message: 'Not a variable' });
        i = close + 2;
        continue;
      }
      flush();
      nodes.push(node);
      if (node.kind === 'var') {
        if (!vars.has(node.name)) {
          const spec: VarSpec = { name: node.name, index: i };
          for (const f of node.filters) {
            if (f.kind === 'default') spec.defaultValue = f.value;
            if (f.kind === 'choice') spec.choices = f.options;
          }
          vars.set(node.name, spec);
        } else {
          const spec = vars.get(node.name)!;
          for (const f of node.filters) {
            if (f.kind === 'default' && spec.defaultValue === undefined) spec.defaultValue = f.value;
            if (f.kind === 'choice' && !spec.choices) spec.choices = f.options;
          }
        }
      } else if (node.kind === 'counter') counters.add(node.name);
      else if (node.kind === 'global') globals.add(node.name);
      else if (node.kind === 'builtin' && node.name === 'clipboard') usesClipboard = true;
      i = close + 2;
      continue;
    }
    text += src[i];
    i += 1;
  }
  flush();
  return { nodes, vars: [...vars.values()], usesClipboard, counters: [...counters], globals: [...globals], errors };
}

function splitFilters(inner: string): string[] {
  const parts: string[] = [];
  let cur = '';
  for (let i = 0; i < inner.length; i += 1) {
    const ch = inner[i]!;
    if (ch === '\\' && (inner[i + 1] === '|' || inner[i + 1] === ',')) {
      cur += `\\${inner[i + 1]}`;
      i += 1;
      continue;
    }
    if (ch === '|') {
      parts.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  parts.push(cur);
  return parts;
}

function splitChoices(value: string): string[] {
  const out: string[] = [];
  let cur = '';
  for (let i = 0; i < value.length; i += 1) {
    const ch = value[i]!;
    if (ch === '\\' && value[i + 1] === ',') {
      cur += ',';
      i += 1;
      continue;
    }
    if (ch === ',') {
      out.push(cur.trim());
      cur = '';
      continue;
    }
    cur += ch;
  }
  out.push(cur.trim());
  return out.filter((v) => v.length > 0);
}

const unescape = (v: string) => v.replace(/\\([|,])/g, '$1');

function parseFilters(parts: string[]): Filter[] | null {
  const filters: Filter[] = [];
  for (const partRaw of parts) {
    const part = partRaw.trim();
    if (!part) return null;
    const colon = part.indexOf(':');
    const key = (colon === -1 ? part : part.slice(0, colon)).trim().toLowerCase();
    const value = colon === -1 ? '' : part.slice(colon + 1);
    switch (key) {
      case 'default':
        filters.push({ kind: 'default', value: unescape(value.trim()) });
        break;
      case 'choice':
        filters.push({ kind: 'choice', options: splitChoices(value) });
        break;
      case 'fmt':
        filters.push({ kind: 'fmt', pattern: unescape(value.trim()) });
        break;
      case 'upper':
      case 'lower':
      case 'title':
      case 'trim':
        if (colon !== -1) return null;
        filters.push({ kind: key });
        break;
      default:
        // Forward compatibility: an unknown filter made of date tokens is treated as fmt.
        if (colon === -1 && DATE_TOKEN.test(part)) {
          filters.push({ kind: 'fmt', pattern: unescape(part) });
          break;
        }
        return null;
    }
  }
  return filters;
}

function parseExpr(inner: string, raw: string): Node | null {
  const parts = splitFilters(inner);
  const head = parts[0]!.trim();
  if (!head) return null;
  const filters = parseFilters(parts.slice(1));
  if (!filters) return null;

  const offset = head.match(/^(date|today)([+-])(\d{1,4})$/i);
  if (offset) {
    const sign = offset[2] === '-' ? -1 : 1;
    return { kind: 'builtin', name: offset[1]!.toLowerCase() as Builtin, offsetDays: sign * parseInt(offset[3]!, 10), filters, raw };
  }
  const lower = head.toLowerCase();
  if ((BUILTINS as readonly string[]).includes(lower)) return { kind: 'builtin', name: lower as Builtin, offsetDays: 0, filters, raw };
  const scoped = head.match(/^(global|counter):([A-Za-z_][A-Za-z0-9_]*)$/i);
  if (scoped) {
    const kind = scoped[1]!.toLowerCase() as 'global' | 'counter';
    return { kind, name: scoped[2]!, filters, raw };
  }
  if (IDENT.test(head)) return { kind: 'var', name: head, filters, raw };
  return null;
}

export interface RenderContext {
  now: Date;
  locale: string;
  timeZone?: string;
  values: Record<string, string>;
  globals: Record<string, string>;
  counters: Record<string, { value: number; pad?: number }>;
  clipboard?: string;
  /** Deterministic sources for tests. */
  random?: () => number;
  uuid?: () => string;
}

export interface RenderResult {
  text: string;
  usedCounters: string[];
  missingVars: string[];
}

export function renderTemplate(parsed: ParsedTemplate | Node[], ctx: RenderContext): RenderResult {
  const nodes = Array.isArray(parsed) ? parsed : parsed.nodes;
  const usedCounters = new Set<string>();
  const missingVars = new Set<string>();
  let out = '';
  for (const node of nodes) {
    if (node.kind === 'text') {
      out += node.value;
      continue;
    }
    let value: string;
    if (node.kind === 'builtin') value = renderBuiltin(node.name, node.offsetDays, node.filters, ctx);
    else if (node.kind === 'var') {
      const provided = ctx.values[node.name];
      const def = node.filters.find((f): f is Extract<Filter, { kind: 'default' }> => f.kind === 'default')?.value;
      const choice = node.filters.find((f): f is Extract<Filter, { kind: 'choice' }> => f.kind === 'choice')?.options[0];
      if (provided !== undefined && provided !== '') value = provided;
      else if (def !== undefined) value = def;
      else if (choice !== undefined) value = choice;
      else {
        value = provided ?? '';
        if (provided === undefined) missingVars.add(node.name);
      }
    } else if (node.kind === 'global') value = ctx.globals[node.name] ?? '';
    else {
      const c = ctx.counters[node.name];
      const next = (c?.value ?? 0) + 1;
      value = c?.pad ? String(next).padStart(c.pad, '0') : String(next);
      usedCounters.add(node.name);
    }
    out += applyTextFilters(value, node.filters);
  }
  return { text: out, usedCounters: [...usedCounters], missingVars: [...missingVars] };
}

function applyTextFilters(value: string, filters: Filter[]): string {
  let v = value;
  for (const f of filters) {
    if (f.kind === 'upper') v = v.toLocaleUpperCase();
    else if (f.kind === 'lower') v = v.toLocaleLowerCase();
    else if (f.kind === 'trim') v = v.trim();
    else if (f.kind === 'title') v = v.replace(/(^|\s)(\p{L})/gu, (_m, sp: string, ch: string) => sp + ch.toLocaleUpperCase());
  }
  return v;
}

interface Parts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  weekday: number; // 0 Sunday
}

function localParts(date: Date, timeZone?: string): Parts {
  if (!timeZone) {
    return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate(), hour: date.getHours(), minute: date.getMinutes(), second: date.getSeconds(), weekday: date.getDay() };
  }
  const fmt = new Intl.DateTimeFormat('en-US', { timeZone, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', weekday: 'short' });
  const map: Record<string, string> = {};
  for (const p of fmt.formatToParts(date)) map[p.type] = p.value;
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour) % 24,
    minute: Number(map.minute),
    second: Number(map.second),
    weekday: Math.max(0, weekdays.indexOf(map.weekday ?? 'Sun')),
  };
}

const pad2 = (n: number) => String(n).padStart(2, '0');

function shiftDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}

export function formatPattern(pattern: string, date: Date, locale: string, timeZone?: string): string {
  const p = localParts(date, timeZone);
  const name = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale, { ...opts, timeZone }).format(date);
  return pattern.replace(/YYYY|MMMM|MMM|MM|M|DD|D|dddd|ddd|HH|mm|ss/g, (tok) => {
    switch (tok) {
      case 'YYYY':
        return String(p.year);
      case 'MMMM':
        return name({ month: 'long' });
      case 'MMM':
        return name({ month: 'short' }).replace(/\.$/, '');
      case 'MM':
        return pad2(p.month);
      case 'M':
        return String(p.month);
      case 'DD':
        return pad2(p.day);
      case 'D':
        return String(p.day);
      case 'dddd':
        return name({ weekday: 'long' });
      case 'ddd':
        return name({ weekday: 'short' }).replace(/\.$/, '');
      case 'HH':
        return pad2(p.hour);
      case 'mm':
        return pad2(p.minute);
      case 'ss':
        return pad2(p.second);
      default:
        return tok;
    }
  });
}

function renderBuiltin(name: Builtin, offsetDays: number, filters: Filter[], ctx: RenderContext): string {
  const date = offsetDays ? shiftDays(ctx.now, offsetDays) : ctx.now;
  const fmt = filters.find((f): f is Extract<Filter, { kind: 'fmt' }> => f.kind === 'fmt');
  const p = localParts(date, ctx.timeZone);
  switch (name) {
    case 'date':
    case 'today':
      return fmt ? formatPattern(fmt.pattern, date, ctx.locale, ctx.timeZone) : `${p.year}-${pad2(p.month)}-${pad2(p.day)}`;
    case 'time':
    case 'now':
      return fmt ? formatPattern(fmt.pattern, date, ctx.locale, ctx.timeZone) : `${pad2(p.hour)}:${pad2(p.minute)}`;
    case 'datetime':
      return fmt ? formatPattern(fmt.pattern, date, ctx.locale, ctx.timeZone) : `${p.year}-${pad2(p.month)}-${pad2(p.day)} ${pad2(p.hour)}:${pad2(p.minute)}`;
    case 'timestamp':
      return String(date.getTime());
    case 'random': {
      const r = ctx.random ? ctx.random() : Math.random();
      return String(Math.floor(r * 900_000) + 100_000);
    }
    case 'uuid':
      return ctx.uuid ? ctx.uuid() : typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : fallbackUuid();
    case 'weekday':
      return new Intl.DateTimeFormat(ctx.locale, { weekday: 'long', timeZone: ctx.timeZone }).format(date);
    case 'month':
      return new Intl.DateTimeFormat(ctx.locale, { month: 'long', timeZone: ctx.timeZone }).format(date);
    case 'year':
      return String(p.year);
    case 'clipboard':
      return ctx.clipboard ?? '';
    default:
      return '';
  }
}

function fallbackUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/** True when the text contains at least one expression that needs input or side effects at copy time. */
export function hasDynamicContent(src: string): boolean {
  if (!src.includes('{{')) return false;
  const parsed = parseTemplate(src);
  return parsed.nodes.some((n) => n.kind !== 'text');
}
