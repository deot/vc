## 触摸（Touch）

封装原生触摸事件，识别点按、长按、滑动及双指缩放、旋转手势。`Touch` 与 `MTouch` 为同一实现，均可从 `@deot/vc` 导入。

### 何时使用

需要在触摸区域监听手势，并由业务代码更新位置、缩放或旋转状态时使用。组件只提供事件，不会自动移动或变换内容；鼠标点击、拖拽不会触发这些手势。

### 基础用法

在触摸设备或浏览器触摸模拟模式下操作下方区域。单指尝试点按、长按和快速滑动，双指尝试缩放和旋转。

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
	<MTouch
		class="touch-demo"
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
		<div class="touch-demo__content" :style="transform">
			<p>事件：{{ eventType }}</p>
			<p>本次移动增量：{{ deltaX }}, {{ deltaY }}</p>
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

<style scoped>
.touch-demo {
	display: flex;
	min-height: 280px;
	align-items: center;
	justify-content: center;
	overflow: hidden;
	border: 1px dashed currentcolor;
	user-select: none;
}

.touch-demo__content {
	text-align: center;
}
</style>
```
:::

## API

### 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| tag | 外层 HTML 标签 | `string` | - | `div` |
| flickThreshold | swipe 的速度阈值，单位 px/ms；速度必须严格大于该值，且满足位移条件 | `number` | - | `0.6` |
| prevent | 是否在 touchmove 时调用 preventDefault；需要允许页面原生滚动时可设为 false | `boolean` | - | `true` |

### 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| tap | 未判定为 swipe 且持续时间小于 500 ms 时，在结束时触发 | `event: TouchEvent` | 原生 touchend 事件 |
| long-tap | 单指触摸开始 800 ms 后触发；单指移动、结束或取消会清除计时 | `event: TouchEvent` | 原生 touchstart 事件 |
| double-tap | 两次单指触摸开始间隔小于 300 ms，且起点横、纵距离均小于 60 px 时触发 | `event: TouchEvent` | 第二次 touchstart 事件 |
| move | 单指移动 | `data: { deltaX: number, deltaY: number }` | 相邻两次 touchmove 的位移差，单位 px；首次均为 0 |
| swipe | 满足距离与速度条件的滑动，在结束时触发 | `data: { deltaX: number, deltaY: number, isFlick: boolean }` | 从起点到最后一次单指移动位置的总位移；触发时 isFlick 为 true |
| swipe-left | 向左滑动 | `data: { deltaX: number, isFlick: boolean }` | deltaX 为负，isFlick 为 true |
| swipe-right | 向右滑动 | `data: { deltaX: number, isFlick: boolean }` | deltaX 为正，isFlick 为 true |
| swipe-up | 向上滑动 | `data: { deltaY: number, isFlick: boolean }` | deltaY 为负，isFlick 为 true |
| swipe-down | 向下滑动 | `data: { deltaY: number, isFlick: boolean }` | deltaY 为正，isFlick 为 true |
| pinch | 双指移动时的缩放变化 | `data: { scale: number }` | 组件计算的比例差值，不是可直接赋给 CSS scale 的绝对倍率，详见下方说明 |
| rotate | 双指移动时的旋转变化 | `data: { angle: number }` | 相对上一次双指向量的角度差，单位为度；顺时针为正，可累加使用 |

### 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 触摸区域内容 | - |

### 手势说明

- swipe 要求横向或纵向总位移严格大于 60 px，且总位移的欧氏距离除以持续时间严格大于 `flickThreshold`；结束事件的 `changedTouches` 数量不能大于 1。触发 swipe 后，按位移较大的轴触发一个方向事件；两轴相等时使用纵向。
- tap 并不要求完全没有移动：未达到 swipe 条件的短触摸仍可能触发 tap。double-tap 在第二次触摸开始时触发，不会抑制两次结束时的 tap；它根据相邻触摸起点判断，不要求前一次已触发 tap。
- pinch 使用双指开始时的距离作为基准。当前距离大于基准时，取「当前距离 / 基准距离」减去上一次比例；否则取上一次比例减去「基准距离 / 当前距离」。上一次比例初始为 1，每次计算后更新。示例将该差值累加到业务缩放状态；它不是标准的相邻距离倍率，跨越基准距离时尤其需要留意这一计算方式。
- `prevent` 默认阻止触摸移动的浏览器默认行为，可能影响区域内的页面滚动。Touch 没有默认尺寸或配色，触摸区域的布局与视觉样式由调用方提供。
