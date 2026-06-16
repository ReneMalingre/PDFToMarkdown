import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from './server.js';

function binaryParser(
  res: request.Response,
  callback: (err: Error | null, body: Buffer) => void
): void {
  const chunks: Uint8Array[] = [];

  res.on('data', (chunk: Uint8Array) => {
    chunks.push(chunk);
  });

  res.on('end', () => {
    callback(null, Buffer.concat(chunks));
  });
}

describe('POST /api/convert', () => {
  const app = createApp();

  it('returns 400 when no file is provided', async () => {
    const res = await request(app).post('/api/convert');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 400 when a non-PDF file is uploaded', async () => {
    const res = await request(app)
      .post('/api/convert')
      .attach('pdf', Buffer.from('not a pdf'), { filename: 'test.txt', contentType: 'text/plain' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

describe('POST /api/export-docx', () => {
  const app = createApp();

  it('returns 400 when markdown is missing', async () => {
    const res = await request(app).post('/api/export-docx').send({ title: 'Missing markdown' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns docx payload for valid markdown', async () => {
    const res = await request(app)
      .post('/api/export-docx')
      .buffer(true)
      .parse(binaryParser)
      .send({ markdown: '# Heading\n\nParagraph text.', filename: 'export.docx' });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    expect(res.headers['content-disposition']).toContain('attachment; filename="export.docx"');
    expect(Buffer.isBuffer(res.body)).toBe(true);
    expect(res.body.subarray(0, 4)).toEqual(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
  });
});
