## 主题映射（Theme）

将变量名映射为元素的文字色、背景、边框、图片及伪类样式，支持 CSS 自定义属性和 JavaScript 变量表。

### 何时使用

需要让业务内容随自定义变量切换外观，或通过变量表切换图片资源时使用。组件不提供默认主题色，变量和切换状态由调用方维护。

### 基础用法

颜色属性传入不带 `--` 的变量名。没有 JavaScript 映射时，`color="demo-text"` 生成 `color: var(--demo-text)`。示例变量只作用于局部容器。

:::playground
```vue
<template>
	<div class="theme-demo" :data-mode="dark ? 'dark' : 'light'">
		<div class="theme-demo__toolbar">
			<ThemeText color="demo-text">当前预览：{{ dark ? '暗色' : '亮色' }}</ThemeText>
			<Button size="small" type="primary" @click="dark = !dark">
				切换主题
			</Button>
		</div>
		<ThemeView
			class="theme-demo__card"
			background-color="demo-surface"
			border-color="demo-border"
			:pseudo="{ ':hover > span': { color: 'demo-accent' } }"
		>
			<ThemeText color="demo-text">将鼠标移到卡片上，文字变为强调色。</ThemeText>
		</ThemeView>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, ThemeView, ThemeText } from '@deot/vc';

const dark = ref(false);
</script>

<style scoped>
.theme-demo {
	--demo-text: #243247;
	--demo-surface: #f5f7fa;
	--demo-border: #b6c2d1;
	--demo-accent: #245ac2;
	padding: 20px;
}
.theme-demo__toolbar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16px;
}
.theme-demo[data-mode="dark"] {
	--demo-text: #e5eaf2;
	--demo-surface: #202938;
	--demo-border: #64748b;
	--demo-accent: #93c5fd;
}
.theme-demo__card {
	margin-top: 12px;
	padding: 16px;
	border: 1px solid;
}
</style>
```
:::

### JavaScript 变量与图片

`variables` 为当前实例提供具体 CSS 值或图片地址。此示例切换文字、背景与内嵌 SVG 图片；子组件需要分别传入变量表。

:::playground
```vue
<template>
	<div style="padding: 20px">
		<div class="theme-vars__toolbar">
			<ThemeText color="text">当前变量表：{{ dark ? '暗色' : '亮色' }}</ThemeText>
			<Button size="small" type="primary" @click="dark = !dark">
				切换变量表
			</Button>
		</div>
		<Theme
			tag="section"
			:variables="variables"
			color="text"
			background-color="surface"
			class="theme-vars__card"
		>
			<p class="theme-vars__description">当前文字和背景来自局部变量表。</p>
			<div class="theme-vars__images">
				<ThemeImage :variables="variables" src="image" alt="主题色块" width="64" height="64" />
				<ThemeView
					:variables="variables"
					background-image="image"
					background-size="cover"
					aria-label="背景主题色块"
				/>
			</div>
		</Theme>
	</div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { Button, Theme, ThemeView, ThemeImage, ThemeText } from '@deot/vc';

const dark = ref(false);
const variables = computed(() => {
	const fill = dark.value ? '#93c5fd' : '#245ac2';
	const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">'
		+ '<rect width="64" height="64" fill="' + fill + '"/></svg>';
	return {
		text: dark.value ? '#e5eaf2' : '#243247',
		surface: dark.value ? '#202938' : '#f5f7fa',
		image: 'data:image/svg+xml,' + encodeURIComponent(svg)
	};
});
</script>

<style scoped>
.theme-vars__toolbar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16px;
}
.theme-vars__card {
	display: block;
	margin-top: 12px;
	padding: 20px;
}
.theme-vars__description {
	margin: 0 0 16px;
}
.theme-vars__images {
	display: flex;
	gap: 12px;
}
.theme-vars__images > * {
	width: 64px;
	height: 64px;
	border-radius: 8px;
}
</style>
```
:::

## API

### 属性

四个组件共享下列属性。`Theme` 的 `tag` 默认是 `span`；`ThemeView`、`ThemeText`、`ThemeImage` 分别固定渲染 `div`、`span`、`img`，传入 `tag` 不会改变快捷组件的标签。

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| tag | `Theme` 渲染的 HTML 标签 | `string` | - | `'span'` |
| color | 文字颜色的变量名 | `string` | - | - |
| borderColor | 边框颜色的变量名；宽度和线型需自行设置 | `string` | - | - |
| backgroundColor | 背景颜色的变量名 | `string` | - | - |
| backgroundImage | 图片地址或图片变量名，解析后包装为 `url(...)` | `string` | - | - |
| backgroundSize | 背景尺寸，仅设置 `backgroundImage` 时生效 | `string` | CSS `background-size` 值 | `'cover'` |
| src | 图片地址或图片变量名，仅渲染 `img` 时生效 | `string` | - | - |
| variables | 当前实例的变量映射表 | `object` | - | `{}` |
| pseudo | 完整 CSS 字符串，或选择器到声明的映射 | `string \| object` | - | - |

### 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 元素内容；`ThemeImage` 渲染 `img`，不应提供子内容 | - |

没有自定义事件或公开实例方法。`class`、`style`、`alt`、原生事件监听器等 attributes 透传到根元素。移动端入口导出相同的四个组件，没有单独的 `MTheme` 别名。

### 变量解析与全局配置

颜色及对象形式的伪类声明按以下优先级取第一个真值：当前实例 `variables[name]` → `VcInstance.options.Theme.variables[name]` → `var(--name)`。空字符串继续回退，映射值不会递归解析。局部变量表不向子组件注入。

使用公开配置入口设置全局变量：

```ts
import { VcInstance } from '@deot/vc';

VcInstance.configure({
	Theme: {
		variables: {
			'brand-text': '#245ac2',
			'brand-image': '/assets/brand.svg'
		}
	}
});
```

`src` 和 `backgroundImage` 当前以字符串是否包含 `:` 判断直接地址（例如 `https:`、`data:`）；不含 `:` 的值按变量名查找，相对路径应放入变量表。`src` 不回退到 CSS 变量，未找到映射时不生成 `src`。背景图片应使用直接地址或 JavaScript 映射，未映射时生成的 `url(var(--name))` 不能作为可靠的 CSS 图片变量用法。

### 伪类和伪元素

对象形式示例：`{ before: { backgroundColor: 'accent' }, ':hover > span': { color: 'text' } }`。选择器拼接到当前实例生成的 class 后，不以 `:` 开头时自动补一个 `:`。声明属性转换为 kebab-case，值按变量名解析，并附加 `!important`。伪元素的 `content`、尺寸等可在调用方样式中声明；声明也可使用原始 CSS 字符串，例如 `{ before: 'content: ""; display: block;' }`。

顶层字符串作为完整 CSS 原样插入，不自动限定实例范围。当前伪类样式在 `pseudo` 或全局变量表引用变化时重建；仅修改局部 `variables` 不会触发重建。需要动态映射时可同步替换 `pseudo` 对象，或使用基础示例中的 CSS 变量。

### 与组件库主题的关系

本组件不自动切换组件库的 SCSS 主题，也不自动添加 `vc-` 前缀。引用已有的 `--vc-color-primary` 时传入 `color="vc-color-primary"`。`VcInstance.options.Theme.variables` 是此组件的 JavaScript 映射配置，与共享 SCSS token 系统独立。
