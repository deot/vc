## 颜色选择器（ColorPicker）

选择颜色，支持透明度、输出格式、预设色和独立面板。

### 何时使用

为文字、背景或图形配置颜色；需要即时同步时，可使用 `ColorPicker.View` 独立面板。

### 基础用法

`v-model` 保存已提交的色值。拖动面板只预览，点击“确定”才提交；“清空”提交空字符串，点击外部关闭则放弃未提交的修改。已有色值可以在面板内输入，失焦或按 Enter 后解析，仍需点击“确定”提交。

:::playground
<!--
<config lang="json5">
{ previewInset: 20 }
</config>
-->
```vue
<template>
	<div class="color-demo">
		<p>已提交：{{ color || '未选择' }}</p>
		<p>预览：{{ previewColor || '未选择' }}</p>
		<p>最近一次提交：{{ lastChange }}</p>
		<ColorPicker
			v-model="color"
			@color-change="handleColorChange"
			@change="handleChange"
			@visible-change="handleVisibleChange"
			@close="handleClose"
		/>
	</div>
</template>

<script setup>
import { inject, ref } from 'vue';
import { ColorPicker } from '@deot/vc';

const playground = inject('docs:playground');
const handlePreview = playground.run(480);
const color = ref('#1DB88C');
const previewColor = ref(color.value);
const lastChange = ref('尚未提交');
const handleColorChange = (value) => { previewColor.value = value; };
const handleChange = (value) => { lastChange.value = value || '已清空'; };
const handleVisibleChange = (isVisible) => {
	if (isVisible) handlePreview(true);
};
const handleClose = () => {
	previewColor.value = color.value;
	handlePreview(false);
};
</script>

<style scoped>
.color-demo {
	display: grid;
	gap: 12px;
	justify-items: start;
}
.color-demo p {
	margin: 0;
	overflow-wrap: anywhere;
}
.color-demo .controls {
	display: flex;
	flex-wrap: wrap;
	gap: 16px;
	align-items: center;
}
</style>
```
:::

示例通过 `inject('docs:playground')` 在浮层打开时临时扩展预览高度，并在 `close`（离场动画结束）后恢复。

### 透明度与输出格式

`alpha` 显示透明度滑块。默认输出为不透明 `hex`，开启 `alpha` 后为 `rgba`；`hsl` / `hsv` 对应输出 `hsla` / `hsva`。当前实现中，即使指定 `format="hex"`，开启透明度后仍输出 `rgba`，不会输出八位 hex。

:::playground
<!--
<config lang="json5">
{ previewInset: 20 }
</config>
-->
```vue
<template>
	<div class="color-demo">
		<div class="controls">
			<label><input v-model="isAlpha" type="checkbox">启用透明度</label>
			<label>
				输出格式
				<select v-model="format">
					<option v-for="item in formats" :key="item" :value="item">{{ item }}</option>
				</select>
			</label>
		</div>
		<p>已提交：{{ color || '未选择' }}</p>
		<ColorPicker
			v-model="color"
			:alpha="isAlpha"
			:format="format"
			@visible-change="handleVisibleChange"
			@close="handleClose"
		/>
	</div>
</template>

<script setup>
import { inject, ref } from 'vue';
import { ColorPicker } from '@deot/vc';

const playground = inject('docs:playground');
const handlePreview = playground.run(420);
const color = ref('rgba(19, 206, 102, 0.8)');
const isAlpha = ref(true);
const format = ref('rgb');
const formats = ['hex', 'rgb', 'hsl', 'hsv'];
const handleVisibleChange = (isVisible) => {
	if (isVisible) handlePreview(true);
};
const handleClose = () => handlePreview(false);
</script>

<style scoped>
.color-demo {
	display: grid;
	gap: 12px;
	justify-items: start;
}
.color-demo p {
	margin: 0;
	overflow-wrap: anywhere;
}
.color-demo .controls {
	display: flex;
	flex-wrap: wrap;
	gap: 16px;
	align-items: center;
}
</style>
```
:::

### 预设色与推荐色

`colors` 非空时优先显示自定义预设；只有 `colors` 为空且 `recommend` 为 `true` 时，才显示内置的 20 个推荐色。关闭 `panel` 和 `hue` 可以只保留预设色；`:editable="false"` 关闭色值输入。

