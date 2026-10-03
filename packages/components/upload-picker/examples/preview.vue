<template>
	<div style="padding: 20px; background: var(--vc-background-color-lightest);">
		<p>预览统一走 FilePreview.open：图片（多图，跳过上传失败项）、视频、音频弹窗，文件点击名称在新窗口打开</p>
		<p>VcInstance.options.FilePreview 与 FilePreview 共用：getFileType 影响分组，enhancer 可接管预览</p>
		<div class="toolbar">
			<label><input v-model="useGetFileType" type="checkbox"> getFileType（识别 xxx.jpg!4-4；UploadPicker 在解析 modelValue 时读取，这里切换后重新挂载）</label>
			<label><input v-model="useEnhancer" type="checkbox"> enhancer（接管 file）</label>
		</div>
		<UploadPicker
			:key="`pc-${useGetFileType}`"
			v-model="dataSource"
			:picker="['image', 'video', 'audio', 'file']"
			:upload-options="uploadOptions"
		/>
		<p>enhancer 调用记录：</p>
		<pre class="logs">{{ logs.join('\n') || '-' }}</pre>
		<p>移动端</p>
		<MUploadPicker
			:key="`mobile-${useGetFileType}`"
			v-model="dataSource"
			:picker="['image', 'video', 'audio', 'file']"
			:upload-options="uploadOptions"
		/>
	</div>
</template>
<script setup>
import { ref, watchEffect, onBeforeUnmount } from 'vue';
import { UploadPicker } from '..';
import { MUploadPicker } from '../index.m';
import { VcInstance } from '../../vc';

const original = { ...VcInstance.options.FilePreview };
const useGetFileType = ref(true);
const useEnhancer = ref(false);
const logs = ref([]);
const urls = [];

const dataSource = ref([
	{ label: 'banner.png', value: 'https://dummyimage.com/1800x600/555/fff.png?text=banner' },
	{ label: 'photo.jpg!4-4', value: 'https://dummyimage.com/800x600/2d8cf0/fff/?text=photo.jpg!4-4' },
	'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
	'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3',
	{ label: '示例文件-2026.pdf', value: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' }
]);

// 本地预览，不走真实上传
const uploadOptions = Object.fromEntries(['image', 'video', 'audio', 'file'].map(type => [type, {
	onResponse: ({ requestOptions }) => {
		const value = URL.createObjectURL(requestOptions.file);
		urls.push(value);
		return { value };
	}
}]));

watchEffect(() => {
	VcInstance.configure({
		FilePreview: {
			getFileType: useGetFileType.value
				? source => (/\.jpg!/.test(source) ? 'image' : undefined)
				: undefined,
			enhancer: useEnhancer.value
				? ({ current, data, instance }) => {
						const item = data[current];
						logs.value.unshift(`${new Date().toLocaleTimeString()} ${instance?.type.name} ${item.type} ${item.name}`);
						return item.type === 'file';
					}
				: undefined
		}
	});
});

onBeforeUnmount(() => {
	VcInstance.configure({ FilePreview: original });
	urls.forEach(url => URL.revokeObjectURL(url));
});
</script>
<style scoped>
.toolbar {
	display: flex;
	gap: 12px;
	margin-bottom: 12px;
}

.logs {
	font-size: 12px;
	color: #909399;
}
</style>
