<template>
	<div class="audit-stack">
		<Divider />
		<Divider dashed>虚线</Divider>
		<Divider placement="left">带文字</Divider>
		<div class="audit-row">左<Divider vertical />中<Divider vertical />右</div>
	</div>
</template>
<script setup>
import { Divider } from '@deot/vc';

defineProps({ mobile: Boolean, overlayGeneration: Number });
</script>
