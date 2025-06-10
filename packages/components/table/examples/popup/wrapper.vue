<template>
	<Modal
		ref="target"
		v-model="isActive"
		title="title2"
		:width="900"
		@ok="handleOk"
		@cancel="handleCancel"
	>
		<TableDemo :delay="350" />
	</Modal>
</template>

<script setup>
import { onMounted, ref, onUnmounted } from 'vue';
import { Modal } from '../../../modal';
import TableDemo from '../max-height.vue';

defineProps({
	data: Object
});

const emit = defineEmits(['portal-fulfilled', 'portal-rejected']);

const target = ref(null);
const isActive = ref(false);
let timer;

onMounted(() => {
	isActive.value = true;
});

onUnmounted(() => {
	clearInterval(timer);
});

const handleOk = () => {
	emit('portal-fulfilled');
};

const handleCancel = () => {
	emit('portal-rejected');
};
</script>
