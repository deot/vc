<template>
	<div class="m-form-demo">
		<div class="m-form-demo__options">
			<MRadioGroup v-model="labelPosition">
				<MRadio value="right">右对齐</MRadio>
				<MRadio value="left">左对齐</MRadio>
				<MRadio value="top">顶部</MRadio>
			</MRadioGroup>
			<label class="m-form-demo__switch">外边框 <MSwitch v-model="hasBorder" /></label>
			<label class="m-form-demo__switch">错误不占位 <MSwitch v-model="errorLayout" checked-value="overlay" unchecked-value="flow" /></label>
			<label class="m-form-demo__switch">标签自适应 <MSwitch v-model="labelWidth" checked-value="auto" :unchecked-value="192" /></label>
		</div>

		<h3>基础用法（375 宽下行高 54，标签宽 96）</h3>
		<MForm
			ref="basicForm"
			:model="basic"
			:rules="basicRules"
			:label-position="labelPosition"
			:label-width="labelWidth"
			:border="hasBorder"
			:error-layout="errorLayout"
			@submit.prevent
		>
			<MFormItem prop="name" label="名称" required="请输入名称">
				<MInput v-model="basic.name" placeholder="请输入名称" clearable />
			</MFormItem>
			<MFormItem prop="code" label="编号">
				<MInput v-model="basic.code" placeholder="失焦时校验：4 位数字" />
			</MFormItem>
			<MFormItem prop="kind" label="类型" required="请选择类型">
				<MRadioGroup v-model="basic.kind">
					<MRadio value="a">类型 A</MRadio>
					<MRadio value="b">类型 B</MRadio>
					<MRadio value="c">类型 C</MRadio>
				</MRadioGroup>
			</MFormItem>
			<MFormItem prop="options" label="选项" required="请至少选择一项">
				<MCheckboxGroup v-model="basic.options">
					<MCheckbox value="a">选项 A</MCheckbox>
					<MCheckbox value="b">选项 B</MCheckbox>
					<MCheckbox value="c">选项 C</MCheckbox>
				</MCheckboxGroup>
			</MFormItem>
			<MFormItem prop="enabled" label="启用">
				<MSwitch v-model="basic.enabled" />
			</MFormItem>
			<MFormItem prop="note" label="说明文字较长的标签" required="请输入说明">
				<MTextarea v-model="basic.note" placeholder="请输入说明" />
			</MFormItem>
		</MForm>
		<div class="m-form-demo__actions">
			<MButton type="primary" @click="handleValidate(basicForm)">提交</MButton>
			<MButton @click="basicForm.reset()">重置</MButton>
		</div>

		<h3>嵌套与组合</h3>
		<MForm
			ref="nestedForm"
			:model="nested"
			:rules="nestedRules"
			:label-position="labelPosition"
			:label-width="labelWidth"
			:border="hasBorder"
			:error-layout="errorLayout"
			@submit.prevent
		>
			<MFormItem label="嵌套" required>
				<MFormItem prop="first" required="第一项必填">
					<MInput v-model="nested.first" placeholder="第一项" />
				</MFormItem>
				<MFormItem prop="second" required="第二项必填">
					<MInput v-model="nested.second" placeholder="第二项" />
				</MFormItem>
			</MFormItem>
			<MFormItem label="区间" required prop="range">
				<div class="m-form-demo__range">
					<MFormItem styleless>
						<MInput v-model="nested.start" placeholder="起始" />
					</MFormItem>
					<span>~</span>
					<MFormItem styleless>
						<MInput v-model="nested.end" placeholder="结束" />
					</MFormItem>
				</div>
			</MFormItem>
			<MFormItem prop="array" label="数组" required="数组必填" label-position="top">
				<FakeArray v-model="nested.array" />
			</MFormItem>
			<MFormItem prop="custom" label="错误插槽" required="错误插槽必填">
				<MInput v-model="nested.custom" placeholder="错误插槽" />
				<template #error="{ message }">
					<span>提示：{{ message }}</span>
				</template>
			</MFormItem>
		</MForm>
		<div class="m-form-demo__actions">
			<MButton type="primary" @click="handleValidate(nestedForm)">提交</MButton>
			<MButton @click="nestedForm.reset()">重置</MButton>
		</div>

		<h3>动态字段</h3>
		<MForm
			ref="dynamicForm"
			:model="dynamic"
			:label-position="labelPosition"
			:label-width="labelWidth"
			:border="hasBorder"
			:error-layout="errorLayout"
			@submit.prevent
		>
			<MFormItem
				v-for="(item, index) in dynamic.items"
				:key="item.id"
				:label="`字段 ${item.index}`"
				:prop="`items.${index}.value`"
				:rules="{ required: true, message: `字段 ${item.index} 必填`, trigger: 'change' }"
			>
				<div class="m-form-demo__row">
					<MInput v-model="item.value" :placeholder="`items.${index}.value`" />
					<span class="m-form-demo__link" @click="handleRemove(index)">删除</span>
				</div>
			</MFormItem>
		</MForm>
		<div class="m-form-demo__actions">
			<MButton type="primary" @click="handleValidate(dynamicForm)">提交</MButton>
			<MButton @click="handleAdd">添加</MButton>
			<MButton @click="handleShuffle">乱序</MButton>
			<MButton @click="handleValidateFirst">只校验第一项</MButton>
		</div>
	</div>
