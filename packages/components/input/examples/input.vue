<template>
	<h1>{{ value }}</h1>
	<Input
		v-model="value[0]"
		:disabled="disabled"
		clearable
		placeholder="显示placeholder"
		@change="handleChange"
		@focus="handleFocus"
		@blur="handleBlur"
		@enter="handleEnter"
	/>
	<Input
		v-model="value[1]"
		:disabled="disabled"
		placeholder="显示placeholder"
		styleless
		focus-end
		@change="handleChange"
		@focus="handleFocus"
		@blur="handleBlur"
		@enter="handleEnter"
	/>
	<Input 
		v-model="value[2]"
		:disabled="disabled"
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
		v-model="value[3]"
		:disabled="true"
	/>
	<Input 
		v-model="value[4]"
		append="rmb"	
	/>
	<Input 
		v-model="value[5]"
		:disabled="true"
		append="rmb"	
	/>
	<Input 
		v-model="value[6]"
		prepend="rmb"	
	/>
</template>
<script setup>
import { ref } from 'vue';
import { Input } from '..';

const disabled = ref(false);
const value = ref(Array.from({ length: 6 }).map(() => 'any'));

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
	width: 200px;
	display: block;
}
</style>