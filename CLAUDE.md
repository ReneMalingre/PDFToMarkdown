# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Commands

- `npm run typecheck` — verify types across the project (run after generating code)
- `npm run build` — compile TypeScript to dist/
- `npm run dev` — run with auto-reload via nodemon + tsx
- `npm run lint` — check for lint errors
- `npm run lint:fix` — auto-fix lint errors
- `npm run format` — auto-format all source files
- `npm run format:check` — check formatting without writing
- `npm run test:run` — run all tests once
- `npm test` — run tests in watch mode
- `npx vitest run src/path/to/file.test.ts` — run a single test file

## Code style

- All new files must be `.ts` — never `.js`
- ES modules only — use `import`/`export`, never `require()`
- Avoid `any` — use proper types; `no-explicit-any` is enforced by ESLint
- `prefer-const` is enforced — never use `let` when the value does not change
- Formatting is handled by Prettier — do not manually fix whitespace or indentation

## Import conventions

All relative imports must use `.js` extensions (NodeNext requirement):

```typescript
import { foo } from './foo.js';
import type { Bar } from '../types/index.js';
```

## Workflow

- After making changes, run `npm run typecheck`, `npm run lint`, and `npm run format:check` to verify
- **Never install packages without asking first**

## Testing

- Unit test files live alongside their source file: `src/foo.ts` → `src/foo.test.ts`
- Inject dependencies (e.g. HTTP clients, file system) as function parameters so tests can pass stubs without module mocking

## Git

- Write commit messages in imperative mood: "Add feature" not "Added feature"
- Keep commits focused — one logical change per commit

## Project documentation

- `docs/design.md` — read this before generating or modifying any code

**Keep `docs/design.md` current — update the relevant section(s) whenever the trigger applies:**

| Trigger                                                                      | Section(s) to update                |
| ---------------------------------------------------------------------------- | ----------------------------------- |
| New design decision made or question resolved                                | Open decisions / Resolved decisions |
| Architecture changes (new module, renamed directory, changed responsibility) | Architecture                        |
| New environment variable or configuration key added                          | Configuration                       |

## Architecture

- `src/index.ts` — entry point; starts the Express server
- `src/server.ts` — Express app, routes, multer file upload, error handler
- `src/services/converter.ts` — calls `@opendataloader/pdf`, manages temp dirs, returns markdown string
- `public/` — static frontend (HTML/CSS/JS); served by Express

## Conventions

- Conversion always uses a unique temp directory per request, cleaned up in a `finally` block
- Route handlers pass errors to the Express error middleware rather than handling them inline
- The `quiet: true` option is always passed to `convert()` to suppress library console output
