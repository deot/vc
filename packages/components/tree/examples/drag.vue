<template>
	<div style="padding: 30px;">
		<h2>1. 拖拽事件与参数</h2>
		<p class="tree-drag-demo__tip">
			节点的上 / 中 / 下区域分别为 before / inner / after。allow-drop 对三个区域分别询问，参数为 { node, data, targetNode, position, from, to }；
			from / to 为 { parent, index }，parent 为 TreeNode（根级为 null），to.index 为移除被拖节点之后的下标。放下时先发出 node-drop，再发出 node-dragend。
		</p>
		<div class="tree-drag-demo__status">
			最近一次询问：{{ asks.target ? `${asks.target}（before → ${asks.before}；inner → ${asks.inner}；after → ${asks.after}）` : '无' }}
		</div>
		<div class="tree-drag-demo__status">
			最近一次移动：{{ dropText || '无' }}
		</div>
		<Tree
			:data="basicData"
			:allow-drop="handleAllowDrop"
			default-expand-all
			draggable
			@node-dragstart="log('node-dragstart', $event)"
			@node-dragenter="log('node-dragenter', $event)"
			@node-dragleave="log('node-dragleave', $event)"
			@node-drop="handleDrop"
			@node-dragend="log('node-dragend', $event)"
		/>
		<p class="tree-drag-demo__tip">
			事件记录（最近 6 条，node-dragover 触发频繁，未记录）：
		</p>
		<ul class="tree-drag-demo__logs">
			<li v-for="(item, index) in logs" :key="index">
				{{ item }}
			</li>
		</ul>

		<h2>2. 只允许同级排序</h2>
		<p class="tree-drag-demo__tip">
			allow-drop 比较移动前后的父节点：({ from, to }) => from.parent === to.parent，与 Table 的写法相同。
			换到别的父节点下的区域都被拒绝；三个区域都被拒绝时显示不可放置，松手不移动。
		</p>
		<Tree
			:data="sameLevelData"
			:allow-drop="({ from, to }) => from.parent === to.parent"
			default-expand-all
			draggable
		/>

		<h2>3. 区域让渡与不可拖动</h2>
		<p class="tree-drag-demo__tip">
			被拒绝的区域让给相邻区域：「文件」不能放入子节点，整行按上下两半放在它之前 / 之后；「回收站」只能放入，整行都是 inner。
			「锁定」的文件不能拖动（allow-drag 返回 false）。
		</p>
		<Tree
			:data="zoneData"
			:allow-drag="({ data }) => !data.locked"
			:allow-drop="allowZone"
			default-expand-all
			draggable
		/>
	</div>
</template>
<script setup>
import { reactive, ref } from 'vue';
import { Tree } from '..';

const labelOf = node => (node ? node.states.data.label : '');
const place = ({ parent, index }) => `${parent ? labelOf(parent) : '根级'}[${index}]`;

// 1. 拖拽事件与参数
const basicData = ref([
	{ value: 'p1', label: '部门 A', children: [{ value: 'c1', label: '成员 A-1' }, { value: 'c2', label: '成员 A-2' }] },
	{ value: 'p2', label: '部门 B' },
	{ value: 'p3', label: '部门 C' },
	{ value: 'p4', label: '部门 D' }
]);

// 同一个目标节点的三次询问依次记录
const asks = reactive({ target: '', before: '', inner: '', after: '' });
const handleAllowDrop = ({ targetNode, position, to }) => {
	asks.target = labelOf(targetNode);
	asks[position] = place(to);
	return true;
};

const logs = ref([]);
const log = (name, e) => {
	const extra = e.targetNode !== undefined ? ` target=${labelOf(e.targetNode) || 'null'}` : '';
	const end = name === 'node-dragend' ? ` position=${e.position} dropped=${e.dropped}` : '';
	logs.value = [`${name}: ${e.data.label}${extra}${end}`, ...logs.value].slice(0, 6);
};

const dropText = ref('');
const handleDrop = (e) => {
	log('node-drop', e);
	dropText.value = `${e.data.label} ${e.position} ${labelOf(e.targetNode)}：${place(e.from)} → ${place(e.to)}`;
};

// 2. 只允许同级
const sameLevelData = ref([
	{ value: 'g1', label: '分组 A', children: [{ value: 'g11', label: 'A-1' }, { value: 'g12', label: 'A-2' }, { value: 'g13', label: 'A-3' }] },
	{ value: 'g2', label: '分组 B', children: [{ value: 'g21', label: 'B-1' }] },
	{ value: 'g3', label: '分组 C' }
]);

// 3. 区域让渡：文件不能放入，回收站只能放入
const zoneData = ref([
	{ value: 'z1', label: '文件夹', children: [{ value: 'z11', label: '文件 1', type: 'file' }, { value: 'z12', label: '文件 2', type: 'file' }] },
	{ value: 'z2', label: '文件 3', type: 'file' },
	{ value: 'z3', label: '文件 4（锁定）', type: 'file', locked: true },
	{ value: 'z4', label: '回收站', type: 'trash' }
]);
const allowZone = ({ targetNode, position }) => {
	const { type } = targetNode.states.data;
	if (type === 'file') return position !== 'inner';
	if (type === 'trash') return position === 'inner';
	return true;
};
</script>

<style lang="scss">
.tree-drag-demo__tip {
	margin: 8px 0;
	font-size: 13px;
	color: #666;
}

// 固定行高：状态文字变化时不推动下方的树
.tree-drag-demo__status {
	height: 20px;
	margin-bottom: 8px;
	font-size: 13px;
	line-height: 20px;
}

.tree-drag-demo__logs {
	min-height: 120px;
	padding-left: 20px;
	margin: 0 0 24px;
	font-size: 12px;
	line-height: 20px;
	color: #333;
}
</style>
