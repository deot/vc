<template>
	<div class="audit-stack">
		<div class="audit-sample" data-state="默认 · 可折叠 · 不可拖">
			<div class="audit-sample__label">默认 · 可折叠 · 不可拖</div>
			<div class="audit-splitter">
				<Splitter>
					<SplitterPanel :size="120" collapsible>
						<div class="audit-splitter__cell">可折叠</div>
					</SplitterPanel>
					<SplitterPanel>
						<div class="audit-splitter__cell">面板</div>
					</SplitterPanel>
					<SplitterPanel :size="96" :resizable="false">
						<div class="audit-splitter__cell">不可拖</div>
					</SplitterPanel>
				</Splitter>
			</div>
		</div>
		<div class="audit-sample" data-state="上下排列 · 已折叠">
			<div class="audit-sample__label">上下排列 · 已折叠</div>
			<div class="audit-splitter is-tall">
				<Splitter vertical>
					<SplitterPanel>
						<div class="audit-splitter__cell">面板</div>
					</SplitterPanel>
					<SplitterPanel :size="0" collapsible>
						<div class="audit-splitter__cell">已折叠</div>
					</SplitterPanel>
				</Splitter>
			</div>
		</div>
	</div>
</template>
<script setup>
import { Splitter, SplitterPanel } from '@deot/vc';

defineProps({ mobile: Boolean, overlayGeneration: Number });
</script>
<style scoped>
.audit-splitter {
	height: 96px;
	border: 1px solid var(--vc-color-neutral-light);
}

.audit-splitter.is-tall {
	height: 120px;
}

.audit-splitter__cell {
	padding: 12px;
	color: var(--vc-color-dark-light);
	text-align: center;
}
</style>
