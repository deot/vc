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
	<div class="v-icon-basic">
		<Icon type="success" aria-label="成功" role="img" />
		<Icon type="error" aria-label="失败" role="img" />
	</div>
</template>

<script setup>
import { Icon } from '@deot/vc';
</script>
<style scoped>
.v-icon-basic {
	display: flex;
	gap: 24px;
	font-size: 30px;
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
	<div>
		<label><input v-model="inherit" type="checkbox"> 使用图标预设色</label>
		<p v-if="!items.length">{{ status }}</p>
		<div class="icon-gallery">
			<div v-for="item in items" :key="item" class="icon-gallery-item">
				<Icon :type="item" :inherit="inherit" aria-hidden="true" />
				<span>{{ item }}</span>
			</div>
		</div>
	</div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { Icon, IconManager } from '@deot/vc';

const items = ref([]);
const inherit = ref(false);
const status = ref('正在加载图标资源…');

onMounted(async () => {
	try {
		await IconManager.load('//at.alicdn.com/t/font_1119857_u0f4525o6sd.js');
		items.value = Object.keys(IconManager.icons).sort();
		status.value = '暂无图标';
	} catch {
		status.value = '图标资源加载失败';
	}
});
</script>
<style scoped>
.icon-gallery {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
	gap: 24px;
	margin-top: 24px;
}
.icon-gallery-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12px;
	text-align: center;
	overflow-wrap: anywhere;
}
.icon-gallery-item > .vc-icon {
	font-size: 30px;
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
