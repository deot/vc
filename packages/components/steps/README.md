## 步骤条（Steps）

引导用户按流程完成任务的导航条，展示当前所处的步骤以及前后步骤的状态。

### 何时使用

- 任务较复杂或存在先后关系时，将其拆分为一系列步骤。
- 需要展示流程进度，或允许用户在步骤之间切换。

### 基础用法

`v-model` 绑定当前步数，从 1 开始：之前的步骤为 `success`，当前步为 `pending`，之后的步骤为 `default`。`0` 表示都未开始，步骤数加 1 表示全部完成。`description` 设置步骤的描述。

:::playground
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<div>
		<Steps v-model="current">
			<Step title="填写信息" description="填写基本信息" />
			<Step title="确认信息" description="核对填写内容" />
			<Step title="完成" description="提交成功" />
		</Steps>
		<div class="toolbar">
			<Button :disabled="current <= 0" @click="current--">上一步</Button>
			<Button :disabled="current >= 4" @click="current++">下一步</Button>
			<span>当前步数：{{ current }}</span>
		</div>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, Steps, Step } from '@deot/vc';

const current = ref(2);
</script>

<style scoped>
.toolbar {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 16px;
	margin-top: 24px;
}
</style>
```
:::

### 步骤状态

Steps 的 `status` 只作用于当前步，默认为 `pending`；设为 `error` 时，前一步的连线同时变为错误色。Step 单独设置的 `status` 优先于推导结果。`lineless` 隐藏连线。

:::playground
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<div class="status-demo">
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
.status-demo {
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
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<div>
		<div class="toolbar">
			<label><span>纵向</span><Switch v-model="isVertical" /></label>
			<RadioGroup v-model="labelPosition">
				<Radio value="right">right</Radio>
				<Radio value="bottom">bottom</Radio>
				<Radio value="left">left</Radio>
				<Radio value="top">top</Radio>
			</RadioGroup>
		</div>
		<Steps :model-value="2" :vertical="isVertical" :label-position="labelPosition">
			<Step title="填写信息" description="填写基本信息" />
			<Step title="确认信息" description="核对填写内容" />
			<Step title="完成" description="提交成功" />
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

### 点击切换

`clickable` 开启后，点击步骤会更新 `v-model` 并触发 `change`。点击当前步或设置了 `disabled` 的步骤不会触发。

:::playground
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<div>
		<Steps v-model="current" clickable @change="handleChange">
			<Step title="填写信息" description="填写基本信息" />
			<Step title="确认信息" description="核对填写内容" />
			<Step title="上传附件" description="不可跳转" disabled />
			<Step title="完成" description="提交成功" />
		</Steps>
		<p>change：{{ log.join('、') || '-' }}</p>
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
```
:::

### 圆点

`type="dot"` 使用圆点作为节点。横向时文字在圆点下方，`labelPosition` 为 `top` / `left` 时在上方；纵向时文字在右侧，`labelPosition` 为 `left` / `top` 时在左侧。

`renderDot` 自定义节点，参数中的 `dot` 为默认节点，可以包裹后返回；`dot` 插槽的参数相同，并优先于 `renderDot`。两者对 `type="arrow"` 以外的类型均有效。

:::playground
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<div class="dot-demo">
		<Steps :model-value="2" type="dot" :render-dot="renderDot">
			<Step title="填写信息" description="悬停圆点查看提示" />
			<Step title="确认信息" description="核对填写内容" />
			<Step title="完成" description="提交成功" />
		</Steps>
		<Steps :model-value="2" type="dot" vertical>
			<Step title="填写信息" description="填写基本信息" />
			<Step title="确认信息" description="核对填写内容" />
			<Step title="完成" description="提交成功" />
		</Steps>
		<Steps :model-value="2">
			<Step title="填写信息" />
			<Step title="搜索" />
			<Step title="完成" />
			<template #dot="{ index, dot }">
				<Icon v-if="index === 2" type="search" class="search" />
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
.dot-demo {
	display: flex;
	flex-direction: column;
	gap: 32px;
}
.search {
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

`type="arrow"` 为箭头样式，没有节点；`type="navigation"` 为导航样式，当前步下方显示指示条。两者只支持横向，`navigation` 的文字固定在节点右侧。

:::playground
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<div class="type-demo">
		<Steps v-model="current" type="arrow" clickable>
			<Step title="填写信息" description="填写基本信息" />
			<Step title="确认信息" description="核对填写内容" />
			<Step title="完成" description="提交成功" />
		</Steps>
		<Steps v-model="current" type="navigation" clickable>
			<Step title="填写信息" />
			<Step title="确认信息" />
			<Step title="完成" />
		</Steps>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Steps, Step } from '@deot/vc';

