<!-- 移动端：行高 / 缩进（750 稿）、多选、懒加载、筛选、虚拟化、长按拖拽 -->
<template>
	<div class="tree-mobile">
		<p class="tree-mobile__tip">
			数字 indent 为 750 稿长度（默认 32），可用右上角的 rem 按钮切换 --vc-rem 观察缩放
		</p>
		<div class="tree-mobile__types">
			<MButton
				v-for="item in TYPES"
				:key="item.value"
				size="small"
				:type="type === item.value ? 'primary' : 'default'"
				@click="type = item.value"
			>
				{{ item.label }}
			</MButton>
		</div>

		<!-- 基础：点行展开 / 收起，文字超出时单行省略，highlight-current 标出当前节点 -->
		<template v-if="type === 'basic'">
			<p class="tree-mobile__tip">
				当前节点：{{ current || '无' }}
			</p>
			<MTree
				key="basic"
				:data="basicData"
				:expanded-values="['1', '1-1']"
				highlight-current
				@current-change="current = $event.data.label"
			/>
		</template>

		<!-- 多选：点多选框勾选，点行仍是展开；check-on-click-node 时点行也勾选 -->
		<template v-else-if="type === 'checkbox'">
			<p class="tree-mobile__tip">
				已选：{{ checked.length ? checked.join('、') : '无' }}
			</p>
			<MTree
				key="checkbox"
				v-model="checked"
				:data="basicData"
				:expanded-values="['1']"
				show-checkbox
			/>
		</template>

		<!-- 懒加载：展开时加载子节点，期间显示加载图标 -->
		<MTree
			v-else-if="type === 'lazy'"
			key="lazy"
			:data="lazyData"
			:load-data="loadData"
			lazy
			show-checkbox
		/>

		<!-- 筛选：没有匹配时显示空状态 -->
		<template v-else-if="type === 'filter'">
			<MInput v-model="keyword" placeholder="输入关键字筛选" clearable />
			<MTree
				ref="filterTree"
				key="filter"
				:data="basicData"
				:filter-node="filterNode"
				default-expand-all
			/>
		</template>

		<!-- 大量数据：virtualized 沿用所在的滚动容器（这里是固定高度的 MScroller），使用原生滚动 -->
		<MScroller v-else-if="type === 'virtualized'" key="virtualized" class="tree-mobile__scroller">
			<MTree :data="bigData" virtualized show-checkbox />
		</MScroller>

		<!-- 拖拽：长按节点发起，拖到节点的上 / 中 / 下放在它之前 / 之内 / 之后 -->
		<template v-else>
			<p class="tree-mobile__tip">
				长按节点后拖动。最近一次移动：{{ dropText || '无' }}
			</p>
			<MTree
				key="drag"
				:data="dragData"
				default-expand-all
				draggable
				@node-drop="handleDrop"
			/>
		</template>
	</div>
</template>
<script setup>
import { ref, watch } from 'vue';
import { MButton } from '../../button/index.m';
import { MInput } from '../../input/index.m';
import { MScroller } from '../../scroller/index.m';
import { MTree } from '../index.m';

const TYPES = [
	{ value: 'basic', label: '基础' },
	{ value: 'checkbox', label: '多选' },
	{ value: 'lazy', label: '懒加载' },
	{ value: 'filter', label: '筛选' },
	{ value: 'virtualized', label: '大量数据' },
	{ value: 'drag', label: '拖拽' }
];

const type = ref('basic');
const current = ref('');
const checked = ref(['1-1-1']);
const keyword = ref('');
const filterTree = ref();
const dropText = ref('');

const createData = () => [
	{
		value: '1',
		label: '分组 1',
		children: [
			{
				value: '1-1',
				label: '子分组 1-1',
				children: [
					{ value: '1-1-1', label: '条目 1-1-1' },
					{ value: '1-1-2', label: '条目 1-1-2，名称较长的一项，超出屏幕宽度时在末尾显示省略号' },
					{ value: '1-1-3', label: '条目 1-1-3（禁用）', disabled: true }
				]
			},
			{ value: '1-2', label: '条目 1-2' }
		]
	},
	{
		value: '2',
		label: '分组 2',
		children: [
			{ value: '2-1', label: '条目 2-1' },
			{ value: '2-2', label: '条目 2-2' }
		]
	},
	{ value: '3', label: '条目 3' }
];
const basicData = createData();
const dragData = ref(createData());

const lazyData = [
	{ value: '1', label: '分组 1' },
	{ value: '2', label: '分组 2' },
	{ value: '3', label: '条目 3', isLeaf: true }
];
const wait = time => new Promise(resolve => setTimeout(resolve, time));
const loadData = async (node) => {
	await wait(800);
	const { value } = node.states.data;
	return Array.from({ length: 3 }, (_, index) => ({
		value: `${value}-${index + 1}`,
		label: `条目 ${value}-${index + 1}`,
		isLeaf: node.states.level >= 2
	}));
};

const bigData = Array.from({ length: 50 }, (_, i) => ({
	value: `${i + 1}`,
	label: `分组 ${i + 1}`,
	children: Array.from({ length: 100 }, (__, j) => ({ value: `${i + 1}-${j + 1}`, label: `条目 ${i + 1}-${j + 1}` }))
}));

const filterNode = (value, row) => !value || row.label.includes(value);
watch(keyword, value => filterTree.value?.filter(value));

const handleDrop = ({ data, targetNode, position }) => {
	dropText.value = `${data.label} → ${targetNode.states.data.label}（${position}）`;
};
</script>
<style scoped>
.tree-mobile {
	padding: 0 0 12px;
}

.tree-mobile__tip {
	margin: 8px 16px;
	font-size: 12px;
	color: var(--vc-color-dark-light);
}

.tree-mobile__types {
	display: flex;
	padding: 0 16px 8px;
	flex-wrap: wrap;
	gap: 8px;
}

.tree-mobile__scroller {
	height: 60vh;
}
</style>
