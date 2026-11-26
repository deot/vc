## 滑块（Slider）
滑动型输入器，展示当前值和可选范围。

移动端入口导出的 `MSlider` 与 `Slider` 的属性、事件和插槽相同，尺寸按 750 稿随 `--vc-rem` 缩放，见 [移动端](#移动端)。

### 何时使用
当用户需要在数值区间/自定义区间内进行选择时，可为连续或离散值。

### 基础用法
基本滑动条。可以使用 `v-model` 双向绑定数据。当 `range` 为 `true` 时，渲染为双滑块。当 `disabled` 为 `true` 时，滑块处于不可用状态。
单滑块时，`modelValue` 为数字；开启 `range` 时传入数字数组。拖动越过相邻滑块时，会把它们一起推到同一个值。

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
	<div class="slider-demo">
		<p class="slider-demo__result">单值：{{ value1 }}；范围：{{ value2.join(' – ') }}</p>
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

<style scoped>
.slider-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
	max-width: 520px;
}

.slider-demo__result {
	margin: 0;
}
</style>
```
:::

### 取值范围与事件
`min`、`max` 设置取值范围。`change` 在拖动过程中、点击轨道或标签、按键或数字输入时触发；`after-change` 在拖动松开和每次按键后触发，适合提交结果。`clickable` 为 `false` 时点击轨道不改值，仍可拖动。实例方法 `reset` 只重置内部数值，不触发事件，也不修改父级绑定值。

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
	<div class="slider-demo">
		<p class="slider-demo__result">值：{{ value }}；change {{ changeCount }} 次；{{ log }}</p>
		<Slider
			ref="sliderRef"
			v-model="value"
			:min="-50"
			:max="50"
			@change="handleChange"
			@after-change="handleAfterChange"
		/>
		<p class="slider-demo__result">不可点击轨道：{{ fixed }}</p>
		<Slider v-model="fixed" :clickable="false" />
		<div class="slider-demo__row">
			<Button size="small" @click="handleReset">reset(0)</Button>
			<span>只移动第一个滑块的显示，绑定值不变</span>
		</div>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Slider, Button } from '@deot/vc';

const sliderRef = ref();
const value = ref(10);
const fixed = ref(40);
const changeCount = ref(0);
const log = ref('拖动后松开查看 after-change');

const handleChange = () => {
	changeCount.value++;
};

const handleAfterChange = (current) => {
	log.value = `after-change：${current}`;
};

const handleReset = () => {
	sliderRef.value.reset(0);
};
</script>

<style scoped>
.slider-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
	max-width: 520px;
}

.slider-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}

.slider-demo__result {
	margin: 0;
}
</style>
```
:::

### 离散值与刻度
`step` 控制每次滑动的间隔，拖动和点击时对齐到最近的步长点。`ticks` 显示步长刻度：`dot` 为轨道内圆点，`line` 为轨道外侧短线；建议在步长不密集时使用。

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
	<div class="slider-demo">
		<p class="slider-demo__result">单值：{{ value1 }}；范围：{{ value2.join(' – ') }}</p>
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

<style scoped>
.slider-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
	max-width: 520px;
}

.slider-demo__result {
	margin: 0;
}
</style>
```
:::

### 带输入框的滑块
`showInput` 显示数字输入框：单值时一个，在轨道之后；两个滑块的范围时两个，分列轨道两端，各自靠近对应的滑块（反向时交换，垂直时在上下）。滑块超过两个或 `step` 为 `null` 时不显示。

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
	<div class="slider-demo">
		<p class="slider-demo__result">单值：{{ value1 }}；范围：{{ value2.join(' – ') }}</p>
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

<style scoped>
.slider-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
	max-width: 520px;
}

.slider-demo__result {
	margin: 0;
}
</style>
```
:::

