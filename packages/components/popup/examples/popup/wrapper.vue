<template>
	<MPopup
		v-model="isVisible"
		:placement="placement"
		class="vc-popup-basic-tip"
		@visible-change="handleChange"
	>
		<div @click="handleClose">
			点击关闭
		</div>
		tip <br>
		tip <br>
		tip <br>
		tip <br>
		tip <br>
		tip <br>
		tip <br>
		tip <br>
		tip <br>
		tip <br>
		tip <br>
		tip <br>
		tip <br>
		tip <br>
		tip <br>
		tip <br>
		tip <br>
		tip <br>
		tip <br>
		tip <br>
		tip <br>
		tip <br>
		tip <br>
		tip <br>
		tip <br>
		tip2 <br>
	</MPopup>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { MPopup } from '../../index.m';

const emit = defineEmits(['portal-fulfilled']);
defineProps({
	placement: String
});
const isVisible = ref(false);
onMounted(() => {
	isVisible.value = true;
});

const handleClose = () => {
	isVisible.value = false;
};
const handleChange = () => {
	emit('portal-fulfilled');
};
</script>
