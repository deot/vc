## 可回收列表（RecycleList）

只渲染视口附近节点的高性能列表，支持动态尺寸、瀑布流、横向列表、倒置列表和异步加载。

移动端入口导出的 `MRecycleList` 与 `RecycleList` 的属性、事件、插槽、方法相同，数字 `gap`、`estimateSize` 按 750 稿缩放，见 [移动端](#移动端)。

### 何时使用

- 优化大数据量滚动列表。
- 实现动态高度/宽度列表或瀑布流。
- 实现从尾部开始展示的倒置列表。
- 在页面或已有 Scroller 中虚拟化一段流式内容。

### 滚动承载模式

`fill` 只改变虚拟化主轴的滚动承载者，其他属性、加载流程、事件和公开方法保持原有语义。

| 配置 | 主轴滚动源 | 交叉轴 |
| --- | --- | --- |
| `fill=true` | RecycleList 内部 Scroller | RecycleList 内部 Scroller |
| `fill=false` | 最近的外部 VC Scroller/原生滚动祖先，找不到时使用 Window | RecycleList 内部 Scroller |

- `vertical=true` 时主轴为 Y、交叉轴为 X；`vertical=false` 时主轴为 X、交叉轴为 Y。
- 默认 `fill=true`，需要一个具有确定主轴尺寸的父容器。
- `fill=false` 时列表沿主轴随虚拟内容展开，不需要给列表设置固定主轴尺寸。主轴 wheel/touch 交给外部容器，交叉轴仍由内部 Scroller 处理。
- 动态切换 `fill` 会重新绑定滚动源并刷新布局，不会改变其他 prop 的语义。

### 基础用法

`loadData({ page, loaded })` 分页加载，示例共三页，每页 20 项；距离末尾小于 `threshold` 时继续加载。`pullable` 时在起点下拉可重新加载，`renderRefresh`、`renderLoading`、`renderComplete` 定制提示条、加载中与完成状态；`scroll` 事件返回滚动位置，行高由实际内容测量。

:::playground
<!--
<config lang="json5">
{
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="recycle-list-demo">
		<RecycleList
			class="recycle-list-demo__list"
			:load-data="loadData"
			:threshold="200"
			pullable
			:render-refresh="renderRefresh"
			:render-loading="renderLoading"
			:render-complete="renderComplete"
			@scroll="handleScroll"
		>
			<template #default="{ row }">
				<div class="recycle-list-demo__item" :style="{ minHeight: `${row.height}px` }">
					第 {{ row.id + 1 }} 项 · 第 {{ row.page }} 页
				</div>
			</template>
		</RecycleList>
		<p class="recycle-list-demo__result">距顶部 {{ scrollTop }} px</p>
	</div>
</template>

<script setup>
import { h, ref } from 'vue';
import { RecycleList } from '@deot/vc';

const REFRESH_TEXTS = { 2: '下拉刷新', 3: '松开刷新', 4: '刷新中…' };

const scrollTop = ref(0);

const loadData = ({ page, loaded }) => new Promise((resolve) => {
	setTimeout(() => {
		const data = Array.from({ length: 20 }, (_, index) => ({
			id: loaded + index,
			page,
			height: 40 + (index % 3) * 20
		}));
		resolve({ data, finished: page >= 3 });
	}, 400);
});

const renderRefresh = ({ status }) => REFRESH_TEXTS[status] || '';
const renderLoading = () => h('div', { class: 'recycle-list-demo__state' }, '正在加载下一页…');
const renderComplete = () => h('div', { class: 'recycle-list-demo__state' }, '已全部加载');

const handleScroll = (event) => {
	scrollTop.value = Math.round(event.target.scrollTop);
};
</script>

<style scoped>
.recycle-list-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.recycle-list-demo__list {
	height: 280px;
}

.recycle-list-demo__item {
	padding: 12px;
	border-bottom: 1px solid var(--vc-color-light-deeper);
	box-sizing: border-box;
}

.recycle-list-demo :deep(.recycle-list-demo__state) {
	padding: 12px;
	text-align: center;
	color: var(--vc-color-dark-lightest);
}

.recycle-list-demo__result {
	margin: 0;
}
</style>
```
:::

### 本地数据、动态行高与定位

使用 `data + disabled` 只构建本地数据；`scrollToIndex` 只能定位已构建的条目，示例中的第 10 项在首批 20 项内，`align: 'center'` 让它居中。行尺寸变化时触发 `row-resize`；`refreshLayout()` 重新测量全部已构建的行。

:::playground
<!--
<config lang="json5">
{
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="recycle-list-demo">
		<div class="recycle-list-demo__row">
			<Button @click="handlePrepend">头部插入</Button>
			<Button @click="handleRemove">删除首项</Button>
			<Button @click="handleLocate">居中定位第 10 项</Button>
			<Button @click="handleTop">回到顶部</Button>
			<Button @click="handleRefresh">refreshLayout()</Button>
		</div>
		<p class="recycle-list-demo__result">共 {{ data.length }} 项，row-resize 触发 {{ resizeCount }} 次；点击行内按钮改变高度，列表会自动校正。</p>
		<RecycleList
			ref="listRef"
			class="recycle-list-demo__list"
			:data="data"
			disabled
			@row-resize="handleRowResize"
		>
			<template #default="{ row, index }">
				<div class="recycle-list-demo__item">
					<Button size="small" @click="handleExpand(row)">{{ row.isExpanded ? '收起' : '展开' }} {{ row.name }}</Button>
					<p v-if="row.isExpanded" class="recycle-list-demo__text">当前索引：{{ index }}。额外内容会参与真实高度测量，无需手动刷新布局。</p>
				</div>
			</template>
		</RecycleList>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, RecycleList } from '@deot/vc';

const listRef = ref();
const resizeCount = ref(0);
const data = ref(Array.from({ length: 100 }, (_, id) => ({ id, name: `条目 ${id + 1}`, isExpanded: false })));
let nextId = 100;

const handlePrepend = () => {
	data.value = [{ id: nextId++, name: '新插入的条目', isExpanded: false }, ...data.value];
};

const handleRemove = () => {
	data.value = data.value.slice(1);
};

const handleExpand = (row) => {
	row.isExpanded = !row.isExpanded;
};

const handleLocate = () => {
	listRef.value?.scrollToIndex(9, { align: 'center' });
};

const handleTop = () => {
	listRef.value?.scrollTo(0);
};

const handleRefresh = () => {
	listRef.value?.refreshLayout();
};

const handleRowResize = () => {
	resizeCount.value++;
};
</script>

<style scoped>
.recycle-list-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.recycle-list-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}

.recycle-list-demo__result,
.recycle-list-demo__text {
	margin: 0;
}

.recycle-list-demo__list {
	height: 280px;
}

.recycle-list-demo__item {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 8px;
	padding: 12px;
	border-bottom: 1px solid var(--vc-color-light-deeper);
	box-sizing: border-box;
}
</style>
```
:::

### 预估尺寸

默认每一项都要先在隐藏池里完整渲染一次、量出尺寸才能排版，所以本地数据按 `batchCount` 分批构建，滚到已构建内容的末尾才构建下一批。尺寸事先可知（如固定行高）时传入 `estimateSize`：这些项跳过隐藏池，数据一次构建全部，滚动条从一开始就是完整长度；项渲染出来后仍按实际尺寸校正。

下例 1000 项中除每第 10 项外都给出 48px 的预估尺寸，因此可以直接定位到第 800 项。`batchCount` 为每批构建 / 测量的数量，`bufferCount` 在可见范围前后多渲染的节点数，`overscan` 为视口外额外预渲染的距离（px）；`scrollerOptions` 传给内部 Scroller，这里改为滚轮驱动，`overscan` 可以调小。

:::playground
<!--
<config lang="json5">
{
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="recycle-list-demo">
		<div class="recycle-list-demo__row">
			<Button @click="handleLocate">定位第 800 项</Button>
		</div>
		<RecycleList
			ref="listRef"
			class="recycle-list-demo__list"
			:data="data"
			:estimate-size="estimateSize"
			:batch-count="40"
			:buffer-count="4"
			:overscan="120"
			:scroller-options="{ native: false, always: true, wheel: true }"
			disabled
		>
			<template #default="{ row }">
				<div class="recycle-list-demo__item">
					{{ row.name }}
					<template v-if="row.isLong">（这一项没有预估尺寸，按实际内容测量）</template>
				</div>
			</template>
		</RecycleList>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, RecycleList } from '@deot/vc';

const listRef = ref();
const data = Array.from({ length: 1000 }, (_, id) => ({ id, name: `条目 ${id + 1}`, isLong: id % 10 === 0 }));

// 固定 48px 的行给出预估尺寸；返回 undefined 的项照常测量
const estimateSize = ({ row }) => (row.isLong ? undefined : 48);

const handleLocate = () => {
	listRef.value?.scrollToIndex(799);
};
</script>

<style scoped>
.recycle-list-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.recycle-list-demo__row {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}

.recycle-list-demo__list {
	height: 280px;
}

.recycle-list-demo__item {
	min-height: 48px;
	padding: 13px 12px;
	border-bottom: 1px solid var(--vc-color-light-deeper);
	box-sizing: border-box;
}
</style>
```
:::

### 测量时跳过副作用

没有预估尺寸的项会先在隐藏的测量池里渲染一遍来量尺寸，再在列表里渲染展示的那一份。项内组件有挂载即触发的副作用（发请求、登记等）时，用 [useMeasuring()](../measuring) 判断自己是否在测量池里，跳过与尺寸无关的工作；`Image`、`Text` 已内置这一处理。

```ts
import { useMeasuring } from '@deot/vc';

const measuring = useMeasuring();
onMounted(() => {
	if (measuring) return;
	fetchDetail();
});
```

### 多列瀑布流

`columns` 决定列数，`gap` 决定列间距；卡片自身的下边距负责纵向间隔。

:::playground
<!--
<config lang="json5">
{
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="recycle-list-demo">
		<div class="recycle-list-demo__row">
			<Button @click="handleColumns">切换为 {{ columns === 2 ? 3 : 2 }} 列</Button>
		</div>
		<RecycleList
			class="recycle-list-demo__list"
			:data="data"
			:columns="columns"
			:gap="12"
			disabled
		>
			<template #default="{ row }">
				<article class="recycle-list-demo__card" :style="{ minHeight: `${row.height}px` }">
					<strong>卡片 {{ row.id + 1 }}</strong>
					<p class="recycle-list-demo__text">{{ row.height }}px · 不同高度自动分配到各列</p>
				</article>
			</template>
		</RecycleList>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, RecycleList } from '@deot/vc';

const columns = ref(2);
const data = Array.from({ length: 60 }, (_, id) => ({ id, height: 100 + id % 4 * 30 }));

const handleColumns = () => {
	columns.value = columns.value === 2 ? 3 : 2;
};
</script>

<style scoped>
.recycle-list-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.recycle-list-demo__row {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}

.recycle-list-demo__list {
	height: 280px;
}

/* 卡片的下边距负责纵向间隔，属于被测量的行尺寸 */
.recycle-list-demo__card {
	padding: 12px;
	margin-bottom: 12px;
	border: 1px solid var(--vc-color-light-deeper);
	border-radius: 8px;
	box-sizing: border-box;
	overflow-wrap: anywhere;
}

.recycle-list-demo__text {
	margin: 8px 0 0;
}
</style>
```
:::

### 骨架屏与空状态

提供 `placeholder` 插槽时，等待请求期间使用占位节点替代加载提示；`empty`、`complete` 插槽替换空状态与完成状态，`reset()` 清空并重新加载。重置按钮可重复观察首屏加载、完成与空数据三种状态。

:::playground
<!--
<config lang="json5">
{
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="recycle-list-demo">
		<div class="recycle-list-demo__row">
			<Button @click="handleReload">重新加载</Button>
			<Button @click="handleEmpty">查看空状态</Button>
		</div>
		<RecycleList ref="listRef" class="recycle-list-demo__list" :load-data="loadData" :batch-count="6">
			<template #default="{ row }">
				<div class="recycle-list-demo__item">{{ row.name }}</div>
			</template>
			<template #placeholder>
				<div class="recycle-list-demo__skeleton">正在准备条目…</div>
			</template>
			<template #empty>
				<p class="recycle-list-demo__text">没有匹配记录，点击“重新加载”恢复。</p>
			</template>
			<template #complete>
				<p class="recycle-list-demo__text">全部 12 条记录已加载</p>
			</template>
		</RecycleList>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, RecycleList } from '@deot/vc';

const listRef = ref();
const isEmpty = ref(false);

const loadData = async ({ page, loaded }) => {
	await new Promise(resolve => setTimeout(resolve, 600));
	return {
		data: isEmpty.value ? [] : Array.from({ length: 6 }, (_, index) => ({ name: `条目 ${loaded + index + 1}` })),
		finished: isEmpty.value || page >= 2
	};
};

const handleReload = () => {
	isEmpty.value = false;
	listRef.value?.reset();
};

const handleEmpty = () => {
	isEmpty.value = true;
	listRef.value?.reset();
};
</script>

<style scoped>
.recycle-list-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.recycle-list-demo__row {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}

.recycle-list-demo__list {
	height: 280px;
}

.recycle-list-demo__item {
	height: 56px;
	padding: 12px;
	border-bottom: 1px solid var(--vc-color-light-deeper);
	box-sizing: border-box;
}

/* 占位节点的外边距属于被测量的行尺寸 */
.recycle-list-demo__skeleton {
	height: 56px;
	padding: 16px;
	margin: 4px 0;
	color: var(--vc-color-dark-lightest);
	background: var(--vc-color-light-deep);
	border-radius: 6px;
	box-sizing: border-box;
}

.recycle-list-demo__text {
	margin: 0;
	padding: 12px 0;
	line-height: 1.6;
}
</style>
```
:::

### 外部视口与前、中、后内容

设置 `fill=false` 后，RecycleList 可以位于正常文档流的中间：

```text
Window / Scroller
├── 其他头部内容
├── RecycleList（fill=false）
└── 其他尾部内容
```

下面由外部 `Scroller` 承载主轴滚动，可以比较“定位条目”和“回到外部顶部”的坐标差异；`refreshViewport()` 只刷新几何与已渲染的行。

:::playground
<!--
<config lang="json5">
{
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="recycle-list-demo">
		<div class="recycle-list-demo__row">
			<Button @click="handleLocate">定位列表第 10 项</Button>
			<Button @click="handleTop">回到外部容器顶部</Button>
			<Button @click="handleViewport">refreshViewport()</Button>
		</div>
		<Scroller :height="300" native>
			<section class="recycle-list-demo__banner">外部前置内容：这一段不计入列表索引</section>
			<RecycleList ref="listRef" :fill="false" :data="data" disabled>
				<template #default="{ row }">
					<div class="recycle-list-demo__item">{{ row.name }}</div>
				</template>
			</RecycleList>
			<section class="recycle-list-demo__banner">外部后置内容：和列表共用同一个滚动条</section>
		</Scroller>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, RecycleList, Scroller } from '@deot/vc';

const listRef = ref();
const data = Array.from({ length: 40 }, (_, id) => ({ name: `条目 ${id + 1}` }));

const handleLocate = () => {
	listRef.value?.scrollToIndex(9);
};

const handleTop = () => {
	listRef.value?.scrollTo(0);
};

const handleViewport = () => {
	listRef.value?.refreshViewport();
};
</script>

<style scoped>
.recycle-list-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.recycle-list-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}

.recycle-list-demo__banner {
	padding: 32px 12px;
	background: var(--vc-color-light-deep);
}

.recycle-list-demo__item {
	min-height: 48px;
	padding: 12px;
	border-bottom: 1px solid var(--vc-color-light-deeper);
	box-sizing: border-box;
}
</style>
```
:::

- 前置内容只改变列表在外部容器中的绝对位置，不计入 item position。
- 可见范围由外部 viewport 与列表内容区的相对位置计算。外部 viewport 尚在头部或已经进入尾部时，不会因为外部容器滚动而触发无关批次。
- 后置内容不计入列表尾部边界；接近 RecycleList 自身尾部时就会加载下一批，不必等待外部 Footer 滚动结束。
- 虚拟占位尺寸参与正常文档流，数据增加时会自然把后置内容向后推。
- 挂载、列表由隐藏变为可见以及 `fill`/方向变化会自动重新测量；列表自身交叉轴尺寸变化（如变宽）时只重测正在渲染的行，其余行沿用原尺寸、渲染出来时再校正；单行内容变化只校正该行，已渲染的其它行保持不动；外部 viewport 尺寸变化只刷新可见范围，不重新测量节点（节点尺寸只取决于列表自身的交叉轴）。列表之前的内容变高或变矮（展开筛选区、图片加载等）会自动跟随：外部容器每次滚动都按列表当前的位置计算可见范围；不滚动时，列表到外部容器之间任一层祖先的尺寸变化也会触发重算。只有不改变任何一层祖先尺寸的位移（`transform`、祖先定高，或列表与前置内容都直接放在原生滚动容器下）要到下一次滚动才跟上，需要立即生效时调用 `refreshViewport()`，它只刷新几何与已渲染的行。
- 首次加载、本地数据分批构建、underfill、placeholder/loading/complete/empty 和 `disabled` 的行为与内部模式一致。

### Window 作为滚动源

没有滚动祖先时，`fill=false` 使用 Window。此示例在独立页面（iframe）中预览，滚动的是预览页的 Window，不影响文档页面。

:::playground
<!--
<config lang="json5">
{
	mobile: true,
	local: false
}
</config>
-->
```vue
<template>
	<div class="recycle-list-demo">
		<header class="recycle-list-demo__banner">页面头部 · 在预览内滚动整个页面</header>
		<RecycleList :fill="false" :data="data" disabled>
			<template #default="{ row }">
				<div class="recycle-list-demo__item">页面条目 {{ row.id + 1 }}</div>
			</template>
		</RecycleList>
		<footer class="recycle-list-demo__banner">页面尾部 · 所有本地数据构建完成后可滚动至此</footer>
	</div>
</template>

<script setup>
import { RecycleList } from '@deot/vc';

const data = Array.from({ length: 30 }, (_, id) => ({ id }));
</script>

<style scoped>
.recycle-list-demo__item {
	min-height: 56px;
	padding: 16px;
	border-bottom: 1px solid var(--vc-color-light-deeper);
	box-sizing: border-box;
}

.recycle-list-demo__banner {
	padding: 32px 16px;
	background: var(--vc-color-light-deep);
}
</style>
```
:::

### 横向列表与外部容器

横向条目需提供可测量的宽度。外部模式让列表与前后内容排成一条横向轨道；切换按钮重新挂载示例，以便从起点比较两种承载方式。

:::playground
<!--
<config lang="json5">
{
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="recycle-list-demo">
		<div class="recycle-list-demo__row">
			<Button @click="handleMode">{{ isExternal ? '改用内部滚动' : '改用外部滚动' }}</Button>
		</div>
		<p class="recycle-list-demo__result">向右滚动，或按住 Shift 使用滚轮。当前：{{ isExternal ? '外部原生容器' : '列表内部 Scroller' }}。</p>
		<div class="recycle-list-demo__carrier">
			<div :class="{ 'recycle-list-demo__track': isExternal }">
				<div v-if="isExternal" class="recycle-list-demo__edge">前置内容</div>
				<RecycleList
					:key="isExternal"
					class="recycle-list-demo__horizontal"
					:fill="!isExternal"
					:vertical="false"
					:data="data"
					disabled
				>
					<template #default="{ row }">
						<div class="recycle-list-demo__tile" :style="{ width: `${row.width}px` }">卡片 {{ row.id + 1 }} · {{ row.width }}px</div>
					</template>
				</RecycleList>
				<div v-if="isExternal" class="recycle-list-demo__edge">后置内容</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, RecycleList } from '@deot/vc';

const isExternal = ref(true);
const data = Array.from({ length: 30 }, (_, id) => ({ id, width: 120 + id % 3 * 40 }));

const handleMode = () => {
	isExternal.value = !isExternal.value;
};
</script>

<style scoped>
.recycle-list-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.recycle-list-demo__row {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}

.recycle-list-demo__result {
	margin: 0;
}

.recycle-list-demo__carrier {
	width: 100%;
	overflow-x: auto;
}

.recycle-list-demo__track {
	display: flex;
	align-items: stretch;
	width: max-content;
}

.recycle-list-demo__horizontal {
	height: 160px;
}

.recycle-list-demo__tile {
	height: 100%;
	padding: 20px 12px;
	border-right: 1px solid var(--vc-color-light-deeper);
	box-sizing: border-box;
}

.recycle-list-demo__edge {
	display: grid;
	flex-shrink: 0;
	place-items: center;
	width: 140px;
	background: var(--vc-color-light-deep);
}
</style>
```
:::

### 外部模式下的方法坐标

`fill=false` 仍保持原有 wrapper 绝对坐标语义，只是主轴 wrapper 变为自动找到的外部承载者：

- `scrollTo(0)` 和 `reset()` 把整个外部主轴承载者移动到绝对坐标 `0`，不是移动到 RecycleList 的起点；`inverted` 下 `reset()` 不移动，见下方「拉动刷新」。
- `scrollTo(number | { x, y })` 继续使用原有参数补零与分轴规则。纵向 external 时 Y 写入外部容器、X 写入内部 wrapper；横向 external 时相反。
- 承载者或其祖先带 `transform` 缩放（如浮层的展开动画）时，几何按缩放比例换算回滚动坐标，可以放在正在执行缩放动画的浮层里。
- `scrollToIndex(index, offset)` 表示定位列表 item，会自动使用 `contentStart + item.position + offset`，因此不会受到前置内容影响；`align: 'nearest'` 或 `ifNeeded: true` 时按同一坐标判断 item 是否已在外部视口内。
- `scroll` 事件仍返回兼容的 `{ target: { scrollLeft, scrollTop } }` 结构；外部主轴与内部交叉轴滚动都会触发该事件。

### inverted、pullable 与共享 Store

- `fill=false + inverted` 保持首次对齐尾部、向起点加载和 prepend 后锚点稳定的现有行为。首次对齐可能主动移动整个外部滚动容器，这是内部模式尾部对齐在外部承载者上的等价行为。
- `pullable` 在正序与 `inverted` 下都可用，规则见下方「拉动刷新」。
- 共享 `RecycleListStore` 可用于内部滚动、外部滚动或两者混合的列表。鼠标进入或触摸一个列表时，该列表成为活动实例，负责驱动可见范围和加载。

### 拉动刷新（pullable）

在刷新一侧的端点拉动超过提示条的尺寸（默认 30px，`MRecycleList` 为 750 稿的 88）后松手，触发静默刷新 `reset(true)`：旧内容保留，新数据到达后整体替换。

| 模式 | 刷新一侧 | 手势（纵向 / 横向） | 提示条位置 | `type` |
| --- | --- | --- | --- | --- |
| 正序 | 主轴起点 | 下拉 / 右拉 | 列表头部 | `DOWN` / `RIGHT` |
| `inverted` | 主轴终点 | 上拉 / 左拉 | 列表尾部 | `UP` / `LEFT` |

- 只有主轴停在该端点时才进入拉动，否则拖动就是普通滚动。内部模式看内部 Scroller 是否在起点 / 末端（末端有 1px 容差）；`fill=false` 时以外部主轴承载者的绝对坐标为准：正序要求位于 `0`，`inverted` 要求滚到承载者的绝对末端，后置内容也要滚完。
- 刷新期间加载状态区只隐藏、不移除，列表不会因此位移。正序的 `reset()` 仍回到起点；`inverted` 下 `reset()` 不改变滚动位置，首批数据到达后贴到列表尾部。
- 鼠标拖动只响应主键。按下后在 document 上跟踪移动与松开，拖出列表后松手也能正常结束；拉动期间不会选中文字，根节点带 `is-pulling` 类。触摸拖动不受影响。
- 提示条内容可用 `renderRefresh({ status, type, mobile })` 定制，`status` 为 `2` 拉动中、`3` 可释放、`4` 刷新中，其余（`0` / `1`）为空闲；默认 `0` 不显示内容，`1` 显示 `~`。
- 提示条平时贴在视口外，沿主轴的尺寸由 `--vc-recycle-list-pull-size` 决定（内容更高时以实际尺寸为准）。触发刷新的拉动距离、刷新中停留的位置都取它的实际尺寸，在每次拉动开始时读取。
- `inverted + fill=false` 时，如果自定义的 `complete` / `empty` 比加载区矮，刷新开始时首部会变高，列表整体下移这段差值，直到新数据到达。需要时给这两个 slot 设置不低于加载区的最小高度。

### 倒置消息列表与上拉刷新

远程数据按新到旧返回，倒置列表将最新消息放在底部，后续历史页加入列表起点。观察轮次可以区分“加载历史页”和“重新刷新数据”。

:::playground
<!--
<config lang="json5">
{
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="recycle-list-demo">
		<p class="recycle-list-demo__result">第 {{ round }} 轮数据。首次贴底；向上滚动加载历史，到底后向上拖动超过 30px 刷新。</p>
		<RecycleList class="recycle-list-demo__list" inverted pullable :load-data="loadData">
			<template #default="{ row }">
				<div class="recycle-list-demo__item">{{ row.text }}</div>
			</template>
			<template #complete>
				<div class="recycle-list-demo__item">没有更早的消息</div>
			</template>
		</RecycleList>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { RecycleList } from '@deot/vc';

const round = ref(0);

const loadData = async ({ page }) => {
	if (page === 1) round.value++;
	const version = round.value;
	await new Promise(resolve => setTimeout(resolve, 500));
	return {
		data: Array.from({ length: 12 }, (_, index) => ({
			text: `第 ${version} 轮 · 消息 ${36 - (page - 1) * 12 - index}`
		})),
		finished: page >= 3
	};
};
</script>

<style scoped>
.recycle-list-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.recycle-list-demo__result {
	margin: 0;
}

.recycle-list-demo__list {
	height: 280px;
}

.recycle-list-demo__item {
	min-height: 48px;
	padding: 12px;
	border-bottom: 1px solid var(--vc-color-light-deeper);
	box-sizing: border-box;
}
</style>
```
:::

### 延迟展示列表末端与页面后置内容

列表还在分页时，它**末端之后**的内容会被不断增长的列表反复推走。`lazyTail` 负责列表内部的那一侧（`header`、`footer` 插槽在列表内部头尾），`load-change` 让页面自己的后置区块跟上；它在每批数据落地后也会推送，`loaded` 可用来展示加载进度：

:::playground
<!--
<config lang="json5">
{
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="recycle-list-demo">
		<p class="recycle-list-demo__result">已加载 {{ loadState.loaded }} 条，{{ loadState.isEnd ? '加载完成，两个尾部已显示' : '滚动加载中，尾部暂不显示' }}</p>
		<Scroller :height="280" native>
			<RecycleList :fill="false" lazy-tail :load-data="loadData" @load-change="handleLoadChange">
				<template #header>
					<div class="recycle-list-demo__tail">列表内部 header（正序时正常渲染）</div>
				</template>
				<template #default="{ row }">
					<div class="recycle-list-demo__item">{{ row.name }}</div>
				</template>
				<template #footer>
					<div class="recycle-list-demo__tail">列表内部 footer</div>
				</template>
			</RecycleList>
			<section v-if="loadState.isEnd" class="recycle-list-demo__tail">页面后置内容：仅在整个列表结束后展示</section>
		</Scroller>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { RecycleList, Scroller } from '@deot/vc';

const loadState = ref({ isEnd: false, loaded: 0 });

const handleLoadChange = (state) => {
	loadState.value = state;
};

const loadData = async ({ page, loaded }) => {
	await new Promise(resolve => setTimeout(resolve, 400));
	return {
		data: Array.from({ length: 8 }, (_, index) => ({ name: `条目 ${loaded + index + 1}` })),
		finished: page >= 2
	};
};
</script>

<style scoped>
.recycle-list-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.recycle-list-demo__result {
	margin: 0;
}

.recycle-list-demo__item {
	height: 48px;
	padding: 12px;
	border-bottom: 1px solid var(--vc-color-light-deeper);
	box-sizing: border-box;
}

.recycle-list-demo__tail {
	padding: 20px 12px;
	background: var(--vc-color-light-deep);
}
</style>
```
:::

`lazyTail` 延迟的是**加载方向末端**那一侧：正序数据向下生长，延迟 `#footer`；`inverted` 数据向上生长，改为延迟 `#header`。另一侧始终正常渲染。该行为与 `fill` 无关，`fill=true` 同样生效。

### 共享 Store 的双视图

通过同一个 `RecycleListStore` 共享加载结果。两个视图采用相同宽度与行样式，让共享的测量结果适用于两侧。

:::playground
<!--
<config lang="json5">
{
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="recycle-list-demo">
		<p class="recycle-list-demo__result">两个视图共用数据与布局。将鼠标移入任一视图后滚动，另一个视图会同步位置。</p>
		<div class="recycle-list-demo__panels">
			<section v-for="name in ['视图 A', '视图 B']" :key="name" class="recycle-list-demo__panel">
				<h4 class="recycle-list-demo__title">{{ name }}</h4>
				<RecycleList class="recycle-list-demo__list" :store="store">
					<template #default="{ row }">
						<div class="recycle-list-demo__item">{{ row.name }}</div>
					</template>
				</RecycleList>
			</section>
		</div>
	</div>
</template>

<script setup>
import { RecycleList, RecycleListStore } from '@deot/vc';

const store = new RecycleListStore({
	loadData: ({ page, loaded }) => ({
		data: Array.from({ length: 20 }, (_, index) => ({ name: `条目 ${loaded + index + 1}` })),
		finished: page >= 3
	})
});
</script>

<style scoped>
.recycle-list-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.recycle-list-demo__result,
.recycle-list-demo__title {
	margin: 0;
}

.recycle-list-demo__panels {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 16px;
}

.recycle-list-demo__panel {
	display: flex;
	flex-direction: column;
	gap: 8px;
	min-width: 0;
}

.recycle-list-demo__list {
	height: 280px;
}

.recycle-list-demo__item {
	height: 48px;
	padding: 12px;
	border-bottom: 1px solid var(--vc-color-light-deeper);
	box-sizing: border-box;
}
</style>
```
:::

### 完整示例

以上 Playground 保留各场景的最小交互；下面的源码示例提供更多组合选项和调试信息。

- [外部视口：Window / VC Scroller / 横向原生容器，前置内容—RecycleList—后置内容](./examples/external.vue)
- [inverted 上拉刷新](./examples/inverted-pullable.vue)
- [预估尺寸](./examples/estimate-size.vue)

## 移动端

`MRecycleList` 与 `RecycleList` 结构相同，根节点另有标记类 `.vcm-recycle-list`（`.vc-recycle-list.vcm-recycle-list`），属性、事件、插槽和方法一致。虚拟滚动本身两端通用，不同之处有四点：

- 数字 `gap`、`estimateSize`（含函数的返回值）是 750 稿长度，按 `--vc-rem` 当前的 px 换算（375 宽下 `gap=24` 即 12px）；`--vc-rem` 变化（旋转屏幕、视口跨过 480px、业务调整 `--rem`）时自动重新换算并重排。`overscan`、`threshold` 两端都以 px 为单位。
- 方法与事件里的尺寸、位置都是实测的 px：`scrollTo` / `scrollToIndex` 的 `offset`、`row-resize` 的尺寸等。
- 内部滚动容器为 `MScroller`：未设置 `always` 时使用原生滚动条，`scrollerOptions` 的数字 `height`、`maxHeight` 是 750 稿长度。
- 默认内容按 750 稿：刷新提示条高 88（也是触发刷新的拉动距离），加载中 / 已全部加载 / 空状态上下留白 24、行高 44，文字 28、次要文字色。对应的局部变量见下表，可在 `.vcm-recycle-list` 或外层覆盖。

下例切换单列（下拉刷新、加载更多）与双列（`gap`、`estimateSize` 按 750 稿书写）；底栏切换 `rem` 时数字长度随之换算并重排，`complete` 插槽参数 `mobile` 为 `true`。

:::playground
<!--
<config lang="json5">
{
	mobile: true
}
</config>
-->
```vue
<template>
	<div class="m-recycle-list-demo">
		<div class="m-recycle-list-demo__row">
			<MButton
				v-for="item in TYPES"
				:key="item.value"
				size="small"
				:type="type === item.value ? 'primary' : 'default'"
				@click="handleType(item.value)"
			>
				{{ item.label }}
			</MButton>
		</div>
		<p class="m-recycle-list-demo__result">刷新 {{ refreshCount }} 次，已请求到第 {{ loadedPage }} 页</p>
		<MRecycleList
			v-if="type === 'list'"
			key="list"
			class="m-recycle-list-demo__list"
			pullable
			:load-data="loadData"
		>
			<template #default="{ row }">
				<div class="m-recycle-list-demo__item">
					<strong>#{{ row.id }}</strong>
					<span>{{ row.text }}</span>
				</div>
			</template>
			<template #complete="{ mobile }">
				<div class="m-recycle-list-demo__complete">没有更多了（mobile: {{ mobile }}）</div>
			</template>
		</MRecycleList>
		<MRecycleList
			v-else
			key="grid"
			class="m-recycle-list-demo__list"
			pullable
			:columns="2"
			:gap="24"
			:estimate-size="estimateSize"
			:load-data="loadData"
		>
			<template #default="{ row }">
				<div class="m-recycle-list-demo__cell">
					<div class="m-recycle-list-demo__card" :style="{ height: `calc(var(--vc-rem) * ${row.size})` }">#{{ row.id }}</div>
				</div>
			</template>
		</MRecycleList>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MButton, MRecycleList } from '@deot/vc';

const TYPES = [
	{ value: 'list', label: '单列' },
	{ value: 'grid', label: '双列' }
];
const TEXTS = ['一行内容', '两行内容，第二行用来撑开行高，观察不同高度的行', '较长的三行内容，用来观察不同高度的行在虚拟列表里的排布，以及滚动时的回收与复用'];
// 卡片下方的留白（750 稿），与样式一致
const ROW_GAP = 24;

const type = ref('list');
const refreshCount = ref(0);
const loadedPage = ref(0);

// 行的预估高度（750 稿）：卡片高度 + 行间距
const estimateSize = ({ row }) => row.size + ROW_GAP;

const loadData = async ({ page, loaded }) => {
	await new Promise(resolve => setTimeout(resolve, 600));
	if (page === 1 && loadedPage.value) refreshCount.value++;
	loadedPage.value = page;
	if (page > 5) return [];
	return Array.from({ length: 20 }, (_, index) => {
		const id = loaded + index;
		return { id, text: TEXTS[id % TEXTS.length], size: 200 + (id % 4) * 60 };
	});
};

const handleType = (value) => {
	type.value = value;
	refreshCount.value = 0;
	loadedPage.value = 0;
};
</script>

<style scoped>
.m-recycle-list-demo {
	display: flex;
	flex-direction: column;
	gap: calc(var(--vc-rem) * 16);
}

.m-recycle-list-demo__row {
	display: flex;
	flex-wrap: wrap;
	gap: calc(var(--vc-rem) * 16);
	padding-inline: calc(var(--vc-rem) * 32);
}

.m-recycle-list-demo__result {
	margin: 0;
	padding-inline: calc(var(--vc-rem) * 32);
	font-size: calc(var(--vc-rem) * 26);
}

.m-recycle-list-demo__list {
	height: calc(var(--vc-rem) * 900);
}

.m-recycle-list-demo__item {
	display: flex;
	flex-direction: column;
	gap: calc(var(--vc-rem) * 8);
	padding: calc(var(--vc-rem) * 24) calc(var(--vc-rem) * 32);
	font-size: calc(var(--vc-rem) * 28);
	border-bottom: 1px solid var(--vc-color-light-deeper);
}

.m-recycle-list-demo__complete {
	padding: calc(var(--vc-rem) * 24);
	font-size: calc(var(--vc-rem) * 26);
	text-align: center;
}

/* 行间距写在行内，属于被测量的行尺寸 */
.m-recycle-list-demo__cell {
	padding-bottom: calc(var(--vc-rem) * 24);
}

.m-recycle-list-demo__card {
	display: grid;
	place-items: center;
	border-radius: calc(var(--vc-rem) * 16);
	background: var(--vc-background-color-light);
	box-sizing: border-box;
}
</style>
```
:::

| 局部变量 | 说明 | `RecycleList` | `MRecycleList` |
| --- | --- | --- | --- |
| `--vc-recycle-list-pull-size` | 刷新提示条沿主轴的尺寸 | `30px` | `calc(var(--vc-rem) * 88)` |
| `--vc-recycle-list-state-padding` | 加载中 / 已全部加载 / 空状态沿主轴的留白 | `10px` | `calc(var(--vc-rem) * 24)` |
| `--vc-recycle-list-state-line-height` | 默认提示文字的行高 | `20px` | `calc(var(--vc-rem) * 44)` |

需要在业务代码里把 750 稿长度算成 px 时，可用 `@deot/vc-hooks` 的 `useRem()`：返回全局共享的只读 `ref`，值为 750 稿上 1 个单位当前的 px。

## API

### 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| data | 本地数据；按 `batchCount` 分批构建（设置 `estimateSize` 时一次构建全部）。替换数组时，与旧数组中引用相同的数据项沿用已测尺寸，只测量新出现的数据项（删除、插入、排序不会整体重测）；换成新对象的数据项沿用同位置旧项的尺寸作为估计值（设置了 `estimateSize` 时取预估值），不进隐藏池，行渲染出来时按实际尺寸校正（整页替换因此不必重测已构建的行）；在原对象上修改了影响尺寸的字段也无需处理，行渲染出来时会按实际尺寸自动校正 | `unknown[]` | - | `[]` |
| store | 可选的共享 RecycleListStore | `RecycleListStore` | - | - |
| fill | 是否由内部 Scroller 填满并承载主轴滚动；`false` 时自动使用外部 viewport | `boolean` | - | `true` |
| disabled | 是否禁止触发远程 `loadData`；不阻止本地 `data` 分批构建 | `boolean` | - | `false` |
| batchCount | 每次构建/测量的节点批次大小；有 placeholder 时亦作为请求期间预分配的占位节点数 | `number` | - | `20` |
| bufferCount | 在可见数据索引前后额外渲染的节点数量 | `number` | - | `0` |
| estimateSize | 预估尺寸（主轴，px；`MRecycleList` 为 750 稿长度），数字或 `({ row, index }) => number \| undefined`（`row` 为 `data` 中的一项，`index` 为它的下标，与默认插槽一致）。给出尺寸的项不进隐藏池测量，本地数据一次构建全部，内容尺寸从一开始就完整；渲染出来后按实际尺寸校正（按锚点补偿，画面不跳）。返回 `undefined` 的项照常测量。取值或函数变化时，只有预估值变了的项换用新值（之前测过的尺寸也随之作废），预估值没变的项不动，因此可以直接写内联函数 | `number \| Function` | - | - |
| overscan | 视口上下（横向时左右）额外预渲染距离，单位 px；默认原生滚动时 scroll 事件晚于实际滚动，留出余量避免快速滚动时边缘露白，滚轮驱动（`scrollerOptions.wheel`）时可调小 | `number` | - | `300` |
| threshold | 距离列表加载边缘小于等于该值时触发加载，单位 px | `number` | - | `100` |
| loadData | 获取更多数据，签名为 `({ page, loaded }) => response` | `Function` | - | `() => false` |
| columns | 多列数量；不定高时支持瀑布流 | `number` | - | `1` |
| gap | 多列间距，单位 px；`MRecycleList` 为 750 稿长度 | `number` | - | `0` |
| inverted | 是否倒置 | `boolean` | - | `false` |
| lazyTail | 是否延迟展示「加载方向末端」的 slot，直到列表到达末尾（远程全部加载完；`disabled` 时为本地数据全部构建完）；末端随 `inverted` 翻转 | `boolean` | - | `false` |
| pullable | 是否启用拉动刷新：正序下拉（横向右拉），`inverted` 时上拉（横向左拉） | `boolean` | - | `false` |
| vertical | 是否以 Y 轴为主轴 | `boolean` | - | `true` |
| scrollerOptions | 内部 Scroller 的属性，见下方 scrollerOptions 说明 | `object` | - | - |
| renderEmpty | 空数据渲染函数，参数为 `{ mobile }` | `Function` | - | - |
| renderComplete | 加载完成渲染函数，参数为 `{ mobile }` | `Function` | - | - |
| renderLoading | 加载中渲染函数，参数为 `{ mobile }` | `Function` | - | - |
| renderPlaceholder | 占位节点渲染函数，参数为 `{ mobile }` | `Function` | - | - |
| renderRefresh | 刷新提示渲染函数，参数为 `{ status, type, mobile }`，见上文「拉动刷新」 | `Function` | - | - |

#### scrollerOptions

- 传给内部 Scroller 的属性；默认原生滚动，键盘、触摸、页内查找等由浏览器处理，各平台表现一致。
- 需要虚拟内容与滚动位置在同一帧更新时设置 `wheel: true`，由滚轮驱动；它只在不使用原生滚动条（`native: false` 或 `always: true`）时生效，此时根节点为 `.vc-scroller.is-wheel`、`overflow: hidden`，键盘无法滚动。`native` 的默认值取决于浏览器滚动条是否占宽，滚动条不占宽（如悬浮滚动条）时为 `true`。
- 原生滚动时 scroll 事件晚于实际滚动，`overscan` 默认留出 300px 余量；更快的滚动仍露白时可再调大 `overscan` 或 `bufferCount`。
- `fill=false` 时主轴展开规则优先，交叉轴选项继续生效。

#### loadData 契约

- 参数为 `{ page, loaded }`。`page` 是第 N 次请求（从 1 开始）；`loaded` 是当前已加载总条数（含 `data` 传入的本地数据），可作为服务端 offset，与 `load-change` 推出的 `loaded` 同义。
- 可返回 `Array`、`{ data, finished }` 或 falsy（如 `false`）。
- falsy 或无 `data` 表示结束；裸数组视为 `{ data }`。未显式提供 `finished` 时，非空数组表示未结束，空页表示结束。
- 末页刚好满页时，需要再返回一次空数组，或在末页显式返回 `finished: true`。

### 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| scroll | 主轴或交叉轴滚动 | `event` | `event.target` 含 `scrollLeft`、`scrollTop` |
| row-resize | 行尺寸变化：已渲染的行内容变化（展开、编辑、图片撑开等），或行渲染出来时按实际尺寸校正了记录；只校正变化的行，不整体重测 | `rows: Array<{ size, index }>` | 本次尺寸变化的行：`size` 为实测后的主轴尺寸（px），`index` 为行索引 |
| load-change | 加载状态变化；每批数据构建并完成布局后也会推送 | `state: RecycleListLoadState` | `{ isEnd, isLoading, isSilentRefresh, isEmpty, loaded }`，`loaded` 为 `number`，其余为 `boolean` |

#### load-change

- **单向**：只由列表向外推快照，没有对应的属性，也不会 emit `update:*`。加载是否结束由列表自己决定，外层写回会误关 `loadData`。
- 任一字段变化就推送**完整快照**；挂载时立即推一次，外层不必自己兜初值。
- `isEmpty` 为「已结束且没有任何真实节点」。
- `loaded` 为已构建并完成布局的条数（不含骨架占位），与 `loadData` 收到的 `loaded` 同义。本地 `data` 分批构建与远程分页都在每批落地后更新它，因此每批推送一次；同时进行的几批（如挂载时的首批与下一批）全部排版完才更新，推出的条数都已完成布局。数据替换、清空时随之变化。
- `disabled` 时远程分支不会执行，`isEnd` 表示本地 `data` 已全部构建并完成布局（此时 `store.states.isEnd` 仍为 `false`）。`lazyTail` 与 loading / complete / empty 状态区按同一口径判断；`disabled` 时不展示加载中。
- `loadData` 响应里的 `finished: true` 表示远程数据已全部返回，组件会停止后续请求；`isEnd` 是列表对外提供的结束状态，也涵盖 `disabled` 下本地数据构建完成的情况。

### 方法

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| reset | 清空列表全部内容并重置数据和主轴滚动位置；`silent` 为 `true` 时保留旧内容直到新数据到达（拉动刷新即此模式）；`inverted` 下不改变滚动位置，首批数据到达后贴到列表尾部 | `silent?: boolean`，默认 `false` | `Promise<void>` |
| refreshViewport | 刷新视口几何与可见范围，并按已渲染行的实际尺寸校正一次；代价只与当前渲染的行数相关 | - | `Promise<void>` |
| refreshLayout | 重新测量全部已构建的行并刷新布局：正在渲染的行原地按实际尺寸重测，其余行在隐藏测量池中分片重测；代价随已构建行数增长 | - | `Promise<void>` |
| scrollTo | 滚动到 wrapper 的绝对坐标，数字表示主轴位置，对象中缺省轴归零 | `options: number \| { x?: number; y?: number }, force?: boolean`；`force` 强制写入相同坐标 | `void` |
| scrollToIndex | 定位当前已构建并具有布局位置的 item，交叉轴归零；尚未构建的索引不触发加载或滚动。`align` 为 `start` 时置顶；为 `center` 时居中（比视口大时置顶），如打开时把已选项滚到中间；为 `nearest` 时 item 已完整可见则不滚动（交叉轴也不动），否则贴近离得近的一边，比视口大时置顶，适合键盘逐项移动；`ifNeeded` 为 `true` 时 item 已完整可见则不滚动（交叉轴也不动），否则按 `align` 定位，如打开时滚动到已选项（`start` + `ifNeeded`）；`nearest` 始终如此，`ifNeeded` 对它没有影响；`offset` 加在滚动目标上。定位后 500ms 内行渲染出来校正尺寸、`estimateSize` 变化时按同样的参数重新定位（定位到的项与它之前的行起初可能只是估计尺寸），滚轮或按下时放弃 | `index: number, options?: number \| { offset?: number; align?: 'start' \| 'center' \| 'nearest'; ifNeeded?: boolean }`，数字视为 `offset`；`offset` 默认 `0`，`align` 默认 `'start'`，`ifNeeded` 默认 `false` | `void` |

实例还暴露 `scroller`（内部 Scroller 的实例）与 `store`（当前使用的 RecycleListStore）。

### 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 行内容；尺寸未知的项会先在隐藏测量池中渲染一次，避免在渲染过程中执行副作用 | `{ row, index }`，`index` 为当前数据索引 |
| placeholder | 未加载数据时的占位内容，如骨架屏 | `{ mobile }` |
| loading | 加载更多提示 | `{ mobile }` |
| complete | 无更多数据提示 | `{ mobile }` |
| empty | 首次加载后无数据提示 | `{ mobile }` |
| header | RecycleList 内部头部；`inverted + lazyTail` 时延迟到加载完成才渲染 | - |
| footer | RecycleList 内部尾部；`lazyTail` 时延迟到加载完成才渲染（非 inverted） | - |

`placeholder`、`loading`、`complete`、`empty` 插槽优先于对应的 `render*` 属性；属性优先于 `VcInstance.configure({ RecycleList: { renderEmpty, renderComplete, renderLoading, renderPlaceholder, renderRefresh } })` 全局配置。刷新提示通过 `renderRefresh` 定制，没有 `refresh` 插槽。默认空状态、完成状态及拉动提示随 locale 切换。

`render*` 与对应插槽的参数 `mobile` 标识当前是哪一端：`RecycleList` 为 `false`，`MRecycleList` 为 `true`。全局配置两端共用一份，需要区分时按它分支：

```js
import { VcInstance } from '@deot/vc';

VcInstance.configure({
	RecycleList: {
		renderEmpty: ({ mobile }) => (mobile ? '暂无内容' : '暂无数据，换个条件试试')
	}
});
```

### 共享 Store

`RecycleListStore` 与 `RecycleListLoadState` 可从 `@deot/vc` 导入。

使用 `new RecycleListStore({ loadData, columns, gap })` 创建共享实例并传给多个列表。传入 `store` 后，`batchCount`、`bufferCount`、`estimateSize`、`inverted`、`columns`、`gap`、`loadData` 由 Store 接管，列表对应属性不再同步到 Store。Store 上的 `gap`、`estimateSize` 与列表属性单位相同：交给 `MRecycleList` 使用时为 750 稿长度。
