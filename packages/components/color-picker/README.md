## 颜色选择器（ColorPicker）
用于颜色选择，支持多种格式，支持颜色预设

### 何时使用
用于选择一组颜色值。

### 基础用法
可以使用 `v-model` 实现数据的双向绑定。

:::RUNTIME
```vue
<template>
	<div class="v-color-picker">
		<div style="margin-right: 50px;">
			<p style="text-align: left;">有默认值</p>
			<ColorPicker v-model="color" />
		</div>
		<div>
			<p style="text-align: left;">无默认值</p>
			<ColorPicker v-model="color1" />
		</div>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { ColorPicker } from '@deot/vc';

const color = ref('#1DB88C');
const color1 = ref('');
</script>
<style>
.v-color-picker {
	display: flex;
	align-items: center;
	justify-content: center;
}
</style>
```
:::

### 选择透明度
ColorPicker 支持普通颜色，也支持带 Alpha 通道的颜色，通过`alpha`属性即可控制是否支持透明度的选择。

:::RUNTIME
```vue
<template>
	<div>
		<ColorPicker v-model="color" alpha />
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { ColorPicker } from '@deot/vc';

const color = ref('rgba(19, 206, 102, 0.8)');
</script>
```
:::

### 预定义颜色
ColorPicker 支持预定义颜色，通过`colors`属性预定义颜色。

:::RUNTIME
```vue
<template>
	<div>
		<ColorPicker v-model="color" :colors="predefine" />
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { ColorPicker } from '@deot/vc';

const color = ref('rgba(19, 206, 102, 0.8)');
const predefine = ref([
	'#ff4500',
	'#ff8c00',
	'#ffd700',
	'#90ee90',
	'#00ced1',
	'#1e90ff',
	'#c71585',
	'rgba(255, 69, 0, 0.68)',
	'rgb(255, 120, 0)',
	'hsv(51, 100, 98)',
	'hsva(120, 40, 94, 0.5)',
	'hsl(181, 100%, 37%)',
	'hsla(209, 100%, 56%, 0.1)',
	'hsla(209, 100%, 56%, 0.73)'
]);
</script>
```
:::

### 不同尺寸
ColorPicker 支持不同尺寸的选择器，通过`size`属性控制选择器大小。

:::RUNTIME
```vue
<template>
	<div class="v-color-picker-diff-size">
		<ColorPicker v-model="color" size="small" />
		<ColorPicker v-model="color" size="default" />
		<ColorPicker v-model="color" size="large" />
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { ColorPicker } from '@deot/vc';

const color = ref('#1DB88C');
</script>

<style>
.v-color-picker-diff-size .vc-color-picker {
    margin-right: 20px;
}
</style>
```
:::

## API

### 属性

| 属性         | 说明                    | 类型        | 可选值                           | 默认值                           |
| ---------- | --------------------- | --------- | ----------------------------- | ----------------------------- |
| modelValue | 绑定的值，可使用 v-model 双向绑定 | `string`  | -                             | -                             |
| disabled   | 是否禁用                  | `boolean` | -                             | `false`                       |
| editable   | 是否可以输入色值              | `boolean` | -                             | `true`                        |
| alpha      | 是否支持透明度选择             | `boolean` | -                             | `false`                       |
| hue        | 是否支持色彩选择              | `boolean` | -                             | `true`                        |
| recommend  | 是否显示推荐的颜色预设           | `boolean` | -                             | `false`                       |
| colors     | 自定义颜色预设               | `array`   | -                             | []                            |
| format     | 颜色的格式                 | `string`  | `hsl` 、 `hsv` 、 `hex` 、 `rgb` | 开启 `alpha` 时为 `rgb`，其它为 `hex` |
| size       | 尺寸                    | string    | `large`、`default`、`small`     | `default`                     |


### 事件

| 事件名            | 说明                | 回调参数                       | 参数说明                  |
| -------------- | ----------------- | -------------------------- | --------------------- |
| change         | 当绑定值变化时触发         | `(value: string) => void`  | `value`: 当前选中的颜色值     |
| color-change   | 面板中当前显示的颜色发生改变时触发 | `(value: string) => void`  | `value`: 当前选中的颜色值     |
| visible-change | 下拉框展开或收起时触发       | `(value: boolean) => void` | `value`: 当前`visible`值 |