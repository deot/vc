<template>
	<div style="padding: 30px;">
		<p class="drag-tree-demo__tip">
			每个表格的「操作」列：编辑（随机修改名称）、删除（从所在的子行数组中原地删除，含懒加载的子行）；从按钮上按下不会发起拖拽。
		</p>
		<h2>1. 嵌套树：跨层级拖拽</h2>
		<p class="drag-tree-demo__tip">
			行的上 / 下四分之一落在与相邻行之间的间隙，中间一半成为该行的子行（框住目标行）。
			子树末尾的间隙可以接在多个层级，由指针在「名称」列上的横向位置决定，插入线缩进到对应层级。
			被拖行连同展开的子孙一起变暗，不能拖进自己的子孙。松手后原地修改 data（与 Tree 组件一致），再发出 update:data（根数组的副本），这里用 v-model:data 写回。
		</p>
		<div class="drag-tree-demo__status">
			当前落点：{{ dropText || '无' }}
		</div>
		<div class="drag-tree-demo__status">
			最近一次移动：{{ lastDrop || '无' }}
		</div>
		<Table
			v-model:data="treeData"
			:allow-drop="handleAllowDrop"
			primary-key="id"
			border
			draggable
			default-expand-all
			@block-dragend="dropText = ''"
			@block-drop="handleDrop"
		>
			<TableColumn type="drag" />
			<TableColumn prop="name" label="名称" :width="260" />
			<TableColumn prop="date" label="日期" :min-width="160" />
			<TableColumn label="操作" :width="140">
				<template #default="{ row }">
					<div class="drag-tree-demo__actions">
						<Button type="text" size="small" @click="rename(row)">编辑</Button>
						<Button type="text" size="small" @click="remove(treeData, row)">删除</Button>
					</div>
				</template>
			</TableColumn>
		</Table>

		<h2>2. 懒加载树</h2>
		<p class="drag-tree-demo__tip">
			带 hasChildren 且尚未加载的节点不能作为 inner 目标（子行未知），中间区域按上下两半处理；
			展开加载后可以放入，移入的行写入 load-expand 返回的数组。只能从左侧把手拖动。
		</p>
		<Table
			:data="lazyData"
			:load-expand="loadExpand"
			primary-key="id"
			border
			lazy-tree
		>
			<TableColumn type="drag" />
			<TableColumn prop="name" label="名称" :width="260" />
			<TableColumn prop="date" label="日期" :min-width="160" />
			<TableColumn label="操作" :width="140">
				<template #default="{ row }">
					<div class="drag-tree-demo__actions">
						<Button type="text" size="small" @click="rename(row)">编辑</Button>
						<Button type="text" size="small" @click="remove(lazyData, row)">删除</Button>
					</div>
				</template>
			</TableColumn>
		</Table>

		<h2>3. 只允许同级排序</h2>
		<p class="drag-tree-demo__tip">
			allow-drop 比较移动前后的父行：({ from, to }) => from.parent === to.parent。
			换到别的父行下时插入线变为错误色，松手不生效。
		</p>
		<Table
			:data="sameLevelData"
			:allow-drop="({ from, to }) => from.parent === to.parent"
			primary-key="id"
			border
			draggable
			default-expand-all
		>
			<TableColumn type="drag" />
			<TableColumn prop="name" label="名称" :width="260" />
			<TableColumn prop="date" label="日期" :min-width="160" />
			<TableColumn label="操作" :width="140">
				<template #default="{ row }">
					<div class="drag-tree-demo__actions">
						<Button type="text" size="small" @click="rename(row)">编辑</Button>
						<Button type="text" size="small" @click="remove(sameLevelData, row)">删除</Button>
					</div>
				</template>
			</TableColumn>
		</Table>

		<h2>4. 固定高度 + 虚拟滚动（约 900 行）</h2>
		<p class="drag-tree-demo__tip">
			30 个分组、每组 30 行，全部展开。拖到表体上下边缘附近会自动滚动，可以把行拖到很远的分组里。
		</p>
		<Table
			:data="bigData"
			:height="400"
			primary-key="id"
			border
			draggable
			default-expand-all
		>
			<TableColumn type="drag" />
			<TableColumn prop="name" label="名称" :width="260" />
			<TableColumn prop="date" label="日期" :min-width="160" />
			<TableColumn label="操作" :width="140">
				<template #default="{ row }">
					<div class="drag-tree-demo__actions">
						<Button type="text" size="small" @click="rename(row)">编辑</Button>
						<Button type="text" size="small" @click="remove(bigData, row)">删除</Button>
					</div>
				</template>
			</TableColumn>
		</Table>
		<div style="height: 400px;" />
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Table, TableColumn } from '..';
import { Button } from '../../button';

