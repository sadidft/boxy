// Local ESLint plugin enforcing the Boxy content and design guardrails (G1, G2, G7, G8) in source code.
const DASH = /[\u2013\u2014]/u;
const EMOJI = /\p{Extended_Pictographic}|[\u2600-\u27BF]/u;
const RAW_COLOR = /(^|[^\w-])#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})\b|\b(?:rgba?|hsla?|oklch)\(/i;
const VERSION = /\b(v\s?\d+(\.\d+)+|Boxy\s?\d|Reborn|BoxyVerde)\b/i;

const stringValue = (node) => {
  if (node.type === 'Literal' && typeof node.value === 'string') return node.value;
  if (node.type === 'TemplateElement') return node.value.cooked ?? node.value.raw;
  if (node.type === 'JSXText') return node.value;
  return null;
};

const makeRule = (name, regex, message, { skipTests = false, allowFiles = [] } = {}) => ({
  meta: { type: 'problem', docs: { description: message }, schema: [] },
  create(context) {
    const filename = context.filename || context.getFilename();
    if (allowFiles.some((f) => filename.replace(/\\/g, '/').endsWith(f))) return {};
    if (skipTests && /\.(test|spec)\.[tj]sx?$/.test(filename)) return {};
    const check = (node) => {
      const v = stringValue(node);
      if (v != null && regex.test(v)) {
        const sc = context.sourceCode || context.getSourceCode();
        // A `guardrail-exception:` comment on the node or on any of its enclosing statements (up to 4 levels) documents the exception.
        let cursor = node;
        for (let i = 0; i < 5 && cursor; i += 1) {
          if (sc.getCommentsBefore(cursor).some((c) => /guardrail-exception:/.test(c.value))) return;
          cursor = cursor.parent;
        }
        context.report({ node, message: `${name}: ${message}` });
      }
    };
    return { Literal: check, TemplateElement: check, JSXText: check };
  },
});

module.exports = {
  rules: {
    'no-dash': makeRule('G1', DASH, 'em/en dash in UI text; use a comma, colon or new sentence'),
    'no-emoji-in-jsx': makeRule('G2', EMOJI, 'emoji in source; use a Lucide icon', { skipTests: true }),
    'no-raw-color': makeRule('G7', RAW_COLOR, 'raw colour literal; use a token from src/styles/tokens.css', {
      allowFiles: ['src/styles/tokens.ts', 'src/styles/tokens.css'],
    }),
    'no-version-label': makeRule('G8', VERSION, 'product version label; Boxy has no version'),
  },
};
