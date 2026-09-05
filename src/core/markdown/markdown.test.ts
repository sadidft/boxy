import { describe, expect, it } from 'vitest';
import { markdownToPlain, renderMarkdown } from './index';

describe('markdown pipeline', () => {
  it('renders common markdown', () => {
    const html = renderMarkdown('# Title\n\n- a\n- b\n\n**bold** and `code`');
    expect(html).toContain('<h1>Title</h1>');
    expect(html).toContain('<li>a</li>');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<code>code</code>');
  });

  it('handles the regressions of the previous renderer', () => {
    expect(renderMarkdown('- a\n  - nested')).toMatch(/<ul>[\s\S]*<ul>[\s\S]*nested/);
    expect(renderMarkdown('[link](https://example.com/a_(b))')).toContain('href="https://example.com/a_(b)"');
    expect(renderMarkdown('`a * b * c`')).toContain('<code>a * b * c</code>');
    expect(renderMarkdown('#notaheading')).not.toContain('<h1>');
    expect(renderMarkdown('- [x] done\n- [ ] open')).toContain('type="checkbox"');
  });

  it('neutralises XSS', () => {
    const corpus = [
      '<img src=x onerror=alert(1)>',
      '[x](javascript:alert(1))',
      '<svg onload=alert(1)></svg>',
      '<script>alert(1)</script>',
      '<a href="https://x.y" onclick="alert(1)">x</a>',
      '![x](data:text/html;base64,AAAA)',
      '[x](vbscript:msgbox)',
      '<iframe src="https://x.y"></iframe>',
    ];
    for (const src of corpus) {
      const doc = new DOMParser().parseFromString(`<body>${renderMarkdown(src)}</body>`, 'text/html');
      expect(doc.querySelectorAll('script, iframe, svg, object, embed, style'), src).toHaveLength(0);
      for (const el of doc.body.querySelectorAll('*')) {
        for (const attr of el.getAttributeNames()) {
          expect(attr.startsWith('on'), `${src}: ${attr}`).toBe(false);
          const value = el.getAttribute(attr) ?? '';
          if (attr === 'href' || attr === 'src') expect(/^(javascript|vbscript|data):/i.test(value.trim()), `${src}: ${value}`).toBe(false);
        }
      }
    }
  });

  it('opens links safely and highlights variables', () => {
    const html = renderMarkdown('[x](https://example.com) {{name|default:you}}');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer nofollow"');
    expect(html).toContain('<span class="var">{{name|default:you}}</span>');
  });

  it('converts to plain text', () => {
    expect(markdownToPlain('# Hi\n\n**bold** [link](https://a.b)\n\n- [x] done\n- item')).toBe('Hi\n\nbold link (https://a.b)\n\n[x] done\n- item');
  });
});
