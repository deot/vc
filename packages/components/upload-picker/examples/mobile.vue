<template>
	<div class="demo">
		<p>多种类型：点「上传」先选类型，再打开该类型的选择（保留相册、拍照）。图片、视频为方格，音频、文件为整行。上传时每第 3 次模拟失败，可查看上传中与失败的样子</p>
		<MUploadPicker
			v-model="dataSource"
			:picker="['image', 'video', 'audio', 'file']"
		/>

		<p>只有图片：方格以 size 为最小边长均分铺满一行，屏幕变宽时每行多放几个；可拖动排序</p>
		<MUploadPicker v-model="images" sortable />

		<p>size="medium"</p>
		<MUploadPicker v-model="images" size="medium" />

		<p>disabled</p>
		<MUploadPicker v-model="images" disabled />
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { MUploadPicker } from '../index.m';
import { VcInstance } from '../../vc/index';

let requestCount = 0;

VcInstance.configure({
	Upload: {
		onRequest: ({ requestOptions }) => {
			return new Promise((resolve) => {
				if (++requestCount % 3 === 0) {
					throw new Error('存在异常');
				}
				resolve({
					...requestOptions,
					url: 'https://httpbin.org/post',
					body: {
						timestamp: new Date().getTime(),
						...requestOptions.body
					},
					headers: {}
				});
			});
		},
		onResponse: ({ request, requestOptions }) => {
			if (!request) return;

			const file = requestOptions.file;
			return new Promise((resolve, reject) => {
				let response;
				try {
					response = JSON.parse(request.response || request.responseText);
				} catch (e) {
					reject(e);
				};
				// 模拟强制返回
				resolve({
					source: `https://dummyimage.com/800x600/555/fff/?text=${file.name}`,
					base64: response.files.file,
					type: `.${file.name.split('.').pop()}`,
					title: file.name,
					size: file.size
				});
			});
		}
	}
});

const dataSource = ref([
	'https://dummyimage.com/800x600/555/fff.jpg?text=1',
	'https://dummyimage.com/132x132/555/fff.png?text=2',
	'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
	'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3',
	{ value: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', label: '示例文件-2026.pdf', type: 'file' }
]);

const images = ref([
	'https://dummyimage.com/800x600/555/fff.jpg?text=1',
	'https://dummyimage.com/800x600/2d8cf0/fff.jpg?text=2',
	'https://dummyimage.com/800x600/1db88c/fff.jpg?text=3',
	'https://dummyimage.com/800x600/f90/fff.jpg?text=4'
]);
</script>
<style scoped>
.demo {
	display: flex;
	flex-direction: column;
	gap: 12px;
	padding: 16px;
	background: var(--vc-background-color-lightest);
}

.demo p {
	margin: 0;
	font-size: 13px;
	color: var(--vc-color-dark-light);
}
</style>
