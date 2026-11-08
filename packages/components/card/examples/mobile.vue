<template>
	<div class="m-card-demo">
		<div class="m-card-demo__title">
			基础用法（375 宽下标题栏高 46）
		</div>
		<MCard title="条目信息" icon="search">
			<template #extra>
				<span class="m-card-demo__link">查看全部</span>
			</template>
			<p>条目编号：ITEM-2026</p>
			<p>条目状态：已完成</p>
		</MCard>

		<div class="m-card-demo__title">
			无标题
		</div>
		<MCard>
			主体内边距默认 32（375 宽下 16px），内容较长时自动换行显示，字号与行高随屏幕宽度等比缩放。
		</MCard>

		<div class="m-card-demo__title">
			标题插槽、无边框、阴影
		</div>
		<MCard :border="false" shadow>
			<template #title>
				<p class="m-card-demo__custom">
					自定义标题
				</p>
			</template>
			标题插槽可以承载任意内容。
		</MCard>

		<div class="m-card-demo__title">
			自定义 padding（750 稿）
		</div>
		<MCard title="可调节间距" :padding="padding">
			<p>当前主体内边距：{{ padding }}</p>
			<div class="m-card-demo__actions">
				<MButton size="small" :disabled="padding <= 16" @click="padding -= 8">
					缩小
				</MButton>
				<MButton size="small" :disabled="padding >= 64" @click="padding += 8">
					增大
				</MButton>
			</div>
		</MCard>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MCard } from '../index.m';
import { MButton } from '../../button/index.m';

const padding = ref(32);
</script>

<style lang="scss">
.m-card-demo {
	min-height: 100vh;
	padding: 0 calc(var(--vc-rem) * 32) 24px;
	background: var(--vc-background-color-light);

	&__title {
		padding: calc(var(--vc-rem) * 24) 0;
		font-size: calc(var(--vc-rem) * 28);
		color: var(--vc-color-dark-extralight);
	}

	&__link {
		color: var(--vc-color-primary);
	}

	&__custom {
		font-size: calc(var(--vc-rem) * 32);
		font-weight: 700;
		color: var(--vc-color-primary);
	}

	&__actions {
		display: flex;
		margin-top: calc(var(--vc-rem) * 16);
		gap: calc(var(--vc-rem) * 16);
	}
}
</style>
