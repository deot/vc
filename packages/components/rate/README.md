## 评分（Rate）

通过图标或字符选择评分，支持半星、清空、只读展示及键盘操作。

### 何时使用

用于满意度评价、内容评分或展示已有评分。

### 基础用法

使用 `v-model` 绑定评分。`half` 允许选择半星，`clearable` 允许再次点按当前分值清零。

分值由指针的横坐标决定：星星之间的间距归最近的星星，开启 `half` 时点在星星左半边得到 `x - 0.5`、右半边得到 `x`。鼠标悬停时预览星级和提示文字；按住后左右滑动可连续改分，松开时生效，滑过当前分值不会清零。

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

### 只读与禁用

`readonly` 仅展示，颜色照常；`disabled` 不可操作，整体半透明。两者都不可聚焦，也不响应点按、滑动、悬停和按键。

:::playground
<!-- <config lang="json5">{ previewInset: 20 }</config> -->
```vue
<template>
	<div class="rate-demo">
		<Rate :model-value="3.5" half readonly />
		<Rate :model-value="3.5" half disabled />
	</div>
</template>

<script setup>
import { Rate } from '@deot/vc';
</script>

<style scoped>
.rate-demo {
	display: flex;
	flex-direction: column;
	gap: 12px;
}
</style>
```
:::

### 自定义字符、颜色和尺寸

`character` 优先于 `icon`，同名插槽 `#character` 又优先于属性，可按序号给每颗星放不同的内容。`color` 调整选中色，尺寸可通过 `iconStyle` 或局部变量 `--vc-rate-size` 调整。`tip` 插槽也需要非空的 `tooltip` 才会显示。

:::playground
<!-- <config lang="json5">{ previewInset: 20 }</config> -->
```vue
<template>
	<div class="rate-demo">
		<Rate v-model="value" character="好" color="#F53F3F" half />
		<Rate v-model="level" :count="3">
			<template #character="{ index }">
				<span>{{ levels[index] }}</span>
			</template>
		</Rate>
		<Rate
			v-model="value"
			:icon-style="{ fontSize: '24px' }"
			:tooltip="['评分']"
			half
		>
			<template #tip="{ value }">{{ value }} / 5</template>
		</Rate>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Rate } from '@deot/vc';

const value = ref(3.5);
const level = ref(2);
const levels = ['差', '中', '好'];
</script>

<style scoped>
.rate-demo {
	display: flex;
	flex-direction: column;
	gap: 12px;
}
</style>
```
:::

## 主题与局部覆盖

全局参数通过 `--vc-<参数>` 配置，单个组件通过 `--vc-rate-<参数>` 覆盖。同一参数可能作用于多个状态；多命名空间时在使用位置中标明。

### 全局

| 参数 | 使用位置 | 值 |
| --- | --- | --- |
| foreground-color | 评分提示文字 | 亮色：`#080F20`；暗色：`#F8F8F8` |
| foreground-color-inactive | 未选中的星星 | 亮色：`#C0C4CC`；暗色：`#737D8C` |
| color-primary-lighter | 键盘聚焦时的光环 | `rgba(45, 140, 240, 0.2)` |

### 局部

尺寸与选中色写成局部变量 `--vc-rate-<键>`，桌面端的默认值见括号：

| 键 | 说明 |
| --- | --- |
| color | 选中及半选的颜色（`#FFB400`，亮暗主题相同）；`color` 属性写在根节点的这个变量上 |
| size | 星星大小（16px） |
| gap | 星星之间的间距（8px），点击热区包含间距 |
| padding | 星星区域的内边距（0），扩大点击热区 |
| font-size | 提示文字字号（14px） |
| tips-gap | 提示文字与星星的间距（8px） |

## API

### 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| modelValue | 当前评分，支持 `v-model`；字符串应为数字形式 | `number \| string` | - | `0` |
| count | 星级总数，传入非负整数 | `number` | - | `5` |
| color | 选中及半选的颜色，支持 CSS 颜色值；不传时取 `--vc-rate-color` | `string` | - | - |
| icon | Icon 图标名称 | `string` | - | `'star'` |
| character | 自定义字符，优先于图标 | `string` | - | - |
| half | 允许选择半星；非整数分值的小数部分统一显示为半星 | `boolean` | - | `false` |
| clearable | 点按当前分值时清零（滑动不清零） | `boolean` | - | `false` |
| readonly | 只读：仅展示，颜色照常 | `boolean` | - | `false` |
| disabled | 禁用：不可操作，整体半透明 | `boolean` | - | `false` |
| tooltip | 各星级提示，按 `Math.ceil(value) - 1` 取值，悬停与滑动时跟随预览；空数组隐藏提示区域 | `unknown[]` | - | `[]` |
| iconStyle | 每颗星外层元素的内联样式；颜色由 `color` 管理 | `object` | - | `{}` |

### 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| update:modelValue | 分值改变时更新绑定值 | `value: number \| string` | 与传入的 `modelValue` 类型一致，清空为 `0` 或 `'0'` |
| change | 点按、滑动松开或按键使分值改变时触发，包括清空 | `value: number \| string` | 同上；悬停预览、结果与当前分值相同、外部赋值都不触发 |

### 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| character | 每颗星的内容，优先于 `character` 与 `icon` 属性 | `{ index: number }`，从 0 开始 |
| tip | 自定义提示内容，仅在 `tooltip.length > 0` 时渲染 | `{ value: number }`，当前显示的分值（含悬停 / 滑动预览） |

### 键盘与无障碍

根节点为 `role="slider"`，带 `aria-valuemin`、`aria-valuemax`、`aria-valuenow`，有提示文案时 `aria-valuetext` 为已选分值的文案。可操作时 `tabindex="0"`：

| 按键 | 作用 |
| --- | --- |
| → / ↑ | 加 1 分（`half` 时 0.5） |
| ← / ↓ | 减 1 分（`half` 时 0.5） |
| Home / End | 0 分 / 满分 |

### 移动端

`MRate` 与 `Rate` 使用同一实现，属性、事件及插槽一致，可从 `@deot/vc` 导入。
