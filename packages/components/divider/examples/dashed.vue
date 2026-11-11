<template>
	<div class="divider-dashed-demo">
		<h4>虚线</h4>
		<Divider dashed />
		<Divider dashed placement="left">左侧文字</Divider>
		<div>
			<span>选项一</span>
			<Divider vertical dashed />
			<span>选项二</span>
		</div>

		<h4>任意背景：线由伪元素画出，文字两侧留空，不需要底色遮挡</h4>
		<div class="divider-dashed-demo__surface is-gray">
			<Divider>灰底容器</Divider>
		</div>
		<div class="divider-dashed-demo__surface is-dark">
			<Divider dashed placement="right">深色容器</Divider>
		</div>

		<h4>局部变量：线宽、线型、间距</h4>
		<Divider style="--vc-divider-line-width: 2px; --vc-divider-gap: 8px;">2px 线、8px 间距</Divider>
		<Divider style="--vc-divider-line-style: dotted;">点线</Divider>
	</div>
</template>

<script setup>
import { Divider } from '..';
</script>

<style>
.divider-dashed-demo {
	padding: 20px;
}

.divider-dashed-demo__surface {
	padding: 1px 20px;
	border-radius: 8px;
}

.divider-dashed-demo__surface + .divider-dashed-demo__surface {
	margin-top: 12px;
}

.divider-dashed-demo__surface.is-gray {
	background: var(--vc-background-color-light);
}

.divider-dashed-demo__surface.is-dark {
	--vc-divider-color-dark: #E8E8E8;
	--vc-divider-color-neutral-light: #515151;

	background: #252B3A;
}
</style>
