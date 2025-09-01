<template>
	<div class="vc-portal-alive">
		<div>title: {{ title }}</div>
		<div>isVisible: {{ isVisible }}</div>
		<div @click="handleOk">
			确定
		</div>
		<div @click="handleCancel">
			取消
		</div>
	</div>
</template>
<script setup>
import { ref, onMounted } from 'vue';

const emit = defineEmits(['portal-fulfilled', 'portal-rejected']);
const props = defineProps({
	title: String,
	id: Number
});

const isVisible = ref(false);

const handleOk = () => {
	emit('portal-fulfilled', 1);
};

const handleCancel = () => {
	emit('portal-rejected', 0);
};

onMounted(() => isVisible.value = true);

defineExpose({
	isVisible,
	update: async (options) => {
		console.log('updated/title', props.title, props.title === options.title);
		console.log('updated/id', props.id, props.id === options.id);
	}
});
</script>
