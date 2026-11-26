## 时间轴（Timeline）

按时间顺序或倒序展示一组信息，每个节点由内容、标签、节点圆点和轴线组成。

### 何时使用

- 展示操作记录、版本发布、物流进度等按时间排列的信息。
- 需要表示“仍在进行中”的记录时，可使用幽灵节点。

### 基础用法

`label` 设置标签文本，默认显示在内容下方。`inverted` 倒序展示，DOM 顺序同步反转。`tag` 改变外层标签。

:::playground
<!--
<config lang="json5">
{
	views: ['runtime', 'files'],
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="timeline-demo">
		<div class="timeline-demo__row">
			<Switch v-model="isInverted" />
			<span>倒序</span>
		</div>
		<Timeline :inverted="isInverted" tag="section">
			<TimelineItem label="2017-03-10">事件一</TimelineItem>
			<TimelineItem label="2018-05-12">事件二</TimelineItem>
			<TimelineItem label="2020-09-30">事件三</TimelineItem>
		</Timeline>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Switch, Timeline, TimelineItem } from '@deot/vc';

const isInverted = ref(false);
</script>

<style scoped>
.timeline-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.timeline-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}
</style>
```
:::

### 方向与轴线位置

`vertical` 为 `false` 时横向展示。`align` 设置轴线位置：纵向时 `start` 在左、`end` 在右；横向时 `start` 在上、`end` 在下；`center` 居中。`alternate` 使节点在轴线两侧交替展示，此时轴线始终居中，`align` 不生效。

:::playground
<!--
<config lang="json5">
{
	views: ['runtime', 'files'],
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="timeline-demo">
		<div class="timeline-demo__row">
			<Switch v-model="isVertical" />
			<span>纵向</span>
			<Switch v-model="isAlternate" />
			<span>交替</span>
			<RadioGroup v-model="align" :disabled="isAlternate">
				<Radio value="start">start</Radio>
				<Radio value="center">center</Radio>
				<Radio value="end">end</Radio>
			</RadioGroup>
		</div>
		<Timeline :vertical="isVertical" :align="align" :alternate="isAlternate">
			<TimelineItem label="2017-03-10">事件一</TimelineItem>
			<TimelineItem label="2018-05-12">事件二</TimelineItem>
			<TimelineItem label="2020-09-30">事件三</TimelineItem>
			<TimelineItem label="2021-11-11">事件四</TimelineItem>
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
.timeline-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.timeline-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}
</style>
```
:::

### 标签位于轴线另一侧

`opposite` 使标签显示在轴线的另一侧。TimelineItem 也可以单独设置 `opposite`，未设置时继承 Timeline。

:::playground
<!--
<config lang="json5">
{
	views: ['runtime', 'files'],
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="timeline-demo">
		<div class="timeline-demo__row">
			<Switch v-model="isOpposite" />
			<span>另一侧</span>
			<Switch v-model="isAlternate" />
			<span>交替</span>
		</div>
		<Timeline :opposite="isOpposite" :alternate="isAlternate">
			<TimelineItem label="2017-03-10" dot-color="#1DB88C">事件一</TimelineItem>
			<TimelineItem label="2018-05-12" dot-color="#f04134" :opposite="!isOpposite">
				该项单独设置 opposite
			</TimelineItem>
			<TimelineItem label="2020-09-30">事件三</TimelineItem>
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
.timeline-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.timeline-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}
</style>
```
:::

### 幽灵节点

`showPending` 在末尾追加一个幽灵节点，表示记录仍在进行中，与之相连的轴线显示为虚线。`inverted` 开启后幽灵节点移到最前。`pending` 插槽设置内容，`pending-dot` 插槽替换默认的加载图标。

:::playground
<!--
<config lang="json5">
{
	views: ['runtime', 'files'],
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="timeline-demo">
		<div class="timeline-demo__row">
			<Switch v-model="isPendingVisible" />
			<span>幽灵节点</span>
			<Switch v-model="isInverted" />
			<span>倒序</span>
		</div>
		<Timeline :show-pending="isPendingVisible" :inverted="isInverted">
			<TimelineItem label="2017-03-10">事件一</TimelineItem>
			<TimelineItem label="2017-03-11">事件二</TimelineItem>
			<template #pending>进行中</template>
		</Timeline>
		<Timeline show-pending>
			<TimelineItem label="2017-03-10">事件一</TimelineItem>
			<template #pending-dot>
				<span class="timeline-demo__pending-dot" />
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
.timeline-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.timeline-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}

.timeline-demo__pending-dot {
	box-sizing: border-box;
	width: 10px;
	height: 10px;
	border: 2px solid #e6a23c;
	border-radius: 50%;
}
</style>
```
:::

