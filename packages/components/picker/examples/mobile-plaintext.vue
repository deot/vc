<template>
	<div class="vcm-picker-plaintext-demo">
		<h3>编辑</h3>
		<MList>
			<MPicker v-model="single" :data="data" :cascader="false" label="单列" />
			<MPicker v-model="path" :data="cascaderData" :columns="2" label="联动" />
			<MPicker v-model="empty" :data="data" :cascader="false" label="空值" />
		</MList>

		<h3>详情（plaintext）</h3>
		<MList>
			<MListItem :arrow="false" label="单列">
				<template #extra>
					<MPicker v-model="single" :data="data" :cascader="false" plaintext />
				</template>
			</MListItem>
			<MListItem :arrow="false" label="联动">
				<template #extra>
					<MPicker v-model="path" :data="cascaderData" :columns="2" :formatter="labels => labels.join(' / ')" plaintext />
				</template>
			</MListItem>
			<MListItem :arrow="false" label="空值 + extra">
				<template #extra>
					<MPicker v-model="empty" :data="data" :cascader="false" plaintext extra="-" />
				</template>
			</MListItem>
		</MList>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MList, MListItem } from '../../list/index.m';
import { MPicker } from '../index.m';

const data = [
	{ value: 'a', label: '选项 A' },
	{ value: 'b', label: '选项 B' },
	{ value: 'c', label: '选项 C' }
];

const cascaderData = [
	{ value: 'x', label: '分组 X', children: [{ value: 'x-1', label: '条目 X-1' }, { value: 'x-2', label: '条目 X-2' }] },
	{ value: 'y', label: '分组 Y', children: [{ value: 'y-1', label: '条目 Y-1' }] }
];

const single = ref(['b']);
const path = ref(['x', 'x-2']);
const empty = ref([]);
</script>

<style lang="scss">
.vcm-picker-plaintext-demo {
	h3 {
		padding: 16px 16px 8px;
		font-size: 14px;
		color: #999;
	}
}
</style>
