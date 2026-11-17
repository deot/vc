<template>
	<div class="v-color-picker-view-example">
		<div class="v-color-picker-view-example__controls">
			<Select
				v-for="item in CONTROLS"
				:key="item.key"
				v-model="controls[item.key]"
				:data="item.data"
				:label="item.label"
			/>
		</div>

		<p>
			ColorPicker.View 是没有浮层的选色区域，用户操作即触发 change；父组件改值或切换 format 不回抛事件。
			键盘：色板 ← → 调饱和度、↑ ↓ 调明度（Shift 一次 10）；色相 / 透明度条与 Slider 相同（方向键、PageUp / PageDown、Home / End）。
			鼠标按住色相 / 透明度条的任意位置即可拖动。
		</p>

		<div class="v-color-picker-view-example__body">
			<ColorPicker.View
				v-model="color"
				class="v-color-picker-view-example__view"
				:alpha="controls.alpha"
				:format="controls.format"
				:colors="controls.colors"
				@change="handleChange"
			/>
			<ul>
				<li>v-model：{{ color }}</li>
				<li>change 次数：{{ count }}</li>
				<li>通道：{{ channels }}</li>
				<li>
					外部改值：
					<Button size="small" @click="color = '#1E90FF'">#1E90FF</Button>
					<Button size="small" @click="color = 'rebeccapurple'">rebeccapurple</Button>
				</li>
			</ul>
		</div>
	</div>
</template>
<script setup>
import { reactive, ref } from 'vue';
import { ColorPicker } from '..';
import { Select } from '../../select';
import { Button } from '../../button';

const CONTROLS = [
	{ key: 'alpha', label: 'alpha', data: [{ value: true, label: 'alpha：开' }, { value: false, label: 'alpha：关' }] },
	{ key: 'format', label: 'format', data: ['hex', 'rgb', 'hsl', 'hsv'].map(value => ({ value, label: `format：${value}` })) },
	{ key: 'colors', label: 'colors', data: [{ value: true, label: '预设：内置' }, { value: false, label: '预设：无' }] }
];
const controls = reactive(Object.fromEntries(CONTROLS.map(({ key, data }) => [key, data[0].value])));

const color = ref('#13CE6699');
const count = ref(0);
const channels = ref('-');

const handleChange = (value, instance) => {
	const { hue, saturation, value: brightness, opacity } = instance.states;
	count.value++;
	channels.value = `H ${hue} / S ${Math.round(saturation)} / V ${Math.round(brightness)} / A ${Math.round(opacity)}`;
};
</script>
<style lang="scss">
.v-color-picker-view-example {
	display: grid;
	gap: 16px;
	padding: 20px;

	p, ul {
		margin: 0;
	}

	.v-color-picker-view-example__controls {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		max-width: calc(100% - 220px);

		.vc-select {
			width: 150px;
		}
	}

	.v-color-picker-view-example__body {
		display: flex;
		flex-wrap: wrap;
		gap: 24px;
		align-items: flex-start;
	}

	.v-color-picker-view-example__view {
		width: 240px;
	}

	li {
		margin-bottom: 8px;
	}
}
</style>
