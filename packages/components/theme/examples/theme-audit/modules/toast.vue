<template>
	<div class="audit-stack">
		<div class="audit-row">
			<Button v-for="mode in modes" :key="mode" @click="handleOpen(mode)">{{ mode }}</Button>
		</div>
		<p class="audit-hint">点击状态按钮显示真实反馈组件；点击提示层关闭。</p>
	</div>
</template>
<script setup>
import { Button, MToast } from '@deot/vc';
import { useAuditPortals } from '../use-audit-portals';

const props = defineProps({ mobile: Boolean, overlayGeneration: Number });
const modes = ['info', 'success', 'warning', 'error', 'loading'];
const { open } = useAuditPortals(() => props.overlayGeneration);
const handleOpen = (mode) => {
	open(MToast[mode], { content: `${mode} · 主题反馈内容`, duration: 0, maskClosable: true });
};
</script>
