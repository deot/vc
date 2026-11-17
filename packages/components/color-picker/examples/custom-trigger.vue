<template>
	<div class="v-color-picker-trigger">
		<section>
			<h4>按钮</h4>
			<p>默认插槽替换触发器，参数 { value, color }：value 为 v-model 原值，color 可直接用于 CSS（hsv 也已转换）。</p>
			<ColorPicker v-model="buttonColor" alpha format="hsv">
				<template #default="{ value, color }">
					<Button>
						<span class="v-color-picker-trigger__dot" :style="{ background: color || 'transparent' }" />
						{{ value || '选择颜色' }}
					</Button>
				</template>
			</ColorPicker>
		</section>

		<section>
			<h4>文字颜色</h4>
			<p>工具栏式的触发器，下划线显示当前颜色。</p>
			<ColorPicker v-model="textColor" :colors="true">
				<template #default="{ color }">
					<span class="v-color-picker-trigger__text" :style="{ borderColor: color }">A</span>
				</template>
			</ColorPicker>
			<p :style="{ color: textColor }">示例文字</p>
		</section>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { ColorPicker } from '..';
import { Button } from '../../button';

const buttonColor = ref('hsva(210, 80%, 90%, 0.8)');
const textColor = ref('#F5222D');
</script>
<style lang="scss">
.v-color-picker-trigger {
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

	.v-color-picker-trigger__dot {
		display: inline-block;
		width: 12px;
		height: 12px;
		margin-right: 6px;
		border-radius: 50%;
		box-shadow: inset 0 0 0 1px rgb(0 0 0 / 15%);
	}

	.v-color-picker-trigger__text {
		display: inline-block;
		padding: 0 6px;
		font-size: 16px;
		font-weight: 600;
		line-height: 24px;
		cursor: pointer;
		border-bottom: 3px solid;
	}
}
</style>
