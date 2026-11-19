<template>
	<div class="splitter-example">
		<p>collapsible 的面板可折叠到 0：点分隔条上的箭头，或拖过 min 的一半吸附；再点箭头恢复折叠前的尺寸。分隔条可聚焦：方向键调整 10px，Home / End 到上下限，Enter 折叠 / 展开</p>
		<p>collapse-change：{{ log || '-' }}</p>

		<h4>两侧</h4>
		<div class="splitter-example__box">
			<Splitter @collapse-change="handleCollapseChange">
				<SplitterPanel :size="200" :min="120" collapsible>
					<div class="cell">面板 A · collapsible · min 120</div>
				</SplitterPanel>
				<SplitterPanel :min="100">
					<div class="cell">面板 B · min 100</div>
				</SplitterPanel>
				<SplitterPanel :size="200" :min="120" collapsible>
					<div class="cell">面板 C · collapsible · min 120</div>
				</SplitterPanel>
			</Splitter>
		</div>

		<h4>只在一侧显示按钮 · 初始折叠</h4>
		<p>size：{{ size }}</p>
		<div class="splitter-example__box">
			<Splitter @collapse-change="handleCollapseChange">
				<SplitterPanel>
					<div class="cell">面板 A</div>
				</SplitterPanel>
				<SplitterPanel v-model:size="size" :min="160" :collapsible="{ start: true }">
					<div class="cell">面板 B · collapsible.start</div>
				</SplitterPanel>
			</Splitter>
		</div>

		<h4>vertical · 不可拖但可折叠</h4>
		<div class="splitter-example__box is-tall">
			<Splitter vertical @collapse-change="handleCollapseChange">
				<SplitterPanel>
					<div class="cell">面板 A</div>
				</SplitterPanel>
				<SplitterPanel size="35%" :resizable="false" collapsible>
					<div class="cell">面板 B · resizable false · collapsible</div>
				</SplitterPanel>
			</Splitter>
		</div>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Splitter, SplitterPanel } from '..';

const size = ref(0);
const log = ref('');

const handleCollapseChange = ({ index, collapsed, sizes }) => {
	log.value = `面板 ${index} ${collapsed ? '折叠' : '展开'} · ${sizes.map(Math.round).join(' / ')}`;
};
</script>
<style scoped>
.splitter-example {
	padding: 20px;
}

.splitter-example__box {
	height: 160px;
	border: 1px solid var(--vc-color-neutral-light);
}

.splitter-example__box.is-tall {
	height: 280px;
}

.cell {
	padding: 16px 12px;
	color: var(--vc-color-dark-lighter);
	text-align: center;
}
</style>