:::playground
<!--
<config lang="json5">
{ previewInset: 20 }
</config>
-->
```vue
<template>
	<div class="color-demo">
		<div class="controls">
			<div>
				<p>仅预设色</p>
				<ColorPicker
					v-model="presetColor"
					:colors="colors"
					:panel="false"
					:hue="false"
					:editable="false"
					recommend
					@visible-change="isVisible => isVisible && handleVisibleChange('preset', true)"
					@close="handleVisibleChange('preset', false)"
				/>
			</div>
			<div>
				<p>推荐色</p>
				<ColorPicker
					v-model="recommendColor"
					recommend
					@visible-change="isVisible => isVisible && handleVisibleChange('recommend', true)"
					@close="handleVisibleChange('recommend', false)"
				/>
			</div>
		</div>
		<p>预设：{{ presetColor || '未选择' }}；推荐：{{ recommendColor || '未选择' }}</p>
	</div>
</template>

<script setup>
import { inject, ref } from 'vue';
import { ColorPicker } from '@deot/vc';

const playground = inject('docs:playground');
const handlePreview = playground.run(420);
const presetColor = ref('#FF4500');
const recommendColor = ref('#1DB88C');
const colors = ['#FF4500', '#FFD700', '#1DB88C', '#456CF6'];
const visibleStates = {};
const handleVisibleChange = (key, isVisible) => {
	visibleStates[key] = isVisible;
	return handlePreview(Object.values(visibleStates).some(Boolean));
};
</script>

<style scoped>
.color-demo {
	display: grid;
	gap: 12px;
	justify-items: start;
}
.color-demo p {
	margin: 0;
	overflow-wrap: anywhere;
}
.color-demo .controls {
	display: flex;
	flex-wrap: wrap;
	gap: 16px;
	align-items: center;
}
</style>
```
:::

### 尺寸与禁用

`size` 调整触发器尺寸，`disabled` 阻止打开面板。

:::playground
<!--
<config lang="json5">
{ previewInset: 20 }
</config>
-->
```vue
<template>
	<div class="color-demo">
		<label><input v-model="isDisabled" type="checkbox">禁用选择器</label>
		<div class="controls">
			<ColorPicker
				v-for="size in sizes"
				:key="size"
				v-model="color"
				:size="size"
				:disabled="isDisabled"
				@visible-change="isVisible => isVisible && handleVisibleChange(size, true)"
				@close="handleVisibleChange(size, false)"
			/>
		</div>
		<p>已提交：{{ color || '未选择' }}</p>
	</div>
</template>

<script setup>
import { inject, ref } from 'vue';
import { ColorPicker } from '@deot/vc';

const playground = inject('docs:playground');
const handlePreview = playground.run(420);
const color = ref('#456CF6');
const isDisabled = ref(false);
const sizes = ['small', 'medium', 'large'];
const visibleStates = {};
const handleVisibleChange = (key, isVisible) => {
	visibleStates[key] = isVisible;
	return handlePreview(Object.values(visibleStates).some(Boolean));
};
</script>

<style scoped>
.color-demo {
	display: grid;
	gap: 12px;
	justify-items: start;
}
.color-demo p {
	margin: 0;
	overflow-wrap: anywhere;
}
.color-demo .controls {
	display: flex;
	flex-wrap: wrap;
	gap: 16px;
	align-items: center;
}
</style>
```
:::

### 独立面板

`ColorPicker.View` 直接展示选色区域，没有浮层、输入框或确认按钮。颜色变化时立即触发 `update:modelValue` 和 `change`，第二个参数为当前 `Color` 实例。父组件更新值或输出选项导致内部输出变化时，也会触发这些事件。

:::playground
<!--
<config lang="json5">
{ previewInset: 20 }
</config>
-->
```vue
<template>
	<div class="color-demo">
		<div class="controls">
			<label><input v-model="isPanel" type="checkbox">颜色面板</label>
			<label><input v-model="isHue" type="checkbox">色相滑块</label>
		</div>
		<div class="picker-view">
			<PickerView v-model="color" :panel="isPanel" :hue="isHue" alpha recommend @change="handleChange" />
		</div>
		<p>即时色值：{{ color }}</p>
		<p>RGB 通道：{{ channels }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { ColorPicker } from '@deot/vc';

const PickerView = ColorPicker.View;
const color = ref('rgba(19, 206, 102, 0.8)');
const isPanel = ref(true);
const isHue = ref(true);
const channels = ref('操作面板后显示');
const handleChange = (value, currentColor) => {
	const { r, g, b } = currentColor.toRgb();
	channels.value = `${r}, ${g}, ${b}`;
};
</script>

<style scoped>
.color-demo {
	display: grid;
	gap: 12px;
	justify-items: start;
}
.color-demo p {
	margin: 0;
	overflow-wrap: anywhere;
}
.color-demo .controls {
	display: flex;
	flex-wrap: wrap;
	gap: 16px;
	align-items: center;
}
.picker-view {
	width: 256px;
	max-width: 100%;
}
</style>
```
:::

## API

