## 日期选择器（DatePicker）

选择日期、年月、季度或日期范围；移动端提供弹出选择器和内嵌滚轮，见[移动端](#移动端)。

### 何时使用

用于表单日期录入、按月或季度查询，以及选择起止日期。

### 基础用法

初始值可以是 `Date` 或日期字符串；选择后输出按 `format` 格式化的字符串。没有值时面板显示 `startDate` 所在的月份；选择、确认或清空后触发 `change(value, reset)`，清空另外触发 `clear`。

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
	<div class="date-picker-demo">
		<DatePicker
			v-model="value"
			:start-date="new Date(2026, 8, 19)"
			type="date"
			format="YYYY-MM-DD"
			placeholder="选择日期"
			clearable
			@change="handleChange"
			@clear="handleClear"
		/>
		<p class="date-picker-demo__result">当前值：{{ value || '无' }}；{{ status }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { DatePicker } from '@deot/vc';

const value = ref('');
const status = ref('等待操作');

const handleChange = (nextValue) => {
	status.value = `change：${nextValue || '空'}`;
};

const handleClear = () => {
	status.value = '触发 clear';
};
</script>

<style scoped>
.date-picker-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
	max-width: 320px;
}

.date-picker-demo__result {
	margin: 0;
	overflow-wrap: anywhere;
}
</style>
```
:::

### 其他日期单位

`type` 可以选择年、月、季度。`confirm` 显示确认栏，点“确定”后触发 `ok`。

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
	<div class="date-picker-demo">
		<div class="date-picker-demo__row">
			<DatePicker v-model="year" type="year" placeholder="选择年" class="date-picker-demo__item" clearable confirm @ok="handleOk" />
			<DatePicker v-model="month" type="month" placeholder="选择月" class="date-picker-demo__item" clearable />
			<DatePicker v-model="quarter" type="quarter" placeholder="选择季度" class="date-picker-demo__item" clearable confirm @ok="handleOk" />
		</div>
		<p class="date-picker-demo__result">年：{{ year || '无' }}；月：{{ month || '无' }}；季度：{{ quarter || '无' }}；{{ status }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { DatePicker } from '@deot/vc';

const year = ref('');
const month = ref('');
const quarter = ref('');
const status = ref('');

const handleOk = (value) => {
	status.value = `ok：${value}`;
};
</script>

<style scoped>
.date-picker-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.date-picker-demo__row {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}

.date-picker-demo__item {
	width: 200px;
}

.date-picker-demo__result {
	margin: 0;
	overflow-wrap: anywhere;
}
</style>
```
:::

### 选择日期范围

范围类 `type` 选择起止，`separator` 设置显示的分隔符。`shortcuts` 在面板左侧添加快捷项，每项为 `{ text, value?, onClick? }`；范围面板默认左右独立翻页，`splitPanels` 为 `false` 时两侧联动。

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
	<div class="date-picker-demo">
		<DatePicker
			v-model="daterange"
			:shortcuts="shortcuts"
			type="daterange"
			placeholder="日期范围，带快捷项"
			class="date-picker-demo__item"
			clearable
		/>
		<DatePicker
			v-model="datetimerange"
			:split-panels="false"
			type="datetimerange"
			placeholder="日期时间范围，左右联动"
			clearable
			confirm
		/>
		<DatePicker
			v-model="monthrange"
			type="monthrange"
			separator=" 到 "
			placeholder="月份范围"
			class="date-picker-demo__item"
			clearable
		/>
		<DatePicker v-model="quarterrange" type="quarterrange" placeholder="季度范围" class="date-picker-demo__item" clearable />
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { DatePicker } from '@deot/vc';

const DAY = 24 * 60 * 60 * 1000;
const daterange = ref([]);
const datetimerange = ref([]);
const monthrange = ref([]);
const quarterrange = ref([]);
const shortcuts = [
	{ text: '最近一周', value: () => [new Date(Date.now() - 6 * DAY), new Date()] },
	{ text: '最近一个月', value: () => [new Date(Date.now() - 29 * DAY), new Date()] }
];
</script>

<style scoped>
.date-picker-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
	max-width: 420px;
}

