## 表格（Table）
展示行列数据

### 何时使用
- 当有大量结构化的数据需要展现时。
- 当需要对数据进行排序、筛选、分页、自定义操作等复杂行为时。

### 基础用法
基础的表格展示用法。
通过 `Table` 的 `data` 传入对象数组，在 `TableColumn` 中用 `prop` 对应对象中的字段，用 `label` 定义列名。使用 `width` 定义固定列宽，或使用 `min-width` 分配剩余宽度。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<p>当前点击：{{ selectedName }}</p>
	<Table :data="tableData1" @row-click="handleClick">
		<TableColumn
			prop="date"
			label="日期"
			width="180"
		/>
		<TableColumn
			prop="name"
			label="名称"
		/>
		<TableColumn
			prop="desc"
			label="说明"
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
		name: '条目 1',
		desc: '这是条目 1 的说明文字，用于展示较长内容的换行与截断。'
	},
	{
		date: '2011-11-04',
		name: '条目 2',
		desc: '这是条目 2 的说明文字，用于展示较长内容的换行与截断。'
	},
	{
		date: '2011-11-01',
		name: '条目 3',
		desc: '这是条目 3 的说明文字，用于展示较长内容的换行与截断。'
	},
	{
		date: '2011-11-03',
		name: '条目 4',
		desc: '这是条目 4 的说明文字，用于展示较长内容的换行与截断。'
	}
]);

// row：点击的行；rowIndex：行号；column：点击的列
const handleClick = ({ row }) => {
	selectedName.value = row.name;
};
const selectedName = ref('尚未点击');

</script>
```
:::

### 带斑马纹表格
设置属性 `stripe` ，表格会间隔显示不同颜色，用于区分不同行数据。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
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
			label="名称"
		/>
		<TableColumn
			prop="desc"
			label="说明"
		/>
	</Table>
</template>
<script setup>
import { ref } from 'vue';
import { Table, TableColumn } from '@deot/vc';

const tableData2 = ref([
	{
		date: '2011-11-02',
		name: '条目 1',
		desc: '这是条目 1 的说明文字，用于展示较长内容的换行与截断。'
	},
	{
		date: '2011-11-04',
		name: '条目 2',
		desc: '这是条目 2 的说明文字，用于展示较长内容的换行与截断。'
	},
	{
		date: '2011-11-01',
		name: '条目 3',
		desc: '这是条目 3 的说明文字，用于展示较长内容的换行与截断。'
	},
	{
		date: '2011-11-03',
		name: '条目 4',
		desc: '这是条目 4 的说明文字，用于展示较长内容的换行与截断。'
	}
]);
</script>
```
:::

### 带边框表格
默认情况下，`Table` 组件是不具有竖直方向的边框的，如果需要，可以使用`border`属性，

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
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
			label="名称"
		/>
		<TableColumn
			prop="desc"
			label="说明"
		/>
	</Table>
</template>
<script setup>
import { ref } from 'vue';
import { Table, TableColumn } from '@deot/vc';

const tableData3 = ref([
	{
		date: '2011-11-02',
		name: '条目 1',
		desc: '这是条目 1 的说明文字，用于展示较长内容的换行与截断。'
	},
	{
		date: '2011-11-04',
		name: '条目 2',
		desc: '这是条目 2 的说明文字，用于展示较长内容的换行与截断。'
	},
	{
		date: '2011-11-01',
		name: '条目 3',
		desc: '这是条目 3 的说明文字，用于展示较长内容的换行与截断。'
	},
	{
		date: '2011-11-03',
		name: '条目 4',
		desc: '这是条目 4 的说明文字，用于展示较长内容的换行与截断。'
	}
]);
</script>
```
:::

### 尺寸
通过 `size` 调整字号与单元格的上下内边距，可选 `large`、`medium`、`small`、`mini`，默认为 `medium`。首末列的左右内边距不受影响；`medium` 的合计行最小高度为 44px，其余尺寸的合计行高度由内边距决定。嵌套在展开行等位置的表格只按自身的 `size`、`border` 等显示，不受外层表格影响。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
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
			label="名称"
		/>
		<TableColumn
			prop="value"
			label="数值"
		/>
	</Table>
</template>
<script setup>
import { ref } from 'vue';
import { Table, TableColumn } from '@deot/vc';

const tableDataSize = ref([
	{ date: '2011-11-02', name: '条目 1', value: 100 },
	{ date: '2011-11-04', name: '条目 2', value: 200 },
	{ date: '2011-11-01', name: '条目 3', value: 300 }
]);
</script>
```
:::

完整示例（切换各尺寸对比）：[尺寸](./examples/size.vue)

### 带状态表格
通过 `rowClass` 给普通行添加状态类，并在示例的局部样式中定义视觉效果。`highlight` 用于当前行高亮，与业务状态配色无关。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
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
			label="名称"
		/>
		<TableColumn
			prop="desc"
			label="说明"
		/>
	</Table>
</template>
<script setup>
import { ref } from 'vue';
import { Table, TableColumn } from '@deot/vc';

