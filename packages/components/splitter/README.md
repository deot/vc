## 分割面板（Splitter）

把区域分成多个面板，拖动面板之间的分隔条调整相邻两个面板的尺寸；支持上下排列、嵌套、折叠、键盘操作，以及松开后再应用尺寸的延迟模式。

### 何时使用

- 可调宽度的侧栏、目录、属性面板等布局。
- 左右 / 上下对照的工作区（编辑与预览、列表与详情、内容与输出）。
- 只需要监听容器尺寸、把宽高交给内容时，用 [Resizer](../resizer/README.md)；Splitter 用于让用户拖动调整尺寸。

### 基础用法

`SplitterPanel` 的 `size` 为数字时是 px，字符串可带 `%`；不设的面板分剩余空间。拖动只改分隔条两侧的面板，`min` / `max` 限制拖动范围，格式同 `size`。

:::playground
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<p>size：{{ size }}</p>
	<div class="splitter-demo">
		<Splitter>
			<SplitterPanel v-model:size="size" :min="120" :max="360">
				<div class="cell">面板 A · min 120 · max 360</div>
			</SplitterPanel>
			<SplitterPanel>
				<div class="cell">面板 B</div>
			</SplitterPanel>
			<SplitterPanel size="25%" min="10%">
				<div class="cell">面板 C · 25%</div>
			</SplitterPanel>
		</Splitter>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Splitter, SplitterPanel } from '@deot/vc';

const size = ref(200);
</script>

<style scoped>
.splitter-demo {
	height: 160px;
	border: 1px solid var(--vc-color-neutral-light);
}

.cell {
	padding: 16px 12px;
	text-align: center;
}
</style>
```
:::

### 尺寸与单位

单位决定容器尺寸变化时面板怎么伸缩：

| size | 容器变化时 | v-model 回写 |
| --- | --- | --- |
| 数字（px） | 保持像素，适合侧栏 | 数字（px） |
| `'N%'` | 按容器扣除分隔条后的尺寸等比缩放 | `'N%'` |
| 不设 | 与其他未设的面板按当前比例分剩余空间 | `'N%'` |

- 拖动中直接改面板的样式，面板内容不随每次移动重新渲染；松开后面板仍按原来的单位记录新尺寸，绑定了 `v-model:size` 时同时回写，数值保留两位小数。需要拖动中的实时尺寸时监听 `resize`。
- 只传 `size` 而不绑定 `v-model` 时，拖动结果保留在组件内；`size` 变为其他值时以新值为准。
- `min` / `max` 也写在面板的 `min-width` / `max-width`（上下排列时为高度）上，容器缩小时同样生效。
- 两侧限制冲突时 `min` 优先：前一个面板的下限取自身 `min` 与“后一个面板 `max` 留下的空间”中较大的一个，上限同理。

### 上下排列

`vertical` 让面板上下排列，分隔条为横线。

:::playground
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<div class="splitter-demo">
		<Splitter vertical>
			<SplitterPanel size="40%" :min="60">
				<div class="cell">面板 A</div>
			</SplitterPanel>
			<SplitterPanel :min="60">
				<div class="cell">面板 B</div>
			</SplitterPanel>
		</Splitter>
	</div>
</template>

<script setup>
import { Splitter, SplitterPanel } from '@deot/vc';
</script>

<style scoped>
.splitter-demo {
	height: 240px;
	border: 1px solid var(--vc-color-neutral-light);
}

.cell {
	padding: 16px 12px;
	text-align: center;
}
</style>
```
:::

### 折叠

`collapsible` 的面板可折叠到 0，此时不受 `min` 限制：

- 点分隔条上的箭头折叠；再点一次恢复折叠前的尺寸（初始就是 0 的面板展开到 `min`，没有 `min` 时与相邻面板平分）。
- 拖动越过 `min` 的一半时吸附折叠；从折叠状态拖出时直接到 `min`。
- `true` 时两侧的分隔条上都有按钮；`{ start: true }` 只在前一条，`{ end: true }` 只在后一条。
- `resizable` 为 `false` 的面板不能拖动，但仍可以折叠。

折叠或展开时触发 `collapse-change`；按钮折叠不触发 `resize-*`。

:::playground
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<p>{{ log || '点击分隔条上的箭头' }}</p>
	<div class="splitter-demo">
		<Splitter @collapse-change="handleChange">
			<SplitterPanel :size="200" :min="120" collapsible>
				<div class="cell">面板 A · collapsible</div>
			</SplitterPanel>
			<SplitterPanel>
				<div class="cell">面板 B</div>
			</SplitterPanel>
			<SplitterPanel :size="160" :min="100" :collapsible="{ start: true }">
				<div class="cell">面板 C · start</div>
			</SplitterPanel>
		</Splitter>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Splitter, SplitterPanel } from '@deot/vc';

