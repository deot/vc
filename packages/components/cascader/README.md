## 级联选择器（Cascader）

逐级查看树形数据，并选择一条层级路径。

### 何时使用

适合省市区、组织层级或分类等具有明确父子关系的数据。每个节点使用 `value`、`label`，子节点放在 `children` 中。

### 基础用法

`trigger` 控制浮层的打开方式，默认点击打开；子列始终在鼠标移入选项时展开，点击叶子节点才提交完整路径。只展开父节点后关闭，不会提交临时路径。

示例在浮层打开时通过 `docs:playground` 增加预览高度，等待 `close`（关闭动画完成）后恢复。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<div class="trigger-demo">
		<div v-for="trigger in ['click', 'hover']" :key="trigger" class="trigger-demo__item">
			<p>{{ trigger === 'click' ? '点击打开浮层' : '悬停打开浮层' }}</p>
			<Cascader
				v-model="values[trigger]"
				:data="data"
				:trigger="trigger"
				@visible-change="isVisible => isVisible && handleVisibleChange(trigger, true)"
				@close="handleVisibleChange(trigger, false)"
			/>
			<p>已提交路径：{{ values[trigger] }}</p>
		</div>
	</div>
</template>

<script setup>
import { inject, reactive } from 'vue';
import { Cascader } from '@deot/vc';

const data = [
	{ value: 'group-a', label: '分组 A', children: [
		{ value: 'item-a-1', label: '条目 A-1' },
		{ value: 'item-a-2', label: '条目 A-2' }
	] },
	{ value: 'group-b', label: '分组 B', children: [
		{ value: 'item-b-1', label: '条目 B-1' },
		{ value: 'item-b-2', label: '条目 B-2' }
	] }
];
const values = reactive({ click: [], hover: [] });
const playground = inject('docs:playground');
const isVisibleByTrigger = {};
const handlePreview = playground.run(360);
const handleVisibleChange = (trigger, isVisible) => {
	isVisibleByTrigger[trigger] = isVisible;
	return handlePreview(Object.values(isVisibleByTrigger).some(Boolean));
};
</script>
<style scoped>
.trigger-demo {
	display: flex;
	flex-wrap: wrap;
	gap: 20px;
}
.trigger-demo__item {
	display: grid;
	gap: 12px;
	width: 280px;
	max-width: 100%;
}
p {
	margin: 0;
	line-height: 1.6;
	overflow-wrap: anywhere;
}
</style>
```
:::

### 默认值、清空与禁用

用数组保存完整路径。`clearable` 默认关闭，启用后鼠标移入输入框显示清除按钮；清空也触发 `change`。`disabled` 阻止打开和清空。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<div class="cascader-demo">
		<Cascader
			v-model="value"
			:data="data"
			:disabled="isDisabled"
			clearable
			@visible-change="isVisible => isVisible && handleVisibleChange(true)"
			@close="handleVisibleChange(false)"
		/>
		<label><input v-model="isDisabled" type="checkbox"> 禁用选择器</label>
		<p>当前路径：{{ value }}</p>
	</div>
</template>

<script setup>
import { inject, ref } from 'vue';
import { Cascader } from '@deot/vc';

const data = [
	{ value: 'group-a', label: '分组 A', children: [
		{ value: 'item-a-1', label: '条目 A-1' },
		{ value: 'item-a-2', label: '条目 A-2' }
	] },
	{ value: 'group-b', label: '分组 B', children: [
		{ value: 'item-b-1', label: '条目 B-1' },
		{ value: 'item-b-2', label: '条目 B-2' }
	] }
];
const value = ref(['group-a', 'item-a-1']);
const isDisabled = ref(false);
const playground = inject('docs:playground');
const handleVisibleChange = playground.run(320);
</script>

<style scoped>
.cascader-demo {
	display: grid;
	gap: 12px;
	max-width: 320px;
}
p {
	margin: 0;
	line-height: 1.6;
	overflow-wrap: anywhere;
}
</style>
```
:::

### 自定义显示

`formatter` 接收路径上的文本数组，默认使用 ` / ` 连接。返回空值时显示 `extra`；`extra` 是输入框内容，`placeholder` 是内容为空时的占位提示。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<div class="cascader-demo">
		<Cascader
			v-model="value"
			:data="data"
			:formatter="formatter"
			placeholder="选择条目"
			clearable
			@visible-change="isVisible => isVisible && handleVisibleChange(true)"
			@close="handleVisibleChange(false)"
		/>
		<p>只显示最后一级文本，提交值仍是完整路径：{{ value }}</p>
	</div>
</template>

<script setup>
import { inject, ref } from 'vue';
import { Cascader } from '@deot/vc';

