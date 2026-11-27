## 输入框（Input）
通过鼠标或键盘输入内容，是最基础的表单域的包装。

移动端入口导出的 `MInput`、`MInputNumber`、`MInputSearch` 有独立的移动端实现，尺寸按 750 稿随 `--vc-rem` 缩放，见 [移动端](#移动端)。

### 何时使用
- 需要用户输入表单域内容时。
- 提供组合型输入框，带搜索的输入框。

### 基础用法
使用 `v-model` 实现输入数据的双向绑定；`focusEnd` 让聚焦时光标移到文字末尾。

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
	<div class="input-demo">
		<Input v-model="text" placeholder="请输入内容" />
		<Input v-model="tail" focus-end placeholder="聚焦时光标在末尾" />
		<p class="input-demo__result">当前值：{{ text || '（空）' }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Input } from '@deot/vc';

const text = ref('');
const tail = ref('一段已有的文字');
</script>

<style scoped>
.input-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
	width: 300px;
	max-width: 100%;
}

.input-demo__result {
	margin: 0;
}
</style>
```
:::

### 数字输入框
`InputNumber` 输入时处理数字与小数位数；失焦、回车和步进操作时按 `min`、`max` 校正范围，超出边界时发出 `tip`。`step` 设置步长，`false` 或 `0` 时不显示步进按钮；`precision` 限制小数位数，不补齐末尾的零。`output` 设置输出类型，`nullValue` 设置 number 输出时空值的结果，`required` 在失焦或回车时把空值归整为 `min`。

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
	<div class="input-demo">
		<InputNumber v-model="count" :min="1" :max="10" placeholder="1 到 10" @tip="handleTip" />
		<InputNumber v-model="decimal" :step="0.5" :precision="2" placeholder="步长 0.5，两位小数" />
		<InputNumber v-model="text" :step="false" output="string" placeholder="无步进按钮，输出字符串" />
		<InputNumber v-model="nullable" :null-value="null" placeholder="清空后为 null" clearable />
		<InputNumber v-model="fallback" :min="5" required placeholder="必填，空值归整为 5" />
		<p class="input-demo__result">{{ tip }}</p>
		<p class="input-demo__result">
			值：{{ count }} / {{ decimal }} / {{ JSON.stringify(text) }} / {{ String(nullable) }} / {{ fallback }}
		</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { InputNumber } from '@deot/vc';

const count = ref(1);
const decimal = ref(0.5);
const text = ref('');
const nullable = ref(3);
const fallback = ref(6);
const tip = ref('超出范围时在这里提示');

const handleTip = ({ type, message, tag }) => {
	tip.value = `${type}（${tag}）：${message}`;
};
</script>

<style scoped>
.input-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
	width: 300px;
	max-width: 100%;
}

.input-demo__result {
	margin: 0;
}
</style>
```
:::

### 数字输入框的回调
`before` 在步进更新前调用，返回 `false` 或拒绝的 Promise 阻止本次更新；`after` 在失焦、回车或步进停止 500ms 后调用，返回 `false` 时回滚。`plus`、`minus` 覆盖默认的增减逻辑，跳过内部边界判断、`before` 和 `after`。

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
	<div class="input-demo">
		<InputNumber v-model="guarded" :step="2" :max="20" @before="handleBefore" @after="handleAfter" />
		<InputNumber v-model="custom" @plus="handlePlus" @minus="handleMinus" />
		<p class="input-demo__result">{{ status }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { InputNumber } from '@deot/vc';

const guarded = ref(2);
const custom = ref(10);
const status = ref('第一个步进超过 10 时被阻止，输入奇数时回滚；第二个每次加减 10');

const handleBefore = (value) => {
	if (value <= 10) return true;
	status.value = `before：${value} 大于 10，已阻止`;
	return false;
};

const handleAfter = (value) => {
	if (value % 2 === 0) {
		status.value = `after：${value} 已确认`;
		return true;
	}
	status.value = `after：${value} 不是偶数，已回滚`;
	return false;
};

const handlePlus = () => {
	custom.value += 10;
};

const handleMinus = () => {
	custom.value = Math.max(0, custom.value - 10);
};
</script>

<style scoped>
.input-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
	width: 300px;
	max-width: 100%;
}

