<template>
	<div class="audit-stack">
		<Grid :columns="[96, '1fr', '1fr']" :gap="8" align="center">
			<GridItem :span="1" class="audit-grid-cell">96px</GridItem>
			<GridItem :span="1" class="audit-grid-cell">1fr</GridItem>
			<GridItem :span="1" class="audit-grid-cell">1fr</GridItem>
			<GridItem class="audit-grid-cell" span="auto" justify="center">span auto</GridItem>
		</Grid>
	</div>
</template>
<script setup>
import { Grid, GridItem } from '@deot/vc';

defineProps({ mobile: Boolean, overlayGeneration: Number });
</script>
<style scoped>
.audit-grid-cell {
	padding: 6px 8px;
	color: var(--vc-color-dark-light);
	background: var(--vc-background-color-light);
	border-radius: 4px;
}
</style>
