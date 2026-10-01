## 树形控件（Tree）

`Tree` 展示层级数据，支持展开、勾选、筛选、懒加载和拖拽；`TreeSelect` 将树形选择放入下拉面板，也支持级联列展示。`MTree`、`MTreeSelect` 分别复用这两个组件。

### 何时使用

用于目录、组织架构、分类等层级信息。需要在表单中选择节点时使用 `TreeSelect`。

### 基础用法

每个节点提供全树唯一的 `value` 和显示用的 `label`，通过 `children` 组织子节点。点击标签会设置当前节点，默认也会展开或收起；`accordion` 使同级节点互斥展开。

:::playground
<!-- <config lang="json5">{ previewInset: 20 }</config> -->
```vue
<template>
	<div class="tree-demo">
		<Checkbox v-model="isAccordion">同级手风琴</Checkbox>
		<Tree :data="data" :accordion="isAccordion" highlight-current @node-click="handleNodeClick" />
		<p>当前节点：{{ current || '尚未选择' }}</p>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Checkbox, Tree } from '@deot/vc';

const isAccordion = ref(false);
const current = ref('');
const data = [
	{ value: 'guide', label: '使用指南', children: [{ value: 'start', label: '快速开始' }, { value: 'install', label: '安装' }] },
	{ value: 'components', label: '组件', children: [{ value: 'tree', label: '树形控件' }, { value: 'table', label: '表格' }] }
];
const handleNodeClick = ({ data: row }) => { current.value = row.label; };
</script>
<style scoped>
.tree-demo { display: grid; gap: 12px; }
.tree-demo p { margin: 0; }
</style>
```
:::

### 勾选、筛选与自定义标签

`showCheckbox` 开启勾选，`v-model` 保存节点值。默认父子联动，`checkStrictly` 可切换为独立勾选。节点的 `disabled` 只限制交互勾选，不禁止展开或设置当前节点。

调用 `filter(value)` 时，必须提供 `filterNode(value, data, node)`；命中节点的祖先会保留显示。`renderNodeLabel` 接收 `{ row, store }`，分别为原始数据和节点对象。

:::playground
<!-- <config lang="json5">{ previewInset: 20 }</config> -->
```vue
<template>
	<div class="tree-demo">
		<Input v-model="keyword" placeholder="筛选节点" @input="handleFilter" />
		<Checkbox v-model="isStrict">父子独立勾选</Checkbox>
		<Tree
			ref="tree"
			v-model="values"
			:data="data"
			:check-strictly="isStrict"
			:filter-node="filterNode"
			:render-node-label="renderLabel"
			:expand-on-click-node="false"
			show-checkbox
			default-expand-all
		/>
		<div class="tree-demo__actions">
			<Button @click="handleSelect">选择条目 A</Button>
			<Button @click="handleClear">清空勾选</Button>
			<Button @click="handleRead">读取叶节点</Button>
		</div>
		<p>节点值：{{ values.join(', ') || '无' }}</p>
		<p>最近读取：{{ result || '尚未读取' }}</p>
	</div>
</template>
<script setup>
import { h, ref } from 'vue';
import { Button, Checkbox, Input, Tree } from '@deot/vc';

const tree = ref();
const keyword = ref('');
const values = ref([]);
const isStrict = ref(false);
const result = ref('');
const data = [{ value: 'group-a', label: '分组 A', children: [
	{ value: 'item-a', label: '条目 A' },
	{ value: 'item-b', label: '条目 B' },
	{ value: 'item-c', label: '条目 C（禁用）', disabled: true }
] }];
const filterNode = (value, row) => !value || row.label.includes(value);
const renderLabel = ({ row }) => h('span', `${row.label} · ${row.value}`);
const handleFilter = () => tree.value.filter(keyword.value);
const handleSelect = () => { values.value = ['item-a']; };
const handleClear = () => { values.value = []; };
const handleRead = () => {
	result.value = tree.value.getCheckedNodes(true).map(node => node.states.data.label).join('、') || '无';
};
</script>
<style scoped>
.tree-demo { display: grid; gap: 12px; max-width: 480px; }
.tree-demo__actions { display: flex; flex-wrap: wrap; gap: 8px; }
.tree-demo p { margin: 0; overflow-wrap: anywhere; }
</style>
```
:::

