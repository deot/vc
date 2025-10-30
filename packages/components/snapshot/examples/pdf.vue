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
import { VcInstance } from '../../vc/index';

VcInstance.options.Snapshot.download = async (instance, options) => {
	if (options.format === 'pdf') {
		await instance.exposed.refresh();
		const canvas = await instance.exposed.snapshot.value.toCanvas();
		await import('https://unpkg.com/jspdf@latest/dist/jspdf.umd.min.js');
		const pdf = new window.jspdf.jsPDF('p', 'mm', 'a4');
		const ctx = canvas.getContext('2d');
		const a4w = 170;
		const a4h = 250;
		const imageHeight = Math.floor(a4h * canvas.width / a4w);
		let renderedHeight = 0;

		while (renderedHeight < canvas.height) {
			const el = document.createElement('canvas');
			el.width = canvas.width;
			el.height = Math.min(imageHeight, canvas.height - renderedHeight);

			const imageData = ctx.getImageData(0,
				renderedHeight,
				canvas.width,
				Math.min(imageHeight, canvas.height - renderedHeight)
			);

			el.getContext('2d').putImageData(imageData, 0, 0);
			pdf.addImage(el.toDataURL('image/png', 1.0), 'PNG', 20, 20, a4w, Math.min(a4h, a4w * el.height / el.width));

			renderedHeight += imageHeight;
			if (renderedHeight < canvas.height) {
				pdf.addPage();
			}
		}

		await pdf.save(`${options.filename || 'any'}.pdf`, { returnPromise: true });
		return true;
	}

	return false;
};
const count = ref(10);
const target = ref();
const src = ref();
const handleClick = async () => {
	count.value += 5;
	const dataURL = await target.value.toDataURL();
	src.value = dataURL;
};

const handleDownload = async () => {
	target.value.download({ format: 'pdf', filename: 'any' });
};
</script>
