## 标签（Tag）

用于标记属性、分类和展示选择状态的小标签。

移动端入口导出的 `MTag` 与 `Tag` 的属性、事件和插槽相同，尺寸按 750 稿随 `--vc-rem` 缩放，见 [移动端](#移动端)。

### 何时使用

- 展示内容的属性或分类。
- 提供可选择或可移除的标签。

### 基础用法

`type` 控制填充、边框或圆点样式，`color` 选择预设语义颜色。`color` 实际生成 `is-<color>` 类名，不会将任意 CSS 色值设置为背景。标签自带 `2px 4px 2px 0` 的外边距，demo 中的 `gap` 与之相加为 `8px`。

:::playground
<!--
<config lang="json5">
{
	views: ['runtime', 'files'],
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="tag-demo">
		<div v-for="type in types" :key="type" class="tag-demo__row">
			<Tag v-for="color in colors" :key="color" :type="type" :color="color">
				{{ color }}
			</Tag>
		</div>
	</div>
</template>

<script setup>
import { Tag } from '@deot/vc';

const types = ['default', 'border', 'dot'];
const colors = ['default', 'primary', 'success', 'warning', 'error'];
</script>

<style scoped>
.tag-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

/* 标签自带 2px 4px 2px 0 的外边距，合计间距 8px */
.tag-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 4px;
}
</style>
```
:::

### 关闭标签

`closable` 显示关闭图标；组件只发出 `close` 事件，由调用方移除数据。使用 `value` 标识标签。

:::playground
<!--
<config lang="json5">
{
	views: ['runtime', 'files'],
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="tag-demo">
		<div class="tag-demo__row">
			<Tag
				v-for="(value, index) in tags"
				:key="value"
				:value="value"
				:type="types[index % types.length]"
				closable
				color="primary"
				@close="handleClose"
			>
				{{ value }}
			</Tag>
		</div>
		<div class="tag-demo__row">
			<Button size="small" @click="handleReset">重置</Button>
		</div>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, Tag } from '@deot/vc';

const initialTags = ['标签一', '标签二', '标签三'];
const types = ['default', 'border', 'dot'];
const tags = ref([...initialTags]);

const handleClose = (event, value) => {
	tags.value = tags.value.filter(item => item !== value);
};

const handleReset = () => {
	tags.value = [...initialTags];
};
</script>

<style scoped>
.tag-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

/* 标签自带 2px 4px 2px 0 的外边距，合计间距 8px */
.tag-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 4px;
}
</style>
```
:::

### 选择状态

`checkable` 开启点击切换，`checked` 设置初始状态并在属性变化时同步内部状态。组件通过 `change` 返回切换结果，不提供 `v-model:checked`。

:::playground
<!--
<config lang="json5">
{
	views: ['runtime', 'files'],
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="tag-demo">
		<div class="tag-demo__row">
			<Tag
				v-for="option in options"
				:key="option.value"
				:value="option.value"
				:checked="option.checked"
				:color="option.color"
				checkable
				@change="handleChange"
			>
				{{ option.value }}
			</Tag>
		</div>
		<p class="tag-demo__result">已选中：{{ checkedText }}</p>
	</div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { Tag } from '@deot/vc';

const options = ref([
	{ value: '选项 A', color: 'primary', checked: true },
	{ value: '选项 B', color: 'success', checked: false },
	{ value: '选项 C', color: 'warning', checked: false }
]);

const checkedText = computed(() => {
	const values = options.value.filter(item => item.checked).map(item => item.value);
	return values.length ? values.join('、') : '无';
});

const handleChange = (checked, value) => {
	const option = options.value.find(item => item.value === value);
	if (option) option.checked = checked;
};
</script>

<style scoped>
.tag-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

/* 标签自带 2px 4px 2px 0 的外边距，合计间距 8px */
.tag-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 4px;
}

.tag-demo__result {
	margin: 0;
}
</style>
```
:::

## 移动端

`MTag` 的属性、事件、插槽、结构与 `Tag` 相同，根节点另有标记类 `.vcm-tag`，结构样式、颜色与主题参数共用。尺寸按 750 稿设计，写为 `calc(var(--vc-rem) * n)`，随 `--vc-rem` 缩放，三种 `type` 等高；底栏切换 `rem` 可查看不同屏宽下的效果。

:::playground
<!--
<config lang="json5">
{
	mobile: true,
	previewInset: [12, 0],
	previewVariables: [{
		name: '--rem',
		label: 'rem',
		values: ['auto', '0.5px', '0.552px', '0.64px', '1px']
	}]
}
</config>
-->
```vue
<template>
	<div class="m-tag-demo">
		<div v-for="type in types" :key="type" class="m-tag-demo__row">
			<MTag v-for="color in colors" :key="color" :type="type" :color="color">
				{{ color }}
			</MTag>
		</div>
		<div class="m-tag-demo__row">
			<MTag
				v-for="(value, index) in tags"
				:key="value"
				:value="value"
				:type="types[index % types.length]"
				color="primary"
				closable
				@close="handleClose"
			>
				{{ value }}
			</MTag>
		</div>
		<div class="m-tag-demo__row">
			<MTag
				v-for="(color, index) in colors.slice(1)"
				:key="color"
				:checked="index % 2 === 0"
				:color="color"
				checkable
			>
				选项 {{ index + 1 }}
			</MTag>
		</div>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MTag } from '@deot/vc';