.date-picker-demo__item {
	width: 280px;
	max-width: 100%;
}
</style>
```
:::

### 设置可选的时间范围

`disabledDate` 按天判断是否可选；`timePickerOptions` 禁用时、分、秒（`disabledHours`、`disabledMinutes`、`disabledTime` 等），`steps` 设置时、分、秒的步长。

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
	<div class="date-picker-demo">
		<DatePicker
			v-model="value"
			:start-date="new Date()"
			:disabled-date="disabledDate"
			:time-picker-options="timeOptions"
			:steps="[1, 15]"
			type="datetime"
			format="YYYY-MM-DD HH:mm"
			placeholder="今天起 10 天内，9 点到 18 点"
		/>
		<p class="date-picker-demo__result">当前值：{{ value || '无' }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { DatePicker } from '@deot/vc';

const DAY = 24 * 60 * 60 * 1000;
const value = ref('');

const disabledDate = (date) => {
	return date && (date.valueOf() < Date.now() - DAY || date.valueOf() > Date.now() + 10 * DAY);
};

const timeOptions = {
	disabledHours: [0, 1, 2, 3, 4, 5, 6, 7, 8, 19, 20, 21, 22, 23],
	disabledMinutes: []
};
</script>

<style scoped>
.date-picker-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
	max-width: 320px;
}

.date-picker-demo__result {
	margin: 0;
}
</style>
```
:::

### 周起始日

`firstDayOfWeek` 使用 `1` 至 `7` 表示周一至周日，默认 `7`（周日），单日期与范围面板都生效。未传时读取全局 `VcInstance.options.DatePicker.firstDayOfWeek`，见[全局配置](../vc/README.md)。1 日正好是每周第一天时不补上月日期，面板固定 6 行。

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
	<div class="date-picker-demo">
		<DatePicker v-model="date" :first-day-of-week="1" placeholder="周一开始" />
		<DatePicker v-model="range" :first-day-of-week="1" type="daterange" placeholder="周一开始" />
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { DatePicker } from '@deot/vc';

const date = ref('');
const range = ref([]);
</script>

<style scoped>
.date-picker-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
	max-width: 420px;
}
</style>
```
:::

### 手动输入

默认可以直接在输入框里键入：值合法时面板跳到该值，按 Enter、焦点离开或点击外部时提交，输入框随后按 `format` 显示。数字可以不补零、分隔符可以不同，例如 `2024-3-5`、`2024/03/05` 都按 `YYYY-MM-DD` 解析为 3 月 5 日；超出范围（2 月 30 日、25 点）或被禁用的值不会生效，关闭后恢复原值。

- 范围在一个输入框里输入起止，中间用 `separator`（默认 `' - '`）分隔；起止颠倒时自动调换。
- 禁用判断与面板一致：`disabledDate` 按当天判断，`month` / `monthrange` 只要当月有一天被禁用就禁用，`year` 不判断；带时间的类型还会检查 `timePickerOptions` 里禁用的时、分、秒和 `disabledTime`。
- 带确认栏时（`datetime`、`datetimerange` 或 `confirm`），键入只预览，按 Enter 等同点“确定”（经过 `onBeforeOk`），焦点离开或直接关闭不提交，与在面板上点选后不确定一致。
- 清空文字后提交：`clearable` 时等同点清除（经过 `onBeforeClear`），否则恢复原值。
- 季度显示的是季度名称、多选是逗号拼接的列表，无法从文字解析，输入框始终只读；用默认插槽替换输入框时也没有输入。不需要输入时设置 `editable` 为 `false`（下例最后一个）。

| 按键 | 行为 |
| --- | --- |
| Enter | 输入框聚焦时：关闭状态下打开浮层；有键入的文字时按上面的规则提交（不合法时不处理）；否则关闭浮层，带确认栏时等同点“确定” |
| Esc | 放弃键入的文字并关闭浮层；按键不再传给页面，所在的 Modal 不会一起关闭 |
| Tab | 关闭浮层，按上面的规则提交或放弃，焦点照常移走 |

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
	<div class="date-picker-demo">
		<DatePicker v-model="date" clearable placeholder="如 2024-3-5" />
		<DatePicker v-model="range" type="daterange" clearable placeholder="如 2024-3-1 - 2024-3-15" />
		<DatePicker v-model="datetime" type="datetime" placeholder="键入后按 Enter 确定" />
		<DatePicker v-model="readonlyDate" :editable="false" placeholder="只能在面板上选择" />
		<p class="date-picker-demo__result">date：{{ date || '无' }}；range：{{ range.join(' ~ ') || '无' }}；datetime：{{ datetime || '无' }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { DatePicker } from '@deot/vc';

const date = ref('2024-03-15');
const range = ref(['2024-03-01', '2024-03-15']);
const datetime = ref('');
const readonlyDate = ref('');
</script>

<style scoped>
.date-picker-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
	max-width: 360px;
}

.date-picker-demo__result {
	margin: 0;
	overflow-wrap: anywhere;
}
</style>
```
:::

