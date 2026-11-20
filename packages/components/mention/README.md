## 提及（Mention）

在文本域里输入前缀（默认 `@`）后，按前缀之后的文字联想，选中后在光标处插入 `前缀 + value + 分隔符`。弹层跟随光标，出现在正在输入的前缀下方。移动端入口导出的 `MMention` 属性与事件相同，见 [移动端](#移动端)。

`v-model` 是纯文字，提及只是文字的一部分。需要保存提及对象的 id（同名的成员也能区分、整体删除）时，使用 [Editor 的 mentionOptions](../editor/README.md#提及)。只需要整段补全时使用 [AutoComplete](../auto-complete/README.md)。

### 何时使用

- 评论、备注等多行输入里 `@` 成员、`#` 话题。

### 基础用法

- 找词：光标前最近的一个前缀，且前缀在开头或紧跟在空白 / 分隔符之后（`a@b.com` 这类邮箱不触发）；前缀到光标之间出现换行或分隔符时结束。光标在词中间时，选中后替换到词尾。
- 键盘：打开时高亮第一项，↑ ↓ 移动、Enter 选中（不换行）、Esc 关闭；中文输入法组合期间不处理。
- 选中后光标移到插入内容之后；后面已经是分隔符时不再补。
- 有 [Textarea](../textarea/README.md) 的全部属性（`rows`、`autosize`、`maxlength`、`indicator`、`bytes`…），原样传给文本域；`placeholder` 等 attribute 同样传过去。文本域内滚动、`autosize` 增高时，弹层跟着光标重新定位。
- 光标靠近右侧时弹层向左展开，靠近底部（含软键盘遮住的部分）时翻到前缀上方，与其它 Popover 一致。

:::playground
<!--
<config lang="json5">
{ previewInset: 24 }
</config>
-->
```vue
<template>
	<div style="width: 360px;">
		<Mention v-model="value" :data="users" :rows="3" placeholder="输入 @ 提及" />
		<p>value: {{ value }}</p>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Mention } from '@deot/vc';

const value = ref('');
const users = ['成员甲', '成员乙', '成员丙', 'Alpha', 'Beta'];
</script>
```
:::

### 多个前缀

`prefix` 传数组；按前缀切换数据时，监听 `search`（`{ keyword, prefix }`）更新 `data`，或在 `loadData` 的第三个参数里取 `prefix`。

:::playground
<!--
<config lang="json5">
{ previewInset: 24 }
</config>
-->
```vue
<template>
	<Mention
		v-model="value"
		:data="data"
		:prefix="['@', '#']"
		:rows="3"
		placeholder="输入 @ 或 #"
		style="width: 360px;"
		@search="handleSearch"
	/>
</template>
<script setup>
import { ref } from 'vue';
import { Mention } from '@deot/vc';

const USERS = ['成员甲', '成员乙'];
const TOPICS = ['话题一', '话题二'];
const value = ref('');
const data = ref(USERS);
const handleSearch = ({ prefix }) => {
	data.value = prefix === '#' ? TOPICS : USERS;
};
</script>
```
:::

### 远程加载

`loadData(keyword, instance, { prefix })` 返回 Promise，时机与 AutoComplete 相同：搜索词变化经 250ms 防抖调用；新的提及（换了位置或前缀）且手上的数据不是按它加载的，立即调用一次。Promise 解析为数组时直接作为结果；远程加载时不在本地过滤。

### 大量数据

`virtualized` 只渲染弹层可视范围附近的联想项，同 [AutoComplete](../auto-complete/README.md#大量数据)。

### 移动端

`MMention` 的联想属性、事件与 `Mention` 相同，文本域属性同 `MTextarea`（有 `right`）。

- 同样是跟随光标的下拉，联想项为 750 稿尺寸，最多约 5 行高；按可视区（`visualViewport`）翻转、限高，软键盘弹出后放不下时翻到前缀上方。
- 按下列表时文本域保持聚焦，键盘不收起；点按选中。不默认高亮第一项。

## API

### 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| modelValue | 文本域的文字 | `string` | - | - |
| data | 联想项，格式同 Select 的 data，也可以是字符串、数字；插入的是 `value` | `Array<string \| number \| object>` | - | `[]` |
| prefix | 触发提及的前缀 | `string \| string[]` | - | `'@'` |
| split | 选中后补在提及之后的分隔符；搜索词里出现它即结束提及；空字符串时不补 | `string` | - | `' '` |
| loadData | 远程加载 | `(keyword: string, instance, extra: { prefix: string }) => Promise<unknown>` | - | - |
| virtualized | 只渲染弹层可视范围附近的联想项 | `boolean` | - | `false` |
| placement | 弹层相对前缀的方向 | `string` | 同 Popover | `'bottom-left'` |
| portal / portalClass | 同 Popover | - | - | `true` / - |
| renderOption / renderOptionGroup / renderLabel | 同 AutoComplete | - | - | - |

另有 Textarea 的全部属性（含 `disabled`），原样传给文本域；`class`、`style` 在根节点上。

### 事件

| 事件名 | 说明 | 回调参数 |
| --- | --- | --- |
| update:modelValue / input / change | 输入或插入提及后；插入时没有原生事件，`e` 为 `undefined` | `(value: string, e?: Event)` |
| select | 插入提及 | `({ value: string; item: object; prefix: string })` |
| search | 光标处的提及变化（新的提及、搜索词变化） | `({ keyword: string; prefix: string })` |
| visible-change | 弹层显示状态变化 | `(visible: boolean)` |
| enter | 按 Enter 且没有用它插入提及时（keyup） | `(e: KeyboardEvent)` |
| focus / blur / paste / keydown / keypress / keyup / resize | 同 Textarea，参数不变 | 同 Textarea |

### 插槽

同 AutoComplete 的 `option` / `optionGroup` / `label`。

### 方法

| 方法名 | 说明 | 参数 |
| --- | --- | --- |
| focus | 聚焦文本域 | `options?: FocusOptions` |
| blur | 文本域失焦 | - |
| click | 点击文本域（同 Textarea） | - |
| close | 关闭弹层 | - |

## 主题与局部覆盖

联想项沿用 Select 的选项样式，见 [AutoComplete 的主题](../auto-complete/README.md#主题与局部覆盖)。
