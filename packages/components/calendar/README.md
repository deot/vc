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
使用`render-date`、`render-month`、`render-week`自定义日历

:::RUNTIME
```vue
<template>
	<div style="display: flex; justify-content: space-around">
		<div @click="$refs.calendar.prev()">
			上月
		</div>
		<!-- 可以自定义渲染函数，不传会使用默认的渲染函数 -->
		<Calendar
			ref="calendar"
			:render-date="renderDate"
			:render-month="renderMonth"
			:render-week="renderWeek"
			lang="en"
		/>
		<div @click="$refs.calendar.next()">
			下月
		</div>
	</div>
</template>
<script setup lang="jsx">
import { Calendar } from '@deot/vc';

const renderDate = ({ date, curDateStr }) => {
	return (
		<span style={date.date === curDateStr ? 'background: gray;' : ''}>
			{date.day}
			号
		</span>
	);
};

const renderMonth = ({ year, month, monthNames }) => {
	return (
		<div style="display:flex; justify-content:center">
			{year + '--' + monthNames[month].en}
		</div>
	);
};

const renderWeek = ({ weekNames, lan }) => {
	return (
		<div style="display:flex; justify-content: space-around">
			{
				weekNames.map((item, index) => {
					return (
						<span key={index}>
							{item.en}
						</span>
					);
				})
			}
		</div>
	);
};

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

## API

### 基础属性

| 属性           | 说明     | 类型                                                | 可选值       | 默认值                  |
| ------------ | ------ | ------------------------------------------------- | --------- | -------------------- |
| ------------ | ------ | ---------------------------------------           | --------- | -------------------- |
| render-date  | 渲染每个日期 | `({ date, curDateStr }) => Component`             | -         | `renderDefaultDate`  |
| render-month | 渲染月    | `({ month, year, lan, monthNames }) => Component` | -         | `renderDefaultMonth` |
| render-week  | 渲染周    | `({ weekNames, lan }) => Component`               | -         | `renderDefaultWeek`  |
| lang         | 语言     | `string`                                          | `ch`、`en` | `ch`                 |



