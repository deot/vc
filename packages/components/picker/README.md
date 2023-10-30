## 选择器（Picker）
移动端选择器

### 何时使用
需要从一组相关联的数据集合进行选择，例如省市区，公司层级，事物分类等。

### 基础用法
组件通过cascade属性判断picker是否为层级联动。

:::RUNTIME
```vue
<template>
	<div class="vcm-picker-basic">
		<vcm-picker
			:data-source="dataSource"
			:cascade="true"
			:cols="3"
			v-model="value"
			@change="handleChange"
			@ok="handleOk"
			@cancel="handleCancel"
		/>
		<vcm-picker
			:data-source="dataAsyncSource"
			:cascade="true"
			:cols="3"
			:load-data="loadData"
			v-model="valueAsync"
		>
			<template #default="it">
				<span class="_picker-customer">
					点击选择：{{ it.label }}
				</span>
			</template>
		</vcm-picker>
		<vcm-picker
			:data-source="dataSeasons"
			:cascade="false"
			:cols="2"
			v-model="valueSeasons"
			extra="非联动选择"
		/>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { cloneDeep } from 'lodash-es';
import { MToast, MPicker } from '@deot/vc';

const show = ref(false);
const dataSource = ref([{
	"value": "110000",
	"label": "北京市",
	"parent_id": "0",
	"children": [{
		"value": "110100",
		"label": "北京市辖区",
		"parent_id": "110000",
		"children": [{
			"value": "110101",
			"label": "东城区",
			"parent_id": "110100",
			"children": []
		}, {
			"value": "110102",
			"label": "西城区",
			"parent_id": "110100",
			"children": []
		}, {
			"value": "110116",
			"label": "其他",
			"parent_id": "110100",
			"children": []
		}]
	}, {
		"value": "110200",
		"label": "北京县区",
		"parent_id": "110000",
		"children": [{
			"value": "110228",
			"label": "密云县",
			"parent_id": "110200",
			"children": []
		}, {
			"value": "110229",
			"label": "延庆县",
			"parent_id": "110200",
			"children": []
		}]
	}]
}]);

const dataAsyncSource = ref([]);
const value = ref(["110000", "110100", "110101"]);
const valueAsync = ref(["110000", "110100", "110101"]);
const valueSeasons = ref([]);
const dataSeasons = ref([
	[
		{
			label: '2013',
			value: '2013',
		},
		{
			label: '2014',
			value: '2014',
		}
	],
	[
		{
			label: '春',
			value: '春',
		},
		{
			label: '夏',
			value: '夏',
		}
	]
]);

const loadData = () => {
	MToast.info('异步加载中');
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			dataAsyncSource.value = cloneDeep(dataSource.value);
			resolve();
		}, 3000);
	});
};

const handleChange = (value) => {
	console.log(value)
};

const handleOk = () => {
	// do something
};

const handleCancel = () => {
	// do something
};
</script>
<style>
.vcm-picker-basic .vcm-picker{
	display: flex;
	height: 44px;
	background: white;
	border-bottom: 1px solid #e7e7e7;
	justify-content: center;
	align-items: center;
}
.vcm-picker-basic .vcm-picker ._picker-customer {
	font-size: 20px;
	color: #000;
}
</style>
```
:::

### 方法调用
通过`open`方法打开弹层。

:::RUNTIME
```vue
<template>
	<div class="vcm-picker-basic">
		<Button @click="handleClick">方法调用</Button>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { cloneDeep } from 'lodash-es';
import { MToast, MPicker, Button } from '@deot/vc';

const dataSource = ref([{
	"value": "110000",
	"label": "北京市",
	"parent_id": "0",
	"children": [{
		"value": "110100",
		"label": "北京市辖区",
		"parent_id": "110000",
		"children": [{
			"value": "110101",
			"label": "东城区",
			"parent_id": "110100",
			"children": []
		}, {
			"value": "110102",
			"label": "西城区",
			"parent_id": "110100",
			"children": []
		}, {
			"value": "110116",
			"label": "其他",
			"parent_id": "110100",
			"children": []
		}]
	}, {
		"value": "110200",
		"label": "北京县区",
		"parent_id": "110000",
		"children": [{
			"value": "110228",
			"label": "密云县",
			"parent_id": "110200",
			"children": []
		}, {
			"value": "110229",
			"label": "延庆县",
			"parent_id": "110200",
			"children": []
		}]
	}]
}]);
const handleClick = () => {
	MPicker.open({
		dataSource: dataSource.value,
		value: ["110000", "110100", "110101"],
		cols: 3,
		onOk: (value, label) => {
			MToast.info(label.join(','));
		},
		onCancel: () => {
			MToast.info('value');
		}
	});
};
</script>
```
:::

