<template>
	<ModalView
		v-model="isActive"
		title="签名"
		size="large"
		@cancel="handleCancel"
		@ok="handleOk"
	>
		<Artboard
			ref="artboard"
			:options="{ strokeStyle: 'red', shadowColor: 'red' }"
			:width="300"
			:height="200"
		/>
	</ModalView>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { Artboard } from '../..';
import { ModalView } from '../../../modal';

const emit = defineEmits(['portal-rejected', 'portal-fulfilled']);

const isActive = ref(false);

const artboard = ref(null);

const handleCancel = () => {
	emit('portal-rejected');
};
const handleOk = async () => {
	isActive.value = false;
	emit('portal-fulfilled');
};

onMounted(() => {
	isActive.value = true;
});
</script>
<style lang='scss'>

</style>
