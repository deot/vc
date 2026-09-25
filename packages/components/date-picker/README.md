## 日期选择器（DatePicker）
选择日期、年月、季度或日期范围；移动端提供弹出选择器和内嵌滚轮。

### 何时使用

用于表单日期录入、按月或季度查询，以及选择起止日期。

### 基础用法
初始值可以是 `Date` 或日期字符串；选择后输出按 `format` 格式化的字符串。

:::playground
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<div class="v-data-picker-basic" style="display: grid; gap: 12px; max-width: 420px">
		<DatePicker
			v-model="value"
			:start-date="new Date(2026, 8, 19)"
			type="date"
			clearable
			format="YYYY-MM-DD"
			placeholder="选择日期"
		/>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { DatePicker } from '@deot/vc';

const value = ref(new Date());
</script>
```
:::

### 其他日期单位
可以选择年、月、季度

:::playground
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<div class="v-data-picker-basic" style="display: grid; gap: 12px; max-width: 420px">
		<h2>年</h2>
		<DatePicker
			v-model="year"
			type="year"
			clearable
			confirm
			placeholder="选择日期"
			style="width: 200px"
		/>
		<h2>月</h2>
		<DatePicker
			v-model="month"
			type="month"
			clearable
			placeholder="选择日期"
			style="width: 200px"
		/>
		<h2>季度</h2>
		<DatePicker
			v-model="quarter"
			type="quarter"
			clearable
			confirm
			placeholder="选择日期"
			style="width: 200px"
		/>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { DatePicker } from '@deot/vc';

const year = ref('');
const month = ref('');
const quarter = ref('');
</script>
```
:::

### 选择日期范围
可以选择时间范围

:::playground
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<div class="v-data-picker-basic" style="display: grid; gap: 12px; max-width: 420px">
		<h2>日期范围</h2>
		<DatePicker
			v-model="daterange"
			type="daterange"
			clearable
			placeholder="选择日期"
			style="width: 250px"
		/>
		<h2>日期时间范围</h2>
		<DatePicker
			v-model="datetimerange"
			type="datetimerange"
			clearable
			confirm
			placeholder="选择日期"
			style="width: 100%"
		/>
		<h2>月份范围</h2>
		<DatePicker
			v-model="monthrange"
			type="monthrange"
			separator="到"
			clearable
			placeholder="选择日期"
			style="width: 250px"
		/>
		<h2>季度范围</h2>
		<DatePicker
			v-model="quarterrange"
			type="quarterrange"
			clearable
			placeholder="选择日期"
			style="width: 250px"
		/>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { DatePicker } from '@deot/vc';

const daterange = ref('');
const datetimerange = ref('');
const quarterrange = ref('');
const monthrange = ref('');
</script>
```
:::

### 设置可选的时间范围

:::playground
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<div class="v-data-picker-basic" style="display: grid; gap: 12px; max-width: 420px">
		<DatePicker
			v-model="value"
			:start-date="new Date()"
			:disabled-date="disabledDate"
			:time-picker-options="timeOptions"
			type="datetime"
			format="YYYY-MM-DD HH:mm:ss"
			placeholder="请选择"
		/>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { DatePicker } from '@deot/vc';

const value = ref('');
const disabledDate = (date) => {
	return date && (date.valueOf() < Date.now() - 86400000 || date.valueOf() > Date.now() + 864000000);
};
const timeOptions = ref({
	disabledHours: [],
	disabledMinutes: [],
	disabledTime(date) {
		return date && (date.valueOf() < Date.now() || date.valueOf() > Date.now() + 864000000);
	}
});
</script>
```
:::

### 移动端日期时间选择

点击触发内容打开滚轮；确认后提交格式化字符串，取消不提交。`format="HH:mm"` 只显示时、分列。

:::playground
<!-- <config lang="json5">{ viewport: [375, 560], previewInset: 16 }</config> -->
```vue
<template>
	<div class="v-data-picker-basic" style="display: grid; gap: 12px; max-width: 420px">
		<h2>日期时间</h2>
		<MDatePicker
			v-model="value"
			:arrow="false"
			type="datetime"
		>
			<template #default="it">
				<h2>
					{{ it.label }}
				</h2>
			</template>
		</MDatePicker>
		<h2>年月</h2>
		<MDatePicker
			v-model="yearmonth"
			:arrow="false"
			type="yearmonth"
		>
			<template #default="it">
				<h2>
					{{ it.label }}
				</h2>
			</template>
		</MDatePicker>
		<h2>时分</h2>
		<MDatePicker
			v-model="time"
			:arrow="false"
			type="time"
			format="HH:mm"
		>
			<template #default="it">
				<h2>
					{{ it.label }}
				</h2>
			</template>
		</MDatePicker>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { MDatePicker } from '@deot/vc';

const value = ref(new Date());
const yearmonth = ref(new Date());
const time = ref();
</script>
```
:::

