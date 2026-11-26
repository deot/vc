## 文本（Text）

根据容器宽度限制文本行数，截断后可悬停查看全文。

移动端入口导出的 `MText` 与 `Text` 是同一实现。

### 何时使用

需要限制长文本的展示行数，或省略中间内容并保留尾部信息。父容器应提供可测量的宽度。

### 基础用法

通过 `value` 绑定要显示的文本内容，`line` 控制要显示的文本行数。

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
	<div class="text-demo">
		<div class="text-demo__row">
			<span>显示行数</span>
			<InputNumber v-model="line" class="text-demo__number" :min="1" :max="3" />
		</div>
		<label class="text-demo__field">
			<span>文本内容</span>
			<Textarea v-model="content" :rows="4" />
		</label>
		<Text :value="content" :line="line" />
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Text, InputNumber, Textarea } from '@deot/vc';

const content = ref('Text 会根据容器宽度和指定行数测量文本，内容超出时自动添加省略符。你可以通过上方输入框调整显示行数，也可以直接编辑这段文案，观察组件如何响应内容变化。悬停截断后的文字，还可以在弹层中查看完整内容。');
const line = ref(1);
</script>

<style scoped>
.text-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
	width: 100%;
	max-width: 480px;
}

.text-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}

.text-demo__number {
	width: 120px;
}

.text-demo__field {
	display: flex;
	flex-direction: column;
	gap: 8px;
}
</style>
```
:::

### 自定义结尾

通过 `ellipsis` 自定义结尾内容。

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
	<div class="text-demo">
		<div class="text-demo__item">
			<span class="text-demo__label">默认省略符</span>
			<Text :value="content" :line="1" />
		</div>
		<div class="text-demo__item">
			<span class="text-demo__label">自定义省略符</span>
			<Text :value="content" :line="1" ellipsis=" ··· 查看更多" />
		</div>
	</div>
</template>

<script setup>
import { Text } from '@deot/vc';

const content = '这是一段较长的说明文字，用来对比默认省略符和自定义省略符的展示效果。';
</script>

<style scoped>
.text-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
	width: 100%;
	max-width: 320px;
}

.text-demo__item {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.text-demo__label {
	font-size: 13px;
	opacity: 0.65;
}
</style>
```
:::

### 保留尾部（slice 模式）

通过 `slice` 指定一段固定保留的尾部，语义等价 `value.slice(slice)`；未超出行数时仍显示原文。

- `slice = -5`：保留末尾 5 个字符，渲染如 `abc...lmnop`
- `slice = 0`：尾部 = 整串，省略号被置于最前 `...完整文本`
- `slice = N`（正整数）：尾部 = `value.slice(N)`，从指定下标开始保留

保留的尾部与省略符自身过长时，前缀置空但尾部不会继续裁剪，结果可能超过 `line`，尤其是 `slice = 0`。

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
	<div class="text-demo">
		<div class="text-demo__item">
			<span class="text-demo__label">普通截断</span>
			<Text :value="fileName" :line="1" />
		</div>
		<div class="text-demo__item">
			<span class="text-demo__label">保留文件后缀</span>
			<Text :value="fileName" :line="1" :slice="-9" ellipsis="…" />
		</div>
	</div>
</template>

<script setup>
import { Text } from '@deot/vc';

const fileName = '2026年第三季度示例内容说明与结构展示文档.final.pdf';
</script>

<style scoped>
.text-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
	width: 100%;
	max-width: 280px;
}

