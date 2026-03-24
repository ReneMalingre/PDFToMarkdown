import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from './server.js';

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
