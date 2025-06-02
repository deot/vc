<template>
	<div>
		<Upload>简单版上传</Upload>
		<br>
		<Upload
			:size="2"
			:max="8"
			:parallel="false"
			accept="image/*"
			@error="handleError"
			@begin="handleBegin"
			@complete="handleComplete"
			@file-before="handleFileBefore"
			@file-start="handleFileStart"
			@file-error="handleFileError"
			@file-success="handleFileSuccess"
			@file-progress="handleFileProgress"
		>
			限制大小上传以及api
		</Upload>

		<div style="display: flex; flex-wrap: wrap">
			<div
				v-for="(item, index) in list"
				:key="index"
				:style="{ backgroundImage: `url(${item.base64})` }"
				class="image"
			>
				{{ item.title }}
			</div>
		</div>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Upload } from '..';
import { random } from 'lodash-es';
import { VcInstance } from '../../vc';
import { Message } from '../../message';

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
		onResponse: (response, options) => {
			const file = options.file;
			return new Promise((resolve, reject) => {
				try {
					response = JSON.parse(response);
				} catch (e) {
					reject(e);
				};
				// 模拟强制返回
				resolve({
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
const handleError = (error) => {
	console.error(error.message);
};

const handleBegin = (files) => {
	console.log(files);
	Message.loading({
		content: `上传中`
	});
};

const handleComplete = (cycle = {}) => {
	console.log(`Error: ${cycle.error}, Success: ${cycle.success}, 总数：${cycle.total}`);
	console.log(cycle.responses);
	Message.destroy();
};

const handleFileBefore = (vFile) => {
	console.log(`上传之前`);
	return new Promise((resolve) => {
		resolve(vFile);
	});
};

const handleFileStart = () => {
	console.log(`开始上传`);
};

const handleFileSuccess = (response, vFile) => {
	console.log(`Success：${vFile.current}, 总数：${vFile.total}`);
	console.log(response);
	Message.destroy();
	Message.success({
		content: `上传成功`
	});

	list.value.push(response);
};

const handleFileProgress = (e, vFile) => {
	console.log(`Progress: 当前：${vFile.current}, 总数：${vFile.total}`);
	console.log(e);
};

const handleFileError = (e, vFile) => {
	console.log(`Error: 当前：${vFile.current}, 总数：${vFile.total}`);
	console.log(e);
	Message.destroy();
	Message.error({
		content: e.message || 'test'
	});
};
</script>

<style lang="scss">
	.image {
		background-size: cover;
		width: 120px;
		height: 120px;
		border-radius: 3px;
		margin: 3px;
		color: red;
		display: flex;
		align-items: center;
		justify-content: center;
	}
</style>