const log = ref('');
const handleChange = ({ index, collapsed }) => {
	log.value = `面板 ${index} ${collapsed ? '折叠' : '展开'}`;
};
</script>

<style scoped>
.splitter-demo {
	height: 160px;
	border: 1px solid var(--vc-color-neutral-light);
}

.cell {
	padding: 16px 12px;
	text-align: center;
}
</style>
```
:::

### 延迟应用

`lazy` 时拖动只移动一条预览线，面板在松开后才改变尺寸。面板里是图表、编辑器等重新布局开销较大的内容时使用。拖动中仍触发 `resize`，参数为松开后将要应用的尺寸；手势被打断时什么都不应用。

:::playground
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<div class="splitter-demo">
		<Splitter lazy>
			<SplitterPanel size="40%" :min="120">
				<div class="cell">面板 A</div>
			</SplitterPanel>
			<SplitterPanel :min="120">
				<div class="cell">面板 B</div>
			</SplitterPanel>
		</Splitter>
	</div>
</template>

<script setup>
import { Splitter, SplitterPanel } from '@deot/vc';
</script>

<style scoped>
.splitter-demo {
	height: 160px;
	border: 1px solid var(--vc-color-neutral-light);
}

.cell {
	padding: 16px 12px;
	text-align: center;
}
</style>
```
:::

### 滚动、嵌套与占满高度

面板内容默认放在内置的 [Scroller](../scroller/README.md)（`native: false`）里滚动：滚动条悬浮在内容上，不占宽度，拖动挤压面板时不会闪出浏览器滚动条。`scrollerOptions` 传给这个 Scroller。

内容在 Scroller 里时，`height: 100%` 无法占满面板。嵌套 Splitter、图表、编辑器等需要占满面板的内容，给面板设 `:scrollable="false"`：面板不再滚动（溢出隐藏），内容可用 `height: 100%`，并自行处理溢出。

:::playground
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<div class="splitter-demo">
		<Splitter>
			<SplitterPanel :size="180" :min="120" collapsible>
				<p v-for="i in 20" :key="i" class="row">列表项 {{ i }}</p>
			</SplitterPanel>
			<SplitterPanel :scrollable="false">
				<Splitter vertical>
					<SplitterPanel :min="60">
						<p v-for="i in 20" :key="i" class="row">第 {{ i }} 行内容</p>
					</SplitterPanel>
					<SplitterPanel size="35%" :min="40" collapsible>
						<p v-for="i in 10" :key="i" class="row">输出 {{ i }}</p>
					</SplitterPanel>
				</Splitter>
			</SplitterPanel>
		</Splitter>
	</div>
</template>

<script setup>
import { Splitter, SplitterPanel } from '@deot/vc';
</script>

<style scoped>
.splitter-demo {
	height: 280px;
	border: 1px solid var(--vc-color-neutral-light);
}

.row {
	margin: 0;
	padding: 4px 12px;
	white-space: nowrap;
}
</style>
```
:::

### 自定义分隔条

`--vc-splitter-bar-size` 调整分隔条占位的厚度（`%` 尺寸会自动扣除），`#handle` 插槽替换中间的把手，参数为 `{ index, vertical, dragging }`。插槽内容居中放在分隔条上，外观由内容决定。

:::playground
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<div class="splitter-demo">
		<Splitter class="thick-splitter">
			<SplitterPanel :min="80">
				<div class="cell">面板 A</div>
			</SplitterPanel>
			<SplitterPanel :min="80">
				<div class="cell">面板 B</div>
			</SplitterPanel>
			<template #handle="{ dragging }">
				<span class="thick-splitter__handle" :class="{ 'is-dragging': dragging }">
					<Icon type="drag" />
				</span>
			</template>
		</Splitter>
	</div>
</template>

<script setup>
import { Splitter, SplitterPanel, Icon } from '@deot/vc';
</script>

<style scoped>
.splitter-demo {
	height: 160px;
	border: 1px solid var(--vc-color-neutral-light);
}

.thick-splitter {
	--vc-splitter-bar-size: 8px;
}

.thick-splitter__handle {
	display: flex;
	font-size: 12px;
	color: var(--vc-color-dark-lightest);
	transform: rotate(90deg);
}

.thick-splitter__handle.is-dragging {
	color: #fff;
}

