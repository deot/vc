<!-- 移动端：页面滚动（默认），或固定高度 + 虚拟列表 -->
<template>
	<div class="m-index-bar-demo">
		<div class="m-index-bar-demo__controls">
			<MRadioGroup v-model="mode" type="button" size="small">
				<MRadio value="page">
					页面滚动
				</MRadio>
				<MRadio value="height">
					固定高度
				</MRadio>
			</MRadioGroup>
			<span>当前：{{ current }}</span>
		</div>
		<MIndexBar
			v-if="mode === 'page'"
			key="page"
			v-model="current"
			:data="data"
		/>
		<MIndexBar
			v-else
			key="height"
			v-model="current"
			:data="data"
			:height="900"
		/>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { MRadioGroup, MRadio } from '../../radio/index.m';
import { MIndexBar } from '../index.m';
import { createGroups } from './basic/data';

const mode = ref('page');
const current = ref('A');
const data = createGroups(5);
</script>
<style lang="scss">
.m-index-bar-demo {
	&__controls {
		display: flex;
		padding: calc(var(--vc-rem) * 24) calc(var(--vc-rem) * 32);
		gap: calc(var(--vc-rem) * 24);
		align-items: center;
	}
}
</style>
