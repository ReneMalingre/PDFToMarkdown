import express from 'express';
import multer from 'multer';
import { unlink } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { convertPdfToMarkdown } from './services/converter.js';
import { DOCX_MIME_TYPE, markdownToDocx, sanitiseDocxFilename } from './services/markdownDocx.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const storage = multer.diskStorage({
  destination: tmpdir(),
  filename: (_req, _file, cb) => {
    cb(null, `upload-${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`);
  },
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are accepted'));
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

export function createApp(): express.Application {
  const app = express();

  app.use(express.static(path.join(__dirname, '..', 'public')));
  app.use(express.json({ limit: '2mb' }));

  app.post('/api/convert', upload.single('pdf'), async (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: 'No PDF file provided' });
      return;
    }

    const filePath = req.file.path;
    try {
      const markdown = await convertPdfToMarkdown(filePath);
      res.json({ markdown });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Conversion failed';
      res.status(500).json({ error: message });
    } finally {
      await unlink(filePath).catch(() => {});
    }
  });

  app.post('/api/export-docx', async (req, res) => {
    const { markdown, filename, title, subject, creator } = req.body as {
      markdown?: unknown;
      filename?: unknown;
      title?: unknown;
      subject?: unknown;
      creator?: unknown;
    };

    if (typeof markdown !== 'string') {
      res.status(400).json({ error: 'markdown must be provided as a string' });
      return;
    }

    try {
      const docx = await markdownToDocx(markdown, {
        filename: typeof filename === 'string' ? filename : undefined,
        title: typeof title === 'string' ? title : undefined,
        subject: typeof subject === 'string' ? subject : undefined,
        creator: typeof creator === 'string' ? creator : undefined,
      });

      const safeFilename = sanitiseDocxFilename(
        typeof filename === 'string' ? filename : 'document.docx'
      );

      res.setHeader('Content-Type', DOCX_MIME_TYPE);
      res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
      res.status(200).send(docx);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'DOCX export failed';
      res.status(500).json({ error: message });
    }
  });

  // Error handler — catches multer errors (wrong file type, size exceeded)
  app.use(
    (
      err: Error,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ): void => {
      const status =
        err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      res.status(status).json({ error: err.message });
    }
  );

  return app;
}