.input-demo__result {
	margin: 0;
}
</style>
```
:::

### 禁用与可清空
`disabled` 禁用输入框。`clearable` 提供清空图标：有值时才显示（`0` 也算有值），桌面端悬停时显示，移动端聚焦时显示；点击清空时发出 `clear`。

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
	<div class="input-demo">
		<Input model-value="禁用时不能输入" disabled />
		<Input v-model="text" placeholder="请输入内容" clearable @clear="handleClear" />
		<p class="input-demo__result">清空 {{ count }} 次</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Input } from '@deot/vc';

const text = ref('悬停后点击右侧图标清空');
const count = ref(0);

const handleClear = () => {
	count.value++;
};
</script>

<style scoped>
.input-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
	width: 300px;
	max-width: 100%;
}

.input-demo__result {
	margin: 0;
}
</style>
```
:::

### 密码输入框
通过原生 `type="password"` 隐藏输入内容。组件没有额外的密码显示切换属性。

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
	<div class="input-demo">
		<Input v-model="password" type="password" placeholder="请输入密码" />
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Input } from '@deot/vc';

const password = ref('');
</script>

<style scoped>
.input-demo {
	width: 300px;
	max-width: 100%;
}
</style>
```
:::

### 输入长度限制
`indicator` 显示字数统计，需配合 `maxlength` 使用：`inline` 在框内显示，`inverted` 显示剩余数量，`indicateClass` 设置计数元素的 class。`bytes` 按字节计算长度：可打印 ASCII 按 1 字节，其他字符按 2 字节，每个长度单位为 2 字节。

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
	<div class="input-demo">
		<Input
			v-model="inline"
			:indicator="{ inline: true, inverted: false }"
			:maxlength="10"
			placeholder="框内计数"
		/>
		<Input
			v-model="outside"
			:indicator="{ inline: false, inverted: true }"
			:maxlength="10"
			indicate-class="input-demo__indicator"
			placeholder="框外显示剩余数量"
		/>
		<Input
			v-model="bytes"
			:indicator="{ inline: true, inverted: false }"
			:maxlength="4"
			bytes
			placeholder="最多 8 个字节"
		/>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Input } from '@deot/vc';

const inline = ref('');
const outside = ref('');
const bytes = ref('');
</script>

<style scoped>
.input-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
	width: 300px;
	max-width: 100%;
}

.input-demo :deep(.input-demo__indicator) {
	color: var(--vc-color-primary);
}
</style>
```
:::

### 前缀和后缀
`prepend`、`append` 设置前后缀图标，同名插槽可自定义内容并优先于属性；`afloat` 提升桌面端前后缀的层级。`content` 插槽替换原生输入区域，替换后没有内置的输入交互。

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
	<div class="input-demo">
		<Input v-model="amount" prepend="rmb" placeholder="前缀图标" />
		<Input v-model="keyword" append="search" afloat placeholder="后缀图标" />
		<Input v-model="unit" placeholder="插槽前后缀">
			<template #prepend>
				<span class="input-demo__addon">数量</span>
			</template>
			<template #append>
				<span class="input-demo__addon">件</span>
			</template>
		</Input>
		<Input>
			<template #content>
				<span class="input-demo__content">content 插槽替换输入区域</span>
			</template>
		</Input>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Input } from '@deot/vc';

const amount = ref('');
const keyword = ref('');
const unit = ref('');
</script>

<style scoped>
.input-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
	width: 300px;
	max-width: 100%;
}

.input-demo__addon {
	padding-inline: 8px;
}