### 前置回调与提交方式

`@before-ok` 在确认前执行，接收尚未格式化的 `Date[]`，返回的 Promise resolve 后才提交，reject 时中止；同步抛错时触发 `error`。`changeOnSelect` 让点选立即提交并关闭，即使开启了确认栏。`nullValue` 指定单值清空后的值，`disabled` 禁用选择器。

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
	<div class="date-picker-demo">
		<DatePicker
			v-model="checked"
			type="datetime"
			placeholder="确认前校验：不能选周末"
			@before-ok="handleBeforeOk"
			@error="handleError"
		/>
		<DatePicker v-model="instant" :null-value="null" placeholder="点选即提交" change-on-select confirm clearable />
		<DatePicker model-value="2024-03-15" disabled />
		<p class="date-picker-demo__result">checked：{{ checked || '无' }}；instant：{{ JSON.stringify(instant) }}；{{ status }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { DatePicker } from '@deot/vc';

const checked = ref('');
const instant = ref('');
const status = ref('');

const handleBeforeOk = (dates) => {
	const day = dates[0]?.getDay();
	if (day === 0 || day === 6) throw new Error('不能选周末');
	status.value = '校验中…';
	return new Promise((resolve) => {
		setTimeout(() => {
			status.value = '已通过校验';
			resolve();
		}, 600);
	});
};

const handleError = (error) => {
	status.value = `error：${error.message}`;
};
</script>

<style scoped>
.date-picker-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
	max-width: 360px;
}

.date-picker-demo__result {
	margin: 0;
	overflow-wrap: anywhere;
}
</style>
```
:::

### 浮层与触发

`trigger` 设置打开方式，`placement` 设置位置，`arrow` 显示箭头；`tag` 设置触发容器标签，`id` 传给内部输入框。`open` 从外部控制面板显示，交互仍可关闭面板。`portal` 为 `false` 时浮层挂在组件根节点内。浮层就绪时触发 `ready`，用户操作改变显示状态时触发 `visible-change`，关闭时触发 `close`。

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
	<div class="date-picker-demo">
		<DatePicker
			id="date-picker-demo-target"
			v-model="hoverValue"
			trigger="hover"
			placement="top-left"
			tag="section"
			placeholder="悬停打开，浮层在上方"
			arrow
			@ready="handleReady"
			@visible-change="handleVisibleChange"
			@close="handleClose"
		/>
		<Checkbox v-model="isOpen">打开面板</Checkbox>
		<DatePicker v-model="openValue" :open="isOpen" :portal="false" placeholder="由外部控制" />
		<p class="date-picker-demo__result">{{ status }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Checkbox, DatePicker } from '@deot/vc';

const hoverValue = ref('');
const openValue = ref('');
const isOpen = ref(false);
const status = ref('等待操作');

const handleReady = () => {
	status.value = '触发 ready';
};

const handleVisibleChange = (visible) => {
	status.value = `visible-change：${visible}`;
};

const handleClose = () => {
	status.value = '触发 close';
};
</script>

<style scoped>
.date-picker-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
	max-width: 320px;
}

.date-picker-demo__result {
	margin: 0;
}
</style>
```
:::

### 自定义触发内容

默认插槽替换输入框，点击插槽内容打开面板；替换后不能键入。

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
	<div class="date-picker-demo">
		<DatePicker v-model="value" type="month">
			<Button>{{ value || '选择月份' }}</Button>
		</DatePicker>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, DatePicker } from '@deot/vc';

const value = ref('');
</script>

