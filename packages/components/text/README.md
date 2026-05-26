## 文本（Text）
文字容器 

### 何时使用
需要对文本内容机型行数限制（必要时父元素给固定宽度最好）。

### 基础用法
通过`value`绑定要显示的文本内容，`line`控制要显示的文本行数。

:::RUNTIME
```vue
<template>
	<div>
		<Button @click="handleClick">
			切换行数
		</Button>
		<div :style="{ width: width + 'px' }">
			<h3>line: {{ line0 }} </h3>
			<Text :value="text14" :line="line0" />
			<h3>line: {{ line1 }} </h3>
			<Text :value="text16" :line="line1" />
			<h3>line: {{ line2 }} </h3>
			<Text :value="text18" :line="line2" />
			<h3>line: {{ line3 }} </h3>
			<Text :value="text30" :line="line3" />
		</div>
	</div>
</template>
<script>
import { ref } from 'vue';
import { Text, Button } from '@deot/vc';

const text = 'A2，C,我E,';
const width = ref(500);
const text10 = ref(text.repeat(10));
const text12 = ref(text.repeat(12));
const text14 = ref(text.repeat(14));
const text16 = ref(text.repeat(16));
const text18 = ref(text.repeat(18) + 'REPEAT_END_18');
const text30 = ref(text.repeat(30) + 'REPEAT_END_30');
const line0 = ref(0);
const line1 = ref(1);
const line2 = ref(2);
const line3 = ref(3);

const handleClick = () => {
	if (line0.value === 0) {
		line0.value = 3;
		line1.value = 2;
		line2.value = 1;
		line3.value = 0;
	} else {
		line0.value = 0;
		line1.value = 1;
		line2.value = 2;
		line3.value = 3;
	}
};
</script>
```
:::

### 自定义结尾
通过`ellipsis`自定义结尾内容。

:::RUNTIME
```vue
<template>
	<div style="width: 500px;">
		<Text
			:value="text10"
			:line="2"
			:indent="1"
			ellipsis="我是自定义结尾" />
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Text } from '@deot/vc';

const text = 'A2，C,我E,';

const width = ref(500);
const text10 = ref(text.repeat(50));
</script>
```
:::

### 保留尾部（slice 模式）
通过`slice`指定一段固定保留的尾部，语义等价 `value.slice(slice)`：
- `slice = -5`：保留末尾 5 个字符，渲染如 `abc...lmnop`
- `slice = 0`：尾部 = 整串，省略号被置于最前 `...完整文本`
- `slice = N`（正整数）：尾部 = `value.slice(N)`，从指定下标开始保留

:::RUNTIME
```vue
<template>
	<div style="width: 500px;">
		<h4>slice = -5</h4>
		<Text :value="text" :line="2" :slice="-5" />
		<h4>slice = 0</h4>
		<Text :value="text" :line="2" :slice="0" />
		<h4>slice = -8 + 自定义 ellipsis</h4>
		<Text :value="text" :line="2" :slice="-8" ellipsis=" ··· " />
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Text } from '@deot/vc';

const text = ref(('A2，C,我E,'.repeat(20)) + 'REPEAT_END');
</script>
```
:::

## API

### 属性

| 属性          | 说明                                                                                                                                                       | 类型                        | 可选值                                                                                                                                   | 默认值       |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| tag         | 渲染的节点类型                                                                                                                                                  | `string`                  | -                                                                                                                                     | div       |
| value       | 渲染的文本                                                                                                                                                    | `string`                  | -                                                                                                                                     | -         |
| line        | 行数,为0时默认显示全部                                                                                                                                             | `Number`                  | -                                                                                                                                     | 0         |
| indent      | 缩进                                                                                                                                                       | `Number`                  | -                                                                                                                                     | 0         |
| ellipsis    | 截断时使用的省略符号                                                                                                                                               | `string`                  | -                                                                                                                                     | '...'     |
| slice       | 尾部固定保留段的起点，等价 `value.slice(slice)`。负数保留末尾 N 个字符（如 `-5` → `abc...lmnop`）；`0` 时整串作为尾部，省略号置首；正数从指定下标开始保留；不传或越界时退化为仅末尾追加 `ellipsis` | `Number`                  | -                                                                                                                                     | undefined |
| renderRow   | 自定义渲染                                                                                                                                                    | `Function`                | -                                                                                                                                     | -         |
| placement   | 弹层的位置                                                                                                                                                    | `string`                  | `top`、`left`、`right`、`bottom`、`bottom-left`、`bottom-right`、`top-left`、`top-right`、`right-top`、`right-bottom`、`left-top`、`left-bottom` | `top`     |
| portalClass | 外层类名                                                                                                                                                     | `object`、`string`、`Array` | -                                                                                                                                     | -         |
| portalStyle | 样式                                                                                                                                                       | `object`                  | -                                                                                                                                     | -         |
| resize      | 是否启用resize                                                                                                                                               | `number`、`boolean`        | 100                                                                                                                                   | -         |
