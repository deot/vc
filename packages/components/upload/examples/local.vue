<template>
	<div class="upload-demo">
		<Upload
			ref="upload"
			:max="3"
			:parallel="false"
			show-task
			@request="handleRequest"
			@response="handleResponse"
			@file-before="handleFileBefore"
			@complete="handleComplete"
		/>
		<div class="upload-demo__actions">
			<Button :disabled="isRunning" @click="handleStart">运行串行示例</Button>
			<Button @click="handleLocale">切换语言</Button>
		</div>
		<p>{{ summary }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Upload } from '..';
import { Button } from '../../button';
import { VcInstance } from '../../vc';
import { enUS, zhCN } from '@deot/vc-locale';

const handleLocale = () => VcInstance.configure({ locale: VcInstance.options.locale.name === 'zh-CN' ? enUS : zhCN });
const upload = ref();
const isRunning = ref(false);
const summary = ref('预期：2 个成功，1 个取消');
const handleRequest = ({ requestOptions }) => ({ ...requestOptions, url: undefined });
const handleResponse = async ({ requestOptions }) => {
	await new Promise(resolve => setTimeout(resolve, 1500));
	return { name: requestOptions.file.name };
};
const handleFileBefore = async ({ file }) => {
	await new Promise(resolve => setTimeout(resolve, 700));
	return file.name === 'skip.txt' ? false : file;
};
const handleStart = () => {
	isRunning.value = true;
	summary.value = '处理中，可在右下角查看任务';
	upload.value.uploadFiles(['first.txt', 'skip.txt', 'last.txt'].map(name => new File(['demo'], name)));
};
const handleComplete = ({ result }) => {
	isRunning.value = false;
	summary.value = `成功 ${result.succeeded}，失败 ${result.failed}，总数 ${result.total}`;
};
</script>

<style scoped>
.upload-demo { padding: 24px; line-height: 1.6; }
.upload-demo__actions { display: flex; flex-wrap: wrap; gap: 12px; }
.upload-demo p { margin: 12px 0 0; }
</style>
