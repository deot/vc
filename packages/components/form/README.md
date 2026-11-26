## 表单（Form）

组织表单项、校验数据，并将字段恢复到初始值。

移动端入口导出的 `MForm`、`MFormItem` 复用相同的数据、校验和重置逻辑，尺寸按 750 稿随 `--vc-rem` 缩放，见 [移动端](#移动端)。

### 何时使用

- 收集信息，并在提交前校验一个或多个字段。
- 为动态字段、嵌套字段组织标签和错误提示。
- Form 只负责校验和重置；数据提交由调用方处理。原生表单需要通过 `@submit.prevent` 阻止页面跳转。

### 基础用法

将数据传给 `model`，在 FormItem 上用 `prop` 指定字段路径。只有挂载时设置了 `prop` 的表单项才会注册到表单，参与校验、清除和重置。`required` 可以直接传入错误文案，`rules` 设置本项规则。

`validate()` 成功时 resolve `undefined`，失败时 reject 错误数组；`validateField()` 失败时 reject 单个错误对象。需要使用 `await` 和 `try/catch` 处理结果。`clear()` 只清除错误状态和提示，不改变字段值；`reset()` 会同时恢复初始值。`clear()` 之前发起、尚未完成的校验仍会返回结果，但不会再显示错误。如果在同一时刻修改了字段值，控件触发的 change 校验会在之后执行，此时应在 `await nextTick()` 之后再调用 `clear()`。

:::playground
<!--
<config lang="json5">
{
	views: ['runtime', 'files'],
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="form-demo">
		<Form ref="formRef" :model="model" :label-width="80" @submit.prevent>
			<FormItem prop="name" label="名称" required="请输入名称">
				<Input v-model="model.name" placeholder="请输入名称" />
			</FormItem>
			<FormItem prop="email" label="邮箱" :rules="emailRules">
				<Input v-model="model.email" placeholder="name@example.com" />
			</FormItem>
			<FormItem>
				<div class="form-demo__row">
					<Button type="primary" @click="handleSubmit">校验全部</Button>
					<Button @click="handleValidateEmail">校验邮箱</Button>
					<Button @click="handleClear">清除提示</Button>
					<Button @click="handleReset">恢复初始值</Button>
				</div>
			</FormItem>
		</Form>
		<p class="form-demo__result" role="status">{{ result }}</p>
	</div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { Form, FormItem, Input, Button } from '@deot/vc';

const formRef = ref();
const model = reactive({ name: '示例名称', email: '' });
const result = ref('名称的初始值为“示例名称”。');
const emailRules = [
	{ required: true, message: '请输入邮箱' },
	{ pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: '请输入有效邮箱' }
];

const handleSubmit = async () => {
	try {
		await formRef.value.validate({ scroll: false });
		result.value = '全部校验通过，可提交数据。';
	} catch (errors) {
		result.value = errors.map(item => item.message).join('；');
	}
};

const handleValidateEmail = async () => {
	try {
		await formRef.value.validateField('email', { scroll: false });
		result.value = '邮箱校验通过。';
	} catch (error) {
		result.value = error.message;
	}
};

const handleClear = () => {
	formRef.value.clear();
	result.value = '已清除错误提示，字段值保持不变。';
};

const handleReset = () => {
	formRef.value.reset();
	result.value = '已恢复挂载时的初始值。';
};
</script>

<style scoped>
.form-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
	max-width: 560px;
}

.form-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}

