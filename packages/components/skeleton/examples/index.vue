<!-- 预设骨架：标题 + 段落，可加左侧图片；loading 切换真实内容 -->
<template>
	<div class="skeleton-basic">
		<div class="skeleton-basic__controls">
			<Select
				v-for="item in CONTROLS"
				:key="item.key"
				v-model="controls[item.key]"
				:data="item.data"
				:label="item.label"
			/>
		</div>

		<h4>默认：标题 + 3 行段落</h4>
		<Skeleton :animated="isAnimated" />

		<h4>左侧图片（方形 / 圆形）</h4>
		<Skeleton :animated="isAnimated" image :rows="2" />
		<Skeleton :animated="isAnimated" :image="{ shape: 'circle', size: 40 }" :title="false" :rows="2" />

		<h4>逐行宽度</h4>
		<Skeleton :animated="isAnimated" :title="160" :rows="['100%', '90%', '75%', '40%']" />

		<h4>loading 切换真实内容</h4>
		<Skeleton :loading="isLoading" :animated="isAnimated" image>
			<div class="skeleton-basic__item">
				<div class="skeleton-basic__cover" />
				<div>
					<h5>条目标题</h5>
					<p>第一行说明文字，用于展示加载完成后的内容。</p>
					<p>第二行说明文字。</p>
				</div>
			</div>
		</Skeleton>
	</div>
</template>
<script setup>
import { computed, reactive } from 'vue';
import { Skeleton } from '..';
import { Select } from '../../select';

const CONTROLS = [
	{ key: 'animated', label: '动画', data: [{ value: 'on', label: '闪光（默认）' }, { value: 'off', label: '静止' }] },
	{ key: 'loading', label: '状态', data: [{ value: 'loading', label: '加载中' }, { value: 'done', label: '已加载' }] }
];
const controls = reactive(Object.fromEntries(CONTROLS.map(({ key, data }) => [key, data[0].value])));
const isAnimated = computed(() => controls.animated === 'on');
const isLoading = computed(() => controls.loading === 'loading');
</script>

<style lang="scss">
.skeleton-basic {
	display: flex;
	max-width: 560px;
	padding: 20px;
	flex-direction: column;
	gap: 16px;

	&__controls {
		display: flex;
		gap: 12px;

		.vc-select {
			width: 200px;
		}
	}

	h4 {
		margin: 8px 0 0;
		font-size: 14px;
		color: var(--vc-color-dark-lightest);
	}

	&__item {
		display: flex;
		gap: 16px;

		h5 {
			margin: 0 0 8px;
			font-size: 16px;
		}

		p {
			margin: 0 0 4px;
			color: var(--vc-color-dark-lightest);
		}
	}

	&__cover {
		width: 48px;
		height: 48px;
		background: var(--vc-color-primary);
		border-radius: 4px;
		flex: none;
	}
}
</style>
