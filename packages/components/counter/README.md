## 计数器（Counter）

以递增或递减动画展示数字，支持分组、小数位和自定义渲染。

移动端入口导出的 `MCounter` 与 `Counter` 是同一实现。

### 何时使用

当需要突出某个数字时，递增或递减动画。

### 基础用法

通过 `value` 设置目标数字，挂载时自动从 0 开始，`duration` 为动画时长。非受控模式下，修改 `value` 会从当前数值过渡到新目标。

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
	<div class="counter-demo">
		<Counter :value="value" :duration="800" />
		<div class="counter-demo__row">
			<Button @click="handleDecrease">减少 1000</Button>
			<Button type="primary" @click="handleIncrease">增加 1000</Button>
		</div>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, Counter } from '@deot/vc';

const value = ref(99999);

const handleDecrease = () => {
	value.value -= 1000;
};

const handleIncrease = () => {
	value.value += 1000;
};
</script>

<style scoped>
.counter-demo {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 16px;
}

.counter-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}
</style>
```
:::

### 格式化与插槽

`precision` 设置小数位数，`zeroless` 按实际小数长度限制补零；`separator`、`decimal` 分别设置千位分隔符和小数分隔符，`numerals` 按 0–9 的顺序替换数字。无效值显示 `placeholder`。默认插槽分别拿到整数和小数，设置 `:duration="0"` 可立即展示结果。

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
	<div class="counter-demo">
		<Counter
			v-slot="{ negative, separated, decimal }"
			:value="-1234.5"
			:precision="2"
			:duration="0"
		>
			<strong>{{ negative }}{{ separated }}</strong><span>.{{ decimal }} 单位</span>
		</Counter>
		<Counter value="1234.50" :precision="2" zeroless :duration="0" />
		<Counter placeholder="暂无数据" />
		<Counter
			:value="1234567.89"
			:precision="2"
			separator="."
			decimal=","
			:duration="0"
		/>
		<Counter :value="2026" :numerals="numerals" :duration="0" />
		<div class="counter-demo__row">
			<Button @click="handleToggleSeparator">切换千位分隔符</Button>
			<Counter :value="1234567.89" :precision="2" :separator="separator" :duration="0" />
		</div>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, Counter } from '@deot/vc';

const separator = ref(',');
const numerals = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

const handleToggleSeparator = () => {
	separator.value = separator.value ? '' : ',';
};
</script>

<style scoped>
.counter-demo {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 16px;
}

.counter-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}
</style>
```
:::

### 渲染函数与外层标签

`render` 接收与默认插槽相同的字段，返回的内容放在 `tag` 指定的根标签内（默认 `span`，初始化时确定）。

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
	<div class="counter-demo">
		<Counter
			class="counter-demo__value"
			tag="div"
			:value="8848.86"
			:precision="2"
			:duration="1500"
			:render="renderValue"
		/>
	</div>
</template>

<script setup>
import { h } from 'vue';
import { Counter } from '@deot/vc';

const renderValue = ({ separated, decimal }) => [
	h('strong', separated),
	h('small', `.${decimal}`)
];
</script>

<style scoped>
.counter-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.counter-demo__value {
	font-size: 28px;
	color: var(--vc-color-primary, #456cf6);
}
</style>
```
:::

### 缓动

`easing` 默认使用内置缓动，设为 `false` 时匀速变化，也可以传入 `(t, b, c, d) => number` 自定义。启用缓动且差值超过 `smartEasingThreshold` 时，先匀速走到距目标 `smartEasingAmount` 处，再用缓动走完。`change` 在每一帧打印时触发，参数为格式化字段对象。

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
	<div class="counter-demo">
		<div class="counter-demo__row">
			<span class="counter-demo__label">内置缓动</span>
			<Counter
				:key="`default-${round}`"
				:value="target"
				:duration="2000"
				:smart-easing-threshold="5000"
				:smart-easing-amount="1000"
				@change="handleChange"
			/>
		</div>
		<div class="counter-demo__row">
			<span class="counter-demo__label">匀速</span>
			<Counter :key="`linear-${round}`" :value="target" :duration="2000" :easing="false" />
		</div>
		<div class="counter-demo__row">
			<span class="counter-demo__label">自定义</span>
			<Counter :key="`custom-${round}`" :value="target" :duration="2000" :easing="easeInQuad" />
		</div>
		<div class="counter-demo__row">
			<Button @click="handleReplay">重新播放</Button>
		</div>
		<p class="counter-demo__result">内置缓动的当前值：{{ current }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, Counter } from '@deot/vc';

const target = 10000;
const round = ref(0);
const current = ref('0');

// t 为已用时间，b 为起始值，c 为变化量，d 为时长
const easeInQuad = (t, b, c, d) => c * (t / d) ** 2 + b;

const handleChange = ({ value }) => {
	current.value = value;
};

const handleReplay = () => {
	round.value++;
};
</script>

<style scoped>
.counter-demo {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 16px;
}

.counter-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}

.counter-demo__label {
	width: 64px;
	color: var(--vc-color-dark-lighter, #515151);
}

.counter-demo__result {
	margin: 0;
}
</style>
```
:::

### 手动控制

设置 `controllable` 后，通过组件引用启动、暂停和继续，开始前展示内容为空。`begin` 在启动时触发，`complete` 在动画结束时触发；`cancel` 只取消动画帧，`print` 直接打印一个数值而不改变目标。

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
	<div class="counter-demo">
		<Counter
			ref="counter"
			:value="target"
			:duration="5000"
			controllable
			@begin="handleBegin"
			@complete="handleComplete"
		/>
		<p class="counter-demo__result">{{ status }}</p>
		<div class="counter-demo__row">
			<Button @click="handleStart">开始</Button>
			<Button @click="handlePause">暂停</Button>
			<Button @click="handleResume">继续</Button>
			<Button @click="handleEnd">结束</Button>
			<Button @click="handleRestart">重新开始</Button>
			<Button @click="handleCancel">取消动画帧</Button>
			<Button @click="handlePrint">打印 42</Button>
			<Button type="primary" @click="handleUpdateTarget">目标 +100</Button>
		</div>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, Counter } from '@deot/vc';

