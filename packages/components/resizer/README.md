## 自适应（Resizer）

监听容器尺寸，通过事件和作用域插槽向内容提供可用宽高。

移动端入口导出的 `MResizer` 与 `Resizer` 是同一实现。

### 何时使用

- 需要将布局中剩余空间的尺寸传给图表、滚动区域或其他需要显式宽高的内容时。

只测量、不提供拖动；要让用户拖动分隔条调整面板尺寸，用 [Splitter](../splitter/README.md)。

### 基础用法

调整父容器宽高，观察插槽尺寸和 `resize` 事件同步更新。父容器应具有可确定的尺寸；Resizer 自身的 `padding` 会从测量值中扣除。

:::playground
<!--
<config lang="json5">
{
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="resizer-demo">
		<div class="resizer-demo__controls">
			<label class="resizer-demo__label">容器宽度：{{ containerWidth }}px</label>
			<Slider v-model="containerWidth" :min="200" :max="360" />
			<label class="resizer-demo__label">容器高度：{{ containerHeight }}px</label>
			<Slider v-model="containerHeight" :min="120" :max="240" />
		</div>
		<p class="resizer-demo__result">最近测量：{{ measured.width }} × {{ measured.height }}px</p>
		<div :style="{ width: `${containerWidth}px`, height: `${containerHeight}px` }">
			<Resizer class="resizer-demo__resizer" @resize="handleResize">
				<template #default="{ width, height, style }">
					<div class="resizer-demo__content" :style="style">
						{{ width }} × {{ height }}px
					</div>
				</template>
			</Resizer>
		</div>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Resizer, Slider } from '@deot/vc';

const containerWidth = ref(300);
const containerHeight = ref(180);
const measured = ref({ width: 0, height: 0 });

const handleResize = ({ width, height }) => {
	measured.value = { width, height };
};
</script>

<style scoped>
.resizer-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.resizer-demo__controls {
	display: flex;
	flex-direction: column;
	gap: 8px;
	width: 260px;
	max-width: 100%;
}

.resizer-demo__result {
	margin: 0;
}

.resizer-demo__resizer {
	box-sizing: border-box;
	padding: 16px;
}

.resizer-demo__content {
	display: grid;
	place-items: center;
	box-sizing: border-box;
	border: 1px dashed currentColor;
}
</style>
```
:::

### 填充方向与手动测量

`fill` 传数组时按 `[宽度, 高度]` 分别控制是否填充父容器，`[true, false]` 只填充宽度，高度由内容撑开；`tag` 设置根元素标签。`resize` 事件的 `inited` 在首次测量时为 `false`。通过模板 ref 调用 `refresh()` 手动测量，并读取 `offsetWidth`、`offsetHeight`。

:::playground
<!--
<config lang="json5">
{
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="resizer-demo">
		<div class="resizer-demo__row">
			<Button @click="handleAdd">增加一行</Button>
			<Button @click="handleRemove">减少一行</Button>
			<Button @click="handleRefresh">refresh()</Button>
		</div>
		<Resizer
			ref="resizer"
			tag="section"
			:fill="[true, false]"
			class="resizer-demo__resizer"
			@resize="handleResize"
		>
			<template #default="{ width, height }">
				<div class="resizer-demo__lines">
					<p v-for="n in lines" :key="n" class="resizer-demo__line">第 {{ n }} 行</p>
					<p class="resizer-demo__line">插槽尺寸：{{ width }} × {{ height }}px</p>
				</div>
			</template>
		</Resizer>
		<p class="resizer-demo__result">{{ resizeText }}</p>
		<p class="resizer-demo__result">{{ refreshText }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, Resizer } from '@deot/vc';

const resizer = ref();
const lines = ref(2);
const resizeText = ref('resize：等待测量');
const refreshText = ref('refresh：尚未调用');

const handleResize = ({ width, height, inited }) => {
	resizeText.value = `resize：${width} × ${height}px，inited：${inited}`;
};

const handleAdd = () => {
	lines.value++;
};

const handleRemove = () => {
	lines.value = Math.max(1, lines.value - 1);
};

const handleRefresh = () => {
	resizer.value.refresh();
	refreshText.value = `refresh：${resizer.value.offsetWidth} × ${resizer.value.offsetHeight}px`;
};
</script>

<style scoped>
.resizer-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.resizer-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}

.resizer-demo__resizer {
	box-sizing: border-box;
	padding: 16px;
	background: var(--vc-background-color-light);
}

.resizer-demo__lines {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.resizer-demo__line,
.resizer-demo__result {
	margin: 0;
}
</style>
```
:::

## API

### 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| tag | 根元素标签 | `string` | - | `'div'` |
| fill | 是否以 `100%` 填充父容器；数组按 `[宽度, 高度]` 分别控制，例如 `[true, false]` 仅填充宽度 | `boolean \| any[]` | - | `true` |

### 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| resize | 测量得到的宽度或高度变化时触发；尺寸不变时不触发 | `{ width, height, style, inited }` | `width`、`height` 为像素数值；`style` 为宽高 CSS 字符串；`inited` 表示此前是否已完成过测量，首次测量时为 `false` |

初始宽高为 `0`。首次测量如果仍为 `0 × 0`，不会触发事件，但会将后续事件的 `inited` 置为 `true`。

### 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 容器内容，随测量结果更新 | `{ width: number, height: number, style: string }` |

`style` 的格式为 `height: 180px; width: 300px`，可直接绑定给子元素。

### 方法

通过组件 ref 访问。

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| refresh | 手动测量尺寸，随后约 20ms 内忽略测量请求；锁定期间调用也不会立即重新测量 | - | `void` |

实例还暴露 `offsetWidth` 和 `offsetHeight`，均为最近测量的像素数值，初始为 `0`。

### 布局注意事项

- 测量值来自根元素的 `getBoundingClientRect()`，减去按整数解析的对应方向 padding；不会扣除 border，因此不等同于原生 `clientWidth` / `clientHeight`。
- 默认宽高均为 `100%`，父容器应提供可确定的尺寸。在 Flex 剩余空间中使用时，可给父层设置 `flex: 1`，并配合 `min-height: 0` 或 `overflow: hidden` 允许收缩。
- 将插槽 `style` 绑定给带边框或内边距的内容时，使用 `box-sizing: border-box`，避免子元素反向撑大容器并导致重复测量。
