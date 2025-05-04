<template>
	<div>
		<MSwitch v-model="single" checked="开" unchecked="关" @change="handleChange" />

		<MSwitch :model-value="true" />
		<MSwitch :model-value="false" />
		<MSwitch>
			<template #checked>
				<span>开</span>
			</template>
			<template #unchecked>
				<span>关</span>
			</template>
		</MSwitch>
		<br><br>
		<MSwitch size="large">
			<template #checked>
				<span>开启</span>
			</template>
			<template #unchecked>
				<span>关闭</span>
			</template>
		</MSwitch>
		<MSwitch size="large">
			<template #checked>
				<span>ON</span>
			</template>
			<template #unchecked>
				<span>OFF</span>
			</template>
		</MSwitch>

		<br>
		<br>
		<br>
		<br>
		<!-- 强制设置值 -->
		<MSwitch
			:model-value="value"
			@change="handleChangeValue"
		/>
		<!-- loading -->
		<MSwitch
			:v-model="value"
			@click="handleClick"
		/>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MSwitch } from '../index.m';

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
