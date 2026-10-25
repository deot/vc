## 选择器（Select）

从数据列表中单选或多选，支持分组、搜索和自定义选项。移动端导出 `MSelect`，与 `Select` 使用同一实现。

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

`max > 1` 启用多选，当前实现不会按 `max` 限制选中数量。`maxTags` 是显示标签数量的上限。

标签默认只占一行（`maxTagLines = 1`）：按输入框的可用宽度决定实际显示几个，放不下的折叠为 `+N...`；连 1 个都放不下时，第 1 个标签以省略号截断。`maxTagLines` 设为 `n` 时最多占 `n` 行；设为 `0` 时不限行，标签自由换行，只按 `maxTags` 截断。

悬停 `+N...` 时弹出被折叠的标签列表，可在列表中移除（禁用时只读）；悬停被截断的标签时显示完整内容。

开启 `searchable` 后，按选项文字进行不区分大小写的匹配，命中的部分高亮；空格分隔的关键词需同时命中，英文逗号分隔的各组任一命中即可（如 `a b,c`：同时含 a 和 b，或含 c）。输入非空关键词时，可全选或取消选择当前匹配且未禁用的选项，其他已选项保留。全选逐项触发值更新事件。

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
			:max="2"
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

两种方式下，关闭下拉都会清空搜索词；下拉关闭但输入框聚焦时，直接输入也会打开下拉。

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

以数组初始化时返回数组；以字符串初始化多选时，使用 `separator` 连接选中值。数字选项搭配字符串模型时，可使用 `numerable`，并保持默认逗号分隔符。

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

`loadData(query, instance)` 必须返回 Promise，搜索输入经过 250ms 防抖后调用；未开启 `searchable` 时不会调用。调用方更新 `data`；Promise 的返回值不会自动成为选项。加载期间输入框后缀显示加载图标，本地文字过滤仍然生效，需要跳过本地过滤的结果可设置 `filterable: false`。打开下拉时，如果还没有数据，或当前数据是按某个关键词加载的，会立即以空关键词调用一次，用于加载默认数据；关闭下拉时只重置搜索词，不调用它。搜索结果里没有已选项时，输入框与标签沿用上次查到的文字。

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

## 主题与局部覆盖

全局参数通过 `--vc-<参数>` 配置，单个组件通过 `--vc-select-option-<参数>`、`--vc-select-all-<参数>`、`--vc-select-<参数>`、`--vc-select-option-group-<参数>`、`--vc-select-trigger-<参数>`、`--vc-select-highlight-<参数>` 覆盖。同一参数可能作用于多个状态；多命名空间时在使用位置中标明。

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
| max | 大于 1 启用多选；当前不限制选中数量 | `number` | `>= 1` | `1` |
| maxTags | 多选最多显示的标签数（上限），其余折叠；`0` 或不传表示不限 | `number` | `>= 0` | `undefined`（不限） |
| maxTagLines | 多选标签最多占用的行数，按可用宽度自适应折叠；`0` 表示不限行 | `number` | `>= 0` | `1` |
| disabled | 禁用选择器 | `boolean` | - | `false` |
| clearable | 悬停时显示清空按钮 | `boolean` | - | `false` |
| searchable | 开启搜索：`true` / `'inline'` 在输入框内直接输入，`'popover'` 在下拉顶部显示搜索栏 | `boolean \| 'inline' \| 'popover'` | - | `false` |
| virtualized | 只渲染下拉可视范围附近的选项，用于大量数据；见[大量数据](#大量数据) | `boolean` | - | `false` |
| searchPlaceholder | 搜索时的占位文字：内联搜索为下拉打开且未选中时输入框的占位，`popover` 为搜索栏的占位 | `string` | - | `''` |
| placeholder | 输入框占位文字，通过 attribute 传入；支持空字符串覆盖 | `string` | - | 当前语言的“请选择” |
| loadData | 搜索回调，须返回 Promise，由调用方更新 data；调用时机见[远程搜索](#远程搜索) | `(query: string, instance: ComponentInternalInstance) => Promise<unknown>` | - | - |
| label | 输入框前置文字；prepend 插槽优先。字符串按文本渲染，也可传渲染函数或 `{ type, value }`，见 [Customer](../customer/README.md) | `string \| number \| Function \| { type: string; value: any }` | - | - |
| extra | 单选 label 为空或无法匹配时显示的文字 | `string` | - | `''` |
| separator | 字符串模型拆分和多选连接的分隔符 | `string` | - | `','` |
| numerable | 将字符串模型解析为数字值 | `boolean` | - | `false` |
| nullValue | 已声明的清空值配置；当前实现未应用，见下方说明 | `number \| string \| object` | - | `undefined` |
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

- 清空数组模型返回 `[]`；普通单选返回 `undefined`；字符串多选返回 `''`。`numerable` 配合字符串模型时，当前输出通过数组转字符串，因此清空返回 `''`，多值输出固定使用逗号。
- `nullValue` 当前未用于清空结果，为当前实现限制。
- 当前不提供 `size`、`not-found`、`element-id` 属性；无匹配选项时列表为空。
- 内联搜索时输入框的值是搜索词，已选文字以占位文字的形式显示，不能被选中复制；需要可复制时使用 `searchable="popover"`。下拉关闭后焦点仍在输入框，但不显示光标。
- 内联搜索且下拉打开时，点击输入框只移动光标，不关闭下拉，这次点击照常冒泡到祖先节点；点击标签区（多选）、后缀图标、外部，按 Esc 或选中（单选）关闭。点击选项、标签与图标时焦点留在输入框。
- 输入框聚焦时按 Enter 会打开下拉并阻止默认行为，放在原生 `<form>` 里不会触发隐式提交。
- 方向键高亮只作用于默认渲染的选项；用 `option` 插槽或 `renderOption` 自定义整个选项时不参与。
- 默认占位符和全选按钮跟随 locale；searchPlaceholder、label、extra 和 data 文案由调用方提供。
