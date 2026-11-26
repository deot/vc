## 标签页（Tabs）

将同级内容组织为可切换的面板，提供桌面端 `Tabs` / `TabsPane` 和移动端 `MTabs` / `MTabsPane`。

### 何时使用

在同一位置展示不同分类的内容，或通过标签导航到页面锚点。

### 基础用法

通过 `v-model` 绑定面板的 `value`。未设置 `value` 时使用从 0 开始的索引；动态增删时应显式提供稳定的 `value`。`disabled` 阻止点击切换，`animated` 默认为 `false`。点击有效标签时触发 `change` 与 `click`，重复点击当前项也会触发。

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
	<div class="tabs-demo">
		<Tabs v-model="value" animated @change="handleChange" @click="handleClick">
			<TabsPane value="first" label="标签一">标签一的内容。</TabsPane>
			<TabsPane value="second" label="标签二">标签二的内容。</TabsPane>
			<TabsPane value="third" label="禁用标签" disabled />
		</Tabs>
		<p class="tabs-demo__result">当前面板：{{ value }}；change {{ changeCount }} 次，click {{ clickCount }} 次</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Tabs, TabsPane } from '@deot/vc';

const value = ref('first');
const changeCount = ref(0);
const clickCount = ref(0);

const handleChange = () => {
	changeCount.value++;
};

const handleClick = () => {
	clickCount.value++;
};
</script>

<style scoped>
.tabs-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.tabs-demo__result {
	margin: 0;
}
</style>
```
:::

### 类型与尺寸

`type` 提供六种外观：`line`（默认，下划线）、`card`（连体描边）、`button`（灰底按钮）、`capsule`（灰底容器，选中项浮起）、`text`（文字加分隔线）、`round`（圆角胶囊）。除 `line` 外，其余外观与 RadioGroup 的同名 `type` 一致。`size` 可选 `mini` / `small` / `medium` / `large`，默认 `medium`：`line` 的标签栏高度依次为 32 / 36 / 40 / 44px，其余类型的高度依次为 24 / 28 / 32 / 36px。

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
	<div class="tabs-demo">
		<RadioGroup v-model="size" type="capsule" size="small">
			<Radio v-for="item in SIZES" :key="item" :value="item" :label="item" />
		</RadioGroup>
		<Tabs v-for="type in TYPES" :key="type" v-model="value" :type="type" :size="size">
			<TabsPane value="a" :label="type" />
			<TabsPane value="b" label="选项 B" />
			<TabsPane value="c" label="选项 C" />
			<TabsPane value="d" label="选项 D" disabled />
		</Tabs>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Tabs, TabsPane, RadioGroup, Radio } from '@deot/vc';

const TYPES = ['line', 'card', 'button', 'capsule', 'text', 'round'];
const SIZES = ['mini', 'small', 'medium', 'large'];
const value = ref('b');
const size = ref('medium');
</script>

<style scoped>
.tabs-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
	min-width: 0;
}
</style>
```
:::

### 标签栏位置

`placement` 设置标签栏相对内容的位置：`top`（默认）、`bottom`、`left`、`right`，各类型都支持。line 的分隔线和下划线在靠内容的一侧。左右两侧时标签纵向排列、宽度一致，`extra` 插槽放在标签栏底部；标签栏默认随内容撑高，给 Tabs 设置高度后，超出的标签可以上下滚动。

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
	<div class="tabs-demo">
		<RadioGroup v-model="placement" type="capsule" size="small">
			<Radio v-for="item in PLACEMENTS" :key="item" :value="item" :label="item" />
		</RadioGroup>
		<Tabs v-model="value" :placement="placement">
			<TabsPane value="first" label="标签一">标签一的内容。</TabsPane>
			<TabsPane value="second" label="标签二">标签二的内容。</TabsPane>
			<TabsPane value="third" label="标签三">标签三的内容。</TabsPane>
		</Tabs>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Tabs, TabsPane, RadioGroup, Radio } from '@deot/vc';

const PLACEMENTS = ['top', 'bottom', 'left', 'right'];
const placement = ref('left');
const value = ref('first');
</script>