const counter = ref();
const target = ref(100);
const status = ref('尚未开始');

const handleBegin = () => {
	status.value = '计数中';
};

const handleComplete = () => {
	status.value = '已完成';
};

const handleStart = () => counter.value.start();
const handlePause = () => counter.value.pause();
const handleResume = () => counter.value.resume();
const handleEnd = () => counter.value.end();
const handleRestart = () => counter.value.restart();

const handleCancel = () => {
	counter.value.cancel();
	status.value = '已取消动画帧';
};

const handlePrint = () => counter.value.print(42);

const handleUpdateTarget = () => {
	target.value += 100;
	counter.value.update(target.value);
};
</script>

<style scoped>
.counter-demo {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 16px;
}

.counter-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}

.counter-demo__result {
	margin: 0;
}
</style>
```
:::

## API

### 属性

| 属性        | 说明    | 类型         | 可选值 | 默认值   |
| --------- | ----- | ---------- | --- | ----- |
| value     | 目标数值；初始化时支持按 separator、decimal 解析字符串 | `number \| string` | - | - |
| precision | 小数位数，截取并补零，不四舍五入 | `number` | - | `0` |
| zeroless | 根据实际小数长度限制补零 | `boolean` | - | `false` |
| placeholder  | 占位符 | `string`  | -   | - |
| render | 自定义渲染，接收下述格式化字段；内容放在根标签内 | `Function` | - | - |
| tag | 根标签，默认展示、插槽和 `render` 的内容都放在它里面；初始化时确定 | `string` | - | `'span'` |
| duration | 动画时长（毫秒）；非正数时 start 直接打印 | `number` | - | `500` |
| decimal | 小数分隔符 | `string` | - | `'.'` |
| separator | 千位分隔符，空字符串关闭分组 | `string` | - | `','` |
| numerals | 按 0–9 顺序替换 separated 和 decimal 中的数字 | `string[]` | - | `[]` |
| easing | 内置缓动、关闭缓动或自定义函数 | `boolean \| ((t: number, b: number, c: number, d: number) => number)` | - | `true` |
| smartEasingThreshold | 启用缓动时，差值超过阈值会分为线性和缓动两段 | `number` | - | `999` |
| smartEasingAmount | 最后缓动阶段的数值差额 | `number` | - | `333` |
| controllable | 关闭自动启动及 value、precision 的自动更新 | `boolean` | - | `false` |

缓动参数 `t` 为当前阶段已用时间，`b` 为起始值，`c` 为变化量，`d` 为阶段时长。`zeroless` 根据实际小数长度限制补零。未提供值、空字符串、`null` 或无法由 `parseFloat` 解析的字符串显示 `placeholder`。

### 事件

| 事件名      | 说明   | 回调参数 | 参数说明 |
| -------- | ---- | ---- | ---- |
| begin | start 启动或 restart 重新启动时触发 | - | - |
| complete | 动画自然结束或 end 执行时触发；duration 非正数的 start 不触发 | - | - |
| change | 每次 print 更新时触发，包括动画帧 | `prints` | 下述格式化字段对象；对象会持续更新，保存快照时需自行复制 |

### 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 自定义展示，优先于 render，外层使用 tag | 下述格式化字段 |

`render` 也接收这些字段，返回的内容与插槽一样放在根标签内。字段均为字符串；插槽和 `render` 的 `value` 在无效输入时替换为 `placeholder`，可能为 `undefined`。

| 字段 | 说明 | 示例（-1234.5，precision 为 2） |
| --- | --- | --- |
| negative | 负号，非负数为空 | `'-'` |
| integer | 原始整数，不含负号和分组 | `'1234'` |
| decimal | 小数，不含小数分隔符 | `'50'` |
| separated | 分组后的整数，不含负号 | `'1,234'` |
| float | 负号、原始整数与格式化小数组合 | `'-1234.50'` |
| value | 完整格式化结果 | `'-1,234.50'` |

### 方法

通过组件引用调用，手动控制时设置 `controllable`。

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| start | 从 0 开始；已启动或完成时不重复执行 | - | `void` |
| pause | 暂停动画 | - | `void` |
| resume | 继续已暂停且未完成的动画 | - | `void` |
| update | 从当前数值过渡到新目标；start 前无效，不触发 begin | `value: number \| string` | `void` |
| end | 立即显示当前 value 属性并触发 complete；已完成时无效 | - | `void` |
| restart | 重置启动和完成标志后从 0 再次启动 | - | `void` |
| cancel | 取消动画帧，不重置状态或触发 complete；暂停通常使用 pause | - | `void` |
| print | 直接格式化展示并触发 change，不停止动画或更新目标 | `value: number` | `void` |

`update`、自动响应的 `value` 更新及 `end` 使用数值转换，不解析自定义分组字符串，建议传入普通数字。`end` 使用 `value` 属性，未必等于 `update` 设置的目标；`restart` 使用内部保存的目标。非受控模式仅在完成后响应 `precision` 变化并重新打印。
