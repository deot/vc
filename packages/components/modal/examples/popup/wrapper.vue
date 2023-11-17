<template>
	<ModalView
		ref="target"
		v-model="isVisible"
		title="title2"
		@ok="handleOk"
		@cancel="handleCancel"
	>
		<p v-for="i in items" :key="i"> 
			每2秒后高度随机变化 {{ data }} 
		</p>
	</ModalView>
</template>

<script setup>
import { onMounted, ref, onUnmounted } from 'vue';
import { ModalView } from '../..';

const props = defineProps({
	data: Object
});

const emit = defineEmits(['portal-fulfilled', 'portal-rejected']);

let target = ref(null);
let isVisible = ref(false);
let items = ref([1]);
let timer;

onMounted(() => {
	isVisible.value = true;
	timer = setInterval(() => {
		items.value = Array.from({ length: Math.ceil(Math.random() * 30) + 20 }, (e, i) => i);
		target.value?.resetOrigin();
	}, 2000);
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
