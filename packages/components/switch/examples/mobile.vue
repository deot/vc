<template>
	<div class="switch-examples">
		<label>自定义值 <MSwitch v-model="status" checked-value="开" unchecked-value="关" /> {{ status }}</label>
		<label>默认状态 <MSwitch :model-value="true" /><MSwitch :model-value="false" /></label>
		<label>禁用状态 <MSwitch :model-value="true" disabled /><MSwitch :model-value="false" disabled /></label>
		<label>文案 <MSwitch v-model="isEnabled" checked-text="开" unchecked-text="关" /></label>
		<label>
			插槽
			<MSwitch>
				<template #checked>开</template>
				<template #unchecked>关</template>
			</MSwitch>
		</label>
		<label>重置内部状态 <MSwitch :model-value="false" @change="handleChange" /></label>
		<label>异步切换 <MSwitch v-model="isAsyncEnabled" @click="handleClick" /> {{ isAsyncEnabled }}</label>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MSwitch } from '../index.m';

const status = ref('关');
const isEnabled = ref(false);
const isAsyncEnabled = ref(false);

const handleChange = (value, event, reset) => {
	reset(false);
};
const handleClick = () => new Promise(resolve => setTimeout(resolve, 1000));
</script>

<style scoped>
.switch-examples {
	display: grid;
	gap: 24px;
	padding: 24px;
}

label {
	display: flex;
	flex-wrap: wrap;
	gap: 16px;
	align-items: center;
}
</style>