const types = ['default', 'border', 'dot'];
const colors = ['default', 'primary', 'success', 'warning', 'error'];
const tags = ref(['标签一', '标签二', '标签三']);

const handleClose = (event, value) => {
	tags.value = tags.value.filter(item => item !== value);
};
</script>

<style scoped>
.m-tag-demo {
	display: flex;
	flex-direction: column;
	gap: calc(var(--vc-rem) * 32);
	padding-inline: calc(var(--vc-rem) * 32);
}

/* 标签自带右外边距 16，这里只补行间距 */
.m-tag-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	row-gap: calc(var(--vc-rem) * 16);
}
</style>
```
:::

尺寸如下（括号内为 375 宽下的 px）：

| 项 | 值 |
| --- | --- |
| 高度、行高 | 40（20） |
| 字号 | 24（12） |
| 左右内边距 | 8（4） |
| 圆角 | 6（3） |
| 关闭图标 | 字号 24（12），图形缩放为 0.7 倍，与文字间距 8（4） |
| 圆点（`dot`） | 16（8），与文字间距 8（4） |
| 右外边距 | 16（8） |

边框保持 1px（高分屏 0.5px），不随 `--vc-rem` 缩放。

两端的尺寸都写成局部变量 `--vc-tag-<键>`，桌面端的默认值为 px，移动端在 `.vcm-tag` 上覆盖，与样式的加载顺序无关。键为 `height`、`line-height`、`margin`、`font-size`、`radius`、`wrapper-padding`、`close-size`、`close-gap`、`close-transform`、`dot-size`、`dot-gap`，以及 `type` 下的 `border-height`、`border-line-height`、`border-close-gap`、`dot-height`、`dot-line-height`、`dot-padding`、`dot-close-gap`。

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

尺寸写成局部变量 `--vc-tag-<键>`，桌面端的默认值在括号内，设在标签或其祖先上；`MTag` 的取值见 [移动端](#移动端)：

| 键 | 说明 |
| --- | --- |
| height | 高度（22px） |
| line-height | 行高（22px） |
| margin | 外边距（2px 4px 2px 0） |
| font-size | 字号（12px） |
| radius | 圆角（3px） |
| wrapper-padding | 内容左右内边距（0 8px） |
| close-size | 关闭图标框尺寸（12px） |
| close-gap | 关闭图标与文字的间距（0；`MTag` 为 8，即 4px） |
| close-transform | 关闭图标缩放（scale(0.7)） |
| dot-size | 圆点尺寸（10px） |
| dot-gap | 圆点与文字的间距（6px） |
| border-height / border-line-height | `type="border"` 的高度与行高（24px） |
| border-close-gap | `type="border"` 关闭图标与文字的间距（18px） |
| dot-height / dot-line-height | `type="dot"` 的高度与行高（28px） |
| dot-padding | `type="dot"` 的内边距（0 10px） |
| dot-close-gap | `type="dot"` 关闭图标与文字的间距（12px） |

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
- 点击关闭图标会阻止事件冒泡：同时开启 `checkable` 时不会触发选择切换，也不会冒泡到父节点。
- 开启 `checkable` 时，点击标签会阻止点击事件向父节点冒泡；未开启时不阻止。
