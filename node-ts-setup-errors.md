# node-ts-setup.md — Errors and Suggestions

Logged while following the instructions to set up a blank Node.js TypeScript application on 2026-03-24.

---

## Errors (blocking)

### 1. TypeScript 6 incompatible with `typescript-eslint`

**Step:** Install dependencies — `npm install --save-dev eslint @eslint/js typescript-eslint eslint-config-prettier prettier`

**What happened:** The install command failed with an `ERESOLVE` peer dependency conflict:

```
Found: typescript@6.0.2
Could not resolve dependency:
peer typescript@">=4.8.4 <6.0.0" from typescript-eslint@8.57.2
```

`npm install --save-dev typescript @types/node` installs TypeScript 6 (currently `latest`), but `typescript-eslint@8.57.2` only supports TypeScript up to 5.x.

**Fix applied:** Downgraded TypeScript before installing ESLint packages:

```bash
npm install --save-dev typescript@^5 @types/node
```

**Suggested fix for the instructions:** Pin the TypeScript install to `^5` until `typescript-eslint` publishes support for TypeScript 6:

```bash
npm install --save-dev typescript@^5 @types/node
```

---

### 2. File contents use double quotes; Prettier config requires single quotes

**Step:** `npm run format:check`

**What happened:** `format:check` exited with code 1, reporting 6 files with style issues:

```
CLAUDE.md
eslint.config.js
node-ts-setup.md
src/index.test.ts
src/index.ts
vitest.config.ts
```

**Root cause:** The file contents shown in the instructions use double-quoted strings (e.g., `"dotenv/config"`, `"vitest/config"`), but `.prettierrc` sets `"singleQuote": true`. Prettier rewrites them to single quotes, causing `format:check` to fail immediately after setup.

**Fix applied:** Ran `npm run format` to auto-correct all files.

**Suggested fix for the instructions:** Update all code blocks in Section 2 to use single-quoted strings, matching the Prettier config. Key files affected:

- `src/index.ts` — `import "dotenv/config"` → `import 'dotenv/config'`
- `src/index.test.ts` — all string literals
- `eslint.config.js` — all string literals
- `vitest.config.ts` — all string literals

Alternatively, add a note in the instructions: _"After creating all files, run `npm run format` before running `format:check`."_

---

## Observations (non-blocking)

### 3. `npm init -y` generates extra fields when a git remote exists

**Observation:** Running `npm init -y` inside an existing git repo with a remote URL also generates `repository`, `bugs`, and `homepage` fields, and sets `"type": "commonjs"` rather than omitting the field. The instructions show a minimal `package.json` template that doesn't include these.

**Impact:** None — the instructions say to replace the entire file. The replacement is clean.

**Suggestion:** Add a note that `npm init -y` output varies based on git config, and the `package.json` replacement in Section 2 is the source of truth regardless.

---

### 4. `npm init -y` appears in both Section 2 and Section 3

**Observation:** Section 2 opens with _"Run `npm init -y` before creating these files"_ and Section 3's install block also starts with `npm init -y`. Following the instructions in order means running `npm init -y` twice.

**Impact:** Harmless — a second `npm init -y` in the same directory just re-outputs the existing `package.json` without overwriting it.

**Suggestion:** Remove the `npm init -y` preamble from Section 2 (it is a command and belongs only in Section 3), or remove it from Section 3 and clarify it was already run.

---

### 5. Vitest reports 2 test files, not 1

**Observation:** Running `npm run test:run` reported `2 passed (2)` test files, but only `src/index.test.ts` was created. The source of the second file is unclear.

**Impact:** None — all tests passed.

**Suggestion:** Investigate whether `vitest.config.ts` is being picked up as a test file. If so, add an explicit `exclude` to `vitest.config.ts`:

```typescript
test: {
  globals: true,
  exclude: ['**/vitest.config.*', '**/node_modules/**'],
},
```

---

## Final verification results

| Command                | Result                                                     |
| ---------------------- | ---------------------------------------------------------- |
| `npm run typecheck`    | Passed                                                     |
| `npm run lint`         | Passed                                                     |
| `npm run format:check` | Passed (after running `npm run format` to fix quote style) |
| `npm run build`        | Passed — produced `dist/index.js`                          |
| `npm run test:run`     | Passed                                                     |
| `node dist/index.js`   | Passed — printed `Hello, world!`                           |
