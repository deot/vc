<template>
	<div class="m-divider-demo">
		<h3>基础</h3>
		<div class="m-divider-demo__block">
			<MDivider />
		</div>

		<h3>文字位置</h3>
		<div class="m-divider-demo__block">
			<MDivider>居中文字</MDivider>
			<MDivider placement="left">左侧文字</MDivider>
			<MDivider placement="right">右侧文字</MDivider>
		</div>

		<h3>虚线</h3>
		<div class="m-divider-demo__block">
			<MDivider dashed />
			<MDivider dashed>虚线文字</MDivider>
		</div>

		<h3>灰底容器</h3>
		<div class="m-divider-demo__block is-gray">
			<MDivider>没有更多了</MDivider>
		</div>

		<h3>竖线</h3>
		<div class="m-divider-demo__block m-divider-demo__inline">
			<span>选项一</span>
			<MDivider vertical />
			<span>选项二</span>
			<MDivider vertical dashed />
			<span>选项三</span>
		</div>
	</div>
</template>

<script setup>
import { MDivider } from '../index.m';
</script>

<style>
.m-divider-demo h3 {
	padding: 0 16px;
	margin: 16px 0 8px;
	font-size: 14px;
	font-weight: 400;
	color: var(--vc-color-dark-lightest);
}

.m-divider-demo__block {
	background: var(--vc-background-color-lightest);
}

.m-divider-demo__block.is-gray {
	background: var(--vc-background-color-light);
}

.m-divider-demo__inline {
	padding: 16px;
	font-size: 14px;
}
</style>
