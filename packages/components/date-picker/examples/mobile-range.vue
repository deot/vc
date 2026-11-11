<template>
	<div class="date-picker-mobile-range">
		<p>范围选择：滚轮上方的起止栏点哪一侧就编辑哪一侧；结束一侧早于开始值的项置灰，开始值改到结束值之后时结束值跟过去</p>
		<MList>
			<MDatePicker v-model="daterange" type="daterange" label="日期范围" title="选择日期范围" />
			<MDatePicker v-model="datetimerange" type="datetimerange" label="日期时间范围" title="选择日期时间范围" />
			<MDatePicker v-model="monthrange" type="monthrange" label="月份范围" title="选择月份范围" />
			<MDatePicker v-model="quarterrange" type="quarterrange" label="季度范围" title="选择季度范围" />
			<MDatePicker v-model="timerange" type="timerange" format="HH:mm" label="时间范围" title="选择时间范围" />
			<MDatePicker v-model="separated" type="daterange" separator=" 至 " label="自定义分隔符" title="选择日期范围" />
		</MList>
		<div class="date-picker-mobile-range__output">
			<code>{{ JSON.stringify({ daterange, datetimerange, monthrange, quarterrange, timerange, separated }, null, 2) }}</code>
		</div>

		<p>内嵌视图（每次滚动都提交）</p>
		<div class="date-picker-mobile-range__panel">
			<MDatePickerView v-model="viewValue" type="daterange" />
		</div>
		<div class="date-picker-mobile-range__output">
			<code>{{ JSON.stringify(viewValue) }}</code>
		</div>

		<MButton @click="handleOpen">
			MDatePicker.open（datetimerange）
		</MButton>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MList } from '../../list/index.m';
import { MButton } from '../../button/index.m';
import { MToast } from '../../toast/index.m';
import { MDatePicker, MDatePickerView } from '../index.m';

const daterange = ref(['2024-03-10', '2024-03-20']);
const datetimerange = ref([]);
const monthrange = ref(['2024-01', '2024-06']);
const quarterrange = ref(['2024-01-01', '2024-06-30']);
const timerange = ref(['09:00', '18:00']);
const separated = ref('2024-05-01 至 2024-05-07');
const viewValue = ref(['2024-03-10', '2024-03-20']);

const handleOpen = () => {
	MDatePicker.open({
		type: 'datetimerange',
		format: 'YYYY-MM-DD HH:mm',
		title: '直接调用',
		onOk: (value) => {
			MToast.info(value.join(' ~ '));
		}
	});
};
</script>

<style lang="scss">
.date-picker-mobile-range {
	display: grid;
	gap: 12px;
	padding: 16px 0;
	background: #f5f7fa;

	p {
		margin: 0 16px;
		font-size: 13px;
		color: #64758b;
	}

	&__panel {
		overflow: hidden;
		background: #fff;
	}

	&__output {
		margin: 0 16px;
		font-size: 12px;

		code {
			word-break: break-all;
			white-space: pre-wrap;
		}
	}

	.vcm-button {
		margin: 0 16px;
	}
}
</style>
