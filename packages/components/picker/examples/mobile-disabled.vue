<template>
	<div class="picker-mobile-disabled">
		<p>禁用项置灰：停在禁用项上会回弹到最近的可选项，点击禁用项不响应，鼠标滚轮跳过</p>
		<div class="picker-mobile-disabled__panel">
			<PickerView v-model="value" :data="data" :cascader="false" />
		</div>
		<div class="picker-mobile-disabled__value">
			当前值：{{ JSON.stringify(value) }}（初始值为禁用项 B，落到最近的可选项）
		</div>

		<p>联动数据：各级都可禁用，上级切换后下级落到第一个可选项</p>
		<div class="picker-mobile-disabled__panel">
			<PickerView v-model="cascaderValue" :data="cascaderData" :columns="2" />
		</div>
		<div class="picker-mobile-disabled__value">
			当前值：{{ JSON.stringify(cascaderValue) }}
		</div>

		<MList>
			<MPicker
				v-model="pickerValue"
				:data="data"
				label="弹层中的禁用项"
			/>
		</MList>
		<div class="picker-mobile-disabled__value">
			当前值：{{ JSON.stringify(pickerValue) }}
		</div>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MList } from '../../list/index.m';
import { MPicker } from '../index.m';
import { PickerView } from '..';

const data = [
	{ value: 'a', label: '选项 A' },
	{ value: 'b', label: '选项 B（禁用）', disabled: true },
	{ value: 'c', label: '选项 C' },
	{ value: 'd', label: '选项 D（禁用）', disabled: true },
	{ value: 'e', label: '选项 E（禁用）', disabled: true },
	{ value: 'f', label: '选项 F' },
	{ value: 'g', label: '选项 G' }
];

const cascaderData = [
	{
		value: 'group-a',
		label: '分组 A',
		children: [
			{ value: 'a1', label: '条目 A-1（禁用）', disabled: true },
			{ value: 'a2', label: '条目 A-2' },
			{ value: 'a3', label: '条目 A-3' }
		]
	},
	{ value: 'group-b', label: '分组 B（禁用）', disabled: true, children: [{ value: 'b1', label: '条目 B-1' }] },
	{
		value: 'group-c',
		label: '分组 C',
		children: [
			{ value: 'c1', label: '条目 C-1' },
			{ value: 'c2', label: '条目 C-2（禁用）', disabled: true }
		]
	}
];

const value = ref(['b']);
const cascaderValue = ref(['group-a']);
const pickerValue = ref(['c']);
</script>

<style lang="scss">
.picker-mobile-disabled {
	display: grid;
	gap: 12px;
	padding: 16px;
	background: #f5f7fa;

	p {
		margin: 0;
		font-size: 13px;
		color: #64758b;
	}

	&__panel {
		overflow: hidden;
		background: #fff;
		border-radius: 8px;
	}

	&__value {
		font-size: 13px;
		color: #515151;
	}
}
</style>