### 多滑块与拖动选中条
`range` 时传入几个值就渲染几个滑块，选中条从第一个延伸到最后一个；点击轨道移动最近的滑块。`range` 传 `{ draggable: true }` 时可以按住选中条整体平移，首尾都不会越界；按下后没有移动就松开，按点击轨道处理。

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
	<div class="slider-demo">
		<p class="slider-demo__result">多滑块：{{ value1.join(' / ') }}</p>
		<Slider v-model="value1" range />
		<p class="slider-demo__result">拖动选中条：{{ value2.join(' – ') }}</p>
		<Slider v-model="value2" :range="{ draggable: true }" :step="5" />
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Slider } from '@deot/vc';

const value1 = ref([10, 30, 60, 90]);
const value2 = ref([20, 45]);
</script>

<style scoped>
.slider-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
	max-width: 520px;
}

.slider-demo__result {
	margin: 0;
}
</style>
```
:::

### 标签
`marks` 的键为值，值为标签文本或 `{ label, class, style }`；超出 `[min, max]` 的键会被忽略。标签在轨道上显示圆点，选中范围内的圆点和标签带 `is-active`；点击标签或圆点跳到对应值。`step` 为 `null` 时只能落在标签上。

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
	<div class="slider-demo">
		<p class="slider-demo__result">值：{{ value1 }}</p>
		<Slider v-model="value1" :marks="marks" :step="5" ticks="line" />
		<p class="slider-demo__result">只能选标签值：{{ value2.join(' – ') }}</p>
		<Slider v-model="value2" :marks="marks" :step="null" range />
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

<style scoped>
.slider-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
	max-width: 520px;
}

.slider-demo__result {
	margin: 0;
}
</style>
```
:::

### 分段区间
`segments` 按 `end` 把轨道切成多段，每段可以单独设置步长 `step` 和宽度 `width`（0–1 或百分比字符串），用于非线性刻度。给了 `width` 的段先分宽度，剩余宽度按值域长度分给其余段；最后一段不到 `max` 时自动补齐。`segments` 与 `marks` 相互独立，可以单独使用。

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
	<div class="slider-demo">
		<p class="slider-demo__result">值：{{ value }}；0–20 占 60% 宽度、步长 1，20–100 步长 20</p>
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

<style scoped>
.slider-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
	max-width: 520px;
}

.slider-demo__result {
	margin: 0;
}
</style>
```
:::

### 垂直与反向
`vertical` 为垂直滑块，默认高度 `200px`（局部参数 `vertical-height`），可通过 `style` 覆盖；轨道粗细与滑块尺寸见“主题与局部覆盖”中的局部参数 `track-size`、`thumb-size`。`inverted` 交换起点与终点：水平时起点在右侧，垂直时起点在上方。

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
	<div class="slider-demo">
		<div class="slider-demo__row">
			<Slider v-model="value1" vertical />
			<Slider v-model="value2" vertical range :step="10" ticks="line" />
			<Slider v-model="value3" vertical inverted :marks="marks" />
		</div>
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

<style scoped>
.slider-demo {
	display: flex;
	flex-direction: column;
	gap: 32px;
	max-width: 520px;
}

.slider-demo__row {
	display: flex;
	justify-content: center;
	gap: 64px;
}
</style>
```
:::

### 自定义提示
`formatter` 接收当前值并返回提示内容；返回 `null`、`undefined` 或空字符串时隐藏提示，数字 `0` 正常显示。`tooltip` 支持 `hover`、`always` 和 `never`；`tooltipPlacement` 设置提示方向，未设置时水平在上方、垂直在右侧。常显的提示不占布局，示例中滑块之间留出 40px 给提示。

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
	<div class="slider-demo">
		<p class="slider-demo__result">第一个常显百分比，第二个提示在下方，第三个不显示提示</p>
		<Slider v-model="value1" :formatter="formatPercent" tooltip="always" />
		<Slider v-model="value2" tooltip="always" tooltip-placement="bottom" />
		<Slider v-model="value3" tooltip="never" />
		<p class="slider-demo__result">下方的 formatter 返回 null，隐藏提示：{{ value4 }}</p>
		<Slider v-model="value4" :formatter="formatHidden" />
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Slider } from '@deot/vc';

