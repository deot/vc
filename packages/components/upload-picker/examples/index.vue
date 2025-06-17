<template>
	<div>
		<UploadPicker
			v-model="dataSource"
			:picker="['image', 'video', 'audio', 'file']"
		>
			<!-- 限制大小上传以及api -->
		</UploadPicker>
		<div>图片压缩</div>
		{{ list }}
		<UploadPicker
			v-model="list"
			:picker="['image']"
			:compress-opts="{compress: true}"
		>
			<!-- 限制大小上传以及api -->
		</UploadPicker>
	</div>
</template>
<script setup>
import { UploadPicker } from '..';
import { ref, watchEffect } from 'vue';
import { random } from 'lodash-es';
import { VcInstance } from '../../vc/index';

VcInstance.configure({
	Upload: {
		onRequest: (options) => {
			return new Promise((resolve) => {
				if (random(0, 10) > 9) {
					throw new Error('存在异常');
				}
				resolve({
					...options,
					url: 'https://httpbin.org/post',
					body: {
						timestamp: new Date().getTime(),
						...options.body
					},
					headers: {}
				});
			});
		},
		onResponse: (request, options) => {
			const file = options.file;
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
	'https://wyatest.oss-cn-hangzhou.aliyuncs.com/image/172/20191226/2007790743/test_video.mp4',
	'https://wyatest.oss-cn-hangzhou.aliyuncs.com/image/172/20200306/0936814587/O1CN01STX58I1HIDIUHqYwP_!!2885750734.jpg!4-4',
	'https://thirdwx.qlogo.cn/mmopen/vi_32/IUeRRqTWdyoMOkveehFRrbogiaFuk9U9kBgRMvP4A8U6GjYhiaboDsBf5WEEhV7Cfjr8a0Tz91Hal0oUaDsOslvg/132'
]);

watchEffect(() => console.log(dataSource.value));
</script>
