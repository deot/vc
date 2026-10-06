<template>
	<div style=" display: flex;padding: 24px; flex-wrap: wrap; gap: 12px; align-items: center;">
		<Button @click="handleOpen">打开缓存引导</Button>
		<Button @click="handleClearCache">清除缓存</Button>
		<label><input v-model="isCacheEnabled" type="checkbox" @change="handleConfigure"> 全局允许缓存</label>
		<span>{{ resultMessage }}</span>
	</div>
</template>
<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { Button } from '../../button';
import { VcInstance } from '../../vc';
import { Tour } from '..';

const isCacheEnabled = ref(true);
const resultMessage = ref('完成或跳过后，再次打开会命中缓存');
let tourLeaf;
VcInstance.configure({
	Tour: {
		cache: isCacheEnabled.value,
		getCache: ({ cacheKey }) => sessionStorage.getItem(cacheKey),
		setCache: ({ cacheKey }) => { sessionStorage.setItem(cacheKey, 'true'); },
		onOpen: ({ steps }) => {
			return steps.length > 0;
		}
	}
});

const handleClearCache = () => {
	sessionStorage.removeItem('tour-cache-example');
	resultMessage.value = '缓存已清除';
};
const handleOpen = async () => {
	tourLeaf = Tour.open({
		cache: 'tour-cache-example',
		steps: [
			{
				title: '缓存引导',
				content: '我知道了和跳过都会记录；关闭图标和 ESC 默认不记录。'
			}
		]
	});
	resultMessage.value = (await tourLeaf).type;
};

onMounted(handleOpen);
onBeforeUnmount(() => tourLeaf?.destroy());
</script>
