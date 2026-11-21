<template>
	<div class="v-intersection-mobile">
		<p>offset 为 750 稿长度，可用右上角的 rem 按钮切换 --vc-rem 观察缩放</p>
		<p>页面：{{ states[0] ? '可见' : '不可见' }} · 容器：{{ states[1] ? '可见' : '不可见' }}</p>
		<h3>MScroller 内，offset 200（提前 200 单位判定可见）</h3>
		<MScroller height="400px" class="_box">
			<div class="_space" />
			<MIntersection v-model="states[1]" :offset="200" class="_target">
				目标
			</MIntersection>
			<div class="_space" />
		</MScroller>
		<div class="_space" />
		<MIntersection v-model="states[0]" class="_target">
			页面中的目标
		</MIntersection>
		<div class="_space" />
	</div>
</template>
<script setup>
import { reactive } from 'vue';
import { MScroller } from '../../scroller/index.m';
import { MIntersection } from '../index.m';

const states = reactive([false, false]);
</script>
<style>
.v-intersection-mobile { padding: 0 12px; }

.v-intersection-mobile p {
	position: sticky;
	top: 0;
	z-index: 1;
	padding: 4px 0;
	margin: 0;
	background: var(--vc-color-light);
}

.v-intersection-mobile ._box { background: var(--vc-color-light-deeper); }

.v-intersection-mobile ._space { height: 600px; }

.v-intersection-mobile ._target {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 88px;
	color: #fff;
	background: var(--vc-color-primary);
}
</style>
