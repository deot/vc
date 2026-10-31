<template>
	<div class="alert-demo">
		<h1>Alert</h1>

		<h3>基础</h3>
		<Alert title="这是一条普通提示信息。" />
		<Alert type="success" title="操作已经顺利完成。" />
		<Alert type="warning" title="当前操作可能影响已有数据。" />
		<Alert type="error" title="操作失败，请稍后重试。" />

		<h3>标题 + 说明</h3>
		<Alert title="信息提示" description="这是一条需要关注的信息，说明文字使用次级颜色展示。" />
		<Alert type="success" title="成功提示" description="操作已经顺利完成。" />
		<Alert type="warning" title="警告提示" description="当前操作可能影响已有数据。" />
		<Alert type="error" title="错误提示" description="操作失败，请稍后重试。" />

		<h3>可关闭</h3>
		<Alert title="这是一条可关闭的提示信息。" closable />
		<Alert type="warning" title="警告提示" closable>
			<template #description>
				当前操作可能影响已有数据，关闭后不再提示。
			</template>
		</Alert>
		<Alert v-model="visible" type="success" title="自定义关闭入口" closable>
			<template #close>
				<span class="alert-demo__close">知道了</span>
			</template>
		</Alert>
		<span v-if="!visible" class="alert-demo__reset" @click="visible = true">重新显示</span>

		<h3>无图标 / 自定义图标</h3>
		<Alert :icon="false" title="不显示图标的提示信息。" />
		<Alert :icon="false" title="不显示图标" description="仅保留标题与说明文字。" />
		<Alert icon="search" title="使用指定图标的提示信息。" />

		<h3>强调文字</h3>
		<Alert type="warning">
			已选择<em>12</em>项，其中<em>3</em>项将被跳过。
		</Alert>

		<h3>长文本</h3>
		<Alert
			closable
			:title="longText"
		/>
		<Alert
			type="error"
			title="长文本说明"
			closable
			:description="longText"
		/>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Alert } from '..';

const visible = ref(true);
const longText = '这是一段较长的提示文字，用于检查换行后图标、标题与关闭入口是否仍与首行对齐。'.repeat(4);
</script>

<style scoped>
.alert-demo {
	display: grid;
	gap: 12px;
	padding: 20px;
}

.alert-demo h3 {
	margin: 12px 0 0;
}

.alert-demo__close {
	font-size: 13px;
	color: var(--vc-color-primary);
}

.alert-demo__reset {
	font-size: 13px;
	color: var(--vc-color-primary);
	cursor: pointer;
	justify-self: start;
}
</style>
