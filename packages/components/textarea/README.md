## 多行输入框（Textarea）

用于输入多行文本，支持长度限制、计数和自适应高度；移动端使用 `MTextarea`。

### 何时使用

输入备注、反馈或描述等较长内容时使用。

### 基础用法

使用 `v-model` 同步内容，`placeholder` 由调用方提供。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<div style="display: grid; gap: 24px; max-width: 420px; padding-bottom: 20px">
		<Textarea v-model="value" placeholder="请输入备注" />
		<p>当前内容：{{ value || '尚未输入' }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Textarea } from '@deot/vc';

const value = ref('');
</script>
```
:::

### 禁用与只读

`disabled` 禁止交互；原生 `readonly` 属性保留聚焦和选择文本的能力。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<div style="display: grid; gap: 24px; max-width: 420px; padding-bottom: 20px">
		<Textarea model-value="已归档的备注，无法编辑" disabled />
		<Textarea model-value="只读内容，可以选中复制" readonly />
	</div>
</template>

<script setup>
import { Textarea } from '@deot/vc';
</script>
```
:::

### 自适应高度

`autosize` 可指定 `minRows` 和 `maxRows`。当前实现中，连续输入时自动重算高度需要同时开启 `controllable` 并绑定 `v-model`；非完全受控模式下，输入同步可能跳过重新测量。容器宽度或可见性变化后，可调用实例的 `refresh()` 重新测量。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<div style="display: grid; gap: 24px; max-width: 420px; padding-bottom: 20px">
		<Textarea v-model="value" autosize controllable placeholder="输入多行内容，高度随内容增长" />
		<Textarea v-model="limitedValue" controllable :autosize="{ minRows: 2, maxRows: 4 }" placeholder="最少 2 行，最多 4 行" />
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Textarea } from '@deot/vc';

const value = ref('');
const limitedValue = ref('第一行\n第二行');
</script>
```
:::

### 长度限制与计数

`maxlength` 限制输入长度，`indicator` 显示已输入长度，`inverted` 显示剩余长度。计数读取 `modelValue`，请同时绑定 `v-model` 和 `maxlength`。外置计数需预留底部空间。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<div style="display: grid; gap: 24px; max-width: 420px; padding-bottom: 20px">
		<Textarea v-model="value" :maxlength="100" indicator placeholder="显示已输入长度" />
		<Textarea v-model="remainingValue" :maxlength="100" :indicator="{ inverted: true }" placeholder="显示剩余长度" />
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Textarea } from '@deot/vc';

const value = ref('项目备注');
const remainingValue = ref('');
</script>
```
:::

### 加权长度限制

`bytes` 模式将可打印 ASCII 字符（空格至 `~`）按半个长度、其他 UTF-16 代码单元按一个长度限制输入。这不是 UTF-8 字节长度。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<div style="display: grid; gap: 24px; max-width: 420px; padding-bottom: 20px">
		<Textarea v-model="value" :maxlength="10" bytes placeholder="最多 10 个汉字或 20 个英文字母" />
		<p>尝试输入中文、英文或混合内容。</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Textarea } from '@deot/vc';

const value = ref('');
</script>
```
:::

### 移动端

`MTextarea` 共享输入和自适应高度逻辑，采用无边框样式，禁用原生拖拽缩放，不提供计数器。

:::playground
<!-- <config lang="json5">{ previewInset: 16, viewport: 375, viewportOptions: ['auto', 375] }</config> -->
```vue
<template>
	<div style="display: grid; gap: 24px; max-width: 420px; padding-bottom: 20px">
		<MTextarea v-model="value" controllable :autosize="{ minRows: 3, maxRows: 6 }" placeholder="请输入反馈内容" />
		<MTextarea model-value="已提交的反馈" disabled />
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MTextarea } from '@deot/vc';