### picker-popup
仅为picker的弹层组件，不提供选择的用途，`visible`为ture默认开启。

:::RUNTIME
```vue
<template>
	<div>
		<Button @click="handleClick">弹出</Button>
		<MPickerPopup
			:visible="visible"
			title="标题"
			cancelText="取消"
			okText="确定"
			@cancel="handleCancel"
			@close="handleClose"
		>
			<div style="height: 100px; line-height: 100px;">
				内容内容内容内容内容内容内容内容内容内容内容内容内容内容内容内容内容内容内容
			</div>
		</MPickerPopup>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { MPickerPopup, Button } from '@deot/vc';

const visible = ref(false);
const handleClick = () => {
	visible.value = !visible.value
};

const handleClose = () => {
	visible.value = !visible.value
};

const handleCancel = () => {
	console.log('cancel')
};
</script>
```
:::

### picker-view
picker的选择组件，没有弹层。

:::RUNTIME
```vue
<template>
	<MPickerView
		v-model="formData.addr"
		:data-source="dataSource"
		:cascade="true"
		:cols="3"
		@change="handleChange"
		@picker-change="handlePickerChange"
	>
		<div>内容</div>
	</MPickerView>
</template>
<script setup>
import { ref } from 'vue'; 
import { cloneDeep } from 'lodash-es';
import { MToast, MPicker } from '@deot/vc';


const dataSource = ref([{
	"value": "110000",
	"label": "北京市",
	"parent_id": "0",
	"children": [{
		"value": "110100",
		"label": "北京市辖区",
		"parent_id": "110000",
		"children": [{
			"value": "110101",
			"label": "东城区",
			"parent_id": "110100",
			"children": []
		}, {
			"value": "110102",
			"label": "西城区",
			"parent_id": "110100",
			"children": []
		}, {
			"value": "110116",
			"label": "其他",
			"parent_id": "110100",
			"children": []
		}]
	}, {
		"value": "110200",
		"label": "北京县区",
		"parent_id": "110000",
		"children": [{
			"value": "110228",
			"label": "密云县",
			"parent_id": "110200",
			"children": []
		}, {
			"value": "110229",
			"label": "延庆县",
			"parent_id": "110200",
			"children": []
		}]
	}]
}]);

const formData = ref({
	addr: [],
});

const handleChange = () => {
	console.log(arguments)
};

const handlePickerChange = () => {
	console.log(arguments)
};
</script>
```
:::

## API

### Picker属性

| 属性          | 说明                       | 类型                         | 可选值 | 默认值    |
| ----------- | ------------------------ | -------------------------- | --- | ------ |
| modelValue  | 控制，可以使用v-model           | `boolean`                  | -   | `true` |
| loadData    | 异步加载数据函数，`() => Promise` | `Function`                 | -   | -      |
| value       | 返回值(v-model)             | `array`                    | -   | -      |
| dataSource  | 数据源                      | `array`                    | -   | -      |
| cols        | 列数                       | `Number`                   | -   | -      |
| itemStyle   | 列的样式                     | `object`                   | -   | -      |
| cascade     | 是否为联动选中                  | `boolean`                  | -   | `true` |
| label       | label 内容                 | `string`                   | -   | -      |
| labelWidth  | `item`内`label`的宽度        | `string`、`Number`          | -   | -      |
| extra       | 占位符placeholder           | `string`                   | -   | -      |
| formatter   | 格式化占位符                   | `(label: array) => string` | -   | -      |
| title       | 标题，支持v-html              | `string`                   | -   | -      |
| cancelText  | 取消文本                     | `string`                   | -   | 取消     |
| okText      | 确定文本                     | `string`                   | -   | 确定     |
| showToolbar | 是否显示toolbar              | `boolean`                  | -   | `true` |
| onOk        | 采用`open`方法时使用，点击确定回调     | `Function`                 | -   | -      |
| onCancel    | 采用`open`方法时使用，点击取消回调     | `Function`                 | -   | -      |