<style scoped>
.date-picker-demo {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}
</style>
```
:::

### 只读文字

`plaintext` 时只把值按 `format` 格式化后显示（与关闭时输入框里的文字相同：范围以 `separator` 连接，季度为季度名，多选以 `,` 连接），不渲染输入框与浮层：输出一个没有样式的 `<span class="vc-date-picker-plaintext">`（TimePicker 为 `vc-time-picker-plaintext`），不能交互，`class`、`style` 等 attribute 落在它上面。优先于 `disabled`。

- 没有值时显示 `extra`，未传时为空，不显示占位文字。
- `MDatePicker` 同样支持，文字与触发区一致（`formatter` 生效），输出 `<span class="vcm-date-picker-plaintext">`。

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
	<div class="date-picker-demo">
		<div>日期：<DatePicker model-value="2024-03-15" plaintext /></div>
		<div>范围：<DatePicker :model-value="['2024-03-01', '2024-03-15']" type="daterange" separator=" ~ " plaintext /></div>
		<div>空值：<DatePicker extra="-" plaintext /></div>
	</div>
</template>

<script setup>
import { DatePicker } from '@deot/vc';
</script>

<style scoped>
.date-picker-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}
</style>
```
:::

## 移动端

`MDatePicker` 是独立的移动端组件：默认渲染 MListItem（`label`、`labelWidth`、`arrow` 传给它），点击后从底部弹出滚轮；`MDatePickerView` 是滚轮本身，也可以直接放在页面中。`type` 与桌面端对齐：`year`、`month`、`quarter`、`date`、`datetime`、`time`，以及范围类 `daterange`、`datetimerange`、`monthrange`、`quarterrange`、`timerange`；值的格式与桌面端相同。尺寸按 750 稿设计，写为 `calc(var(--vc-rem) * n)`，随 `--vc-rem` 缩放，底栏切换 `rem` 可查看不同屏宽下的效果。

### 移动端日期时间选择

确认后提交格式化字符串，取消不提交；`format="HH:mm"` 只显示时、分列。

- `confirm` 默认 `true`，顶部为「取消 / 确定」工具栏（文案由 `cancelText`、`okText` 设置）；`'bottom'` 为底部的「确定」大按钮；`false` 不需要确认，滚轮停下即提交。
- 提交时触发 `ok`、`change`，点「取消」触发 `cancel`，滚轮某列选中项改变时触发 `picker-change(value, index, row)`。
- `title` 设置弹层标题；`formatter(value, format, dates)` 自定义触发项上的文字，返回假值时使用默认显示。
- 默认插槽替换整个触发内容，参数为 `{ label, value }`。
- `MDatePicker.open(options)` 直接打开，返回的 Portal 实例可以 `await` 得到 `{ value }`，取消时拒绝。

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
	<div class="m-date-picker-demo">
		<MDatePicker
			v-model="datetime"
			label="日期时间"
			label-width="160"
			title="选择日期时间"
			type="datetime"
			format="YYYY-MM-DD HH:mm"
			cancel-text="返回"
			ok-text="完成"
			@ok="handleOk"
			@cancel="handleCancel"
			@picker-change="handlePickerChange"
		/>
		<MDatePicker
			v-model="month"
			:formatter="formatMonth"
			label="年月"
			label-width="160"
			title="选择年月"
			type="month"
			confirm="bottom"
			@visible-change="handleVisibleChange"
			@close="handleClose"
		/>
		<MDatePicker
			v-model="time"
			:confirm="false"
			label="时分"
			label-width="160"
			type="time"
			format="HH:mm"
			@change="handleChange"
		/>
		<MDatePicker v-model="date" :arrow="false" type="date" title="选择日期">
			<template #default="{ label }">
				<div class="m-date-picker-demo__trigger">自定义触发区：{{ label }}</div>
			</template>
		</MDatePicker>
		<div class="m-date-picker-demo__actions">
			<MButton type="primary" @click="handleOpen">MDatePicker.open 直接调用</MButton>
		</div>
		<p class="m-date-picker-demo__result">datetime：{{ datetime }}；month：{{ month }}；time：{{ time }}；open：{{ opened }}</p>
		<p class="m-date-picker-demo__result">{{ status }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MButton, MDatePicker } from '@deot/vc';

const datetime = ref('');
const month = ref('');
const time = ref('');
const date = ref('');
const opened = ref('');
const status = ref('等待操作');

