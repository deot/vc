## 步骤条（Steps）

引导用户按流程完成任务的导航条，展示当前所处的步骤以及前后步骤的状态。

### 何时使用

- 任务较复杂或存在先后关系时，将其拆分为一系列步骤。
- 需要展示流程进度，或允许用户在步骤之间切换。

### 基础用法

`v-model` 绑定当前步数，从 1 开始：之前的步骤为 `success`，当前步为 `pending`，之后的步骤为 `default`。`0` 表示都未开始，步骤数加 1 表示全部完成。`description` 设置步骤的描述；`title`、`description` 插槽优先于同名属性。

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
	<div class="steps-demo">
		<Steps v-model="current">
			<Step title="第一步" description="步骤一的描述" />
			<Step title="第二步" description="步骤二的描述" />
			<Step>
				<template #title>第三步（插槽）</template>
				<template #description>步骤三的描述</template>
			</Step>
		</Steps>
		<div class="steps-demo__row">
			<Button :disabled="current <= 0" @click="handlePrevious">上一步</Button>
			<Button :disabled="current >= 4" @click="handleNext">下一步</Button>
		</div>
		<p class="steps-demo__result">当前步数：{{ current }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, Steps, Step } from '@deot/vc';

const current = ref(2);

const handlePrevious = () => {
	current.value--;
};

const handleNext = () => {
	current.value++;
};
</script>

<style scoped>
.steps-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.steps-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}

.steps-demo__result {
	margin: 0;
}
</style>
```
:::

### 步骤状态

Steps 的 `status` 只作用于当前步，默认为 `pending`；设为 `error` 时，前一步的连线同时变为错误色。Step 单独设置的 `status` 优先于推导结果。`lineless` 隐藏连线。

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
	<div class="steps-demo">
		<Steps :model-value="2" status="error">
			<Step title="步骤一" description="已完成" />
			<Step title="步骤二" description="处理失败" />
			<Step title="步骤三" description="等待中" />
		</Steps>
		<Steps :model-value="2">
			<Step title="步骤一" />
			<Step title="步骤二" />
			<Step title="步骤三" status="error" />
			<Step title="步骤四" status="success" />
		</Steps>
		<Steps :model-value="2" lineless>
			<Step title="步骤一" />
			<Step title="步骤二" />
			<Step title="步骤三" />
		</Steps>
	</div>
</template>

<script setup>
import { Steps, Step } from '@deot/vc';
</script>

<style scoped>
.steps-demo {
	display: flex;
	flex-direction: column;
	gap: 32px;
}
</style>
```
:::

### 标题位置与方向

`labelPosition` 设置标题与描述相对节点的位置，默认在右侧。`vertical` 为 `true` 时纵向展示，此时只支持 `right` / `left`（`bottom` 视为 `right`，`top` 视为 `left`）。

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
	<div class="steps-demo">
		<div class="steps-demo__row">
			<Switch v-model="isVertical" />
			<span>纵向</span>
			<RadioGroup v-model="labelPosition">
				<Radio value="right">right</Radio>
				<Radio value="bottom">bottom</Radio>
				<Radio value="left">left</Radio>
				<Radio value="top">top</Radio>
			</RadioGroup>
		</div>
		<Steps :model-value="2" :vertical="isVertical" :label-position="labelPosition">
			<Step title="第一步" description="步骤一的描述" />
			<Step title="第二步" description="步骤二的描述" />
			<Step title="第三步" description="步骤三的描述" />
		</Steps>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Radio, RadioGroup, Switch, Steps, Step } from '@deot/vc';

const isVertical = ref(false);
const labelPosition = ref('right');
</script>

<style scoped>
.steps-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.steps-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}
</style>
```
:::

### 点击切换

`clickable` 开启后，点击步骤会更新 `v-model` 并触发 `change`。点击当前步或设置了 `disabled` 的步骤不会触发。可点击的步骤能用 Tab 聚焦，按 Enter / Space 切换；当前步带 `aria-current="step"`。悬停高亮只在可悬停的设备上生效，触屏点按后不会残留。

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
	<div class="steps-demo">
		<Steps v-model="current" clickable @change="handleChange">
			<Step title="第一步" description="步骤一的描述" />
			<Step title="第二步" description="步骤二的描述" />
			<Step title="第三步" description="不可跳转" disabled />
			<Step title="第四步" description="步骤四的描述" />
		</Steps>
		<p class="steps-demo__result">change：{{ log.join('、') || '-' }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Steps, Step } from '@deot/vc';

const current = ref(1);
const log = ref([]);

const handleChange = (value) => {
	log.value.push(value);
};
</script>

<style scoped>
.steps-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.steps-demo__result {
	margin: 0;
}
</style>
```
:::