.form-demo__result {
	margin: 0;
	overflow-wrap: anywhere;
}
</style>
```
:::

### 行内布局与标签对齐

`inline` 将表单项排列为行内块。`labelPosition` 支持 `left / right / top`；设为 `top` 后不再使用标签宽度。`labelWidth` 为数字时固定宽度；为 `'auto'` 时表单内的标签取其中最宽的（含必填标记），各项内容对齐；不设置时每个标签按自身内容排版。FormItem 可以单独覆盖 `labelPosition` 和 `labelWidth`，下例第三项固定为左对齐、宽 120。

:::playground
<!--
<config lang="json5">
{
	views: ['runtime', 'files'],
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="form-demo">
		<div class="form-demo__row">
			<RadioGroup v-model="position" type="capsule">
				<Radio value="left" label="左对齐" />
				<Radio value="right" label="右对齐" />
				<Radio value="top" label="顶部对齐" />
			</RadioGroup>
			<RadioGroup v-model="width" type="capsule">
				<Radio :value="72" label="72" />
				<Radio value="auto" label="auto" />
			</RadioGroup>
			<Checkbox v-model="isInline" label="行内布局" />
		</div>
		<Form
			:model="model"
			:label-position="position"
			:label-width="width"
			:inline="isInline"
			@submit.prevent
		>
			<FormItem label="名称" required>
				<Input v-model="model.name" />
			</FormItem>
			<FormItem label="分类说明">
				<Input v-model="model.category" />
			</FormItem>
			<FormItem label="单独覆盖" label-position="left" :label-width="120">
				<Input v-model="model.extra" />
			</FormItem>
		</Form>
	</div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { Form, FormItem, Input, Radio, RadioGroup, Checkbox } from '@deot/vc';

const position = ref('right');
const width = ref(72);
const isInline = ref(false);
const model = reactive({ name: '', category: '', extra: '' });
</script>

<style scoped>
.form-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
	max-width: 560px;
}

.form-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}
</style>
```
:::

### 动态字段与局部重置

字段路径支持 `profile.name`、`contacts.0.name` 等形式。动态列表使用稳定的 key，并根据当前数组下标设置 `prop`。`reset({ fields, original })` 只重置选中的已注册字段；指定值为 `null / undefined` 或不存在时恢复该字段挂载时的初始值。

:::playground
<!--
<config lang="json5">
{
	views: ['runtime', 'files'],
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="form-demo">
		<Form ref="formRef" :model="model" label-position="top" @submit.prevent>
			<FormItem
				v-for="(item, index) in model.items"
				:key="item.id"
				:prop="'items.' + index + '.name'"
				:label="'条目 ' + (index + 1)"
				required="请输入条目名称"
			>
				<div class="form-demo__field">
					<Input v-model="item.name" placeholder="条目名称" />
					<Button @click="handleRemove(index)">删除</Button>
				</div>
			</FormItem>
			<div class="form-demo__row">
				<Button @click="handleAdd">添加条目</Button>
				<Button type="primary" @click="handleSubmit">校验条目</Button>
				<Button :disabled="!model.items.length" @click="handleResetFirst">重置第一项</Button>
			</div>
		</Form>
		<p class="form-demo__result" role="status">{{ result }}</p>
	</div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { Form, FormItem, Input, Button } from '@deot/vc';

const formRef = ref();
let nextId = 1;
const model = reactive({ items: [{ id: nextId++, name: '' }] });
const result = ref('添加或删除字段后再校验。');

const handleAdd = () => {
	model.items.push({ id: nextId++, name: '' });
};

const handleRemove = (index) => {
	model.items.splice(index, 1);
};

const handleSubmit = async () => {
	try {
		await formRef.value.validate({ scroll: false });
		result.value = '当前条目校验通过。';
	} catch (errors) {
		result.value = errors.map(item => item.prop + '：' + item.message).join('；');
	}
};

const handleResetFirst = () => {
	formRef.value.reset({
		fields: ['items.0.name'],
		original: { items: [{ name: '默认名称' }] }
	});
	result.value = '仅第一项已重置为“默认名称”。';
};
</script>

<style scoped>
.form-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
	max-width: 560px;
}

.form-demo__field {
	display: flex;
	align-items: center;
	gap: 8px;
}

.form-demo__field > :first-child {
	flex: 1;
	min-width: 0;
}

.form-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}

.form-demo__result {
	margin: 0;
	overflow-wrap: anywhere;
}
</style>
```
:::

### 自定义校验与错误插槽

错误信息的排版由 `errorLayout` 控制：`overlay`（Form 默认）绝对定位在表单项下方的留白里，不占位，提示较长时会盖住下一项；`flow`（MForm 默认）放在文档流里，出错时表单项变高，提示可以换行。FormItem 可单独覆盖。嵌套项的提示在桌面端排在控件右侧，两种排版相同。错误元素带 `is-overlay / is-flow` 类名，自定义错误插槽传入的 class 也包含它。

规则中的 `validate(value, context)` 可以返回错误字符串、`false`，或返回一个失败时 reject 的 Promise。返回 `undefined / true` 表示同步通过；Promise resolve 表示异步通过。Form 的 `rules` 按字段路径配置规则，`#error` 插槽自定义错误区。

