## 自定义渲染（Customer）

渲染一份由调用方提供的内容：渲染函数、插槽、字符串、数字或 `{ type, value }`，并统一处理包裹元素与 HTML。

### 何时使用

- 需要在模板中以组件形式调用渲染函数，或为列表项提供独立的组件更新边界。
- 组件的标题、内容等属性同时支持插槽、渲染函数和字符串，需要按同一套规则渲染其中一种。

### 基础用法

`render` 为函数时，写在组件上的其他属性以对象形式作为它的第一个参数（`class`、`style` 和事件监听器除外）。属性名保留调用时的形式，例如 `after-text` 需要通过 `attrs['after-text']` 读取。参数没有变化时函数不会重新执行。

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

### 插槽、渲染函数与字符串

组件的标题、内容等属性通常同时支持插槽、渲染函数和字符串。插槽本身就是函数，和渲染函数一样通过 `render` 传入，由调用方决定先后，例如 `slots.title || props.title`。

- 字符串和数字放进 `tag` 指定的包裹元素，`class`、`style` 和事件监听器只作用于这个元素。
- 函数（渲染函数或插槽）的内容原样输出，不加包裹元素；需要包裹时开启 `wrap`。
- 除 `class`、`style` 和事件监听器外，写在组件上的其他属性都是函数的参数，不会出现在 DOM 上。
- `render`、`tag`、`wrap` 是组件自己的属性，不能用作参数名。

:::playground
<!--
<config lang="json5">
{ previewInset: 16 }
</config>
-->
```vue
<template>
	<div class="demo-slot">
		<Customer tag="p" class="demo-slot__item" render="字符串内容" />
		<Customer :render="renderContent" :index="1" />
		<DemoTitle title="属性提供的标题" />
		<DemoTitle title="有插槽时不显示">
			<template #title="{ index }">
				<p class="demo-slot__item">插槽内容，index：{{ index }}</p>
			</template>
		</DemoTitle>
	</div>
</template>

<script setup>
import { h } from 'vue';
import { Customer } from '@deot/vc';

const renderContent = ({ index }) => h('p', { class: 'demo-slot__item' }, `渲染函数内容，index：${index}`);

// 组件内部的典型写法：插槽与属性二选一后交给 Customer
const DemoTitle = (props, { slots }) => h(Customer, {
	tag: 'p',
	class: 'demo-slot__item',
	render: slots.title || props.title,
	index: 2
});
DemoTitle.props = ['title'];
</script>

<style scoped>
.demo-slot {
	display: grid;
	gap: 10px;
}

.demo-slot__item {
	margin: 0;
	padding: 10px 12px;
	border-radius: 6px;
	background: var(--vc-color-fill-light, rgba(64, 158, 255, 0.08));
	line-height: 1.5;
}
</style>
```
:::

### 字符串与 HTML

字符串和数字永远按文本渲染，标签会原样显示。需要 HTML 时传 `{ type: 'html', value }`；`{ type: 'text', value }` 按文本渲染，其它类型交给全局的 `formatter` 转换后按文本渲染。

:::playground
<!--
<config lang="json5">
{ previewInset: 16 }
</config>
-->
```vue
<template>
	<div class="demo-html">
		<Customer :render="markup" />
		<Customer :render="{ type: 'html', value: markup }" />
		<Customer :render="{ type: 'text', value: markup }" />
	</div>
</template>

<script setup>
import { Customer } from '@deot/vc';

const markup = '<b>加粗</b>的内容';
</script>

<style scoped>
.demo-html {
	display: grid;
	gap: 10px;
	line-height: 1.5;
}
</style>
```
:::

按 HTML 渲染的内容通过 `innerHTML` 写入。组件库里只有 Customer 会写入 HTML，以下三处的内容本身就是 HTML，同样经由它渲染：EditorView 的 `value`、Print 的 `value`、Countdown 的默认展示。

#### 清洗：全局 `sanitize`

`sanitize` 在写入 HTML 之前执行，返回清洗后的 HTML。它对所有按 HTML 渲染的内容生效，包括上面三处；字符串、数字、`text` 和自定义类型、渲染函数与插槽不经过它。

```js
import { VcInstance } from '@deot/vc';

VcInstance.configure({
	sanitize: ({ value, instance }) => {
		// instance.parent 是使用 Customer 的组件：富文本可以放行更多标签
		const isRichText = instance.parent?.type.name === 'vc-editor-view';
		return clean(value, isRichText ? RICH_TEXT_RULES : STRICT_RULES);
	}
});
```

- 内容里不含 `<` 和 `&` 时按文本写入，结果与按 HTML 解析相同，因此不会调用 `sanitize`。
- Tabs 的标签、Carousel 的指示点内容多经过一层内部组件（`vc-customer-prop`），这两处使用它的组件是 `instance.parent.parent`。
- 清洗结果按实例记忆，内容不变时不会重复执行；运行时配置、替换或移除都会即时生效。
- 没有配置 `sanitize` 时内容原样写入：只对可信内容使用 `{ type: 'html', value }`。`{ type, value }` 是普通对象，可以由 JSON 构造，不要把未校验的接口数据直接传给内容属性。

