<template>
	<div class="audit-stack">
		<div v-for="group in groups" :key="group.theme" class="audit-sample" :data-state="`theme: ${group.theme}`">
			<div class="audit-sample__label">theme: {{ group.theme }}</div>
			<div class="audit-row">
				<Popover v-for="item in group.items" :key="item.placement"
					v-model="item.visible" :theme="group.theme"
					trigger="click" :placement="item.placement" arrow
					@close="item.visible = false" @portal-fulfilled="item.visible = false">
					<Button>{{ item.placement }}</Button>
					<template #content><div class="audit-popover__content">箭头、表面、阴影与正文</div></template>
				</Popover>
			</div>
		</div>
	</div>
</template>
<script setup>
import { reactive, watch } from 'vue';
import { Button, Popover } from '@deot/vc';

const props = defineProps({ mobile: Boolean, overlayGeneration: Number });
const groups = reactive(['light', 'dark', 'none'].map(theme => ({
	theme, items: ['top', 'bottom', 'left', 'right'].map(placement => ({ placement, visible: false }))
})));
watch(() => props.overlayGeneration, () => groups.forEach(group => group.items.forEach((item) => { item.visible = false; })));
</script>
