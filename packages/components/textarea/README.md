## 多行输入框（Textarea）

用于输入多行文本，支持长度限制、计数和自适应高度。

移动端入口导出的 `MTextarea` 有独立的移动端实现，尺寸按 750 稿随 `--vc-rem` 缩放，见 [移动端](#移动端)。

### 何时使用

输入备注、反馈或描述等较长内容时使用。

### 基础用法

使用 `v-model` 同步内容，`placeholder` 由调用方提供。

:::playground
<!--
<config lang="json5">
{
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="textarea-demo">
		<Textarea v-model="value" placeholder="请输入备注" />
		<p class="textarea-demo__result">当前内容：{{ value || '尚未输入' }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Textarea } from '@deot/vc';

const value = ref('');
</script>

<style scoped>
.textarea-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
	width: 420px;
	max-width: 100%;
}

.textarea-demo__result {
	margin: 0;
}
</style>
```
:::

### 禁用与只读

`disabled` 禁止交互；原生 `readonly` 属性保留聚焦和选择文本的能力。

:::playground
<!--
<config lang="json5">
{
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="textarea-demo">
		<Textarea model-value="已归档的备注，无法编辑" disabled />
		<Textarea model-value="只读内容，可以选中复制" readonly />
	</div>
</template>

<script setup>
import { Textarea } from '@deot/vc';
</script>

<style scoped>
.textarea-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
	width: 420px;
	max-width: 100%;
}
</style>
```
:::

### 只读文字

`plaintext` 时只显示 `v-model` 的值，不渲染文本框：输出一个没有样式的 `<span class="vc-textarea-plaintext">`（移动端为 `vcm-textarea-plaintext`），不能交互。换行转为 `<br>`，不依赖样式；没有值时显示 `extra`，未传时为空。与原生 `readonly`（保留文本框外观）不同。

:::playground
<!--
<config lang="json5">
{
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="textarea-demo">
		<Textarea :model-value="'第一行\n第二行'" plaintext />
		<Textarea extra="-" plaintext />
	</div>
</template>

<script setup>
import { Textarea } from '@deot/vc';
</script>

<style scoped>
.textarea-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}
</style>
```
:::

### 行数、换行与样式

`rows` 设置默认可见行数（默认 `2`）；`wrap` 对应原生换行模式，`hard` 会把视觉折行写入提交值；`textareaStyle` 设置原生 textarea 的样式，`id` 设置原生 textarea 的 id。

:::playground
<!--
<config lang="json5">
{
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="textarea-demo">
		<Textarea v-model="value" :rows="4" placeholder="默认 4 行" />
		<label class="textarea-demo__label" for="textarea-demo-hard">wrap="hard"，点击这段文字聚焦</label>
		<Textarea
			id="textarea-demo-hard"
			v-model="hardValue"
			wrap="hard"
			:textarea-style="{ fontFamily: 'monospace' }"
			placeholder="等宽字体"
		/>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Textarea } from '@deot/vc';

const value = ref('');
const hardValue = ref('');
</script>

<style scoped>
.textarea-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
	width: 420px;
	max-width: 100%;
}

.textarea-demo__label {
	cursor: pointer;
}
</style>
```
:::

### 自适应高度

`autosize` 可指定 `minRows` 和 `maxRows`。当前实现中，连续输入时自动重算高度需要同时开启 `controllable` 并绑定 `v-model`；非完全受控模式下，输入同步可能跳过重新测量。容器宽度或可见性变化后，可调用实例的 `refresh()` 重新测量。

:::playground
<!--
<config lang="json5">
{
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="textarea-demo">
		<Textarea v-model="value" autosize controllable placeholder="输入多行内容，高度随内容增长" />
		<Textarea
			v-model="limitedValue"
			controllable
			:autosize="{ minRows: 2, maxRows: 4 }"
			placeholder="最少 2 行，最多 4 行"
		/>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Textarea } from '@deot/vc';

const value = ref('');
const limitedValue = ref('第一行\n第二行');
</script>

<style scoped>
.textarea-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
	width: 420px;
	max-width: 100%;
}
</style>
```
:::

### 长度限制与计数

`maxlength` 限制输入长度，`indicator` 显示已输入长度，`inverted` 显示剩余长度；需同时设置 `maxlength`。计数默认在框外右下方，组件下方自动留出它的高度，不与后面的内容或表单的错误提示重叠；`inline` 放在框内右下角，文本区底部同样留出它的高度。`indicateClass` 设置计数元素的 class。值超过 `maxlength`（如外部直接赋值）时计数显示为错误色。

:::playground
<!--
<config lang="json5">
{
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="textarea-demo">
		<Textarea v-model="value" :maxlength="100" indicator placeholder="显示已输入长度" />
		<Textarea
			v-model="remainingValue"
			:maxlength="100"
			:indicator="{ inverted: true }"
			placeholder="显示剩余长度"
		/>
		<Textarea
			v-model="inlineValue"
			:maxlength="50"
			:indicator="{ inline: true }"
			indicate-class="textarea-demo__indicator"
			placeholder="计数在框内"
		/>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Textarea } from '@deot/vc';

const value = ref('一段示例文字');
const remainingValue = ref('');
const inlineValue = ref('');
</script>

<style scoped>
.textarea-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
	width: 420px;
	max-width: 100%;
}

.textarea-demo :deep(.textarea-demo__indicator) {
	color: var(--vc-color-primary);
}
</style>
```
:::

