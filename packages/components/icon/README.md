## 图标（Icon）

通过图标名称展示 SVG，支持继承文字颜色或使用图标预设色。

移动端入口导出的 `MIcon` 与 `Icon` 的属性相同，数字 `size` 为 750 稿长度，随 `--vc-rem` 缩放，见 [移动端](#移动端)。

### 何时使用

用于辅助表达操作、状态或内容类型。图标作为操作入口时，可放在具有可访问名称的按钮中。

### 基础用法

通过 `type` 指定图标名称，通过 CSS `font-size` 调整大小。SVG 的宽高为 `1em`，默认通过 `currentColor` 继承文字颜色。也可以通过 `size`、`color` 直接指定，见[尺寸与颜色](#尺寸与颜色)。`click` 等原生监听透传到根 `<i>` 元素。

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
	<div class="icon-demo">
		<div class="icon-demo__preview" :style="{ color: iconColor, fontSize: `${iconSize}px` }">
			<Icon type="success" aria-label="成功" role="img" @click="handleClick" />
			<Icon type="error" aria-label="失败" role="img" @click="handleClick" />
		</div>
		<p class="icon-demo__result">点击图标 {{ count }} 次</p>
		<div class="icon-demo__control">
			<span>图标大小</span>
			<Slider v-model="iconSize" :min="16" :max="64" />
			<output>{{ iconSize }}px</output>
		</div>
		<div class="icon-demo__control">
			<span>图标颜色</span>
			<ColorPicker v-model="iconColor" />
			<output>{{ iconColor }}</output>
		</div>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { ColorPicker, Icon, Slider } from '@deot/vc';

const iconSize = ref(32);
const iconColor = ref('#456CF6');
const count = ref(0);

const handleClick = () => {
	count.value++;
};
</script>

<style scoped>
.icon-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.icon-demo__result {
	margin: 0;
}

.icon-demo__preview {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 16px;
	padding: 16px;
	border-radius: var(--vc-border-radius);
	background: var(--vc-background-color);
}

.icon-demo__control {
	display: grid;
	grid-template-columns: 72px minmax(0, 1fr) 72px;
	align-items: center;
	gap: 8px;
}

.icon-demo__control > output {
	color: var(--vc-color-dark-lightest);
	text-align: right;
}
</style>
```
:::

### 尺寸与颜色

`size` 以 px 指定尺寸，格式为 `数值` 或 `[外层, 里层]`，每一层可以是 `数值` 或 `[宽, 高]`；省略里层时与外层一致。外层是根元素的固定盒子，里层是居中的图标。`[20, 12]` 表示外层 20×20、图标 12×12，需要指定宽高时写成 `[[宽, 高]]`。`color` 写入根元素的文字颜色。

不传 `size` 时仍由 CSS `font-size` 控制；传入后图标按里层宽高以 px 显示，不再受外层 `font-size` 影响。

图标像文字一样排版：根元素是一个字符框，基线取自按父级字体排版的零宽字符，图标在框内居中。因此无论是否传 `size`，图标中心都落在父级字体字符框的中心，与同一行文字、flex 居中的文字一致，并跟随父级的字号、字体与 `vertical-align`，不需要额外的对齐样式。根元素为 `inline-flex`，改写 `display` 时请使用 `inline-flex` 或 `flex`。

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
	<div class="icon-demo">
		<div class="icon-demo__row">
			<span>图标颜色</span>
			<ColorPicker v-model="iconColor" />
			<span class="icon-demo__tip">虚线为外层盒子，实线为图标</span>
		</div>
		<div class="icon-demo__list">
			<div v-for="item in items" :key="item.label" class="icon-demo__item">
				<code>{{ item.label }}</code>
				<span>{{ item.desc }}</span>
				<Icon type="success" :size="item.size" :color="iconColor" aria-hidden="true" />
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { ColorPicker, Icon } from '@deot/vc';

const iconColor = ref('#456CF6');
const items = [
	{ label: '12', desc: '外层 12×12，图标 12×12', size: 12 },
	{ label: '[20, 12]', desc: '外层 20×20，图标 12×12', size: [20, 12] },
	{ label: '[[100, 24], 12]', desc: '外层 100×24，图标 12×12', size: [[100, 24], 12] },
	{ label: '[[100, 24]]', desc: '外层 100×24，图标 100×24', size: [[100, 24]] }
];
</script>

<style scoped>
.icon-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.icon-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}

.icon-demo__tip {
	color: var(--vc-color-dark-lightest);
}

.icon-demo__list {
	display: flex;
	flex-direction: column;
}

.icon-demo__item {
	display: grid;
	grid-template-columns: 140px minmax(0, 1fr) 100px;
	align-items: center;
	gap: 8px;
	padding: 8px 0;
	border-top: 1px solid var(--vc-color-light-deeper);
}

.icon-demo__item > :deep(.vc-icon) {
	outline: 1px dashed var(--vc-color-dark-lightest);
}

.icon-demo__item > :deep(.vc-icon > svg) {
	outline: 1px solid var(--vc-color-light-deeper);
}
</style>
```
:::

### 图标集合与预设色

组件会异步加载默认图标资源。下面等待同一资源加载完成，再读取已加载的图标名称。打开 `inherit` 后，路径使用资源中的预设 `fill`；没有预设色的路径仍继承文字颜色。点击图标可复制名称。

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
	<div class="icon-demo">
		<div class="icon-demo__row">
			<Checkbox v-model="isInherit">使用图标预设色</Checkbox>
			<span class="icon-demo__tip">点击图标复制名称</span>
		</div>
		<p class="icon-demo__result" role="status">
			{{ copiedIcon ? `已复制：${copiedIcon}` : status }}
		</p>
		<div class="icon-demo__gallery">
			<Clipboard
				v-for="item in items"
				:key="item"
				class="icon-demo__cell"
				:value="item"
				tag="button"
				@after="handleCopy"
			>
				<Icon :type="item" :inherit="isInherit" aria-hidden="true" />
				<span>{{ item }}</span>
			</Clipboard>
		</div>
	</div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { Checkbox, Clipboard, Icon, IconManager } from '@deot/vc';

const items = ref([]);
const isInherit = ref(false);
const copiedIcon = ref('');
const status = ref('正在加载图标资源…');

const handleCopy = (value) => {
	copiedIcon.value = value;
};

onMounted(async () => {
	try {
		await IconManager.load('//at.alicdn.com/t/font_1119857_u0f4525o6sd.js');
		items.value = Object.keys(IconManager.icons).sort();
		status.value = `已加载 ${items.value.length} 个图标`;
	} catch {
		status.value = '图标资源加载失败';
	}
});
</script>

<style scoped>
.icon-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.icon-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: 8px;
}

.icon-demo__tip,
.icon-demo__result {
	color: var(--vc-color-dark-lightest);
}

.icon-demo__result {
	margin: 0;
}

.icon-demo__gallery {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(112px, 1fr));
	gap: 8px;
}

