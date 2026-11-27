## 时间选择器（TimePicker）

通过时间面板选择时、分、秒或起止时间。

移动端入口导出的 `MTimePicker` 与 `TimePicker` 是同一实现；需要滚轮选择时使用 [MDatePicker](../date-picker/README.md#移动端) 的 `time`、`timerange` 类型。

### 何时使用

用于预约时间、营业时段等只需录入时间的场景。

### 基础用法

`type="time"` 选择单个时间，`type="timerange"` 选择范围。选择后分别输出格式化字符串和两个字符串组成的数组；默认格式为 `HH:mm:ss`。每次提交触发 `change`，参数为 `(value, reset)`。

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
	<div class="time-picker-demo">
		<label class="time-picker-demo__field">
			<span>时间</span>
			<TimePicker v-model="time" @change="handleChange" />
		</label>
		<label class="time-picker-demo__field">
			<span>时间范围</span>
			<TimePicker v-model="range" type="timerange" confirm @change="handleChange" />
		</label>
		<p class="time-picker-demo__result">时间：{{ time }}；范围：{{ range }}</p>
		<p class="time-picker-demo__result">change：{{ changed }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { TimePicker } from '@deot/vc';

const time = ref('08:30:00');
const range = ref(['09:00:00', '18:00:00']);
const changed = ref('-');

const handleChange = (value) => {
	changed.value = JSON.stringify(value);
};
</script>

<style scoped>
.time-picker-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
	max-width: 420px;
}

.time-picker-demo__field {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.time-picker-demo__result {
	margin: 0;
	overflow-wrap: anywhere;
}
</style>
```
:::

### 确认、步长与清空

`confirm` 开启后，点击确定才提交值并触发 `ok`。`steps` 依次设置时、分、秒的步长；`format="HH:mm"` 只显示时、分，下例分钟以 15 分钟递增。`@before-ok` 在确认前调用，接收未格式化的 `Date[]`，返回的 Promise reject 时中止提交；`@before-clear` 同理作用于清空，同步抛错时触发 `error`。清空后单值返回 `nullValue`，`clearable` 为 `false` 时不显示清除图标。

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
	<div class="time-picker-demo">
		<div class="time-picker-demo__row">
			<TimePicker
				v-model="time"
				:steps="[1, 15]"
				:null-value="null"
				format="HH:mm"
				confirm
				@before-ok="handleBeforeOk"
				@before-clear="handleBeforeClear"
				@ok="handleOk"
				@clear="handleClear"
				@error="handleError"
			/>
			<TimePicker v-model="fixed" :clearable="false" format="HH:mm" />
		</div>
		<p class="time-picker-demo__result">已提交：{{ time === null ? 'null' : time }}</p>
		<p class="time-picker-demo__result">{{ status }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { TimePicker } from '@deot/vc';

const time = ref('09:00');
const fixed = ref('18:00');
const status = ref('选择时间后点击确定；确认前会等待 0.5 秒');

const handleBeforeOk = () => new Promise((resolve) => {
	status.value = '确认中…';
	setTimeout(resolve, 500);
});

const handleBeforeClear = () => {
	if (time.value === '12:00') {
		throw new Error('12:00 不允许清空');
	}
};

const handleOk = (value) => {
	status.value = `已确认：${value}`;
};

const handleClear = () => {
	status.value = '已清空';
};

const handleError = (error) => {
	status.value = `error：${error.message}`;
};
</script>

<style scoped>
.time-picker-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
	max-width: 420px;
}

.time-picker-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}

.time-picker-demo__result {
	margin: 0;
	overflow-wrap: anywhere;
}
</style>
```
:::

### 禁用时间

`disabledHours`、`disabledMinutes`、`disabledSeconds` 按数字禁用时、分、秒，`disabledTime` 按完整时间判断；`filterable` 隐藏被禁用的选项。

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
	<div class="time-picker-demo">
		<label class="time-picker-demo__field">
			<span>禁用 0–7 点、每小时前 10 分钟与 30 秒之后</span>
			<TimePicker
				v-model="time"
				:disabled-hours="[0, 1, 2, 3, 4, 5, 6, 7]"
				:disabled-minutes="[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]"
				:disabled-seconds="seconds"
			/>
		</label>
		<label class="time-picker-demo__field">
			<span>disabledTime 只允许 9:00–18:00，filterable 隐藏禁用项</span>
			<TimePicker v-model="limited" :disabled-time="handleDisabledTime" format="HH:mm" filterable />
		</label>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { TimePicker } from '@deot/vc';

const time = ref('08:10:00');
const limited = ref('09:30');
const seconds = Array.from({ length: 29 }, (_, i) => i + 31);

const handleDisabledTime = (date) => {
	const minutes = date.getHours() * 60 + date.getMinutes();
	return minutes < 9 * 60 || minutes > 18 * 60;
};
</script>

<style scoped>
.time-picker-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
	max-width: 420px;
}

.time-picker-demo__field {
	display: flex;
	flex-direction: column;
	gap: 8px;
}
</style>
```
:::

### 手动输入

默认可以直接在输入框里键入：值合法时时间列滚到该值，按 Enter、焦点离开或点击外部时提交，输入框随后按 `format` 显示。数字可以不补零，例如 `9:5:7` 提交为 `09:05:07`；超出范围（25 点）或被禁用的时间（`disabledHours`、`disabledMinutes`、`disabledSeconds`、`disabledTime`）不会生效，关闭后恢复原值。

- `timerange` 在一个输入框里输入起止，中间用 `separator` 分隔，起止颠倒时自动调换。
- 开启 `confirm` 时，键入只预览，按 Enter 等同点“确定”，焦点离开或直接关闭不提交。
- Esc 放弃键入的文字并关闭面板，Tab 关闭并按上面的规则提交；完整的规则与按键见 [DatePicker 的手动输入](../date-picker/README.md#手动输入)。不需要输入时设置 `editable` 为 `false`，输入框只读，仍可点击打开面板。

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
	<div class="time-picker-demo">
		<TimePicker v-model="time" :disabled-hours="[12, 13]" placeholder="如 9:5:7" />
		<TimePicker v-model="range" type="timerange" format="HH:mm" separator=" ~ " placeholder="如 9:00 ~ 18:00" />
		<TimePicker v-model="readonly" :editable="false" placeholder="只能在面板中选择" />
		<p class="time-picker-demo__result">time：{{ time || '无' }}；range：{{ range.join(' ~ ') || '无' }}；readonly：{{ readonly || '无' }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { TimePicker } from '@deot/vc';

const time = ref('08:30:00');
const range = ref(['09:00', '18:00']);
const readonly = ref('');
</script>

<style scoped>
.time-picker-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
	max-width: 360px;
}

.time-picker-demo__result {
	margin: 0;
	overflow-wrap: anywhere;
}
</style>
```
:::

### 弹层与触发

`placement` 设置弹出位置，`arrow` 显示箭头，`trigger` 设置 Popover 的触发方式；`changeOnSelect` 点选后立即提交并关闭面板。`portal` 为 `false` 时弹层挂到组件根节点内，`tag` 设置触发容器的标签，`id` 写到内部输入框上，可与 `label` 的 `for` 关联。默认插槽替换输入框作为触发内容。`open` 从外部同步面板的显示状态；面板打开、关闭时依次触发 `visible-change`、`ready`、`close`。

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
	<div class="time-picker-demo">
		<div class="time-picker-demo__row">
			<label for="time-picker-demo-input">右上弹出</label>
			<TimePicker
				id="time-picker-demo-input"
				v-model="time"
				placement="top-right"
				trigger="click"
				arrow
				change-on-select
			/>
		</div>
		<div class="time-picker-demo__row">
			<TimePicker
				v-model="slotTime"
				:open="isOpen"
				:portal="false"
				tag="section"
				format="HH:mm"
				@visible-change="handleVisibleChange"
				@ready="handleReady"
				@close="handleClose"
			>
				<Button>时间：{{ slotTime }}</Button>
			</TimePicker>
			<Button type="primary" @click="handleOpen">从外部打开</Button>
		</div>
		<p class="time-picker-demo__result">{{ events.join(' → ') || '暂无事件' }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, TimePicker } from '@deot/vc';

const time = ref('10:00:00');
const slotTime = ref('14:30');
const isOpen = ref(false);
const events = ref([]);

const record = (name) => {
	events.value = [...events.value, name].slice(-4);
};

const handleOpen = () => {
	isOpen.value = true;
};

const handleVisibleChange = (visible) => {
	isOpen.value = visible;
	record(`visible-change(${visible})`);
};

const handleReady = () => {
	record('ready');
};

const handleClose = () => {
	isOpen.value = false;
	record('close');
};
</script>

<style scoped>
.time-picker-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.time-picker-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}