### 加权长度限制

`bytes` 模式将可打印 ASCII 字符（空格至 `~`）按半个长度、其他 UTF-16 代码单元按一个长度限制输入。这不是 UTF-8 字节长度。

:::playground
<!--
<config lang="json5">
{
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="textarea-demo">
		<Textarea
			v-model="value"
			:maxlength="10"
			bytes
			indicator
			placeholder="最多 10 个汉字或 20 个英文字母"
		/>
		<p class="textarea-demo__result">尝试输入中文、英文或混合内容。</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Textarea } from '@deot/vc';

const value = ref('');
</script>

<style scoped>
.textarea-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
	width: 420px;
	max-width: 100%;
}

.textarea-demo__result {
	margin: 0;
}
</style>
```
:::

### 事件与方法

`focus`、`blur`、`enter`、`paste` 及 `keydown`、`keypress`、`keyup` 透出原生交互；拖动右下角改变尺寸时发出 `resize`。通过组件 ref 调用 `focus`、`blur`、`click` 和 `refresh`。

:::playground
<!--
<config lang="json5">
{
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="textarea-demo">
		<Textarea
			ref="textareaRef"
			v-model="value"
			controllable
			autosize
			placeholder="输入、粘贴、回车或拖动右下角"
			@focus="handleFocus"
			@blur="handleBlur"
			@enter="handleEnter"
			@paste="handlePaste"
			@resize="handleResize"
			@keydown="handleKey"
			@keypress="handleKey"
			@keyup="handleKey"
		/>
		<div class="textarea-demo__row">
			<Button size="small" @click="handleCallFocus">focus()</Button>
			<Button size="small" @click="handleCallBlur">blur()</Button>
			<Button size="small" @click="handleCallClick">click()</Button>
			<Button size="small" @click="handleCallRefresh">refresh()</Button>
		</div>
		<p class="textarea-demo__result">{{ log }}</p>
		<p class="textarea-demo__result">按键事件 {{ keyCount }} 次，resize {{ resizeCount }} 次</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Textarea, Button } from '@deot/vc';

const textareaRef = ref();
const value = ref('');
const log = ref('等待操作');
const keyCount = ref(0);
const resizeCount = ref(0);

const handleFocus = () => {
	log.value = 'focus';
};

const handleBlur = () => {
	log.value = 'blur';
};

const handleEnter = () => {
	log.value = `enter：共 ${value.value.split('\n').length} 行`;
};

const handlePaste = (event, text) => {
	log.value = `paste：${text}`;
};

const handleResize = () => {
	resizeCount.value++;
};

const handleKey = () => {
	keyCount.value++;
};

const handleCallFocus = () => {
	textareaRef.value.focus();
};

const handleCallBlur = () => {
	textareaRef.value.blur();
};

const handleCallClick = () => {
	textareaRef.value.click();
};

const handleCallRefresh = () => {
	textareaRef.value.refresh();
	log.value = '已重新计算高度';
};
</script>

<style scoped>
.textarea-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
	width: 420px;
	max-width: 100%;
}

.textarea-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}

.textarea-demo__result {
	margin: 0;
}
</style>
```
:::