.icon-demo__cell {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 8px;
	min-height: 104px;
	padding: 16px 8px;
	border: 1px solid var(--vc-color-light-deeper);
	border-radius: var(--vc-border-radius);
	color: inherit;
	font: inherit;
	text-align: center;
	background: var(--vc-background-color-lightest);
	cursor: pointer;
	overflow-wrap: anywhere;
	transition: border-color .2s, box-shadow .2s;
}

.icon-demo__cell:hover,
.icon-demo__cell:focus-visible {
	border-color: var(--vc-color-primary);
	box-shadow: var(--vc-box-shadow);
}

.icon-demo__cell > :deep(.vc-icon) {
	font-size: 32px;
}

.icon-demo__cell > span {
	font-size: 12px;
	line-height: 18px;
}
</style>
```
:::

## 移动端

`MIcon` 与 `Icon` 渲染相同的结构，根元素另有标记类 `.vcm-icon`（`.vc-icon.vcm-icon`），排版与样式共用。`size` 中的数值是 750 稿长度，样式写为 `calc(var(--vc-rem) * n)`，随 `--vc-rem` 缩放（375 宽下 `size=32` 即 16px）。不传 `size` 时跟随外层字号，移动端组件的字号本身已随 `--vc-rem` 缩放。底栏切换 `rem` 可查看缩放效果。

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
	<div class="m-icon-demo">
		<p class="m-icon-demo__text">
			<MIcon type="success" /> 不传 size 时跟随外层字号
		</p>
		<div class="m-icon-demo__row">
			<div v-for="item in items" :key="item.label" class="m-icon-demo__item">
				<MIcon type="success" :size="item.size" color="var(--vc-color-primary)" />
				<span>{{ item.label }}</span>
			</div>
		</div>
		<div class="m-icon-demo__row">
			<MIcon type="success" :size="48" color="var(--vc-color-success)" />
			<MIcon type="warning" :size="48" color="var(--vc-color-warning)" />
			<MIcon type="error" :size="48" color="var(--vc-color-error)" />
		</div>
	</div>
</template>

<script setup>
import { MIcon } from '@deot/vc';

const items = [
	{ label: '32', size: 32 },
	{ label: '48', size: 48 },
	{ label: '[64, 32]', size: [64, 32] },
	{ label: '[[160, 48], 32]', size: [[160, 48], 32] }
];
</script>

<style scoped>
.m-icon-demo {
	display: flex;
	flex-direction: column;
	gap: calc(var(--vc-rem) * 32);
	padding-inline: calc(var(--vc-rem) * 32);
}

.m-icon-demo__text {
	margin: 0;
	font-size: calc(var(--vc-rem) * 32);
}

.m-icon-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: calc(var(--vc-rem) * 32);
}

.m-icon-demo__item {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: calc(var(--vc-rem) * 16);
	font-size: calc(var(--vc-rem) * 24);
}

.m-icon-demo__item > :deep(.vc-icon) {
	outline: 1px dashed var(--vc-color-dark-extralight);
}
</style>
```
:::

