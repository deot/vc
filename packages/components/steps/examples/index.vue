<template>
	<div style="padding: 20px; background: var(--vc-background-color-lightest);">
		<div class="controls">
			<Button :disabled="current <= 0" @click="current--">
				上一步
			</Button>
			<Button :disabled="current >= 4" @click="current++">
				下一步
			</Button>
			<span>modelValue: {{ current }}</span>
		</div>
		<p>modelValue 从 1 开始：之前的步骤为 success，当前步为 pending，之后为 default；0 表示都未开始，4 表示全部完成</p>
		<Steps v-model="current" style="max-width: 780px;">
			<Step title="Succeeded" />
			<Step title="Processing" />
			<Step title="Pending" />
		</Steps>

		<p>描述</p>
		<Steps v-model="current" style="max-width: 780px;">
			<Step title="Succeeded" description="This is a description" />
			<Step title="Processing" description="This is a description" />
			<Step title="Pending" description="This is a description" />
		</Steps>

		<p>clickable：点击步骤切换（当前步不触发 change）</p>
		<Steps v-model="current" clickable style="max-width: 780px;" @change="handleChange">
			<Step title="Succeeded" description="This is a description" />
			<Step title="Processing" description="This is a description" />
			<Step title="Pending" description="This is a description" />
		</Steps>
		<p>change: {{ changes.join(', ') || '-' }}</p>

		<p>v-for 生成的步骤（与静态步骤混排），非 Step 的节点会被忽略</p>
		<Steps v-model="current" style="max-width: 780px;">
			<Step title="Static" />
			<Step
				v-for="item in list"
				:key="item"
				:title="item"
			/>
			<span>ignored</span>
		</Steps>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Button } from '../../button';
import { Steps, Step } from '..';

const current = ref(2);
const changes = ref([]);
const list = ['v-for 1', 'v-for 2'];

const handleChange = (v) => {
	changes.value.push(v);
};
</script>
<style scoped>
.controls {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 16px;
}
</style>
