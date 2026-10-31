## 单选框（Radio）

在一组可见的备选项中选择一个选项，支持独立使用、互斥分组、按钮、卡片、胶囊、文字、圆角等分组样式和四档尺寸。

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
		<RadioGroup v-model="selectedOption" vertical>
			<Radio value="option-a" label="选项 A" disabled />
			<Radio value="option-b" label="选项 B" />
			<Radio value="option-c">选项 C（自定义内容）</Radio>
		</RadioGroup>
		<p>当前选项：{{ selectedOption }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Radio, RadioGroup } from '@deot/vc';

const selectedOption = ref('option-a');
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

### 分组样式

`RadioGroup` 的 `type` 决定组内 `Radio` 的外观，设置后不再显示圆点，整项即按钮：

- `default`：圆点（默认）
- `button`：灰底的独立按钮，悬停或选中时描边变为主色，表单校验失败时显示错误色
- `card`：连体描边的卡片式按钮
- `capsule`：灰底容器内的分段选择，选中项浮起，适合在少量视图间切换
- `text`：纯文字，项间以分隔线隔开，选中项使用主色
- `round`：圆角胶囊形的独立项，悬停或选中时填充底色

`RadioButton` 是单项的 `button` 样式，外观不随分组的 `type` 变化；需要在同一组内混用按钮和圆点时使用它，整组都是按钮时直接设置 `type="button"`。键盘方向键可在组内切换，聚焦光晕只在键盘操作时出现。

:::playground
<!--
<config lang="json5">
{ previewInset: 16 }
</config>
-->
```vue
<template>
	<div class="demo">
		<div v-for="type in types" :key="type" class="row">
			<span class="name">{{ type }}</span>
			<RadioGroup v-model="selectedGroup" :type="type">
				<Radio label="分组 A" />
				<Radio label="分组 B" />
				<Radio label="分组 C" disabled />
				<Radio label="分组 D" />
			</RadioGroup>
		</div>
		<div class="row">
			<span class="name">RadioButton</span>
			<RadioGroup v-model="selectedGroup">
				<RadioButton label="分组 A" />
				<RadioButton label="分组 B" />
				<RadioButton label="分组 C" disabled />
				<Radio label="分组 D" />
			</RadioGroup>
		</div>
		<p>当前分组：{{ selectedGroup }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Radio, RadioButton, RadioGroup } from '@deot/vc';

const types = ['default', 'button', 'card', 'capsule', 'text', 'round'];
const selectedGroup = ref('分组 A');
</script>

<style scoped>
.demo {
	display: grid;
	gap: 12px;
}
.row {
	display: flex;
	align-items: center;
	gap: 16px;
}
.name {
	width: 96px;
}
</style>
```
:::

### 尺寸

`size` 可选 `mini` / `small` / `medium` / `large`，高度依次为 24 / 28 / 32 / 36px，`large` 的字号为 14px，其余为 12px。分组上的 `size` 作用于组内所有选项，选项自身的 `size` 优先；独立使用的 `Radio`、`RadioButton` 也可单独设置。

:::playground
<!--
<config lang="json5">
{ previewInset: 16 }
</config>
-->
```vue
<template>
	<div class="demo">
		<RadioGroup v-model="size" type="capsule" :size="size">
			<Radio v-for="item in sizes" :key="item" :label="item" />
		</RadioGroup>
		<RadioGroup v-model="selectedOption" :size="size">
			<Radio value="option-a" label="选项 A" />
			<Radio value="option-b" label="选项 B" />
		</RadioGroup>
		<RadioGroup v-model="selectedOption" type="button" :size="size">
			<Radio value="option-a" label="选项 A" />
			<Radio value="option-b" label="选项 B" />
		</RadioGroup>
		<RadioGroup v-model="selectedOption" type="card" :size="size">
			<Radio value="option-a" label="选项 A" />
			<Radio value="option-b" label="选项 B" />
		</RadioGroup>
		<RadioGroup v-model="selectedOption" type="round" :size="size">
			<Radio value="option-a" label="选项 A" />
			<Radio value="option-b" label="选项 B" />
		</RadioGroup>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Radio, RadioGroup } from '@deot/vc';

const sizes = ['mini', 'small', 'medium', 'large'];
const size = ref('medium');
const selectedOption = ref('option-a');
</script>

<style scoped>
.demo {
	display: grid;
	justify-items: start;
	gap: 12px;
}
</style>
```
:::

### 移动端

`MRadio` 使用勾选标记，`MRadioGroup` 支持垂直排列。`MRadioButton` 是 `MRadio` 的别名；移动端没有分组样式和尺寸，`type`、`size` 不改变外观。