<style scoped>
.tabs-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
	min-width: 0;
}
</style>
```
:::

### 关闭标签

关闭按钮要求父组件和面板同时开启 `closable`，所有类型都支持；禁用的面板不显示关闭按钮。`tab-remove` 只通知调用方；删除数据、关闭前确认及删除当前页后的选中值均由调用方处理。

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
	<div class="tabs-demo">
		<Tabs v-model="value" type="card" closable @tab-remove="handleRemove">
			<TabsPane
				v-for="item in items"
				:key="item.value"
				:value="item.value"
				:label="item.label"
				:closable="item.value !== 'first'"
			>
				{{ item.label }}的内容
			</TabsPane>
		</Tabs>
		<p class="tabs-demo__result">标签一保留；其他标签可以关闭。</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Tabs, TabsPane } from '@deot/vc';

const value = ref('second');
const items = ref([
	{ value: 'first', label: '标签一' },
	{ value: 'second', label: '标签二' },
	{ value: 'third', label: '标签三' }
]);

const handleRemove = (removedValue, index) => {
	items.value.splice(index, 1);
	if (value.value === removedValue) {
		value.value = items.value[Math.max(0, index - 1)].value;
	}
};
</script>

<style scoped>
.tabs-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.tabs-demo__result {
	margin: 0;
}
</style>
```
:::

### 标签溢出

标签总宽度超出标签栏时，可以用滚轮或触控板横向滚动；纵向滚轮同样会滚动标签栏，滚到两端后再交给页面。溢出时两端显示前后翻页按钮（`stepper`，为 `false` 时不显示），点击翻一屏，滚到端点的按钮置灰。切换选中项、增删标签或标签栏尺寸变化后，选中项会自动滚入可视区。滚动由 [Scroller](../scroller/README.md) 承载（`axis` 锁定为标签栏的排列方向），不显示滚动条；触摸设备上为原生滚动。

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
	<div class="tabs-demo">
		<Checkbox v-model="isStepper">翻页按钮（stepper）</Checkbox>
		<Tabs v-model="value" type="card" :stepper="isStepper">
			<TabsPane v-for="item in 30" :key="item" :value="item" :label="`条目 ${item}`">
				条目 {{ item }} 的内容
			</TabsPane>
		</Tabs>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Checkbox, Tabs, TabsPane } from '@deot/vc';

const value = ref(24);
const isStepper = ref(true);
</script>

<style scoped>
.tabs-demo {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 16px;
	min-width: 0;
	max-width: 480px;
}

.tabs-demo > .vc-tabs {
	align-self: stretch;
}
</style>
```
:::

### 面板的渲染与保留

`lazy`（默认 `true`）让面板首次激活时才渲染内容，`false` 时挂载即渲染全部面板；`alive`（默认 `true`）让隐藏的面板保留内容，`false` 时隐藏即卸载，重新激活后内容（如输入框的值）重建。两者在 Tabs 上统一设置，TabsPane 的同名属性可单独覆盖。`alive` 为 `false` 时隐藏的面板一律不渲染，`lazy` 不再起作用。面板容器始终保留，`animated` 的切换动画不受影响。

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
	<div class="tabs-demo">
		<Tabs v-model="value" :alive="false">
			<TabsPane value="first" label="外部绑定">
				<Input v-model="keyword" placeholder="绑定在外部，切换后仍保留" />
			</TabsPane>
			<TabsPane value="second" label="卸载重建">
				<Input placeholder="切换后清空" />
			</TabsPane>
			<TabsPane value="third" label="单独保留" alive>
				<Input placeholder="此面板设置了 alive，切换后保留" />
			</TabsPane>
		</Tabs>
		<Tabs v-model="eager" :lazy="false">
			<TabsPane value="first" label="挂载即渲染">两个面板在挂载时都已渲染。</TabsPane>
			<TabsPane value="second" label="面板二">面板二的内容在挂载时已渲染。</TabsPane>
			<TabsPane value="third" label="首次激活再渲染" lazy>此面板设置了 lazy，首次激活时才渲染。</TabsPane>
		</Tabs>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Input, Tabs, TabsPane } from '@deot/vc';

const value = ref('first');
const eager = ref('first');
const keyword = ref('');
</script>

<style scoped>
.tabs-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}
</style>
```
:::

### 自定义标签与样式

`label` 插槽接收 `{ row, index }`，其中 `row` 是面板的 props。也可将渲染函数传入面板的 `label`，函数接收 `{ it, index }`。`extra` 插槽放在标签栏末端。`barStyle` / `barClass` 作用于标签栏，`contentStyle` / `contentClass` 作用于内容区。

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
	<div class="tabs-demo">
		<Tabs
			v-model="value"
			:bar-style="{ background: 'var(--vc-background-color-light)' }"
			bar-class="tabs-demo__bar"
			:content-style="{ padding: '12px 16px' }"
			content-class="tabs-demo__content"
		>
			<template #label="{ row, index }">
				<span>{{ index + 1 }} · {{ row.label }}</span>
			</template>
			<template #extra>共 2 项</template>
			<TabsPane value="first" label="标签一">标签一的内容。</TabsPane>
			<TabsPane value="second" label="标签二">标签二的内容。</TabsPane>
		</Tabs>
		<Tabs v-model="value">
			<TabsPane value="first" :label="renderLabel">渲染函数生成的标签。</TabsPane>
			<TabsPane value="second" :label="renderLabel">渲染函数生成的标签。</TabsPane>
		</Tabs>
	</div>
