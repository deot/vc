## 组件中文名称（Theme）
用于主题管理（针对css variables）

### 何时使用
需要有主题控制的组件

- 字体颜色（color）
- 背景颜色（background-color）
- 背景图片 (background-image)
- 边颜色（border-color）
- 伪元素 (before, after)
- 图片资源（img标签，src）


### 基础用法

- `Theme`: tag默认为span
- `ThemeView`: tag默认为div
- `ThemeText`: tag默认为span
- `ThemeImage`: tag默认为img

:::RUNTIME
```html
<template>
	<div style="padding: 20px">
		<Button 
			@click="handleChange"
		>
			当前主题：{{ current }}
		</Button>

		<Theme>
			<Theme>
				文字颜色：不设置
			</Theme>
		</Theme>
		
		<ThemeView>
			<ThemeText>
				文字颜色：不设置
			</ThemeText>
		</ThemeView>

		<ThemeView 
			:pseudo="{
				before: {
					background: 'color-before',
				},
				':hover > span': {
					color: 'color-hover',
				}
			}"
			background-color="color-background" 
			border-color="color-border"
			class="v-theme__block"
		>
			<ThemeText color="color-primary">
				文字颜色：跟随主题
			</ThemeText>
		</ThemeView>
	</div>
</template>
<script setup>
import { ref } from 'vue'; 
import { Theme, ThemeView,ThemeText, ThemeImage, Button } from '@deot/vc';

const current = ref('light');
const handleChange = () => {
	current.value = current.value === 'dark' 
		? "light"
		: "dark";

	document.body.setAttribute("data-theme", current.value);
}
</script>

<style lang="scss">
:root {
	--color-primary: #000;
	--color-border: red;
	--color-background: white;
	--color-before: green;
	--color-hover: pink;
}

[data-theme="dark"] {
	--color-primary: #fff;
	--color-border: blue;
	--color-background: #000;
	--color-before: yellow;
	--color-hover: orange;
}

.v-theme__block {
	display: inline-block; 
	padding: 10px 5px; 
	border-width: 2px; 
	border-style: solid;
	&:before {
		width: 100%;
		height: 5px;
		content: ' ';
		display: block;
	}
}
</style>

```
:::

## API

### 属性

| 属性              | 说明     | 类型                | 可选值 | 默认值     |
| --------------- | ------ | ----------------- | --- | ------- |
| tag             | HTML标签 | `string`          | -   | span  |
| color           | 字体颜色   | `string`          | -   |       |
| borderColor     | 边颜色    | `string`          | -   |       |
| backgroundColor | 背景颜色   | `string`          | -   | cover |
| backgroundImage | 背景图片   | `string`          | -   |       |
| backgroundSize  | 文字颜色   | `string`          | -   |       |
| src             | 图片资源   | `string`          | -   |       |
| pseudo          | 伪元素、类  | `string`、`object` | -   |       |


### `backgroundImage`, `src`, 以及兼容处理

- VcIntance下的配置

```js
{
	Theme: {
		variables: {
			'main-color': '#fff', // 优先作用，可处理css兼容
			'main-image-src': 'https:\/\/**', // key可以找到对应的src资源
			'main-background-image': 'https:' // 同上

			// 以color为例
			'main-color-1': 'main', // 不会生效，生效结果为 main 而不是 var(--main), 要具体的值
			'main-color-2': '' // 结果为 var(--main-color-2)
		}
	}
}
```

### 颜色主题设置
```
{
	'main-color': 'red', // 建议使用当前不含颜色标识的key值
	'color-red': 'red' // 不建议出现具体的key有颜色标识的值，这样不利于主题修改
}
```
