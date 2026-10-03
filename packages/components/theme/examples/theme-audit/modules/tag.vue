<template>
	<div class="audit-stack">
		<div v-for="type in ['default', 'border', 'dot']" :key="type" class="audit-sample" :data-state="type">
			<div class="audit-sample__label">{{ type }}</div>
			<div class="audit-row">
				<Tag v-for="color in ['default', 'primary', 'success', 'warning', 'error']"
					:key="color" :type="type" :color="color" closable>{{ color }}</Tag>
			</div>
		</div>
		<div class="audit-sample" data-state="可勾选 / 未勾选">
			<div class="audit-sample__label">可勾选 / 未勾选</div>
			<div class="audit-row"><Tag checkable checked>已选</Tag><Tag checkable :checked="false">未选</Tag></div>
		</div>
	</div>
</template>
<script setup>
import { Tag } from '@deot/vc';

defineProps({ mobile: Boolean, overlayGeneration: Number });
</script>
