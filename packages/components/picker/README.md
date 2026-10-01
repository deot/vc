## 选择器（Picker）

滚轮选择器，支持层级联动、独立多列、内嵌视图和底部弹层。公共入口提供 `Picker`、`PickerView`、`PickerPopup`，以及对应的 `MPicker`、`MPickerView`、`MPickerPopup` 别名；它们使用同一套移动端实现。

### 何时使用

需要选择地区、分类或一组独立选项时使用。使用 `Picker` 点击打开并在确认后提交；需要直接展示滚轮时使用 `PickerView`。

### 基础用法

联动数据通过 `children` 描述层级，`cols` 指定显示列数。拖动上级列会重建下级列；点击取消保留原值，点击确定才更新 `Picker` 的 `modelValue`。

:::playground
<!--
<config lang="json5">
{ viewport: 375, previewInset: 16 }
</config>
-->
```vue
<template>
	<div class="demo">
		<Picker
			v-model="value"
			:data="data"
			:cols="2"
			label="分组"
			title="选择地区"
			@visible-change="visible => visible && handleVisibleChange(true)"
			@close="handleVisibleChange(false)"
			@change="handleChange"
		/>
		<p>已提交：{{ value }}</p>
		<p>名称：{{ selectedLabel }}</p>
	</div>
</template>

<script setup>
import { ref, inject } from 'vue';
import { Picker } from '@deot/vc';

const playground = inject('docs:playground');
const handleVisibleChange = playground.run(460);

const data = [
	{ value: 'group-a', label: '分组 A', children: [
		{ value: 'item-a1', label: '条目 A-1' },
		{ value: 'item-a2', label: '条目 A-2' }
	] },
	{ value: 'group-b', label: '分组 B', children: [
		{ value: 'item-b1', label: '条目 B-1' },
		{ value: 'item-b2', label: '条目 B-2' }
	] }
];
const value = ref(['group-a', 'item-a1']);
const selectedLabel = ref('分组 A / 条目 A-1');
const handleChange = (_, labels) => {
	selectedLabel.value = labels.join(' / ');
};
</script>

<style scoped>
.demo { display: grid; gap: 12px; }
p { margin: 0; overflow-wrap: anywhere; }
</style>
```
:::

### 独立多列与内嵌视图

`cascader=false` 时，`data` 是列数组。下例使用字符串模型和 `|` 分隔符，`PickerView` 在滚动结束时直接提交；`picker-change` 同时提供当前列的值、从零开始的列索引和数据项。

:::playground
<!--
<config lang="json5">
{ viewport: 375, previewInset: 16 }
</config>
-->
```vue
<template>
	<div class="demo">
		<PickerView v-model="value" :data="data" :cols="2" :cascader="false" separator="|" @picker-change="handlePickerChange" />
		<p>字符串值：{{ value }}</p>
		<p>{{ lastChange }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { PickerView } from '@deot/vc';

const data = [
	[{ value: '2026', label: '2026 年' }, { value: '2027', label: '2027 年' }],
	[{ value: 'spring', label: '春季' }, { value: 'summer', label: '夏季' }]
];
const value = ref('2026|spring');
const lastChange = ref('拖动任意一列查看结果');
const handlePickerChange = (next, index, row) => {
	lastChange.value = `第 ${index + 1} 列：${row.label}（${next}）`;
};
</script>

<style scoped>
.demo { display: grid; gap: 12px; }
p { margin: 0; overflow-wrap: anywhere; }
</style>
```
:::

### 异步加载与自定义触发区域

仅当数据为空且提供 `loadData` 时，点击才会等待加载。加载函数需要更新绑定的 `data`；返回值不会自动作为数据源。默认插槽中的 `label` 是格式化后的展示文本。

