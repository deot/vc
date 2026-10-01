<template>
	<div>
		<Checkbox v-model="isChecked">
			{{ isChecked }}
		</Checkbox>
		<CheckboxGroup v-model="selectedOptions">
			<Checkbox value="option-a">
				<span>选项 A</span>
			</Checkbox>
			<Checkbox value="option-b">
				<span>选项 B</span>
			</Checkbox>
			<Checkbox value="option-c" disabled>
				<span>选项 C</span>
			</Checkbox>
			<Checkbox value="option-d" disabled>
				<span>选项 D</span>
			</Checkbox>
		</CheckboxGroup>
		<CheckboxGroup v-model="selectedItems">
			<Checkbox value="条目 B" />
			<Checkbox value="条目 A" />
			<Checkbox value="条目 C" />
		</CheckboxGroup>

		<!-- indeterminate -->
		<div style="border-bottom: 1px solid #e9e9e9;padding-bottom:6px;margin-bottom:6px;">
			<Checkbox
				:indeterminate="isIndeterminate"
				:model-value="isAllChecked"
				@click.prevent="handleCheckAll"
			>
				全选
			</Checkbox>
		</div>
		<CheckboxGroup v-model="checkedItems" @change="handleChange">
			<Checkbox value="条目 B" />
			<Checkbox value="条目 A" />
			<Checkbox value="条目 C" />
		</CheckboxGroup>
	</div>
</template>
<script setup>
import { onUpdated, ref } from 'vue';
import { Checkbox, CheckboxGroup } from '..';

const isChecked = ref(true);
const selectedOptions = ref(['option-b', 'option-c']);
const selectedItems = ref(['条目 A']);

const isIndeterminate = ref(true);
const isAllChecked = ref(false);
const checkedItems = ref(['条目 B', '条目 C']);

const handleCheckAll = () => {
	if (isIndeterminate.value) {
		isAllChecked.value = false;
	} else {
		isAllChecked.value = !isAllChecked.value;
	}
	isIndeterminate.value = false;

	if (isAllChecked.value) {
		checkedItems.value = ['条目 B', '条目 A', '条目 C'];
	} else {
		checkedItems.value = [];
	}
};

const handleChange = (data) => {
	if (data.length === 3) {
		isIndeterminate.value = false;
		isAllChecked.value = true;
	} else if (data.length > 0) {
		isIndeterminate.value = true;
		isAllChecked.value = false;
	} else {
		isIndeterminate.value = false;
		isAllChecked.value = false;
	}
};

onUpdated(() => {
	console.log({
		single: isChecked.value,
		social: selectedOptions.value,
		fruit: selectedItems.value,
		checkAll: isAllChecked.value
	});
});

</script>