:::playground
<!--
<config lang="json5">
{ previewInset: 16, viewport: 375, viewportOptions: ['auto', 375] }
</config>
-->
```vue
<template>
	<div class="demo">
		<MRadioGroup v-model="selectedOption" vertical>
			<MRadio value="option-a" label="选项 A" />
			<MRadio value="option-b" label="选项 B" />
			<MRadio value="option-c" label="选项 C（暂不可用）" disabled />
		</MRadioGroup>
		<p>已选值：{{ selectedOption }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MRadio, MRadioGroup } from '@deot/vc';

const selectedOption = ref('option-a');
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

## 主题与局部覆盖

全局参数通过 `--vc-<参数>` 配置，单个组件通过 `--vc-radio-<参数>`、`--vc-radio-group-<参数>` 覆盖。同一参数可能作用于多个状态；多命名空间时在使用位置中标明。

桌面端圆点与移动端勾选项使用相同的主色及焦点参数。桌面端选中且禁用时保留主色、降低不透明度（圆点与各分组样式一致）；移动端保留勾选形态，正常勾选标记使用可覆盖的 color-contrast-light，禁用标记使用 color-dark-extralight。

### 全局

| 参数 | 使用位置 | 值 |
| --- | --- | --- |
| color-contrast-light | 移动端勾选标记（radio） | `#FFFFFF`（亮暗主题相同） |
| color-dark-light | 胶囊、文字、圆角样式的悬停文字（radio-group） | 亮色：`#080F20`；暗色：`#E8E8E8` |
| color-dark-lightest | 分组样式文字（radio-group） | 亮色：`#64758B`；暗色：`#C9C9C9` |
| color-dark-extralight | 桌面端分组样式的禁用文字，移动端禁用的勾选标记（radio / radio-group） | 亮色：`#909399`；暗色：`#B9B9B9` |
| color-error | 校验错误的圆点边框、按钮文字及描边（radio / radio-group） | `#F53F3F` |
| color-light-deepest | 单选框边框（radio） | 亮色：`#C0C4CC`；暗色：`#E8E8E8` |
| color-neutral-light | 胶囊容器背景、文字样式分隔线、圆角样式悬停及选中背景、按钮背景（radio-group） | 亮色：`#EDEFF1`；暗色：`#3B4354` |
| color-primary | 桌面端选中标记、文字及边框，移动端选中背景及边框；桌面端选中且禁用时，文字及选中标记取 70%、描边取 50% 不透明度（radio / radio-group） | `#456CF6` |
| color-primary-lighter | 桌面及移动端焦点阴影（radio / radio-group） | `rgba(45, 140, 240, 0.2)` |
| background-color | 禁用背景、文字样式悬停背景（radio / radio-group） | 亮色：`#F5F6FA`；暗色：`#252B3A` |
| background-color-lightest | 单选框及卡片背景、胶囊样式悬停及选中项背景（radio / radio-group） | 亮色：`#FFFFFF`；暗色：`#252B3A` |
| border-color | 卡片边框，与输入框相同（radio-group） | `#D5D9E1`（亮暗主题相同） |
| foreground-color-inactive | 胶囊样式分隔线（radio-group） | 亮色：`#C0C4CC`；暗色：`#737D8C` |

### 局部

当前组件没有额外的局部 CSS 主题参数。

## API

### Radio 属性

`RadioButton`、`MRadio`、`MRadioButton` 共享下列属性。

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| modelValue | 独立使用时的绑定值，支持 `v-model` | `string \| number \| boolean` | - | `false` |
| value | 组内选择值；缺省或空字符串时使用 label | `string \| number \| boolean` | - | `undefined` |
| label | 默认显示内容；缺省或空字符串时使用 value，也可作为组内选择值。字符串按文本渲染，也可传渲染函数或 `{ type, value }`，见 [Customer](../customer/README.md)，此时需同时提供 value | `string \| number \| boolean \| Function \| { type: string; value: any }` | - | `undefined` |
| disabled | 禁用当前项；组 disabled 同样生效 | `boolean` | - | `false` |
| trueValue | 独立使用时的选中值 | `string \| number \| boolean` | - | `true` |
| falseValue | 独立使用时 reset(false) 写入的值 | `string \| number \| boolean` | - | `false` |
| name | 原生 input 的 name，组内由 RadioGroup.name 决定 | `string` | - | `undefined` |
| size | 尺寸，仅桌面端；不设时取分组的 size | `string` | `'mini'` / `'small'` / `'medium'` / `'large'` | `undefined`（按 `'medium'` 显示） |

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

### RadioGroup 属性

`MRadioGroup` 共享属性；其 type、size 不改变外观。

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| modelValue | 组内选中的值，支持 `v-model` | `string \| number` | - | `''` |
| type | 组内 Radio 的外观，见[分组样式](#分组样式) | `string` | `'default'` / `'button'` / `'card'` / `'capsule'` / `'text'` / `'round'` | `'default'` |
| size | 组内选项的尺寸，选项自身的 size 优先 | `string` | `'mini'` / `'small'` / `'medium'` / `'large'` | `'medium'` |
| vertical | 垂直排列，胶囊、文字样式下不显示分隔线；卡片模式下无效 | `boolean` | - | `false` |
| disabled | 禁用组内所有选项 | `boolean` | - | `false` |
| name | 组内原生 input 共享的 name | `string` | - | 自动生成的唯一名称 |
| fragment | 不渲染分组容器，保留选择联动；各项的分组样式仍生效，容器上的排列与胶囊底色不生效 | `boolean` | - | `false` |

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

桌面圆点与移动端勾选项使用 `--vc-radio-*`，分组样式（按钮、卡片、胶囊、文字、圆角，含 `RadioButton`）使用 `--vc-radio-group-*`。组件覆盖值优先于共享主题值。例如 `--vc-radio-color-primary` 同时控制桌面和移动端选中色。

移动端正常勾选标记使用 `--vc-radio-color-contrast-light`（默认白色），禁用标记使用 `--vc-radio-color-dark-extralight`；两端聚焦光晕使用 `--vc-radio-color-primary-lighter`（默认 `rgba(45, 140, 240, 0.2)`），均可按需覆盖。
