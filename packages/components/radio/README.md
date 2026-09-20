## 单选框（Radio）

在一组可见的备选项中选择一个选项，支持独立使用、互斥分组和按钮样式。

### 何时使用

选项数量较少且需要直接比较时使用。选项较多时可使用 Select。

### 基础用法

独立使用时，`v-model` 与 `trueValue` 严格相等表示选中。点击后写入 `trueValue`；原生单选框再次点击不会取消，可从外部修改绑定值。

:::playground
<!--
<config lang="json5">
{ previewInset: 16 }
</config>
-->
```vue
<template>
	<div class="demo">
		<Radio v-model="isSelected">选择此项</Radio>
		<p>当前值：{{ isSelected }}</p>
		<div class="actions">
			<button type="button" @click="handleReset">重置</button>
		</div>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Radio } from '@deot/vc';

const isSelected = ref(false);
const handleReset = () => {
	isSelected.value = false;
};
</script>

<style scoped>
.demo {
	display: grid;
	gap: 12px;
}
.actions {
	display: flex;
	flex-wrap: wrap;
	gap: 12px;
}
</style>
```
:::

### 禁用与自定义选中值

`disabled` 禁止用户操作；`trueValue/falseValue` 只用于独立使用，不影响组内选项的值。

:::playground
<!--
<config lang="json5">
{ previewInset: 16 }
</config>
-->
```vue
<template>
	<div class="demo">
		<Radio :model-value="false" disabled>未选中禁用</Radio>
		<Radio :model-value="true" disabled>已选中禁用</Radio>
		<Radio v-model="status" true-value="enabled" false-value="idle">启用</Radio>
		<p>当前值：{{ status }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Radio } from '@deot/vc';

const status = ref('idle');
</script>

<style scoped>
.demo {
	display: grid;
	gap: 12px;
}
.actions {
	display: flex;
	flex-wrap: wrap;
	gap: 12px;
}
</style>
```
:::

### 组合使用

使用具名导出的 `RadioGroup` 管理互斥选择。`value` 用于选择，`label` 用于显示；其中一项为 `undefined` 或空字符串时回退到另一项。默认插槽优先于自动标签，可用于自定义内容。组内监听分组的事件。

:::playground
<!--
<config lang="json5">
{ previewInset: 16 }
</config>
-->
```vue
<template>
	<div class="demo">
		<RadioGroup v-model="phone" vertical>
			<Radio value="apple" label="Apple" disabled />
			<Radio value="android" label="Android" />
			<Radio value="windows">Windows（自定义内容）</Radio>
		</RadioGroup>
		<p>当前选项：{{ phone }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Radio, RadioGroup } from '@deot/vc';

const phone = ref('apple');
</script>

<style scoped>
.demo {
	display: grid;
	gap: 12px;
}
.actions {
	display: flex;
	flex-wrap: wrap;
	gap: 12px;
}
</style>
```
:::

### 按钮样式

`RadioGroup type="button"` 配合 `Radio` 显示连体按钮。`RadioButton` 是独立的圆角按钮样式，可放入普通 `RadioGroup`，不需要设置 `type`。

:::playground
<!--
<config lang="json5">
{ previewInset: 16 }
</config>
-->
```vue
<template>
	<div class="demo">
		<div>
			<p>连体按钮</p>
			<RadioGroup v-model="city" type="button">
				<Radio label="北京" />
				<Radio label="上海" disabled />
				<Radio label="杭州" />
			</RadioGroup>
		</div>
		<div>
			<p>独立按钮</p>
			<RadioGroup v-model="city">
				<RadioButton label="北京" />
				<RadioButton label="上海" disabled />
				<RadioButton label="杭州" />
			</RadioGroup>
		</div>
		<p>当前城市：{{ city }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Radio, RadioButton, RadioGroup } from '@deot/vc';

const city = ref('北京');
</script>

<style scoped>
.demo {
	display: grid;
	gap: 12px;
}
.actions {
	display: flex;
	flex-wrap: wrap;
	gap: 12px;
}
</style>
```
:::

### 移动端

`MRadio` 使用勾选标记，`MRadioGroup` 支持垂直排列。`MRadioButton` 是 `MRadio` 的别名；移动端没有连体按钮样式，`type="button"` 不改变外观。

