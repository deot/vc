<template>
	<div class="vc-tree-select-plaintext-demo">
		<Button @click="plaintext = !plaintext">
			plaintext: {{ plaintext }}
		</Button>

		<div class="vc-tree-select-plaintext-demo__row">
			<span class="vc-tree-select-plaintext-demo__label">单选</span>
			<TreeSelect v-model="single" :data="data" :plaintext="plaintext" style="width: 300px" />
		</div>
		<div class="vc-tree-select-plaintext-demo__row">
			<span class="vc-tree-select-plaintext-demo__label">多选（联动）</span>
			<TreeSelect v-model="linked" :data="data" :max="0" :plaintext="plaintext" style="width: 300px" />
		</div>
		<div class="vc-tree-select-plaintext-demo__row">
			<span class="vc-tree-select-plaintext-demo__label">多选（strict）</span>
			<TreeSelect
				v-model="strict"
				:data="data"
				:max="0"
				check-strategy="strict"
				:plaintext="plaintext"
				style="width: 300px"
			/>
		</div>
		<div class="vc-tree-select-plaintext-demo__row">
			<span class="vc-tree-select-plaintext-demo__label">formatter</span>
			<TreeSelect
				v-model="strict"
				:data="data"
				:max="0"
				check-strategy="strict"
				:plaintext="plaintext"
				:formatter="labels => `${labels.length} 项：${labels.join('、')}`"
				style="width: 300px"
			/>
		</div>
		<div class="vc-tree-select-plaintext-demo__row">
			<span class="vc-tree-select-plaintext-demo__label">空值 + extra</span>
			<TreeSelect v-model="empty" :data="data" :plaintext="plaintext" extra="-" style="width: 300px" />
		</div>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { TreeSelect } from '..';
import { Button } from '../../button';

const data = [
	{
		value: 'a',
		label: '分组 A',
		children: [
			{ value: 'a-1', label: '条目 A-1' },
			{ value: 'a-2', label: '条目 A-2' }
		]
	},
	{ value: 'b', label: '分组 B', children: [{ value: 'b-1', label: '条目 B-1' }, { value: 'b-2', label: '条目 B-2' }] }
];

const plaintext = ref(true);
const single = ref('a-2');
const linked = ref(['b', 'b-1', 'b-2', 'a-1']);
const strict = ref(['a', 'b-2']);
const empty = ref();
</script>

<style lang="scss">
.vc-tree-select-plaintext-demo {
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
