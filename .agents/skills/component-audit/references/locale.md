# Locale 规范

## 边界与来源

- `@deot/vc-locale` 只存放语言类型和静态语言数据。不要在 `packages/locale` 中引入 Vue、组件实现、翻译器、Provider 或 `VcInstance`。
- 组件集成放在 `packages/components/locale`。组件 setup 代码调用 `useLocale()`，并根据当前文件深度使用正确的相对路径导入，例如 `../locale`、`../../locale` 或 `../../../locale`；不要通过 `@deot/vc` 反向导入。
- 默认语言保持为 `zh-CN`。保留具名导出的 `zhCN` 和 `enUS`、静态 ESM 数据，以及当前不做 fallback merge 的行为。

## 哪些内容需要翻译

将组件库提供且最终用户可见的文案纳入 locale，包括无障碍标签、提示、空状态、操作、状态或校验消息。检查 render functions、composables、portals、桌面端/移动端实现，以及默认 props/configuration。

除非当前组件确实将以下内容作为 UI 呈现，否则不要把它们移入 locale 数据：

- 开发者诊断信息、invariant messages、测试描述、注释和日志；
- 用户提供的内容或服务端提供的消息；
- 协议值、CSS class names、event names 和公开 enum values。

如果分类存在歧义且会改变公开行为，列出该字符串并询问用户，不要静默地将其 locale 化。

## Key 结构

使用以下路径：

```text
vc.<ComponentName>.<semanticKey>
```

- `<ComponentName>` 使用当前公开组件名或组件族名，并采用 PascalCase（大驼峰），例如 `DatePicker` 或 `InputNumber`。
- 根据实际公开组件确定 namespace，不要机械地从目录名推导。一个目录可以导出多个公开组件；如果归属存在实质歧义，先询问用户，再决定使用共享还是独立 namespace。
- `<semanticKey>` 表达文案语义并采用 camelCase（小驼峰），例如 `noData`、`selectDate` 或 `confirmButtonText`。
- 只有存在真实语义分组时才增加更深层的 camelCase 对象。不要映射实现文件名或 DOM 结构。
- 优先在组件 namespace 中使用用途明确的 key，不要放入 `common.confirm` 之类的全局集合。
- 使用 `{total}` 这样的具名 placeholder，并向 `t` 传入同名的 string/number options。
- 保持 `zh-CN` 和 `en-US` 的 key 结构、placeholders 和 value kinds 完全一致。
- 正式翻译的叶子节点必须是 string。虽然 `TranslatePair` 允许 `string[]`，但当前翻译器遇到 array 或 object 时会返回原始路径。

不要盲目复制其他组件库的 namespace、casing 或 keys。外部 locale 文件只能作为设计参考；最终 key 由本仓库当前公开组件名和行为决定。
现有 `vc.sample.*` 测试和文档中的示例 `vc.component.*` 只是翻译器调用示例，不是正式组件 key 的命名先例。

## 使用方式与行为

- 在 setup/render 代码中，通过 `useLocale()` 获取 `t`，并使用完整的 `vc.*` 路径调用。
- 在 render/computed 执行期间读取翻译，不要在 setup 时只解析一次，以确保运行时切换 locale 后文案仍能更新。
- 保留现有面向用户的 text prop，并使其拥有更高覆盖优先级。如果空字符串是有效的显式覆盖值，不要使用 `||`。
- 非 setup 代码如果必须针对显式语言执行翻译，应使用现有 `translate`/`buildTranslator` 能力，不要新增第二套翻译器。
- 缺失或非 string 的叶子节点会返回原路径。不要在组件迁移中加入隐藏的 fallback merging。
- 当 `VcInstance.configure({ locale })` 改变当前语言时，保持响应性。

## 依据与验证

- 改动前后都要搜索整个组件族中的可见硬编码字符串。
- 验证两个语言对象具有相同的目标子树和 placeholders。
- 如果组件行为依赖默认文案、插值或实时 locale 切换，新增或更新针对性测试。
- 如果组件支持 text prop 覆盖，测试其覆盖行为，包括有意传入空字符串的情况；每个测试结束后恢复全局 locale。
- 当第一个正式组件 namespace 替换初始的 `vc: {}` 状态时，更新 locale package 测试，不再永久快照一个空对象。优先校验语言名、key/leaf 对齐和 placeholder 对齐等 invariants，不要为每个组件持续扩大整份语言快照。
- 语言数据改动仅限目标组件 namespace。
