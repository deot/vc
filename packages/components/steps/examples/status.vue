<template>
	<div style="padding: 20px; background: var(--vc-background-color-light);">
		<p>Steps.status 只作用于当前这一步：status="error"，前一步的连线变红</p>
		<Steps :model-value="2" status="error" style="max-width: 780px;">
			<Step title="Succeeded" description="This is a description" />
			<Step title="Failed" description="This is a description" />
			<Step title="Pending" description="This is a description" />
		</Steps>

		<p>Step 单独设置 status 优先：第 3 步为 error，第 4 步为 success</p>
		<Steps :model-value="2" style="max-width: 780px;">
			<Step title="Succeeded" />
			<Step title="Processing" />
			<Step title="Failed" status="error" />
			<Step title="Skipped" status="success" />
		</Steps>

		<p>disabled：clickable 时第 3 步不可点击</p>
		<Steps v-model="current" clickable style="max-width: 780px;">
			<Step title="Succeeded" description="This is a description" />
			<Step title="Processing" description="This is a description" />
			<Step title="Disabled" description="This is a description" disabled />
			<Step title="Pending" description="This is a description" />
		</Steps>

		<p>lineless</p>
		<Steps :model-value="2" lineless style="max-width: 780px;">
			<Step title="Succeeded" description="This is a description" />
			<Step title="Processing" description="This is a description" />
			<Step title="Pending" description="This is a description" />
		</Steps>

		<p>title / description：插槽、函数、字符串（按 HTML 渲染）</p>
		<Steps :model-value="2" style="max-width: 780px;">
			<Step description="描述：字符串">
				<template #title>
					<span>标题：插槽</span>
				</template>
			</Step>
			<Step :title="renderTitle" :description="renderDescription" />
			<Step title="<b>标题：HTML</b>">
				<template #description>
					描述：插槽
				</template>
			</Step>
		</Steps>
	</div>
</template>
<script setup>
import { h, ref } from 'vue';
import { Steps, Step } from '..';

const current = ref(2);
const renderTitle = () => h('span', '标题：函数');
const renderDescription = () => h('span', '描述：函数');
</script>
