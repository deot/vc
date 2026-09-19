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
		<Select v-model="city" :data="cities" clearable placeholder="选择城市" />
		<p>当前值：{{ city ?? '未选择' }}</p>
		<Select model-value="london" :data="cities" disabled />
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Select } from '@deot/vc';

const city = ref('paris');
const cities = [
	{ value: 'paris', label: 'Paris' },
	{ value: 'london', label: 'London' },
	{ value: 'sydney', label: 'Sydney', disabled: true }
];
</script>

<style scoped>
.select-demo { width: min(100%, 320px); }
.select-demo p { margin: 12px 0; }
</style>
```
:::

### 多选与搜索全选

`max > 1` 启用多选，当前实现不会按 `max` 限制选中数量。`maxTags` 只控制显示的标签数量。

开启 `searchable` 后，按选项文字进行不区分大小写的匹配；空格或逗号分隔的关键词按“或”匹配。输入非空关键词时，可全选或取消选择当前匹配且未禁用的选项，其他已选项保留。全选逐项触发值更新事件。

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
			v-model="cities"
			:data="options"
			:max="2"
			:max-tags="2"
			searchable
			clearable
			search-placeholder="输入 New，试试全选"
		/>
		<p>已选：{{ cities.length ? cities.join('、') : '无' }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Select } from '@deot/vc';

const cities = ref([]);
const options = [
	{ value: 'new-york', label: 'New York' },
	{ value: 'new-orleans', label: 'New Orleans' },
	{ value: 'new-delhi', label: 'New Delhi', disabled: true },
	{ value: 'paris', label: 'Paris' }
];
</script>

<style scoped>
.select-demo { width: min(100%, 360px); }
.select-demo p { margin: 12px 0 0; overflow-wrap: anywhere; }
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
		<Select v-model="cities" :data="options" :max="2" separator=";" clearable />
		<p>字符串值：{{ JSON.stringify(cities) }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Select } from '@deot/vc';

const cities = ref('paris;london');
const options = [
	{ value: 'paris', label: 'Paris' },
	{ value: 'london', label: 'London' },
	{ value: 'sydney', label: 'Sydney' }
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
		<Select v-model="city" :data="groups" label="城市" searchable>
			<template #label="{ row, store }">
				<strong v-if="store.group">{{ row.label }}</strong>
				<span v-else>{{ row.label }} · {{ row.country }}</span>
			</template>
		</Select>
		<p>当前值：{{ city || '未选择' }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Select } from '@deot/vc';

const city = ref('');
const groups = [
	{
		value: 'europe', label: '欧洲',
		children: [
			{ value: 'paris', label: 'Paris', country: '法国' },
			{ value: 'london', label: 'London', country: '英国' }
		]
	},
	{
		value: 'oceania', label: '大洋洲',
		children: [{ value: 'sydney', label: 'Sydney', country: '澳大利亚' }]
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

`loadData(query, instance)` 必须返回 Promise，搜索输入经过 250ms 防抖后调用。调用方更新 `data`；Promise 的返回值不会自动成为选项。加载期间显示 Spin，本地文字过滤仍然生效，需要跳过本地过滤的结果可设置 `filterable: false`。

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
			v-model="city"
			:data="options"
			:load-data="loadCities"
			searchable
			search-placeholder="输入城市名称"
		/>
		<p>当前值：{{ city || '未选择' }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Select } from '@deot/vc';

const city = ref('');
const source = [
	{ value: 'paris', label: 'Paris' },
	{ value: 'london', label: 'London' },
	{ value: 'sydney', label: 'Sydney' }
];
const options = ref(source);
const loadCities = async (query) => {
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

## API

### 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| modelValue | 选中值；数组模型保持数组输出，非数组多选输出字符串 | `string \| number \| any[]` | - | `undefined` |
| data | 选项或一层分组数据，见下文 | `object[]` | - | `[]` |
| max | 大于 1 启用多选；当前不限制选中数量 | `number` | `>= 1` | `1` |
| maxTags | 多选最多显示的标签数，其余折叠；使用正整数 | `number` | - | `undefined`（全部显示） |
| disabled | 禁用选择器 | `boolean` | - | `false` |
| clearable | 悬停时显示清空按钮 | `boolean` | - | `false` |
| searchable | 显示搜索框 | `boolean` | - | `false` |
| searchPlaceholder | 搜索框占位文字 | `string` | - | `''` |
| placeholder | 输入框占位文字，通过 attribute 传入；支持空字符串覆盖 | `string` | - | 当前语言的“请选择” |
| loadData | 搜索回调，须返回 Promise，由调用方更新 data | `(query: string, instance: ComponentInternalInstance) => Promise<unknown>` | - | - |
| label | 输入框前置文字；prepend 插槽优先 | `string` | - | - |
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
| portal | 已声明；当前未传递给 Popover，弹层仍按 Popover 默认挂载 | `boolean` | - | `true` |
| portalClass | 弹层附加 class | `string \| object \| unknown[]` | - | - |
| renderOption | 自定义整个选项，需自行绑定 store.click | `(options: { row: any; store: any }) => VNodeChild` | - | - |
| renderOptionGroup | 自定义分组标题 | `(options: { row: any; store: { group: true } }) => VNodeChild` | - | - |
| renderLabel | 自定义下拉选项文字，不影响输入框与标签文字 | `(options: { row: any; store: any }) => VNodeChild` | - | - |

### 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| update:modelValue | 用户选择、移除、清空或调用 add/remove 时更新模型 | `(value, labels)` | value 遵循模型类型；labels 始终为选中文字数组 |
| change | 与模型更新同时触发；外部修改 modelValue 不触发 | `(value, labels)` | 同上；单选 labels 也是数组 |
| clear | 点击可见的清空按钮时触发，先于模型更新 | - | - |
| visible-change | 弹层可见状态变化 | `(visible: boolean)` | 当前可见状态 |
| ready | 弹层创建完成 | - | - |
| close | 弹层关闭回调 | - | - |

### 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| prepend | 输入框前置内容，优先于 label 属性 | - |
| option | 整个选项；renderOption 优先，自定义内容需绑定 store.click | `{ row, store: { checked, last, click } }` |
| optionGroup | 分组标题；renderOptionGroup 优先 | `{ row, store: { group: true } }` |
| label | 选项文字或分组标题；选项的 renderLabel 优先 | 选项：`{ row, store: { checked, last, click } }`；分组：`{ row, store: { group: true } }` |

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
| children | 非空时显示为分组，只渲染一层子选项 | `object[]` | - | - |

### 当前行为说明

- 清空数组模型返回 `[]`；普通单选返回 `undefined`；字符串多选返回 `''`。`numerable` 配合字符串模型时，当前输出通过数组转字符串，因此清空返回 `''`，多值输出固定使用逗号。
- `nullValue` 当前未用于清空结果；`portal` 当前未传递给 Popover。以上为当前实现限制。
- 当前不提供 `size`、`not-found`、`element-id` 属性；无匹配选项时列表为空。
- 默认占位符和全选按钮跟随 locale；searchPlaceholder、label、extra 和 data 文案由调用方提供。
