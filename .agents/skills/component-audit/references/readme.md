# README 规范

## 源码准确性

根据目标组件当前的实现、公开入口、props、emits、slots、exposed/static methods、types、测试和可运行 examples 编写 README。内部仓库仅作设计依据；不得在公开 README 中点名，也不得将其内容照搬为公开示例。不要将仅供内部使用的 symbols 写成公开 API。

除非组件确实需要增加有源码依据的章节，否则保持既有组件页面层级：

```text
## 中文名称（ComponentName）

一句话职责说明

### 何时使用

### 基础用法

### 其他真实场景

## API

### 属性
### 事件
### 插槽
### 方法
```

- 组件 README 页面从 `##` 开始，因为 docs host 会提供页面上下文。
- 组件标题必须是文档第一节。将迁移说明、注意事项和兼容性细节放在主要用法/API 内容之后，不要放在组件身份说明之前。
- 相关章节存在时，统一使用 `### 基础用法`、`### 属性`、`### 事件`、`### 插槽` 和 `### 方法`。
- 省略空的 API 章节、placeholder 和 TODO 内容。处理某组件时，修正其过时或泛化的标题。
- 对组件族使用完整公开名称标明归属，例如 `Button 属性` 和 `ButtonGroup 属性`；避免使用 `基础属性`、`Group`、`Item` 或 `Pane` 等含义不明的标签。
- 只有当前公开 API 确实需要时，才增加行为契约、types/exports、迁移、注意事项或移动端章节。
- 在 `## API` 中保持同一公开实体的属性、事件、插槽和方法相邻。

## 示例与 Playground

是否新增或补充 demo，应根据当前公开源码和需要说明的真实行为判断；不要为了填满页面范式而强行增加。目标组件目录下的 `examples/` 可作为场景和交互设计的部分参考，但不能替代对公开源码、测试和 API 的核对。

Playground 的预览内容应尽量避免紧贴容器边缘；当示例自身没有合适间距时，可通过 `previewInset` 增加留白。需要铺满视口或画布的真实场景不强制增加。

Demo 中相邻的独立按钮应通过 `gap` 或 `margin` 保持清晰、一致的间距；优先在 flex/grid 容器中使用 `gap`，窄屏时允许合理换行，换行后仍保持行列间距。演示连体按钮组时保留组件本身的连接样式。`previewInset` 提供的是预览区外围留白，不能替代按钮之间的间距。

新增或修改 demo 时，同时优化其视觉呈现：合理安排操作区、演示区和结果说明的层次、对齐与留白，保持尺寸协调、文字易读，并适配声明的 viewport。美化样式放在示例自身的 scoped styles 或局部容器中，保持简洁并突出组件真实行为，避免覆盖组件主题或添加无关装饰。

不可运行的代码片段、interfaces、配置片段以及迁移前后对比使用普通 fenced blocks。完整的交互或视觉示例使用 `:::playground`。修改目标 README 时，将该文件内每个 legacy `:::RUNTIME` 容器一一替换为小写的 `:::playground`。

单文件形式：

````markdown
:::playground
```text
<template>
	<ComponentName />
</template>

<script setup>
import { ComponentName } from '@deot/vc';
</script>
```
:::
````

- 单个不带文件名的 fence 是优先采用的最小形式。
- 每个示例必须能够独立运行：包含全部 imports、local state、handlers 和必要的 scoped layout styles。
- 导入示例使用的每个 symbol，并移除未使用 imports；不要仅因某个损坏的 legacy example 已经存在就继续保留。
- Demo 中用于判断状态的布尔字段统一使用 `isXxxx` 形式，例如 `isActive` 或 `isVisible`。
- Vue template 中通过 `@xxx` 绑定的本地事件入口函数统一使用 `handleXxxx` 形式，例如 `@click="handleClick"` 或 `@change="handleChange"`。
- `handle` 前缀用于事件入口；入口内部调用的普通逻辑函数按行为命名，例如 `confirm`、`submit` 或 `reset`。避免 `handleSubmit` 调用 `handleConfirm` 这样的连续 `handle` 调用链，应写为 `handleSubmit` 内部调用 `confirm`；多个事件共用的逻辑也使用普通函数名。
- 上述命名规则只约束新增或实际修改到的 demo 内部代码，不用于更改组件公开 API、组件源码字段或批量整理未处理的历史示例。
- 使用当前公开的 `@deot/vc` API。不要依赖站点级全局组件注册、其他示例的 state、私有源码路径、真实在线业务接口或未解释的内部数据。
- 示例应保持聚焦；一个示例只演示一个完整行为。
- 使用 tab 缩进以匹配本仓库。

多文件示例中的每个 fence 必须具有唯一文件名。可选 JSON5 config 放在容器内的 HTML comment 中。`entry` 必须指向已存在的文件；`views` 必须是由不重复的 `runtime`/`files` 组成的非空列表（`view` 无效）；viewport 值可以是 `auto`、正数宽度或 `[width, height]`；`viewportOptions` 不得包含重复值；`previewInset` 必须是非负数或 `[vertical, horizontal]` 数组。

只有移动端 viewport 能实质体现组件形态时才使用：

````markdown
:::playground
<!--
<config lang="json5">
{
	viewport: [375, 667],
	viewportOptions: ['auto', 375, [375, 667]]
}
</config>
-->
```vue
<!-- 完整 SFC -->
```
:::
````

站点已经通过根目录 `index.html` 提供 module/style mappings；在组件 README 中使用已配置的公开 import names，不要嵌入 CDN 配置。

## API 表格

- 优先使用以下稳定列：属性表为 `属性 / 说明 / 类型 / 可选值 / 默认值`；事件表为 `事件名 / 说明 / 回调参数 / 参数说明`；插槽表为 `名称 / 说明 / 参数`；方法表为 `方法名 / 说明 / 参数 / 返回值`。
- API 表格使用公开 TypeScript/source prop 的 camelCase 名称，例如 `htmlType` 或 `modelValue`。Vue template 示例使用对应的 kebab-case attribute，例如 `html-type`；只有映射不明显时才额外解释。
- 使用当前公开名称和 casing。Vue template events 使用 kebab-case；如果对应的 JSX/config `onXxx` 名称也属于公开 API，则一并说明。
- 在 backticks 中写真实 TypeScript types，并在 Markdown 表格中将 union 转义为 `\|`。
- 没有默认值、可选值或参数时使用 `-`。如果差异有意义，要区分缺省值与 `undefined`、`null`、空字符串或运行时生成的默认值。
- 当调用方依赖 callback payload fields 或 return values 时，说明其内容。
- 以源码中的 defaults、validators、normalization 和 global configuration 为准；不要根据示例猜测。

## 验证

- 对照公开源码/export surface 核对 README 中所有 API names。
- 结构或 Playground 发生变化后渲染页面；运行每个有改动的 Playground 并检查 console。
- 在声明的 viewport 下验证移动端示例，并在两种主题下验证可见 theme 示例。
- 调整 demo 布局后，检查按钮间距、换行、内容对齐和留白，确认在目标 viewport 下没有拥挤、遮挡或意外横向溢出。
- 如果 lint 会把有意不可用的 imports 当作真实 modules，则将纯说明性 pseudocode 放在不可解析的 `text` fence 中。
