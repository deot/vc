## 多选框（Checkbox）

用于切换单个选项的状态，或从一组选项中选择多项。提供 `Checkbox`、`CheckboxGroup` 及移动端的 `MCheckbox`、`MCheckboxGroup`。

### 何时使用

- 使用单个多选框表示同意、订阅等可选状态。
- 使用组合将多个选项绑定到同一个数组。
- 使用半选状态表达一组选项中只有部分被选中。

### 基础用法

单独使用时，`v-model` 默认绑定布尔值。默认插槽优先于 `label` 显示。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<div>
		<Checkbox v-model="isChecked">选择条目</Checkbox>
		<p>当前状态：{{ isChecked ? '已选中' : '未选中' }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Checkbox } from '@deot/vc';

const isChecked = ref(false);
</script>
```
:::

### 禁用状态

`disabled` 禁止交互，也可与选中或半选状态一起使用。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<div class="checkbox-demo">
		<Checkbox disabled>未选中</Checkbox>
		<Checkbox :model-value="true" disabled>已选中</Checkbox>
		<Checkbox indeterminate disabled>部分选中</Checkbox>
	</div>
</template>

<script setup>
import { Checkbox } from '@deot/vc';
</script>

<style scoped>
.checkbox-demo {
	display: flex;
	flex-wrap: wrap;
	gap: 8px 16px;
}
</style>
```
:::

### 组合选择

组合使用 `value` 作为数组中的选项值，`label` 作为显示文案。`value` 未设置或为空字符串时回退到 `label`；`label` 未设置或为空字符串时回退显示 `value`。建议每个选项使用唯一且类型一致的值。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<div>
		<CheckboxGroup v-model="selectedItems">
			<Checkbox value="item-a" label="条目 A" />
			<Checkbox value="item-b" label="条目 B" />
			<Checkbox value="item-c" label="条目 C" />
		</CheckboxGroup>
		<p>已选值：{{ selectedItems }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Checkbox, CheckboxGroup } from '@deot/vc';

const selectedItems = ref(['item-a']);
</script>
```
:::

### 全选与半选

`indeterminate` 只控制外观，不改变绑定值或原生 input 的半选属性。全选状态和已选数组由调用方维护。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<div class="checkbox-demo">
		<Checkbox
			:model-value="isAllChecked"
			:indeterminate="isIndeterminate"
			@change="handleCheckAll"
		>
			全选条目
		</Checkbox>
		<CheckboxGroup v-model="selectedItems">
			<Checkbox v-for="item in items" :key="item" :value="item" />
		</CheckboxGroup>
		<p>已选择 {{ selectedItems.length }} / {{ items.length }} 项</p>
	</div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { Checkbox, CheckboxGroup } from '@deot/vc';

const items = ['条目 A', '条目 B', '条目 C'];
const selectedItems = ref(['条目 A']);
const isAllChecked = computed(() => selectedItems.value.length === items.length);
const isIndeterminate = computed(() => selectedItems.value.length > 0 && !isAllChecked.value);

const handleCheckAll = (isChecked) => {
	selectedItems.value = isChecked ? [...items] : [];
};
</script>

<style scoped>
.checkbox-demo {
	display: grid;
	gap: 8px;
}
</style>
```
:::

### 自定义选中值

单独使用时可通过 `checkedValue` 和 `uncheckedValue` 映射业务值；这两个属性在组合中无效。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<div>
		<Checkbox v-model="status" checked-value="enabled" unchecked-value="disabled">
			启用选项
		</Checkbox>
		<p>当前值：{{ status }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Checkbox } from '@deot/vc';

const status = ref('disabled');
</script>
```
:::

### 形状、纵向排列与数量上限

- `shape` 可选 `square`（方形）或 `circle`（圆形）。取值优先级为：选项自身 > 组合 > 平台默认；桌面端默认方形，移动端默认圆形。
- 组合的 `vertical` 让每项独占一行。
- `max` 限制最多可选的数量，0 表示不限。达到上限后，未选中的项显示为禁用。
- 组合的 `disabled` 禁用全部选项。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<div>
		<CheckboxGroup v-model="selected" :max="2" shape="circle" vertical>
			<Checkbox value="a" label="选项 1" />
			<Checkbox value="b" label="选项 2" />
			<Checkbox value="c" label="选项 3" />
		</CheckboxGroup>
		<p>最多可选两项，已选：{{ selected }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Checkbox, CheckboxGroup } from '@deot/vc';

const selected = ref(['a']);
</script>
```
:::