### 懒加载

`lazy` 与 `loadData(node)` 配合使用，回调返回子节点数组的 Promise。根数据由 `data` 提供；展开未加载节点时才请求子节点。已知叶节点可设置 `isLeaf: true`，加载后返回空数组也会成为叶节点。

:::playground
<!-- <config lang="json5">{ previewInset: 20 }</config> -->
```vue
<template>
	<div class="tree-demo">
		<Tree :data="data" :load-data="loadData" lazy />
		<p>加载次数：{{ count }}。展开“远程目录”查看子节点。</p>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Tree } from '@deot/vc';

const count = ref(0);
const data = [{ value: 'remote', label: '远程目录' }, { value: 'readme', label: '说明文件', isLeaf: true }];
const loadData = async (node) => {
	count.value++;
	await new Promise(resolve => setTimeout(resolve, 500));
	return [1, 2].map(index => ({ value: `${node.getter.value}-${index}`, label: `文件 ${index}`, isLeaf: true }));
};
</script>
<style scoped>
.tree-demo { display: grid; gap: 12px; }
.tree-demo p { margin: 0; }
</style>
```
:::

### 拖拽节点

设置 `draggable` 后，行的上、中、下区域分别表示 `before`、`inner`、`after`；`inner` 将节点追加到目标的子节点末尾。已展开且有子节点的行没有 `after` 区域。

`allowDrag({ node, data })` 决定能否开始拖拽；`allowDrop({ node, data, targetNode, position, from, to })` 分别判断三个落点区域，被拒绝的区域让给相邻区域。`from`、`to` 为 `{ parent, index }`，根级 `parent` 为 `null`，`to.index` 按移除被拖节点后的下标计算。成功移动会先发出 `node-drop`，再发出 `node-dragend`。

:::playground
<!-- <config lang="json5">{ previewInset: 20 }</config> -->
```vue
<template>
	<div class="tree-demo">
		<Checkbox v-model="isSameLevel">只允许同级排序</Checkbox>
		<Tree :data="data" :allow-drag="allowDrag" :allow-drop="allowDrop" draggable default-expand-all @node-drop="handleDrop" />
		<p>{{ result }}</p>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Checkbox, Tree } from '@deot/vc';

const isSameLevel = ref(false);
const result = ref('拖动节点后查看落点');
const data = [
	{ value: 'group', label: '分组', children: [{ value: 'a', label: '条目 A' }, { value: 'b', label: '条目 B' }] },
	{ value: 'c', label: '条目 C' },
	{ value: 'locked', label: '固定节点（不可拖动）', isLocked: true }
];
const allowDrag = ({ data: row }) => !row.isLocked;
const allowDrop = ({ from, to }) => !isSameLevel.value || from.parent === to.parent;
const handleDrop = ({ data: row, targetNode, position, from, to }) => {
	result.value = `${row.label} → ${targetNode.getter.label} (${position})，下标 ${from.index} → ${to.index}`;
};
</script>
<style scoped>
.tree-demo { display: grid; gap: 12px; }
.tree-demo p { margin: 0; overflow-wrap: anywhere; }
</style>
```
:::

### 树选择与级联搜索

`TreeSelect` 默认 `max = Infinity`，显示多选标签；`max = 1` 切换为单标签展示。当前实现不按 `max` 限制勾选数量，单标签展示也不等同于互斥单选。

`cascader` 开启鼠标悬停展开的级联列。`searchable` 开启搜索，空格或英文逗号分隔的关键词任一命中即可：树形模式保留层级，级联模式显示完整路径列表。关闭面板会清空搜索。非独立勾选时，搜索结果中的父节点仍会联动所有子孙节点，包括隐藏节点。

多选标签默认只占一行；超出宽度的标签折叠为 `+N...`，悬停可查看并移除。`maxTags` 限制可见标签数，`maxTagLines` 控制行数，设为 `0` 表示不限制。非 `checkStrictly` 时标签展示完整路径。

