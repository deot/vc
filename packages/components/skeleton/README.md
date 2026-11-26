## 骨架屏（Skeleton）

在内容加载完成前用灰色块占位，减少等待时的空白与布局跳动。移动端入口导出的 `MSkeleton` / `MSkeletonItem` 与 `Skeleton` / `SkeletonItem` 的属性和插槽相同，尺寸按 750 稿随 `--vc-rem` 缩放，见 [移动端](#移动端)。

### 何时使用

- 首次加载数据时，用接近真实布局的占位代替空白或单个加载图标。
- 列表、卡片等结构固定的区域，用 `repeat` 一次给出多份占位。

### 基础用法

默认显示一条标题和 3 行段落，末行较短。`loading` 为 `false` 时直接渲染默认插槽，不包外层节点。

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
	<div class="skeleton-demo">
		<div class="skeleton-demo__row">
			<Button @click="handleToggle">{{ isLoading ? '显示内容' : '重新加载' }}</Button>
		</div>
		<Skeleton :loading="isLoading">
			<div class="skeleton-demo__content">
				<h4>条目标题</h4>
				<p>加载完成后的内容。</p>
			</div>
		</Skeleton>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, Skeleton } from '@deot/vc';

const isLoading = ref(true);

const handleToggle = () => {
	isLoading.value = !isLoading.value;
};
</script>

<style scoped>
.skeleton-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.skeleton-demo__row {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}

.skeleton-demo__content {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.skeleton-demo__content h4,
.skeleton-demo__content p {
	margin: 0;
}
</style>
```
:::

### 图片、标题与段落

- `image` 在左侧显示图片占位：`true` 为默认尺寸的方形，`{ size, shape: 'circle' }` 可作头像。
- `title` 为 `false` 时不显示标题，数字或字符串为标题宽度。
- `rows` 为数字时是行数，为数组时是逐行宽度（行数即数组长度）。
- 数字长度为 px（`MSkeleton` 为 750 稿），字符串为 CSS 长度。

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
	<div class="skeleton-demo">
		<Skeleton image />
		<Skeleton :image="{ shape: 'circle', size: 40 }" :title="false" :rows="2" />
		<Skeleton :title="160" :rows="['100%', '90%', '40%']" />
	</div>
</template>

<script setup>
import { Skeleton } from '@deot/vc';
</script>

<style scoped>
.skeleton-demo {
	display: flex;
	flex-direction: column;
	gap: 24px;
}
</style>
```
:::

### 自定义布局

`placeholder` 插槽替换预设骨架，用 `SkeletonItem` 拼出与真实内容一致的结构；`repeat` 重复整份占位，插槽参数 `index` 为份序号。`SkeletonItem` 的 `width`、`height` 设置尺寸，`shape="circle"` 为两端全圆：方块为圆形，长条为胶囊。

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
	<Skeleton class="skeleton-demo" :repeat="3">
		<template #placeholder="{ index }">
			<div class="skeleton-demo__item">
				<SkeletonItem :width="40" :height="40" shape="circle" />
				<div class="skeleton-demo__lines">
					<SkeletonItem :width="index % 2 ? '50%' : '35%'" />
					<SkeletonItem width="80%" :height="12" />
				</div>
				<SkeletonItem :width="48" :height="20" />
			</div>
		</template>
	</Skeleton>
</template>

<script setup>
import { Skeleton, SkeletonItem } from '@deot/vc';
</script>

<style scoped>
.skeleton-demo__item {
	display: flex;
	align-items: center;
	gap: 16px;
}

.skeleton-demo__lines {
	display: flex;
	flex: 1;
	flex-direction: column;
	gap: 8px;
}
</style>
```
:::

### 延迟显示

`delay`（毫秒）：`loading` 持续超过 `delay` 才显示骨架，请求很快时不会闪一下。等待期间保留已有内容；首次加载时为空。

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
	<div class="skeleton-demo">
		<div class="skeleton-demo__row">
			<Button @click="handleLoad(150)">快请求（150ms）</Button>
			<Button @click="handleLoad(1500)">慢请求（1500ms）</Button>
		</div>
		<Skeleton :loading="isLoading" :delay="300" :rows="2">
			<p class="skeleton-demo__result">第 {{ count }} 次结果</p>
		</Skeleton>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, Skeleton } from '@deot/vc';

const isLoading = ref(false);
const count = ref(1);

const handleLoad = (duration) => {
	isLoading.value = true;
	setTimeout(() => {
		count.value++;
		isLoading.value = false;
	}, duration);
};
</script>

<style scoped>
.skeleton-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.skeleton-demo__row {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}

.skeleton-demo__result {
	margin: 0;
}
</style>
```
:::

### 动画

默认显示闪光动画，`animated` 为 `false` 时静止；系统开启“减弱动态效果”时不闪光。闪光用 `transform` 平移，不逐帧重绘。`SkeletonItem` 不传 `animated` 时跟随外层 `Skeleton`，单独使用时开启。

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
	<div class="skeleton-demo">
		<div class="skeleton-demo__row">
			<Switch v-model="isAnimated" />
			<span>animated</span>
		</div>
		<Skeleton :animated="isAnimated" image :rows="2" />
		<Skeleton :animated="isAnimated">
			<template #placeholder>
				<div class="skeleton-demo__lines">
					<SkeletonItem width="60%" />
					<SkeletonItem width="40%" :animated="false" />
				</div>
			</template>
		</Skeleton>
		<div class="skeleton-demo__lines">
			<SkeletonItem width="50%" />
			<SkeletonItem width="30%" :height="12" />
		</div>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Skeleton, SkeletonItem, Switch } from '@deot/vc';

const isAnimated = ref(true);
</script>

