<template>
	<div class="audit-stack">
		<p class="audit-hint">使用真实 UploadTaskView 的公开展示接口模拟任务，不创建上传请求。</p>
		<div class="audit-sample" data-state="本地选择入口 / 禁用">
			<div class="audit-sample__label">本地选择入口 / 禁用</div>
			<div class="audit-row">
				<Upload
					v-for="disabled in [false, true]" :key="String(disabled)" :disabled="disabled"
					:onRequest="handleRequest" :onResponse="handleResponse"
				>
					<Button :disabled="disabled">{{ disabled ? '禁用上传' : '选择本地文件' }}</Button>
				</Upload>
			</div>
		</div>
		<div class="audit-row">
			<Button @click="handleTasks">展示四种任务状态</Button>
			<Button @click="handleResult">展示合计结果</Button>
		</div>
	</div>
</template>
<script setup>
import { Upload, Button } from '@deot/vc';
import { UploadTask } from '../../../../upload/task';
import { useAuditPortals } from '../use-audit-portals';

const props = defineProps({ mobile: Boolean, overlayGeneration: Number });
const { open } = useAuditPortals(() => props.overlayGeneration);
let leaf;
const handleRequest = ({ requestOptions }) => ({ ...requestOptions, url: undefined });
const handleResponse = ({ requestOptions }) => ({ name: requestOptions.file.name });
const handleTasks = () => {
	if (!leaf?.wrapper) leaf = open(options => UploadTask.popup(options), { multiple: true });
	const task = leaf.wrapper;
	task.clear();
	task.show(['pending', 'uploading', 'success', 'error'].map((status, index) => ({
		uploadId: status, name: `${status}.png`, size: 1024 * (index + 1), percent: 0
	})));
	task.start('uploading');
	task.progress('uploading', 48);
	task.success('success');
	task.error('error', '模拟失败，不发送请求');
};
const handleResult = () => {
	leaf?.wrapper?.success('pending');
	leaf?.wrapper?.success('uploading');
	leaf?.wrapper?.complete();
};
</script>
