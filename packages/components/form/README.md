
## 表单（Form）
由输入框、选择器、单选框、多选框等控件组成，用以收集、校验、提交数据

### 何时使用
- 用于创建一个实体或收集信息。
- 需要对输入的数据类型进行校验时。
- 注意：当一个 form 元素中只有一个输入框时，在该输入框中按下回车应提交该表单。如果希望阻止这一默认行为，可以在 `<Form>` 标签上添加 `@submit.prevent`。

### 典型表单
包括各种表单项，比如输入框、选择器、开关、单选框、多选框等。
在 Form 组件中，每一个表单域由一个 Form-Item 组件构成，表单域中可以放置各种类型的表单控件，包括 Input、Select、Checkbox、Radio、Switch、DatePicker、TimePicker。

:::RUNTIME
```vue
<template>
	<Form
		ref="form"
		:model="formData"
		:label-width="96"
		style="padding-left: 56px; margin-top: 21px"
		@submit.prevent
	>
		<FormItem label="input：">
			<Input v-model="formData.input" style="width: 300px" />
		</FormItem>
		<FormItem label="select：">
			<Select v-model="formData.select" style="width: 300px;" clearable>
				<Option
					v-for="(item, index) in cityList"
					:value="item.label"
					:key="index"
				>{{ item.label }}</Option>
			</Select>
		</FormItem>
		<FormItem label="switch：">
			<Switch v-model="formData.switch"/>
		</FormItem>
		<FormItem label="date：">
			<DatePicker
				v-model="formData.date"
				type="datetime"
				clearable
				placeholder="Select date"
				style="width: 300px"
			/>
		</FormItem>
		<FormItem label="checkbox：">
			<CheckboxGroup v-model="formData.checkbox">
				<Checkbox label="香蕉" />
				<Checkbox label="苹果" />
				<Checkbox label="西瓜" />
			</CheckboxGroup>
		</FormItem>
		<FormItem label="radio：">
			<RadioGroup v-model="formData.radio" vertical>
				<Radio label="金斑蝶" />
				<Radio label="爪哇犀牛" />
				<Radio label="印度黑羚" />
			</RadioGroup>
		</FormItem>
		<FormItem label="radio：">
			<RadioGroup v-model="formData.radio">
				<Radio label="金斑蝶" />
				<Radio label="爪哇犀牛" />
				<Radio label="印度黑羚" />
			</RadioGroup>
		</FormItem>
		<FormItem
			v-for="(item, index) in formData.items"
			:key="index"
			:label="'Item ' + item.index + '：'"
			:prop="'items.' + index + '.value'"
			:rules="{required: true, message: 'Item ' + item.index +' can not be empty', trigger: 'change'}"
		>
			<span @click="handleRemove(index)">Delete</span>
		</FormItem>
		<FormItem>
			<div @click="handleAdd">
				Add item
			</div>
		</FormItem>
		<FormItem>
			<Button type="primary" @click="handleSubmit">
				Submit
			</Button>
			<Button style="margin-left: 8px" @click="handleReset">
				Reset
			</Button>
			<Button style="margin-left: 8px" @click="handleOnly">
				Only
			</Button>
		</FormItem>
	</Form>
</template>
<script setup>
import { ref, reactive } from 'vue';
import { Form, Input, Button, Checkbox, Radio, Select, Option, DatePicker, Switch } from '@deot/vc';

const index = ref(1);
const formData = reactive({
	input: '',
	select: '',
	switch: '',
	date: '',
	checkbox: [],
	radio: '',
	items: [{
		value: '',
		index: 1,
		status: 1
	}]
});
const cityList = ref([{
	value: '1',
	label: 'New York'
}, {
	value: '2',
	label: 'London'
}]);
const form = ref();
const handleSubmit = async () => {
	try {
		await form.value.validate();
	} catch (e) {
		console.log(e);
	}
};

const handleReset = (name) => {
	form.value.reset();
};

const handleAdd = () => {
	index.value++;
	formData.items.push({
		value: '',
		index: index.value,
		status: 1
	});
};

const handleOnly = async (name) => {
	try {
		await form.value.validateField('items.0.value', { scroll: true });
	} catch (e) {
		console.log(e);
	}
};

const handleRemove = (index) => {
	formData.value.items[index].status = 0;
};
</script>
<style>
.v-form-basic {
	margin-bottom: 10px;
}
</style>
```
:::

