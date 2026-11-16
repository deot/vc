<template>
	<MSwipeAction
		v-model="open"
		:left-actions="[{ content: '已读', type: 'primary' }]"
		:right-actions="[{ content: '置顶' }, { content: '删除', type: 'error' }]"
	>
		<MListItem label="滑动操作" :arrow="false" alone />
	</MSwipeAction>
</template>
<script setup>
import { ref } from 'vue';
import { MListItem, MSwipeAction } from '@deot/vc';

defineProps({ mobile: Boolean, overlayGeneration: Number });

const open = ref('right');
</script>
