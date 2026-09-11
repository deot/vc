## 加载中（Spin）

展示持续旋转的加载图标，可搭配自定义提示内容。

### 何时使用

等待异步数据或渲染结果时，用于提示局部内容正在加载。显示与隐藏由调用方控制。

### 基础用法

`size` 控制默认图标的尺寸，单位为 px。

:::playground
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<div>
		<div style="display: flex; align-items: center; gap: 24px; min-height: 48px">
			<Spin :size="size" />
			<InputNumber v-model="size" :min="16" :max="56" :step="4" style="width: 96px" />
		</div>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { InputNumber, Spin } from '@deot/vc';

const size = ref(28);
</script>
```
:::

### 切换加载状态与提示文案

通过 `v-if` 切换加载状态。默认插槽位于图标之后；组件的行高为 0，文本内容需要自行设置行高。

:::playground
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<div>
		<Button type="primary" @click="loading = !loading">
			{{ loading ? '停止加载' : '开始加载' }}
		</Button>
		<div style="margin-top: 16px; min-height: 64px">
			<Spin v-if="loading">
				<div style="margin-top: 8px; line-height: 20px">加载中，请稍候</div>
			</Spin>
			<div v-else>内容已就绪</div>
		</div>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, Spin } from '@deot/vc';

const loading = ref(true);
</script>
```
:::

### 自定义颜色与图标

`foreground` 设置圆环长弧颜色，`background` 设置短弧颜色。`loading` 插槽替换默认 SVG；自定义内容的尺寸与动画由调用方控制，组件中的 SVG 仍会应用旋转样式。

:::playground
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<div style="display: grid; gap: 16px">
		<div style="display: flex; align-items: center; gap: 12px">
			<Spin :foreground="foreground" :background="background" />
			<label>长弧</label>
			<ColorPicker v-model="foreground" />
			<label>短弧</label>
			<ColorPicker v-model="background" />
		</div>
		<Spin>
			<template #loading>
				<span style="line-height: 24px">正在加载…</span>
			</template>
		</Spin>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { ColorPicker, Spin } from '@deot/vc';

const foreground = ref('#909399');
const background = ref('#456cf6');
</script>
```
:::

## API

### 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| size | 默认图标尺寸，同时设置图标容器的字号，单位 px | `number` | - | `28` |
| foreground | 圆环长弧的描边颜色 | `string` | - | `var(--vc-spin-foreground-color, #ccc)` |
| background | 圆环短弧的描边颜色 | `string` | - | `var(--vc-spin-color-primary, var(--vc-color-primary))` |
| fixed | 预留属性，当前无效果 | `boolean` | - | `false` |

### 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| loading | 替换默认 SVG 图标，容器仍受 `size` 影响 | - |
| default | 图标之后的自定义内容，例如加载提示 | - |

### 主题与移动端

可通过 `--vc-spin-foreground-color` 和 `--vc-spin-color-primary` 覆盖默认长弧与短弧颜色；显式传入颜色属性时以属性为准。长弧保留默认中性灰 `#ccc`，短弧回退到全局主色。

`MSpin` 是 `Spin` 的别名，属性、插槽和样式相同。
