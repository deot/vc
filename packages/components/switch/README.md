## 开关（Switch）

在两个状态之间切换，支持自定义值、文案和异步切换。移动端使用 `MSwitch`。

### 何时使用

需要即时启用或关闭某项设置时使用。

### 基础用法

:::playground
```vue
<template>
	<div style="display: flex; flex-wrap: wrap; align-items: center; gap: 16px; padding: 16px;">
		<Switch v-model="isEnabled" /><span>{{ isEnabled ? '已开启' : '已关闭' }}</span>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Switch } from '@deot/vc';

const isEnabled = ref(false);
</script>
```
:::

### 自定义值和文案

使用 `checked-value`、`unchecked-value` 定义值。较长文案可通过 `width` 增加桌面端宽度。

:::playground
```vue
<template>
	<div style="display: flex; flex-wrap: wrap; align-items: center; gap: 16px; padding: 16px;">
		<Switch v-model="status" checked-value="on" unchecked-value="off" checked-text="开启" unchecked-text="关闭" :width="60" />
		<span>当前值：{{ status }}</span>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Switch } from '@deot/vc';

const status = ref('off');
</script>
```
:::

### 禁用状态

:::playground
```vue
<template>
	<div style="display: flex; flex-wrap: wrap; align-items: center; gap: 16px; padding: 16px;">
		<Switch :model-value="true" disabled /><Switch :model-value="false" disabled />
	</div>
</template>

<script setup>
import { Switch } from '@deot/vc';
</script>
```
:::

### 自定义显示内容

插槽优先于对应的文案属性。

:::playground
```vue
<template>
	<div style="display: flex; flex-wrap: wrap; align-items: center; gap: 16px; padding: 16px;">
		<Switch v-model="isEnabled" :width="64">
			<template #checked>ON</template>
			<template #unchecked>OFF</template>
		</Switch>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Switch } from '@deot/vc';

const isEnabled = ref(true);
</script>
```
:::

### 异步切换

点击处理函数返回 Promise 时显示加载状态，成功后切换；等待期间重复点击无效。示例用定时器模拟异步操作。

:::playground
```vue
<template>
	<div style="display: flex; flex-wrap: wrap; align-items: center; gap: 16px; padding: 16px;">
		<Switch v-model="isEnabled" @click="handleClick" /><span>{{ isEnabled ? '已开启' : '已关闭' }}（点击后等待一秒）</span>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Switch } from '@deot/vc';

const isEnabled = ref(false);
const handleClick = () => new Promise(resolve => setTimeout(resolve, 1000));
</script>
```
:::

### 移动端

`MSwitch` 共用开关值、事件、插槽和方法。尺寸固定为 51 × 31px，`width`、`height`、`borderWidth` 不影响其布局，建议使用简短文案。

:::playground
<!--
<config lang="json5">
{ viewport: 375 }
</config>
-->
```vue
<template>
	<div style="display: flex; flex-wrap: wrap; align-items: center; gap: 16px; padding: 16px;">
		<MSwitch v-model="isEnabled" checked-text="开" unchecked-text="关" />
		<MSwitch :model-value="true" disabled />
		<MSwitch :model-value="false" disabled />
		<MSwitch v-model="isAsyncEnabled" @click="handleClick" />
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MSwitch } from '@deot/vc';

const isEnabled = ref(false);
const isAsyncEnabled = ref(false);
const handleClick = () => new Promise(resolve => setTimeout(resolve, 1000));
</script>
```
:::

## 主题与局部覆盖

全局参数通过 `--vc-<参数>` 配置，单个组件通过 `--vc-switch-<参数>` 覆盖。同一参数可能作用于多个状态；多命名空间时在使用位置中标明。

桌面端和移动端使用相同的状态配色。普通文字和滑块使用 `color-contrast-light`，加载标记使用 `color-primary`，暗色禁用文字和滑块使用 `foreground-color-inactive`。⚠ color-mix：移动端滑块边框由 color-contrast-dark 以 13% 与透明色混合。⚠ color-mix：选中禁用轨道由 color-primary-light 30% 与 background-color-lightest 70% 混合；不支持时使用 color-primary-lighter。

