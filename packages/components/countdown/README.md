## 倒计时（Countdown）

展示距离目标时间的剩余时长。移动端 `MCountdown` 与 `Countdown` 使用相同实现和 API。

### 何时使用

显示倒计时，结束时触发事件，多用于秒杀营销活动中。

### 基础用法

通过 `targetTime` 设置倒计时时间

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<Countdown :target-time="targetTime" />
</template>

<script setup>
import { Countdown } from '@deot/vc';

const targetTime = Date.now() + 2 * 24 * 60 * 60 * 1000;
</script>
```
:::

### 设置倒计时刷新周期
通过 `t` 设置倒计时刷新周期

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<div style="display: flex; align-items: center; gap: 12px">
		<Countdown
			:target-time="targetTime"
			:t="refreshInterval"
			format="HH:mm:ss:SSS"
		/>
		<Button @click="switchInterval">
			切换为 {{ refreshInterval === 1000 ? '50ms' : '1 秒' }} 刷新
		</Button>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, Countdown } from '@deot/vc';

const targetTime = ref(Date.now() + 90 * 1000);
const refreshInterval = ref(1000);

const switchInterval = () => {
	refreshInterval.value = refreshInterval.value === 1000 ? 50 : 1000;
	targetTime.value = Date.now() + 90 * 1000;
};
</script>
```
:::

### 自定义渲染倒计时
通过 `format` 自定义渲染倒计时

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<Countdown :target-time="targetTime" format="DD 天 HH:mm:ss" />
</template>

<script setup>
import { Countdown } from '@deot/vc';

const targetTime = Date.now() + 26 * 60 * 60 * 1000;
</script>
```
:::

### 自定义插槽

默认插槽优先于 `render`，接收时间字段；使用插槽时，`format` 和 `trim` 不会自动应用。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<div style="display: flex; align-items: center; gap: 12px">
		<Countdown :target-time="targetTime" @complete="completed = true">
			<template #default="{ minute, second }">
				剩余 {{ minute }} 分 {{ second }} 秒
			</template>
		</Countdown>
		<span v-if="completed">已结束</span>
		<Button @click="restart">重新开始</Button>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, Countdown } from '@deot/vc';

const targetTime = ref(Date.now() + 10 * 1000);
const completed = ref(false);

const restart = () => {
	targetTime.value = Date.now() + 10 * 1000;
	completed.value = false;
};
</script>
```
:::

## API

### 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| targetTime | 目标时间，数字为毫秒时间戳 | `string \| number \| Date` | - | `''` |
| serverTime | 服务器当前时间，用于计算与本地时钟的偏移；未提供时使用本地时钟 | `string \| number \| Date` | - | `''` |
| t | 刷新周期，单位毫秒；应传入正数 | `number` | - | `1000` |
| format | 默认展示格式；省略时跟随 locale，显式空字符串表示空展示 | `string` | - | 中文：`DD天HH小时mm分ss秒SSS`；英文：`DDd HHh mmm sss SSS` |
| render | 自定义渲染，参数与默认插槽一致，由函数生成根节点 | `(data: CountdownRenderData) => VNodeChild` | - | - |
| tag | 默认展示及插槽的外层标签；也传入 render 参数 | `string` | - | `'span'` |
| trim | 默认展示时移除匹配的 `00` 和格式分隔片段；当前是全局替换，不限于前缀 | `boolean` | - | `false` |

### 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| change | 启动时立即触发，此后每次刷新触发；完成时最后触发一次 | `(data: CountdownChangeData) => void` | `timestamp` 为剩余毫秒数；完成时为 `0`，所有时间字段为 `'00'` |
| complete | 到达或超过目标时间，每次启动最多触发一次 | - | - |
| error | 非空目标时间无法解析为有效的非零时间戳时触发 | `(message: string) => void` | 开发者诊断信息：`请设定时间以及格式` |

### 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 自定义内容，优先于 render | `CountdownRenderData` |

以下类型用于说明数据结构，不是包的具名类型导出：

```ts
interface CountdownTimeData {
	day: string;
	hour: string;
	minute: string;
	second: string;
	millisecond: string;
}

interface CountdownChangeData extends CountdownTimeData {
	timestamp: number;
}

interface CountdownRenderData extends CountdownTimeData {
	format: string;
	tag: string;
	trim: boolean;
}
```

### 注意事项

- 推荐传入数字时间戳或 `Date`。字符串会将 `-` 替换为 `/` 后交给 `Date.parse`。
- 更新 `targetTime` 或 `serverTime` 会重新启动计时，连续更新采用 200ms 防抖。不要在父组件每次渲染时重新创建 `serverTime`。`t` 在计时器启动时确定刷新周期。
- `DD`、`HH`、`mm`、`ss`、`SSS` 分别替换天、小时、分钟、秒和秒内余量，每种标记只替换第一次出现的位置。小时、分钟和秒为扣除更大单位后的余数。
- `SSS` 不补零：`t < 10` 时为 0–999，`10 ≤ t < 100` 时为 0–99，`t ≥ 100` 时为 0–9。
- `trim` 会将格式分隔文本拼入正则表达式，复杂格式建议通过插槽自行展示。
- 默认格式通过 HTML 渲染，勿将不可信内容直接作为 `format`。组件没有公开的启动、暂停或停止方法。
- 完成事件的数据已归零，但默认展示及插槽字段可能保留最后一次计算结果；需要结束状态时，请响应 `complete` 切换展示内容。
