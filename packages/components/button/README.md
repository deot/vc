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

`disabled` 禁用按钮；`size` 支持 `large`、`medium` 和 `small`。

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

`icon` 添加内置图标，`circle` 使用胶囊形圆角。无默认插槽时配合 `round` 可创建圆形图标按钮。

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

当 `click` 处理函数返回 Promise 时，按钮会展示加载图标，并在 Promise 结束后自动移除。

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
| solid | 是否启用 solid 状态；内置样式覆盖 `default` 和 `primary` 类型 | `boolean` | - | `false` |
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
| size | 统一设置组内按钮尺寸 | `string` | `small`、`medium`、`large` | `medium` |
| fragment | 是否直接渲染默认插槽而不生成分组容器；开启后依赖容器的排列和尺寸样式不生效 | `boolean` | - | `false` |

### ButtonGroup 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 分组中的按钮 | - |
