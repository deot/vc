<template>
	<div class="v-slider-layout">
		<div class="v-slider-layout__controls">
			<label>
				<span>vertical</span>
				<Switch v-model="options.vertical" />
			</label>
			<label>
				<span>inverted</span>
				<Switch v-model="options.inverted" />
			</label>
			<RadioGroup v-model="options.ticks">
				<Radio value="none">
					ticks: none
				</Radio>
				<Radio value="dot">
					dot
				</Radio>
				<Radio value="line">
					line
				</Radio>
			</RadioGroup>
			<RadioGroup v-model="size">
				<Radio value="default">
					size: default
				</Radio>
				<Radio value="medium">
					4px / 14px
				</Radio>
				<Radio value="large">
					6px / 18px
				</Radio>
			</RadioGroup>
			<RadioGroup v-model="options.tooltipPlacement">
				<Radio value="auto">
					placement: auto
				</Radio>
				<Radio value="top">
					top
				</Radio>
				<Radio value="right">
					right
				</Radio>
				<Radio value="bottom">
					bottom
				</Radio>
				<Radio value="left">
					left
				</Radio>
			</RadioGroup>
		</div>

		<div :class="['v-slider-layout__stage', { 'is-vertical': options.vertical }]" :style="sizes[size]">
			<div class="v-slider-layout__item">
				<div>单值：{{ value1 }}</div>
				<Slider v-model="value1" v-bind="bindings" :step="10" />
			</div>
			<div class="v-slider-layout__item">
				<div>范围：{{ value2.join(' – ') }}</div>
				<Slider v-model="value2" v-bind="bindings" :step="10" range />
			</div>
			<div class="v-slider-layout__item">
				<div>禁用</div>
				<Slider v-model="value3" v-bind="bindings" :step="10" range disabled />
			</div>
		</div>
	</div>
</template>
<script setup>
import { computed, reactive, ref } from 'vue';
import { Switch } from '../../switch';
import { Radio, RadioGroup } from '../../radio';
import { Slider } from '..';

const options = reactive({
	vertical: true,
	inverted: false,
	ticks: 'dot',
	tooltipPlacement: 'auto'
});

// auto 时不传，交给组件按方向决定
const bindings = computed(() => ({
	...options,
	tooltipPlacement: options.tooltipPlacement === 'auto' ? undefined : options.tooltipPlacement
}));

// 局部参数 --vc-slider-track-size / --vc-slider-thumb-size，可写在任意祖先或组件自身
const size = ref('default');
const sizes = {
	default: {},
	medium: { '--vc-slider-track-size': '4px', '--vc-slider-thumb-size': '14px' },
	large: { '--vc-slider-track-size': '6px', '--vc-slider-thumb-size': '18px' }
};

const value1 = ref(30);
const value2 = ref([20, 60]);
const value3 = ref([20, 60]);
</script>
<style scoped>
.v-slider-layout {
	padding: 24px;
}

.v-slider-layout__controls {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 24px;
	margin-bottom: 24px;
}

.v-slider-layout__controls label {
	display: inline-flex;
	align-items: center;
	gap: 8px;
}

.v-slider-layout__stage {
	display: grid;
	max-width: 520px;
	gap: 24px;
}

.v-slider-layout__stage.is-vertical {
	display: flex;
	max-width: none;
	gap: 64px;
}

.v-slider-layout__item {
	display: flex;
	flex-direction: column;
	gap: 8px;
}
</style>
