<!-- 四种滚动模式：height（虚拟列表自带滚动）、max-height（Scroller）、外部滚动（页面或外层 Scroller），外部滚动可开虚拟列表 -->
<template>
	<div class="index-bar-demo">
		<div class="index-bar-demo__controls">
			<Select
				v-for="item in CONTROLS"
				:key="item.key"
				v-model="controls[item.key]"
				:data="item.data"
				:label="item.label"
			/>
			<span class="index-bar-demo__current">当前分组：{{ current }}</span>
			<Button @click="indexBar?.scrollTo('M', { duration: 300 })">
				动画滚动到 M
			</Button>
		</div>

		<!-- 换模式时整体重新挂载 -->
		<div v-if="controls.mode === 'height' || controls.mode === 'max-height'" :key="controls.mode + controls.size">
			<IndexBar
				ref="indexBar"
				v-model="current"
				class="index-bar-demo__bar"
				:data="data"
				v-bind="controls.mode === 'height' ? { height: 400 } : { maxHeight: 400 }"
			/>
		</div>
		<Scroller
			v-else-if="controls.mode === 'scroller'"
			:key="controls.mode + controls.size + controls.virtualized"
			height="400px"
			class="index-bar-demo__viewport"
		>
			<p class="index-bar-demo__side">
				外层 Scroller 中的前置内容
			</p>
			<IndexBar
				ref="indexBar"
				v-model="current"
				:data="data"
				:virtualized="!!controls.virtualized"
			/>
			<p class="index-bar-demo__side">
				后置内容
			</p>
		</Scroller>
		<div v-else :key="controls.mode + controls.size + controls.virtualized">
			<p class="index-bar-demo__side">
				页面滚动，吸附线在顶部固定栏（48px）下方
			</p>
			<div class="index-bar-demo__header">
				顶部固定栏
			</div>
			<IndexBar
				ref="indexBar"
				v-model="current"
				:data="data"
				:offset="48"
				:virtualized="!!controls.virtualized"
			/>
			<p class="index-bar-demo__side">
				后置内容
			</p>
		</div>
	</div>
</template>
<script setup>
import { ref, reactive, computed } from 'vue';
import { Select } from '../../select';
import { Button } from '../../button';
import { Scroller } from '../../scroller';
import { IndexBar } from '..';
import { createGroups } from './basic/data';

const CONTROLS = [
	{
		key: 'mode',
		label: '滚动',
		data: [
			{ label: 'height（虚拟）', value: 'height' },
			{ label: 'max-height', value: 'max-height' },
			{ label: '外层 Scroller', value: 'scroller' },
			{ label: '页面', value: 'page' }
		]
	},
	{
		key: 'virtualized',
		label: '外部滚动虚拟',
		data: [{ label: '否', value: 0 }, { label: '是', value: 1 }]
	},
	{
		key: 'size',
		label: '每组项数',
		data: [{ label: '约 4', value: 4 }, { label: '约 400（1 万行）', value: 400 }]
	}
];

const controls = reactive({ mode: 'height', virtualized: 0, size: 4 });
const data = computed(() => createGroups(controls.size));
const current = ref('A');
const indexBar = ref();
</script>
<style lang="scss">
.index-bar-demo {
	padding: 20px;

	&__controls {
		position: relative;
		z-index: 3;
		display: flex;
		margin-bottom: 16px;
		gap: 12px;
		align-items: center;
		flex-wrap: wrap;
	}

	&__bar,
	&__viewport {
		max-width: 480px;
		border: 1px solid var(--vc-border-color);
	}

	&__side {
		padding: 24px 16px;
		margin: 0;
		color: var(--vc-color-dark-extralight);
	}

	&__header {
		position: sticky;
		top: 0;
		z-index: 4;
		height: 48px;
		padding: 0 16px;
		line-height: 48px;
		color: #fff;
		background: var(--vc-color-primary);
	}
}
</style>
