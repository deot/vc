<template>
	<div class="form-error-layout-example">
		<p>
			errorLayout：overlay（默认）绝对定位在表单项下方的留白里，不占位，较长的提示会盖住下一项；
			flow 放在文档流里，出错时表单项变高，提示可以换行。FormItem 可单独覆盖。点击“提交”查看错误信息
		</p>
		<div class="form-error-layout-example__controls">
			<Select
				v-for="item in CONTROLS"
				:key="item.key"
				v-model="controls[item.key]"
				:data="item.data"
				:label="item.label"
			/>
		</div>

		<Form
			ref="form"
			:model="model"
			:rules="rules"
			:label-width="96"
			:label-position="controls.labelPosition"
			:error-layout="controls.errorLayout"
			@submit.prevent
		>
			<FormItem prop="name" label="名称" required="请输入名称">
				<Input v-model="model.name" />
			</FormItem>
			<FormItem prop="code" label="编号" required>
				<Input v-model="model.code" />
			</FormItem>
			<FormItem prop="desc" label="说明" required="单独设置 overlay" error-layout="overlay">
				<Input v-model="model.desc" placeholder="errorLayout: overlay" />
			</FormItem>
			<FormItem label="分组" required>
				<FormItem prop="group.first" required="嵌套项必填">
					<Input v-model="model.group.first" placeholder="嵌套项" />
				</FormItem>
				<FormItem prop="group.second" required="嵌套项必填">
					<Input v-model="model.group.second" placeholder="嵌套项" />
				</FormItem>
			</FormItem>
			<FormItem>
				<Button type="primary" @click="handleSubmit">提交</Button>
				<Button style="margin-left: 8px;" @click="form.reset()">重置</Button>
			</FormItem>
		</Form>
	</div>
</template>
<script setup>
import { reactive, ref } from 'vue';
import { Select } from '../../select';
import { Input } from '../../input';
import { Button } from '../../button';
import { Form, FormItem } from '..';

const toData = values => values.map(value => ({ value, label: String(value) }));
const CONTROLS = [
	{ key: 'errorLayout', label: 'errorLayout', data: toData(['overlay', 'flow']) },
	{ key: 'labelPosition', label: 'labelPosition', data: toData(['right', 'left', 'top']) }
];
const controls = reactive(Object.fromEntries(CONTROLS.map(({ key, data }) => [key, data[0].value])));

const form = ref();
const model = reactive({ name: '', code: '', desc: '', group: { first: '', second: '' } });
const rules = {
	code: {
		required: true,
		message: '请输入编号：较长的提示文字，用来对比两种排版下换行后是否会盖住下一项的内容'
	}
};

const handleSubmit = () => {
	form.value.validate().catch(() => {});
};
</script>
<style scoped>
.form-error-layout-example {
	padding: 20px;
}

.form-error-layout-example__controls {
	display: flex;
	flex-wrap: wrap;
	gap: 12px;
	margin-bottom: 12px;
}

.form-error-layout-example__controls .vc-select {
	width: 240px;
}

.form-error-layout-example .vc-input {
	width: 260px;
}
</style>
