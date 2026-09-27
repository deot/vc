## 表格（Table)
展示行列数据

### 何时使用
- 当有大量结构化的数据需要展现时。
- 当需要对数据进行排序、筛选、分页、自定义操作等复杂行为时。

### 避坑
> flex布局 + Tabs时要额外注意，否则宽度会被无限撑开
```vue
<template>
	<div style="display: flex;">
		<div>Flex布局时，要增加`flex: 1; overflow-x: auto;`</div>
		<div style="flex: 1; overflow-x: auto;">
			<Tabs>
				<TabsPane
					v-for="item in 10"
					:key="item"
					:label="`标签${item}`"
					:name="item"
				>
					<Table>
						<!-- any -->
					</Table>
				</TabsPane>
			</Tabs>
		</div>
	</div>
</template>
```

### 基本使用
基础的表格展示用法。
当 `Table` 元素中注入 `dataSource` 对象数组后，在 `TableColumn` 中用 `prop` 属性来对应对象中的键名即可填入数据，用 `label` 属性来定义表格的列名。可以使用 `width`属性来定义列宽 `min-width` 来设置对应列的最小宽度。

:::RUNTIME
```vue
<template>
	<Table :data="tableData1" @row-click="handleClick">
		<TableColumn
			prop="date"
			label="日期"
			width="180"
		/>
		<TableColumn
			prop="name"
			label="姓名"
		/>
		<TableColumn
			prop="address"
			label="地址"
			min-width="200"
		/>
	</Table>
</template>
<script setup>
import { ref } from 'vue';
import { Table, TableColumn } from '@deot/vc';

const tableData1 = ref([
	{
		date: '2011-11-02',
		name: '微一案',
		address: '浙江省杭州市拱墅区祥园路38号浙报印务大厦15号入口4楼/11号入口5楼'
	},
	{
		date: '2011-11-04',
		name: '微一案',
		address: '浙江省杭州市拱墅区祥园路38号浙报印务大厦15号入口4楼/11号入口5楼'
	},
	{
		date: '2011-11-01',
		name: '微一案',
		address: '浙江省杭州市拱墅区祥园路38号浙报印务大厦11号入口5楼'
	},
	{
		date: '2011-11-03',
		name: '微一案',
		address: '浙江省杭州市拱墅区祥园路38号浙报印务大厦11号入口5楼'
	}
]);

// row：点击的行；rowIndex：行号；column：点击的列
const handleClick = ({ row, rowIndex, column }) => {

};

</script>
```
:::

### 带斑马纹表格
设置属性 `stripe` ，表格会间隔显示不同颜色，用于区分不同行数据。

:::RUNTIME
```vue
<template>
	<Table :data="tableData2" stripe >
		<TableColumn
			prop="date"
			label="日期"
			width="180"
		/>
		<TableColumn
			prop="name"
			label="姓名"
		/>
		<TableColumn
			prop="address"
			label="地址"
		/>
	</Table>
</template>
<script setup>
import { ref } from 'vue';
import { Table, TableColumn } from '@deot/vc';

const tableData2 = ref([
	{
		date: '2011-11-02',
		name: '微一案',
		address: '浙江省杭州市拱墅区祥园路38号浙报印务大厦15号入口4楼/11号入口5楼'
	},
	{
		date: '2011-11-04',
		name: '微一案',
		address: '浙江省杭州市拱墅区祥园路38号浙报印务大厦15号入口4楼/11号入口5楼'
	},
	{
		date: '2011-11-01',
		name: '微一案',
		address: '浙江省杭州市拱墅区祥园路38号浙报印务大厦11号入口5楼'
	},
	{
		date: '2011-11-03',
		name: '微一案',
		address: '浙江省杭州市拱墅区祥园路38号浙报印务大厦11号入口5楼'
	}
]);
</script>
```
:::

### 带边框表格
默认情况下，`Table` 组件是不具有竖直方向的边框的，如果需要，可以使用`border`属性，

:::RUNTIME
```vue
<template>
	<Table :data="tableData3" border >
		<TableColumn
			prop="date"
			label="日期"
			width="180"
		/>
		<TableColumn
			prop="name"
			label="姓名"
		/>
		<TableColumn
			prop="address"
			label="地址"
		/>
	</Table>
</template>
<script setup>
import { ref } from 'vue';
import { Table, TableColumn } from '@deot/vc';

const tableData3 = ref([
	{
		date: '2011-11-02',
		name: '微一案',
		address: '浙江省杭州市拱墅区祥园路38号浙报印务大厦15号入口4楼/11号入口5楼'
	},
	{
		date: '2011-11-04',
		name: '微一案',
		address: '浙江省杭州市拱墅区祥园路38号浙报印务大厦15号入口4楼/11号入口5楼'
	},
	{
		date: '2011-11-01',
		name: '微一案',
		address: '浙江省杭州市拱墅区祥园路38号浙报印务大厦11号入口5楼'
	},
	{
		date: '2011-11-03',
		name: '微一案',
		address: '浙江省杭州市拱墅区祥园路38号浙报印务大厦11号入口5楼'
	}
]);
</script>
```
:::

### 尺寸
通过 `size` 调整字号与单元格的上下内边距，可选 `large`、`medium`、`small`、`mini`，默认为 `medium`。首末列的左右内边距不受影响；`medium` 的合计行最小高度为 44px，其余尺寸的合计行高度由内边距决定。嵌套在展开行等位置的表格只按自身的 `size`、`border` 等显示，不受外层表格影响。

:::RUNTIME
```vue
<template>
	<Table :data="tableDataSize" size="small" border show-summary>
		<TableColumn
			prop="date"
			label="日期"
			width="180"
		/>
		<TableColumn
			prop="name"
			label="姓名"
		/>
		<TableColumn
			prop="amount"
			label="金额"
		/>
	</Table>
</template>
<script setup>
import { ref } from 'vue';
import { Table, TableColumn } from '@deot/vc';

const tableDataSize = ref([
	{ date: '2011-11-02', name: '微一案', amount: 100 },
	{ date: '2011-11-04', name: '微一案', amount: 200 },
	{ date: '2011-11-01', name: '微一案', amount: 300 }
]);
</script>
```
:::

完整示例（切换各尺寸对比）：[尺寸](./examples/size.vue)

### 带状态表格
可将表格内容 `highlight` 显示，方便区分「成功、信息、警告、危险」等内容。添加 `rowClass` 属性返回对应行的类名。

:::RUNTIME
```vue
<template>
	<Table :data="tableData4" :row-class="tableRowClass">
		<TableColumn
			prop="date"
			label="日期"
			width="180"
		/>
		<TableColumn
			prop="name"
			label="姓名"
		/>
		<TableColumn
			prop="address"
			label="地址"
		/>
	</Table>
</template>
<script setup>
import { ref } from 'vue';
import { Table, TableColumn } from '@deot/vc';

const tableData4 = ref([
	{
		date: '2011-11-02',
		name: '微一案',
		address: '浙江省杭州市拱墅区祥园路38号浙报印务大厦15号入口4楼/11号入口5楼'
	},
	{
		date: '2011-11-04',
		name: '微一案',
		address: '浙江省杭州市拱墅区祥园路38号浙报印务大厦15号入口4楼/11号入口5楼'
	},
	{
		date: '2011-11-01',
		name: '微一案',
		address: '浙江省杭州市拱墅区祥园路38号浙报印务大厦11号入口5楼'
	},
	{
		date: '2011-11-03',
		name: '微一案',
		address: '浙江省杭州市拱墅区祥园路38号浙报印务大厦11号入口5楼'
	}
]);

const tableRowClass = ({ row, rowIndex }) => {
	if (rowIndex === 1) {
		return 'warning';
	} else if (rowIndex === 3) {
		return 'success';
	}
};
</script>
<style>
.vc-table .warning {
	background: oldlace!important;
}
.vc-table .success {
	background: #f0f9eb!important;
}
</style>
```
:::

### 固定表头
纵向内容过多时，可选择固定表头。只要在 `Table` 元素中定义了 `height` 属性，即可实现固定表头的表格，而不需要额外的代码。