:::playground
<!--
<config lang="json5">
{
	views: ['runtime', 'files'],
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="form-demo">
		<div class="form-demo__row">
			<RadioGroup v-model="layout" type="capsule">
				<Radio value="overlay" label="overlay" />
				<Radio value="flow" label="flow" />
			</RadioGroup>
		</div>
		<Form
			ref="formRef"
			:model="model"
			:rules="rules"
			:error-layout="layout"
			label-position="top"
			@submit.prevent
		>
			<FormItem prop="password" label="密码">
				<Input v-model="model.password" type="password" placeholder="至少 6 个字符" />
			</FormItem>
			<FormItem prop="confirm" label="确认密码">
				<Input v-model="model.confirm" type="password" placeholder="再次输入密码" />
				<template #error="{ show, message, class: errorClass, style }">
					<div v-if="show" :class="errorClass" :style="style">请检查：{{ message }}</div>
				</template>
			</FormItem>
			<Button type="primary" @click="handleSubmit">校验密码</Button>
		</Form>
		<p class="form-demo__result" role="status">{{ result }}</p>
	</div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { Form, FormItem, Input, Button, Radio, RadioGroup } from '@deot/vc';

const formRef = ref();
const layout = ref('overlay');
const model = reactive({ password: '', confirm: '' });
const result = ref('确认密码使用异步校验。');
const rules = {
	password: {
		validate: value => value.length >= 6 || '密码至少需要 6 个字符，较长的提示在 flow 下会换行而不是盖住下一项'
	},
	confirm: {
		validate: async (value) => {
			await new Promise((resolve) => {
				setTimeout(resolve, 200);
			});
			if (!value || value !== model.password) throw new Error('两次密码需要一致');
		}
	}
};

const handleSubmit = async () => {
	try {
		await formRef.value.validate({ scroll: false });
		result.value = '密码校验通过。';
	} catch {
		result.value = '请根据字段提示修改。';
	}
};
</script>

<style scoped>
.form-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
	max-width: 480px;
}

.form-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}

.form-demo__result {
	margin: 0;
}
</style>
```
:::

### 表单项的控制

FormItem 的 `error` 设置外部错误文案（如接口返回），设为 `''` 时清除；`asterisk` 为 `false` 时隐藏必填标记但仍校验；`showMessage` 为 `false` 时不显示本项错误；`#label` 插槽自定义标签，`labelFor` 设置标签的关联目标。`rules` 引用改变时，`resetByRulesChanged` 会重置字段。`getField(prop)` 返回已注册字段的内部实例，字段方法 `validate`、`reset`、`clear`、`getPosition` 位于其 `exposed` 上。