### 自定义图标

`#icon` 插槽替换内置的勾选框，参数为 `{ checked, indeterminate, disabled }`。写在组合上时作用于组内全部选项，选项自身的插槽优先。原生 input 仍覆盖在图标上，点击和键盘操作不变。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<CheckboxGroup v-model="selected">
		<template #icon="{ checked }">
			<span :class="['star', { 'is-on': checked }]">{{ checked ? '★' : '☆' }}</span>
		</template>
		<Checkbox value="a" label="收藏 1" />
		<Checkbox value="b" label="收藏 2" />
	</CheckboxGroup>
</template>

<script setup>
import { ref } from 'vue';
import { Checkbox, CheckboxGroup } from '@deot/vc';

const selected = ref(['a']);
</script>

<style scoped>
.star {
	line-height: 1;
	color: #c9cdd4;
}

.star.is-on {
	color: #456cf6;
}
</style>
```
:::

### 分组样式与尺寸

`CheckboxGroup` 的 `type` 与 `RadioGroup` 相同，适合筛选、规格等标签式的多选。设置后不再显示勾选框，整项即按钮，可以同时选中多项：

- `default`：勾选框（默认）
- `button`：灰底的独立按钮，选中时描边和文字变为主色
- `card`：连体描边的卡片式按钮
- `capsule`：灰底容器，选中项浮起
- `text`：纯文字，项间以分隔线隔开，选中项使用主色
- `round`：圆角胶囊形的独立项，选中时填充底色

`size` 可选 `mini` / `small` / `medium` / `large`，高度依次为 24 / 28 / 32 / 36px；`large` 的字号为 14px，其余为 12px。勾选框本身的大小不随 size 变化。分组上的 `size` 作用于组内所有选项，选项自身的 `size` 优先。

`max`、`disabled`、`vertical` 对分组样式同样生效；`shape` 和 `#icon` 插槽只作用于勾选框。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<div class="checkbox-demo">
		<CheckboxGroup v-for="type in types" :key="type" v-model="selected" :type="type" :size="size">
			<Checkbox value="a" label="选项 A" />
			<Checkbox value="b" label="选项 B" />
			<Checkbox value="c" label="选项 C" />
			<Checkbox value="d" label="不可选" disabled />
		</CheckboxGroup>
		<RadioGroup v-model="size" type="capsule">
			<Radio v-for="item in sizes" :key="item" :value="item" :label="item" />
		</RadioGroup>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Checkbox, CheckboxGroup, Radio, RadioGroup } from '@deot/vc';

const types = ['button', 'card', 'capsule', 'text', 'round'];
const sizes = ['mini', 'small', 'medium', 'large'];
const selected = ref(['a', 'b']);
const size = ref('medium');
</script>

<style scoped>
.checkbox-demo {
	display: grid;
	gap: 12px;
	justify-items: start;
}
</style>
```
:::

### 移动端

`MCheckbox` 与 `MCheckboxGroup` 使用相同的数据和事件约定，默认为圆形。尺寸使用 750 稿单位，随 `--vc-rem` 缩放：

- 图标盒 40，其中圆形直径 36，方形边长 32、圆角 4；
- 图标与文字间距 16，字号 32，行高 1.4；
- 组合横排间距 48；纵向排列时每行至少高 84。

禁用时文字半透明。选中后再禁用的项显示为主色的浅底加白勾。移动端没有焦点光晕。

`MCheckboxGroup` 的 `type`、`size` 与桌面端相同，外观与 `MRadioGroup` 一致：
- 长度按 375 宽下的 px 换算成 750 稿（× 2），随 `--vc-rem` 缩放；
- 四档高度在 375 宽下依次为 24 / 28 / 32 / 36（与桌面端相同），字号为 14 / 14 / 14 / 16；
- `button`、`round` 选项多时换行，横竖间距相同；
- 没有悬停样式和焦点光晕；`size` 只作用于分组样式，不改变勾选框。

:::playground
<!-- <config lang="json5">{ viewport: 375, previewInset: 16 }</config> -->
```vue
<template>
	<div class="checkbox-demo">
		<MCheckboxGroup v-model="selectedOptions" vertical>
			<MCheckbox value="option-a" label="选项 A" />
			<MCheckbox value="option-b" label="选项 B" />
			<MCheckbox value="option-c" label="选项 C（不可选）" disabled />
		</MCheckboxGroup>
		<MCheckbox v-model="agreed" shape="square" label="方形" />
		<MCheckboxGroup v-model="tags" type="round" :max="3">
			<MCheckbox v-for="item in tagOptions" :key="item" :value="item" :label="item" />
		</MCheckboxGroup>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MCheckbox, MCheckboxGroup } from '@deot/vc';