.cell {
	padding: 16px 12px;
	text-align: center;
}
</style>
```
:::

## 键盘与无障碍

分隔条的 `role` 为 `separator`，`aria-valuenow` 为前一个面板占可分配尺寸的百分比（0–100），`aria-controls` 指向前一个面板（面板没有 `id` 时自动生成）。可拖动或可折叠的分隔条可以获得焦点：

| 按键 | 作用 |
| --- | --- |
| ← / →（上下排列时 ↑ / ↓） | 前一个面板缩小 / 增大 10px |
| Home / End | 前一个面板到下限 / 上限 |
| Enter | 有折叠的面板时展开它，否则折叠可折叠的一侧 |

方向键与 Home / End 每按一次依次触发 `resize-start`、`resize`、`resize-end`；键盘不会吸附折叠，折叠用 Enter。

## 主题与局部覆盖

全局参数通过 `--vc-<参数>` 配置，单个组件通过 `--vc-splitter-<参数>` 覆盖。

### 全局

| 参数 | 使用位置 | 值 |
| --- | --- | --- |
| color-neutral-light | 分隔线、折叠按钮边框 | 亮色：`#EDEFF1`；暗色：`#3B4354` |
| foreground-color-inactive | 把手 | 亮色：`#C0C4CC`；暗色：`#737D8C` |
| color-primary | 悬停、聚焦、拖动中的分隔线与把手，lazy 的预览线 | `#456CF6` |
| background-color-lightest | 折叠按钮背景 | 亮色：`#FFFFFF`；暗色：`#252B3A` |
| foreground-color-light | 折叠按钮图标 | 亮色：`#667383`；暗色：`#C9C9C9` |

### 局部

| 参数 | 使用位置 | 默认值 |
| --- | --- | --- |
| bar-size | 分隔条占位的厚度 | `1px` |
| hit-size | 分隔条可按住的厚度，不改变布局（触屏上为 `24px`） | `8px` |
| handle-size | 默认把手的长度 | `24px` |
| collapse-size | 折叠按钮的边长 | `16px` |

## 移动端

移动端入口导出 `MSplitter`、`MSplitterPanel`，就是 `Splitter`、`SplitterPanel`：拖动同时支持鼠标与触摸，触屏上分隔条可按住的厚度为 `24px`。

## API

### Splitter 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| vertical | 面板上下排列 | `boolean` | - | `false` |
| lazy | 拖动时只移动预览线，松开后再应用尺寸 | `boolean` | - | `false` |
| tag | 根元素标签 | `string` | - | `'div'` |

### Splitter 事件

| 事件名 | 说明 | 回调参数 |
| --- | --- | --- |
| resize-start | 开始拖动，或按下调整尺寸的按键 | `{ index, sizes }` |
| resize | 尺寸变化中；`lazy` 时为松开后将要应用的尺寸 | `{ index, sizes }` |
| resize-end | 松开、手势被打断（恢复为拖动前的尺寸）或按键调整完成 | `{ index, sizes }` |
| collapse-change | 面板折叠或展开（按钮、拖动吸附、Enter） | `{ index, collapsed, sizes }` |

`resize-*` 的 `index` 为分隔条序号（等于它前一个面板的下标），`collapse-change` 的 `index` 为面板下标；`sizes` 为各面板的尺寸（px）。

### Splitter 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 放置 SplitterPanel | - |
| handle | 替换分隔条中间的把手 | `{ index, vertical, dragging }` |

### SplitterPanel 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| size | 尺寸，支持 `v-model:size`；数字为 px，字符串可带 `%`；不设时分剩余空间 | `number \| string` | - | - |
| min | 下限，格式同 `size` | `number \| string` | - | - |
| max | 上限，格式同 `size` | `number \| string` | - | - |
| resizable | 为 `false` 时两侧的分隔条不可拖动 | `boolean` | - | `true` |
| collapsible | 可折叠到 0；对象指定按钮出现在前一条（`start`）/ 后一条（`end`）分隔条上 | `boolean \| { start?, end? }` | - | `false` |
| scrollable | 内容由内置的 Scroller 滚动；为 `false` 时面板不滚动，内容可用 `height: 100%` 占满 | `boolean` | - | `true` |
| scrollerOptions | 内置 Scroller 的属性 | `Partial<ScrollerProps>` | - | - |

### SplitterPanel 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 面板内容 | - |

### 使用注意

- Splitter 默认宽高均为 `100%`，父容器应有可确定的尺寸。
- 默认插槽只渲染 SplitterPanel（包括 `v-for`、`<template>` 中的），其他节点会被忽略；被其他组件包裹的 SplitterPanel 也不会渲染。面板数量会变化时，给 SplitterPanel 加 `key`，尺寸状态按 `key` 对应。
- 面板的 `class`、`style` 会保留，但 `flex` 与 `min-*` / `max-*` 由 Splitter 计算后写入。
- 拖动中根节点带 `is-dragging`，面板内不选中文字，iframe 等不会吞掉指针事件；折叠的面板带 `is-collapsed`。