未选中且可交互的轨道，亮色使用 `color-light-deepest`，暗色使用 `background-color-light`，与白色文字和滑块保持区分；支持系统主题及 `data-vc-theme="light|dark"`。

透明色增强声明仅在 `@supports` 内生效；不支持 color-mix 时使用 Sass 编译的固定黑色 rgba() 降级值，透明度与上述比例一致，降级值不会随 color-contrast-dark 变量变化。

### 全局

| 参数 | 使用位置 | 值 |
| --- | --- | --- |
| color-contrast-dark | 移动端滑块边框的派生基色 | `#000000`（亮暗主题相同） |
| color-contrast-light | 普通文字、普通滑块及亮色禁用文字和滑块 | `#FFFFFF`（亮暗主题相同） |
| color-light-deepest | 亮色未选中轨道及同色边框 | 亮色：`#C0C4CC`；暗色：`#E8E8E8` |
| color-primary | 选中轨道及同色边框、加载标记 | `#456CF6` |
| color-primary-light | 选中禁用轨道派生 | `#4A96FF` |
| color-primary-lighter | 选中禁用轨道降级色 | `rgba(45, 140, 240, 0.2)` |
| background-color-light | 未选中禁用轨道、暗色未选中轨道及同色边框 | 亮色：`#F7F8FA`；暗色：`#2D3444` |
| background-color-lightest | 禁用主色混合表面 | 亮色：`#FFFFFF`；暗色：`#252B3A` |
| foreground-color-inactive | 暗色禁用文字和滑块 | 亮色：`#C0C4CC`；暗色：`#737D8C` |
| box-shadow-floating | 移动端滑块阴影 | 亮色：`0 4px 12px rgba(0, 0, 0, 0.12)`；暗色：`0 4px 12px rgba(0, 0, 0, 0.32)` |

### 局部

当前组件没有额外的局部 CSS 主题参数。

## API

以下 API 适用于 `Switch` 和 `MSwitch`，尺寸属性仅作用于 `Switch`。

### 属性

属性 | 说明 | 类型 | 可选值 | 默认值
---|---|---|---|---
modelValue | 当前值，支持 v-model；严格等于 checkedValue 时选中 | `string \| number \| boolean` | - | `false`
checkedValue | 选中值 | `string \| number \| boolean` | - | `true`
uncheckedValue | 未选中值 | `string \| number \| boolean` | - | `false`
disabled | 禁止点击切换 | `boolean` | - | `false`
checkedText | 选中文案 | `string` | - | `''`
uncheckedText | 未选中文案 | `string` | - | `''`
name | 内部隐藏 input 的 name | `string` | - | -
width | 桌面端宽度，单位 px | `number` | - | `36`
height | 桌面端轨道高度，单位 px | `number` | - | `20`
borderWidth | 桌面端边框宽度，单位 px | `number` | - | `1`

### 事件

事件名 | 说明 | 回调参数 | 参数说明
---|---|---|---
update:modelValue | 用户切换时同步绑定值 | `(value, event, reset)` | 当前值、原始鼠标事件、内部状态重置函数
change | 用户切换后触发；外部修改 modelValue 不触发 | `(value, event, reset)` | 与 update:modelValue 相同
click | 切换前调用，对应 JSX 的 onClick | `(event, reset)` | 原始鼠标事件、内部状态重置函数；返回值控制切换

`value` 类型为 `string | number | boolean`，`reset` 为 `(value) => void`。

`click` 返回假值（包括 `undefined`）时立即切换；返回非 Promise 真值时阻止自动切换；返回 Promise 时在成功后切换，拒绝时不切换，并在结束后清除加载状态。组件没有内置错误提示。

### 插槽

名称 | 说明 | 参数
---|---|---
checked | 当前值严格等于 checkedValue 时显示，覆盖 checkedText | -
unchecked | 当前值严格等于 uncheckedValue 时显示，覆盖 uncheckedText | -

### 方法

方法名 | 说明 | 参数 | 返回值
---|---|---|---
reset | 仅重置内部显示状态，不更新父级 v-model，不触发 change | `value: string \| number \| boolean` | `void`

`reset(value)` 将严格等于 `checkedValue` 的值归为选中，其余值归为 `uncheckedValue`。需要同步父级状态时，由调用方同时修改绑定值。
