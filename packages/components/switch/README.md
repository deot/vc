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

使用 `checked-value`、`unchecked-value` 定义值。轨道随文案自动加宽，宽度取两段文案中较宽的一段，切换时不跳动；`width` 为桌面端的最小宽度，比文案宽时文案在滑块旁的空余区域内居中。

:::playground
```vue
<template>
	<div style="display: flex; flex-wrap: wrap; align-items: center; gap: 16px; padding: 16px;">
		<Switch v-model="status" checked-value="on" unchecked-value="off" checked-text="开启" unchecked-text="关闭" />
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
		<Switch v-model="isEnabled">
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

点击处理函数返回 Promise 时在滑块内显示加载标记（桌面端鼠标为 progress），成功后切换；等待期间重复点击无效。示例用定时器模拟异步操作。

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

`MSwitch` 共用开关值、事件、插槽和方法。尺寸为 102 × 62（750 稿），375 宽下为 51 × 31px，随 `--vc-rem` 缩放；`width`、`height`、`borderWidth` 不影响其布局。文案显示在滑块旁，离滑块约 8（4px），一个字时保持标准宽度，更长时轨道随之加宽。

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

选中轨道使用 `color-primary`，滑块使用 `color-contrast-light`，加载标记为 `color-primary-lighter` 底环加 `color-primary` 转动弧。未选中轨道按端区分：

- 桌面端亮色使用 `color-light-deepest`，文字为白色；
- 移动端亮色使用更浅的 `color-light-deeper`，文字使用 `foreground-color-light`，滑块带阴影；
- 两端暗色都使用 `background-color-light`。

支持系统主题及 `data-vc-theme="light|dark"`。禁用时整个开关半透明（opacity 0.5），保留当前状态的配色。键盘聚焦时轨道外显示 `color-primary-lighter` 光环。

### 全局

| 参数 | 使用位置 | 值 |
| --- | --- | --- |
| color-contrast-light | 滑块、桌面端文字、移动端选中文字 | `#FFFFFF`（亮暗主题相同） |
| color-light-deepest | 桌面端亮色未选中轨道及同色边框 | 亮色：`#C0C4CC`；暗色：`#e8e8e8` |
| color-light-deeper | 移动端亮色未选中轨道 | 亮色：`#EBEDEF`；暗色：`#D5D9E1` |
| color-primary | 选中轨道（桌面端含同色边框）、加载标记的转动弧 | `#456CF6` |
| color-primary-lighter | 键盘聚焦光环、加载标记的底环 | `rgba(45, 140, 240, 0.2)` |
| background-color-light | 暗色未选中轨道 | 亮色：`#F7F8FA`；暗色：`#2D3444` |
| foreground-color-light | 移动端未选中文字 | 亮色：`#667383`；暗色：`#C9C9C9` |

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
width | 桌面端最小宽度，单位 px；文案较长时轨道自动加宽 | `number` | - | `36`
height | 桌面端轨道高度，单位 px | `number` | - | `20`
borderWidth | 桌面端边框宽度，单位 px | `number` | - | `1`

### 事件

事件名 | 说明 | 回调参数 | 参数说明
---|---|---|---
update:modelValue | 用户切换时同步绑定值 | `(value, event, reset)` | 当前值、原始事件、内部状态重置函数
change | 用户切换后触发；外部修改 modelValue 不触发 | `(value, event, reset)` | 与 update:modelValue 相同
click | 切换前调用，对应 JSX 的 onClick；键盘切换同样触发 | `(event, reset)` | 原始事件、内部状态重置函数；返回值控制切换

`value` 类型为 `string | number | boolean`，`reset` 为 `(value) => void`。

键盘操作时，`event` 为对应的键盘事件。

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

### 无障碍与键盘

轨道（`MSwitch` 为根节点）带有 `role="switch"`、`aria-checked` 和 `aria-disabled`，可通过 Tab 聚焦。聚焦后按 Space 或 Enter 切换，流程与点击相同：先调用 `click`，返回 Promise 时进入加载状态。按住按键不放时不会重复切换。禁用时 `tabindex` 为 -1，不可聚焦。