const formatMonth = (value, format, dates) => {
	return dates[0] && `${dates[0].getFullYear()} 年 ${dates[0].getMonth() + 1} 月`;
};

const handleOk = (value) => {
	status.value = `ok：${value}`;
};

const handleCancel = () => {
	status.value = '触发 cancel';
};

const handlePickerChange = (value, index) => {
	status.value = `picker-change：第 ${index + 1} 列 → ${value}`;
};

const handleVisibleChange = (visible) => {
	status.value = `visible-change：${visible}`;
};

const handleClose = () => {
	status.value = '触发 close';
};

const handleChange = (value) => {
	status.value = `change：${value}`;
};

const handleOpen = async () => {
	try {
		const result = await MDatePicker.open({ modelValue: opened.value, type: 'date', title: '直接调用' });
		opened.value = result.value;
	} catch {
		status.value = '已取消';
	}
};
</script>

<style scoped>
.m-date-picker-demo {
	display: flex;
	flex-direction: column;
	gap: calc(var(--vc-rem) * 16);
}

.m-date-picker-demo__trigger {
	padding: calc(var(--vc-rem) * 24) calc(var(--vc-rem) * 32);
	color: var(--vc-color-primary);
}

.m-date-picker-demo__actions {
	display: flex;
	padding-inline: calc(var(--vc-rem) * 32);
}

.m-date-picker-demo__result {
	margin: 0;
	padding-inline: calc(var(--vc-rem) * 32);
	overflow-wrap: anywhere;
}
</style>
```
:::

### 移动端范围选择

范围类在滚轮上方显示起止栏：点哪一侧就编辑哪一侧，默认是开始。结束一侧早于开始值的年、月、日、时等置灰；开始值改到结束值之后时，结束值跟到开始值。`MDatePickerView` 每次滚动选择都更新 `v-model` 并触发 `change`；放在 MDatePicker 弹层里时点「确定」才一起提交 `[开始, 结束]`，触发项用 `separator`（默认 `' - '`）连接起止。

`virtualized` 默认开启，每一列只渲染可见窗口附近的行；`nullValue` 为空日期格式化后的值。

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
	<div class="m-date-picker-demo">
		<MDatePickerView
			v-model="value"
			:virtualized="false"
			:null-value="null"
			type="daterange"
			separator=" ~ "
			@change="handleChange"
			@picker-change="handlePickerChange"
		/>
		<p class="m-date-picker-demo__result">{{ value }}</p>
		<p class="m-date-picker-demo__result">{{ status }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MDatePickerView } from '@deot/vc';

const value = ref(['2024-03-10', '2024-03-20']);
const status = ref('滚动任一列');

const handleChange = (nextValue) => {
	status.value = `change：${nextValue.join(' ~ ')}`;
};

const handlePickerChange = (columnValue, index) => {
	status.value = `picker-change：第 ${index + 1} 列 → ${columnValue}`;
};
</script>

<style scoped>
.m-date-picker-demo {
	display: flex;
	flex-direction: column;
	gap: calc(var(--vc-rem) * 16);
}

.m-date-picker-demo__result {
	margin: 0;
	padding-inline: calc(var(--vc-rem) * 32);
	overflow-wrap: anywhere;
}
</style>
```
:::

### 移动端的禁用与范围

与桌面端相同，用 `disabledDate` 按天判断、用 `timePickerOptions` 和 `steps` 限制时分秒；年份滚轮的范围由 `yearRange` 决定。

- 不可选的项置灰，停在上面时回弹到最近的可选项，点击不响应。不存在的日期（如 2 月 30 日）不显示。
- 年、季度、月只在其中每一天都被 `disabledDate` 禁用时置灰，保证可选的日期一定能滚到；`disabledDate` 只传入 `Date`（当天 0 点）。
- 时、分、秒与桌面端的时间列相同：在 `disabledHours` 等列表里，或 `disabledTime` 判断首尾两个时刻都禁用时置灰；`filterable: true` 时隐藏。
- 初始值或今天落在置灰项上时，显示并提交最近的可选值。