:::playground
<!--
<config lang="json5">
{
	views: ['runtime', 'files'],
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="form-demo">
		<Form ref="formRef" :model="model" :label-width="96" @submit.prevent>
			<FormItem prop="account" label="账号" :error="serverError">
				<Input v-model="model.account" placeholder="提交后模拟外部错误" />
			</FormItem>
			<FormItem prop="code" label="编号" required="请输入编号" :asterisk="false">
				<Input v-model="model.code" placeholder="不显示星号，仍必填" />
			</FormItem>
			<FormItem
				prop="note"
				required="请输入备注"
				label-for="form-demo-note"
				:show-message="false"
			>
				<template #label>
					<span class="form-demo__label">备注 *</span>
				</template>
				<Input v-model="model.note" input-id="form-demo-note" placeholder="出错时只有红框" />
			</FormItem>
			<FormItem prop="amount" label="数量" :rules="amountRules" reset-by-rules-changed>
				<Input v-model="model.amount" :placeholder="isStrict ? '必须大于 10' : '必须大于 0'" />
			</FormItem>
			<FormItem>
				<div class="form-demo__row">
					<Button type="primary" @click="handleSubmit">提交</Button>
					<Button @click="handleClearError">清除外部错误</Button>
					<Button @click="handleToggleRules">切换数量规则</Button>
					<Button @click="handleFieldValidate">getField 校验编号</Button>
				</div>
			</FormItem>
		</Form>
		<p class="form-demo__result" role="status">{{ result }}</p>
	</div>
</template>

<script setup>
import { computed, nextTick, reactive, ref } from 'vue';
import { Form, FormItem, Input, Button } from '@deot/vc';

const formRef = ref();
const model = reactive({ account: '', code: '', note: '', amount: '5' });
const serverError = ref('');
const isStrict = ref(false);
const result = ref('等待操作');
const amountRules = computed(() => ({
	validate: value => Number(value) > (isStrict.value ? 10 : 0) || '数量超出范围'
}));

const handleSubmit = async () => {
	try {
		await formRef.value.validate({ scroll: false });
		serverError.value = '';
		await nextTick();
		serverError.value = '该账号已存在（外部错误）';
		result.value = '本地校验通过，外部返回错误。';
	} catch (errors) {
		result.value = errors.map(item => item.prop + '：' + item.message).join('；');
	}
};

const handleClearError = () => {
	serverError.value = '';
};

const handleToggleRules = () => {
	isStrict.value = !isStrict.value;
	result.value = `数量规则已切换为大于 ${isStrict.value ? 10 : 0}，字段已重置`;
};

const handleFieldValidate = async () => {
	const field = formRef.value.getField('code');
	try {
		await field.exposed.validate('');
		const { top } = await field.exposed.getPosition();
		result.value = `编号通过，位置 top：${Math.round(top)}`;
	} catch (error) {
		result.value = `编号：${error.message}`;
	}
};
</script>

<style scoped>
.form-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
	max-width: 560px;
}

.form-demo__label {
	color: var(--vc-color-primary);
}

.form-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}

.form-demo__result {
	margin: 0;
	overflow-wrap: anywhere;
}
</style>
```
:::

### 嵌套表单项与样式注入

在 FormItem 内再放带 `prop` 的 FormItem 即形成嵌套项，嵌套项的标签默认宽度为 0，错误提示排在控件右侧。Form 上的 `labelStyle / labelClass`、`contentStyle / contentClass`、`errorStyle / errorClass` 注入所有表单项，`nestedLabelStyle`、`nestedContentStyle`、`nestedErrorStyle` 等只额外注入嵌套项；FormItem 自身的同名属性最后合并。

:::playground
<!--
<config lang="json5">
{
	views: ['runtime', 'files'],
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="form-demo">
		<Form
			ref="formRef"
			:model="model"
			:label-width="96"
			:label-style="{ fontWeight: 600 }"
			error-class="form-demo__error"
			:nested-content-style="{ flex: 1 }"
			nested-error-class="form-demo__nested-error"
			@submit.prevent
		>
			<FormItem label="区间" required content-class="form-demo__range">
				<FormItem prop="start" required="请输入起始值">
					<Input v-model="model.start" placeholder="起始" />
				</FormItem>
				<FormItem prop="end" required="请输入结束值">
					<Input v-model="model.end" placeholder="结束" />
				</FormItem>
			</FormItem>
			<FormItem prop="name" label="名称" required="请输入名称" :label-style="{ color: 'var(--vc-color-primary)' }">
				<Input v-model="model.name" />
			</FormItem>
			<FormItem>
				<Button type="primary" @click="handleSubmit">校验</Button>
			</FormItem>
		</Form>
	</div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { Form, FormItem, Input, Button } from '@deot/vc';

const formRef = ref();
const model = reactive({ start: '', end: '', name: '' });

const handleSubmit = async () => {
	try {
		await formRef.value.validate({ scroll: false });
	} catch {
		// 错误已显示在各项下方
	}
};
</script>

<style scoped>
.form-demo {
	max-width: 560px;
}

.form-demo :deep(.form-demo__range) {
	display: flex;
	gap: 8px;
}

.form-demo :deep(.form-demo__error) {
	font-style: italic;
}

.form-demo :deep(.form-demo__nested-error) {
	color: var(--vc-color-warning);
}
</style>
```
:::

### 无样式模式

`styleless` 让所有表单项只渲染 `default` 与 `error` 插槽，不渲染标签和默认错误节点，布局完全由调用方决定，校验和重置照常；FormItem 也可单独设置 `styleless`。`tag` 设置根元素标签，`autocomplete` 设置根元素的 autocomplete 属性。

