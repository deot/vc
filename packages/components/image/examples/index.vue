<template>
	<div style="padding: 20px; display: flex; flex-direction: column;">
		<Image
			src="https://dummyimage.com/400x200/555/fff.png?text=Image"
			fit="contain"
			style="height: 100px; width: 200px;"
		/>
		<h1>Lazy</h1>
		<div style="height: 400px; overflow-y: auto; display: flex; flex-direction: column; width: 100%">
			<!-- hack 边距 -->
			<div v-for="url in urls" :key="url" style="font-size: 0">
				<Image
					:src="url"
					lazy
					style="min-height: 200px; width: 200px; height: 200px"
					previewable
				/>
			</div>
		</div>

		<div v-if="isVisible">
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

const isVisible = ref(false);
const urls = ref([
	'https://dummyimage.com/800x400/555/fff.png?text=Image-1',
	'https://dummyimage.com/800x400/555/fff.png?text=Image-2',
	'https://dummyimage.com/800x400/555/fff.png?text=Image-3',
	'https://dummyimage.com/800x400/555/fff.png?text=Image-4',
	'https://dummyimage.com/800x400/555/fff.png?text=Image-5'
]);
setTimeout(() => {
	isVisible.value = true;
}, 5000);

</script>