.time-picker-demo__result {
	margin: 0;
}
</style>
```
:::

### 禁用与只读文字

`disabled` 禁用选择器。`plaintext` 时只把值按 `format` 格式化后显示，不渲染输入框与浮层：输出一个没有样式的 `<span class="vc-time-picker-plaintext">`，不能交互；没有值时显示 `extra`，未传时为空。规则同 [DatePicker 的只读文字](../date-picker/README.md#只读文字)。

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
	<div class="time-picker-demo">
		<TimePicker model-value="08:30:00" disabled />
		<p class="time-picker-demo__result">时间：<TimePicker model-value="08:30:00" plaintext /></p>
		<p class="time-picker-demo__result">范围：<TimePicker :model-value="['09:00', '18:00']" type="timerange" format="HH:mm" plaintext /></p>
		<p class="time-picker-demo__result">空值：<TimePicker model-value="" extra="未设置" plaintext /></p>
	</div>
</template>

<script setup>
import { TimePicker } from '@deot/vc';
</script>

<style scoped>
.time-picker-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
	max-width: 360px;
}

.time-picker-demo__result {
	margin: 0;
}
</style>
```
:::

## 主题与局部覆盖

全局参数通过 `--vc-<参数>` 配置，单个组件通过 `--vc-date-picker-<参数>` 覆盖。同一参数可能作用于多个状态；多命名空间时在使用位置中标明。

