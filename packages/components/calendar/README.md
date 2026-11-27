## 日历（Calendar）

按月展示日期网格，可选中日期、区间或多个日期，也可以切换到年视图。`MCalendar` 是移动端版本，属性、事件和插槽相同，差异见[移动端](#移动端)。在移动端弹层里选择日期请用 `MCalendarPicker`，见[移动端日期选择](#移动端日期选择)。

### 何时使用

- 展示日程、课表、价格日历等按日期组织的数据。
- 在页面上直接选择日期、区间或多个日期。
- 在简体中文环境下展示农历、节气或节日。

### 基础用法

头部自带翻页箭头和「今天」按钮；点击标题在月视图和年视图之间切换，年视图里点击某个月回到该月。点中日期后发出 `update:modelValue` 与 `change`，值按 `format` 格式化。

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
	<div class="calendar-demo">
		<Calendar v-model="value" format="YYYY/MM/DD" @change="handleChange" />
		<p class="calendar-demo__result">值：{{ value || '-' }}；change 触发 {{ count }} 次</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Calendar } from '@deot/vc';

const value = ref('');
const count = ref(0);

const handleChange = () => {
	count.value++;
};
</script>

<style scoped>
.calendar-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.calendar-demo__result {
	margin: 0;
}
</style>
```
:::

### 区间与多选

`type="daterange"` 时，第一次点选起点、第二次点选终点（早于起点时自动交换），选完后提交 `[起, 止]`；选择中鼠标悬停会预览区间。`multiple` 时再次点选会取消该日期，只在 `type="date"` 时生效。值的格式与 DatePicker 相同。`disabledDate` 按天禁用日期。

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
	<div class="calendar-demo">
		<Calendar v-model="range" type="daterange" :disabled-date="disabledDate" />
		<p class="calendar-demo__result">区间：{{ range }}</p>
		<Calendar v-model="dates" multiple />
		<p class="calendar-demo__result">多选：{{ dates }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Calendar } from '@deot/vc';

const range = ref([]);
const dates = ref([]);
// 周末不可选
const disabledDate = date => date.getDay() === 0 || date.getDay() === 6;
</script>

<style scoped>
.calendar-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.calendar-demo__result {
	margin: 0;
}
</style>
```
:::

### 日期内容与农历

