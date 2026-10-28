## 过渡动画（Transition）

基于 Vue 的 `Transition` 和 `TransitionGroup` 封装进入、离开与列表位移动画，并提供淡入淡出、缩放、滑动、缩放弹出、折叠，以及从触发元素展开六种预置效果。

`MTransition`、`MTransitionFade`、`MTransitionScale`、`MTransitionSlide`、`MTransitionZoom`、`MTransitionCollapse`、`MTransitionReveal` 分别是对应组件的移动端入口别名，API 与原组件一致。

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
		<Button @click="isVisible = !isVisible">
			{{ isVisible ? '隐藏内容' : '显示内容' }}
		</Button>
		<div class="transition-demo__grid">
			<div class="transition-demo__item">
				<span>Fade</span>
				<TransitionFade :duration="300">
					<div v-show="isVisible" class="transition-demo__panel">淡入淡出</div>
				</TransitionFade>
			</div>
			<div class="transition-demo__item">
				<span>Scale</span>
				<TransitionScale mode="part" :duration="300">
					<div v-show="isVisible" class="transition-demo__panel">局部缩放</div>
				</TransitionScale>
			</div>
			<div class="transition-demo__item">
				<span>Slide</span>
				<TransitionSlide mode="top-part" :duration="300">
					<div v-show="isVisible" class="transition-demo__panel">向上滑动</div>
				</TransitionSlide>
			</div>
			<div class="transition-demo__item">
				<span>Zoom</span>
				<TransitionZoom mode="center" :duration="300">
					<div v-show="isVisible" class="transition-demo__panel">中心缩放</div>
				</TransitionZoom>
			</div>
			<div class="transition-demo__item">
				<span>Collapse</span>
				<TransitionCollapse :duration="300">
					<div v-show="isVisible">
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

const isVisible = ref(true);
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
	background: var(--vc-background-color-lightest);
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
		<Button @click="isVisible = !isVisible">
			{{ isVisible ? '离开' : '进入' }}
		</Button>
		<Transition prefix="transition-custom" :duration="400">
			<div v-show="isVisible" class="transition-custom__panel">
				自定义过渡内容
			</div>
		</Transition>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, Transition } from '@deot/vc';

const isVisible = ref(true);
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

### 从触发元素展开

`TransitionReveal` 让子元素从触发元素展开，关闭时缩回该元素当时的位置。动画分两层：父元素是窗口，用 `clip-path` 从触发元素的盒子裁到子元素的盒子；子元素是画面，用 `transform` 从触发元素的大小放大回原位。两层是同一段 333ms 动画，四边始终对齐。因此父元素应只包含这一个子元素，并且自身不缩放、不旋转（平移不影响）。

不传 `trigger-element` 时，取打开那次点击的元素；点在按钮或链接里的文字、图标上时，从整个按钮或链接展开。不是由点击打开、元素已移出文档或没有尺寸时，改为淡入淡出。展开或缩回还没结束又切换时，沿原路返回。

子元素和触发元素长得不一样时（例如按钮打开卡片、对话框），第一帧会是一块裁成按钮大小的卡片盖在按钮上，显得突兀。有三种处理，可以叠加：

- `offset`：裁掉靠近触发元素的一段。数值是打开时间轴上的毫秒数：打开立即从这一刻的姿态弹出，关闭停在同一个姿态就结束。缓动起步慢、收尾更慢，同一段路程在关闭结尾占的时间更长，所以关闭裁掉的毫秒数会更多（`offset` 为 `80` 时，打开跳过 21% 的路程、播 253ms；关闭裁掉约 158ms）。裁掉后剩下的不足 240ms 时，按比例放慢到 240ms，姿态不变，不会一闪而过。展开途中反向时退回到起始的那个姿态。固定的毫秒数保证不了触发元素上没有残影：要走多远才离开按钮，取决于按钮和画面的相对位置。设为 `'auto'` 时，每次开合按当时的布局算出窗口刚离开触发元素（留 8px）的姿态，打开从这里开始、关闭停在这里；但起点最多到路程的 40%，触发元素离画面很近、或被画面最终位置盖住时（如弹窗里的按钮再打开一个弹窗），从 40% 处长出来，仍能看出从触发元素的方向展开，而不是原位淡入淡出。`Modal` 使用的是 `'auto'`，并打开了 `opacity`，蒙层通过 `companion` 和弹窗同一段时间淡入淡出。
- `opacity`：画面在实际播放的这一段里从透明匀速淡入、关闭时匀速淡出到透明（透明度不跟随位置的缓动，否则起步慢，前几十毫秒几乎看不见）。和 `offset` 一起用时，第一帧和最后一帧都是透明的，不会以半透明出现或突然消失。
- `delay`：窗口照常从触发元素展开，画面晚一点淡入、关闭时提前淡出。

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
	<div class="reveal-basic">
		<!-- 按钮默认 250ms 防抖，展开途中再点才能触发退回 -->
		<Button :wait="0" @click="isVisible = !isVisible">
			{{ isVisible ? '收起' : '展开' }}
		</Button>
		<!-- 窗口：只放这一个子元素，自身不缩放、不旋转 -->
		<div class="reveal-basic__frame">
			<TransitionReveal offset="auto" opacity>
				<div v-show="isVisible" class="reveal-basic__panel">
					<p>标题</p>
					<p>从点中的按钮展开，收起时缩回按钮</p>
				</div>
			</TransitionReveal>
		</div>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, TransitionReveal } from '@deot/vc';

