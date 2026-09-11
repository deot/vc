## 图标（Icon）

通过图标名称展示 SVG，支持继承文字颜色或使用图标预设色。`MIcon` 是 `Icon` 的别名，属性和行为相同。

### 何时使用

用于辅助表达操作、状态或内容类型。图标作为操作入口时，可放在具有可访问名称的按钮中。

### 基础用法

通过 `type` 指定图标名称，通过 CSS `font-size` 调整大小。SVG 的宽高为 `1em`，默认通过 `currentColor` 继承文字颜色。

:::playground
<!--
<config lang="json5">
{ previewInset: 24 }
</config>
-->
```vue
<template>
	<div class="icon-basic-demo">
		<div class="icon-basic-preview" :style="{ color: iconColor, fontSize: `${iconSize}px` }">
			<Icon type="success" aria-label="成功" role="img" />
			<Icon type="error" aria-label="失败" role="img" />
		</div>
		<div class="icon-basic-controls">
			<div class="icon-basic-control">
				<span>图标大小</span>
				<Slider v-model="iconSize" :min="16" :max="64" />
				<output>{{ iconSize }}px</output>
			</div>
			<div class="icon-basic-control icon-basic-color">
				<span>图标颜色</span>
				<ColorPicker v-model="iconColor" />
				<output>{{ iconColor }}</output>
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { ColorPicker, Icon, Slider } from '@deot/vc';

const iconSize = ref(32);
const iconColor = ref('#456CF6');
</script>
<style scoped>
.icon-basic-demo {
	display: grid;
	gap: 24px;
}
.icon-basic-preview {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 24px;
	min-height: 120px;
	background: var(--vc-background-color);
	border-radius: var(--vc-border-radius);
}
.icon-basic-controls {
	display: grid;
	gap: 16px;
}
.icon-basic-control {
	display: grid;
	grid-template-columns: 72px minmax(0, 1fr) 56px;
	align-items: center;
	gap: 12px;
}
.icon-basic-control > output {
	color: var(--vc-color-dark-lightest);
	font-size: 13px;
	text-align: right;
}
.icon-basic-color {
	grid-template-columns: 72px auto minmax(96px, 1fr);
}
.icon-basic-color > output {
	text-align: left;
}
</style>
```
:::

### 图标集合与预设色

组件会异步加载默认图标资源。下面等待同一资源加载完成，再读取已加载的图标名称。打开预设色后，路径使用资源中的 `fill`；没有预设色的路径仍继承文字颜色。

:::playground
<!--
<config lang="json5">
{ previewInset: 24 }
</config>
-->
```vue
<template>
	<div class="icon-gallery-demo">
		<div class="icon-gallery-toolbar">
			<Checkbox v-model="isInherit">使用图标预设色</Checkbox>
			<span class="icon-gallery-tip">点击图标复制名称</span>
		</div>
		<p class="icon-gallery-status" role="status">
			{{ copiedIcon ? '已复制：' + copiedIcon : status }}
		</p>
		<div class="icon-gallery">
			<Clipboard
				v-for="item in items"
				:key="item"
				class="icon-gallery-item"
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
.icon-gallery-demo {
	color: var(--vc-foreground-color);
}
.icon-gallery-toolbar {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: 12px 24px;
	padding: 4px 0 16px;
	border-bottom: 1px solid var(--vc-color-light-deeper);
}
.icon-gallery-tip,
.icon-gallery-status {
	color: var(--vc-color-dark-lightest);
	font-size: 13px;
}
.icon-gallery-status {
	min-height: 20px;
	margin: 12px 0 0;
}
.icon-gallery {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(112px, 1fr));
	gap: 12px;
	margin-top: 12px;
}
.icon-gallery-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 12px;
	min-height: 104px;
	padding: 16px 10px;
	color: inherit;
	font: inherit;
	text-align: center;
	background: var(--vc-background-color-light);
	border: 1px solid var(--vc-color-light-deeper);
	border-radius: var(--vc-border-radius);
	cursor: pointer;
	overflow-wrap: anywhere;
	transition: border-color .2s, box-shadow .2s, transform .2s;
}
.icon-gallery-item:hover,
.icon-gallery-item:focus-visible {
	border-color: var(--vc-color-primary);
	box-shadow: var(--vc-border-shadow);
	transform: translateY(-2px);
}
.icon-gallery-item:focus-visible {
	outline: 2px solid var(--vc-color-primary-lighter);
	outline-offset: 2px;
}
.icon-gallery-item > :deep(.vc-icon) {
	font-size: 32px;
}
.icon-gallery-item > span {
	font-size: 12px;
	line-height: 18px;
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

`class`、`style`、`aria-label` 等属性透传到根 `<i>` 元素。组件不提供自定义插槽或实例方法。

### 事件

事件名 | 说明 | 回调参数 | 参数说明
---|---|---|---
click | 透传到根 `<i>` 的原生点击监听，并非组件主动派发的自定义事件 | `event` | `MouseEvent`

### IconManager 方法

方法名 | 说明 | 参数 | 返回值
---|---|---|---
load | 加载并合并图标资源；同一 URL 复用加载 Promise，已解析资源使用 localStorage 缓存 | `url: string`，使用 `//` 开头、`.js` 结尾的 Iconfont symbol 资源地址 | `Promise<void>`

加载成功后可通过 `Object.keys(IconManager.icons)` 获取当前图标名称，再传给 `type`。资源中的 symbol ID 应使用 `icon-` 前缀。图标尚未加载时，组件会等待对应名称的资源；切换到尚未加载的名称时，原图形会保留到新图标就绪。

默认资源也依赖网络或已有缓存。当前加载器不会对所有网络失败主动 reject，因此离线或资源不可达时可能持续等待。