const current = ref(2);
</script>

<style scoped>
.type-demo {
	display: flex;
	flex-direction: column;
	gap: 32px;
}
</style>
```
:::

## 主题与局部覆盖

全局参数通过 `--vc-<参数>` 配置，单个组件通过 `--vc-steps-<参数>` 覆盖。同一参数可能作用于多个状态；多命名空间时在使用位置中标明。

当前及错误步骤的标记文字、`arrow` 模式下 pending/error 状态的标题和描述使用可覆盖的 `color-contrast-light`，悬停时保持该对比文字色。内部 --vc-step-line-color 由步骤状态写入，使用现有对应状态色。

### 全局

| 参数 | 使用位置 | 值 |
| --- | --- | --- |
| color-contrast-light | 当前及错误步骤标记文字、arrow 的 pending/error 标题和描述（含悬停） | `#FFFFFF`（亮暗主题相同） |
| color-dark-light | 步骤标题 | 亮色：`#080F20`；暗色：`#E8E8E8` |
| color-dark-lighter | 未激活图标和标题 | 亮色：`#515151`；暗色：`#D9D9D9` |
| color-dark-extralight | 步骤描述 | 亮色：`#909399`；暗色：`#B9B9B9` |
| color-error | 错误步骤及错误连接线 | `#F53F3F` |
| color-light-deepest | 默认点及导航箭头 | 亮色：`#C0C4CC`；暗色：`#E8E8E8` |
| color-neutral-light | 默认连接线 | 亮色：`#EDEFF1`；暗色：`#3B4354` |
| color-primary | 当前、完成步骤及已完成连接线；可点击步骤悬停文字（arrow 的 pending/error 除外） | `#456CF6` |
| color-primary-lighter | 完成步骤背景 | `rgba(45, 140, 240, 0.2)` |
| background-color | 未激活步骤背景 | 亮色：`#F5F6FA`；暗色：`#252B3A` |
| background-color-lightest | 箭头及导航步骤间隔背景 | 亮色：`#FFFFFF`；暗色：`#252B3A` |

### 局部

当前组件没有额外的局部 CSS 主题参数。

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
| title | Step 的 `title` 属性 | `string \| Function` |
| description | Step 的 `description` 属性 | `string \| Function` |
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
| title | 标题；字符串按 HTML 渲染，函数通过 `Customer` 渲染 | `string \| Function` | - | `''` |
| description | 描述，为空时不渲染；字符串按 HTML 渲染，函数通过 `Customer` 渲染 | `string \| Function` | - | `''` |
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
- 某一步的最终状态为 `error` 时（包括 Step 单独设置），前一步的连线显示为错误色；已完成步骤的连线为主色。
- Steps 的默认插槽只渲染 Step（包括 `v-for`、`<template>` 中的 Step），其他节点会被忽略；被其他组件包裹的 Step 也不会渲染。
- `title`、`description` 为字符串时按 HTML 渲染，不要传入未经处理的用户输入。
- 自定义节点的尺寸由调用方控制；连线位置按默认节点（默认缩放下为 28px，`dot` 为 8px）计算。组件尺寸随 SCSS `$scale` 配置缩放，自定义节点需同步调整。
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
- `MSteps`、`MStep` 分别是 `Steps`、`Step` 的别名，使用同一实现与样式，可从 `@deot/vc` 导入。
