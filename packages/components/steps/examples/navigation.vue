<template>
	<div style="padding: 20px; background: var(--vc-background-color-lightest);">
		<p>navigation：只支持横向，文字固定在节点右侧</p>
		<Steps v-model="current" type="navigation" clickable style="width: 780px;">
			<Step title="Succeeded" />
			<Step title="Processing" />
			<Step title="Pending" />
		</Steps>

		<p>带描述</p>
		<Steps v-model="current" type="navigation" clickable style="width: 780px;">
			<Step title="Succeeded" description="This is a description" />
			<Step title="Processing" description="This is a description" />
			<Step title="Pending" description="This is a description" />
		</Steps>

		<p>vertical / labelPosition 不生效</p>
		<Steps
			v-model="current"
			type="navigation"
			clickable
			vertical
			label-position="bottom"
			style="width: 780px;"
		>
			<Step title="Succeeded" />
			<Step title="Processing" />
			<Step title="Pending" />
		</Steps>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Steps, Step } from '..';

const current = ref(1);
</script>
