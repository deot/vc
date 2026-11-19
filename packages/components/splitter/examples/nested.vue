<template>
	<div class="splitter-example">
		<p>嵌套：外层面板设 :scrollable="false"，让内层 Splitter 用 height: 100% 占满；内层面板各自由 Scroller 滚动</p>

		<div class="splitter-example__box">
			<Splitter>
				<SplitterPanel :size="200" :min="140" :max="320" collapsible>
					<p v-for="i in 20" :key="i" class="row">列表项 {{ i }}</p>
				</SplitterPanel>
				<SplitterPanel :scrollable="false">
					<Splitter vertical>
						<SplitterPanel :min="80">
							<p v-for="i in 20" :key="i" class="row">第 {{ i }} 行内容</p>
						</SplitterPanel>
						<SplitterPanel size="35%" :min="60" collapsible>
							<p v-for="i in 12" :key="i" class="row">输出 {{ i }}</p>
						</SplitterPanel>
					</Splitter>
				</SplitterPanel>
				<SplitterPanel size="25%" :min="120" collapsible>
					<p v-for="i in 8" :key="i" class="row">属性 {{ i }}</p>
				</SplitterPanel>
			</Splitter>
		</div>
	</div>
</template>
<script setup>
import { Splitter, SplitterPanel } from '..';
</script>
<style scoped>
.splitter-example {
	padding: 20px;
}

.splitter-example__box {
	height: 360px;
	border: 1px solid var(--vc-color-neutral-light);
}

.row {
	padding: 4px 12px;
	margin: 0;
	color: var(--vc-color-dark-lighter);
	white-space: nowrap;
}
</style>