### 圆点

`type="dot"` 使用圆点作为节点。横向时文字在圆点下方，`labelPosition` 为 `top` / `left` 时在上方；纵向时文字在右侧，`labelPosition` 为 `left` / `top` 时在左侧。

`renderDot` 自定义节点，参数中的 `dot` 为默认节点，可以包裹后返回；`dot` 插槽的参数相同，并优先于 `renderDot`。两者对 `type="arrow"` 以外的类型均有效。

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
	<div class="steps-demo">
		<Steps :model-value="2" type="dot" :render-dot="renderDot">
			<Step title="第一步" description="悬停圆点查看提示" />
			<Step title="第二步" description="步骤二的描述" />
			<Step title="第三步" description="步骤三的描述" />
		</Steps>
		<Steps :model-value="2" type="dot" vertical>
			<Step title="第一步" description="步骤一的描述" />
			<Step title="第二步" description="步骤二的描述" />
			<Step title="第三步" description="步骤三的描述" />
		</Steps>
		<Steps :model-value="2">
			<Step title="第一步" />
			<Step title="搜索" />
			<Step title="第三步" />
			<template #dot="{ index, dot }">
				<Icon v-if="index === 2" type="search" class="steps-demo__icon" />
				<component :is="dot" v-else />
			</template>
		</Steps>
	</div>
</template>

<script setup>
import { h } from 'vue';
import { Icon, Popover, Steps, Step } from '@deot/vc';

const renderDot = ({ index, status, dot }) => {
	return h(Popover, { content: `第 ${index} 步：${status}`, placement: 'top' }, () => dot);
};
</script>

<style scoped>
.steps-demo {
	display: flex;
	flex-direction: column;
	gap: 32px;
}

.steps-demo__icon {
	width: 28px;
	font-size: 20px;
	line-height: 28px;
	color: var(--vc-steps-color-primary, var(--vc-color-primary));
	text-align: center;
}
</style>
```
:::

### 箭头与导航

`type="arrow"` 为箭头样式，没有节点；`type="navigation"` 为导航样式，当前步下方显示指示条。两者只支持横向，`navigation` 的文字固定在节点右侧。`tag` 改变外层标签，导航样式可渲染为 `nav`。

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
	<div class="steps-demo">
		<Steps v-model="current" type="arrow" clickable>
			<Step title="第一步" description="步骤一的描述" />
			<Step title="第二步" description="步骤二的描述" />
			<Step title="第三步" description="步骤三的描述" />
		</Steps>
		<Steps v-model="current" type="navigation" tag="nav" clickable>
			<Step title="第一步" />
			<Step title="第二步" />
			<Step title="第三步" />
		</Steps>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Steps, Step } from '@deot/vc';

const current = ref(2);
</script>

<style scoped>
.steps-demo {
	display: flex;
	flex-direction: column;
	gap: 32px;
}
</style>
```
:::

## 移动端

