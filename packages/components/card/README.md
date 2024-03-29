## 功能（Card）

各种样式的卡片

### 何时使用

最基础的卡片容器，可承载文字、列表、图片、段落，常用于后台概览页面。

### 基础用法

简单卡片,卡片可以只有内容区域。

:::RUNTIME
```vue
<template>
	<div class="v-card-basic">
		<Card>
			<div>列表内容一</div>
			<div>列表内容二</div>
			<div>列表内容三</div>
			<div>列表内容四</div>
		</Card>
	</div>
</template>
<script setup>
import { Card } from '@deot/vc';
</script>
<style>
.v-card-basic .vc-card {
	width: 300px;
}
</style>
```
:::

### 带标题
标题（通过设置属性`title`）、自定义标题、带图标的标题（通过`icon`控制卡片标题的图标）

:::RUNTIME
```vue
<template>
	<div class="v-card-basic">
		<Card title="标题">
			<div>列表内容一</div>
			<div>列表内容二</div>
			<div>列表内容三</div>
			<div>列表内容四</div>
		</Card>
		<Card>
			<template #title>
				<div>自定义标题</div>
			</template>
			<div>列表内容一</div>
			<div>列表内容二</div>
			<div>列表内容三</div>
			<div>列表内容四</div>
		</Card>
		<Card :icon="'list'" title="带图标的标题" >
			<div>列表内容一</div>
			<div>列表内容二</div>
			<div>列表内容三</div>
			<div>列表内容四</div>
		</Card>
	</div>
</template>
<script setup>
import { Card } from '@deot/vc';
</script>
<style>
.v-card-basic > div {
	margin-bottom: 10px;
}
.v-card-basic .vc-card {
	width: 300px;
}
</style>
```
:::

### 卡片边框及阴影
通过`border`、`shadow`控制卡片的边框和阴影

:::RUNTIME
```vue
<template>
	<div class="v-card-basic">
		<Card >
			<div>默认有边框无阴影卡片</div>
			<div>默认有边框无阴影卡片</div>
			<div>默认有边框无阴影卡片</div>
			<div>默认有边框无阴影卡片</div>
		</Card>
		<Card :border="false" >
			<div>无边框无阴影卡片</div>
			<div>无边框无阴影卡片</div>
			<div>无边框无阴影卡片</div>
			<div>无边框无阴影卡片</div>
		</Card>
		<Card shadow >
			<div>有边框有阴影卡片</div>
			<div>有边框有阴影卡片</div>
			<div>有边框有阴影卡片</div>
			<div>有边框有阴影卡片</div>
		</Card>
		<Card :border="false" shadow >
			<div>无边框有阴影卡片</div>
			<div>无边框有阴影卡片</div>
			<div>无边框有阴影卡片</div>
			<div>无边框有阴影卡片</div>
		</Card>
	</div>
</template>
<script setup>
import { Card } from '@deot/vc';
</script>
<style>
.v-card-basic > div {
	margin-bottom: 15px;
}
.v-card-basic .Card {
	width: 300px;
}
</style>
```
:::

### 卡片间距
通过 `padding` 控制卡片内部间距，单位 px （默认：16）

:::RUNTIME
```vue
<template>
	<div class="v-card-basic">
		<Card title="默认间距卡片">
			<div>列表内容一</div>
			<div>列表内容二</div>
			<div>列表内容三</div>
			<div>列表内容四</div>
		</Card>
		<Card title="自定义间距卡片" :padding="30">
			<div>列表内容一</div>
			<div>列表内容二</div>
			<div>列表内容三</div>
			<div>列表内容四</div>
		</Card>
	</div>
</template>
<script setup>
import { Card } from '@deot/vc';
</script>
<style>
.v-card-basic > div {
	margin-bottom: 10px;
}
.v-card-basic .Card {
	width: 300px;
}
</style>
```
:::

### 额外内容
额外显示的内容，默认位置在右上角

:::RUNTIME
```vue
<template>
	<div class="v-card-basic">
		<Card title="默认间距卡片">
			<template #extra>
				<div style="color: orange;cursor: pointer;">操作</div>
			</template>
			<div>列表内容一</div>
			<div>列表内容二</div>
			<div>列表内容三</div>
			<div>列表内容四</div>
		</Card>
	</div>
</template>
<script setup>
import { Card } from '@deot/vc';
</script>
<style>
.v-card-basic .Card {
	width: 300px;
}
</style>
```
:::

## API

### 基础属性

| 属性      | 说明                | 类型        | 可选值 | 默认值     |
| ------- | ----------------- | --------- | --- | ------- |
| border  | 是否显示边框，建议在灰色背景下使用 | `boolean` | -   | `true`  |
| shadow  | 卡片阴影，建议在灰色背景下使用   | `boolean` | -   | `false` |
| padding | 卡片内部间距，单位 px      | `number`  | -   | `16`    |
| title   | 标题                | `string`  | -   | -       |
| icon    | 标题前的图标            | `string`  | -   | -       |


### Slot

| 属性    | 说明                            |
| ----- | ----------------------------- |
| title | 自定义卡片标题，如果是简单文字，可以使用`<p>`标签包裹 |
| extra | 额外显示的内容，默认位置在右上角              |
