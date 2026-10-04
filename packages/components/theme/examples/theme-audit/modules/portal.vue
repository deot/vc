<template>
	<div class="audit-stack">
		<div class="audit-utility-surface">普通内容 · 继承主题</div>
		<Button @click="handleToggle">{{ visible ? '卸载挂载内容' : '挂载内容到本卡片' }}</Button>
		<div ref="host" class="audit-portal-host" />
		<p class="audit-hint">不使用全局固定定位；关闭挂载内容或卸载示例时清理。</p>
	</div>
</template>
<script setup>
import { defineComponent, h, onBeforeUnmount, ref, watch } from 'vue';
import { Portal, Button } from '@deot/vc';

const props = defineProps({ overlayGeneration: Number });
const visible = ref(false);
const host = ref();
const portal = new Portal(defineComponent({
	setup: () => () => h('div', { class: 'audit-utility-surface' }, 'Portal 挂载后的内容 · 继承主题')
}));
let leaf;
const close = () => { leaf?.destroy(); leaf = undefined; visible.value = false; };
const handleToggle = () => {
	if (visible.value) return close();
	leaf = portal.popup({ element: host.value, multiple: true, leaveDelay: 0 });
	visible.value = true;
};
watch(() => props.overlayGeneration,
	close);
onBeforeUnmount(close);
</script>
