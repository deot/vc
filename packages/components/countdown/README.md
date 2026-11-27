## 倒计时（Countdown）

展示距离目标时间的剩余时长。

移动端入口导出的 `MCountdown` 与 `Countdown` 是同一实现。

### 何时使用

显示倒计时，结束时触发事件，多用于限时活动等场景。

### 基础用法

通过 `targetTime` 设置目标时间，默认格式跟随 locale。`trim` 移除默认展示中为 `00` 的片段及其分隔文本。

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
	<div class="countdown-demo">
		<Countdown :target-time="targetTime" />
		<Countdown :target-time="targetTime" trim />
	</div>
</template>

<script setup>
import { Countdown } from '@deot/vc';

const targetTime = Date.now() + 25 * 60 * 1000;
</script>

<style scoped>
.countdown-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}
</style>
```
:::

### 设置倒计时刷新周期

通过 `t` 设置刷新周期（毫秒），在计时器启动时确定；`SSS` 的位数随周期变化。

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
	<div class="countdown-demo">
		<Countdown
			:target-time="targetTime"
			:t="refreshInterval"
			format="HH:mm:ss:SSS"
		/>
		<Button @click="handleSwitchInterval">
			切换为 {{ refreshInterval === 1000 ? '50ms' : '1 秒' }} 刷新
		</Button>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, Countdown } from '@deot/vc';

const targetTime = ref(Date.now() + 90 * 1000);
const refreshInterval = ref(1000);

const handleSwitchInterval = () => {
	refreshInterval.value = refreshInterval.value === 1000 ? 50 : 1000;
	targetTime.value = Date.now() + 90 * 1000;
};
</script>

<style scoped>
.countdown-demo {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}
</style>
```
:::

### 自定义格式

通过 `format` 自定义展示格式，`DD`、`HH`、`mm`、`ss`、`SSS` 分别替换为天、小时、分钟、秒和秒内余量。

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
	<div class="countdown-demo">
		<Countdown :target-time="targetTime" format="DD 天 HH:mm:ss" />
	</div>
</template>

<script setup>
import { Countdown } from '@deot/vc';

const targetTime = Date.now() + 26 * 60 * 60 * 1000;
</script>

<style scoped>
.countdown-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}
</style>
```
:::

### 自定义插槽

默认插槽优先于 `render`，接收时间字段；使用插槽时，`format` 和 `trim` 不会自动应用。倒计时结束后触发 `complete`。

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
	<div class="countdown-demo">
		<Countdown :target-time="targetTime" @complete="handleComplete">
			<template #default="{ minute, second }">
				剩余 {{ minute }} 分 {{ second }} 秒
			</template>
		</Countdown>
		<span v-if="isCompleted">已结束</span>
		<Button @click="handleRestart">重新开始</Button>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, Countdown } from '@deot/vc';

const targetTime = ref(Date.now() + 10 * 1000);
const isCompleted = ref(false);

const handleComplete = () => {
	isCompleted.value = true;
};

const handleRestart = () => {
	targetTime.value = Date.now() + 10 * 1000;
	isCompleted.value = false;
};
</script>

<style scoped>
.countdown-demo {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}
</style>
```
:::

### 渲染函数与外层标签

`render` 接收与默认插槽相同的字段，返回的内容放在 `tag` 指定的外层标签内（默认 `span`）。

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
	<div class="countdown-demo">
		<Countdown
			class="countdown-demo__blocks"
			tag="div"
			:target-time="targetTime"
			:render="renderBlocks"
		/>
	</div>
</template>

<script setup>
import { h } from 'vue';
import { Countdown } from '@deot/vc';

const targetTime = Date.now() + 3 * 60 * 60 * 1000;

const renderBlocks = ({ hour, minute, second }) => [hour, minute, second].map(
	(value, index) => h('span', { key: index, class: 'countdown-demo__block' }, value)
);
</script>

<style scoped>
.countdown-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.countdown-demo__blocks {
	display: flex;
	gap: 8px;
}

