<template>
	<div class="m-grid-demo">
		<div class="m-grid-demo__title">
			等分列：columns 4、gap 16（750 稿，375 宽下为 8px）
		</div>
		<MGrid :columns="4" :gap="16">
			<MGridItem v-for="i in 8" :key="i" :span="1">
				<div class="m-grid-demo__cell">
					{{ i }}
				</div>
			</MGridItem>
		</MGrid>

		<div class="m-grid-demo__title">
			span：默认 24 列，[16, 24] 为 [水平, 垂直]
		</div>
		<MGrid :gap="[16, 24]">
			<MGridItem :span="12">
				<div class="m-grid-demo__cell">
					span 12
				</div>
			</MGridItem>
			<MGridItem :span="12">
				<div class="m-grid-demo__cell">
					span 12
				</div>
			</MGridItem>
			<MGridItem :span="8">
				<div class="m-grid-demo__cell">
					span 8
				</div>
			</MGridItem>
			<MGridItem span="auto">
				<div class="m-grid-demo__cell">
					auto
				</div>
			</MGridItem>
		</MGrid>

		<div class="m-grid-demo__title">
			固定轨道：columns [160, '1fr']，首列 160（750 稿）
		</div>
		<MGrid :columns="[160, '1fr']" :gap="16">
			<template v-for="item in rows" :key="item.label">
				<MGridItem :span="1">
					<div class="m-grid-demo__cell is-label">
						{{ item.label }}
					</div>
				</MGridItem>
				<MGridItem :span="1">
					<div class="m-grid-demo__cell is-value">
						{{ item.value }}
					</div>
				</MGridItem>
			</template>
		</MGrid>

		<div class="m-grid-demo__title">
			折叠：只显示第一行，suffix 始终在末尾
		</div>
		<MGrid :columns="3" :gap="16" :collapsed="collapsed">
			<MGridItem v-for="i in 7" :key="i" :span="1">
				<div class="m-grid-demo__cell">
					项 {{ i }}
				</div>
			</MGridItem>
			<MGridItem :span="1" suffix>
				<MButton size="small" @click="collapsed = !collapsed">
					{{ collapsed ? '展开' : '收起' }}
				</MButton>
			</MGridItem>
		</MGrid>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { MGrid, MGridItem } from '../index.m';
import { MButton } from '../../button/index.m';

const collapsed = ref(true);
const rows = [
	{ label: '标签一', value: '内容较短' },
	{ label: '标签二', value: '内容较长时在剩余宽度内换行，标签列宽度保持不变' },
	{ label: '标签三', value: '内容' }
];
</script>
<style lang="scss">
.m-grid-demo {
	min-height: 100vh;
	padding: 0 calc(var(--vc-rem) * 32) 24px;
	background: var(--vc-background-color-light);

	&__title {
		padding: calc(var(--vc-rem) * 24) 0;
		font-size: calc(var(--vc-rem) * 28);
		color: var(--vc-color-dark-extralight);
	}

	&__cell {
		padding: calc(var(--vc-rem) * 16);
		font-size: calc(var(--vc-rem) * 28);
		line-height: calc(var(--vc-rem) * 40);
		color: var(--vc-color-dark);
		text-align: center;
		background: var(--vc-background-color-lightest);
		border-radius: calc(var(--vc-rem) * 8);

		&.is-label {
			color: var(--vc-color-dark-light);
			text-align: left;
		}

		&.is-value {
			text-align: left;
		}
	}
}
</style>