const value = ref('');
</script>
```
:::

## API

### Textarea 属性

下列公共属性也适用于 `MTextarea`。

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| modelValue | 绑定值，推荐字符串；输入事件产生字符串 | `string \| number \| any[]` | - | - |
| id | 原生输入元素的 id | `string` | - | - |
| disabled | 禁用输入 | `boolean` | - | `false` |
| maxlength | 最大输入长度；默认按 UTF-16 代码单元限制 | `number` | - | - |
| bytes | 使用上述加权长度限制 | `boolean` | - | `false` |
| controllable | 完全受控，输入值由 modelValue 决定，调用方需接收并回传更新 | `boolean` | - | `false` |
| allowDispatch | 向所属 FormItem 派发 change 和 blur | `boolean` | - | `true` |
| wrap | 原生换行模式；soft 不将视觉折行写入提交值，hard 按原生规则处理 | `string` | `soft`、`hard` | `soft` |
| rows | 默认可见行数 | `number` | - | `2` |
| autosize | 自适应高度，可指定行数范围 | `boolean \| { minRows?: number; maxRows?: number }` | - | `false` |
| textareaStyle | 原生 textarea 样式；自动计算的高度样式后合并 | `object \| object[]` | - | - |
| indicator | 仅 Textarea：计数，inverted 显示剩余数，inline 放在框内右下角 | `boolean \| { inverted?: boolean; inline?: boolean }` | - | `false` |
| indicateClass | 仅 Textarea：计数元素的 class | `string` | - | - |

`placeholder`、`readonly`、`name`、`autofocus`、`autocomplete`、`spellcheck` 通过 attrs 传给原生 textarea，不是声明的 props，组件不设置默认值。`autocomplete` 使用原生字符串值（如 `on`、`off`）。其他 attrs 默认落在外层容器上，不保证传给原生 textarea，例如 `cols`。

### Textarea 事件

下列事件也适用于 `MTextarea`。

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| update:modelValue | 同步绑定值 | `(value: string, e: Event) => void` | 处理后的值和输入事件 |
| input | 输入更新时触发，组合输入结束后同步 | `(value: string, e: Event) => void` | 处理后的值和输入事件 |
| change | 输入同步和原生 change 都会触发 | `(value: string, e: Event) => void` 或 `(e: Event) => void` | 输入同步传两个参数；原生 change 仅传事件，可能再次触发 |
| focus | 聚焦 | `(e: FocusEvent) => void` | 原生事件 |
| blur | 失焦 | `(e: FocusEvent) => void` | 原生事件 |
| paste | 粘贴 | `(e: ClipboardEvent, text: string) => void` | 原生事件和剪贴板纯文本 |
| keydown | 按下键盘按键 | `(e: KeyboardEvent) => void` | 原生事件 |
| keypress | 原生 keypress | `(e: KeyboardEvent) => void` | 原生事件 |
| keyup | 松开键盘按键 | `(e: KeyboardEvent) => void` | 原生事件 |
| enter | Enter 松开时触发 | `(e: KeyboardEvent) => void` | 在 keyup 中检测 keyCode 13 |
| resize | 原生输入区域尺寸变化 | `() => void` | 当前 Resize 依赖调用监听器时不传参数 |

### Textarea 方法

通过组件 ref 调用，`MTextarea` 同样支持。

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| focus | 聚焦原生 textarea | - | `void` |
| blur | 使原生 textarea 失焦 | - | `void` |
| click | 调用原生 click 后聚焦 | - | `void` |
| refresh | 下一次 DOM 更新后重新计算高度，仅在 autosize 开启时有效 | - | `void` |

### MTextarea 属性

公共属性见上表。移动端额外声明 `align: string`，默认 `left`，但当前渲染没有应用该属性，设置它不会改变对齐。需要对齐时可使用 `textareaStyle` 的 `textAlign`。

### 当前行为说明

- 两个组件均不渲染插槽，不提供 `clearable` 或清空按钮。`clear`、`cancel` 虽在 emits 中声明，当前实现没有触发路径。
- `bytes` 的输入限制与桌面计数器目前采用不同计算方式：计数为“字符串长度减去（可打印 ASCII 数的一半向上取整，再减去其他代码单元数）”。例如 `abcd` 显示 2，`中文` 显示 4；剩余计数为 maxlength 减去该值。因此不建议把 `bytes + indicator` 当作精确的剩余输入量提示。
