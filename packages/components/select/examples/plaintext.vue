<template>
	<div class="vc-select-plaintext-demo">
		<Button @click="plaintext = !plaintext">
			plaintext: {{ plaintext }}
		</Button>

		<div class="vc-select-plaintext-demo__row">
			<span class="vc-select-plaintext-demo__label">单选</span>
			<Select v-model="single" :data="optionList" :plaintext="plaintext" style="width: 200px" />
		</div>
		<div class="vc-select-plaintext-demo__row">
			<span class="vc-select-plaintext-demo__label">分组</span>
			<Select v-model="grouped" :data="groupedData" :plaintext="plaintext" style="width: 200px" />
		</div>
		<div class="vc-select-plaintext-demo__row">
			<span class="vc-select-plaintext-demo__label">多选</span>
			<Select v-model="multiple" :data="optionList" :max="0" :plaintext="plaintext" style="width: 300px" />
		</div>
		<div class="vc-select-plaintext-demo__row">
			<span class="vc-select-plaintext-demo__label">字符串多选</span>
			<Select v-model="joined" :data="optionList" :max="0" :plaintext="plaintext" style="width: 300px" />
		</div>
		<div class="vc-select-plaintext-demo__row">
			<span class="vc-select-plaintext-demo__label">formatter</span>
			<Select
				v-model="multiple"
				:data="optionList"
				:max="0"
				:plaintext="plaintext"
				:formatter="labels => labels.join(' / ')"
				style="width: 300px"
			/>
		</div>
		<div class="vc-select-plaintext-demo__row">
			<span class="vc-select-plaintext-demo__label">空值 + extra</span>
			<Select v-model="empty" :data="optionList" :plaintext="plaintext" extra="-" style="width: 200px" />
		</div>
		<div class="vc-select-plaintext-demo__row">
			<span class="vc-select-plaintext-demo__label">行内</span>
			<p>
				当前条目为
				<Select v-model="single" :data="optionList" :plaintext="plaintext" style="width: 200px" />
				，可切换 plaintext 对比
			</p>
		</div>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Select } from '..';
import { Button } from '../../button';
import { optionList, optionList1, optionList2 } from './basic/data';

const plaintext = ref(true);
const groupedData = [
	{ value: '分组 A', children: optionList1 },
	{ value: '分组 B', children: optionList2 }
];

const single = ref('2');
const grouped = ref(optionList2[0].value);
const multiple = ref(['1', '3']);
const joined = ref('2,4');
const empty = ref();
</script>

<style lang="scss">
.vc-select-plaintext-demo {
	margin: 40px;

	&__row {
		display: flex;
		margin: 16px 0;
		align-items: center;
		gap: 16px;
	}

	&__label {
		width: 100px;
		color: #999;
	}
}
</style>