:::playground
<!--
<config lang="json5">
{
	views: ['runtime', 'files'],
	previewInset: 16
}
</config>
-->
```vue
<template>
	<Form
		ref="formRef"
		class="form-demo"
		:model="model"
		tag="div"
		autocomplete="on"
		styleless
	>
		<FormItem prop="keyword" required="请输入关键词">
			<Input v-model="model.keyword" placeholder="关键词" />
			<template #error="{ show, message }">
				<span v-if="show" class="form-demo__error">{{ message }}</span>
			</template>
		</FormItem>
		<Button type="primary" @click="handleSubmit">查询</Button>
	</Form>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { Form, FormItem, Input, Button } from '@deot/vc';

const formRef = ref();
const model = reactive({ keyword: '' });

const handleSubmit = async () => {
	try {
		await formRef.value.validate({ scroll: false });
	} catch {
		// 错误由 error 插槽显示
	}
};
</script>

<style scoped>
.form-demo {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
	max-width: 560px;
}

.form-demo__error {
	color: var(--vc-color-error);
}
</style>
```
:::

## 移动端

`MForm`、`MFormItem` 复用相同的数据、校验和重置逻辑，根节点为 `.vcm-form`、`.vcm-form-item`。移动端的数字长度（`labelWidth`、`indent`）按 750 稿解释，`750` 即屏幕宽度，见 `--vc-rem`；`labelWidth: 'auto'` 量取的宽度不受影响。`showToast` 与 `showMessage` 同时为 `true` 时，手动校验失败会弹出第一条错误；`indent` 控制非嵌套项的左侧缩进；`border` 显示表单的上下边框；`errorLayout` 默认为 `flow`。底栏切换 `rem` 可查看不同屏宽下的效果。

:::playground
<!--
<config lang="json5">
{
	mobile: true,
	local: false,
	previewInset: [12, 0],
	previewVariables: [{
		name: '--rem',
		label: 'rem',
		values: ['auto', '0.5px', '0.552px', '0.64px', '1px']
	}]
}
</config>
-->
```vue
<template>
	<div class="m-form-demo">
		<div class="m-form-demo__options">
			<MRadioGroup v-model="labelPosition" type="capsule">
				<MRadio value="right" label="右对齐" />
				<MRadio value="left" label="左对齐" />
				<MRadio value="top" label="顶部" />
			</MRadioGroup>
			<MCheckbox v-model="hasBorder" label="上下边框" />
			<MCheckbox v-model="isToast" label="Toast 提示" />
		</div>
		<MForm
			ref="formRef"
			:model="model"
			:label-position="labelPosition"
			:border="hasBorder"
			:show-toast="isToast"
			@submit.prevent
		>
			<MFormItem prop="name" label="名称" required="请输入名称">
				<MInput v-model="model.name" placeholder="请输入名称" clearable />
			</MFormItem>
			<MFormItem prop="kind" label="类型" required="请选择类型">
				<MRadioGroup v-model="model.kind">
					<MRadio value="a" label="类型 A" />
					<MRadio value="b" label="类型 B" />
				</MRadioGroup>
			</MFormItem>
			<MFormItem prop="enabled" label="启用">
				<MSwitch v-model="model.enabled" />
			</MFormItem>
			<MFormItem prop="note" label="说明文字较长的标签" required="请输入说明" :indent="64">
				<MTextarea v-model="model.note" placeholder="indent 为 64" />
			</MFormItem>
		</MForm>
		<div class="m-form-demo__actions">
			<MButton type="primary" @click="handleSubmit">提交</MButton>
			<MButton @click="handleReset">重置</MButton>
		</div>
		<p class="m-form-demo__result" role="status">{{ result }}</p>
	</div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import {
	MForm,
	MFormItem,
	MInput,
	MTextarea,
	MRadio,
	MRadioGroup,
	MSwitch,
	MCheckbox,
	MButton
} from '@deot/vc';

const formRef = ref();
const labelPosition = ref('right');
const hasBorder = ref(true);
const isToast = ref(false);
const model = reactive({ name: '', kind: '', enabled: false, note: '' });
const result = ref('点击提交校验');

const handleSubmit = async () => {
	try {
		await formRef.value.validate({ scroll: false });
		result.value = '校验通过。';
	} catch (errors) {
		result.value = `${errors.length} 项未通过`;
	}
};

const handleReset = () => {
	formRef.value.reset();
	result.value = '已重置。';
};
</script>

<style scoped>
.m-form-demo {
	display: flex;
	flex-direction: column;
	gap: calc(var(--vc-rem) * 32);
	background: var(--vc-background-color-light);
}

.m-form-demo__options,
.m-form-demo__actions {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: calc(var(--vc-rem) * 16);
	padding-inline: calc(var(--vc-rem) * 32);
}

.m-form-demo__result {
	margin: 0;
	padding-inline: calc(var(--vc-rem) * 32);
	font-size: calc(var(--vc-rem) * 28);
}
</style>
```
:::