.input-demo__content {
	padding-inline: 8px;
	line-height: 30px;
}
</style>
```
:::

### 事件与方法
`focus`、`blur`、`enter`、`paste` 及 `keydown`、`keypress`、`keyup` 透出原生交互，`input`、`change` 与 `update:modelValue` 同步触发。通过组件 ref 调用 `focus`、`blur`、`click`。`id` 设置包装元素的 id，`inputId` 设置原生 input 的 id，可与 `<label for>` 关联；`inputStyle` 设置原生 input 的样式。

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
	<div class="input-demo">
		<label class="input-demo__label" for="input-demo-native">点击这段文字也能聚焦输入框</label>
		<Input
			id="input-demo-wrapper"
			ref="inputRef"
			v-model="text"
			input-id="input-demo-native"
			:input-style="{ textAlign: 'center' }"
			placeholder="输入、粘贴或回车"
			@focus="handleFocus"
			@blur="handleBlur"
			@enter="handleEnter"
			@paste="handlePaste"
			@change="handleChange"
			@keydown="handleKey"
			@keypress="handleKey"
			@keyup="handleKey"
		/>
		<div class="input-demo__row">
			<Button size="small" @click="handleCallFocus">focus()</Button>
			<Button size="small" @click="handleCallBlur">blur()</Button>
			<Button size="small" @click="handleCallClick">click()</Button>
		</div>
		<p class="input-demo__result">{{ log }}</p>
		<p class="input-demo__result">按键事件 {{ keyCount }} 次</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Input, Button } from '@deot/vc';

const inputRef = ref();
const text = ref('');
const log = ref('等待操作');
const keyCount = ref(0);

const handleFocus = (event, value) => {
	log.value = `focus：${value || '（空）'}`;
};

const handleBlur = (event, value, focusValue) => {
	log.value = `blur：聚焦时为「${focusValue || ''}」，现在为「${value || ''}」`;
};

const handleEnter = () => {
	log.value = `enter：${text.value}`;
};

const handlePaste = (event, content) => {
	log.value = `paste：${content}`;
};

const handleChange = (value) => {
	log.value = `change：${value}`;
};

const handleKey = () => {
	keyCount.value++;
};

const handleCallFocus = () => {
	inputRef.value.focus();
};

const handleCallBlur = () => {
	inputRef.value.blur();
};

const handleCallClick = () => {
	inputRef.value.click();
};
</script>

<style scoped>
.input-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
	width: 300px;
	max-width: 100%;
}

.input-demo__label {
	cursor: pointer;
}

.input-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}

.input-demo__result {
	margin: 0;
}
</style>
```
:::

### 受控与原生渲染
`controllable` 使输入框完全受控：显示值始终由 `modelValue` 决定，下例在 `input` 中把输入转为大写后写回。`styleless` 直接渲染原生 input，不渲染包装、清空图标、计数或插槽，`class`、`style` 作用于原生 input。

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
	<div class="input-demo">
		<Input
			:model-value="upper"
			controllable
			placeholder="输入的字母转为大写"
			@input="handleInput"
		/>
		<Input v-model="raw" styleless class="input-demo__native" placeholder="原生 input" />
		<p class="input-demo__result">受控：{{ upper || '（空）' }}；原生：{{ raw || '（空）' }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Input } from '@deot/vc';

const upper = ref('');
const raw = ref('');

const handleInput = (value) => {
	upper.value = String(value).toUpperCase();
};
</script>

<style scoped>
.input-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
	width: 300px;
	max-width: 100%;
}

.input-demo__native {
	padding: 4px 8px;
	border: 1px dashed var(--vc-border-color);
}

