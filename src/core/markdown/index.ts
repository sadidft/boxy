import MarkdownIt from 'markdown-it';
import taskLists from 'markdown-it-task-lists';
import DOMPurify, { type Config } from 'dompurify';

const md = new MarkdownIt({ html: false, linkify: true, breaks: true, typographer: false });
md.use(taskLists, { enabled: false, label: true });

// Links open in a new tab without giving the target a window reference.
const defaultLinkOpen = md.renderer.rules.link_open ?? ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options));
md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const token = tokens[idx]!;
  token.attrSet('target', '_blank');
  token.attrSet('rel', 'noopener noreferrer nofollow');
  return defaultLinkOpen(tokens, idx, options, env, self);
};

md.validateLink = (url: string) => {
  const u = url.trim().toLowerCase();
  return !(u.startsWith('javascript:') || u.startsWith('vbscript:') || u.startsWith('data:') || u.startsWith('file:'));
};

const purifyConfig: Config = {
  ALLOWED_TAGS: ['a', 'p', 'br', 'strong', 'em', 'b', 'i', 'u', 's', 'del', 'code', 'pre', 'blockquote', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'img', 'input', 'label', 'span', 'sup', 'sub', 'kbd'],
  ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'src', 'alt', 'class', 'type', 'checked', 'disabled', 'start', 'align'],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel|sms):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  FORBID_TAGS: ['style', 'script', 'iframe', 'object', 'embed', 'form', 'svg', 'math'],
  FORBID_ATTR: ['style', 'onerror', 'onload'],
};

DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer nofollow');
  }
  if (node.tagName === 'INPUT') {
    node.setAttribute('disabled', '');
    node.setAttribute('tabindex', '-1');
  }
});

const cache = new Map<string, string>();

/** Renders markdown to sanitised HTML. Variables like {{name}} are highlighted. */
export function renderMarkdown(source: string, opts: { highlightVars?: boolean } = {}): string {
  const key = `${opts.highlightVars ? 1 : 0}:${source}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  let html = md.render(source);
  if (opts.highlightVars !== false) {
    html = html.replace(/\{\{\s*[a-zA-Z_][\w:+-]*(?:\s*\|[^}]*)?\s*\}\}/g, (m) => `<span class="var">${m}</span>`);
  }
  const clean = DOMPurify.sanitize(html, purifyConfig);
  if (cache.size > 500) cache.delete(cache.keys().next().value!);
  cache.set(key, clean);
  return clean;
}

/** Plain text version of markdown for clipboard "plain" and previews. */
export function markdownToPlain(source: string): string {
  return source
    .replace(/```[a-z]*\n?([\s\S]*?)```/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[ \t]*[-*+][ \t]+\[( |x|X)\][ \t]+/gm, (_m, c: string) => (c.trim() ? '[x] ' : '[ ] '))
    .replace(/^[ \t]*[-*+][ \t]+/gm, '- ')
    .replace(/^>\s?/gm, '')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/^[ \t]*[-*_]{3,}[ \t]*$/gm, '')
    .trim();
}

export function markdownToHtmlForClipboard(source: string): string {
  return DOMPurify.sanitize(md.render(source), purifyConfig);
}