const tableData4 = ref([
	{
		date: '2011-11-02',
		name: '条目 1',
		desc: '这是条目 1 的说明文字，用于展示较长内容的换行与截断。'
	},
	{
		date: '2011-11-04',
		name: '条目 2',
		desc: '这是条目 2 的说明文字，用于展示较长内容的换行与截断。'
	},
	{
		date: '2011-11-01',
		name: '条目 3',
		desc: '这是条目 3 的说明文字，用于展示较长内容的换行与截断。'
	},
	{
		date: '2011-11-03',
		name: '条目 4',
		desc: '这是条目 4 的说明文字，用于展示较长内容的换行与截断。'
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
<style scoped>
:deep(.vc-table .warning) {
	background: oldlace!important;
}
:deep(.vc-table .success) {
	background: #f0f9eb!important;
}
</style>
```
:::

### 固定表头
纵向内容过多时，可选择固定表头。只要在 `Table` 元素中定义了 `height` 属性，即可实现固定表头的表格，而不需要额外的代码。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
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
			label="名称"
			width="180"
		/>
		<TableColumn
			prop="desc"
			label="说明"
		/>
	</Table>
</template>
<script setup>
import { ref } from 'vue';
import { Table, TableColumn } from '@deot/vc';

const tableData5 = ref([{
	date: '2011-11-03',
	name: '条目 1',
	desc: '这是条目 1 的说明文字，用于展示较长内容的换行与截断。'
}, {
	date: '2011-11-02',
	name: '条目 2',
	desc: '这是条目 2 的说明文字，用于展示较长内容的换行与截断。'
}, {
	date: '2011-11-04',
	name: '条目 3',
	desc: '这是条目 3 的说明文字，用于展示较长内容的换行与截断。'
}, {
	date: '2011-11-01',
	name: '条目 4',
	desc: '这是条目 4 的说明文字，用于展示较长内容的换行与截断。'
}, {
	date: '2011-11-08',
	name: '条目 5',
	desc: '这是条目 5 的说明文字，用于展示较长内容的换行与截断。'
}, {
	date: '2011-11-06',
	name: '条目 6',
	desc: '这是条目 6 的说明文字，用于展示较长内容的换行与截断。'
}, {
	date: '2011-11-07',
	name: '条目 7',
	desc: '这是条目 7 的说明文字，用于展示较长内容的换行与截断。'
}]);
</script>
```
:::

### 固定列
横向内容过多时，可选择固定列。固定列需要使用 `fixed` 属性，它接受 `boolean` 值或者`left`、`right`，表示左边固定还是右边固定。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
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
			label="名称"
			width="180"

		/>
		<TableColumn
			prop="group"
			label="分组"
			width="180"

		/>
		<TableColumn
			prop="subgroup"
			label="子分组"
			width="180"
		/>
		<TableColumn
			prop="desc"
			label="说明"
			width="180"
		/>
		<TableColumn
			prop="code"
			label="编码"
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
	name: '条目 1',
	group: '分组 A',
	subgroup: '子分组 A-1',
	desc: '这是条目 1 的说明文字，用于展示较长内容的换行与截断。',
	code: 'NO100001'
}, {
	date: '2011-11-04',
	name: '条目 2',
	group: '分组 A',
	subgroup: '子分组 A-1',
	desc: '这是条目 2 的说明文字，用于展示较长内容的换行与截断。',
	code: 'NO100001'
}, {
	date: '2011-11-01',
	name: '条目 3',
	group: '分组 A',
	subgroup: '子分组 A-1',
	desc: '这是条目 3 的说明文字，用于展示较长内容的换行与截断。',
	code: 'NO100001'
}, {
	date: '2011-11-03',
	name: '条目 4',
	group: '分组 A',
	subgroup: '子分组 A-1',
	desc: '这是条目 4 的说明文字，用于展示较长内容的换行与截断。',
	code: 'NO100001'
}]);
</script>
```
:::

### 多选
选择多行数据时使用 `Checkbox`。非常简单: 手动添加一个  `TableColumn` ，设 `type` 属性为 `selection` 即可。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
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
			label="名称"
		/>
		<TableColumn
			prop="desc"
			label="说明"
		/>
	</Table>
</template>
<script setup>
import { ref } from 'vue';
import { Table, TableColumn } from '@deot/vc';

const tableData = ref([
	{
		date: '2011-11-02',
		name: '条目 1',
		desc: '这是条目 1 的说明文字，用于展示较长内容的换行与截断。'
	},
	{
		date: '2011-11-04',
		name: '条目 2',
		desc: '这是条目 2 的说明文字，用于展示较长内容的换行与截断。'
	},
	{
		date: '2011-11-01',
		name: '条目 3',
		desc: '这是条目 3 的说明文字，用于展示较长内容的换行与截断。'
	},
	{
		date: '2011-11-03',
		name: '条目 4',
		desc: '这是条目 4 的说明文字，用于展示较长内容的换行与截断。'
	}
]);
</script>
```
:::

### 排序

Table 只维护排序交互，数据排序由调用方处理。下面通过 `v-model:sort` 和计算属性完成本地排序，取消排序后恢复原顺序。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<Table
		:data="sortedData"
		v-model:sort="sort"
	>
		<TableColumn
			prop="date"
			label="日期"
			sortable
			min-width="180"
		/>
		<TableColumn
			prop="name"
			label="名称"
			width="180"
			sortable
		/>
		<TableColumn
			prop="desc"
			label="说明"
			width="880"
		/>
	</Table>
</template>
<script setup>
import { ref, computed } from 'vue';
import { Table, TableColumn } from '@deot/vc';

const sort = ref({ prop: 'date', order: 'descending' });
const tableData = ref([
	{
		date: '2011-11-02',
		name: '条目 1',
		desc: '这是条目 1 的说明文字，用于展示较长内容的换行与截断。'
	},
	{
		date: '2011-11-04',
		name: '条目 2',
		desc: '这是条目 2 的说明文字，用于展示较长内容的换行与截断。'
	},
	{
		date: '2011-11-01',
		name: '条目 3',
		desc: '这是条目 3 的说明文字，用于展示较长内容的换行与截断。'
	},
	{
		date: '2011-11-03',
		name: '条目 4',
		desc: '这是条目 4 的说明文字，用于展示较长内容的换行与截断。'
	}
]);

const sortedData = computed(() => {
	const { prop, order } = sort.value;
	if (!prop || !order) return tableData.value;
	const direction = order === 'ascending' ? 1 : -1;
	return [...tableData.value].sort((a, b) => String(a[prop]).localeCompare(String(b[prop])) * direction);
});
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

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
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
				@change="handleToggle(col)"
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
			label="名称"
		/>
		<TableColumn
			prop="desc"
			label="说明"
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
		name: '条目 1',
		desc: '这是条目 1 的说明文字，用于展示较长内容的换行与截断。'
	},
	{
		date: '2011-11-04',
		name: '条目 2',
		desc: '这是条目 2 的说明文字，用于展示较长内容的换行与截断。'
	},
	{
		date: '2011-11-01',
		name: '条目 3',
		desc: '这是条目 3 的说明文字，用于展示较长内容的换行与截断。'
	}
]);

