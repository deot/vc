<!-- estimateSize：预估尺寸，跳过隐藏池测量、一次构建全部数据；项渲染出来后仍按实际尺寸校正 -->
<template>
	<div class="demo">
		<Select v-model="mode" :data="MODES" label="estimate-size" class="demo__select" />
		<p>已构建 {{ loaded }} / {{ data.length }} · 内容高度 {{ contentSize }}px</p>
		<ul class="demo__note">
			<li>预估值只用于还没渲染过的项：项渲染出来后仍会测量，与预估不一致时按实际尺寸校正（按锚点补偿，视口内容不跳）</li>
			<li>数字：每 5 项一个较高的项（76px）被估成 48px，滚到它们时内容高度随校正增长</li>
			<li>函数：按项给出 48 / 76，估得准就不需要校正；返回 undefined 的项照常进隐藏池测量</li>
			<li>不设置：逐项测量、按 batchCount 分批构建，滚到已构建末尾才构建下一批</li>
			<li>点击任意项展开：内容变化同样按实际高度校正</li>
		</ul>
		<RecycleList
			ref="listRef"
			class="list"
			disabled
			:data="data"
			:estimate-size="estimateSize"
			@load-change="loaded = $event.loaded"
		>
			<template #default="{ row }">
				<div class="item" @click="row.expanded = !row.expanded">
					<span>第 {{ row.id }} 项</span>
					<p v-if="row.tall">每 5 项有一行附加说明，比普通项高</p>
					<p v-if="row.expanded">展开的内容让这一项变高</p>
				</div>
			</template>
		</RecycleList>
	</div>
</template>
<script setup>
import { computed, ref } from 'vue';
import { RecycleList } from '..';
import { Select } from '../../select';

const MODES = [
	{ value: 'function', label: '函数：按项给出 48 / 76' },
	{ value: 'number', label: '数字：48' },
	{ value: 'none', label: '不设置' }
];

const mode = ref('function');
const estimateSize = computed(() => {
	if (mode.value === 'number') return 48;
	if (mode.value === 'function') return ({ row }) => (row.tall ? 76 : 48);
	return undefined;
});

const listRef = ref();
const loaded = ref(0);
const contentSize = computed(() => listRef.value?.store.states.contentMaxSize || 0);
const data = ref(Array.from({ length: 10000 }, (_, id) => ({ id, tall: id % 5 === 4, expanded: false })));
</script>
<style scoped>
.demo {
	padding: 20px;
}

.demo__select {
	width: 320px;
}

.demo__note {
	padding-left: 20px;
	line-height: 22px;
	color: #666;
}

.list {
	height: 480px;
	border: 1px solid #eee;
}

/* 普通项 14 + 20 + 13 + 1 = 48，附加一行说明再加 8 + 20 = 76 */
.item {
	padding: 14px 16px 13px;
	line-height: 20px;
	cursor: pointer;
	border-bottom: 1px solid #eee;
}

.item p {
	margin: 8px 0 0;
	color: #666;
}
</style>
