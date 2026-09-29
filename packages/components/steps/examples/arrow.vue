<template>
	<div style="padding: 20px; background: var(--vc-background-color-light);">
		<p>arrow：只支持横向，没有节点，忽略 labelPosition / renderDot</p>
		<Steps v-model="current" type="arrow" clickable style="max-width: 780px;">
			<Step title="Succeeded" description="This is a description" />
			<Step title="Processing" description="This is a description" />
			<Step title="Pending" description="This is a description" />
		</Steps>

		<p>无描述</p>
		<Steps v-model="current" type="arrow" clickable style="max-width: 780px;">
			<Step title="Succeeded" />
			<Step title="Processing" />
			<Step title="Pending" />
		</Steps>

		<p>status="error"</p>
		<Steps :model-value="2" type="arrow" status="error" style="max-width: 780px;">
			<Step title="Succeeded" description="This is a description" />
			<Step title="Failed" description="This is a description" />
			<Step title="Pending" description="This is a description" />
		</Steps>

		<p>vertical 不生效</p>
		<Steps :model-value="2" type="arrow" vertical style="max-width: 780px;">
			<Step title="Succeeded" />
			<Step title="Processing" />
			<Step title="Pending" />
		</Steps>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Steps, Step } from '..';

const current = ref(2);
</script>
