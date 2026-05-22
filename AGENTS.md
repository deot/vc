# AGENTS.md

## Cursor Cloud specific instructions

This is a **Vue 3 component library** (`@deot/vc`) — a pure frontend monorepo with no backend services or databases.

### Services

| Service | Command | Notes |
|---------|---------|-------|
| Dev server | `npm run dev` | Vite-based, serves all component examples at `http://localhost:5173/` |

### Key Commands

All commands are defined in the root `package.json`. See `README.md` and `.cursor/rules/web-project-standards.mdc` for full details.

- **Lint:** `npm run lint` (ESLint + Stylelint); `npm run lint:fix` to auto-fix
- **Typecheck:** `npm run typecheck` (vue-tsc)
- **Test:** `npm run test` (Vitest, all packages); use `-- --package-name components --subpackage <name>` for a single component
- **Build:** `npm run build` (ES/CJS/UMD/IIFE outputs)
- **Dev:** `npm run dev` (Vite dev server with all component examples)

### Non-obvious caveats

- The `pnpm-workspace.yaml` includes an `allowBuilds` section so that native addons (`@swc/core`, `esbuild`, `puppeteer`, etc.) build automatically during `pnpm install` — no separate Puppeteer install step is needed.
- ESLint reports pre-existing warnings/errors in README.md files and some examples (mostly `no-console`). These are not blockers.
- The build produces TypeScript warnings from `echarts` and `@vue/runtime-core` typings — these are upstream issues and do not affect the build output.
- Test commands use `ddc test` under the hood; `--package-name` must be one of `components`, `hooks`, or `index` (not a component name like `button`). Use `--subpackage` for individual components.
- The project uses **tab indentation** (see `.editorconfig`). Respect this when editing files.