:::playground
<!--
<config lang="json5">
{ previewInset: 16, viewport: 375, viewportOptions: ['auto', 375] }
</config>
-->
```vue
<template>
	<div class="demo">
		<MRadioGroup v-model="delivery" vertical>
			<MRadio value="express" label="快递配送" />
			<MRadio value="pickup" label="到店自取" />
			<MRadio value="same-day" label="当日送达（暂不可用）" disabled />
		</MRadioGroup>
		<p>配送方式：{{ delivery }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MRadio, MRadioGroup } from '@deot/vc';

const delivery = ref('express');
</script>

<style scoped>
.demo {
	display: grid;
	gap: 12px;
}
.actions {
	display: flex;
	flex-wrap: wrap;
	gap: 12px;
}
</style>
```
:::

## API

### Radio 属性

`MRadio`、`MRadioButton` 和 `RadioButton` 共享下列属性。

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| modelValue | 独立使用时的绑定值，支持 `v-model` | `string \| number \| boolean` | - | `false` |
| value | 组内选择值；缺省或空字符串时使用 label | `string \| number \| boolean` | - | `undefined` |
| label | 默认显示内容；缺省或空字符串时使用 value，也可作为组内选择值 | `string \| number \| boolean` | - | `undefined` |
| disabled | 禁用当前项；组 disabled 同样生效 | `boolean` | - | `false` |
| trueValue | 独立使用时的选中值 | `string \| number \| boolean` | - | `true` |
| falseValue | 独立使用时 reset(false) 写入的值 | `string \| number \| boolean` | - | `false` |
| name | 原生 input 的 name，组内由 RadioGroup.name 决定 | `string` | - | `undefined` |

自动标签按真值判断，`0`、`false` 等内容请使用默认插槽显示。分组的选择比较使用严格相等，数字 `1` 与字符串 `'1'` 不相等。

### Radio 事件

`RadioButton`、`MRadio`、`MRadioButton` 相同。仅独立使用时由当前组件发出；组内由分组发出。

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| update:modelValue | 用户选择后同步绑定值 | `(value, e, reset)` | value 为选中值；e 为原生 Event；reset 为 `(checked: boolean) => void` |
| change | 用户选择后触发；外部修改 modelValue 不触发 | `(value, e, reset)` | 参数同上 |

`reset` 只调整组件内部状态，不发出事件，也不修改父级绑定值。它是事件回调参数，不是实例方法。

### Radio 插槽

`RadioButton`、`MRadio`、`MRadioButton` 相同。

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 自定义选项内容，优先于 label/value | - |

### RadioButton 属性

除 Radio 的属性外，支持以下标签容器定制；移动端别名不提供这两项专属属性。

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| labelClass | 内部标签 span 的 class | `string \| object` | - | `undefined` |
| labelStyle | 内部标签 span 的 style | `string \| object` | - | `undefined` |

### RadioGroup 属性

`MRadioGroup` 共享属性；其 type 不提供按钮样式。

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| modelValue | 组内选中的值，支持 `v-model` | `string \| number` | - | `''` |
| type | 桌面端 Radio 的连体按钮样式 | `string` | `'button'` | `''` |
| vertical | 垂直排列；桌面连体按钮模式下无效 | `boolean` | - | `false` |
| disabled | 禁用组内所有选项 | `boolean` | - | `false` |
| name | 组内原生 input 共享的 name | `string` | - | 自动生成的唯一名称 |
| fragment | 不渲染分组容器，保留选择联动；容器上的布局和按钮样式不生效 | `boolean` | - | `false` |

组内 value/label 应使用与分组 modelValue 类型一致的字符串或数字。

### RadioGroup 事件

`MRadioGroup` 相同。

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| update:modelValue | 用户选择后同步分组值 | `(value, e, reset)` | value 为选项值；e 为原生 Event；reset 为 `(value: string \| number) => void` |
| change | 用户选择后触发；外部修改 modelValue 不触发 | `(value, e, reset)` | 参数同上 |

分组的 `reset(value)` 仅重置内部选中值，不发出事件，也不更新父级绑定值。

### RadioGroup 插槽

`MRadioGroup` 相同。

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 放置同平台的单选项 | - |

### 主题覆盖

桌面圆点与移动端勾选项使用 `--vc-radio-*`，独立按钮使用 `--vc-radio-button-*`，连体按钮使用 `--vc-radio-group-*`。组件覆盖值优先于共享主题值。例如 `--vc-radio-color-primary` 控制桌面选中色，`--vc-radio-color-success` 控制移动端选中色。

移动端勾选标记使用 `--vc-radio-check-color`（默认白色），聚焦光晕使用 `--vc-radio-focus-color`（默认半透明绿色），均可按需覆盖。