:::playground
<!-- <config lang="json5">{ previewInset: 20 }</config> -->
```vue
<template>
	<div class="tree-select-demo">
		<div class="tree-select-demo__actions">
			<Checkbox v-model="isCascader">级联列</Checkbox>
			<Checkbox v-model="isStrict">独立勾选</Checkbox>
			<Checkbox v-model="isDisabled">禁用</Checkbox>
		</div>
		<TreeSelect
			v-model="values"
			:data="data"
			:cascader="isCascader"
			:check-strictly="isStrict"
			:disabled="isDisabled"
			:max-tags="2"
			searchable
			clearable
			search-placeholder="搜索条目"
		/>
		<p>节点值：{{ values.join(', ') || '无' }}</p>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Checkbox, TreeSelect } from '@deot/vc';

const isCascader = ref(false);
const isStrict = ref(false);
const isDisabled = ref(false);
const values = ref(['item-a1', 'item-b1']);
const data = [
	{ value: 'group-a', label: '分组 A', children: [{ value: 'item-a1', label: '条目 A' }, { value: 'item-a2', label: '条目 B' }] },
	{ value: 'group-b', label: '分组 B', children: [{ value: 'item-b1', label: '条目 B' }, { value: 'item-b2', label: '条目 C', disabled: true }] }
];
</script>
<style scoped>
.tree-select-demo { display: grid; gap: 12px; max-width: 400px; }
.tree-select-demo__actions { display: flex; flex-wrap: wrap; gap: 8px; }
.tree-select-demo p { margin: 0; overflow-wrap: anywhere; }
</style>
```
:::

### 远程搜索

TreeSelect 的 `loadData(keyword, instance)` 用于搜索，不是 Tree 的懒加载回调。组件以 250ms 防抖调用它，并显示 Promise 等待状态；调用方需更新 `data`，Promise 的返回值不会自动成为数据源。启用后关闭本地过滤，仅保留匹配高亮。

:::playground
<!-- <config lang="json5">{ previewInset: 20 }</config> -->
```vue
<template>
	<div class="tree-select-demo">
		<TreeSelect v-model="values" :data="data" :load-data="loadData" searchable check-strictly clearable search-placeholder="输入条目 A 或 B" />
		<p>节点值：{{ values.join(', ') || '无' }}</p>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { TreeSelect } from '@deot/vc';

const source = [{ value: 'item-a', label: '条目 A' }, { value: 'item-b', label: '条目 B' }];
const data = ref(source);
const values = ref([]);
let requestId = 0;
const loadData = async (keyword) => {
	const id = ++requestId;
	await new Promise(resolve => setTimeout(resolve, 400));
	if (id === requestId) data.value = source.filter(row => row.label.includes(keyword));
};
</script>
<style scoped>
.tree-select-demo { display: grid; gap: 12px; max-width: 400px; }
.tree-select-demo p { margin: 0; }
</style>
```
:::

## API

下表用 `Value` 表示 `string | number`，`NodeData` 表示调用方的节点数据，`Node` 表示由 `getNode` 等方法返回的节点对象（包含 `states.data`、`getter`、`childNodes` 等）。这些名称仅用于说明，不是包入口导出的类型。

