## 输入联想（AutoComplete）

在输入框下方按输入的文字给出联想项，选中后整段替换输入框的文字。`v-model` 就是输入框的文字，可以不选联想项直接输入任意内容。移动端入口导出的 `MAutoComplete` 属性与事件相同，见 [移动端](#移动端)。

需要在多行文字的光标处插入 `@成员` 这类提及时，使用 [Mention](../mention/README.md)；富文本里的提及见 [Editor 的 mentionOptions](../editor/README.md#提及)。

### 何时使用

- 输入时给出补全建议，如邮箱后缀、历史记录、常用名称。
- 值可以是任意文字、联想项只是辅助时。需要只能从选项中选择时，使用 [Select](../select/README.md) 的 `searchable`。

### 基础用法

- 聚焦时打开，有联想项才显示；输入时按文字过滤，命中的部分高亮，规则见 [Select 搜索规则](../select/README.md#搜索规则)，全局键为 `AutoComplete.searchMatch`（MAutoComplete 读同一个键）。
- 打开时高亮第一项：↑ ↓ 移动（首尾循环）、Enter 选中、Esc 关闭、Tab 关闭并移走焦点。
- 选中后整段替换为联想项的 `value`，弹层关闭，焦点留在输入框、光标移到末尾。
- 没有结果时不弹出空面板。

:::playground
<!--
<config lang="json5">
{ previewInset: 24 }
</config>
-->
```vue
<template>
	<div style="width: 280px;">
		<AutoComplete v-model="value" :data="data" placeholder="输入名称" clearable />
		<p>value: {{ value }}</p>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { AutoComplete } from '@deot/vc';

const value = ref('');
const data = ['条目甲', '条目乙', '条目丙', 'Alpha', 'Beta', 'Gamma'];
</script>
```
:::

### 按输入生成联想项

`data` 随输入变化即可，如邮箱后缀补全。

:::playground
<!--
<config lang="json5">
{ previewInset: 24 }
</config>
-->
```vue
<template>
	<AutoComplete v-model="email" :data="emails" placeholder="输入邮箱" style="width: 280px;" />
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
```
:::

### 分组与自定义文字

`data` 的格式同 Select：带 `children` 的为分组（只渲染一层），`disabled` 的项不能选中、键盘跳过。也可以直接传字符串、数字。`label` 插槽或 `renderLabel` 自定义联想项的文字，保留行的高亮与键盘；`option` 插槽或 `renderOption` 替换整行，键盘仍可移动到它，高亮写在行的根节点上（`data-active` 属性），样式由调用方处理。

:::playground
<!--
<config lang="json5">
{ previewInset: 24 }
</config>
-->
```vue
<template>
	<AutoComplete v-model="value" :data="data" placeholder="输入条目" style="width: 280px;">
		<template #label="{ row }">
			<span style="display: flex; width: 100%; justify-content: space-between;">
				<span>{{ row.label }}</span>
				<span style="color: #999;">{{ row.description }}</span>
			</span>
		</template>
	</AutoComplete>
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
	{ value: 'g2', label: '分组二', children: [{ value: '条目 2-1', label: '条目 2-1', description: '说明' }] }
];
</script>
```
:::

### 远程加载

`loadData(keyword, instance)` 返回 Promise，输入经 250ms 防抖后调用；聚焦时，如果还没加载过、或手上的数据不是按当前文字加载的，立即调用一次。Promise 解析为数组时直接作为这次的结果；否则由调用方更新 `data`。后发起的请求先返回时，先发起的那次结果丢弃。

远程加载时**不在本地过滤**：返回的就是这个关键词的结果（服务端可能按拼音、编号等匹配，文字里不一定含关键词），只高亮命中的文字。这一点与 Select 的远程搜索不同。

:::playground
<!--
<config lang="json5">
{ previewInset: 24 }
</config>
-->
```vue
<template>
	<AutoComplete v-model="value" :load-data="loadData" placeholder="输入任意文字" style="width: 280px;" />
</template>
<script setup>
import { ref } from 'vue';
import { AutoComplete } from '@deot/vc';

const value = ref('');
const loadData = keyword => new Promise((resolve) => {
	setTimeout(() => resolve(keyword ? [1, 2, 3].map(i => `${keyword} 的结果 ${i}`) : []), 300);
});
</script>
```
:::

### 大量数据

`virtualized` 只渲染弹层可视范围附近的联想项（RecycleList），打开、输入与方向键的耗时不随数量增长，键盘可以移到尚未渲染的行。实现与 Select 的 [大量数据](../select/README.md#大量数据) 相同。

### 移动端

`MAutoComplete` 的联想属性、事件、插槽与 `AutoComplete` 相同，输入框属性同 `MInput`（有 `right`，没有 `indicator`），联想项为 750 稿尺寸（与 MSelect 的选项一致），最多约 5 行高。

- 弹层与其它 Popover 一样按可视区（`visualViewport`）翻转、限高：软键盘弹出后布局视口不缩小，下方放不下时翻到输入框上方，见 [Popover](../popover/README.md)。
- 不默认高亮第一项（手机上没有回车选中的需要，高亮像是已经选中）；外接键盘时仍可用 ↑ ↓ / Enter。

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
| focus / blur / clear / paste / keydown / keypress / keyup / tip | 同 Input，参数不变 | 同 Input |

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
| close | 关闭弹层 | - |

## 主题与局部覆盖

联想项与分组标题沿用 Select 的选项样式，参数见 [Select 的主题](../select/README.md#主题与局部覆盖)。选项的尺寸是局部变量 `--vc-select-option-padding`、`--vc-select-option-font-size`、`--vc-select-option-line-height` 与 `--vc-select-option-group-height`、`--vc-select-option-group-padding-left`、`--vc-select-option-group-font-size`，可通过 `portalClass` 在弹层上覆盖。
