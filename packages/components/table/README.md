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

const handleClick = (row, column, cell, event) => {

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

对表格进行筛选，可快速查找或对比数据。

:::RUNTIME
```vue
<template>
	<Table :data="dataSource">
		<TableColumn
			prop="date"
			label="日期"
			:filters="filters"
			:filtered-value="filteredValue"
			:filter-multiple="true"
			:filter="handleFilter"
			min-width="180"
		/>
		<TableColumn
			prop="name"
			label="姓名"
			width="180"
		/>
		<TableColumn
			prop="address"
			label="地址"
			width="880"
		/>
	</Table>
</template>
<script setup>
import { Table, TableColumn } from '@deot/vc';

const filters = ref([
	{ label: '代理升级', value: 1 },
	{ label: '代理加入', value: 2, disabled: true }
]);
const filteredValue = ref([]);
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
const handleFilter = (value) => {
	filteredValue.value = value;
};
</script>
```
:::

### 树形数据与懒加载
支持树类型的数据的显示。当 `row` 中包含 `children` 字段时，被视为树形数据。渲染树形数据时，必须要指定 `primary-key`。支持子节点数据异步加载。设置 `Table` 的 `lazy` 属性为 `true` 与加载函数 `load-expand` 。通过指定 `row` 中的 `hasChildren` 字段来指定哪些行是包含子节点。`children` 与 `hasChildren` 都可以通过 `tree-map` 配置。

:::RUNTIME
```vue
<template>
	<Table
		ref="table"
		:key="key"
		:data="dataSource"
		:load-expand="loadExpand"
		:expand-selectable="true"
		lazy
		style="width: 100%"
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
			:formatter="formatter"
			prop="address"
			label="地址"
		/>
	</Table>
</template>
<script setup>
import { ref } from 'vue';
import { Table, TableColumn } from '@deot/vc';

const getData = () => {
	return [
		{
			id: 1,
			date: `${new Date().getTime()}`,
			name: `代号 - ${Math.ceil(Math.random() * 1000)}`,
			address: `祥园路${Math.ceil(Math.random() * 1000)}号`,
			hasChildren: true
		},
		{
			id: 2,
			date: `${new Date().getTime()}`,
			name: `代号 - ${Math.ceil(Math.random() * 1000)}`,
			address: `祥园路${Math.ceil(Math.random() * 1000)}号`,
			hasChildren: true
		},
		{
			id: 3,
			date: `${new Date().getTime()}`,
			name: `代号 - ${Math.ceil(Math.random() * 1000)}`,
			address: `祥园路${Math.ceil(Math.random() * 1000)}号`,
			children: [
				{
					id: 31,
					date: `${new Date().getTime()}`,
					name: `代号 - ${Math.ceil(Math.random() * 1000)}`,
					address: `祥园路${Math.ceil(Math.random() * 1000)}号`,
				},
				{
					id: 32,
					date: `${new Date().getTime()}`,
					name: `代号 - ${Math.ceil(Math.random() * 1000)}`,
					address: `祥园路${Math.ceil(Math.random() * 1000)}号`,
				}
			]
		},
		{
			id: 4,
			date: `${new Date().getTime()}`,
			name: `代号 - ${Math.ceil(Math.random() * 1000)}`,
			address: `祥园路${Math.ceil(Math.random() * 1000)}号`,
		}
	];
};

const dataSource = ref(getData());
const key = ref(1);

const loadExpand = (tree, treeNode) => {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			resolve([
				{
					id: Math.ceil(Math.random() * 1000),
					date: `${new Date().getTime()}`,
					name: `代号 - ${Math.ceil(Math.random() * 1000)}`,
					address: `祥园路${Math.ceil(Math.random() * 1000)}号`,
					hasChildren: !(treeNode.level > 1)
				},
				{
					id: Math.ceil(Math.random() * 1000),
					date: `${new Date().getTime()}`,
					name: `代号 - ${Math.ceil(Math.random() * 1000)}`,
					address: `祥园路${Math.ceil(Math.random() * 1000)}号`,
					hasChildren: !(treeNode.level > 3)
				}
			]);
		}, 1000);
	});
};

const formatter = ({ row, column, cellValue, index }) => {
	return row.address;
};

const handleExpandChange = (row, expandedRows, maxLevel) => {
	treeWidth.value = 180 + maxLevel * 20;
};
```
:::

## API

### Table props
| 属性                      | 说明                                                                                                                                         | 类型                                                         | 可选值                         | 默认值     |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- | --------------------------- | ------- |
| data                    | 显示的数据                                                                                                                                      | `Array`                                                    | -                           | -       |
| height                  | `Table` 的高度，默认为自动高度。如果 `height` 为 `number` 类型，单位 px；如果 `height` 为 `string` 类型，则这个高度会设置为 `Table` 的 style.height 的值，Table 的高度会受控于外部样式。       | `string`、`number`                                          | -                           | -       |
| max-height              | `Table` 的最大高度                                                                                                                              | `string`、`number`                                          | -                           | -       |
| stripe                  | 是否为斑马纹 `table`                                                                                                                             | `boolean`                                                  | -                           | `false` |
| border                  | 是否带有纵向边框                                                                                                                                   | `boolean`                                                  | -                           | `false` |
| size                    | `Table` 的尺寸                                                                                                                                | `string`                                                   | `medium` 、 `small` 、 `mini` | -       |
| fit                     | 列的宽度是否自撑开                                                                                                                                  | `boolean`                                                  | -                           | `true`  |
| show-header             | 是否显示表头                                                                                                                                     | `boolean`                                                  | -                           | `true`  |
| highlight               | 是否要高亮当前行                                                                                                                                   | `boolean`                                                  | -                           | `false` |
| current-row-value       | 当前行的`[id]/value`唯一值，只写属性                                                                                                                   | `string`、 `number`                                         | -                           | -       |
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
| default-expand-all      | 是否默认展开所有行，当 `Table` 中存在 `type="expand"` 的 `Column` 的时候有效                                                                                   | `boolean`                                                  | -                           | false   |
| expand-row-value        | 可以通过该属性设置 `Table` 目前的展开行，需要设置 `primary-key` 属性才能使用，该属性为展开行的 `[id]/value` 数组。                                                               | `Array`                                                    | -                           | -       |
| expand-selectable       | 子节点是否可选择（会被隐藏）                                                                                                                             | `boolean`                                                  | -                           | `true`  |
| show-summary            | 是否在表尾显示合计行                                                                                                                                 | `boolean`                                                  | -                           | `false` |
| sum-text                | 合计行第一列的文本                                                                                                                                  | `string`                                                   | -                           | 合计      |
| get-summary             | 自定义的合计计算方法                                                                                                                                 | `Function({ columns, data })`                              | -                           | -       |
| get-span                | 合并行或列的计算方法                                                                                                                                 | `Function({ row, column, rowIndex, columnIndex })`         | -                           | -       |
| select-on-indeterminate | 在多选表格中，当仅有部分行被选中时，点击表头的多选框时的行为。若为 `true`，则选中所有行；若为 `false`，则取消选择所有行                                                                        | `boolean`                                                  | -                           | `true`  |
| sort                    | 默认的排序列的 `prop` 和顺序。它的`prop`属性指定默认的排序的列，`order`指定默认排序的顺序                                                                                    |                                                            |                             |         |
| delay                   | 延迟选择，排除transition的影响                                                                                                                       |                                                            |                             |         |
| resizable               | 是否可以伸缩(总开关/单独的column.resizable也可以设置)                                                                                                                                     |                                                            |                             |         |
| affix                   | 流式高度下（未设置 `height`/`max-height`）表头吸顶、合计行吸底。`boolean` 同时作用于表头与合计行；`array` 为 `[top, bottom]`，每项可为 `boolean` 或 [Affix](../affix) 配置对象；`object` 同时作用于两端。设置了 `height`/`max-height` 时强制失效。 | `boolean`、`array`、`object`                                  | -                           | `false` |
| columns                 | `v-model` 暴露 Table 收集到的全部 leaf 列（含 `selection`/`expand`/`index` 等无 `prop` 的结构列），每项含 `{ id, prop, label, type, width, fixed, align, hidden, ... }`。外部可写回两个维度：调整数组顺序（按 `id` 重排）、把某项 `hidden` 置 `true/false`（按 `id` 控制该列是否渲染，被隐藏列仍出现在暴露快照中）。`width`/`fixed` 等其它字段为只读，请用 `TableColumn` 的 props 控制。 | `Array`                                                    | -                           | `[]`    |


### 事件

| 事件名                | 说明                                                            | 回调参数                                                                            | 参数说明                                                           |
| ------------------ | ------------------------------------------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| select             | 当用户手动勾选数据行的 Checkbox 时触发的事件                                   | `(selection: Array, row: Object) => void 0`                                     | `selection`：当前表格选中的所有数据；`row`：当前勾选的行数据                         |
| select-all         | 当用户手动勾选全选 Checkbox 时触发的事件                                     | `(selection: Object) => void 0`                                                 | `selection`：当前表格选中的所有数据                                        |
| selection-change   | 当选择项发生变化时会触发该事件                                               | `(selection: Object) => void 0`                                                 | `selection`：当前表格选中的所有数据                                        |
| cell-mouse-enter   | 当单元格 hover 进入时会触发该事件                                          | `(row: Object, column: Object, cell: Object, event: Object) => void 0`          | `row`：当前行数据；`column`：当前列数据； `cell`：当前单元格数据；`event`：事件对象        |
| cell-mouse-leave   | 当单元格 hover 退出时会触发该事件                                          | `(row: Object, column: Object, cell: Object, event: Object) => void 0`          | `row`：当前行数据；`column`：当前列数据； `cell`：当前单元格数据；`event`：事件对象        |
| cell-click         | 当某个单元格被点击时会触发该事件                                              | `(row: Object, column: Object, cell: Object, event: Object) => void 0`          | `row`：当前行数据；`column`：当前列数据； `cell`：当前单元格数据；`event`：事件对象        |
| cell-dblclick      | 当某个单元格被双击击时会触发该事件                                             | `(row: Object, column: Object, cell: Object, event: Object) => void 0`          | `row`：当前行数据；`column`：当前列数据； `cell`：当前单元格数据；`event`：事件对象        |
| row-click          | 当某一行被点击时会触发该事件                                                | `(row: Object, column: Object, event: Object) => void 0`                        | `row`：当前行数据；`column`：当前列数据；`event`：事件对象                        |
| row-contextmenu    | 当某一行被鼠标右键点击时会触发该事件                                            | `(row: Object, column: Object, event: Object) => void 0`                        | `row`：当前行数据；`column`：当前列数据；`event`：事件对象                        |
| row-dblclick       | 当某一行被双击时会触发该事件                                                | `(row: Object, column: Object, event: Object) => void 0`                        | `row`：当前行数据；`column`：当前列数据；`event`：事件对象                        |
| header-click       | 当某一列的表头被点击时会触发该事件                                             | `(column: Object, event: Object) => void 0`                                     | `column`：当前列数据；`event`：事件对象                                    |
| header-contextmenu | 当某一列的表头被鼠标右键点击时触发该事件                                          | `(column: Object, event: Object) => void 0`                                     | `column`：当前列数据；`event`：事件对象                                    |
| current-change     | 当表格的当前行发生变化的时候会触发该事件，如果要高亮当前行，请打开表格的 highlight-current-row 属性 | `(currentRow: Object, oldCurrentRow: Object) => void 0`                         | `currentRow`：改变后的行数据；`oldCurrentRow`：改变前的行数据                   |
| header-dragend     | 当拖动表头改变了列的宽度的时候会触发该事件                                         | `(newWidth: number, oldWidth: number, column: Object, event: Object) => void 0` | `newWidth`: 拖拽后宽度；`oldWidth`：拖拽前宽度；`column`：当前列数据；`event`：事件对象 |
| expand-change      | 当用户对某一行展开或者关闭的时候会触发该事件                                        | `(row: Object, expandedRows: Object, maxLevel: number) => void 0`               | `row`：当前行数据；`expandedRows`：展开的行数据；`maxLevel`：当前展开最大的level      |
| sort-change        | 当表格的排序条件发生变化的时候会触发该事件                                         | { prop, order }                                                                 |                                                                |


### 方法

| 方法名                | 说明                                                             | 参数                                                                           |
| ------------------ | -------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| clearSelection     | 用于多选表格，清空用户的选择                                                 | -                                                                            |
| toggleRowSelection | 用于多选表格，切换某一行的选中状态，如果使用了第二个参数，则是设置这一行选中与否（selected 为 true 则选中）  | `row`：要切换的行数据；`selected`：设置改行的选中状态；`emitChange`：调用 API 修改选中值，不触发 `select` 事件 |
| togglAllSelection  | 用于多选表格，切换所有行的选中状态                                              | -                                                                            |
| toggleRowExpansion | 用于可展开表格，切换某一行的展开状态，如果使用了第二个参数，则是设置这一行展开与否（expanded 为 true 则展开） | `row`：要展开的行数据；`expanded`：设置该行是否展开                                            |
| setCurrentRow      | 用于单选表格，设定某一行为选中行，如果调用时不加参数，则会取消目前高亮行的选中状态。                     | `row`：选中的行数据                                                                 |
| refreshLayout      | 对 Table 进行重新布局。当 Table 或其祖先元素由隐藏切换为显示时，可能需要调用此方法               | -                                                                            |
| refreshAffix       | 手动刷新表头/合计行的吸附状态（`affix` 生效时）。Affix只有当滚动时才触发，wrapper/content高度变化需手动处理              | -                                                                            |


### Slot

| 属性     | 说明                                                                       |
| ------ | ------------------------------------------------------------------------ |
| append | 插入至表格最后一行之后的内容，如果需要对表格的内容进行无限滚动操作，可能需要用到这个 slot。若表格有合计行，该 slot 会位于合计行之上。 |


### Column props

| 属性                 | 说明                                                                                           | 类型                                             | 可选值                                    | 默认值       |
| ------------------ | -------------------------------------------------------------------------------------------- | ---------------------------------------------- | -------------------------------------- | --------- |
| type               | 对应列的类型。如果设置了 `selection` 则显示多选框；如果设置了 `index` 则显示该行的索引（从 1 开始计算）；如果设置了 `expand` 则显示为一个可展开的按钮 | `string`                                       | `selection`、`index`、`expand`、`default` | `default` |
| index              | 如果设置了 `type=index`，可以通过传递 `index` 属性来自定义索引                                                   | `number`, `Function(index)`                    | -                                      | -         |
| label              | 显示的标题                                                                                        | `string`                                       | -                                      | -         |
| prop               | 对应列内容的字段名                                                                                    | `string`                                       | -                                      | -         |
| width              | 对应列的宽度                                                                                       | `string`                                       | -                                      | -         |
| min-width          | 对应列的最小宽度，与 `width` 的区别是 `width` 是固定的，`min-width`把剩余宽度按比例分配给设置了 `min-width` 的列                | `string`                                       | -                                      | -         |
| fixed              | 列是否固定在左侧或者右侧，`true` 表示固定在左侧                                                                  | `string`, `boolean`                            | `true`, `left`, `right`                | -         |
| render-header      | 列标题 `Label` 区域渲染使用的 `Function`                                                               | Function(h, { column, $index })                | -                                      | -         |
| resizable          | 对应列是否可以通过拖动改变宽度（需要在 `Table` 上设置 `border` 属性为真）                                               | `boolean`                                      | -                                      | `true`    |
| formatter          | 用来格式化内容                                                                                      | `Function({ row, column, cellValue, $index })` | -                                      | -         |
| line               | 文本行数                                                                                         | `number`                                       | -                                      | `0`       |
| align              | 对齐方式                                                                                         | `string`                                       | `left`、`center`、`right`                | `left`    |
| header-align       | 表头对齐方式，若不设置该项，则使用表格的对齐方式                                                                     | `string`                                       | `left`、`center`、`right`                | -         |
| class              | 列的 `className`                                                                               | `string`                                       | -                                      |           |
| label-class        | 当前列标题的自定义类名                                                                                  | `string`                                       | -                                      | -         |
| selectable         | 仅对 t`ype=selection` 的列有效，类型为 `Function`，`Function` 的返回值用来决定这一行的 `CheckBox` 是否可以勾选            | `Function(row, index)`                         | -                                      | -         |
| reserve-selection  | 仅对 `type=selection` 的列有效，类型为 `boolean`，为 `true` 则会在数据更新之后保留之前选中的数据（需指定 `primary-key`）        | `boolean`                                      | -                                      | `false`   |
| filters            | 数据过滤的选项，数组格式，数组中的元素需要有 label 和 value 属性。                                                     | `Array[{ label, value }]`                      |                                        |           |
| filter-multiple    | 数据过滤的选项是否多选                                                                                  | `boolean`                                      | -                                      | `true`    |
| filter-icon        | 筛选的icon                                                                                      | `string`                                       | -                                      | -         |
| filter-popup-class | 筛选弹框的自定义样式名                                                                                  | `string`                                       | -                                      | -         |
| filtered-value     | 选中的数据过滤项                                                                                     | `Array`                                        | -                                      | -         |
| filter             | 筛选数据调用的方法                                                                                    | `Function`                                     | -                                      | -         |

### Column Slot

| 属性     | 说明                                  |
| ------ | ----------------------------------- |
| -      | 自定义列的内容，参数为 { row, column, $index } |
| header | 自定义表头的内容. 参数为 { column, $index }    |


## TODO
- `SSR`时能渲染带'数据'的内容
