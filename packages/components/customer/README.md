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
	<div class="demo-counter">
		<Customer :render="renderCount" :count="count" after-text=" 次" />
		<div class="demo-actions">
			<Button type="primary" @click="count++">增加</Button>
			<Button :disabled="count === 0" @click="count--">减少</Button>
			<Button :disabled="count === 0" @click="count = 0">重置</Button>
		</div>
	</div>
</template>

<script setup>
import { h, ref } from 'vue';
import { Button, Customer } from '@deot/vc';

const count = ref(0);
const renderCount = attrs => h('p', { 'class': 'demo-count', 'aria-live': 'polite' }, `已点击 ${attrs.count}${attrs['after-text']}`);
</script>

<style scoped>
.demo-counter {
	display: grid;
	gap: 18px;
	padding: 18px;
	border: 1px solid var(--vc-color-border, #e5e7eb);
	border-radius: 10px;
	background: var(--vc-color-fill, transparent);
}

.demo-count {
	margin: 0;
	color: var(--vc-color-primary, #409eff);
	font-size: 22px;
	font-weight: 600;
	line-height: 1.4;
}

.demo-actions {
	display: flex;
	flex-wrap: wrap;
	gap: 10px;
}
</style>
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
	<div class="demo-events">
		<Customer :render="renderContent" :count="count" @increase="handleIncrease">
			<p class="demo-slot">内容来自默认插槽</p>
			<template #content="{ current }">
				<p class="demo-slot">作用域插槽收到的计数：{{ current }}</p>
			</template>
		</Customer>
		<p class="demo-result" aria-live="polite">父组件收到的计数：{{ count }}</p>
	</div>
</template>

<script setup>
import { h, ref } from 'vue';
import { Button, Customer } from '@deot/vc';

const count = ref(0);
const handleIncrease = (value) => {
	count.value = value;
};
const renderContent = (attrs, { slots, emit }) => h('div', [
	slots.default?.(),
	slots.content?.({ current: attrs.count }),
	h(Button, {
		type: 'primary',
		onClick: () => emit('increase', attrs.count + 1)
	}, { default: () => '触发自定义事件' })
]);
</script>

<style scoped>
.demo-events {
	display: grid;
	gap: 14px;
	padding: 18px;
	border: 1px solid var(--vc-color-border, #e5e7eb);
	border-radius: 10px;
	background: var(--vc-color-fill, transparent);
}

.demo-slot {
	margin: 5px 0;
	padding: 10px 12px;
	border-radius: 6px;
	background: var(--vc-color-fill-light, rgba(64, 158, 255, 0.08));
	line-height: 1.5;
}

.demo-result {
	margin: 4px 0 0;
	padding-top: 12px;
	border-top: 1px solid var(--vc-color-border, #e5e7eb);
	font-weight: 600;
}
</style>
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