const isVisible = ref(false);
</script>

<style scoped>
.reveal-basic {
	position: relative;
	height: 220px;
}

.reveal-basic__frame {
	position: absolute;
	inset: 0;
	pointer-events: none;
}

.reveal-basic__panel {
	position: absolute;
	top: 60px;
	left: 120px;
	width: 280px;
	padding: 12px 16px;
	border-radius: 8px;
	background: var(--vc-background-color);
	box-shadow: 0 6px 24px rgb(0 0 0 / 16%);
	color: var(--vc-foreground-color);
	pointer-events: auto;
}
</style>
```
:::

### 内存排查

Chrome DevTools 打开时会持有播放过动画的元素：即使手动回收（Collect garbage），DOM 节点与 JS 堆也只增不减，关闭 DevTools 后才会回收。Performance Monitor、Animations 面板打开时最明显，Vue 原生 `Transition` 同样如此（Chrome 154 实测）。

排查过渡组件相关的内存泄漏时，请先关闭 DevTools 再重新打开后查看。如果内存依旧泄漏，请分析自身程序（可注释动画 class，或提高 CSS 优先级禁用动画后对比）。

## API

### Transition 系列公共属性

下列属性由 Transition、TransitionFade、TransitionScale、TransitionSlide、TransitionZoom、TransitionCollapse 六个组件共同声明，`TransitionReveal` 不使用，见下方单独的属性表。设置 `group` 后，组件使用 Vue 的 `TransitionGroup`，否则使用 `Transition`。

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

### TransitionReveal 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| trigger-element | 打开时从它展开，关闭时缩回它当时的位置；传 `null` 时淡入淡出 | `Element \| null` | - | 打开那次点击的元素 |
| offset | 打开时间轴上靠近触发元素的一段裁掉多少毫秒：打开（`enter`）立即从这一刻的姿态开始，关闭（`leave`）停在同一个姿态结束（按缓动换算，关闭实际裁掉的毫秒数更多）；淡入淡出时同样适用。超过 333 时按 332 处理。`'auto'` 按布局取窗口刚离开触发元素（留 8px）的姿态，起点最多到路程 40%。裁掉后剩下的不足 240ms 时按比例放慢到 240ms | `number \| 'auto' \| { enter?: number; leave?: number }` | - | `0` |
| opacity | 画面在实际播放的这一段里匀速淡入、淡出；与 `delay` 一起用时从两者中较晚的一刻开始淡入 | `boolean` | - | `false` |
| companion | 与画面同一段时间匀速淡入淡出的元素，如蒙层；它的显示、隐藏由使用方控制，应在关闭的 `after-leave` 之后才隐藏 | `Element \| null` | - | `null` |
| delay | 画面晚多少毫秒开始淡入（`enter`）、提前多少毫秒淡出完（`leave`），单位为毫秒；窗口照常展开、缩回。与系列公共属性的 `delay` 不同，它不推迟整段动画。超过 333 时按 332 处理；淡入淡出时不使用 | `number \| { enter?: number; leave?: number }` | - | `0` |

`TransitionReveal` 用 `enter`、`leave` 钩子播放动画并在结束时调用 `done`，请监听 `before-enter`、`after-enter`、`before-leave`、`after-leave`。

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
