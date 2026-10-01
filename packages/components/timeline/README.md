## 时间轴（Timeline）

按时间顺序或倒序展示一组信息，每个节点由内容、标签、节点圆点和轴线组成。

### 何时使用

- 展示操作记录、版本发布、物流进度等按时间排列的信息。
- 需要表示“仍在进行中”的记录时，可使用幽灵节点。

### 基础用法

`label` 设置标签文本，默认显示在内容下方。`inverted` 倒序展示，DOM 顺序同步反转。

:::playground
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<div>
		<div class="toolbar">
			<span>倒序</span>
			<Switch v-model="isInverted" />
		</div>
		<Timeline :inverted="isInverted">
			<TimelineItem label="2017-03-10">创建项目</TimelineItem>
			<TimelineItem label="2018-05-12">发布第一个版本</TimelineItem>
			<TimelineItem label="2020-09-30">发布第二个版本</TimelineItem>
		</Timeline>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Switch, Timeline, TimelineItem } from '@deot/vc';

const isInverted = ref(false);
</script>

<style scoped>
.toolbar {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 8px;
	margin-bottom: 24px;
}
</style>
```
:::

### 方向与轴线位置

`vertical` 为 `false` 时横向展示。`align` 设置轴线位置：纵向时 `start` 在左、`end` 在右；横向时 `start` 在上、`end` 在下；`center` 居中。`alternate` 使节点在轴线两侧交替展示，此时轴线始终居中，`align` 不生效。

:::playground
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<div>
		<div class="toolbar">
			<label><span>纵向</span><Switch v-model="isVertical" /></label>
			<label><span>交替</span><Switch v-model="isAlternate" /></label>
			<RadioGroup v-model="align" :disabled="isAlternate">
				<Radio value="start">start</Radio>
				<Radio value="center">center</Radio>
				<Radio value="end">end</Radio>
			</RadioGroup>
		</div>
		<Timeline :vertical="isVertical" :align="align" :alternate="isAlternate">
			<TimelineItem label="2017-03-10">创建项目</TimelineItem>
			<TimelineItem label="2018-05-12">发布第一个版本</TimelineItem>
			<TimelineItem label="2020-09-30">发布第二个版本</TimelineItem>
			<TimelineItem label="2021-11-11">发布第三个版本</TimelineItem>
		</Timeline>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Radio, RadioGroup, Switch, Timeline, TimelineItem } from '@deot/vc';

const isVertical = ref(true);
const isAlternate = ref(false);
const align = ref('start');
</script>

<style scoped>
.toolbar {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 24px;
	margin-bottom: 24px;
}
.toolbar label {
	display: inline-flex;
	align-items: center;
	gap: 8px;
}
</style>
```
:::

### 标签位于轴线另一侧

`opposite` 使标签显示在轴线的另一侧。TimelineItem 也可以单独设置 `opposite`，未设置时继承 Timeline。

:::playground
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<div>
		<div class="toolbar">
			<label><span>另一侧</span><Switch v-model="isOpposite" /></label>
			<label><span>交替</span><Switch v-model="isAlternate" /></label>
		</div>
		<Timeline :opposite="isOpposite" :alternate="isAlternate">
			<TimelineItem label="2017-03-10" dot-color="#1DB88C">创建项目</TimelineItem>
			<TimelineItem label="2018-05-12" dot-color="#f04134" :opposite="!isOpposite">
				该项单独设置 opposite
			</TimelineItem>
			<TimelineItem label="2020-09-30">发布第二个版本</TimelineItem>
		</Timeline>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Switch, Timeline, TimelineItem } from '@deot/vc';

const isOpposite = ref(true);
const isAlternate = ref(false);
</script>

<style scoped>
.toolbar {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 24px;
	margin-bottom: 24px;
}
.toolbar label {
	display: inline-flex;
	align-items: center;
	gap: 8px;
}
</style>
```
:::

### 幽灵节点

`showPending` 在末尾追加一个幽灵节点，表示记录仍在进行中，与之相连的轴线显示为虚线。`inverted` 开启后幽灵节点移到最前。`pending` 插槽设置内容，`pending-dot` 插槽替换默认的加载图标。

:::playground
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<div>
		<div class="toolbar">
			<label><span>幽灵节点</span><Switch v-model="isPendingVisible" /></label>
			<label><span>倒序</span><Switch v-model="isInverted" /></label>
		</div>
		<Timeline :show-pending="isPendingVisible" :inverted="isInverted">
			<TimelineItem label="2017-03-10">开始处理</TimelineItem>
			<TimelineItem label="2017-03-11">完成准备</TimelineItem>
			<template #pending>
				处理中
			</template>
		</Timeline>
		<Timeline show-pending class="custom">
			<TimelineItem label="2017-03-10">开始处理</TimelineItem>
			<template #pending-dot>
				<span class="pending-dot" />
			</template>
		</Timeline>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Switch, Timeline, TimelineItem } from '@deot/vc';

const isPendingVisible = ref(true);
const isInverted = ref(false);
</script>

<style scoped>
.toolbar {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 24px;
	margin-bottom: 24px;
}
.toolbar label {
	display: inline-flex;
	align-items: center;
	gap: 8px;
}
.custom {
	margin-top: 24px;
}
.pending-dot {
	width: 10px;
	height: 10px;
	border: 2px solid #e6a23c;
	border-radius: 50%;
	box-sizing: border-box;
}
</style>
```
:::

