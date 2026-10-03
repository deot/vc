<template>
	<div class="audit-row">
		<Popconfirm v-for="item in states" :key="item.type"
			v-model="item.visible" :type="item.type" :title="`${item.type} 确认`"
			content="确认时展示加载"
			@ok="handleAsync" @close="item.visible = false" @portal-fulfilled="item.visible = false">
			<Button>{{ item.type }}</Button>
		</Popconfirm>
	</div>
</template>
<script setup>
import { onBeforeUnmount, reactive, watch } from 'vue';
import { Button, Popconfirm } from '@deot/vc';

const props = defineProps({ mobile: Boolean, overlayGeneration: Number });
const states = reactive(['info', 'success', 'warning', 'error'].map(type => ({ type, visible: false })));
const timers = new Map();
const handleAsync = () => new Promise((resolve) => {
	const timer = setTimeout(() => { timers.delete(timer); resolve(); }, 2000);
	timers.set(timer, resolve);
});
watch(() => props.overlayGeneration, () => states.forEach((item) => { item.visible = false; }));
onBeforeUnmount(() => timers.forEach((resolve, timer) => { clearTimeout(timer); resolve(); }));
</script>
