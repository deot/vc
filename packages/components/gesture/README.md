## 手势（Gesture）

基于 Pointer Events 识别点按、双击、长按、拖动、快速滑动、双指缩放与旋转，以及滚轮。鼠标、触摸和笔共用一套识别。不需要额外元素时，可直接使用 `@deot/vc-hooks` 的 `useGesture`。

移动端入口导出的 `MGesture` 与 `Gesture` 是同一实现；触屏上的双击、双指缩放与旋转见 [移动端](#移动端)。

### 何时使用

需要在一块区域里监听手势，并由业务代码更新位置、缩放或旋转状态时使用。组件只提供事件，不会自动移动或变换内容。

### 基础用法

用鼠标或触屏操作下方区域：单击（`tap`）、双击（`double-tap`）、长按（`long-tap`）、拖动（`move`）、快速滑动（`swipe`）；触屏上可以双指缩放（`pinch-start`、`pinch`）和旋转（`rotate`），鼠标可以用滚轮（`wheel`）缩放。

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
	<Gesture
		class="gesture-demo"
		@tap="handleSetEvent('单击')"
		@double-tap="handleSetEvent('双击')"
		@long-tap="handleSetEvent('长按')"
		@move="handleMove"
		@swipe="handleSwipe"
		@pinch-start="handlePinchStart"
		@pinch="handlePinch"
		@rotate="handleRotate"
		@wheel="handleWheel"
	>
		<div class="gesture-demo__content" :style="transform">
			<p class="gesture-demo__result">事件：{{ eventType }}</p>
			<p class="gesture-demo__result">缩放：{{ scale.toFixed(2) }}</p>
			<p class="gesture-demo__result">旋转：{{ angle.toFixed(2) }}°</p>
		</div>
	</Gesture>
</template>

<script setup>
import { computed, ref } from 'vue';
import { Gesture } from '@deot/vc';

const eventType = ref('等待手势');
const x = ref(0);
const y = ref(0);
const scale = ref(1);
const angle = ref(0);
let base = 1;

const transform = computed(() => ({
	transform: `translate(${x.value}px, ${y.value}px) scale(${scale.value}) rotate(${angle.value}deg)`
}));

const handleSetEvent = (type) => {
	eventType.value = type;
};

const handleMove = (e) => {
	eventType.value = '移动';
	x.value += e.deltaX;
	y.value += e.deltaY;
};

const handleSwipe = (e) => {
	eventType.value = `滑动：${e.direction}`;
};

const handlePinchStart = () => {
	base = scale.value;
};

const handlePinch = (e) => {
	eventType.value = '缩放';
	scale.value = Math.max(0.5, base * e.scale);
};

const handleRotate = (e) => {
	eventType.value = '旋转';
	angle.value += e.angle;
};

const handleWheel = (e) => {
	eventType.value = '滚轮';
	scale.value = Math.max(0.5, scale.value * Math.exp(-e.deltaY * 0.002));
};
</script>

<style scoped>
.gesture-demo {
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 280px;
	overflow: hidden;
	border: 1px dashed var(--vc-color-light-deeper);
}

.gesture-demo__content {
	display: flex;
	flex-direction: column;
	gap: 8px;
	text-align: center;
}

.gesture-demo__result {
	margin: 0;
}
</style>
```
:::

### 阈值与忽略区域

`threshold` 设置越过多少 px 才算移动，`flickThreshold` 设置 `swipe` 的速度阈值（px/ms）；`ignore` 指定的元素上按下时不识别手势，下例中的按钮可以正常点击。`move-start`、`move-end` 在移动开始、结束时触发，`swipe-left`、`swipe-right`、`swipe-up`、`swipe-down` 与 `swipe` 同时按方向触发。`tag` 设置外层标签。

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
	<div class="gesture-demo">
		<Gesture
			tag="section"
			class="gesture-demo__area"
			:threshold="24"
			:flick-threshold="1"
			ignore="button"
			@move-start="handleMoveStart"
			@move-end="handleMoveEnd"
			@swipe-left="handleSwipe('左')"
			@swipe-right="handleSwipe('右')"
			@swipe-up="handleSwipe('上')"
			@swipe-down="handleSwipe('下')"
		>
			<span>拖动超过 24px 才算移动，快速滑动大于 1px/ms 才算 swipe</span>
			<Button size="small" @click="handleClick">按钮不识别手势</Button>
		</Gesture>
		<p class="gesture-demo__result">{{ result }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, Gesture } from '@deot/vc';

const result = ref('等待手势');

const handleMoveStart = (e) => {
	result.value = `移动开始，主轴 ${e.axis}`;
};

const handleMoveEnd = (e) => {
	result.value = `移动结束，位移 ${Math.round(e.offsetX)}, ${Math.round(e.offsetY)}${e.canceled ? '（已取消）' : ''}`;
};

const handleSwipe = (direction) => {
	result.value = `向${direction}滑动`;
};

const handleClick = () => {
	result.value = '点击了按钮';
};
</script>

<style scoped>
.gesture-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.gesture-demo__area {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 8px;
	min-height: 200px;
	border: 1px dashed var(--vc-color-light-deeper);
}

.gesture-demo__result {
	margin: 0;
}
</style>
```
:::

### 保留原生滚动

`prevent` 默认为 `true`，区域内设置 `touch-action: none`，滚轮时阻止页面滚动。设为 `false` 后保留原生滚动，适合只关心点按、横向滑动等手势的区域。

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
	<div class="gesture-demo">
		<Gesture :prevent="false" class="gesture-demo__scroll" @tap="handleTap">
			<p v-for="i in 12" :key="i" class="gesture-demo__line">第 {{ i }} 行，区域可原生滚动</p>
		</Gesture>
		<p class="gesture-demo__result">tap {{ count }} 次</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Gesture } from '@deot/vc';

