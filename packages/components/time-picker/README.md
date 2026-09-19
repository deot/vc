## 时间选择器（TimePicker）

通过时间面板选择时、分、秒或起止时间。

### 何时使用

用于预约时间、营业时段等只需录入时间的场景。

### 基础用法

`type="time"` 选择单个时间，`type="timerange"` 选择范围。选择后分别输出格式化字符串和两个字符串组成的数组；默认格式为 `HH:mm:ss`。

:::playground
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<div class="demo">
		<label>时间<TimePicker v-model="time" /></label>
		<label>时间范围<TimePicker v-model="range" type="timerange" confirm /></label>
		<p>时间：{{ time }}；范围：{{ range }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { TimePicker } from '@deot/vc';

const time = ref('08:30:00');
const range = ref(['09:00:00', '18:00:00']);
</script>

<style scoped>
.demo { display: grid; gap: 16px; max-width: 420px; }
.demo label { display: grid; gap: 8px; }
.demo p { margin: 0; overflow-wrap: anywhere; }
</style>
```
:::

### 确认、步长与禁用时间

`confirm` 开启后，点击确定才提交值。`steps` 依次设置时、分、秒的步长；禁用列表中使用数字。下面的示例仅显示时、分，分钟以 15 分钟递增。

:::playground
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<div class="demo">
		<TimePicker
			v-model="time"
			:steps="[1, 15]"
			:disabled-hours="[0, 1, 2, 3, 4, 5, 6, 7]"
			format="HH:mm"
			confirm
			@ok="handleOk"
			@clear="handleClear"
		/>
		<p>已提交：{{ time || '未选择' }}</p>
		<p>{{ status }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { TimePicker } from '@deot/vc';

const time = ref('09:00');
const status = ref('请选择时间并确认');
const handleOk = (value) => { status.value = '已确认：' + value; };
const handleClear = () => { status.value = '已清空'; };
</script>

<style scoped>
.demo { max-width: 360px; }
.demo p { overflow-wrap: anywhere; }
</style>
```
:::

## API

### 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| type | 时间选择类型 | `string` | `time`、`timerange` | `time` |
| modelValue | 初始时间；范围建议使用数组 | `Date \| string \| (Date \| string)[]` | - | - |
| format | 解析、显示与输出格式；以 mm 结尾时隐藏秒列 | `string` | - | `HH:mm:ss` |
| steps | 时、分、秒步长；未设置的项使用 1 | `number[]` | - | `[]` |
| disabledHours | 禁用的小时 | `number[]` | - | `[]` |
| disabledMinutes | 禁用的分钟 | `number[]` | - | `[]` |
| disabledSeconds | 禁用的秒 | `number[]` | - | `[]` |
| disabledTime | 判断候选时间是否禁用 | `(date: Date) => boolean` | - | `() => false` |
| filterable | 隐藏禁用的选项 | `boolean` | - | `false` |
| confirm | 显示确认栏，确认后提交 | `boolean` | - | `false` |
| changeOnSelect | 选择时立即提交并关闭面板 | `boolean` | - | `false` |
| open | 值变化时同步显示状态；面板仍能通过交互关闭 | `boolean` | - | `false` |
| placeholder | 占位文本，允许空字符串 | `string` | - | 当前语言的“请选择” |
| disabled | 禁用选择器 | `boolean` | - | `false` |
| clearable | 有值且悬停时显示清除图标 | `boolean` | - | `true` |
| separator | 范围显示与字符串解析的分隔符 | `string` | - | `' - '` |
| nullValue | 单值清空后的替代值；范围清空返回空数组 | `string \| number \| object` | - | `''` |
| id | 内部输入框 ID | `string` | - | - |
| placement | Popover 位置 | `string` | 同 Popover | `bottom-left` |
| trigger | Popover 触发方式 | `string` | 同 Popover | `click` |
| tag | 触发容器标签 | `string` | - | `div` |
| arrow | 显示弹层箭头 | `boolean` | - | `false` |
| portalClass | 弹层附加 class | `string \| object \| unknown[]` | - | - |

### 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| update:modelValue | 提交时间，支持 v-model | `value` | 单时间为字符串，范围为字符串数组 |
| change | 选择、确认或清空后提交 | `(value, reset)` | reset 仅重置内部显示值 |
| ok | 确认并通过前置回调后触发 | `(value, reset)` | 同 change |
| clear | 清空后触发 | `value` | 清空后的值 |
| visible-change | 面板显示状态变化 | `visible: boolean` | 是否展开 |
| ready | 弹层就绪 | - | - |
| close | 面板关闭 | - | - |
| error | 前置回调同步抛错 | `error` | 捕获的错误 |

`@before-ok` / JSX `onBeforeOk` 是确认前回调，接收未格式化的 `Date[]`；`@before-clear` / `onBeforeClear` 不接收参数。返回 Promise 时，resolve 后继续操作，reject 时中止。

### 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 自定义触发内容，替代输入框 | - |

### 注意事项

- 普通模式选择后提交时间，面板保持打开；启用 confirm 时由确定按钮提交。
- 使用 `type`、`id`、`visible-change`，没有 `mode`、`element-id` 或 `open-change` API。
- 当前实现没有独立的 size、readonly 属性。内部输入框只读，但仍可点击打开面板。
- 当前声明的 portal 属性未传递到 Popover，不能用 `:portal="false"` 改变挂载位置。
- 共用面板的内置文案通过 `vc.DatePicker` locale 子树配置；共用样式使用 `--vc-date-picker-*` 主题覆盖。
