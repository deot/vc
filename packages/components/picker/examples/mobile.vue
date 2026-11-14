<template>
	<div class="vcm-picker-example">
		<MList>
			<Picker
				v-model="value"
				:data="groupData"
				:columns="3"
				label="所在分组"
				@change="handleChange"
			/>
		</MList>
		<div class="vcm-picker-example__value">
			当前值：{{ formatValue(value) }}
		</div>

		<MList>
			<Picker
				v-model="stringValue"
				:data="groupData"
				:columns="3"
				label="字符串值"
			/>
		</MList>
		<div class="vcm-picker-example__value">
			当前值：{{ formatValue(stringValue) }}
		</div>

		<MList>
			<Picker
				v-model="stringArrayValue"
				:data="seasonData"
				:cascader="false"
				:columns="2"
				separator="|"
				label="字符串数组"
			/>
		</MList>
		<div class="vcm-picker-example__value">
			当前值：{{ formatValue(stringArrayValue) }}
		</div>

		<Picker
			v-model="asyncValue"
			:data="asyncData"
			:columns="3"
			:load-data="loadData"
			label="异步分组"
		>
			<template #default="{ label }">
				<div class="vcm-picker-example__custom">
					点击选择：{{ label }}
				</div>
			</template>
		</Picker>
		<div class="vcm-picker-example__value">
			当前值：{{ formatValue(asyncValue) }}
		</div>

		<MList>
			<Picker
				v-model="seasonValue"
				:data="seasonData"
				:cascader="false"
				:columns="2"
				extra="选择年份和季节"
				label="季节"
			/>
		</MList>
		<div class="vcm-picker-example__value">
			当前值：{{ formatValue(seasonValue) }}
		</div>

		<MList>
			<Picker
				v-model="bottomValue"
				:data="seasonData"
				:cascader="false"
				:columns="2"
				confirm="bottom"
				title="底部确定"
				label="confirm=bottom"
			/>
			<Picker
				v-model="liveValue"
				:data="seasonData"
				:cascader="false"
				:columns="2"
				:confirm="false"
				title="停下即提交"
				label="confirm=false"
			/>
		</MList>
		<div class="vcm-picker-example__value">
			当前值：{{ formatValue(bottomValue) }} / {{ formatValue(liveValue) }}
		</div>

		<div class="vcm-picker-example__panel">
			<PickerView
				v-model="viewValue"
				:data="groupData"
				:columns="3"
				@picker-change="handlePickerChange"
			/>
		</div>
		<div class="vcm-picker-example__value">
			当前值：{{ formatValue(viewValue) }}
		</div>

		<div class="vcm-picker-example__actions">
			<Button
				v-for="count in [3, 5, 7]"
				:key="count"
				:type="rows === count ? 'primary' : 'default'"
				@click="rows = count"
			>
				{{ count }} 行
			</Button>
		</div>
		<div class="vcm-picker-example__panel" :style="{ '--vc-picker-rows': rows }">
			<PickerView
				v-model="rowsValue"
				:data="seasonData"
				:cascader="false"
				:columns="2"
			/>
		</div>

		<MList>
			<Picker
				v-model="unevenValue"
				:data="unevenData"
				:columns="3"
				hide-empty-columns
				label="层级不齐"
			/>
		</MList>
		<div class="vcm-picker-example__value">
			当前值：{{ formatValue(unevenValue) }}（hideEmptyColumns：没有下一级时不显示空列）
		</div>

		<div class="vcm-picker-example__panel is-selected-custom">
			<PickerView
				v-model="selectedValue"
				:data="seasonData"
				:cascader="false"
				:columns="2"
			/>
		</div>
		<div class="vcm-picker-example__value">
			当前值：{{ formatValue(selectedValue) }}（选中项用 is-selected 类加粗、主色）
		</div>

		<div class="vcm-picker-example__actions">
			<Button @click="isVisible = true">
				打开 PickerPopup
			</Button>
			<Button @click="handleOpen">
				MPicker.open
			</Button>
		</div>

		<PickerPopup
			v-model:visible="isVisible"
			title="自定义弹层"
			@ok="isVisible = false"
			@cancel="isVisible = false"
		>
			<div class="vcm-picker-example__popup-content">
				这里可以放任意内容
			</div>
		</PickerPopup>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button } from '../../button';
