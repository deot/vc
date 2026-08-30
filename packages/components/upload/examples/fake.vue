<template>
	<div>
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
			Blob本地化上传
		</Upload>
		<div style="display: flex; flex-wrap: wrap;">
			<div
				v-for="(item, index) in list"
				:key="index"
				:style="{ backgroundImage: `url(${item.source})` }"
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
import { VcInstance } from '../../vc';
import { Message } from '../../message';

VcInstance.configure({
	Upload: {
		onRequest: ({ requestOptions }) => {
			return new Promise((resolve) => {
				resolve({
					...requestOptions,
					url: void 0
				});
			});
		},
		onResponse: ({ requestOptions }) => {
			const file = requestOptions.file;
			return {
				source: URL.createObjectURL(file),
				title: file.name,
			};
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

</script>

<style lang="scss">
.image {
	display: flex;
	width: 120px;
	height: 120px;
	margin: 3px;
	color: red;
	background-size: cover;
	border-radius: 3px;
	align-items: center;
	justify-content: center;
}
</style>
