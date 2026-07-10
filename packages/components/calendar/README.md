## 功能（Calendar）

日历展示

### 何时使用

当数据是日期或按照日期划分时，例如日程、课表、价格日历等，农历等。

### 基础用法

包括使用切换前后日期

:::RUNTIME
```vue
<template>
	<div class="v-calendar-basic">
		<Button @click="$refs.target.prev()">上个月</Button>
		<Button @click="$refs.target.next()">下个月</Button>
		<Calendar
			ref="target"
		/>
	</div>
</template>
<script setup>
import { Calendar, Button } from '@deot/vc';
</script>
<style>
.v-calendar-basic > * {
	margin-bottom: 10px;
}
</style>
```
:::

### 自定义日历
使用插槽自定义日历

:::RUNTIME
```vue
<template>
	<div style="display: flex; justify-content: space-around">
		<div @click="$refs.calendar.prev()">
			上月
		</div>
		<!-- 可以自定义插槽，不传会使用默认内容 -->
		<Calendar
			ref="calendar"
			lang="en"
		>
			<template #month="{ year, month, monthNames }">
				<div style="display:flex; justify-content:center">
					{{ year }}--{{ monthNames[month].en }}
				</div>
			</template>
			<template #week="{ weekNames }">
				<div style="display:flex; justify-content: space-around">
					<span
						v-for="(item, index) in weekNames"
						:key="index"
					>
						{{ item.en }}
					</span>
				</div>
			</template>
			<template #default="{ cell, today }">
				<span :style="cell.value === today ? 'background: gray;' : ''">
					{{ cell.date }}号
				</span>
			</template>
		</Calendar>
		<div @click="$refs.calendar.next()">
			下月
		</div>
	</div>
</template>
<script setup>
import { Calendar } from '@deot/vc';
</script>
<style lang="scss">
@import '../../style/helper.scss';
.v-month-header {
	@include commonFlexCc();
	line-height: 60px;
	font-size: 24px;
	background-color: #f5f6f7;
	color: #2e3136;
}
.v-week-header {
	@include commonFlex();
	width: 100%;
	align-items: center;
	color: gray;
	padding: 15px 0;
	font-size: 16px;
	> span {
		width: 14.28%;
		text-align: center;
	}
}
</style>
```
:::

### 设定语言

使用`lang`设置日历语言（默认：'ch'）

:::RUNTIME
```vue
<template>
	<div class="v-calendar-basic">
		<Button @click="$refs.target.prev()">上个月</Button>
		<Button @click="$refs.target.next()">下个月</Button>
		<Button @click="handleChangeLang">切换语言</Button>
		<Calendar
			ref="target"
			:lang="lang"
		/>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Calendar, Button } from '@deot/vc';

const lang = ref('ch');
const handleChangeLang = () => {
	lang.value = lang.value == 'ch' ? 'en' : 'ch';
};
</script>
<style>
.v-calendar-basic > *{
	margin-bottom: 10px;
}
</style>
```
:::

### 设定周起始日

使用`first-day-of-week`设置每周第一天（默认：1，即周一第一列、周日最后一列；1-6 对应 `Date.prototype.getDay()` 的周一至周六，7 表示周日）

:::RUNTIME
```vue
<template>
	<Calendar :first-day-of-week="7" />
</template>

<script setup>
import { Calendar } from '@deot/vc';
</script>
```
:::

### 显示相邻月份整周

使用`show-adjacent-weeks`控制首尾整周都不是本月时是否展示（默认：`[false, true]`，`true` 表示展示）

:::RUNTIME
```vue
<template>
	<Calendar :show-adjacent-weeks="[false, false]" />
</template>

<script setup>
import { Calendar } from '@deot/vc';
</script>
```
:::

## API

### 基础属性

| 属性           | 说明     | 类型                                                | 可选值       | 默认值                  |
| ------------ | ------ | ------------------------------------------------- | --------- | -------------------- |
| render-date  | 渲染每个日期 | `({ cell, today }) => Component`                  | -         | `defaultRenderDate`  |
| render-month | 渲染月    | `({ month, year, lang, monthNames }) => Component` | -         | `defaultRenderMonth` |
| render-week  | 渲染周    | `({ weekNames, lang, firstDayOfWeek }) => Component` | -         | `defaultRenderWeek`  |
| lang         | 语言     | `string`                                          | `ch`、`en` | `ch`                 |
| first-day-of-week | 每周第一天，`1`-`6` 对应周一至周六，`7` 表示周日 | `number` | `1`-`7` | `1` |
| show-adjacent-weeks | 首尾整周都不是本月时是否展示；`boolean` 同时控制首尾，数组为 `[首部, 尾部]` | `boolean \| boolean[]` | - | `[false, true]` |
