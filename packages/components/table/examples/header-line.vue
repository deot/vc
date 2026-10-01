<template>
	<div style="padding: 30px;">
		<div class="table-controls">
			<Select
				v-for="item in CONTROLS"
				:key="item.key"
				v-model="controls[item.key]"
				:data="item.data"
				:label="item.label"
			/>
		</div>

		<h3>height：表头随列宽换行，表体高度随表头联动（拖动列宽 / 缩放窗口）</h3>
		<Table
			ref="heightTable"
			:data="dataSource"
			:height="360"
			primary-key="id"
			border
			show-summary
			:sort="sort"
			@sort-change="(v) => (sort = v)"
		>
			<TableColumn
				type="selection"
				fixed="left"
			/>
			<TableColumn
				prop="name"
				label="名称（未设置 header-line，取全局配置，均未设置时为 1）"
				fixed="left"
				:width="160"
			/>
			<TableColumn
				prop="date"
				label="日期（header-line=2，可排序，列宽较窄时换行并截断）"
				:header-line="2"
				:width="160"
				sortable
			/>
			<TableColumn
				prop="type"
				label="类型（header-line=3，带筛选与提示）"
				:header-line="3"
				:width="140"
				tooltip="提示信息"
				:filter-options="{ data: typeOptions }"
			/>
			<TableColumn
				prop="value"
				label="数值（右对齐）"
				header-align="right"
				align="right"
				:header-line="2"
				:width="100"
			/>
			<TableColumn
				prop="desc"
				:min-width="240"
			>
				<template #header>
					<!-- 自定义表头不走 header-line：保持单行省略，高度由内容撑开 -->
					<div style="display: flex; justify-content: space-between;">
						<span>说明（header 插槽）</span>
						<span>space-between</span>
					</div>
				</template>
			</TableColumn>
		</Table>
		<p>
			headerHeight: {{ heightLayout.headerHeight }}，bodyHeight: {{ heightLayout.bodyHeight }}，
			footerHeight: {{ heightLayout.footerHeight }}，tableHeight: {{ heightLayout.tableHeight }}
		</p>

		<h3>多级表头：同行的其它表头与跨行表头垂直居中</h3>
		<Table
			:data="dataSource.slice(0, 3)"
			primary-key="id"
			border
		>
			<TableColumn
				prop="name"
				label="名称（跨行）"
				:width="120"
			/>
			<TableColumn
				label="分组表头（header-line=2）很长很长很长很长很长很长很长很长很长"
				:header-line="2"
			>
				<TableColumn
					prop="group"
					label="分组（header-line=0 不限行数）"
					:header-line="0"
					:width="120"
				/>
				<TableColumn
					prop="value"
					label="数值"
					:width="100"
				/>
			</TableColumn>
			<TableColumn
				prop="desc"
				label="说明"
				:min-width="240"
			/>
		</Table>

		<h3>max-height</h3>
		<Table
			:data="dataSource"
			:max-height="300"
			primary-key="id"
			border
		>
			<TableColumn
				prop="name"
				label="名称"
				:width="120"
			/>
			<TableColumn
				prop="desc"
				label="说明（header-line=2）这是一段很长的表头文字，用于展示表头换行与截断后的效果"
				:header-line="2"
				:min-width="200"
			/>
			<TableColumn
				prop="value"
				label="数值"
				:width="120"
			/>
		</Table>

		<h3>流式高度 + affix</h3>
		<Table
			:data="dataSource"
			primary-key="id"
			border
			affix
		>
			<TableColumn
				prop="name"
				label="名称"
				:width="120"
			/>
			<TableColumn
				prop="desc"
				label="说明（header-line=3）这是一段很长的表头文字，用于展示表头换行与截断后的效果"
				:header-line="3"
				:width="160"
			/>
			<TableColumn
				prop="date"
				label="日期"
				:min-width="200"
			/>
		</Table>
		<div style="height: 600px;" />
	</div>
</template>
<script setup>
import { ref, computed, reactive, watch, onBeforeUnmount } from 'vue';
import { Table, TableColumn } from '..';
import { Select } from '../../select';
import { VcInstance } from '../../vc';

// 仅演示：修改全局配置，离开页面时还原
const original = VcInstance.options.TableColumn?.headerLine;
// 对照项：每项一个 Select
const CONTROLS = [
	{
		key: 'headerLine',
		label: '全局 TableColumn.headerLine',
		data: [{ value: 'unset', label: '未设置' }, { value: 1, label: '1' }, { value: 2, label: '2' }]
	}
];
const controls = reactive({ headerLine: original ?? 'unset' });
watch(() => controls.headerLine, (v) => {
	VcInstance.options.TableColumn.headerLine = v === 'unset' ? void 0 : v;
});
onBeforeUnmount(() => {
	VcInstance.options.TableColumn.headerLine = original;
});

const heightTable = ref();
const heightLayout = computed(() => heightTable.value?.layout.states || {});

const sort = ref({});
const typeOptions = [
	{ label: '类型 A', value: '类型 A' },
	{ label: '类型 B', value: '类型 B' }
];

const dataSource = ref(
	Array.from({ length: 20 }, (_, index) => ({
		id: index + 1,
		name: `条目 ${index + 1}`,
		date: `2016-05-${String(index + 1).padStart(2, '0')}`,
		type: index % 2 ? '类型 A' : '类型 B',
		group: '分组 A',
		value: (index + 1) * 100,
		desc: '这是一段较长的说明文字，用于展示单元格内容的换行与截断'
	}))
);

// 右上角的性能读数：切换对照项后清零
window.$perf?.observe();
watch(controls, () => window.$perf?.reset());
onBeforeUnmount(() => window.$perf?.disconnect());
</script>

<style lang="scss">
.table-controls {
	display: flex;
	gap: 12px;
	margin-bottom: 16px;

	.vc-select {
		width: 320px;
	}
}
</style>
