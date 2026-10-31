<template>
	<div class="audit-stack">
		<div v-for="(item, index) in samples" :key="index" class="audit-sample" :data-state="item.label">
			<div class="audit-sample__label">{{ item.label }}</div>
			<component
				:is="mobile ? MTabs : Tabs" v-model="item.value" v-bind="item.props"
				theme="light" :class="mobile ? 'audit-inline-tabs' : undefined"
				:bar-style="mobile ? { position: 'relative', top: 'auto' } : undefined"
				:average="false" :auto-afloat-width="false" class="audit-tabs"
			>
				<component
					:is="mobile ? MTabsPane : TabsPane" v-for="pane in mobile ? 8 : 4" :key="pane"
					:value="String(pane - 1)" :label="pane === 3 ? '禁用选项' : `标签 ${pane}`" :disabled="pane === 3"
					closable :lazy="false"
				>内容 {{ pane }}</component>
			</component>
		</div>
	</div>
</template>
<script setup>
import { reactive } from 'vue';
import { Tabs, TabsPane, MTabs, MTabsPane } from '@deot/vc';

const props = defineProps({ mobile: Boolean, overlayGeneration: Number });

// 桌面端：各类型（含关闭按钮）、选中项被禁用、标签栏在底部 / 左侧；移动端：普通与步进
const DESKTOP = [
	...['line', 'card', 'button', 'capsule', 'text', 'round'].map(type => ({ label: type, props: { type, closable: true } })),
	{ label: '选中禁用', value: '2', props: { type: 'card' } },
	{ label: 'bottom', props: { placement: 'bottom' } },
	{ label: 'left', props: { placement: 'left' } }
];
const MOBILE = [{ label: '普通' }, { label: '步进', props: { stepper: true } }];

const samples = reactive((props.mobile ? MOBILE : DESKTOP).map(item => ({ props: {}, value: '0', ...item })));
</script>
