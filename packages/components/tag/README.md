## 功能（Tag）
进行标记和分类的小标签

### 何时使用
- 用于标记事物的属性和维度。
- 进行分类。

### 基础用法
使用 `type`、`color` 控制标签的样式

:::RUNTIME
```vue
<template>
	<div class="v-tag-basic">
		<Tag type="border" color="default">标签一</Tag>
		<Tag type="border" color="primary">标签一</Tag>
		<Tag type="border" color="success">标签一</Tag>
		<Tag type="border" color="warning">标签一</Tag>
		<Tag type="border" color="error">标签一</Tag>
		<br>
		<Tag type="dot" color="default">标签一</Tag>
		<Tag type="dot" color="primary">标签一</Tag>
		<Tag type="dot" color="success">标签一</Tag>
		<Tag type="dot" color="warning">标签一</Tag>
		<Tag type="dot" color="error">标签一</Tag>
	</div>
</template>

<script setup>
import { Tag } from '@deot/vc';
</script>
```
:::

### 是否可以关闭
使用 `closable`控制标签是否可以关闭，需要配合`close`事件实现关闭效果。

:::RUNTIME
```vue
<template>
	<div class="v-tag-basic">
		<template v-for="tag in borderTags">
			<Tag
				v-if="tag.show"
				:key="tag.name"
				:color="tag.color"
				closable
				type="border"
				@close="handleClose(tag)">
				{{tag.name}}
			</Tag>
		</template>
		<br><br>
		<template v-for="tag in dotTags">
			<Tag
				v-if="tag.show"
				:key="tag.name"
				:color="tag.color"
				closable
				type="dot"
				@close="handleClose(tag)">
				{{tag.name}}
			</Tag>
		</template>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Tag } from '@deot/vc';

const borderTags = ref([{
	show: true,
	name:'标签'
}, {
	show: true,
	name: '标签一',
	color: 'primary'
}, {
	show: true,
	name: '标签二',
	color: 'success'
}, {
	show: true,
	name: '标签三',
	color: 'error'
}, {
	show: true,
	name: '标签四',
	color: 'warning'
}]);
const dotTags = ref([{
	show: true,
	name:'点类型标签'
}, {
	show: true,
	name: '点类型标签一',
	color: 'primary'
}, {
	show: true,
	name: '点类型标签二',
	color: 'success'
}, {
	show: true,
	name: '点类型标签三',
	color: 'error'
}, {
	show: true,
	name: '点类型标签四',
	color: 'warning'
}]);
const handleClose = (tag) => {
	tag.show = false;
};
</script>
```
:::

### 选中功能及状态
使用 `checkable`、`checked` 控制标签是否可以切换选择状态及有没有被选中

:::RUNTIME
```vue
<template>
	<div class="v-tag-basic">
		<Tag checkable name="标签" @change="handleChange">
			标签
		</Tag>
		<Tag checkable color="primary" name="标签一" @change="handleChange">
			标签一
		</Tag>
		<Tag checkable :checked="false" color="success" name="标签二" @change="handleChange">
			标签二
		</Tag>
		<Tag checkable checked color="error" name="标签三" @change="handleChange">
			标签三
		</Tag>
		<Tag checkable :checked="false" color="warning" name="标签四" @change="handleChange">
			标签四
		</Tag>
	</div>
</template>

<script setup>
import { Tag } from '@deot/vc';

const handleChange = (isChecked, name) => {
	console.log(isChecked);
	console.log(name);
};
</script>
```
:::

### 当前标签名称
使用`name`设置当前标签的名称，当使用 v-for，并支持关闭时，会比较有用

:::RUNTIME
```vue
<template>
	<div class="v-tag-basic">
		<Tag
			v-for="item in count"
			:key="item"
			:name="item"
			closable
			color="primary"
			@close="handleClose"
		>
			标签{{ item + 1 }}
		</Tag>
		<span @click="handleAdd">添加标签</span>
	</div>
</template>

<script setup>
import { Tag } from '@deot/vc';

const count = ref([0, 1, 2]);

const handleAdd = () => {
	if (count.value.length) {
		count.value.push(count.value[count.value.length - 1] + 1);
	} else {
		count.value.push(0);
	}
};

const handleClose = (event, name) => {
	const index = count.value.indexOf(name);
	count.value.splice(index, 1);
};

</script>
```
:::

## API

### 基础属性

| 属性        | 说明                            | 类型                | 可选值                                             | 默认值       |
| --------- | ----------------------------- | ----------------- | ----------------------------------------------- | --------- |
| closable  | 标签是否可以关闭                      | `boolean`         | -                                               | `false`   |
| checkable | 标签是否可以选择                      | `boolean`         | -                                               | `false`   |
| checked   | 标签的选中状态                       | `boolean`         | -                                               | `true`    |
| type      | 标签的样式类型                       | `string`          | `default`、`border`、`dot`                        | `default` |
| color     | 标签颜色，你也可以自定义颜色值。              | `string`          | `default`、`primary`、`success`、`warning`、`error` | `default` |
| name      | 当前标签的名称，使用 v-for，并支持关闭时，会比较有用 | `string`、`number` | -                                               | -         |


### 事件

| 事件名    | 说明        | 回调参数                                        | 参数说明                                     |
| ------ | --------- | ------------------------------------------- | ---------------------------------------- |
| close  | 关闭时触发     | `(event: Event, name: string \ number)`     | `event`：事件对象；`name`：当前`tag`的`name`标识     |
| change | 切换选中状态时触发 | `(checked: boolean, name: string \ number)` | `checked`：当前选择状态；`name`：当前`tag`的`name`标识 |

