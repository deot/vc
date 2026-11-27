## 导航栏（NavBar）

页面顶部的导航栏：返回、标题、操作。只有移动端：`MNavBar`；`NavBar` 是相同实现的别名。

### 何时使用

- 二级及以下页面的顶部：返回上一页、显示当前页面标题与操作。
- 详情页的沉浸式头部：顶部透明叠在头图上，向下滚动时渐变为实底。

### 基础用法

默认显示返回箭头。`back` 为字符串时在箭头后显示文字，`backIcon` 为 `false` 时只显示文字，`back` 为 `false` 时不显示返回区域；点击返回区域触发 `back`。右侧内容用 `right` 或 `#right` 插槽，`#left` 放在返回区域之后；`subtitle` 显示在标题下方，`border` 为 `false` 时去掉底部分割线。

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
	<div class="m-nav-bar-demo">
		<MNavBar title="标题" @back="handleBack('返回')" />
		<MNavBar title="标题" back="返回" right="编辑" @back="handleBack('返回')" />
		<MNavBar title="新建" back="取消" :back-icon="false" @back="handleBack('取消')">
			<template #right>
				<MButton size="small" type="primary">完成</MButton>
			</template>
		</MNavBar>
		<MNavBar title="消息" subtitle="副标题" :back="false" :border="false">
			<template #right>
				<MIcon type="search" />
			</template>
		</MNavBar>
		<MNavBar title="标题" @back="handleBack('返回')">
			<template #left>
				<MIcon type="close" @click="handleBack('关闭')" />
			</template>
		</MNavBar>
		<p class="m-nav-bar-demo__result">{{ result }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MButton, MIcon, MNavBar } from '@deot/vc';

const result = ref('点击左侧区域');

const handleBack = (label) => {
	result.value = `点击了「${label}」`;
};
</script>

<style scoped>
.m-nav-bar-demo {
	display: flex;
	flex-direction: column;
	gap: calc(var(--vc-rem) * 16);
}

.m-nav-bar-demo__result {
	margin: 0;
	padding-inline: calc(var(--vc-rem) * 32);
	font-size: calc(var(--vc-rem) * 28);
	color: var(--vc-color-dark-extralight);
}
</style>
```
:::

### 标题居中

三列布局：两侧各占剩余宽度的一半，标题始终在正中，与左右内容的宽度无关。标题较长、放不下时，先占用两侧剩余的空间，仍放不下再单行省略；两侧内容不会被标题挤压或遮盖。`#title`、`#subtitle` 替换标题、副标题的内容，仍然居中并省略。

`#default` 替换整个中间区域（如放入 [MTabs](../tabs/README.md) 或搜索框），这时中间区域占满两侧内容之间的宽度。

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
	<div class="m-nav-bar-demo">
		<MNavBar title="这是一条很长很长很长很长很长很长很长的标题" back="返回">
			<template #right>
				<MIcon type="share" />
			</template>
		</MNavBar>
		<MNavBar title="短标题" back="返回上一页" right="更多" />
		<MNavBar>
			<template #title>
				<strong>插槽标题</strong>
			</template>
			<template #subtitle>
				<em>插槽副标题</em>
			</template>
		</MNavBar>
		<MNavBar>
			<MTabs v-model="tab" class="m-nav-bar-demo__tabs">
				<MTabsPane label="标签一" value="1" />
				<MTabsPane label="标签二" value="2" />
				<MTabsPane label="标签三" value="3" />
			</MTabs>
			<template #right>
				<MIcon type="search" />
			</template>
		</MNavBar>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MIcon, MNavBar, MTabs, MTabsPane } from '@deot/vc';

const tab = ref('2');
</script>

<style scoped>
.m-nav-bar-demo {
	display: flex;
	flex-direction: column;
	gap: calc(var(--vc-rem) * 16);
}