`MSteps` 的属性、事件、插槽、结构与 `Steps` 相同，根节点另有标记类 `.vcm-steps`，结构样式、颜色与主题参数共用；`MStep` 即 `Step`。`labelPosition` 默认为 `bottom`：手机宽度下标题在节点右侧会被挤窄。尺寸按 750 稿设计，写为 `calc(var(--vc-rem) * n)`，随 `--vc-rem` 缩放；底栏切换 `rem` 可查看不同屏宽下的效果。下例依次展示可点按切换、失败状态、圆点、纵向、`labelPosition="right"` 与箭头样式。

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
	<div class="m-steps-demo">
		<MSteps v-model="current" clickable>
			<MStep title="已完成" />
			<MStep title="进行中" />
			<MStep title="未开始" />
		</MSteps>
		<div class="m-steps-demo__row">
			<MButton size="small" :disabled="current <= 0" @click="handlePrevious">上一步</MButton>
			<MButton size="small" :disabled="current >= 4" @click="handleNext">下一步</MButton>
			<span class="m-steps-demo__result">当前：{{ current }}</span>
		</div>
		<MSteps :model-value="2" status="error">
			<MStep title="第一步" description="描述一" />
			<MStep title="第二步失败" description="描述二" />
			<MStep title="第三步" description="等待中" />
		</MSteps>
		<MSteps v-model="current" type="dot">
			<MStep title="已完成" description="描述文字" />
			<MStep title="进行中" description="描述文字" />
			<MStep title="未开始" description="描述文字" />
		</MSteps>
		<MSteps :model-value="2" vertical>
			<MStep title="第一步" description="描述一" />
			<MStep title="第二步" :description="text" />
			<MStep title="第三步" description="描述三" />
		</MSteps>
		<MSteps :model-value="2" vertical type="dot">
			<MStep title="第一步" description="描述一" />
			<MStep title="第二步" :description="text" />
			<MStep title="第三步" description="描述三" />
		</MSteps>
		<MSteps :model-value="2" label-position="right">
			<MStep title="已完成" />
			<MStep title="进行中的步骤" />
			<MStep title="未开始" />
		</MSteps>
		<MSteps :model-value="2" type="arrow">
			<MStep title="已完成" />
			<MStep title="进行中" />
			<MStep title="未开始" />
		</MSteps>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MButton, MSteps, MStep } from '@deot/vc';

const text = '内容较长时自动换行，与下一步之间保持间距，这里是一段较长的描述文字。';
const current = ref(2);

const handlePrevious = () => {
	current.value--;
};

const handleNext = () => {
	current.value++;
};
</script>

<style scoped>
.m-steps-demo {
	display: flex;
	flex-direction: column;
	gap: calc(var(--vc-rem) * 32);
	padding-inline: calc(var(--vc-rem) * 32);
}

.m-steps-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: calc(var(--vc-rem) * 16);
}

.m-steps-demo__result {
	font-size: calc(var(--vc-rem) * 24);
	color: var(--vc-color-dark-extralight);
}
</style>
```
:::

尺寸如下（括号内为 375 宽下的 px）：

| 项 | 值 |
| --- | --- |
| 根节点 | 字号 28（14） |
| 节点 | 36（18），序号字号 24（12），成功 / 失败图标 20（10） |
| 标题 | 字号 28（14），行高同节点 36（18） |
| 描述 | 字号 24（12），与标题间距 4（2） |
| 间距 | 节点与标题 24（12）；连线与节点 18（9）；文字在节点下方时与节点 10（5） |
| 纵向 | 不设最小高度，内容与下一步间距 50（25），连线与节点间距 10（5） |
| 圆点 | 16（8），边框 3（1.5），当前步不放大 |
| `arrow` | 每步高 96（48），左内边距 24（12） |

与桌面端的差异：

- 标题颜色随状态：当前步为主色（`color-primary`），失败步为错误色（`color-error`），未开始与描述同为 `color-dark-extralight`；`arrow` 的底色上仍为对比文字色。
- 圆点：未开始为灰色空心环（`color-light-deepest`），已完成为主色空心环，当前步与失败步为实心；当前步靠实心区分，不放大。
- 可点击的步骤去掉系统的点击高亮。

两端的尺寸都写成局部变量 `--vc-steps-<键>`（见“主题与局部覆盖”），移动端在 `.vcm-steps` 上覆盖，与样式的加载顺序无关。

## 主题与局部覆盖

全局参数通过 `--vc-<参数>` 配置，单个组件通过 `--vc-steps-<参数>` 覆盖。同一参数可能作用于多个状态；多命名空间时在使用位置中标明。

当前及错误步骤的标记文字、`arrow` 模式下 pending/error 状态的标题和描述使用可覆盖的 `color-contrast-light`，悬停时保持该对比文字色。内部 --vc-step-line-color 由步骤状态写入，使用现有对应状态色。

### 全局

| 参数 | 使用位置 | 值 |
| --- | --- | --- |
| color-contrast-light | 当前及错误步骤标记文字、arrow 的 pending/error 标题和描述（含悬停） | `#FFFFFF`（亮暗主题相同） |
| color-dark-light | 步骤标题 | 亮色：`#080F20`；暗色：`#E8E8E8` |
| color-dark-lighter | 未激活图标和标题 | 亮色：`#515151`；暗色：`#D9D9D9` |
| color-dark-extralight | 步骤描述；移动端未开始步骤的标题 | 亮色：`#909399`；暗色：`#B9B9B9` |
| color-error | 错误步骤及错误连接线；移动端失败步骤的标题 | `#F53F3F` |
| color-light-deepest | 默认点（移动端为空心环）及导航箭头 | 亮色：`#C0C4CC`；暗色：`#E8E8E8` |
| color-neutral-light | 默认连接线 | 亮色：`#EDEFF1`；暗色：`#3B4354` |
| color-primary | 当前、完成步骤及已完成连接线；可点击步骤悬停文字（arrow 的 pending/error 除外）；移动端当前步骤的标题 | `#456CF6` |
| color-primary-lighter | 完成步骤背景 | `rgba(45, 140, 240, 0.2)` |
| background-color | 未激活步骤背景 | 亮色：`#F5F6FA`；暗色：`#252B3A` |
| background-color-lightest | 箭头及导航步骤间隔背景 | 亮色：`#FFFFFF`；暗色：`#252B3A` |