.input-demo__result {
	margin: 0;
}
</style>
```
:::

### 只读文字
`plaintext` 时只显示 `v-model` 的值，不渲染输入框：输出一个没有样式的 `<span class="vc-input-plaintext">`（移动端为 `vcm-input-plaintext`），不能交互，`class`、`style` 等 attribute 落在它上面。与 `styleless`（直接渲染原生 input，仍可输入）不同。

- `prepend` / `append` 插槽的内容放在文字前后（如单位），`prepend` / `append` 属性是图标名，不渲染。
- 没有值时只显示 `extra`（不带前后缀），未传时为空。
- `InputNumber` / `MInputNumber` 同样支持：显示值本身（不按 `precision` 补零），不带步进按钮。

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
	<dl class="input-demo">
		<dt>文字</dt>
		<dd><Input model-value="一段文字" plaintext /></dd>
		<dt>金额</dt>
		<dd>
			<InputNumber :model-value="100" plaintext>
				<template #append>元</template>
			</InputNumber>
		</dd>
		<dt>空值</dt>
		<dd><Input extra="-" plaintext /></dd>
	</dl>
</template>

<script setup>
import { Input, InputNumber } from '@deot/vc';
</script>

<style scoped>
.input-demo {
	display: grid;
	grid-template-columns: auto 1fr;
	gap: 16px;
	margin: 0;
}

.input-demo dd {
	margin: 0;
}
</style>
```
:::

### 搜索框
`InputSearch` 在后缀显示搜索区域，回车或点击搜索区域时发出 `enter`。`enterText` 为 `true` 时显示搜索图标，为字符串时显示文字，为 `false` 时不显示内容；`append` 插槽替换搜索区域。

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
	<div class="input-demo">
		<InputSearch v-model="keyword" placeholder="请输入关键词" @enter="handleEnter" />
		<InputSearch v-model="keyword" enter-text="搜索" placeholder="文字按钮" @enter="handleEnter" />
		<InputSearch v-model="keyword" placeholder="自定义搜索区域">
			<template #append>
				<Button type="primary" @click="handleEnter">查询</Button>
			</template>
		</InputSearch>
		<p class="input-demo__result">{{ status }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { InputSearch, Button } from '@deot/vc';

const keyword = ref('');
const status = ref('回车或点击搜索');

const handleEnter = () => {
	status.value = `搜索：${keyword.value || '（空）'}`;
};
</script>

<style scoped>
.input-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
	width: 300px;
	max-width: 100%;
}

.input-demo__result {
	margin: 0;
}
</style>
```
:::

## 移动端

`MInput`、`MInputNumber`、`MInputSearch` 沿用桌面端的通用属性、事件和方法，根节点为 `.vcm-input`、`.vcm-input-number`、`.vcm-input-search`。`MInput` 另有 `right`（文字右对齐），`MInputNumber` 在两侧显示步进按钮并支持 `theme`、`shape`，`MInputSearch` 聚焦时显示取消操作（`cancelText`、`cancel` 事件），并支持 `theme`、`shape`。尺寸按 750 稿设计，写为 `calc(var(--vc-rem) * n)`，随 `--vc-rem` 缩放；底栏切换 `rem` 可查看不同屏宽下的效果。

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
	<div class="m-input-demo">
		<div class="m-input-demo__group">
			<MInput v-model="text" clearable placeholder="请输入内容" />
			<MInput v-model="keyword" prepend="search" clearable placeholder="前置图标" />
			<MInput v-model="code" :maxlength="6" placeholder="请输入编号">
				<template #append>
					<MButton size="small" type="primary">获取</MButton>
				</template>
			</MInput>
			<MInput v-model="amount" right placeholder="右对齐" />
			<MInput model-value="不可编辑的内容" disabled />
		</div>
		<MList>
			<MListItem label="默认步进器" :arrow="false">
				<template #extra>
					<MInputNumber v-model="counts[0]" :max="5" @tip="handleTip" />
				</template>
			</MListItem>
			<MListItem label="允许负数" :arrow="false">
				<template #extra>
					<MInputNumber v-model="counts[1]" :min="-5" :max="5" />
				</template>
			</MListItem>
			<MListItem
				v-for="item in styles"
				:key="item.label"
				:label="item.label"
				:arrow="false"
			>
				<template #extra>
					<MInputNumber v-model="item.value" :theme="item.theme" :shape="item.shape" :max="10" />
				</template>
			</MListItem>
		</MList>
		<MInputNumber v-model="counts[2]" :step="false" clearable placeholder="无步进按钮时与 MInput 一致" />
		<div class="m-input-demo__group">
			<MInputSearch v-model="search" clearable placeholder="搜索" @enter="handleEnter" @cancel="handleCancel" />
			<MInputSearch v-model="search" theme="inverted" cancel-text="关闭" placeholder="inverted" />
			<MInputSearch v-model="search" shape="square" placeholder="square" />
		</div>
		<p class="m-input-demo__result">{{ log }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MInput, MInputNumber, MInputSearch, MButton, MList, MListItem } from '@deot/vc';

const text = ref('一段输入内容');
const keyword = ref('');
const code = ref('');
const amount = ref('');
const counts = ref([1, 0, undefined]);
const search = ref('');
const styles = ref([
	{ label: 'fill + circle', theme: 'fill', shape: 'circle', value: 2 },
	{ label: 'border + square', theme: 'border', shape: 'square', value: 3 },
	{ label: 'border + circle', theme: 'border', shape: 'circle', value: 10 }
]);
const log = ref('回车、取消或超出范围时在这里显示');

const handleTip = ({ message }) => {
	log.value = `tip：${message}`;
};

const handleEnter = () => {
	log.value = `搜索：${search.value || '（空）'}`;
};

const handleCancel = () => {
	log.value = '已取消搜索';
};
</script>

<style scoped>
.m-input-demo {
	display: flex;
	flex-direction: column;
	gap: calc(var(--vc-rem) * 32);
	background: var(--vc-background-color-light);
}

.m-input-demo__group {
	display: flex;
	flex-direction: column;
	gap: 1px;
}

.m-input-demo__result {
	margin: 0;
	padding-inline: calc(var(--vc-rem) * 32);
	font-size: calc(var(--vc-rem) * 28);
	color: var(--vc-color-dark-extralight);
}
</style>
```
:::

