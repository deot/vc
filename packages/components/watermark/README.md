## 水印（Watermark）

在内容上方平铺一层文字或图片水印。`Watermark` 与 `MWatermark` 指向同一个组件。

### 何时使用

- 页面或局部区域需要标识归属、提示内容不可外传。
- 需要给已有的容器（不便改动其结构）补一层水印。

### 基础用法

把内容放进默认插槽，`value` 为水印文字。水印层不响应鼠标事件，不影响内容的交互。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<Watermark value="内部资料">
		<div class="watermark-demo">
			<h4>标题</h4>
			<p>这是一段用于演示的正文内容，水印平铺在它的上方。</p>
			<p>这是一段用于演示的正文内容，水印平铺在它的上方。</p>
		</div>
	</Watermark>
</template>

<script setup>
import { Watermark } from '@deot/vc';
</script>

<style scoped>
.watermark-demo {
	min-height: 240px;
	padding: 16px;
	line-height: 1.7;
}

.watermark-demo h4 {
	margin: 0 0 8px;
	font-size: 16px;
}

.watermark-demo p {
	margin: 0 0 8px;
}
</style>
```
:::

### 多行文字

`value` 传数组时每项一行，逐行居中。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<Watermark :value="['内部资料', '请勿外传']">
		<div style="height: 240px;" />
	</Watermark>
</template>

<script setup>
import { Watermark } from '@deot/vc';
</script>
```
:::

### 图片水印

`src` 为图片地址，优先于 `value`；图片加载失败时回退到 `value`。只传 `width` 或 `height` 时另一边按图片比例计算，都不传时宽为 `100`。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<Watermark :src="src" value="内部资料" :width="120">
		<div style="height: 240px;" />
	</Watermark>
</template>

<script setup>
import { Watermark } from '@deot/vc';

const svg = [
	'<svg xmlns="http://www.w3.org/2000/svg" width="120" height="48" viewBox="0 0 120 48">',
	'<g fill="#808080" fill-opacity=".4">',
	'<circle cx="24" cy="24" r="12"/><rect x="44" y="12" width="64" height="8" rx="4"/><rect x="44" y="28" width="40" height="8" rx="4"/>',
	'</g></svg>'
].join('');
const src = `data:image/svg+xml,${encodeURIComponent(svg)}`;
</script>
```
:::

### 自定义样式

`class` 与 `style` 作用在水印层上，不影响插槽里的内容。文字的颜色、字号、字重、字体与行高取自水印层的样式，`opacity` 等其它样式直接生效。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<div class="watermark-style-demo">
		<Watermark
			value="内部资料"
			:rotate="0"
			:gap="[80, 40]"
			style="font-size: 20px; color: rgb(245 34 45 / 30%);"
		>
			<div class="watermark-style-demo__content">style：字号与颜色</div>
		</Watermark>
		<Watermark value="内部资料" :rotate="30" class="watermark-style-demo__mark">
			<div class="watermark-style-demo__content">class：加粗并跟随主色</div>
		</Watermark>
	</div>
</template>

<script setup>
import { Watermark } from '@deot/vc';
</script>

<style>
.watermark-style-demo {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 16px;
}

.watermark-style-demo__content {
	height: 220px;
	padding: 12px;
	border: 1px solid var(--vc-color-neutral-light);
}

.watermark-style-demo__mark {
	font-weight: bold;
	color: var(--vc-color-primary);
	opacity: .25;
}
</style>
```
:::

### 挂载到指定容器

不使用默认插槽时，水印层通过 `to` 挂到目标容器（CSS 选择器或元素）；`to` 也不传则留在原位，铺满父元素。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<div class="watermark-to-demo">
		<div
			v-for="item in ['a', 'b']"
			:id="`watermark-to-demo-${item}`"
			:key="item"
			class="watermark-to-demo__box"
			@click="current = item"
		>
			点击把水印挂到这里
		</div>
		<div class="watermark-to-demo__box">
			原位（不传 to）
			<Watermark value="原位水印" />
		</div>
	</div>
	<Watermark :to="`#watermark-to-demo-${current}`" value="内部资料" />
</template>

<script setup>
import { ref } from 'vue';
import { Watermark } from '@deot/vc';

const current = ref('a');
</script>

<style scoped>
.watermark-to-demo {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 16px;
}

