import 'dotenv/config';
import { createApp } from './server.js';

const PORT = Number(process.env.PORT ?? 3000);

const app = createApp();
app.listen(PORT, () => {
  console.log(`PDFToMarkdown running at http://localhost:${PORT}`);
});
