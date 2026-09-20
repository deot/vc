## 评分（Rate）

通过图标或字符选择评分，支持半星、清空及只读展示。

### 何时使用

用于满意度评价、内容评分或展示已有评分。

### 基础用法

使用 `v-model` 绑定评分。`half` 允许选择半星，`clearable` 允许再次点击当前分值清零。鼠标悬停仅预览星级，提示文字仍对应已选评分。

:::playground
<!-- <config lang="json5">{ previewInset: 20 }</config> -->
```vue
<template>
	<div class="rate-demo">
		<Rate v-model="value" half clearable :tooltip="tooltip" />
		<span>当前评分：{{ value }}</span>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Rate } from '@deot/vc';

const value = ref(3.5);
const tooltip = ['极差', '差', '一般', '好', '极好'];
</script>

<style scoped>
.rate-demo {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 16px;
}
</style>
```
:::

### 自定义字符和只读展示

`character` 优先于 `icon`。通过 `color` 和 `iconStyle` 调整选中色及尺寸。`tip` 插槽也需要非空的 `tooltip` 才会显示。

:::playground
<!-- <config lang="json5">{ previewInset: 20 }</config> -->
```vue
<template>
	<Rate
		:model-value="4.5"
		character="♥"
		color="#e6a23c"
		:icon-style="{ fontSize: '24px' }"
		:tooltip="['评分']"
		half
		disabled
	>
		<template #tip="{ value }">{{ value }} / 5</template>
	</Rate>
</template>

<script setup>
import { Rate } from '@deot/vc';
</script>
```
:::

## API

### 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| modelValue | 当前评分，支持 `v-model`；字符串应为数字形式 | `number \| string` | - | `0` |
| count | 星级总数，传入非负整数 | `number` | - | `5` |
| color | 选中及半选的颜色，支持 CSS 颜色值 | `string` | - | `var(--vc-rate-selected-color, #16a3ff)` |
| icon | Icon 图标名称 | `string` | - | `'star'` |
| character | 自定义字符，优先于图标 | `string` | - | - |
| half | 允许选择半星；非整数分值的小数部分统一显示为半星 | `boolean` | - | `false` |
| clearable | 再次点击当前分值可清零 | `boolean` | - | `false` |
| disabled | 只读，禁止点击和悬停预览 | `boolean` | - | `false` |
| tooltip | 各星级提示，按 `Math.ceil(value) - 1` 取值；空数组隐藏提示区域 | `unknown[]` | - | `[]` |
| iconStyle | 每个星级外层元素的内联样式；颜色由 `color` 管理 | `object` | - | `{}` |

### 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| update:modelValue | 点击选择时更新绑定值 | `value: number \| string` | 与传入的 `modelValue` 类型一致，清空为 `0` 或 `'0'` |
| change | 点击选择时触发，包括清空 | `value: number \| string` | 同上；悬停和外部赋值不触发 |

### 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| tip | 自定义提示内容，仅在 `tooltip.length > 0` 时渲染 | `{ value: number }`，当前已选评分 |

### 主题

可通过 `--vc-rate-selected-color` 覆盖默认选中色（回退为 `#16a3ff`）；显式 `color` 优先。未选图标使用 `--vc-rate-color-light-deeper`，回退至共享 `--vc-color-light-deeper`；提示文字使用 `--vc-rate-foreground-color`，回退至共享 `--vc-foreground-color`，随亮暗主题切换。

### 移动端

`MRate` 与 `Rate` 使用同一实现，属性、事件及插槽一致，可从 `@deot/vc` 导入。