## API

### 属性

属性 | 说明 | 类型 | 可选值 | 默认值
---|---|---|---|---
type | 图标名称，对应已加载资源中 `icon-` 前缀之后的名称 | `string` | 已加载的图标名称 | -
inherit | 是否使用 SVG 路径的预设 `fill`；为 `false` 时继承文字颜色 | `boolean` | - | `false`
color | 图标颜色，写入根元素的 `color` | `string` | - | -
size | 尺寸，单位 px（`MIcon` 中为 750 稿长度）：`数值` 或 `[外层, 里层]`，每层为 `数值` 或 `[宽, 高]`；不传时跟随 `font-size` | `number \| [number \| [number, number?], (number \| [number, number?])?]` | - | -

`class`、`style`、`aria-label` 等属性透传到根 `<i>` 元素，透传的 `style` 会覆盖 `size`、`color` 生成的同名样式。组件不提供自定义插槽或实例方法。

### 事件

事件名 | 说明 | 回调参数 | 参数说明
---|---|---|---
click | 透传到根 `<i>` 的原生点击监听，并非组件主动派发的自定义事件 | `event` | `MouseEvent`

### IconManager 方法

方法名 | 说明 | 参数 | 返回值
---|---|---|---
load | 加载并合并图标资源；同一 URL 复用加载 Promise，已解析资源使用 localStorage 缓存 | `url: string`，使用 `//` 开头、`.js` 结尾的 Iconfont symbol 资源地址 | `Promise<void>`

加载成功后可通过 `Object.keys(IconManager.icons)` 获取当前图标名称，再传给 `type`。资源中的 symbol ID 应使用 `icon-` 前缀。图标尚未加载时，组件会等待对应名称的资源；切换到尚未加载的名称时，原图形会保留到新图标就绪。

默认资源也依赖网络或已有缓存。资源请求失败（含离线、非 2xx/3xx 状态）时 `load` 返回的 Promise 会拒绝，等待该资源中图标的组件保持空白，直到其他资源提供同名图标。
