<template>
	<div style="padding: 20px; background: var(--vc-background-color-lightest);">
		<p>VcInstance.options.FilePreview：getFileType 识别带处理后缀的地址（模拟 OSS 的 xxx.jpg!4-4，内置规则会识别为 file）；getFileName 去掉文件名的时间戳前缀；enhancer 接管 file 类型</p>
		<div class="toolbar">
			<label><input v-model="useGetFileType" type="checkbox"> getFileType</label>
			<label><input v-model="useGetFileName" type="checkbox"> getFileName</label>
			<label><input v-model="useEnhancer" type="checkbox"> enhancer</label>
		</div>
		<FilePreview :data="dataSource" type="group" />
		<p>enhancer 调用记录：</p>
		<pre class="logs">{{ logs.join('\n') || '-' }}</pre>
	</div>
</template>
<script setup>
import { ref, watchEffect, onBeforeUnmount } from 'vue';
import { FilePreview } from '..';
import { VcInstance } from '../../vc';

const original = { ...VcInstance.options.FilePreview };
const useGetFileType = ref(true);
const useGetFileName = ref(true);
const useEnhancer = ref(true);
const logs = ref([]);

const dataSource = [
	{ source: 'https://dummyimage.com/800x600/555/fff/?text=photo.jpg!4-4', name: 'photo.jpg!4-4' },
	{ source: 'https://dummyimage.com/600x800/2d8cf0/fff.png?text=a', name: 'a.png' },
	{ source: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', name: '示例文件-2026.pdf' },
	// 未提供name，由getFileName推导
	'https://example.com/files/1695123_%E7%A4%BA%E4%BE%8B%E6%96%87%E4%BB%B6.xlsx'
];

watchEffect(() => {
	VcInstance.configure({
		FilePreview: {
			getFileType: useGetFileType.value
				? source => (/\.jpg!/.test(source) ? 'image' : undefined)
				: undefined,
			getFileName: useGetFileName.value
				? source => decodeURIComponent(source.split('/').pop()).replace(/^\d+_/, '')
				: undefined,
			enhancer: useEnhancer.value
				? ({ current, data }) => {
						const item = data[current];
						logs.value.unshift(`${new Date().toLocaleTimeString()} ${item.type} ${item.name}`);
						// 返回真值：已接管，不再走内置预览
						return item.type === 'file';
					}
				: undefined
		}
	});
});

onBeforeUnmount(() => {
	VcInstance.configure({ FilePreview: original });
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
