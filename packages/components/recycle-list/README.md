## 可回收列表（RecycleList）

只渲染视口附近节点的高性能列表，支持动态尺寸、瀑布流、横向列表、倒置列表和异步加载。

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

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<RecycleList
		class="list"
		:load-data="loadData"
		pullable
	>
		<template #default="{ row }">
			<div class="row" :style="{ minHeight: `${row.height}px` }">
				第 {{ row.id + 1 }} 项 · 第 {{ row.page }} 页
			</div>
		</template>
	</RecycleList>
</template>

<script setup>
import { RecycleList } from '@deot/vc';

const loadData = ({ current, count }) => new Promise((resolve) => {
	setTimeout(() => {
		const data = Array.from({ length: 20 }, (_, index) => ({
			id: count + index,
			page: current,
			height: 40 + (index % 3) * 20
		}));
		resolve({ data, finished: current >= 3 });
	}, 400);
});
</script>

<style scoped>
.list {
	height: 280px;
}
.row {
	padding: 12px;
	border-bottom: 1px solid var(--vc-color-light-deeper);
	box-sizing: border-box;
}
</style>
```
:::

示例共三页，每页 20 项；滚动接近末尾时继续加载。在起点下拉可重新加载，行高由实际内容测量。

### 外部视口与前、中、后内容

设置 `fill=false` 后，RecycleList 可以位于正常文档流的中间：

```text
Window / Scroller
├── 其他头部内容
├── RecycleList（fill=false）
└── 其他尾部内容
```

```text
<template>
	<section>其他头部内容</section>
	<RecycleList ref="listRef" :fill="false" :load-data="loadData">
		<template #default="{ row }">
			<div>{{ row.name }}</div>
		</template>
	</RecycleList>
	<section>其他尾部内容</section>
</template>
```

- 前置内容只改变列表在外部容器中的绝对位置，不计入 item position。
- 可见范围由外部 viewport 与列表内容区的相对位置计算。外部 viewport 尚在头部或已经进入尾部时，不会因为外部容器滚动而触发无关批次。
- 后置内容不计入列表尾部边界；接近 RecycleList 自身尾部时就会加载下一批，不必等待外部 Footer 滚动结束。
- 虚拟占位尺寸参与正常文档流，数据增加时会自然把后置内容向后推。
- 挂载、列表自身交叉轴尺寸变化以及 `fill`/方向变化会自动重新测量；单行内容变化只校正该行，已渲染的其它行保持不动；外部 viewport 尺寸变化只刷新可见范围，不重新测量节点（节点尺寸只取决于列表自身的交叉轴）。外部前置内容发生无法被观察的位置变化时，调用 `refreshViewport()` 即可，它只刷新几何与已渲染的行。
- 首次加载、本地数据分批构建、underfill、placeholder/loading/complete/empty 和 `disabled` 的行为与内部模式一致。

### 外部模式下的方法坐标

`fill=false` 仍保持原有 wrapper 绝对坐标语义，只是主轴 wrapper 变为自动找到的外部承载者：

- `scrollTo(0)` 和 `reset()` 把整个外部主轴承载者移动到绝对坐标 `0`，不是移动到 RecycleList 的起点；`inverted` 下 `reset()` 不移动，见下方「拉动刷新」。
- `scrollTo(number | { x, y })` 继续使用原有参数补零与分轴规则。纵向 external 时 Y 写入外部容器、X 写入内部 wrapper；横向 external 时相反。
- `scrollToIndex(index, offset)` 表示定位列表 item，会自动使用 `contentStart + item.position + offset`，因此不会受到前置内容影响。
- `scroll` 事件仍返回兼容的 `{ target: { scrollLeft, scrollTop } }` 结构；外部主轴与内部交叉轴滚动都会触发该事件。

### inverted、pullable 与共享 Store

- `fill=false + inverted` 保持首次对齐尾部、向起点加载和 prepend 后锚点稳定的现有行为。首次对齐可能主动移动整个外部滚动容器，这是内部模式尾部对齐在外部承载者上的等价行为。
- `pullable` 在正序与 `inverted` 下都可用，规则见下方「拉动刷新」。
- 共享 `RecycleListStore` 可用于内部滚动、外部滚动或两者混合的列表。鼠标进入或触摸一个列表时，该列表成为活动实例，负责驱动可见范围和加载。

### 拉动刷新（pullable）

在刷新一侧的端点拉动超过 30px 后松手，触发静默刷新 `reset(true)`：旧内容保留，新数据到达后整体替换。

| 模式 | 刷新一侧 | 手势（纵向 / 横向） | 提示条位置 | `type` |
| --- | --- | --- | --- | --- |
| 正序 | 主轴起点 | 下拉 / 右拉 | 列表头部 | `DOWN` / `RIGHT` |
| `inverted` | 主轴终点 | 上拉 / 左拉 | 列表尾部 | `UP` / `LEFT` |

- 只有主轴停在该端点时才进入拉动，否则拖动就是普通滚动。内部模式看内部 Scroller 是否在起点 / 末端（末端有 1px 容差）；`fill=false` 时以外部主轴承载者的绝对坐标为准：正序要求位于 `0`，`inverted` 要求滚到承载者的绝对末端，后置内容也要滚完。
- 刷新期间加载状态区只隐藏、不移除，列表不会因此位移。正序的 `reset()` 仍回到起点；`inverted` 下 `reset()` 不改变滚动位置，首批数据到达后贴到列表尾部。
- 鼠标拖动只响应主键。按下后在 document 上跟踪移动与松开，拖出列表后松手也能正常结束；拉动期间不会选中文字，根节点带 `is-pulling` 类。触摸拖动不受影响。
- 提示条内容可用 `renderRefresh({ status, type })` 定制，`status` 为 `2` 拉动中、`3` 可释放、`4` 刷新中，其余（`0` / `1`）为空闲；默认 `0` 不显示内容，`1` 显示 `~`。
- `inverted + fill=false` 时，如果自定义的 `complete` / `empty` 比加载区矮，刷新开始时首部会变高，列表整体下移这段差值，直到新数据到达。需要时给这两个 slot 设置不低于加载区的最小高度。

### 延迟展示列表末端与页面后置内容

列表还在分页时，它**末端之后**的内容会被不断增长的列表反复推走。`lazyTail` 负责列表内部的那一侧，`load-change` 让页面自己的后置区块跟上：

```text
<RecycleList :fill="false" lazy-tail :load-data="loadData" @load-change="loadState = $event">
	<template #footer>
		<div>列表尾部</div>
	</template>
