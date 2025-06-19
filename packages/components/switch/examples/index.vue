<template>
	<div>
		<Switch v-model="single" checked-value="开" unchecked-value="关" @change="handleChange" />

		<Switch :model-value="true" />
		<Switch :model-value="false" />

		<Switch :width="40">
			<template #checked>
				<span>开</span>
			</template>
			<template #unchecked>
				<span>关</span>
			</template>
		</Switch>
		<br><br>
		<Switch :width="50">
			<template #checked>
				<span>开启</span>
			</template>
			<template #unchecked>
				<span>关闭</span>
			</template>
		</Switch>
		<Switch :width="50">
			<template #checked>
				<span>ON</span>
			</template>
			<template #unchecked>
				<span>OFF</span>
			</template>
		</Switch>

		<br>
		<br>
		<br>
		<br>

		<!-- 强制设置值 -->
		<Switch
			:model-value="value"
			@change="handleChangeValue"
		/>

		<!-- loading -->
		<Switch
			:v-model="value"
			@click="handleClick"
		/>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Switch } from '..';

const single = ref(false);
const value = ref(false);

const handleChange = (status) => {
	console.log({
		single: single.value,
		other: status
	});
};

const handleChangeValue = (v, e, forceReset) => {
	forceReset(value.value);
};

const handleClick = () => {
	return new Promise((resolve) => {
		setTimeout(resolve, 3000);
	});
};
</script>
