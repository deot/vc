# AGENTS.md

## 说明

这是一个 **Vue 3 组件库**（`@deot/vc`）——纯前端 monorepo，不包含后端服务或数据库。

### 服务

| 服务 | 命令 | 说明 |
|---------|---------|-------|
| 开发服务器 | `npm run dev` | 基于 Vite，在 `http://localhost:5173/` 提供所有组件示例 |

### 主要命令

所有命令都定义在根目录的 `package.json` 中。完整说明请参阅 `README.md` 和 `.cursor/rules/web-project-standards.mdc`。

- **代码检查：** `npm run lint`（ESLint + Stylelint）；使用 `npm run lint:fix` 自动修复
- **类型检查：** `npm run typecheck`（vue-tsc）
- **测试：** `npm run test`（使用 Vitest 测试所有包）；测试单个组件时使用 `-- --package-name components --subpackage <name>`
- **构建：** `npm run build`（输出 ES/CJS/UMD/IIFE 格式）
- **开发：** `npm run dev`（运行包含所有组件示例的 Vite 开发服务器）

### 容易忽略的注意事项

- `pnpm-workspace.yaml` 包含 `allowBuilds` 配置，因此原生扩展（`@swc/core`、`esbuild`、`puppeteer` 等）会在 `pnpm install` 期间自动构建，无需单独安装 Puppeteer。
- ESLint 会报告 README.md 文件和部分示例中原本就存在的警告或错误（主要是 `no-console`），这些问题不会阻塞当前工作。
- 构建时会出现来自 `echarts` 和 `@vue/runtime-core` 类型定义的 TypeScript 警告；这些属于上游问题，不影响构建产物。
- 测试命令底层使用 `ddc test`；`--package-name` 必须是 `components`、`hooks` 或 `index` 之一，不能使用 `button` 之类的组件名。测试单个组件时使用 `--subpackage`。
- 项目使用 **Tab 缩进**（参阅 `.editorconfig`），编辑文件时请遵循这一规范。
