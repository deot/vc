<template>
	<div class="splitter-example">
		<p>拖动分隔条调整相邻两个面板。数字为 px，容器变化时保持像素；% 与未设的面板随容器等比缩放。面板内容由内置的 Scroller 滚动，挤压时不出现原生滚动条</p>
		<div class="splitter-example__controls">
			<label>容器宽度：{{ width }}%</label>
			<Slider v-model="width" :min="40" :max="100" />
		</div>

		<h4>px + 未设</h4>
		<p>size：{{ side }} · sizes：{{ sizes.join(' / ') || '-' }}</p>
		<div class="splitter-example__box" :style="{ width: `${width}%` }">
			<Splitter @resize="handleResize" @resize-end="handleResize">
				<SplitterPanel v-model:size="side" :min="120" :max="360">
					<div class="cell">面板 A · min 120 · max 360</div>
				</SplitterPanel>
				<SplitterPanel>
					<div class="cell">面板 B</div>
					<p v-for="i in 12" :key="i" class="row">第 {{ i }} 行内容，用来演示面板变窄、变矮后由 Scroller 滚动</p>
				</SplitterPanel>
			</Splitter>
		</div>

		<h4>% + 未设 + px</h4>
		<p>size：{{ first }} · {{ third }}</p>
		<div class="splitter-example__box" :style="{ width: `${width}%` }">
			<Splitter>
				<SplitterPanel v-model:size="first" min="10%">
					<div class="cell">面板 A · min 10%</div>
				</SplitterPanel>
				<SplitterPanel :min="80">
					<div class="cell">面板 B · min 80</div>
				</SplitterPanel>
				<SplitterPanel v-model:size="third" :resizable="false">
					<div class="cell">面板 C · 不可拖</div>
				</SplitterPanel>
			</Splitter>
		</div>

		<h4>vertical</h4>
		<div class="splitter-example__box is-tall" :style="{ width: `${width}%` }">
			<Splitter vertical>
				<SplitterPanel size="40%">
					<div class="cell">面板 A</div>
				</SplitterPanel>
				<SplitterPanel>
					<div class="cell">面板 B</div>
				</SplitterPanel>
			</Splitter>
		</div>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Slider } from '../../slider';
import { Splitter, SplitterPanel } from '..';

const width = ref(100);
const side = ref(200);
const first = ref('30%');
const third = ref(160);
const sizes = ref([]);

const handleResize = (e) => {
	sizes.value = e.sizes.map(Math.round);
};
</script>
<style scoped>
.splitter-example {
	padding: 20px;
}

.splitter-example__controls {
	width: 320px;
}

.splitter-example__box {
	height: 160px;
	border: 1px solid var(--vc-color-neutral-light);
}

.splitter-example__box.is-tall {
	height: 280px;
}

.row {
	padding: 4px 12px;
	margin: 0;
	white-space: nowrap;
}

.cell {
	padding: 16px 12px;
	color: var(--vc-color-dark-lighter);
	text-align: center;
}
</style>
