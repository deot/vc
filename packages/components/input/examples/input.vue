<template>
	<h2>状态对比</h2>
	<div class="input-state-examples">
		<Input placeholder="普通输入：点击查看聚焦边框" />
		<Input disabled placeholder="禁用输入：空值" />
		<Input disabled model-value="禁用输入：已有内容" clearable />
	</div>

	<h1>{{ current }}</h1>
	<h1>typeof: {{ current.map(i => typeof i) }}</h1>
	<Input
		v-model="current[0]"
		:disabled="disabled"
		:maxlength="2"
		bytes
		clearable
		placeholder="显示placeholder"
		indicator
		@input="handleInput"
		@change="handleChange"
		@focus="handleFocus"
		@blur="handleBlur"
		@enter="handleEnter"
		@click="handleClick"
	/>

	<Input
		controllable
		placeholder="完全受控无法输入,需modelValue"
		@clear="handleClear"
		@input="handleInput"
		@change="handleChange"
		@focus="handleFocus"
		@blur="handleBlur"
		@enter="handleEnter"
		@click="handleClick"
	/>

	<Input
		:model-value="current[0]"
		:disabled="disabled"
		:maxlength="2"
		bytes
		clearable
		placeholder="显示placeholder"
		indicator
		@input="handleInput"
		@change="handleChange"
		@focus="handleFocus"
		@blur="handleBlur"
		@enter="handleEnter"
		@click="handleClick"
	/>
	<Input :model-value="current[0]" readonly @click="handleClick">
		<template #content>
			<div style="display: flex; line-height: 32px; justify-content: center;">
				readonly: {{ current[0] }}
			</div>
		</template>
	</Input>
</template>
<script setup>
import { ref } from 'vue';
import { Input } from '..';

const disabled = ref(false);
const current = ref(Array.from({ length: 6 }).map(() => 'any'));

const handleInput = () => {
	console.log('input', current.value);
};

const handleChange = () => {
	console.log('change', current.value);
};

const handleFocus = () => {
	console.log('focus', current.value);
};

const handleBlur = (e, v, old) => {
	console.log('blur', current.value, v, old);
};

const handleEnter = () => {
	console.log('enter', current.value);
};
const handleClear = () => {
	console.log('Clear');
};

const handleClick = () => {
	console.log('click');
};
</script>

<style>
.input-state-examples {
	display: flex;
	flex-wrap: wrap;
	gap: 12px;
	margin-bottom: 16px;
}

.vc-input {
	margin-bottom: 10px;
	width: 200px;
	display: block;
}
</style>
