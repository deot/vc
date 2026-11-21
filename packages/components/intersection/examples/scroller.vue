<template>
	<div class="v-intersection-scroller">
		<div class="_bar">
			<span>offset</span>
			<Select v-model="offset" :data="offsets" style="width: 140px;" />
			<span>threshold</span>
			<Select v-model="threshold" :data="thresholds" style="width: 100px;" />
		</div>
		<div class="_row">
			<div class="_col">
				<h3>vc Scroller：{{ states[0] ? '可见' : '不可见' }}</h3>
				<Scroller height="240px" class="_box">
					<div class="_space" />
					<Intersection v-model="states[0]" :offset="offset" :threshold="threshold" class="_target">
						目标
					</Intersection>
					<div class="_space" />
				</Scroller>
			</div>
			<div class="_col">
				<h3>原生滚动：{{ states[1] ? '可见' : '不可见' }}</h3>
				<div class="_box" style="height: 240px; overflow: auto;">
					<div class="_space" />
					<Intersection v-model="states[1]" :offset="offset" :threshold="threshold" class="_target">
						目标
					</Intersection>
					<div class="_space" />
				</div>
			</div>
			<div class="_col">
				<h3>横向滚动：{{ states[2] ? '可见' : '不可见' }}</h3>
				<div class="_box _horizontal">
					<div class="_space" />
					<Intersection v-model="states[2]" :offset="offset" :threshold="threshold" class="_target">
						目标
					</Intersection>
					<div class="_space" />
				</div>
			</div>
		</div>
		<p>offset 作用于最近滚动容器的四边：正数提前判定为可见（预加载），负数要再往里滚才可见</p>
	</div>
</template>
<script setup>
import { ref, reactive } from 'vue';
import { Intersection } from '..';
import { Scroller } from '../../scroller';
import { Select } from '../../select';

const offsets = [
	{ label: '0', value: 0 },
	{ label: '100', value: 100 },
	{ label: '-60', value: -60 },
	{ label: '[100, 0]', value: [100, 0] },
	{ label: '\'50%\'', value: '50%' }
];
const thresholds = [0, 0.5, 1].map(value => ({ label: String(value), value }));

const offset = ref(0);
const threshold = ref(0);
const states = reactive([false, false, false]);
</script>
<style>
.v-intersection-scroller { padding: 20px; }

.v-intersection-scroller ._bar {
	display: flex;
	gap: 8px;
	align-items: center;
	margin-bottom: 12px;
}

.v-intersection-scroller ._row {
	display: flex;
	gap: 16px;
}

.v-intersection-scroller ._col { width: 240px; }

.v-intersection-scroller ._box { background: var(--vc-color-light-deeper); }

.v-intersection-scroller ._space { height: 400px; }

.v-intersection-scroller ._target {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 60px;
	color: #fff;
	background: var(--vc-color-primary);
}

.v-intersection-scroller ._horizontal {
	display: flex;
	height: 240px;
	overflow: auto;
}

.v-intersection-scroller ._horizontal ._space {
	flex: none;
	width: 400px;
	height: auto;
}

.v-intersection-scroller ._horizontal ._target {
	flex: none;
	width: 80px;
	height: auto;
}
</style>