## 移动端

`MTextarea` 与 `Textarea` 共享输入、计数和自适应高度逻辑，根节点为 `.vcm-textarea`，采用无边框样式，禁用原生拖拽缩放；计数始终在框内。另有 `right` 让文字右对齐，颜色不变，与 `MInput` 的 `right` 一致。尺寸按 750 稿设计，写为 `calc(var(--vc-rem) * n)`，随 `--vc-rem` 缩放；底栏切换 `rem` 可查看不同屏宽下的效果。

:::playground
<!--
<config lang="json5">
{
	mobile: true
}
</config>
-->
```vue
<template>
	<div class="m-textarea-demo">
		<MTextarea v-model="text" placeholder="请输入内容" />
		<MTextarea v-model="note" :maxlength="100" indicator placeholder="最多 100 字" />
		<MTextarea v-model="limited" :maxlength="10" :indicator="{ inverted: true }" placeholder="显示剩余字数" />
		<MTextarea v-model="exceeded" :maxlength="10" indicator />
		<MTextarea
			v-model="auto"
			controllable
			:autosize="{ minRows: 3, maxRows: 6 }"
			placeholder="3 至 6 行，超过后滚动"
		/>
		<MTextarea v-model="remark" right :rows="1" placeholder="右对齐" />
		<MTextarea model-value="不可编辑的内容" disabled />
		<MForm :model="form">
			<MFormItem label="说明" prop="note">
				<MTextarea v-model="form.note" autosize :maxlength="50" indicator placeholder="表单中去掉内边距" />
			</MFormItem>
		</MForm>
	</div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { MTextarea, MForm, MFormItem } from '@deot/vc';

const text = ref('');
const note = ref('');
const limited = ref('');
const exceeded = ref('这段内容由外部直接赋值，超过了上限');
const auto = ref('');
const remark = ref('');
const form = reactive({ note: '' });
</script>

<style scoped>
.m-textarea-demo {
	display: flex;
	flex-direction: column;
	gap: calc(var(--vc-rem) * 16);
	background: var(--vc-background-color-light);
}
</style>
```
:::

尺寸与 `MInput` 一致（括号内为 375 宽下的 px）：

| 项 | 值 |
| --- | --- |
| 单独使用 | 白底一整块，内边距 32（16） |
| 文字 | 字号 32（16），行高 44（22）；高度由 `rows`（默认 2 行）或 `autosize` 决定 |
| 光标 | `color-primary` |
| 禁用 | 文字为 `color-dark-extralight`，同时设置 `-webkit-text-fill-color`，iOS 上颜色与设定一致 |
| 计数（`indicator`） | 始终在框内右下角，排在文本区下方，与文字间距 16（8）；字号 28（14），行高 40（20），`color-dark-extralight`，超出时为 `color-error` |
| 表单（`MForm`）中 | 去掉内边距，首行与标签对齐 |

## 主题与局部覆盖

全局参数通过 `--vc-<参数>` 配置，单个组件通过 `--vc-textarea-<参数>` 覆盖。同一参数可能作用于多个状态；多命名空间时在使用位置中标明。

### 全局