`MInput` 单独使用时为一整行，尺寸如下（括号内为 375 宽下的 px）：

| 项 | 值 |
| --- | --- |
| 行 | 高 108（54），左右内边距 32（16） |
| 文字 | 字号 32（16），行高 44（22），上下内边距 24（12）；光标为主色 |
| 前置 / 后置图标 | 32（16）；前置与文字间距 24（12），后置与文字间距 32（16） |
| 清空图标 | 32（16），与文字间距 32（16）；聚焦且有值时显示 |

- 清空图标阻止 `touchstart` 的默认行为：点击时输入框不失焦、键盘不收起；`mousedown` 同样可以清空，便于在桌面浏览器中调试。
- 禁用时设置 `-webkit-text-fill-color`，iOS 上禁用文字的颜色与 `color-dark-extralight` 一致。
- 在 `MForm` 中去掉行高与左右内边距，与标签、其他控件对齐；`MInputNumber`、`MInputSearch` 使用各自的尺寸。

`MInputNumber` 有步进按钮时为紧凑的步进器（根节点带 `is-stepper`）；`step` 为 `0`、`false`、`null` 时没有步进按钮，样式与 `MInput` 一致（整行、白底、左对齐，在 `MForm` 中同 `MInput`），与桌面端 `InputNumber` 无步进按钮时即 `Input` 的样式一致。步进器（375 宽下）：按钮 28 × 28，输入区 40 × 28、与按钮间隔 1，字号 14；按钮与输入区为浅灰底（`background-color`），加减号与文字同色，到达边界时变浅，按下时为主色浅底。不允许负数（`min >= 0`）时设置 `inputmode`，弹出数字键盘，`precision` 大于 0 时带小数点；允许负数时保持文本键盘（iOS 的数字键盘没有负号）。可通过 attrs 传入 `inputmode` 覆盖。

`MInputSearch`（375 宽下）：栏高 68、内边距 16、白底；输入框高 36、左右内边距 14、浅灰底、胶囊圆角，字号 14；搜索图标 16，与文字间距 9。清空图标在有值时显示，不要求聚焦；取消按钮为主色、字号 15，与输入框间距 16，按下即取消并让输入框失焦（阻止 `touchstart` 的默认行为，`mousedown` 同样可用）。

