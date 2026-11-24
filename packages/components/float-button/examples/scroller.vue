<template>
	<div class="v-float-button-scroller">
		<p>按钮限制在所在滚动容器的可视区内；滚动页面让容器移动，按钮随之移动，容器离开视口后隐藏</p>
		<div class="_grid">
			<div>
				<h3>Scroller，自由拖动 + 吸到四边</h3>
				<Scroller height="300px" class="_box">
					<div v-for="item in 30" :key="item" class="_row">
						第 {{ item }} 行
					</div>
					<FloatButton draggable magnetic icon="service" :gap="16" />
				</Scroller>
			</div>
			<div>
				<h3>overflow: auto 的元素，portal: false，左右吸边</h3>
				<div class="_box _native">
					<div v-for="item in 30" :key="item" class="_row">
						第 {{ item }} 行
					</div>
					<FloatButton draggable magnetic="x" icon="plus" shape="square" :gap="[16, 24]" :portal="false" />
				</div>
			</div>
			<div>
				<h3>draggable: false，指定位置</h3>
				<Scroller height="300px" class="_box">
					<div v-for="item in 30" :key="item" class="_row">
						第 {{ item }} 行
					</div>
					<FloatButton :draggable="false" :offset="{ x: 0, y: 0 }" icon="setting" :gap="16" />
				</Scroller>
			</div>
		</div>
		<div class="_space" />
	</div>
</template>
<script setup>
import { Scroller } from '../../scroller';
import { FloatButton } from '..';
</script>
<style>
.v-float-button-scroller ._grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 16px;
}

.v-float-button-scroller ._box {
	border: 1px solid var(--vc-color-neutral-light);
}

.v-float-button-scroller ._native {
	height: 300px;
	overflow: auto;
}

.v-float-button-scroller ._row {
	padding: 12px 16px;
	border-bottom: 1px solid var(--vc-color-neutral-light);
}

.v-float-button-scroller ._space { height: 1200px; }
</style>
