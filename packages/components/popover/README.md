## 弹出框（Popover）
点击/鼠标移入元素，弹出气泡式的卡片浮层

### 何时使用
当目标元素有进一步的描述和相关操作时，可以收纳到卡片中，根据用户的操作行为进行展现。

### 基础用法
最简单的用法。

:::RUNTIME
```vue
<template>
	<div>
		<Popover 
			:trigger="trigger" 
			content="这是一段内容,这是一段内容,这是一段内容,这是一段内容"
			trigger="hover"
		>
			<Button>
				hover 激活
			</Button>
		</Popover>
		<Popover 
			:trigger="trigger" 
			content="这是一段内容,这是一段内容,这是一段内容,这是一段内容"
			trigger="click"
		>
			<Button>
				click 激活
			</Button>
		</Popover>
		<Popover 
			:trigger="trigger" 
			content="这是一段内容,这是一段内容,这是一段内容,这是一段内容"
			trigger="focus"
		>
			<Button>
				focus 激活
			</Button>
		</Popover>
	</div>
</template>
<script setup>
import { Popover, Button } from '@deot/vc';
</script>
```
:::

### 定位
在这里我们提供 9 种不同方向的展示方式，可以通过以下完整示例来理解，选择你要的效果。

:::RUNTIME
```vue
<template>
	<div class="v-popover-basic">
		<div class="top">
			<Popover 
				:get-popup-container="getPopupContainer"
				:trigger="trigger" 
				placement="top-left" 
				content="TopLeft"
				class=" g-m-lr-10"
			>
				<Button class="g-btn">
					TL
				</Button>
				<template #content>
					<div style="height: 100px; width: 200px">
						getPopupContainer
					</div>
				</template>
			</Popover>
			<Popover 
				:portal="false"
				:trigger="trigger" 
				placement="top" 
				content="Top"
				class=" g-m-lr-10"
			>
				<Button class="g-btn">
					Top
				</Button>
				<template #content>
					<div style="height: 100px; width: 200px">
						portal="false"
					</div>
				</template>
			</Popover>
			<Popover 
				:trigger="trigger" 
				placement="top-right" 
				content="TopRight"
				class=" g-m-lr-10"
			>
				<Button class="g-btn">
					TR
				</Button>
				<template #content>
					<div style="height: 100px; width: 200px">
						Body
					</div>
				</template>
			</Popover>
		</div>
		<div class="left">
			<Popover 
				:get-popup-container="getPopupContainer"
				:trigger="trigger" 
				placement="left-top" 
				content="LeftTop"
			>
				<Button class="g-btn g-m-tb-10">
					LT
				</Button>
				<template #content>
					<div style="height: 100px; width: 200px">
						getPopupContainer
					</div>
				</template>
			</Popover>
			<Popover 
				:portal="false"
				:trigger="trigger" 
				placement="left" 
				content="Left"
			>
				<Button class="g-btn g-m-tb-10">
					Left
				</Button>
				<template #content>
					<div style="height: 100px; width: 200px">
						portal="false"
					</div>
				</template>
			</Popover>
			<Popover 
				:trigger="trigger" 
				placement="left-bottom" 
				content="leftBottom"
			>
				<Button class="g-btn g-m-tb-10">
					LB
				</Button>
				<template #content>
					<div style="height: 100px; width: 200px">
						Body
					</div>
				</template>
			</Popover>
		</div>
		<div class="right">
			<Popover 
				:get-popup-container="getPopupContainer"
				:trigger="trigger" 
				placement="right-top" 
				content="RightTop"
			>
				<Button class="g-btn g-m-tb-10">
					RT
				</Button>
				<template #content>
					<div style="height: 100px; width: 200px">
						getPopupContainer
					</div>
				</template>
			</Popover>
			<Popover 
				:portal="false"
				:trigger="trigger" 
				placement="right" 
				content="Right"
			>
				<Button class="g-btn g-m-tb-10">
					Right
				</Button>
				<template #content>
					<div style="height: 100px; width: 200px">
						portal="false"
					</div>
				</template>
			</Popover>
			<Popover 
				:trigger="trigger" 
				placement="right-bottom" 
				content="RightBottom"
			>
				<Button class="g-btn g-m-tb-10">
					RB
				</Button>
				<template #content>
					<div style="height: 100px; width: 200px">
						Body
					</div>
				</template>
			</Popover>
		</div>
		<div class="bottom">
			<Popover 
				:get-popup-container="getPopupContainer"
				:trigger="trigger" 
				placement="bottom-left"
				content="BottomLeft"
				class=" g-m-lr-10"
			>
				<Button class="g-btn">
					BL
				</Button>
				<template #content>
					<div style="height: 100px; width: 200px">
						getPopupContainer
					</div>
				</template>
			</Popover>
			<Popover 
				:portal="false"
				:trigger="trigger" 
				placement="bottom" 
				content="Bottom"
				class=" g-m-lr-10"
			>
				<Button class="g-btn">
					Bottom
				</Button>
				<template #content>
					<div style="height: 100px; width: 200px">
						portal="false"
					</div>
				</template>
			</Popover>
			<Popover 
				:trigger="trigger" 
				placement="bottom-right"
				content="BottomRight"
				class=" g-m-lr-10"
			>
				<Button class="g-btn">
					BR
				</Button>
				<template #content>
					<div style="height: 100px; width: 200px">
						Body
					</div>
				</template>
			</Popover>
		</div>
	</div>
</template>
<script setup>
import { Popover, Button } from '@deot/vc';
</script>
<style>
.v-popover-basic {
    width: 400px;
}

.v-popover-basic .top {
	text-align: center;
}

.v-popover-basic .left {
	float: left;
	width: 60px;
}

.v-popover-basic .right {
	float: right;
	width: 60px;
}
.v-popover-basic .bottom {
	clear: both;
	text-align: center;
}
.v-popover-basic .item {
	margin: 4px;
}

</style>
```
:::

