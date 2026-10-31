## 滑块（Slider）
滑动型输入器，展示当前值和可选范围

### 何时使用
当用户需要在数值区间/自定义区间内进行选择时，可为连续或离散值。

### 基础用法
基本滑动条。可以使用 `v-model` 双向绑定数据。当 `range` 为 `true` 时，渲染为双滑块。当 `disabled` 为 `true` 时，滑块处于不可用状态。
单滑块时，`modelValue` 为数字；开启 `range` 时传入数字数组。拖动越过相邻滑块时，会把它们一起推到同一个值。

:::playground
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<div style="display: grid; gap: 16px; max-width: 520px; margin: 0 auto;">
		<div>单值：{{ value1 }}；范围：{{ value2.join(' – ') }}</div>
		<Slider v-model="value1" />
		<Slider v-model="value2" range />
		<Slider v-model="value3" range disabled />
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Slider } from '@deot/vc';

const value1 = ref(20);
const value2 = ref([20, 60]);
const value3 = ref([20, 60]);
</script>
```
:::

### 离散值与刻度
`step` 控制每次滑动的间隔，拖动和点击时对齐到最近的步长点。`ticks` 显示步长刻度：`dot` 为轨道内圆点，`line` 为轨道外侧短线；建议在步长不密集时使用。

:::playground
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<div style="display: grid; gap: 24px; max-width: 520px; margin: 0 auto;">
		<div>单值：{{ value1 }}；范围：{{ value2.join(' – ') }}</div>
		<Slider v-model="value1" :step="10" ticks="dot" />
		<Slider v-model="value2" :step="10" range ticks="line" />
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Slider } from '@deot/vc';

const value1 = ref(20);
const value2 = ref([20, 60]);
</script>
```
:::

### 带输入框的滑块
`show-input` 显示数字输入框：单值时一个，在轨道之后；两个滑块的范围时两个，分列轨道两端，各自靠近对应的滑块（反向时交换，垂直时在上下）。滑块超过两个或 `step` 为 `null` 时不显示。

:::playground
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<div style="display: grid; gap: 16px; max-width: 520px; margin: 0 auto;">
		<div>单值：{{ value1 }}；范围：{{ value2.join(' – ') }}</div>
		<Slider v-model="value1" show-input />
		<Slider v-model="value2" range show-input />
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Slider } from '@deot/vc';

const value1 = ref(20);
const value2 = ref([20, 60]);
</script>
```
:::

### 多滑块与拖动选中条
`range` 时传入几个值就渲染几个滑块，选中条从第一个延伸到最后一个；点击轨道移动最近的滑块。`range` 传 `{ draggable: true }` 时可以按住选中条整体平移，首尾都不会越界；按下后没有移动就松开，按点击轨道处理。

:::playground
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<div style="display: grid; gap: 16px; max-width: 520px; margin: 0 auto;">
		<div>多滑块：{{ value1.join(' / ') }}</div>
		<Slider v-model="value1" range />
		<div>拖动选中条：{{ value2.join(' – ') }}</div>
		<Slider v-model="value2" :range="{ draggable: true }" :step="5" />
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Slider } from '@deot/vc';

const value1 = ref([10, 30, 60, 90]);
const value2 = ref([20, 45]);
</script>
```
:::

### 标签
`marks` 的键为值，值为标签文本或 `{ label, class, style }`；超出 `[min, max]` 的键会被忽略。标签在轨道上显示圆点，选中范围内的圆点和标签带 `is-active`；点击标签或圆点跳到对应值。`step` 为 `null` 时只能落在标签上。

:::playground
<!-- <config lang="json5">{ previewInset: [40, 24] }</config> -->
```vue
<template>
	<div style="display: grid; gap: 32px; max-width: 520px; margin: 0 auto;">
		<div>
			<div>值：{{ value1 }}</div>
			<Slider v-model="value1" :marks="marks" :step="5" ticks="line" />
		</div>
		<div>
			<div>只能选标签值：{{ value2.join(' – ') }}</div>
			<Slider v-model="value2" :marks="marks" :step="null" range />
		</div>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Slider } from '@deot/vc';

const value1 = ref(35);
const value2 = ref([25, 75]);
const marks = {
	0: '0',
	25: '25',
	50: { label: '50', style: { color: 'var(--vc-color-primary)' } },
	75: '75',
	100: '100'
};
</script>
```
:::

### 分段区间
`segments` 按 `end` 把轨道切成多段，每段可以单独设置步长 `step` 和宽度 `width`（0–1 或百分比字符串），用于非线性刻度。给了 `width` 的段先分宽度，剩余宽度按值域长度分给其余段；最后一段不到 `max` 时自动补齐。`segments` 与 `marks` 相互独立，可以单独使用。