:::RUNTIME
```vue
<template>
	<Table :data="tableData5" border stripe height="250">
		<TableColumn
			prop="date"
			label="日期"
			width="180"
		/>
		<TableColumn
			prop="name"
			label="姓名"
			width="180"
		/>
		<TableColumn
			prop="address"
			label="地址"
		/>
	</Table>
</template>
<script setup>
import { ref } from 'vue';
import { Table, TableColumn } from '@deot/vc';

const tableData5 = ref([{
	date: '2011-11-03',
	name: '微一案',
	address: '浙江省杭州市拱墅区祥园路38号浙报印务大厦15号入口4楼/11号入口5楼'
}, {
	date: '2011-11-02',
	name: '微一案',
	address: '浙江省杭州市拱墅区祥园路38号浙报印务大厦15号入口4楼/11号入口5楼'
}, {
	date: '2011-11-04',
	name: '微一案',
	address: '浙江省杭州市拱墅区祥园路38号浙报印务大厦15号入口4楼/11号入口5楼'
}, {
	date: '2011-11-01',
	name: '微一案',
	address: '浙江省杭州市拱墅区祥园路38号浙报印务大厦15号入口4楼/11号入口5楼'
}, {
	date: '2011-11-08',
	name: '微一案',
	address: '浙江省杭州市拱墅区祥园路38号浙报印务大厦15号入口4楼/11号入口5楼'
}, {
	date: '2011-11-06',
	name: '微一案',
	address: '浙江省杭州市拱墅区祥园路38号浙报印务大厦15号入口4楼/11号入口5楼'
}, {
	date: '2011-11-07',
	name: '微一案',
	address: '浙江省杭州市拱墅区祥园路38号浙报印务大厦15号入口4楼/11号入口5楼'
}]);
</script>
```
:::

### 固定列
横向内容过多时，可选择固定列。固定列需要使用 `fixed` 属性，它接受 `boolean` 值或者`left`、`right`，表示左边固定还是右边固定。

:::RUNTIME
```vue
<template>
	<Table :data="tableData5" border stripe height="250">
		<TableColumn
			prop="date"
			label="日期"
			width="180"
			fixed
		/>
		<TableColumn
			prop="name"
			label="姓名"
			width="180"

		/>
		<TableColumn
			prop="province"
			label="省份"
			width="180"

		/>
		<TableColumn
			prop="city"
			label="市区"
			width="180"
		/>
		<TableColumn
			prop="address"
			label="地址"
			width="180"
		/>
		<TableColumn
			prop="zip"
			label="邮编"
			width="180"
		/>
		<TableColumn
			label="操作"
			width="180"
			fixed="right"
		>
			<template #default>
				<Button type="text">编辑</Button>
				<Button type="text">查看</Button>
			</template>
		</TableColumn>
	</Table>
</template>
<script setup>
import { ref } from 'vue';
import { Table, Button, TableColumn } from '@deot/vc';

const tableData5 = ref([{
	date: '2011-11-02',
	name: '微一案',
	province: '浙江',
	city: '杭州市',
	address: '浙江省杭州市拱墅区祥园路38号浙报印务大厦15号入口4楼',
	zip: 200333
}, {
	date: '2011-11-04',
	name: '微一案',
	province: '浙江',
	city: '杭州市',
	address: '浙江省杭州市拱墅区祥园路38号浙报印务大厦11号入口5楼',
	zip: 200333
}, {
	date: '2011-11-01',
	name: '微一案',
	province: '浙江',
	city: '杭州市',
	address: '浙江省杭州市拱墅区祥园路38号浙报印务大厦11号入口5楼',
	zip: 200333
}, {
	date: '2011-11-03',
	name: '微一案',
	province: '浙江',
	city: '杭州市',
	address: '浙江省杭州市拱墅区祥园路38号浙报印务大厦11号入口5楼',
	zip: 200333
}]);
</script>
```
:::

### 多选
选择多行数据时使用 `Checkbox`。非常简单: 手动添加一个  `TableColumn` ，设 `type` 属性为 `selection` 即可。

:::RUNTIME
```vue
<template>
	<Table :data="tableData" border stripe>
		<TableColumn
			type="selection"
			width="65"
		/>
		<TableColumn
			prop="date"
			label="日期"
			width="180"
		/>
		<TableColumn
			prop="name"
			label="姓名"
		/>
		<TableColumn
			prop="address"
			label="地址"
		/>
	</Table>
</template>
<script setup>
import { ref } from 'vue';
import { Table, TableColumn } from '@deot/vc';

const tableData = ref([
	{
		date: '2011-11-02',
		name: '微一案',
		address: '浙江省杭州市拱墅区祥园路38号浙报印务大厦15号入口4楼/11号入口5楼'
	},
	{
		date: '2011-11-04',
		name: '微一案',
		address: '浙江省杭州市拱墅区祥园路38号浙报印务大厦15号入口4楼/11号入口5楼'
	},
	{
		date: '2011-11-01',
		name: '微一案',
		address: '浙江省杭州市拱墅区祥园路38号浙报印务大厦11号入口5楼'
	},
	{
		date: '2011-11-03',
		name: '微一案',
		address: '浙江省杭州市拱墅区祥园路38号浙报印务大厦11号入口5楼'
	}
]);
</script>
```
:::

### 排序

对表格进行排序，可快速查找或对比数据。

:::RUNTIME
```vue
<template>
	<Table
		:data="dataSource"
		v-model:sort="sort"
		@sort-change="handleSort"
	>
		<TableColumn
			prop="date"
			label="日期"
			sortable
			min-width="180"
		/>
		<TableColumn
			prop="name"
			label="姓名"
			width="180"
			sortable
		/>
		<TableColumn
			prop="address"
			label="地址"
			width="880"
		/>
	</Table>
</template>
<script setup>
import { ref } from 'vue';
import { Table, TableColumn } from '@deot/vc';

const sort = ref({ prop: 'date', order: 'descending' });
const tableData = ref([
	{
		date: '2011-11-02',
		name: '微一案',
		address: '浙江省杭州市拱墅区祥园路38号浙报印务大厦15号入口4楼/11号入口5楼'
	},
	{
		date: '2011-11-04',
		name: '微一案',
		address: '浙江省杭州市拱墅区祥园路38号浙报印务大厦15号入口4楼/11号入口5楼'
	},
	{
		date: '2011-11-01',
		name: '微一案',
		address: '浙江省杭州市拱墅区祥园路38号浙报印务大厦11号入口5楼'
	},
	{
		date: '2011-11-03',
		name: '微一案',
		address: '浙江省杭州市拱墅区祥园路38号浙报印务大厦11号入口5楼'
	}
]);

const handleSort = () => {};
</script>
```
:::

### 动态列与列显隐
通过 `v-model:columns` 拿到 Table 内部收集到的全部列，可用于"列管理"：勾选切换 `hidden` 控制某列是否渲染（不影响数据收集），也可以调整数组顺序按 `id` 重排列。

