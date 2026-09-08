## 计数器（Counter）

以递增或递减动画展示数字，支持分组、小数位和自定义渲染。`MCounter` 是 `Counter` 的别名，API 相同。

### 何时使用

当需要突出某个数字时，递增或递减动画。

### 基础用法

通过 `value` 设置目标数字，挂载时自动从 0 开始。非受控模式下，修改 `value` 会从当前数值过渡到新目标。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<div>
		<Counter
			:value="99999"
		/>
	</div>
</template>
<script setup>
import { Counter } from '@deot/vc';
</script>
```
:::

### 格式化与插槽

通过插槽分别展示整数和小数，设置 `:duration="0"` 可立即展示结果。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<div style="display: grid; gap: 12px;">
		<Counter v-slot="{ negative, separated, decimal }" :value="-1234.5" :precision="2" :duration="0">
			<strong>{{ negative }}{{ separated }}</strong><span>.{{ decimal }} 元</span>
		</Counter>
		<Counter value="1234.50" :precision="2" zeroless :duration="0" />
		<Counter placeholder="暂无数据" />
	</div>
</template>

<script setup>
import { Counter } from '@deot/vc';
</script>
```
:::

### 手动控制

设置 `controllable` 后，通过组件引用启动、暂停和继续。开始前展示内容为空。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<div style="display: grid; gap: 12px;">
		<Counter ref="counter" :value="100" :duration="5000" controllable />
		<div style="display: flex; flex-wrap: wrap; gap: 8px;">
			<button @click="counter.start()">开始</button>
			<button @click="counter.pause()">暂停</button>
			<button @click="counter.resume()">继续</button>
			<button @click="counter.end()">结束</button>
			<button @click="counter.restart()">重新开始</button>
		</div>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Counter } from '@deot/vc';

const counter = ref();
</script>
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
| render | 自定义渲染，接收下述格式化字段 | `Function` | - | - |
| tag | 默认或插槽渲染的根标签，初始化时确定 | `string` | - | `'span'` |
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

`render` 也接收这些字段，其返回内容决定根节点。字段均为字符串；插槽和 `render` 的 `value` 在无效输入时替换为 `placeholder`，可能为 `undefined`。

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
