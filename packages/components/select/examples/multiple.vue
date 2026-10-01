<template>
	<div style="display: flex; flex-wrap: wrap; gap: 32px;">
		<section>
			<h3>数组多选</h3>
			<Select
				v-model="arrayValue"
				:data="optionList"
				:max="2"
				:max-tags="1"
				clearable
				searchable
				style="width: 200px;"
				@change="handleChange('array', $event)"
				@ready="handleReady('array')"
				@close="handleClose('array')"
				@visible-change="handleVisibleChange('array', $event)"
			/>
			<div>value: {{ arrayValue }}</div>
			<div>typeof: {{ typeof arrayValue }}</div>
			<div>isArray: {{ Array.isArray(arrayValue) }}</div>
		</section>
		<section>
			<h3>字符串多选</h3>
			<Select
				v-model="stringValue"
				:data="optionList"
				:max="2"
				clearable
				searchable
				style="width: 200px;"
				@change="handleChange('string', $event)"
				@ready="handleReady('string')"
				@close="handleClose('string')"
				@visible-change="handleVisibleChange('string', $event)"
			/>
			<div>value: {{ stringValue }}</div>
			<div>typeof: {{ typeof stringValue }}</div>
			<div>isArray: {{ Array.isArray(stringValue) }}</div>
		</section>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Select } from '..';
import { optionList } from './basic/data';

const arrayValue = ref([]);
const stringValue = ref('');

const handleChange = (section, value) => {
	console.log(section, 'change', value);
};

const handleReady = (section) => {
	console.log(section, 'ready');
};

const handleClose = (section) => {
	console.log(section, 'close');
};

const handleVisibleChange = (section, value) => {
	console.log(section, 'visible-change', value);
};
</script>