const count = ref(0);

const handleTap = () => {
	count.value++;
};
</script>

<style scoped>
.gesture-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.gesture-demo__scroll {
	height: 160px;
	padding: 0 16px;
	overflow: auto;
	border: 1px dashed var(--vc-color-light-deeper);
}

.gesture-demo__line,
.gesture-demo__result {
	margin: 0;
	line-height: 32px;
}
</style>
```
:::

## 移动端

`MGesture` 与 `Gesture` 是同一实现，属性、事件相同。触摸和笔的 `tap` 在监听了 `double-tap` 时延迟 300 ms 确认；双指按下时触发 `pinch-start`，移动时触发 `pinch` 与 `rotate`，任一手指抬起时触发 `pinch-end`。在触屏设备上打开下方预览，可以拖动、双击复位、双指缩放与旋转卡片。

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
	<div class="m-gesture-demo">
		<MGesture
			class="m-gesture-demo__area"
			@double-tap="handleReset"
			@move="handleMove"
			@pinch-start="handlePinchStart"
			@pinch="handlePinch"
			@pinch-end="handlePinchEnd"
			@rotate="handleRotate"
		>
			<div class="m-gesture-demo__card" :style="transform">卡片</div>
		</MGesture>
		<p class="m-gesture-demo__result">{{ result }}</p>
	</div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { MGesture } from '@deot/vc';

const x = ref(0);
const y = ref(0);
const scale = ref(1);
const angle = ref(0);
const result = ref('拖动、双击复位、双指缩放与旋转');
let base = 1;

const transform = computed(() => ({
	transform: `translate(${x.value}px, ${y.value}px) scale(${scale.value}) rotate(${angle.value}deg)`
}));

const handleReset = () => {
	x.value = 0;
	y.value = 0;
	scale.value = 1;
	angle.value = 0;
	result.value = '已复位';
};

const handleMove = (e) => {
	x.value += e.deltaX;
	y.value += e.deltaY;
};

const handlePinchStart = () => {
	base = scale.value;
};

const handlePinch = (e) => {
	scale.value = Math.max(0.5, base * e.scale);
};

const handlePinchEnd = (e) => {
	result.value = `缩放结束：${e.scale.toFixed(2)}`;
};

const handleRotate = (e) => {
	angle.value += e.angle;
};
</script>

<style scoped>
.m-gesture-demo {
	display: flex;
	flex-direction: column;
	gap: calc(var(--vc-rem) * 32);
}

.m-gesture-demo__area {
	display: flex;
	align-items: center;
	justify-content: center;
	height: calc(var(--vc-rem) * 560);
	overflow: hidden;
	background: var(--vc-color-light-deeper);
}

.m-gesture-demo__card {
	width: calc(var(--vc-rem) * 240);
	color: #fff;
	font-size: calc(var(--vc-rem) * 28);
	line-height: calc(var(--vc-rem) * 160);
	text-align: center;
	background: var(--vc-color-primary);
}

.m-gesture-demo__result {
	margin: 0;
	padding-inline: calc(var(--vc-rem) * 32);
	font-size: calc(var(--vc-rem) * 28);
}
</style>
```
:::

