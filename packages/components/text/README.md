## 文本（Text）

根据容器宽度限制文本行数，截断后可悬停查看全文。

### 何时使用

需要限制长文本的展示行数，或省略中间内容并保留尾部信息。父容器应提供可测量的宽度。

### 基础用法

通过`value`绑定要显示的文本内容，`line`控制要显示的文本行数。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<div class="text-demo">
		<div class="text-demo__toolbar">
			<span>显示行数</span>
			<InputNumber v-model="line" :min="1" :max="3" />
		</div>
		<label class="text-demo__editor">
			<span>文本内容</span>
			<Textarea v-model="content" :rows="4" />
		</label>
		<Text :value="content" :line="line" />
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Text, InputNumber, Textarea } from '@deot/vc';

const content = ref('Text 会根据容器宽度和指定行数测量文本，内容超出时自动添加省略符。你可以通过上方输入框调整显示行数，也可以直接编辑这段文案，观察组件如何响应内容变化。悬停截断后的文字，还可以在弹层中查看完整内容。');
const line = ref(1);
</script>

<style scoped>
.text-demo {
	width: 100%;
	max-width: 480px;
}

.text-demo__toolbar {
	display: flex;
	align-items: center;
	gap: 8px;
	margin-bottom: 16px;
}

.text-demo__toolbar :deep(.vc-input-number) {
	width: 120px;
}

.text-demo__editor {
	display: grid;
	gap: 8px;
	margin-bottom: 20px;
}
</style>
```
:::

### 自定义结尾

通过`ellipsis`自定义结尾内容。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<div class="ellipsis-demo">
		<div class="ellipsis-demo__item">
			<span class="ellipsis-demo__label">默认省略符</span>
			<Text :value="content" :line="1" />
		</div>
		<div class="ellipsis-demo__item">
			<span class="ellipsis-demo__label">自定义省略符</span>
			<Text :value="content" :line="1" ellipsis=" ··· 查看更多" />
		</div>
	</div>
</template>

<script setup>
import { Text } from '@deot/vc';

const content = '这是一段较长的说明文字，用来对比默认省略符和自定义省略符的展示效果。';
</script>

<style scoped>
.ellipsis-demo {
	display: grid;
	gap: 20px;
	width: 100%;
	max-width: 320px;
}

.ellipsis-demo__label {
	display: block;
	margin-bottom: 8px;
	font-size: 13px;
	opacity: 0.65;
}
</style>
```
:::

### 保留尾部（slice 模式）

保留的尾部与省略符自身过长时，前缀置空但尾部不会继续裁剪，结果可能超过 `line`，尤其是 `slice = 0`。

通过`slice`指定一段固定保留的尾部，语义等价 `value.slice(slice)`；未超出行数时仍显示原文。

- `slice = -5`：保留末尾 5 个字符，渲染如 `abc...lmnop`
- `slice = 0`：尾部 = 整串，省略号被置于最前 `...完整文本`
- `slice = N`（正整数）：尾部 = `value.slice(N)`，从指定下标开始保留

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<div class="slice-demo">
		<div class="slice-demo__item">
			<span class="slice-demo__label">普通截断</span>
			<Text :value="fileName" :line="1" />
		</div>
		<div class="slice-demo__item">
			<span class="slice-demo__label">保留文件后缀</span>
			<Text :value="fileName" :line="1" :slice="-9" ellipsis="…" />
		</div>
	</div>
</template>

<script setup>
import { Text } from '@deot/vc';

const fileName = '2026年第三季度产品数据分析与复盘报告.final.pdf';
</script>

<style scoped>
.slice-demo {
	display: grid;
	gap: 20px;
	width: 100%;
	max-width: 280px;
}

.slice-demo__label {
	display: block;
	margin-bottom: 8px;
	font-size: 13px;
	opacity: 0.65;
}
</style>
```
:::

## API

### 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| tag | 根节点标签，初始化时确定 | `string` | - | `'div'` |
| value | 原始文本 | `string` | - | `''` |
| line | 测量允许的行数，`0` 显示全文 | `number` | 非负整数 | `0` |
| indent | 测量时叠加到宿主 `text-indent` 的偏移量（px），不直接设置展示样式 | `number` | - | `0` |
| shrink | 根节点的 `flex-shrink`；布尔值转换为 `1` / `0`，数字直接使用；不传时不设置内联值 | `boolean \| number` | 布尔值或非负数字 | `undefined` |
| resize | 尺寸监听；`true` / `0` 立即计算，正数为防抖间隔（ms，首尾触发），`false` 不监听 | `boolean \| number` | - | `100` |
| ellipsis | 截断时使用的省略符 | `string` | - | `'...'` |
| slice | 截断时保留 `value.slice(slice)`；负数从末尾计算，`0` 保留整串，正数从指定下标开始；大于等于文本长度时尾部为空 | `number` | - | `undefined` |
| renderRow | 测量完成后的渲染函数；接收展示文本 `value`、测量下标 `index` 和 Customer 的 setup 上下文，返回可渲染内容 | `(attrs: { value: string; index: number }, context: SetupContext) => any` | - | 返回 `attrs.value` |
| theme | 全文 Popover 的主题 | `string` | `dark`、`light`、`none` | `'dark'` |
| placement | 全文 Popover 的位置 | `string` | `top`、`left`、`right`、`bottom`、`bottom-left`、`bottom-right`、`top-left`、`top-right`、`right-top`、`right-bottom`、`left-top`、`left-bottom` | `'top'` |
| portalClass | 全文 Popover 的类名 | `object \| string \| any[]` | - | `undefined` |
| portalStyle | 全文 Popover 的样式；未提供有效值时使用触发元素宽度，始终附加 `word-break: break-all` | `object \| string \| any[]` | - | `undefined` |

### 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| clip | 每次计算完成时触发，包括未截断时 | `(index: number) => void` | `-1` 表示无需截断；正数为前缀结束下标；`0` 在传入 `slice` 时表示空前缀，未传 `slice` 时仍显示原文 |

### 使用注意

- `MText` 是 `Text` 的别名，属性和事件相同，全文提示仍由鼠标悬停触发。
- 内容通过 `value` 或 `renderRow` 提供；组件没有内容插槽或公开方法。
- 默认在首次尺寸回调前以隐藏全文参与布局。初始化传入 `resize=false` 时不会首次计算，内容为空；后续修改 `value`、`line`、`indent`、`slice` 或 `ellipsis` 仍会触发计算。
- `resize` 的监听与防抖策略在初始化时确定，不支持通过运行时切换该属性重建监听。
- 自定义 `renderRow` 的额外节点不会参与原始文本测量；字号、宽度和省略符应保持可容纳，`line` 不是强制 CSS 裁剪。
