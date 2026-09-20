## 滑块（Slider）
滑动型输入器，展示当前值和可选范围

### 何时使用
当用户需要在数值区间/自定义区间内进行选择时，可为连续或离散值。

### 基础用法
基本滑动条。可以使用 `v-model` 双向绑定数据。当 `range` 为 `true` 时，渲染为双滑块。当 `disabled` 为 `true` 时，滑块处于不可用状态。
单滑块时，`modelValue` 为数字；开启双滑块时，传入两个数字的数组。拖动两端交叉时，两端会收拢到同一个值。

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

### 离散值

通过设置属性 `step` 可以控制每次滑动的间隔。

:::playground
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<div style="display: grid; gap: 16px; max-width: 520px; margin: 0 auto;">
		<div>单值：{{ value4 }}；范围：{{ value5.join(' – ') }}</div>
		<Slider v-model="value4" :step="10" />
		<Slider v-model="value5" :step="10" range />
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Slider } from '@deot/vc';

const value4 = ref(20);
const value5 = ref([20, 80]);
</script>
```
:::

### 显示间断点
通过设置属性 `show-stops` 可以显示间断点，建议在 `step` 间隔不密集时使用。

:::playground
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<div style="display: grid; gap: 16px; max-width: 520px; margin: 0 auto;">
		<div>单值：{{ value6 }}；范围：{{ value7.join(' – ') }}</div>
		<Slider v-model="value6" :step="10" show-stops />
		<Slider v-model="value7" :step="10" range show-stops />
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Slider } from '@deot/vc';

const value6 = ref(20);
const value7 = ref([20, 60]);
</script>
```
:::

### 带输入框的滑块
通过 `show-input` 显示数字输入框，仅在单滑块模式下有效。

:::playground
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<div style="max-width: 520px; margin: 0 auto;">
		<div>当前值：{{ value6 }}</div>
		<Slider v-model="value6" show-input />
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Slider } from '@deot/vc';

const value6 = ref(20);
</script>
```
:::

### 自定义提示
`formatter` 接收当前值并返回提示内容；返回 `null`、`undefined` 或空字符串时隐藏提示，数字 `0` 正常显示。`show-tip` 支持 `hover`、`always` 和 `never`。

:::playground
<!-- <config lang="json5">{ previewInset: [40, 24] }</config> -->
```vue
<template>
	<div style="display: grid; gap: 40px; max-width: 520px; margin: 0 auto;">
		<Slider v-model="value6" :formatter="tipFormat" show-tip="always" />
		<div>下方隐藏提示，当前值：{{ value7 }}</div>
		<Slider v-model="value7" :formatter="hideFormat" />
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Slider } from '@deot/vc';

const value6 = ref(20);
const value7 = ref(20);
const tipFormat = (val) => {
	return `${val}%`;
};
const hideFormat = () => {
	return null;
};
</script>
```
:::

## API

### 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| modelValue | `v-model` 绑定值；单值模式传数字，范围模式传两个数字的数组 | `number \| [number, number] \| number[]` | - | `0` |
| min | 最小值 | `number` | - | `0` |
| max | 最大值 | `number` | - | `100` |
| step | 步长；拖动和点击时取绝对值，零按 1 处理，建议边界与步长对齐 | `number` | - | `1` |
| disabled | 是否禁用滑块和数字输入框 | `boolean` | - | `false` |
| clickable | 是否允许点击轨道、选中条和刻度调整值；关闭后仍可拖动 | `boolean` | - | `true` |
| range | 是否启用双滑块 | `boolean` | - | `false` |
| showInput | 是否显示数字输入框，仅单值模式有效 | `boolean` | - | `false` |
| showStops | 是否显示内部刻度，建议在步长不密集时使用 | `boolean` | - | `false` |
| showTip | 提示显示方式；`hover` 支持悬停、聚焦和拖动 | `'hover' \| 'always' \| 'never'` | `hover`、`always`、`never` | `'hover'` |
| formatter | 提示格式化；返回空字符串、`null`、`undefined` 时隐藏 | `(value: number) => string \| number \| null \| undefined` | - | `value => String(value)` |

### 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| update:modelValue | 拖动、点击或数字输入时同步绑定值 | `(value, reset)` | `value` 为单个数字或两个数字的数组；`reset` 见方法说明 |
| change | 拖动过程中、点击轨道或数字输入时触发 | `(value, reset)` | 同上 |
| after-change | 按下后发生移动，在释放鼠标或触摸结束时触发；单纯点击轨道和数字输入不触发 | `(value, reset)` | 同上 |

### 方法

通过组件 ref 调用；事件参数中的 `reset` 与实例方法相同。

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| reset | 重置内部数值并限制在边界内，不触发事件或修改父级绑定值；需要同步时同时更新 `v-model` | `value: number \| number[]` | `void` |
| refresh | 重新测量轨道宽度；组件也会监听尺寸变化 | - | `void` |

### 移动端

`MSlider` 从 `@deot/vc` 导入，与 `Slider` 共用实现、属性和事件，支持触摸拖动。