## API

### 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| tag | 外层 HTML 标签 | `string` | - | `div` |
| prevent | 区域内设置 `touch-action: none` 与 `user-select: none`，滚轮时阻止页面滚动；需要保留原生滚动时设为 false | `boolean` | - | `true` |
| threshold | 越过该距离（px）才算移动，未越过时视为点按 | `number` | - | `8` |
| flickThreshold | swipe 的速度阈值，单位 px/ms；松开前的速度必须严格大于该值 | `number` | - | `0.6` |
| ignore | 从匹配该选择器的元素按下时不识别手势，如 `'button, a, input'` | `string` | - | - |

### 事件

坐标 `x`、`y`、`center` 均相对组件根节点，`event` 为原生事件。

| 事件名 | 说明 | 回调参数 |
| --- | --- | --- |
| tap | 没有越过 `threshold` 的点按。鼠标立即触发。监听了 double-tap 时，触摸和笔延迟 300 ms 确认，双击时不触发 | `{ x, y, pointerType, target, event }` |
| double-tap | 触摸或笔在 300 ms 内、相距 30 px 内的两次点按。鼠标单击不进入这个窗口 | 同 tap |
| long-tap | 按住 800 ms 未移动；触发后松开不再触发 tap | 同 tap |
| move-start | 单指越过 `threshold`，`axis` 为位移较大的轴，`target` 为按下时的元素 | `{ axis: 'x' \| 'y', target, offsetX, offsetY, pointerType, event }` |
| move | 单指移动 | `{ x, y, deltaX, deltaY, offsetX, offsetY, pointerType, event }` |
| move-end | 移动后松开；`canceled` 为 true 表示被系统取消或转为双指 | `{ offsetX, offsetY, velocityX, velocityY, canceled, pointerType, event }` |
| swipe | 移动后松开，且速度大于 `flickThreshold` | `{ direction, offsetX, offsetY, velocityX, velocityY, pointerType, event }` |
| swipe-left / swipe-right / swipe-up / swipe-down | 与 swipe 同时触发，按位移较大的轴区分方向 | 同 swipe |
| pinch-start | 第二根手指按下 | `{ scale: 1, center, event }` |
| pinch | 双指移动；`scale` 为当前双指距离除以起始距离 | `{ scale, center, event }` |
| pinch-end | 任一手指抬起 | `{ scale, center, event }` |
| rotate | 双指移动时的旋转变化，相对上一次的角度差，单位为度，顺时针为正 | `{ angle, event }` |
| wheel | 滚轮；`deltaX`、`deltaY` 按 `deltaMode` 换算为像素 | `{ x, y, deltaX, deltaY, event }` |

### 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 手势区域内容 | - |

### 实例方法

| 方法名 | 说明 | 参数 |
| --- | --- | --- |
| cancel | 丢弃当前手势与计时器，不再触发后续事件 | - |

### useGesture

`useGesture(options)` 返回 `{ listeners, cancel }`。把 `listeners` 绑到元素上即可；回调名与事件对应（`tap`、`doubleTap`、`longTap`、`moveStart`、`move`、`moveEnd`、`swipe`、`pinchStart`、`pinch`、`pinchEnd`、`rotate`、`wheel`），阈值选项与组件属性一致。回调在触发时读取，可以写成 getter。传入 `doubleTap` 后，触摸和笔的 tap 才会延迟 300 ms 确认，鼠标单击仍然立即触发；另可传 `immediateTap: (e) => boolean`，返回 `true` 时这次点按不等双击窗口立即触发 tap（如点蒙层立即关闭）。传入 `wheel` 才会监听滚轮，`prevent: false` 时滚轮不阻止默认滚动。元素需要自行设置 `touch-action`。

```js
import { h } from 'vue';
import { useGesture } from '@deot/vc-hooks';

export default {
	setup() {
		const offset = { x: 0, y: 0 };
		const gesture = useGesture({
			ignore: 'button',
			move: ({ deltaX, deltaY }) => {
				offset.x += deltaX;
				offset.y += deltaY;
			}
		});
		return () => h('div', { style: 'touch-action: none', ...gesture.listeners });
	}
};
```