</template>

<script setup>
import { h, ref } from 'vue';
import { Tabs, TabsPane } from '@deot/vc';

const value = ref('first');
const renderLabel = ({ index }) => h('strong', `函数标签 ${index + 1}`);
</script>

<style scoped>
.tabs-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.tabs-demo :deep(.tabs-demo__bar) {
	padding-inline: 8px;
}

.tabs-demo :deep(.tabs-demo__content) {
	color: var(--vc-color-dark-light);
}
</style>
```
:::

### 锚点导航

面板的 `anchor` 为 CSS 选择器，点击标签时滚动所在的滚动容器，使目标元素位于标签栏下方；配合外层 [Affix](../affix/README.md) 吸附标签栏，滚动时选中项随可视区同步。

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
	<Scroller height="240px" class="tabs-demo">
		<Affix :fixed="false">
			<Tabs :model-value="0" class="tabs-demo__tabs">
				<TabsPane v-for="item in 3" :key="item" :label="`段落 ${item}`" :anchor="`#tabs-demo-anchor-${item}`" />
			</Tabs>
		</Affix>
		<section v-for="item in 3" :id="`tabs-demo-anchor-${item}`" :key="item" class="tabs-demo__section">
			<strong>段落 {{ item }}</strong>
			<p v-for="line in 8" :key="line" class="tabs-demo__line">段落 {{ item }} 的第 {{ line }} 行</p>
		</section>
	</Scroller>
</template>

<script setup>
import { Affix, Scroller, Tabs, TabsPane } from '@deot/vc';
</script>

<style scoped>
.tabs-demo__tabs {
	background: var(--vc-background-color-lightest);
}

.tabs-demo__section {
	display: flex;
	flex-direction: column;
	gap: 8px;
	padding: 16px 0;
}

