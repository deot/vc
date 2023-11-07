<template>
	<div>
		<component :is="renderTitle" />
		<div @click="handleOk">
			确定
		</div>
		<div @click="handleCancel">
			取消
		</div>
	</div>
</template>
<script setup lang="jsx">
const emit = defineEmits(['portal-fulfilled', 'portal-rejected']);
const props = defineProps({
	title: String
});

const handleOk = () => {
	emit('portal-fulfilled', { status: 1, title: props.title });
};

const handleCancel = () => {
	emit('portal-rejected', { status: 0, title: props.title });
};

const renderTitle = () => {
	return (
		<h1>{ props.title }</h1>
	);
};
</script>
