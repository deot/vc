## 滑块（Slider)
滑动型输入器，展示当前值和可选范围

### 何时使用
当用户需要在数值区间/自定义区间内进行选择时，可为连续或离散值。

### 基本用法
基本滑动条。可以使用 `v-model` 双向绑定数据。当 `range` 为 `true` 时，渲染为双滑块。当 `disabled` 为 `true` 时，滑块处于不可用状态。
**注意，** 单滑块时，`value` 格式为数字，当开启双滑块时，`value` 为长度是2的数组，且每项为数字。

:::RUNTIME
```vue
<template>
	<div class="v-silder-basic">
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

:::RUNTIME
```vue
<template>
	<div class="v-silder-step">
		<Slider v-model="value4" :step="10" />
		<Slider v-model="value5" :step="10" range/>
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

:::RUNTIME
```vue
<template>
	<div class="v-silder-show-stops">
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
和 `数字输入框` 组件保持同步。

:::RUNTIME
```vue
<template>
	<div class="v-silder-input">
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
`Slider` 会把当前值传给 `formatter`，并在 `popover` 中显示 `formatter` 的返回值，若为 `null`，则隐藏 `popover`。

:::RUNTIME
```vue
<template>
	<div class="v-silder-tip">
		<Slider v-model="value6" :formatter="tipFormat" />
		<Slider v-model="value7" :formatter="hideFormat" />
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Slider } from '@deot/vc';

const value6 = ref(20);
const value7 = ref(20);
const tipFormat = (val) => {
	return `Progress: ${val} %`;
};
const hideFormat = (val) => {
	return null;
};
</script>
```
:::

## API

### 属性
| 属性         | 说明                                                                                     | 类型                | 可选值                      | 默认值     |
| ---------- | -------------------------------------------------------------------------------------- | ----------------- | ------------------------ | ------- |
| modelValue      | 滑块选定的值，可以使用 v-model 双向绑定数据。普通模式下，数据格式为数字，在双滑块模式下，数据格式为长度是2的数组，且每项都为数字                  | `number`、 `array` | -                        | 0       |
| min        | 最小值                                                                                    | `number`          | -                        | 0       |
| max        | 最大值                                                                                    | `number`          | -                        | 100     |
| step       | 步长，取值建议能被（max - min）整除                                                                 | `number`          | -                        | 1       |
| disabled   | 是否禁用滑块                                                                                 | `boolean`         | -                        | `false` |
| clickable  | 是否可以通过点击bar来移动滑块                                                                       | `boolean`         | -                        | `true`  |
| range      | 是否开启双滑块模式                                                                              | `boolean`         | -                        | `false` |
| show-input | 是否显示数字输入框，仅在单滑块模式下有效                                                                   | `boolean`         | -                        | `false` |
| show-stops | 是否显示间断点，建议在 step 不密集时使用                                                                | `boolean`         | -                        | `false` |
| show-tip   | 提示的显示控制，可选值为 `hover`（悬停，默认）、`always`（总是可见）、`never`（不可见）                                | `String`          | `hover`、`always`、`never` | `hover` |
| formatter  | `Slider` 会把当前值传给 `formatter`，并在 `popover` 中显示 `formatter` 的返回值，若为 `null`，则隐藏 `popover` | `Function`        | -                        | -       |


### 事件

| 事件名          | 说明                                           | 回调参数                                                 | 参数说明                           |
| ------------ | -------------------------------------------- | ---------------------------------------------------- | ------------------------------ |
| after-change | 在松开滑动时触发，返回当前的选值，在滑动过程中不会触发，会对外暴露`reset`方法   | `(value: number \ array, reset: Function) => void 0` | `value`：滑块选定的值；`reset`：重置滑块的方法 |
| change       | 滑动条数据变化时触发，返回当前的选值，在滑动过程中实时触发，会对外暴露`reset`方法 | `(value: number \ array, reset: Function) => void 0` | `value`：滑块选定的值；`reset`：重置滑块的方法 |