const selectedOptions = ref(['option-a']);
const agreed = ref(false);
const tagOptions = ['标签一', '标签二', '较长的标签三', '标签四', '标签五'];
const tags = ref(['标签一']);
</script>

<style scoped>
.checkbox-demo {
	display: grid;
	gap: 20px;
}
</style>
```
:::

### 只保留联动（styleless）

`styleless` 不渲染组合的外层容器，只保留选择联动，选项可以放进任意布局，例如表格单元格中。

## 主题与局部覆盖

全局参数通过 `--vc-<参数>` 配置，单个组件通过 `--vc-checkbox-<参数>`、`--vc-checkbox-group-<参数>`、`--vc-m-checkbox-<参数>`、`--vc-m-checkbox-group-<参数>` 覆盖。同一参数可能作用于多个状态；多命名空间时在使用位置中标明。

桌面端勾选框使用 checkbox，分组样式使用 checkbox-group；移动端勾选框使用 m-checkbox，分组样式使用 m-checkbox-group（参数与 RadioGroup 的分组样式相同，见 [Radio](../radio/README.md#主题与局部覆盖)）。勾选框两端选中、半选使用相同的主色参数。勾选标记使用可覆盖的 color-contrast-light。移动端禁用且选中时的底色由 color-primary 混合 50% 透明得到。

### 全局

| 参数 | 使用位置 | 值 |
| --- | --- | --- |
| color-contrast-light | 勾选标记（checkbox / m-checkbox） | `#FFFFFF`（亮暗主题相同） |
| color-error | 校验错误边框（checkbox / m-checkbox） | `#F53F3F` |
| color-light-extradeep | 禁用且选中时的勾选标记（checkbox） | 亮色：`#B9B9B9`；暗色：`#F8F8F8` |
| color-primary | 选中及半选背景、边框；移动端禁用且选中的浅底（checkbox / m-checkbox） | `#456CF6` |
| color-primary-lighter | 焦点阴影（checkbox） | `rgba(45, 140, 240, 0.2)` |
| background-color | 禁用勾选框背景（checkbox / m-checkbox） | 亮色：`#F5F6FA`；暗色：`#252B3A` |
| background-color-lightest | 勾选框背景（checkbox / m-checkbox） | 亮色：`#FFFFFF`；暗色：`#252B3A` |
| border-color | 勾选框边框及禁用边框；卡片边框（checkbox / m-checkbox / checkbox-group / m-checkbox-group） | `#D5D9E1` |
| color-dark-lightest | 分组样式文字（checkbox-group / m-checkbox-group） | 亮色：`#64758B`；暗色：`#C9C9C9` |
| color-dark-extralight | 分组样式的禁用文字（checkbox-group / m-checkbox-group） | 亮色：`#909399`；暗色：`#B9B9B9` |
| color-neutral-light | 胶囊容器背景、文字样式分隔线、圆角样式选中背景、按钮背景（checkbox-group / m-checkbox-group） | 亮色：`#EDEFF1`；暗色：`#3B4354` |
| foreground-color-inactive | 胶囊样式分隔线（checkbox-group / m-checkbox-group） | 亮色：`#C0C4CC`；暗色：`#737D8C` |

### 局部

当前组件没有额外的局部 CSS 主题参数。

## API

