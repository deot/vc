## 卡片（Card）

承载标题、操作和主体内容的基础容器。`MCard` 是 `Card` 的移动端入口别名，两者使用相同的属性和插槽。

### 何时使用

- 将一组相关信息组织在独立容器中。
- 为内容提供可选标题、右上角操作、边框或阴影。

### 基础用法

Card 默认显示边框，主体区域的内边距为 `16px`。

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
	<Card class="card-demo">
		<div class="card-demo__content">
			<strong>本周概览</strong>
			<span>已完成 24 项任务</span>
			<span>还有 6 项任务待处理</span>
		</div>
	</Card>
</template>

<script setup>
import { Card } from '@deot/vc';
</script>

<style scoped>
.card-demo {
	max-width: 360px;
}

.card-demo__content {
	display: grid;
	gap: 8px;
}

.card-demo__content span {
	color: var(--vc-card-color-dark-light, var(--vc-color-dark-light));
}
</style>
```
:::

### 标题与额外内容

通过 `title` 设置文字标题，或使用 `title` 插槽完全自定义标题；`extra` 插槽显示在右上角。提供 `title` 插槽时，不再渲染 `title` 和 `icon`。

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
	<div class="card-demo-list">
		<Card title="订单信息">
			<template #extra>
				<a class="card-demo-link" href="#">查看全部</a>
			</template>
			<div>订单编号：VC-2026</div>
			<div>订单状态：已完成</div>
		</Card>
		<Card>
			<template #title>
				<strong>自定义标题</strong>
			</template>
			<div>标题插槽可以承载任意内容。</div>
		</Card>
	</div>
</template>

<script setup>
import { Card } from '@deot/vc';
</script>

<style scoped>
.card-demo-list {
	display: grid;
	max-width: 360px;
	gap: 12px;
}

.card-demo-link {
	color: var(--vc-color-primary);
	text-decoration: none;
}

.card-demo-link:hover {
	color: var(--vc-color-primary-light);
	text-decoration: underline;
}
</style>
```
:::

### 边框与阴影

`border` 控制边框，`shadow` 控制静态阴影。未启用 `shadow` 时，Card 在 hover 状态下显示悬浮阴影。

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
	<div class="card-demo-controls">
		<div class="card-demo-actions">
			<Button @click="handleToggleBorder">
				{{ isBorder ? '隐藏边框' : '显示边框' }}
			</Button>
			<Button @click="handleToggleShadow">
				{{ isShadow ? '关闭阴影' : '开启阴影' }}
			</Button>
		</div>
		<Card :border="isBorder" :shadow="isShadow">
			<div class="card-demo-status">
				<span>边框：{{ isBorder ? '开启' : '关闭' }}</span>
				<span>阴影：{{ isShadow ? '开启' : '关闭' }}</span>
			</div>
		</Card>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, Card } from '@deot/vc';

const isBorder = ref(true);
const isShadow = ref(false);

const handleToggleBorder = () => {
	isBorder.value = !isBorder.value;
};

const handleToggleShadow = () => {
	isShadow.value = !isShadow.value;
};
</script>

<style scoped>
.card-demo-controls {
	display: grid;
	max-width: 360px;
	gap: 12px;
}

.card-demo-actions {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 8px;
}

.card-demo-status {
	display: flex;
	flex-wrap: wrap;
	gap: 8px 16px;
}
</style>
```
:::

### 主体间距

通过 `padding` 设置主体区域的内边距，单位为 `px`。

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
	<div class="card-demo-controls">
		<div class="card-demo-actions">
			<Button @click="handleDecreasePadding" :disabled="padding <= 8">缩小间距</Button>
			<Button @click="handleIncreasePadding" :disabled="padding >= 40">增大间距</Button>
		</div>
		<Card title="可调节间距" :padding="padding">
			当前主体内边距：{{ padding }}px
		</Card>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, Card } from '@deot/vc';

const padding = ref(16);

const handleDecreasePadding = () => {
	padding.value -= 4;
};

const handleIncreasePadding = () => {
	padding.value += 4;
};
</script>

<style scoped>
.card-demo-controls {
	display: grid;
	max-width: 360px;
	gap: 12px;
}

.card-demo-actions {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 8px;
}
</style>
```
:::

## API

### Card 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| border | 是否显示边框 | `boolean` | - | `true` |
| shadow | 是否显示静态阴影 | `boolean` | - | `false` |
| padding | 主体区域的内边距，单位为 `px` | `number` | - | `16` |
| title | 标题文本 | `string` | - | - |
| icon | 文字标题前的图标类型；提供 `title` 插槽时不生效 | `string` | - | - |

### Card 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 卡片主体内容 | - |
| title | 自定义标题；优先于 `title` 和 `icon` | - |
| extra | 右上角的额外内容 | - |