.countdown-demo :deep(.countdown-demo__block) {
	min-width: 32px;
	padding: 4px 0;
	border-radius: 4px;
	text-align: center;
	color: #fff;
	background: var(--vc-color-primary, #456cf6);
}
</style>
```
:::

### 服务器时间与事件

`serverTime` 传入服务器当前时间，用来校正本地时钟的偏移。`change` 在启动时和每次刷新时触发，`timestamp` 为剩余毫秒数；`targetTime` 无法解析时触发 `error`（下例同时用空字符串的 `format` 隐藏默认展示）。

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
	<div class="countdown-demo">
		<div class="countdown-demo__row">
			<span>本地时钟：</span>
			<Countdown :target-time="targetTime" format="mm:ss" />
		</div>
		<div class="countdown-demo__row">
			<span>服务器快 5 分钟：</span>
			<Countdown
				:target-time="targetTime"
				:server-time="serverTime"
				format="mm:ss"
				@change="handleChange"
			/>
		</div>
		<p class="countdown-demo__result">剩余 {{ remaining }} 毫秒</p>
		<Countdown target-time="无效时间" format="" @error="handleError" />
		<p class="countdown-demo__result">{{ errorText }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Countdown } from '@deot/vc';

const targetTime = Date.now() + 30 * 60 * 1000;
// 实际使用时取自接口返回的服务器时间，只赋值一次
const serverTime = Date.now() + 5 * 60 * 1000;
const remaining = ref(0);
const errorText = ref('');

const handleChange = ({ timestamp }) => {
	remaining.value = timestamp;
};

const handleError = (message) => {
	errorText.value = `error：${message}`;
};
</script>

<style scoped>
.countdown-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.countdown-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}

.countdown-demo__result {
	margin: 0;
}
</style>
```
:::

## API

### 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| targetTime | 目标时间，数字为毫秒时间戳；字符串按 dayjs 解析（`YYYY-MM-DD HH:mm:ss`、`YYYY/MM/DD`、ISO 8601 等） | `string \| number \| Date` | - | `''` |
| serverTime | 服务器当前时间，用于计算与本地时钟的偏移；未提供时使用本地时钟 | `string \| number \| Date` | - | `''` |
| t | 刷新周期，单位毫秒；应传入正数 | `number` | - | `1000` |
| format | 默认展示格式；省略时跟随 locale，显式空字符串表示空展示 | `string` | - | 中文：`DD天HH小时mm分ss秒SSS`；英文：`DDd HHh mmm sss SSS` |
| render | 自定义渲染，参数与默认插槽一致；内容放在 `tag` 指定的外层标签内 | `(data: CountdownRenderData) => VNodeChild` | - | - |
| tag | 默认展示、插槽和 `render` 的外层标签 | `string` | - | `'span'` |
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
	trim: boolean;
}
```

### 注意事项

- 推荐传入数字时间戳或 `Date`。字符串交给 dayjs 解析，无法解析时按空值处理并触发 `error`。
- 更新 `targetTime` 或 `serverTime` 会重新启动计时，连续更新采用 200ms 防抖。不要在父组件每次渲染时重新创建 `serverTime`。`t` 在计时器启动时确定刷新周期。
- `DD`、`HH`、`mm`、`ss`、`SSS` 分别替换天、小时、分钟、秒和秒内余量，每种标记只替换第一次出现的位置。小时、分钟和秒为扣除更大单位后的余数。
- `SSS` 不补零：`t < 10` 时为 0–999，`10 ≤ t < 100` 时为 0–99，`t ≥ 100` 时为 0–9。
- `trim` 会将格式分隔文本拼入正则表达式，复杂格式建议通过插槽自行展示。
- 默认格式按 HTML 渲染，勿将不可信内容直接作为 `format`；配置了全局的 `sanitize` 时会先经过清洗。
- 写在组件上的 `class`、`style` 和事件监听会落到外层标签上；`id`、`data-*` 等其他属性不会出现在 DOM 上，使用默认插槽或 `render` 时它们会并入参数。组件没有公开的启动、暂停或停止方法。
- 完成时默认展示及插槽字段同样归零（插槽的 `millisecond` 为 `'0'`，`change` 中为 `'00'`）；需要结束状态时，请响应 `complete` 切换展示内容。
