## 自定义渲染（Customer）

通过 `render` 函数自定义渲染内容，并访问传入的属性、插槽和事件上下文。

### 何时使用

需要在模板中以组件形式调用渲染函数，或为列表项提供独立的组件更新边界时使用。

### 基础用法

`render` 的第一个参数就是 `context.attrs`。除 `render` 外的属性不会被声明为组件 props，属性名保留调用时的形式，例如 `after-text` 需要通过 `attrs['after-text']` 读取。

:::playground
<!--
<config lang="json5">
{ previewInset: 16 }
</config>
-->
```vue
<template>
	<div>
		<button type="button" @click="count++">增加</button>
		<Customer :render="renderCount" :count="count" after-text=" 次" />
	</div>
</template>

<script setup>
import { h, ref } from 'vue';
import { Customer } from '@deot/vc';

const count = ref(0);
const renderCount = attrs => h('p', `已点击 ${attrs.count}${attrs['after-text']}`);
</script>
```
:::

### 插槽与自定义事件

渲染函数通过 `context.slots` 调用默认或具名插槽，并自行决定作用域插槽的参数。通过 `context.emit` 触发自定义事件，父组件使用对应的事件监听器接收。

:::playground
<!--
<config lang="json5">
{ previewInset: 16 }
</config>
-->
```vue
<template>
	<div>
		<Customer :render="renderContent" :count="count" @increase="handleIncrease">
			<p>内容来自默认插槽</p>
			<template #content="{ current }">
				<p>作用域插槽收到的计数：{{ current }}</p>
			</template>
		</Customer>
		<p>父组件收到的计数：{{ count }}</p>
	</div>
</template>

<script setup>
import { h, ref } from 'vue';
import { Customer } from '@deot/vc';

const count = ref(0);
const handleIncrease = (value) => {
	count.value = value;
};
const renderContent = (attrs, { slots, emit }) => h('div', [
	slots.default?.(),
	slots.content?.({ current: attrs.count }),
	h('button', {
		type: 'button',
		onClick: () => emit('increase', attrs.count + 1)
	}, '触发自定义事件')
]);
</script>
```
:::

## API

### 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| render | 渲染函数，第一个参数为 `context.attrs`，第二个参数为 Vue 的 `SetupContext` | `(attrs: Record<string, unknown>, context: SetupContext) => any` | - | `() => null` |

### 事件

没有预设事件。渲染函数可调用 `context.emit(eventName, ...args)`，事件名和参数由调用方定义。

### 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default / 自定义名称 | 由渲染函数通过 `context.slots` 主动调用；不会自动展示 | 由渲染函数调用插槽时传入 |

### 渲染行为

- 默认 `render` 返回 `null`，不显示内容；组件不添加额外的包裹元素。
- 属性变化会更新渲染结果。`render` 接收的 attrs 包含未声明属性和事件监听器，例如 `onIncrease`。
- 组件保留 Vue 默认的属性透传行为。返回单个元素根节点时，`class`、`style` 和事件监听器等会自动透传；片段或文本根节点需由渲染函数处理属性。避免重复绑定同一事件监听器。
- 渲染内容、文案和样式均由调用方提供，组件不提供独立主题样式或内置文案。

### 移动端

`MCustomer` 是 `Customer` 的别名，可从 `@deot/vc` 导入，属性及渲染行为完全相同。
