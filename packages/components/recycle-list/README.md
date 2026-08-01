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
| `fill=true` | RecycleList 内部 ScrollerWheel | RecycleList 内部 ScrollerWheel |
| `fill=false` | 最近的外部 VC Scroller/原生滚动祖先，找不到时使用 Window | RecycleList 内部 ScrollerWheel |

- `vertical=true` 时主轴为 Y、交叉轴为 X；`vertical=false` 时主轴为 X、交叉轴为 Y。
- 默认 `fill=true`，需要一个具有确定主轴尺寸的父容器，现有调用方无需迁移。
- `fill=false` 时列表沿主轴随虚拟内容展开，不需要给列表设置固定主轴尺寸。主轴 wheel/touch 交给外部容器，交叉轴仍由内部 ScrollerWheel 处理。
- 动态切换 `fill` 会重新绑定滚动源并刷新布局，不会改变其他 prop 的语义。

### 基础用法

:::RUNTIME
```vue
<template>
	<RecycleList
		class="list"
		:load-data="loadData"
	>
		<template #default="{ row }">
			<div>{{ row }}</div>
		</template>
	</RecycleList>
</template>

<script setup>
import { RecycleList } from '@deot/vc';

const loadData = ({ current, count }) => new Promise((resolve) => {
	setTimeout(() => {
		const data = Array.from({ length: 50 }, (_, index) => ({
			id: count + index,
			page: current,
			height: ((index % 10) + 1) * 20
		}));
		resolve(data);
	}, 1000);
});
</script>

<style scoped>
.list {
	height: 200px;
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

```vue
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
- 挂载、外部 viewport resize、列表尺寸变化以及 `fill`/方向变化会自动重新测量。外部前置内容发生无法被观察的位置变化时，可调用现有 `refreshLayout()`。
- 首次加载、本地数据分批构建、underfill、placeholder/loading/complete/empty 和 `disabled` 的行为与内部模式一致。

### 外部模式下的方法坐标

`fill=false` 仍保持原有 wrapper 绝对坐标语义，只是主轴 wrapper 变为自动找到的外部承载者：

- `scrollTo(0)` 和 `reset()` 把整个外部主轴承载者移动到绝对坐标 `0`，不是移动到 RecycleList 的起点。
- `scrollTo(number | { x, y })` 继续使用原有参数补零与分轴规则。纵向 external 时 Y 写入外部容器、X 写入内部 wrapper；横向 external 时相反。
- `scrollToIndex(index, offset)` 表示定位列表 item，会自动使用 `contentStart + item.position + offset`，因此不会受到前置内容影响。
- `scroll` 事件仍返回兼容的 `{ target: { scrollLeft, scrollTop } }` 结构；外部主轴与内部交叉轴滚动都会触发该事件。

### inverted、pullable 与共享 Store

- `fill=false + inverted` 保持首次对齐尾部、向起点加载和 prepend 后锚点稳定的现有行为。首次对齐可能主动移动整个外部滚动容器，这是内部模式尾部对齐在外部承载者上的等价行为。
- `fill=false + pullable` 保持原有 Pull/Pending/Refresh 状态机；仅当外部主轴承载者位于绝对坐标 `0` 时可触发。纵向仍为 DOWN，横向仍为 RIGHT。
- `inverted + pullable` 保持现有组合规则：inverted 会禁用 pull。
- 共享 `RecycleListStore` 可用于 internal、external 或 mixed leaf。仍由 `store.scroll.currentLeaf` 对应的 active leaf 驱动可见范围和加载，mouseenter/touchstart 的 active leaf 切换行为不变。

### 完整示例

- [Window 前置内容—RecycleList—后置内容](./examples/external-window.vue)
- [VC Scroller 外部视口](./examples/external-scroller.vue)
- [横向外部视口](./examples/external-horizontal.vue)

## API

### 属性

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| data | 本地数据；按 `batchCount` 分批构建 | `array` | `[]` |
| store | 可选的共享 RecycleListStore | `Store` | - |
| fill | 是否由内部 ScrollerWheel 填满并承载主轴滚动；`false` 时自动使用外部 viewport | `boolean` | `true` |
| disabled | 是否禁止触发远程 `loadData`；不阻止本地 `data` 分批构建 | `boolean` | `false` |
| batchCount | 每次构建/测量的节点批次大小；有 placeholder 时亦作为请求期间预分配的占位节点数 | `number` | `20` |
| bufferCount | 在可见数据索引前后额外渲染的节点数量 | `number` | `0` |
| overscan | 视口上下（横向时左右）额外预渲染距离，单位 px | `number` | `50` |
| threshold | 距离列表加载边缘小于等于该值时触发加载，单位 px | `number` | `100` |
| loadData | 获取更多数据，签名为 `({ current, count }) => response` | `function` | `() => false` |
| cols | 多列数量；不定高时支持瀑布流 | `number` | `1` |
| gutter | 多列间距 | `number` | `0` |
| inverted | 是否倒置 | `boolean` | `false` |
| pullable | 是否启用下拉/横向右拉刷新 | `boolean` | `false` |
| vertical | 是否以 Y 轴为主轴 | `boolean` | `true` |
| scrollerOptions | 内部 ScrollerWheel 配置；external 模式下主轴展开规则优先，交叉轴选项继续生效 | `object` | - |
| renderEmpty | 空数据渲染函数 | `function` | - |
| renderComplete | 加载完成渲染函数 | `function` | - |
| renderLoading | 加载中渲染函数 | `function` | - |
| renderPlaceholder | 占位节点渲染函数 | `function` | - |
| renderRefresh | 刷新状态渲染函数 | `function` | - |

#### loadData 契约

- 参数为 `{ current, count }`。`current` 是第 N 次请求（从 1 开始）；`count` 是当前已加载总条数（含 `data` 传入的本地数据），可作为服务端 offset。
- 可返回 `Array`、`{ data, finished }` 或 falsy（如 `false`）。
- falsy 或无 `data` 表示结束；裸数组视为 `{ data }`。未显式提供 `finished` 时，非空数组表示未结束，空页表示结束。
- 末页刚好满页时，需要再返回一次空数组，或在末页显式返回 `finished: true`。

### 事件

| 事件名 | 说明 | 回调参数 |
| --- | --- | --- |
| scroll | 主轴或交叉轴滚动 | `FakeUIEvent`，target 含 `scrollLeft`、`scrollTop` |
| row-resize | 子元素尺寸变化 | - |

### 方法

| 方法名 | 说明 | 参数 |
| --- | --- | --- |
| reset | 清空列表全部内容并重置数据和滚动位置 | `slient?: boolean` |
| refreshLayout | 强制重新测量并刷新布局 | - |
| scrollTo | 滚动到 wrapper 的绝对坐标 | `number \| { x, y }` |
| scrollToIndex | 定位指定 item | `index: number, offset?: number` |

### Slot

| 名称 | 说明 |
| --- | --- |
| default | 行内容，参数为 `{ row }` |
| placeholder | 未加载数据时的占位内容，如骨架屏 |
| loading | 加载更多提示 |
| complete | 无更多数据提示 |
| empty | 首次加载后无数据提示 |
| refresh | pullable 刷新状态 |
| header | RecycleList 内部头部 |
| footer | RecycleList 内部尾部 |