### ColorPicker 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| modelValue | 已提交色值，支持 `v-model`；空字符串表示未选择 | `string` | - | `''` |
| panel | 是否显示饱和度/明度面板 | `boolean` | - | `true` |
| hue | 是否显示色相滑块 | `boolean` | - | `true` |
| alpha | 是否显示透明度滑块并输出带透明度的色值 | `boolean` | - | `false` |
| recommend | 无自定义预设时显示内置推荐色 | `boolean` | - | `false` |
| colors | 自定义预设色，优先于推荐色 | `string[]` | - | `[]` |
| format | 输出格式；开启 `alpha` 时 `hex` / `rgb` 均输出 `rgba` | `'hsl' \| 'hsv' \| 'hex' \| 'rgb'` | `hsl`、`hsv`、`hex`、`rgb` | prop 未指定；按 `alpha` 选择 `rgb` 或 `hex` |
| disabled | 禁止打开面板 | `boolean` | - | `false` |
| editable | 是否允许在浮层中输入色值 | `boolean` | - | `true` |
| size | 触发器尺寸 | `'large' \| 'medium' \| 'small'` | `large`、`medium`、`small` | `'medium'` |
| trigger | 浮层触发方式，透传给 Popover | `string` | `click`、`hover`、`strictHover`、`focus`、`custom` | `'click'` |
| arrow | 是否显示浮层箭头 | `boolean` | - | `false` |
| portalClass | 浮层附加 class | `string \| object \| any[]` | - | - |

其他 attrs 透传给 [Popover](../popover/README.md)，例如 `placement`、`portalStyle`、`getPopupContainer`。`ColorPicker` 的 `modelValue` 始终表示色值。

### ColorPicker 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| update:modelValue | 点击确定或清空时提交 | `(value: string) => void` | 提交值；清空为 `''` |
| change | 与 `update:modelValue` 一起触发；即使值未改变也会触发 | `(value: string) => void` | 提交值 |
| color-change | 浮层打开时，选色面板的输出变化 | `(value: string) => void` | 临时预览值，不代表已提交 |
| visible-change | 浮层开始展开或收起 | `(isVisible: boolean) => void` | 是否打开 |
| ready | 浮层入场完成 | `() => void` | - |
| close | 浮层离场完成，并恢复为已提交值 | `() => void` | - |

### ColorPickerView 属性

通过 `ColorPicker.View` 使用；也可从 `@deot/vc-components` 具名导入 `ColorPickerView`。属性为上表中的 `modelValue`、`panel`、`hue`、`alpha`、`recommend`、`colors`、`format`，类型和默认值相同；`modelValue` 为即时色值。

### ColorPickerView 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| update:modelValue | 内部输出色值变化时触发 | `(value: string, color: Color) => void` | 格式化后的色值与当前 `Color` 实例 |
| change | 与 `update:modelValue` 一起触发 | `(value: string, color: Color) => void` | 同上 |

### Color 工具

`ColorPicker.Color` 是色值解析/转换类；也可从 `@deot/vc-components` 导入 `Color`。`ColorPicker` 没有公开实例方法。

```ts
import { ColorPicker } from '@deot/vc';

const color = new ColorPicker.Color({ value: '#1DB88C', enableAlpha: true, format: 'rgb' });
color.setColor('rgba(19, 206, 102, 0.8)');
color.states.output; // 'rgba(19, 206, 103, 0.8)'（色相取整）
color.toRgb(); // { r: 19, g: 206, b: 103 }
```

构造参数为 `{ value?: string; enableAlpha?: boolean; format?: 'hsl' | 'hsv' | 'hex' | 'rgb' }`。

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| setColor | 解析 hex、rgb(a)、hsl(a)、hsv(a) 色值；空值恢复默认红色 | `value?: string` | `void` |
| setOptions | 设置输出选项；省略 `enableAlpha` 为 `false`，省略 `format` 按透明度重新选择默认格式 | `{ enableAlpha?: boolean; format?: 'hsl' \| 'hsv' \| 'hex' \| 'rgb' }` | `void` |
| set | 设置颜色通道，alpha 范围为 0–100 | `(channel, value)` 或通道对象；通道为 `hue`、`saturation`、`value`、`alpha` | `void` |
| get | 读取颜色通道 | `'hue' \| 'saturation' \| 'value' \| 'alpha'` | `number` |
| toRgb | 转换为 RGB 通道 | - | `{ r: number; g: number; b: number }` |
| compare | 比较颜色是否近似相同 | `color: Color` | `boolean` |

### 主题与移动端

组件外观使用 `--vc-color-picker-*` 覆盖变量，并回退到共享主题值。触发器和预设色块的边界使用 `--vc-color-picker-swatch-border-color`，默认 `rgb(0 0 0 / 15%)`；推荐色选中阴影使用 `--vc-color-picker-color-primary`。浮层背景由 Popover 控制，内部 Input/Button 使用各自主题。

色谱、饱和度/明度黑白渐变、面板光标和透明度棋盘保留固定图形色，不随主题改变所选颜色。

`MColorPicker` / `MColorPickerView` 复用桌面实现；其中 `MColorPicker` 可从 `@deot/vc` 导入，独立面板可使用 `MColorPicker.View`。
