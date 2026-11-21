<template>
	<div class="v-calendar-example">
		<div class="v-calendar-example__tools">
			<Select v-model="kind" :data="kinds" style="width: 160px;" />
			<Checkbox v-model="lunar">
				农历
			</Checkbox>
			<Checkbox v-model="readonly">
				只读
			</Checkbox>
			<Button @click="handleToggleLocale">
				{{ locale.name === 'zh-CN' ? 'English' : '中文' }}
			</Button>
			<span>值：{{ value }}</span>
		</div>
		<Calendar
			:key="kind"
			v-model="value"
			v-model:mode="mode"
			:type="kind === 'daterange' ? 'daterange' : 'date'"
			:multiple="kind === 'multiple'"
			:lunar="lunar"
			:readonly="readonly"
			:disabled-date="disabledDate"
			@date-click="handleDateClick"
		>
			<template #content="{ value: day }">
				<div
					v-for="item in events[day]"
					:key="item"
					class="v-calendar-example__event"
				>
					{{ item }}
				</div>
			</template>
		</Calendar>
		<p>最近点击：{{ clicked }}；视图：{{ mode }}</p>
	</div>
</template>

<script setup>
import { onBeforeUnmount, ref } from 'vue';
import { enUS, zhCN } from '@deot/vc-locale';
import { Calendar } from '..';
import { Button } from '../../button';
import { Checkbox } from '../../checkbox';
import { Select } from '../../select';
import { VcInstance } from '../../vc';

const kinds = [
	{ label: '单选', value: 'date' },
	{ label: '区间', value: 'daterange' },
	{ label: '多选', value: 'multiple' }
];
const kind = ref('date');
const value = ref('');
const mode = ref('month');
const lunar = ref(true);
const readonly = ref(false);
const clicked = ref('');
const locale = ref(zhCN);

const today = new Date();
const toKey = (offset) => {
	const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
const events = {
	[toKey(0)]: ['事项 A', '事项 B'],
	[toKey(2)]: ['事项 C'],
	[toKey(5)]: ['事项 D', '事项 E', '事项 F']
};

// 周末不可选
const disabledDate = date => date.getDay() === 0 || date.getDay() === 6;

const handleDateClick = ({ value: v }) => {
	clicked.value = v;
};

const handleToggleLocale = () => {
	locale.value = locale.value.name === 'zh-CN' ? enUS : zhCN;
	VcInstance.configure({ locale: locale.value });
};

onBeforeUnmount(() => VcInstance.configure({ locale: zhCN }));
</script>

<style lang="scss">
.v-calendar-example {
	width: 100%;

	&__tools {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 12px;
		margin-bottom: 12px;
	}

	&__event {
		overflow: hidden;
		line-height: 20px;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
}
</style>