`content` 插槽显示在日期数字下方，适合放日程、价格等内容，放不下时在格子内滚动（`Scroller`，移动端为 `MScroller`）；`cell` 插槽替换整个格子，见下方「自定义头部、星期与格子」。`lunar` 在 `zh-CN` 下于数字旁显示一行文字，优先级为节日 > 节气 > 农历日，农历初一显示月名。`readonly` 用于纯展示：不可选中，点击仍发出 `date-click`。

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
	<div class="calendar-demo">
		<Calendar lunar readonly @date-click="handleClick">
			<template #content="{ value }">
				<div v-for="item in events[value]" :key="item" class="calendar-demo__event">{{ item }}</div>
			</template>
		</Calendar>
		<p class="calendar-demo__result">点击：{{ clicked || '-' }}</p>
	</div>
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
.calendar-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.calendar-demo__event {
	overflow: hidden;
	line-height: 20px;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.calendar-demo__result {
	margin: 0;
}
</style>
```
:::

### 周起始日与相邻整周

`firstDayOfWeek` 使用 `1` 至 `7` 表示周一至周日，默认 `7`（周日）；未传时读取全局 `VcInstance.options.Calendar.firstDayOfWeek`，见[全局配置](../vc/README.md)。`showAdjacentWeeks` 控制首尾整周都不属于当前月份时是否保留。实例方法 `previous`、`next` 在外部翻页。

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
	<div class="calendar-demo">
		<div class="calendar-demo__row">
			<Button size="small" @click="handlePrevious">previous()</Button>
			<Button size="small" @click="handleNext">next()</Button>
		</div>
		<Calendar
			ref="calendar"
			:first-day-of-week="1"
			:show-adjacent-weeks="[false, false]"
		/>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, Calendar } from '@deot/vc';

const calendar = ref();

const handlePrevious = () => {
	calendar.value.previous();
};

const handleNext = () => {
	calendar.value.next();
};
</script>

<style scoped>
.calendar-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.calendar-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}
</style>
```
:::

### 自定义头部、星期与格子

`header` 插槽替换头部，参数提供 `title`、`mode` 以及 `previous`、`next`、`today`、`setMode`；`week` 插槽替换星期行；`cell` 插槽替换整个日期格子。`v-model:panelDate` 与 `v-model:mode` 同步当前月份与视图；`yearRange` 限定可选年份，范围外的日期禁用，翻页到边界停住。

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
	<div class="calendar-demo">
		<Calendar v-model="value" v-model:panel-date="panelDate" v-model:mode="mode" :year-range="[2020, 2030]">
			<template #header="{ title, previous, next, today, setMode }">
				<div class="calendar-demo__row">
					<Button size="small" icon="arrow-left" aria-label="上一页" @click="previous" />
					<strong>{{ title }}</strong>
					<Button size="small" icon="arrow-right" aria-label="下一页" @click="next" />
					<Button size="small" @click="today">今天</Button>
					<Button size="small" @click="setMode(mode === 'month' ? 'year' : 'month')">切换视图</Button>
				</div>
			</template>
			<template #week="{ weekdays }">
				<div class="calendar-demo__week">
					<span v-for="item in weekdays" :key="item">{{ item }}</span>
				</div>
			</template>
			<template #cell="{ day, selected, today: isToday, type }">
				<div
					class="calendar-demo__cell"
					:class="{ 'is-selected': selected, 'is-today': isToday, 'is-muted': type !== 'current' }"
				>
					{{ day }}
				</div>
			</template>
		</Calendar>
		<p class="calendar-demo__result">panelDate：{{ panelText }}；mode：{{ mode }}；值：{{ value || '-' }}</p>
	</div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { Button, Calendar } from '@deot/vc';

const value = ref('');
const panelDate = ref(new Date());
const mode = ref('month');
const panelText = computed(() => `${panelDate.value.getFullYear()}-${panelDate.value.getMonth() + 1}`);
</script>

<style scoped>
.calendar-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.calendar-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}

.calendar-demo__week {
	display: grid;
	grid-template-columns: repeat(7, 1fr);
	text-align: center;
	color: var(--vc-color-dark-extralight);
}

.calendar-demo__cell {
	height: 40px;
	line-height: 40px;
	text-align: center;
	border-radius: 4px;
}

.calendar-demo__cell.is-today {
	font-weight: 600;
	color: var(--vc-color-primary);
}

.calendar-demo__cell.is-selected {
	color: #fff;
	background: var(--vc-color-primary);
}

.calendar-demo__cell.is-muted {
	opacity: .4;
}

