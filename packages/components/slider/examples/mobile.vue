<template>
	<div class="m-slider-demo">
		<div class="m-slider-demo__title">
			基础用法：按住滑块时显示气泡，松开收起
		</div>
		<div class="m-slider-demo__block">
			<MSlider v-model="value1" />
		</div>

		<div class="m-slider-demo__title">
			禁用
		</div>
		<div class="m-slider-demo__block">
			<MSlider v-model="value2" disabled />
		</div>

		<div class="m-slider-demo__title">
			范围选择
		</div>
		<div class="m-slider-demo__block">
			<MSlider v-model="value3" range />
		</div>

		<div class="m-slider-demo__title">
			标签：只能落在标签上（step 为 null）
		</div>
		<div class="m-slider-demo__block">
			<MSlider v-model="value4" :max="20" :step="null" :marks="marks" />
		</div>

		<div class="m-slider-demo__title">
			步长刻度
		</div>
		<div class="m-slider-demo__block">
			<MSlider v-model="value5" :step="10" ticks="dot" />
		</div>

		<div class="m-slider-demo__title">
			一直显示气泡
		</div>
		<div class="m-slider-demo__block is-tooltip">
			<MSlider v-model="value6" tooltip="always" />
		</div>

		<div class="m-slider-demo__title">
			范围 + 一直显示气泡（自定义文案）
		</div>
		<div class="m-slider-demo__block is-tooltip">
			<MSlider v-model="value7" :max="10" range tooltip="always" :formatter="formatThousand" />
		</div>

		<div class="m-slider-demo__title">
			输入框（MInputNumber）
		</div>
		<div class="m-slider-demo__block">
			<MSlider v-model="value8" show-input />
		</div>

		<div class="m-slider-demo__title">
			自定义颜色与粗细（局部变量）
		</div>
		<div class="m-slider-demo__block">
			<MSlider v-model="value9" class="m-slider-demo__custom" />
		</div>

		<div class="m-slider-demo__title">
			自定义滑块
		</div>
		<div class="m-slider-demo__block">
			<MSlider v-model="value10">
				<template #thumb="{ value }">
					<span class="m-slider-demo__thumb">{{ value }}</span>
				</template>
			</MSlider>
		</div>

		<div class="m-slider-demo__title">
			垂直方向
		</div>
		<div class="m-slider-demo__block is-vertical">
			<MSlider v-model="value11" vertical />
			<MSlider v-model="value12" vertical range :marks="verticalMarks" />
		</div>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MSlider } from '../index.m';

const value1 = ref(40);
const value2 = ref(30);
const value3 = ref([15, 45]);
const value4 = ref(5);
const value5 = ref(30);
const value6 = ref(32);
const value7 = ref([1, 6]);
const value8 = ref(20);
const value9 = ref(30);
const value10 = ref(32);
const value11 = ref(40);
const value12 = ref([25, 75]);

const marks = { 0: '0', 5: '5', 10: '10', 15: '15', 20: '20' };
const verticalMarks = { 0: '0', 50: '50', 100: '100' };

const formatThousand = value => `${value} 千`;
</script>

<style lang="scss">
.m-slider-demo {
	min-height: 100vh;
	padding-bottom: 24px;
	background: var(--vc-background-color-light);

	&__title {
		padding: calc(var(--vc-rem) * 24) calc(var(--vc-rem) * 32);
		font-size: calc(var(--vc-rem) * 28);
		color: var(--vc-color-dark-extralight);
	}

	&__block {
		background: var(--vc-background-color-lightest);

		// 一直显示的气泡在滑块上方，留出它的高度
		&.is-tooltip {
			padding-top: calc(var(--vc-rem) * 72);
		}

		&.is-vertical {
			display: flex;
			padding: calc(var(--vc-rem) * 32) 0;
			justify-content: space-around;
		}
	}

	&__custom {
		--vc-slider-track-size: calc(var(--vc-rem) * 8);
		--vc-slider-color-primary: var(--vc-color-warning);
	}

	&__thumb {
		display: flex;
		min-width: calc(var(--vc-rem) * 72);
		height: calc(var(--vc-rem) * 44);
		padding: 0 calc(var(--vc-rem) * 12);
		font-size: calc(var(--vc-rem) * 24);
		color: var(--vc-color-contrast-light);
		background: var(--vc-color-primary);
		border-radius: calc(var(--vc-rem) * 22);
		box-sizing: border-box;
		align-items: center;
		justify-content: center;
	}
}
</style>
