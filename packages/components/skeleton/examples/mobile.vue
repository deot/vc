<template>
	<div class="m-skeleton-demo">
		<h3>默认</h3>
		<div class="m-skeleton-demo__block">
			<MSkeleton />
		</div>

		<h3>头像 + 段落，重复 3 份</h3>
		<div class="m-skeleton-demo__block">
			<MSkeleton :image="{ shape: 'circle', size: 80 }" :title="false" :rows="2" :repeat="3" />
		</div>

		<h3>自定义（MSkeletonItem，数字为 750 稿）</h3>
		<div class="m-skeleton-demo__block">
			<MSkeleton>
				<template #placeholder>
					<div class="m-skeleton-demo__card">
						<MSkeletonItem :height="300" />
						<MSkeletonItem width="60%" />
						<div class="m-skeleton-demo__row">
							<MSkeletonItem :width="120" :height="56" shape="circle" />
							<MSkeletonItem :width="120" :height="56" shape="circle" />
						</div>
					</div>
				</template>
			</MSkeleton>
		</div>

		<h3>静止</h3>
		<div class="m-skeleton-demo__block">
			<MSkeleton :animated="false" image :rows="2" />
		</div>
	</div>
</template>

<script setup>
import { MSkeleton, MSkeletonItem } from '../index.m';
</script>

<style>
.m-skeleton-demo h3 {
	padding: 0 16px;
	margin: 16px 0 8px;
	font-size: 14px;
	font-weight: 400;
	color: var(--vc-color-dark-lightest);
}

.m-skeleton-demo__block {
	padding: 16px;
	background: var(--vc-background-color-lightest);
}

.m-skeleton-demo__card {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.m-skeleton-demo__row {
	display: flex;
	gap: 8px;
}
</style>
