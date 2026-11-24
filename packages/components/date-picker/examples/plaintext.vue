<template>
	<div class="vc-date-picker-plaintext-demo">
		<Button @click="plaintext = !plaintext">
			plaintext: {{ plaintext }}
		</Button>

		<div v-for="item in ITEMS" :key="item.label" class="vc-date-picker-plaintext-demo__row">
			<span class="vc-date-picker-plaintext-demo__label">{{ item.label }}</span>
			<DatePicker
				v-model="values[item.label]"
				:type="item.type"
				:format="item.format"
				:multiple="item.multiple"
				:plaintext="plaintext"
				:extra="item.extra"
				style="width: 300px"
			/>
		</div>
	</div>
</template>
<script setup>
import { reactive, ref } from 'vue';
import { DatePicker } from '..';
import { Button } from '../../button';

const ITEMS = [
	{ label: 'date', type: 'date', value: '2024-03-15' },
	{ label: 'datetime', type: 'datetime', value: '2024-03-15 08:30:00' },
	{ label: 'month', type: 'month', value: '2024-03' },
	{ label: 'quarter', type: 'quarter', value: [new Date(2024, 0, 1), new Date(2024, 2, 31)] },
	{ label: 'daterange', type: 'daterange', value: ['2024-03-01', '2024-03-15'] },
	{ label: 'multiple', type: 'date', multiple: true, value: '2024-03-01,2024-03-08' },
	{ label: 'format', type: 'date', format: 'YYYY/MM/DD', value: '2024/03/15' },
	{ label: '空值 + extra', type: 'date', value: '', extra: '-' }
];

const plaintext = ref(true);
const values = reactive(Object.fromEntries(ITEMS.map(item => [item.label, item.value])));
</script>

<style lang="scss">
.vc-date-picker-plaintext-demo {
	margin: 40px;

	&__row {
		display: flex;
		margin: 16px 0;
		align-items: center;
		gap: 16px;
	}

	&__label {
		width: 120px;
		color: #999;
	}
}
</style>