:::playground
<!-- <config lang="json5">{ previewInset: [40, 24] }</config> -->
```vue
<template>
	<div style="display: grid; gap: 16px; max-width: 520px; margin: 0 auto;">
		<div>值：{{ value }}；0–20 占 60% 宽度、步长 1，20–100 步长 20</div>
		<Slider
			v-model="value"
			:segments="segments"
			:marks="marks"
			ticks="dot"
		/>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Slider } from '@deot/vc';

const value = ref(10);
const segments = [
	{ end: 20, width: '60%' },
	{ end: 100, step: 20 }
];
const marks = { 0: '0', 10: '10', 20: '20', 60: '60', 100: '100' };
</script>
```
:::

### 垂直与反向
`vertical` 为垂直滑块，默认高度 `200px`，可通过 `style` 覆盖；轨道粗细与滑块尺寸见“主题与局部覆盖”中的局部参数 `track-size`、`thumb-size`。`inverted` 交换起点与终点：水平时起点在右侧，垂直时起点在上方。

:::playground
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<div style="display: flex; gap: 64px; justify-content: center;">
		<Slider v-model="value1" vertical />
		<Slider v-model="value2" vertical range :step="10" ticks="line" />
		<Slider v-model="value3" vertical inverted :marks="marks" />
	</div>
	<div style="max-width: 520px; margin: 32px auto 0;">
		<Slider v-model="value4" inverted />
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Slider } from '@deot/vc';

const value1 = ref(30);
const value2 = ref([20, 60]);
const value3 = ref(25);
const value4 = ref(30);
const marks = { 0: '0', 50: '50', 100: '100' };
</script>
```
:::

### 自定义提示
`formatter` 接收当前值并返回提示内容；返回 `null`、`undefined` 或空字符串时隐藏提示，数字 `0` 正常显示。`tooltip` 支持 `hover`、`always` 和 `never`；`tooltip-placement` 设置提示方向，未设置时水平在上方、垂直在右侧。

:::playground
<!-- <config lang="json5">{ previewInset: [40, 24] }</config> -->
```vue
<template>
	<div style="display: grid; gap: 40px; max-width: 520px; margin: 0 auto;">
		<Slider v-model="value1" :formatter="tipFormat" tooltip="always" />
		<Slider v-model="value2" tooltip="always" tooltip-placement="bottom" />
		<div>下方隐藏提示，当前值：{{ value3 }}</div>
		<Slider v-model="value3" :formatter="hideFormat" />
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Slider } from '@deot/vc';

const value1 = ref(20);
const value2 = ref(40);
const value3 = ref(20);
const tipFormat = (val) => {
	return `${val}%`;
};
const hideFormat = () => {
	return null;
};
</script>
```
:::

### 插槽
`#thumb` 自定义滑块内容，使用后去掉默认圆点，尺寸由内容决定；`#mark` 自定义标签；`#tooltip` 自定义提示内容，使用后不再受 `formatter` 返回空值影响。

:::playground
<!-- <config lang="json5">{ previewInset: [40, 24] }</config> -->
```vue
<template>
	<div style="max-width: 520px; margin: 0 auto;">
		<Slider v-model="value" :marks="marks" range>
			<template #thumb="{ value: current }">
				<span class="thumb">{{ current }}</span>
			</template>
			<template #mark="{ label, active }">
				<span :style="{ fontWeight: active ? 600 : 400 }">{{ label }}</span>
			</template>
			<template #tooltip="{ index }">
				{{ index === 0 ? 'Start' : 'End' }}
			</template>
		</Slider>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Slider } from '@deot/vc';

const value = ref([25, 75]);
const marks = { 0: '0', 25: '25', 50: '50', 75: '75', 100: '100' };
</script>
<style scoped>
.thumb {
	min-width: 28px;
	padding: 2px 6px;
	font-size: 12px;
	line-height: 16px;
	color: #fff;
	text-align: center;
	cursor: grab;
	background-color: var(--vc-color-primary);
	border-radius: 10px;
	box-sizing: border-box;
}
</style>
```
:::

### 键盘与无障碍
滑块聚焦后：方向键按视觉方向移动一步（分段时用当前段的步长，`step` 为 `null` 时跳到相邻标签）；`PageUp` / `PageDown` 移动十步；`Home` / `End` 移到相邻滑块或边界。每次按键依次触发 `change`、`update:modelValue`、`after-change`。

滑块带 `role="slider"`、`aria-valuemin`、`aria-valuemax`、`aria-valuenow`、`aria-orientation`、`aria-disabled`；`formatter` 返回字符串或数字时同时设置 `aria-valuetext`。禁用时滑块不可聚焦。

## 主题与局部覆盖

全局参数通过 `--vc-<参数>` 配置，单个组件通过 `--vc-slider-<参数>` 覆盖。同一参数可能作用于多个状态；多命名空间时在使用位置中标明。

⚠ color-mix：禁用的已选范围、滑块边框、选中刻度和选中标签圆点由 color-primary-light 30% 与 background-color-lightest 70% 混合；不支持时使用 color-primary-lighter。

### 全局