## 主题与局部覆盖

全局参数通过 `--vc-<参数>` 配置，单个组件通过 `--vc-input-<参数>` 覆盖。同一参数可能作用于多个状态；多命名空间时在使用位置中标明。

同时覆盖 Input、InputNumber、InputSearch 的桌面和移动端样式；内嵌组件沿用各自主题入口。

### 全局

| 参数 | 使用位置 | 值 |
| --- | --- | --- |
| color-dark-light | 输入文字 | 亮色：`#080F20`；暗色：`#E8E8E8` |
| color-dark-extralight | 占位文字、数字按钮及附加图标 | 亮色：`#909399`；暗色：`#B9B9B9` |
| color-disabled | 亮色禁用输入区、附加区及数字按钮背景 | `#EBEEF5` |
| color-error | 错误边框 | `#F53F3F` |
| color-light-extradeep | 桌面端搜索区域文字、移动端步进按钮禁用文字 | 亮色：`#B9B9B9`；暗色：`#F8F8F8` |
| color-neutral-light | 移动端步进器 `theme="border"` 的边框 | 亮色：`#EDEFF1`；暗色：`#3B4354` |
| color-primary | 亮色聚焦及悬停边框；移动端光标及搜索取消文字 | `#456CF6` |
| color-primary-light | 暗色聚焦边框、数字按钮悬停图标 | `#4A96FF` |
| color-primary-lighter | 焦点阴影及移动端步进按钮激活背景 | `rgba(45, 140, 240, 0.2)` |
| background-color | 移动端数字输入区及按钮背景、搜索输入框背景 | 亮色：`#F5F6FA`；暗色：`#252B3A` |
| background-color-light | 暗色禁用输入区、附加区及数字按钮背景 | 亮色：`#F7F8FA`；暗色：`#2D3444` |
| background-color-lightest | 输入区、附加区及桌面端数字按钮背景 | 亮色：`#FFFFFF`；暗色：`#252B3A` |
| border-color | 桌面端输入边框及数字按钮的纵向、横向分隔线 | `#D5D9E1`（亮暗主题相同） |
| foreground-color | 附加区文字及移动端附加图标 | 亮色：`#080F20`；暗色：`#F8F8F8` |

### 局部

当前组件没有额外的局部 CSS 主题参数。

## API

### Input 属性

