## 提示框（Alert）

展示需要用户关注的状态反馈或说明信息。移动端入口导出的 `MAlert` 与 `Alert` 的属性、事件和插槽相同，样式为通栏，尺寸按 750 稿随 `--vc-rem` 缩放，见 [移动端](#移动端)。

### 何时使用

- 展示与当前操作相关的信息、成功、错误或警告状态。
- 需要补充说明内容，或允许用户主动关闭提示时。
- 在页面顶部展示公告，内容较长时以跑马灯滚动。

### 基础用法

通过 `type` 设置提示类型。传入 `description` 后，组件会使用带说明文字的布局：标题加粗，说明文字使用次级颜色，图标与标题首行对齐；`description` 插槽可替代同名属性。`closable` 显示关闭入口，点击时触发 `close`。

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
	<div class="alert-demo">
		<Alert title="信息提示" description="这是一条需要关注的信息。" />
		<Alert type="success" title="成功提示" description="操作已经顺利完成。" />
		<Alert type="error" title="错误提示" description="操作失败，请稍后重试。" />
		<Alert type="warning" title="警告提示" closable @close="handleClose">
			<template #description>
				当前操作可能影响已有数据。
			</template>
		</Alert>
		<p v-if="isClosed" class="alert-demo__result">警告提示已关闭</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Alert } from '@deot/vc';

const isClosed = ref(false);

const handleClose = () => {
	isClosed.value = true;
};
</script>

<style scoped>
.alert-demo {
	display: grid;
	gap: 16px;
}

.alert-demo__result {
	margin: 0;
	font-size: 13px;
	color: var(--vc-color-dark-lightest);
}
</style>
```
:::

### 内容渲染

`title` 和 `description` 的字符串按文本渲染；需要 HTML 时传 `{ type: 'html', value }`，这类内容只应来自可信来源，或由全局的 `sanitize` 统一清洗，见 [Customer](../customer/README.md)。同时提供默认插槽或 `description` 插槽时，插槽优先。默认插槽中的 `<em>` 使用当前状态色强调。

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
	<div class="alert-demo">
		<Alert type="warning" :title="{ type: 'html', value: '已选择 <b>12</b> 项' }" />
		<Alert type="success">
			已选择<em>12</em>项，其中<em>3</em>项将被跳过。
		</Alert>
	</div>
</template>

<script setup>
import { Alert } from '@deot/vc';
</script>

<style scoped>
.alert-demo {
	display: grid;
	gap: 16px;
}
</style>
```
:::

### 图标

`icon` 为 `true`（默认）时按 `type` 显示状态图标，字符串作为图标类型（如 `warning`）显示对应图标，`false` 隐藏图标。

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
	<div class="alert-demo">
		<Alert type="success" title="默认按类型显示图标" />
		<Alert type="success" icon="warning" title="使用 warning 图标" />
		<Alert type="success" :icon="false" title="不显示图标" />
	</div>
</template>

<script setup>
import { Alert } from '@deot/vc';
</script>

<style scoped>
.alert-demo {
	display: grid;
	gap: 16px;
}
</style>
```
:::

### 跑马灯

`marquee` 为 `true` 时，标题行超出宽度才滚动，标题不再换行；滚动时两端渐隐。`marqueeOptions` 原样传给 [Marquee](../marquee/README.md)（如 `always`、`speed`、`delay`、`gap`、`pauseOnHover`），`delay` 默认 `1000`，即先停留 1 秒再滚动。带说明时只滚动标题行。

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
	<div class="alert-demo">
		<Alert type="warning" marquee closable :title="text" />
		<Alert marquee title="内容较短也滚动" :marquee-options="{ always: true, speed: 40 }" />
	</div>
</template>

<script setup>
import { Alert } from '@deot/vc';

const text = '这是一条较长的公告内容，长度超过容器宽度，超出时会从右向左循环滚动显示。'.repeat(2);
</script>

<style scoped>
.alert-demo {
	display: grid;
	gap: 16px;
}
</style>
```
:::

### 前后内容与显示控制

`prefix` 插槽替换左侧状态图标（传入后不再渲染 `icon`），`suffix` 插槽位于关闭入口之前，可放“查看详情”等操作；两者与首行文字居中对齐。`close` 插槽自定义关闭入口内容。整条提示可直接监听 `click`。`v-model` 控制是否显示，点击关闭入口时同步为 `false`，同时触发 `visible-change`。

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
	<div class="alert-demo">
		<Alert type="warning" title="系统将于今晚进行维护。" closable @click="handleClick">
			<template #suffix>
				<a class="alert-demo__more">查看详情</a>
			</template>
		</Alert>
		<Alert
			v-model="isVisible"
			type="error"
			title="自定义图标与关闭入口"
			closable
			@visible-change="handleVisibleChange"
		>
			<template #prefix>
				<Icon type="o-warning" />
			</template>
			<template #close>
				<span>不再提示</span>
			</template>
		</Alert>
		<div class="alert-demo__row">
			<p class="alert-demo__result">点击次数：{{ count }}；{{ status }}</p>
			<Button v-if="!isVisible" size="small" @click="handleShow">重新显示</Button>
		</div>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Alert, Button, Icon } from '@deot/vc';