</RecycleList>

<section v-show="loadState.isEnd">页面后置内容</section>
```

`lazyTail` 延迟的是**加载方向末端**那一侧：正序数据向下生长，延迟 `#footer`；`inverted` 数据向上生长，改为延迟 `#header`。另一侧始终正常渲染。该行为与 `fill` 无关，`fill=true` 同样生效。

### 完整示例

- [Window 前置内容—RecycleList—后置内容](./examples/external-window.vue)
- [VC Scroller 外部视口](./examples/external-scroller.vue)
- [横向外部视口](./examples/external-horizontal.vue)
- [inverted 上拉刷新](./examples/inverted-pullable.vue)

## API

### 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| data | 本地数据；按 `batchCount` 分批构建。替换数组时，与旧数组中引用相同的数据项沿用已测尺寸，只测量新出现的数据项（删除、插入、排序不会整体重测）；在原对象上修改了影响尺寸的字段也无需处理，行渲染出来时会按实际尺寸自动校正 | `unknown[]` | - | `[]` |
| store | 可选的共享 RecycleListStore | `RecycleListStore` | - | - |
| fill | 是否由内部 Scroller 填满并承载主轴滚动；`false` 时自动使用外部 viewport | `boolean` | - | `true` |
| disabled | 是否禁止触发远程 `loadData`；不阻止本地 `data` 分批构建 | `boolean` | - | `false` |
| batchCount | 每次构建/测量的节点批次大小；有 placeholder 时亦作为请求期间预分配的占位节点数 | `number` | - | `20` |
| bufferCount | 在可见数据索引前后额外渲染的节点数量 | `number` | - | `0` |
| overscan | 视口上下（横向时左右）额外预渲染距离，单位 px | `number` | - | `50` |
| threshold | 距离列表加载边缘小于等于该值时触发加载，单位 px | `number` | - | `100` |
| loadData | 获取更多数据，签名为 `({ current, count }) => response` | `Function` | - | `() => false` |
| cols | 多列数量；不定高时支持瀑布流 | `number` | - | `1` |
| gutter | 多列间距 | `number` | - | `0` |
| inverted | 是否倒置 | `boolean` | - | `false` |
| lazyTail | 是否延迟展示「加载方向末端」的 slot，直到列表到达末尾（远程全部加载完；`disabled` 时为本地数据全部构建完）；末端随 `inverted` 翻转 | `boolean` | - | `false` |
| pullable | 是否启用拉动刷新：正序下拉（横向右拉），`inverted` 时上拉（横向左拉） | `boolean` | - | `false` |
| vertical | 是否以 Y 轴为主轴 | `boolean` | - | `true` |
| scrollerOptions | 内部 Scroller 的属性，见下方 scrollerOptions 说明 | `object` | - | - |
| renderEmpty | 空数据渲染函数 | `Function` | - | - |
| renderComplete | 加载完成渲染函数 | `Function` | - | - |
| renderLoading | 加载中渲染函数 | `Function` | - | - |
| renderPlaceholder | 占位节点渲染函数 | `Function` | - | - |
| renderRefresh | 刷新提示渲染函数，参数为 `{ status, type }`，见上文「拉动刷新」 | `Function` | - | - |

#### scrollerOptions

