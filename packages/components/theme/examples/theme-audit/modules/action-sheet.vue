<template>
	<div class="audit-stack">
		<Button @click="handleOpen">打开操作面板</Button>
		<p class="audit-hint">可长按普通项或取消按钮检查按下背景。禁用项不可点击。</p>
	</div>
</template>
<script setup>
import { onBeforeUnmount } from 'vue';
import { Button, ActionSheet } from '@deot/vc';
import { useAuditPortals } from '../use-audit-portals';

const props = defineProps({ mobile: Boolean, overlayGeneration: Number });
const { open } = useAuditPortals(() => props.overlayGeneration);
const timers = new Map();
const handleAsync = () => new Promise((resolve) => {
	const timer = setTimeout(() => { timers.delete(timer); resolve(false); }, 2000);
	timers.set(timer, resolve);
});
const actions = [
	{ content: '普通项', subContent: '辅助说明' },
	{ content: '禁用项', subContent: '禁用辅助说明', disabled: true },
	{ content: '点击触发加载', subContent: '两秒后恢复', onClick: handleAsync }
];
const handleOpen = () => {
	open(ActionSheet.open, { title: '主题操作面板', cancelText: '取消', data: actions });
};
onBeforeUnmount(() => timers.forEach((resolve, timer) => { clearTimeout(timer); resolve(false); }));
</script>
