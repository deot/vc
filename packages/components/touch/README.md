## 触摸（Touch）
移动端touch组件

### 何时使用

在需要调用touch事件时使用

### 基础用法

仅支持移动端使用

:::RUNTIME
```vue
<template>
	<div>
		<MTouch
			@tap="handleTap"
			@double-tap="handleDoubleTap"
			@long-tap="handleLongTap"
			@swipe="handleSwipe"
			@swipe-up="handleSwipeUp"
			@swipe-right="handleSwipeRight"
			@swipe-down="handleSwipeDown"
			@swipe-left="handleSwipeLeft"
			@move="handleMove"
			@pinch="handlePinch"
			@rotate="handleRotate"
		>
			<div
				:style="transform"
				style="padding:24px;background: #f2f2f2;width: 320px; height: 640px; display: flex;flex-direction: column; justify-content: center"
			>
				<p>
					事件类型：{{ eventType }}
				</p>
				<p>
					旋转角度：{{ angle }}
				</p>
			</div>
		</MTouch>
	</div>
</template>
<script setup>
import { ref, computed } from 'vue';
import { MTouch } from '@deot/vc';

const eventType = ref("单机，双击，长按，滑动，上滑，下滑，左滑，右滑，旋转，缩放");
const scale = ref(1);
const angle = ref(0);

const transform = computed(() => {
	return {
		transform: `scale(${this.scale}) rotate(${this.angle}deg)`
	};
}):
/**
 * 单击执行
 */
const handleTap = (e) => {
	eventType.value = "单机";
};
/**
 * 双击执行
 */
const handleDoubleTap = (e) => {
	eventType.value = "双击";
};
/**
 * 长按执行
 */
const handleLongTap = (e) => {
	eventType.value = "长按";
};
/**
 * 只要滑动都会执行
 */
const handleSwipe = (e) => {
	eventType.value = "只要滑动都会执行";
};
/**
 * 上滑
 */
const handleSwipeUp = (e) => {
	eventType.value = "上滑";
};
/**
 * 右滑
 */
const handleSwipeRight = (e) => {
	eventType.value = "右滑";
};
/**
 * 下滑
 */
const handleSwipeDown = (e) => {
	eventType.value = "下滑";
};
/**
 * 左滑
 */
const handleSwipeLeft = (e) => {
	eventType.value = "左滑";
};
/**
 * 滑动执行的函数
 */
const handleMove = (e) => {

};
/**
 * 缩放
 */
const handlePinch = ({ scale }) => {
	eventType.value = "缩放";
	scale.value += scale;
};
/**
 * 旋转
 */
const handleRotate = ({ angle }) => {
	eventType.value = "旋转";
	angle.value += angle;
};
</script>
```
:::

## API

### 属性

| 属性             | 说明              | 类型        | 可选值                    | 默认值    |
| -------------- | --------------- | --------- | ---------------------- | ------ |
| tag            | 外层标签            | `String`  | `div`、`span`、`p`、`***` | `div`  |
| flickThreshold | 每毫秒的运动轨迹，单位`px` | `number`  | -                      | 0.6    |
| prevent        | 是否阻止冒泡事件        | `boolean` | -                      | `true` |


### 事件
| 事件名         | 说明           | 参数                                                      | 返回值                                                                          |
| ----------- | ------------ | ------------------------------------------------------- | ---------------------------------------------------------------------------- |
| tap         | 点击事件         | `(e: Event) => void`                                    | `e`：事件对象                                                                     |
| long-tap    | 长按事件         | `(e: Event) => void`                                    | `e`：事件对象                                                                     |
| double-tap  | 双击事件         | `(e: Event) => void`                                    | `e`：事件对象                                                                     |
| pinch       | 缩放事件         | `({ scale: number }) => void`                           | `scale`：缩放的比例                                                                |
| rotate      | 旋转事件         | `({ angle: number }) => void`                           | `angle`：旋转角度                                                                 |
| move        | 滑动事件         | `({ deltaX: number, deltaY }) => void`                  | `deltaX`：滑动的X轴距离位置；`deltaY`：滑动的Y轴距离位置                                        |
| swipe       | 滑动事件，无论哪一种类型 | `({ deltaX: number, deltaY, isFlick: number }) => void` | `deltaX`,`deltaY`：滑动的X轴和Y轴距离位置；`isFlick`：事件执行的实际每毫秒的运动轨迹是否超过`flickThreshold` |
| swipe-left  | 向左滑动         | `({ deltaX: number, isFlick: number }) => void`         | `deltaX`：向左滑动的距离；`isFlick`：事件执行的实际每毫秒的运动轨迹是否超过`flickThreshold`               |
| swipe-right | 向右滑动         | `({ deltaX: number, isFlick: number }) => void`         | `deltaX`：向右滑动的距离；`isFlick`：事件执行的实际每毫秒的运动轨迹是否超过`flickThreshold`               |
| swipe-up    | 向上滑动         | `({ deltaY: number, isFlick: number }) => void`         | `deltaY`：向上滑动的距离；`isFlick`：事件执行的实际每毫秒的运动轨迹是否超过`flickThreshold`               |
| swipe-down  | 向下滑动         | `({ deltaY: number, isFlick: number }) => void`         | `deltaY`：向下滑动的距离；`isFlick`：事件执行的实际每毫秒的运动轨迹是否超过`flickThreshold`               |


### Slot

| 属性        | 说明 |
| --------- | -- |
| `default` | -  |

