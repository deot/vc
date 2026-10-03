<template>
	<div class="audit-stack">
		<div v-for="size in sizes" :key="size" class="audit-sample" :data-state="size">
			<div class="audit-sample__label">{{ size }}</div>
			<div class="audit-stack">
				<div v-for="disabled in [false, true]" :key="String(disabled)" class="audit-row">
					<template v-for="type in types" :key="type">
						<Button v-for="solid in type === 'text' ? [false] : [false, true]" :key="String(solid)"
							:size="size" :type="type" :solid="solid" :disabled="disabled">
							{{ type }}{{ solid ? '/solid' : '' }}{{ disabled ? '/disabled' : '' }}
						</Button>
					</template>
				</div>
			</div>
		</div>
		<div class="audit-sample" data-state="图标 · 异步点击后展示加载 · hover">
			<div class="audit-sample__label">图标 · 异步点击后展示加载 · hover</div>
			<div class="audit-row">
				<Button v-for="type in types" :key="type" :type="type" icon="search" @click="handleLoading">{{ type }}/loading</Button>
			</div>
		</div>
		<div class="audit-sample" data-state="ButtonGroup：三个尺寸 · 横向/纵向 · 图标">
			<div class="audit-sample__label">ButtonGroup：三个尺寸 · 横向/纵向 · 图标</div>
			<div class="audit-row">
				<template v-for="size in sizes" :key="size">
					<ButtonGroup v-for="vertical in [false, true]" :key="String(vertical)" :size="size" :vertical="vertical">
						<Button icon="search">{{ size }}</Button>
						<Button type="primary" icon="plus">操作</Button>
						<Button disabled>禁用</Button>
					</ButtonGroup>
				</template>
			</div>
		</div>
	</div>
</template>
<script setup>
import { onBeforeUnmount } from 'vue';
import { Button, ButtonGroup } from '@deot/vc';

defineProps({ mobile: Boolean, overlayGeneration: Number });
const types = ['default', 'primary', 'success', 'warning', 'error', 'text'];
const sizes = ['small', 'medium', 'large'];
const timers = new Map();
const handleLoading = () => new Promise((resolve) => {
	const timer = setTimeout(() => { timers.delete(timer); resolve(); }, 1800);
	timers.set(timer, resolve);
});
onBeforeUnmount(() => timers.forEach((resolve, timer) => { clearTimeout(timer); resolve(); }));
</script>
