## 选择器（Select）

从数据列表中单选或多选，支持分组、搜索和自定义选项。移动端使用独立的 `MSelect`，见[移动端选择](#移动端选择)。

### 何时使用

需要从较多选项中选择一个或多个值时使用。选项较少时，可考虑使用 Radio 或 Checkbox 平铺展示。

### 基础用法

通过 `data` 提供选项，`v-model` 绑定选项的 `value`，而不是 `label`。设置 `clearable` 后，鼠标悬停时显示清空按钮；`disabled` 禁用整个选择器，数据项的 `disabled` 禁用单个选项。

:::playground
<!--
<config lang="json5">
{ previewInset: 20 }
</config>
-->
```vue
<template>
	<div class="select-demo">
		<Select v-model="selectedValue" :data="options" clearable placeholder="选择条目" />
		<p>当前值：{{ selectedValue ?? '未选择' }}</p>
		<Select model-value="option-b" :data="options" disabled />
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Select } from '@deot/vc';

const selectedValue = ref('option-a');
const options = [
	{ value: 'option-a', label: '选项 A' },
	{ value: 'option-b', label: '选项 B' },
	{ value: 'option-c', label: '选项 C', disabled: true }
];
</script>

<style scoped>
.select-demo { width: min(100%, 320px); }
.select-demo p { margin: 12px 0; }
</style>
```
:::

### 多选与搜索全选

`max` 为 `1` 时单选；大于 `1` 时多选，最多选 `max` 项，选满后其余未选中的选项置灰、不可点击，键盘导航也会跳过；设为 `0` 时多选且不限数量。`maxTags` 是显示标签数量的上限，与可选数量无关。

标签默认只占一行（`maxTagLines = 1`）：按输入框的可用宽度决定实际显示几个，放不下的折叠为 `+N...`；连 1 个都放不下时，第 1 个标签以省略号截断。`maxTagLines` 设为 `n` 时最多占 `n` 行；设为 `0` 时不限行，标签自由换行，只按 `maxTags` 截断。

悬停 `+N...` 时弹出被折叠的标签列表，可在列表中移除（禁用时只读）；悬停被截断的标签时显示完整内容。

开启 `searchable` 后，按选项文字进行不区分大小写的匹配，命中的部分高亮；空格分隔的关键词需同时命中，英文逗号分隔的各组任一命中即可（如 `a b,c`：同时含 a 和 b，或含 c）。输入非空关键词时，可全选或取消选择当前匹配且未禁用的选项，其他已选项保留。全选按列表顺序补到 `max` 为止，选满后按钮变为「取消全选」；全选逐项触发值更新事件。

:::playground
<!--
<config lang="json5">
{ previewInset: 20 }
</config>
-->
```vue
<template>
	<div class="select-demo">
		<Select
			v-model="selectedValues"
			:data="options"
			:max="0"
			:max-tags="2"
			searchable
			clearable
			search-placeholder="输入 Example，试试全选"
		/>
		<p>已选：{{ selectedValues.length ? selectedValues.join('、') : '无' }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Select } from '@deot/vc';

const selectedValues = ref([]);
const options = [
	{ value: 'option-a', label: 'Example A' },
	{ value: 'option-b', label: 'Example B' },
	{ value: 'option-c', label: 'Example C', disabled: true },
	{ value: 'option-d', label: 'Option D' }
];
</script>

<style scoped>
.select-demo { width: min(100%, 360px); }
.select-demo p { margin: 12px 0 0; overflow-wrap: anywhere; }
</style>
```
:::

### 搜索方式与键盘

`searchable` 有两种方式：

- `searchable`（或 `searchable="inline"`）：点击后直接在输入框里输入。单选时已选文字以占位文字的形式保留，输入后显示搜索词；多选时输入框跟在标签之后，下拉打开期间为它留出位置，放不下的标签折叠进 `+N...`，输入为空时按 Backspace 移除最后一个已选值。
- `searchable="popover"`：输入框保持只读，搜索栏显示在下拉顶部，打开后自动聚焦。触发器较窄、不希望输入框占用标签位置时使用。

两种方式下，关闭下拉都会清空搜索词；多选时选中或取消一项（含全选）后也会清空，便于接着搜下一项，需要在同一批结果里连续选择时设置 `:clear-search-on-select="false"`。下拉关闭但输入框聚焦时，直接输入也会打开下拉。

| 按键 | 行为 |
| --- | --- |
| Enter | 下拉关闭且输入框聚焦时打开；打开时选中高亮项，多选为切换选中且不关闭 |
| ↑ / ↓ | 在可选的选项间移动高亮，跳过禁用和被过滤的选项，首尾循环 |
| Esc | 关闭下拉，焦点留在输入框 |
| Tab | 关闭下拉并移到下一个可聚焦元素 |
| Backspace | 多选内联搜索且输入为空时，移除最后一个已选值 |

打开时默认高亮已选项（没有则为第一项），搜索词变化后高亮第一个匹配项；鼠标移入与键盘共用同一个高亮。背景色只表示当前高亮，已选项用主色文字和勾表示。

:::playground
<!--
<config lang="json5">
{ previewInset: 20 }
</config>
-->
```vue
<template>
	<div class="select-demo">
		<Select v-model="inlineValue" :data="options" searchable clearable placeholder="点击后直接输入" />
		<Select v-model="popoverValues" :data="options" :max="99" searchable="popover" clearable search-placeholder="在下拉里搜索" />
		<p>inline：{{ inlineValue || '未选择' }}；popover：{{ popoverValues.join('、') || '无' }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Select } from '@deot/vc';

const inlineValue = ref('option-b');
const popoverValues = ref(['option-a']);
const options = [
	{ value: 'option-a', label: '选项 A' },
	{ value: 'option-b', label: '选项 B' },
	{ value: 'option-c', label: '选项 C', disabled: true },
	{ value: 'option-d', label: '条目 D' }
];
</script>

<style scoped>
.select-demo { display: grid; gap: 12px; width: min(100%, 360px); }
.select-demo p { margin: 0; overflow-wrap: anywhere; }
</style>
```
:::

### 字符串多选

以数组初始化时返回数组；以字符串初始化多选时，使用 `separator` 连接选中值。数字选项搭配字符串模型或字符串数组时，开启 `numerable`，同样按 `separator` 拆分与连接。

:::playground
<!--
<config lang="json5">
{ previewInset: 20 }
</config>
-->
```vue
<template>
	<div class="select-demo">
		<Select v-model="selectedValues" :data="options" :max="2" separator=";" clearable />
		<p>字符串值：{{ JSON.stringify(selectedValues) }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Select } from '@deot/vc';

const selectedValues = ref('option-a;option-b');
const options = [
	{ value: 'option-a', label: '选项 A' },
	{ value: 'option-b', label: '选项 B' },
	{ value: 'option-c', label: '选项 C' }
];
</script>

<style scoped>
.select-demo { width: min(100%, 360px); }
.select-demo p { margin: 12px 0 0; overflow-wrap: anywhere; }
</style>
```
:::

### 分组与自定义文字

`children` 提供一层分组选项。`label` 插槽定制下拉列表中的选项文字和分组标题，`store.group` 标识分组。输入框与已选标签仍使用数据中的 `label`。

:::playground
<!--
<config lang="json5">
{ previewInset: 20 }
</config>
-->
```vue
<template>
	<div class="select-demo">
		<Select v-model="selectedValue" :data="groups" label="条目" searchable>
			<template #label="{ row, store }">
				<strong v-if="store.group">{{ row.label }}</strong>
				<span v-else>{{ row.label }} · {{ row.description }}</span>
			</template>
		</Select>
		<p>当前值：{{ selectedValue || '未选择' }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Select } from '@deot/vc';

const selectedValue = ref('');
const groups = [
	{
		value: 'group-a', label: '分组 A',
		children: [
			{ value: 'option-a', label: '选项 A', description: '描述 A' },
			{ value: 'option-b', label: '选项 B', description: '描述 B' }
		]
	},
	{
		value: 'group-b', label: '分组 B',
		children: [{ value: 'option-c', label: '选项 C', description: '描述 C' }]
	}
];
</script>

<style scoped>
.select-demo { width: min(100%, 320px); }
.select-demo p { margin: 12px 0 0; }
</style>
```
:::

### 远程搜索

`loadData(query, instance)` 必须返回 Promise，搜索输入经过 250ms 防抖后调用；未开启 `searchable` 时不会调用。调用方更新 `data`；Promise 的返回值不会自动成为选项。加载期间输入框后缀显示加载图标，本地文字过滤仍然生效，需要跳过本地过滤的结果可设置 `filterable: false`。打开下拉时，如果还没有数据，或当前数据是按某个关键词加载的，会立即以空关键词调用一次，用于加载默认数据；关闭下拉时只重置搜索词，不调用它；多选时选中后清空搜索词，会立即以空关键词调用一次。搜索结果里没有已选项时，输入框与标签沿用上次查到的文字。

下面用本地延迟模拟请求，不依赖在线接口。

:::playground
<!--
<config lang="json5">
{ previewInset: 20 }
</config>
-->
```vue
<template>
	<div class="select-demo">
		<Select
			v-model="selectedValue"
			:data="options"
			:load-data="loadOptions"
			searchable
			search-placeholder="输入条目名称"
		/>
		<p>当前值：{{ selectedValue || '未选择' }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Select } from '@deot/vc';

const selectedValue = ref('');
const source = [
	{ value: 'option-a', label: '选项 A' },
	{ value: 'option-b', label: '选项 B' },
	{ value: 'option-c', label: '选项 C' }
];
const options = ref(source);
const loadOptions = async (query) => {
	await new Promise(resolve => setTimeout(resolve, 400));
	options.value = source.filter(item => item.label.toLowerCase().includes(query.toLowerCase()));
};
</script>

<style scoped>
.select-demo { width: min(100%, 320px); }
.select-demo p { margin: 12px 0 0; }
</style>
```
:::

### 大量数据

`virtualized` 开启后只渲染下拉可视范围附近的选项（基于 [RecycleList](../recycle-list/README.md)），搜索结果同样如此，打开、搜索和方向键的耗时不随选项数量增长；分组、全选、键盘与打开时定位到已选项的行为不变。选项少（几百个以内）时不必开启。

未开启时，搜索只渲染命中的选项，清空搜索词会重新渲染全部选项，耗时与打开下拉相当；选项上万时建议开启。

:::playground
<!--
<config lang="json5">
{ previewInset: 20 }
</config>
-->
```vue
<template>
	<div class="select-demo">
		<Select v-model="selectedValue" :data="options" virtualized searchable clearable />
		<p>当前值：{{ selectedValue }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Select } from '@deot/vc';

const options = Array.from({ length: 10000 }, (_, index) => ({ value: index + 1, label: `条目 ${index + 1}` }));
const selectedValue = ref(5000);
</script>

<style scoped>
.select-demo { width: min(100%, 320px); }
.select-demo p { margin: 12px 0 0; }
</style>
```
:::

- 行高按渲染出来的选项估计，各项等高时滚动条长度与定位从一开始就准确；自定义渲染（`renderOption` 等）的选项高度不一致时，未渲染的部分按已渲染的估计，滚动到时校正。
- 弹层宽度不随选项文字撑开：默认与触发器同宽；`autoWidth` 时只能按当前渲染出的选项计算，滚动时可能变化，建议给定宽度。
- 浏览器的页内查找只能找到已渲染的选项。

### 移动端选择

`MSelect` 是独立的移动端组件：默认渲染 MListItem，点击后从底部弹出列表，选中项为主色并打勾。`v-model` 的形状与转换规则与桌面端相同（`max`、`separator`、`numerable`），`data` 中带 `children` 的项显示为分组，分组标题滚动时吸顶。

- 单选默认点一项即提交并关闭，标题栏右侧有关闭按钮；点已选中的项直接关闭。
- `confirm`：由「确定」提交。`true` 或 `'top'` 为顶部的「取消 / 确定」工具栏；`'bottom'` 为底部的大按钮，标题栏保留关闭按钮。
- 多选（`max` 不为 `1`）总是由「确定」提交，`confirm` 为 `false` 时按 `'top'`。列表上方显示「已选 N/max」，选满后其余选项置灰；`max` 为 `0` 时不限数量。
- `clearable`：有已选项时，列表上方显示「清空」；`confirm` 为 `'bottom'` 时改为底部的「清空」按钮。不需要确认时清空即提交并关闭，否则只清空弹层内的值，由「确定」提交。没开 `clearable` 时，一项都没选不能确定。
- `searchable`：列表上方显示搜索框，规则同桌面端，没有命中项的分组连同标题一起隐藏。
- 选项的 `description` 显示在文字下方；`renderLabel` 或 `#label` 插槽自定义选项文字，如加上标签。

:::playground
<!-- <config lang="json5">{ viewport: 375, previewInset: 16 }</config> -->
```vue
<template>
	<div style="display: grid; gap: 12px; max-width: 420px">
		<MSelect
			v-model="single"
			:data="data"
			label="单选"
			title="选择条目"
			clearable
			@visible-change="visible => handleVisibleChange('single', visible)"
		/>
		<MSelect
			v-model="multiple"
			:data="data"
			:max="3"
			label="最多 3 项"
			title="选择条目"
			searchable
			clearable
			@visible-change="visible => handleVisibleChange('multiple', visible)"
		/>
		<MSelect
			v-model="bottom"
			:data="grouped"
			:max="0"
			label="底部按钮"
			title="选择条目"
			confirm="bottom"
			clearable
			@visible-change="visible => handleVisibleChange('bottom', visible)"
		/>
		<p>single：{{ single }}；multiple：{{ multiple }}；bottom：{{ bottom }}</p>
	</div>
</template>
<script setup>
import { ref, inject } from 'vue';
import { MSelect } from '@deot/vc';

const data = [
	{ value: 1, label: '条目一', description: '说明文字' },
	{ value: 2, label: '条目二' },
	{ value: 3, label: '条目三', disabled: true },
	{ value: 4, label: '条目四' },
	{ value: 5, label: '条目五' }
];
const grouped = [
	{ value: 'a', label: '分组 A', children: [{ value: 'a-1', label: '条目 A-1' }, { value: 'a-2', label: '条目 A-2' }] },
	{ value: 'b', label: '分组 B', children: [{ value: 'b-1', label: '条目 B-1' }, { value: 'b-2', label: '条目 B-2' }] }
];
const single = ref();
const multiple = ref([]);
const bottom = ref([]);

const playground = inject('docs:playground');
const visibleStates = {};
const handlePreview = playground.run(560);
const handleVisibleChange = (key, visible) => {
	visibleStates[key] = visible;
	return handlePreview(Object.values(visibleStates).some(Boolean));
};
</script>
```
:::

### 移动端内嵌视图与直接调用

`MSelectView` 是弹层里的内容，也可以直接放在页面中：每次点选都更新 `v-model` 并触发 `select`。

`MSelect.open(options)` 直接打开弹层，通过 `onOk(value, labels)` 接收结果，返回的 Portal 实例可调用 `destroy()`。

:::playground
<!-- <config lang="json5">{ viewport: 375, previewInset: 0 }</config> -->
```vue
<template>
	<div>
		<MSelectView v-model="value" :data="data" :max="2" @select="handleSelect" />
		<p style="padding: 0 16px">{{ value }} {{ selected }}</p>
		<p style="padding: 0 16px; color: var(--vc-color-primary)" @click="handleOpen">MSelect.open 直接调用：{{ opened }}</p>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { MSelect, MSelectView } from '@deot/vc';

const data = Array.from({ length: 6 }, (_, i) => ({ value: i + 1, label: `条目 ${i + 1}` }));
const value = ref([]);
const selected = ref('');
const opened = ref();

const handleSelect = ({ value: v, selected: isSelected }) => {
	selected.value = `${v} ${isSelected ? '选中' : '取消'}`;
};

const handleOpen = () => {
	MSelect.open({
		value: opened.value,
		data,
		title: '直接调用',
		searchable: true,
		onOk: (v) => {
			opened.value = v;
		}
	});
};
</script>
```
:::

## 主题与局部覆盖

全局参数通过 `--vc-<参数>` 配置，单个组件通过 `--vc-select-option-<参数>`、`--vc-select-all-<参数>`、`--vc-select-<参数>`、`--vc-select-option-group-<参数>`、`--vc-select-trigger-<参数>`、`--vc-select-highlight-<参数>` 覆盖；移动端视图使用 `--vc-select-view-<参数>`，见 [MSelectView 主题](#mselectview-主题)。同一参数可能作用于多个状态；多命名空间时在使用位置中标明。

`portal: true` 时，选项变量需设置在浮层祖先（例如 body）或通过 `portalClass` 为浮层配置，触发器上的局部变量不会自动传入浮层。

### 全局

| 参数 | 使用位置 | 值 |
| --- | --- | --- |
| color-dark-light | 内联搜索时，下拉未打开状态下的已选文字（select-trigger） | 亮色：`#080F20`；暗色：`#E8E8E8` |
| color-dark-lighter | 前置内容及选项文字（select / select-option） | 亮色：`#515151`；暗色：`#D9D9D9` |
| color-dark-extralight | 附加图标、分组标题及禁用选项（select / select-option-group / select-option） | 亮色：`#909399`；暗色：`#B9B9B9` |
| color-primary | 选中选项、全选文字及搜索命中的文字（select-option / select-all / select-highlight） | `#456CF6` |
| color-primary-light | 已全选状态文字（select-all） | `#4A96FF` |
| background-color | 禁用输入区背景（select） | 亮色：`#F5F6FA`；暗色：`#252B3A` |
| background-color-lightest | 输入区背景（select） | 亮色：`#FFFFFF`；暗色：`#252B3A` |
| background-color-primary-light | 选项高亮背景（键盘或鼠标所在的一项，select-option） | 亮色：`#E6F7FF`；暗色：`#273E5E` |

### 局部

当前组件没有额外的局部 CSS 主题参数。

## API

### 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| modelValue | 选中值；数组模型保持数组输出，非数组多选输出字符串 | `string \| number \| any[]` | - | `undefined` |
| data | 选项或一层分组数据，见下文 | `object[]` | - | `[]` |
| max | `1` 单选；大于 `1` 多选，最多选 `max` 项，选满后未选中的项禁用；`0` 多选且不限数量 | `number` | `>= 0` | `1` |
| maxTags | 多选最多显示的标签数（上限），其余折叠；`0` 或不传表示不限 | `number` | `>= 0` | `undefined`（不限） |
| maxTagLines | 多选标签最多占用的行数，按可用宽度自适应折叠；`0` 表示不限行 | `number` | `>= 0` | `1` |
| disabled | 禁用选择器 | `boolean` | - | `false` |
| clearable | 悬停时显示清空按钮 | `boolean` | - | `false` |
| searchable | 开启搜索：`true` / `'inline'` 在输入框内直接输入，`'popover'` 在下拉顶部显示搜索栏 | `boolean \| 'inline' \| 'popover'` | - | `false` |
| virtualized | 只渲染下拉可视范围附近的选项，用于大量数据；见[大量数据](#大量数据) | `boolean` | - | `false` |
| searchPlaceholder | 搜索时的占位文字：内联搜索为下拉打开且未选中时输入框的占位，`popover` 为搜索栏的占位 | `string` | - | `''` |
| clearSearchOnSelect | 多选时选中或取消一项（含全选）后清空搜索词；`false` 时保留，可在同一批结果里继续选 | `boolean` | - | `true` |
| placeholder | 输入框占位文字，通过 attribute 传入；支持空字符串覆盖 | `string` | - | 当前语言的“请选择” |
| loadData | 搜索回调，须返回 Promise，由调用方更新 data；调用时机见[远程搜索](#远程搜索) | `(query: string, instance: ComponentInternalInstance) => Promise<unknown>` | - | - |
| label | 输入框前置文字；prepend 插槽优先。字符串按文本渲染，也可传渲染函数或 `{ type, value }`，见 [Customer](../customer/README.md) | `string \| number \| Function \| { type: string; value: any }` | - | - |
| extra | 单选 label 为空或无法匹配时显示的文字 | `string` | - | `''` |
| separator | 字符串模型拆分和多选连接的分隔符 | `string` | - | `','` |
| numerable | 把模型中的字符串转为数字（字符串模型、数组各项、单值） | `boolean` | - | `false` |
| nullValue | 清空时返回的值：值不是数组且为空时生效（数组值清空仍为 `[]`）；不设置时单选为 `undefined`，字符串多选为 `''` | `number \| string \| object` | - | `undefined` |
| id | 传给内部 Input 根节点的 id | `string` | - | - |
| trigger | 弹层触发方式 | `string` | `hover / strictHover / click / focus / custom` | `'click'` |
| tag | 触发容器标签 | `string` | - | `'div'` |
| placement | 弹层方向 | `string` | `top / top-left / top-right / bottom / bottom-left / bottom-right / left / left-top / left-bottom / right / right-top / right-bottom` | `'bottom-left'` |
| arrow | 显示弹层箭头 | `boolean` | - | `false` |
| autoWidth | true 按内容宽度；false 跟随触发器宽度 | `boolean` | - | `false` |
| portal | 下拉是否挂载到 body；`false` 时挂到组件根节点内，随所在容器滚动，超出容器的部分会被其 `overflow` 裁剪 | `boolean` | - | `true` |
| portalClass | 弹层附加 class | `string \| object \| unknown[]` | - | - |
| renderOption | 自定义整个选项，需自行绑定 store.click；`option` 插槽优先 | `(options: { row: any; store: any }) => VNodeChild` | - | - |
| renderOptionGroup | 自定义分组标题；`optionGroup` 插槽优先 | `(options: { row: any; store: { group: true } }) => VNodeChild` | - | - |
| renderLabel | 自定义下拉选项文字，不影响输入框与标签文字；`label` 插槽优先 | `(options: { row: any; store: any }) => VNodeChild` | - | - |

### 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| update:modelValue | 用户选择、移除、清空或调用 add/remove 时更新模型 | `(value, labels)` | value 遵循模型类型；labels 始终为选中文字数组 |
| change | 与模型更新同时触发；外部修改 modelValue 不触发 | `(value, labels)` | 同上；单选 labels 也是数组 |
| clear | 点击可见的清空按钮时触发，先于模型更新 | - | - |
| visible-change | 点击触发器、点击外部、输入或按 Enter 改变弹层可见状态时触发；选中、清空、Esc、Tab 或调用方法引起的关闭不触发 | `(visible: boolean)` | 当前可见状态 |
| ready | 弹层创建完成 | - | - |
| close | 弹层关闭回调 | - | - |

### 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| prepend | 输入框前置内容，优先于 label 属性 | - |
| option | 整个选项，优先于 renderOption；自定义内容需绑定 store.click | `{ row, store: { checked, last, click } }` |
| optionGroup | 分组标题，优先于 renderOptionGroup | `{ row, store: { group: true } }` |
| label | 选项文字或分组标题，优先于 renderLabel | 选项：`{ row, store: { checked, last, click } }`；分组：`{ row, store: { group: true } }` |

插槽名为 `optionGroup`，在模板中使用 `#optionGroup`。默认插槽只在 data 为假值时执行，正常使用通过 data 提供选项；Option、OptionGroup 和 SelectAll 未从组件库公开入口导出。

### 方法

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| add | 添加选项；单选替换并关闭，多选追加，不去重或校验 disabled | `value: string \| number` | `void` |
| remove | 移除已存在的选项；调用前确保值已选中 | `value: string \| number` | `void` |
| close | 关闭弹层 | - | `void` |
| toggle | 指定或切换弹层状态 | `visible?: boolean` | `void` |

### data 数据项

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| value | 唯一选项值或分组标识，必填；避免字符串和数字混用同一值 | `string \| number` | - | - |
| label | 选项或分组文字；列表中缺省时显示 value，已选文字需提供 label | `string \| number` | - | - |
| disabled | 禁用选项；分组项不支持整体禁用 | `boolean` | - | `false` |
| filterable | 是否参与本地搜索过滤；false 时始终显示 | `boolean` | - | `true` |
| children | 非空时显示为分组，只渲染一层子选项；搜索时没有命中项的分组连同标题一起隐藏 | `object[]` | - | - |

### 当前行为说明

- 清空数组模型返回 `[]`；其它模型设置了 `nullValue` 时返回它，否则普通单选返回 `undefined`，字符串多选返回 `''`。`numerable` 配合字符串单选时输出字符串，清空返回 `''`。
- 当前不提供 `size`、`not-found`、`element-id` 属性；无匹配选项时列表为空。
- 内联搜索时输入框的值是搜索词，已选文字以占位文字的形式显示，不能被选中复制；需要可复制时使用 `searchable="popover"`。下拉关闭后焦点仍在输入框，但不显示光标。
- 内联搜索且下拉打开时，点击输入框只移动光标，不关闭下拉，这次点击照常冒泡到祖先节点；点击标签区（多选）、后缀图标、外部，按 Esc 或选中（单选）关闭。点击选项、标签与图标时焦点留在输入框。
- 输入框聚焦时按 Enter 会打开下拉并阻止默认行为，放在原生 `<form>` 里不会触发隐式提交。
- 方向键高亮只作用于默认渲染的选项；用 `option` 插槽或 `renderOption` 自定义整个选项时不参与。
- 默认占位符和全选按钮跟随 locale；searchPlaceholder、label、extra 和 data 文案由调用方提供。

### MSelect 属性

`MSelect` 是独立的移动端组件，见[移动端选择](#移动端选择)。支持下方 MSelectView 的全部属性（`allowDispatch` 除外），另有：

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| label | 条目标签 | `string \| number \| Function \| { type: string; value: any }` | - | - |
| labelWidth | 条目标签宽度，750 稿长度，传给 MListItem | `string \| number` | - | `''` |
| arrow | 条目箭头；禁用时不显示 | `boolean \| string` | - | `right` |
| disabled | 禁用，点击不打开 | `boolean` | - | `false` |
| extra | `formatter` 返回空值时显示的文字，允许空字符串 | `string` | - | 当前语言的 `vc.Select.placeholder` |
| formatter | 根据选中项的文字生成显示内容 | `(labels: string[], value) => any` | - | `labels => labels.join(', ')` |
| title | 弹层标题。字符串按文本渲染，也可传渲染函数或 `{ type, value }`，见 [Customer](../customer/README.md) | `string \| number \| Function \| { type: string; value: any }` | - | `''` |
| confirm | 由「确定」提交：`true` / `'top'` 为顶部的「取消 / 确定」，`'bottom'` 为底部的「清空 / 确定」按钮；多选为 `false` 时按 `'top'` | `boolean \| string` | `true`、`false`、`top`、`bottom` | `false` |
| cancelText | 顶部工具栏的取消文案，允许空字符串 | `string` | - | 当前语言的 `vc.Picker.cancelText` |
| okText | 确定按钮的文案，允许空字符串 | `string` | - | 当前语言的 `vc.Picker.okText` |

### MSelect 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| update:modelValue | 提交后更新绑定值 | `(value, labels)` | 形状同桌面端；`labels` 为选中项的文字 |
| change | 提交时触发 | `(value, labels)` | 同上 |
| ok | 提交时触发（单选点选自动提交，或点「确定」） | `(value, labels)` | 同上 |
| cancel | 点「取消」，不提交 | - | - |
| select | 弹层内每次点选一项 | `{ row, value, selected }` | 见 MSelectView 事件 |
| clear | 弹层内点击「清空」 | - | - |
| visible-change | 弹层显示状态变化 | `(visible: boolean)` | - |
| close | 弹层关闭动画完成 | - | - |

### MSelect 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 自定义可点击的触发内容，替代 MListItem | `{ label: string[], value }`，选中项的文字与当前绑定值 |
| label | 自定义弹层中的选项文字，优先于 `renderLabel` | `{ label, row, index, selected }` |

### MSelect 方法

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| open | 直接打开弹层 | MSelectView 的属性、`title`、`confirm`、`cancelText`、`okText`，以及 `onOk(value, labels)`、`onCancel()`、`onSelect(payload)`、`onClear()`、`onVisibleChange(visible)`、`onClose()` | Portal 实例，可调用 `destroy()` |

`MSelect.open` 不返回选中结果的 Promise，通过 `onOk` 接收。兼容 `value` 作为初始值的别名，同时传入时以 `modelValue` 为准。`MSelect.View` 与 `MSelectView` 为同一组件。

### MSelectView 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| data | 选项，带 `children` 的项为分组；数据项另支持 `description`（文字下方的说明） | `SelectOption[]` | - | `[]` |
| modelValue | 同桌面端 | `string \| number \| (string \| number)[]` | - | `undefined` |
| max | `1` 单选；大于 `1` 多选，最多选 `max` 项，选满后未选中的项禁用；`0` 多选且不限数量 | `number` | `>= 0` | `1` |
| clearable | 有已选项时在列表上方显示「清空」，点击后提交空值（`nullValue`，数组值为 `[]`，字符串多选为 `''`） | `boolean` | - | `false` |
| searchable | 列表上方显示搜索框 | `boolean` | - | `false` |
| searchPlaceholder | 搜索框的占位文字 | `string` | - | `''` |
| renderLabel | 自定义选项文字；`label` 插槽优先 | `(options: { label, row, index: number, selected: boolean }) => VNodeChild` | - | - |
| separator | 同桌面端 | `string` | - | `','` |
| numerable | 同桌面端 | `boolean` | - | `false` |
| nullValue | 同桌面端 | `number \| string \| object` | - | `undefined` |
| allowDispatch | 提交时通知所属表单项；MSelect 的弹层内为 `false` | `boolean` | - | `true` |

`renderLabel` 的 `index` 为选项在当前列表中的位置，不计分组标题。

### MSelectView 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| update:modelValue | 每次点选后更新 | `(value, labels)` | 同桌面端 |
| change | 同 `update:modelValue` | `(value, labels)` | 同上 |
| select | 每次点选一项，在更新之后触发；单选点已选中的项也触发 | `{ row, value, selected }` | `selected` 为点选后该项是否选中 |
| clear | 点击「清空」，先于提交空值 | - | - |

### MSelectView 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| label | 自定义选项文字 | `{ label, row, index, selected }` |

### MSelectView 主题

列表高度可通过 `--vc-select-view-height` 覆盖（默认 768，750 稿）。颜色使用以下组件变量，并回退到同名全局变量：

| 变量 | 用途 |
| --- | --- |
| `--vc-select-view-color-dark-lighter` | 选项文字 |
| `--vc-select-view-color-dark-extralight` | 分组标题、已选数量、「清空」、说明文字、无结果提示 |
| `--vc-select-view-color-primary` | 选中项与搜索命中的文字 |
| `--vc-select-view-foreground-color-inactive` | 禁用及选满后不可选的选项 |
| `--vc-select-view-background-color-light` | 选项按下时的背景 |
| `--vc-select-view-background-color-lightest` | 视图与分组标题的背景 |
