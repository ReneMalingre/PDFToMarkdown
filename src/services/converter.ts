import { convert } from '@opendataloader/pdf';
import { mkdtemp, readdir, readFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';

export async function convertPdfToMarkdown(pdfPath: string): Promise<string> {
  const tempDir = await mkdtemp(path.join(tmpdir(), 'pdf-md-'));
  try {
    await convert(pdfPath, {
      outputDir: tempDir,
      format: 'markdown',
      imageOutput: 'off',
      quiet: true,
    });

    const files = await readdir(tempDir);
    const mdFile = files.find((f) => f.endsWith('.md'));
    if (!mdFile) {
      throw new Error('Conversion produced no markdown output');
    }

    return await readFile(path.join(tempDir, mdFile), 'utf-8');
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}
