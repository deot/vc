## 分割线（Divider）

区隔内容的分割线。移动端入口导出的 `MDivider` 与 `Divider` 的属性和插槽相同，尺寸按 750 稿随 `--vc-rem` 缩放，见 [移动端](#移动端)。

### 何时使用

用于分隔不同内容段落，或在行内分隔相邻的文字与操作。

### 基础用法

默认显示水平分割线，自带 `24px` 的上下外边距。通过默认插槽添加内容，使用 `placement` 设置内容在分割线上的位置。线由伪元素画出，文字两侧留空，放在任意背景上都不需要底色遮挡。

:::playground
<!--
<config lang="json5">
{
	views: ['runtime', 'files'],
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="divider-demo">
		<section class="divider-demo__section">
			<h4>基础分割线</h4>
			<p>用于分隔两个独立的内容区块。</p>
		</section>
		<Divider />
		<section class="divider-demo__section">
			<h4>带标题的分割线</h4>
			<p>标题可以显示在分割线的左侧、居中或右侧。</p>
		</section>
		<Divider placement="left">左侧标题</Divider>
		<p class="divider-demo__content">左侧标题适合标记新内容的开始。</p>
		<Divider>居中标题</Divider>
		<p class="divider-demo__content">居中标题适合强调并列内容的层次。</p>
		<Divider placement="right">右侧标题</Divider>
		<p class="divider-demo__content">右侧标题可用于补充说明或状态。</p>
	</div>
</template>

<script setup>
import { Divider } from '@deot/vc';
</script>

<style scoped>
.divider-demo__section {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.divider-demo__section h4 {
	margin: 0;
	font-size: 16px;
}

.divider-demo__section p,
.divider-demo__content {
	margin: 0;
	color: var(--vc-color-dark-lightest);
	line-height: 1.7;
}
</style>
```
:::

### 竖向分割线

设置 `vertical` 后用于行内分隔，自带 `12px` 的左右外边距；此时不渲染默认插槽，`placement` 不生效。

:::playground
<!--
<config lang="json5">
{
	views: ['runtime', 'files'],
	previewInset: 16
}
</config>
-->
```vue
<template>
	<nav class="divider-demo" aria-label="内容导航">
		<a href="#overview">概览</a>
		<Divider vertical />
		<a href="#details">详情</a>
		<Divider vertical />
		<a href="#history">更新记录</a>
	</nav>
</template>

<script setup>
import { Divider } from '@deot/vc';
</script>

<style scoped>
.divider-demo {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	font-size: 14px;
}

.divider-demo a {
	color: var(--vc-color-primary);
	text-decoration: none;
}
</style>
```
:::

### 虚线

设置 `dashed` 显示虚线，水平与竖向都适用。线宽、线型也可以通过局部变量 `--vc-divider-line-width`、`--vc-divider-line-style` 覆盖，下例最后一条在行内设置了 `--vc-divider-line-style`。

:::playground
<!--
<config lang="json5">
{
	views: ['runtime', 'files'],
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="divider-demo">
		<Divider dashed />
		<Divider dashed placement="left">虚线文字</Divider>
		<div class="divider-demo__inline">
			<span>选项一</span>
			<Divider vertical dashed />
			<span>选项二</span>
		</div>
		<Divider style="--vc-divider-line-style: dotted;">点线</Divider>
	</div>
</template>

<script setup>
import { Divider } from '@deot/vc';
</script>

<style scoped>
.divider-demo__inline {
	display: flex;
	align-items: center;
}
</style>
```
:::

## 移动端

`MDivider` 的属性、插槽、结构与 `Divider` 相同，根节点另有标记类 `.vcm-divider`，结构样式与主题参数共用。尺寸按 750 稿设计，写为 `calc(var(--vc-rem) * n)`，随 `--vc-rem` 缩放；水平分割线自带四周 32 的内边距，可直接通栏放置。底栏切换 `rem` 可查看不同屏宽下的效果。

:::playground
<!--
<config lang="json5">
{
	mobile: true,
	previewInset: [12, 0],
	previewVariables: [{
		name: '--rem',
		label: 'rem',
		values: ['auto', '0.5px', '0.552px', '0.64px', '1px']
	}]
}
</config>
-->
```vue
<template>
	<div class="m-divider-demo">
		<MDivider />
		<MDivider>居中文字</MDivider>
		<MDivider placement="left">左侧文字</MDivider>
		<MDivider placement="right">右侧文字</MDivider>
		<MDivider dashed />
		<MDivider dashed>虚线文字</MDivider>
		<div class="m-divider-demo__gray">
			<MDivider>没有更多了</MDivider>
		</div>
		<div class="m-divider-demo__inline">
			<span>选项一</span>
			<MDivider vertical />
			<span>选项二</span>
			<MDivider vertical dashed />
			<span>选项三</span>
		</div>
	</div>
</template>

<script setup>
import { MDivider } from '@deot/vc';
</script>

<style scoped>
.m-divider-demo {
	display: flex;
	flex-direction: column;
}

.m-divider-demo__gray {
	background: var(--vc-background-color-light);
}

.m-divider-demo__inline {
	display: flex;
	align-items: center;
	padding: calc(var(--vc-rem) * 32);
	font-size: calc(var(--vc-rem) * 28);
}
</style>
```
:::

尺寸对比如下（括号内为 375 宽下的 px）：

| 项 | `Divider` | `MDivider`（750 稿） |
| --- | --- | --- |
| 外边距 | `24px 0` | 无 |
| 内边距（水平分割线四周） | 无 | 32（16） |
| 高度 | `1px`，文字在高度方向溢出、不占高度 | 随文字 |
| 文字 | 14px、500、`color-dark` | 28（14）、400、`color-dark-lighter` |
| 文字与线的间距 | `20px` | 24（12） |
| 文字在左 / 右侧时的短线 | `20px` | 56（28） |
| 竖线的左右外边距 | `12px` | 24（12） |
| 线宽 | `1px` | 高分屏 0.5px |

## 主题与局部覆盖

全局参数通过 `--vc-<参数>` 配置，单个组件通过 `--vc-divider-<参数>` 覆盖。同一参数可能作用于多个状态；多命名空间时在使用位置中标明。

### 全局

| 参数 | 使用位置 | 值 |
| --- | --- | --- |
| color-dark | 分隔文字（`Divider`） | 亮色：`#000000`；暗色：`#FFFFFF` |
| color-dark-lighter | 分隔文字（`MDivider`） | 亮色：`#515151`；暗色：`#D9D9D9` |
| color-neutral-light | 分隔线 | 亮色：`#EDEFF1`；暗色：`#3B4354` |

### 局部

两端的尺寸都写成局部变量 `--vc-divider-<键>`，桌面端的默认值见下表，`MDivider` 在 `.vcm-divider` 上覆盖，与样式的加载顺序无关。

| 参数 | 使用位置 | 默认值 |
| --- | --- | --- |
| margin | 水平分割线的外边距 | `24px 0` |
| height | 水平分割线的高度 | `1px` |
| vertical-margin | 竖线的外边距 | `0 12px` |
| gap | 文字与两侧线的间距 | `20px` |
| side-width | 文字在左 / 右侧时该侧短线的宽度 | `20px` |
| font-size / font-weight | 文字 | `14px` / `500` |
| text-color | 文字颜色 | `color-dark` |
| line-width / line-style | 线宽 / 线型（`dashed` 时为虚线） | `1px` / `solid` |

## API

`MDivider` 的属性、插槽与 `Divider` 相同，可从 `@deot/vc` 导入。

### 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| vertical | 是否显示竖向分割线 | `boolean` | - | `false` |
| placement | 水平分割线插槽内容的位置，仅在 `vertical` 为 `false` 时生效 | `string` | `left` / `center` / `right` | `center` |
| dashed | 是否显示虚线 | `boolean` | - | `false` |

### 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 水平分割线中间的内容，竖向模式下不渲染 | - |

<!--
## 变更说明

### 线改由伪元素画出
- 原先根节点用背景色画线，文字绝对定位并用 `background-color-lightest` 底色遮住线，放在灰底、暗色容器里时文字周围会露出一块底色。
- 现在线由根节点的 `::before` / `::after` 画出，文字夹在中间；白底上的效果不变，不再使用主题参数 `background-color-lightest`。
- 位置类名 `is-left` / `is-center` / `is-right` 由 `.vc-divider__text` 移到根节点，有文字时根节点另有 `is-with-text`。
- 竖线改用 `border-left` 绘制，尺寸不变。
-->