### 自定义节点与轴线

`dotColor`、`dotType` 设置默认圆点的颜色与样式。`dot` 属性或 `dot` 插槽可替换默认圆点，此时 `dotColor`、`dotType` 不生效；自定义节点的尺寸由调用方控制。`lineType`、`lineColor` 设置该节点之后那段轴线的样式与颜色。

:::playground
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<div class="dot-demo">
		<Timeline>
			<TimelineItem label="dotColor" dot-color="#1DB88C">绿色圆点</TimelineItem>
			<TimelineItem label="dotType" dot-type="hollow">空心圆点</TimelineItem>
			<TimelineItem label="dot 属性" :dot="renderDot">函数渲染的节点</TimelineItem>
			<TimelineItem label="dot 插槽">
				插槽渲染的节点
				<template #dot>
					<Icon type="warning" class="warning" />
				</template>
			</TimelineItem>
		</Timeline>
		<Timeline>
			<TimelineItem label="lineType" line-type="dashed">虚线</TimelineItem>
			<TimelineItem label="lineType" line-type="dotted">点线</TimelineItem>
			<TimelineItem label="lineColor" line-color="#456CF6">轴线颜色</TimelineItem>
			<TimelineItem label="2021-11-11">最后一项不显示轴线</TimelineItem>
		</Timeline>
	</div>
</template>

<script setup>
import { h } from 'vue';
import { Icon, Timeline, TimelineItem } from '@deot/vc';

const renderDot = () => h('span', { class: 'check' }, '✓');
</script>

<style scoped>
.dot-demo {
	display: flex;
	flex-wrap: wrap;
	gap: 48px;
}
.dot-demo :deep(.check) {
	font-size: 12px;
	line-height: 1;
	color: #1DB88C;
}
.warning {
	font-size: 12px;
	color: #f04134;
}
</style>
```
:::

## API

### Timeline 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| vertical | 是否纵向展示 | `boolean` | - | `true` |
| align | 轴线位置。纵向时 `start` 在左、`end` 在右；横向时 `start` 在上、`end` 在下 | `string` | `start` / `center` / `end` | `start` |
| alternate | 节点在轴线两侧交替展示，按最终显示顺序排列；第 1 项的轴线位于内容左侧（纵向）或上方（横向）；开启后轴线居中，`align` 不生效 | `boolean` | - | `false` |
| opposite | 标签显示在轴线另一侧；为 `false` 时标签位于内容下方 | `boolean` | - | `false` |
| inverted | 倒序展示，幽灵节点一并参与，DOM 顺序同步反转 | `boolean` | - | `false` |
| showPending | 在末尾追加幽灵节点，与之相连的轴线显示为虚线；默认节点为加载图标，内容为空 | `boolean` | - | `false` |
| tag | 外层标签 | `string` | - | `'div'` |

### Timeline 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 放置 TimelineItem | - |
| pending | 幽灵节点的内容 | - |
| pending-dot | 幽灵节点的节点，默认为 12px 的 Spin | - |

### TimelineItem 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| label | 标签；字符串按 HTML 渲染，函数通过 `Customer` 渲染 | `string \| Function` | - | `''` |
| dot | 自定义节点，替代默认圆点；字符串按 HTML 渲染，函数通过 `Customer` 渲染 | `string \| Function` | - | - |
| dotColor | 默认圆点的颜色；实心时为背景色，空心时为边框色 | `string` | - | - |
| dotType | 默认圆点的样式 | `string` | `solid` / `hollow` | `solid` |
| lineColor | 该节点之后那段轴线的颜色 | `string` | - | - |
| lineType | 该节点之后那段轴线的样式 | `string` | `solid` / `dashed` / `dotted` | `solid` |
| opposite | 单独设置标签是否显示在轴线另一侧，未设置时继承 Timeline | `boolean` | - | `undefined` |

### TimelineItem 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 节点内容 | - |
| label | 标签，优先于 `label` 属性 | - |
| dot | 自定义节点，优先于 `dot` 属性 | - |

### 使用注意

- Timeline 的默认插槽只渲染 TimelineItem（包括 `v-for`、`<template>` 中的 TimelineItem），其他节点会被忽略；被其他组件包裹的 TimelineItem 也不会渲染。
- `label`、`dot` 为字符串时按 HTML 渲染，不要传入未经处理的用户输入。
- 与幽灵节点相连的那段轴线会被强制设为虚线，覆盖该项的 `lineType`。
- 颜色使用主题变量，可通过 `--vc-timeline-color-primary`（圆点）、`--vc-timeline-color-light-deeper`（轴线）、`--vc-timeline-color-dark-light`（内容）、`--vc-timeline-color-dark-extralight`（标签）、`--vc-timeline-background-color-light`（自定义节点的背景，用于遮挡轴线）单独覆盖。
- `MTimeline`、`MTimelineItem` 分别是 `Timeline`、`TimelineItem` 的别名，使用同一实现与样式，可从 `@deot/vc` 导入。