<style scoped>
.skeleton-demo {
	display: flex;
	flex-direction: column;
	gap: 24px;
}

.skeleton-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}

.skeleton-demo__lines {
	display: flex;
	flex-direction: column;
	gap: 8px;
}
</style>
```
:::

上例第二组中，第二条 `SkeletonItem` 设置了 `:animated="false"`，始终静止；第一条跟随外层开关。最后一组为单独使用的 `SkeletonItem`，默认闪光。

## 移动端

`MSkeleton` / `MSkeletonItem` 的属性、插槽、结构与桌面端相同，根节点另有标记类 `.vcm-skeleton` / `.vcm-skeleton-item`，数字长度为 750 稿。尺寸写为 `calc(var(--vc-rem) * n)`，随 `--vc-rem` 缩放；底栏切换 `rem` 可查看不同屏宽下的效果。

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
	<div class="m-skeleton-demo">
		<MSkeleton />
		<MSkeleton :image="{ shape: 'circle', size: 80 }" :title="false" :rows="2" :repeat="3" />
		<MSkeleton>
			<template #placeholder>
				<div class="m-skeleton-demo__card">
					<MSkeletonItem :height="300" />
					<MSkeletonItem width="60%" />
					<div class="m-skeleton-demo__row">
						<MSkeletonItem :width="120" :height="56" shape="circle" />
						<MSkeletonItem :width="120" :height="56" shape="circle" />
					</div>
				</div>
			</template>
		</MSkeleton>
		<MSkeleton :animated="false" image :rows="2" />
	</div>
</template>

<script setup>
import { MSkeleton, MSkeletonItem } from '@deot/vc';
</script>

<style scoped>
.m-skeleton-demo {
	display: flex;
	flex-direction: column;
	gap: calc(var(--vc-rem) * 48);
	padding-inline: calc(var(--vc-rem) * 32);
}

.m-skeleton-demo__card {
	display: flex;
	flex-direction: column;
	gap: calc(var(--vc-rem) * 24);
}

.m-skeleton-demo__row {
	display: flex;
	gap: calc(var(--vc-rem) * 16);
}
</style>
```
:::

尺寸对比如下（括号内为 375 宽下的 px）：

| 项 | `Skeleton` | `MSkeleton`（750 稿） |
| --- | --- | --- |
| 段落行高 / 行距 | `16px` / `16px` | 36（18）/ 24（12） |
| 标题高度 / 与段落的间距 | `20px` / `24px` | 64（32）/ 32（16） |
| 图片边长 / 右侧间距 | `48px` / `16px` | 96（48）/ 32（16） |
| 每份的间距 | `24px` | 48（24） |
| 圆角 | `4px` | 4（2） |

## 主题与局部覆盖

全局参数通过 `--vc-<参数>` 配置，单个组件通过 `--vc-skeleton-<参数>` 覆盖。

### 全局

| 参数 | 使用位置 | 值 |
| --- | --- | --- |
| color-neutral-light | 占位块底色 | 亮色：`#EDEFF1`；暗色：`#3B4354` |
| background-color-light | 闪光亮带 | 亮色：`#F7F8FA`；暗色：`#2D3444` |

### 局部

尺寸与颜色写成局部变量 `--vc-skeleton-<键>`，桌面端的默认值见下表，`MSkeleton` 在 `.vcm-skeleton` 上覆盖。设在 `Skeleton` 根节点上时，其中的 `SkeletonItem` 一并生效；`Image` 的加载占位也读取 color / highlight-color / duration。

| 参数 | 使用位置 | 默认值 |
| --- | --- | --- |
| color / highlight-color | 底色 / 闪光亮带 | `color-neutral-light` / `background-color-light` |
| duration | 闪光一次扫过的时长 | `1.4s` |
| row-height / row-gap | 段落行高（也是 `SkeletonItem` 的默认高度）/ 行距 | `16px` / `16px` |
| last-row-width | `rows` 为数字时末行的宽度 | `60%` |
| title-width / title-height | 标题条 | `40%` / `20px` |
| title-gap | 标题与段落的间距 | `24px` |
| image-size / image-gap | 图片边长 / 右侧间距 | `48px` / `16px` |
| group-gap | `repeat` 时每份的间距 | `24px` |
| radius | 圆角（`shape="circle"` 时为全圆） | `4px` |

## API

`MSkeleton` / `MSkeletonItem` 的属性、插槽与桌面端相同，数字长度为 750 稿，可从 `@deot/vc` 导入。

### Skeleton 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| loading | 是否显示骨架；为 `false` 时渲染默认插槽 | `boolean` | - | `true` |
| animated | 是否显示闪光动画 | `boolean` | - | `true` |
| title | 标题条；数字 / 字符串为宽度 | `boolean \| number \| string` | - | `true` |
| rows | 段落行数，或逐行宽度 | `number \| (number \| string)[]` | - | `3` |
| image | 左侧图片占位 | `boolean \| { size?: number \| string, shape?: 'square' \| 'circle' }` | - | `false` |
| repeat | 骨架重复份数 | `number` | - | `1` |
| delay | `loading` 持续超过该毫秒数才显示骨架 | `number` | - | `0` |

### Skeleton 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 加载完成后的内容 | - |
| placeholder | 自定义骨架，替换预设；按 `repeat` 渲染多次 | `{ index: number }` |

### SkeletonItem 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| width | 宽度 | `number \| string` | - | 占满 |
| height | 高度 | `number \| string` | - | `row-height` |
| shape | 形状，`circle` 为两端全圆 | `string` | `square` / `circle` | `square` |
| animated | 是否闪光；不传时跟随外层 `Skeleton`，单独使用时开启 | `boolean` | - | - |
