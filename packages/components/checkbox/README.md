## 多选框（Checkbox）

用于切换单个选项的状态，或从一组选项中选择多项。提供 `Checkbox`、`CheckboxGroup` 及移动端的 `MCheckbox`、`MCheckboxGroup`。

### 何时使用

- 使用单个多选框表示同意、订阅等可选状态。
- 使用组合将多个选项绑定到同一个数组。
- 使用半选状态表达一组选项中只有部分被选中。

### 基础用法

单独使用时，`v-model` 默认绑定布尔值。默认插槽优先于 `label` 显示。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<div>
		<Checkbox v-model="isChecked">选择条目</Checkbox>
		<p>当前状态：{{ isChecked ? '已选中' : '未选中' }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Checkbox } from '@deot/vc';

const isChecked = ref(false);
</script>
```
:::

### 禁用状态

`disabled` 禁止交互，也可与选中或半选状态一起使用。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<div class="checkbox-demo">
		<Checkbox disabled>未选中</Checkbox>
		<Checkbox :model-value="true" disabled>已选中</Checkbox>
		<Checkbox indeterminate disabled>部分选中</Checkbox>
	</div>
</template>

<script setup>
import { Checkbox } from '@deot/vc';
</script>

<style scoped>
.checkbox-demo {
	display: flex;
	flex-wrap: wrap;
	gap: 8px 16px;
}
</style>
```
:::

### 组合选择

组合使用 `value` 作为数组中的选项值，`label` 作为显示文案。`value` 未设置或为空字符串时回退到 `label`；`label` 未设置或为空字符串时回退显示 `value`。建议每个选项使用唯一且类型一致的值。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<div>
		<CheckboxGroup v-model="selectedItems">
			<Checkbox value="item-a" label="条目 A" />
			<Checkbox value="item-b" label="条目 B" />
			<Checkbox value="item-c" label="条目 C" />
		</CheckboxGroup>
		<p>已选值：{{ selectedItems }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Checkbox, CheckboxGroup } from '@deot/vc';

const selectedItems = ref(['item-a']);
</script>
```
:::

### 全选与半选

`indeterminate` 只控制外观，不改变绑定值或原生 input 的半选属性。全选状态和已选数组由调用方维护。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<div class="checkbox-demo">
		<Checkbox
			:model-value="isAllChecked"
			:indeterminate="isIndeterminate"
			@change="handleCheckAll"
		>
			全选条目
		</Checkbox>
		<CheckboxGroup v-model="selectedItems">
			<Checkbox v-for="item in items" :key="item" :value="item" />
		</CheckboxGroup>
		<p>已选择 {{ selectedItems.length }} / {{ items.length }} 项</p>
	</div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { Checkbox, CheckboxGroup } from '@deot/vc';

const items = ['条目 A', '条目 B', '条目 C'];
const selectedItems = ref(['条目 A']);
const isAllChecked = computed(() => selectedItems.value.length === items.length);
const isIndeterminate = computed(() => selectedItems.value.length > 0 && !isAllChecked.value);

const handleCheckAll = (isChecked) => {
	selectedItems.value = isChecked ? [...items] : [];
};
</script>

<style scoped>
.checkbox-demo {
	display: grid;
	gap: 8px;
}
</style>
```
:::

### 自定义选中值

单独使用时可通过 `checkedValue` 和 `uncheckedValue` 映射业务值；这两个属性在组合中无效。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<div>
		<Checkbox v-model="status" checked-value="enabled" unchecked-value="disabled">
			启用选项
		</Checkbox>
		<p>当前值：{{ status }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Checkbox } from '@deot/vc';

const status = ref('disabled');
</script>
```
:::

### 移动端

`MCheckbox` 与 `MCheckboxGroup` 使用相同的数据和事件约定，选中色与桌面端一致，使用主色参数。`fragment` 可省略组合外层容器，便于自定义布局。

:::playground
<!-- <config lang="json5">{ viewport: 375, previewInset: 16 }</config> -->
```vue
<template>
	<div class="checkbox-demo">
		<MCheckboxGroup v-model="selectedOptions" fragment>
			<MCheckbox value="option-a" label="选项 A" />
			<MCheckbox value="option-b" label="选项 B" />
			<MCheckbox value="option-c" label="选项 C（不可选）" disabled />
		</MCheckboxGroup>
		<p>已选值：{{ selectedOptions }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MCheckbox, MCheckboxGroup } from '@deot/vc';

