<template>
	<div class="vcm-cascader-plaintext-demo">
		<h3>编辑</h3>
		<MList>
			<MCascader v-model="path" :data="data" label="完整路径" />
			<MCascader v-model="leaf" :data="data" check-strategy="child" label="最后一级" />
			<MCascader v-model="empty" :data="data" label="空值" />
		</MList>

		<h3>详情（plaintext）</h3>
		<MList>
			<MListItem :arrow="false" label="完整路径">
				<template #extra>
					<MCascader v-model="path" :data="data" plaintext />
				</template>
			</MListItem>
			<MListItem :arrow="false" label="最后一级">
				<template #extra>
					<MCascader v-model="leaf" :data="data" check-strategy="child" plaintext />
				</template>
			</MListItem>
			<MListItem :arrow="false" label="空值 + extra">
				<template #extra>
					<MCascader v-model="empty" :data="data" plaintext extra="-" />
				</template>
			</MListItem>
		</MList>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MList, MListItem } from '../../list/index.m';
import { MCascader } from '../index.m';

const data = [
	{
		value: 'a',
		label: '分组 A',
		children: [
			{ value: 'a-1', label: '条目 A-1', children: [{ value: 'a-1-1', label: '细项 A-1-1' }, { value: 'a-1-2', label: '细项 A-1-2' }] },
			{ value: 'a-2', label: '条目 A-2' }
		]
	},
	{ value: 'b', label: '分组 B', children: [{ value: 'b-1', label: '条目 B-1' }] }
];

const path = ref(['a', 'a-1', 'a-1-2']);
const leaf = ref('b-1');
const empty = ref([]);
</script>

<style lang="scss">
.vcm-cascader-plaintext-demo {
	h3 {
		padding: 16px 16px 8px;
		font-size: 14px;
		color: #999;
	}
}
</style>