.calendar-demo__result {
	margin: 0;
}
</style>
```
:::

## 移动端

`MCalendar` 与 `Calendar` 的属性、事件、插槽、结构相同，根节点另有标记类 `.vcm-calendar`。差异如下：

- 尺寸按 750 稿书写，写为 `calc(var(--vc-rem) * n)`，随 `--vc-rem` 缩放：
  - 不画格线；
  - 数字居中，日期圆 64；
  - 农历在数字下方；
  - 行高 120；
  - 年视图一行 3 个月。
- 在日期区域左右滑动可以翻页，纵向滑动交给页面滚动。
- 「今天」按钮使用 `MButton`；触屏上没有悬停态，区间选择没有悬停预览。

下例可切换单选、区间、多选与农历，`content` 插槽在有事项的日期下方画一个圆点；底栏切换 `rem` 可查看不同屏宽下的效果。

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
	<div class="m-calendar-demo">
		<div class="m-calendar-demo__row">
			<MButton size="small" @click="handleKind">{{ LABELS[kind] }}</MButton>
			<MButton size="small" @click="handleLunar">农历：{{ isLunar ? '开' : '关' }}</MButton>
		</div>
		<MCalendar
			:key="kind"
			v-model="value"
			:type="kind === 'daterange' ? 'daterange' : 'date'"
			:multiple="kind === 'multiple'"
			:lunar="isLunar"
		>
			<template #content="{ value: day }">
				<span v-if="dots[day]" class="m-calendar-demo__dot" />
			</template>
		</MCalendar>
		<p class="m-calendar-demo__result">值：{{ value }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MButton, MCalendar } from '@deot/vc';

const KINDS = ['date', 'daterange', 'multiple'];
const LABELS = { date: '单选', daterange: '区间', multiple: '多选' };
const kind = ref('date');
const value = ref('');
const isLunar = ref(true);

const now = new Date();
const toKey = (offset) => {
	const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
const dots = { [toKey(1)]: true, [toKey(3)]: true, [toKey(8)]: true };

const handleKind = () => {
	kind.value = KINDS[(KINDS.indexOf(kind.value) + 1) % KINDS.length];
	value.value = kind.value === 'date' ? '' : [];
};

const handleLunar = () => {
	isLunar.value = !isLunar.value;
};
</script>

<style scoped>
.m-calendar-demo {
	display: flex;
	flex-direction: column;
	gap: calc(var(--vc-rem) * 16);
}

.m-calendar-demo__row {
	display: flex;
	flex-wrap: wrap;
	gap: calc(var(--vc-rem) * 16);
	padding-inline: calc(var(--vc-rem) * 32);
}

.m-calendar-demo__dot {
	display: inline-block;
	width: calc(var(--vc-rem) * 8);
	height: calc(var(--vc-rem) * 8);
	background: var(--vc-color-primary);
	border-radius: 50%;
}

.m-calendar-demo__result {
	padding-inline: calc(var(--vc-rem) * 32);
	margin: 0;
	font-size: calc(var(--vc-rem) * 24);
	word-break: break-all;
}
</style>
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

- `confirm` 默认 `'bottom'`，在底部放「确定」按钮；`'top'` 时放在标题栏右侧。
- `confirm: false` 时不显示按钮：
  - 单选点一下即提交并关闭；
  - 区间选完终点后提交并关闭；
  - 多选每次点选都提交，弹层保持打开。

下例中，`label`、`labelWidth`、`arrow` 传给触发区，`extra` 为没有值时的文字，`separator`、`formatter` 控制显示文字；`title`、`okText`、`cancelText` 设置弹层文字；默认插槽可替换触发区。弹层的 `ok`、`cancel`、`visible-change`、`close`、`date-click` 写入下方读数。

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
	<div class="m-calendar-demo">
		<MCalendarPicker v-model="date" label="日期" :label-width="160" extra="未选择" />
		<MCalendarPicker
			v-model="range"
			label="区间"
			type="daterange"
			separator=" 至 "
			title="选择区间"
			confirm="top"
			ok-text="完成"
			cancel-text="关闭"
			lunar
			@ok="handleEvent('ok')"
			@cancel="handleEvent('cancel')"
			@visible-change="handleVisible"
			@close="handleEvent('close')"
		/>
		<MCalendarPicker v-model="dates" label="多选" multiple :formatter="formatter" />
		<MCalendarPicker
			v-model="limited"
			label="即选即提交"
			type="daterange"
			:confirm="false"
			:arrow="false"
			:disabled-date="disabledDate"
			@date-click="handleDateClick"
		>
			<template #content="{ date: day, disabled }">
				<span v-if="!disabled" class="m-calendar-demo__mark">余 {{ day.getDate() % 5 }}</span>
			</template>
		</MCalendarPicker>
		<MCalendarPicker v-model="custom">
			<template #default="{ label }">
				<div class="m-calendar-demo__trigger">自定义触发区：{{ label }}</div>
			</template>
		</MCalendarPicker>
		<p class="m-calendar-demo__result">事件：{{ log.join('、') || '-' }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MCalendarPicker } from '@deot/vc';

const date = ref('');
const range = ref([]);
const dates = ref([]);
const limited = ref([]);
const custom = ref('');
const log = ref([]);
const now = new Date();
// 今天以前不可选
const disabledDate = day => day < new Date(now.getFullYear(), now.getMonth(), now.getDate());
const formatter = value => (value && value.length ? `已选 ${value.length} 天` : '');

const handleEvent = (name) => {
	log.value = [...log.value.slice(-4), name];
};

const handleVisible = (visible) => {
	handleEvent(`visible-change:${visible}`);
};

const handleDateClick = ({ value }) => {
	handleEvent(`date-click:${value}`);
};
</script>

<style scoped>
.m-calendar-demo {
	display: flex;
	flex-direction: column;
}

.m-calendar-demo__mark {
	font-size: calc(var(--vc-rem) * 18);
	color: var(--vc-color-error);
}

.m-calendar-demo__trigger {
	padding: calc(var(--vc-rem) * 24) calc(var(--vc-rem) * 32);
	font-size: calc(var(--vc-rem) * 28);
	color: var(--vc-color-primary);
}

.m-calendar-demo__result {
	padding: calc(var(--vc-rem) * 32) calc(var(--vc-rem) * 32) 0;
	margin: 0;
	font-size: calc(var(--vc-rem) * 24);
	word-break: break-all;
}
</style>
```
:::