const selectedOptions = ref(['option-a']);
</script>

<style scoped>
.checkbox-demo {
	display: grid;
	gap: 20px;
}
</style>
```
:::

## 主题与局部覆盖

全局参数通过 `--vc-<参数>` 配置，单个组件通过 `--vc-checkbox-<参数>`、`--vc-m-checkbox-<参数>` 覆盖。同一参数可能作用于多个状态；多命名空间时在使用位置中标明。

桌面端使用 checkbox，移动端使用 m-checkbox；两端选中、半选及焦点使用相同的主色参数。勾选标记使用可覆盖的 color-contrast-light。

### 全局

| 参数 | 使用位置 | 值 |
| --- | --- | --- |
| color-contrast-light | 勾选标记（checkbox / m-checkbox） | `#FFFFFF`（亮暗主题相同） |
| color-error | 校验错误边框（checkbox / m-checkbox） | `#F53F3F` |
| color-light-extradeep | 禁用且选中时的勾选标记（checkbox / m-checkbox） | 亮色：`#B9B9B9`；暗色：`#F8F8F8` |
| color-primary | 选中及半选背景、边框（checkbox / m-checkbox） | `#456CF6` |
| color-primary-lighter | 焦点阴影（checkbox / m-checkbox） | `rgba(45, 140, 240, 0.2)` |
| background-color | 禁用勾选框背景（checkbox / m-checkbox） | 亮色：`#F5F6FA`；暗色：`#252B3A` |
| background-color-lightest | 勾选框背景（checkbox / m-checkbox） | 亮色：`#FFFFFF`；暗色：`#252B3A` |
| border-color | 勾选框边框及禁用边框（checkbox / m-checkbox） | `#D5D9E1` |

### 局部

当前组件没有额外的局部 CSS 主题参数。

## API

### Checkbox / MCheckbox 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| modelValue | 单独使用时的绑定值，严格等于 checkedValue 时选中 | `string \| number \| boolean` | - | `false` |
| value | 组合中的选项值；缺省或为空字符串时使用 label；也可作为显示文案的回退值 | `string \| number \| boolean` | - | `undefined` |
| label | 显示文案；缺省或为空字符串时使用 value；无默认插槽时渲染 | `string \| number \| boolean` | - | `undefined` |
| disabled | 禁用当前选项 | `boolean` | - | `false` |
| indeterminate | 半选外观，仅控制样式 | `boolean` | - | `false` |
| checkedValue | 单独使用时选中对应的值 | `string \| number \| boolean` | - | `true` |
| uncheckedValue | 单独使用时取消选中对应的值 | `string \| number \| boolean` | - | `false` |
| name | 传递给原生 input 的 name | `string` | - | - |

### Checkbox / MCheckbox 事件

以下事件只在单独使用时由选项交互触发。组合内由组合组件触发；外部修改 modelValue 不触发这些事件。

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| update:modelValue | 更新绑定值，用于 v-model | `(value, event, reset)` | value 为 checkedValue 或 uncheckedValue；event 为原生 change 事件；reset 为 `(checked: boolean) => void` |
| change | 选项状态改变 | `(value, event, reset)` | 与 update:modelValue 参数相同 |

`reset` 仅修改组件内部状态，不再次发出事件；使用 `v-model` 时，调用方仍需同步外部绑定值。组件没有公开实例方法。

### Checkbox / MCheckbox 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 自定义选项内容，优先于 label/value 的显示文案 | - |

### CheckboxGroup / MCheckboxGroup 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| modelValue | 选中值数组，建议元素为 string、number 或 boolean | `unknown[]` | - | `[]` |
| fragment | 只渲染默认插槽，省略外层 div 及其样式 | `boolean` | - | `false` |

### CheckboxGroup / MCheckboxGroup 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| update:modelValue | 子项交互后更新数组，用于 v-model | `(values, event, reset)` | values 为选中值数组；event 为原生 change 事件；reset 为 `(value: unknown) => void`，切换指定值的选中状态 |
| change | 子项选中状态改变，外部赋值不触发 | `(values, event, reset)` | 与 update:modelValue 参数相同 |

组合直接修改当前数组，事件中的 `values` 也是该数组；请传入可变的数组。回调中的 `reset` 不再次发出事件。组合没有公开实例方法。

### CheckboxGroup / MCheckboxGroup 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 对应平台的多选框选项及自定义布局 | - |
