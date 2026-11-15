<!-- 插槽：项（default）、分组标题（title）、侧栏单项（sidebar）、拖动提示（tip） -->
<template>
	<div style="padding: 20px;">
		<IndexBar :data="data" :height="400" style="max-width: 480px; border: 1px solid var(--vc-border-color);">
			<template #default="{ row, group, index }">
				<div class="index-bar-slots__item">
					<span class="index-bar-slots__avatar">{{ group.value }}</span>
					{{ row.label }}（第 {{ index + 1 }} 项）
				</div>
			</template>
			<template #title="{ group }">
				<strong>{{ group.label }}</strong>&nbsp;· {{ group.children.length }} 项
			</template>
			<template #sidebar="{ group, active }">
				<span :style="{ fontWeight: active ? 600 : 400 }">{{ String(group.value).toLowerCase() }}</span>
			</template>
			<template #tip="{ group }">
				{{ group.value }}!
			</template>
		</IndexBar>
	</div>
</template>
<script setup>
import { IndexBar } from '..';
import { createGroups } from './basic/data';

const data = createGroups(3);
</script>
<style lang="scss">
.index-bar-slots {
	&__item {
		display: flex;
		height: 48px;
		padding: 0 40px 0 16px;
		gap: 12px;
		align-items: center;
	}

	&__avatar {
		display: inline-flex;
		width: 28px;
		height: 28px;
		color: #fff;
		background: var(--vc-color-primary);
		border-radius: 50%;
		justify-content: center;
		align-items: center;
	}
}
</style>
