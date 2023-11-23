<template>
	<h1>{{ value }}</h1>
	<Input
		v-model="value"
		:disabled="disabled"
		style="width: 200px;"
		clearable
		placeholder="显示placeholder"
		@change="handleChange"
		@focus="handleFocus"
		@blur="handleBlur"
		@enter="handleEnter"
	/>
	<Input 
		v-model="value"
		:disabled="disabled"
		style="width: 200px;"
		placeholder="显示placeholder"
		@change="handleChange"
		@focus="handleFocus"
		@blur="handleBlur"
		@enter="handleEnter"
	>
		<template #append>
			<div style="background: red">
				icon
			</div>
		</template>
	</Input>
	<Input 
		v-model="value"
		:disabled="true"
	/>
	<Input 
		v-model="value"
		append="rmb"	
	/>
	<Input 
		v-model="value"
		:disabled="true"
		append="rmb"	
	/>
	<Input 
		v-model="value"
		prepend="rmb"	
	/>
</template>
<script setup>
import { ref } from 'vue';
import { Input } from '..';

const disabled = ref(false);
const value = ref('any');

const handleChange = () => {
	console.log(value);
};

const handleFocus = () => {
	console.log('聚焦的回调');
};

const handleBlur = () => {
	console.log('失焦的回调');
};

const handleEnter = () => {
	console.log('回车键的回调');
};
</script>

<style>
.vc-input {
	margin-bottom: 10px;
}
</style>