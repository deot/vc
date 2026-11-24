<template>
	<div class="vc-cascader-plaintext-demo">
		<Button @click="plaintext = !plaintext">
			plaintext: {{ plaintext }}
		</Button>

		<div class="vc-cascader-plaintext-demo__row">
			<span class="vc-cascader-plaintext-demo__label">完整路径</span>
			<Cascader v-model="path" :data="data" :plaintext="plaintext" style="width: 300px" />
		</div>
		<div class="vc-cascader-plaintext-demo__row">
			<span class="vc-cascader-plaintext-demo__label">只回填最后一级</span>
			<Cascader v-model="leaf" :data="data" check-strategy="child" :plaintext="plaintext" style="width: 300px" />
		</div>
		<div class="vc-cascader-plaintext-demo__row">
			<span class="vc-cascader-plaintext-demo__label">formatter</span>
			<Cascader
				v-model="path"
				:data="data"
				:plaintext="plaintext"
				:formatter="labels => labels[labels.length - 1]"
				style="width: 300px"
			/>
		</div>
		<div class="vc-cascader-plaintext-demo__row">
			<span class="vc-cascader-plaintext-demo__label">空值 + extra</span>
			<Cascader v-model="empty" :data="data" :plaintext="plaintext" extra="-" style="width: 300px" />
		</div>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Cascader } from '..';
import { Button } from '../../button';

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

const plaintext = ref(true);
const path = ref(['a', 'a-1', 'a-1-2']);
const leaf = ref('b-1');
const empty = ref([]);
</script>

<style lang="scss">
.vc-cascader-plaintext-demo {
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