### Tree 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| data | 层级数据，每个节点值必须全树唯一 | `NodeData[]` | - | `[]` |
| modelValue | 勾选值，支持 `v-model`；建议使用数组 | `string \| number \| any[]` | - | `undefined` |
| keyValue | 节点字段映射，见下表；替代旧文档的 `treeProps` / `nodeKey` | `Record<string, string>` | - | 见下表 |
| emptyText | 空状态文案，支持空字符串覆盖 | `string` | - | 当前语言的“暂无数据” |
| showCheckbox | 显示复选框 | `boolean` | - | `false` |
| checkStrictly | 父子独立勾选 | `boolean` | - | `false` |
| checkDescendants | 懒加载时，深度勾选可触发未加载子节点的加载 | `boolean` | - | `false` |
| expandedValues | 要展开的节点值；更新时展开列出的节点，不自动收起其他节点 | `Value[]` | - | `[]` |
| defaultExpandAll | 默认展开已有子数据的节点 | `boolean` | - | `false` |
| autoExpandParent | 按 `expandedValues` 展开时同时展开祖先 | `boolean` | - | `true` |
| expandOnClickNode | 点击标签也展开 / 收起 | `boolean` | - | `true` |
| checkOnClickNode | 点击标签也切换勾选 | `boolean` | - | `false` |
| accordion | 同级节点互斥展开 | `boolean` | - | `false` |
| currentNodeValue | 初始化当前节点值；后续修改使用实例方法 | `Value` | - | `undefined` |
| highlightCurrent | 高亮当前节点 | `boolean` | - | `false` |
| renderNodeAfterExpand | 首次展开后才渲染子节点 | `boolean` | - | `true` |
| renderNodeLabel | 自定义标签，参数为 `{ row, store }` | `(props: { row: NodeData; store: Node }) => VNodeChild` | - | - |
| lazy | 开启子节点懒加载 | `boolean` | - | `false` |
| loadData | 懒加载回调，返回子数据 | `(node: Node) => Promise<NodeData[]>` | - | - |
| filterNode | `filter()` 的筛选回调 | `(value: any, data: NodeData, node: Node) => boolean` | - | - |
| indent | 每级缩进，单位 px | `number` | - | `18` |
| draggable | 开启节点拖拽 | `boolean` | - | `false` |
| allowDrag | 拖拽许可 | `({ node, data }) => boolean` | - | - |
| allowDrop | 落点许可，参数见“拖拽节点” | `({ node, data, targetNode, position, from, to }) => boolean` | - | - |
| separator | 字符串勾选值的分隔符 | `string` | - | `','` |
| numerable | 字符串输入值是否转为数字 | `boolean` | - | `false` |
| max | 非数组输入时，`1` 输出首个值，`> 1` 输出分隔符字符串；不限制勾选数 | `number` | `>= 1` | `Infinity` |
| nullValue | 已声明的兼容属性，当前转换逻辑不使用它替代空值 | `number \| string \| object` | - | `undefined` |
| iconClass | 已声明的兼容属性，当前渲染未使用 | `string` | - | - |
| allowDispatch | 交互改变值时通知 FormItem | `boolean` | - | `true` |

### Tree keyValue

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| value | 唯一节点值字段 | `string` | - | `'value'` |
| label | 标签字段 | `string` | - | `'label'` |
| children | 子节点数组字段 | `string` | - | `'children'` |
| disabled | 禁止交互勾选的字段 | `string` | - | `'disabled'` |
| isLeaf | 懒加载叶节点字段；建议保留默认字段名 | `string` | - | `'isLeaf'` |

传入映射时建议提供完整对象，例如 `{ value: 'id', label: 'name', children: 'children', disabled: 'disabled', isLeaf: 'isLeaf' }`。公开类型为字符串映射。

### Tree 事件

`checkedNodes`、`halfCheckedNodes` 是节点对象数组，原始数据从 `node.states.data` 读取。节点事件中的 `data` 则直接是原始数据。

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| update:modelValue / change | 交互导致勾选值变化 | `(value, summary)` | `summary` 包含 `checkedNodes`、`checkedValues`、`halfCheckedNodes`、`halfCheckedValues` |
| check | 用户切换勾选后 | `({ node, data, checked, checkedNodes, checkedValues, halfCheckedNodes, halfCheckedValues })` | 含本次节点和整棵树状态 |
| check-change | 节点勾选或半选状态变化 | `({ node, data, checked, indeterminate })` | 联动时可针对多个节点触发 |
| node-click | 点击节点 | `({ node, data, instance, event })` | `instance` 为节点组件实例，`event` 为原生事件 |
| node-contextmenu | 右键节点 | `({ node, data, instance, event })` | 注册监听时阻止原生右键菜单 |
| current-change | 点击切换当前节点 | `({ node, data, oldNode })` | `oldNode` 无前值时为 `null`；重复点击同节点不触发 |
| node-expand-change | 点击展开 / 收起 | `({ node, data, expanded, instance })` | `expanded` 为当前操作的展开状态 |
| node-dragstart | 开始拖拽 | `({ node, data, event })` | `node` / `data` 为被拖节点 |
| node-dragenter / node-dragleave / node-dragover | 进入 / 离开 / 经过目标 | `({ node, data, targetNode, event })` | `targetNode` 为目标节点 |
| node-drop | 成功移动节点 | `({ node, data, targetNode, position, from, to, event })` | `position` 为 `before` / `inner` / `after`；位置定义见“拖拽节点” |
| node-dragend | 拖拽结束 | `({ node, data, targetNode, position, dropped, event })` | `dropped` 表示是否移动；无落点时 `targetNode` / `position` 为 `null` |