| 参数 | 使用位置 | 值 |
| --- | --- | --- |
| color-dark-light | 输入文字 | 亮色：`#080F20`；暗色：`#E8E8E8` |
| color-dark-extralight | 占位、字数提示、桌面及移动端禁用文字 | 亮色：`#909399`；暗色：`#B9B9B9` |
| color-error | 错误边框；计数超出 maxlength | `#F53F3F` |
| color-primary | 焦点及悬停边框；移动端光标 | `#456CF6` |
| color-primary-lighter | 焦点阴影 | `rgba(45, 140, 240, 0.2)` |
| background-color-light | 桌面端禁用背景 | 亮色：`#F7F8FA`；暗色：`#2D3444` |
| background-color-lightest | 文本域背景 | 亮色：`#FFFFFF`；暗色：`#252B3A` |
| border-color | 桌面端边框 | `#D5D9E1` |

### 局部

当前组件没有额外的局部 CSS 主题参数。

## API

### Textarea 属性

下列公共属性也适用于 `MTextarea`。

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| modelValue | 绑定值，推荐字符串；输入事件产生字符串 | `string \| number \| any[]` | - | - |
| id | 原生输入元素的 id | `string` | - | - |
| disabled | 禁用输入 | `boolean` | - | `false` |
| plaintext | 只显示值的文字（换行转为 `<br>`），不渲染文本框，没有样式、不能交互；见[只读文字](#只读文字) | `boolean` | - | `false` |
| extra | `plaintext` 没有值时显示的文字 | `string` | - | `''` |
| maxlength | 最大输入长度；默认按 UTF-16 代码单元限制 | `number` | - | - |
| bytes | 使用上述加权长度限制 | `boolean` | - | `false` |
| controllable | 完全受控，输入值由 modelValue 决定，调用方需接收并回传更新 | `boolean` | - | `false` |
| allowDispatch | 向所属 FormItem 派发 change 和 blur | `boolean` | - | `true` |
| wrap | 原生换行模式；soft 不将视觉折行写入提交值，hard 按原生规则处理 | `string` | `soft`、`hard` | `soft` |
| rows | 默认可见行数 | `number` | - | `2` |
| autosize | 自适应高度，可指定行数范围 | `boolean \| { minRows?: number; maxRows?: number }` | - | `false` |
| textareaStyle | 原生 textarea 样式；自动计算的高度样式后合并 | `object \| object[]` | - | - |
| indicator | 计数，需同时设置 maxlength；inverted 显示剩余数，inline 放在框内右下角（仅 Textarea，MTextarea 始终在框内） | `boolean \| { inverted?: boolean; inline?: boolean }` | - | `false` |
| indicateClass | 计数元素的 class | `string` | - | - |

`placeholder`、`readonly`、`name`、`autofocus`、`autocomplete`、`spellcheck` 通过 attrs 传给原生 textarea，不是声明的 props，组件不设置默认值。`autocomplete` 使用原生字符串值（如 `on`、`off`）。其他 attrs 默认落在外层容器上，不保证传给原生 textarea，例如 `cols`。

### Textarea 事件

下列事件也适用于 `MTextarea`。

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| update:modelValue | 同步绑定值 | `(value: string, e: Event) => void` | 处理后的值和输入事件 |
| input | 输入更新时触发，组合输入结束后同步 | `(value: string, e: Event) => void` | 处理后的值和输入事件 |
| change | 与 input 同步触发，并非原生失焦 change | `(value: string, e: Event) => void` | 输入值及触发事件 |
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
| focus | 聚焦原生 textarea | `(options?: FocusOptions)` | `void` |
| blur | 使原生 textarea 失焦 | - | `void` |
| click | 调用原生 click 后聚焦 | - | `void` |
| refresh | 下一次 DOM 更新后重新计算高度，仅在 autosize 开启时有效 | - | `void` |

### MTextarea 属性

公共属性见上表。移动端另有 `right: boolean`（默认 `false`）：文字右对齐，与 `MInput` 一致。原先声明但没有生效的 `align` 已移除。

### 当前行为说明

- 两个组件均不渲染插槽，不提供 `clearable` 或清空按钮；`plaintext` 时也只显示值。
- `bytes` 时计数与输入限制使用同一套加权长度：可打印 ASCII 算半个（合计向上取整），其他代码单元算一个。例如 `abcd` 与 `中文` 都显示 2。
