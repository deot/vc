<!-- 各种高度模式下的表格：固定高度（虚拟滚动）、最大高度、不设高度（流式 + 吸附）、固定行高；可切换数据量与动态列，附挂载 / 卸载的内存测试 -->
<template>
	<div class="table-index">
		<div class="table-index__controls">
			<Select
				v-for="item in CONTROLS"
				:key="item.key"
				v-model="controls[item.key]"
				:data="item.data"
				:label="item.label"
			/>
			<Button @click="handleTestingStart">内存测试</Button>
			<Button @click="handleTestingEnd">取消测试</Button>
			<Button @click="isActive = !isActive">{{ isActive ? '卸载' : '挂载' }}</Button>
		</div>
		<p>已构建 {{ loadState.loaded }} / {{ dataSource.length }} 行{{ loadState.isEnd ? '（全部构建完成）' : '' }}</p>
		<!-- 任一对照项变化都重新挂载 -->
		<Table
			v-if="isActive"
			:key="tableKey"
			primary-key="id"
			resizable
			border
			stripe
			show-summary
			:rows="6"
			v-bind="modeProps"
			:data="dataSource"
			:sort="sort"
			@selection-change="handleChange"
			@sort-change="handleSort"
			@load-change="handleLoadChange"
		>
			<TableColumn type="selection" fixed="left" :width="80" />
			<TableColumn
				label="序号"
				prop="index"
				fixed="left"
				class="column-class"
				tooltip="行号与选中状态"
				sortable
				:width="140"
			>
				<template #default="{ rowIndex, selected }">
					<div>{{ rowIndex }}{{ selected }}</div>
				</template>
			</TableColumn>
			<TableColumn label="标识" fixed="left" :style="{ color: 'red' }" :width="140">
				<template #default="{ row }">
					<div>{{ row.id }}</div>
				</template>
			</TableColumn>
			<TableColumn label="单行文本" prop="label" :line="1" :min-width="200" />
			<TableColumn label="两行文本" prop="label" align="right" :line="2" :min-width="200" />
			<TableColumn label="可点击" :width="160">
				<template #default="{ rowIndex }">
					<h1 class="table-index__clickable" @click="handleClick(rowIndex)">{{ rowIndex }}</h1>
				</template>
			</TableColumn>
			<TableColumn label="计数" :width="160">
				<template #default="{ row, rowIndex }">
					<div @click="row.count++">{{ row.count }} {{ rowIndex }}</div>
				</template>
			</TableColumn>
			<TableColumn
				v-for="item in columns"
				:key="item"
				:label="item"
			>
				<template #default="{ rowIndex }">
					<div>{{ item }} {{ rowIndex }}</div>
				</template>
			</TableColumn>
			<TableColumn label="操作" fixed="right" align="right" :width="120">
				<template #default="{ rowIndex }">
					<div @click="handleDelete(rowIndex)">删除 {{ rowIndex }}</div>
				</template>
			</TableColumn>
		</Table>
	</div>
</template>
<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { Table, TableColumn } from '..';
import { Button } from '../../button';
import { Select } from '../../select';

// 各高度模式的属性与行数：只有固定高度走虚拟滚动，行数可以很大
const MODES = {
	'height': { props: { height: 600 }, rows: 10000 },
	'max-height': { props: { maxHeight: 600 }, rows: 100 },
	// 流式高度 + affix：窄屏横向溢出时，横向滚动条与合计行一起吸在视口底部
	'none': { props: { affix: true }, rows: 30 },
	'row-height': { props: { height: 600, rowHeight: 100 }, rows: 10000 }
};

// 对照项：每项一个 Select
const CONTROLS = [
	{
		key: 'mode',
		label: '高度',
		data: [
			{ value: 'height', label: 'height=600（虚拟滚动，1 万行）' },
			{ value: 'max-height', label: 'max-height=600（100 行）' },
			{ value: 'none', label: '不设高度 + affix（30 行）' },
			{ value: 'row-height', label: 'height=600 + row-height=100（1 万行）' }
		]
	},
	{ key: 'data', label: '数据', data: [{ value: 'full', label: '有数据' }, { value: 'empty', label: '空' }] },
	{ key: 'columns', label: '动态列', data: [{ value: 40, label: '40 列' }, { value: 0, label: '无' }] }
];
const controls = reactive(Object.fromEntries(CONTROLS.map(({ key, data }) => [key, data[0].value])));
const tableKey = computed(() => Object.values(controls).join('-'));
const modeProps = computed(() => MODES[controls.mode].props);
const columns = computed(() => Array.from({ length: controls.columns }, (_, index) => `字段 ${index + 1}`));

const genTableData = length => Array.from({ length }).map((_, index) => ({
	id: `id__${index}`,
	label: '1234 ABC '.repeat(20),
	count: 0
}));

const isActive = ref(true);
const sort = ref({ prop: 'index', order: 'descending' });
const dataSource = ref([]);
watch(
	() => [controls.mode, controls.data],
	() => (dataSource.value = controls.data === 'empty' ? [] : genTableData(MODES[controls.mode].rows)),
	{ immediate: true }
);

// 内存测试：反复挂载 / 卸载，观察右上角的 heap 是否持续上涨
let timer;
const handleTestingStart = () => {
	clearInterval(timer);
	timer = setInterval(() => {
		isActive.value = !isActive.value;
	}, 50);
};

const handleTestingEnd = () => {
	clearInterval(timer);
	timer = null;
	isActive.value = false;
};

const handleClick = (rowIndex) => {
	console.log('click', rowIndex);
};
const handleDelete = (rowIndex) => {
	dataSource.value.splice(rowIndex, 1);
	console.log(dataSource.value.length);
};
const handleChange = ({ selection }) => {
	console.log(selection.map(i => i.id));
};
// 只演示排序状态的受控写法，数据本身不排序
const handleSort = (sortInfo) => {
	sort.value = sortInfo;
};

// load-change 是单向的：挂载推一次，之后每批行构建完成推一次，loaded 为已构建的行数
const loadState = ref({ isEnd: false, isLoading: false, isSilentRefresh: false, isEmpty: false, loaded: 0 });
const handleLoadChange = (e) => {
	loadState.value = e;
	console.log(e);
};

// 右上角的性能读数：切换对照项后清零
window.$perf?.observe();
watch(controls, () => window.$perf?.reset());
onBeforeUnmount(() => {
	clearInterval(timer);
	window.$perf?.disconnect();
});
</script>

<style lang="scss">
/* 有意为之：验证边框主题变量与列的 class / style 生效 */
:root {
	--vc-table-border-color: red;
}

.column-class {
	color: red !important;
}

.table-index {
	padding: 30px;

	&__controls {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;

		// 右上角留给主题与性能读数的按钮
		padding-right: 220px;
		align-items: center;

		.vc-select {
			width: 320px;
		}
	}

	// 行高取整数：默认行高是小数时，行的实际高度与取整后的记录会逐行差出 1px
	&__clickable {
		margin: 8px 0;
		font-size: 28px;
		line-height: 40px;
		color: red;
	}
}
</style>
