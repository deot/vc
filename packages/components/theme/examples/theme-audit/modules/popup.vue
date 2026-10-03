<template>
	<div class="audit-stack">
		<div class="audit-row">
			<Button v-for="placement in placements" :key="placement" @click="handleOpen(placement)">{{ placement }}</Button>
		</div>
	</div>
</template>
<script setup>
import { h, nextTick } from 'vue';
import { Button, Popup, Portal } from '@deot/vc';
import { useAuditPortals } from '../use-audit-portals';

const props = defineProps({ mobile: Boolean, overlayGeneration: Number });
const placements = ['bottom', 'top', 'left', 'right', 'center'];
const { open } = useAuditPortals(() => props.overlayGeneration);
const portal = new Portal(Popup, { multiple: true, leaveDelay: 0 });
const handleOpen = (placement) => {
	const leaf = open(options => portal.popup(options), {
		placement, theme: 'light',
		slots: {
			default: () => h('div', { class: 'audit-popup__content' }, [
				h('div', 'Popup · 正文与表面'),
				h(Button, { class: 'audit-popup__close', onClick: () => { leaf.wrapper?.toggle(false); } }, () => '关闭')
			])
		}
	});
	nextTick(() => leaf.wrapper?.toggle(true));
};
</script>
