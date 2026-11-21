## 日历（Calendar）

按月展示日期网格，可选中日期、区间或多个日期，也可以切换到年视图。`MCalendar` 是移动端版本，属性、事件和插槽相同，差异见[移动端](#移动端)。在移动端弹层里选择日期请用 `MCalendarPicker`，见[移动端日期选择](#移动端日期选择)。

### 何时使用

- 展示日程、课表、价格日历等按日期组织的数据。
- 在页面上直接选择日期、区间或多个日期。
- 在简体中文环境下展示农历、节气或节日。

### 基础用法

头部自带翻页箭头和「今天」按钮；点击标题在月视图和年视图之间切换，年视图里点击某个月回到该月。点中日期后发出 `update:modelValue`，值按 `format` 格式化。

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
	<Calendar v-model="value" />
	<p>值：{{ value }}</p>
</template>

<script setup>
import { ref } from 'vue';
import { Calendar } from '@deot/vc';

const value = ref('');
</script>
```
:::

### 区间与多选

`type="daterange"` 时，第一次点选起点、第二次点选终点（早于起点时自动交换），选完后提交 `[起, 止]`；选择中鼠标悬停会预览区间。`multiple` 时再次点选会取消该日期，只在 `type="date"` 时生效。值的格式与 DatePicker 相同。

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
	<Calendar v-model="range" type="daterange" :disabled-date="disabledDate" />
	<p>区间：{{ range }}</p>
	<Calendar v-model="dates" multiple />
	<p>多选：{{ dates }}</p>
</template>

<script setup>
import { ref } from 'vue';
import { Calendar } from '@deot/vc';

const range = ref([]);
const dates = ref([]);
// 周末不可选
const disabledDate = date => date.getDay() === 0 || date.getDay() === 6;
</script>
```
:::

### 日期内容与农历

`content` 插槽显示在日期数字下方，适合放日程、价格等内容，放不下时在格子内滚动（`Scroller`，移动端为 `MScroller`）；`cell` 插槽替换整个格子。`lunar` 在 `zh-CN` 下于数字旁显示一行文字，优先级为节日 > 节气 > 农历日，农历初一显示月名。`readonly` 用于纯展示：不可选中，点击仍发出 `date-click`。

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
	<Calendar lunar readonly @date-click="handleClick">
		<template #content="{ value }">
			<div v-for="item in events[value]" :key="item" class="calendar-event">
				{{ item }}
			</div>
		</template>
	</Calendar>
	<p>点击：{{ clicked }}</p>
</template>

<script setup>
import { ref } from 'vue';
import { Calendar } from '@deot/vc';

const pad = value => String(value).padStart(2, '0');
const now = new Date();
const key = day => `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(day)}`;
const events = {
	[key(8)]: ['事项 A', '事项 B'],
	[key(16)]: ['事项 C']
};
const clicked = ref('');

const handleClick = ({ value }) => {
	clicked.value = value;
};
</script>

<style scoped>
.calendar-event {
	overflow: hidden;
	line-height: 20px;
	text-overflow: ellipsis;
	white-space: nowrap;
}
</style>
```
:::

### 周起始日与相邻整周

`firstDayOfWeek` 使用 `1` 至 `7` 表示周一至周日，默认 `7`（周日）；未传时读取全局 `VcInstance.options.Calendar.firstDayOfWeek`，见[全局配置](../vc/README.md)。`showAdjacentWeeks` 控制首尾整周都不属于当前月份时是否保留。

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
	<Calendar
		:first-day-of-week="1"
		:show-adjacent-weeks="[false, false]"
	/>
</template>

<script setup>
import { Calendar } from '@deot/vc';
</script>
```
:::

### 移动端

`MCalendar` 与 `Calendar` 结构相同，根节点另有标记类 `.vcm-calendar`。差异如下：

- 尺寸按 750 稿书写，随 `--vc-rem` 缩放：
  - 不画格线；
  - 数字居中，日期圆 64；
  - 农历在数字下方；
  - 行高 120；
  - 年视图一行 3 个月。
- 在日期区域左右滑动可以翻页，纵向滑动交给页面滚动。
- 「今天」按钮使用 `MButton`；触屏上没有悬停态，区间选择没有悬停预览。

:::playground
<!--
<config lang="json5">
{ viewport: 375 }
</config>
-->
```vue
<template>
	<MCalendar v-model="value" type="daterange" lunar />
</template>

<script setup>
import { ref } from 'vue';
import { MCalendar } from '@deot/vc';

const value = ref([]);
</script>
```
:::

### 移动端日期选择

`MCalendarPicker` 在底部弹层的纵向多月列表里选择日期、区间或多个日期，适合跨月选择区间。它的触发区是 `MListItem`，可以直接放进 `MForm`。只选年月日、想用滚轮更紧凑时，请用 [MDatePicker](../date-picker/README.md)。

列表与弹层：

- 列表包含 `yearRange` 内的全部月份，默认 1900–2100，始终虚拟化。
- 打开时定位到值所在的月份，没有值时定位到本月；顶部的月份标题随滚动切换。
- 日期格与 MCalendar 相同，上方一行显示「开始」「结束」「今天」。
- 弹层内容高 `70vh`，可以用 `--vc-calendar-picker-height` 调整。

确认方式：

- `confirm` 默认 `'bottom'`，在底部放「确定」按钮。
- `confirm: false` 时不显示按钮：
  - 单选点一下即提交并关闭；
  - 区间选完终点后提交并关闭；
  - 多选每次点选都提交，弹层保持打开。

:::playground
<!--
<config lang="json5">
{ viewport: 375 }
</config>
-->
```vue
<template>
	<MCalendarPicker v-model="date" label="日期" />
	<MCalendarPicker v-model="range" label="区间" type="daterange" lunar />
	<MCalendarPicker v-model="price" label="价格" type="daterange" :confirm="false" :disabled-date="disabledDate">
		<template #content="{ date: day, disabled }">
			<span v-if="!disabled" class="price">¥{{ 100 + (day.getDate() % 5) * 20 }}</span>
		</template>
	</MCalendarPicker>
</template>

<script setup>
import { ref } from 'vue';
import { MCalendarPicker } from '@deot/vc';

const date = ref('');
const range = ref([]);
const price = ref([]);
const now = new Date();
// 今天以前不可选
const disabledDate = day => day < new Date(now.getFullYear(), now.getMonth(), now.getDate());
</script>

<style scoped>
.price {
	font-size: calc(var(--vc-rem) * 18);
	color: var(--vc-color-error);
}
</style>
```
:::

### 直接打开与单独使用列表

`MCalendarPicker.open(options)` 接受与组件相同的属性（`value` 可代替 `modelValue`），插槽通过 `slots` 传入。返回的实例可以 `await`：确定后得到 `{ value }`，取消或关闭时拒绝。

弹层里的列表是 `MCalendarPickerView`（也可以写成 `MCalendarPicker.View`），可以单独放进页面或自定义弹层。它的高度由 `--vc-calendar-picker-height` 决定。

:::playground
<!--
<config lang="json5">
{ viewport: 375 }
</config>
-->
```vue
<template>
	<MButton @click="handleOpen">选择区间</MButton>
	<p>{{ text }}</p>
	<MCalendarPickerView v-model="range" type="daterange" style="--vc-calendar-picker-height: 360px;" />
	<p>{{ range }}</p>
</template>

<script setup>
import { ref } from 'vue';
import { MButton, MCalendarPicker, MCalendarPickerView } from '@deot/vc';

const text = ref('');
const range = ref([]);

const handleOpen = async () => {
	try {
		const { value } = await MCalendarPicker.open({ type: 'daterange' });
		text.value = value.join(' ~ ');
	} catch {
		text.value = '已取消';
	}
};
</script>
```
:::

## 主题与局部覆盖

全局参数通过 `--vc-<参数>` 配置，组件级覆盖使用 `--vc-calendar-<参数>`。局部参数仅提供组件级入口；可在组件根节点或其祖先上设置。

### 全局

| 参数 | 使用位置 |
| --- | --- |
| color-contrast-light | 选中日期的文字 |
| color-dark-extralight | 星期 |
| color-neutral-light | 格线、箭头悬停背景 |
| color-primary | 选中日期背景、今天描边、节日与节气文字 |
| background-color-light | 箭头背景、禁用日期背景 |
| background-color-lighter | 日期悬停背景 |
| background-color-lightest | 组件背景 |
| background-color-primary-light | 区间背景 |
| foreground-color | 标题、当月日期、内容区文字 |
| foreground-color-light | 箭头图标、农历文字 |
| foreground-color-inactive | 其他月份与禁用日期的文字 |

### 局部

尺寸写成局部变量 `--vc-calendar-<键>`。`MCalendar` 在 `.vcm-calendar` 上覆盖为 750 稿长度，表中为 `calc(var(--vc-rem) * n)` 的 `n`。

| 键 | 说明 | `Calendar` | `MCalendar` |
| --- | --- | --- | --- |
| border-width | 外框、星期与行的分隔线宽 | `1px` | `0` |
| header-padding / header-gap | 头部内边距 / 间距 | `24px` / `12px` | `24 32` / `16` |
| title-font-size / title-line-height | 标题 | `20px` / `28px` | `32` / `44` |
| arrow-size / arrow-font-size | 翻页箭头 | `28px` / `12px` | `56` / `24` |
| week-padding / week-font-size / week-align | 星期 | `20px 16px` / `14px` / `left` | `16 0` / `24` / `center` |
| row-height | 日期行高 | `100px` | `120` |
| cell-padding / cell-align / cell-divider | 格子内边距 / 对齐 / 竖线宽 | `10px` / `flex-start` / `1px` | `8 0` / `center` / `0` |
| date-direction / date-gap | 数字与农历的排列 / 间距 | `row` / `8px` | `column` / `0` |
| day-size / day-font-size | 日期圆 | `28px` / `16px` | `64` / `32` |
| lunar-font-size / lunar-line-height | 农历文字 | `12px` / `normal` | `20` / `28` |
| mark-height / mark-font-size | 「开始 / 结束 / 今天」标记（MCalendarPicker） | `14px` / `10px` | `28` / `20` |
| content-gap / content-font-size | 内容区上间距 / 字号 | `4px` / `12px` | `4` / `20` |
| year-columns / year-padding / year-gap / year-item-padding | 年视图 | `4` / `12px` / `0` / `20px 8px` | `3` / `16` / `24 8` / `8` |
| month-title-padding / month-title-font-size | 年视图的月份标题 | `10px 6px` / `16px` | `8` / `28` |
| mini-week-padding / mini-week-font-size | 迷你月的星期 | `6px 0` / `12px` | `4 0` / `16` |
| mini-row-height / mini-day-size / mini-day-font-size | 迷你月的日期 | `26px` / `22px` / `14px` | `36` / `32` / `18` |
| slide-offset | 翻页过渡的位移 | `24px` | `48` |

## API

### Calendar 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| modelValue | 选中的值：`date` 为按 `format` 格式化的字符串；`daterange` 为 `[起, 止]`；`multiple` 为数组；也接受 `Date` | `string \| Date \| Array<string \| Date>` | - | - |
| type | 选择方式 | `string` | `date` \| `daterange` | `date` |
| multiple | 多选，只在 `type="date"` 时生效 | `boolean` | - | `false` |
| format | 值的格式 | `string` | - | `YYYY-MM-DD` |
| nullValue | 单选没有值时的值 | `string \| number \| object` | - | `''` |
| disabledDate | 按天判断是否禁用 | `(date: Date) => boolean` | - | - |
| yearRange | `[起年, 止年]`；范围外的日期禁用，翻页到边界停住 | `number[]` | - | `[1900, 2100]` |
| readonly | 纯展示：不可选中，点击仍发出 `date-click` | `boolean` | - | `false` |
| panelDate | 当前显示的月份，支持 `v-model:panelDate`；缺省为值所在的月份或本月 | `Date` | - | - |
| mode | 视图，支持 `v-model:mode` | `string` | `month` \| `year` | `month` |
| lunar | 在数字旁显示节日、节气或农历日（仅 `zh-CN`） | `boolean` | - | `false` |
| firstDayOfWeek | 每周第一天；`1` 至 `7` 分别表示周一至周日。未传时读取全局 `Calendar.firstDayOfWeek`，仍缺省为 `7` | `number` | `1`-`7` | `7` |
| showAdjacentWeeks | 是否展示首尾整周；数组依次控制首部和尾部 | `boolean \| [boolean, boolean]` | - | `[false, true]` |

### Calendar 事件

| 事件名 | 说明 | 回调参数 |
| --- | --- | --- |
| update:modelValue / change | 选中了日期；区间在选完终点时发出 | `(value)` |
| date-click | 点击了未禁用的日期（只读时也会发出） | `({ date: Date, value: string })`，`value` 按 `format` 格式化 |
| update:panelDate | 显示的月份变化 | `(date: Date)`，为该月 1 日 |
| update:mode | 视图变化 | `('month' \| 'year')` |

### Calendar 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| header | 替换头部 | `{ year, month, mode, title, previous, next, today, setMode }` |
| week | 替换星期行 | `{ weekdays }` |
| content | 日期数字下方的内容区 | `CalendarCell` |
| cell | 替换整个日期格子 | `CalendarCell` |

`CalendarCell` 的字段：

| 字段 | 说明 |
| --- | --- |
| `date` | 当天 0 点的 `Date` |
| `value` | `YYYY-MM-DD` |
| `day` | 几号 |
| `type` | `previous`、`current` 或 `next`，相对当前月份 |
| `today` / `selected` / `disabled` | 状态 |
| `start` / `end` / `inRange` | 区间状态 |
| `holiday` | 农历、节气与节日，读取时才计算 |

`holiday` 始终包含 `holiday` 和 `festivals`。仅当当前 `locale.name === 'zh-CN'` 且日期在 1900–2100 年内时，才会附带其余字段，否则返回空结果：

- 农历数字：`lunarYear`、`lunarMonth`、`lunarDate`；
- 农历文字：`lunarMonthText`、`lunarDateText`；
- 生肖 `animal`；
- 干支：`ganzhiYear`、`ganzhiMonth`、`ganzhiDate`；
- 节气 `solarTerm`；
- 其他：`isBigMonth`、`originalDate`、`weekDay`、`chineseWeekDay`。

`festivals` 每项包含 `type`、`description` 和 `value`。

### Calendar 方法

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| previous | 月视图切到上一个月，年视图切到上一年 | - | `void` |
| next | 月视图切到下一个月，年视图切到下一年 | - | `void` |

### MCalendarPicker 属性

除下表外，与 Calendar 相同的属性有：`modelValue`、`type`、`multiple`、`format`、`nullValue`、`disabledDate`、`yearRange`、`firstDayOfWeek`、`lunar`。

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| confirm | 「确定」的位置，同 MPickerPopup；`false` 时选完即提交 | `boolean \| string` | `top` \| `bottom` \| `true` \| `false` | `bottom` |
| title | 弹层标题 | `string` | - | `选择日期` |
| cancelText / okText | 按钮文字 | `string` | - | `取消` / `确定` |
| label / labelWidth / arrow | 触发区 MListItem 的属性 | - | - | - |
| extra | 没有值时显示的文字 | `string` | - | `请选择` |
| separator | 区间起止之间的分隔符（显示文字） | `string` | - | `' - '` |
| formatter | 自定义显示文字；返回空值时使用默认文字 | `(value) => any` | - | - |

### MCalendarPicker 事件

| 事件名 | 说明 | 回调参数 |
| --- | --- | --- |
| update:modelValue / change | 提交了值（确定时；不需要确认时选完即提交），同时通知所在的表单项 | `(value)` |
| ok | 点击「确定」，或不需要确认时选完 | `(value)` |
| cancel | 取消 | - |
| close | 弹层关闭动画结束 | - |
| visible-change | 弹层显示状态变化 | `(visible: boolean)` |
| date-click | 点击了未禁用的日期 | `({ date, value })` |

### MCalendarPicker 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 替换触发区 | `{ label, value }` |
| content | 日期下方的内容 | `CalendarCell` |
| cell | 替换整个日期格子 | `CalendarCell` |

### MCalendarPicker 方法

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| MCalendarPicker.open | 直接打开弹层；确定后兑现 `{ value }`，取消时拒绝 | `options` | Portal 实例（可 `await`） |

### MCalendarPickerView

- **属性**：与 Calendar 的 `modelValue`、`type`、`multiple`、`format`、`nullValue`、`disabledDate`、`yearRange`、`firstDayOfWeek`、`lunar` 相同。
- **插槽**：`content`、`cell`。
- **事件**：
  - `update:modelValue` / `change`：区间选完终点时发出，多选每次点选都发出；
  - `date-click`。
- **方法**：`scrollToDate(date)`，滚动到日期所在的月份。
