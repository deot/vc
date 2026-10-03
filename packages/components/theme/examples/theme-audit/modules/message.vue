<template>
	<div class="audit-stack">
		<div class="audit-row">
			<Button v-for="mode in modes" :key="mode" @click="handleOpen(mode)">{{ mode }}</Button>
		</div>
		<p class="audit-hint">点击状态按钮显示真实反馈组件；可使用反馈组件自身的关闭控件。</p>
	</div>
</template>
<script setup>
import { Button, Message } from '@deot/vc';
import { useAuditPortals } from '../use-audit-portals';

const props = defineProps({ mobile: Boolean, overlayGeneration: Number });
const modes = ['info', 'success', 'warning', 'error', 'loading'];
const { open } = useAuditPortals(() => props.overlayGeneration);
const handleOpen = (mode) => {
	open(Message[mode], { content: `${mode} · 主题反馈内容`, duration: 0, mask: false, closable: true, top: 180 });
};
</script>
