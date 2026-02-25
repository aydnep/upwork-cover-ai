# CLAUDE.md

## Project

TypeScript Cloudflare Worker using OpenAI SDK.

- Runtime: Cloudflare Workers (V8 isolate, no Node.js APIs unless polyfilled)
- Entry point: `src/index.ts`
- Deploy: `npm run deploy`
- Dev: `npm run dev`
- Typecheck: `npm run typecheck`

## TypeScript Rules

### General

- Use `strict: true` — never disable it.
- Prefer `const` over `let`. Never use `var`.
- Use `unknown` over `any`. If `any` is unavoidable, add a comment explaining why.
- No `@ts-ignore` — use `@ts-expect-error` with a description if suppression is truly needed.
- Enable `noUncheckedIndexedAccess` — always handle `undefined` when accessing arrays/records by index.

### Types

- Prefer `interface` for object shapes, `type` for unions/intersections/mapped types.
- Export types explicitly: `export type { Foo }` or `export interface Foo {}`.
- Don't use `enum` — use `as const` objects or union literal types instead.
- Avoid type assertions (`as`) — prefer type guards or narrowing.
- Use `satisfies` to validate values against types without widening.
- Prefer discriminated unions over optional fields for state modeling.

### Functions

- Use explicit return types on exported functions.
- Prefer arrow functions for callbacks, `function` declarations for top-level.
- Use `readonly` parameters and properties where mutation isn't needed.

### Error Handling

- Don't throw raw strings — always use `Error` objects.
- Prefer returning errors as values (`Result` pattern) over try/catch where practical.
- Catch errors at boundaries (request handler), not everywhere.

### Imports / Modules

- Use ESM (`import`/`export`) only — no `require`.
- Avoid barrel files (`index.ts` re-exports) unless the project is large enough to warrant them.

### Naming

- `camelCase` for variables, functions, methods.
- `PascalCase` for types, interfaces, classes.
- `UPPER_SNAKE_CASE` for true constants (env keys, config).
- Prefix booleans with `is`, `has`, `should`, `can`.
- No Hungarian notation, no `I` prefix for interfaces.

### Cloudflare Workers Specifics

- Secrets go via `wrangler secret put`, not env files in production.
- Local secrets go in `.dev.vars` (gitignored).
- Bindings (KV, D1, R2, etc.) are typed in the `Env` interface.
- No Node.js globals (`process`, `Buffer`, `__dirname`) — use Web APIs.