### PickerView属性

| 属性            | 说明                 | 类型        | 可选值 | 默认值    |
| ------------- | ------------------ | --------- | --- | ------ |
| modelValue    | 返回值(v-model)       | `array`   | -   | -      |
| dataSource    | 数据源                | `array`   | -   | -      |
| cols          | 列数                 | `Number`  | -   | 1      |
| itemStyle     | 列的样式               | `object`  | -   | -      |
| cascade       | 是否为联动选中            | `boolean` | -   | `true` |
| allowDispatch | 触发`vc-form-item`事件 | `boolean` | -   | `true` |


### DataSource数据结构
> 当传入多列数据时且`cascade`为`false`时，`columns`为一个多维数组。当`cascade`为`ture`时，`columns`为一个对象数组

| 键名       | 说明     | 类型       |
| -------- | ------ | -------- |
| value    | 每一项的值  | `string` |
| label    | 每一项的内容 | `string` |
| children | 子集对象数组 | `array`  |


### PickerPopup属性

| 属性          | 说明             | 类型        | 可选值 | 默认值    |
| ----------- | -------------- | --------- | --- | ------ |
| modelValue  | 控制，可以使用v-model | `boolean` | -   | `true` |
| title       | 标题，支持v-html    | `string`  | -   | -      |
| cancelText  | 取消文本           | `string`  | -   | 取消     |
| okText      | 确定文本           | `string`  | -   | 确定     |
| showToolbar | 是否显示toolbar    | `boolean` | -   | `true` |


### Picker事件

| 事件名            | 说明                                 | 回调参数                           | 参数说明                          |
| -------------- | ---------------------------------- | ------------------------------ | ----------------------------- |
| change         | 组件关闭时候触发出来的一个事件，返回值为当前选中的值以及每一列的数据 | -                              | -                             |
| picker-change  | 选择发生改变时触发出来的一个事件                   | `(row, index) => void 0`       | `row`：当前选中的数据；`index`：当前数据的索引 |
| ok             | 点击确定按钮触发的事件                        | -                              | -                             |
| cancel         | 点击取消按钮触发的事件                        | -                              | -                             |
| close          | 弹层关闭触发                             | -                              | -                             |
| visible-change | 显示状态改变                             | `(visible: boolean) => void 0` | `visible`：显示状态                |


### PickerPopup事件

| 事件名            | 说明          | 回调参数                           | 参数说明           |
| -------------- | ----------- | ------------------------------ | -------------- |
| ok             | 点击确定按钮触发的事件 | -                              | -              |
| cancel         | 点击取消按钮触发的事件 | -                              | -              |
| close          | 关闭弹窗时触发     | -                              | -              |
| visible-change | 显示状态改变      | `(visible: boolean) => void 0` | `visible`：显示状态 |


### PickerView事件

| 事件名           | 说明               | 回调参数                                | 参数说明 |
| ------------- | ---------------- | ----------------------------------- | ---- |
| change        | 选择发生改变时触发的事件     | `(values, labels, items) => void 0` | -    |
| picker-change | 选择发生改变时触发出来的一个事件 | `(row, index) => void 0`            | -    |


### Picker Slot

| 名称      | 说明     |
| ------- | ------ |
| default | 点击弹出区域 |


### PickerPopup Slot

| 名称      | 说明     |
| ------- | ------ |
| default | 弹出层的内容 |

