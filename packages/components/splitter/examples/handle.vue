<template>
	<div class="splitter-example">
		<p>自定义分隔条：--vc-splitter-bar-size 调整占位厚度，#handle 插槽替换中间的把手（{ index, vertical, dragging }）</p>

		<div class="splitter-example__box">
			<Splitter class="thick-splitter">
				<SplitterPanel :min="80">
					<div class="cell">面板 A</div>
				</SplitterPanel>
				<SplitterPanel :min="80">
					<div class="cell">面板 B</div>
				</SplitterPanel>
				<SplitterPanel :min="80">
					<div class="cell">面板 C</div>
				</SplitterPanel>
				<template #handle="{ dragging }">
					<span class="thick-splitter__handle is-rotated" :class="{ 'is-dragging': dragging }">
						<Icon type="drag" />
					</span>
				</template>
			</Splitter>
		</div>

		<h4>vertical</h4>
		<div class="splitter-example__box is-tall">
			<Splitter class="thick-splitter" vertical>
				<SplitterPanel>
					<div class="cell">面板 A</div>
				</SplitterPanel>
				<SplitterPanel>
					<div class="cell">面板 B</div>
				</SplitterPanel>
				<template #handle="{ dragging }">
					<span class="thick-splitter__handle" :class="{ 'is-dragging': dragging }">
						<Icon type="drag" />
					</span>
				</template>
			</Splitter>
		</div>
	</div>
</template>
<script setup>
import { Icon } from '../../icon';
import { Splitter, SplitterPanel } from '..';
</script>
<style scoped>
.splitter-example {
	padding: 20px;
}

.splitter-example__box {
	height: 200px;
	border: 1px solid var(--vc-color-neutral-light);
}

.splitter-example__box.is-tall {
	height: 280px;
}

.thick-splitter {
	--vc-splitter-bar-size: 8px;
}

.thick-splitter__handle {
	display: flex;
	font-size: 12px;
	color: var(--vc-color-dark-lightest);
	align-items: center;
	flex-direction: column;
}

/* 横向排列时分隔条是竖线，图标转成竖向 */
.thick-splitter__handle.is-rotated {
	transform: rotate(90deg);
}

.thick-splitter__handle.is-dragging {
	color: #fff;
}

.cell {
	padding: 16px 12px;
	color: var(--vc-color-dark-lighter);
	text-align: center;
}
</style>