const data = [
	{ value: 'group-a', label: '分组 A', children: [
		{ value: 'item-a-1', label: '条目 A-1' },
		{ value: 'item-a-2', label: '条目 A-2' }
	] },
	{ value: 'group-b', label: '分组 B', children: [
		{ value: 'item-b-1', label: '条目 B-1' },
		{ value: 'item-b-2', label: '条目 B-2' }
	] }
];
const value = ref(['group-b', 'item-b-2']);
const formatter = labels => labels[labels.length - 1];
const playground = inject('docs:playground');
const handleVisibleChange = playground.run(320);
</script>

<style scoped>
.cascader-demo {
	display: grid;
	gap: 12px;
	max-width: 320px;
}
p {
	margin: 0;
	line-height: 1.6;
	overflow-wrap: anywhere;
}
</style>
```
:::

### 选择任意一级

开启 `changeOnSelect` 后，点击任意一级都会提交当前路径并关闭浮层。鼠标移入仍只展开或高亮，不会触发 `change`。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<div class="cascader-demo">
		<Cascader
			v-model="value"
			:data="data"
			change-on-select
			@visible-change="isVisible => isVisible && handleVisibleChange(true)"
			@close="handleVisibleChange(false)"
			@change="handleChange"
		/>
		<p>已提交路径：{{ value }}</p>
		<p>已提交文本：{{ labels.join(' / ') || '尚未选择' }}</p>
	</div>
</template>

<script setup>
import { inject, ref } from 'vue';
import { Cascader } from '@deot/vc';

const data = [
	{ value: 'group-a', label: '分组 A', children: [
		{ value: 'item-a-1', label: '条目 A-1' },
		{ value: 'item-a-2', label: '条目 A-2' }
	] },
	{ value: 'group-b', label: '分组 B', children: [
		{ value: 'item-b-1', label: '条目 B-1' },
		{ value: 'item-b-2', label: '条目 B-2' }
	] }
];
const value = ref([]);
const labels = ref([]);
const handleChange = (nextValue, nextLabels) => {
	labels.value = nextLabels;
};
const playground = inject('docs:playground');
const handleVisibleChange = playground.run(320);
</script>

<style scoped>
.cascader-demo {
	display: grid;
	gap: 12px;
	max-width: 320px;
}
p {
	margin: 0;
	line-height: 1.6;
	overflow-wrap: anywhere;
}
</style>
```
:::

### 异步加载子节点

给待加载节点设置 `children: []`，并传入 `loadData`。鼠标移入该节点时显示加载状态，回调不接收参数，返回子节点数组（或解析为数组的 Promise）。组件会将返回结果插入原节点的 `children`，所以数据源需允许修改；已加载的非空子节点不会重复请求。

示例只设置一个待加载父节点，使用本地延时模拟加载。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<div class="cascader-demo">
		<Cascader
			v-model="value"
			:data="data"
			:load-data="loadData"
			@visible-change="isVisible => isVisible && handleVisibleChange(true)"
			@close="handleVisibleChange(false)"
		/>
		<p>加载次数：{{ loadCount }}；当前路径：{{ value }}</p>
		<p>打开后将鼠标移到“分组 A”，等待子节点出现再选择。</p>
	</div>
</template>

<script setup>
import { inject, ref } from 'vue';
import { Cascader } from '@deot/vc';

const value = ref([]);
const data = ref([{ value: 'group-a', label: '分组 A', children: [] }]);
const loadCount = ref(0);
const loadData = () => {
	loadCount.value++;
	return new Promise(resolve => setTimeout(() => resolve([
		{ value: 'item-a-1', label: '条目 A-1' },
		{ value: 'item-a-2', label: '条目 A-2' }
	]), 600));
};
const playground = inject('docs:playground');
const handleVisibleChange = playground.run(320);
</script>

<style scoped>
.cascader-demo {
	display: grid;
	gap: 12px;
	max-width: 320px;
}
p {
	margin: 0;
	line-height: 1.6;
	overflow-wrap: anywhere;
}
</style>
```
:::

### 自定义触发区

默认插槽替换整个输入框，可读取 `label`、`value`、`active`。默认模式下，`value` 包含正在浏览的临时路径，`label` 对应已提交路径；以外部 `v-model` 判断提交结果。替换输入框后，内置清除按钮也随之移除。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<div class="cascader-demo">
		<Cascader
			v-model="value"
			:data="data"
			@visible-change="isVisible => isVisible && handleVisibleChange(true)"
			@close="handleVisibleChange(false)"
		>
			<template #default="{ label, active }">
				<Button>{{ label.join(' / ') || '选择条目' }}{{ active ? '（展开中）' : '' }}</Button>
			</template>
		</Cascader>
		<p>已提交路径：{{ value }}</p>
	</div>
</template>

<script setup>
import { inject, ref } from 'vue';
import { Cascader, Button } from '@deot/vc';

const data = [
	{ value: 'group-a', label: '分组 A', children: [
		{ value: 'item-a-1', label: '条目 A-1' },
		{ value: 'item-a-2', label: '条目 A-2' }
	] },
	{ value: 'group-b', label: '分组 B', children: [
		{ value: 'item-b-1', label: '条目 B-1' },
		{ value: 'item-b-2', label: '条目 B-2' }
	] }
];
const value = ref([]);
const playground = inject('docs:playground');
const handleVisibleChange = playground.run(320);
</script>

<style scoped>
.cascader-demo {
	display: grid;
	gap: 12px;
	max-width: 320px;
}
p {
	margin: 0;
	line-height: 1.6;
	overflow-wrap: anywhere;
}
</style>
```
:::

