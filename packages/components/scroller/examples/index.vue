<!-- 各种布局下的滚动：固定高度、横向、锁定方向（axis）与平滑定位、最大高度、双向、滚动条外置、轨道偏移、嵌套、自适应 -->
<template>
	<div class="scroller-basic">
		<div class="scroller-basic__controls">
			<Select
				v-for="item in CONTROLS"
				:key="item.key"
				v-model="controls[item.key]"
				:data="item.data"
				:label="item.label"
			/>
		</div>

		<h2>Height</h2>
		<Scroller height="200px" v-bind="options">
			<p v-for="item in 2000" :key="item">
				{{ item }}
			</p>
		</Scroller>

		<h2>Horizontal</h2>
		<Scroller v-bind="options">
			<div style="display: flex;">
				<p v-for="item in 50" :key="item" class="is-vertical">
					{{ item }}
				</p>
			</div>
		</Scroller>

		<h2>Axis（axis="x"：纵向滚轮也横向滚动）+ scrollTo duration</h2>
		<div class="scroller-basic__actions">
			<Button @click="scrollAxis('start')">平滑滚到开头</Button>
			<Button @click="scrollAxis('end')">平滑滚到末尾</Button>
		</div>
		<Scroller ref="axisScroller" axis="x" v-bind="options">
			<div style="display: flex;">
				<p v-for="item in 50" :key="item" class="is-vertical">
					{{ item }}
				</p>
			</div>
		</Scroller>

		<h2>MaxHeight</h2>
		<Scroller max-height="200px" v-bind="options">
			<p v-for="item in 20" :key="item">
				{{ item }}
			</p>
		</Scroller>

		<h2>X+Y</h2>
		<Scroller max-height="200px" v-bind="options">
			<div style="display: flex; flex-direction: column;">
				<p v-for="item in 20" :key="item" style="flex: 1;">
					{{ item }}
				</p>
			</div>
			<div style="display: flex;">
				<p v-for="item in 50" :key="item" class="is-vertical">
					{{ item }}
				</p>
			</div>
		</Scroller>

		<h2>bar-to</h2>
		<div class="scroller-basic__bar-to" style="position: relative;">
			<Scroller max-height="200px" v-bind="options" bar-to=".scroller-basic__bar-to">
				<div style="display: flex; flex-direction: column;">
					<p v-for="item in 20" :key="item" style="flex: 1;">
						{{ item }}
					</p>
				</div>
				<div style="display: flex;">
					<p v-for="item in 50" :key="item" class="is-vertical">
						{{ item }}
					</p>
				</div>
			</Scroller>
		</div>

		<h2>X+Y+trackOffset</h2>
		<Scroller
			max-height="200px"
			v-bind="options"
			:track-offset-x="[0, 200, 30, 10]"
			:track-offset-y="[10, 200, 30, 0]"
		>
			<div style="display: flex; flex-direction: column;">
				<p v-for="item in 2000" :key="item" style="flex: 1;">
					{{ item }}
				</p>
			</div>
			<div style="display: flex;">
				<p v-for="item in 500" :key="item" class="is-vertical">
					{{ item }}
				</p>
			</div>
		</Scroller>

		<h2>Nested</h2>
		<Scroller height="200px" v-bind="options">
			<p v-for="item in 20" :key="item">
				{{ item }}
			</p>
			<div style="padding: 0 100px;">
				<Scroller height="200px" v-bind="options">
					<p v-for="item in 20" :key="item">
						{{ item }}
					</p>
				</Scroller>
			</div>
		</Scroller>

		<h2>Auto</h2>
		<Scroller :wheel="options.wheel">
			<p v-for="item in 20" :key="item">
				{{ item }}
			</p>
		</Scroller>
	</div>
</template>
<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { Scroller } from '..';
import { Select } from '../../select';
import { Button } from '../../button';

// 对照项：每项一个 Select
const CONTROLS = [
	{ key: 'wheel', label: 'wheel', data: [{ value: 'off', label: '关闭（跟随原生滚动）' }, { value: 'on', label: '开启（滚轮驱动）' }] },
	{ key: 'native', label: 'native', data: [{ value: 'off', label: 'false（自绘滚动条）' }, { value: 'on', label: 'true（原生滚动条）' }] },
	{ key: 'always', label: 'always', data: [{ value: 'on', label: 'true（始终显示）' }, { value: 'off', label: 'false（悬停显示）' }] }
];
const controls = reactive(Object.fromEntries(CONTROLS.map(({ key, data }) => [key, data[0].value])));
const options = computed(() => ({
	wheel: controls.wheel === 'on',
	native: controls.native === 'on',
	always: controls.always === 'on'
}));

// 平滑滚动：滚动中再次点击、滚动滚轮或拖动滚动条都会取消上一段
const axisScroller = ref();
const scrollAxis = (to) => {
	const scroller = axisScroller.value;
	scroller.scrollTo({ x: to === 'start' ? 0 : scroller.scrollWidth - scroller.clientWidth, duration: 500 });
};

// 右上角的性能读数：切换对照项后清零
window.$perf?.observe();
watch(controls, () => window.$perf?.reset());
onBeforeUnmount(() => window.$perf?.disconnect());
</script>

<style lang="scss">
.scroller-basic {
	padding: 20px;

	&__controls {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;

		// 右上角留给主题与性能读数的按钮
		padding-right: 220px;

		.vc-select {
			width: 240px;
		}
	}

	&__actions {
		display: flex;
		gap: 8px;
		margin-bottom: 8px;
	}

	p {
		display: flex;
		width: 100%;
		height: 50px;
		margin: 10px 0;
		color: #409eff;
		text-align: center;
		background: #ecf5ff;
		border-radius: 4px;
		align-items: center;
		justify-content: center;
	}

	p.is-vertical {
		width: 100px;
		margin: 10px;
		color: #f56c6c;
		background: #fef0f0;
		flex-shrink: 0;
	}
}
</style>