.watermark-to-demo__box {
	height: 200px;
	padding: 12px;
	cursor: pointer;
	border: 1px solid var(--vc-color-neutral-light);
}
</style>
```
:::

### 满屏

设置 `fullscreen` 后水印层使用固定定位铺满视口，不随页面滚动；默认挂到 `body`，层级为 `5000`，盖住弹层与提示。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<Button @click="isVisible = !isVisible">
		{{ isVisible ? '关闭' : '打开' }}满屏水印
	</Button>
	<Watermark v-if="isVisible" fullscreen value="内部资料" />
</template>

<script setup>
import { ref } from 'vue';
import { Button, Watermark } from '@deot/vc';

const isVisible = ref(false);
</script>
```
:::

## API

### 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| value | 水印文字；数组为多行，空项忽略 | `string \| string[]` | - | - |
| src | 水印图片地址，优先于 `value`；加载失败时回退到 `value` | `string` | - | - |
| width | 旋转前单个水印的宽度，单位为 px；文字超出时被压缩 | `number` | - | 文字：内容宽度；图片：`100` |
| height | 旋转前单个水印的高度，单位为 px | `number` | - | 文字：行数 × 行高；图片：按比例 |
| rotate | 旋转角度 | `number` | - | `-20` |
| gap | 水印之间的间距 `[水平, 垂直]`，单位为 px；数字表示两个方向相同 | `number \| number[]` | - | `100` |
| offset | 首个水印相对容器左上角的偏移 `[水平, 垂直]`，单位为 px；数字表示两个方向相同 | `number \| number[]` | - | `gap` 的一半 |
| zIndex | 水印层的层级；`style` 中写了 `z-index` 时以 `style` 为准 | `number \| string` | - | `1`；`fullscreen` 时为 `5000` |
| to | 水印层挂载的目标：CSS 选择器或元素；使用默认插槽时不生效（`fullscreen` 除外） | `string \| HTMLElement` | - | -；`fullscreen` 时为 `body` |
| fullscreen | 满屏：水印层使用固定定位铺满视口，不随页面滚动 | `boolean` | - | `false` |

`class`、`style` 及其它透传属性绑定在水印层（`.vc-watermark__layer`）上。

### 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 被水印覆盖的内容；使用后由组件渲染外层 `.vc-watermark` 并把水印层放在其中 | - |

### 样式

文字水印由画布绘制，以下样式从水印层读取：

| 样式 | 默认值 |
| --- | --- |
| `color` | `var(--vc-watermark-color, rgb(128 128 128 / 20%))` |
| `font-size` | `var(--vc-watermark-font-size, var(--vc-font-size))`，即 `14px` |
| `font-weight`、`font-style` | `normal` |
| `font-family` | 继承 |
| `line-height` | `normal`（按字号的 1.2 倍） |

这些样式变化后水印自动重绘，包括切换主题、在祖先元素上修改 `--vc-watermark-color`、给祖先元素增删 class 等不经过组件的变化。

### 使用注意

- 单个水印占用的区域是其旋转后的包围盒，旋转不会被裁切；相邻水印的包围盒之间相隔 `gap`。
- 水印层为绝对定位。使用默认插槽时由外层 `.vc-watermark` 定位；通过 `to` 挂载或留在原位时，容器若未定位（`position: static`）会被写入内联 `position: relative`，水印层离开或组件卸载后还原。
- `to` 为选择器时在挂载后及 `to` 变化时查找；找不到目标时不渲染。
- `fullscreen` 时水印层相对视口定位，不改写容器的 `position`。默认层级高于弹层（1002）与提示（4000 左右），要让它们显示在水印之上就传更小的 `zIndex`。祖先元素带 `transform`、`filter` 等会让固定定位改为相对该祖先，所以默认挂到 `body`；自行指定 `to` 时需留意。
- 水印层被删除，或其 `style`、`class` 等属性被改动后会重新生成。通过样式表选择器隐藏、或对容器本身做改动不在保护范围内。
- 水印层的属性在创建后不再变化：`class`、`style`、`zIndex` 变化或重绘时会换成新的节点，不要持有它的引用。
- 跨域图片需要服务端允许跨域（以 `crossOrigin="anonymous"` 加载），否则按加载失败处理。图片先按原地址加载（可命中浏览器缓存），失败后追加时间戳重试一次。
- 自动重绘依赖水印层上 1ms 的 `transition`；全局禁用过渡（如 `* { transition: none !important; }`）后，不经过组件的样式变化不再触发重绘。
