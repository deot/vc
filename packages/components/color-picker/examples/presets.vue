<template>
	<div class="v-color-picker-presets">
		<section>
			<h4>内置预设色</h4>
			<p>colors 为 true 时使用内置的 {{ ColorPicker.colors.length }} 个颜色（ColorPicker.colors）。</p>
			<div class="v-color-picker-presets__row">
				<ColorPicker v-model="builtin" colors />
				<span>{{ builtin }}</span>
			</div>
		</section>

		<section>
			<h4>自定义预设色</h4>
			<p>任意可解析的格式都可以，带透明度的色块下垫棋盘格；无法解析的项（这里的 "xyz"）会被跳过。Tab 可聚焦色块，Enter / 空格选中。</p>
			<div class="v-color-picker-presets__row">
				<ColorPicker v-model="custom" alpha :colors="CUSTOM" />
				<span>{{ custom }}</span>
			</div>
		</section>

		<section>
			<h4>扩展内置色</h4>
			<p>在 ColorPicker.colors 基础上追加。</p>
			<div class="v-color-picker-presets__row">
				<ColorPicker v-model="extended" :colors="EXTENDED" />
				<span>{{ extended }}</span>
			</div>
		</section>

		<section>
			<h4>只选预设色</h4>
			<p>关闭色板、色相条和输入框。</p>
			<div class="v-color-picker-presets__row">
				<ColorPicker
					v-model="only"
					:colors="CUSTOM.slice(0, 7)"
					:panel="false"
					:hue="false"
					:editable="false"
				/>
				<span>{{ only }}</span>
			</div>
		</section>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { ColorPicker } from '..';

const CUSTOM = [
	'#FF4500',
	'#FF8C00',
	'#FFD700',
	'#90EE90',
	'#00CED1',
	'#1E90FF',
	'#C71585',
	'rgba(255, 69, 0, 0.68)',
	'rgb(255 120 0)',
	'hsv(51, 100%, 98%)',
	'hsva(120, 40%, 94%, 0.5)',
	'hsl(181, 100%, 37%)',
	'hsla(209, 100%, 56%, 0.73)',
	'#1E90FF80',
	'transparent',
	'xyz'
];
const EXTENDED = [...ColorPicker.colors, '#7B61FF', '#00B8D9'];

const builtin = ref('#5495F6');
const custom = ref('hsva(120, 40%, 94%, 0.5)');
const extended = ref('#7B61FF');
const only = ref('#FF4500');
</script>
<style lang="scss">
.v-color-picker-presets {
	display: grid;
	gap: 24px;
	padding: 20px;

	h4 {
		margin: 0 0 8px;
		font-weight: 500;
	}

	p {
		margin: 0 0 12px;
	}

	.v-color-picker-presets__row {
		display: flex;
		gap: 12px;
		align-items: center;
	}
}
</style>