.text-demo__item {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.text-demo__label {
	font-size: 13px;
	opacity: 0.65;
}
</style>
```
:::

### 展开 / 收起

提供 `expand` 插槽即开启：内容超出 `line` 时，插槽内容跟在省略符后面作为展开入口，点击后显示全文并在末尾显示收起入口。插槽参数 `expanded` 为当前是否展开；需要从外部控制或读取时使用 `v-model:expanded`，点击入口切换时还会触发 `expand-change`。

入口按整体宽度预留，不会拆到两行；需要贴右显示时给 `.vc-text__expand` 设置 `float: right`。

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
	<div class="text-demo">
		<div class="text-demo__item">
			<span class="text-demo__label">跟在省略符后（{{ isExpanded ? '已展开' : '已收起' }}）</span>
			<Text v-model:expanded="isExpanded" :value="content" :line="2">
				<template #expand="{ expanded }">
					<span class="text-demo__link">{{ expanded ? '收起' : '展开' }}</span>
				</template>
			</Text>
		</div>
		<div class="text-demo__item is-float">
			<span class="text-demo__label">右浮动</span>
			<Text :value="content" :line="2" @expand-change="handleExpandChange">
				<template #expand="{ expanded }">
					<span class="text-demo__link">{{ expanded ? '收起' : '展开' }}</span>
				</template>
			</Text>
		</div>
		<p class="text-demo__result">右浮动示例：{{ status }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Text } from '@deot/vc';

const content = '这是一段较长的说明文字，超出两行后会在省略符后显示展开入口。点击入口查看全文，全文末尾会显示收起入口，再次点击回到截断状态。';
const isExpanded = ref(false);
const status = ref('未切换');

const handleExpandChange = (expanded) => {
	status.value = `expand-change：${expanded ? '展开' : '收起'}`;
};
</script>

<style scoped>
.text-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
	width: 100%;
	max-width: 320px;
}

.text-demo__item {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.text-demo__label {
	font-size: 13px;
	opacity: 0.65;
}

.text-demo__link {
	padding-left: 4px;
	color: var(--vc-color-primary);
}

.text-demo__item.is-float :deep(.vc-text__expand) {
	float: right;
}

.text-demo__result {
	margin: 0;
}
</style>
```
:::

### 全文提示

截断后悬停查看全文。`theme` 设置全文 Popover 的主题，`placement` 设置弹出位置，`portalStyle` 设置弹层样式；不传 `portalStyle` 时弹层宽度取 Text 根节点的宽度。

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
	<div class="text-demo">
		<div class="text-demo__item">
			<span class="text-demo__label">dark · top（默认）</span>
			<Text :value="content" :line="1" />
		</div>
		<div class="text-demo__item">
			<span class="text-demo__label">light · bottom-left · 宽 240px</span>
			<Text
				:value="content"
				:line="1"
				theme="light"
				placement="bottom-left"
				:portal-style="{ width: '240px' }"
			/>
		</div>
	</div>
</template>

<script setup>
import { Text } from '@deot/vc';

const content = '这是一段较长的说明文字，截断后悬停可以在弹层中查看完整内容，弹层的主题、位置与宽度都可以调整。';
</script>

<style scoped>
.text-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
	width: 100%;
	max-width: 320px;
}

