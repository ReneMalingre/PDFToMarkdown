import HtmlToDocx from '@turbodocx/html-to-docx';
import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { Marked } from 'marked';

export type MarkdownToDocxOptions = {
  filename?: string;
  title?: string;
  subject?: string;
  creator?: string;
};

const markdownParser = new Marked({
  gfm: true,
  breaks: true,
});

markdownParser.use({
  renderer: {
    // Treat raw HTML as untrusted by escaping it during markdown parsing.
    html({ text }) {
      return escapeHtml(text);
    },
  },
});

const domPurify = createDOMPurify(
  new JSDOM('').window as unknown as Parameters<typeof createDOMPurify>[0]
);

const ALLOWED_TAGS = [
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'p',
  'strong',
  'em',
  'ul',
  'ol',
  'li',
  'blockquote',
  'a',
  'code',
  'pre',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  'hr',
  'br',
  'img',
  'del',
] as const;

const ALLOWED_ATTR = [
  'href',
  'title',
  'target',
  'rel',
  'colspan',
  'rowspan',
  'align',
  'src',
  'alt',
] as const;

const DOCX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

type HtmlToDocxOptions = NonNullable<Parameters<typeof HtmlToDocx>[2]>;

export async function markdownToHtml(markdown: string): Promise<string> {
  if (typeof markdown !== 'string') {
    throw new TypeError('Markdown input must be a string');
  }

  if (markdown.trim() === '') {
    return '<p></p>';
  }

  try {
    return await markdownParser.parse(markdown, { async: true });
  } catch (error) {
    throw new Error(
      `Failed to parse markdown: ${error instanceof Error ? error.message : 'Unknown parse error'}`,
      { cause: error }
    );
  }
}

