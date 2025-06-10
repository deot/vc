<template>
	<div style="padding: 30px;">
		<Button type="primary" @click="handleLinkModal">Click</Button>
	</div>
</template>
<script setup>
import { AnyModal } from './popup';
import { Button } from '../../button';

const handleLinkModal = () => {
	AnyModal.popup();
};

</script>
