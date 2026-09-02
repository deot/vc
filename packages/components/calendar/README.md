## 日历（Calendar）

按月展示日期网格，并支持自定义月份、星期和日期单元。`MCalendar` 是 `Calendar` 的移动端入口别名，两者使用相同的属性、插槽和方法。

### 何时使用

- 展示日程、课表、价格日历等按日期组织的数据。
- 需要控制每周起始日、相邻月份整周或自定义日期内容。
- 在简体中文环境下展示农历、节气或节日信息。

### 基础用法

通过组件实例的 `prev()` 和 `next()` 切换月份。

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
		<div class="calendar-demo__tools">
			<Button @click="calendar?.prev()">上个月</Button>
			<Button @click="calendar?.next()">下个月</Button>
		</div>
		<Calendar ref="calendar" />
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, Calendar } from '@deot/vc';

const calendar = ref();
</script>

<style scoped>
.calendar-demo__tools {
	display: flex;
	gap: 8px;
	margin-bottom: 12px;
}
</style>
```
:::

### 切换语言

月份和星期使用全局 locale。调用 `VcInstance.configure({ locale })` 后，已经渲染的 Calendar 会响应式更新。以下示例内联 Calendar 所需的最小 locale 数据。

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
		<Button class="calendar-demo__locale" @click="toggleLocale">
			切换到{{ locale.name === 'zh-CN' ? '英文' : '中文' }}
		</Button>
		<Calendar />
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, Calendar, VcInstance } from '@deot/vc';

const createLocale = (name, months, weekdays) => ({
	name,
	vc: {
		Calendar: {
			months: Object.fromEntries(
				'january february march april may june july august september october november december'
					.split(' ')
					.map((key, index) => [key, months[index]])
			),
			weekdays: Object.fromEntries(
				'sunday monday tuesday wednesday thursday friday saturday'
					.split(' ')
					.map((key, index) => [key, weekdays[index]])
			)
		}
	}
});

const locales = [
	createLocale(
		'zh-CN',
		['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
		['日', '一', '二', '三', '四', '五', '六']
	),
	createLocale(
		'en-US',
		['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
		['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
	)
];
const locale = ref(locales[0]);

const toggleLocale = () => {
	locale.value = locale.value.name === 'zh-CN' ? locales[1] : locales[0];
	VcInstance.configure({ locale: locale.value });
};

</script>

<style scoped>
.calendar-demo__locale {
	margin-bottom: 12px;
}
</style>
```
:::

### 展示中文节日

默认日期单元只展示日期数字。通过 `default` 插槽读取 `holiday`，可以在 `zh-CN` 下展示农历节日和节气。

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
	<Calendar>
		<template #default="{ cell, today, holiday }">
			<span
				class="calendar-date"
				:class="{ 'is-today': cell.value === today }"
			>
				{{ cell.date }}
				<small v-if="holiday.holiday">
					{{ holiday.holiday }}
				</small>
			</span>
		</template>
	</Calendar>
</template>

<script setup>
import { Calendar } from '@deot/vc';
</script>

<style scoped>
.calendar-date {
	display: inline-flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	width: 48px;
	height: 48px;
	border-radius: 24px;
}

.calendar-date.is-today {
	color: var(--vc-calendar-color-light, var(--vc-color-light));
	background: var(--vc-calendar-color-primary, var(--vc-color-primary));
}

.calendar-date small {
	max-width: 44px;
	overflow: hidden;
	font-size: 10px;
	line-height: 1.2;
	text-overflow: ellipsis;
	white-space: nowrap;
}
</style>
```
:::

### 周起始日与相邻整周

`firstDayOfWeek` 使用 `1` 至 `7` 表示周一至周日。`showAdjacentWeeks` 控制首尾整周都不属于当前月份时是否保留。

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
		:first-day-of-week="7"
		:show-adjacent-weeks="[false, false]"
	/>
</template>

<script setup>
import { Calendar } from '@deot/vc';
</script>
```
:::

## API

### Calendar 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| renderDate | 渲染日期单元 | `({ cell, today, holiday }) => VNodeChild` | - | 内置日期渲染 |
| renderMonth | 渲染月份标题 | `({ data, month, year, lang }) => VNodeChild` | - | 内置月份渲染 |
| renderWeek | 渲染星期标题 | `({ data, date, lang, firstDayOfWeek }) => VNodeChild` | - | 内置星期渲染 |
| firstDayOfWeek | 每周第一天；`1` 至 `7` 分别表示周一至周日 | `number` | `1`-`7` | `1` |
| showAdjacentWeeks | 是否展示首尾整周；数组依次控制首部和尾部 | `boolean \| [boolean, boolean]` | - | `[false, true]` |

### Calendar 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 自定义日期单元 | `{ cell, today, holiday }` |
| month | 自定义月份标题 | `{ data, month, year, lang }` |
| week | 自定义星期标题 | `{ data, date, lang, firstDayOfWeek }` |

- `cell` 包含 `date`、`value` 和 `type`；`value` 为 `YYYY-MM-DD`，`type` 为 `prev`、`current` 或 `next`。
- 月份 `data` 为 `{ month: string, year: number }`；`month` 为从 `0` 开始的月份索引。
- 星期 `data` 和 `date` 是相同的七项翻译结果；`lang` 为当前 `locale.name`。
- `holiday` 始终包含 `holiday` 和 `festivals`。仅当当前 `locale.name === 'zh-CN'` 且日期在 1900–2100 年内时，才会附带农历、生肖、干支、节气等详细字段；其他情况返回空结果。

### Calendar 方法

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| prev | 切换到上一个月 | - | `void` |
| next | 切换到下一个月 | - | `void` |