TimePicker 共用 DatePicker 时间面板，使用 date-picker 命名空间；Input、Popover 沿用各自主题入口。

弹层通过 Portal 挂载时，变量需作用于实际弹层或其祖先。

### 全局

| 参数 | 使用位置 | 值 |
| --- | --- | --- |
| color-dark-lighter | 时间弹层文字 | 亮色：`#515151`；暗色：`#D9D9D9` |
| color-dark-extralight | 禁用时间文字 | 亮色：`#909399`；暗色：`#B9B9B9` |
| color-neutral-light | 时间列、范围及确认区分隔线 | 亮色：`#EDEFF1`；暗色：`#3B4354` |
| color-primary | 选中时间文字 | `#456CF6` |
| color-primary-lighter | 时间选项键盘焦点背景（非悬停） | `rgba(45, 140, 240, 0.2)` |
| background-color-light | 时间选项选中（非悬停）及禁用选项悬停背景 | 亮色：`#F7F8FA`；暗色：`#2D3444` |
| background-color-primary-light | 可用时间选项悬停背景（含选中及焦点选项） | 亮色：`#E6F7FF`；暗色：`#273E5E` |

### 局部

当前组件没有额外的局部 CSS 主题参数。

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
| plaintext | 只显示格式化后的文字，不渲染输入框与浮层，没有样式、不能交互；见[只读文字](#禁用与只读文字) | `boolean` | - | `false` |
| extra | `plaintext` 没有值时显示的文字 | `string` | - | `''` |
| clearable | 有值且悬停时显示清除图标 | `boolean` | - | `true` |
| editable | 可直接在输入框里键入，见[手动输入](#手动输入) | `boolean` | - | `true` |
| separator | 范围显示与字符串解析的分隔符 | `string` | - | `' - '` |
| nullValue | 单值清空后的替代值；范围清空返回空数组 | `string \| number \| object` | - | `''` |
| id | 内部输入框 ID | `string` | - | - |
| placement | Popover 位置 | `string` | 同 Popover | `bottom-left` |
| trigger | Popover 触发方式 | `string` | 同 Popover | `click` |
| tag | 触发容器标签 | `string` | - | `div` |
| arrow | 显示弹层箭头 | `boolean` | - | `false` |
| portal | 弹层是否挂载到 body；`false` 时挂到组件根节点内 | `boolean` | - | `true` |
| portalClass | 弹层附加 class | `string \| object \| unknown[]` | - | - |

### 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| update:modelValue | 提交时间，支持 v-model | `value` | 单时间为字符串，范围为字符串数组 |
| change | 选择、确认或清空后提交 | `(value, reset)` | reset 仅重置内部显示值 |
| ok | 确认并通过前置回调后触发 | `(value, reset)` | 同 change |
| clear | 清空后触发 | `value` | 清空后的值 |
| visible-change | 点击触发器、点击外部、键入或按 Enter 改变面板显示状态时触发；清空、Esc、Tab、Enter 引起的关闭不触发 | `visible: boolean` | 是否展开 |
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
- 当前实现没有独立的 size 属性。输入框默认可输入，`editable` 为 `false` 时只读，仍可点击打开面板。
- 时间列显示出来时（打开面板）定位到选中的时间；键入或点选后带动画滚到新值。
- 共用面板的内置文案通过 `vc.DatePicker` locale 子树配置；共用样式使用 `--vc-date-picker-*` 主题覆盖。
