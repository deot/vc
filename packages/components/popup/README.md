## 功能（Popup）

移动端弹出层

### 何时使用

抽屉从父窗体边缘滑入，覆盖住部分父窗体内容。用户在抽屉内操作时不必离开当前任务，操作完成后，可以平滑地回到到原任务。
- 当需要在当前任务流中插入临时任务，创建或预览附加内容。比如展示协议条款，创建子对象。
- 当需要一个附加的面板来控制父窗体内容，这个面板在需要时呼出。比如，控制界面展示样式，往界面中添加内容。

### 基础用法

通过v-model控制弹出层是否展示。

:::RUNTIME
```vue
<template>
	<div>
		<MPopup v-model="show">
			<div style="height: 200px;" >默认弹层</div>
		</MPopup>
		<MButton @click="handleClick">点击弹出</MButton>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { MPopup, Button } from '@deot/vc';

const show = ref(false);
const handleClick = () => {
	show.value = true;
};
</script>
```
:::

### 布局
通过`fixed`控制弹出层是否采用fixed布局

:::RUNTIME
```vue
<template>
	<div>
		<MPopup v-model="show" fixed>
			<div style="height: 200px;" >fixed布局</div>
		</MPopup>
		<MPopup v-model="show1">
			<div style="height: 200px;" >非fixed布局</div>
		</MPopup>
		<MButton @click="handleClick">fixed布局</MButton>
		<MButton @click="handleClickOne">非fixed布局</MButton>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { MPopup, Button } from '@deot/vc';

const show = ref(false);
const show1 = ref(false);

const handleClick = () => {
	show.value = true;
};

const handleClickOne = () => {
	show1.value = true;
};
</script>
```
:::

### 弹出位置
通过`placement`属性设置弹出位置，默认底部弹出，可以设置为`top`、`bottom`、`left`、`right`、`center`。

:::RUNTIME
```vue
<template>
	<div>
		<MPopup v-model="show1" >
			<div style="height: 200px;">
				默认弹出（底部）
			</div>
		</MPopup>
		<MPopup v-model="show2" placement="top">
			<div style="height: 200px;" >
				顶部弹出
			</div>
		</MPopup>
		<MPopup v-model="show3" placement="left">
			<div style="min-width: 100px;">
				左侧弹出
			</div>
		</MPopup>
		<MPopup v-model="show4" placement="right">
			<div style="">
				右侧弹出
			</div>
		</MPopup>
		<MPopup v-model="show5" placement="center">
			<div style="min-height: 200px; min-width: 200px;">
				居中弹出
			</div>
		</MPopup>
		<MButton @click="handleClick(1)">默认弹出（底部）</MButton>
		<MButton @click="handleClick(2)">顶部弹出</MButton>
		<MButton @click="handleClick(3)">左侧弹出</MButton>
		<MButton @click="handleClick(4)">右侧弹出</MButton>
		<MButton @click="handleClick(5)">居中弹出</MButton>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { MPopup, Button } from '@deot/vc';

const show1 = ref(false);
const show2 = ref(false);
const show3 = ref(false);
const show4 = ref(false);
const show5 = ref(false);

const handleClick = (index) => {
	switch(index){
		case 2:
			show2.value = true;
			break;
		case 3:
			show3.value = true;
			break;
		case 4:
			show4.value = true;
			break;
		case 5:
			show5.value = true;
			break;
		default:
			show1.value = true;
			break;
	}
};
</script>
```
:::

### 主题
通过theme属性设置弹层主题，默认`light`，可以设置为`dark`、`light`、`none`。

:::RUNTIME
```vue
<template>
	<div>
		<MPopup v-model="show1" theme="light">
			<div style="height: 200px;">
				默认弹层
			</div>
		</MPopup>
		<MPopup v-model="show2" theme="dark">
			<div style="height: 200px;" >
				黑色主题
			</div>
		</MPopup>
		<MPopup v-model="show3" theme="none">
			<div style="height: 200px;">
				不设置主题
			</div>
		</MPopup>
		<MButton @click="handleClick(1)">默认主题</MButton>
		<MButton @click="handleClick(2)">黑色主题</MButton>
		<MButton @click="handleClick(3)">不设置主题</MButton>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { MPopup, Button } from '@deot/vc';

const show1 = ref(false);
const show2 = ref(false);
const show3 = ref(false);
const handleClick = (index) => {
	switch(index){
		case 2:
			show2.value = true;
			break;
		case 3:
			show3.value = true;
			break;
		default:
			show1.value = true;
			break;
	}
};
</script>
```
:::

