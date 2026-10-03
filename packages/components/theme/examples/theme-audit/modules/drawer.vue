<template>
	<div class="audit-stack">
		<div class="audit-row">
			<Button v-for="placement in placements" :key="placement" @click="handleOpen(placement)">{{ placement }}</Button>
		</div>
	</div>
</template>
<script setup>
import { onBeforeUnmount } from 'vue';
import { Button, Drawer } from '@deot/vc';
import { useAuditPortals } from '../use-audit-portals';

const props = defineProps({ mobile: Boolean, overlayGeneration: Number });
const placements = ['left', 'right', 'top', 'bottom'];
const { open } = useAuditPortals(() => props.overlayGeneration);
const width = Math.min(360, window.innerWidth - 32);
const timers = new Map();
const handleOpen = (placement) => {
	open(Drawer.open, {
		title: '抽屉标题', content: '检查标题、底部、关闭图标和遮罩',
		placement, width, height: 260, onOk: handleAsync
	});
};
const handleAsync = () => new Promise((resolve) => {
	const timer = setTimeout(() => { timers.delete(timer); resolve(); }, 2000);
	timers.set(timer, resolve);
});
onBeforeUnmount(() => timers.forEach((resolve, timer) => { clearTimeout(timer); resolve(); }));
</script>