.tabs-demo__line {
	margin: 0;
}
</style>
```
:::

## 移动端

`MTabs`、`MTabsPane` 与 `Tabs`、`TabsPane` 共享 `modelValue`、`animated`、`closable`、`lazy`、`alive` 和事件，属性差异见下方 API 的「MTabs 属性」。移动端标签栏同样由 Scroller 承载，触摸时为原生横向滚动（带惯性），选中的标签尽量滚到中间；`average` 时标签均分宽度，`stepper`（移动端默认 `false`）显示翻页按钮。`swipeable` 时在内容区左右滑动切换到相邻的标签（跳过禁用的），配合 `animated` 有滑入动画。`theme="light"` 跟随全局亮暗主题；`theme="dark"` 是深色金色的独立视觉风格，不等同于切换全局主题。

下例中的按钮依次切换 `theme`、`average`、`afloat`（下划线）、`autoAfloatWidth`（下划线按文字宽度）、`showWrapper`（标签栏）；`prepend`、`append` 插槽放在标签栏两端。

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
	<div class="m-tabs-demo">
		<div class="m-tabs-demo__row">
			<MButton size="small" @click="handleToggle('isDark')">theme：{{ state.isDark ? 'dark' : 'light' }}</MButton>
			<MButton size="small" @click="handleToggle('isAverage')">average：{{ state.isAverage }}</MButton>
			<MButton size="small" @click="handleToggle('isAfloat')">afloat：{{ state.isAfloat }}</MButton>
			<MButton size="small" @click="handleToggle('isAutoWidth')">autoAfloatWidth：{{ state.isAutoWidth }}</MButton>
			<MButton size="small" @click="handleToggle('isWrapper')">showWrapper：{{ state.isWrapper }}</MButton>
		</div>
		<MTabs
			v-model="value"
			:theme="state.isDark ? 'dark' : 'light'"
			:average="state.isAverage"
			:afloat="state.isAfloat"
			:auto-afloat-width="state.isAutoWidth"
			:show-wrapper="state.isWrapper"
			swipeable
			animated
		>
			<MTabsPane v-for="item in 4" :key="item" :value="item" :label="`分类 ${item}`">
				<p class="m-tabs-demo__content">分类 {{ item }} 的内容，左右滑动切换</p>
			</MTabsPane>
		</MTabs>
		<MTabs v-model="more" stepper :average="false" closable @tab-remove="handleRemove">
			<template #prepend>
				<span class="m-tabs-demo__side">前置</span>
			</template>
			<template #append>
				<span class="m-tabs-demo__side">后置</span>
			</template>
			<template #label="{ row, index }">
				<span>{{ index + 1 }}. {{ row.label }}</span>
			</template>
			<MTabsPane v-for="item in panes" :key="item" :value="item" :label="`标签 ${item}`" closable>
				<p class="m-tabs-demo__content">标签 {{ item }} 的内容</p>
			</MTabsPane>
		</MTabs>
	</div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { MButton, MTabs, MTabsPane } from '@deot/vc';

const value = ref(1);
const more = ref(3);
const panes = ref(Array.from({ length: 10 }, (_, index) => index + 1));
const state = reactive({
	isDark: false,
	isAverage: true,
	isAfloat: true,
	isAutoWidth: true,
	isWrapper: true
});

const handleToggle = (key) => {
	state[key] = !state[key];
};

const handleRemove = (removedValue, index) => {
	panes.value.splice(index, 1);
	if (more.value === removedValue) {
		more.value = panes.value[Math.max(0, index - 1)];
	}
};
</script>

<style scoped>
.m-tabs-demo {
	display: flex;
	flex-direction: column;
	gap: calc(var(--vc-rem) * 32);
}

.m-tabs-demo__row {
	display: flex;
	flex-wrap: wrap;
	gap: calc(var(--vc-rem) * 16);
	padding-inline: calc(var(--vc-rem) * 32);
}

.m-tabs-demo__content {
	padding: calc(var(--vc-rem) * 32);
	margin: 0;
	font-size: calc(var(--vc-rem) * 28);
}

.m-tabs-demo__side {
	padding-inline: calc(var(--vc-rem) * 16);
	font-size: calc(var(--vc-rem) * 24);
	color: var(--vc-color-dark-extralight);
}
</style>
```
:::

### 吸顶

`sticky` 时标签栏由 `MAffix`（`position: sticky`）吸附在所在滚动容器的顶部，Tabs 滚出后随之离开；`offsetTop` 为吸顶偏移（750 稿）。Tabs 与滚动容器之间不能有 `overflow` 非 `visible` 的元素。

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
	<MScroller height="calc(var(--vc-rem) * 640)" class="m-tabs-demo">
		<p v-for="index in 3" :key="index" class="m-tabs-demo__line">前置内容 {{ index }}</p>
		<MTabs v-model="value" sticky :offset-top="0">
			<MTabsPane v-for="pane in PANES" :key="pane" :label="pane" :value="pane">
				<p v-for="index in 20" :key="index" class="m-tabs-demo__line">{{ pane }} 的内容 {{ index }}</p>
			</MTabsPane>
		</MTabs>
		<p v-for="index in 10" :key="index" class="m-tabs-demo__line">后置内容 {{ index }}</p>
	</MScroller>
</template>

<script setup>
import { ref } from 'vue';
import { MScroller, MTabs, MTabsPane } from '@deot/vc';

const PANES = ['标签一', '标签二', '标签三', '标签四'];
const value = ref('标签一');
</script>