### Tree 方法

通过组件 ref 调用。程序化勾选方法直接修改树状态，不主动发出 `update:modelValue` / `change`；需要同步外部值时优先修改 `v-model`，或读取 `getCheckedValues()` 后自行赋值。

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| filter | 筛选节点，必须配置 `filterNode` | `(value: any)` | `void` |
| getNode | 按值、原始数据或节点对象查找 | `(data: Value \| NodeData \| Node)` | `Node \| null` |
| getNodeKey | 读取节点的值字段 | `(node: Node)` | `Value` |
| getNodePath | 读取从根级到目标的原始数据路径 | `(data: Value \| NodeData \| Node)` | `NodeData[]`，找不到时为 `[]` |
| getCheckedNodes | 读取勾选节点，可只取叶节点或包含半选节点 | `(leafOnly = false, includeHalfChecked = false)` | `Node[]` |
| getCheckedValues | 读取勾选值 | `(leafOnly = false)` | `Value[]` |
| getHalfCheckedNodes | 读取半选节点 | - | `Node[]` |
| getHalfCheckedValues | 读取半选值 | - | `Value[]` |
| setCheckedNodes | 按原始数据数组设置勾选 | `(nodes: NodeData[], leafOnly = false)` | `void` |
| setCheckedValues | 按节点值设置勾选 | `(values: Value[])` | `void` |
| setChecked | 设置一个节点；`deep` 控制是否向下联动 | `(data: Value \| NodeData \| Node, checked: boolean, deep?: boolean)` | `void` |
| getCurrentNode | 读取当前节点原始数据 | - | `NodeData \| null` |
| getCurrentKey | 读取当前节点值 | - | `Value \| null` |
| setCurrentNode | 按已存在的原始节点数据设置当前节点 | `(data: NodeData)` | `void` |
| setCurrentNodeByData | 按值、数据或节点对象设置当前节点；有当前节点时传 `null` 可清除 | `(data: Value \| NodeData \| Node \| null)` | `void` |
| append | 添加子节点，省略父节点时添加到根级 | `(data: NodeData, parent?: Value \| NodeData \| Node)` | `void` |
| remove | 移除节点 | `(data: Value \| NodeData \| Node)` | `void` |
| insertBefore / insertAfter | 在参考节点前 / 后插入 | `(data: NodeData, reference: Value \| NodeData \| Node)` | `void` |
| updateKeyChildren | 替换指定节点的子数据 | `(value: Value, children: NodeData[])` | `void` |

### TreeSelect 属性