let uid = 0;
const node = (name, children, extra) => ({
	id: ++uid,
	name,
	date: `2011-11-${String((uid % 28) + 1).padStart(2, '0')}`,
	...(children ? { children } : {}),
	...extra
});

// 1. 嵌套树
const treeData = ref([
	node('部门 A', [
		node('小组 A-1', [node('成员 A-1-1'), node('成员 A-1-2')]),
		node('小组 A-2', [node('成员 A-2-1')]),
		node('成员 A-3')
	]),
	node('部门 B', [node('成员 B-1'), node('成员 B-2')]),
	node('部门 C'),
	node('部门 D', [node('小组 D-1', [node('成员 D-1-1')])])
]);

const place = ({ parent, index }) => `${parent ? parent.name : '根级'}[${index}]`;

// 操作：编辑（随机修改名称）与删除（在所在的子行数组中原地删除）
const rename = (row) => {
	row.name = `${row.name.split(' #')[0]} #${Math.random().toString(36).slice(2, 6)}`;
};
const remove = (list, row) => {
	const index = list.indexOf(row);
	if (index > -1) {
		list.splice(index, 1);
		return true;
	}
	return list.some(item => !!item.children && remove(item.children, row));
};

// 实时展示 allowDrop 收到的落点
const dropText = ref('');
const handleAllowDrop = ({ targetRows, position, from, to }) => {
	dropText.value = `${position} ${targetRows[0].name}：${place(from)} → ${place(to)}`;
	return true;
};

// 树形表格已原地修改 data，这里只记录移动（可在此调用接口保存）
const lastDrop = ref('');
const handleDrop = ({ rows, from, to }) => {
	lastDrop.value = `${rows[0].name}：${place(from)} → ${place(to)}`;
};

// 2. 懒加载树：hasChildren 的节点展开时加载 3 个子行
const lazyData = ref([
	node('目录 1', null, { hasChildren: true }),
	node('目录 2', null, { hasChildren: true }),
	node('文件 3'),
	node('文件 4')
]);
// 加载结果同时写入 row.children：与表格持有同一个数组，之后原地增删（删除、拖入拖出）两边一致
const loadExpand = row => new Promise((resolve) => {
	setTimeout(() => {
		row.children = [1, 2, 3].map(i => node(`${row.name} - 文件 ${i}`));
		resolve(row.children);
	}, 400);
});

// 3. 只允许同级
const sameLevelData = ref([
	node('分组 A', [node('A-1'), node('A-2'), node('A-3')]),
	node('分组 B', [node('B-1'), node('B-2')]),
	node('分组 C')
]);

// 4. 虚拟滚动大树
const bigData = ref(Array.from({ length: 30 }).map((_, i) => node(
	`分组 ${i + 1}`,
	Array.from({ length: 30 }).map((__, j) => node(`分组 ${i + 1} - 成员 ${j + 1}`))
)));
</script>

<style lang="scss">
.drag-tree-demo__tip {
	margin: 8px 0;
	font-size: 13px;
	color: #666;
}

// 固定行高：落点文字变化时不推动下方表格
.drag-tree-demo__status {
	height: 20px;
	margin-bottom: 8px;
	font-size: 13px;
	line-height: 20px;
}

// 操作按钮不换行
.drag-tree-demo__actions {
	white-space: nowrap;
}
</style>