### Checkbox / MCheckbox 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| modelValue | 单独使用时的绑定值，严格等于 checkedValue 时选中 | `string \| number \| boolean` | - | `false` |
| value | 组合中的选项值；缺省或为空字符串时使用 label；也可作为显示文案的回退值 | `string \| number \| boolean` | - | `undefined` |
| label | 显示文案；缺省或为空字符串时使用 value；无默认插槽时渲染。字符串按文本渲染，也可传渲染函数或 `{ type, value }`，见 [Customer](../customer/README.md)，此时需同时提供 value | `string \| number \| boolean \| Function \| { type: string; value: any }` | - | `undefined` |
| disabled | 禁用当前选项 | `boolean` | - | `false` |
| indeterminate | 半选外观，仅控制样式 | `boolean` | - | `false` |
| shape | 形状；不设时取组合的 shape，再取平台默认 | `string` | `square` / `circle` | Checkbox：`square`；MCheckbox：`circle` |
| size | 尺寸；桌面端作用于勾选框的行高、字号及分组样式，移动端只作用于分组样式；不设时取分组的 size | `string` | `'mini'` / `'small'` / `'medium'` / `'large'` | `undefined`（按 `'medium'` 显示） |
| checkedValue | 单独使用时选中对应的值 | `string \| number \| boolean` | - | `true` |
| uncheckedValue | 单独使用时取消选中对应的值 | `string \| number \| boolean` | - | `false` |
| name | 传递给原生 input 的 name | `string` | - | - |

### Checkbox / MCheckbox 事件

以下事件只在单独使用时由选项交互触发。组合内由组合组件触发；外部修改 modelValue 不触发这些事件。

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| update:modelValue | 更新绑定值，用于 v-model | `(value, event, reset)` | value 为 checkedValue 或 uncheckedValue；event 为原生 change 事件；reset 为 `(checked: boolean) => void` |
| change | 选项状态改变 | `(value, event, reset)` | 与 update:modelValue 参数相同 |

`reset` 仅修改组件内部状态，不再次发出事件；使用 `v-model` 时，调用方仍需同步外部绑定值。组件没有公开实例方法。

### Checkbox / MCheckbox 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 自定义选项内容，优先于 label/value 的显示文案 | - |
| icon | 自定义勾选图标，替换内置的勾选框；优先于组合的 icon 插槽 | `{ checked: boolean; indeterminate: boolean; disabled: boolean }` |

### CheckboxGroup / MCheckboxGroup 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| modelValue | 选中值数组，建议元素为 string、number 或 boolean | `unknown[]` | - | `[]` |
| type | 组内选项的外观，见[分组样式与尺寸](#分组样式与尺寸) | `string` | `'default'` / `'button'` / `'card'` / `'capsule'` / `'text'` / `'round'` | `'default'` |
| size | 组内选项的尺寸，选项自身的 size 优先 | `string` | `'mini'` / `'small'` / `'medium'` / `'large'` | `'medium'` |
| disabled | 禁用全部选项 | `boolean` | - | `false` |
| max | 最多可选数量，0 表示不限；达到上限后未选中的项禁用 | `number` | - | `0` |
| vertical | 纵向排列，每项独占一行 | `boolean` | - | `false` |
| shape | 组内选项的形状，选项自身的 shape 优先 | `string` | `square` / `circle` | - |
| styleless | 只渲染默认插槽，不生成外层容器，保留选择联动；vertical 等容器样式不生效 | `boolean` | - | `false` |

### CheckboxGroup / MCheckboxGroup 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| update:modelValue | 子项交互后更新数组，用于 v-model | `(values, event, reset)` | values 为选中值数组；event 为原生 change 事件；reset 为 `(value: unknown) => void`，切换指定值的选中状态 |
| change | 子项选中状态改变，外部赋值不触发 | `(values, event, reset)` | 与 update:modelValue 参数相同 |

组合直接修改当前数组，事件中的 `values` 也是该数组；请传入可变的数组。回调中的 `reset` 不再次发出事件。组合没有公开实例方法。

### CheckboxGroup / MCheckboxGroup 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 对应平台的多选框选项及自定义布局 | - |
| icon | 组内全部选项的勾选图标，选项自身的 icon 插槽优先 | `{ checked: boolean; indeterminate: boolean; disabled: boolean }` |
