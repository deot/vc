## 按钮（Button）

用于触发即时操作，并通过类型、尺寸和形状表达不同的操作层级。

移动端入口导出的 `MButton` 和 `MButtonGroup` 分别是 `Button` 和 `ButtonGroup` 的别名，共用相同的属性、事件和插槽。

### 何时使用

- 提交表单、确认操作或触发页面内命令。
- 使用一组相邻按钮组织同类操作。

### 基础用法

通过 `type` 设置按钮类型。

:::playground
<!--
<config lang="json5">
{
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="button-demo">
		<Button>默认按钮</Button>
		<Button type="primary">主要按钮</Button>
		<Button type="success">成功按钮</Button>
		<Button type="error">错误按钮</Button>
		<Button type="warning">警告按钮</Button>
		<Button type="text">文字按钮</Button>
	</div>
</template>

<script setup>
import { Button } from '@deot/vc';
</script>

<style scoped>
.button-demo {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}
</style>
```
:::

### 状态与尺寸

`disabled` 禁用按钮；`size` 支持 `large`、`medium` 和 `small`。普通文本按钮的默认高度依次为 `38px`、`32px`、`26px`，内边距依次为 `8px 20px`、`5px 16px`、`2px 8px`；组内按钮沿用同一尺寸样式。

:::playground
<!--
<config lang="json5">
{
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="button-demo">
		<Button type="primary" disabled>禁用按钮</Button>
		<Button type="primary" size="large">大按钮</Button>
		<Button type="primary">中按钮</Button>
		<Button type="primary" size="small">小按钮</Button>
	</div>
</template>

<script setup>
import { Button } from '@deot/vc';
</script>

<style scoped>
.button-demo {
	display: flex;
	align-items: center;
	gap: 8px;
}
</style>
```
:::

### 图标与形状

`icon` 添加内置图标，图标尺寸随 `size` 调整：small 为 `12px`、medium 为 `14px`、large 为 `16px`；图标与文字同时存在时，间距为 `6px`。自定义 `icon` 插槽继承相同字号，显式设置尺寸的内容由调用方控制。`circle` 使用胶囊形圆角。无默认插槽时配合 `round` 可创建圆形图标按钮。只有图标的按钮（含圆形）与同尺寸的文字按钮等高，放在同一行时上下对齐。

:::playground
<!--
<config lang="json5">
{
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="button-demo">
		<Button type="primary" icon="search">搜索</Button>
		<Button type="success" icon="success" round aria-label="完成" />
		<Button type="warning" circle>胶囊按钮</Button>
	</div>
</template>

<script setup>
import { Button } from '@deot/vc';
</script>

<style scoped>
.button-demo {
	display: flex;
	align-items: center;
	gap: 8px;
}
</style>
```
:::

### 长按钮

`long` 使按钮宽度跟随父元素。

:::playground
<!--
<config lang="json5">
{
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="button-long-demo">
		<Button type="primary" long>完整宽度</Button>
	</div>
</template>

<script setup>
import { Button } from '@deot/vc';
</script>

<style scoped>
.button-long-demo {
	width: 320px;
	max-width: 100%;
}
</style>
```
:::

### 异步加载

当 `click` 处理函数返回 Promise 时，按钮会展示加载图标，并在 Promise 结束后自动移除。加载图标位于最前，与图标、文字之间的间距为 `6px`；按钮设置了 `icon` 时两者同时显示，只有图标的圆形按钮（`round`）放不下两者，加载中只显示加载图标。

:::playground
<!--
<config lang="json5">
{
	previewInset: 16
}
</config>
-->
```vue
<template>
	<Button type="primary" @click="handleAsync">点击加载</Button>
</template>

<script setup>
import { Button } from '@deot/vc';

const handleAsync = () => new Promise((resolve) => {
	setTimeout(resolve, 1500);
});
</script>
```
:::

### 按钮组合

使用 `ButtonGroup` 组合按钮；`vertical` 切换为纵向排列，`size` 和 `circle` 统一控制组内按钮样式。

:::playground
<!--
<config lang="json5">
{
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="button-group-demo">
		<ButtonGroup>
			<Button>左</Button>
			<Button>中</Button>
			<Button>右</Button>
		</ButtonGroup>
		<ButtonGroup vertical circle>
			<Button type="primary" icon="up" aria-label="向上" />
			<Button type="primary" icon="down" aria-label="向下" />
		</ButtonGroup>
	</div>
</template>

<script setup>
import { Button, ButtonGroup } from '@deot/vc';
</script>

<style scoped>
.button-group-demo {
	display: flex;
	align-items: flex-start;
	gap: 16px;
}
</style>
```
:::

## 主题与局部覆盖

全局参数通过 `--vc-<参数>` 配置，单个组件通过 `--vc-button-<参数>`、`--vc-button-group-<参数>` 覆盖。同一参数可能作用于多个状态；多命名空间时在使用位置中标明。禁用时悬停保持禁用配色。

### 全局

| 参数 | 使用位置 | 值 |
| --- | --- | --- |
| `color-contrast-light` | 非 `solid` 语义按钮文字；暗色 `primary` + `solid` 悬停文字及 `currentColor` 边框（`button`） | `#FFFFFF`（亮暗主题相同，默认不随主题反转，可通过 CSS 变量覆盖） |
| `color-dark-light` | `text` 普通文字（`button`） | 亮色：`#080F20`；暗色：`#E8E8E8` |
| `color-dark-lighter` | 暗色 `default`、`text` 禁用文字；非 `solid` 的 `success`、`error`、`warning` 禁用文字（`button`） | 亮色：`#515151`；暗色：`#D9D9D9` |
| `color-error` | 非 `solid` 的 `error` 普通背景、边框；`solid` 普通文字、边框（`button`） | `#F53F3F` |
| `color-error-light` | 非 `solid` 的 `error` 悬停背景、边框；`solid` 悬停文字、边框及禁用派生基色（`button`） | `#F76560` |
| `color-light-deep` | 亮色 `default` 普通、禁用背景（含 `solid` 禁用）；非 `solid` 普通、禁用边框（`button`） | 亮色：`#F3F4F6`；暗色：`#C0C4CC`（此处不使用暗色值） |
| `color-light-deeper` | 基础边框；亮色 `default` 非 `solid` 悬停背景、边框及 `solid` 禁用边框（`button`） | 亮色：`#EBEDEF`；暗色：`#D5D9E1` |
| `color-light-deepest` | 默认加载图标的灰色（`button`） | 亮色：`#C0C4CC`；暗色：`#E8E8E8` |
| `color-neutral` | `default` + `solid` 普通边框（亮暗主题）；亮色 `default`、`text` 禁用文字（`button`） | 亮色：`#C4C9D2`；暗色：`#E8E8E8` |
| `color-neutral-light` | 暗色 `default` 非 `solid` 悬停背景、边框（`button`）；按钮组默认按钮边框（`button-group`） | 亮色：`#EDEFF1`；暗色：`#3B4354` |
| `color-neutral-deep` | `default` + `solid` 悬停边框（亮暗主题，仅边框变化，背景不变）（`button`） | `#86909C`（亮暗主题相同） |
| `color-primary` | 非 `solid` 的 `primary` 普通背景、边框；亮色 `solid` 普通文字、边框（`button`） | `#456CF6` |
| `color-primary-light` | 非 `solid` 的 `primary` 悬停背景、边框；亮色 `primary` + `solid` 悬停文字及 `currentColor` 边框；暗色 `primary` + `solid` 普通文字、边框；`text` 悬停文字；禁用主色派生基色（`button`） | `#4A96FF` |
| `color-primary-lighter` | 不支持 `color-mix` 时，禁用 `primary` 非 `solid` 背景、边框及 `solid` 文字、边框的降级色（`button`） | `rgba(45, 140, 240, 0.2)` |
| `color-success` | 非 `solid` 的 `success` 普通背景、边框；`solid` 普通文字、边框（`button`） | `#1DB88C` |
| `color-success-light` | 非 `solid` 的 `success` 悬停背景、边框；`solid` 悬停文字、边框及禁用派生基色（`button`） | `#47CB89` |
| `color-warning` | 非 `solid` 的 `warning` 普通背景、边框；`solid` 普通文字、边框（`button`） | `#E6A23C` |
| `color-warning-light` | 非 `solid` 的 `warning` 悬停背景、边框；`solid` 悬停文字、边框及禁用派生基色（`button`） | `#EBB563` |
| `background-color-light` | 暗色 `default` 普通、禁用背景、边框（含 `solid` 禁用）；非 `solid` 的 `success`、`error`、`warning` 及 `text` 禁用背景、边框（`button`） | 亮色：`#F7F8FA`；暗色：`#2D3444` |
| `background-color-lightest` | 基础背景；`solid` 普通、悬停背景及语义按钮禁用背景；禁用派生色的混合表面（`button`） | 亮色：`#FFFFFF`；暗色：`#252B3A` |
| `foreground-color` | `default` 普通、悬停文字（含 `solid`）（`button`） | 亮色：`#080F20`；暗色：`#F8F8F8` |

禁用语义色在亮暗主题下采用以下混合及降级规则，`solid` 边框通过 `currentColor` 与文字同色，背景保持 `background-color-lightest`：

| 参数 | 使用位置 | 值 |
| --- | --- | --- |
| `color-primary-light`、`background-color-lightest` | 禁用 `primary`：非 `solid` 背景、边框；`solid` 文字、边框（`button`） | 支持 `color-mix`：前者 `30%` 与后者 `70%` 混合；不支持时使用 `color-primary-lighter` |
| `color-success-light`、`background-color-lightest` | 禁用 `success` + `solid` 文字、边框（`button`） | 支持 `color-mix`：前者 `30%` 与后者 `70%` 混合；不支持时使用 `color-success-light` |
| `color-error-light`、`background-color-lightest` | 禁用 `error` + `solid` 文字、边框（`button`） | 支持 `color-mix`：前者 `30%` 与后者 `70%` 混合；不支持时使用 `color-error-light` |
| `color-warning-light`、`background-color-lightest` | 禁用 `warning` + `solid` 文字、边框（`button`） | 支持 `color-mix`：前者 `30%` 与后者 `70%` 混合；不支持时使用 `color-warning-light` |

### 局部

| 参数 | 使用位置 | 值 |
| --- | --- | --- |
| - | 当前组件没有额外的局部 CSS 主题参数 | - |

## API

### Button 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| tag | 渲染使用的 HTML 标签名 | `string` | - | `button` |
| type | 按钮类型 | `'default' \| 'primary' \| 'text' \| 'success' \| 'error' \| 'warning'` | `default`、`primary`、`text`、`success`、`error`、`warning` | `default` |
| size | 按钮尺寸 | `'small' \| 'medium' \| 'large'` | `small`、`medium`、`large` | `medium` |
| wait | `click` 事件的防抖间隔，单位为毫秒 | `number` | - | `250` |
| icon | 内置图标名称 | `string` | - | `undefined` |
| disabled | 是否禁用按钮 | `boolean` | - | `false` |
| circle | 是否使用胶囊形圆角 | `boolean` | - | `false` |
| round | 无默认插槽时，是否使用等宽圆形样式 | `boolean` | - | `false` |
| long | 是否占满父元素宽度 | `boolean` | - | `false` |
| solid | 是否启用 solid 状态；内置样式覆盖 `default`、`primary`、`success`、`error`、`warning` 类型 | `boolean` | - | `false` |
| dashed | 是否添加 `is-dashed` 状态类；当前不提供内置虚线边框 | `boolean` | - | `false` |
| htmlType | 原生 `button` 元素的 `type` 属性 | `'button' \| 'submit' \| 'reset'` | `button`、`submit`、`reset` | `button` |

### Button 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| click | 点击按钮时触发；处理函数返回 Promise 时展示 loading，直到 Promise 结束 | `event: MouseEvent` | `event` 为原生点击事件 |

### Button 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 按钮内容 | - |
| icon | 自定义前置图标 | `{ hover: boolean }` |

### ButtonGroup 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| vertical | 是否纵向排列按钮 | `boolean` | - | `false` |
| circle | 是否统一使用胶囊形圆角 | `boolean` | - | `false` |
| size | 统一设置组内按钮尺寸，优先于子按钮的 size；首尾外侧圆角与同尺寸普通按钮一致，连接处保持直角 | `string` | `small`、`medium`、`large` | `medium` |
| fragment | 是否直接渲染默认插槽而不生成分组容器；开启后排列、首尾圆角和分隔边框样式不生效，size、circle 仍传入子按钮 | `boolean` | - | `false` |

### ButtonGroup 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 分组中的按钮 | - |