### 行内表单
当垂直方向空间受限且表单较简单时，可以在一行内放置表单。
设置 `inline` 属性可以让表单域变为行内的表单域。

:::RUNTIME
```vue
<template>
	<Form
		ref="formData"
		:label-width="50"
		inline
		style="padding-left: 56px; margin-top: 21px"
		@submit.prevent
	>
		<FormItem label="input：">
			<Input v-model="formData.input" />
		</FormItem>
		<FormItem label="select：">
			<Select v-model="formData.select" clearable>
				<Option
					v-for="(item, index) in cityList"
					:value="item.label"
					:key="index"
				>{{ item.label }}</Option>
			</Select>
		</FormItem>
		<FormItem>
			<Button type="primary" @click="handleSubmit">
				Submit
			</Button>
		</FormItem>
	</Form>
</template>
<script setup>
import { ref, reactive } from 'vue';
import { Form, FormItem, Input, Button, Select, Option } from '@deot/vc';

const formData = reactive({
	input: '',
	select: '',
});

const cityList = ref([{
	value: '1',
	label: 'New York'
}, {
	value: '2',
	label: 'London'
}]);

const handleSubmit = (name) => {
	console.log(res, this.formData);
};
</script>
<style>
.v-form-basic {
	margin-bottom: 10px;
}
</style>
```
:::

### 对齐方式
根据具体目标和制约因素，选择最佳的标签对齐方式。
通过设置 `label-position` 属性可以改变表单域标签的位置，可选值为 `top`、`left`，当设为 `top` 时标签会置于表单域的顶部。

:::RUNTIME
```vue
<template>
	<div>
		<RadioGroup v-model="labelPosition" type="button">
			<Radio label="left">左对齐</Radio>
			<Radio label="right">右对齐</Radio>
			<Radio label="top">顶部对齐</Radio>
		</RadioGroup>
		<Form
			ref="form"
			:label-width="50"
			:label-position="labelPosition"
			style="margin-top: 21px"
			@submit.prevent
		>
			<FormItem label="input：">
				<Input v-model="formData.input" style="width: 200px;" />
			</FormItem>
			<FormItem label="input：">
				<Input v-model="formData.input" style="width: 200px;" />
			</FormItem>
			<FormItem label="input：">
				<Input v-model="formData.input" style="width: 200px;" />
			</FormItem>
		</Form>
	</div>
</template>
<script setup>
import { ref, reactive } from 'vue';
import { Form, FormItem, Input, RadioGroup, Radio } from '@deot/vc';

const labelPosition = ref('right');
const formData = reactive({
	input: '',
});
const handleSubmit = (name) => {
	console.log(res, formData);
};
</script>
<style>
.v-form-basic {
	margin-bottom: 10px;
}
</style>
```
:::

### 表单校验
在防止用户犯错的前提下，尽可能让用户更早地发现并纠正错误。
Form 组件提供了表单验证的功能，只需要通过 `rules` 属性传入约定的验证规则，并将 Form-Item 的 `prop` 属性设置为需校验的字段名即可。

