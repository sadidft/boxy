/**
 * Boxy Markdown Parser
 * Converts Markdown to HTML
 */

import { escapeHtml } from './helpers';

/**
 * Parse markdown string to HTML
 */
export function parseMarkdown(markdown: string): string {
  if (!markdown) return '';

  let html = markdown;

  // Normalize line endings
  html = html.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Preserve template variables before processing
  const variablePlaceholders: Map<string, string> = new Map();
  let varIndex = 0;
  html = html.replace(/\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g, (_, varName) => {
    const placeholder = `___BOXYVAR_${varIndex++}___`;
    variablePlaceholders.set(placeholder, varName);
    return placeholder;
  });

  // Process code blocks first (preserve content)
  const codeBlocks: Map<string, string> = new Map();
  let codeIndex = 0;
  
  // Fenced code blocks
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const placeholder = `___CODEBLOCK_${codeIndex++}___`;
    const langClass = lang ? ` class="language-${escapeHtml(lang)}"` : '';
    codeBlocks.set(placeholder, `<pre><code${langClass}>${escapeHtml(code.trim())}</code></pre>`);
    return placeholder;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, (_, code) => {
    return `<code>${escapeHtml(code)}</code>`;
  });

  // Escape remaining HTML (but not our placeholders)
  html = html.replace(/&(?!amp;|lt;|gt;|quot;|#x27;)/g, '&amp;');
  html = html.replace(/<(?!___)/g, '&lt;');
  html = html.replace(/(?<!___)>/g, '&gt;');

  // Links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => {
    const safeUrl = url.startsWith('javascript:') ? '#' : url;
    return `<a href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer">${text}</a>`;
  });

  // Images ![alt](url)
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, url) => {
    return `<img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}" loading="lazy" class="max-w-full rounded" />`;
  });

  // Bold **text** or __text__
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');

  // Italic *text* or _text_
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/(?<![a-zA-Z0-9])_([^_]+)_(?![a-zA-Z0-9])/g, '<em>$1</em>');

  // Strikethrough ~~text~~
  html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>');

  // Headings
  html = html.replace(/^###### (.+)$/gm, '<h6>$1</h6>');
  html = html.replace(/^##### (.+)$/gm, '<h5>$1</h5>');
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Blockquotes
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');
  // Merge consecutive blockquotes
  html = html.replace(/<\/blockquote>\n<blockquote>/g, '\n');

  // Horizontal rules
  html = html.replace(/^(-{3,}|\*{3,}|_{3,})$/gm, '<hr />');

  // Task lists
  html = html.replace(/^- \[x\] (.+)$/gm, '<li class="task-item"><input type="checkbox" checked disabled /> $1</li>');
  html = html.replace(/^- \[ \] (.+)$/gm, '<li class="task-item"><input type="checkbox" disabled /> $1</li>');

  // Unordered lists
  html = html.replace(/^[-*+] (.+)$/gm, '<li>$1</li>');

  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

  // Wrap consecutive list items
  html = html.replace(/(<li class="task-item">[\s\S]*?<\/li>)(\n<li class="task-item">[\s\S]*?<\/li>)*/g, (match) => {
    return `<ul class="task-list">${match}</ul>`;
  });
  html = html.replace(/(<li>[\s\S]*?<\/li>)(\n<li>[\s\S]*?<\/li>)*/g, (match) => {
    if (match.includes('task-item')) return match;
    return `<ul>${match}</ul>`;
  });

  // Tables
  html = processTable(html);

  // Paragraphs - wrap remaining text blocks
  const lines = html.split('\n');
  const processedLines: string[] = [];
  let inParagraph = false;
  let paragraphContent: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Check if line is a block element
    const isBlock = /^(<h[1-6]|<ul|<ol|<li|<blockquote|<pre|<hr|<table|___CODEBLOCK_)/.test(trimmed) ||
                   /(<\/h[1-6]>|<\/ul>|<\/ol>|<\/blockquote>|<\/pre>|<\/table>)$/.test(trimmed);
    
    if (trimmed === '' || isBlock) {
      if (inParagraph && paragraphContent.length > 0) {
        processedLines.push(`<p>${paragraphContent.join(' ')}</p>`);
        paragraphContent = [];
        inParagraph = false;
      }
      if (trimmed !== '') {
        processedLines.push(line);
      }
    } else {
      inParagraph = true;
      paragraphContent.push(trimmed);
    }
  }
  
  // Close any remaining paragraph
  if (paragraphContent.length > 0) {
    processedLines.push(`<p>${paragraphContent.join(' ')}</p>`);
  }

  html = processedLines.join('\n');

  // Line breaks (two spaces at end of line)
  html = html.replace(/  \n/g, '<br />\n');

  // Restore code blocks
  codeBlocks.forEach((code, placeholder) => {
    html = html.replace(placeholder, code);
  });

  // Restore and style template variables
  variablePlaceholders.forEach((varName, placeholder) => {
    html = html.replace(
      placeholder,
      `<span class="variable">{{${varName}}}</span>`
    );
  });

  return html;
}

/**
 * Process markdown tables
 */
function processTable(html: string): string {
  const tableRegex = /\|(.+)\|\n\|[-:\s|]+\|\n((?:\|.+\|\n?)+)/g;

  return html.replace(tableRegex, (_, headerRow, bodyRows) => {
    // Parse header
    const headers = headerRow
      .split('|')
      .map((h: string) => h.trim())
      .filter((h: string) => h);

    // Parse body
    const rows = bodyRows
      .trim()
      .split('\n')
      .map((row: string) =>
        row
          .split('|')
          .map((cell: string) => cell.trim())
          .filter((cell: string) => cell !== '')
      );

    // Build table HTML
    let table = '<table class="markdown-table">';
    table += '<thead><tr>';
    headers.forEach((h: string) => {
      table += `<th>${h}</th>`;
    });
    table += '</tr></thead>';
    table += '<tbody>';
    rows.forEach((row: string[]) => {
      table += '<tr>';
      row.forEach((cell: string) => {
        table += `<td>${cell}</td>`;
      });
      table += '</tr>';
    });
    table += '</tbody></table>';

    return table;
  });
}

/**
 * Strip markdown to plain text (for search)
 */
export function stripMarkdown(markdown: string): string {
  if (!markdown) return '';
  
  let text = markdown;
  
  // Remove code blocks
  text = text.replace(/```[\s\S]*?```/g, '');
  text = text.replace(/`[^`]+`/g, '');
  
  // Remove links but keep text
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  
  // Remove images
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1');
  
  // Remove formatting
  text = text.replace(/[*_~]+/g, '');
  text = text.replace(/^#+\s*/gm, '');
  text = text.replace(/^>\s*/gm, '');
  text = text.replace(/^[-*+]\s*/gm, '');
  text = text.replace(/^\d+\.\s*/gm, '');
  
  return text.trim();
}
