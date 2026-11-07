<template>
	<div class="m-button-demo">
		<h3>尺寸（随 --vc-rem 缩放，375 宽下 28 / 32 / 36 / 44）</h3>
		<div class="m-button-demo__row">
			<MButton type="primary" size="mini">
				mini
			</MButton>
			<MButton type="primary" size="small">
				small
			</MButton>
			<MButton type="primary">
				medium
			</MButton>
			<MButton type="primary" size="large">
				large
			</MButton>
		</div>

		<h3>类型</h3>
		<div class="m-button-demo__row">
			<MButton>
				default
			</MButton>
			<MButton type="primary">
				primary
			</MButton>
			<MButton type="primary" solid>
				solid
			</MButton>
			<MButton type="text">
				text
			</MButton>
			<MButton type="success">
				success
			</MButton>
			<MButton type="error">
				error
			</MButton>
			<MButton type="warning">
				warning
			</MButton>
			<MButton type="primary" disabled>
				disabled
			</MButton>
		</div>

		<h3>图标、圆形与胶囊</h3>
		<div v-for="size in sizes" :key="size" class="m-button-demo__row">
			<MButton type="primary" :size="size" icon="search">
				搜索
			</MButton>
			<MButton type="primary" :size="size" circle>
				胶囊
			</MButton>
			<MButton type="primary" :size="size" icon="search" round />
			<MButton :size="size" icon="search" round solid />
		</div>

		<h3>加载中</h3>
		<div class="m-button-demo__row">
			<MButton type="primary" :wait="0" @click="handleLoad">
				点击加载
			</MButton>
			<MButton :wait="0" @click="handleLoad">
				点击加载
			</MButton>
		</div>

		<h3>按钮组</h3>
		<div class="m-button-demo__row">
			<MButtonGroup v-for="size in sizes" :key="size" :size="size">
				<MButton type="primary">
					上一步
				</MButton>
				<MButton type="primary">
					下一步
				</MButton>
			</MButtonGroup>
		</div>
		<div class="m-button-demo__row">
			<MButtonGroup circle>
				<MButton>
					左
				</MButton>
				<MButton>
					中
				</MButton>
				<MButton>
					右
				</MButton>
			</MButtonGroup>
		</div>

		<h3>长按钮</h3>
		<MButton type="primary" size="large" long>
			提交
		</MButton>
	</div>
</template>
<script setup>
import { MButton, MButtonGroup } from '../index.m';

const sizes = ['mini', 'small', 'medium', 'large'];

const handleLoad = () => new Promise(resolve => setTimeout(resolve, 2000));
</script>
<style>
.m-button-demo {
	padding: 16px;
}

.m-button-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: calc(var(--vc-rem) * 16);
	margin-bottom: 16px;
}
</style>