<style scoped>
.m-tabs-demo__line {
	padding: calc(var(--vc-rem) * 16) calc(var(--vc-rem) * 32);
	margin: 0;
	font-size: calc(var(--vc-rem) * 28);
}
</style>
```
:::

## 主题与局部覆盖

全局参数通过 `--vc-<参数>` 配置，单个组件通过 `--vc-tabs-<参数>` 覆盖。同一参数可能作用于多个状态；多命名空间时在使用位置中标明。

移动端黑金（dark 外观）配色属于内部主题，以下三个局部参数保留，不参与全局颜色收敛。

### 全局

| 参数 | 使用位置 | 值 |
| --- | --- | --- |
| color-dark-lighter | 移动端 light 外观标签文字 | 亮色：`#515151`；暗色：`#D9D9D9` |
| color-dark-light | 桌面端 capsule / text / round 悬停文字 | 亮色：`#080F20`；暗色：`#E8E8E8` |
| color-dark-lightest | 桌面端标签文字 | 亮色：`#64758B`；暗色：`#C9C9C9` |
| color-dark-extralight | 桌面端禁用标签文字 | 亮色：`#909399`；暗色：`#B9B9B9` |
| color-neutral-light | 桌面 line 底部分隔线、button 底色与描边、capsule 容器、text 分隔线、round 悬停与选中底色 | 亮色：`#EDEFF1`；暗色：`#3B4354` |
| color-primary | 桌面端激活标签、悬停文字及指示线 | `#456CF6` |
| color-shadow-fixed | 移动端普通滚动边缘阴影 | 亮色：`rgb(0 0 0 / 6%)`；暗色：`rgb(0 0 0 / 24%)` |
| background-color | 桌面 card 禁用底色、text 悬停底色 | 亮色：`#F5F6FA`；暗色：`#252B3A` |
| background-color-lightest | 桌面 card 底色、capsule 选中项底色及移动端 light 外观背景 | 亮色：`#FFFFFF`；暗色：`#252B3A` |
| border-color | 桌面卡片边框 | `#D5D9E1` |
| foreground-color-dark | 移动端 light 外观选中文字及指示线 | 亮色：`#000000`；暗色：`#F8F8F8` |
| foreground-color-inactive | 桌面 capsule 项间分隔线 | 亮色：`#C0C4CC`；暗色：`#737D8C` |

### 局部

| 参数 | 使用位置 | 值 |
| --- | --- | --- |
| dark-background-color | 移动端 dark 外观背景 | `#333333` |
| dark-color | 移动端 dark 外观标签文字 | `#E7C083` |
| dark-stepper-shadow-color | 移动端 dark 外观翻页按钮的阴影 | `#242421` |
| bar-margin-bottom | 移动端标签栏与内容的间距 | 750 稿 16 |
| nav-padding | 移动端标签列表的内边距（标签栏两端的缩进） | `0` |
| item-padding | 移动端标签的内边距 | 750 稿 30 20 |
| item-font-size | 移动端标签的字号 | 750 稿 30 |
| afloat-color | 移动端 light 外观的指示线颜色 | 同 `foreground-color-dark` |

## API

### Tabs 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| modelValue | 当前面板的 value，支持 v-model | `string \| number \| boolean` | - | `undefined`，挂载后选中首项 |
| type | 标签样式 | `string` | `line` / `card` / `button` / `capsule` / `text` / `round` | `line` |
| size | 尺寸 | `string` | `mini` / `small` / `medium` / `large` | `medium` |
| placement | 标签栏相对内容的位置 | `string` | `top` / `bottom` / `left` / `right` | `top` |
| animated | 切换动画：进入的面板沿标签栏的排列方向滑入并淡入（上下位置横向、左右位置纵向），下划线随之移动 | `boolean` | - | `false` |
| closable | 与面板 closable 同时为 true 时显示关闭按钮 | `boolean` | - | `false` |
| stepper | 标签溢出时在标签栏两端显示前后翻页按钮 | `boolean` | - | `true` |
| lazy | 面板首次激活时才渲染内容；false 时挂载即渲染。TabsPane 可单独覆盖 | `boolean` | - | `true` |
| alive | 隐藏的面板保留内容；false 时隐藏即卸载。TabsPane 可单独覆盖 | `boolean` | - | `true` |
| barStyle | 标签栏样式 | `object \| string` | - | - |
| contentStyle | 内容区样式 | `object \| string` | - | - |
| barClass | 标签栏类名 | `object \| string` | - | - |
| contentClass | 内容区类名 | `object \| string` | - | - |
| afloat | 已声明，但桌面端不读取此开关；line 始终显示下划线 | `boolean` | - | `true` |
| affixable | 已声明，尚未接入；需要吸顶时在外层使用 Affix | `boolean` | - | `false` |
| affixOptions | 已声明，尚未接入 | `object` | - | - |

### Tabs 事件

下列事件同样适用于 `MTabs`。`value` 的类型为 `string | number | boolean`。

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| update:modelValue | 点击有效标签时更新绑定值 | `(value) => void` | 面板 value，缺省时为索引 |
| change | 有效标签点击时触发，包括重复点击当前项 | `(value) => void` | 当前面板值 |
| click | 与 change 一同触发 | `(value) => void` | 当前面板值 |
| tab-remove | 点击关闭按钮时触发，不会自动删除面板 | `(value, index) => void` | 待关闭面板值及从 0 开始的索引 |

连续点击受 300ms 间隔限制。直接修改 `modelValue` 不触发上述切换事件；配合外层 `Affix` 的锚点滚动同步也会触发 `update:modelValue`、`change` 和 `click`。