### 嵌套内容
通过slot content嵌套内容。

:::RUNTIME
```vue
<template>
	<div>
		<Popover 
			:trigger="trigger" 
			content="这是一段内容,这是一段内容,这是一段内容,这是一段内容"
			trigger="click"
		>
			<Button>
				click 激活
			</Button>
			<template #content>
				<div style="height: 100px; width: 200px">
					我是嵌套的内容
				</div>
			</template>
		</Popover>
	</div>
</template>
<script setup>
import { Popover, Button } from '@deot/vc';
</script>
```
:::

### 主题
提供了两个不同的主题：`dark`和`light`。

:::RUNTIME
```vue
<template>
	<div>
		<Popover 
			:trigger="trigger" 
			content="这是一段内容,这是一段内容,这是一段内容,这是一段内容"
			trigger="click"
			theme="dark"
		>
			<Button>
				dark
			</Button>
		</Popover>
		<Popover 
			:trigger="trigger" 
			content="这是一段内容,这是一段内容,这是一段内容,这是一段内容"
			trigger="click"
			theme="light"
		>
			<Button>
				light
			</Button>
		</Popover>
	</div>
</template>
<script setup>
import { Popover, Button } from '@deot/vc';
</script>
```
:::

### API方法调用
可以通过

:::RUNTIME
```vue
<template>
	<div>
		<Button ref="btn" @click="handleClick">
			点我调用
		</Button>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Popover, Button } from '@deot/vc';

const btn = ref();
const handleClick = () => {
	Popover.open({
		el: document.body,
		cName: 'Popover',
		triggerEl: btn.value,
		hover: true,
		alone: true, // 需要开启
		theme: 'dark',
		placement: "top",
		content: '我是API调用内容',
	});
};
</script>
```
:::

## API

### 属性

| 属性                | 说明                                         | 类型                        | 可选值                                                                                                                                   | 默认值      |
| ----------------- | ------------------------------------------ | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| modelValue        | 显示popover                                  | `boolean`                 | -                                                                                                                                     | `false`  |
| animation         | 自定义的动画效果                                   | `string`                  | -                                                                                                                                     | 无        |
| placement         | 弹层的位置                                      | `string`                  | `top`、`left`、`right`、`bottom`、`bottom-left`、`bottom-right`、`top-left`、`top-right`、`right-top`、`right-bottom`、`left-top`、`left-bottom` | `bottom` |
| trigger           | 触发的行为                                      | `string`                  | `hover`、`click`、`focus`                                                                                                               | `hover`  |
| content           | 显示的内容                                      | `string`、`Function`       | -                                                                                                                                     | 无        |
| getPopupContainer | 浮层渲染父节点                                    | `Function`                | -                                                                                                                                     | 无        |
| portal            | 是否渲染到body上，默认body                          | `boolean`                 | -                                                                                                                                     | `true`   |
| arrow             | 浮层有无箭头                                     | `boolean`                 | -                                                                                                                                     | `true`   |
| theme             | 颜色主体                                       | `string`                  | `light`、`dark`、`none`                                                                                                                 | `light`  |
| always            | 弹层不隐藏                                      | `boolean`                 | -                                                                                                                                     | `false`  |
| tag               | 渲染的节点类型                                    | `string`                  | -                                                                                                                                     | `span`   |
| disabled          | 是否禁用                                       | `boolean`                 | -                                                                                                                                     | `false`  |
| autoWidth         | 宽度自适应                                      | `boolean`                 | -                                                                                                                                     | `false`  |
| portalClassName   | 外层类名                                       | `Object`、`string`、`Array` | -                                                                                                                                     | -        |
| portalStyle       | 样式                                         | `Object`                  | -                                                                                                                                     | -        |
| triggerEl         | 触发元素，使用`open`方法调用时必填                       | `Object`、`HTMLElement`    | -                                                                                                                                     | -        |
| alone             | 直接传送门标记调用时，使用`open`方法调用时必填                 | `boolean`                 | -                                                                                                                                     | `false`  |
| hover             | 直接传送门标记调用时，hover需要绑定事件                     | `boolean`                 | -                                                                                                                                     | `false`  |
| outsideClickable  | 点击弹层外面的区域是否关闭弹层，用于其他组件如`date-picker`内部控制弹层 | `boolean`                 | -                                                                                                                                     | `true`   |


### 事件

| 事件名            | 说明         | 回调参数                           | 参数说明           |
| -------------- | ---------- | ------------------------------ | -------------- |
| visible-change | 显示状态改变     | `(visible: boolean) => void 0` | `visible`：显示状态 |
| close          | 关闭时回调      | -                              | -              |
| ready          | 弹层节点挂载完成回调 | -                              | -              |


### Slot

| 属性      | 说明   |
| ------- | ---- |
| default | 触发器  |
| content | 弹层内容 |


## 注意事项

| - 不要在引用的地方带有Popover的className                                       |
| ------------------------------------------------------------------- |
| - content的slot写法必须采用vue2.6退出的新语法，旧语法在插槽内容更新时不会同步更新                  |
| - `trigger` 为 `false` 时，`Popover` 包含的内容必须是个节点，且有`focus` 和 `blur`事件。 |
