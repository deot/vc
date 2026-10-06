<template>
	<div class="audit-stack">
		<div class="audit-row">
			<Button @click="handleOpen">引导卡片与蒙层</Button>
		</div>
	</div>
</template>
<script setup>
import { Button, Tour } from '@deot/vc';
import { useAuditPortals } from '../use-audit-portals';

const props = defineProps({ mobile: Boolean, overlayGeneration: Number });
const { open } = useAuditPortals(() => props.overlayGeneration);
const handleOpen = () => open(Tour.open, {
	steps: [
		{ title: '欢迎使用', content: '检查卡片、标题、进度、按钮、关闭图标与蒙层。' },
		{ title: '完成引导', content: '切换主题后重新打开，检查对应颜色。' }
	]
});
</script>