const value1 = ref(20);
const value2 = ref(40);
const value3 = ref(60);
const value4 = ref(20);

const formatPercent = (value) => {
	return `${value}%`;
};

const formatHidden = () => {
	return null;
};
</script>

<style scoped>
.slider-demo {
	display: flex;
	flex-direction: column;
	gap: 40px;
	max-width: 520px;
}

.slider-demo__result {
	margin: 0;
}
</style>
```
:::

### 插槽
`#thumb` 自定义滑块内容，使用后去掉默认圆点，尺寸由内容决定，参数含 `dragging`；`#mark` 自定义标签；`#tooltip` 自定义提示内容，使用后不再受 `formatter` 返回空值影响。

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
	<div class="slider-demo">
		<p class="slider-demo__result">范围：{{ value.join(' – ') }}</p>
		<Slider v-model="value" :marks="marks" range>
			<template #thumb="{ value: current, dragging }">
				<span :class="['slider-demo__thumb', { 'is-dragging': dragging }]">{{ current }}</span>
			</template>
			<template #mark="{ label, active }">
				<span :class="['slider-demo__mark', { 'is-active': active }]">{{ label }}</span>
			</template>
			<template #tooltip="{ index }">
				{{ index === 0 ? '起点' : '终点' }}
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
.slider-demo {
	display: flex;
	flex-direction: column;
	gap: 40px;
	max-width: 520px;
}

.slider-demo__result {
	margin: 0;
}

.slider-demo__thumb {
	min-width: 28px;
	padding: 2px 6px;
	font-size: 12px;
	line-height: 16px;
	color: var(--vc-color-contrast-light);
	text-align: center;
	cursor: grab;
	background-color: var(--vc-color-primary);
	border-radius: 10px;
	box-sizing: border-box;
}

.slider-demo__thumb.is-dragging {
	cursor: grabbing;
}

.slider-demo__mark.is-active {
	font-weight: 600;
}
</style>
```
:::

### 交互
- 轨道的点击区沿交叉轴扩到整行（局部参数 `hit-size`，默认 `32px`），点在轨道附近即可调整值，不改变布局。
- 鼠标在轨道上按下时，最近的滑块跳到按下处并随即进入拖动，不必先对准滑块；未开启 `range.draggable` 时按住选中条也是如此。触摸只在点按时跳转，按住轨道滑动不会改值，避免和页面滚动冲突。`clickable` 为 `false` 或禁用时不响应。
- 提示：鼠标悬停、拖动时显示；键盘聚焦（`:focus-visible`）或按方向键时显示，失焦收起；鼠标点按获得的焦点不显示。触屏没有悬停，只在按住拖动时显示，松开后收起（只点按不拖动同样收起）。
- 悬停放大只在支持悬停的设备上生效（`@media (hover: hover)`），触屏点按后不会停在放大状态。
- 提示不挂到 body，按内容宽度单行排版；最大宽度仍按视口限制。

### 键盘与无障碍
滑块聚焦后：方向键按视觉方向移动一步（分段时用当前段的步长，`step` 为 `null` 时跳到相邻标签）；`PageUp` / `PageDown` 移动十步；`Home` / `End` 移到相邻滑块或边界。每次按键依次触发 `change`、`update:modelValue`、`after-change`。

滑块带 `role="slider"`、`aria-valuemin`、`aria-valuemax`、`aria-valuenow`、`aria-orientation`、`aria-disabled`；`formatter` 返回字符串或数字时同时设置 `aria-valuetext`。禁用时滑块不可聚焦。

## 移动端

`MSlider` 与 `Slider` 的属性、事件、插槽、结构相同，根节点另有标记类 `.vcm-slider`，结构样式、颜色与主题参数共用；`showInput` 的输入框为 `MInputNumber`。支持触摸拖动；滑块和可拖动的选中条设置了 `touch-action: none`，垂直拖动时页面不会跟着滚动。尺寸按 750 稿设计，写为 `calc(var(--vc-rem) * n)`，随 `--vc-rem` 缩放；底栏切换 `rem` 可查看不同屏宽下的效果。

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
	<div class="m-slider-demo">
		<MSlider v-model="value1" />
		<MSlider v-model="value2" range />
		<MSlider v-model="value3" :max="20" :step="null" :marks="marks" />
		<MSlider v-model="value4" :step="10" ticks="dot" />
		<div class="m-slider-demo__tooltip">
			<MSlider v-model="value5" tooltip="always" :formatter="formatPercent" />
		</div>
		<MSlider v-model="value6" show-input />
		<MSlider v-model="value7" disabled />
		<div class="m-slider-demo__vertical">
			<MSlider v-model="value1" vertical />
			<MSlider v-model="value2" vertical range />
		</div>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MSlider } from '@deot/vc';

const value1 = ref(30);
const value2 = ref([20, 60]);
const value3 = ref(10);
const value4 = ref(40);
const value5 = ref(50);
const value6 = ref(20);
const value7 = ref(60);
const marks = { 0: '0', 5: '5', 10: '10', 15: '15', 20: '20' };

const formatPercent = (value) => {
	return `${value}%`;
};
</script>

<style scoped>
.m-slider-demo {
	display: flex;
	flex-direction: column;
	gap: calc(var(--vc-rem) * 16);
}

.m-slider-demo__tooltip {
	padding-top: calc(var(--vc-rem) * 48);
}

.m-slider-demo__vertical {
	display: flex;
	justify-content: center;
	gap: calc(var(--vc-rem) * 96);
}
</style>
```
:::

