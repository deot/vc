<template>
	<div style="padding: 20px">
		<h1>Lazy</h1>
		<div style="height: 400px; overflow-y: auto; display: flex; flex-direction: column; width: 100%">
			<!-- hack 边距 -->
			<div v-for="url in urls" :key="url" style="font-size: 0">
				<Image 
					:src="url" 
					lazy 
					style="min-height: 200px; width: 200px; height: 200px"
				/>
			</div>
		</div>
	
		<div v-if="show">
			<h1>Lazy(img没有宽高，最好不要使用lazy)</h1>
			<div style="height: 400px; overflow-y: auto; display: flex; flex-direction: column;">
				<!-- hack 边距 -->
				<div v-for="url in urls" :key="url" style="font-size: 0">
					<!-- 需要lazy,需要给一定的宽度和高度，否者会比较别扭 -->
					<Image 
						:src="url" 
						lazy 
						style="min-height: 200px;"
					/>
				</div>
			</div>
		</div>
	</div>
</template>
<script setup>
import { ref } from 'vue';

import { Image } from '..';

const show = ref(false);
const urls = ref([
	'https://yayabms-2.oss-cn-hangzhou.aliyuncs.com/common/p/login/bg.png',
	'https://yayabms-2.oss-cn-hangzhou.aliyuncs.com/common/p/login/bg.png',
	'https://yayabms-2.oss-cn-hangzhou.aliyuncs.com/common/p/login/bg.png',
	'https://yayabms-2.oss-cn-hangzhou.aliyuncs.com/common/p/login/bg.png',
	'https://yayabms-2.oss-cn-hangzhou.aliyuncs.com/common/p/login/bg.png'
]);
setTimeout(() => {
	show.value = true;
}, 5000);

</script>