:::RUNTIME
```vue
<template>
	<Form
		ref="form"
		:model="formData"
		:rules="rules"
		:label-width="96"
		style="padding-left: 56px; margin-top: 21px"
		@submit.prevent
	>
		<FormItem prop="input" label="input：">
			<Input v-model="formData.input" style="width: 300px" />
		</FormItem>
		<FormItem prop="select" label="select：">
			<Select v-model="formData.select" style="width: 300px;" clearable>
				<Option
					v-for="(item, index) in cityList"
					:value="item.label"
					:key="index"
				>{{ item.label }}</Option>
			</Select>
		</FormItem>
		<FormItem prop="switch" label="switch：">
			<Switch v-model="formData.switch"/>
		</FormItem>
		<FormItem prop="date" label="date：">
			<DatePicker
				v-model="formData.date"
				type="datetime"
				clearable
				placeholder="Select date"
				style="width: 300px"
			/>
		</FormItem>
		<FormItem prop="checkbox" label="checkbox：">
			<CheckboxGroup v-model="formData.checkbox">
				<Checkbox label="香蕉" />
				<Checkbox label="苹果" />
				<Checkbox label="西瓜" />
			</CheckboxGroup>
		</FormItem>
		<FormItem prop="radio" label="radio：">
			<RadioGroup v-model="formData.radio" vertical>
				<Radio label="金斑蝶" />
				<Radio label="爪哇犀牛" />
				<Radio label="印度黑羚" />
			</RadioGroup>
		</FormItem>
		<FormItem prop="radio" label="radio：">
			<RadioGroup v-model="formData.radio">
				<Radio label="金斑蝶" />
				<Radio label="爪哇犀牛" />
				<Radio label="印度黑羚" />
			</RadioGroup>
		</FormItem>
		<FormItem
			v-for="(item, index) in formData.items"
			v-if="item.status"
			:key="index"
			:label="'Item ' + item.index + '：'"
			:prop="'items.' + index + '.value'"
			:rules="{required: true, message: 'Item ' + item.index +' can not be empty', trigger: 'change'}"
		>
			<span @click="handleRemove(index)">Delete</span>
		</FormItem>
		<FormItem>
			<div @click="handleAdd">
				Add item
			</div>
		</FormItem>
		<FormItem>
			<Button type="primary" @click="handleSubmit">
				Submit
			</Button>
			<Button style="margin-left: 8px" @click="handleReset">
				Reset
			</Button>
			<Button style="margin-left: 8px" @click="handleOnly">
				Only
			</Button>
		</FormItem>
	</Form>
</template>
<script setup>
import { ref, reactive } from 'vue';
import { Form, FormItem, Input, Button, Checkbox, Radio, Select, Option, DatePicker, Switch } from '@deot/vc';

const index = ref(1);
const formData = reactive({
	input: '',
	select: '',
	switch: '',
	date: '',
	checkbox: [],
	radio: '',
	items: [
		{
			value: '',
			index: 1,
			status: 1
		}
	]
});
const rules = reactive({
	input: [
		{ required: true, message: '请输入内容', trigger: 'blur' },
		{ min: 3, max: 5, message: '长度在 3 到 5 个字符', trigger: 'blur' }
	],
	select: [
		{ required: true, message: '请选择区域', trigger: 'change' }
	],
	date: [
		{ required: true, type: 'date', message: '请选择日期', trigger: 'change' }
	],
	checkbox: [
		{ type: 'array', required: true, message: '请至少选择一种水果', trigger: 'change' }
	],
	radio: [
		{ required: true, message: '请选择动物', trigger: 'change' }
	],
});

const cityList = ref([
	{
		value: '1',
		label: 'New York'
	},
	{
		value: '2',
		label: 'London'
	}
]);
const form = ref();
const handleSubmit = async () => {
	try {
		await form.value.valuevalidate();
	} catch (e) {
		console.log(e);
	}
};
const handleOnly = async () => {
	try {
		await form.value.validateField('items.0.value', { scroll: true });
	} catch (e) {
		console.log(e);
	}
};

const handleReset = () => {
	form.value.reset();
};

const handleAdd = () => {
	index.value++;
	formData.items.push({
		value: '',
		index: index.value,
		status: 1
	});
};

const handleRemove = (index) => {
	formData.items[index].status = 0;
};
</script>
<style>
.v-form-basic {
	margin-bottom: 10px;
}
</style>
```
:::

### 自定义校验规则
这个例子中展示了如何使用自定义验证规则来完成密码的二次验证。