export function sanitiseMarkdownHtml(htmlFragment: string): string {
  if (typeof htmlFragment !== 'string') {
    throw new TypeError('HTML fragment must be a string');
  }

  try {
    const sanitised = domPurify.sanitize(htmlFragment, {
      ALLOWED_TAGS: [...ALLOWED_TAGS],
      ALLOWED_ATTR: [...ALLOWED_ATTR],
      ADD_ATTR: ['target'],
      FORBID_TAGS: [
        'script',
        'iframe',
        'object',
        'embed',
        'form',
        'input',
        'button',
        'textarea',
        'select',
      ],
      ALLOW_DATA_ATTR: false,
      ALLOW_UNKNOWN_PROTOCOLS: false,
      ALLOWED_URI_REGEXP:
        /^(?:(?:https?|mailto|tel):|(?:data:image\/(?:png|jpe?g|gif|webp);base64,)|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
      USE_PROFILES: { html: true },
      RETURN_TRUSTED_TYPE: false,
    });

    return normaliseSanitisedLinks(sanitised);
  } catch (error) {
    throw new Error(
      `Failed to sanitise generated HTML: ${error instanceof Error ? error.message : 'Unknown sanitisation error'}`,
      { cause: error }
    );
  }
}

export function buildWordHtmlDocument(
  htmlBodyFragment: string,
  options: MarkdownToDocxOptions = {}
): string {
  const title = escapeHtml(options.title?.trim() || 'Markdown Export');

  return `<!DOCTYPE html>
<html lang="en-AU">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <style>
    body {
      font-family: Aptos, Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.2;
      color: #1f2933;
    }

    p {
      margin: 0 0 8pt;
    }

    h1, h2, h3, h4, h5, h6 {
      margin: 14pt 0 6pt;
      line-height: 1.15;
      color: #0f172a;
    }

    h1 { font-size: 21pt; }
    h2 { font-size: 18pt; }
    h3 { font-size: 15pt; }
    h4 { font-size: 13pt; }
    h5 { font-size: 12pt; }
    h6 { font-size: 11pt; }

    ul, ol {
      margin: 0 0 8pt 22pt;
      padding: 0;
    }

    li {
      margin: 2pt 0;
    }

    blockquote {
      margin: 10pt 0;
      padding: 8pt 10pt;
      border-left: 3pt solid #cbd5e1;
      background: #f8fafc;
      color: #334155;
    }

    code {
      font-family: "Consolas", "Courier New", monospace;
      font-size: 10pt;
      background: #f1f5f9;
      padding: 1pt 3pt;
    }

    pre {
      margin: 10pt 0;
      padding: 8pt;
      background: #f1f5f9;
      border: 1pt solid #d7dee8;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }

    pre code {
      background: transparent;
      padding: 0;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10pt 0;
      table-layout: auto;
    }

    th, td {
      border: 1pt solid #d5d9df;
      padding: 5pt 6pt;
      vertical-align: top;
      text-align: left;
    }

    th {
      background: #eef2f7;
      font-weight: 600;
    }

    a {
      color: #0b57d0;
      text-decoration: underline;
    }

    img {
      max-width: 100%;
      height: auto;
    }

    hr {
      border: 0;
      border-top: 1pt solid #d5d9df;
      margin: 12pt 0;
    }
  </style>
</head>
<body>
${htmlBodyFragment}
</body>
</html>`;
}

export async function markdownToDocx(
  markdown: string,
  options: MarkdownToDocxOptions = {}
): Promise<Buffer> {
  const markdownHtml = await markdownToHtml(markdown);
  const sanitisedHtml = sanitiseMarkdownHtml(markdownHtml);
  const completeHtml = buildWordHtmlDocument(sanitisedHtml || '<p></p>', options);

  const documentOptions: HtmlToDocxOptions = {
    orientation: 'portrait',
    pageSize: {
      width: 11906,
      height: 16838,
    },
    margins: {
      top: 1134,
      right: 1134,
      bottom: 1134,
      left: 1134,
      header: 720,
      footer: 720,
      gutter: 0,
    },
    font: 'Aptos',
    fontSize: 22,
    title: sanitiseMetadata(options.title, 'Markdown Export'),
    subject: sanitiseMetadata(options.subject),
    creator: sanitiseMetadata(options.creator, 'PDFToMarkdown'),
    keywords: ['markdown', 'docx', 'export'],
    description: 'Markdown to DOCX export generated by PDFToMarkdown',
    table: {
      row: {
        cantSplit: true,
      },
      borderOptions: {
        size: 1,
        stroke: 'single',
        color: 'D5D9DF',
      },
      addSpacingAfter: true,
    },
    decodeUnicode: true,
    lang: 'en-AU',
  };

  try {
    const docx = await HtmlToDocx(completeHtml, null, documentOptions, null);
    return normaliseDocxOutput(docx);
  } catch (error) {
    throw new Error(
      `Failed to generate DOCX file: ${error instanceof Error ? error.message : 'Unknown DOCX conversion error'}`,
      { cause: error }
    );
  }
}

export function sanitiseDocxFilename(filename?: string): string {
  const withoutControls = Array.from(filename ?? 'document.docx')
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code >= 32 && code !== 127;
    })
    .join('');

  const cleaned = withoutControls
    .replace(/[<>:"/\\|?*]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim();

  const base = cleaned === '' ? 'document.docx' : cleaned;
  return base.toLowerCase().endsWith('.docx') ? base : `${base}.docx`;
}

export { DOCX_MIME_TYPE };

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function sanitiseMetadata(value: string | undefined, fallback?: string): string | undefined {
  if (!value) {
    return fallback;
  }

  const cleaned = value.replace(/[\r\n\t]+/g, ' ').trim();
  return cleaned === '' ? fallback : cleaned;
}

function normaliseSanitisedLinks(sanitised: string): string {
  const dom = new JSDOM(`<body>${sanitised}</body>`);
  const links = dom.window.document.querySelectorAll('a');

  for (const link of links) {
    const href = link.getAttribute('href')?.trim() ?? '';
    if (href.toLowerCase().startsWith('javascript:')) {
      link.removeAttribute('href');
    }

    if (link.getAttribute('target') === '_blank') {
      const relParts = new Set((link.getAttribute('rel') ?? '').split(/\s+/).filter(Boolean));
      relParts.add('noopener');
      relParts.add('noreferrer');
      link.setAttribute('rel', Array.from(relParts).join(' '));
    }
  }

  return dom.window.document.body.innerHTML;
}

async function normaliseDocxOutput(docx: ArrayBuffer | Blob | Buffer): Promise<Buffer> {
  if (Buffer.isBuffer(docx)) {
    return docx;
  }

  if (docx instanceof ArrayBuffer) {
    return Buffer.from(docx);
  }

  if (docx instanceof Blob) {
    return Buffer.from(await docx.arrayBuffer());
  }

  throw new Error('Unsupported DOCX output type from converter');
}