.text-demo__item {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.text-demo__label {
	font-size: 13px;
	opacity: 0.65;
}
</style>
```
:::

### 自定义渲染与测量

`renderRow` 接收测量后的展示文本 `value` 与前缀结束下标 `index`，返回要渲染的内容；它额外渲染的节点不参与测量，可用 `indent` 为首行预留同样的宽度（px）。`clip` 在每次计算完成时触发，参数为前缀结束下标（`-1` 表示无需截断）。`resize` 设置尺寸监听的防抖间隔（ms），`shrink` 控制根节点在 flex 布局中的 `flex-shrink`，`tag` 设置根节点标签。

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
	<div class="text-demo">
		<div class="text-demo__item">
			<span class="text-demo__label">renderRow 前置标签 · indent 40 · resize 300</span>
			<Text
				:value="content"
				:line="2"
				:indent="40"
				:resize="300"
				:render-row="renderRow"
				@clip="handleClip"
			/>
		</div>
		<div class="text-demo__item">
			<span class="text-demo__label">flex 行内 · shrink · tag="span"</span>
			<div class="text-demo__row">
				<span class="text-demo__prefix">前缀</span>
				<Text tag="span" :value="content" :line="1" shrink />
			</div>
		</div>
		<p class="text-demo__result">clip：{{ clipIndex }}</p>
	</div>
</template>

<script setup>
import { h, ref } from 'vue';
import { Text } from '@deot/vc';

const content = '这是一段较长的说明文字，用来演示自定义渲染、首行预留宽度与 flex 布局下的测量结果，改变窗口宽度后会重新计算。';
const clipIndex = ref('-');

const renderRow = ({ value }) => [h('span', { class: 'text-demo__badge' }, '标签'), value];

const handleClip = (index) => {
	clipIndex.value = index;
};
</script>

<style scoped>
.text-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
	width: 100%;
	max-width: 320px;
}

.text-demo__item {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.text-demo__label {
	font-size: 13px;
	opacity: 0.65;
}

.text-demo__item :deep(.text-demo__badge) {
	display: inline-block;
	box-sizing: border-box;
	width: 40px;
	padding-right: 8px;
	color: var(--vc-color-primary);
}

.text-demo__row {
	display: flex;
	align-items: center;
	gap: 8px;
	min-width: 0;
}

.text-demo__prefix {
	flex-shrink: 0;
}

.text-demo__result {
	margin: 0;
}
</style>
```
:::

## API

### 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| tag | 根节点标签，初始化时确定 | `string` | - | `'div'` |
| value | 原始文本 | `string` | - | `''` |
| line | 测量允许的行数，`0` 显示全文 | `number` | 非负整数 | `0` |
| indent | 测量时叠加到宿主 `text-indent` 的偏移量（px），不直接设置展示样式 | `number` | - | `0` |
| shrink | 根节点的 `flex-shrink`；布尔值转换为 `1` / `0`，数字直接使用；不传时不设置内联值 | `boolean \| number` | 布尔值或非负数字 | `undefined` |
| resize | 尺寸监听；`true` / `0` 立即计算，正数为防抖间隔（ms，首尾触发），`false` 不监听 | `boolean \| number` | - | `100` |
| ellipsis | 截断时使用的省略符；保持默认值且未使用 `slice`、`renderRow`、`indent`、`clip` 时由 CSS 截断（见使用注意） | `string` | - | `'…'` |
| slice | 截断时保留 `value.slice(slice)`；负数从末尾计算，`0` 保留整串，正数从指定下标开始；大于等于文本长度时尾部为空 | `number` | - | `undefined` |
| renderRow | 测量完成后的渲染函数；接收展示文本 `value`、测量下标 `index`，第二个参数为 Vue 的 `SetupContext`，返回可渲染内容 | `(attrs: { value: string; index: number }, context: SetupContext) => any` | - | 返回 `attrs.value` |
| theme | 全文 Popover 的主题 | `string` | `dark`、`light`、`none` | `'dark'` |
| placement | 全文 Popover 的位置 | `string` | `top`、`left`、`right`、`bottom`、`bottom-left`、`bottom-right`、`top-left`、`top-right`、`right-top`、`right-bottom`、`left-top`、`left-bottom` | `'top'` |
| portalClass | 全文 Popover 的类名 | `object \| string \| any[]` | - | `undefined` |
| portalStyle | 全文 Popover 的样式；未提供有效值时使用 Text 根节点的宽度，始终附加 `word-break: break-all` | `object \| string \| any[]` | - | `undefined` |
| expanded | 是否显示全文，支持 `v-model:expanded`；只在提供 `expand` 插槽时生效 | `boolean` | - | `false` |

### 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| clip | 每次计算完成时触发，包括未截断时；监听它会使组件改用 JS 测量 | `(index: number) => void` | `-1` 表示无需截断；正数为前缀结束下标；`0` 在传入 `slice` 时表示空前缀，未传 `slice` 时仍显示原文 |
| update:expanded | 点击入口切换展开状态时触发 | `(expanded: boolean) => void` | 切换后是否展开 |
| expand-change | 点击入口切换展开状态时触发；外部修改 `expanded` 不触发 | `(expanded: boolean) => void` | 切换后是否展开 |

### 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| expand | 展开 / 收起入口；提供即开启。内容超出 `line` 时显示：收起时跟在省略符（及 `slice` 尾部）后，展开时跟在全文后；未超出时不显示。点击入口外层切换状态 | `{ expanded: boolean }` |

### 使用注意

- `MText` 的全文提示同样由鼠标悬停触发；触屏上需要查看全文时可使用 `expand` 插槽。
- 全文提示在所在的滚动容器（或页面）滚动期间不弹出：内容从静止的鼠标下经过不算悬停，滚动停止后鼠标仍在该文字上时再弹出。
- 内容通过 `value` 或 `renderRow` 提供；`expand` 插槽只用于展开入口，组件没有内容插槽或公开方法。
- 截断方式：`line > 0`、`ellipsis` 为默认值、且没有 `slice`、`renderRow`、`indent`、`expand` 插槽，也没有监听 `clip` 时，由 CSS 截断（`line-clamp`）。这时不测量、不监听尺寸，DOM 中是完整文本，是否截断到鼠标移入时才判断，截断才弹出全文。其余情况走 JS 测量，以下几条只针对 JS 测量。
- 默认在首次尺寸回调前以隐藏全文参与布局。初始化传入 `resize=false` 时不会首次计算，内容为空；后续修改 `value`、`line`、`indent`、`slice` 或 `ellipsis` 仍会触发计算。
- `resize` 的监听与防抖策略在初始化时确定，不支持通过运行时切换该属性重建监听。
- 自定义 `renderRow` 的额外节点不会参与原始文本测量；字号、宽度和省略符应保持可容纳，`line` 不是强制 CSS 裁剪。
- `expand` 插槽是否提供在初始化时确定。提供后不再弹出悬停全文；是否截断只看原文，原文放得下就不显示入口；截断位置按入口外层 `.vc-text__expand` 的宽度预留，切换后按新入口的宽度重新计算。
- 在虚拟列表中使用 `expand` 插槽时，用 `v-model:expanded` 保存每行的展开状态：行被回收后重新渲染会回到 `expanded` 的值，测量池也按它计算高度。