:::playground
<!--
<config lang="json5">
{ viewport: 375, previewInset: 16 }
</config>
-->
```vue
<template>
	<div class="demo">
		<Picker
			v-model="value"
			:data="data"
			:load-data="loadData"
			title="选择条目"
			@visible-change="visible => visible && handleVisibleChange(true)"
			@close="handleVisibleChange(false)"
		>
			<template #default="{ label }">
				<Button>{{ isLoading ? '加载中…' : label }}</Button>
			</template>
		</Picker>
		<p>当前值：{{ value }}</p>
	</div>
</template>

<script setup>
import { ref, inject } from 'vue';
import { Button, Picker } from '@deot/vc';

const playground = inject('docs:playground');
const handleVisibleChange = playground.run(400);

const data = ref([]);
const value = ref(['item-a']);
const isLoading = ref(false);
const loadData = async () => {
	isLoading.value = true;
	await new Promise(resolve => setTimeout(resolve, 300));
	data.value = [
		{ value: 'item-a', label: '条目 A' },
		{ value: 'item-b', label: '条目 B' }
	];
	isLoading.value = false;
};
</script>

<style scoped>
.demo { display: grid; gap: 12px; }
p { margin: 0; overflow-wrap: anywhere; }
</style>
```
:::

### 方法调用

`Picker.open` 与 `MPicker.open` 均可打开选择弹层。通过 `onOk` 接收确认结果；`modelValue` 优先于兼容参数 `value`。方法调用需要直接提供数据。

:::playground
<!--
<config lang="json5">
{ viewport: 375, previewInset: 16 }
</config>
-->
```vue
<template>
	<div class="demo">
		<Button @click="handleOpen">选择条目</Button>
		<p>{{ result }}</p>
	</div>
</template>

<script setup>
import { onBeforeUnmount, ref, inject } from 'vue';
import { Button, MPicker } from '@deot/vc';

const playground = inject('docs:playground');

const value = ref(['item-a']);
const result = ref('尚未确认');
let picker;
const handleOpen = playground.run(400, async () => {
	picker?.destroy();
	picker = MPicker.open({
		title: '选择条目',
		modelValue: value.value,
		data: [
			{ value: 'item-a', label: '条目 A' },
			{ value: 'item-b', label: '条目 B' }
		],
		onOk: (next, labels) => {
			value.value = next;
			result.value = `已确认：${labels.join(' / ')}`;
		},
		onCancel: () => {
			result.value = '已取消，保留原值';
		}
	});
	await picker;
});
onBeforeUnmount(() => picker?.destroy());
</script>

<style scoped>
.demo { display: grid; gap: 12px; justify-items: start; }
p { margin: 0; overflow-wrap: anywhere; }
</style>
```
:::

### 组合弹层与视图

`PickerPopup` 负责工具栏和弹层，不包含选择逻辑。可以组合 `PickerView`，由调用方维护草稿值，并在确认后提交。`visible` 为布尔值时优先于 `modelValue`。

:::playground
<!--
<config lang="json5">
{ viewport: 375, previewInset: 16 }
</config>
-->
```vue
<template>
	<div class="demo">
		<Button @click="handleOpen">打开组合选择器</Button>
		<p>已提交：{{ value }}</p>
		<PickerPopup
			v-model:visible="isVisible"
			title="选择季节"
			@close="isPreviewVisible = false"
			@ok="handleOk"
		>
			<PickerView v-model="draft" :data="data" />
		</PickerPopup>
	</div>
</template>

<script setup>
import { ref, inject } from 'vue';
import { Button, PickerPopup, PickerView } from '@deot/vc';

const playground = inject('docs:playground');

const data = [
	{ value: 'spring', label: '春季' },
	{ value: 'summer', label: '夏季' },
	{ value: 'autumn', label: '秋季' },
	{ value: 'winter', label: '冬季' }
];
const value = ref(['spring']);
const draft = ref(['spring']);
const isVisible = ref(false);
const isPreviewVisible = ref(false);
const handleOpen = playground.run(460, { visible: isPreviewVisible }, () => {
	draft.value = value.value.slice();
	isPreviewVisible.value = true;
	isVisible.value = true;
});
const handleOk = () => {
	value.value = draft.value.slice();
};
</script>

<style scoped>
.demo { display: grid; gap: 12px; justify-items: start; }
p { margin: 0; overflow-wrap: anywhere; }
</style>
```
:::

## API

### Picker 属性

