<template>
	<div class="form-label-width-example">
		<p>
			labelWidth：数字时固定宽度；auto 时表单内的标签取其中最宽的（含必填标记），各项内容对齐；按内容时每个标签按自身宽度排版。
			标签在上方、inline、嵌套项、自身设置了 labelWidth 的项不参与 auto。切换“标签长度”可看到宽度随最长的标签更新
		</p>
		<div class="form-label-width-example__controls">
			<Select
				v-for="item in CONTROLS"
				:key="item.key"
				v-model="controls[item.key]"
				:data="item.data"
				:label="item.label"
			/>
		</div>

		<Form
			:model="model"
			:label-width="controls.labelWidth || undefined"
			:label-position="controls.labelPosition"
			:inline="controls.inline"
			@submit.prevent
		>
			<FormItem prop="name" label="名称" required>
				<Input v-model="model.name" />
			</FormItem>
			<FormItem prop="type" :label="controls.long ? '类型（较长的标签文字）' : '类型'">
				<Input v-model="model.type" />
			</FormItem>
			<FormItem prop="desc" label="说明" :label-width="60">
				<Input v-model="model.desc" placeholder="labelWidth 60，不参与 auto" />
			</FormItem>
			<FormItem label="分组说明">
				<FormItem prop="group.value1" label="分组1">
					<Input v-model="model.group.value1" placeholder="嵌套项，不参与 auto" />
				</FormItem>
			</FormItem>
			<FormItem>
				<Button>提交</Button>
			</FormItem>
		</Form>
	</div>
</template>
<script setup>
import { reactive } from 'vue';
import { Select } from '../../select';
import { Input } from '../../input';
import { Button } from '../../button';
import { Form, FormItem } from '..';

const toData = values => values.map(value => ({ value, label: String(value) }));
const CONTROLS = [
	{
		key: 'labelWidth',
		label: 'labelWidth',
		data: [{ value: 'auto', label: 'auto' }, { value: 0, label: '按内容' }, { value: 96, label: '96' }]
	},
	{ key: 'labelPosition', label: 'labelPosition', data: toData(['right', 'left', 'top']) },
	{ key: 'inline', label: 'inline', data: [{ value: false, label: 'false' }, { value: true, label: 'true' }] },
	{ key: 'long', label: '标签长度', data: [{ value: false, label: '短' }, { value: true, label: '长' }] }
];
const controls = reactive(Object.fromEntries(CONTROLS.map(({ key, data }) => [key, data[0].value])));

const model = reactive({ name: '', type: '', desc: '', group: { value1: '' } });
</script>
<style scoped>
.form-label-width-example {
	padding: 20px;
}

.form-label-width-example__controls {
	display: flex;
	flex-wrap: wrap;
	gap: 12px;
	margin-bottom: 12px;
}

.form-label-width-example__controls .vc-select {
	width: 240px;
}

.form-label-width-example .vc-input {
	width: 260px;
}
</style>