### 自定义节点与轴线

`dotColor`、`dotType` 设置默认圆点的颜色与样式。`dot` 属性或 `dot` 插槽可替换默认圆点，此时 `dotColor`、`dotType` 不生效；自定义节点的尺寸由调用方控制。`lineType`、`lineColor` 设置该节点之后那段轴线的样式与颜色。`label` 插槽优先于 `label` 属性。

:::playground
<!--
<config lang="json5">
{
	views: ['runtime', 'files'],
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="timeline-demo">
		<Timeline>
			<TimelineItem label="dotColor" dot-color="#1DB88C">绿色圆点</TimelineItem>
			<TimelineItem label="dotType" dot-type="hollow">空心圆点</TimelineItem>
			<TimelineItem label="dot 属性" :dot="renderDot">函数渲染的节点</TimelineItem>
			<TimelineItem>
				插槽渲染的节点
				<template #label>
					<strong>dot、label 插槽</strong>
				</template>
				<template #dot>
					<Icon type="warning" class="timeline-demo__warning" />
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

const renderDot = () => h('span', { class: 'timeline-demo__check' }, '✓');
</script>

<style scoped>
.timeline-demo {
	display: flex;
	flex-wrap: wrap;
	gap: 48px;
}

.timeline-demo :deep(.timeline-demo__check) {
	font-size: 12px;
	line-height: 1;
	color: #1DB88C;
}

.timeline-demo__warning {
	font-size: 12px;
	color: #f04134;
}
</style>
```
:::

## 移动端

`MTimeline` 的属性、插槽、结构与 `Timeline` 相同，根节点另有标记类 `.vcm-timeline`，结构样式、颜色与主题参数共用；`MTimelineItem` 即 `TimelineItem`。尺寸按 750 稿设计，与 `MSteps` 纵向圆点一致，写为 `calc(var(--vc-rem) * n)`，随 `--vc-rem` 缩放；底栏切换 `rem` 可查看不同屏宽下的效果。下例依次展示基础用法、节点颜色与自定义节点、幽灵节点、`opposite`、`alternate` 与横向。

:::playground
<!--
<config lang="json5">
{
	mobile: true,
	previewInset: [12, 0],
	previewVariables: [{
		name: '--rem',
		label: 'rem',
		values: ['auto', '0.5px', '0.552px', '0.64px', '1px']
	}]
}
</config>
-->
```vue
<template>
	<div class="m-timeline-demo">
		<MTimeline>
			<MTimelineItem label="09-01 10:00">事件一</MTimelineItem>
			<MTimelineItem label="09-01 18:30">{{ text }}</MTimelineItem>
			<MTimelineItem label="09-02 08:00">事件三</MTimelineItem>
		</MTimeline>
		<MTimeline>
			<MTimelineItem label="09-01" dot-color="var(--vc-color-success)">已完成</MTimelineItem>
			<MTimelineItem label="09-02" dot-type="hollow">空心节点</MTimelineItem>
			<MTimelineItem label="09-03">
				自定义节点
				<template #dot>
					<MIcon type="warning" class="m-timeline-demo__warning" />
				</template>
			</MTimelineItem>
			<MTimelineItem label="09-04" dot-color="var(--vc-color-light-deepest)">未开始</MTimelineItem>
		</MTimeline>
		<MTimeline show-pending>
			<MTimelineItem label="09-01">事件一</MTimelineItem>
			<MTimelineItem label="09-02">事件二</MTimelineItem>
			<template #pending>进行中</template>
		</MTimeline>
		<MTimeline opposite>
			<MTimelineItem label="09-01">事件一</MTimelineItem>
			<MTimelineItem label="09-02">事件二</MTimelineItem>
			<MTimelineItem label="09-03">事件三</MTimelineItem>
		</MTimeline>
		<MTimeline alternate>
			<MTimelineItem label="09-01">事件一</MTimelineItem>
			<MTimelineItem label="09-02">事件二</MTimelineItem>
			<MTimelineItem label="09-03">事件三</MTimelineItem>
		</MTimeline>
		<MTimeline :vertical="false">
			<MTimelineItem label="09-01">事件一</MTimelineItem>
			<MTimelineItem label="09-02">事件二</MTimelineItem>
			<MTimelineItem label="09-03">事件三</MTimelineItem>
		</MTimeline>
	</div>
</template>

<script setup>
import { MIcon, MTimeline, MTimelineItem } from '@deot/vc';

const text = '内容较长时自动换行，与下一项之间保持间距，这里是一段较长的说明文字。';
</script>

<style scoped>
.m-timeline-demo {
	display: flex;
	flex-direction: column;
	gap: calc(var(--vc-rem) * 32);
	padding-inline: calc(var(--vc-rem) * 32);
}

.m-timeline-demo__warning {
	font-size: calc(var(--vc-rem) * 24);
	color: var(--vc-color-error);
}
</style>
```
:::

尺寸如下（括号内为 375 宽下的 px）：

| 项 | 值 |
| --- | --- |
| 内容 | 字号 28（14），行高 1.5 |
| 标签 | 字号 24（12），行高 1.5，与内容间距 4（2） |
| 节点 | 16（8），空心边框 3（1.5）；幽灵节点的 Spin 24（12） |
| 间距 | 内容与轴线 24（12），轴线与节点 8（4） |
| 纵向 | 不设最小高度，内容与下一项间距 50（25） |
| opposite | 标签最大宽度 200（100），横向时预留高度 100（50） |
| 横向居中 | 最小高度 400（200） |

两端的尺寸都写成局部变量 `--vc-timeline-<键>`（见“主题与局部覆盖”），移动端在 `.vcm-timeline` 上覆盖，与样式的加载顺序无关。

## 主题与局部覆盖

全局参数通过 `--vc-<参数>` 配置，组件级覆盖使用 `--vc-timeline-<参数>`。局部参数仅提供组件级入口；可在组件根节点或其祖先上设置。

内嵌或复用的 [spin](../spin/README.md#主题与局部覆盖) 使用各自的主题入口。

### 全局

| 参数 | 使用位置 | 值 |
| --- | --- | --- |
| color-dark-light | 时间轴正文 | 亮色：`#080F20`；暗色：`#E8E8E8` |
| color-dark-extralight | 标签文字 | 亮色：`#909399`；暗色：`#B9B9B9` |
| color-neutral-light | 连接线 | 亮色：`#EDEFF1`；暗色：`#3B4354` |
| color-primary | 节点及自定义节点颜色 | `#456CF6` |
| background-color-lightest | 自定义节点背景 | 亮色：`#FFFFFF`；暗色：`#252B3A` |

### 局部

尺寸写成局部变量 `--vc-timeline-<键>`，桌面端的默认值在括号内，设在 Timeline 根节点上，TimelineItem 继承：

| 键 | 说明 |
| --- | --- |
| font-size | 内容字号（14px） |
| line-height | 内容行高，无单位；节点在首行内垂直居中（1.5715） |
| content-gap | 内容与标签的间距（4px） |
| label-font-size | 标签字号（12px） |
| label-line-height | 标签行高，无单位（1.667） |
| dot-size | 节点尺寸（6px） |
| dot-border | 空心节点的边框（2px） |
| content-spacing | 内容、标签与轴线的间距（16px） |
| line-spacing | 轴线与节点的间距（4px） |
| min-height | 纵向每项的最小高度（78px） |
| spacing | 纵向内容与下一项的间距（0） |
| label-width | opposite 时标签的最大宽度（100px） |
| label-space | 横向 opposite 时为标签预留的高度（50px） |
| center-height | 横向轴线居中时的最小高度（200px） |

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
| label | 标签。字符串按文本渲染，也可传渲染函数或 `{ type, value }`（需要 HTML 时传 `{ type: 'html', value }`），见 [Customer](../customer/README.md)；`label` 插槽优先 | `string \| number \| Function \| { type: string; value: any }` | - | `''` |
| dot | 自定义节点，替代默认圆点；取值与 label 相同，`dot` 插槽优先 | `string \| number \| Function \| { type: string; value: any }` | - | - |
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
- `label`、`dot` 的字符串按文本渲染；需要 HTML 时传 `{ type: 'html', value }`，这类内容只应来自可信来源，或由全局的 `sanitize` 统一清洗，见 [Customer](../customer/README.md)。
- 与幽灵节点相连的那段轴线会被强制设为虚线，覆盖该项的 `lineType`。
- 颜色使用主题变量，可通过 `--vc-timeline-color-primary`（圆点）、`--vc-timeline-color-neutral-light`（轴线）、`--vc-timeline-color-dark-light`（内容）、`--vc-timeline-color-dark-extralight`（标签）、`--vc-timeline-background-color-lightest`（自定义节点的背景，用于遮挡轴线）单独覆盖。
- `MTimeline` 见“移动端”；`MTimelineItem` 即 `TimelineItem`。
