<template>
	<div class="v-back-top-scroller">
		<p>按钮相对所在滚动容器的可视区右下角定位；滚动页面让容器移动，按钮随之移动，容器离开视口后隐藏</p>
		<div class="_grid">
			<div>
				<h3>Scroller（滚轮驱动：wheel，native: false）</h3>
				<Scroller height="300px" wheel :native="false" class="_box">
					<div v-for="item in 30" :key="item" class="_row">
						第 {{ item }} 行
					</div>
					<BackTop :visibility-height="100" :right="16" :bottom="16" show-progress />
				</Scroller>
			</div>
			<div>
				<h3>Scroller（原生滚动）</h3>
				<Scroller height="300px" class="_box">
					<div v-for="item in 30" :key="item" class="_row">
						第 {{ item }} 行
					</div>
					<BackTop :visibility-height="100" :right="16" :bottom="16" show-progress />
				</Scroller>
			</div>
			<div>
				<h3>overflow: auto 的元素，portal: false</h3>
				<div class="_box _native">
					<div v-for="item in 30" :key="item" class="_row">
						第 {{ item }} 行
					</div>
					<BackTop :visibility-height="100" :right="16" :bottom="16" show-progress :portal="false" />
				</div>
			</div>
		</div>
		<div class="_space" />
	</div>
</template>
<script setup>
import { Scroller } from '../../scroller';
import { BackTop } from '..';
</script>
<style>
.v-back-top-scroller ._grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 16px;
}

.v-back-top-scroller ._box {
	border: 1px solid var(--vc-color-neutral-light);
}

.v-back-top-scroller ._native {
	height: 300px;
	overflow: auto;
}

.v-back-top-scroller ._row {
	padding: 12px 16px;
	border-bottom: 1px solid var(--vc-color-neutral-light);
}

.v-back-top-scroller ._space { height: 1200px; }
</style>