以下 API 同样适用于 `MPicker`。

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| modelValue | 选中值，支持 v-model | `PickerModelValue` | - | `[]` |
| data | 联动树或独立列数据 | `PickerSource` | - | `[]` |
| cols | 列数 | `number` | - | `1` |
| cascader | 是否联动下级列 | `boolean` | - | `true` |
| itemStyle | 每个选项的行内样式；改变高度时应同时设置行高变量 | `Record<string, any>` | - | - |
| loadData | 数据为空时点击执行；需更新 data | `() => Promise<any> \| any` | - | - |
| label | 默认触发区域的标题 | `string` | - | - |
| labelWidth | 默认触发区域标题宽度，传给 MListItem | `string \| number` | - | - |
| extra | formatter 返回空值时的提示；支持空字符串 | `string` | - | 当前语言的“请选择” |
| formatter | 格式化选中项的 label 数组 | `(label: any[]) => string` | - | 以 `,` 拼接 |
| title | 弹层标题，通过 innerHTML 渲染，只传可信内容 | `string` | - | `''` |
| cancelText | 取消文本，空字符串隐藏按钮 | `string` | - | 当前语言的“取消” |
| okText | 确定文本，空字符串隐藏按钮 | `string` | - | 当前语言的“确定” |
| showToolbar | 显示工具栏 | `boolean` | - | `true` |
| renderLabel | 自定义选项渲染函数，接收含 label、row、index 的对象 | `Render` | - | - |
| separator | 字符串模型的分隔符 | `string` | - | `','` |
| numerable | 解析字符串模型时把各项转为 number | `boolean` | - | `false` |
| nullValue | 传入内部值规范化函数的空值参数；不提供清空交互 | `PickerModelValue` | - | `undefined` |

### Picker 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| update:modelValue | 确认后回写 | `(value, labels, items)` | 选中值、各列 label、选中数据项数组 |
| change | 确认后触发 | `(value, labels, items)` | 与 update:modelValue 相同 |
| ok | 点击确定 | `(value, labels, items)` | 同上，在 change 之前触发 |
| picker-change | 滚动结束时触发，包括尚未确认的选择 | `(value, index, row)` | 当前列的值、列索引、当前项；联动后的完整值在确认时返回 |
| cancel | 点击取消 | `()` | - |
| close | 关闭动画结束 | `()` | 确认、取消或遮罩关闭均可触发 |
| visible-change | 弹层显示状态变化 | `(visible: boolean)` | 是否显示 |

### Picker 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 自定义点击区域；整体仍由 Picker 响应点击 | `{ label, value, data }`，label 为格式化文本，value 为内部值数组，data 为源数据 |

### Picker 方法

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| Picker.open / MPicker.open | 创建选择弹层 | `options: Record<string, any>` | `PortalLeaf`，可调用 `destroy()` |
| Picker.View / MPicker.View | PickerView 的静态组件别名 | - | - |
| Picker.Popup / MPicker.Popup | PickerPopup 的静态组件别名 | - | - |

`open(options)` 支持 `modelValue`（兼容 `value`）、`data`、`cols`、`cascader`、`itemStyle`、`renderLabel`、`separator`、`numerable`、`nullValue`、`title`、`cancelText`、`okText`、`showToolbar` 和 `visible`（默认 `true`）。`onOk(value, labels, items)`、`onCancel()`、`onChange(value, labels, items)`、`onPickerChange(value, index, row)`、`onVisibleChange(visible)`、`onClose()` 对应弹层事件。该方法不执行 `loadData`，也没有触发区域的 `label`、`extra` 和 `formatter`。

### PickerView 属性

