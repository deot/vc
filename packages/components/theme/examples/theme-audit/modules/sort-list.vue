<template>
	<div class="audit-stack">
		<component :is="mobile ? MSortList : SortList" v-model="items" mask>
			<template #default="{ row }"><div class="audit-sort-item">{{ row.label }}</div></template>
		</component>
		<p class="audit-hint">{{ mobile ? '长按并拖动；移动端不提供桌面遮罩。' : '按住项目拖动检查遮罩。' }}</p>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { SortList, MSortList } from '@deot/vc';

defineProps({ mobile: Boolean, overlayGeneration: Number });
const items = ref([1, 2, 3].map(id => ({ id, label: `拖动项目 ${id}` })));
</script>
