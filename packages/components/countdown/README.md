## 倒计时（Countdown）

倒计时功能

### 何时使用

显示倒计时，结束时触发事件，多用于秒杀营销活动中。

### 基础用法

通过`targetTime`设置倒计时时间

:::RUNTIME
```vue
<template>
	<div>
		<Countdown
			:target-time="targetTime"
			:server-time="new Date()"
			@change="handleGetTime"
		/>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Countdown } from '@deot/vc';

const now = new Date();
now.setDate(now.getDate() + 2);

const targetTime = ref(now);

const handleGetTime = (value) => {
	console.log(value);
};
</script>
```
:::

### 设置倒计时刷新周期
通过`t`设置倒计时刷新周期

:::RUNTIME
```vue
<template>
	<div>
		<Countdown
			:target-time="targetTime"
			:t="2000"
		/>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Countdown } from '@deot/vc';

const now = new Date();
now.setDate(now.getDate() + 2);

const targetTime = ref(now);
</script>
```
:::

### 自定义渲染倒计时
通过`format`自定义渲染倒计时

:::RUNTIME
```vue
<template>
	<div>
		<Countdown
			:target-time="targetTime"
			format="DD:HH:mm:ss"
		/>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Countdown } from '@deot/vc';

const now = new Date();
now.setDate(now.getDate() + 2);

const targetTime = ref(now);
</script>
```
:::

## API

### 属性

| 属性          | 说明                  | 类型                         | 可选值 | 默认值                |
| ----------- | ------------------- | -------------------------- | --- | ------------------ |
| t           | 刷新周期，单位毫秒           | `number`                   | -   | 1000               |
| render      | 自定义渲染               | `function`                 | -   | -                  |
| target-time | 目标时间                | `string`、 `number`、 `Date` | -   | -                  |
| server-time | 服务器时间               | `string`、 `number`、 `Date` | -   | 当前时间               |
| format      | 格式(DD:HH:mm:ss:SSS) | `string`                   | -   | `DD天HH小时mm分ss秒SSS` |
| tag         | 外层标签                | `string`                   | -   | `span`             |
| trim        | 移除零值前缀              | `boolean`                  | -   | `false`            |


### 事件

| 事件名    | 说明   | 回调参数                        | 参数说明                                                                                                              |
| ------ | ---- | --------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| error  | 警告回调 | `(message: string) => void` | `message`: 警告信息                                                                                                   |
| change | 变化回调 | `(data: object) => void`    | `timestamp`: 离目标时间相差的毫秒数; `day`: 相差的天数; `hour`: 相差的小时数; `minute`: 相差的分钟数; `second`: 相差的秒数; `millisecond`: 相差的毫秒数, |
| finish | 结束回调 | -                           | -                                                                                                                 |