### 浮层挂载位置

`portal` 默认将浮层挂到 `body`；`false` 将其挂到组件根节点内，会受祖先 `overflow` 裁剪。取消勾选后可观察局部滚动容器中的裁剪效果。更多滚动场景见 [完整示例](./examples/portal.vue)。

:::playground
<!-- <config lang="json5">{ previewInset: 16, viewport: 375 }</config> -->
```vue
<template>
	<div class="cascader-demo">
		<label><input v-model="isPortal" type="checkbox"> 挂载到 body（切换前关闭浮层）</label>
		<div class="scroll-area">
			<div class="scroll-content">
				<Cascader
					v-model="value"
					:data="data"
					:portal="isPortal"
					@visible-change="isVisible => isVisible && handleVisibleChange(true)"
					@close="handleVisibleChange(false)"
				/>
			</div>
		</div>
		<p>当前路径：{{ value }}</p>
	</div>
</template>

<script setup>
import { inject, ref } from 'vue';
import { Cascader } from '@deot/vc';

const data = [
	{ value: 'group-a', label: '分组 A', children: [
		{ value: 'item-a-1', label: '条目 A-1' },
		{ value: 'item-a-2', label: '条目 A-2' }
	] },
	{ value: 'group-b', label: '分组 B', children: [
		{ value: 'item-b-1', label: '条目 B-1' },
		{ value: 'item-b-2', label: '条目 B-2' }
	] }
];
const value = ref([]);
const isPortal = ref(true);
const playground = inject('docs:playground');
const handleVisibleChange = playground.run(420);
</script>

<style scoped>
.cascader-demo {
	display: grid;
	gap: 12px;
	max-width: 320px;
}
p {
	margin: 0;
	line-height: 1.6;
	overflow-wrap: anywhere;
}
</style>
<style scoped>
.scroll-area {
	height: 160px;
	overflow: auto;
	border: 1px solid var(--vc-color-light-deeper);
}
.scroll-content {
	height: 400px;
	padding: 24px 12px;
}
</style>
```
:::

## 主题与局部覆盖

全局参数通过 `--vc-<参数>` 配置，组件级覆盖使用 `--vc-cascader-column-<参数>`、`--vc-cascader-<参数>`。局部参数仅提供组件级入口；表中括号标明对应命名空间。

