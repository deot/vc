<template>
	<div class="audit-stack">
		<div v-for="(item, index) in states" :key="index" class="audit-sample" :data-state="mobile ? ['普通', '步进'][index] : item.type">
			<div class="audit-sample__label">{{ mobile ? ['普通', '步进'][index] : item.type }}</div>
			<component
				:is="mobile ? MTabs : Tabs" v-model="item.value" :type="mobile ? undefined : item.type"
				theme="light" :class="mobile ? 'audit-inline-tabs' : undefined"
				:bar-style="mobile ? { position: 'relative', top: 'auto' } : undefined"
				:show-step="mobile && index > 0" :average="false" :auto-afloat-width="false" class="audit-tabs"
			>
				<component
					:is="mobile ? MTabsPane : TabsPane" v-for="pane in mobile ? 8 : 4" :key="pane"
					:value="String(pane - 1)" :label="pane === 3 ? '禁用选项' : `标签 ${pane}`" :disabled="pane === 3" :lazy="false"
				>内容 {{ pane }}</component>
			</component>
		</div>
	</div>
</template>
<script setup>
import { reactive } from 'vue';
import { Tabs, TabsPane, MTabs, MTabsPane } from '@deot/vc';

defineProps({ mobile: Boolean, overlayGeneration: Number });
const states = reactive(['line', 'card'].map(type => ({ type, value: '0' })));
</script>
