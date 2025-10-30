<template>
	<div>
		<Snapshot ref="target">
			<div style="padding: 20px; background: white">
				<div>tpl</div>
				<div>tpl</div>
				<div>tpl</div>
				<div>tpl</div>
				<div>tpl</div>
				<div>tpl</div>
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

const target = ref();
const src = ref();
const handleClick = async () => {
	const dataURL = await target.value.toDataURL();
	src.value = dataURL;
};

const handleDownload = async () => {
	target.value.download({ filename: '', format: 'pdf' });
};
</script>
