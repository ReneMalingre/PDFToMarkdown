import { describe, expect, it } from 'vitest';
import {
  buildWordHtmlDocument,
  markdownToDocx,
  markdownToHtml,
  sanitiseDocxFilename,
  sanitiseMarkdownHtml,
} from './markdownDocx.js';

describe('markdownToDocx pipeline', () => {
  it('renders basic headings and paragraphs', async () => {
    const html = await markdownToHtml('# Heading\n\nParagraph text.');
    const sanitised = sanitiseMarkdownHtml(html);

    expect(sanitised).toContain('<h1>Heading</h1>');
    expect(sanitised).toContain('<p>Paragraph text.</p>');
  });

  it('renders bold, italics, and links', async () => {
    const html = await markdownToHtml(
      'This is **bold**, *italic*, and [a link](https://example.com).'
    );
    const sanitised = sanitiseMarkdownHtml(html);

    expect(sanitised).toContain('<strong>bold</strong>');
    expect(sanitised).toContain('<em>italic</em>');
    expect(sanitised).toContain('href="https://example.com"');
  });

  it('renders ordered, unordered, and nested lists', async () => {
    const markdown = [
      '1. One',
      '2. Two',
      '   - Child',
      '   - Child 2',
      '- Top level',
      '  1. Nested',
    ].join('\n');
    const html = await markdownToHtml(markdown);
    const sanitised = sanitiseMarkdownHtml(html);

    expect(sanitised).toContain('<ol>');
    expect(sanitised).toContain('<ul>');
    expect(sanitised).toMatch(/<li>Child<\/li>/);
  });

  it('renders tables', async () => {
    const markdown = ['| Name | Value |', '| --- | --- |', '| A | 1 |', '| B | 2 |'].join('\n');
    const html = await markdownToHtml(markdown);
    const sanitised = sanitiseMarkdownHtml(html);

    expect(sanitised).toContain('<table>');
    expect(sanitised).toContain('<thead>');
    expect(sanitised).toContain('<tbody>');
  });

  it('renders inline and fenced code', async () => {
    const markdown = ['Inline `code` sample.', '', '```ts', 'const answer = 42;', '```'].join('\n');
    const html = await markdownToHtml(markdown);
    const sanitised = sanitiseMarkdownHtml(html);

    expect(sanitised).toContain('<code>code</code>');
    expect(sanitised).toContain('<pre><code');
  });

  it('handles empty markdown predictably', async () => {
    const html = await markdownToHtml('   \n\n');
    expect(html).toBe('<p></p>');

    const docx = await markdownToDocx('');
    expect(docx.length).toBeGreaterThan(0);
  });

  it('preserves unicode characters', async () => {
    const markdown = 'Emoji: 😀\n\nMath: café naïve jalapeño';
    const html = await markdownToHtml(markdown);
    const sanitised = sanitiseMarkdownHtml(html);

    expect(sanitised).toContain('😀');
    expect(sanitised).toContain('café');
  });

  it('supports Australian spelling and punctuation', async () => {
    const markdown = 'The organisation prioritises colour, centre and behaviour.';
    const html = await markdownToHtml(markdown);
    const sanitised = sanitiseMarkdownHtml(html);

    expect(sanitised).toContain('organisation');
    expect(sanitised).toContain('colour');
    expect(sanitised).toContain('behaviour');
  });

  it('does not allow script tags from raw HTML markdown', async () => {
    const html = await markdownToHtml('<script>alert("x")</script>\n\nSafe text');
    const sanitised = sanitiseMarkdownHtml(html);

    expect(sanitised).not.toContain('<script>');
    expect(sanitised).toContain('Safe text');
  });

  it('removes event-handler attributes', () => {
    const sanitised = sanitiseMarkdownHtml(
      '<p><a href="https://example.com" onclick="alert(1)">Example</a></p>'
    );

    expect(sanitised).not.toContain('onclick=');
    expect(sanitised).toContain('href="https://example.com"');
  });

  it('removes javascript links', async () => {
    const html = await markdownToHtml('[bad](javascript:alert(1)) and [good](https://example.com)');
    const sanitised = sanitiseMarkdownHtml(html);

    expect(sanitised).not.toContain('javascript:');
    expect(sanitised).toContain('href="https://example.com"');
  });

  it('handles malformed HTML in markdown', async () => {
    const html = await markdownToHtml('<div><span>broken\n\n# Heading');
    const sanitised = sanitiseMarkdownHtml(html);

    expect(sanitised).toContain('broken');
    expect(sanitised).toContain('Heading');
  });

  it('generates output for long documents', async () => {
    const sections = Array.from({ length: 220 }, (_, index) => {
      const number = index + 1;
      return `## Section ${number}\n\nParagraph content ${number}.`;
    });
    const markdown = sections.join('\n\n');

    const docx = await markdownToDocx(markdown, { title: 'Long Document' });
    expect(docx.length).toBeGreaterThan(2000);
  });

  it('supports documents containing multiple tables', async () => {
    const markdown = [
      '| A | B |',
      '| --- | --- |',
      '| 1 | 2 |',
      '',
      '| C | D |',
      '| --- | --- |',
      '| 3 | 4 |',
    ].join('\n');

    const html = await markdownToHtml(markdown);
    const sanitised = sanitiseMarkdownHtml(html);
    const tableCount = (sanitised.match(/<table>/g) ?? []).length;

    expect(tableCount).toBe(2);
  });

  it('produces a valid DOCX zip signature and core xml entries', async () => {
    const docx = await markdownToDocx('# Document Title\n\nThis is a test.');

    expect(Array.from(docx.subarray(0, 4))).toEqual([0x50, 0x4b, 0x03, 0x04]);
    expect(docx.includes(Buffer.from('[Content_Types].xml'))).toBe(true);
    expect(docx.includes(Buffer.from('_rels/.rels'))).toBe(true);
    expect(docx.includes(Buffer.from('word/document.xml'))).toBe(true);
  });

  it('adds noopener and noreferrer for target blank links', () => {
    const sanitised = sanitiseMarkdownHtml(
      '<a href="https://example.com" target="_blank">Link</a>'
    );

    expect(sanitised).toContain('rel="noopener noreferrer"');
  });

  it('builds a complete trusted html document wrapper', () => {
    const html = buildWordHtmlDocument('<h1>Title</h1>', { title: 'My Export' });

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html lang="en-AU">');
    expect(html).toContain('<title>My Export</title>');
    expect(html).toContain('<h1>Title</h1>');
  });

  it('sanitises output filenames and enforces docx extension', () => {
    expect(sanitiseDocxFilename('report')).toBe('report.docx');
    expect(sanitiseDocxFilename(' bad<>name .docx ')).toBe('bad-name .docx');
    expect(sanitiseDocxFilename()).toBe('document.docx');
  });
});
