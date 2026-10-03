<template>
	<div class="audit-stack">
		<div class="audit-row">
			<Button v-for="mode in modes" :key="mode" @click="handleOpen(mode)">{{ mode }} 对话框</Button>
		</div>
		<p class="audit-hint">点击确认观察异步加载；关闭后等待动画结束再移除弹层。</p>
	</div>
</template>
<script setup>
import { computed, nextTick, onBeforeUnmount } from 'vue';
import { Button, Modal, ModalView, MModal, Portal } from '@deot/vc';
import { useAuditPortals } from '../use-audit-portals';

const props = defineProps({ mobile: Boolean, overlayGeneration: Number });
const modes = computed(() => props.mobile ? ['alert', 'operation'] : ['default', 'info', 'success', 'warning', 'error']);
const { open } = useAuditPortals(() => props.overlayGeneration);
const portal = new Portal(ModalView, { multiple: true, leaveDelay: 0 });
const width = Math.min(460, window.innerWidth - 32);
const timers = new Map();
const handleOpen = (mode) => {
	const options = {
		title: mode + ' 标题', content: '主题、分隔线、遮罩及加载检查',
		border: true, width, onOk: handleAsync,
		...(mode === 'operation' ? { data: [{ content: '确认', onClick: handleAsync }] } : {})
	};
	if (props.mobile) {
		open(MModal[mode], options);
	} else if (mode === 'default') {
		const leaf = open(options => portal.popup(options), options);
		nextTick(() => leaf.wrapper?.toggle(true));
	} else {
		open(Modal[mode], options);
	}
};
const handleAsync = () => new Promise((resolve) => {
	const timer = setTimeout(() => { timers.delete(timer); resolve(); }, 2000);
	timers.set(timer, resolve);
});
onBeforeUnmount(() => timers.forEach((resolve, timer) => { clearTimeout(timer); resolve(); }));
</script>
