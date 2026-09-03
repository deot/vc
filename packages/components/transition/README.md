## 过渡动画（Transition）

基于 Vue 的 `Transition` 和 `TransitionGroup` 封装进入、离开与列表位移动画，并提供淡入淡出、缩放、滑动、缩放弹出和折叠五种预置效果。

`MTransition`、`MTransitionFade`、`MTransitionScale`、`MTransitionSlide`、`MTransitionZoom`、`MTransitionCollapse` 分别是对应组件的移动端入口别名，API 与原组件一致。

### 何时使用

- 元素显示、隐藏或切换时，需要平滑衔接状态变化。
- 列表增加、删除或重排时，需要为子项和剩余项的位置变化添加动画。
- 已有自己的 keyframes，希望统一管理持续时间、延迟和 Vue 过渡钩子。

### 基础用法

`TransitionFade`、`TransitionScale`、`TransitionSlide`、`TransitionZoom` 和 `TransitionCollapse` 已包含对应的动画样式。`duration` 的单位为毫秒。

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
	<div class="transition-demo">
		<Button @click="visible = !visible">
			{{ visible ? '隐藏内容' : '显示内容' }}
		</Button>
		<div class="transition-demo__grid">
			<div class="transition-demo__item">
				<span>Fade</span>
				<TransitionFade :duration="300">
					<div v-show="visible" class="transition-demo__panel">淡入淡出</div>
				</TransitionFade>
			</div>
			<div class="transition-demo__item">
				<span>Scale</span>
				<TransitionScale mode="part" :duration="300">
					<div v-show="visible" class="transition-demo__panel">局部缩放</div>
				</TransitionScale>
			</div>
			<div class="transition-demo__item">
				<span>Slide</span>
				<TransitionSlide mode="top-part" :duration="300">
					<div v-show="visible" class="transition-demo__panel">向上滑动</div>
				</TransitionSlide>
			</div>
			<div class="transition-demo__item">
				<span>Zoom</span>
				<TransitionZoom mode="center" :duration="300">
					<div v-show="visible" class="transition-demo__panel">中心缩放</div>
				</TransitionZoom>
			</div>
			<div class="transition-demo__item">
				<span>Collapse</span>
				<TransitionCollapse :duration="300">
					<div v-show="visible">
						<div class="transition-demo__panel">展开折叠</div>
					</div>
				</TransitionCollapse>
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import {
	Button,
	TransitionCollapse,
	TransitionFade,
	TransitionScale,
	TransitionSlide,
	TransitionZoom
} from '@deot/vc';

const visible = ref(true);
</script>

<style scoped>
.transition-demo__grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(128px, 1fr));
	gap: 12px;
	margin-top: 12px;
}

.transition-demo__item {
	min-height: 88px;
	color: var(--vc-color-dark-lightest);
	font-size: 13px;
}

.transition-demo__panel {
	margin-top: 8px;
	padding: 12px;
	border: 1px solid var(--vc-color-light-deepest);
	border-radius: 4px;
	background: var(--vc-background-color-light);
	color: var(--vc-foreground-color);
}
</style>
```
:::

### 自定义 Transition

`Transition` 本身不提供 keyframes。通过 `prefix` 指定进入、离开的激活类前缀，组件会分别组合出 `<prefix>.is-in` 和 `<prefix>.is-out`。

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
	<div>
		<Button @click="visible = !visible">
			{{ visible ? '离开' : '进入' }}
		</Button>
		<Transition prefix="transition-custom" :duration="400">
			<div v-show="visible" class="transition-custom__panel">
				自定义过渡内容
			</div>
		</Transition>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, Transition } from '@deot/vc';

const visible = ref(true);
</script>

<style scoped>
.transition-custom__panel {
	margin-top: 12px;
	padding: 12px;
	border-radius: 4px;
	background: var(--vc-color-primary-lighter);
	color: var(--vc-foreground-color);
}

.transition-custom.is-in {
	animation-name: transition-custom-in;
}

.transition-custom.is-out {
	animation-name: transition-custom-out;
}

@keyframes transition-custom-in {
	from {
		opacity: 0;
		transform: translateY(-12px);
	}
}

@keyframes transition-custom-out {
	to {
		opacity: 0;
		transform: translateY(12px);
	}
}
</style>
```
:::

### 列表过渡

设置 `group` 后，底层切换为 `TransitionGroup`。列表子项必须提供稳定且唯一的 `key`；`tag` 用于指定列表根元素。

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
	<div>
		<div class="transition-list__actions">
			<Button @click="handleAdd">添加</Button>
			<Button :disabled="items.length === 0" @click="handleRemove">删除</Button>
		</div>
		<TransitionSlide
			class="transition-list"
			mode="top-part"
			tag="div"
			group
		>
			<div v-for="item in items" :key="item" class="transition-list__item">
				{{ item }}
			</div>
		</TransitionSlide>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, TransitionSlide } from '@deot/vc';

