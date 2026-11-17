<template>
	<div class="v-color-picker-example">
		<div class="v-color-picker-example__controls">
			<Select
				v-for="item in CONTROLS"
				:key="item.key"
				v-model="controls[item.key]"
				:data="item.data"
				:label="item.label"
			/>
		</div>

		<section>
			<h4>属性组合</h4>
			<p>confirm 关闭时选色即提交；开启后点「确定」提交，点外部关闭放弃修改。悬停触发器可清除。</p>
			<div class="v-color-picker-example__row">
				<ColorPicker
					v-model="color"
					:size="controls.size"
					:confirm="controls.confirm"
					:clearable="controls.clearable"
					:editable="controls.editable"
					:alpha="controls.alpha"
					:format="controls.format === 'auto' ? undefined : controls.format"
					:disabled="controls.disabled"
					:null-value="null"
					@change="logs.change = $event"
					@color-change="logs.colorChange = $event"
					@clear="logs.clear++"
				/>
			</div>
			<ul>
				<li>v-model：{{ color === null ? 'null' : color }}</li>
				<li>change：{{ logs.change ?? '-' }}</li>
				<li>color-change：{{ logs.colorChange ?? '-' }}</li>
				<li>clear 次数：{{ logs.clear }}</li>
			</ul>
		</section>

		<section>
			<h4>尺寸</h4>
			<p>高度与 Button 四档一致（22 / 26 / 32 / 38）。</p>
			<div class="v-color-picker-example__row">
				<ColorPicker v-for="size in SIZES" :key="size" v-model="sizeColor" :size="size" />
				<Button v-for="size in SIZES" :key="`button-${size}`" :size="size">{{ size }}</Button>
			</div>
		</section>

		<section>
			<h4>透明色与空值</h4>
			<p>透明色下垫棋盘格；未选择时显示斜线；hsv 这类 CSS 不支持的格式也能正确显示。</p>
			<div class="v-color-picker-example__row">
				<ColorPicker v-model="alphaColor" alpha />
				<ColorPicker v-model="emptyColor" />
				<ColorPicker v-model="hsvColor" alpha format="hsv" />
				<span>{{ alphaColor }} / {{ emptyColor || '空' }} / {{ hsvColor }}</span>
			</div>
		</section>
	</div>
</template>
<script setup>
import { reactive, ref } from 'vue';
import { ColorPicker } from '..';
import { Select } from '../../select';
import { Button } from '../../button';

const toggle = label => [{ value: false, label: `${label}：关` }, { value: true, label: `${label}：开` }];

const CONTROLS = [
	{ key: 'size', label: '尺寸', data: ['medium', 'mini', 'small', 'large'].map(value => ({ value, label: value })) },
	{ key: 'confirm', label: 'confirm', data: toggle('confirm') },
	{ key: 'clearable', label: 'clearable', data: toggle('clearable').reverse() },
	{ key: 'editable', label: 'editable', data: toggle('editable').reverse() },
	{ key: 'alpha', label: 'alpha', data: toggle('alpha') },
	{
		key: 'format',
		label: 'format',
		data: [{ value: 'auto', label: 'format：默认' }, ...['hex', 'rgb', 'hsl', 'hsv'].map(value => ({ value, label: `format：${value}` }))]
	},
	{ key: 'disabled', label: 'disabled', data: toggle('disabled') }
];
const SIZES = ['mini', 'small', 'medium', 'large'];

const controls = reactive(Object.fromEntries(CONTROLS.map(({ key, data }) => [key, data[0].value])));
const logs = reactive({ change: undefined, colorChange: undefined, clear: 0 });

const color = ref('#1DB88C');
const sizeColor = ref('#5495F6');
const alphaColor = ref('rgba(19, 206, 102, 0.4)');
const emptyColor = ref('');
const hsvColor = ref('hsva(180, 65%, 20%, 0.5)');
</script>
<style lang="scss">
.v-color-picker-example {
	display: grid;
	gap: 24px;
	padding: 20px;

	h4 {
		margin: 0 0 8px;
		font-weight: 500;
	}

	p, ul {
		margin: 0 0 12px;
	}

	.v-color-picker-example__controls {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		max-width: calc(100% - 220px);

		.vc-select {
			width: 150px;
		}
	}

	.v-color-picker-example__row {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		align-items: center;
	}
}
</style>