### 直接打开与单独使用列表

`MCalendarPicker.open(options)` 接受与组件相同的属性（`value` 可代替 `modelValue`），插槽通过 `slots` 传入。返回的实例可以 `await`：确定后得到 `{ value }`，取消或关闭时拒绝。

弹层里的列表是 `MCalendarPickerView`（也可以写成 `MCalendarPicker.View`），可以单独放进页面或自定义弹层。它的高度由 `--vc-calendar-picker-height` 决定；`scrollToDate(date)` 滚动到日期所在的月份。

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
	<div class="m-calendar-demo">
		<div class="m-calendar-demo__row">
			<MButton size="small" @click="handleOpen">选择区间</MButton>
			<MButton size="small" @click="handleToday">列表回到本月</MButton>
		</div>
		<p class="m-calendar-demo__result">open：{{ text || '-' }}</p>
		<MCalendarPickerView ref="view" v-model="range" type="daterange" class="m-calendar-demo__view" />
		<p class="m-calendar-demo__result">列表：{{ range }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MButton, MCalendarPicker, MCalendarPickerView } from '@deot/vc';

const text = ref('');
const range = ref([]);
const view = ref();

const handleOpen = async () => {
	try {
		const { value } = await MCalendarPicker.open({ type: 'daterange' });
		text.value = value.join(' ~ ');
	} catch {
		text.value = '已取消';
	}
};

const handleToday = () => {
	view.value.scrollToDate(new Date());
};
</script>

<style scoped>
.m-calendar-demo {
	display: flex;
	flex-direction: column;
	gap: calc(var(--vc-rem) * 16);
}

.m-calendar-demo__row {
	display: flex;
	flex-wrap: wrap;
	gap: calc(var(--vc-rem) * 16);
	padding-inline: calc(var(--vc-rem) * 32);
}

.m-calendar-demo__view {
	--vc-calendar-picker-height: calc(var(--vc-rem) * 720);
}

.m-calendar-demo__result {
	padding-inline: calc(var(--vc-rem) * 32);
	margin: 0;
	font-size: calc(var(--vc-rem) * 24);
	word-break: break-all;
}
</style>
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
| picker-height | `MCalendarPickerView` 的高度（含 MCalendarPicker 弹层） | - | `70vh` |

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
| title | 弹层标题，取值同 [Customer](../customer/README.md) | `string \| number \| Function \| { type: string; value: any }` | - | `选择日期` |
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
