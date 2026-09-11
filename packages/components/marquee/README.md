## 文字轮播（Marquee）

在固定宽度区域内从右向左循环滚动内容。

### 何时使用
在一小块内容展示通知类的信息时使用。

### 基础用法
支持 `content` 和默认插槽，插槽优先。内容宽度小于容器时默认不滚动，等于或超过容器宽度时滚动。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<div class="v-marquee-basic">
		<Marquee
			class="_normal"
		>
			<span>{{ text }}</span>
		</Marquee>
		<Marquee
			:content="text"
			class="_normal"
		/>
		<Marquee
			:content="text.repeat(3)"
			class="_normal"
		/>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Marquee } from '@deot/vc';

const text = ref('ABCDEFG');
</script>
<style>
.v-marquee-basic > ._normal {
	width: min(100%, 240px);
	display: block;
	padding: 8px 12px;
	background: #f6f8fa;
	margin: 0 0 8px;
	border-radius: 4px;
}
</style>
```
:::

### 自动滚动
设置`autoplay`未超出一屏时自动滚动。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<div class="v-marquee-autoplay">
		<Marquee
			:content="text"
			autoplay
			class="_normal"
		/>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Marquee } from '@deot/vc';

const text = ref('ABCDEFG');
</script>
<style>
.v-marquee-autoplay > ._normal {
	width: min(100%, 240px);
	display: block;
	padding: 8px 12px;
	background: #f6f8fa;
	border-radius: 4px;
}
</style>
```
:::

### 动画
通过`animated`控制滚动暂停。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<div class="v-marquee-animated">
		<Marquee
			:content="text.repeat(3)"
			class="_normal"
			:animated="animated"
		/>
		<div>
			<Button @click="handleClick">切换滚动状态</Button>
		</div>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Marquee, Button } from '@deot/vc';

const text = ref('ABCDEFG');
const animated = ref(true);

const handleClick = () => {
	animated.value = !animated.value;
};
</script>
<style>
.v-marquee-animated > ._normal {
	width: min(100%, 240px);
	display: block;
	padding: 8px 12px;
	background: #f6f8fa;
	margin-bottom: 8px;
	border-radius: 4px;
}
</style>
```
:::

### 速度
通过设置`speed`控制每秒移动多少px。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<div class="v-marquee-basic">
		<Marquee
			:content="text.repeat(3)"
			:speed="100"
			class="_normal"
		/>
		<Marquee
			:content="text"
			autoplay
			:speed="500"
			class="_normal"
		/>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Marquee } from '@deot/vc';

const text = ref('ABCDEFG');
</script>
<style>
.v-marquee-basic > ._normal {
	width: min(100%, 240px);
	display: block;
	padding: 8px 12px;
	background: #f6f8fa;
	margin: 0 0 8px;
	border-radius: 4px;
}
</style>
```
:::

## API

### 属性

| 属性       | 说明               | 类型                  | 可选值 | 默认值     |
| -------- | ---------------- | ------------------- | --- | ------- |
| speed    | 速度计算（如：每秒移动50px） | `number`            | -   | 50      |
| content  | 内容；字符串按 HTML 渲染，也可传入返回 VNode 的渲染函数 | `string \| Function` | - | - |
| animated | 是否运行动画，设为 `false` 暂停 | `boolean` | - | `true` |
| autoplay | 未超出一屏时是否滚动       | `boolean`           | -   | `false` |


### 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 自定义内容，优先于 `content` | - |

### 注意事项

- `speed` 的单位为 px/s，使用正数。动画时长为「容器宽度 + 内容宽度」除以速度。
- 字符串 `content` 按 HTML 插入，仅传入可信内容；普通文本可使用默认插槽插值。
- 组件挂载后测量宽度，并在 `content` 或 `speed` 变化时重新计算；容器尺寸、插槽内容及渲染函数内部依赖变化不会自动重新测量。
- `animated` 和 `autoplay` 只控制暂停条件。若首次测量时处于暂停状态，之后仅切换这两个属性不会初始化动画。
- 移动端导出 `MMarquee`，与 `Marquee` 共用实现及 API。
