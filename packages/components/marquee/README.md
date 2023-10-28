## 文字轮播（Marquee）
文字滚动

### 何时使用
在一小块内容展示通知类的信息时使用。

### 基础用法
支持传值和插槽，不超出内容区域时默认不轮播。

:::RUNTIME
```vue
<template>
	<div class="v-marquee-basic">
		<Marquee
			class="_normal"
		>
			<span>{{ text }}</span>
		</Marquee>
		<Marquee
			:content="text"
			class="_normal"
		/>
		<Marquee
			:content="text.repeat(3)"
			class="_normal"
		/>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Marquee } from '@deot/vc';

const text = ref('ABCDEFG');
</script>
<style>
.v-marquee-basic > ._normal {
	width: 100px;
	background: #f6f8fa;
	margin-bottom: 10px;
}
</style>
```
:::

### 自动滚动
设置`autoplay`未超出一屏时自动滚动。

:::RUNTIME
```vue
<template>
	<div class="v-marquee-autoplay">
		<Marquee
			:content="text"
			autoplay
			class="_normal"
		/>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Marquee } from '@deot/vc';

const text = ref('ABCDEFG');
</script>
<style>
.v-marquee-autoplay > ._normal {
	width: 100px;
	background: #f6f8fa;
	margin-bottom: 10px;
}
</style>
```
:::

### 动画
通过`animated`控制滚动暂停。

:::RUNTIME
```vue
<template>
	<div class="v-marquee-animated">
		<Marquee
			:content="text.repeat(3)"
			class="_normal"
			:animated="animated"
		/>
		<div>
			<Button @click="handleClick">切换滚动状态</Button>
		</div>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Marquee, Button } from '@deot/vc';


const text = ref('ABCDEFG');
const animated = ref(true);

const handleClick = () => {
	animated.value = !animated.value;
};
</script>
<style>
.v-marquee-animated > ._normal {
	width: 100px;
	background: #f6f8fa;
	margin-bottom: 10px;
}
</style>
```
:::

### 速度
通过设置`speed`控制每秒移动多少px。

:::RUNTIME
```vue
<template>
	<div class="v-marquee-basic">
		<Marquee
			:content="text.repeat(3)"
			:speed="100"
			class="_normal"
		/>
		<Marquee
			:content="text"
			autoplay
			:speed="500"
			class="_normal"
		/>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Marquee } from '@deot/vc';

const text = ref('ABCDEFG');
</script>
<style>
.v-marquee-basic > ._normal {
	width: 100px;
	background: #f6f8fa;
	margin-bottom: 10px;
}
</style>
```
:::

## API

### 属性

| 属性       | 说明               | 类型                  | 可选值 | 默认值     |
| -------- | ---------------- | ------------------- | --- | ------- |
| speed    | 速度计算（如：每秒移动50px） | `number`            | -   | 50      |
| content  | 内容               | `string`、`Function` | -   | -       |
| animated | 动画               | `boolean`           | -   | `true`  |
| autoplay | 未超出一屏时是否滚动       | `boolean`           | -   | `false` |


### Slot
属性 | 说明
---|---
default | -
