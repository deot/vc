<template>
	<div style="padding: 30px;">
		<p class="drag-demo__tip">
			每个表格的「操作」列：编辑（随机修改名称）、删除（原地删除该行）；从按钮上按下不会发起拖拽。
		</p>
		<h2>1. 整行拖拽 + v-model:data</h2>
		<p class="drag-demo__tip">
			按住行内任意位置拖动（复选框、输入框处按下不会发起拖拽）；Esc 取消。
			拖动后多选项、高亮的当前行保持不变。
		</p>
		<div class="drag-demo__status">
			顺序：{{ basicData.map(item => item.id).join(' / ') }}；
			已选：{{ selection.map(item => item.id).join(' / ') || '无' }}；
			当前行：{{ currentRow?.id || '无' }}
		</div>
		<Table
			v-model:data="basicData"
			primary-key="id"
			draggable
			highlight
			border
			@selection-change="(e) => (selection = e.selection)"
			@current-change="(e) => (currentRow = e.row)"
			@block-dragstart="log('block-dragstart', $event)"
			@block-drop="log('block-drop', $event)"
			@block-dragend="log('block-dragend', $event)"
		>
			<TableColumn type="selection" />
			<TableColumn type="index" label="#" />
			<TableColumn prop="name" label="姓名" :width="140" />
			<TableColumn prop="date" label="日期" :width="160" />
			<TableColumn label="备注" :min-width="200">
				<template #default="{ row }">
					<input v-model="row.remark" placeholder="在输入框内可正常选中文本">
				</template>
			</TableColumn>
			<TableColumn label="操作" :width="140">
				<template #default="{ row }">
					<div class="drag-demo__actions">
						<Button type="text" size="small" @click="rename(row)">编辑</Button>
						<Button type="text" size="small" @click="remove(basicData, row)">删除</Button>
					</div>
				</template>
			</TableColumn>
		</Table>
		<pre class="drag-demo__log">{{ logs.join('\n') || '事件日志' }}</pre>

		<h2>2. 锚点列 + allowDrag / allowDrop + 固定列</h2>
		<p class="drag-demo__tip">
			只能从左侧把手拖动；「锁定」的行把手置灰、不可拖动；
			「置顶」行之前不能放置（插入线变为错误色）。横向滚动后固定列在跟随行中的位置保持一致。
		</p>
		<Table
			v-model:data="handleData"
			primary-key="id"
			border
			:allow-drag="({ rows }) => !rows[0].locked"
			:allow-drop="({ targetRows, position }) => !(targetRows[0].pinned && position === 'before')"
		>
			<TableColumn type="drag" fixed="left" />
			<TableColumn prop="name" label="姓名" fixed="left" :width="160">
				<template #default="{ row }">
					{{ row.name }}
					<span v-if="row.pinned" class="drag-demo__tag">置顶</span>
					<span v-if="row.locked" class="drag-demo__tag">锁定</span>
				</template>
			</TableColumn>
			<TableColumn
				v-for="n in 8"
				:key="n"
				:prop="`field${n}`"
				:label="`字段 ${n}`"
				:width="160"
			/>
			<TableColumn label="操作" :width="140" fixed="right">
				<template #default="{ row }">
					<div class="drag-demo__actions">
						<Button type="text" size="small" @click="rename(row)">编辑</Button>
						<Button type="text" size="small" @click="remove(handleData, row)">删除</Button>
					</div>
				</template>
			</TableColumn>
		</Table>

		<h2>3. 固定高度 + 虚拟滚动（1000 行）+ 固定列</h2>
		<p class="drag-demo__tip">
			同时开启整行拖拽与把手列：有把手列时整行不显示 move 光标，由把手提示可拖动，按住行内其它位置同样可以拖动。
			拖到表体上下边缘附近会自动滚动，越靠近边缘越快，可以把第一行一直拖到末尾。
			源行滚出视口被回收后再滚回来，仍保持变暗。
		</p>
		<div class="drag-demo__status">
			前 3 行：{{ virtualData.slice(0, 3).map(item => item.id).join(' / ') }}；
			末 3 行：{{ virtualData.slice(-3).map(item => item.id).join(' / ') }}
		</div>
		<Table
			v-model:data="virtualData"
			primary-key="id"
			border
			draggable
			:height="400"
		>
			<TableColumn type="drag" fixed="left" />
			<TableColumn type="index" label="#" fixed="left" />
			<TableColumn prop="name" label="姓名" :width="140" />
			<TableColumn
				v-for="n in 6"
				:key="n"
				:prop="`field${n}`"
				:label="`字段 ${n}`"
				:width="160"
			/>
			<TableColumn prop="date" label="日期" fixed="right" :width="140" />
			<TableColumn label="操作" :width="140" fixed="right">
				<template #default="{ row }">
					<div class="drag-demo__actions">
						<Button type="text" size="small" @click="rename(row)">编辑</Button>
						<Button type="text" size="small" @click="remove(virtualData, row)">删除</Button>
					</div>
				</template>
			</TableColumn>
		</Table>

		<h2>4. getSpan 合并块整体拖动</h2>
		<p class="drag-demo__tip">
			同一分组纵向合并为一个块：拖动任意一行都会整体移动所在的块，插入线只落在块与块之间。
			getSpan 按分组内容计算，松手后按新顺序重新合并。
		</p>
		<Table
			v-model:data="spanData"
			primary-key="id"
			border
			draggable
			:get-span="getSpan"
		>
			<TableColumn prop="group" label="分组" :width="120" />
			<TableColumn prop="name" label="姓名" :width="140" />
			<TableColumn prop="date" label="日期" :min-width="160" />
			<TableColumn label="操作" :width="140">
				<template #default="{ row }">
					<div class="drag-demo__actions">
						<Button type="text" size="small" @click="rename(row)">编辑</Button>
						<Button type="text" size="small" @click="remove(spanData, row)">删除</Button>
					</div>
				</template>
			</TableColumn>
		</Table>

		<h2>5. :data + @block-drop：异步确认</h2>
		<p class="drag-demo__tip">
			不使用 v-model，松手后模拟请求 800ms，成功后再写回；开启「拒绝」时不写回，行回到原位。
		</p>
		<div class="drag-demo__status">
			<Button @click="reject = !reject">
				{{ reject ? '当前：拒绝' : '当前：接受' }}
			</Button>
			<span style="margin-left: 12px;">{{ saving ? '保存中...' : message }}</span>
		</div>
		<Table
			:data="asyncData"
			primary-key="id"
			border
			draggable
			@block-drop="handleAsyncDrop"
		>
			<TableColumn type="index" label="#" />
			<TableColumn prop="name" label="姓名" :width="140" />
			<TableColumn prop="date" label="日期" :min-width="160" />
			<TableColumn label="操作" :width="140">
				<template #default="{ row }">
					<div class="drag-demo__actions">
						<Button type="text" size="small" @click="rename(row)">编辑</Button>
						<Button type="text" size="small" @click="remove(asyncData, row)">删除</Button>
					</div>
				</template>
			</TableColumn>
		</Table>

		<h2>6. 展开行 + 流式高度 + 表头吸顶</h2>
		<p class="drag-demo__tip">
			未设置高度时由页面滚动：拖到窗口上下边缘附近会滚动页面。表头吸顶时，插入线不会落在表头下面。
			已展开的行拖动后保持展开，展开内容随行移动（拖动时不能从展开内容里按下）。drag 列放在展开列之前。
		</p>
		<Table
			v-model:data="expandData"
			primary-key="id"
			border
			draggable
			affix
			:expand-row-value="['e1', 'e4']"
		>
			<TableColumn type="drag" />
			<TableColumn type="expand">
				<template #default="{ row }">
					<div>{{ row.name }} 的详情：{{ row.address }}</div>
				</template>
			</TableColumn>
			<TableColumn prop="name" label="姓名" :width="140" />
			<TableColumn prop="date" label="日期" :width="160" />
			<TableColumn prop="address" label="地址" :min-width="200" />
			<TableColumn label="操作" :width="140">
				<template #default="{ row }">
					<div class="drag-demo__actions">
						<Button type="text" size="small" @click="rename(row)">编辑</Button>
						<Button type="text" size="small" @click="remove(expandData, row)">删除</Button>
					</div>
				</template>
			</TableColumn>
		</Table>

		<h2>7. 表格位于可滚动的容器中</h2>
		<p class="drag-demo__tip">
			外层容器 overflow: auto、高度 300px，表格为流式高度：拖到容器上下边缘附近时滚动容器。
		</p>
		<div class="drag-demo__container">
			<Table
				v-model:data="containerData"
				primary-key="id"
				border
				draggable
			>
				<TableColumn type="index" label="#" />
				<TableColumn prop="name" label="姓名" :width="140" />
				<TableColumn prop="date" label="日期" :min-width="160" />
				<TableColumn label="操作" :width="140">
					<template #default="{ row }">
						<div class="drag-demo__actions">
							<Button type="text" size="small" @click="rename(row)">编辑</Button>
							<Button type="text" size="small" @click="remove(containerData, row)">删除</Button>
						</div>
					</template>
				</TableColumn>
			</Table>
		</div>
		<div style="height: 400px;" />
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Table, TableColumn } from '..';
import { Button } from '../../button';