长度按 750 稿书写并随 `--vc-rem` 缩放；括号内为 375 宽下的 px。

| 部位 | 值 |
| --- | --- |
| 表单项高度 | 108（54）= 上下内边距 32（16）+ 内容行高 44（22） |
| 左缩进（`indent` 默认）/ 右内边距 | 32（16） |
| 标签宽度（`labelWidth` 默认） | 192（96），含与内容之间的间距 32（16） |
| 标签 / 内容字号 | 32（16） |
| 顶部标签 | 文字距上方与距控件均为 32（16），换行时行距 44（22） |
| 错误信息 | 字号 24（12）；flow 距内容 22（11）；overlay 紧贴内容，距分隔线 8（4） |
| 嵌套项之间的间距 | 32（16） |

- 必填星号悬挂在标签文字左侧，不占宽度，各种对齐方式下都贴着文字。
- 错误信息默认在文档流里（`errorLayout: 'flow'`）：出错时该项变高，较长的提示换行也不会盖住下一项。设为 `'overlay'` 时不占位，提示放在表单项的下内边距 32（16）里，只容得下一行。
- 表单内的 MInput、MTextarea 不带左右内边距，文字与标签、其他控件对齐；单独使用时不受影响。
- 未设置 label 的表单项同样按 `labelWidth` 缩进内容，让控件与上下各项对齐；不需要时传 `:label-width="0"`。

## 主题与局部覆盖

全局参数通过 `--vc-<参数>` 配置，组件级覆盖使用 `--vc-form-<参数>`。局部参数仅提供组件级入口；可在组件根节点或其祖先上设置。

### 全局

| 参数 | 使用位置 | 值 |
| --- | --- | --- |
| color-dark | 移动端表单和标签文字 | 亮色：`#000000`；暗色：`#FFFFFF` |
| color-dark-light | 桌面端标签文字 | 亮色：`#080F20`；暗色：`#E8E8E8` |
| color-error | 必填标记及错误提示 | `#F53F3F` |
| color-neutral-light | 移动端表单边框及表单项分隔线 | 亮色：`#EDEFF1`；暗色：`#3B4354` |
| background-color-lightest | 表单背景 | 亮色：`#FFFFFF`；暗色：`#252B3A` |
| foreground-color | 桌面端表单文字 | 亮色：`#080F20`；暗色：`#F8F8F8` |

### 局部

当前组件没有额外的局部 CSS 主题参数。

## API

### Form 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| tag | 根元素标签 | `string` | - | `'form'` |
| model | 表单数据；校验和重置通过字段路径访问该对象 | `object` | - | - |
| rules | 按字段路径配置规则；字段值运行时支持单条规则或规则数组，也支持嵌套对象 | `Record<string, FormRule>` | - | - |
| inline | 行内布局 | `boolean` | - | `false` |
| labelPosition | 标签位置 | `string` | `left / right / top` | `'right'` |
| errorLayout | 错误信息的排版：`flow` 在文档流里，出错时表单项变高；`overlay` 绝对定位在表单项下方的留白里，不占位 | `string` | `flow / overlay` | `'overlay'` |
| labelWidth | 标签宽度，单位 px；`'auto'` 时参与的标签取其中最宽的。标签在上方、`inline`、嵌套项和自身设置了 labelWidth 的项不参与 | `number \| 'auto'` | - | - |
| showMessage | 显示错误信息；也控制移动端校验 Toast | `boolean` | - | `true` |
| autocomplete | 根元素 autocomplete 属性 | `string` | `on / off` | `'off'` |
| styleless | 所有表单项只渲染 default/error 插槽，Form 根元素仍保留 | `boolean` | - | `false` |
| contentStyle / contentClass | 注入所有表单项内容区的样式 / 类名 | `object \| string` | - | - |
| labelStyle / labelClass | 注入所有表单项标签区的样式 / 类名 | `object \| string` | - | - |
| errorStyle / errorClass | 注入所有表单项错误区的样式 / 类名 | `object \| string` | - | - |
| nestedContentStyle / nestedContentClass | 额外注入嵌套表单项内容区 | `object \| string` | - | - |
| nestedLabelStyle / nestedLabelClass | 额外注入嵌套表单项标签区 | `object \| string` | - | - |
| nestedErrorStyle / nestedErrorClass | 额外注入嵌套表单项错误区 | `object \| string` | - | - |

