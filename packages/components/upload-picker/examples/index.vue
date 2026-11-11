<template>
	<div class="demo">
		<p>只有一个上传入口：桌面端一次可混选多种类型，按类型分发上传。type 不传时按 picker 自动选择（只有图片、视频为 grid，只有音频、文件为 list，两者都有为 group）。上传时每第 3 次模拟失败，失败项可点「重试」</p>
		<div class="toolbar">
			<button v-for="item in types" :key="item" :class="{ 'is-active': type === item }" @click="type = item">
				{{ item || 'auto' }}
			</button>
		</div>
		<div class="toolbar">
			<label><input v-model="sortable" type="checkbox"> sortable</label>
			<button v-for="item in sizes" :key="item" :class="{ 'is-active': size === item }" @click="size = item">
				{{ item || 'default' }}
			</button>
		</div>
		<UploadPicker
			:key="`${type}-${sortable}`"
			v-model="dataSource"
			show-error
			:type="type || undefined"
			:size="size || undefined"
			:sortable="sortable"
			:picker="['image', 'video', 'audio', 'file']"
		/>

		<p>整行列表的最大宽度：--vc-file-preview-row-max-width（默认 480px），此处为 320px</p>
		<UploadPicker
			v-model="files"
			:picker="['file']"
			style="--vc-file-preview-row-max-width: 320px"
		/>

		<p>图片，output="string"</p>
		<UploadPicker
			v-model="list"
			:picker="['image']"
			output="string"
		/>
	</div>
</template>
<script setup>
import { UploadPicker } from '..';
import { ref } from 'vue';
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
const types = ['', 'list', 'grid', 'group'];
const type = ref('');
const sizes = ['', 'mini', 'small', 'medium', 'large'];
const size = ref('');
const sortable = ref(false);
const list = ref('');
const dataSource = ref([
	'https://dummyimage.com/800x600/555/fff.jpg?text=1',
	'https://dummyimage.com/132x132/555/fff.png?text=2',
	'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
	'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3',
	{ value: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', label: '示例文件-2026.pdf', type: 'file' }
]);
const files = ref([
	{ value: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', label: '一个名字比较长、超出最大宽度后会省略显示的示例文件.pdf', type: 'file' }
]);
</script>
<style scoped>
.demo {
	display: flex;
	flex-direction: column;
	gap: 12px;
	padding: 20px;
	background: var(--vc-background-color-lightest);
}

.demo p {
	margin: 0;
	font-size: 13px;
	color: var(--vc-color-dark-light);
}

.toolbar {
	display: flex;
	align-items: center;
	gap: 12px;
}

.toolbar .is-active {
	color: #456cf6;
}
</style>
