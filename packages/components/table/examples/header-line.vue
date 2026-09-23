<template>
	<div style="padding: 30px;">
		<div style="margin-bottom: 16px;">
			<span>全局 TableColumn.headerLine：</span>
			<RadioGroup v-model="globalLine" type="button">
				<Radio
					v-for="item in globalLines"
					:key="item.label"
					:value="item.value"
					:label="item.label"
				/>
			</RadioGroup>
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
				label="姓名（未设置 header-line，取全局配置，均未设置时为 1）"
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
				prop="amount"
				label="金额（右对齐）"
				header-align="right"
				align="right"
				:header-line="2"
				:width="100"
			/>
			<TableColumn
				prop="address"
				:min-width="240"
			>
				<template #header>
					<!-- 自定义表头不走 header-line：保持单行省略，高度由内容撑开 -->
					<div style="display: flex; justify-content: space-between;">
						<span>地址（header 插槽）</span>
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
				label="姓名（跨行）"
				:width="120"
			/>
			<TableColumn
				label="分组表头（header-line=2）很长很长很长很长很长很长很长很长很长"
				:header-line="2"
			>
				<TableColumn
					prop="city"
					label="城市（header-line=0 不限行数）"
					:header-line="0"
					:width="120"
				/>
				<TableColumn
					prop="amount"
					label="金额"
					:width="100"
				/>
			</TableColumn>
			<TableColumn
				prop="address"
				label="地址"
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
				label="姓名"
				:width="120"
			/>
			<TableColumn
				prop="address"
				label="地址（header-line=2）浙江省杭州市拱墅区祥园路38号浙报印务大厦15号入口4楼"
				:header-line="2"
				:min-width="200"
			/>
			<TableColumn
				prop="amount"
				label="金额"
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
				label="姓名"
				:width="120"
			/>
			<TableColumn
				prop="address"
				label="地址（header-line=3）浙江省杭州市拱墅区祥园路38号浙报印务大厦15号入口4楼"
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
import { ref, computed, watch, onBeforeUnmount } from 'vue';
import { Table, TableColumn } from '..';
import { Radio, RadioGroup } from '../../radio';
import { VcInstance } from '../../vc';

// 仅演示：修改全局配置，离开页面时还原
const original = VcInstance.options.TableColumn?.headerLine;
const globalLine = ref(original ?? '');
const globalLines = [
	{ label: '未设置', value: '' },
	{ label: '1', value: 1 },
	{ label: '2', value: 2 }
];
watch(globalLine, (v) => {
	VcInstance.options.TableColumn.headerLine = v === '' ? void 0 : v;
});
onBeforeUnmount(() => {
	VcInstance.options.TableColumn.headerLine = original;
});

const heightTable = ref();
const heightLayout = computed(() => heightTable.value?.layout.states || {});

const sort = ref({});
const typeOptions = [
	{ label: '代理升级', value: '代理升级' },
	{ label: '代理加入', value: '代理加入' }
];

const dataSource = ref(
	Array.from({ length: 20 }, (_, index) => ({
		id: index + 1,
		name: `用户 ${index + 1}`,
		date: `2016-05-${String(index + 1).padStart(2, '0')}`,
		type: index % 2 ? '代理升级' : '代理加入',
		city: '杭州',
		amount: (index + 1) * 100,
		address: '浙江省杭州市拱墅区祥园路38号浙报印务大厦15号入口4楼'
	}))
);
</script>
