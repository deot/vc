<template>
	<div class="switch-examples">
		<label>自定义值 <Switch v-model="status" checked-value="开" unchecked-value="关" /> {{ status }}</label>
		<label>默认状态 <Switch :model-value="true" /><Switch :model-value="false" /></label>
		<label>禁用状态 <Switch :model-value="true" disabled /><Switch :model-value="false" disabled /></label>
		<label>文案 <Switch v-model="isEnabled" checked-text="开" unchecked-text="关" /></label>
		<label>
			插槽
			<Switch :width="64">
				<template #checked>ON</template>
				<template #unchecked>OFF</template>
			</Switch>
		</label>
		<label>重置内部状态 <Switch :model-value="false" @change="handleChange" /></label>
		<label>异步切换 <Switch v-model="isAsyncEnabled" @click="handleClick" /> {{ isAsyncEnabled }}</label>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Switch } from '..';

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
