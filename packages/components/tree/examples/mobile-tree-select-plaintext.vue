<template>
	<div class="vcm-tree-select-plaintext-demo">
		<h3>编辑</h3>
		<MList>
			<MTreeSelect v-model="single" :data="data" label="单选" />
			<MTreeSelect v-model="multiple" :data="data" :max="0" label="多选" />
			<MTreeSelect v-model="empty" :data="data" label="空值" />
		</MList>

		<h3>详情（plaintext）</h3>
		<MList>
			<MListItem :arrow="false" label="单选">
				<template #extra>
					<MTreeSelect v-model="single" :data="data" plaintext />
				</template>
			</MListItem>
			<MListItem :arrow="false" label="多选">
				<template #extra>
					<MTreeSelect v-model="multiple" :data="data" :max="0" plaintext />
				</template>
			</MListItem>
			<MListItem :arrow="false" label="空值 + extra">
				<template #extra>
					<MTreeSelect v-model="empty" :data="data" plaintext extra="-" />
				</template>
			</MListItem>
		</MList>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MList, MListItem } from '../../list/index.m';
import { MTreeSelect } from '../index.m';

const data = [
	{
		value: 'a',
		label: '分组 A',
		children: [
			{ value: 'a-1', label: '条目 A-1' },
			{ value: 'a-2', label: '条目 A-2' }
		]
	},
	{ value: 'b', label: '分组 B', children: [{ value: 'b-1', label: '条目 B-1' }] }
];

const single = ref('a-2');
const multiple = ref(['a-1', 'b-1']);
const empty = ref();
</script>

<style lang="scss">
.vcm-tree-select-plaintext-demo {
	h3 {
		padding: 16px 16px 8px;
		font-size: 14px;
		color: #999;
	}
}
</style>
