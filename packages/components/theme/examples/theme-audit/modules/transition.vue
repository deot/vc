<template>
	<div class="audit-stack">
		<Button @click="visible = !visible">{{ visible ? '离开' : '进入' }}</Button>
		<div v-for="item in effects" :key="item.name" class="audit-sample">
			<div class="audit-sample__label">{{ item.name }}</div>
			<component :is="item.component" :duration="350"><div v-if="visible" class="audit-utility-surface">动画内容 · 继承主题</div></component>
		</div>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Button, TransitionFade, TransitionScale, TransitionSlide, TransitionCollapse, TransitionZoom } from '@deot/vc';

const visible = ref(true);
const effects = [
	{ name: 'Fade', component: TransitionFade }, { name: 'Scale', component: TransitionScale },
	{ name: 'Slide', component: TransitionSlide }, { name: 'Collapse', component: TransitionCollapse }, { name: 'Zoom', component: TransitionZoom }
];
</script>