const isVisible = ref(true);
const count = ref(0);
const status = ref('提示显示中');

const handleClick = () => {
	count.value++;
};

const handleVisibleChange = (visible) => {
	status.value = visible ? '提示显示中' : '提示已关闭';
};

const handleShow = () => {
	isVisible.value = true;
	status.value = '提示显示中';
};
</script>

<style scoped>
.alert-demo {
	display: grid;
	gap: 16px;
}

.alert-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}

.alert-demo__result {
	margin: 0;
}

.alert-demo__more {
	font-size: 13px;
	color: var(--vc-color-primary);
	cursor: pointer;
}
</style>
```
:::

## 移动端

`MAlert` 的属性、事件、插槽、结构与 `Alert` 相同，根节点另有标记类 `.vcm-alert`，跑马灯使用 `MMarquee`。样式为通栏：无边框、无圆角，标题与关闭入口使用状态色，背景与桌面端相同。尺寸按 750 稿设计，写为 `calc(var(--vc-rem) * n)`，随 `--vc-rem` 缩放；底栏切换 `rem` 可查看不同屏宽下的效果。

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
	<div class="m-alert-demo">
		<MAlert title="这是一条普通提示信息。" />
		<MAlert type="success" title="文件已上传完成。" />
		<MAlert type="error" title="网络不可用，请检查网络设置。" closable />
		<MAlert type="warning" title="提示标题" description="说明文字可以换行，用于补充当前提示的详细内容。" closable>
			<template #suffix>
				<MIcon type="right" />
			</template>
		</MAlert>
		<MAlert type="warning" marquee :title="longText" closable />
		<MAlert type="success" :icon="false" marquee title="内容较短也滚动" :marquee-options="{ always: true }" />
		<MAlert v-model="isVisible" type="error" :title="text" closable>
			<template #prefix>
				<MIcon type="o-warning" />
			</template>
			<template #close>
				<span>不再提示</span>
			</template>
		</MAlert>
		<MAlert type="warning">
			<MCarousel :height="40" vertical :indicator="false" :draggable="false">
				<MCarouselItem v-for="item in 3" :key="item">
					第 {{ item }} 条提示信息
				</MCarouselItem>
			</MCarousel>
		</MAlert>
		<div v-if="!isVisible" class="m-alert-demo__footer">
			<MButton size="small" @click="handleShow">重新显示</MButton>
		</div>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MAlert, MButton, MCarousel, MCarouselItem, MIcon } from '@deot/vc';

const isVisible = ref(true);
const text = '这是一条提示信息。';
const longText = '这是一条较长的提示信息，长度超过容器宽度，超出时会从右向左循环滚动显示。';

const handleShow = () => {
	isVisible.value = true;
};
</script>

<style scoped>
.m-alert-demo {
	display: flex;
	flex-direction: column;
	gap: calc(var(--vc-rem) * 16);
}

.m-alert-demo__footer {
	display: flex;
	padding-inline: calc(var(--vc-rem) * 32);
}
</style>
```
:::

尺寸如下（括号内为 375 宽下的 px）：

| 项 | 值 |
| --- | --- |
| 内边距 | 16（8） 32（16） |
| 字号、行高 | 28（14） / 40（20），单行高 72（36） |
| 带说明 | 标题 28（14） / 500，说明 26（13），间距 4（2）；图标、suffix 与关闭入口只占标题行，说明文字从标题左缘铺满到右边 |
| 图标 | 32（16），与文字间距 16（8） |
| 关闭入口 | 24（12），与文字间距 16（8） |
| 跑马灯渐隐宽度 | 16（8） |

两端的尺寸都写成局部变量 `--vc-alert-<键>`，桌面端的默认值为 px，移动端在 `.vcm-alert` 上覆盖，与样式的加载顺序无关。键为 `padding`、`desc-padding`、`border-width`、`radius`、`color`、`icon-size`、`desc-icon-size`、`icon-gap`、`suffix-gap`、`close-size`、`close-gap`、`close-color`、`close-hover-color`、`title-gap`、`desc-font-size`、`fade-width`；字号与行高沿用主题参数的组件级入口 `--vc-alert-font-size-small`、`--vc-alert-font-size`、`--vc-alert-line-height-large`。

竖向轮播可在默认插槽中放入 `MCarousel`（`vertical`，高度 40），见上方 demo 最后一条。

## 主题与局部覆盖

全局参数通过 `--vc-<参数>` 配置，单个组件通过 `--vc-alert-<参数>` 覆盖。同一参数可能作用于多个状态；多命名空间时在使用位置中标明。

⚠ color-mix：四种状态的背景由对应状态色 8% 与 background-color-lightest 92% 混合，边框按 30% / 70% 混合。不支持时，背景使用 background-color-light，边框使用对应状态色。

