<template>
	<div style="padding: 30px;">
		<h2>1. 列拖拽 + v-model:columns</h2>
		<p class="drag-column-demo__tip">
			:draggable="[false, true]" 开启列拖拽：按住表头拖动，插入线标出落点，松手后新顺序在表格内部生效，并经 update:columns 发出；
			排序图标、列宽拖拽区（表头右缘）处按下不会发起。selection 等结构列不能拖动。下方为 v-model:columns 的列管理面板。
		</p>
		<div class="drag-column-demo__panel">
			<label v-for="item in basicColumns" :key="item.id">
				<input type="checkbox" :checked="!item.hidden" @change="toggleHidden(item)">
				{{ item.label || item.type }}
			</label>
		</div>
		<div class="drag-column-demo__status">
			顺序：{{ basicColumns.map(item => item.label || item.type).join(' / ') }}
		</div>
		<Table
			v-model:columns="basicColumns"
			v-model:sort="sort"
			:data="data"
			:draggable="[false, true]"
			primary-key="id"
			border
			@column-dragstart="log('column-dragstart', $event)"
			@column-drop="log('column-drop', $event)"
			@column-dragend="log('column-dragend', $event)"
		>
			<TableColumn type="selection" />
			<TableColumn prop="name" label="姓名" :width="120" />
			<TableColumn prop="date" label="日期" :width="140" sortable />
			<TableColumn prop="city" label="城市" :width="120" />
			<TableColumn prop="address" label="地址" :min-width="220" />
		</Table>
		<pre class="drag-column-demo__log">{{ logs.join('\n') || '事件日志' }}</pre>

		<h2>2. 固定列 + 横向滚动</h2>
		<p class="drag-column-demo__tip">
			左、右固定列只能在各自的固定分组内调整；非固定列拖到滚动区域左右边缘附近时表体横向滚动。
			未绑定 v-model:columns 也能拖动。
		</p>
		<Table
			:data="data"
			:draggable="[false, true]"
			primary-key="id"
			border
			style="width: 720px;"
		>
			<TableColumn prop="id" label="编号" :width="80" fixed="left" />
			<TableColumn prop="name" label="姓名" :width="100" fixed="left" />
			<TableColumn
				v-for="i in 10"
				:key="i"
				:prop="`field${i}`"
				:label="`字段 ${i}`"
				:width="120"
			/>
			<TableColumn prop="city" label="城市" :width="100" fixed="right" />
			<TableColumn prop="date" label="日期" :width="120" fixed="right" />
		</Table>

		<h2>3. 多级表头</h2>
		<p class="drag-column-demo__tip">
			分组表头连同子列一起移动；分组内的列只能在分组内调整，不能拖到别的分组。
		</p>
		<div class="drag-column-demo__status">
			顺序：{{ groupColumns.map(item => item.label).join(' / ') }}
		</div>
		<Table
			v-model:columns="groupColumns"
			:data="data"
			:draggable="[false, true]"
			primary-key="id"
			border
		>
			<TableColumn prop="name" label="姓名" :width="120" />
			<TableColumn label="基本信息">
				<TableColumn prop="date" label="日期" :width="140" />
				<TableColumn prop="city" label="城市" :width="120" />
			</TableColumn>
			<TableColumn label="地址信息">
				<TableColumn prop="province" label="省份" :width="120" />
				<TableColumn prop="address" label="地址" :min-width="220" />
			</TableColumn>
		</Table>

		<h2>4. allowDrag / allowDrop</h2>
		<p class="drag-column-demo__tip">
			「姓名」列锁定，不可拖动（没有 move 光标）；其他列不能放到「姓名」之前（插入线变为错误色，松手不生效）。
			参数带 type: 'column'，行拖拽时为 type: 'block'。
		</p>
		<div class="drag-column-demo__status">
			当前落点：{{ dropText || '无' }}
		</div>
		<Table
			:data="data"
			:draggable="[false, true]"
			:allow-drag="({ type, column }) => type !== 'column' || column.label !== '姓名'"
			:allow-drop="handleAllowDrop"
			primary-key="id"
			border
			@column-dragend="dropText = ''"
		>
			<TableColumn prop="name" label="姓名" :width="120" />
			<TableColumn prop="date" label="日期" :width="140" />
			<TableColumn prop="city" label="城市" :width="120" />
			<TableColumn prop="address" label="地址" :min-width="220" />
		</Table>

		<h2>5. 行、列同时拖拽</h2>
		<p class="drag-column-demo__tip">
			:draggable="[true, true]"：按住表体行拖动调整行顺序（v-model:data），按住表头拖动调整列顺序；两者互不干扰。
		</p>
		<Table
			v-model:data="bothData"
			:draggable="[true, true]"
			primary-key="id"
			border
		>
			<TableColumn type="drag" />
			<TableColumn prop="name" label="姓名" :width="120" />
			<TableColumn prop="date" label="日期" :width="140" />
			<TableColumn prop="city" label="城市" :width="120" />
			<TableColumn prop="address" label="地址" :min-width="220" />
		</Table>
		<div style="height: 200px;" />
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Table, TableColumn } from '..';

const cities = ['杭州', '上海', '北京', '深圳', '成都'];
const genData = length => Array.from({ length }).map((_, i) => ({
	id: i + 1,
	name: `用户 ${i + 1}`,
	date: `2011-11-${String(i + 1).padStart(2, '0')}`,
	city: cities[i % cities.length],
	province: '浙江省',
	address: `拱墅区祥园路 ${i + 1} 号`,
	...Object.fromEntries(Array.from({ length: 10 }).map((__, j) => [`field${j + 1}`, `${i + 1}-${j + 1}`]))
}));

const data = ref(genData(5));

// 1. v-model:columns
const basicColumns = ref([]);
const sort = ref({ prop: '', order: '' });
const toggleHidden = (item) => {
	basicColumns.value = basicColumns.value.map(column => (column.id === item.id ? { ...column, hidden: !column.hidden } : column));
};
const logs = ref([]);
const log = (name, e) => {
	const extra = name === 'column-drop'
		? ` ${e.position} ${e.targetColumn.label} ${e.from.index}→${e.to.index}`
		: name === 'column-dragend' ? ` dropped=${e.dropped}` : '';
	logs.value = [`${name}: ${e.column.label}${extra}`, ...logs.value].slice(0, 6);
};

// 3. 多级表头
const groupColumns = ref([]);

// 4. 实时展示 allowDrop 收到的落点
const dropText = ref('');
const handleAllowDrop = ({ type, column, targetColumn, position }) => {
	if (type !== 'column') return true;
	dropText.value = `${column.label} → ${position} ${targetColumn.label}`;
	return !(targetColumn.label === '姓名' && position === 'before');
};

// 5. 行、列同时拖拽
const bothData = ref(genData(5));
</script>

<style lang="scss">
.drag-column-demo__tip {
	margin: 8px 0;
	font-size: 13px;
	color: #666;
}

// 固定行高：状态文字变化时不推动下方表格
.drag-column-demo__status {
	height: 20px;
	margin-bottom: 8px;
	font-size: 13px;
	line-height: 20px;
}

.drag-column-demo__panel {
	display: flex;
	gap: 12px;
	margin-bottom: 8px;
	font-size: 13px;
}

.drag-column-demo__log {
	min-height: 60px;
	padding: 8px;
	margin: 8px 0 30px;
	font-size: 12px;
	color: #333;
	background: #F7F8FA;
}
</style>
