<!-- 自定义骨架：placeholder 插槽 + SkeletonItem 拼卡片与列表，repeat 重复份数 -->
<template>
	<div class="skeleton-custom">
		<div class="skeleton-custom__controls">
			<Select v-model="repeat" :data="REPEATS" label="份数" />
		</div>

		<h4>卡片</h4>
		<div class="skeleton-custom__cards">
			<Skeleton :repeat="repeat" class="skeleton-custom__grid">
				<template #placeholder>
					<div class="skeleton-custom__card">
						<SkeletonItem height="120px" />
						<SkeletonItem width="70%" :height="18" />
						<SkeletonItem width="40%" />
						<div class="skeleton-custom__actions">
							<SkeletonItem :width="64" :height="28" shape="circle" />
							<SkeletonItem :width="64" :height="28" shape="circle" />
						</div>
					</div>
				</template>
			</Skeleton>
		</div>

		<h4>列表</h4>
		<Skeleton :repeat="repeat">
			<template #placeholder="{ index }">
				<div class="skeleton-custom__row">
					<SkeletonItem :width="40" :height="40" shape="circle" />
					<div class="skeleton-custom__lines">
						<SkeletonItem :width="index % 2 ? '50%' : '35%'" />
						<SkeletonItem :width="index % 2 ? '80%' : '65%'" :height="12" />
					</div>
					<SkeletonItem :width="48" :height="20" />
				</div>
			</template>
		</Skeleton>

		<h4>单独使用 SkeletonItem（行内占位）</h4>
		<p class="skeleton-custom__inline">
			当前数值：<SkeletonItem class="skeleton-custom__value" :width="80" height="1em" />
		</p>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Skeleton, SkeletonItem } from '..';
import { Select } from '../../select';

const REPEATS = [1, 2, 3, 4].map(value => ({ value, label: `${value} 份` }));
const repeat = ref(3);
</script>

<style lang="scss">
.skeleton-custom {
	display: flex;
	max-width: 720px;
	padding: 20px;
	flex-direction: column;
	gap: 16px;

	&__controls .vc-select {
		width: 200px;
	}

	h4 {
		margin: 8px 0 0;
		font-size: 14px;
		color: var(--vc-color-dark-lightest);
	}

	// 自定义布局：repeat 的每份放进 grid（加上根类名提高优先级，盖过默认的纵向 flex）
	&__grid.vc-skeleton {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
	}

	&__card {
		display: flex;
		padding: 12px;
		border: 1px solid var(--vc-color-neutral-light);
		border-radius: 8px;
		flex-direction: column;
		gap: 12px;
	}

	&__actions {
		display: flex;
		gap: 8px;
	}

	&__row {
		display: flex;
		gap: 12px;
		align-items: center;
	}

	&__lines {
		display: flex;
		flex-direction: column;
		gap: 8px;
		flex: 1;
	}

	&__inline {
		margin: 0;
	}

	&__value {
		display: inline-block;
		vertical-align: middle;
	}
}
</style>
