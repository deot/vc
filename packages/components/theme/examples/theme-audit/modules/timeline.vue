<template>
	<Timeline>
		<TimelineItem label="默认节点">节点颜色随主色</TimelineItem>
		<TimelineItem label="成功" dot-color="var(--vc-color-success)">已完成</TimelineItem>
		<TimelineItem label="错误" dot-color="var(--vc-color-error)">待处理</TimelineItem>
		<TimelineItem label="显式颜色" dot-color="#E6A23C">不随主题变化</TimelineItem>
	</Timeline>
</template>
<script setup>
import { Timeline, TimelineItem } from '@deot/vc';

defineProps({ mobile: Boolean, overlayGeneration: Number });
</script>
