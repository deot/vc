## 多选框（Checkbox）

多选框,主要用于一组可选项多项选择，或者单独用于标记切换某种状态。

### 何时使用

- 在一组可选项中进行多项选择时
- 单独使用可以表示两种状态之间的切换，和`switch`类似。区别在于切换`switch`会直接触发状态改变，而`checkbox`一般用于状态标记，需要和提交操作配合

### 基础用法

简单的`checkbox`，单独使用可以表示两种状态之间的切换，写在标签中的内容为`checkbox`按钮后的介绍。

:::RUNTIME
```vue
<template>
	<Checkbox v-model="isChecked">
		Checkbox
	</Checkbox>
</template>
<script setup>
import { ref } from 'vue';
import { Checkbox } from '@deot/vc';

const isChecked = ref(false);
</script>
```
:::

### 禁用
使用`disabled`禁用checkbox。

:::RUNTIME
```vue
<template>
	<div>
		<Checkbox v-model="isChecked1" disabled>
			Checkbox1
		</Checkbox>
		<br/>
		<br/>
		<Checkbox v-model="isChecked2" disabled>
			Checkbox2
		</Checkbox>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Checkbox } from '@deot/vc';

const isChecked1 = ref(false);
const isChecked2 = ref(true);
</script>
```
:::

### Checkbox组
适用于多个勾选框绑定到同一个数组的情景，通过是否勾选来表示这一组选项中选中的项。。

:::RUNTIME
```vue
<template>
	<div>
		<CheckboxGroup v-model="checkedFruits">
			<Checkbox
				v-for="fruit in fruits"
				:key="fruit"
				:label="fruit"
			/>
		</CheckboxGroup>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Checkbox } from '@deot/vc';

const fruits = ref(['Apple', 'Bananer', 'mongo']);
const checkedFruits = ref(['Apple']);
</script>
```
:::

### indeterminate 状态
`indeterminate` 属性用以表示 checkbox 的不确定状态，一般用于实现全选的效果。

:::RUNTIME
```vue
<template>
	<div>
		<div style="border-bottom: 1px solid #e9e9e9;padding-bottom:6px;margin-bottom:6px;">
			<Checkbox
				v-model="checkAll"
				:indeterminate="indeterminate"
				@change="handleCheckAll"
			>
				全选
			</Checkbox>
		</div>
		<CheckboxGroup v-model="checkedFruits" @change="handleChange">
			<Checkbox
				v-for="fruit in fruits"
				:key="fruit"
				:label="fruit"
			/>
		</CheckboxGroup>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Checkbox, CheckboxGroup } from '@deot/vc';

const fruitsOptions = ['Apple', 'Bananer', 'mongo'];

const indeterminate = ref(true);
const checkAll = ref(false);
const fruits = ref(indeterminate);
const checkedFruits = ref(['Apple']);

const handleCheckAll = (val) => {
	checkedFruits.value = val ? fruitsOptions : [];
	indeterminate.value = false;
};

const handleChange = (data) => {
	const checkedCount = data.length;
	checkAll.value = checkedCount === fruits.value.length;
	indeterminate.value = checkedCount > 0 && checkedCount < fruits.value.length;
};
</script>

<script>

</script>
```
:::

## API

### 属性
| 属性              | 说明                                          | 类型                          | 可选值 | 默认值     |
| --------------- | ------------------------------------------- | --------------------------- | --- | ------- |
| modelValue      | 只在单独使用时有效。可以使用 v-model 双向绑定数据               | `boolean`                   | -   | `false` |
| value           | 只在组合使用时有效。指定当前选项的 value 值，组合会自动判断是否选中       | `string`、`number`、`boolean` | -   | -       |
| label           | 只在组合使用时有效。指定当前选项的 label 值，组合会自动判断是否选中       | `string`、`number`、`boolean` | -   | -       |
| disabled        | 是否禁用当前项                                     | `boolean`                   | -   | `false` |
| indeterminate   | 设置 `indeterminate` 状态，只负责样式控制               | `boolean`                   | -   | `false` |
| checked-value   | 选中时的值，当使用类似 1 和 0 来判断是否选中时会很有用，group模式下无效   | `string`、`number`、`boolean` | -   | `true`  |
| unchecked-value | 没有选中时的值，当使用类似 1 和 0 来判断是否选中时会很有用，group模式下无效 | `string`、`number`、`boolean` | -   | `false` |
| name            | 原生 `name` 属性                                | `string`                    | -   |         |

### 事件
事件名 | 说明 | 回调参数 | 参数说明
---|---|---|---
change | 只在单独使用时有效。在选项状态发生改变时触发，通过修改外部的数据改变时不会触发 | `(value: boolean) => void 0` | `value`：当前checkbox是否被选中


### Group 属性
属性 | 说明 | 类型 | 可选值 | 默认值
---|---|---|---|---
modelValue | 指定选中项目的集合，可以使用 v-model 双向绑定数据 | `Array` | - | - | []

### Group 事件
事件名 | 说明 | 回调参数 | 参数说明
---|---|---|---
change | 在选项状态发生改变时触发。通过修改外部的数据改变时不会触发 | `(value: Array) => void 0` | `value`：已选中的数组

### Group 属性 TODO
属性 | 说明 | 类型 | 可选值 | 默认值
---|---|---|---|---
min | 可被勾选的 checkbox 的最小数量 | `number` | - | -
max | 可被勾选的 checkbox 的最大数量 | `number` | - | -
disabled | 是否禁用 | `boolean` | - | `false`
