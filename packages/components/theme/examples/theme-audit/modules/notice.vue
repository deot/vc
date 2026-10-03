<template>
	<div class="audit-stack">
		<div class="audit-row">
			<Button v-for="mode in modes" :key="mode" @click="handleOpen(mode)">{{ mode }}</Button>
		</div>
		<p class="audit-hint">点击状态按钮显示真实反馈组件；可使用反馈组件自身的关闭控件。</p>
	</div>
</template>
<script setup>
import { Button, Notice, NoticeView, Portal } from '@deot/vc';
import { useAuditPortals } from '../use-audit-portals';

const props = defineProps({ mobile: Boolean, overlayGeneration: Number });
const modes = ['info', 'success', 'warning', 'error', 'loading'];
const { open } = useAuditPortals(() => props.overlayGeneration);
const loadingPortal = new Portal(NoticeView, { multiple: true, leaveDelay: 0 });
const handleOpen = (mode) => {
	const create = mode === 'loading' ? options => loadingPortal.popup(options) : Notice[mode];
	open(create, { mode, title: `${mode} 提示`, content: `${mode} · 主题反馈内容`, duration: 0, closable: true });
};
</script>
