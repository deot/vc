<template>
	<div>
		<MCheckbox v-model="single">
			{{ single }}
		</MCheckbox>
		<MCheckboxGroup v-model="social">
			<MCheckbox value="twitter">
				<span>Twitter</span>
			</MCheckbox>
			<MCheckbox value="facebook">
				<span>Facebook</span>
			</MCheckbox>
			<MCheckbox value="github" disabled>
				<span>Github</span>
			</MCheckbox>
			<MCheckbox value="snapchat" disabled>
				<span>Snapchat</span>
			</MCheckbox>
		</MCheckboxGroup>
		<MCheckboxGroup v-model="fruit">
			<MCheckbox value="香蕉" />
			<MCheckbox value="苹果" />
			<MCheckbox value="西瓜" />
		</MCheckboxGroup>

		<!-- indeterminate -->
		<div style="border-bottom: 1px solid #e9e9e9;padding-bottom:6px;margin-bottom:6px;">
			<MCheckbox
				:indeterminate="indeterminate"
				:model-value="checkAll"
				@click.prevent="handleCheckAll"
			>
				全选
			</MCheckbox>
		</div>
		<MCheckboxGroup v-model="checkAllGroup" @change="handleChange">
			<MCheckbox value="香蕉" />
			<MCheckbox value="苹果" />
			<MCheckbox value="西瓜" />
		</MCheckboxGroup>
	</div>
</template>
<script setup>
import { onUpdated, ref } from 'vue';
import { MCheckbox, MCheckboxGroup } from '../index.m';

const single = ref(true);
const social = ref(['facebook', 'github']);
const fruit = ref(['苹果']);

const indeterminate = ref(true);
const checkAll = ref(false);
const checkAllGroup = ref(['香蕉', '西瓜']);

const handleCheckAll = () => {
	if (indeterminate.value) {
		checkAll.value = false;
	} else {
		checkAll.value = !checkAll.value;
	}
	indeterminate.value = false;

	if (checkAll.value) {
		checkAllGroup.value = ['香蕉', '苹果', '西瓜'];
	} else {
		checkAllGroup.value = [];
	}
};

const handleChange = (data) => {
	if (data.length === 3) {
		indeterminate.value = false;
		checkAll.value = true;
	} else if (data.length > 0) {
		indeterminate.value = true;
		checkAll.value = false;
	} else {
		indeterminate.value = false;
		checkAll.value = false;
	}
};

onUpdated(() => {
	console.log({
		single: single.value,
		social: social.value,
		fruit: fruit.value,
		checkAll: checkAll.value
	});
});

</script>
