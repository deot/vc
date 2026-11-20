<template>
	<div class="m-spin-demo">
		<h3>尺寸（750 稿）</h3>
		<div class="m-spin-demo__block m-spin-demo__row">
			<MSpin :size="32" />
			<MSpin />
			<MSpin :size="88" />
		</div>

		<h3>文字提示</h3>
		<div class="m-spin-demo__block m-spin-demo__row">
			<MSpin tip="加载中" />
		</div>

		<h3>包裹内容</h3>
		<div class="m-spin-demo__block">
			<div class="m-spin-demo__row">
				<MSwitch v-model="loading" />
				<span>加载中</span>
				<MSwitch v-model="mask" />
				<span>蒙层</span>
			</div>
			<MSpin :loading="loading" :mask="mask" tip="加载中" class="m-spin-demo__area">
				<div class="m-spin-demo__card">
					<p>这里是被包裹的内容，加载时上面会显示加载图标。</p>
					<MButton size="small" @click="count++">
						点击次数：{{ count }}
					</MButton>
				</div>
			</MSpin>
		</div>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { MSpin } from '../index.m';
import { MButton } from '../../button/index.m';
import { MSwitch } from '../../switch/index.m';

const loading = ref(true);
const mask = ref(true);
const count = ref(0);
</script>
<style>
.m-spin-demo h3 {
	padding: 0 16px;
	margin: 16px 0 8px;
	font-size: 14px;
	font-weight: 400;
	color: var(--vc-color-dark-lightest);
}

.m-spin-demo__block {
	padding: 16px;
	background: var(--vc-background-color-lightest);
}

.m-spin-demo__row {
	display: flex;
	align-items: center;
	gap: 16px;
}

.m-spin-demo__area {
	margin-top: 12px;
}

.m-spin-demo__card {
	padding: 16px;
	border: 1px solid var(--vc-border-color);
	border-radius: 8px;
}

.m-spin-demo__card p {
	margin: 0 0 12px;
}
</style>
