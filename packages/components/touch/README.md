## 触摸（Touch）

移动端 touch 手势组件。

### 何时使用

在需要调用touch事件时使用

### 基础用法

:::RUNTIME
```vue
<template>
	<MTouch
		@tap="setEvent('单击')"
		@double-tap="setEvent('双击')"
		@long-tap="setEvent('长按')"
		@move="handleMove"
		@swipe="setEvent('滑动')"
		@swipe-left="setEvent('左滑')"
		@swipe-right="setEvent('右滑')"
		@swipe-up="setEvent('上滑')"
		@swipe-down="setEvent('下滑')"
		@pinch="handlePinch"
		@rotate="handleRotate"
	>
		<div :style="transform">
			<p>事件：{{ eventType }}</p>
			<p>移动：{{ deltaX }}, {{ deltaY }}</p>
			<p>缩放：{{ scale.toFixed(2) }}</p>
			<p>旋转：{{ angle.toFixed(2) }}°</p>
		</div>
	</MTouch>
</template>

<script setup>
import { computed, ref } from 'vue';
import { MTouch } from '@deot/vc';

const eventType = ref('等待手势');
const deltaX = ref(0);
const deltaY = ref(0);
const scale = ref(1);
const angle = ref(0);

const transform = computed(() => ({
	transform: `scale(${scale.value}) rotate(${angle.value}deg)`
}));

const setEvent = (type) => {
	eventType.value = type;
};

const handleMove = (event) => {
	eventType.value = '移动';
	deltaX.value = event.deltaX;
	deltaY.value = event.deltaY;
};

const handlePinch = (event) => {
	eventType.value = '缩放';
	scale.value = Math.max(0.5, scale.value + event.scale);
};

const handleRotate = (event) => {
	eventType.value = '旋转';
	angle.value += event.angle;
};
</script>
```
:::

## API

### 属性

| 属性             | 说明                         | 类型        | 默认值 |
| -------------- | -------------------------- | --------- | --- |
| tag            | 外层标签                       | `string`  | `div` |
| flickThreshold | 触发 swipe 的最小速度，单位 `px/ms` | `number`  | `0.6` |
| prevent        | touchmove 时是否阻止默认事件        | `boolean` | `true` |

### 事件

| 事件名         | 说明           | 参数 |
| ----------- | ------------ | --- |
| tap         | 点击事件         | `TouchEvent` |
| long-tap    | 长按事件         | `TouchEvent` |
| double-tap  | 双击事件         | `TouchEvent` |
| move        | 移动事件         | `{ deltaX: number, deltaY: number }` |
| swipe       | 滑动事件         | `{ deltaX: number, deltaY: number, isFlick: boolean }` |
| swipe-left  | 向左滑动         | `{ deltaX: number, isFlick: boolean }` |
| swipe-right | 向右滑动         | `{ deltaX: number, isFlick: boolean }` |
| swipe-up    | 向上滑动         | `{ deltaY: number, isFlick: boolean }` |
| swipe-down  | 向下滑动         | `{ deltaY: number, isFlick: boolean }` |
| pinch       | 缩放事件         | `{ scale: number }` |
| rotate      | 旋转事件         | `{ angle: number }` |

### Slot

| 名称      | 说明 |
| ------- | -- |
| default | 默认内容 |