const handleToggle = (col) => {
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

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
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
			label="名称"
			width="180"
		/>
		<TableColumn
			prop="desc"
			label="说明"
		/>
	</Table>
</template>
<script setup>
import { ref, computed } from 'vue';
import { Table, TableColumn } from '@deot/vc';

const types = [
	{ label: '类型 A', value: 1 },
	{ label: '类型 B', value: 2 },
	{ label: '类型 C', value: 3, disabled: true }
];
const typeFilter = ref([]);
const tableData = ref([
	{
		type: 1,
		name: '条目 1',
		desc: '这是条目 1 的说明文字，用于展示较长内容的换行与截断。'
	},
	{
		type: 2,
		name: '条目 2',
		desc: '这是条目 2 的说明文字，用于展示较长内容的换行与截断。'
	},
	{
		type: 1,
		name: '条目 3',
		desc: '这是条目 3 的说明文字，用于展示较长内容的换行与截断。'
	},
	{
		type: 2,
		name: '条目 4',
		desc: '这是条目 4 的说明文字，用于展示较长内容的换行与截断。'
	}
]);

const filteredData = computed(() => {
	if (!typeFilter.value.length) return tableData.value;
	return tableData.value.filter(row => typeFilter.value.includes(row.type));
});
</script>
```
:::

#### 单选筛选

单选点击选项即生效，“全部”清空条件。此例只传 `onChange`，由筛选器保存当前选项，外部据此过滤数据。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<Table :data="filteredRows">
		<TableColumn prop="name" label="名称" />
		<TableColumn prop="status" label="状态" :filter-options="{ data: options, onChange: handleFilter }" />
	</Table>
</template>
<script setup>
import { ref, computed } from 'vue';
import { Table, TableColumn } from '@deot/vc';

const status = ref();
const options = [
	{ label: '进行中', value: '进行中' },
	{ label: '已完成', value: '已完成' }
];
const rows = [
	{ name: '条目 1', status: '进行中' },
	{ name: '条目 2', status: '已完成' }
];
const filteredRows = computed(() => status.value ? rows.filter(row => row.status === status.value) : rows);
const handleFilter = (value) => { status.value = value; };
</script>
```
:::

进阶示例（单选受控 / 多选 `max: 2` / 只用 `onChange`）：[筛选](./examples/filter.vue)

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

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
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
			label="名称"
			min-width="180"
		/>
		<TableColumn
			prop="desc"
			label="说明"
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
	name: `条目 ${random()}`,
	desc: `条目说明 ${random()}`,
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

#### 编辑和删除树节点

下面同时包含已有子节点与懒加载子节点。编辑直接更新响应式行对象；删除从该行所属数组移除。懒加载数组由调用方保存，便于后续增删。切换渲染模式后仍可继续操作。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<div class="tree-demo">
		<div class="toolbar">
			<label>渲染模式：
				<select v-model="mode">
					<option value="normal">普通</option>
					<option value="height">固定高度虚拟化</option>
					<option value="virtualized">外部视口虚拟化</option>
				</select>
			</label>
			<span>展开“待加载的条目”后也可编辑、删除子节点。</span>
		</div>
		<Table
			:data="rows"
			:height="mode === 'height' ? 280 : undefined"
			:virtualized="mode === 'virtualized'"
			:load-expand="loadExpand"
			primary-key="id"
			lazy-tree
			border
		>
			<TableColumn prop="name" label="名称" min-width="200" />
			<TableColumn label="编辑名称" min-width="180">
				<template #default="{ row }">
					<input v-model="row.name" :aria-label="`编辑条目 ${row.id}`">
				</template>
			</TableColumn>
			<TableColumn label="操作" width="90">
				<template #default="{ row }">
					<Button type="text" @click="handleDelete(row)">删除</Button>
				</template>
			</TableColumn>
		</Table>
	</div>
</template>
<script setup>
import { ref, reactive } from 'vue';
import { Button, Table, TableColumn } from '@deot/vc';

const mode = ref('normal');
const rows = ref([
	{ id: 'project', name: '已有条目', children: [{ id: 'task', name: '已有子条目' }] },
	{ id: 'lazy', name: '待加载的条目', hasChildren: true }
]);
const loaded = new Map();
const loadExpand = async (row) => {
	await new Promise(resolve => setTimeout(resolve, 400));
	const children = reactive([{ id: `${row.id}-child`, name: '异步加载的子条目' }]);
	loaded.set(row.id, children);
	return children;
};
const removeRow = (list, row) => {
	const index = list.findIndex(item => item.id === row.id);
	if (index >= 0) {
		list.splice(index, 1);
		return true;
	}
	return list.some(item => item.children && removeRow(item.children, row));
};
const handleDelete = (row) => {
	if (removeRow(rows.value, row)) return;
	for (const children of loaded.values()) {
		if (removeRow(children, row)) break;
	}
};
</script>
<style scoped>
.toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-bottom: 12px; }
input { width: 100%; box-sizing: border-box; }
</style>
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

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<Table
		:data="tableData"
		:expand-row-value="[2]"
		primary-key="id"
	>
		<TableColumn type="expand">
			<template #default="{ row }">
				<p>名称：{{ row.name }}</p>
				<p>说明：{{ row.desc }}</p>
			</template>
		</TableColumn>
		<TableColumn
			prop="date"
			label="日期"
			width="180"
		/>
		<TableColumn
			prop="name"
			label="名称"
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
		name: '条目 1',
		desc: '这是条目 1 的说明文字，用于展示较长内容的换行与截断。'
	},
	{
		id: 2,
		date: '2011-11-04',
		name: '条目 2',
		desc: '这是条目 2 的说明文字，用于展示较长内容的换行与截断。'
	},
	{
		id: 3,
		date: '2011-11-01',
		name: '条目 3',
		desc: '这是条目 3 的说明文字，用于展示较长内容的换行与截断。'
	}
]);
</script>
```
:::

#### 编辑展开内容与切换渲染模式

展开区使用普通表单编辑行对象，表格名称同步更新。增加备注会改变展开区高度，可在三种模式下观察布局；删除行直接更新 `data`。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<div>
		<div class="toolbar">
			<label>渲染模式：
				<select v-model="mode">
					<option value="normal">普通</option>
					<option value="height">固定高度虚拟化</option>
					<option value="virtualized">外部视口虚拟化</option>
				</select>
			</label>
			<Button :disabled="!rows.length" @click="handleToggle">展开 / 收起首行</Button>
		</div>
		<Table
			ref="tableRef"
			:data="rows"
			:height="mode === 'height' ? 300 : undefined"
			:virtualized="mode === 'virtualized'"
			:expand-row-value="[1]"
			primary-key="id"
			border
		>
			<TableColumn type="expand">
				<template #default="{ row }">
					<div class="detail">
						<label>名称：<input v-model="row.name"></label>
						<p v-for="(remark, index) in row.remarks" :key="index">{{ remark }}</p>
						<Button @click="handleAddRemark(row)">增加备注</Button>
					</div>
				</template>
			</TableColumn>
			<TableColumn prop="name" label="名称" min-width="180" />
			<TableColumn label="操作" width="90">
				<template #default="{ row }">
					<Button type="text" @click="handleDelete(row)">删除</Button>
				</template>
			</TableColumn>
		</Table>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Button, Table, TableColumn } from '@deot/vc';

const mode = ref('normal');
const tableRef = ref();
const rows = ref([
	{ id: 1, name: '条目 1', remarks: ['展开内容可编辑，行高随内容变化。'] },
	{ id: 2, name: '条目 2', remarks: ['点击左侧箭头查看详情。'] }
]);
const handleToggle = () => tableRef.value.toggleRowExpansion(rows.value[0]);
const handleAddRemark = row => row.remarks.push(`新增备注 ${row.remarks.length + 1}`);
const handleDelete = (row) => {
	rows.value = rows.value.filter(item => item.id !== row.id);
};
</script>
<style scoped>
.toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-bottom: 12px; }
.detail { padding: 12px 0; }
.detail p { margin: 8px 0; }
input { max-width: 100%; box-sizing: border-box; }
</style>
```
:::

进阶示例：[树形数据](./examples/tree.vue)、[展开行](./examples/expand.vue)。

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

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
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
			label="名称"
			width="180"
		/>
		<TableColumn
			prop="date"
			label="日期"
			width="180"
		/>
		<TableColumn
			prop="desc"
			label="说明"
		/>
	</Table>
</template>
<script setup>
import { ref } from 'vue';
import { Table, TableColumn } from '@deot/vc';

