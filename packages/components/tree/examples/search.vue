<template>
	<div class="v-tree-search">
		<h3>Tree：搜索树</h3>
		<p class="v-tree-search__tip">
			输入关键词即筛选（不区分大小写），命中节点的祖先保留显示并展开，命中部分高亮；清空关键词恢复搜索前的展开状态。
			命中父节点时可选择保留它的全部子节点，或只显示命中的节点。
		</p>
		<div class="v-tree-search__controls">
			<Select
				v-for="item in CONTROLS"
				:key="item.key"
				v-model="controls[item.key]"
				:data="item.data"
				:label="item.label"
			/>
		</div>
		<div class="v-tree-search__stage">
			<InputSearch
				v-model="keyword"
				:enter-text="false"
				placeholder="输入关键词，如 类别 2、a1"
				clearable
			/>
			<p class="v-tree-search__summary">
				{{ keyword ? `命中 ${matchedCount} 个节点` : `共 ${total} 个节点` }}
			</p>
			<Tree
				ref="tree"
				:key="controls.checkbox"
				v-model="values"
				:data="data"
				:filter-node="filterNode"
				:render-node-label="renderLabel"
				:show-checkbox="controls.checkbox === 'on'"
				:expanded-values="['A']"
				empty-text="无匹配结果"
			/>
		</div>
		<p v-if="controls.checkbox === 'on'">已勾选：{{ values.join(', ') || '无' }}</p>
	</div>
</template>

<script setup>
import { computed, h, nextTick, reactive, ref, watch } from 'vue';
import { Tree } from '..';
import { Select } from '../../select';
import { InputSearch } from '../../input';

// 对照项：每项一个 Select
const CONTROLS = [
	{
		key: 'scope',
		label: '命中父节点时',
		data: [{ value: 'subtree', label: '保留全部子节点' }, { value: 'self', label: '只显示命中的节点' }]
	},
	{ key: 'checkbox', label: '勾选', data: [{ value: 'off', label: '关闭' }, { value: 'on', label: '开启' }] }
];
const controls = reactive(Object.fromEntries(CONTROLS.map(({ key, data }) => [key, data[0].value])));

const data = ['A', 'B', 'C'].map(group => ({
	value: group,
	label: `分组 ${group}`,
	children: [1, 2, 3].map(sub => ({
		value: `${group}${sub}`,
		// 各分组下的类别同名：搜索类别时靠祖先区分
		label: `类别 ${sub}`,
		children: [1, 2, 3, 4].map(n => ({
			value: `${group}${sub}-${n}`,
			label: `条目 ${group}${sub}-${n}`
		}))
	}))
}));

const tree = ref();
const keyword = ref('');
const values = ref([]);

const indexOf = (label, value) => label.toLowerCase().indexOf(value.toLowerCase());
const isMatched = (row, value) => indexOf(row.label, value) > -1;

// subtree：自身或任一祖先命中即显示；self：只看自身（未命中的祖先由 Tree 保留）
const filterNode = (value, row, node) => {
	if (!value || isMatched(row, value)) return true;
	if (controls.scope === 'self') return false;
	for (let parent = node.parentNode; parent && parent.states.level > 0; parent = parent.parentNode) {
		if (isMatched(parent.states.data, value)) return true;
	}
	return false;
};

// 拆成 前缀 / 命中 / 后缀，命中部分高亮
const renderLabel = ({ row }) => {
	const value = keyword.value;
	const index = value ? indexOf(row.label, value) : -1;
	if (index === -1) return row.label;
	return h('span', [
		row.label.slice(0, index),
		h('span', { class: 'v-tree-search__highlight' }, row.label.slice(index, index + value.length)),
		row.label.slice(index + value.length)
	]);
};

const count = (rows, fn) => rows.reduce((sum, row) => sum + (fn(row) ? 1 : 0) + count(row.children || [], fn), 0);
const total = count(data, () => true);
const matchedCount = computed(() => count(data, row => isMatched(row, keyword.value)));

watch(keyword, value => tree.value.filter(value));
// 切换范围后按当前关键词重新筛选；勾选开关会重新挂载，等新实例就绪
watch(() => controls.scope, () => tree.value.filter(keyword.value));
watch(() => controls.checkbox, async () => {
	values.value = [];
	await nextTick();
	keyword.value && tree.value.filter(keyword.value);
});
</script>

<style lang="scss">
.v-tree-search {
	padding: 20px 240px 20px 20px;
	line-height: 22px;

	&__tip {
		margin: 8px 0 16px;
		color: #666;
	}

	&__controls {
		display: grid;
		max-width: 520px;
		margin-bottom: 16px;
		grid-template-columns: repeat(2, 1fr);
		gap: 12px;
	}

	&__stage {
		max-width: 320px;
		padding: 16px;
		border: 1px dashed #c5c8ce;

		.vc-input-search {
			width: 100%;
		}
	}

	&__summary {
		margin: 8px 0;
		color: #999;
	}

	&__highlight {
		color: var(--vc-color-primary);
	}
}
</style>
