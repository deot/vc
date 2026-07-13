<template>
	<div class="v-image-processor-example">
		<section>
			<h3>原图</h3>
			<img
				:src="image"
				width="100"
				height="100"
				alt=""
			>
		</section>
		<section>
			<h3>抠图</h3>
			<ImageProcessor
				:src="image"
				:output-size="100"
				enhancer="cutout"
				:options="{ targetColor: [255, 255, 255, 1], tolerance: 16 }"
			/>
		</section>
		<section>
			<h3>置灰</h3>
			<ImageProcessor
				:src="image"
				:output-size="[100]"
				enhancer="gray"
			/>
		</section>
		<section>
			<h3>自定义</h3>
			<ImageProcessor
				:src="image"
				:output-size="[100, 100]"
				:enhancer="enhance"
				:options="{ channel: 'red' }"
			/>
		</section>
	</div>
</template>
<script setup>
import { ImageProcessor } from '..';

const image = 'https://github.githubassets.com/favicons/favicon.svg';

const enhance = (imageData, options) => {
	const { data } = imageData;

	for (let i = 0; i < data.length; i += 4) {
		if (options.channel === 'red') {
			data[i + 1] = 0;
			data[i + 2] = 0;
		}
	}
};
</script>
<style lang="scss">
.v-image-processor-example {
	display: flex;
	gap: 24px;
	align-items: flex-start;

	section {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	h3 {
		margin: 0;
		font-size: 14px;
		font-weight: 500;
	}
}
</style>