### 局部

尺寸写成局部变量 `--vc-steps-<键>`，桌面端的默认值为 px（括号内），设在 Steps 根节点上，Step 继承：

| 键 | 说明 |
| --- | --- |
| font-size | 根节点字号（14px） |
| icon-size | 节点尺寸，标题在右侧 / 纵向时也是标题行高（28px） |
| icon-font-size | 序号字号（16px） |
| status-icon-size | 成功 / 失败图标字号（10px） |
| gap | 节点与标题、项与项之间的间距（12px） |
| line-gap | 标题在下方 / 上方时，连线与两端节点的间距（12px） |
| label-gap | 标题在下方 / 上方时，文字与节点的间距（2px） |
| title-font-size | 标题字号（16px） |
| description-font-size | 描述字号（12px） |
| description-gap | 描述与标题的间距（2px） |
| description-width | 标题在右侧 / 左侧时描述的最大宽度（140px） |
| vertical-min-height | 纵向时每步的最小高度（90px） |
| vertical-spacing | 纵向时内容与下一步的最小间距（12px） |
| vertical-line-gap | 纵向时连线与两端节点的间距（6px） |
| dot-size / dot-active-size | 圆点 / 当前步圆点的尺寸（8px / 10px） |
| dot-gap | 圆点与连线、标题与描述的间距（4px） |
| dot-spacing | 横向圆点在文字下方时，文字与圆点的间距（17px） |
| dot-vertical-top / dot-vertical-spacing | 纵向圆点的上边距 / 与文字的间距（8px / 16px） |
| arrow-height / arrow-padding | `arrow` 每步的高度 / 左内边距（72px / 16px） |

连线保持 1px，不随 `--vc-rem` 缩放。

## API

### Steps 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| modelValue | 当前步数，从 1 开始；`0` 表示都未开始，步骤数加 1 表示全部完成 | `number` | - | `1` |
| vertical | 是否纵向展示；`arrow`、`navigation` 不支持 | `boolean` | - | `false` |
| labelPosition | 标题与描述相对节点的位置，实际位置见“使用注意” | `string` | `right` / `bottom` / `left` / `top` | `right` |
| type | 步骤条类型 | `string` | `default` / `dot` / `arrow` / `navigation` | `default` |
| status | 当前步的状态 | `string` | `default` / `pending` / `success` / `error` | `pending` |
| lineless | 隐藏连线 | `boolean` | - | `false` |
| clickable | 点击步骤切换当前步数 | `boolean` | - | `false` |
| renderDot | 自定义节点；`type="arrow"` 时不生效 | `(options) => VNodeChild` | - | - |
| tag | 外层标签 | `string` | - | `'div'` |

`renderDot` 与 `dot` 插槽的参数 `options`：