// 附加 field1 ~ fieldN 列的数据
const withFields = (item, count) => Array.from({ length: count }).reduce((pre, _, n) => {
	pre[`field${n + 1}`] = `${item.name} - ${n + 1}`;
	return pre;
}, { ...item });

const genData = (length, prefix = 'id') => Array.from({ length }).map((_, index) => ({
	id: `${prefix}${index}`,
	name: `用户 ${index}`,
	date: `2011-11-${String((index % 28) + 1).padStart(2, '0')}`,
	remark: ''
}));

// 操作：编辑（随机修改名称）与删除（原地删除，已选中的其它行保持选中）；模板中 ref 已解包，list 为数组本身
const rename = (row) => {
	row.name = `${row.name.split(' #')[0]} #${Math.random().toString(36).slice(2, 6)}`;
};
const remove = (list, row) => {
	const index = list.indexOf(row);
	index > -1 && list.splice(index, 1);
};

// 1. 整行拖拽
const basicData = ref(genData(6));
const selection = ref([]);
const currentRow = ref(null);
const logs = ref([]);
const log = (name, e) => {
	const rows = e.rows.map(row => row.id).join(',');
	const extra = name === 'block-drop'
		? ` target=${e.targetRows.map(row => row.id).join(',')} ${e.position} ${e.from.index}→${e.to.index}`
		: name === 'block-dragend' ? ` dropped=${e.dropped}` : '';
	logs.value = [`${name}: rows=${rows}${extra}`, ...logs.value].slice(0, 6);
};

