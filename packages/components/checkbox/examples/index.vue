<template>
	<div>
		<Checkbox v-model="single">
			{{ single }}
		</Checkbox>
		<CheckboxGroup v-model="social">
			<Checkbox label="twitter">
				<span>Twitter</span>
			</Checkbox>
			<Checkbox label="facebook">
				<span>Facebook</span>
			</Checkbox>
			<Checkbox label="github" disabled>
				<span>Github</span>
			</Checkbox>
			<Checkbox label="snapchat" disabled>
				<span>Snapchat</span>
			</Checkbox>
		</CheckboxGroup>
		<CheckboxGroup v-model="fruit">
			<Checkbox label="香蕉" />
			<Checkbox label="苹果" />
			<Checkbox label="西瓜" />
		</CheckboxGroup>

		<!-- indeterminate -->
		<div style="border-bottom: 1px solid #e9e9e9;padding-bottom:6px;margin-bottom:6px;">
			<Checkbox
				:indeterminate="indeterminate"
				:model-value="checkAll"
				@click.prevent="handleCheckAll"
			>
				全选
			</Checkbox>
		</div>
		<CheckboxGroup v-model="checkAllGroup" @change="handleChange">
			<Checkbox label="香蕉" />
			<Checkbox label="苹果" />
			<Checkbox label="西瓜" />
		</CheckboxGroup>
	</div>
</template>
<script setup>
import { onUpdated, ref } from 'vue';
import { Checkbox, CheckboxGroup } from '..';

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