移动端样式只在 `.vcm-slider` 上覆盖“主题与局部覆盖”中的局部参数（括号内为 375 宽下的 px）：

| 项 | 值 |
| --- | --- |
| 行 | 上下内边距 22（11）、左右 32（16），首尾滑块不超出容器；行高 48（24） |
| 轨道 | 粗 4（2），点击区 64（32） |
| 滑块 | 直径 48（24），白底、阴影 `0 2px 8px rgb(0 0 0 / 10%)`，无边框，悬停、拖动不放大 |
| 标签 | 圆点 12（6）实心；文字 28 / 40（14 / 20），距轨道 34（17）；有标签时底部内边距 70（35） |
| 刻度 | `ticks="dot"` 圆点 8（4） |
| 提示 | 字号 24 / 34（12 / 17），内边距 16 24（8 12），圆角 8（4） |
| 垂直 | 高 400（200） |
| 输入框 | 宽 220（110），与轨道间距 24（12） |

提示的尺寸通过 Popover 的局部参数（`--vc-popover-wrapper-*`）设置：提示不挂到 body，在 `.vcm-slider` 上设置即可继承。

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
| thumb-border | 滑块边框 | `2px solid` 主色 |
| thumb-shadow | 滑块阴影 | `none` |
| thumb-active-transform | 悬停、拖动时滑块的变换 | `scale(1.17)` |
| thumb-active-shadow | 悬停、拖动时滑块的阴影 | `0 2px 5px` color-shadow-fixed |
| hit-size | 轨道点击区在交叉轴上的尺寸 | `32px` |
| min-height | 水平滑块的最小高度 | `32px` |
| vertical-height | 垂直滑块的高度 | `200px` |
| tick-dot-size | `ticks="dot"` 的圆点直径 | `4px` |
| mark-dot-size | 标签圆点直径 | `8px` |
| mark-dot-border-width | 标签圆点的边框宽度；为直径的一半时是实心圆点 | `2px` |
| mark-font-size / mark-line-height | 标签文字的字号 / 行高 | `12px` / `1` |
| mark-gap | 标签文字与滑块外侧的距离 | `4px` |
| marked-padding-bottom | 有标签时底部预留的高度 | `8px` |
| input-width / input-gap | 输入框的宽度 / 与轨道的间距 | `80px` / `20px` |

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
| after-change | 拖动滑块或选中条后松开、手势被打断，以及按键使值改变后触发；按下未移动、点击轨道和数字输入不触发 | `(value, reset)` | 同上 |

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
