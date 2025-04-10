## 过渡动画（Transition）

基于Vue内置Transition组件封装

### 何时使用

- 使用过渡动画来优化用户体验。

### 基础用法

#### fade
淡入淡出效果。

:::RUNTIME
```vue
<template>
	<div>
		<div style="margin-bottom: 16px;">
			是否展示：
			<Switch v-model="visible"></Switch>
		</div>
		<TransitionFade>
			<span v-show="visible">你看到我了</span>
		</TransitionFade>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Transition, TransitionFade, Switch } from '@deot/vc';

const visible = ref(true);
</script>
```
:::

#### scale
放大缩小效果。

:::RUNTIME
```vue
<template>
	<div>
		<div style="margin-bottom: 16px;">
			是否展示：
			<Switch v-model="visible"></Switch>
		</div>
		<TransitionScale mode="part" :duration=".6">
			<div v-show="visible" style="display: inline-block;">你看到我了</div>
		</TransitionScale>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Transition, TransitionScale, Switch } from '@deot/vc';

const visible = ref(true);
</script>
```
:::

#### slide
上下滑动效果

:::RUNTIME
```vue
<template>
	<div>
		<div style="margin-bottom: 16px;">
			是否展示：
			<Switch v-model="visible"></Switch>
		</div>
		<TransitionSlide mode="up-part">
			<div v-show="visible">你看到我了</div>
		</TransitionSlide>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Transition, TransitionSlide, Switch } from '@deot/vc';

const visible = ref(true);
</script>
```
:::

#### zoom
急速扩大后缩小效果。

:::RUNTIME
```vue
<template>
	<div>
		<div style="margin-bottom: 16px;">
			是否展示：
			<Switch v-model="visible"></Switch>
		</div>
		<TransitionZoom mode="center" :duration=".6">
			<div v-show="visible" style="display: inline-block;">你看到我了</div>
		</TransitionZoom>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Transition, TransitionZoom, Switch } from '@deot/vc';

const visible = ref(true);
</script>
```
:::

#### collapse
折叠隐藏效果。

:::RUNTIME
```vue
<template>
	<div>
		<div style="margin-bottom: 16px;">
			是否展示：
			<Switch v-model="visible"></Switch>
		</div>
		<TransitionCollapse>
			<div v-show="visible" style="display: inline-block;">你看到我了</div>
		</TransitionCollapse>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Transition, TransitionCollapse, Switch } from '@deot/vc';

const visible = ref(true);
</script>
```
:::

#### 列表过渡
列表内使用。

:::RUNTIME
```vue
<template>
	<div class="runtime-list">
		<div style="margin-bottom: 16px;">
			<Button @click="handleAdd">添加</Button>
			<Button @click="handleDel">删除</Button>
		</div>
		<TransitionSlide 
			mode="up-part"
			tag="div"
			style="display: flex; flex-wrap: wrap"
			group
		>
			<div 
				v-for="(item, index) in colors" 
				:key="item.id" 
				:style="{ background: `#ffff${item.id}${item.id}` }"
				style="width: 48px; height: 48px; text color: #333; margin: 10px"
				class="_color-item"
			>
				{{ index }}: {{ item.id }}
			</div>
		</TransitionSlide>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Transition, TransitionSlide, Button } from '@deot/vc';

const count = ref(10);
const visible = ref(true);
const colors = ref(Array.from({ length: 5 }, () => ({ id: count++ })));

const handleAdd = () => {
	colors.value.push({ id: count++ })
};

const handleDel = () => {
	colors.value.splice(Math.floor(Math.random() * colors.value.length), 1)
};

</script>
<style>
.runtime-list ._color-item {
	margin: 10px;
	width: 48px;
	height: 48px;
	line-height: 48px;
	color: #333;
	text-align: center;
}
</style>
```
:::

## API

### 属性

| 属性       | 说明                                 | 类型                | 可选值 | 默认值                        |
| -------- | ---------------------------------- | ----------------- | --- | -------------------------- |
| group    | 是否使用`transition-group`             | `boolean`         | -   | `false`                    |
| duration | 进入/离开持续时间                          | `number`、`object` | -   | `{enter: 0.3, leave: 0.3}` |
| delay    | 进入/离开延迟时间                          | `number`、`object` | -   | `{enter: 0.3, leave: 0.3}` |
| tag      | 同`transition-group` tag            | `string`          | -   | `span`                     |
| origin   | 变换的初始位置, 可以用style代替, 更短~~          | `string`          | -   | -                          |
| style    | 转换期间应用的元素样式                        | `object`          | -   | `{}`                       |
| appear   | 是否在初始渲染时使用过渡（Vue内置Transition组件的属性） | `boolean`         | -   | `false`                    |


### TransitionSlide 属性

| 属性   | 说明      | 类型       | 可选值                        | 默认值    |
| ---- | ------- | -------- | -------------------------- | ------ |
| mode | slide方向 | `string` | `left`、`right`、`down`、`up` | `left` |


### TransitionScale 属性

| 属性   | 说明      | 类型       | 可选值                          | 默认值    |
| ---- | ------- | -------- | ---------------------------- | ------ |
| mode | scale规则 | `string` | `both`、`part`、`x`、`y`、`none` | `both` |


### TransitionZoom 属性

| 属性   | 说明     | 类型       | 可选值                     | 默认值 |
| ---- | ------ | -------- | ----------------------- | --- |
| mode | zoom规则 | `string` | `x`、`y`、`center`、`none` | `x` |


### 事件

| 事件名          | 说明      | 回调参数                   | 参数说明            |
| ------------ | ------- | ---------------------- | --------------- |
| before-enter | 进入之前的回调 | `(el: object) => void` | `el`：当前触发事件节点元素 |
| enter        | 进入的回调   | `(el: object) => void` | `el`：当前触发事件节点元素 |
| after-enter  | 进入之后的回调 | `(el: object) => void` | `el`：当前触发事件节点元素 |
| before-leave | 离开之前的回调 | `(el: object) => void` | `el`：当前触发事件节点元素 |
| leave        | 离开的回调   | `(el: object) => void` | `el`：当前触发事件节点元素 |
| after-leave  | 离开之后的回调 | `(el: object) => void` | `el`：当前触发事件节点元素 |