## API

### DatePicker 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| type | 选择类型 | `string` | `date`、`datetime`、`year`、`month`、`quarter`、`daterange`、`datetimerange`、`monthrange`、`quarterrange` | `date` |
| modelValue | 初始日期；范围和季度推荐数组 | `Date \| string \| (Date \| string)[]` | - | - |
| format | 解析与输出格式；季度展示仍为季度名称 | `string` | - | 按类型决定 |
| placeholder | 占位文本，允许空字符串 | `string` | - | 当前语言的“请选择” |
| disabled | 禁用选择器 | `boolean` | - | `false` |
| clearable | 有值且悬停时显示清除图标 | `boolean` | - | `true` |
| confirm | 显示确认栏；日期时间和多选自动启用 | `boolean` | - | `false` |
| multiple | 多日期选择，仅用于 `date`，提交限制见注意事项 | `boolean` | - | `false` |
| changeOnSelect | 选择时立即提交并关闭，即使开启了确认栏 | `boolean` | - | `false` |
| open | 值变化时同步面板显示状态；交互仍可关闭面板 | `boolean` | - | `false` |
| startDate | 无选中值时的初始面板日期 | `Date` | - | 当前日期 |
| splitPanels | 范围面板独立翻页，同时维持左右顺序 | `boolean` | - | `true` |
| separator | 范围显示与字符串解析分隔符 | `string` | - | `' - '` |
| disabledDate | 判断日期是否禁用；季度表格传入 0–3 的季度索引，快捷项可能传入日期数组 | `(value: Date \| Date[] \| number) => boolean` | - | - |
| shortcuts | 快捷项，见下文 | `object[]` | - | - |
| timePickerOptions | 日期时间模式的时间配置，见下文 | `object` | - | `{}` |
| steps | 时、分、秒的步长 | `number[]` | - | `[]` |
| nullValue | 单值格式化结果为空时的替代值；范围清空通常返回空数组 | `string \| number \| object` | - | `''` |
| id | 内部输入框 ID | `string` | - | - |
| trigger | Popover 触发方式 | `string` | 同 Popover | `click` |
| tag | 触发容器标签 | `string` | - | `div` |
| placement | Popover 位置 | `string` | 同 Popover | `bottom-left` |
| arrow | 显示 Popover 箭头 | `boolean` | - | `false` |
| portal | 弹层是否挂载到 body；`false` 时挂到组件根节点内，随所在容器滚动，超出容器的部分会被其 `overflow` 裁剪 | `boolean` | - | `true` |
| portalClass | 弹层附加 class | `string \| object \| unknown[]` | - | - |

直接传入 `disabledDate`、`shortcuts`，不使用 `options` 包装。快捷项为 `{ text, value?: () => Date | Date[], onClick?: () => void }`，至少提供一个回调；`value()` 返回单个日期或范围，随后执行 `onClick()`。

`timePickerOptions` 支持 `disabledTime(date)`、`disabledHours`、`disabledMinutes`、`disabledSeconds`、`filterable`、`steps`。禁用列表为数字数组；`filterable: true` 隐藏禁用项，默认仅禁用。

### DatePicker 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| update:modelValue | 提交选中值，支持 `v-model` | `value` | 格式化字符串或数组；清空可能为 `nullValue` |
| change | 普通选择、确认或清空后触发 | `(value, reset)` | `reset(value)` 仅重置内部显示值 |
| ok | 确认且通过前置回调后触发 | `(value, reset)` | 同 `change` |
| clear | 清空后触发 | `value` | 清空后的值 |
| visible-change | 显示状态变化 | `visible: boolean` | 是否展开 |
| ready | 弹层就绪 | - | - |
| close | 弹层关闭 | - | - |
| error | 前置回调同步抛错 | `error` | 捕获的错误 |

`@before-ok` / JSX `onBeforeOk` 是前置回调，接收尚未格式化的 `Date[]`；`@before-clear` / `onBeforeClear` 不传参数。返回的 Promise resolve 后继续，reject 时中止。它们不是提交完成事件。