### Tabs 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 放置 TabsPane | - |
| label | 自定义标签，优先于面板 label | `{ row, index }` |
| extra | 标签栏末端的附加内容：标签栏在上下时位于右端，在左右时位于底部 | - |

### TabsPane 属性

以下属性也适用于 `MTabsPane`，需与对应父组件配套使用。

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| value | 面板标识，与父组件 modelValue 对应 | `string \| number \| boolean` | - | `undefined`，使用索引 |
| label | 标签内容。字符串按文本渲染，也可传渲染函数或 `{ type, value }`（需要 HTML 时传 `{ type: 'html', value }`），见 [Customer](../customer/README.md) | `string \| number \| Function \| { type: string; value: any }` | - | `''` |
| anchor | 点击时滚动至目标元素的 CSS 选择器 | `string` | - | - |
| lazy | 首次激活时才渲染内容；false 时挂载即渲染。未设置时继承父组件 | `boolean` | - | `undefined` |
| alive | 隐藏后保留内容；false 时隐藏即卸载。未设置时继承父组件 | `boolean` | - | `undefined` |
| closable | 配合父组件 closable 显示关闭按钮；禁用的面板不显示 | `boolean` | - | `false` |
| disabled | 禁止点击切换到此面板，不限制外部 modelValue 更新 | `boolean` | - | `false` |

### TabsPane 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 面板内容，MTabsPane 相同 | - |

### MTabs 属性

共享 `Tabs` 的 `modelValue`、`animated`、`closable`、`lazy`、`alive`、`stepper`（移动端默认 `false`）；其余有效属性如下。

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| theme | 标签栏视觉风格 | `string` | `light` / `dark` | `light` |
| barStyle | 标签栏样式 | `object \| unknown[]` | - | `{}` |
| afloat | 是否显示下划线 | `boolean` | - | `true` |
| autoAfloatWidth | light 风格下按标签内 span 宽度计算下划线；false 使用整项宽度，dark 为居中的固定短条 | `boolean` | - | `true` |
| average | 标签均分可用宽度 | `boolean` | - | `true` |
| showWrapper | 是否显示标签栏 | `boolean` | - | `true` |
| sticky | 标签栏吸顶：由 `MAffix`（`position: sticky`）吸附在所在滚动容器（页面或内层容器）的顶部，Tabs 滚出后随之离开；Tabs 与滚动容器之间不能有 `overflow` 非 `visible` 的元素 | `boolean` | - | `false` |
| offsetTop | 吸顶偏移，750 稿长度 | `number` | - | `0` |
| stepper | 标签溢出时显示左右翻页按钮；移动端以触摸滑动为主，默认不显示 | `boolean` | - | `false` |
| swipeable | 在内容区左右滑动切换到相邻的标签，跳过禁用的。只识别触摸：第一次移动锁定方向，纵向仍交给页面（或弹层）滚动；横向距离超过 50px，或超过 20px 且快速甩动时切换。内容里还能朝手指方向横向滚动的元素优先滚动；不希望触发的区域加类名 `vc-drag-ignore` | `boolean` | - | `false` |

`type`、`size`、`placement` 只属于桌面端，MTabs 不声明；`barClass`、`contentClass`、`contentStyle`、`affixable`、`affixOptions` 尚未接入移动端渲染。

### MTabs 事件

与 `Tabs` 事件相同；滑动切换触发 `update:modelValue` 与 `change`，不触发 `click`。

### MTabs 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 放置 MTabsPane | - |
| label | 自定义标签 | `{ row, index }` |
| prepend | 标签栏前置内容 | - |
| append | 标签栏后置内容 | - |

### 布局与主题

在 flex 布局中给标签页所在的弹性子容器设置 `min-width: 0; overflow-x: auto;`，防止内容撑开容器。默认情况下，首次激活后的面板会保留在 DOM 中，切换时通过高度与透明度隐藏；`alive` 为 `false` 时只保留面板容器。

组件颜色通过 `--vc-tabs-*` 变量覆盖，并回退到全局主题。桌面端使用 `color-primary`、`color-dark-lightest`、`border-color`、`color-neutral-light` 和 `background-color-lightest`；移动端普通风格使用 `color-dark-lighter`、`foreground-color-dark`、`background-color-lightest` 和 `color-shadow-fixed`。移动端金色风格提供 `--vc-tabs-dark-background-color`、`--vc-tabs-dark-color`、`--vc-tabs-dark-stepper-shadow-color`，默认保留深色背景和金色标签。