以下 API 同样适用于 `MPickerView`。

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| modelValue | 当前值，支持 v-model | `PickerModelValue` | - | `[]` |
| data | 联动树或独立列数据 | `PickerSource` | - | `[]` |
| cols | 列数，渲染时最少一列 | `number` | - | `1` |
| cascader | 是否联动下级列 | `boolean` | - | `true` |
| itemStyle | 每个选项的行内样式 | `Record<string, any>` | - | - |
| renderLabel | 自定义选项渲染，接收含 label、row、index 的对象 | `Render` | - | - |
| allowDispatch | 选择变化时通知注入的 FormItem | `boolean` | - | `true` |
| separator | 字符串模型的分隔符 | `string` | - | `','` |
| numerable | 解析字符串模型时把各项转为 number | `boolean` | - | `false` |
| nullValue | 内部值规范化函数的空值参数 | `PickerModelValue` | - | `undefined` |

### PickerView 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| update:modelValue | 滚动结束后回写 | `(value, labels, items)` | 规范化后的完整值、label 数组、选中项数组 |
| change | 滚动结束后触发 | `(value, labels, items)` | 同上 |
| picker-change | 当前列滚动结束 | `(value, index, row)` | 当前列的值、从零开始的列索引、当前项 |

`PickerView` 不消费插槽。初次挂载或数据更新时，会为无效值选择该列第一项；这个默认选择本身不触发回写事件。

`Picker` / `open` 的弹层也使用上述默认展示逻辑，但确认读取的是当前草稿模型。空模型或无效模型未经过滚动时，直接确认不会自动提交所展示的首项；需要默认确认首项时，请预先传入有效的 `modelValue`。

### PickerPopup 属性

以下 API 同样适用于 `MPickerPopup`。

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| modelValue | 弹层显示状态，支持 v-model | `boolean` | - | `true` |
| visible | 显示状态别名，布尔值时优先；支持 v-model:visible | `boolean` | - | `undefined` |
| title | 标题，通过 innerHTML 渲染，只传可信内容 | `string` | - | `''` |
| cancelText | 取消文本，空字符串隐藏按钮 | `string` | - | 当前语言的“取消” |
| okText | 确定文本，空字符串隐藏按钮 | `string` | - | 当前语言的“确定” |
| showToolbar | 显示工具栏 | `boolean` | - | `true` |

### PickerPopup 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| update:modelValue | 显示状态变化 | `(visible: boolean)` | 是否显示 |
| update:visible | 显示状态变化 | `(visible: boolean)` | 是否显示 |
| visible-change | 显示状态变化 | `(visible: boolean)` | 是否显示 |
| ok | 点击确定并关闭 | `()` | - |
| cancel | 点击取消并关闭 | `()` | - |
| close | 关闭动画结束 | `()` | - |

### PickerPopup 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 弹层内容 | - |

### 数据与值类型

以下类型由公共入口导出：

```ts
type PickerValue = string | number | boolean | null | undefined;
type PickerModelValue = PickerValue | PickerValue[];
interface PickerData {
	[key: string]: any;
	value?: PickerValue;
	label?: any;
	children?: PickerData[];
	hasChildren?: boolean;
	loading?: boolean;
}
type PickerColumn = PickerData[];
type PickerSource = PickerColumn | PickerColumn[];
```

`label` 缺省时使用 `value`；label 也可为渲染函数。`cascader=true` 时使用 `PickerData[]` 树，`cascader=false` 时使用单列数据或 `PickerColumn[]`。

数组模型回写数组；非数组模型在单列时回写该项值，多列时按 `separator` 拼接。当前 `numerable=true` 且模型为字符串时，回写会使用数组字符串化的逗号分隔，因此需要自定义分隔符时建议使用数组模型。`Picker` 打开弹层时将模型转为内部数组，最终确认再按外部模型转换。

### 主题与语言

默认文案读取 `vc.Picker.extra`、`vc.Picker.cancelText`、`vc.Picker.okText`，会跟随 `VcInstance.configure({ locale })` 更新；显式文本属性优先。

样式支持 `--vc-picker-background-color-light`、`--vc-picker-color-dark`、`--vc-picker-color-primary`、`--vc-picker-color-light-deeper`，缺省时使用同名全局主题变量。`--vc-picker-item-height` 控制滚轮行高，默认随 SCSS 缩放的 `34px`；视图高度、遮罩和拖动计算与此行高保持一致。通过 `open` 创建的弹层挂载在 body，组件变量需要设置在可覆盖该弹层的祖先元素上。
