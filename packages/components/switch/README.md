## 功能（Switch）

开关选择器

### 何时使用

- 需要表示开关状态/两种状态之间的切换时；
- 和 `checkbox` 的区别是，切换 `switch` 会直接触发状态改变，而 `checkbox` 一般用于状态标记，需要和提交操作配合。

### 基础用法

:::RUNTIME
```vue
<template>
	<div class="v-switch-basic">
		<Switch v-model="single" @change="handleChange" />
	</div>
</template>

<script setup >
import { Switch } from '@deot/vc';

const single = ref(true);

const handleChange = (status) => {
	console.log(status);
};
</script>
```
:::

### 自定义开关文案
使用`open-text`、`close-text`自定义开闭文案。

:::RUNTIME
```vue
<template>
	<div class="v-switch-basic">
		<Switch
			:value="open"
			open-text="开"
			close-text="闭"
			@change="handleChange"
		/>

	</div>
</template>
<script setup >
import { Switch } from '@deot/vc';

const open = ref(true);
</script>
```
:::

### 禁用状态
使用 `disabled` 控制禁用状态。

:::RUNTIME
```vue
<template>
	<div class="v-switch-basic">
		<Switch :value="true" disabled />
		<Switch :value="false" disabled />
	</div>
</template>
<script setup>
import { Switch } from '@deot/vc';
</script>
```
:::

### 自定义开关值
使用 `true-value`、`false-value` 自定义开关值 (默认：boolean)。

:::RUNTIME
```vue
<template>
	<div class="v-switch-basic">
		<Switch v-model="single" :true-value="1" :false-value="0" @change="handleChange" />
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Switch } from '@deot/vc';

const single = ref(1);

const handleChange = (status) => {
	console.log({
		single: this.single,
		other: arguments[0]
	});
};
</script>
```
:::

### 自定义开闭显示内容
使用 slot `open`、`close` 自定义开关内容。

:::RUNTIME
```vue
<template>
	<div class="v-switch-basic">
		<Switch :value="single" @change="handleChange" >
			<template v-slot:open>
				<span >ON</span>
			</template>
			<template v-slot:close>
				<span >OFF</span>
			</template>
		</Switch>
	</div>
</template>
<script setup>
import { Switch } from '@deot/vc';

const single = ref(true);

const handleChange = (status) => {
	console.log(status);
};
</script>
```
:::

## API

### 属性
属性 | 说明 | 类型 | 可选值 | 默认值
---|---|---|---|---
modelValue | 指定当前是否选中，可以使用 v-model 双向绑定数据 | `string`、`number`、`boolean` | - | `false`
disabled | 禁用开关 | `boolean` | - | `false`
true-value | 选中时的值，当使用类似 1 和 0 来判断是否选中时会很有用 | `string`、`number`、`boolean` | - | `true`
false-value | 没有选中时的值，当使用类似 1 和 0 来判断是否选中时会很有用 | `string`、`number`、`boolean` | - | `false`
open-text | 选中时的文案 | `string` | - | -
close-text | 没有选中时的文案 | `string` | - | -
name | 内部input标签name值 | `string` | - | -

### 事件
事件名 | 说明 | 回调参数 | 参数
---|---|---|---|---
change | 开关变化时触发，返回当前的状态 | `(value: string | number | boolean) => void 0` | `value`：当前绑定的值

### Slot
属性 | 说明
---|---
open | 自定义显示打开时的内容
close | 自定义显示关闭时的内容
