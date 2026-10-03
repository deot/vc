## 提示框（Alert）

展示需要用户关注的状态反馈或说明信息。`Alert` 与 `MAlert` 指向同一个组件。

### 何时使用

- 展示与当前操作相关的信息、成功、错误或警告状态。
- 需要补充说明内容，或允许用户主动关闭提示时。

### 基础用法

通过 `type` 设置提示类型。传入 `desc` 后，组件会使用带说明文字的布局。

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
	<div class="alert-demo">
		<Alert title="信息提示" desc="这是一条需要关注的信息。" />
		<Alert type="success" title="成功提示" desc="操作已经顺利完成。" />
		<Alert type="error" title="错误提示" desc="操作失败，请稍后重试。" />
		<Alert type="warning" title="警告提示" closable @close="isClosed = true">
			<template #desc>
				当前操作可能影响已有数据。
			</template>
		</Alert>
		<span v-if="isClosed" class="alert-demo__status">警告提示已关闭</span>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Alert } from '@deot/vc';

const isClosed = ref(false);
</script>

<style scoped>
.alert-demo {
	display: grid;
	gap: 12px;
}

.alert-demo__status {
	font-size: 13px;
	color: var(--vc-color-dark-lightest);
}
</style>
```
:::

### 内容渲染

`title` 和 `desc` 字符串通过 `innerHTML` 渲染，只应传入可信内容。对应属性为空字符串时，组件分别使用默认插槽和 `desc` 插槽。

## 主题与局部覆盖

全局参数通过 `--vc-<参数>` 配置，单个组件通过 `--vc-alert-<参数>` 覆盖。同一参数可能作用于多个状态；多命名空间时在使用位置中标明。

⚠ color-mix：四种状态的背景由对应状态色 8% 与 background-color-lightest 92% 混合，边框按 40% / 60% 混合。不支持时，背景使用 background-color-light，边框使用对应状态色。

### 全局

| 参数 | 使用位置 | 值 |
| --- | --- | --- |
| color-dark-lighter | 普通文字 | 亮色：`#515151`；暗色：`#D9D9D9` |
| color-error | 对应状态文字、图标、边框及浅底派生色 | `#F53F3F` |
| color-primary | 对应状态文字、图标、边框及浅底派生色 | `#456CF6` |
| color-success | 对应状态文字、图标、边框及浅底派生色 | `#1DB88C` |
| color-warning | 对应状态文字、图标、边框及浅底派生色 | `#E6A23C` |
| background-color-light | 不支持混合色时的状态背景 | 亮色：`#F7F8FA`；暗色：`#2D3444` |
| background-color-lightest | 状态背景和边框的混合表面色 | 亮色：`#FFFFFF`；暗色：`#252B3A` |

### 局部

当前组件没有额外的局部 CSS 主题参数。

## API

### 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| modelValue | 是否显示提示；关闭提示时通过 `update:modelValue` 同步为 `false` | `boolean` | - | `true` |
| type | 提示类型 | `'success' \| 'info' \| 'error' \| 'warning'` | `success`、`info`、`error`、`warning` | `info` |
| title | 标题；非空时优先于默认插槽，并通过 `innerHTML` 渲染 | `string` | - | `''` |
| desc | 说明文字；非空时优先于 `desc` 插槽，并通过 `innerHTML` 渲染 | `string` | - | `''` |
| icon | 图标配置；`true` 或空字符串使用当前 `type`，字符串使用对应图标，`false` 隐藏图标 | `string \| boolean` | - | `true` |
| closable | 是否显示关闭入口 | `boolean` | - | `false` |

### 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| close | 点击关闭入口时触发 | `() => void` | - |
| update:modelValue | 点击关闭入口时触发 | `(value: false) => void` | `value` 固定为 `false` |
| visible-change | 点击关闭入口时触发 | `(visible: false) => void` | `visible` 固定为 `false` |

### 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | `title` 为空字符串时显示的标题内容 | - |
| desc | `desc` 为空字符串时显示的说明内容 | - |
| close | 自定义关闭入口内容；仅在 `closable` 为 `true` 时渲染 | - |
