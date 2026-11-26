## 回到顶部（BackTop）

滚动超过一定距离后显示按钮，点击平滑回到所在滚动容器的顶部。

移动端入口导出的 `MBackTop` 与 `BackTop` 的属性、事件、插槽相同，数字长度为 750 稿，见 [移动端](#移动端)。

### 何时使用

- 长页面或长列表中，需要快速回到顶部。
- 局部滚动区域（如 `Scroller`、`overflow: auto` 的面板）中，需要回到该区域的顶部。

### 基础用法

把 `BackTop` 放在滚动内容中即可：从所在位置向上找最近的滚动容器（`Scroller`、`overflow` 为 `auto` / `scroll` 的元素），没有时为页面。滚动超过 `visibilityHeight`（默认 200px）后按钮出现在右下角，点击后用 `duration`（默认 300ms）平滑回到顶部；滚动中用户自己滚动（滚轮、触摸、按键）时停止。`v-model` 只读，同步当前是否显示。

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
	<div class="back-top-demo">
		<p class="back-top-demo__result">当前状态：{{ isVisible ? '已显示' : '未显示' }}</p>
		<Scroller class="back-top-demo__scroller" height="240px">
			<div v-for="item in 30" :key="item" class="back-top-demo__item">第 {{ item }} 行</div>
			<BackTop v-model="isVisible" :visibility-height="100" :right="16" :bottom="16" />
		</Scroller>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { BackTop, Scroller } from '@deot/vc';

const isVisible = ref(false);
</script>

<style scoped>
.back-top-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.back-top-demo__result {
	margin: 0;
}

.back-top-demo__scroller {
	border: 1px solid var(--vc-color-neutral-light);
	border-radius: 8px;
}

.back-top-demo__item {
	padding: 12px 16px;
	border-bottom: 1px solid var(--vc-color-neutral-light);
}
</style>
```
:::

### 位置

- `right` / `bottom` 为距滚动容器可视区右边、下边的距离（页面滚动时为视口）。数字在 BackTop 中为 px、在 MBackTop 中为 750 稿长度；字符串原样作为 CSS 长度，如 `'5vw'`。
- 滚动容器是元素时，按钮跟随它的可视区（去掉边框与滚动条）：页面滚动、容器尺寸变化时随之移动，容器离开视口后隐藏。
- 下边与底部安全区（`env(safe-area-inset-bottom)`）取较大者，按钮不会落进安全区。

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
	<div class="back-top-demo">
		<Scroller class="back-top-demo__scroller" height="240px">
			<div v-for="item in 30" :key="item" class="back-top-demo__item">第 {{ item }} 行</div>
			<BackTop :visibility-height="100" :right="24" bottom="10vh" />
		</Scroller>
	</div>
</template>

<script setup>
import { BackTop, Scroller } from '@deot/vc';
</script>

<style scoped>
.back-top-demo__scroller {
	border: 1px solid var(--vc-color-neutral-light);
	border-radius: 8px;
}

.back-top-demo__item {
	padding: 12px 16px;
	border-bottom: 1px solid var(--vc-color-neutral-light);
}
</style>
```
:::

### 滚动进度与事件

`showProgress` 在按钮边缘画一圈滚动进度环：从顶部顺时针填充，比例为已滚动距离 / 可滚动距离，未滚到的部分露出边框。环沿按钮的圆角绘制，改成胶囊等形状时同样贴边。`duration` 设置回到顶部的时长（`0` 为瞬间到顶），`zIndex` 设置层级；点击按钮触发 `click`，随后回到顶部。通过组件 ref 调用 `refresh()` 重新查找滚动容器并判断是否显示。

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
	<div class="back-top-demo">
		<div class="back-top-demo__row">
			<Button @click="handleRefresh">refresh()</Button>
		</div>
		<p class="back-top-demo__result">click 触发 {{ count }} 次</p>
		<Scroller class="back-top-demo__scroller" height="240px">
			<div v-for="item in 30" :key="item" class="back-top-demo__item">第 {{ item }} 行</div>
			<BackTop
				ref="backTop"
				show-progress
				:visibility-height="100"
				:duration="800"
				:z-index="200"
				:right="16"
				:bottom="16"
				@click="handleClick"
			/>
		</Scroller>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { BackTop, Scroller, Button } from '@deot/vc';

const backTop = ref();
const count = ref(0);

const handleClick = () => {
	count.value++;
};

const handleRefresh = () => {
	backTop.value.refresh();
};
</script>

<style scoped>
.back-top-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.back-top-demo__row {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}

.back-top-demo__result {
	margin: 0;
}

.back-top-demo__scroller {
	border: 1px solid var(--vc-color-neutral-light);
	border-radius: 8px;
}

.back-top-demo__item {
	padding: 12px 16px;
	border-bottom: 1px solid var(--vc-color-neutral-light);
}
</style>
```
:::

### 自定义内容与外观

默认插槽替换按钮内容，参数为 `{ visible }`。尺寸与颜色是局部变量，可在按钮的 class 上覆盖：

| 变量 | 说明 | BackTop | MBackTop |
| --- | --- | --- | --- |
| `--vc-back-top-right` / `--vc-back-top-bottom` | 位置，`right` / `bottom` 属性写入 | `40px` / `40px` | 750 稿 `32` / `80` |
| `--vc-back-top-size` | 按钮宽高 | `40px` | 750 稿 `80` |
| `--vc-back-top-radius` | 圆角 | `50%` | 同左 |
| `--vc-back-top-icon-size` | 图标大小 | `16px` | 750 稿 `36` |
| `--vc-back-top-color` / `--vc-back-top-hover-color` | 图标色 / 悬停色（只在可悬停的设备上） | 主题 `color-dark-light` / `color-primary` | 同左 |
| `--vc-back-top-background` | 底色 | 主题 `background-color-lightest` | 同左 |
| `--vc-back-top-border-color` | 边框色（1px，暗色主题下与页面区分） | 主题 `color-neutral-light` | 同左 |
| `--vc-back-top-box-shadow` | 阴影 | 主题 `box-shadow-floating` | 同左 |
| `--vc-back-top-progress-width` / `--vc-back-top-progress-color` | 进度环宽度 / 颜色（`showProgress`） | `2px` / 主题 `color-primary` | 750 稿 `4` / 同左 |
| `--vc-back-top-z-index` | 层级，`zIndex` 属性优先 | `100` | 同左 |

示例中按钮挂到 `body`，覆盖变量的 class 写在不带 `scoped` 的样式里。

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
	<div class="back-top-demo">
		<Scroller class="back-top-demo__scroller" height="240px">
			<div v-for="item in 30" :key="item" class="back-top-demo__item">第 {{ item }} 行</div>
			<BackTop class="back-top-demo__button" :visibility-height="100" :right="16" :bottom="16">
				顶部
			</BackTop>
		</Scroller>
	</div>
</template>

<script setup>
import { BackTop, Scroller } from '@deot/vc';
</script>

<style>
.back-top-demo__button {
	width: auto;
	padding: 0 16px;
	border-radius: 20px;
	--vc-back-top-background: var(--vc-color-primary);
	--vc-back-top-color: #fff;
	--vc-back-top-hover-color: #fff;
	--vc-back-top-border-color: transparent;
}
</style>

<style scoped>
.back-top-demo__scroller {
	border: 1px solid var(--vc-color-neutral-light);
	border-radius: 8px;
}

.back-top-demo__item {
	padding: 12px 16px;
	border-bottom: 1px solid var(--vc-color-neutral-light);
}
</style>
```
:::

## 移动端

`MBackTop` 与 `BackTop` 用法一致，按钮另有标记类 `.vcm-back-top`，只覆盖尺寸局部变量（默认值见上表）；数字 `visibilityHeight` / `right` / `bottom` 为 750 稿长度，随 `--vc-rem` 缩放：滚动超过 400（375 宽下 200px）后出现。

:::playground
<!--
<config lang="json5">
{
	mobile: true,
	local: false,
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
	<div class="m-back-top-demo">
		<MList>
			<MListItem v-for="item in 40" :key="item" :label="`第 ${item} 行`" :arrow="false" />
		</MList>
		<MBackTop show-progress />
	</div>
</template>

<script setup>
import { MList, MListItem, MBackTop } from '@deot/vc';
</script>
```
:::

## API

`MBackTop` 与 `BackTop` 用法一致，区别是数字 `visibilityHeight` / `right` / `bottom` 为 750 稿长度，随 `--vc-rem` 缩放，默认尺寸见上表。

### 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| v-model | 是否显示；只读，传入的值不影响判断 | `boolean` | - | `false` |
| visibilityHeight | 滚动超过该距离后显示；数字在 BackTop 中为 px、在 MBackTop 中为 750 稿长度 | `number` | - | BackTop `200`，MBackTop `400` |
| right | 距滚动容器可视区右边的距离；数字同上，字符串为 CSS 长度 | `number \| string` | - | 取样式默认值 |
| bottom | 距滚动容器可视区下边的距离；同 `right` | `number \| string` | - | 取样式默认值 |
| showProgress | 在按钮边缘画滚动进度环 | `boolean` | - | `false` |
| duration | 回到顶部的滚动时长（ms），`0` 为瞬间到顶 | `number` | - | `300` |
| zIndex | 层级 | `number \| string` | - | 取样式默认值 `100` |
| portal | 按钮挂到 `body`；为 `false` 时渲染在原处 | `boolean` | - | `true` |

### 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| click | 点击按钮时触发，随后回到顶部 | `MouseEvent` | - |

### 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 按钮内容，默认为图标 `back-top` | `{ visible: boolean }` |

### 方法

通过组件 ref 访问。

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| refresh | 重新查找滚动容器并判断是否显示 | - | `void` |

实例还暴露 `visible`，为当前是否显示。

## 注意事项

- 按钮默认挂到 `body`（`portal`），不受祖先的 `transform`、`overflow` 影响（例如滚轮驱动的 `Scroller` 根节点常驻 `will-change: transform`，留在原处的 `fixed` 按钮会随内容滚走）。`portal` 为 `false` 时渲染在原处，只在确定祖先没有 `transform`、`filter`、`will-change` 等时使用。
- 滚动容器是 `Scroller` 时，回到顶部交给它的 `scrollTo`，自绘滚动条同步移动。
- 系统开启「减弱动态效果」时瞬间回到顶部。
- 在 `KeepAlive` 中失活时隐藏并停止监听，激活后重新判断。
- 按钮为 `<button>`，带 `aria-label`（多语言 `vc.BackTop.label`）；隐藏时不可聚焦。