### 全局

| 参数 | 使用位置 | 值 |
| --- | --- | --- |
| color-dark-light | 标题文字、关闭入口悬停 | 亮色：`#080F20`；暗色：`#E8E8E8` |
| color-dark-lighter | 说明文字 | 亮色：`#515151`；暗色：`#D9D9D9` |
| color-dark-lightest | 关闭入口 | 亮色：`#64758B`；暗色：`#C9C9C9` |
| color-error | 对应状态的图标、强调文字（`<em>`）、边框及浅底派生色 | `#F53F3F` |
| color-primary | 对应状态的图标、强调文字（`<em>`）、边框及浅底派生色 | `#456CF6` |
| color-success | 对应状态的图标、强调文字（`<em>`）、边框及浅底派生色 | `#1DB88C` |
| color-warning | 对应状态的图标、强调文字（`<em>`）、边框及浅底派生色 | `#E6A23C` |
| font-size-small | 单行提示文字、说明文字 | `13px` |
| font-size | 带说明时的标题 | `14px` |
| line-height-large | 文字行高 | `20px` |
| background-color-light | 不支持混合色时的状态背景 | 亮色：`#F7F8FA`；暗色：`#2D3444` |
| background-color-lightest | 状态背景和边框的混合表面色 | 亮色：`#FFFFFF`；暗色：`#252B3A` |

### 局部

| 参数 | 使用位置 | 值 |
| --- | --- | --- |
| alert-padding | 单行内边距 | 桌面端 `5px 11px`；移动端 16 32 |
| alert-desc-padding | 带说明时的内边距 | 桌面端 `9px 11px`；移动端 16 32 |
| alert-border-width | 边框宽度 | 桌面端 `1px`；移动端 `0` |
| alert-radius | 圆角 | 桌面端 `4px`；移动端 `0` |
| alert-color | 标题文字 | 桌面端 color-dark-light；移动端为对应状态色 |
| alert-icon-size / alert-desc-icon-size | 状态图标（单行 / 带说明） | 桌面端 `12px` / `14px`；移动端 32 |
| alert-icon-gap | 图标、prefix 与文字间距 | 桌面端 `8px`；移动端 16 |
| alert-suffix-gap | suffix 与文字间距 | 桌面端 `12px`；移动端 16 |
| alert-close-size / alert-close-gap | 关闭图标尺寸 / 与文字间距 | 桌面端 `12px` / `12px`；移动端 24 / 16 |
| alert-close-color / alert-close-hover-color | 关闭入口 / 悬停 | 桌面端 color-dark-lightest / color-dark-light；移动端为对应状态色 |
| alert-title-gap | 带说明时标题与说明的间距 | 桌面端 `2px`；移动端 4 |
| alert-desc-font-size | 说明文字字号 | 桌面端 font-size-small；移动端 26 |
| alert-fade-width | 跑马灯两端渐隐宽度 | 桌面端 `12px`；移动端 16 |

移动端的值为 750 稿长度。

## API

### 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| modelValue | 是否显示提示；关闭提示时通过 `update:modelValue` 同步为 `false` | `boolean` | - | `true` |
| type | 提示类型 | `'success' \| 'info' \| 'error' \| 'warning'` | `success`、`info`、`error`、`warning` | `info` |
| title | 标题。字符串按文本渲染，也可传渲染函数或 `{ type, value }`（需要 HTML 时传 `{ type: 'html', value }`），见 [Customer](../customer/README.md)；默认插槽优先 | `string \| number \| Function \| { type: string; value: any }` | - | `''` |
| description | 说明文字，取值与 title 相同；`description` 插槽优先 | `string \| number \| Function \| { type: string; value: any }` | - | `''` |
| icon | 图标配置；`true` 或空字符串使用当前 `type`，非空字符串作为 `Icon` 的 `type`（如 `warning`），`false` 隐藏图标 | `string \| boolean` | - | `true` |
| closable | 是否显示关闭入口 | `boolean` | - | `false` |
| marquee | 标题行超出宽度时滚动（跑马灯），标题不再换行 | `boolean` | - | `false` |
| marqueeOptions | 透传给 Marquee 的属性，如 `always`、`speed`、`delay`、`gap`、`pauseOnHover`；`delay` 默认 `1000` | `object` | - | `{}` |

### 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| close | 点击关闭入口时触发 | `() => void` | - |
| update:modelValue | 点击关闭入口时触发 | `(value: false) => void` | `value` 固定为 `false` |
| visible-change | 点击关闭入口时触发 | `(visible: false) => void` | `visible` 固定为 `false` |

### 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 标题内容，优先于 `title` | - |
| description | 说明内容，优先于 `description` 属性 | - |
| prefix | 替换左侧状态图标；传入后不渲染 `icon` | - |
| suffix | 关闭入口之前的内容，如操作链接 | - |
| close | 自定义关闭入口内容；仅在 `closable` 为 `true` 时渲染 | - |
