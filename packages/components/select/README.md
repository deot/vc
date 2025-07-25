## 选择器（Select）
下拉选择器

### 何时使用
- 弹出一个下拉菜单给用户选择操作，用于代替原生的选择器，或者需要一个更优雅的多选器时。
- 当选项少时（少于 5 项），建议直接将选项平铺，使用 `Radio` 是更好的选择。

### 基本用法
- 适用广泛的基础单选; 单选时，`value` 只接受字符串和数字类型，多选时，只接受数组类型，组件会自动根据 `Option` 的 `value` 来返回选中的数据。
- 可以给 `Select` 添加 `style` 样式，比如宽度。

:::RUNTIME
```vue
<template>
	<div class="v-select-basic">
		<Select
			v-model="city"
			:data="cityList"
			style="width: 200px;"
			size="small"
		/>
		<span>{{ city }}</span>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Select } from '@deot/vc';

const city = ref('New York');
const cityList = ref([
	{
		value: '1',
		label: 'New York'
	},
	{
		value: '2',
		label: 'London'
	},
	{
		value: '3',
		label: 'Sydney'
	},
	{
		value: '4',
		label: 'Ottawa'
	},
	{
		value: '5',
		label: 'Paris'
	}
]);
```
:::

### 禁选状态和可清空单选
- 选择器不可用状态; 通过给`Select` 或 `Option` 添加 `disabled` 属性来设置全部禁选或单个禁选。
- 清空按钮，可将选择器清空为初始状态 `clearable`

:::RUNTIME
```vue
<template>
	<div class="v-select-basic">
		<div>全部禁用</div>
		<Select
			v-model="model1"
			:data="options"
			style="width: 200px;"
			disabled
			clearable
		/>
		<br/>
		<br/>
		<div>选项禁用</div>
		<Select
			v-model="model2"
			:data="options.map((i, index) => ({ ...i, disabled: index === 1 }))"
			style="width: 200px;"
			clearable
		/>
		<span>{{ model2 }}</span>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Select } from '@deot/vc';

const model1 = ref('');
const model2 = ref('黄金糕');
const options = ref([
	{
		value: '选项1',
		label: '黄金糕'
	},
	{
		value: '选项2',
		label: '双皮奶'
	},
	{
		value: '选项3',
		label: '蚵仔煎'
	},
	{
		value: '选项4',
		label: '龙须面'
	},
	{
		value: '选项5',
		label: '北京烤鸭'
	}
]);
</script>
```
:::

### 多选
适用性较广的基础多选, 使用 `max` 属性。

:::RUNTIME
```vue
<template>
	<div class="v-select-basic">
		<div>{{ model1 }}</div>
		<Select
			v-model="model1"
			:data="cityList"
			:max="2"
			clearable
			style="width: 200px;"
		/>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Select } from '@deot/vc';

const model1 = ref([]);
const cityList = ref([
	{
		value: 'New York',
		label: 'New York'
	},
	{
		value: 'London',
		label: 'London'
	},
	{
		value: 'Sydney',
		label: 'Sydney'
	},
	{
		value: 'Ottawa',
		label: 'Ottawa'
	},
	{
		value: 'Paris',
		label: 'Paris'
	},
	{
		value: 'Canberra',
		label: 'Canberra'
	}
]);
</script>
```
:::

### 分组
使用`children`可将选项进行分组。

:::RUNTIME
```vue
<template>
	<div class="v-select-group">
		<Select
			v-model="value1"
			:data="[{ value: 'Hot Cities', children: cityList1 }, { value: 'Other Citie', children: cityList2 }]"
			style="width: 200px"
			arrow
		/>
		<span>{{ value1 }}</span>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Select } from '@deot/vc';

const value1 = ref('');
const cityList1 = ref([
	{
		value: '1',
		label: 'New York'
	},
	{
		value: '2',
		label: 'London'
	},
	{
		value: '3',
		label: 'Sydney'
	}
]);
const cityList2 = ref([
	{
		value: '4',
		label: 'Ottawa'
	},
	{
		value: '5',
		label: 'Paris'
	},
	{
		value: '6',
		label: 'Canberra'
	}
]);
</script>
```
:::

### 可搜索
可以利用搜索功能快速查找选项

:::RUNTIME
```vue
<template>
	<div class="v-select-group">
		<Select
			v-model="value1"
			:data="options"
			style="width: 200px"
			searchable
			searchPlaceholder="请输入搜索内容"
		/>
		<span>{{ value1 }}</span>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Select } from '@deot/vc';

const value1 = ref([]);
const options = ref([
	{
		value: '选项1',
		label: '黄金糕'
	},
	{
		value: '选项2',
		label: '双皮奶'
	},
	{
		value: '选项3',
		label: '蚵仔煎'
	},
	{
		value: '选项4',
		label: '龙须面'
	},
	{
		value: '选项5',
		label: '北京烤鸭'
	}
]);
</script>
```
:::

## API

### Select props