### Form 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 表单项和操作区 | - |

### Form 方法

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| validate | 校验已注册字段，失败时 reject `{ prop, message }[]`，按页面位置排序 | `{ fields?: string[], excludeFields?: string[], scroll?: boolean }`；默认全部字段、`scroll: true` | `Promise<void>` |
| validateField | 校验单个字段，失败时 reject `{ prop, message }` | `prop: string, options?: { scroll?: boolean }` | `Promise<void>` |
| reset | 清除校验状态，并恢复初始值或指定值；不增删动态列表项 | `{ fields?: string[], excludeFields?: string[], original?: object }` | `void` |
| clear | 清除校验状态和错误提示，不改变字段值 | `{ fields?: string[], excludeFields?: string[] }` | `void` |
| getField | 查找已注册字段；不存在时抛出错误 | `prop: string` | `ComponentInternalInstance` |

`fields / excludeFields` 按 prop 完全匹配：先按 `fields` 选择字段（不传则为全部），再排除 `excludeFields` 中的字段。没有字段或筛选结果为空时校验直接通过。`getField()` 返回 Vue 内部实例，字段方法位于其 `exposed` 上，普通调用建议直接使用表单方法。Form 没有自定义事件；原生 `submit` 事件可通过 `@submit.prevent` 处理。

### FormItem 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| prop | 对应 model 的字段路径 | `string` | - | - |
| label | 标签。字符串按文本渲染，也可传渲染函数或 `{ type, value }`，见 [Customer](../customer/README.md)；label 插槽优先 | `string \| number \| Function \| { type: string; value: any }` | - | `''` |
| labelWidth | 覆盖标签宽度，设置后不参与 Form 的 `'auto'`；嵌套项的标签默认宽度为 0 | `number` | - | 继承 Form |
| labelPosition | 覆盖标签位置 | `string` | `left / right / top` | 继承 Form |
| errorLayout | 覆盖错误信息的排版 | `string` | `flow / overlay` | 继承 Form |
| labelFor | 标签关联目标；当前桌面端将 for 放在标签外层 div，不能依赖它实现原生聚焦；移动端放在 label 上 | `string` | - | - |
| required | 标记必填；没有匹配规则时生成必填规则，字符串同时作为错误文案 | `boolean \| string` | - | `false` |
| asterisk | 是否显示必填标记；不影响校验 | `boolean` | - | `true` |
| rules | 本项规则，非空时优先于 Form.rules | `FormRule \| FormRule[]` | - | - |
| resetByRulesChanged | 本项 rules 引用改变时重置字段 | `boolean` | - | `false` |
| error | 外部错误文案；变化时更新错误状态，设为 `''` 清除；初始值不会立即触发该监听 | `string` | - | - |
| showMessage | 与 Form.showMessage 同时为 true 才显示错误；false 同时移除桌面端项的默认下间距 | `boolean` | - | `true` |
| styleless | 只渲染 default/error 插槽，不渲染标签和默认错误节点 | `boolean` | - | `false` |
| contentStyle / contentClass | 内容区样式 / 类名 | `object \| string` | - | - |
| labelStyle / labelClass | 标签区样式 / 类名 | `object \| string` | - | - |
| errorStyle / errorClass | 错误区样式 / 类名 | `object \| string` | - | - |

样式依次合并 Form、本项对应的 nested 配置、FormItem；类名同时保留。嵌套项通过嵌套 FormItem 创建，字段路径嵌套本身不会创建嵌套布局。

