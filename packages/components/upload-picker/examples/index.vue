<template>
	<div>
		<UploadPicker
			v-model="dataSource"
			show-error
			:picker="['image', 'video', 'audio', 'file']"
		>
			<template #upload="{ type }">
				<button type="button">
					上传 {{ type }}
				</button>
			</template>
		</UploadPicker>
		<div>图片压缩</div>
		{{ list }}
		<UploadPicker
			v-model="list"
			:picker="['image']"
			output="string"
		/>
		<div>移动端样式</div>
		<MUploadPicker
			v-model="dataSource"
			show-error
			:picker="['image', 'video', 'audio', 'file']"
		>
			<template #upload="{ type }">
				<button type="button">
					上传 {{ type }}
				</button>
			</template>
		</MUploadPicker>
	</div>
</template>
<script setup>
import { UploadPicker } from '..';
import { MUploadPicker } from '../index.m';
import { ref, watchEffect } from 'vue';
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
const list = ref([]);
const dataSource = ref([
	'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
	'https://dummyimage.com/800x600/555/fff.jpg?text=Image',
	'https://dummyimage.com/132x132/555/fff.png?text=Image'
]);

watchEffect(() => console.log(dataSource.value));
</script>
