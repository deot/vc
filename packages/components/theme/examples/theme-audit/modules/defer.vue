<template>
	<div class="audit-stack">
		<Button @click="generation++; completed = false">重新分片展示</Button>
		<p>{{ completed ? '展示完成' : '等待分片完成' }} · 继承主题</p>
		<div class="audit-row">
			<Defer :key="generation" :data="rows" :concurrency="2" @complete="completed = true">
				<template #default="{ row }"><span class="audit-utility-surface">{{ row.label }}</span></template>
			</Defer>
		</div>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Defer, Button } from '@deot/vc';

const generation = ref(0);
const completed = ref(false);
const rows = Array.from({ length: 12 },
	(_, index) => ({ id: index, label: `分片 ${index + 1}` }));
</script>
