<template>
	<Scroller :height="160" :native="false" always>
		<div class="audit-scroller__content">
			<p v-for="index in 15" :key="index" class="audit-scroller__row">滚动内容 {{ index }} · 横向与纵向 · hover 滑块</p>
		</div>
	</Scroller>
</template>
<script setup>
import { Scroller } from '@deot/vc';

defineProps({ mobile: Boolean, overlayGeneration: Number });
</script>
