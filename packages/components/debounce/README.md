## 防抖（Debounce）

为渲染目标上的事件处理函数添加防抖，减少连续操作导致的重复执行。

移动端入口导出的 `MDebounce` 与 `Debounce` 是同一实现。

### 何时使用

需要在首次点击时立即响应，并忽略短时间内的重复点击时使用，例如提交按钮或操作入口。

### 基础用法

首次触发立即执行。连续触发会延长等待窗口，直到停止触发满 `wait` 毫秒后，下一次触发才会再次执行；窗口结束时不会补执行。`tag` 可以是组件或原生标签，下面两种渲染目标的计数彼此独立。

:::playground
<!--
<config lang="json5">
{
	views: ['runtime', 'files'],
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="debounce-demo">
		<div class="debounce-demo__row">
			<Debounce :tag="Button" :wait="1000" @click="handleComponentClick">
				组件按钮：{{ componentCount }} 次
			</Debounce>
			<Debounce tag="button" :wait="1000" @click="handleNativeClick">
				原生按钮：{{ nativeCount }} 次
			</Debounce>
		</div>
		<p class="debounce-demo__result">快速连续点击，停止点击 1 秒后再试。</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Debounce, Button } from '@deot/vc';

const nativeCount = ref(0);
const componentCount = ref(0);

const handleNativeClick = () => {
	nativeCount.value++;
};

const handleComponentClick = () => {
	componentCount.value++;
};
</script>

<style scoped>
.debounce-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.debounce-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}

.debounce-demo__result {
	margin: 0;
}
</style>
```
:::

### 筛选事件

`include` 和 `exclude` 匹配的是监听器属性名，例如 `onClick`，而非 `click`。只有匹配 `include` 的函数做防抖；匹配 `exclude` 的函数不做防抖，即使它同时匹配 `include`。下面使用原生按钮，避免 `Button` 自身的 `wait` 干扰计数。

:::playground
<!--
<config lang="json5">
{
	views: ['runtime', 'files'],
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="debounce-demo">
		<div class="debounce-demo__row">
			<Debounce
				tag="button"
				:wait="1000"
				:include="/^onClick$/"
				@click="handleClick"
				@dblclick="handleDoubleClick"
			>
				只对 click 防抖
			</Debounce>
			<Debounce tag="button" :exclude="/^onClick$/" @click="handleExcludedClick">
				click 不防抖
			</Debounce>
		</div>
		<p class="debounce-demo__result">
			防抖的 click：{{ clickCount }} 次；dblclick：{{ doubleClickCount }} 次；不防抖的 click：{{ excludedCount }} 次
		</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Debounce } from '@deot/vc';

const clickCount = ref(0);
const doubleClickCount = ref(0);
const excludedCount = ref(0);

const handleClick = () => {
	clickCount.value++;
};

const handleDoubleClick = () => {
	doubleClickCount.value++;
};

const handleExcludedClick = () => {
	excludedCount.value++;
};
</script>

<style scoped>
.debounce-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.debounce-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}

.debounce-demo__result {
	margin: 0;
}
</style>
```
:::

## API

### 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| wait | 停止触发后重新允许执行的等待时间，单位毫秒 | `number` | - | `250` |
| tag | 渲染的 HTML 标签名或组件对象 | `string \| object` | - | `'div'` |
| include | 对匹配属性名且值为函数的监听器应用防抖 | `RegExp` | - | `/^on([A-Z])/` |
| exclude | 排除匹配属性名的监听器，优先于 include | `RegExp` | - | - |

### 事件

组件不声明固定事件，通过 attrs 将监听器传给 `tag`。符合筛选条件且值为函数的监听器分别进行防抖，回调参数保持渲染目标原样，例如原生按钮的 `@click` 接收 `MouseEvent`。未匹配的监听器和其他属性直接透传。

### 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 渲染目标的子内容；`tag` 为组件时，全部插槽原样传给该组件 | - |

### 使用注意

- 监听器应绑定在 `Debounce` 上；组件不会改写默认插槽中子元素自身的事件处理函数。
- 当前实现仅在筛选出的监听器数量变化时替换防抖函数集合。动态修改 `wait`、`include`、`exclude` 或监听器函数不能保证更新已创建的防抖函数，建议初始化时确定配置；需要切换时可通过 `key` 重建组件。
