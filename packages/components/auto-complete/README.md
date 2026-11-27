## 输入联想（AutoComplete）

在输入框下方按输入的文字给出联想项，选中后整段替换输入框的文字。`v-model` 就是输入框的文字，可以不选联想项直接输入任意内容。移动端入口导出的 `MAutoComplete` 属性与事件相同，输入框换为 `MInput`、联想项为 750 稿尺寸，见 [移动端](#移动端)。

需要在多行文字的光标处插入 `@成员` 这类提及时，使用 [Mention](../mention/README.md)；富文本里的提及见 [Editor 的 mentionOptions](../editor/README.md#提及)。

### 何时使用

- 输入时给出补全建议，如邮箱后缀、历史记录、常用名称。
- 值可以是任意文字、联想项只是辅助时。需要只能从选项中选择时，使用 [Select](../select/README.md) 的 `searchable`。

### 基础用法

- 聚焦时打开，有联想项才显示；输入时按文字过滤，命中的部分高亮，规则见 [Select 搜索规则](../select/README.md#搜索规则)，全局键为 `AutoComplete.searchMatch`（MAutoComplete 读同一个键）。
- 打开时高亮第一项：↑ ↓ 移动（首尾循环）、Enter 选中、Esc 关闭、Tab 关闭并移走焦点。
- 选中后整段替换为联想项的 `value`，弹层关闭，焦点留在输入框、光标移到末尾；`select` 事件的参数为 `{ value, item }`。
- 没有结果时不弹出空面板；`visible-change` 在弹层显示状态变化时触发。

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
	<div class="auto-complete-demo">
		<AutoComplete
			v-model="value"
			:data="data"
			class="auto-complete-demo__input"
			placeholder="输入名称"
			clearable
			@select="handleSelect"
			@visible-change="handleVisibleChange"
		/>
		<p class="auto-complete-demo__result">value：{{ value }}；select：{{ selected }}；弹层{{ isVisible ? '打开' : '关闭' }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { AutoComplete } from '@deot/vc';

const value = ref('');
const selected = ref('');
const isVisible = ref(false);
const data = ['条目甲', '条目乙', '条目丙', 'Alpha', 'Beta', 'Gamma'];

const handleSelect = ({ value: next }) => {
	selected.value = next;
};

const handleVisibleChange = (visible) => {
	isVisible.value = visible;
};
</script>

<style scoped>
.auto-complete-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.auto-complete-demo__input {
	width: 280px;
	max-width: 100%;
}

.auto-complete-demo__result {
	margin: 0;
}
</style>
```
:::

### 按输入生成联想项

`data` 随输入变化即可，如邮箱后缀补全。

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
	<div class="auto-complete-demo">
		<AutoComplete v-model="email" :data="emails" class="auto-complete-demo__input" placeholder="输入邮箱" />
	</div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { AutoComplete } from '@deot/vc';

const SUFFIXES = ['example.com', 'example.org', 'example.net'];
const email = ref('');
const emails = computed(() => {
	const [name] = email.value.split('@');
	return name ? SUFFIXES.map(suffix => `${name}@${suffix}`) : [];
});
</script>

<style scoped>
.auto-complete-demo__input {
	width: 280px;
	max-width: 100%;
}
</style>
```
:::

### 分组与自定义文字

`data` 的格式同 Select：带 `children` 的为分组（只渲染一层），`disabled` 的项不能选中、键盘跳过。也可以直接传字符串、数字。`label` 插槽自定义联想项的文字，保留行的高亮与键盘；`optionGroup` 插槽自定义分组标题。

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
	<div class="auto-complete-demo">
		<AutoComplete v-model="value" :data="data" class="auto-complete-demo__input" placeholder="输入条目">
			<template #label="{ row }">
				<span class="auto-complete-demo__label">
					<span>{{ row.label }}</span>
					<span class="auto-complete-demo__description">{{ row.description }}</span>
				</span>
			</template>
			<template #optionGroup="{ row }">
				<span class="auto-complete-demo__group">{{ row.label }}（{{ row.children.length }}）</span>
			</template>
		</AutoComplete>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { AutoComplete } from '@deot/vc';

const value = ref('');
const data = [
	{ value: 'g1', label: '分组一', children: [
		{ value: '条目 1-1', label: '条目 1-1', description: '说明' },
		{ value: '条目 1-2', label: '条目 1-2', description: '不可选', disabled: true }
	] },
	{ value: 'g2', label: '分组二', children: [
		{ value: '条目 2-1', label: '条目 2-1', description: '说明' }
	] }
];
</script>

<style scoped>
.auto-complete-demo__input {
	width: 280px;
	max-width: 100%;
}

.auto-complete-demo__label {
	display: flex;
	justify-content: space-between;
	gap: 8px;
	width: 100%;
}

.auto-complete-demo__description {
	color: var(--vc-color-dark-lightest);
}

.auto-complete-demo__group {
	font-weight: 600;
}
</style>
```
:::

### 自定义整行

`option` 插槽或 `renderOption` 替换整行，需要自行调用 `store.click` 选中；键盘仍可移动到它，高亮写在行的根节点上（`data-active` 属性），样式由调用方处理，下例直接沿用选项的类名 `vc-select-option`。`renderLabel`、`renderOptionGroup` 是 `label`、`optionGroup` 插槽的渲染函数写法，同名插槽优先。

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
	<div class="auto-complete-demo">
		<AutoComplete v-model="slotValue" :data="data" class="auto-complete-demo__input" placeholder="option 插槽">
			<template #option="{ row, store }">
				<div class="vc-select-option" @click="store.click">
					<span>{{ row.label }}</span>
					<span class="auto-complete-demo__description">{{ row.description }}</span>
				</div>
			</template>
		</AutoComplete>
		<AutoComplete
			v-model="renderValue"
			:data="groups"
			:render-option="renderOption"
			:render-option-group="renderOptionGroup"
			class="auto-complete-demo__input"
			placeholder="renderOption / renderOptionGroup"
		/>
		<AutoComplete
			v-model="labelValue"
			:data="data"
			:render-label="renderLabel"
			class="auto-complete-demo__input"
			placeholder="renderLabel"
		/>
	</div>
</template>

<script setup>
import { h, ref } from 'vue';
import { AutoComplete } from '@deot/vc';

const slotValue = ref('');
const renderValue = ref('');
const labelValue = ref('');
const data = Array.from({ length: 5 }, (_, index) => ({
	value: `条目 ${index + 1}`,
	label: `条目 ${index + 1}`,
	description: `说明 ${index + 1}`
}));
const groups = [
	{ value: 'g1', label: '分组一', children: data.slice(0, 3) },
	{ value: 'g2', label: '分组二', children: data.slice(3) }
];

const renderOption = ({ row, store }) => h('div', {
	class: 'vc-select-option',
	onClick: store.click
}, `${row.label}（自定义整行）`);

const renderOptionGroup = ({ row }) => h('div', { class: 'vc-select-option-group__title' }, `— ${row.label} —`);

const renderLabel = ({ row }) => `${row.label} · ${row.description}`;
</script>

<style scoped>
.auto-complete-demo {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}

.auto-complete-demo__input {
	width: 240px;
	max-width: 100%;
}

.auto-complete-demo__description {
	color: var(--vc-color-dark-lightest);
}
</style>
```
:::

### 远程加载

`loadData(keyword, instance)` 返回 Promise，输入经 250ms 防抖后调用；聚焦时，如果还没加载过、或手上的数据不是按当前文字加载的，立即调用一次。Promise 解析为数组时直接作为这次的结果；否则由调用方更新 `data`。后发起的请求先返回时，先发起的那次结果丢弃。

远程加载时**不在本地过滤**：返回的就是这个关键词的结果（服务端可能按拼音、编号等匹配，文字里不一定含关键词），只高亮命中的文字。这一点与 Select 的远程搜索不同。

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
	<div class="auto-complete-demo">
		<AutoComplete v-model="value" :load-data="handleLoad" class="auto-complete-demo__input" placeholder="输入任意文字" />
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { AutoComplete } from '@deot/vc';

const value = ref('');
const handleLoad = keyword => new Promise((resolve) => {
	setTimeout(() => resolve(keyword ? [1, 2, 3].map(i => `${keyword} 的结果 ${i}`) : []), 300);
});
</script>

<style scoped>
.auto-complete-demo__input {
	width: 280px;
	max-width: 100%;
}
</style>
```
:::

### 大量数据

`virtualized` 只渲染弹层可视范围附近的联想项（RecycleList），打开、输入与方向键的耗时不随数量增长，键盘可以移到尚未渲染的行。实现与 Select 的 [大量数据](../select/README.md#大量数据) 相同。

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
	<div class="auto-complete-demo">
		<AutoComplete
			v-model="value"
			:data="data"
			virtualized
			class="auto-complete-demo__input"
			placeholder="1 万条，输入数字过滤"
		/>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { AutoComplete } from '@deot/vc';

const value = ref('');
const data = Array.from({ length: 10000 }, (_, index) => `条目 ${index + 1}`);
</script>

<style scoped>
.auto-complete-demo__input {
	width: 280px;
	max-width: 100%;
}
</style>
```
:::

### 搜索分隔符

`searchMatch` 指定关键词的分隔符：`and` 分开的词都要命中，`or` 分开的组命中任一即可。未传时读全局 `AutoComplete.searchMatch`，默认空格为 `and`、逗号为 `or`；整个对象替换，不按键合并。下例把 `or` 换成 `|`，可输入 `alpha|beta`。

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
	<div class="auto-complete-demo">
		<AutoComplete
			v-model="value"
			:data="data"
			:search-match="{ and: ' ', or: '|' }"
			class="auto-complete-demo__input"
			placeholder="试试 alpha|beta"
		/>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { AutoComplete } from '@deot/vc';

const value = ref('');
const data = ['Alpha One', 'Alpha Two', 'Beta One', 'Beta Two', 'Gamma One'];
</script>

<style scoped>
.auto-complete-demo__input {
	width: 280px;
	max-width: 100%;
}
</style>
```
:::

### 输入框与弹层

`prepend`、`append` 插槽是输入框的前置、后置内容，`disabled` 时不打开弹层。`placement` 设置弹层方向（空间不足时自动翻转），`autoWidth` 为 `true` 时弹层按内容确定宽度，`portal` 为 `false` 时弹层渲染在组件内。按 Enter 且没有用它选中联想项时触发 `enter`。

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
	<div class="auto-complete-demo">
		<div class="auto-complete-demo__row">
			<AutoComplete
				v-model="value"
				:data="data"
				placement="top-left"
				auto-width
				:portal="false"
				class="auto-complete-demo__input"
				placeholder="向上展开、按内容宽度"
				@enter="handleEnter"
			>
				<template #prepend>名称</template>
				<template #append>.txt</template>
			</AutoComplete>
			<AutoComplete v-model="value" :data="data" class="auto-complete-demo__input" disabled />
		</div>
		<p class="auto-complete-demo__result">enter：{{ entered || '-' }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { AutoComplete } from '@deot/vc';

const value = ref('');
const entered = ref('');
const data = ['条目甲', '名称较长的一项条目，用来查看按内容确定的宽度', '条目丙'];

const handleEnter = () => {
	entered.value = value.value;
};
</script>

<style scoped>
.auto-complete-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.auto-complete-demo__row {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}

.auto-complete-demo__input {
	width: 280px;
	max-width: 100%;
}

.auto-complete-demo__result {
	margin: 0;
}
</style>
```
:::

## 移动端

`MAutoComplete` 的联想属性、事件、插槽与 `AutoComplete` 相同，输入框属性同 `MInput`（有 `right`，没有 `indicator`），联想项为 750 稿尺寸（与 MSelect 的选项一致：字号 28、行高 40、内边距 20 32），最多约 5 行高，随 `--vc-rem` 缩放。

- 弹层与其它 Popover 一样按可视区（`visualViewport`）翻转、限高：软键盘弹出后布局视口不缩小，下方放不下时翻到输入框上方，见 [Popover](../popover/README.md)。
- 不默认高亮第一项（手机上没有回车选中的需要，高亮像是已经选中）；外接键盘时仍可用 ↑ ↓ / Enter。按下与高亮为浅灰底。

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
	<div class="m-auto-complete-demo">
		<MForm label-width="auto">
			<MFormItem label="本地过滤">
				<MAutoComplete v-model="model.local" :data="data" placeholder="输入名称" clearable />
			</MFormItem>
			<MFormItem label="邮箱补全">
				<MAutoComplete v-model="model.email" :data="emails" placeholder="输入邮箱" right />
			</MFormItem>
			<MFormItem label="远程加载">
				<MAutoComplete v-model="model.remote" :load-data="handleLoad" placeholder="输入任意文字" />
			</MFormItem>
		</MForm>
		<p class="m-auto-complete-demo__result">本地过滤：{{ model.local || '-' }}</p>
	</div>
</template>

<script setup>
import { computed, reactive } from 'vue';
import { MAutoComplete, MForm, MFormItem } from '@deot/vc';

const data = ['条目甲', '条目乙', '条目丙', '项目一', '项目二', '项目三', 'Alpha', 'Beta', 'Gamma'];
const SUFFIXES = ['example.com', 'example.org', 'example.net'];

const model = reactive({ local: '', email: '', remote: '' });

const emails = computed(() => {
	const [name] = model.email.split('@');
	return name ? SUFFIXES.map(suffix => `${name}@${suffix}`) : [];
});

const handleLoad = keyword => new Promise((resolve) => {
	setTimeout(() => {
		resolve(keyword ? Array.from({ length: 6 }, (_, index) => `${keyword} 的结果 ${index + 1}`) : []);
	}, 400);
});
</script>

<style scoped>
.m-auto-complete-demo {
	display: flex;
	flex-direction: column;
	gap: calc(var(--vc-rem) * 32);
}

.m-auto-complete-demo__result {
	margin: 0;
	padding-inline: calc(var(--vc-rem) * 32);
	font-size: calc(var(--vc-rem) * 28);
}
</style>
```
:::

## 主题与局部覆盖

联想项与分组标题沿用 Select 的选项样式，参数见 [Select 的主题](../select/README.md#主题与局部覆盖)。选项的尺寸是局部变量 `--vc-select-option-padding`、`--vc-select-option-font-size`、`--vc-select-option-line-height` 与 `--vc-select-option-group-height`、`--vc-select-option-group-padding-left`、`--vc-select-option-group-font-size`，可通过 `portalClass` 在弹层上覆盖。

## API

### 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| modelValue | 输入框的文字 | `string \| number` | - | - |
| data | 联想项，格式同 Select 的 data（`{ label, value, disabled, filterable, children }`），也可以是字符串、数字 | `Array<string \| number \| object>` | - | `[]` |
| loadData | 远程加载，见[远程加载](#远程加载) | `(keyword: string, instance: ComponentInternalInstance) => Promise<unknown>` | - | - |
| virtualized | 只渲染弹层可视范围附近的联想项 | `boolean` | - | `false` |
| searchMatch | 搜索关键词的分隔符：`and` 分开的词都要命中，`or` 分开的组命中任一即可；未传时读全局 `AutoComplete.searchMatch` | `{ and?: string \| string[]; or?: string \| string[] }` | - | `{ and: ' ', or: [',', '，'] }` |
| placement | 弹层方向 | `string` | 同 Popover | `'bottom-left'` |
| autoWidth | `false` 时弹层与输入框同宽，`true` 时按内容 | `boolean` | - | `false` |
| portal | 弹层是否挂载到 body | `boolean` | - | `true` |
| portalClass | 弹层附加 class | `string \| object \| unknown[]` | - | - |
| renderOption | 自定义整行；`option` 插槽优先 | `(options: { row, store }) => VNodeChild` | - | - |
| renderOptionGroup | 自定义分组标题；`optionGroup` 插槽优先 | `(options: { row, store: { group: true } }) => VNodeChild` | - | - |
| renderLabel | 自定义联想项的文字；`label` 插槽优先 | `(options: { row, store }) => VNodeChild` | - | - |

另有 [Input](../input/README.md) 的全部属性（`disabled`、`clearable`、`maxlength`、`bytes`、`prepend`、`append`、`indicator`…），原样传给输入框；`disabled` 时也不打开弹层。`placeholder` 等 attribute 同样传给输入框，`class`、`style` 在根节点上。

### 事件

| 事件名 | 说明 | 回调参数 |
| --- | --- | --- |
| update:modelValue / input / change | 输入或选中联想项后；选中时没有原生事件，`e` 为 `undefined` | `(value: string, e?: Event)` |
| select | 选中联想项（点击或 Enter） | `({ value: string; item: object })` |
| visible-change | 弹层显示状态变化 | `(visible: boolean)` |
| enter | 按 Enter 且没有用它选中联想项时（keyup） | `(e: KeyboardEvent)` |
| focus / blur / clear / paste / keydown / keypress / keyup | 同 Input，参数不变 | 同 Input |

### 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| prepend / append | 输入框的前置、后置内容 | - |
| option | 整行，优先于 renderOption；需自行调用 `store.click` | `{ row, store: { checked, last, click } }` |
| optionGroup | 分组标题 | `{ row, store: { group: true } }` |
| label | 联想项的文字或分组标题 | 同上 |

### 方法

| 方法名 | 说明 | 参数 |
| --- | --- | --- |
| focus | 聚焦输入框 | `options?: FocusOptions` |
| blur | 输入框失焦 | - |
| click | 点击输入框并聚焦 | - |
| close | 关闭弹层 | - |
