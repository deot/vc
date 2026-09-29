<template>
	<div style="padding: 20px; background: var(--vc-background-color-light);">
		<div class="controls">
			<label>
				<span>vertical</span>
				<Switch v-model="options.vertical" />
			</label>
			<RadioGroup v-model="options.type">
				<Radio value="default">
					default
				</Radio>
				<Radio value="dot">
					dot
				</Radio>
			</RadioGroup>
			<RadioGroup v-model="options.labelPosition">
				<Radio value="right">
					right
				</Radio>
				<Radio value="bottom">
					bottom
				</Radio>
				<Radio value="left">
					left
				</Radio>
				<Radio value="top">
					top
				</Radio>
			</RadioGroup>
		</div>
		<p>
			default 横向支持全部四种位置；纵向只支持 right / left（bottom 视为 right，top 视为 left）；
			dot 横向只支持 bottom / top（right 视为 bottom，left 视为 top）
		</p>

		<p>带描述</p>
		<Steps v-bind="options" :model-value="2" :style="style">
			<Step title="Succeeded" description="This is a description" />
			<Step title="Processing" description="This is a description" />
			<Step title="Pending" description="This is a description" />
		</Steps>

		<p>无描述，第 3 步为 error（第 2 步的连线变红）</p>
		<Steps v-bind="options" :model-value="2" :style="style">
			<Step title="Succeeded" />
			<Step title="Processing" />
			<Step title="Failed" status="error" />
			<Step title="Pending" />
		</Steps>

		<p>长标题 / 长描述</p>
		<Steps v-bind="options" :model-value="1" :style="style">
			<Step title="A very long step title" description="这是一段比较长的中文描述，用来观察描述在不同位置下的换行" />
			<Step title="Processing" description="This is a description" />
			<Step title="Pending" description="This is a description" />
		</Steps>
	</div>
</template>
<script setup>
import { reactive, computed } from 'vue';
import { Switch } from '../../switch';
import { Radio, RadioGroup } from '../../radio';
import { Steps, Step } from '..';

const options = reactive({
	vertical: false,
	type: 'default',
	labelPosition: 'right'
});

const style = computed(() => {
	return options.vertical
		? { width: '360px', margin: '0 0 24px' }
		: { maxWidth: '780px', margin: '0 0 24px' };
});
</script>
<style scoped>
.controls {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 24px;
}

.controls label {
	display: inline-flex;
	align-items: center;
	gap: 8px;
}
</style>