const nextId = ref(4);
const items = ref([1, 2, 3]);

const handleAdd = () => {
	items.value.push(nextId.value++);
};

const handleRemove = () => {
	items.value.shift();
};
</script>

<style scoped>
.transition-list__actions {
	display: flex;
	gap: 8px;
	margin-bottom: 12px;
}

.transition-list {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	min-height: 40px;
}

.transition-list__item {
	display: grid;
	place-items: center;
	width: 40px;
	height: 40px;
	border-radius: 4px;
	background: var(--vc-color-primary);
	color: var(--vc-color-light);
}
</style>
```
:::

## API

### Transition 系列公共属性

下列属性由六个 Transition 组件共同声明。设置 `group` 后，组件使用 Vue 的 `TransitionGroup`，否则使用 `Transition`。

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| duration | 进入和离开的持续时间，单位为毫秒 | `number \| { enter: number; leave: number }` | - | `300` |
| delay | 进入和离开的延迟时间，单位为毫秒；`TransitionCollapse` 不使用该属性 | `number \| { enter: number; leave: number }` | - | `0` |
| group | 是否使用 `TransitionGroup` | `boolean` | - | `false` |
| tag | `group` 为 `true` 时，`TransitionGroup` 渲染的根元素标签 | `string` | - | `undefined` |
| origin | 动画期间设置到子元素的 `transform-origin` | `string` | - | `''` |
| style | 进入和离开前设置到子元素的内联样式 | `Record<string, string \| undefined>` | - | 因组件而异，见下表 |
| prefix | 进入、离开和列表位移动画的激活类前缀 | `string` | - | 因组件而异，见下表 |
| mode | 追加到激活类的动画模式；`none` 不追加模式类 | `string` | 因组件而异，见下表 | 因组件而异，见下表 |

未声明的 attributes 和过渡事件会继续传给底层 Vue 组件，例如 `appear`、`enter-from-class` 和 `leave-to-class`。传入的 `enter-active-class`、`leave-active-class`、`move-class` 会与组件生成的激活类合并。

### Transition、TransitionFade、TransitionScale、TransitionSlide、TransitionZoom、TransitionCollapse 属性差异

| 组件 | `prefix` 默认值 | `mode` 内置可选值 | `mode` 默认值 | `style` 默认值 |
| --- | --- | --- | --- | --- |
| `Transition` | `vc-transition` | `none`；也可配合自定义样式使用其他字符串 | `none` | `{ animationFillMode: 'both', animationTimingFunction: 'ease-out' }` |
| `TransitionFade` | `vc-transition-fade` | `none` | `none` | `{ animationFillMode: 'both', animationTimingFunction: undefined }` |
| `TransitionScale` | `vc-transition-scale` | `both`、`part`、`x`、`y`、`none` | `both` | `{ animationFillMode: 'both', animationTimingFunction: undefined }` |
| `TransitionSlide` | `vc-transition-slide` | `left`、`right`、`top`、`bottom`、`left-part`、`right-part`、`top-part`、`bottom-part`、`none` | `left` | `{ animationFillMode: 'both', animationTimingFunction: undefined }` |
| `TransitionZoom` | `vc-transition-zoom` | `x`、`y`、`center`、`none` | `x` | `{ animationFillMode: 'both', animationTimingFunction: undefined }` |
| `TransitionCollapse` | `vc-transition` | `none`；内置折叠动画不读取 `prefix` 和 `mode` | `none` | `{ animationFillMode: 'both', animationTimingFunction: 'ease-out' }` |

### Transition 系列事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| before-enter | 进入动画开始前触发 | `(el: HTMLElement) => void` | `el`：当前过渡元素 |
| enter | 进入动画开始时触发 | `(el: HTMLElement, done: () => void) => void` | `done` 可提前结束动画；`TransitionCollapse` 只传入 `el` |
| after-enter | 进入动画完成后触发 | `(el: HTMLElement) => void` | `el`：当前过渡元素 |
| before-leave | 离开动画开始前触发 | `(el: HTMLElement) => void` | `el`：当前过渡元素 |
| leave | 离开动画开始时触发 | `(el: HTMLElement, done: () => void) => void` | `done` 可提前结束动画；`TransitionCollapse` 只传入 `el` |
| after-leave | 离开动画完成后触发 | `(el: HTMLElement) => void` | `el`：当前过渡元素 |

### Transition 系列插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 需要应用过渡的内容；使用 `group` 时应为一组带唯一 `key` 的子节点 | - |
