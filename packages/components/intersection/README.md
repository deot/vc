## 可视区监听（Intersection）

监听内容进入、离开所在滚动容器的可视区，用于曝光上报、进入可视区再渲染、预加载等。

移动端入口导出的 `MIntersection` 与 `Intersection` 的属性、事件、插槽相同，数字 `offset` 为 750 稿长度，随 `--vc-rem` 缩放，见 [移动端](#移动端)。

### 何时使用

- 需要知道某块内容是否被用户看到（曝光统计）。
- 内容开销大，滚动到附近再渲染或请求。

滚动容器自动查找：从组件向上最近的滚动容器，包括 vc Scroller（滚轮驱动时也能识别）和 `overflow: auto / scroll` 的原生容器，都没有时为浏览器视口。同一容器、同一 `offset` / `threshold` 的实例共用一个 IntersectionObserver，长列表里大量使用也只有一个监听。

### 基础用法

`v-model` 同步是否可见，`change` 在可见状态变化时触发，参数为 `{ visible, ratio, entry }`。滚动下方的容器查看效果。

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
	<div class="intersection-demo">
		<p class="intersection-demo__result">状态：{{ isVisible ? '在可视区内' : '不在可视区' }}；change {{ count }} 次，ratio {{ ratio }}</p>
		<div class="intersection-demo__box">
			<div class="intersection-demo__space" />
			<Intersection v-model="isVisible" class="intersection-demo__target" @change="handleChange">
				目标
			</Intersection>
			<div class="intersection-demo__space" />
		</div>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Intersection } from '@deot/vc';

const isVisible = ref(false);
const count = ref(0);
const ratio = ref(0);

const handleChange = (e) => {
	count.value++;
	ratio.value = e.ratio.toFixed(2);
};
</script>

<style scoped>
.intersection-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.intersection-demo__result {
	margin: 0;
}

.intersection-demo__box {
	height: 200px;
	overflow: auto;
	background: var(--vc-color-light-deeper);
}

.intersection-demo__space {
	height: 300px;
}

.intersection-demo__target {
	padding: 16px;
	color: #fff;
	text-align: center;
	background: var(--vc-color-primary);
}
</style>
```
:::

### 提前量与露出比例

- `offset` 扩展滚动容器可视区的四边：正数提前判定为可见（预加载），负数要再往里滚才可见。1 – 4 个值，顺序同 CSS `margin`；字符串支持 `px` 和 `%`。
- `threshold` 为露出比例，达到才算可见；`0` 表示贴边即可见。内容比容器还大时，`1` 永远达不到。

下例三个目标并排放在同一行，滚动时比较它们变为可见的时机。

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
	<div class="intersection-demo">
		<p class="intersection-demo__result">
			默认：{{ states.normal ? '可见' : '不可见' }}；offset 100：{{ states.offset ? '可见' : '不可见' }}；threshold 0.5：{{ states.threshold ? '可见' : '不可见' }}
		</p>
		<div class="intersection-demo__box">
			<div class="intersection-demo__space" />
			<div class="intersection-demo__row">
				<Intersection v-model="states.normal" class="intersection-demo__target">默认</Intersection>
				<Intersection v-model="states.offset" :offset="100" class="intersection-demo__target">offset 100</Intersection>
				<Intersection v-model="states.threshold" :threshold="0.5" class="intersection-demo__target">threshold 0.5</Intersection>
			</div>
			<div class="intersection-demo__space" />
		</div>
	</div>
</template>

<script setup>
import { reactive } from 'vue';
import { Intersection } from '@deot/vc';

const states = reactive({ normal: false, offset: false, threshold: false });
</script>

<style scoped>
.intersection-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.intersection-demo__result {
	margin: 0;
}

.intersection-demo__box {
	height: 200px;
	overflow: auto;
	background: var(--vc-color-light-deeper);
}

.intersection-demo__space {
	height: 300px;
}

.intersection-demo__row {
	display: flex;
	gap: 8px;
}

.intersection-demo__target {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	height: 80px;
	color: #fff;
	background: var(--vc-color-primary);
}
</style>
```
:::

### 只触发一次与暂停

- `once`：首次可见后停止监听，之后保持可见，适合曝光上报与懒加载。
- `disabled`：暂停监听，恢复后重新判断。
- 实例方法 `refresh()`：重新查找滚动容器，并把状态当作不可见重新判断，仍可见时会再触发一次 `change`（如内容替换后重新上报曝光，或组件被移到别的滚动容器里）。

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
	<div class="intersection-demo">
		<div class="intersection-demo__row">
			<Switch v-model="isDisabled" />
			<span>disabled</span>
			<Button size="small" @click="handleRefresh">refresh()</Button>
		</div>
		<p class="intersection-demo__result">once 曝光 {{ onceCount }} 次；普通 change {{ count }} 次</p>
		<div class="intersection-demo__box">
			<div class="intersection-demo__space" />
			<div class="intersection-demo__row">
				<Intersection ref="target" once class="intersection-demo__target" @change="onceCount++">
					once
				</Intersection>
				<Intersection :disabled="isDisabled" class="intersection-demo__target" @change="count++">
					disabled 可切换
				</Intersection>
			</div>
			<div class="intersection-demo__space" />
		</div>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, Intersection, Switch } from '@deot/vc';

const target = ref();
const isDisabled = ref(false);
const onceCount = ref(0);
const count = ref(0);

const handleRefresh = () => {
	target.value.refresh();
};
</script>