内嵌或复用的 [spin](../spin/README.md#主题与局部覆盖)、[input](../input/README.md#主题与局部覆盖)、[popover](../popover/README.md#主题与局部覆盖) 使用各自的主题入口。

### 全局

| 参数 | 使用位置 | 值 |
| --- | --- | --- |
| color-dark-lighter | 级联选项文字（cascader-column） | 亮色：`#515151`；暗色：`#D9D9D9` |
| color-dark-extralight | 输入区附加图标（cascader） | 亮色：`#909399`；暗色：`#B9B9B9` |
| color-neutral-light | 级联列分隔线（cascader-column） | 亮色：`#EDEFF1`；暗色：`#3B4354` |
| color-primary | 选中选项文字（cascader-column） | `#456CF6` |
| background-color-primary-light | 选项悬停及当前浏览选项背景（cascader-column） | 亮色：`#E6F7FF`；暗色：`#273E5E` |

### 局部

当前组件没有额外的局部 CSS 主题参数。

## API

### 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| data | 树形数据；节点包含 `value`、`label`、可选 `children` | `CascaderOption[]` | - | `[]` |
| modelValue | 选择路径，推荐用数组；也接收标量或由 `separator` 分隔的字符串 | `string \| number \| (string \| number)[]` | - | `undefined` |
| formatter | 根据路径文本生成输入框内容 | `(labels: string[]) => string` | - | `labels => labels.join(' / ')` |
| changeOnSelect | 点击任意一级即提交并关闭；否则只提交叶子节点 | `boolean` | - | `false` |
| disabled | 禁止打开和清空 | `boolean` | - | `false` |
| clearable | 移入输入框时显示清除按钮 | `boolean` | - | `false` |
| placeholder | 透传给默认输入框的占位文本，支持显式空字符串覆盖 | `string` | - | 当前语言的 `vc.Cascader.placeholder`，中文为 `请选择` |
| extra | `formatter` 返回空值时展示的输入框内容 | `string` | - | `''` |
| id | 默认 Input 根节点的 id，替换触发区后不使用 | `string` | - | - |
| loadData | 为 `children: []` 的节点加载子节点；不接收参数，会修改原数据 | `() => CascaderOption[] \| Promise<CascaderOption[]>` | - | - |
| trigger | 浮层打开方式；子列始终由鼠标移入展开 | `string` | `click`、`hover`、`strictHover`、`focus`、`custom` | `click` |
| tag | 触发区根元素类型；`focus` 时需让根元素可聚焦 | `string` | - | `div` |
| placement | 浮层位置 | `string` | `top`、`top-left`、`top-right`、`bottom`、`bottom-left`、`bottom-right`、`left`、`left-top`、`left-bottom`、`right`、`right-top`、`right-bottom` | `bottom-left` |
| arrow | 显示浮层箭头 | `boolean` | - | `false` |
| autoWidth | 浮层根据内容宽度布局；`false` 时使用触发区宽度 | `boolean` | - | `true` |
| portal | 将浮层挂到 body；`false` 时挂到组件根节点内 | `boolean` | - | `true` |
| portalClass | 浮层附加 class | `string \| object \| unknown[]` | - | - |
| separator | 字符串路径解析时的分隔符 | `string` | - | `','` |
| numerable | 将字符串路径中的每项转为数字 | `boolean` | - | `false` |
| max | 继承的值转换参数：非数组 modelValue 且 `max > 1` 时将路径连接为字符串；不提供多选能力 | `number` | `>= 1` | `1` |

### 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| update:modelValue | 提交选择或清空，用于 `v-model` | `(value, labels)` | 数组输入返回路径数组；非数组输入按值转换规则返回标量或字符串。`labels` 为路径文本数组 |
| change | 与 `update:modelValue` 同时触发，包括清空 | `(value, labels)` | 同上；清空数组路径时为 `([], [])` |
| visible-change | 通过浮层触发器或外部点击改变可见状态时触发 | `(isVisible: boolean)` | 当前可见状态；选择或清空引起的内部关闭不触发此事件 |
| ready | 浮层初始化完成 | `()` | 不等于打开动画完成 |
| close | 关闭动画完成后触发，未提交的临时路径恢复为 modelValue | `()` | 选择、清空或外部点击关闭均可触发 |

### 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 替换整个默认输入框和清除按钮 | `{ label: string[], value: (string \| number)[], active: boolean }`；`value` 为当前浏览路径，`active` 为展开状态 |

### 数据格式与值转换

以下类型用于说明节点结构，无需导入。节点级的 `disabled`、自定义 `loading` 或 `hasChildren` 不控制当前列行为；展开和加载状态由 `children` 与 `loadData` 推导。

```ts
interface CascaderOption {
	value: string | number;
	label: string;
	children?: CascaderOption[];
}
```

数组形式的 `modelValue` 会保存完整路径，并在清空时返回 `[]`。字符串输入先按 `separator` 解析；非数组输入在默认 `max: 1` 下只输出路径首项，`max > 1` 时按 `separator` 连接。`numerable` 配合字符串输入时，当前实现输出由逗号连接的数字路径；需要稳定的完整路径时使用数组。

组件虽然继承了 Select 的一些声明，但没有搜索、多选、`renderOption` 等对应渲染能力；没有独立 `clear` 事件、公开实例方法或 `readonly` 开关，默认输入框本身始终只读。

### 移动端

`MCascader` 是 `Cascader` 的别名，使用相同的 props、事件和样式。当前没有独立移动端滚轮面板、`header` 属性或公开 `CascaderView`；子列交互仍依赖鼠标移入。

### 主题

输入框和浮层分别使用 Input、Popover 的主题。Cascader 的箭头/清除图标可通过 `--vc-cascader-color-dark-extralight` 覆盖；列样式支持以下组件变量，并回退到同名全局变量：

| 变量 | 用途 |
| --- | --- |
| `--vc-cascader-column-color-dark-lighter` | 选项文本 |
| `--vc-cascader-column-color-neutral-light` | 列分隔线 |
| `--vc-cascader-column-color-primary` | 当前浏览选项的文本 |
| `--vc-cascader-column-background-color-primary-light` | 选项悬停及当前浏览选项的背景 |

`portal: true` 时浮层位于 body 下，列变量需设置在浮层祖先（例如 body）或通过 `portalClass` 对浮层设置。