const message = ref('按住行内任意位置或左侧把手拖动；「锁定」的行不可拖动');
const tableData = ref([
	{ id: 1, name: '条目 1', date: '2011-11-01', desc: '条目 1 的说明' },
	{ id: 2, name: '条目 2', date: '2011-11-02', desc: '条目 2 的说明' },
	{ id: 3, name: '条目 3（锁定）', date: '2011-11-03', desc: '条目 3 的说明', locked: true },
	{ id: 4, name: '条目 4', date: '2011-11-04', desc: '条目 4 的说明' }
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

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
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
		name: '分组 A',
		date: '2011-11-01',
		children: [
			{ id: 11, name: '条目 A-1', date: '2011-11-02' },
			{ id: 12, name: '条目 A-2', date: '2011-11-03' }
		]
	},
	{ id: 2, name: '分组 B', date: '2011-11-04', children: [{ id: 21, name: '条目 B-1', date: '2011-11-05' }] },
	{ id: 3, name: '分组 C', date: '2011-11-06' }
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

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
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
			label="名称（锁定）"
			width="140"
		/>
		<TableColumn
			prop="date"
			label="日期"
			width="140"
		/>
		<TableColumn
			prop="desc"
			label="说明"
		/>
	</Table>
</template>
<script setup>
import { ref } from 'vue';
import { Table, TableColumn } from '@deot/vc';

// v-model:columns 回填为 { id, prop, label, type, hidden } 的列表，可以保存下来恢复列顺序
const columns = ref([]);
const tableData = ref([
	{ id: 1, name: '条目 1', date: '2011-11-01', desc: '条目 1 的说明' },
	{ id: 2, name: '条目 2', date: '2011-11-02', desc: '条目 2 的说明' }
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

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<p>已构建 {{ loadState.loaded }} / {{ tableData.length }} 行</p>
	<div class="viewport">
		<p>外部容器的前置内容：向下滚动查看 300 行数据。</p>
		<Table virtualized lazy-tail primary-key="id" :data="tableData" @load-change="handleLoadChange">
			<TableColumn prop="name" label="名称" width="150" />
			<TableColumn prop="description" label="说明" min-width="200" />
			<template #append><p>所有行已构建。</p></template>
		</Table>
		<p v-if="loadState.isEnd">外部容器的后置内容</p>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Table, TableColumn } from '@deot/vc';

const loadState = ref({ isEnd: false, loaded: 0 });
const tableData = Array.from({ length: 300 }, (_, index) => ({
	id: index + 1,
	name: `条目 ${index + 1}`,
	description: 'Table 未设置高度，滚动由外层容器承载。'
}));
const handleLoadChange = (state) => {
	loadState.value = state;
};
</script>
<style scoped>
.viewport { height: 320px; overflow: auto; }
</style>
```
:::

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

下面在预览窗口内滚动页面，表头吸顶，合计行和横向滚动条吸底。Table 本身未设置 `height`，因此吸附与外部视口虚拟化可以同时生效。

:::playground
<!-- <config lang="json5">{ viewport: [800, 360], previewInset: 16 }</config> -->
```vue
<template>
	<p>向下滚动：表头与合计行保持可见。</p>
	<Table :data="rows" virtualized affix show-summary primary-key="id" border>
		<TableColumn prop="name" label="名称" width="180" fixed="left" />
		<TableColumn prop="description" label="说明" min-width="500" />
		<TableColumn prop="value" label="数值" width="140" />
	</Table>
	<p>表格结束，吸附范围也随之结束。</p>
</template>
<script setup>
import { Table, TableColumn } from '@deot/vc';

const rows = Array.from({ length: 60 }, (_, index) => ({
	id: index + 1,
	name: `条目 ${index + 1}`,
	description: '滚动页面查看吸附；横向滚动时左侧名称列保持固定。',
	value: index + 1
}));
</script>
```
:::

表头、底部 dock 的吸附直接复用 Affix 组件（不改用 CSS Sticky）：

- 底部 dock 由横向滚动条和合计行组成，`affix` 的 bottom 项作用于整个 dock。流式高度下横向滚动条挂在 dock 顶部（表体底部 / 合计行顶部），宽度与表体一致；没有合计行时，dock 里只有横向滚动条。
- Window 下继续使用当前默认的 `fixed: true` 行为。
- 外层为 VC Scroller 时，使用 `fixed` 模式，并通过 `offset` 指定 Scroller 视口到窗口边缘的距离（见下方示例）。`fixed: false` 要求 Affix 与 Scroller 之间没有定位元素，而 Table 根节点为 `position: relative`，因此不适用。
- `boolean`、`[top, bottom]`、`object` 的解释和 `refreshAffix()` 方法保持不变。
- 吸附范围默认限定为表体（`target` 为本表格的 `.vc-table__body-wrapper`）：表头不越过表体底部、底部 dock 不越过表体顶部，表格滚出后随之离开；可在配置对象中传入 `target` 覆盖。
- Table 设置了 `height`/`max-height` 时，`affix` 仍按原规则强制失效，横向滚动条仍位于表格底部。

流式高度下横向滚动条与合计行的吸底行为：

| showSummary | affix bottom | 结果 |
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

表体逐批构建时，`append` 与表格之后的页面内容会被不断往下推。`lazy-tail` 让 `append` 等数据全部进入虚拟列表后再出现；页面上的后置内容可以通过 `load-change` 跟上，`loaded` 可用来展示构建进度：

```vue
<Table virtualized lazy-tail :data="rows" @load-change="loadState = $event">
	<template #append>…</template>
</Table>

<section v-show="loadState.isEnd">页面后置内容</section>
<p>已构建 {{ loadState.loaded }} / {{ rows.length }} 行</p>
```

- `load-change` 只对外单向推送，没有对应属性。内部虚拟列表以 `disabled` 直接接收 `data`，此时 `isEnd` 表示数据已全部构建并完成布局。
- 挂载即推送一次，之后每批行构建并完成布局后推送一次。`loaded` 按行计：合并单元格的多行都计入，树形表格为展开后的可见行。
- 设置了 `row-height` 时行高已知，全部行一次构建完成，只推送一次，`loaded` 直接等于全部行数。
- 普通表格（未设置 `height` 且未启用 `virtualized`）一次渲染完，挂载即推送 `isEnd: true`，`loaded` 为全部行数并随行数变化，同样的写法依然成立。
- 合计行不受 `lazy-tail` 影响。

完整示例：

- [外部视口：Window / VC Scroller，前置内容—虚拟 Table—后置内容](./examples/virtualized.vue)
- [500 条/页富单元格的性能对照（固定行高、bufferCount、滚动容器）](./examples/virtualized-performance.vue)

### 合计与自定义统计

`show-summary` 默认对第一列之后的数字求和。`get-summary` 返回与叶子列顺序对应的数组，可以自定义每一列的统计内容；树形表格只统计根行。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<label><input v-model="isCustom" type="checkbox"> 使用自定义合计</label>
	<Table :data="rows" :get-summary="isCustom ? getSummary : undefined" show-summary border>
		<TableColumn prop="name" label="名称" />
		<TableColumn prop="quantity" label="数量" />
		<TableColumn prop="value" label="数值" />
	</Table>
</template>
<script setup>
import { ref } from 'vue';
import { Table, TableColumn } from '@deot/vc';

const isCustom = ref(false);
const rows = [
	{ name: '条目 A', quantity: 3, value: 36 },
	{ name: '条目 B', quantity: 2, value: 18 }
];
const getSummary = ({ data }) => [
	`共 ${data.length} 项`,
	data.reduce((sum, row) => sum + row.quantity, 0),
	`${data.reduce((sum, row) => sum + row.value, 0).toFixed(2)}`
];
</script>
<style scoped>
label { display: block; margin-bottom: 12px; }
</style>
```
:::

### 合并单元格

`get-span` 返回 `[rowspan, colspan]` 或 `{ rowspan, colspan }`。此例将相邻两行的分组列合并；设置 `height` 后，合并块作为整体参与虚拟滚动。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<Table :data="rows" :get-span="getSpan" :height="280" primary-key="id" border>
		<TableColumn prop="group" label="分组" width="120" fixed="left" />
		<TableColumn prop="name" label="名称" min-width="180" />
		<TableColumn prop="status" label="状态" width="120" />
	</Table>
</template>
<script setup>
import { Table, TableColumn } from '@deot/vc';

const rows = Array.from({ length: 40 }, (_, index) => ({
	id: index + 1,
	group: `分组 ${Math.floor(index / 2) + 1}`,
	name: `条目 ${index + 1}`,
	status: index % 2 ? '进行中' : '已完成'
}));
const getSpan = ({ rowIndex, columnIndex }) => {
	if (columnIndex === 0) return rowIndex % 2 === 0 ? [2, 1] : [0, 0];
	return [1, 1];
};
</script>
```
:::

### 多级表头与文本截断

嵌套 `TableColumn` 形成分组表头。`header-line` 控制默认标题行数，`line` 控制默认单元格内容行数，截断后悬停可查看完整文本。自定义插槽和 `formatter` 的排版由调用方负责。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<Table :data="rows" border resizable>
		<TableColumn prop="name" label="名称" width="100" fixed="left" />
		<TableColumn label="详细信息">
			<TableColumn prop="group" label="分组" width="120" />
			<TableColumn prop="desc" label="详细说明（拖动列边缘调整宽度）" :header-line="2" :line="2" min-width="180" />
		</TableColumn>
	</Table>
</template>
<script setup>
import { Table, TableColumn } from '@deot/vc';

const rows = [
	{ name: '条目 1', group: '分组 A', desc: '这是一段较长的说明文字，用于展示两行截断与悬停提示；调整列宽后会重新判断是否需要提示。' },
	{ name: '条目 2', group: '分组 B', desc: '较短的说明' }
];
</script>
```
:::

### 空状态与尾部内容

`empty` 插槽优先于 `empty-text`；`append` 插槽位于表体之后、合计行之前。空状态容器不接收指针事件，需要交互时可将操作按钮放在表格外。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<div class="toolbar">
		<Button @click="handleToggle">{{ isEmpty ? '载入数据' : '清空数据' }}</Button>
		<label><input v-model="isCustom" type="checkbox"> 自定义空状态</label>
	</div>
	<Table :data="isEmpty ? [] : rows" empty-text="暂无条目">
		<TableColumn prop="name" label="名称" />
		<TableColumn prop="remark" label="备注" />
		<template v-if="isCustom" #empty><span>没有匹配结果，请调整条件。</span></template>
		<template v-if="!isEmpty" #append><p>共 {{ rows.length }} 条，尾部可放说明或加载入口。</p></template>
	</Table>
</template>
<script setup>
import { ref } from 'vue';
import { Button, Table, TableColumn } from '@deot/vc';

const isEmpty = ref(true);
const isCustom = ref(false);
const rows = [{ name: '条目 1', remark: '备注内容' }];
const handleToggle = () => { isEmpty.value = !isEmpty.value; };
</script>
<style scoped>
.toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-bottom: 12px; }
</style>
```
:::

## API

### Table 属性

以下 `CSSProperties`、`VNodeChild` 为 Vue 类型；回调中的 `row` 为调用方行对象，`column` 为当前列信息。`allowDrag` / `allowDrop` 的对象字段见对应说明。

| 属性                      | 说明                                                                                                                                         | 类型                                                         | 可选值                         | 默认值     |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- | --------------------------- | ------- |
| data                    | 显示的数据；拖拽排序时使用 `v-model:data` 接收新顺序                                                                                                  | `Array`                                                    | -                           | `[]` |
| height                  | `Table` 的高度，默认为自动高度。如果 `height` 为 `number` 类型，单位 px；如果 `height` 为 `string` 类型，则这个高度会设置为 `Table` 的 style.height 的值，Table 的高度会受控于外部样式。       | `string`、`number`                                          | -                           | -       |
| maxHeight              | `Table` 的最大高度                                                                                                                              | `string`、`number`                                          | -                           | -       |
| virtualized             | 无 `height`/`max-height` 时启用外部 viewport 行虚拟化；存在 `height` 或 `max-height` 时不改变原有渲染路径                                                                 | `boolean`                                                   | -                           | `false` |
| lazyTail               | 延迟展示 `append` slot，直到数据全部进入虚拟列表；普通表格视为已到末尾，不影响合计行 | `boolean` | - | `false` |
| stripe                  | 是否为斑马纹 `table`                                                                                                                             | `boolean`                                                  | -                           | `false` |
| border                  | 是否带有纵向边框                                                                                                                                   | `boolean`                                                  | -                           | `false` |
| size                    | `Table` 的尺寸：调整字号与单元格的上下内边距                                                                                                           | `string`                                                   | `large` 、 `medium` 、 `small` 、 `mini` | `medium` |
| fit                     | 列的宽度是否自撑开：列宽之和不足表格宽度时，未设 `width` 的列按比例分配剩余宽度；所有列都设了 `width` 时，剩余宽度给最后一个非固定列（全是固定列时给最后一列）。为 `false` 时不自撑开 | `boolean`                                                  | -                           | `true`  |
| showHeader             | 是否显示表头                                                                                                                                     | `boolean`                                                  | -                           | `true`  |
| highlight               | 是否要高亮当前行                                                                                                                                   | `boolean`                                                  | -                           | `false` |
| currentRowValue       | 当前行的`[id]/value`唯一值（树形表格含子行），只写属性                                                                                                                   | `string`、 `number`                                         | -                           | -       |
| rowHeight | 固定行高，数字及数字字符串按 px 解析；缺省由内容撑开。虚拟化表格（`height` 或 `virtualized`）设置后按行高直接算出每行尺寸，跳过隐藏测量并一次构建全部行，滚动不再逐批停顿；展开行的内容在渲染出来后按实际高度校正；运行时修改行高，未渲染的行也立即按新行高重排 | `string \| number` | - | - |
| recycleListOptions | 透传给内部 [RecycleList](../recycle-list) 的属性，仅在走虚拟列表时（`height` 或 `virtualized`）生效，如 `bufferCount`（可见行前后多渲染的行数，快速滚动时减少露白）、`overscan`、`batchCount`（默认 `100`）、`threshold`。`data`、`store`、`disabled`、`fill`、`vertical`、`inverted`、`cols`、`gutter`、`pullable`、`loadData`、`lazyTail`、`scrollerOptions`、`estimateSize`、`style`、`class` 与事件由 Table 控制，传入无效 | `object` | - | - |
| rowClass               | 行的 `className`，仅作用于单行块对应的 `vc-table__tr`；存在 `getSpan` 合并时不生效，请用 `cell-class`。支持字符串或 `Function({ row, rowIndex })`。 | `string \| ((context: { row: any; rowIndex: number }) => string)` | -                           | -       |
| rowStyle               | 行的 `style`，仅作用于单行块对应的 `vc-table__tr`；存在 `getSpan` 合并时不生效，请用 `cell-style`。支持对象或 `Function({ row, rowIndex })`。 | `CSSProperties \| ((context: { row: any; rowIndex: number }) => CSSProperties)` | -                           | -       |
| cellClass              | 单元格的 `className` 的回调方法，也可以使用字符串为所有单元格设置一个固定的 `className`。                                                                                  | `string \| ((context: { row: any; column: any; rowIndex: number; columnIndex: number }) => string)` | -                           | -       |
| cellStyle              | 单元格的 style 的回调方法，也可以使用一个固定的 Object 为所有单元格设置一样的 Style。                                                                                      | `CSSProperties \| ((context: { row: any; column: any; rowIndex: number; columnIndex: number }) => CSSProperties)` | -                           | -       |
| headerRowClass        | 表头 `vc-table__tr` 的 `className`，支持字符串或 `Function()`（无参数）。                                                                                         | `string \| (() => string)` | -                           | -       |
| headerRowStyle        | 表头 `vc-table__tr` 的 `style`，支持对象或 `Function()`（无参数）。                                                                                               | `CSSProperties \| (() => CSSProperties)` | -                           | -       |
| headerCellClass       | 表头单元格的 `className` 的回调方法，也可以使用字符串为所有表头单元格设置一个固定的 `className`。                                                                              | `string \| ((context: { row: any[]; column: any; rowIndex: number; columnIndex: number }) => string)` | -                           | -       |
| headerCellStyle       | 表头单元格的 `style` 的回调方法，也可以使用一个固定的 `Object` 为所有表头单元格设置一样的 `Style`。                                                                            | `CSSProperties \| ((context: { row: any[]; column: any; rowIndex: number; columnIndex: number }) => CSSProperties)` | -                           | -       |
| primaryKey             | 行数据的 Key，用来优化 Table 的渲染；在使用 reserve-selection 功能的情况下，该属性是必填的。类型为 string 时，支持多层访问：`user.info.id`，但不支持 `user.info[0].id`，此种情况请使用 `Function`。 | `string \| ((row: any) => string \| number)` | -                           | -       |
| emptyText | 空状态文案，`empty` 插槽优先；显式空字符串有效。虽然 props 声明接受函数，当前渲染不会调用它，请用插槽自定义内容 | `string` | - | 当前语言的“暂无数据” |
| defaultExpandAll      | 是否默认展开所有行（展开行与树形节点）；仅作为未操作过的行的默认值                                                                                   | `boolean`                                                  | -                           | false   |
| lazyTree               | 树形数据的子节点是否懒加载，需配合 `load-expand` 使用；通过 `row` 的 `hasChildren` 标记可加载的节点 | `boolean` | - | `false` |
| loadExpand             | 懒加载子节点的方法，返回子行数组或 `Promise<Array>`；`treeNode` 为 `{ level, indent, expandable, expanded, loading }`，`level` 根为 `0` | `(row: any, treeNode: { level: number; indent: number; expandable: boolean; expanded: boolean; loading: boolean }) => any[] \| Promise<any[]>` | - | - |
| treeMap                | 树形数据的字段映射 | `{ children: string; hasChildren: string }` | - | `{ children: 'children', hasChildren: 'hasChildren' }` |
| indent                  | 树形数据每一层的缩进（px） | `number` | - | `16` |
| expandRowValue        | 设置 `Table` 当前展开的行（展开行与树形节点），需要设置 `primary-key` 属性才能使用，该属性为展开行的 `[id]/value` 数组；未列出的行取 `default-expand-all`。                                                               | `Array`                                                    | -                           | -       |
| expandSelectable       | 树形子行是否可选择；为 `false` 时子行的勾选框隐藏，全选只作用于根行                                                                                                                             | `boolean`                                                  | -                           | `true`  |
| showSummary            | 是否在表尾显示合计行                                                                                                                                 | `boolean`                                                  | -                           | `false` |
| sumText | 默认合计行第一列文案；显式空字符串有效 | `string` | - | 当前语言的“合计” |
| getSummary             | 自定义的合计计算方法                                                                                                                                 | `(context: { columns: any[]; data: any[] }) => (string \| number)[]` | -                           | -       |
| getSpan                | 合并行或列的计算方法；开启 / 关闭（传入与否）立即生效，换成另一个函数时在 data 或列变化后按新规则生效                                                                                                                                 | `(context: { row: any; column: any; rowIndex: number; columnIndex: number }) => number[] \| { rowspan?: number; colspan?: number } \| undefined` | -                           | -       |
| indeterminate           | 在多选表格中，当仅有部分行被选中时，点击表头的多选框时的行为。若为 `true`，则选中所有行；若为 `false`，则取消选择所有行                                                                        | `boolean`                                                  | -                           | `true`  |
| sort | 当前排序状态，支持 `v-model:sort`；数据排序由外部处理 | `{ prop?: string; order?: string }` | `ascending`、`descending`、`''` | `{}` |
| delay | 表体延迟挂载的毫秒数 | `number` | - | - |
| resizable | 调整列宽的总开关；缺省跟随 `border`，还需列本身 `resizable=true` | `boolean` | - | `undefined` |
| affix                   | 流式高度下（含 `virtualized` 外部虚拟化，未设置 `height`/`max-height`）表头吸顶、底部 dock（横向滚动条 + 合计行）吸底。`boolean` 同时作用于两端；`array` 为 `[top, bottom]`，每项可为 `boolean` 或 [Affix](../affix) 配置对象；`object` 同时作用于两端。没有合计行时 bottom 项只控制横向滚动条。设置了 `height`/`max-height` 时强制失效。 | `boolean \| object \| [boolean \| object, boolean \| object]`                                  | -                           | `false` |
| columns                 | `v-model` 暴露 Table 收集到的全部 leaf 列（含 `selection`/`expand`/`index` 等无 `prop` 的结构列），每项为 `{ id, prop, label, type, hidden }`。外部可写回两个维度：调整数组顺序（按 `id` 重排，多级表头下逐层生效）、把某项 `hidden` 置 `true/false`（按 `id` 控制该列是否渲染，被隐藏列仍出现在暴露快照中）。列拖拽后的新顺序同样经此发出。其它列属性请用 `TableColumn` 的 props 控制。 | `Array`                                                    | -                           | `[]`    |
| draggable               | 拖拽排序，数组依次为 `[整行拖拽, 列拖拽]`，`true` 等于 `[true, false]`。整行拖拽按住行内任意位置拖动（以块为单位，`get-span` 纵向合并的行整体移动），只从把手拖动时使用 `type="drag"` 的列（不受第一项影响）；新顺序经 `update:data` 发出，配合 `v-model:data` 使用；树形表格会先原地修改 `data`，同时配置 `get-span` 时不可拖拽。列拖拽按住表头拖动，新顺序在表格内部生效并经 `update:columns` 发出。见[拖拽排序](#拖拽排序) | `boolean`、`[boolean, boolean]`                            | -                           | `false` |
| allowDrag              | 块 / 列能否被拖动；返回 `false` 时不能拖动（块的把手置灰，表头不显示 `move` 光标）。`type` 为 `'block'`（行）或 `'column'`（列）；行：`rows` 为块的行（普通表格长度为 1），`rowIndex` 为块首行的行号；列：`column` 为列（分组时为分组本身），`columnIndex` 为列（分组时为其第一个可见叶子）在可见叶子列中的下标 | `(payload: any) => boolean` | -                           | -       |
| allowDrop              | 能否放到落点；返回 `false` 时插入线显示为不可放置，松手不生效。`type` 为 `'block'`（行）或 `'column'`（列）。行：`targetRows` 为落点行（树形表格 `inner` 时为新的父行）；`position` 为相对落点行的位置，`before`、`after`，或 `inner`（成为子行，仅树形表格）；`from` / `to` 为移动前后的位置 `{ parent, index }`，`parent` 为 `null` 表示根级。列：`targetColumn` 为落点列（与被拖列同一父级）；`position` 为 `before` 或 `after`；`from` / `to` 的 `parent` 为父分组，顶层为 `null`，`index` 为兄弟列（含隐藏列）中的下标 | `(payload: any) => boolean` | -                           | -       |
| width | 保留属性，当前实现未读取；控制表格宽度请使用外层布局或 style | `string \| number` | - | - |
| divider | 显示横向分割线；`border` 也会启用 | `boolean` | - | `false` |
| placeholder | 保留属性，当前单元格渲染未读取；空值占位请通过 formatter 或默认插槽实现 | `string \| Function` | - | `'-'` |

### Table 事件

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
| update:sort | 排序交互后同步状态 | `(sort) => void` | `{ prop, order }` |
| update:columns | 列收集、重排或显隐变化时同步列快照 | `(columns) => void` | `{ id, prop, label, type, hidden }[]` |
| sort-change        | 当表格的排序条件发生变化的时候会触发该事件                                         | `({ prop, order }) => void 0`                                                   | `prop`：排序的列；`order`：排序方式                                      |
| load-change      | 加载状态变化（单向推送，无对应属性）；挂载即推送一次，之后每批行构建完成推送一次               | `({ isEnd, isLoading, isSilentRefresh, isEmpty, loaded }) => void 0`    | `isEnd`：数据已全部进入虚拟列表（普通表格恒为 `true`）；`isEmpty`：已结束且无数据；`loaded`：已构建并完成布局的行数（合并单元格按行计，树形表格为展开后的可见行，普通表格为全部行数） |
| update:data        | 拖拽排序松手且顺序变化时触发（`v-model:data`）；树形表格在原地修改数据之后触发             | `(data: Array) => void 0`                                                       | `data`：新的数组，元素为外部数组中存放的原始行，行对象的引用不变；树形表格为原地修改后根数组的副本 |
| block-dragstart    | 拖拽开始时触发（鼠标移动超过阈值，或触摸长按后）                                        | `({ rows, rowIndex }) => void 0`                                                | `rows`：被拖动块的行（普通表格长度为 1）；`rowIndex`：块首行的行号                       |
| block-drop         | 松手且顺序变化时触发，在 `update:data` 之后                                       | `({ rows, targetRows, position, from, to, rawData }) => void 0`                 | `targetRows`：落点行（树形表格 `inner` 时为新的父行）；`position`：`before`、`after`，或 `inner`（仅树形表格）；`from` / `to`：移动前后的位置 `{ parent, index }`，`parent` 为 `null` 表示根级，`index` 非树形表格为块首行在 data 中的下标、树形表格为兄弟行中的下标；`rawData`：新的数组（同 `update:data`） |
| block-dragend      | 拖拽结束时触发，取消、顺序不变、不允许放置时也会触发                                       | `({ rows, rowIndex, dropped }) => void 0`                                       | `dropped`：是否按新顺序放下                                                  |
| column-dragstart   | 列拖拽开始时触发（鼠标移动超过阈值，或触摸长按后）                                     | `({ column, columnIndex }) => void 0`                                           | `column`：被拖动的列（分组时为分组本身）；`columnIndex`：列（分组时为其第一个可见叶子）在可见叶子列中的下标 |
| column-drop        | 列拖拽松手且顺序变化时触发，在新顺序生效、`update:columns` 发出之后                      | `({ column, targetColumn, position, from, to, columns }) => void 0`             | `targetColumn`：落点列；`position`：`before` 或 `after`；`from` / `to`：移动前后的位置 `{ parent, index }`，`parent` 为父分组，顶层为 `null`，`index` 为兄弟列（含隐藏列）中的下标；`columns`：新的列列表（同 `update:columns`） |
| column-dragend     | 列拖拽结束时触发，取消、顺序不变、不允许放置时也会触发                                     | `({ column, columnIndex, dropped }) => void 0`                                  | `dropped`：是否按新顺序放下                                                  |


### Table 方法

| 方法名                | 说明                                                             | 参数                                                                           | 返回值 |
| ------------------ | -------------------------------------------------------------- | ---------------------------------------------------------------------------- | --- |
| clearSelection     | 用于多选表格，清空用户的选择                                                 | -                                                                            | `void` |
| toggleRowSelection | 用于多选表格，切换某一行的选中状态，如果使用了第二个参数，则是设置这一行选中与否（selected 为 true 则选中）  | `row`：要切换的行数据；`selected`：设置该行的选中状态；`emitChange`：是否触发 `select`，缺省为 `true` | `void` |
| toggleAllSelection | 用于多选表格，切换所有行的选中状态                                              | -                                                                            | `void` |
| toggleRowExpansion | 用于可展开表格与树形表格，切换某一行的展开状态，如果使用了第二个参数，则是设置这一行展开与否（expanded 为 true 则展开） | `row`：要展开的行数据；`expanded`：设置该行是否展开                                            | `void` |
| setCurrentRow      | 用于单选表格，设定某一行为选中行，如果调用时不加参数，则会取消目前高亮行的选中状态。                     | `row`：选中的行数据                                                                 | `void` |
| refreshLayout      | 对 Table 进行重新布局，虚拟化表格（`height` 或 `virtualized`）会同时整体重新测量已构建的行。数据变化、尺寸变化会自动处理（内部的布局更新只刷新虚拟列表的视口），仅在无法自动观察的布局变化后调用 | -                                                                            | `void` |
| refreshAffix       | 手动刷新表头/底部 dock 的吸附状态（`affix` 生效时）。Affix只有当滚动时才触发，wrapper/content高度变化需手动处理              | -                                                                            | `void` |


### Table 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 声明 TableColumn | - |
| empty | 自定义空状态，优先于 emptyText | - |
| append | 表体之后、合计行之前的内容；lazyTail 控制延迟显示 | - |


### TableColumn 属性

| 属性                 | 说明                                                                                           | 类型                                             | 可选值                                    | 默认值       |
| ------------------ | -------------------------------------------------------------------------------------------- | ---------------------------------------------- | -------------------------------------- | --------- |
| type               | 对应列的类型。如果设置了 `selection` 则显示多选框；如果设置了 `index` 则显示该行的索引（从 1 开始计算）；如果设置了 `expand` 则显示为一个可展开的按钮；如果设置了 `drag` 则显示拖拽排序的把手（见[拖拽排序](#拖拽排序)） | `string`                                       | `selection`、`index`、`expand`、`drag`、`default` | `default` |
| index              | 如果设置了 `type=index`，可以通过传递 `index` 属性来自定义索引                                                   | `number \| ((rowIndex: number) => number)` | -                                      | -         |
| label              | 显示的标题                                                                                        | `string`                                       | -                                      | -         |
| prop               | 对应列内容的字段名                                                                                    | `string`                                       | -                                      | -         |
| width              | 对应列的宽度                                                                                       | `string`、`number`                             | -                                      | -         |
| minWidth          | 对应列的最小宽度，与 `width` 的区别是 `width` 是固定的，`min-width`把剩余宽度按比例分配给设置了 `min-width` 的列                | `string`、`number`                             | -                                      | -         |
| fixed              | 列是否固定在左侧或者右侧，`true` 表示固定在左侧                                                                  | `string`, `boolean`                            | `true`, `left`, `right`                | -         |
| renderHeader      | 列标题 `Label` 区域渲染使用的 `Function`                                                               | `(context: { column: any; columnIndex: number; store: any }) => VNodeChild` | -                                      | -         |
| resizable | 当前列允许调整宽度，还需 Table 的 resizable 或 border 启用；selection/expand/drag 列不允许调整 | `boolean` | - | `true` |
| formatter | 自定义单元格内容；参数与默认单元格插槽相同，无 `cellValue` 或 `$index` 字段 | `(context: { row: any; column: any; rowIndex: number; columnIndex: number; store: any; selected?: boolean; level?: number; treeNode?: object }) => VNodeChild` | - | - |
| line | 默认单元格最多显示行数，截断时显示悬停提示；缺省读取全局 TableColumn.line，仍缺省则不限行 | `number` | `0` 表示不限行 | `undefined` |
| headerLine        | 表头文本行数，超出省略并在 hover 时展示完整内容，`0` 为不限行数。取值顺序：列上的值 → 全局配置 `TableColumn.headerLine` → `1`。仅对 `label` 生效：`header` 插槽、`render-header` 及 `selection`/`index`/`expand` 列保持单行省略，高度由内容撑开 | `number`                                       | -                                      | `1`       |
| align              | 对齐方式                                                                                         | `string`                                       | `left`、`center`、`right`                | `left`    |
| headerAlign | 表头对齐，缺省跟随当前列 align | `string` | `left`、`center`、`right` | - |
| class              | 列的 `className`                                                                               | `string`                                       | -                                      |           |
| labelClass        | 当前列标题的自定义类名                                                                                  | `string`                                       | -                                      | -         |
| selectable         | 仅对 `type=selection` 的列有效，类型为 `Function`，`Function` 的返回值用来决定这一行的 `CheckBox` 是否可以勾选；`index` 为行在可选择行中的下标（树形表格按展开前的全部行计，与展开状态无关）；行对象需唯一，同一对象在数据中重复出现时，下标取最后一次出现的位置 | `(row: any, rowIndex: number) => boolean` | -                                      | -         |
| reserveSelection  | 仅对 `type=selection` 的列有效，类型为 `boolean`，为 `true` 则会在数据更新之后保留之前选中的数据（需指定 `primary-key`）        | `boolean`                                      | -                                      | `false`   |
| filterOptions     | 表头筛选的配置，原样传给筛选组件，字段见下方 [filter-options](#filter-options) | `Object` | - | - |
| sortable | 显示排序箭头，selection/expand/drag 列不支持 | `boolean` | - | `false` |
| tooltip | 表头帮助图标的提示文字 | `string \| ((context: { column: any; store: any }) => string)` | - | - |

### TableColumn 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 默认单元格内容；嵌套 TableColumn 时作为分组声明 | `{ row, column, rowIndex, columnIndex, store, selected, level, treeNode }`；treeNode 仅树形列提供，包含 `{ level, indent, expandable, expanded, loading }` |
| default（type="expand"） | 展开区内容 | `{ row, rowIndex, store }` |
| header | 自定义表头 | `{ column, columnIndex, store }` |

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

### 悬停高亮

鼠标所在的行高亮；`getSpan` 纵向合并覆盖该行的单元格一并高亮。

- 鼠标停留约 30ms 后才高亮，快速划过时不逐行闪
- 表体或页面滚动期间不高亮（行从静止的鼠标下经过时不逐行闪），滚动停止约 150ms 后按鼠标位置恢复；拖拽排序期间同样不高亮
- 滚动期间单元格事件（`cell-mouseenter` / `cell-mouseleave`、点击等）照常触发

### filter-options

| 字段 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| data | 筛选项 | `Array<{ label: string \| number; value: string \| number; disabled?: boolean }>` | `[]` |
| max | 可选数量上限：`1` 为单选，大于 `1` 为多选，选满后其余选项置灰 | `number` | `1` |
| modelValue | 当前生效的筛选值，形态同 `Select`：数组，或 `'a,b'` 字符串 / 单个值；写了这个字段即为受控 | `Array \| string \| number` | - |
| separator | 字符串形态的分隔符，同 `Select` | `string` | `,` |
| numerable | 字符串形态对应数字选项时设为 `true`，同 `Select` | `boolean` | `false` |
| icon | 筛选图标 | `string` | `filter-solid` |
| portalClass | 弹层的自定义类名 | `string` | - |
| onUpdate:modelValue | 生效值变化时触发，受控时在这里写回 | `(value) => void` | - |
| onChange | 生效值变化时触发 | `(value) => void` | - |

### 移动端

`MTable`、`MTableColumn` 分别是 `Table`、`TableColumn` 的别名，使用相同的属性、插槽、样式和行为。

### 布局注意事项

位于 flex/grid 容器中时，给承载表格的子项设置 `min-width: 0`，避免列宽撑开父容器。SSR 不会渲染完整表体，请在客户端挂载后展示数据。
