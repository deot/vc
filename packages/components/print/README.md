## 打印（Print）

展示待打印内容，通过组件实例的 `print()` 方法调用浏览器打印功能。`MPrint` 与 `Print` 使用同一实现。

### 何时使用

需要打印页面中的一段内容，或调用方提供的 HTML 内容时。

### 基础用法

通过默认插槽定义打印内容，点击按钮调用 `print()`。

:::playground
<!--
<config lang="json5">
{ previewInset: 16 }
</config>
-->
```vue
<template>
	<div>
		<Print ref="pageTarget">
			<h3>订单明细</h3>
			<p>商品：笔记本 × 2</p>
			<p>合计：20 元</p>
		</Print>
		<Button @click="handlePrint">
			打印订单
		</Button>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Print, Button } from '@deot/vc';

const pageTarget = ref();
const handlePrint = () => {
	pageTarget.value.print();
};
</script>
```
:::

### 打印 HTML 内容

非空的 `value` 通过 `innerHTML` 渲染，并优先于默认插槽。`value` 为空字符串或未传入时，渲染默认插槽。仅传入可信的 HTML，组件不会进行内容清洗。

:::playground
<!--
<config lang="json5">
{ previewInset: 16 }
</config>
-->
```vue
<template>
	<div>
		<Print ref="pageTarget" :value="content" />
		<Button @click="handlePrint">
			打印通知
		</Button>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Print, Button } from '@deot/vc';

const pageTarget = ref();
const content = '<h3>会议通知</h3><p>请于下午三点到会议室参会。</p>';
const handlePrint = () => {
	pageTarget.value.print();
};
</script>
```
:::

## API

### 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| value | 待打印的 HTML 字符串；非空时覆盖默认插槽 | `string` | - | - |
| tag | 已声明但当前未用于渲染，根节点始终为 `div` | `string \| object \| Function` | - | `'div'` |

### 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | `value` 为空或未传入时展示的打印内容 | - |

### 方法

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| print | 通过组件 ref 调用，克隆当前内容并调用 `window.print()` | - | `void` |

### 注意事项

- 组件没有自定义事件，不提供 `before` / `after` 打印钩子。
- `print()` 临时隐藏 `document.body` 下内联 `display` 不为 `none` 的直接子 `div`，将内容克隆到新的 `div` 后调用浏览器打印。调用返回后删除克隆节点，并移除被隐藏节点的内联 `display`；原有的 `flex`、`grid` 等内联值不会恢复。
- `body` 下非 `div` 的直接子元素不会被隐藏，仍可能出现在打印结果中。打印内容的样式依赖当前页面，克隆内容也可能失去原祖先选择器的样式。
- 方法不返回打印结果，也不表示用户已经确认打印；打印对话框和最终输出由浏览器控制。
