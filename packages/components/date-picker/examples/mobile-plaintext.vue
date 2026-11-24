<template>
	<div class="vcm-date-picker-plaintext-demo">
		<h3>编辑</h3>
		<MList>
			<MDatePicker v-model="date" type="date" label="日期" />
			<MDatePicker v-model="datetime" type="datetime" label="日期时间" />
			<MDatePicker v-model="range" type="daterange" label="范围" />
			<MDatePicker v-model="empty" type="date" label="空值" />
		</MList>

		<h3>详情（plaintext）</h3>
		<MList>
			<MListItem :arrow="false" label="日期">
				<template #extra>
					<MDatePicker v-model="date" type="date" plaintext />
				</template>
			</MListItem>
			<MListItem :arrow="false" label="日期时间">
				<template #extra>
					<MDatePicker v-model="datetime" type="datetime" plaintext />
				</template>
			</MListItem>
			<MListItem :arrow="false" label="范围">
				<template #extra>
					<MDatePicker v-model="range" type="daterange" plaintext />
				</template>
			</MListItem>
			<MListItem :arrow="false" label="空值 + extra">
				<template #extra>
					<MDatePicker v-model="empty" type="date" plaintext extra="-" />
				</template>
			</MListItem>
		</MList>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MList, MListItem } from '../../list/index.m';
import { MDatePicker } from '../index.m';

const date = ref('2024-03-15');
const datetime = ref('2024-03-15 08:30:00');
const range = ref(['2024-03-01', '2024-03-15']);
const empty = ref('');
</script>

<style lang="scss">
.vcm-date-picker-plaintext-demo {
	h3 {
		padding: 16px 16px 8px;
		font-size: 14px;
		color: #999;
	}
}
</style>