下例周末置灰，只能选 9 点到 18 点，分钟以 15 为步长，年份限定在 2020 至 2030。

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
	<div class="m-date-picker-demo">
		<MDatePickerView
			v-model="value"
			:disabled-date="disabledDate"
			:steps="[1, 15]"
			:time-picker-options="timeOptions"
			:year-range="[2020, 2030]"
			type="datetime"
			format="YYYY-MM-DD HH:mm"
		/>
		<p class="m-date-picker-demo__result">{{ value }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MDatePickerView } from '@deot/vc';

const value = ref('');
const disabledDate = date => date.getDay() === 0 || date.getDay() === 6;
const timeOptions = { disabledHours: [0, 1, 2, 3, 4, 5, 6, 7, 8, 19, 20, 21, 22, 23] };
</script>

<style scoped>
.m-date-picker-demo {
	display: flex;
	flex-direction: column;
	gap: calc(var(--vc-rem) * 16);
}

.m-date-picker-demo__result {
	margin: 0;
	padding-inline: calc(var(--vc-rem) * 32);
}
</style>
```
:::

## 主题与局部覆盖

全局参数通过 `--vc-<参数>` 配置，单个组件通过 `--vc-date-picker-<参数>` 覆盖。同一参数可能作用于多个状态；多命名空间时在使用位置中标明。

日、月、季度、年表中的选中标记文字使用可覆盖的 color-contrast-light。

弹层通过 Portal 挂载时，变量需作用于实际弹层或其祖先。

### 全局

| 参数 | 使用位置 | 值 |
| --- | --- | --- |
| color-contrast-light | 日、月、季度、年表中的选中文字 | `#FFFFFF`（亮暗主题相同） |
| color-dark-lighter | 弹层文字 | 亮色：`#515151`；暗色：`#D9D9D9` |
| color-dark-light | 移动端范围起止栏中当前一侧的文字 | 亮色：`#080F20`；暗色：`#E8E8E8` |
| foreground-color-inactive | 移动端范围起止栏中另一侧的文字与分隔符 | 亮色：`#C0C4CC`；暗色：`#737D8C` |
| background-color-lighter | 移动端范围起止栏背景 | 亮色：`#FAFAFA`；暗色：`#292F3E` |
| color-dark-extralight | 导航箭头、表头、禁用及相邻日期文字 | 亮色：`#909399`；暗色：`#B9B9B9` |
| color-neutral-light | 日期头、时间列、确认区及范围面板分隔线 | 亮色：`#EDEFF1`；暗色：`#3B4354` |
| color-primary | 选中日期、今天标记及导航激活状态 | `#456CF6` |
| color-primary-lighter | 时间选项键盘焦点背景（非悬停） | `rgba(45, 140, 240, 0.2)` |
| background-color | 快捷选项背景 | 亮色：`#F5F6FA`；暗色：`#252B3A` |
| background-color-light | 日期、月份、季度、年份禁用背景，时间选项选中（非悬停）及禁用选项悬停背景 | 亮色：`#F7F8FA`；暗色：`#2D3444` |
| background-color-primary-light | 日期、日期时间、月份及季度区间内部的连续底色；日、月、季度、年表、可用时间及快捷选项悬停背景 | 亮色：`#E6F7FF`；暗色：`#273E5E` |

### 局部

当前组件没有额外的局部 CSS 主题参数。

## API