#### 类型扩展：全局 `Customer.formatter`

`formatter` 在渲染前转换 `{ type, value }` 的内容，用来支持自定义类型。它只返回处理后的值，不改变类型：`html` 类型的值经它处理后再交给 `sanitize`，其余类型按文本渲染。字符串和数字不经过它。

```js
import { VcInstance } from '@deot/vc';

VcInstance.configure({
	Customer: {
		formatter: ({ type, value }) => (type === 'amount' ? value.toFixed(2) : value)
	}
});
```

| 写法 | 写入方式 | `formatter` | `sanitize` |
| --- | --- | --- | --- |
| 字符串 / 数字 | 文本 | 不经过 | 不经过 |
| `{ type: 'html', value }` | 含 `<` 或 `&` 时 `innerHTML`，否则文本 | 经过 | 含 `<` 或 `&` 时经过 |
| `{ type: 'text', value }` | 文本 | 经过 | 不经过 |
| 其它类型 | 文本 | 经过 | 不经过 |

## API

### 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| render | 内容。字符串和数字按文本渲染，HTML 与自定义类型用 `{ type, value }`；函数（渲染函数或插槽）的第一个参数为除 `class`、`style`、事件监听器以外的属性，第二个参数为 Vue 的 `SetupContext` | `string \| number \| ((attrs: object, context: SetupContext) => any) \| { type: string; value: any }` | - | - |
| tag | 包裹元素，可以是标签名或组件 | `string \| Component` | - | `'div'` |
| wrap | 函数的内容也放进包裹元素，且没有内容时仍渲染包裹元素 | `boolean` | - | `false` |
| 其他属性 | 传给函数的参数；`class`、`style`、事件监听器除外，它们落在包裹元素上 | - | - | - |

只有 `render` 是声明的属性，`tag`、`wrap` 按约定读取，用法不变；模板中的裸属性（`<Customer wrap />`）同样视为开启。

### 事件

没有预设事件。渲染函数可调用 `context.emit(eventName, ...args)`，事件名和参数由调用方定义。

### 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default / 自定义名称 | 由渲染函数通过 `context.slots` 主动调用；不会自动展示 | 由渲染函数调用插槽时传入 |

### 全局配置

通过 `VcInstance.configure` 配置，修改后已渲染的内容会同步更新。

| 配置项 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| sanitize | 写入 HTML 前的清洗，返回清洗后的 HTML；`instance` 是当前的 Customer 实例，`instance.parent` 为使用它的组件 | `(data: { value: string; instance: object }) => string` | - |
| Customer.formatter | 渲染前转换 `{ type, value }` 的内容，返回值作为最终内容；`instance` 同上 | `(data: { type: string; value: any; instance: object }) => any` | - |

### 渲染行为

- `undefined`、`null`、空字符串、布尔值，以及不同时带 `type` 和 `value` 的对象视为没有内容，不输出任何元素；数字 `0` 正常输出。
- `{ type: 'html', value }` 的 `value` 会先转成字符串。`formatter` 或 `sanitize` 返回空值时同样视为没有内容。
- 包裹元素只接收 `class`、`style` 和事件监听器，并且只在渲染了包裹元素时生效；`id`、`data-*` 等其他属性属于函数参数，不会出现在 DOM 上。
- 函数的内容不加包裹元素时，`class`、`style` 和事件监听器不会落到它返回的节点上；需要时开启 `wrap`，或在渲染函数里自行添加。
- 渲染内容、文案和样式均由调用方提供，组件不提供独立主题样式或内置文案。

### 与旧版本的差异

旧版本只接收渲染函数，并把写在组件上的属性全部透传给函数返回的根节点。现在：

- `class`、`style` 和事件监听器不再落到函数返回的根节点，也不再出现在函数的第一个参数里。需要时开启 `wrap`（落在包裹元素上），或在渲染函数里自行添加；自定义事件仍可通过 `context.emit` 触发。
- 其他属性只作为函数的参数，不再出现在 DOM 上。
- `tag`、`wrap` 是组件自己的属性，不再传给函数。
- Countdown、Counter 的 `render` 与 ActionSheet 的函数内容随之调整：组件的 class 在外层元素上，函数返回的内容放在它里面。

各组件的内容属性同时有以下变化：

- 字符串不再按 HTML 渲染。Modal、Drawer、Message、Toast、Notice、Popconfirm、Popover、Tour、Alert、Tabs、Steps、Timeline、Marquee、ActionSheet、移动端 Picker 的标题、TableColumn 的 `tooltip` 需要 HTML 时，改传 `{ type: 'html', value }`。
- RadioButton 的 `label` 为 `0` 时正常显示。
- 移动端 Tabs 的标签（包括渲染函数与插槽）统一放在一个 `span` 内。
- Select、Picker 的 render 类属性只应传函数；传入其它类型的值不再被忽略。

### 移动端

`MCustomer` 是 `Customer` 的别名，可从 `@deot/vc` 导入，属性及渲染行为完全相同。