### DatePicker 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 自定义触发内容，替代输入框 | - |

### MDatePicker 属性

支持下方 MDatePickerView 的 `modelValue`、`type`、`format`、`minDate`、`maxDate`、`startHour`、`endHour`、`nullValue`，另有：

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| label | 条目标签 | `string` | - | - |
| labelWidth | 条目标签宽度 | `string \| number` | - | `''` |
| arrow | 条目箭头 | `boolean \| string` | - | `right` |
| extra | 未选中时的提示，允许空字符串 | `string` | - | 当前语言的“请选择” |
| formatter | 自定义显示，返回假值时使用默认显示 | `(value, format: string, dates: Date[]) => any` | - | - |
| title | 弹层标题 | `string` | - | `''` |
| cancelText | 取消文案，允许空字符串 | `string` | - | 当前语言的“取消” |
| okText | 确认文案，允许空字符串 | `string` | - | 当前语言的“确定” |
| showToolbar | 显示标题和操作栏 | `boolean` | - | `true` |

### MDatePicker 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| update:modelValue | 确认后更新绑定值 | `value` | 格式化字符串，季度为起止日期字符串数组 |
| change | 确认后提交值 | `value` | 同上 |
| ok | 点击确定 | `value` | 同上 |
| cancel | 点击取消，不提交值 | - | - |
| picker-change | 滚轮某列选中项改变 | `(value, index, row)` | 单列值、从 0 开始的列索引、含 value/label 的数据项 |
| visible-change | 弹层显示状态变化 | `visible: boolean` | 是否展开 |
| close | 关闭动画完成 | - | - |

### MDatePicker 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 自定义可点击的触发内容 | `{ label, value }`，格式化显示及当前绑定值 |

### MDatePicker 方法

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| open | 直接打开移动端选择器 | 日期属性、工具栏属性及 onOk(value)、onCancel() 等回调 | Portal 实例，可调用 destroy() |

`MDatePicker.open({ modelValue, type, onOk })` 不返回选中结果的 Promise；通过 `onOk` 接收结果。兼容 `value` 作为初始值别名，同时传入时以 `modelValue` 为准。`MDatePicker.View` 与 `MDatePickerView` 为同一组件。

### MDatePickerView 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| modelValue | 日期输入；季度使用起止日期数组 | `Date \| Date[] \| string \| string[]` | - | - |
| type | 滚轮类型 | `string` | `datetime`、`date`、`time`、`yearmonth`、`year`、`month`、`quarter` | `datetime` |
| format | 解析与输出格式，也决定时分秒列 | `string` | - | 按类型决定 |
| minDate | 日期下界 | `Date` | - | `1940-01-01 00:00` |
| maxDate | 日期上界 | `Date` | - | 创建组件时当前时间加 50 年 |
| startHour | time 模式小时下界 | `number` | `0`–`23` | `0` |
| endHour | time 模式小时上界 | `number` | `0`–`23` | `23` |
| allowDispatch | 更新时通知所属表单项 | `boolean` | - | `true` |
| nullValue | 空日期格式化结果 | `string \| number \| object` | - | `''` |

### MDatePickerView 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| update:modelValue | 滚动选择后更新绑定值 | `value` | 格式化字符串，季度为字符串数组 |
| change | 滚动选择后触发 | `value` | 同上 |
| picker-change | 单列选中项变化 | `(value, index, row)` | 单列值、列索引、数据项 |

### 格式与注意事项

- `date` / `daterange` 默认 `YYYY-MM-DD`，`datetime` / `datetimerange` 默认 `YYYY-MM-DD HH:mm:ss`，`year` 默认 `YYYY`，`month` / `monthrange` 默认 `YYYY-MM`。季度输出日期默认 `YYYY-MM-DD`。
- 移动端 `time` 默认 `HH:mm:ss`，`yearmonth` 和 `month` 均选择年、月。季度输出起止日期数组。
- 日期字符串应与 `format` 一致。范围和季度推荐使用数组，避免分隔符歧义。
- locale 控制面板文案和季度摘要；`format` 中的英文月份、星期和 AM/PM 格式标记保持现有解析与输出规则，不随界面语言改变。
- 当前桌面端 `multiple` 提交路径会将数组当作单值处理，可能报错；在修复前不要依赖多日期提交。该限制不影响日期范围模式。
- 农历、周数显示不是当前公开能力。
