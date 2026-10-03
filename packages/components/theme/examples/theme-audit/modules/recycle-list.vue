<template>
	<div class="audit-stack">
		<div class="audit-recycle-list">
			<RecycleList :data="rows" :estimate-size="44" disabled
				:scroller-options="{ native: false, always: true }" class="audit-recycle-list__content">
				<template #default="{ row }"><div class="audit-recycle-row">{{ row.label }}</div></template>
			</RecycleList>
		</div>
		<div class="audit-recycle-list is-empty"><RecycleList :data="[]" disabled><template #empty>没有数据 · 继承主题</template></RecycleList></div>
		<p class="audit-hint">使用本地数据，不请求远程分页；滚动检查条目、分隔线与滚动条。</p>
	</div>
</template>
<script setup>
import { RecycleList } from '@deot/vc';

const rows = Array.from({ length: 40 },
	(_, index) => ({ id: index, label: `虚拟条目 ${index + 1}` }));
</script>
