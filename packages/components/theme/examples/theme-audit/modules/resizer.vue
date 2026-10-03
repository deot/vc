<template>
	<div class="audit-stack">
		<label>区域高度<Slider v-model="height" :min="100" :max="240" /></label>
		<div :style="{ height: `${height}px` }">
			<Resizer class="audit-utility-surface">
				<template #default="{ width, height: measuredHeight }">
					测量结果：{{ Math.round(width) }} × {{ Math.round(measuredHeight) }}<br>继承主题
				</template>
			</Resizer>
		</div>
		<p class="audit-hint">调整滑块或浏览器宽度，检查尺寸及表面。</p>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Resizer, Slider } from '@deot/vc';

const height = ref(140);
</script>
