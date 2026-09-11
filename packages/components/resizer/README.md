## 自适应（Resizer）

监听容器尺寸，通过事件和作用域插槽向内容提供可用宽高。

### 何时使用

需要将布局中剩余空间的尺寸传给图表、滚动区域或其他需要显式宽高的内容时使用。

### 基础用法

调整父容器宽度，观察插槽尺寸和 `resize` 事件同步更新。父容器应具有可确定的尺寸。

:::playground
```vue
<template>
	<div class="resizer-demo">
		<div class="resizer-demo__controls">
			<label>容器宽度：{{ containerWidth }}px</label>
			<Slider v-model="containerWidth" :min="200" :max="360" />
			<label>容器高度：{{ containerHeight }}px</label>
			<Slider v-model="containerHeight" :min="120" :max="240" />
		</div>
		<p>最近测量：{{ measured.width }} × {{ measured.height }}px</p>
		<div :style="{ width: `${containerWidth}px`, height: `${containerHeight}px` }">
			<Resizer style="padding: 16px;" @resize="measured = $event">
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
</script>

<style scoped>
.resizer-demo {
	padding: 20px;
}

.resizer-demo__controls {
	width: 260px;
	margin-bottom: 12px;
}

.resizer-demo__controls label {
	display: block;
	margin: 8px 0 4px;
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

## API

`MResizer` 与 `Resizer` 是同一组件，属性、事件、插槽和实例成员一致。

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
