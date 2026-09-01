<template>
	<div class="alert-demo">
		<h1>Alert</h1>
		<Alert title="信息提示" desc="这是一条需要关注的信息。" />
		<Alert type="success" title="成功提示" desc="操作已经顺利完成。" />
		<Alert type="error" title="错误提示" desc="操作失败，请稍后重试。" />
		<Alert type="warning" title="警告提示" closable>
			<template #desc>
				当前操作可能影响已有数据。
			</template>
		</Alert>
	</div>
</template>

<script setup>
import { Alert } from '..';
</script>

<style scoped>
.alert-demo {
	display: grid;
	gap: 12px;
	padding: 20px;
}
</style>
