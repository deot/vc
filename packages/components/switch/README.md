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
