<template>
	<div>
		<Snapshot ref="target">
			<div style="padding: 20px; background: white">
				<div v-for="item in count" :key="item">{{ item }}</div>
				<Input placeholder="abc" />
			</div>
		</Snapshot>
		<Button type="primary" @click="handleClick">
			生成
		</Button>

		<Button type="primary" @click="handleDownload">
			下载
		</Button>

		<div style="background: #252b3a; padding: 20px">
			<img :src="src">
		</div>
	</div>
</template>
<script setup>
import { ref } from 'vue';

import { Snapshot } from '..';
import { Button } from '../../button/index';
import { Input } from '../../input/index';

const count = ref(10);
const target = ref();
const src = ref();
const handleClick = async () => {
	count.value += 5;
	const dataURL = await target.value.toDataURL();
	src.value = dataURL;
};

const handleDownload = async () => {
	target.value.download();
};
</script>