以下通用属性也由 `MInput`、`InputNumber`、`MInputNumber`、`InputSearch`、`MInputSearch` 接收，变体差异见对应章节。

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| modelValue | 绑定值；数组主要供组合组件保存临时值，普通输入输出字符串 | `string \| number \| any[]` | - | `undefined` |
| disabled | 禁用原生输入框 | `boolean` | - | `false` |
| maxlength | 最大输入长度 | `number` | - | - |
| focusEnd | 聚焦时光标移至末尾，需原生类型支持文本选择 | `boolean` | - | `false` |
| clearable | 非空且未禁用时提供清空图标 | `boolean` | - | `false` |
| prepend | 前缀图标名称 | `string` | - | - |
| append | 后缀图标名称 | `string` | - | - |
| afloat | 提升桌面端前后缀层级 | `boolean` | - | `false` |
| id | 包装元素 id | `string` | - | - |
| inputId | 原生 input 的 id | `string` | - | - |
| inputStyle | 原生 input 样式 | `StyleValue` | - | - |
| allowDispatch | 向所在 FormItem 通知值变化和失焦 | `boolean` | - | `true` |
| bytes | 调整 maxlength：可打印 ASCII 按 1 字节，其他 UTF-16 码元按 2 字节，每个长度单位为 2 字节 | `boolean` | - | `false` |
| styleless | 直接渲染原生 input，不渲染包装、清空图标、计数或插槽 | `boolean` | - | `false` |
| plaintext | 只显示值的文字（带上 prepend / append 插槽的内容），不渲染输入框，没有样式、不能交互；见[只读文字](#只读文字)。InputSearch 不支持 | `boolean` | - | `false` |
| extra | `plaintext` 没有值时显示的文字 | `string` | - | `''` |
| controllable | 完全受控，显示值由 modelValue 决定 | `boolean` | - | `false` |
| indicator | 桌面端计数；inline 控制框内显示，inverted 显示剩余数量；需 maxlength，数组不计数 | `boolean \| { inline: boolean; inverted: boolean }` | - | `false` |
| indicateClass | 桌面端计数元素 class | `string` | - | - |

`append` 插槽或图标优先于框内计数。`type`、`placeholder`、`readonly`、`name`、`autofocus`、`autocomplete`、`spellcheck` 等 attrs 传入原生 input。`type` 默认为 `text`，其余未由组件设置默认值。`class`、`style` 默认作用于包装元素，styleless 时作用于原生 input。

### Input 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| update:modelValue | 同步绑定值 | `(value, event)` | 输入值及触发事件 |
| input | 输入值更新 | `(value, event)` | 一般为字符串；清空时为 `''` |
| change | 与 input 同步触发，并非原生失焦 change | `(value, event)` | 输入值及触发事件 |
| focus | 聚焦 | `(event, value)` | FocusEvent、当前值 |
| blur | 失焦 | `(event, value, focusValue)` | FocusEvent、原生输入值、聚焦时的值 |
| clear | 清空 | `(event)` | 合成对象 `{ target: { value: '' } }` |
| paste | 粘贴 | `(event, text)` | ClipboardEvent、剪贴板文本 |
| keydown / keypress / keyup | 键盘事件 | `(event)` | KeyboardEvent |
| enter | keyup 时检测到回车 | `(event)` | KeyboardEvent |

### Input 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| prepend | 前缀，优先于同名图标属性 | - |
| append | 后缀，优先于同名图标属性 | - |
| content | 替换原生输入区域，替换后没有内置原生输入交互 | - |

### Input 方法

以下方法也适用于全部变体，通过组件 ref 调用。

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| focus | 聚焦原生输入框 | `(options?: FocusOptions)` | `void` |
| blur | 使原生输入框失焦 | - | `void` |
| click | 触发原生点击并聚焦 | - | `void` |

### MInput 属性

沿用 Input 通用属性、事件、插槽和方法，不提供 indicator、indicateClass；afloat 不改变移动端样式。

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| right | 文字右对齐（只改对齐，不改颜色） | `boolean` | - | `false` |

### InputNumber / MInputNumber 属性

沿用通用属性。完全受控模式仍允许暂存输入，失焦后显示 modelValue。

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| min | 最小值 | `number` | - | `0` |
| max | 最大值 | `number` | - | `Number.MAX_SAFE_INTEGER` |
| step | 步长；0 或 false 隐藏按钮，true 按 1 计算 | `number \| boolean` | - | `1` |
| required | 失焦或回车归整空值时使用 min | `boolean` | - | `false` |
| precision | 输入的小数位数上限 | `number` | - | `0` |
| output | 输入、步进和归整时转换输出 | `string \| Function` | `'number'`、`'string'`、函数 | `'number'` |
| nullValue | number 输出模式下空值或无效值的结果 | `number \| string \| object` | - | `undefined` |

`MInputNumber` 另有以下属性，只在有步进按钮时生效（没有步进按钮时与 `MInput` 一致）：

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| theme | 填充方案：`fill` 按钮与输入区为浅灰底；`border` 透明底加 1px 边框（方角时整体外框、输入区两侧分隔线，圆形时每个按钮各自描边） | `string` | `'fill'`、`'border'` | `'fill'` |
| shape | 步进按钮的形状：`square` 方角；`circle` 圆形按钮、输入区透明 | `string` | `'square'`、`'circle'` | `'square'` |

`output="string"` 的空值结果为 `''`。自定义 `output(value)` 接收字符串或数字，返回值作为输出。初始值不会自动归整，范围校正在失焦、回车和步进时执行。

### InputNumber / MInputNumber 事件

沿用输入事件和方法，其中 input、change、update:modelValue 的值为转换后的结果；步进更新的 event 可为 `{}`。focus 只传事件，blur 为 `(event, value, focusValue)`；失焦、回车事件受 after 结果影响。

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| tip | 超出边界或无法继续步进 | `({ type, message, value?, tag })` | type 为 `'max' \| 'min'`；message 为本地化提示；value 为校正前的值（已到边界的按钮操作不传）；tag 为 `'input' \| 'button'` |
| before | 步进更新前回调，对应 onBefore | `(value)` | 接收转换后的值，可返回 Promise；返回 false 或 Promise 拒绝时阻止本次更新 |
| after | 失焦、回车或步进停止 500ms 后回调，对应 onAfter | `(value)` | 失焦/回车接收归整结果，步进接收校正前的计算值；返回 false 或 Promise 拒绝时回滚 |
| plus / minus | 覆盖默认增减逻辑，对应 onPlus / onMinus | `()` | 直接执行调用方逻辑，跳过内部边界判断、before 和 after |

before、after、plus、minus 是读取 attrs 后调用的回调，不是普通通知事件。桌面端到达边界的按钮由 CSS 禁止指针事件，移动端由处理函数发出 tip。

### InputNumber / MInputNumber 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| prepend | 桌面端前缀；移动端在 step 有效时替换减按钮 | - |
| append | 桌面端替换步进区域；移动端在 step 有效时替换加按钮 | - |

两个组件不转发 content 插槽。移动端 step 为 0 或 false 时不渲染前后缀插槽。

### InputSearch 属性

沿用通用属性、Input 事件和方法。

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| enterText | true 显示搜索图标，字符串显示文字，false 不显示内容但保留后缀区域 | `string \| boolean` | - | `true` |

### InputSearch 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| enter | 回车或点击搜索区域 | `(event)` | KeyboardEvent 或 MouseEvent，不附带关键词 |

disabled 禁用输入，搜索区域仅有禁用外观，当前仍会发出点击 enter；需要禁止提交时，在业务回调中检查禁用状态。

### InputSearch 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| prepend | 前缀 | - |
| append | 替换搜索区域，提交交互由插槽内容自行处理 | - |

### MInputSearch 属性

沿用通用属性和方法。原生 type 默认为 search，可通过 attrs 覆盖。接收 enterText，但不使用它渲染按钮。

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| cancelText | 聚焦时显示的取消文字，空字符串隐藏操作 | `string` | - | 当前 locale 的“取消” |
| theme | 填充方案：`fill` 白底、输入框浅灰底；`inverted` 浅灰底、输入框白底 | `string` | `'fill'`、`'inverted'` | `'fill'` |
| shape | 输入框的形状：`circle` 胶囊；`square` 方角 | `string` | `'circle'`、`'square'` | `'circle'` |

### MInputSearch 事件

沿用 Input 输入和键盘事件；focus、blur 只传 FocusEvent。取消在 touchstart（桌面浏览器为 mousedown）时触发，依次发出 `update:modelValue('')`、`input('')`、`cancel()`，不发出 change，随后让输入框失焦。

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| cancel | 按下取消操作 | `()` | - |
| enter | 回车 | `(event)` | KeyboardEvent |

### MInputSearch 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| prepend | 替换默认搜索图标 | - |
| append | 后缀 | - |

搜索组件不转发 content 插槽。

### 主题与语言

组件族沿用 `--vc-input-*` 覆盖入口，并回退到共享主题变量。

数字提示使用 `vc.InputNumber.*`，移动搜索取消文字使用 `vc.MInputSearch.cancelText`，随 `VcInstance.configure({ locale })` 更新。调用方传入的 placeholder、搜索文字和插槽内容由调用方负责翻译。