:::RUNTIME
```vue
<template>
	<Form
		ref="formData"
		:model="formData"
		:rules="rules"
		:label-width="96"
		style="padding-left: 56px; margin-top: 21px"
		@submit.prevent
	>
		<FormItem prop="pass" label="密码：">
			<Input type="password" v-model="formData.pass" style="width: 300px" />
		</FormItem>
		<FormItem prop="checkPass" label="确认密码：">
			<Input type="password" v-model="formData.checkPass" style="width: 300px" />
		</FormItem>
		<FormItem prop="age" label="年龄：">
			<Input v-model.number="formData.age" style="width: 300px" />
		</FormItem>
		<FormItem>
			<Button type="primary" @click="handleSubmit('formData')">
				Submit
			</Button>
			<Button style="margin-left: 8px" @click="handleReset('formData')">
				Reset
			</Button>
		</FormItem>
	</Form>
</template>
<script setup>
import { Form, FormItem, Input, Button } from '@deot/vc';

const formData = reactive({
	pass: '',
	checkPass: '',
	age: ''
});

const checkAge = (value) => {
	if (!value) {
		return '年龄不能为空';
	}
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			if (!Number.isInteger(value)) {
				reject('请输入数字值');
			} else {
				if (value < 18) {
					reject('必须年满18岁');
				} else {
					resolve();
				}
			}
		}, 1000);
	});
};
const validatePass = (value) => {
	if (!value) {
		return '请输入密码';
	} else {
		if (!formData.checkPass) {
			form.value.validateField('checkPass');
		}
	}
};
const validatePass2 = (value) => {
	if (!value) {
		return '请再次输入密码';
	} else if (value !== formData.pass) {
		return '两次输入密码不一致!';
	}
};

const rules = reactive({
	pass: [
		{ validate: validatePass, trigger: 'blur' }
	],
	checkPass: [
		{ validate: validatePass2, trigger: 'blur' }
	],
	age: [
		{ validate: checkAge, trigger: 'blur' }
	]
});
const handleSubmit = async (name) => {
	try {
		form.value.validate(() => {});
	} catch (e) {
		console.log(e, formData);
	}
};

const handleReset = (name) => {
	form.value.reset();
};
</script>
<style>
.v-form-basic {
	margin-bottom: 10px;
}
</style>
```
:::

## API

### 属性
属性 | 说明 | 类型 | 可选值 | 默认值
---|---|---|---|---
model | 表单数据对象 | `Object` | - | -
rules | 表单验证规则，具体配置查看 [validator](https://github.com/deot/helper) | `Object` | - | -
inline | 是否开启行内表单模式 | `Boolean` | - | `false`
label-position | 表单域标签的位置 | `String` | `left`、 `right`、 `top` | `right`
label-width | 表单域标签的宽度，所有的 FormItem 都会继承 Form 组件的 label-width 的值 | `Number` | - | -
show-message | 是否显示校验错误信息 | `Boolean` | - | `true`
autocomplete | 原生的 autocomplete 属性 | `String` | `off`、 `on` | `off`

### 方法
方法名 | 说明 | 参数
---|---|---
validate | 对整个表单进行校验，参数为检验完的回调，会返回一个 `Boolean` 表示成功与失败，支持 Promise | -
validateField | 对部分表单字段进行校验的方法 | `props`: 需校验的 prop; `callback`: 检验完回调，返回错误信息
reset | 对整个表单进行重置，将所有字段值重置为空并移除校验结果 | -

### Item 属性
属性 | 说明 | 类型 | 可选值 | 默认值
---|---|---|---|---
prop | 对应表单域 model 里的字段 | `String` | - | - 
label | 标签文本 | `String` | - | - 
label-width | 表单域标签的的宽度 | `Number` | - 
label-for | 指定原生的 label 标签的 for 属性，配合控件的 `element-id` 属性，可以点击 label 时聚焦控件。 | `String` | - | - 
required | 是否必填，如不设置，则会根据校验规则自动生成 | `Boolean` | - | - 
rules | 表单验证规则 | `Object`  |  `Array` | - | - 
error | 表单域验证错误信息, 设置该值会使表单验证状态变为error，并显示该错误信息 | `String` | - | - 
show-message | 是否显示校验错误信息 | `Boolean` | - | `true` 

### Item Slot
属性 | 说明
---|---
label | label 内容