</template>
<script setup>
import { ref, reactive } from 'vue';
import { getUid } from '@deot/helper-utils';
import { shuffle } from 'lodash-es';
import { MForm, MFormItem } from '../index.m';
import { MButton } from '../../button/index.m';
import { MInput } from '../../input/index.m';
import { MTextarea } from '../../textarea/index.m';
import { MRadio, MRadioGroup } from '../../radio/index.m';
import { MCheckbox, MCheckboxGroup } from '../../checkbox/index.m';
import { MSwitch } from '../../switch/index.m';
import { MToast } from '../../toast/index.m';
import FakeArray from './fake/array.vue';

const labelPosition = ref('right');
const hasBorder = ref(false);
const errorLayout = ref('flow');
const labelWidth = ref(192);

const basicForm = ref();
const basic = reactive({
	name: '',
	code: '',
	kind: '',
	options: [],
	enabled: false,
	note: ''
});
const basicRules = {
	code: {
		trigger: 'blur',
		validate: (value) => {
			if (value && !/^\d{4}$/.test(value)) return '编号为 4 位数字';
		}
	}
};

const nestedForm = ref();
const nested = reactive({
	first: '',
	second: '',
	start: '',
	end: '',
	array: [],
	custom: ''
});
const nestedRules = {
	range: {
		validate() {
			if (!nested.start || !nested.end) return '起始和结束都必填';
		}
	}
};

let index = 0;
const createItem = () => ({ id: getUid(), value: '', index: index++ });
const dynamicForm = ref();
const dynamic = reactive({
	items: [createItem(), createItem()]
});

const handleValidate = async (form) => {
	try {
		await form.validate();
		MToast.info('校验通过');
	} catch (e) {
		console.log(e);
	}
};

const handleAdd = () => {
	dynamic.items.push(createItem());
};

const handleRemove = (i) => {
	dynamic.items.splice(i, 1);
};

const handleShuffle = () => {
	dynamic.items = shuffle(dynamic.items);
};

const handleValidateFirst = () => {
	dynamic.items.length && dynamicForm.value.validateField('items.0.value', { scroll: true }).catch(() => {});
};
</script>

<style scoped>
.m-form-demo h3 {
	margin: 16px 16px 8px;
	font-size: 14px;
	font-weight: 400;
	color: #86909c;
}

.m-form-demo__options {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 12px;
	padding: 12px 16px;
}

.m-form-demo__switch {
	display: inline-flex;
	align-items: center;
	gap: 8px;
}

.m-form-demo__actions {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	padding: 12px 16px;
}

.m-form-demo__range,
.m-form-demo__row {
	display: flex;
	align-items: center;
	gap: 8px;
}

.m-form-demo__link {
	color: #f53f3f;
	white-space: nowrap;
}
</style>