.m-nav-bar-demo__tabs {
	width: 100%;
}
</style>
```
:::

### 返回

点击返回区域（或聚焦后按 Enter / 空格）时依次处理：
1. 触发 `back`；有监听时到此为止；
2. 没有监听时，调用全局配置 `VcInstance.configure({ MNavBar: { back } })` 中的处理函数，参数为 `{ instance }`；返回任何非 `undefined` 的值都视为已接管；
3. 否则调用 `window.history.back()`。Vue Router 基于 history，默认就能回到上一页。

例如没有上一页时回到首页：

```js
VcInstance.configure({
	MNavBar: {
		back: () => (window.history.length > 1 ? undefined : router.replace('/'))
	}
});
```

### 固定在顶部

- `fixed` 让导航栏贴在视口顶部，根节点留在原位作为同高的占位，页面内容不会被遮住。`placeholder` 设为 `false` 可以去掉占位。
- 固定时默认在顶部补上安全区（`env(safe-area-inset-top)`），`safeArea` 设为 `false` 可以关闭；不固定时也能用 `safeArea` 单独开启。
- `zIndex` 只在固定时生效，默认为 10。

:::playground
<!--
<config lang="json5">
{
	mobile: true,
	local: false
}
</config>
-->
```vue
<template>
	<div class="m-nav-bar-demo">
		<MNavBar
			fixed
			title="固定导航栏"
			:placeholder="hasPlaceholder"
			:safe-area="false"
			:z-index="20"
		/>
		<div class="m-nav-bar-demo__body">
			<MButton size="small" @click="hasPlaceholder = !hasPlaceholder">
				{{ hasPlaceholder ? '去掉占位' : '保留占位' }}
			</MButton>
			<p v-for="i in 20" :key="i" class="m-nav-bar-demo__row">第 {{ i }} 行</p>
		</div>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MButton, MNavBar } from '@deot/vc';

const hasPlaceholder = ref(true);
</script>

<style scoped>
.m-nav-bar-demo__body {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: calc(var(--vc-rem) * 16);
	padding: calc(var(--vc-rem) * 32);
}

.m-nav-bar-demo__row {
	margin: 0;
	font-size: calc(var(--vc-rem) * 28);
}
</style>
```
:::

### 透明与滚动渐变

- `transparent` 为 `true`：始终透明，没有背景与分割线，适合叠在有底色的头部上。
- `transparent` 为数字（750 稿长度）：滚动距离从 0 到该值时，背景、分割线与标题由透明渐变为实底。
  - 默认监听从导航栏位置向上最近的滚动容器，没有时为 window；导航栏不在滚动内容里时，用 `getScroller` 指定。
  - 当前的不透明度（0 – 1）写在根节点的 `--vc-nav-bar-progress` 上，样式里可以直接使用；所有插槽的参数 `{ progress }` 也是这个值，可用于按滚动切换图标颜色。
  - 滚动时只改这个变量；内容全是字符串时不重新渲染，有插槽或函数内容时 `progress` 每变化 0.01 更新一次。

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
	<div class="m-nav-bar-demo">
		<div class="m-nav-bar-demo__hero is-short">
			<MNavBar transparent title="始终透明" class="m-nav-bar-demo__light" />
		</div>
		<div class="m-nav-bar-demo__immersive">
			<MNavBar
				:transparent="300"
				:get-scroller="() => scroller"
				title="详情"
				class="m-nav-bar-demo__overlay"
			>
				<template #back="{ progress }">
					<MIcon type="left" class="m-nav-bar-demo__icon" :class="{ 'is-light': progress < 0.5 }" />
				</template>
				<template #right="{ progress }">
					<MIcon type="share" :class="{ 'is-light': progress < 0.5 }" />
				</template>
			</MNavBar>
			<div ref="scroller" class="m-nav-bar-demo__scroller">
				<div class="m-nav-bar-demo__hero">头图</div>
				<div v-for="i in 12" :key="i" class="m-nav-bar-demo__row">内容 {{ i }}</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MIcon, MNavBar } from '@deot/vc';

const scroller = ref();
</script>

<style scoped>
.m-nav-bar-demo {
	display: flex;
	flex-direction: column;
	gap: calc(var(--vc-rem) * 32);
}

.m-nav-bar-demo__light {
	--vc-nav-bar-color: #fff;
}

.m-nav-bar-demo__immersive {
	position: relative;
	height: calc(var(--vc-rem) * 720);
	overflow: hidden;
}

.m-nav-bar-demo__overlay {
	position: absolute;
	top: 0;
	right: 0;
	left: 0;
	z-index: 1;
}

.m-nav-bar-demo__icon {
	font-size: calc(var(--vc-rem) * 40);
}

.is-light {
	color: #fff;
	transition: color 0.2s;
}

.m-nav-bar-demo__scroller {
	height: 100%;
	overflow: auto;
	background: var(--vc-background-color-lightest);
}

.m-nav-bar-demo__hero {
	display: flex;
	align-items: center;
	justify-content: center;
	height: calc(var(--vc-rem) * 400);
	font-size: calc(var(--vc-rem) * 32);
	color: #fff;
	background: linear-gradient(135deg, var(--vc-color-primary), var(--vc-color-success));
}

.m-nav-bar-demo__hero.is-short {
	display: block;
	height: auto;
}

.m-nav-bar-demo__row {
	padding: calc(var(--vc-rem) * 28) calc(var(--vc-rem) * 32);
	font-size: calc(var(--vc-rem) * 28);
	border-bottom: 1px solid var(--vc-color-neutral-light);
}
</style>
```
:::