| 属性                | 说明                                                                         | 类型                        | 可选值                                                                                                                                       | 默认值           |
| ----------------- | -------------------------------------------------------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| modelValue        | 指定选中项目的 value 值，可以使用 v-model 双向绑定数据。单选时只接受 string 或 number，多选时只接受 array    | `string`、`number`、`array` | -                                                                                                                                         | -             |
| data              | 数据源                                                                        | `array`                   | -                                                                                                                                         | `[]`          |
| max               | 是否支持多选，输入可支持多选的最大数量                                                        | `number`                  | -                                                                                                                                         | 1             |
| maxTags           | 最多显示多少个 tag                                                                | `number`                  | -                                                                                                                                         | 1             |
| disabled          | 是否禁用，设置在Select上全部禁选，在Option上单个禁选                                           | `boolean`                 | -                                                                                                                                         | `false`       |
| clearable         | 是否可以清空选项                                                                   | `boolean`                 | -                                                                                                                                         | `false`       |
| searchable        | 是否支持搜索                                                                     | `boolean`                 | -                                                                                                                                         | `false`       |
| searchPlaceholder | 搜索的占位符                                                                     | `string`                  | -                                                                                                                                         | -             |
| load-data         | 远程搜索的方法                                                                    | `Function`                | -                                                                                                                                         | -             |
| label             | 仅在 remote 模式下，初始化时使用。因为仅通过 value 无法得知选项的 label，需手动设置。                      | `string`、`number`、`array` | -                                                                                                                                         | -             |
| placeholder       | 选择框默认文字                                                                    | `string`                  | -                                                                                                                                         | 请选择           |
| not-found         | 当下拉列表为空时显示的内容                                                              | `string`                  | -                                                                                                                                         | 无匹配数据         |
| placement         | 弹窗的展开方向                                                                    | `string`                  | `bottom`、`bottom-left`、`bottom-right`、`top`、 `top-left`、`top-right`、`right`、`right-top`、 `right-bottom` 、`left`、 `left-top` `left-bottom` | `bottom-left` |
| portal            | 是否将弹层放置于 body 内，在 Tabs、带有 fixed 的 Table 列内使用时，建议添加此属性，它将不受父级样式影响，从而达到更好的效果 | `boolean`                 | -                                                                                                                                         | `true`        |
| element-id        | 给表单元素设置 `id`，详见 Form 用法。                                                   | `string`                  | -                                                                                                                                         | -             |
| portalClass       | 外层类名                                                                       | `object`、`string`、`array` | -                                                                                                                                         | -             |
| disabled          | 是否禁用                                                                       | `boolean`                 | -                                                                                                                                         | `false`       |
| trigger           | 触发的行为                                                                      | `string`                  | `hover`、`click`、`focus`                                                                                                                   | `click`       |
| tag               | 外层标签                                                                       | `string`                  | -                                                                                                                                         | `div`         |
| placement         | 弹层的位置                                                                      | `string`                  | `top`、`left`、`right`、`bottom`、`bottom-left`、`bottom-right`、`top-left`、`top-right`、`right-top`、`right-bottom`、`left-top`、`left-bottom`     | `bottom-left` |
| arrow             | 弹层有无箭头                                                                     | `boolean`                 | -                                                                                                                                         | `false`       |
| autoWidth         | 弹层宽度自适应                                                                    | `boolean`                 | -                                                                                                                                         | `true`        |
| extra             | -                                                                          | `string`、`array`          | -                                                                                                                                         | -             |
| separator         | -                                                                          | `string`、`array`          | -                                                                                                                                         | -             |
| numerable         | -                                                                          | `string`、`array`          | -                                                                                                                                         | -             |
| nullValue         | -                                                                          | `string`、`array`          | -                                                                                                                                         | -             |


### data props

| 属性         | 说明                                                                                                                              | 类型                | 可选值 | 默认值     |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------- | --- | ------- |
| value      | 选项值，默认根据此属性值进行筛选，必填                                                                                                             | `string` `number` | -   | -       |
| label      | 选项显示的内容，默认会读取 slot，无 slot 时，优先读取该 label 值，无 label 时，读取 value。当选中时，选择器会显示 label 为已选文案。大部分情况不需要配置此项，直接写入 slot 即可，在自定义选项时，该属性非常有用。 | `string`          | -   | -       |
| disabled   | 是否禁用当前项                                                                                                                         | `boolean`         | -   | `false` |
| children   | 分组数据                                                                                                                            | `array`           | -   | `[]`    |
| filterable | 是否需要被过滤                                                                                                                         | `boolean`         | -   | `true`  |

### Select events

| 事件名            | 说明                          | 回调参数                                                       | 参数说明                                                         |
| -------------- | --------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------ |
| change         | 选中的`Option`变化时触发，默认返回 value | `(value: string \ array, label: string \ array) => void 0` | `value`：当前选中的值value,如果是多选类型为数组；`label`：当前选中的值的label，多选时类型为数组 |
| clear          | 点击清空按钮时触发                   | -                                                          | -                                                            |
| visible-change | visible改变时回调                | `(visible: boolean) => void 0`                             | `visible`：当前弹层显示状态                                           |
| close          | 关闭时回调                       | -                                                          | -                                                            |
| ready          | 弹层出来时回调                     | -                                                          | -                                                            |


### Select methods

| 方法名    | 说明    | 参数                                        |
| ------ | ----- | ----------------------------------------- |
| add    | 添加单选项 | `value`：添加的选项的value值；`label`：添加的选项的label值 |
| remove | 删除单选项 | `value`：删除的选项的value值                      |
