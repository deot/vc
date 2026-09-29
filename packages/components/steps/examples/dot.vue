<template>
	<div style="padding: 20px; background: var(--vc-background-color-light);">
		<div class="controls">
			<Button :disabled="current <= 1" @click="current--">
				上一步
			</Button>
			<Button :disabled="current >= 3" @click="current++">
				下一步
			</Button>
		</div>

		<p>横向：文字在圆点下方（默认）</p>
		<Steps v-model="current" type="dot" style="max-width: 780px;">
			<Step title="Succeeded" description="This is a description" />
			<Step title="Processing" description="This is a description" />
			<Step title="Pending" description="This is a description" />
		</Steps>

		<p>横向：label-position="top"</p>
		<Steps v-model="current" type="dot" label-position="top" style="max-width: 780px;">
			<Step title="Succeeded" description="This is a description" />
			<Step title="Processing" description="This is a description" />
			<Step title="Pending" description="This is a description" />
		</Steps>

		<div class="columns">
			<div>
				<p>纵向：文字在右侧（默认）</p>
				<Steps v-model="current" type="dot" vertical>
					<Step title="Succeeded" description="This is a description" />
					<Step title="Processing" description="This is a description" />
					<Step title="Pending" description="This is a description" />
				</Steps>
			</div>
			<div>
				<p>纵向：label-position="left"</p>
				<Steps
					v-model="current"
					type="dot"
					vertical
					label-position="left"
					style="width: 240px;"
				>
					<Step title="Succeeded" description="This is a description" />
					<Step title="Processing" description="This is a description" />
					<Step title="Pending" description="This is a description" />
				</Steps>
			</div>
		</div>

		<p>renderDot：dot 为默认节点，可包一层（悬停查看）</p>
		<Steps v-model="current" type="dot" :render-dot="renderDot" style="max-width: 780px;">
			<Step title="Succeeded" description="This is a description" />
			<Step title="Processing" description="This is a description" />
			<Step title="Pending" description="This is a description" />
		</Steps>

		<p>dot 插槽（优先于 renderDot）：非 dot 类型同样可用，第 2 步替换为图标</p>
		<Steps v-model="current" :render-dot="renderDot" style="max-width: 780px;">
			<Step title="Succeeded" description="This is a description" />
			<Step title="Processing" description="This is a description" />
			<Step title="Pending" description="This is a description" />
			<template #dot="{ index, dot }">
				<Icon v-if="index === 2" type="search" class="custom-dot" />
				<component :is="dot" v-else />
			</template>
		</Steps>
	</div>
</template>
<script setup>
import { h, ref } from 'vue';
import { Button } from '../../button';
import { Icon } from '../../icon';
import { Popover } from '../../popover';
import { Steps, Step } from '..';

const current = ref(2);

const renderDot = ({ index, status, dot }) => {
	return h(Popover, { content: `Step: ${index}, ${status}`, placement: 'top' }, () => dot);
};
</script>
<style scoped>
.controls {
	display: flex;
	align-items: center;
	gap: 16px;
}

.columns {
	display: flex;
	gap: 80px;
}

.custom-dot {
	width: 28px;
	font-size: 20px;
	line-height: 28px;
	color: var(--vc-color-primary);
	text-align: center;
}
</style>
