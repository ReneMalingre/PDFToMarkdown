# Node.js TypeScript Application Setup

---

## 1. Objective

Create a blank Node.js + TypeScript application stub in the current directory, ready for feature development.

**Stack:**

- ESM (`"type": "module"`)
- TypeScript with `module: NodeNext`
- ESLint (flat config) + Prettier
- `tsx` + `nodemon` for development
- Vitest for testing
- `dotenv` for environment variables
- `tsc-alias` for path alias resolution in compiled output

**Constraints:**

- Create every file listed in Section 2 exactly as shown — do not omit any
- All relative TypeScript imports must use `.js` extensions (NodeNext requirement):
  ```typescript
  import { foo } from './utils/foo.js'; // correct
  import { foo } from './utils/foo'; // incorrect — tsc will reject this
  ```
- `dotenv/config` must be the first import in `src/index.ts`
- After completing Section 3, all verification commands must pass before the setup is considered done

---

## 2. Files to create

Run this first to generate the base `package.json`:

```bash
npm init -y
```

> Output varies depending on git config — it may include `repository`, `bugs`, `homepage`, and `"type": "commonjs"` fields. Discard all of that; the `package.json` content below is the source of truth.

---

### `package.json`

Replace the entire file generated above. Use the directory name as the `"name"` value.

```json
{
  "name": "<project-name>",
  "version": "1.0.0",
  "description": "",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "clean": "rimraf dist",
    "build": "npm run clean && tsc && tsc-alias",
    "start": "node dist/index.js",
    "dev": "nodemon",
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test": "vitest",
    "test:run": "vitest run"
  },
  "keywords": [],
  "author": "",
  "license": "ISC"
}
```

> `dependencies` and `devDependencies` are populated by the install commands in Section 3 — do not add them manually.

---

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "sourceMap": true,
    "declaration": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

### `eslint.config.js`

```javascript
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    // Browser globals for any plain JS served to the browser (e.g. public/**/*.js).
    // Without this, ESLint reports `document`, `fetch`, `navigator` etc. as undefined.
    files: ['public/**/*.js'],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**'],
  }
);
```

---

### `.prettierrc`

```json
{
  "semi": true,
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

---

### `.prettierignore`

```
dist/
node_modules/
```

---

### `nodemon.json`

```json
{
  "watch": ["src"],
  "ext": "ts",
  "exec": "tsx src/index.ts"
}
```

---

### `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    globals: true,
    exclude: ['**/vitest.config.*', '**/node_modules/**', '**/dist/**'],
  },
});
```

---

### `src/index.ts`

```typescript
import 'dotenv/config';

function main(): void {
  console.log('Hello, world!');
}

main();
```

---

### `src/index.test.ts`

```typescript
import { describe, expect, it } from 'vitest';

describe('sanity', () => {
  it('works', () => {
    expect(1 + 1).toBe(2);
  });
});
```

---

### `.env`

```
ANTHROPIC_API_KEY=your_key_here
```

> Never commit this file. It is listed in `.gitignore`.

---

### `.env.example`

```
ANTHROPIC_API_KEY=
```

> Commit this file. It documents required environment variables without exposing values.

---

### `.gitignore`

If a `.gitignore` already exists, ensure these entries are present. If it does not exist, create it with:

```
node_modules/
dist/
.env
```

---

### `CLAUDE.md`

````markdown
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

[Describe the purpose of each directory in src/ as the project grows]

## Conventions

[Note any project-specific patterns to follow — naming, error handling, logging, etc.]
````

---

### `.vscode/settings.json` (optional)

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}
```

---

### Expected file tree

After Section 3 is complete, the project root must contain:

```
.
├── docs/
│   └── design.md
├── src/
│   ├── index.ts
│   └── index.test.ts
├── .env                    # gitignored — never committed
├── .env.example
├── .gitignore
├── .prettierignore
├── .prettierrc
├── CLAUDE.md
├── eslint.config.js
├── nodemon.json
├── package-lock.json       # generated by npm install
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

`node_modules/` and `dist/` will be present on disk but are gitignored.

---

## 3. Commands to run and success criteria

### Install dependencies

Run these commands in order:

```bash
npm install --save-dev typescript@^5 @types/node
npm install --save-dev eslint @eslint/js typescript-eslint eslint-config-prettier prettier globals
npm install --save-dev tsx nodemon rimraf tsc-alias
npm install --save-dev vitest
npm install dotenv
```

> `typescript` is pinned to `^5` because `typescript-eslint` does not yet support TypeScript 6. Remove the pin once `typescript-eslint` publishes TypeScript 6 support.

---

### Verify the setup

Run each command in order. Every command must succeed.

| Command                | Expected result                         |
| ---------------------- | --------------------------------------- |
| `npm run typecheck`    | Exits with no errors                    |
| `npm run lint`         | Exits with no errors                    |
| `npm run format:check` | Exits with no errors                    |
| `npm run build`        | Produces `dist/index.js` with no errors |
| `npm run test:run`     | All tests pass                          |
| `node dist/index.js`   | Prints `Hello, world!`                  |

---

### If any command fails

1. Read the error output carefully to identify the cause
2. Fix the relevant file — do not skip or work around the error
3. Re-run the failing command to confirm it passes
4. Continue with the remaining commands
5. Do not consider setup complete until all six commands succeed without errors
