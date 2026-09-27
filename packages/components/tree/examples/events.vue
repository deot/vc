<template>
	<div style="padding: 30px;">
		<h2>节点事件的参数</h2>
		<p class="tree-events-demo__tip">
			事件参数均为对象：node 为节点对应的 TreeNode，data 为节点数据。点击、右键、展开 / 收起、勾选节点，下方依次列出最近的事件。
			current-change 只在当前节点变化时发出，再次点击当前节点不会发出；展开与收起都发出 node-expand-change。
		</p>
		<Tree
			:data="data"
			:expand-on-click-node="false"
			show-checkbox
			highlight-current
			@node-click="handleNodeClick"
			@node-contextmenu="handleContextmenu"
			@current-change="handleCurrentChange"
			@node-expand-change="handleExpandChange"
			@check="handleCheck"
			@check-change="handleCheckChange"
		/>
		<ul class="tree-events-demo__logs">
			<li v-for="(item, index) in logs" :key="index">
				{{ item }}
			</li>
		</ul>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Tree } from '..';

const labelOf = node => (node ? node.states.data.label : '');

const data = ref([
	{ value: '1', label: '一级 1', children: [{ value: '1-1', label: '二级 1-1' }, { value: '1-2', label: '二级 1-2' }] },
	{ value: '2', label: '一级 2', children: [{ value: '2-1', label: '二级 2-1' }] },
	{ value: '3', label: '一级 3' }
]);

// 最近的事件在前
const logs = ref([]);
const log = (text) => {
	logs.value = [text, ...logs.value].slice(0, 10);
};

const handleNodeClick = ({ data: row, event }) => log(`node-click：${row.label}（${event.type}）`);
const handleContextmenu = ({ data: row }) => log(`node-contextmenu：${row.label}`);
const handleCurrentChange = ({ data: row, oldNode }) => log(`current-change：${labelOf(oldNode) || '无'} → ${row.label}`);
const handleExpandChange = ({ data: row, expanded }) => log(`node-expand-change：${row.label} expanded=${expanded}`);
const handleCheck = ({ data: row, checked, checkedValues }) => {
	log(`check：${row.label} checked=${checked} checkedValues=${checkedValues.join(',')}`);
};
const handleCheckChange = ({ data: row, checked, indeterminate }) => {
	log(`check-change：${row.label} checked=${checked} indeterminate=${indeterminate}`);
};
</script>

<style lang="scss">
.tree-events-demo__tip {
	margin: 8px 0;
	font-size: 13px;
	color: #666;
}

.tree-events-demo__logs {
	min-height: 200px;
	padding-left: 20px;
	margin-top: 16px;
	font-size: 12px;
	line-height: 20px;
	color: #333;
}
</style>