<style scoped>
.intersection-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.intersection-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}

.intersection-demo__result {
	margin: 0;
}

.intersection-demo__box {
	height: 200px;
	overflow: auto;
	background: var(--vc-color-light-deeper);
}

.intersection-demo__space {
	height: 300px;
}

.intersection-demo__target {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	height: 80px;
	color: #fff;
	background: var(--vc-color-primary);
}
</style>
```
:::

### 进入可视区再渲染

默认插槽带 `{ visible }`，配合 `once` 在进入可视区后才渲染内容；`tag` 设置根元素标签。根元素需要有尺寸（如 `min-height`），否则空内容高度为 0。

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
	<div class="intersection-demo">
		<div class="intersection-demo__box">
			<Intersection
				v-for="i in 8"
				:key="i"
				tag="section"
				once
				class="intersection-demo__section"
			>
				<template #default="{ visible }">
					<p v-if="visible" class="intersection-demo__content">第 {{ i }} 块，已渲染</p>
				</template>
			</Intersection>
		</div>
	</div>
</template>

<script setup>
import { Intersection } from '@deot/vc';
</script>

<style scoped>
.intersection-demo__box {
	display: flex;
	flex-direction: column;
	gap: 8px;
	height: 200px;
	overflow: auto;
	background: var(--vc-color-light-deeper);
}

.intersection-demo__section {
	flex-shrink: 0;
	min-height: 80px;
}

.intersection-demo__content {
	margin: 0;
	padding: 16px;
	color: #fff;
	background: var(--vc-color-primary);
}
</style>
```
:::

## 移动端

`MIntersection` 的结构与 `Intersection` 相同，根节点另有标记类 `.vcm-intersection`。数字 `offset` 是 750 稿长度，随 `--vc-rem` 缩放（375 宽下 `offset=200` 即提前 100px 判定可见）；字符串与 `Intersection` 相同，支持 `px` 和 `%`。底栏切换 `rem` 可比较判定时机。

:::playground
<!--
<config lang="json5">
{
	mobile: true
}
</config>
-->
```vue
<template>
	<div class="m-intersection-demo">
		<p class="m-intersection-demo__result">
			默认：{{ states.normal ? '可见' : '不可见' }}；offset 200：{{ states.offset ? '可见' : '不可见' }}
		</p>
		<MScroller height="320px" class="m-intersection-demo__box">
			<div class="m-intersection-demo__space" />
			<div class="m-intersection-demo__row">
				<MIntersection v-model="states.normal" class="m-intersection-demo__target">默认</MIntersection>
				<MIntersection v-model="states.offset" :offset="200" class="m-intersection-demo__target">offset 200</MIntersection>
			</div>
			<div class="m-intersection-demo__space" />
		</MScroller>
	</div>
</template>

<script setup>
import { reactive } from 'vue';
import { MIntersection, MScroller } from '@deot/vc';

const states = reactive({ normal: false, offset: false });
</script>

<style scoped>
.m-intersection-demo {
	display: flex;
	flex-direction: column;
	gap: calc(var(--vc-rem) * 16);
}

.m-intersection-demo__result {
	margin: 0;
	padding-inline: calc(var(--vc-rem) * 32);
	font-size: calc(var(--vc-rem) * 28);
}

.m-intersection-demo__box {
	background: var(--vc-color-light-deeper);
}

.m-intersection-demo__space {
	height: calc(var(--vc-rem) * 800);
}

.m-intersection-demo__row {
	display: flex;
	gap: calc(var(--vc-rem) * 16);
	padding-inline: calc(var(--vc-rem) * 32);
}

.m-intersection-demo__target {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	height: calc(var(--vc-rem) * 88);
	color: #fff;
	font-size: calc(var(--vc-rem) * 28);
	background: var(--vc-color-primary);
}
</style>
```
:::

## 注意事项

- 只按最近的那一层滚动容器裁剪：容器本身被外层滚出视口时，容器里的内容仍可能判定为可见。
- 根元素不可见（`display: none`、未插入文档）时判定为不可见；空内容的根元素高度为 0，贴边时也算相交，需要时给它尺寸。
- 不支持 IntersectionObserver 的环境下挂载后直接视为可见。

## API

### 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| v-model | 是否在可视区；只读，传入的值不影响判断 | `boolean` | - | `false` |
| tag | 根元素标签 | `string` | - | `'div'` |
| offset | 可视区四边的扩展量；数字在 Intersection 中为 px、在 MIntersection 中为 750 稿长度，字符串支持 `px` / `%` | `number \| string \| Array<number \| string>` | - | `0` |
| threshold | 露出比例达到该值才算可见 | `number` | `0` – `1` | `0` |
| once | 首次可见后停止监听 | `boolean` | - | `false` |
| disabled | 暂停监听 | `boolean` | - | `false` |

### 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| update:modelValue | 可见状态变化时触发，用于 `v-model` | `(visible: boolean) => void` | `visible`：当前是否可见 |
| change | 可见状态变化时触发；初始不可见时不触发 | `{ visible, ratio, entry }` | `visible` 是否可见；`ratio` 露出比例；`entry` 为 `IntersectionObserverEntry`，不支持 IntersectionObserver 时为 `null` |

### 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 内容 | `{ visible: boolean }` |

### 方法

通过组件 ref 访问。

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| refresh | 重新查找滚动容器，并把状态当作不可见重新判断；`once` 已触发时也重新开始 | - | `void` |

实例还暴露 `visible`，为当前是否可见。