// 2. 锚点列
const handleData = ref(genData(6, 'h').map((item, index) => ({
	...withFields(item, 8),
	pinned: index === 0,
	locked: index === 3
})));

// 3. 虚拟滚动
const virtualData = ref(genData(1000, 'v').map(item => withFields(item, 6)));

// 4. 合并块：同一分组的连续行纵向合并
const groups = ['A', 'A', 'A', 'B', 'C', 'C', 'D', 'D'];
const spanData = ref(genData(groups.length, 's').map((item, index) => ({ ...item, group: `分组 ${groups[index]}` })));
const getSpan = ({ row, rowIndex, columnIndex }) => {
	if (columnIndex !== 0) return;
	const data = spanData.value;
	if (rowIndex > 0 && data[rowIndex - 1].group === row.group) return [0, 0];
	let rowspan = 1;
	while (data[rowIndex + rowspan]?.group === row.group) rowspan++;
	return [rowspan, 1];
};

// 5. 异步确认
const asyncData = ref(genData(5, 'a'));
const reject = ref(false);
const saving = ref(false);
const message = ref('');
const handleAsyncDrop = (e) => {
	saving.value = true;
	setTimeout(() => {
		saving.value = false;
		if (reject.value) {
			message.value = `已拒绝：${e.rows[0].name} 回到原位`;
			return;
		}
		asyncData.value = e.rawData;
		message.value = `已保存：${e.rows[0].name} ${e.from.index} → ${e.to.index}`;
	}, 800);
};

// 6. 展开行 + 流式高度
const expandData = ref(genData(40, 'e').map(item => ({ ...item, address: `祥园路 ${item.id} 号` })));

// 7. 滚动容器
const containerData = ref(genData(20, 'c'));
</script>

<style lang="scss">
.drag-demo__tip {
	margin: 8px 0;
	font-size: 13px;
	color: #666;
}

.drag-demo__status {
	margin-bottom: 8px;
	font-size: 13px;
}

.drag-demo__log {
	min-height: 60px;
	padding: 8px;
	margin: 8px 0 30px;
	font-size: 12px;
	color: #333;
	background: #F7F8FA;
}

.drag-demo__container {
	height: 300px;
	overflow: auto;
	border: 1px dashed #DDD;
}

.drag-demo__tag {
	padding: 0 4px;
	margin-left: 4px;
	font-size: 12px;
	color: #999;
	border: 1px solid #DDD;
	border-radius: 2px;
}

// 操作按钮不换行
.drag-demo__actions {
	white-space: nowrap;
}
</style>
