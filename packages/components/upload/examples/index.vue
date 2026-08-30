<template>
	<div>
		<div @click="handleOpen">直传</div>
		<br>
		<Upload>简单版上传</Upload>
		<br>
		<Upload
			:size="2"
			:max="8"
			:parallel="false"
			accept="image/*"
			show-task
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
		onRequest: ({ requestOptions }) => {
			return new Promise((resolve) => {
				if (random(0, 10) > 9) {
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
const handleError = ({ cause }) => {
	console.error(cause.message);
};

const handleBegin = ({ rawFiles, files }) => {
	console.log(rawFiles, files);
	Message.loading({
		content: `上传中`
	});
};

const handleComplete = ({ result }) => {
	console.log(`Failed: ${result.failed}, Succeeded: ${result.succeeded}, Total: ${result.total}`);
	console.log(result.responses);
	Message.destroy();
};

const handleFileBefore = ({ file }) => {
	console.log(`上传之前`);
	return new Promise((resolve) => {
		resolve(file);
	});
};

const handleFileStart = () => {
	console.log(`开始上传`);
};

const handleFileSuccess = ({ response, file }) => {
	console.log(`Success：${file.current}, 总数：${file.total}`);
	console.log(response);
	Message.destroy();
	Message.success({
		content: `上传成功`
	});

	list.value.push(response);
};

const handleFileProgress = ({ progress, file }) => {
	console.log(`Progress: 当前：${file.current}, 总数：${file.total}`);
	console.log(progress);
};

const handleFileError = ({ cause, message, file }) => {
	console.log(`Error: 当前：${file.current}, 总数：${file.total}`);
	console.log(cause);
	Message.destroy();
	Message.error({
		content: message
	});
};

const handleOpen = async () => {
	const result = await Upload.open({
		size: 2,
		max: 8,
		parallel: false,
		accept: 'image/*',
		onError: handleError,
		onBegin: handleBegin,
		onComplete: handleComplete,
		onFileBefore: handleFileBefore,
		onFileStart: handleFileStart,
		onFileError: handleFileError,
		onFileSuccess: handleFileSuccess,
		onFileProgress: handleFileProgress
	});

	console.log(result);
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
