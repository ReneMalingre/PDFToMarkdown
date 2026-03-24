# Design Document

Read this document before generating or modifying any code.

---

## Purpose

A local web application that converts PDF files to Markdown using the [`@opendataloader/pdf`](https://www.npmjs.com/package/@opendataloader/pdf) library. The user selects or drags a PDF into a browser interface, the server converts it, and the result is displayed for copying or downloading as a `.md` file.

---

## Architecture

```
Browser (public/)
  └── POST /api/convert (multipart, field: pdf)
        │
Express server (src/server.ts)
  └── multer: saves upload to OS temp dir as .pdf
        │
Converter service (src/services/converter.ts)
  └── @opendataloader/pdf: writes .md to a unique temp dir
        │
        └── reads .md file → returns string → cleans up temp dir
```

**Key files:**

| File                        | Responsibility                                         |
| --------------------------- | ------------------------------------------------------ |
| `src/index.ts`              | Entry point — starts the Express server                |
| `src/server.ts`             | Routes, multer upload config, error handler middleware |
| `src/services/converter.ts` | Wraps `@opendataloader/pdf`, manages temp dirs         |
| `public/index.html`         | Single-page UI                                         |
| `public/style.css`          | Styles                                                 |
| `public/app.js`             | Fetch, drag-and-drop, copy, download                   |

---

## Configuration

| Variable | Required | Description                              |
| -------- | -------- | ---------------------------------------- |
| `PORT`   | No       | HTTP port to listen on (default: `3000`) |

---

## Open decisions

---

## Resolved decisions

- **No framework for the frontend** — plain HTML/CSS/JS is sufficient; avoids a build step for the static assets.
- **Images excluded from output** — `imageOutput: 'off'` keeps the markdown self-contained and avoids managing image files.
- **50 MB upload limit** — reasonable ceiling for typical PDFs; configurable via multer `limits`.