import { MList } from '../../list/index.m';
import { MPicker } from '../index.m';
import { Picker, PickerPopup, PickerView } from '..';

const groupData = [
	{
		value: '110000',
		label: '分组 A',
		children: [
			{
				value: '110100',
				label: '子组 A-1',
				children: [
					{ value: '110101', label: '条目 A-1-1' },
					{ value: '110102', label: '条目 A-1-2' },
					{ value: '110116', label: '条目 A-1-3' }
				]
			},
			{
				value: '110200',
				label: '子组 A-2',
				children: [
					{ value: '110228', label: '条目 A-2-1' },
					{ value: '110229', label: '条目 A-2-2' }
				]
			}
		]
	}
];

const seasonData = [
	[
		{ label: '2025', value: '2025' },
		{ label: '2026', value: '2026' }
	],
	[
		{ label: '春', value: 'spring' },
		{ label: '夏', value: 'summer' },
		{ label: '秋', value: 'autumn' },
		{ label: '冬', value: 'winter' }
	]
];

const unevenData = [
	{
		value: 'a',
		label: '分组 A',
		children: [
			{ value: 'a1', label: '子组 A-1' },
			{ value: 'a2', label: '子组 A-2' }
		]
	},
	{
		value: 'b',
		label: '分组 B',
		children: [
			{
				value: 'b1',
				label: '子组 B-1',
				children: [
					{ value: 'b11', label: '条目 B-1-1' },
					{ value: 'b12', label: '条目 B-1-2' }
				]
			}
		]
	}
];

const value = ref(['110000', '110100', '110101']);
const rows = ref(5);
const bottomValue = ref(['2026', 'summer']);
const liveValue = ref(['2026', 'summer']);
const rowsValue = ref(['2026', 'summer']);
const unevenValue = ref(['a', 'a1']);
const selectedValue = ref(['2025', 'autumn']);
const stringValue = ref('110000,110100,110101');
const stringArrayValue = ref('2026|summer');
const asyncValue = ref([]);
const asyncData = ref([]);
const seasonValue = ref(['2026', 'summer']);
const viewValue = ref(['110000', '110200', '110228']);
const isVisible = ref(false);

const cloneGroupData = () => JSON.parse(JSON.stringify(groupData));
const formatValue = value => JSON.stringify(value);

const loadData = async () => {
	await new Promise(resolve => setTimeout(resolve, 300));
	asyncData.value = cloneGroupData();
};

const handleOpen = () => {
	MPicker.open({
		data: groupData,
		value: value.value,
		columns: 3,
		onOk: (next) => {
			value.value = next;
		}
	});
};

const handleChange = (next, label) => {
	console.log('change:', next, label);
};

const handlePickerChange = (next, index) => {
	console.log('picker-change:', next, index);
};
</script>

<style lang="scss">
.vcm-picker-example {
	display: grid;
	gap: 12px;
	padding: 16px;
	background: #f5f7fa;

	&__custom {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 44px;
		background: #fff;
	}

	&__panel {
		background: #fff;

		&.is-selected-custom .vcm-picker-col__item.is-selected {
			font-weight: 600;
			color: var(--vc-color-primary);
		}
	}

	&__actions {
		display: flex;
		gap: 8px;
	}

	&__value {
		padding: 8px 12px;
		overflow-wrap: anywhere;
		font-size: 13px;
		line-height: 20px;
		color: #516071;
		background: #fff;
	}

	&__popup-content {
		height: 120px;
		line-height: 120px;
		text-align: center;
		background: #fff;
	}
}
</style>
