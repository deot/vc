## 标签（Tag）

用于标记属性、分类和展示选择状态的小标签。

### 何时使用

- 展示内容的属性或分类。
- 提供可选择或可移除的标签。

### 基础用法

`type` 控制填充、边框或圆点样式，`color` 选择预设语义颜色。`color` 实际生成 `is-<color>` 类名，不会将任意 CSS 色值设置为背景。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<div v-for="type in ['default', 'border', 'dot']" :key="type">
		<Tag v-for="color in colors" :key="color" :type="type" :color="color">
			{{ color }}
		</Tag>
	</div>
</template>

<script setup>
import { Tag } from '@deot/vc';

const colors = ['default', 'primary', 'success', 'warning', 'error'];
</script>
```
:::

### 关闭标签

`closable` 显示关闭图标；组件只发出 `close` 事件，由调用方移除数据。使用 `value` 标识标签。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<Tag v-for="value in tags" :key="value" :value="value" closable color="primary" @close="handleClose">
		{{ value }}
	</Tag>
	<button type="button" @click="tags = ['标签一', '标签二', '标签三']">重置</button>
</template>

<script setup>
import { ref } from 'vue';
import { Tag } from '@deot/vc';

const tags = ref(['标签一', '标签二', '标签三']);
const handleClose = (event, value) => {
	tags.value = tags.value.filter(item => item !== value);
};
</script>
```
:::

### 选择状态

`checkable` 开启点击切换，`checked` 设置初始状态并在属性变化时同步内部状态。组件通过 `change` 返回切换结果，不提供 `v-model:checked`。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<Tag checkable :checked="isChecked" color="primary" value="选项 A" @change="handleChange">选项 A</Tag>
	<span>{{ isChecked ? '已选中' : '未选中' }}</span>
</template>

<script setup>
import { ref } from 'vue';
import { Tag } from '@deot/vc';

const isChecked = ref(false);
const handleChange = (value) => {
	isChecked.value = value;
};
</script>
```
:::

## 主题与局部覆盖

全局参数通过 `--vc-<参数>` 配置，单个组件通过 `--vc-tag-<参数>` 覆盖。同一参数可能作用于多个状态；多命名空间时在使用位置中标明。

实心语义标签文字使用可覆盖的 color-contrast-light。

默认标签背景与 Button default 普通态一致：亮色使用 color-light-deep，暗色使用 background-color-light。

### 全局

| 参数 | 使用位置 | 值 |
| --- | --- | --- |
| color-contrast-light | 实心语义标签文字及对应标记、边框 | `#FFFFFF`（亮暗主题相同） |
| color-error | 错误标签背景、边框或文字 | `#F53F3F` |
| color-light-deep | 亮色默认标签背景 | 亮色：`#F3F4F6`；暗色：`#C0C4CC` |
| color-light-deepest | 默认圆点 | 亮色：`#C0C4CC`；暗色：`#E8E8E8` |
| color-neutral-light | 默认标签边框 | 亮色：`#EDEFF1`；暗色：`#3B4354` |
| color-primary | 主色标签背景、边框或文字 | `#456CF6` |
| color-success | 成功标签背景、边框或文字 | `#1DB88C` |
| color-warning | 警告标签背景、边框或文字 | `#E6A23C` |
| background-color-light | 暗色默认标签背景 | 亮色：`#F7F8FA`；暗色：`#2D3444` |
| background-color-lightest | 边框、圆点及未选中标签背景 | 亮色：`#FFFFFF`；暗色：`#252B3A` |
| foreground-color | 默认及未选中标签文字 | 亮色：`#080F20`；暗色：`#F8F8F8` |

### 局部

当前组件没有额外的局部 CSS 主题参数。

## API

### 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| closable | 显示关闭图标 | `boolean` | - | `false` |
| checkable | 是否允许点击切换选中状态 | `boolean` | - | `false` |
| checked | 选中状态；属性变化时同步内部状态 | `boolean` | - | `true` |
| type | 标签样式 | `string` | `default`、`border`、`dot` | `default` |
| color | 颜色类名；自定义名称需要自行提供 CSS | `string` | `default`、`primary`、`success`、`warning`、`error`；`border` 和 `dot` 另支持 `white` | `default` |
| value | 事件携带的标签标识 | `string \| number` | - | - |

### 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| close | 点击关闭图标时触发，不自动移除标签 | `(event: MouseEvent, value: string \| number \| undefined)` | `event` 为点击事件，`value` 为标签标识 |
| change | 开启 `checkable` 后点击切换时触发 | `(checked: boolean, value: string \| number \| undefined)` | `checked` 为切换后的状态，`value` 为标签标识 |

### 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 标签内容 | - |

### 行为说明

- 当前实现会将 `value` 为 `0` 或空字符串的事件参数转为 `undefined`，需要定位标签时请使用非空字符串或非零数字。
- 同时开启 `closable` 和 `checkable` 时，点击关闭图标也会冒泡到标签并触发选择切换。只需关闭时，可在 `close` 回调中调用 `event.stopPropagation()`。
- 标签根节点会阻止点击事件向父节点冒泡。
- 移动端入口导出的 `MTag` 复用 `Tag` 实现和样式，属性、事件和插槽一致。
