## 输入框（Input）
通过鼠标或键盘输入内容，是最基础的表单域的包装

### 何时使用
- 需要用户输入表单域内容时。
- 提供组合型输入框，带搜索的输入框。

### 基础用法
使用 v-model 实现输入数据的双向绑定。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<Input v-model="input" placeholder="请输入内容" style="width: 100%; max-width: 300px" />
</template>
<script setup>
import { ref } from 'vue';
import { Input } from '@deot/vc';

const input = ref('');
</script>
```
:::

### 数字输入框
输入时处理数字与小数位数；失焦、回车和步进操作时校正 min/max 范围。precision 限制小数位数，不补齐末尾的零。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<InputNumber v-model="input" placeholder="请输入内容" style="width: 100%; max-width: 300px" />
</template>
<script setup>
import { ref } from 'vue';
import { InputNumber } from '@deot/vc';

const input = ref('');
</script>
```
:::

### 禁用状态
通过 `disabled` 属性指定是否禁用 input 组件。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<Input v-model="input" placeholder="请输入内容" disabled style="width: 100%; max-width: 300px" />
</template>
<script setup>
import { ref } from 'vue';
import { Input } from '@deot/vc';

const input = ref('');
</script>
```
:::

### 可清空
使用 `clearable` 属性即可得到一个可清空的输入框

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<Input v-model="input" placeholder="请输入内容" clearable style="width: 100%; max-width: 300px" />
</template>
<script setup>
import { ref } from 'vue';
import { Input } from '@deot/vc';

const input = ref('');
</script>
```
:::

### 密码输入框
通过原生 `type="password"` 隐藏输入内容。组件没有额外的密码显示切换属性。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<Input v-model="input" placeholder="请输入密码" type="password" style="width: 100%; max-width: 300px" />
</template>
<script setup>
import { ref } from 'vue';
import { Input } from '@deot/vc';

const input = ref('');
</script>
```
:::

### 输入长度限制
开启属性 `indicator` 可以显示字数统计，需配合 `maxlength` 属性来限制输入长度。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<Input
		v-model="input"
		placeholder="请输入内容"
		:indicator="{ inline: true, inverted: false }"
		:maxlength="10"
		style="width: 100%; max-width: 300px"
	/>
</template>

<script setup>
import { ref } from 'vue';
import { Input } from '@deot/vc';

const input = ref('');
</script>
```
:::

### 前缀和后缀
在输入框上添加前缀或后缀图标。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<div class="v-input-icon">
		<div>
			属性方式：
			<Input v-model="input1" placeholder="请输入金额" prepend="rmb" style="width: 100%; max-width: 300px" />
			<Input v-model="input2" placeholder="请输入内容" append="search" style="width: 100%; max-width: 300px" />
		</div>

		<div style="margin-top: 10px">
			Slot方式：
			<Input v-model="input3" placeholder="请输入金额" style="width: 100%; max-width: 300px" >
				<template #prepend>
					<div class="icon-wrapper">
						<Icon type="rmb" class="icon" />
					</div>
				</template>
			</Input>
			<Input v-model="input4" placeholder="请输入内容" style="width: 100%; max-width: 300px" >
				<template #append>
					<div class="icon-wrapper">
						<Icon type="search" class="icon" />
					</div>
				</template>
			</Input>
		</div>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Input, Icon } from '@deot/vc';

const input1 = ref('');
const input2 = ref('');
const input3 = ref('');
const input4 = ref('');
</script>
<style scoped>
.v-input-icon > div {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 12px;
}
.v-input-icon .icon-wrapper {
	width: 16px;
	font-size: 12px;
}
.v-input-icon .icon {
	display: inline-block;
	vertical-align: middle;
	line-height: 0;
}
</style>
```
:::

### 搜索框
使用`input-search`，可以设置为搜索型输入框。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<InputSearch v-model="input" placeholder="请输入内容"  style="width: 100%; max-width: 300px" />
</template>
<script setup>
import { ref } from 'vue';
import { InputSearch } from '@deot/vc';

const input = ref('');
</script>
```
:::

### 移动端

`MInput` 支持右对齐，`MInputNumber` 在两侧显示步进按钮，`MInputSearch` 聚焦时显示取消操作。使用 `v-model` 同步取消后的空值。

:::playground
<!-- <config lang="json5">{ previewInset: 16, viewport: [375, 400] }</config> -->
```vue
<template>
	<div class="mobile-demo">
		<MInput v-model="name" placeholder="请输入姓名" right />
		<div class="quantity"><span>数量</span><MInputNumber v-model="quantity" :min="0" :max="10" /></div>
		<MInputSearch v-model="keyword" placeholder="搜索关键词" @enter="handleEnter" @cancel="handleCancel" />
		<p>{{ status }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MInput, MInputNumber, MInputSearch } from '@deot/vc';

const name = ref('');
const quantity = ref(1);
const keyword = ref('');
const status = ref('聚焦搜索框可显示取消操作');
const handleEnter = () => { status.value = `搜索：${keyword.value}`; };
const handleCancel = () => { status.value = '已取消搜索'; };
</script>

<style scoped>
.mobile-demo { display: grid; gap: 20px; }
.quantity { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.mobile-demo p { margin: 0; }
</style>
```
:::

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
| focus | 聚焦原生输入框 | - | `void` |
| blur | 使原生输入框失焦 | - | `void` |
| click | 触发原生点击并聚焦 | - | `void` |

### MInput 属性

沿用 Input 通用属性、事件、插槽和方法，不提供 indicator、indicateClass；afloat 不改变移动端样式。

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| right | 文字右对齐 | `boolean` | - | `false` |

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

`output="string"` 的空值结果为 `''`。自定义 `output(value)` 接收字符串或数字，返回值作为输出。初始值不会自动归整，范围校正在失焦、回车和步进时执行。

### InputNumber / MInputNumber 事件

沿用输入事件和方法，其中 input、change、update:modelValue 的值为转换后的结果；步进更新的 event 可为 `{}`。focus 只传事件，blur 为 `(event, value, focusValue)`；失焦、回车事件受 after 结果影响。

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| tip | 超出边界或无法继续步进 | `({ type, message, value?, tag })` | type 为 `'max' \| 'min'`；message 为本地化提示；value 为校正前的值（已到边界的按钮操作不传）；tag 为 `'input' \| 'button'` |
| before | 步进更新前回调，对应 onBefore | `(value)` | 接收转换后的值，可返回 Promise；返回 false 阻止本次更新 |
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

### MInputSearch 事件

沿用 Input 输入和键盘事件；focus、blur 只传 FocusEvent。取消通过 touchend 触发，依次发出 `update:modelValue('')`、`input('')`、`cancel()`，不发出 change，也不主动失焦。

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| cancel | 触摸取消操作 | `()` | - |
| enter | 回车 | `(event)` | KeyboardEvent |

### MInputSearch 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| prepend | 替换默认搜索图标 | - |
| append | 后缀 | - |

搜索组件不转发 content 插槽。

### 主题与语言

组件族沿用 `--vc-input-*` 覆盖入口，并回退到共享主题变量。移动步进按钮额外支持 `--vc-input-background-color-active`、`--vc-input-foreground-color-disabled`。

数字提示使用 `vc.InputNumber.*`，移动搜索取消文字使用 `vc.MInputSearch.cancelText`，随 `VcInstance.configure({ locale })` 更新。调用方传入的 placeholder、搜索文字和插槽内容由调用方负责翻译。