### 遮罩层
通过mask控制遮罩层层是否展示，通过maskClosable控制是否能通过点击遮罩层来关闭整个弹出层，默认均为true。

:::RUNTIME
```vue
<template>
	<div>
		<MPopup v-model="show">
			<div style="height: 200px;" >默认弹层</div>
		</MPopup>
		<MPopup v-model="show1" :mask="false">
			<div style="height: 200px;" @click="handleCloseOne">无遮罩层</div>
		</MPopup>
		<MPopup v-model="show2" :maskClosable="false">
			<div style="height: 200px;" @click="handleCloseTwo">点击遮罩层不能关闭弹层</div>
		</MPopup>
		<MButton @click="handleClick">默认弹层</MButton>
		<MButton @click="handleClickOne">无遮罩层</MButton>
		<MButton @click="handleClickTwo">点击遮罩层不能关闭弹层</MButton>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { MPopup, Button } from '@deot/vc';

const show = ref(false);
const show1 = ref(false);
const show2 = ref(false);

const handleClick = () => {
	show.value = true;
};
const handleClickOne = () => {
	show1.value = true;
};
const handleClickTwo = () => {
	show2.value = true;
};
const handleCloseOne = () => {
	show1.value = false;
};
const handleCloseTwo = () => {
	show2.value = false;
};
</script>
```
:::

### 自定义外层容器样式
通过`wrapperClass`属性设置外层容器样式名，通过`wrapperStyle`属性设置外层容器行内样式。

:::RUNTIME
```vue
<template>
	<div>
		<MPopup v-model="show1" :wrapper-class="classes" >
			<div style="height: 200px;" >
				样式一
			</div>
		</MPopup>
		<MPopup v-model="show2" :wrapper-style="wrapperStyle" >
			<div style="height: 200px;" >
				样式二
			</div>
		</MPopup>
		<MPopup v-model="show3" :wrapper-class="classes" :wrapper-style="wrapperStyle">
			<div style="height: 200px;">
				样式三
			</div>
		</MPopup>

		<MButton @click="handleClick(1)">样式一</MButton>
		<MButton @click="handleClick(2)">样式二</MButton>
		<MButton @click="handleClick(3)">样式三</MButton>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { MPopup, Button } from '@deot/vc';

const show1 = ref(false);
const show2 = ref(false);
const show3 = ref(false);
const classes = ref({ 'is-red': true }),
const wrapperStyle = ref({
	"background": "orange"
});
const handleClick = (index) => {
	switch(index){
		case 2:
			show2.value = true;
			break;
		case 3:
			show3.value = true;
			break;
		default:
			show1.value = true;
			break;
	}
};
</script>
<style>
.is-red {
	color: red;
}
</style>
```
:::

## API

### 基础属性

| 属性               | 说明                               | 类型                        | 可选值                                                          | 默认值      |
| ---------------- | -------------------------------- | ------------------------- | ------------------------------------------------------------ | -------- |
| modelValue       | 显示popop                          | `boolean`                 | -                                                            | `false`  |
| fixed            | 是否使用fixed布局                      | `boolean`                 | -                                                            | `false`  |
| show             | 是否显示                             | `boolean`                 | -                                                            | `false`  |
| placement        | 从哪个方向弹出                          | `string`                  | `top`、`bottom`、`left`、`right`、`center`                       | `bottom` |
| theme            | 主题                               | `string`                  | `dark`、`light`、`none`                                        | `light`  |
| mask             | 是否显示遮罩（只有在position为bottom的时候才有用） | `boolean`                 | -                                                            | `true`   |
| maskClosable     | 是否允许通过点击遮罩关闭弹窗                   | `boolean`                 | -                                                            | `true`   |
| wrapperClass | 外层容器的Class名                      | `object`、`array`、`string` | -                                                            | -        |
| wrapperStyle     | 外层容器的样式                          | `object`、`array`、`string` | -                                                            | -        |
| scrollRegExp     | 判断滑动是否在滚动容器内，防止滚动穿透弹层            | `Function`                | `void: function(v) { return /vc-hack-scroll/.test(v); }` | -        |


### 事件

| 事件名            | 说明     | 回调参数                         | 参数说明           |
| -------------- | ------ | ---------------------------- | -------------- |
| close          | 弹层关闭回调 | -                            | -              |
| visible-change | 显示状态改变 | `(visible: boolean) => void` | `visible`：显示状态 |