- 传给内部 Scroller 的属性；`wheel` 默认为 `true`，在 `native=false` 时由滚轮驱动，虚拟内容与滚动位置在同一帧更新。
- `native` 的默认值取决于浏览器滚动条是否占宽：滚动条不占宽（如悬浮滚动条）时为 `true`，此时为原生滚动。需要滚轮驱动时显式设置 `native: false`。
- 滚轮驱动时根节点为 `overflow: hidden`，键盘无法原生滚动。需要时可设 `wheel: false` 改用原生滚动，或通过 `wrapperStyle` 覆盖 `overflow`。
- `fill=false` 时主轴展开规则优先，交叉轴选项继续生效。

#### loadData 契约

- 参数为 `{ current, count }`。`current` 是第 N 次请求（从 1 开始）；`count` 是当前已加载总条数（含 `data` 传入的本地数据），可作为服务端 offset。
- 可返回 `Array`、`{ data, finished }` 或 falsy（如 `false`）。
- falsy 或无 `data` 表示结束；裸数组视为 `{ data }`。未显式提供 `finished` 时，非空数组表示未结束，空页表示结束。
- 末页刚好满页时，需要再返回一次空数组，或在末页显式返回 `finished: true`。

### 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| scroll | 主轴或交叉轴滚动 | `event` | `event.target` 含 `scrollLeft`、`scrollTop` |
| row-resize | 行尺寸变化：已渲染的行内容变化（展开、编辑、图片撑开等），或行渲染出来时按实际尺寸校正了记录；只校正变化的行，不整体重测 | - | - |
| load-change | 加载状态变化 | `state: RecycleListLoadState` | `{ isEnd, isLoading, isSilentRefresh, isEmpty }`，均为 `boolean` |

#### load-change

- **单向**：只由列表向外推快照，没有对应的属性，也不会 emit `update:*`。加载是否结束由列表自己决定，外层写回会误关 `loadData`。
- 任一字段变化就推送**完整快照**；挂载时立即推一次，外层不必自己兜初值。
- `isEmpty` 为「已结束且没有任何真实节点」。
- `disabled` 时远程分支不会执行，`isEnd` 表示本地 `data` 已全部构建并完成布局（此时 `store.states.isEnd` 仍为 `false`）。`lazyTail` 与 loading / complete / empty 状态区按同一口径判断；`disabled` 时不展示加载中。
- `loadData` 响应里的 `finished: true` 表示远程数据已全部返回，组件会停止后续请求；`isEnd` 是列表对外提供的结束状态，也涵盖 `disabled` 下本地数据构建完成的情况。

### 方法

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| reset | 清空列表全部内容并重置数据和主轴滚动位置；`silent` 为 `true` 时保留旧内容直到新数据到达（拉动刷新即此模式）；`inverted` 下不改变滚动位置，首批数据到达后贴到列表尾部 | `silent?: boolean`，默认 `false` | `Promise<void>` |
| refreshViewport | 刷新视口几何与可见范围，并按已渲染行的实际尺寸校正一次；代价只与当前渲染的行数相关 | - | `Promise<void>` |
| refreshLayout | 重新测量全部已构建的行并刷新布局；代价随已构建行数增长 | - | `Promise<void>` |
| scrollTo | 滚动到 wrapper 的绝对坐标，数字表示主轴位置，对象中缺省轴归零 | `options: number \| { x?: number; y?: number }, force?: boolean`；`force` 强制写入相同坐标 | `void` |
| scrollToIndex | 定位当前已构建并具有布局位置的 item，交叉轴归零；尚未构建的索引不触发加载或滚动 | `index: number, offset?: number`，`offset` 默认 `0` | `void` |

### 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 行内容；也会在隐藏测量池中渲染，避免在渲染过程中执行副作用 | `{ row, index }`，`index` 为当前数据索引 |
| placeholder | 未加载数据时的占位内容，如骨架屏 | - |
| loading | 加载更多提示 | - |
| complete | 无更多数据提示 | - |
| empty | 首次加载后无数据提示 | - |
| header | RecycleList 内部头部；`inverted + lazyTail` 时延迟到加载完成才渲染 | - |
| footer | RecycleList 内部尾部；`lazyTail` 时延迟到加载完成才渲染（非 inverted） | - |

`placeholder`、`loading`、`complete`、`empty` 插槽优先于对应的 `render*` 属性；属性优先于 `VcInstance.configure({ RecycleList: { renderEmpty, renderComplete, renderLoading, renderPlaceholder, renderRefresh } })` 全局配置。刷新提示通过 `renderRefresh` 定制，没有 `refresh` 插槽。默认空状态、完成状态及拉动提示随 locale 切换。

### 移动端与共享 Store

`MRecycleList` 是 `RecycleList` 的别名，属性、事件、插槽和方法一致。`RecycleListStore` 与 `RecycleListLoadState` 可从 `@deot/vc` 导入。

使用 `new RecycleListStore({ loadData, cols, gutter })` 创建共享实例并传给多个列表。传入 `store` 后，`batchCount`、`bufferCount`、`inverted`、`cols`、`gutter`、`loadData` 由 Store 接管，列表对应属性不再同步到 Store。
