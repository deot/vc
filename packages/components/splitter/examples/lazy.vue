<template>
	<div class="splitter-example">
		<p>lazy：拖动时只移动预览线，松开再应用尺寸。面板里用 Resizer 统计尺寸变化次数，对比两种模式下内容重新布局的次数</p>
		<div class="splitter-example__controls">
			<Select v-model="lazy" :data="MODES" label="模式" />
			<span class="splitter-example__count">面板 A 尺寸变化：{{ count }} 次</span>
		</div>

		<div class="splitter-example__box">
			<Splitter :key="String(lazy)" :lazy="lazy">
				<SplitterPanel size="40%" :min="120" collapsible>
					<Resizer @resize="count++">
						<template #default="{ width }">
							<div class="cell">面板 A · {{ Math.round(width) }}px</div>
						</template>
					</Resizer>
				</SplitterPanel>
				<SplitterPanel :min="120">
					<div class="cell">面板 B</div>
				</SplitterPanel>
			</Splitter>
		</div>
	</div>
</template>
<script setup>
import { ref, watch } from 'vue';
import { Select } from '../../select';
import { Resizer } from '../../resizer';
import { Splitter, SplitterPanel } from '..';

const MODES = [
	{ value: true, label: 'lazy' },
	{ value: false, label: '实时' }
];
const lazy = ref(true);
const count = ref(0);

watch(lazy, () => (count.value = 0));
</script>
<style scoped>
.splitter-example {
	padding: 20px;
}

.splitter-example__controls {
	display: flex;
	gap: 12px;
	align-items: center;
	margin-bottom: 12px;
}

.splitter-example__controls .vc-select {
	width: 200px;
}

.splitter-example__box {
	height: 200px;
	border: 1px solid var(--vc-color-neutral-light);
}

.cell {
	padding: 16px 12px;
	color: var(--vc-color-dark-lighter);
	text-align: center;
}
</style>