### FormItem 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 表单控件或嵌套表单项 | - |
| label | 自定义标签，优先于 label 属性 | - |
| error | 自定义错误区；styleless 模式下也由此插槽负责错误展示 | 普通模式：`{ show, nest, message, class, style }`；styleless：`{ show, nested, message, class, style }` |

`show` 为是否应显示错误，`nest / nested` 为是否嵌套。自定义错误插槽需要自行处理 `show`，并按需绑定传入的 class/style。

### FormItem 方法

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| validate | 按 trigger 筛选规则并校验，失败时 reject `{ prop, message }` | `trigger: string` | `Promise<void>` |
| reset | 清除状态；非 null/undefined 的参数替代初始值 | `value?: any` | `void` |
| clear | 清除校验状态和错误提示，不改变值 | - | `void` |
| getPosition | 获取表单项位置 | - | `Promise<{ top: number, left: number }>` |

### MForm 属性、插槽和方法

继承 Form 的属性、default 插槽和五个方法；以下为额外属性及移动端默认值不同的属性：

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| showToast | 手动校验失败时弹出第一条错误，需同时启用 showMessage | `boolean` | - | `false` |
| labelWidth | 标签宽度，750 稿长度；`'auto'` 时参与的标签取其中最宽的 | `number \| 'auto'` | - | `192` |
| errorLayout | 错误信息的排版；移动端屏幕窄、提示容易换行，默认放在文档流里 | `string` | `flow / overlay` | `'flow'` |
| border | 显示表单的上下边框 | `boolean` | - | `false` |

### MFormItem 属性、插槽和方法

继承 FormItem 属性和四个方法，额外属性如下：

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| indent | 非嵌套项的左侧缩进，750 稿长度；嵌套项为 0 | `number` | - | 样式默认 `32` |

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 表单控件或嵌套表单项 | - |
| label | 自定义标签，优先于 label 属性 | - |
| error | 普通模式只在错误可见时调用；styleless 模式需自行控制显示 | 普通模式：`{ message }`；styleless：`{ show, nested, message, class, style }` |

### 校验规则与行为边界

`FormRule` 从 `@deot/vc` 导出，基于 `@deot/helper-validator` 的 `ValidatorRule`，额外支持 `trigger?: string | string[]`。

- 支持 `required`、`pattern`、`enum`、`transform`、`validate`、`fields` 和 `message`。不要将其他校验库的 `min / max / type` 当作直接生效的规则；长度、类型检查可用 `validate` 实现。
- 错误文案来自规则 `message`、required 字符串或自定义校验结果；未提供时可以为空。Form 不提供默认翻译文案。
- 自动 blur/change 校验依赖控件与 FormItem 的联动。原生输入框不会自动触发，应手动调用表单方法。
- 规则过滤实际使用 `!rule.trigger || rule.trigger.includes(trigger)`。表单手动校验传入空字符串：字符串 trigger 会匹配；数组 trigger 只有包含 `''` 才会匹配。需要兼顾手动校验时，可省略 trigger、使用单个字符串，或显式包含 `''`。
- 非空的 FormItem.rules 优先；否则查找 Form.rules。数组路径中的中间数字下标会被移除后查找规则，例如 `contacts.0.name` 查找 `contacts.name`；查找抛错时才尝试完整 prop 键。
- 布尔 required 主要控制必填标记和无匹配规则时的兜底，不会额外插入已有规则列表。需要保证必填时请在规则中明确写入 `required: true` 和 message。
- `reset()` 恢复挂载时保存的字段初始值，并非一律清空，也不替换整个 model。
- `labelWidth: 'auto'` 监听每个标签内容的尺寸：标签文字、插槽内容、字体或字号变化，以及表单项增删后，宽度随之更新，在绘制前完成。标签不换行。

### 主题

桌面端和移动端使用 `form` 主题命名空间。可覆盖 `--vc-form-background-color-lightest`、`--vc-form-color-error`；桌面端另使用 `--vc-form-foreground-color`、`--vc-form-color-dark-light`，移动端使用 `--vc-form-color-dark`、`--vc-form-color-neutral-light`。未覆盖时跟随共享亮暗主题。
