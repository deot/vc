<template>
	<MList border>
		<MListItem label="普通列表" extra="辅助文字" />
		<MListItem label="无箭头" :arrow="false">内容</MListItem>
		<MListItem label="多行" multiple extra="第二行辅助内容" arrow="down">字段与分隔线</MListItem>
	</MList>
</template>
<script setup>
import { MList, MListItem } from '@deot/vc';

defineProps({ mobile: Boolean, overlayGeneration: Number });
</script>