TreeSelect 使用固定的 `value` / `label` / `children` / `disabled` 数据字段，不透传 Tree 的全部属性。

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| modelValue | 选中的节点值，支持 `v-model` | `string \| number \| any[]` | - | `undefined` |
| data | 节点数据 | `NodeData[]` | - | `[]` |
| checkStrictly | 父子独立勾选 | `boolean` | - | `false` |
| renderNodeLabel | 自定义树节点 / 级联列标签；级联搜索结果使用路径文本 | `(props: { row: NodeData; store: Node }) => VNodeChild` | - | - |
| max | `> 1` 显示多选标签；影响非数组值输出形式，不限制勾选数 | `number` | `>= 1` | `Infinity` |
| maxTags | 最多显示的标签数，`0` 或不传表示不限 | `number` | `>= 0` | - |
| maxTagLines | 标签最多行数，`0` 表示不限 | `number` | `>= 0` | `1` |
| disabled | 禁用交互 | `boolean` | - | `false` |
| clearable | 悬停时显示清空按钮 | `boolean` | - | `false` |
| placeholder | 输入框占位文案（通过 attribute 传入），支持空字符串 | `string` | - | 当前语言的“请选择” |
| extra | 无选中标签时的输入框显示值 | `string` | - | `''` |
| searchable | 开启搜索 | `boolean` | - | `false` |
| searchPlaceholder | 搜索框占位文案 | `string` | - | `''` |
| loadData | 防抖搜索回调，需自行更新 `data` | `(keyword: string, instance: ComponentInternalInstance) => Promise<unknown>` | - | - |
| cascader | 使用级联列面板 | `boolean` | - | `false` |
| autoWidth | 面板按内容计算宽度 | `boolean` | - | 未指定时跟随 `cascader` |
| portal | 下拉挂到 body；`false` 挂在组件根节点内，可能被祖先 overflow 裁剪 | `boolean` | - | `true` |
| portalClass | 面板附加类名 | `string \| object \| any[]` | - | - |
| trigger | 面板触发方式，沿用 Popover | `string` | `click` / `hover` | `'click'` |
| placement | 面板位置，沿用 Popover | `string` | 见 Popover | `'bottom-left'` |
| arrow | 显示面板箭头 | `boolean` | - | `false` |
| tag | 触发器根元素 | `string` | - | `'div'` |
| id | 输入框 id | `string` | - | - |
| separator | 字符串值分隔符 | `string` | - | `','` |
| numerable | 字符串输入值转为数字 | `boolean` | - | `false` |
| nullValue | 兼容属性，当前空值转换不使用该替代值 | `number \| string \| object` | - | `undefined` |

继承声明的 `renderOption`、`renderOptionGroup`、`renderLabel`、`label` 当前不参与 TreeSelect 渲染；自定义节点内容请使用 `renderNodeLabel`。

### TreeSelect 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| update:modelValue / change | 勾选、移除标签或清空 | `(value, labels: string[])` | `labels` 是当前展示标签文本，联动模式为完整路径 |
| clear | 点击清空按钮 | - | 随后发出值变化事件 |
| visible-change | 面板可见性变化 | `(visible: boolean)` | 当前是否打开 |
| ready | 面板组件挂载 | - | 由 Popover 转发 |
| close | 面板关闭 | - | 由 Popover 转发 |

### TreeSelect 方法

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| close | 关闭面板 | - | `void` |
| toggle | 指定可见性或切换当前状态 | `(visible?: boolean)` | `void` |

TreeSelect 实例还暴露 `treeSelectId`、`isActive`、`multiple`、`current`、`currentValueGroups`、`searchRegex`。通常使用 `v-model` 和上面的方法即可。Tree 与 TreeSelect 都没有消费调用方插槽，标签定制使用 `renderNodeLabel`。

### 主题与语言

Tree 使用 `--vc-tree-*`，TreeSelect 使用 `--vc-tree-select-*` 组件覆盖变量，默认回退到共享亮暗主题。可分别覆盖 `background-color-selected`；Tree 还支持 `background-color-hover`、`foreground-color-drop`，TreeSelect 支持 `foreground-color-disabled`。拖入高亮文字默认保持白色，以配合主色背景。

内置文案使用 `vc.Tree.emptyText`、`vc.TreeSelect.placeholder`、`vc.TreeSelect.noMatch`；通过 `VcInstance.configure({ locale })` 切换语言。节点标签、自定义渲染和显式传入的文案由调用方管理。

更多交互细节可参考[节点事件示例](./examples/events.vue)、[拖拽示例](./examples/drag.vue)、[标签折叠示例](./examples/tree-select-tags.vue)与[挂载位置示例](./examples/tree-select-portal.vue)。
