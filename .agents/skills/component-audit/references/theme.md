# Theme 规范

## Theme 模型

- `packages/components/style/theme.scss` 定义共享 semantic tokens，`variables.scss` 为系统主题、强制亮色主题和强制暗色主题输出 `--vc-*` CSS variables。
- 组件样式通过 `packages/components/style/functions.scss` 中的 `varfix` 使用 tokens。
- 当存在共享 token 时，`varfix(color-primary, button)` 表示先取组件覆盖值，再取全局 fallback：`--vc-button-color-primary` -> `--vc-color-primary`。
- 对没有共享 token 的组件专属语义值，提供显式 fallback：`varfix(color-primary-disabled, button, #BEDAFF)`。
- 如果 token 已经存在于 `$theme`，`varfix` 会忽略第三个参数，仍以全局 token 作为 fallback。不要试图通过第三个参数覆盖该分支。
- 此 SCSS/CSS-variable 系统与 `Theme` 组件的 `VcInstance.options.Theme.variables` 相互独立。常规组件 theme 工作不应迁移到该 JS 兼容机制中。

## 组件约定

- 以正确的相对路径导入 `../style/helper`，并在 SCSS 文件顶部附近集中声明组件 theme values。
- 使用组件已经建立的 kebab-case CSS namespace 作为 `varfix` 的第二个参数，例如 `button`、`color-picker` 或 `upload-picker`。
- 对嵌套单元按样式归属而非目录名确定 namespace：可独立覆盖的单元可能已经使用 `upload-task` 或 `select-all` 等 namespace。
- 语义吻合时复用现有共享 semantic token。只有该 token 确实跨组件时才新增共享 token；不要仅为避免一个局部 fallback 而扩大全局 theme。
- 只有设计上有意使用固定亮色/暗色 theme value，而不是运行时可覆盖的 CSS variable 时，才使用 `themefrozen`。
- 对需要随缩放变化的组件尺寸使用 `unitfix`；除非有证据表明某个值必须固定，否则不要在同一套 scale-aware 规则中混入原始 pixel values。

## 硬编码值审计

检查 SCSS、Vue styles、TSX style objects、SVG attributes 和各类状态变体。前景、背景、边框、遮罩、阴影以及 focus/hover/active/disabled 颜色等具有 theme 语义的 UI 值，通常应通过 `varfix` 提供。

TS/TSX 中不能使用 Sass helpers。对于渲染时的子元素颜色或 inline style，优先使用 CSS inheritance/`currentColor`，或使用由组件 SCSS 支持的 class。如果子组件 API 必须接收 CSS color string，则按适用的 `varfix` 分支构造：只有共享 token 存在于 `$theme` 时，才使用 `var(--vc-<component>-<token>, var(--vc-<token>))`；组件专属 token 使用 `var(--vc-<component>-<token>, <source-backed-fallback>)`。不能仅因值通过 prop 传递，就直接传入一个可主题化的裸 literal。

不要机械替换每一种颜色。透明值、媒体/图形、color-picker 几何、数据可视化 palettes、assets 或用户提供的值，可能需要保持固定颜色。保留显眼的硬编码值时，记录原因。
Button 只用于展示 theme helpers 的使用方式，不能证明其中每个保留的硬编码值都符合规范；仍需独立审计目标组件。

检查每一种相关状态和平台：

- default、hover、active/focus、disabled、loading、selected、error/success/warning；
- 桌面端和移动端实现；
- grouped/subcomponent styles，以及渲染在局部 DOM tree 外的 portals；
- 亮色和暗色主题。

## 命名

- Theme keys 和 CSS custom properties 使用 kebab-case。
- 按语义角色和程度命名，不按具体颜色命名，例如使用 `color-primary-light`，而不是 `blue-light`。
- 遵循最接近的现有 token family。历史 keys 并不都包含 `default`；不要顺手重命名它们。

## 依据与验证

- 对比改动前后目标组件族中 hex、rgb/hsl、named colors、CSS variables、`varfix` 和 `themefrozen` 的搜索结果。
- 追踪 `index.ts`、`index.m.ts`、`style.scss` 和嵌套的 `@use` imports，避免遗漏独立加载、共享、移动端或复用的样式。
- 通过阅读 `varfix` 确认生成的 fallback 顺序；不要根据 Sass variable 名称推断。
- 对改动过的样式运行针对性 Stylelint。
- 对可见改动，在亮色和暗色主题中操作代表性状态，并记录任何未经过浏览器验证的内容。