### DatePicker 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| type | 选择类型 | `string` | `date`、`datetime`、`year`、`month`、`quarter`、`daterange`、`datetimerange`、`monthrange`、`quarterrange` | `date` |
| modelValue | 初始日期；范围和季度推荐数组 | `Date \| string \| (Date \| string)[]` | - | - |
| format | 解析与输出格式；季度展示仍为季度名称 | `string` | - | 按类型决定 |
| placeholder | 占位文本，允许空字符串 | `string` | - | 当前语言的“请选择” |
| disabled | 禁用选择器 | `boolean` | - | `false` |
| plaintext | 只显示格式化后的文字，不渲染输入框与浮层，没有样式、不能交互；见[只读文字](#只读文字) | `boolean` | - | `false` |
| extra | `plaintext` 没有值时显示的文字 | `string` | - | `''` |
| clearable | 有值且悬停时显示清除图标 | `boolean` | - | `true` |
| editable | 可直接在输入框里键入，见[手动输入](#手动输入)；季度、多选时始终只读 | `boolean` | - | `true` |
| confirm | 显示确认栏；日期时间和多选自动启用 | `boolean` | - | `false` |
| multiple | 多日期选择，仅用于 `date`，提交限制见注意事项 | `boolean` | - | `false` |
| changeOnSelect | 选择时立即提交并关闭，即使开启了确认栏 | `boolean` | - | `false` |
| open | 值变化时同步面板显示状态；交互仍可关闭面板 | `boolean` | - | `false` |
| startDate | 无选中值时的初始面板日期 | `Date` | - | 当前日期 |
| splitPanels | 范围面板独立翻页，同时维持左右顺序 | `boolean` | - | `true` |
| separator | 范围显示与字符串解析分隔符 | `string` | - | `' - '` |
| firstDayOfWeek | 每周第一天；`1` 至 `7` 分别表示周一至周日。未传时读取全局 `DatePicker.firstDayOfWeek`，仍缺省为 `7`；仅桌面端 | `number` | `1`-`7` | `7` |
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
| visible-change | 点击触发器、点击外部、键入或按 Enter 改变显示状态时触发；选择、清空、Esc、Tab、Enter 引起的关闭不触发 | `visible: boolean` | 是否展开 |
| ready | 弹层就绪 | - | - |
| close | 弹层关闭 | - | - |
| error | 前置回调同步抛错 | `error` | 捕获的错误 |

`@before-ok` / JSX `onBeforeOk` 是前置回调，接收尚未格式化的 `Date[]`；`@before-clear` / `onBeforeClear` 不传参数。返回的 Promise resolve 后继续，reject 时中止。它们不是提交完成事件。

### DatePicker 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 自定义触发内容，替代输入框 | - |

### MDatePicker 属性

支持下方 MDatePickerView 的 `modelValue`、`type`、`format`、`disabledDate`、`timePickerOptions`、`steps`、`yearRange`、`virtualized`、`separator`、`nullValue`，另有：

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| disabled | 禁用，点击不打开 | `boolean` | - | `false` |
| label | 条目标签 | `string \| number \| Function \| { type: string; value: any }` | - | - |
| labelWidth | 条目标签宽度，750 稿长度，传给 MListItem | `string \| number` | - | `''` |
| arrow | 条目箭头 | `boolean \| string` | - | `right` |
| plaintext | 只显示格式化后的文字，不渲染 MListItem 与弹层，没有样式、不能交互；见[只读文字](#只读文字) | `boolean` | - | `false` |
| extra | 未选中时的提示，允许空字符串 | `string` | - | 当前语言的“请选择”；`plaintext` 时为 `''` |
| formatter | 自定义显示，返回假值时使用默认显示 | `(value, format: string, dates: Date[]) => any` | - | - |
| title | 弹层标题。字符串按文本渲染，也可传渲染函数或 `{ type, value }`（需要 HTML 时传 `{ type: 'html', value }`），见 [Customer](../customer/README.md) | `string \| number \| Function \| { type: string; value: any }` | - | `''` |
| cancelText | 取消文案，允许空字符串 | `string` | - | 当前语言的“取消” |
| okText | 确认文案，允许空字符串 | `string` | - | 当前语言的“确定” |
| confirm | 由「确定」提交：`true` / `'top'` 为顶部的「取消 / 确定」工具栏；`'bottom'` 为底部的「确定」大按钮，标题与关闭按钮在 MPopup 的标题栏；`false` 不需要确认，滚轮停下即提交，标题栏只有关闭按钮 | `boolean \| string` | `true`、`false`、`top`、`bottom` | `true` |

`formatter` 的 `dates` 为选中的点：单值为 `[date]`，范围为 `[start, end]`，季度取季度的第一天。

### MDatePicker 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| update:modelValue | 确认后更新绑定值；`confirm` 为 `false` 时滚轮停下即更新 | `value` | 格式化字符串；季度与范围类为字符串数组 |
| change | 确认后提交值；`confirm` 为 `false` 时滚轮停下即提交 | `value` | 同上 |
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
| open | 直接打开移动端选择器 | 日期属性、工具栏属性及 onOk(value)、onCancel() 等回调 | Portal 实例，可 `await` 得到 `{ value }`（同 `onOk`，取消时拒绝），可调用 `destroy()` |

`MDatePicker.open({ modelValue, type, onOk })` 通过 `onOk` 接收结果；返回的 Portal 实例可以 `await`：确定后（关闭动画结束时）得到 `onOk` 的参数组成的对象 `{ value }`，取消、点遮罩等没有确定就关闭时拒绝（只用回调时不会产生未处理的拒绝）；也可调用 `destroy()`。兼容 `value` 作为初始值别名，同时传入时以 `modelValue` 为准。`MDatePicker.View` 与 `MDatePickerView` 为同一组件。

### MDatePickerView 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| modelValue | 日期输入，格式同桌面端：单值为字符串或 `Date`；季度与范围类为数组 | `Date \| Date[] \| string \| string[]` | - | - |
| type | 滚轮类型 | `string` | `year`、`month`、`quarter`、`date`、`datetime`、`time`、`daterange`、`datetimerange`、`monthrange`、`quarterrange`、`timerange` | `datetime` |
| format | 解析与输出格式，也决定时分秒列 | `string` | - | 按类型决定 |
| disabledDate | 按天判断是否禁用；年、季度、月中每一天都被禁用时该行置灰 | `(date: Date) => boolean` | - | - |
| timePickerOptions | 时、分、秒的禁用：`disabledTime(date)`、`disabledHours`、`disabledMinutes`、`disabledSeconds`、`filterable`（隐藏禁用项），同桌面端 | `object` | - | `{}` |
| steps | 时、分、秒的步长 | `number[]` | - | `[]` |
| yearRange | 年份滚轮的范围 | `[number, number]` | - | `[1900, 2100]` |
| virtualized | 每一列只渲染可见窗口附近的行，同 [MPicker](../picker/README.md) | `boolean` | - | `true` |
| separator | 范围的显示文字与字符串解析的分隔符 | `string` | - | `' - '` |
| allowDispatch | 更新时通知所属表单项 | `boolean` | - | `true` |
| nullValue | 空日期格式化结果 | `string \| number \| object` | - | `''` |

### MDatePickerView 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| update:modelValue | 滚动选择后更新绑定值 | `value` | 格式化字符串；季度与范围类为字符串数组 |
| change | 滚动选择后触发 | `value` | 同上 |
| picker-change | 单列选中项变化 | `(value, index, row)` | 单列值、列索引、数据项 |

### 格式与注意事项

- `date` / `daterange` 默认 `YYYY-MM-DD`，`datetime` / `datetimerange` 默认 `YYYY-MM-DD HH:mm:ss`，`year` 默认 `YYYY`，`month` / `monthrange` 默认 `YYYY-MM`。季度输出日期默认 `YYYY-MM-DD`。
- 移动端 `time` / `timerange` 默认 `HH:mm:ss`，`month` 选择年、月。季度输出起止日期数组，`quarterrange` 输出开始季度第一天与结束季度最后一天。
- 日期字符串应与 `format` 一致。范围和季度推荐使用数组，避免分隔符歧义。
- `format` 使用 [dayjs 的格式标记](https://day.js.org/docs/en/display/format)，原样文字放在 `[]` 里（如 `YYYY[年]MM[月]DD[日]`；不含标记的文字如 `HH点mm分` 可以直接写）。解析时数字可以不补零（`MM`、`DD` 也接受一位数）。
- locale 控制面板文案和季度摘要；`format` 中的英文月份、星期和 AM/PM 不随界面语言改变。
- 当前桌面端 `multiple` 提交路径会将数组当作单值处理，可能报错；在修复前不要依赖多日期提交。该限制不影响日期范围模式。
- 农历、周数显示不是当前公开能力。
- 可输入时，浮层打开后点击输入框只移动光标，不再关闭浮层，这次点击照常冒泡到祖先节点；点后缀图标仍可切换。输入框聚焦时 Enter 会被处理，放在原生 `<form>` 里不会触发隐式提交。
- 关闭浮层时回到已提交的值：传了 `modelValue`（`v-model` 或 `:model-value`）时以它为准，调用方可以不接受某次修改；不传时为最后一次提交的值。`modelValue` 换成内容相同的新数组（如模板里内联的 `[start, end]`）时，不会打断面板上进行中的选择。
- 时间列显示出来时（打开浮层、切到时间视图）定位到选中的时间。