| 参数 | 使用位置 | 值 |
| --- | --- | --- |
| color-contrast-light | 滑块背景、标签圆点背景 | `#FFFFFF`（亮暗主题相同） |
| color-light-deepest | 未选中的刻度、标签圆点边框 | 亮色：`#C0C4CC`；暗色：`#E8E8E8` |
| color-primary | 已选范围背景、滑块边框、选中的刻度和标签圆点边框 | `#456CF6` |
| color-primary-light | 禁用主色派生 | `#4A96FF` |
| color-primary-lighter | 滑块键盘聚焦光环、禁用主色降级色 | `rgba(45, 140, 240, 0.2)` |
| color-dark-lightest | 标签文字 | 亮色：`#64758B`；暗色：`#C9C9C9` |
| color-neutral-light | 滑轨背景 | 亮色：`#EDEFF1`；暗色：`#3B4354` |
| color-shadow-fixed | 滑块悬停、拖动时的阴影 | 亮色：`rgb(0 0 0 / 6%)`；暗色：`rgb(0 0 0 / 24%)` |
| background-color-light | 禁用滑轨背景 | 亮色：`#F7F8FA`；暗色：`#2D3444` |
| background-color-lightest | 禁用主色的混合表面 | 亮色：`#FFFFFF`；暗色：`#252B3A` |

### 局部

| 参数 | 使用位置 | 值 |
| --- | --- | --- |
| track-size | 轨道与选中条的粗细；标签、刻度、滑块随之居中 | `2px` |
| thumb-size | 滑块直径；也决定可拖动选中条的命中高度和垂直模式的上下留白 | `12px` |

## API

### 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| modelValue | `v-model` 绑定值；单值模式传数字，范围模式传数字数组（几个值就几个滑块，至少两个），会排序并限制在边界内 | `number \| number[]` | - | `0` |
| min | 最小值 | `number` | - | `0` |
| max | 最大值 | `number` | - | `100` |
| step | 步长；取绝对值，零按 1 处理；`null` 时只能落在 `marks` 上 | `number \| null` | - | `1` |
| segments | 分段区间，见“分段区间” | `SliderSegment[]` | - | - |
| marks | 标签，键为值 | `Record<number, string \| number \| { label?, class?, style? }>` | - | - |
| range | 是否启用范围模式；对象时 `draggable` 为 `true` 可整体平移选中条 | `boolean \| { draggable?: boolean }` | - | `false` |
| vertical | 是否垂直 | `boolean` | - | `false` |
| inverted | 是否交换起点与终点 | `boolean` | - | `false` |
| disabled | 是否禁用滑块和数字输入框 | `boolean` | - | `false` |
| clickable | 是否允许点击轨道、选中条、刻度和标签调整值；关闭后仍可拖动 | `boolean` | - | `true` |
| ticks | 步长刻度；与标签重合的刻度由标签圆点代替 | `'none' \| 'dot' \| 'line'` | `none`、`dot`、`line` | `'none'` |
| showInput | 是否显示数字输入框，见“带输入框的滑块” | `boolean` | - | `false` |
| tooltip | 提示显示方式；`hover` 支持悬停、聚焦和拖动 | `'hover' \| 'always' \| 'never'` | `hover`、`always`、`never` | `'hover'` |
| tooltipPlacement | 提示方向；未设置时水平在上方、垂直在右侧 | `'top' \| 'bottom' \| 'left' \| 'right'` | - | - |
| formatter | 提示格式化；返回空字符串、`null`、`undefined` 时隐藏 | `(value: number) => string \| number \| null \| undefined` | - | `value => String(value)` |

`SliderSegment`：`{ end: number; step?: number; width?: number | string }`。`end` 为段终点，起点是上一段的终点（第一段为 `min`）；`step` 默认取 `step` 属性；`width` 为 0–1 或百分比字符串。

### 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| update:modelValue | 拖动、点击、键盘或数字输入时同步绑定值 | `(value, reset)` | `value` 为单个数字或数字数组；`reset` 见方法说明 |
| change | 拖动过程中、点击轨道或标签、按键或数字输入时触发 | `(value, reset)` | 同上 |
| after-change | 拖动滑块或选中条后松开、手势被打断，以及每次按键后触发；按下未移动、点击轨道和数字输入不触发 | `(value, reset)` | 同上 |

### 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| thumb | 滑块内容；使用后去掉默认圆点 | `{ value: number, index: number, dragging: boolean }` |
| mark | 标签内容；使用后空标签也会渲染 | `{ value: number, label, active: boolean }` |
| tooltip | 提示内容；使用后即使 `formatter` 返回空值也显示 | `{ value: number, index: number }` |

### 方法

通过组件 ref 调用；事件参数中的 `reset` 与实例方法相同。

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| reset | 重置内部数值并限制在边界内，不触发事件或修改父级绑定值；需要同步时同时更新 `v-model` | `value: number \| number[]` | `void` |

### 移动端

`MSlider` 从 `@deot/vc` 导入，与 `Slider` 共用实现、属性和事件，支持触摸拖动；滑块和可拖动的选中条设置了 `touch-action: none`，垂直拖动时页面不会跟着滚动。