| 字段 | 说明 | 类型 |
| --- | --- | --- |
| index | 步数，从 1 开始 | `number` |
| status | 该步的状态 | `string` |
| title | Step 的 `title` 属性 | `string \| number \| Function \| { type: string; value: any }` |
| description | Step 的 `description` 属性 | `string \| number \| Function \| { type: string; value: any }` |
| dot | 默认节点，可包裹后返回 | `VNode` |

### Steps 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| update:modelValue | 开启 `clickable` 后点击步骤时更新绑定值 | `value: number` | 点击的步数 |
| change | 开启 `clickable` 后点击步骤时触发 | `value: number` | 同上；外部赋值不触发 |

### Steps 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 放置 Step | - |
| dot | 自定义节点，优先于 `renderDot`；`type="arrow"` 时不生效 | `options`，同 `renderDot` |

### Step 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| title | 标题。字符串按文本渲染，也可传渲染函数或 `{ type, value }`（需要 HTML 时传 `{ type: 'html', value }`），见 [Customer](../customer/README.md)；`title` 插槽优先 | `string \| number \| Function \| { type: string; value: any }` | - | `''` |
| description | 描述，为空时不渲染；取值与 title 相同，`description` 插槽优先 | `string \| number \| Function \| { type: string; value: any }` | - | `''` |
| status | 该步的状态，优先于根据当前步数推导的结果 | `string` | `default` / `pending` / `success` / `error` | - |
| disabled | 开启 `clickable` 时不可点击 | `boolean` | - | `false` |

### Step 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| title | 标题，优先于 `title` 属性 | - |
| description | 描述，优先于 `description` 属性 | - |

### 使用注意

- `labelPosition` 的实际位置：
  - `default` 横向：四种位置都支持。
  - 纵向（`default`、`dot`）：只支持 `right` / `left`，`bottom` 视为 `right`，`top` 视为 `left`。
  - `dot` 横向：只支持 `bottom` / `top`，`right` 视为 `bottom`，`left` 视为 `top`。
  - `navigation` 的文字固定在节点右侧，`arrow` 没有节点，两者都忽略该属性。
- 标题在节点下方 / 上方时，各步等分宽度，节点与文字居中，连线连接相邻两个节点；容器较窄时文字换行，不会溢出。
- 标题在节点右侧 / 左侧（横向）以及 `navigation` 时，标题放不下会显示省略号；最后一步按内容宽度，容器放不下时也随之收缩。
- 纵向时，内容超过每步的最小高度（90px）后，与下一步之间仍保留 12px 的间距。
- 某一步的最终状态为 `error` 时（包括 Step 单独设置），前一步的连线显示为错误色；已完成步骤的连线为主色。
- Steps 的默认插槽只渲染 Step（包括 `v-for`、`<template>` 中的 Step），其他节点会被忽略；被其他组件包裹的 Step 也不会渲染。
- `title`、`description` 的字符串按文本渲染；需要 HTML 时传 `{ type: 'html', value }`，这类内容只应来自可信来源，或由全局的 `sanitize` 统一清洗，见 [Customer](../customer/README.md)。
- 自定义节点的尺寸由调用方控制；连线位置按默认节点（默认缩放下为 28px，`dot` 为 8px，即局部变量 `--vc-steps-icon-size`、`--vc-steps-dot-size`）计算。组件尺寸随 SCSS `$scale` 配置缩放，自定义节点需同步调整。
- 颜色使用主题变量，可通过以下变量单独覆盖：
  - `--vc-steps-color-primary`：当前步、已完成的连线
  - `--vc-steps-color-primary-lighter`：已完成步骤的底色
  - `--vc-steps-color-error`：失败
  - `--vc-steps-background-color`：未开始步骤的底色
  - `--vc-steps-color-neutral-light`：连线
  - `--vc-steps-color-light-deepest`：未开始的圆点、导航箭头
  - `--vc-steps-color-dark-light`：标题
  - `--vc-steps-color-dark-lighter`：未开始步骤的标题与序号
  - `--vc-steps-color-dark-extralight`：描述
  - `--vc-steps-color-contrast-light`：主色、错误色底色上的文字（含 arrow 悬停），默认 `#fff`
  - `--vc-steps-background-color-lightest`：`arrow` 的分隔缺口与 `navigation` 箭头的背景，应与所在容器的背景一致
- `MSteps` 与 `Steps` 共用实现，见“移动端”；`MStep` 是 `Step` 的别名。