## 尺寸

长度按 750 稿书写并随 `--vc-rem` 缩放；括号内为 375 宽下的 px。

| 部位 | 值 |
| --- | --- |
| 栏高 | 88（44） |
| 两侧内边距 / 字号 | 32（16）/ 32（16） |
| 返回箭头、两侧图标 / 箭头与文字的间距 | 40（20）/ 8（4） |
| 标题字号 / 字重 | 34（17）/ 600 |
| 副标题字号 | 24（12） |

## 主题与局部覆盖

全局参数通过 `--vc-<参数>` 配置，组件级覆盖使用 `--vc-nav-bar-<参数>`。局部参数可以设在组件根节点或其祖先上。

### 全局

| 参数 | 使用位置 | 值 |
| --- | --- | --- |
| color-dark | 文字与图标 | 亮色：`#000000`；暗色：`#FFFFFF` |
| color-dark-lightest | 副标题 | 亮色：`#64758B`；暗色：`#C9C9C9` |
| color-neutral-light | 底部分割线 | 亮色：`#EDEFF1`；暗色：`#3B4354` |
| background-color-lightest | 背景 | 亮色：`#FFFFFF`；暗色：`#252B3A` |

### 局部

| 参数 | 说明 | 默认值 |
| --- | --- | --- |
| height | 栏高（不含安全区） | `calc(var(--vc-rem) * 88)` |
| color | 文字与图标颜色 | `var(--vc-color-dark)` |
| background | 背景 | `var(--vc-background-color-lightest)` |
| title-font-size | 标题字号 | `calc(var(--vc-rem) * 34)` |
| progress | 背景、分割线（滚动渐变时还有标题）的不透明度，由组件写入 | `1` |

## API

### 属性

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| title | 标题：居中、单行省略 | `string \| number \| Function \| { type, value }` | - |
| subtitle | 副标题，显示在标题下方 | 同 `title` | - |
| back | 返回区域：`true` 只显示箭头；字符串或函数为箭头后的文字；`false` 不显示 | `boolean \| string \| number \| Function \| { type, value }` | `true` |
| backIcon | 返回箭头，Icon 的 `type`；`false` 时只显示文字 | `string \| false` | `'left'` |
| right | 右侧内容 | 同 `title` | - |
| border | 底部分割线 | `boolean` | `true` |
| fixed | 固定在视口顶部 | `boolean` | `false` |
| placeholder | 固定时在原位置留同高占位（含安全区） | `boolean` | `true` |
| safeArea | 顶部补安全区；不传时跟随 `fixed` | `boolean` | - |
| zIndex | 固定时的层级 | `number` | `10`（CSS） |
| transparent | `true` 始终透明；数字（750 稿）为滚动渐变的距离 | `boolean \| number` | `false` |
| getScroller | `transparent` 为数字时监听的滚动容器 | `() => HTMLElement \| Window` | 最近的滚动容器，没有时为 window |

函数形式的 `title`、`subtitle`、`back`、`right` 收到 `{ progress }`。

### 事件

| 事件名 | 说明 | 回调参数 |
| --- | --- | --- |
| back | 点击返回区域，或聚焦后按 Enter / 空格 | 原生事件 |

### 插槽

所有插槽的参数都是 `{ progress }`。

| 名称 | 说明 |
| --- | --- |
| default | 替换整个中间区域 |
| title / subtitle | 替换标题 / 副标题的内容，仍然居中并省略 |
| back | 替换返回区域的内容，点击仍按上文处理 |
| left | 放在返回区域之后 |
| right | 右侧内容 |

### 无障碍

返回区域为 `role="button"`，可以用键盘聚焦；只有箭头时带 `aria-label`（中文为“返回”，随语言切换）。