- 列可以用 `v-if`、`v-for`（含多级表头的子列）动态增删与移动，列顺序始终跟随模板。
- 列写在自定义组件内部时，调整顺序请用新数组替换，并经由 Table 插槽中的 props 传入该组件（不要原地修改数组），或者直接把 `v-for` 写在 Table 的插槽里；否则 Table 感知不到列的移动。
- 通过 `v-model:columns`（或[列拖拽](#列拖拽)）调整过顺序后，以外部顺序为准，模板中的移动不再影响这些列；新出现的列排在它在模板中的前一列之后。
- 多级表头下逐层重排：列表中是叶子列，分组按其子列中最靠前的一个排序，子列只在所属分组内调整。
- 写回与模板一致的顺序（或只修改 `hidden`、不调整顺序）时，恢复跟随模板。

:::RUNTIME
```vue
<template>
	<div>
		<label
			v-for="col in columns"
			:key="col.id"
			style="margin-right: 12px;"
		>
			<input
				type="checkbox"
				:checked="!col.hidden"
				@change="toggle(col)"
			>
			{{ col.label || col.type }}
		</label>
	</div>
	<Table v-model:columns="columns" :data="tableData">
		<TableColumn
			type="selection"
			width="55"
		/>
		<TableColumn
			prop="date"
			label="日期"
			width="180"
		/>
		<TableColumn
			prop="name"
			label="姓名"
		/>
		<TableColumn
			prop="address"
			label="地址"
		/>
	</Table>
</template>
<script setup>
import { ref } from 'vue';
import { Table, TableColumn } from '@deot/vc';

const columns = ref([]);
const tableData = ref([
	{
		date: '2011-11-02',
		name: '微一案',
		address: '浙江省杭州市拱墅区祥园路38号浙报印务大厦15号入口4楼/11号入口5楼'
	},
	{
		date: '2011-11-04',
		name: '微一案',
		address: '浙江省杭州市拱墅区祥园路38号浙报印务大厦15号入口4楼/11号入口5楼'
	},
	{
		date: '2011-11-01',
		name: '微一案',
		address: '浙江省杭州市拱墅区祥园路38号浙报印务大厦11号入口5楼'
	}
]);

const toggle = (col) => {
	columns.value = columns.value.map(item => (
		item.id === col.id ? { ...item, hidden: !item.hidden } : item
	));
};
</script>
```
:::

### 筛选

在列上设置 `filter-options` 后，表头显示筛选图标。表格只负责交互，选中的值通过 `onChange` / `onUpdate:modelValue` 交给外部，数据过滤由外部完成（与排序一致）。`filter-options` 会原样传给表头的筛选组件（`v-bind`），字段见下方 [filter-options](#filter-options)。

- `max` 为可选数量上限，默认 `1`：
  - `max` 为 `1` 时是单选：点选即生效，「全部」清空。
  - `max` 大于 `1` 时是多选：勾选后点「确认」生效，「重置」清空；选满 `max` 个后，其余选项置灰。
- `modelValue` 的形态与 `Select` 一致：数组，或者 `'a,b'` 字符串 / 单个值，输出保持原形态。
- 写了 `modelValue`（即使值为 `undefined`）即为受控：需在 `onUpdate:modelValue` 或 `onChange` 中写回才生效，不写回（如校验不通过）则保持原值。
- 不写 `modelValue` 时由组件自己记录确认结果，只用 `onChange` 即可；此时多选收到数组，单选收到单个值。

:::RUNTIME
```vue
<template>
	<Table :data="filteredData">
		<TableColumn
			prop="type"
			label="类型"
			min-width="180"
			:filter-options="{
				data: types,
				max: 2,
				modelValue: typeFilter,
				'onUpdate:modelValue': v => (typeFilter = v)
			}"
		/>
		<TableColumn
			prop="name"
			label="姓名"
			width="180"
		/>
		<TableColumn
			prop="address"
			label="地址"
		/>
	</Table>
</template>
<script setup>
import { ref, computed } from 'vue';
import { Table, TableColumn } from '@deot/vc';

const types = [
	{ label: '代理升级', value: 1 },
	{ label: '代理加入', value: 2 },
	{ label: '代理退出', value: 3, disabled: true }
];
const typeFilter = ref([]);
const tableData = ref([
	{
		type: 1,
		name: '微一案',
		address: '浙江省杭州市拱墅区祥园路38号浙报印务大厦15号入口4楼/11号入口5楼'
	},
	{
		type: 2,
		name: '微一案',
		address: '浙江省杭州市拱墅区祥园路38号浙报印务大厦15号入口4楼/11号入口5楼'
	},
	{
		type: 1,
		name: '微一案',
		address: '浙江省杭州市拱墅区祥园路38号浙报印务大厦11号入口5楼'
	},
	{
		type: 2,
		name: '微一案',
		address: '浙江省杭州市拱墅区祥园路38号浙报印务大厦11号入口5楼'
	}
]);

const filteredData = computed(() => {
	if (!typeFilter.value.length) return tableData.value;
	return tableData.value.filter(row => typeFilter.value.includes(row.type));
});
</script>
```
:::

完整示例（单选受控 / 多选 `max: 2` / 只用 `onChange`）：[筛选](./examples/filter.vue)

### 树形数据与懒加载
支持树类型的数据的显示。当 `row` 中包含 `children` 字段时，被视为树形数据。渲染树形数据时，必须要指定 `primary-key`，且其值在整棵树（含懒加载得到的子行）中唯一；重复出现的值只有首次出现的行可展开。支持子节点数据异步加载：设置 `Table` 的 `lazy-tree` 属性为 `true` 与加载函数 `load-expand`，并通过 `row` 中的 `hasChildren` 字段标记可加载子节点的行（仅 `lazy-tree` 时生效）。`children` 与 `hasChildren` 都可以通过 `tree-map` 配置。

- 展开的子行铺平后逐行渲染，普通表格、`height` 与 `virtualized` 虚拟化表格都适用；缩进与展开图标显示在第一个普通列（非 `selection` / `index` / `expand`）中，缩进宽度由 `indent` 控制；每个单元格带有 `vc-table__row--level-{level}` 类名，便于按层级定制样式。
- 行号（`rowIndex`、斑马纹、`get-span` 的 `rowIndex` 等）按当前可见行计算。
- 合计行（`show-summary` / `get-summary`）基于根行 `data` 计算，不含子行。
- 无障碍：树形表格以 `treegrid` 呈现，行带有 `aria-level` 与 `aria-expanded`。
- 展开状态按 `primary-key` 记录：数据更新后保留；`default-expand-all` 只作为未操作过的节点的默认值，已收起的节点不会被重新展开；`expand-row-value` 设置当前展开的节点。
- `expand-change` 的参数为 `{ type: 'tree', row, expanded, maxLevel }`，`maxLevel` 为当前可见行的最大层级（根为 `0`），可用于调整树形列的宽度。
- `load-expand(row, treeNode)` 可以返回数组或 `Promise`，`treeNode.level` 为该节点的层级；加载失败时节点恢复为待加载。展开尚未加载的节点（点击或 `toggleRowExpansion`）会先触发加载。
- 嵌套的 `children` 可以原地增删（如 `row.children.splice(index, 1)`），表格会同步更新，被移除的行同时移出选中项；若之后还要增删懒加载得到的子行，`load-expand` 请返回响应式数组（如 `reactive([...])`）。

:::RUNTIME
```vue
<template>
	<Table
		:data="dataSource"
		:load-expand="loadExpand"
		lazy-tree
		primary-key="id"
		@expand-change="handleExpandChange"
	>
		<TableColumn
			type="selection"
			width="55"
		/>
		<TableColumn
			:width="treeWidth"
			prop="date"
			label="日期"
		/>
		<TableColumn
			prop="name"
			label="姓名"
			min-width="180"
		/>
		<TableColumn
			prop="address"
			label="地址"
		/>
	</Table>
</template>
<script setup>
import { ref, reactive } from 'vue';
import { Table, TableColumn } from '@deot/vc';

const random = () => Math.ceil(Math.random() * 1000);
const createRow = (id, extra = {}) => ({
	id,
	date: '2011-11-02',
	name: `代号 - ${random()}`,
	address: `祥园路${random()}号`,
	...extra
});

const dataSource = ref([
	createRow(1, { hasChildren: true }),
	createRow(2, { hasChildren: true }),
	createRow(3, {
		children: [
			createRow(31),
			createRow(32)
		]
	}),
	createRow(4)
]);
const treeWidth = ref(180);

let seed = 100;
const loadExpand = (row, treeNode) => {
	return new Promise((resolve) => {
		setTimeout(() => {
			// 返回响应式数组，之后对它的增删会同步到表格
			resolve(reactive([
				createRow(++seed, { hasChildren: treeNode.level < 1 }),
				createRow(++seed)
			]));
		}, 1000);
	});
};

const handleExpandChange = ({ maxLevel }) => {
	treeWidth.value = 180 + maxLevel * 16;
};
</script>
```
:::

### 展开行
当行内容过多并且不想显示横向滚动条时，可以使用展开行功能。添加 `type="expand"` 的 `TableColumn`，其默认插槽即为展开行的内容，参数为 `{ row, rowIndex, store }`。

- 通过 `expand-row-value`（需设置 `primary-key`）指定展开的行，或调用 `toggleRowExpansion(row, expanded)` 切换。
- 展开状态按 `primary-key` 记录（未设置时按行对象），数据更新后保留；`default-expand-all` 只作为未操作过的行的默认值，已收起的行不会被重新展开。
- `expand-change` 的参数为 `{ type: 'expand', row, expanded, expandedRows }`，`expanded` 为该行是否展开，`expandedRows` 为当前展开的行（按显示顺序）。
- 通过 `v-model:columns` 隐藏 expand 列时，展开内容一并隐藏。
- 展开内容的高度可以任意变化，虚拟化表格会自动重新测量。
- 展开行仅对单行渲染块生效：被 `get-span` 纵向合并在一起的行不渲染展开内容。

:::RUNTIME
```vue
<template>
	<Table
		:data="tableData"
		:expand-row-value="[2]"
		primary-key="id"
	>
		<TableColumn type="expand">
			<template #default="{ row }">
				<p>姓名：{{ row.name }}</p>
				<p>地址：{{ row.address }}</p>
			</template>
		</TableColumn>
		<TableColumn
			prop="date"
			label="日期"
			width="180"
		/>
		<TableColumn
			prop="name"
			label="姓名"
		/>
	</Table>
</template>
<script setup>
import { ref } from 'vue';
import { Table, TableColumn } from '@deot/vc';

const tableData = ref([
	{
		id: 1,
		date: '2011-11-02',
		name: '微一案',
		address: '浙江省杭州市拱墅区祥园路38号浙报印务大厦15号入口4楼/11号入口5楼'
	},
	{
		id: 2,
		date: '2011-11-04',
		name: '微一案',
		address: '浙江省杭州市拱墅区祥园路38号浙报印务大厦11号入口5楼'
	},
	{
		id: 3,
		date: '2011-11-01',
		name: '微一案',
		address: '浙江省杭州市拱墅区祥园路38号浙报印务大厦11号入口5楼'
	}
]);
</script>
```
:::

完整示例：

- [树形数据：嵌套 / 懒加载 / 删除 / 编辑 / 渲染模式切换](./examples/tree.vue)
- [展开行：删除 / 编辑 / 渲染模式切换](./examples/expand.vue)

### 拖拽排序

`draggable` 可以是布尔值或数组 `[行, 列]`：`true` 等于 `[true, false]`，只开启整行拖拽；拖动表头调整列顺序见下方「列拖拽」。

行拖拽支持两种方式，可以同时开启：

- **整行拖拽**：设置 `draggable`（或数组的第一项）后，按住行内任意位置拖动，整行显示 `move` 光标。从输入框、按钮、链接、复选框、展开图标上按下时不会发起拖拽。
- **锚点拖拽**：添加 `type="drag"` 的 `TableColumn`，只能从这一列的把手（浅色的 `drag` 图标）拖动。自定义把手时，给元素加上 `vc-table__drag-handle` 类名即可。
- 两者同时开启时，整行不显示 `move` 光标，由把手提示可拖动；按住行内其它位置仍可拖动。
- 与展开列（`type="expand"`）、树形列同时使用时，把 `drag` 列放在它们之前。

拖拽以**块**为单位。普通表格一行一块；`get-span` 纵向合并在一起的几行是一块，会整体移动，落点只在块与块之间。

- 移动超过 4px 才开始拖拽，单纯的点击、勾选不受影响。按 Esc 取消。
- 拖动时被拖的块变暗，插入线标出落点，跟随行随指针上下移动。
- 指针靠近表体上下边缘时自动滚动：设置了 `height`/`max-height` 时滚动表体，流式高度时滚动外层的滚动容器或窗口。
- 触摸设备上，从把手按下可以直接拖动；整行拖拽需要长按约 300ms，长按前移动视为滚动。

非树形表格的 `data` 由外部持有，Table 不会修改传入的数组（树形表格见下方「树形表格」）：

- 松手且顺序变化时，先发出 `update:data`（新数组，行对象的引用不变），再发出 `block-drop`。使用 `v-model:data` 即可生效。
- 需要异步确认或先调用接口时，不用 `v-model`，在 `block-drop` 里处理，成功后再写回 `rawData`；不写回则行回到原位。
- 只传 `:data` 且不处理事件时，松手后行会回到原位。
- 写回拖拽得到的新顺序（包括它的副本）时，选中项、当前行、展开状态都会保留；其它情况下传入新数组，仍按原有规则清空选中项。

:::RUNTIME
```vue
<template>
	<div style="margin-bottom: 8px;">{{ message }}</div>
	<Table
		v-model:data="tableData"
		primary-key="id"
		draggable
		:allow-drag="({ rows }) => !rows[0].locked"
		@block-drop="handleDrop"
	>
		<TableColumn type="drag" />
		<TableColumn
			prop="name"
			label="姓名"
			width="180"
		/>
		<TableColumn
			prop="date"
			label="日期"
			width="180"
		/>
		<TableColumn
			prop="address"
			label="地址"
		/>
	</Table>
</template>
<script setup>
import { ref } from 'vue';
import { Table, TableColumn } from '@deot/vc';

const message = ref('按住行内任意位置或左侧把手拖动；「锁定」的行不可拖动');
const tableData = ref([
	{ id: 1, name: '微一案', date: '2011-11-01', address: '浙江省杭州市拱墅区祥园路38号' },
	{ id: 2, name: '微二案', date: '2011-11-02', address: '浙江省杭州市拱墅区祥园路39号' },
	{ id: 3, name: '微三案（锁定）', date: '2011-11-03', address: '浙江省杭州市拱墅区祥园路40号', locked: true },
	{ id: 4, name: '微四案', date: '2011-11-04', address: '浙江省杭州市拱墅区祥园路41号' }
]);

const handleDrop = ({ rows, from, to }) => {
	message.value = `${rows[0].name}：${from.index} → ${to.index}`;
};
</script>
```
:::

#### 树形表格

树形表格按行拖拽，被拖行连同子孙一起移动，可以跨层级：

- 行的上 / 下四分之一落在与相邻行之间的间隙；中间一半表示成为该行的子行（追加到末尾），此时框住目标行。
- 子树末尾的间隙可以接在多个层级，由指针在树形列上的横向位置决定，插入线缩进到对应层级。
- 不能拖进自身或自己的子孙；没有主键值的行、尚未加载的懒加载节点（`lazy-tree` 下带 `hasChildren`）不能作为子行的目标，中间区域按上下两半处理。
- 放进收起的节点或叶子行时，目标节点随之展开；叶子行会新建子行数组（字段名随 `tree-map`）。
- 同时配置了 `get-span` 时不能拖拽。

树形表格先**原地修改**数据（与 Tree 组件一致），再发出事件：

- 被拖行从原兄弟数组中移除，插入到新父行的子行：根级为 `data`，子级为父行的 `children`，懒加载的子行为 `load-expand` 返回的数组。传入的数据不能是只读（`readonly`）的。`lazy-tree` 下由数据提供子行的节点被移空后，它的 `hasChildren` 会被置为 `false`，成为叶子行，不再按懒加载节点加载。
- 之后发出 `update:data` 与 `block-drop`。`update:data` 为根数组的副本（与非树形表格一致，总是新数组；嵌套的子行数组仍是原地修改的同一批对象），使用 `v-model:data` 时写回即可；不写回时数据也已经修改。
- `block-drop` 的 `from` / `to` 为移动前后的位置 `{ parent, index }`（`parent` 为 `null` 表示根级，`index` 为兄弟行中的下标），可据此调用接口保存。
- 行对象的引用不变，写回 `update:data` 发出的数组（包括异步写回）时选中项、当前行、展开状态都会保留。数据已原地修改，写回它的副本与普通的新数组无法区分，按新数据处理（清空选中项）；`expand-selectable` 为 `false` 时，被移成子行的已选中行会移出选中项。
- 需要限制落点时使用 `allow-drop`，例如只允许同级：`({ from, to }) => from.parent === to.parent`。[Tree](../tree) 的 `allow-drop` 同样带 `position` / `from` / `to`（`parent` 为 TreeNode），这类判断两个组件通用。

:::RUNTIME
```vue
<template>
	<div style="margin-bottom: 8px;">{{ message }}</div>
	<Table
		v-model:data="tableData"
		primary-key="id"
		draggable
		default-expand-all
		@block-drop="handleDrop"
	>
		<TableColumn type="drag" />
		<TableColumn
			prop="name"
			label="名称"
			width="240"
		/>
		<TableColumn
			prop="date"
			label="日期"
		/>
	</Table>
</template>
<script setup>
import { ref } from 'vue';
import { Table, TableColumn } from '@deot/vc';

const message = ref('拖到行的中间成为子行；子树末尾按横向位置选择层级');
const tableData = ref([
	{
		id: 1,
		name: '部门 A',
		date: '2011-11-01',
		children: [
			{ id: 11, name: '成员 A-1', date: '2011-11-02' },
			{ id: 12, name: '成员 A-2', date: '2011-11-03' }
		]
	},
	{ id: 2, name: '部门 B', date: '2011-11-04', children: [{ id: 21, name: '成员 B-1', date: '2011-11-05' }] },
	{ id: 3, name: '部门 C', date: '2011-11-06' }
]);

// 数据已原地修改（v-model 写回根数组的副本），这里按 from / to 保存
const handleDrop = ({ rows, from, to }) => {
	const place = ({ parent, index }) => `${parent ? parent.name : '根级'}[${index}]`;
	message.value = `${rows[0].name}：${place(from)} → ${place(to)}`;
};
</script>
```
:::

#### 列拖拽

`:draggable="[false, true]"`（或 `[true, true]`，行、列同时开启）后，按住表头拖动可以调整列顺序：

- 移动超过 4px 才开始拖拽，按 Esc 取消；触摸设备上需要长按约 300ms。从排序、筛选、提示图标、复选框上按下，或在表头右缘的列宽拖拽区按下时，不会发起列拖拽。
- `selection`、`index`、`expand`、`drag` 等结构列不能拖动，也不作为落点。
- 只在同一父级内调整：多级表头下，分组表头连同子列一起移动，分组内的列只在所属分组内移动；左固定、右固定与不固定的列只在各自的分组内调整。
- 拖动时被拖的列变暗，竖向插入线标出落点，跟随块随指针横向移动；拖动不固定的列时，指针靠近表体左右边缘会横向自动滚动。
- 新顺序在表格内部生效，并经 `update:columns` 发出新的列列表，之后依次发出 `column-drop`、`column-dragend`。不绑定 `v-model:columns` 也能拖动；绑定后可以保存、恢复列顺序（见[动态列与列显隐](#动态列与列显隐)）。
- `allow-drag` / `allow-drop` 与行拖拽共用，参数中的 `type` 区分行（`'block'`）与列（`'column'`）；行、列同时开启时请按 `type` 分别处理。
- 树形表格的缩进与展开图标显示在第一个普通列；把别的列拖到它之前后，缩进与展开图标会移到新的第一个普通列。

:::RUNTIME
```vue
<template>
	<div style="margin-bottom: 8px;">顺序：{{ columns.map(item => item.label || item.type).join(' / ') }}</div>
	<Table
		v-model:columns="columns"
		:data="tableData"
		:draggable="[false, true]"
		:allow-drag="({ type, column }) => type !== 'column' || column.prop !== 'name'"
		border
	>
		<TableColumn type="selection" />
		<TableColumn
			prop="name"
			label="姓名（锁定）"
			width="140"
		/>
		<TableColumn
			prop="date"
			label="日期"
			width="140"
		/>
		<TableColumn
			prop="address"
			label="地址"
		/>
	</Table>
</template>
<script setup>
import { ref } from 'vue';
import { Table, TableColumn } from '@deot/vc';

// v-model:columns 回填为 { id, prop, label, type, hidden } 的列表，可以保存下来恢复列顺序
const columns = ref([]);
const tableData = ref([
	{ id: 1, name: '微一案', date: '2011-11-01', address: '浙江省杭州市拱墅区祥园路38号' },
	{ id: 2, name: '微二案', date: '2011-11-02', address: '浙江省杭州市拱墅区祥园路39号' }
]);
</script>
```
:::

完整示例：

- [拖拽排序：整行 / 把手 / 虚拟滚动 / 合并块 / 异步确认 / 展开行 / 滚动容器](./examples/drag.vue)
- [树形表格拖拽：嵌套 / 懒加载 / 只允许同级 / 虚拟滚动](./examples/drag-tree.vue)
- [列拖拽：v-model:columns / 固定列与横向滚动 / 多级表头 / allowDrag、allowDrop / 行列同时拖拽](./examples/drag-column.vue)

### 外部视口虚拟化

当 Table 位于页面或已有 Scroller 的正常文档流中，又需要渲染大量数据时，可以在不设置 `height`/`max-height` 的前提下启用 `virtualized`：

```vue
<template>
	<section>其他头部内容</section>
	<Table
		virtualized
		primary-key="id"
		:data="tableData"
	>
		<TableColumn prop="name" label="名称" />
		<TableColumn prop="description" label="说明" />
	</Table>
	<section>其他尾部内容</section>
</template>
```

纵向主轴由最近的外部 VC Scroller/原生滚动祖先承载，找不到时使用 Window；Table 内部仍承载横向滚动，并继续同步表头、表体、合计行和固定列。

```text
Window / Scroller
├── 其他头部内容
├── TableHeader
├── 虚拟化 TableBody
├── TableFooter / Summary
└── 其他尾部内容
```

- 前置内容只改变 Table 在外部容器中的绝对位置，不进入虚拟行 position。
- TableBody 的虚拟占位高度参与正常文档流，后置内容会随数据增长自然后移。
- 可见范围和加载边界使用 Table 自身区域；外部尾部内容不计入 Table 边界。
- 动态行高、fixed columns、summary、append、empty、selection、expand、hover 等功能沿用固定高度虚拟表格的现有语义。
- 数据变化、行尺寸变化、表格宽度变化都会自动处理：虚拟行由内部 RecycleList 按需测量，吸底 dock（横向滚动条 + 合计行）随行尺寸变化自动刷新。只有外部前置内容发生无法自动观察的位置变化时，才需要调用 `refreshLayout()`。

渲染模式优先级如下：

| 配置 | 渲染路径 |
| --- | --- |
| 存在 `height` | 现有固定高度 RecycleList；`virtualized` 不改变行为 |
| 无 `height`、存在 `max-height` | 现有 maxHeight + NormalList；忽略 `virtualized` |
| 无 `height`/`max-height`、`virtualized=true` | 外部 viewport RecycleList |
| 无高度且 `virtualized=false` | 现有流式 NormalList |

同时传入 `height` 和 `max-height` 时继续由 `height` 优先。

#### Affix 兼容性

表头、底部 dock 的吸附直接复用 Affix 组件（不改用 CSS Sticky）：

- 底部 dock 由横向滚动条和合计行组成，`affix` 的 bottom 项作用于整个 dock。流式高度下横向滚动条挂在 dock 顶部（表体底部 / 合计行顶部），宽度与表体一致；没有合计行时，dock 里只有横向滚动条。
- Window 下继续使用当前默认的 `fixed: true` 行为。
- 外层为 VC Scroller 时，使用 `fixed` 模式，并通过 `offset` 指定 Scroller 视口到窗口边缘的距离（见下方示例）。`fixed: false` 要求 Affix 与 Scroller 之间没有定位元素，而 Table 根节点为 `position: relative`，因此不适用。
- `boolean`、`[top, bottom]`、`object` 的解释和 `refreshAffix()` 方法保持不变。
- 吸附范围默认限定为表体（`target` 为本表格的 `.vc-table__body-wrapper`）：表头不越过表体底部、底部 dock 不越过表体顶部，表格滚出后随之离开；可在配置对象中传入 `target` 覆盖。
- Table 设置了 `height`/`max-height` 时，`affix` 仍按原规则强制失效，横向滚动条仍位于表格底部。

流式高度下横向滚动条与合计行的吸底行为：

| show-summary | affix bottom | 结果 |
| --- | --- | --- |
| 否 | 开 | 只有横向滚动条吸底 |
| 否 | 关 | 横向滚动条在表体底部，不吸底 |
| 是 | 开 | 横向滚动条与合计行一起吸底，滚动条在合计行顶部 |
| 是 | 关 | 都不吸底 |

横向滚动条与表格其余部分一样，鼠标悬停在表格上（包括已吸底的 dock）时显示。

外层为 VC Scroller 时，Affix 按窗口定位，两端的 `offset` 需要按 Scroller 视口计算，并在窗口滚动、尺寸变化后重新计算：

```js
const offsets = reactive({ top: 0, bottom: 0 });
const updateOffsets = () => {
	const rect = scrollerRef.value.wrapper.getBoundingClientRect();
	offsets.top = Math.max(0, rect.top);
	offsets.bottom = Math.max(0, window.innerHeight - rect.bottom);
	nextTick(() => tableRef.value.refreshAffix());
};
// <Table :affix="[{ offset: offsets.top }, { offset: offsets.bottom }]" />
```

已知限制：Affix 的活动范围按窗口边缘判断，表格滚出 Scroller 顶部或底部附近时，吸附中的表头 / dock 可能短暂画到 Scroller 之外；另外吸附后为 `position: fixed`，页面自身横向滚动时不会跟随。

#### 延迟展示尾部内容

表体逐批构建时，`append` 与表格之后的页面内容会被不断往下推。`lazy-tail` 让 `append` 等数据全部进入虚拟列表后再出现；页面上的后置内容可以通过 `load-change` 跟上：

```vue
<Table virtualized lazy-tail :data="rows" @load-change="loadState = $event">
	<template #append>…</template>
</Table>

<section v-show="loadState.isEnd">页面后置内容</section>
```

- `load-change` 只对外单向推送，没有对应属性。内部虚拟列表以 `disabled` 直接接收 `data`，此时 `isEnd` 表示数据已全部构建并完成布局。
- 普通表格（未设置 `height` 且未启用 `virtualized`）一次渲染完，挂载即推送 `isEnd: true`，同样的写法依然成立。
- 合计行不受 `lazy-tail` 影响。

完整示例：

- [Window 前置内容—虚拟 Table—后置内容](./examples/virtualized-window.vue)
- [VC Scroller 中的虚拟 Table](./examples/virtualized-scroller.vue)

## API

### Table props
| 属性                      | 说明                                                                                                                                         | 类型                                                         | 可选值                         | 默认值     |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- | --------------------------- | ------- |
| data                    | 显示的数据；拖拽排序时使用 `v-model:data` 接收新顺序                                                                                                  | `Array`                                                    | -                           | -       |
| height                  | `Table` 的高度，默认为自动高度。如果 `height` 为 `number` 类型，单位 px；如果 `height` 为 `string` 类型，则这个高度会设置为 `Table` 的 style.height 的值，Table 的高度会受控于外部样式。       | `string`、`number`                                          | -                           | -       |
| max-height              | `Table` 的最大高度                                                                                                                              | `string`、`number`                                          | -                           | -       |
| virtualized             | 无 `height`/`max-height` 时启用外部 viewport 行虚拟化；存在 `height` 或 `max-height` 时不改变原有渲染路径                                                                 | `boolean`                                                   | -                           | `false` |
| lazy-tail               | 延迟展示 `append` slot，直到数据全部进入虚拟列表；普通表格视为已到末尾，不影响合计行 | `boolean` | - | `false` |
| stripe                  | 是否为斑马纹 `table`                                                                                                                             | `boolean`                                                  | -                           | `false` |
| border                  | 是否带有纵向边框                                                                                                                                   | `boolean`                                                  | -                           | `false` |
| size                    | `Table` 的尺寸：调整字号与单元格的上下内边距                                                                                                           | `string`                                                   | `large` 、 `medium` 、 `small` 、 `mini` | `medium` |
| fit                     | 列的宽度是否自撑开：列宽之和不足表格宽度时，未设 `width` 的列按比例分配剩余宽度；所有列都设了 `width` 时，剩余宽度给最后一个非固定列（全是固定列时给最后一列）。为 `false` 时不自撑开 | `boolean`                                                  | -                           | `true`  |
| show-header             | 是否显示表头                                                                                                                                     | `boolean`                                                  | -                           | `true`  |
| highlight               | 是否要高亮当前行                                                                                                                                   | `boolean`                                                  | -                           | `false` |
| current-row-value       | 当前行的`[id]/value`唯一值（树形表格含子行），只写属性                                                                                                                   | `string`、 `number`                                         | -                           | -       |
| row-height              | 行的固定高度                                                                                                                                     |                                                            |                             |         |
| row-class               | 行的 `className`，仅作用于单行块对应的 `vc-table__tr`；存在 `getSpan` 合并时不生效，请用 `cell-class`。支持字符串或 `Function({ row, rowIndex })`。 | `Function({ row, rowIndex })`、 `string`                     | -                           | -       |
| row-style               | 行的 `style`，仅作用于单行块对应的 `vc-table__tr`；存在 `getSpan` 合并时不生效，请用 `cell-style`。支持对象或 `Function({ row, rowIndex })`。 | `Function({ row, rowIndex })`、 `Object`                     | -                           | -       |
| cell-class              | 单元格的 `className` 的回调方法，也可以使用字符串为所有单元格设置一个固定的 `className`。                                                                                  | `Function({row, column, rowIndex, columnIndex})`、 `string` | -                           | -       |
| cell-style              | 单元格的 style 的回调方法，也可以使用一个固定的 Object 为所有单元格设置一样的 Style。                                                                                      | `Function({row, column, rowIndex, columnIndex})`、 `Object` | -                           | -       |
| header-row-class        | 表头 `vc-table__tr` 的 `className`，支持字符串或 `Function()`（无参数）。                                                                                         | `Function()`、`string`                                      | -                           | -       |
| header-row-style        | 表头 `vc-table__tr` 的 `style`，支持对象或 `Function()`（无参数）。                                                                                               | `Function()`、 `Object`                                     | -                           | -       |
| header-cell-class       | 表头单元格的 `className` 的回调方法，也可以使用字符串为所有表头单元格设置一个固定的 `className`。                                                                              | `Function({row, column, rowIndex, columnIndex})`, `string` | -                           | -       |
| header-cell-style       | 表头单元格的 `style` 的回调方法，也可以使用一个固定的 `Object` 为所有表头单元格设置一样的 `Style`。                                                                            | `Function({row, column, rowIndex, columnIndex})`, `Object` | -                           | -       |
| primary-key             | 行数据的 Key，用来优化 Table 的渲染；在使用 reserve-selection 功能的情况下，该属性是必填的。类型为 string 时，支持多层访问：`user.info.id`，但不支持 `user.info[0].id`，此种情况请使用 `Function`。 | `Function(row)`、`string`                                   | -                           | -       |
| empty-text              | 空数据时显示的文本内容，也可以通过 `slot="empty"` 设置                                                                                                        | `string`                                                   | -                           | 暂无数据    |
| default-expand-all      | 是否默认展开所有行（展开行与树形节点）；仅作为未操作过的行的默认值                                                                                   | `boolean`                                                  | -                           | false   |
| lazy-tree               | 树形数据的子节点是否懒加载，需配合 `load-expand` 使用；通过 `row` 的 `hasChildren` 标记可加载的节点 | `boolean` | - | `false` |
| load-expand             | 懒加载子节点的方法，返回子行数组或 `Promise<Array>`；`treeNode` 为 `{ level, indent, expandable, expanded, loading }`，`level` 根为 `0` | `Function(row, treeNode)` | - | - |
| tree-map                | 树形数据的字段映射 | `{ children, hasChildren }` | - | `{ children: 'children', hasChildren: 'hasChildren' }` |
| indent                  | 树形数据每一层的缩进（px） | `number` | - | `16` |
| expand-row-value        | 设置 `Table` 当前展开的行（展开行与树形节点），需要设置 `primary-key` 属性才能使用，该属性为展开行的 `[id]/value` 数组；未列出的行取 `default-expand-all`。                                                               | `Array`                                                    | -                           | -       |
| expand-selectable       | 树形子行是否可选择；为 `false` 时子行的勾选框隐藏，全选只作用于根行                                                                                                                             | `boolean`                                                  | -                           | `true`  |
| show-summary            | 是否在表尾显示合计行                                                                                                                                 | `boolean`                                                  | -                           | `false` |
| sum-text                | 合计行第一列的文本                                                                                                                                  | `string`                                                   | -                           | 合计      |
| get-summary             | 自定义的合计计算方法                                                                                                                                 | `Function({ columns, data })`                              | -                           | -       |
| get-span                | 合并行或列的计算方法；开启 / 关闭（传入与否）立即生效，换成另一个函数时在 data 或列变化后按新规则生效                                                                                                                                 | `Function({ row, column, rowIndex, columnIndex })`         | -                           | -       |
| indeterminate           | 在多选表格中，当仅有部分行被选中时，点击表头的多选框时的行为。若为 `true`，则选中所有行；若为 `false`，则取消选择所有行                                                                        | `boolean`                                                  | -                           | `true`  |
| sort                    | 默认的排序列的 `prop` 和顺序。它的`prop`属性指定默认的排序的列，`order`指定默认排序的顺序                                                                                    |                                                            |                             |         |
| delay                   | 延迟选择，排除transition的影响                                                                                                                       |                                                            |                             |         |
| resizable               | 是否可以伸缩(总开关/单独的column.resizable也可以设置)                                                                                                                                     |                                                            |                             |         |
| affix                   | 流式高度下（含 `virtualized` 外部虚拟化，未设置 `height`/`max-height`）表头吸顶、底部 dock（横向滚动条 + 合计行）吸底。`boolean` 同时作用于两端；`array` 为 `[top, bottom]`，每项可为 `boolean` 或 [Affix](../affix) 配置对象；`object` 同时作用于两端。没有合计行时 bottom 项只控制横向滚动条。设置了 `height`/`max-height` 时强制失效。 | `boolean`、`array`、`object`                                  | -                           | `false` |
| columns                 | `v-model` 暴露 Table 收集到的全部 leaf 列（含 `selection`/`expand`/`index` 等无 `prop` 的结构列），每项为 `{ id, prop, label, type, hidden }`。外部可写回两个维度：调整数组顺序（按 `id` 重排，多级表头下逐层生效）、把某项 `hidden` 置 `true/false`（按 `id` 控制该列是否渲染，被隐藏列仍出现在暴露快照中）。列拖拽后的新顺序同样经此发出。其它列属性请用 `TableColumn` 的 props 控制。 | `Array`                                                    | -                           | `[]`    |
| draggable               | 拖拽排序，数组依次为 `[整行拖拽, 列拖拽]`，`true` 等于 `[true, false]`。整行拖拽按住行内任意位置拖动（以块为单位，`get-span` 纵向合并的行整体移动），只从把手拖动时使用 `type="drag"` 的列（不受第一项影响）；新顺序经 `update:data` 发出，配合 `v-model:data` 使用；树形表格会先原地修改 `data`，同时配置 `get-span` 时不可拖拽。列拖拽按住表头拖动，新顺序在表格内部生效并经 `update:columns` 发出。见[拖拽排序](#拖拽排序) | `boolean`、`[boolean, boolean]`                            | -                           | `false` |
| allow-drag              | 块 / 列能否被拖动；返回 `false` 时不能拖动（块的把手置灰，表头不显示 `move` 光标）。`type` 为 `'block'`（行）或 `'column'`（列）；行：`rows` 为块的行（普通表格长度为 1），`rowIndex` 为块首行的行号；列：`column` 为列（分组时为分组本身），`columnIndex` 为列（分组时为其第一个可见叶子）在可见叶子列中的下标 | `Function({ type, rows, rowIndex })`、`Function({ type, column, columnIndex })` | -                           | -       |
| allow-drop              | 能否放到落点；返回 `false` 时插入线显示为不可放置，松手不生效。`type` 为 `'block'`（行）或 `'column'`（列）。行：`targetRows` 为落点行（树形表格 `inner` 时为新的父行）；`position` 为相对落点行的位置，`before`、`after`，或 `inner`（成为子行，仅树形表格）；`from` / `to` 为移动前后的位置 `{ parent, index }`，`parent` 为 `null` 表示根级。列：`targetColumn` 为落点列（与被拖列同一父级）；`position` 为 `before` 或 `after`；`from` / `to` 的 `parent` 为父分组，顶层为 `null`，`index` 为兄弟列（含隐藏列）中的下标 | `Function({ type, rows, targetRows, position, from, to })`、`Function({ type, column, targetColumn, position, from, to })` | -                           | -       |


### 事件

事件的参数均为一个对象（`update:*` 除外，为 `v-model` 的值）。

| 事件名                | 说明                                                            | 回调参数                                                                            | 参数说明                                                           |
| ------------------ | ------------------------------------------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| select             | 当用户手动勾选数据行的 Checkbox 时触发的事件                                   | `({ row, selected, selection }) => void 0`                                      | `row`：勾选的行；`selected`：勾选后该行是否选中；`selection`：当前选中的所有行                  |
| select-all         | 当用户手动勾选全选 Checkbox 时触发的事件                                     | `({ selected, selection }) => void 0`                                           | `selected`：全选（`true`）或取消全选（`false`）；`selection`：当前选中的所有行                |
| selection-change   | 当选择项发生变化时会触发该事件                                               | `({ selection }) => void 0`                                                     | `selection`：当前选中的所有行                                           |
| cell-mouseenter    | 当单元格 hover 进入时会触发该事件                                          | `({ row, rowIndex, column, columnIndex, cell, event }) => void 0`               | `row`：所在行的数据；`rowIndex`：行号；`column`：所在列；`columnIndex`：列号；`cell`：单元格元素；`event`：事件对象 |
| cell-mouseleave    | 当单元格 hover 退出时会触发该事件                                          | 同 `cell-mouseenter`                                                             |                                                                |
| cell-click         | 当某个单元格被点击时会触发该事件                                              | 同 `cell-mouseenter`                                                             |                                                                |
| cell-dblclick      | 当某个单元格被双击时会触发该事件                                              | 同 `cell-mouseenter`                                                             |                                                                |
| cell-contextmenu   | 当某个单元格被鼠标右键点击时会触发该事件                                          | 同 `cell-mouseenter`                                                             |                                                                |
| row-click          | 当某一行被点击时会触发该事件                                                | 同 `cell-mouseenter`                                                             | 与同一次点击的 `cell-click` 为同一个对象；点击合并单元格时 `row` 为合并区域的首行             |
| row-contextmenu    | 当某一行被鼠标右键点击时会触发该事件                                            | 同 `cell-mouseenter`                                                             | 与同一次操作的 `cell-contextmenu` 为同一个对象                               |
| row-dblclick       | 当某一行被双击时会触发该事件                                                | 同 `cell-mouseenter`                                                             | 与同一次操作的 `cell-dblclick` 为同一个对象                                  |
| header-click       | 当某一列的表头被点击时会触发该事件                                             | `({ column, event }) => void 0`                                                 | `column`：所在列；`event`：事件对象                                     |
| header-contextmenu | 当某一列的表头被鼠标右键点击时触发该事件                                          | `({ column, event }) => void 0`                                                 | `column`：所在列；`event`：事件对象                                     |
| current-change     | 当表格的当前行发生变化的时候会触发该事件，如果要高亮当前行，请打开表格的 `highlight` 属性 | `({ row, oldRow }) => void 0`                                                   | `row`：改变后的当前行；`oldRow`：改变前的当前行                               |
| column-resize      | 拖动表头边缘改变列宽，松开时触发                                              | `({ column, width, oldWidth }) => void 0`                                       | `column`：所在列；`width`：拖拽后的宽度；`oldWidth`：拖拽前的宽度                     |
| expand-change      | 展开或收起某一行时触发（展开行与树形表格共用）                                        | 展开行：`({ type: 'expand', row, expanded, expandedRows }) => void 0`；树形：`({ type: 'tree', row, expanded, maxLevel }) => void 0` | `type`：`expand` 为展开行（`type="expand"` 的列），`tree` 为树形节点；`row`：展开或收起的行；`expanded`：是否展开；`expandedRows`：当前展开的行（按显示顺序）；`maxLevel`：当前可见行的最大层级（根为 `0`） |
| sort-change        | 当表格的排序条件发生变化的时候会触发该事件                                         | `({ prop, order }) => void 0`                                                   | `prop`：排序的列；`order`：排序方式                                      |
| load-change      | 加载状态变化（单向推送，无对应属性）；挂载即推送一次                                   | `({ isEnd, isLoading, isSilentRefresh, isEmpty }) => void 0`            | `isEnd`：数据已全部进入虚拟列表（普通表格恒为 `true`）；`isEmpty`：已结束且无数据              |
| update:data        | 拖拽排序松手且顺序变化时触发（`v-model:data`）；树形表格在原地修改数据之后触发             | `(data: Array) => void 0`                                                       | `data`：新的数组，元素为外部数组中存放的原始行，行对象的引用不变；树形表格为原地修改后根数组的副本 |
| block-dragstart    | 拖拽开始时触发（鼠标移动超过阈值，或触摸长按后）                                        | `({ rows, rowIndex }) => void 0`                                                | `rows`：被拖动块的行（普通表格长度为 1）；`rowIndex`：块首行的行号                       |
| block-drop         | 松手且顺序变化时触发，在 `update:data` 之后                                       | `({ rows, targetRows, position, from, to, rawData }) => void 0`                 | `targetRows`：落点行（树形表格 `inner` 时为新的父行）；`position`：`before`、`after`，或 `inner`（仅树形表格）；`from` / `to`：移动前后的位置 `{ parent, index }`，`parent` 为 `null` 表示根级，`index` 非树形表格为块首行在 data 中的下标、树形表格为兄弟行中的下标；`rawData`：新的数组（同 `update:data`） |
| block-dragend      | 拖拽结束时触发，取消、顺序不变、不允许放置时也会触发                                       | `({ rows, rowIndex, dropped }) => void 0`                                       | `dropped`：是否按新顺序放下                                                  |
| column-dragstart   | 列拖拽开始时触发（鼠标移动超过阈值，或触摸长按后）                                     | `({ column, columnIndex }) => void 0`                                           | `column`：被拖动的列（分组时为分组本身）；`columnIndex`：列（分组时为其第一个可见叶子）在可见叶子列中的下标 |
| column-drop        | 列拖拽松手且顺序变化时触发，在新顺序生效、`update:columns` 发出之后                      | `({ column, targetColumn, position, from, to, columns }) => void 0`             | `targetColumn`：落点列；`position`：`before` 或 `after`；`from` / `to`：移动前后的位置 `{ parent, index }`，`parent` 为父分组，顶层为 `null`，`index` 为兄弟列（含隐藏列）中的下标；`columns`：新的列列表（同 `update:columns`） |
| column-dragend     | 列拖拽结束时触发，取消、顺序不变、不允许放置时也会触发                                     | `({ column, columnIndex, dropped }) => void 0`                                  | `dropped`：是否按新顺序放下                                                  |


### 方法

| 方法名                | 说明                                                             | 参数                                                                           |
| ------------------ | -------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| clearSelection     | 用于多选表格，清空用户的选择                                                 | -                                                                            |
| toggleRowSelection | 用于多选表格，切换某一行的选中状态，如果使用了第二个参数，则是设置这一行选中与否（selected 为 true 则选中）  | `row`：要切换的行数据；`selected`：设置改行的选中状态；`emitChange`：调用 API 修改选中值，不触发 `select` 事件 |
| toggleAllSelection | 用于多选表格，切换所有行的选中状态                                              | -                                                                            |
| toggleRowExpansion | 用于可展开表格与树形表格，切换某一行的展开状态，如果使用了第二个参数，则是设置这一行展开与否（expanded 为 true 则展开） | `row`：要展开的行数据；`expanded`：设置该行是否展开                                            |
| setCurrentRow      | 用于单选表格，设定某一行为选中行，如果调用时不加参数，则会取消目前高亮行的选中状态。                     | `row`：选中的行数据                                                                 |
| refreshLayout      | 对 Table 进行重新布局，虚拟化表格（`height` 或 `virtualized`）会同时整体重新测量已构建的行。数据变化、尺寸变化会自动处理（内部的布局更新只刷新虚拟列表的视口），仅在无法自动观察的布局变化后调用 | -                                                                            |
| refreshAffix       | 手动刷新表头/底部 dock 的吸附状态（`affix` 生效时）。Affix只有当滚动时才触发，wrapper/content高度变化需手动处理              | -                                                                            |


### Slot

| 属性     | 说明                                                                       |
| ------ | ------------------------------------------------------------------------ |
| append | 插入至表格最后一行之后的内容，如果需要对表格的内容进行无限滚动操作，可能需要用到这个 slot。若表格有合计行，该 slot 会位于合计行之上。 |


### Column props

| 属性                 | 说明                                                                                           | 类型                                             | 可选值                                    | 默认值       |
| ------------------ | -------------------------------------------------------------------------------------------- | ---------------------------------------------- | -------------------------------------- | --------- |
| type               | 对应列的类型。如果设置了 `selection` 则显示多选框；如果设置了 `index` 则显示该行的索引（从 1 开始计算）；如果设置了 `expand` 则显示为一个可展开的按钮；如果设置了 `drag` 则显示拖拽排序的把手（见[拖拽排序](#拖拽排序)） | `string`                                       | `selection`、`index`、`expand`、`drag`、`default` | `default` |
| index              | 如果设置了 `type=index`，可以通过传递 `index` 属性来自定义索引                                                   | `number`, `Function(index)`                    | -                                      | -         |
| label              | 显示的标题                                                                                        | `string`                                       | -                                      | -         |
| prop               | 对应列内容的字段名                                                                                    | `string`                                       | -                                      | -         |
| width              | 对应列的宽度                                                                                       | `string`、`number`                             | -                                      | -         |
| min-width          | 对应列的最小宽度，与 `width` 的区别是 `width` 是固定的，`min-width`把剩余宽度按比例分配给设置了 `min-width` 的列                | `string`、`number`                             | -                                      | -         |
| fixed              | 列是否固定在左侧或者右侧，`true` 表示固定在左侧                                                                  | `string`, `boolean`                            | `true`, `left`, `right`                | -         |
| render-header      | 列标题 `Label` 区域渲染使用的 `Function`                                                               | `Function({ column, columnIndex, store })`     | -                                      | -         |
| resizable          | 对应列是否可以通过拖动改变宽度（需要在 `Table` 上设置 `border` 属性为真）                                               | `boolean`                                      | -                                      | `true`    |
| formatter          | 用来格式化内容                                                                                      | `Function({ row, column, cellValue, $index })` | -                                      | -         |
| line               | 文本行数，超出省略并在 hover 时展示完整内容；仅对默认内容生效（使用默认插槽或 `formatter` 时无效）。未设置时取全局配置 `TableColumn.line` | `number`                                       | -                                      | `0`       |
| header-line        | 表头文本行数，超出省略并在 hover 时展示完整内容，`0` 为不限行数。取值顺序：列上的值 → 全局配置 `TableColumn.headerLine` → `1`。仅对 `label` 生效：`header` 插槽、`render-header` 及 `selection`/`index`/`expand` 列保持单行省略，高度由内容撑开 | `number`                                       | -                                      | `1`       |
| align              | 对齐方式                                                                                         | `string`                                       | `left`、`center`、`right`                | `left`    |
| header-align       | 表头对齐方式，若不设置该项，则使用表格的对齐方式                                                                     | `string`                                       | `left`、`center`、`right`                | -         |
| class              | 列的 `className`                                                                               | `string`                                       | -                                      |           |
| label-class        | 当前列标题的自定义类名                                                                                  | `string`                                       | -                                      | -         |
| selectable         | 仅对 `type=selection` 的列有效，类型为 `Function`，`Function` 的返回值用来决定这一行的 `CheckBox` 是否可以勾选；`index` 为行在可选择行中的下标（树形表格按展开前的全部行计，与展开状态无关）；行对象需唯一，同一对象在数据中重复出现时，下标取最后一次出现的位置 | `Function(row, index)`                         | -                                      | -         |
| reserve-selection  | 仅对 `type=selection` 的列有效，类型为 `boolean`，为 `true` 则会在数据更新之后保留之前选中的数据（需指定 `primary-key`）        | `boolean`                                      | -                                      | `false`   |
| filter-options     | 表头筛选的配置，原样传给筛选组件，字段见下方 [filter-options](#filter-options) | `Object` | - | - |

### 全局配置

`line` / `header-line` 未设置时取 `VcInstance` 上的 `TableColumn` 配置，列上的值优先。`configure()` 按顶层键整体替换，需要同时配置时一并传入：

```ts
import { VcInstance } from '@deot/vc';

VcInstance.configure({
	TableColumn: {
		line: 2,
		headerLine: 2
	}
});
```

### 截断提示

`line` / `header-line` 截断的单元格与表头，悬停时在上方弹出完整内容（上方放不下时才翻转）：

- 提示锚在整个单元格（表头为 label）上，不会盖住鼠标所在的格子
- 宽度按弹层字体测量：20 个字以内的短文字不换行；更长的文字按宽高比约 3:1 换行，且不窄于 20 个字与单元格文字；整体不超出屏幕，超出时在提示内滚动
- 表体或页面滚动期间不弹出，已弹出的提示随滚动关闭；滚动停止后鼠标仍在该单元格上时再弹出

### filter-options

| 字段 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| data | 筛选项 | `Array<{ label, value, disabled? }>` | `[]` |
| max | 可选数量上限：`1` 为单选，大于 `1` 为多选，选满后其余选项置灰 | `number` | `1` |
| modelValue | 当前生效的筛选值，形态同 `Select`：数组，或 `'a,b'` 字符串 / 单个值；写了这个字段即为受控 | `Array \| string \| number` | - |
| separator | 字符串形态的分隔符，同 `Select` | `string` | `,` |
| numerable | 字符串形态对应数字选项时设为 `true`，同 `Select` | `boolean` | `false` |
| icon | 筛选图标 | `string` | `filter-solid` |
| portalClass | 弹层的自定义类名 | `string` | - |
| onUpdate:modelValue | 生效值变化时触发，受控时在这里写回 | `(value) => void` | - |
| onChange | 生效值变化时触发 | `(value) => void` | - |

### Column Slot

| 属性     | 说明                                  |
| ------ | ----------------------------------- |
| -      | 自定义列的内容，参数为 `{ row, column, rowIndex, columnIndex, selected, level, treeNode }`；`treeNode` 仅树形表格的树形列提供，为 `{ level, indent, expandable, expanded, loading }`；`type="expand"` 时为展开行的内容，参数为 `{ row, rowIndex, store }` |
| header | 自定义表头的内容，参数为 `{ column, columnIndex, store }` |


## TODO
- `SSR`时能渲染带'数据'的内容

<!--
## 变更说明

### 事件参数统一为对象
- 所有事件的参数改为一个对象，`update:*`（`v-model`）不变：
	- `select`：`(selection, row)` → `{ row, selected, selection }`，新增 `selected`（勾选后该行是否选中）。
	- `select-all`：`(selection)` → `{ selected, selection }`，新增 `selected`（全选或取消全选）。
	- `selection-change`：`(selection)` → `{ selection }`。
	- `cell-mouse-enter` / `cell-mouse-leave` / `cell-click` / `cell-dblclick` / `cell-contextmenu`：`(row, column, cell, event)` → `{ row, rowIndex, column, columnIndex, cell, event }`，新增 `rowIndex` / `columnIndex`；`cell` 为单元格元素。
	- `row-click` / `row-dblclick` / `row-contextmenu`：`(row, column, event)` → 与 cell 事件相同的对象（同一次操作为同一个对象）。
	- `header-click` / `header-contextmenu`：`(column, event)` → `{ column, event }`。
	- `current-change`：`(currentRow, oldCurrentRow)` → `{ row, oldRow }`。
	- `expand-change`：展开行 `(row, expandedRows)` → `{ type: 'expand', row, expanded, expandedRows }`；树形 `(row, expanded, maxLevel)` → `{ type: 'tree', row, expanded, maxLevel }`。
- `header-dragend` 改名为 `column-resize`，参数 `(newWidth, oldWidth, column)` → `{ column, width, oldWidth }`（原文档中的 `event` 参数实际并未传出）。
- `block-drop` 移除 `oldIndex` / `newIndex`，改用 `from.index` / `to.index`。
- `sort-change`、`load-change`、`block-dragstart`、`block-dragend` 原本即为对象，不变。

### 事件名与浏览器原生事件同名
- 与浏览器原生事件对应的事件改用原生事件名（与 `row-dblclick`、`cell-contextmenu` 一致）：
	- `cell-mouse-enter` / `cell-mouse-leave` → `cell-mouseenter` / `cell-mouseleave`。
	- `block-drag-start` / `block-drag-end` → `block-dragstart` / `block-dragend`（`block-drop` 不变）。
- 组件自身语义的事件仍按词拆分，如 `selection-change`、`column-resize`。

### 拖拽排序支持列
- `draggable` 支持数组 `[行, 列]`；`true` 与原来一致，只开启整行拖拽。
- `allow-drag` / `allow-drop` 的参数新增 `type`：行为 `'block'`，列为 `'column'`。开启列拖拽后同一个回调也会收到列的参数，需要按 `type` 区分。
- `v-model:columns` 写回的顺序改为逐层生效：多级表头下原先只重排顶层列，现在分组内的列也按外部顺序排列，分组按其子列中最靠前的一个排序。
- `v-model:columns` 的回流改为按内容识别：写回与当前列一致时忽略；不再依赖「发出后等一次写回」的标记，只监听 `update:columns`、不写回时，之后的外部修改照常生效。
- `columns` 属性文档中列出的 `width`、`fixed`、`align` 实际并未同步，已从说明中去掉；同步项为 `{ id, prop, label, type, hidden }`。
- 合计行单元格新增 `data-column` 属性（与表体单元格一致）。
- 拖拽中挂在 `body` 上的类名由 `vc-table-block-dragging` 改为 `vc-table-dragging`（行、列拖拽共用）。
-->
