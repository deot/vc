<template>
	<div class="audit-stack">
		<div v-for="(group, index) in groups" :key="index" class="audit-sample" :data-state="group.disabled ? '禁用轨道' : '开 / 关：点击触发加载'">
			<div class="audit-sample__label">{{ group.disabled ? '禁用轨道' : '开 / 关：点击触发加载' }}</div>
			<div class="audit-row">
				<component :is="mobile ? MSwitch : Switch"
					v-for="(item, state) in group.items" :key="state"
					v-model="item.value" :disabled="group.disabled"
					checked-text="开" unchecked-text="关" @click="handleLoading" />
			</div>
		</div>
	</div>
</template>
<script setup>
import { onBeforeUnmount, reactive } from 'vue';
import { Switch, MSwitch } from '@deot/vc';

defineProps({ mobile: Boolean, overlayGeneration: Number });
const groups = reactive([false, true].map(disabled => ({ disabled, items: [{ value: false }, { value: true }] })));
const timers = new Map();
const handleLoading = () => new Promise((resolve) => {
	const timer = setTimeout(() => { timers.delete(timer); resolve(); }, 1800);
	timers.set(timer, resolve);
});
onBeforeUnmount(() => timers.forEach((resolve, timer) => { clearTimeout(timer); resolve(); }));
</script>
