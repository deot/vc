## 颜色选择器（ColorPicker）

选择颜色：色板、色相条、透明度条、预设色和色值输入，支持 hex（含 8 位）、rgb、hsl、hsv 输出。

### 何时使用

为文字、背景或图形配置颜色；只需要选色区域、不需要浮层时，使用 `ColorPicker.View`。

### 基础用法

选色即提交：拖动色板、色相条，点预设色或在输入框里输入（失焦或回车后解析），都会立即写入 `v-model`。悬停触发器时出现清除图标，点击后提交 `nullValue`（默认 `''`）。

:::playground
<!--
<config lang="json5">
{ previewInset: 20 }
</config>
-->
```vue
<template>
	<div class="color-demo">
		<ColorPicker
			v-model="color"
			@change="handleChange"
			@clear="lastChange = '已清空'"
			@visible-change="handleVisibleChange"
			@close="handlePreview(false)"
		/>
		<p>当前：{{ color || '未选择' }}</p>
		<p>最近一次 change：{{ lastChange }}</p>
	</div>
</template>

<script setup>
import { inject, ref } from 'vue';
import { ColorPicker } from '@deot/vc';

const playground = inject('docs:playground');
const handlePreview = playground.run(420);
const color = ref('#1DB88C');
const lastChange = ref('-');
const handleChange = (value) => { lastChange.value = value || '已清空'; };
const handleVisibleChange = (isVisible) => {
	if (isVisible) handlePreview(true);
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
</style>
```
:::

示例通过 `inject('docs:playground')` 在浮层打开时临时扩展预览高度，并在 `close`（离场动画结束）后恢复。

### 确认后提交

`confirm` 为 `true` 时浮层底部显示「确定」：选色只是预览（触发器跟随，并触发 `color-change`），点「确定」才提交；点外部关闭则放弃修改，触发器在开始收起时就回到已提交的颜色。

:::playground
<!--
<config lang="json5">
{ previewInset: 20 }
</config>
-->
```vue
<template>
	<div class="color-demo">
		<ColorPicker
			v-model="color"
			confirm
			@color-change="previewColor = $event"
			@visible-change="handleVisibleChange"
			@close="handleClose"
		/>
		<p>已提交：{{ color || '未选择' }}</p>
		<p>预览：{{ previewColor }}</p>
	</div>
</template>

<script setup>
import { inject, ref } from 'vue';
import { ColorPicker } from '@deot/vc';

const playground = inject('docs:playground');
const handlePreview = playground.run(460);
const color = ref('#456CF6');
const previewColor = ref(color.value);
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
</style>
```
:::

### 透明度与输出格式

`alpha` 显示透明度条，并输出带透明度的色值。`format` 决定输出格式：`hex` 输出 `#RRGGBB`，开启 `alpha` 时输出 8 位 `#RRGGBBAA`；`rgb` / `hsl` / `hsv` 开启 `alpha` 时对应 `rgba` / `hsla` / `hsva`。未指定 `format` 时，不透明输出 `hex`，开启 `alpha` 输出 `rgba`。

输入时可以使用任意可解析的写法（见 [Color 工具](#color-工具)），失焦或回车后按当前格式归一化，无法解析时恢复原值。

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
		<ColorPicker
			v-model="color"
			:alpha="isAlpha"
			:format="format"
			@visible-change="isVisible => isVisible && handlePreview(true)"
			@close="handlePreview(false)"
		/>
		<p>当前：{{ color || '未选择' }}</p>
	</div>
</template>

<script setup>
import { inject, ref } from 'vue';
import { ColorPicker } from '@deot/vc';

const playground = inject('docs:playground');
const handlePreview = playground.run(440);
const color = ref('#13CE66CC');
const isAlpha = ref(true);
const format = ref('hex');
const formats = ['hex', 'rgb', 'hsl', 'hsv'];
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

### 预设色

`colors` 为 `true` 时显示内置的 20 个颜色（`ColorPicker.colors`），为数组时显示自定义颜色，可以在内置色的基础上扩展。无法解析的项会被跳过。关闭 `panel` 和 `hue` 可以只保留预设色；`:editable="false"` 时底部只显示色值，不能输入。

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
				<p>内置色</p>
				<ColorPicker
					v-model="builtinColor"
					colors
					@visible-change="isVisible => isVisible && handleVisibleChange('builtin', true)"
					@close="handleVisibleChange('builtin', false)"
				/>
			</div>
			<div>
				<p>只选预设色</p>
				<ColorPicker
					v-model="presetColor"
					:colors="colors"
					:panel="false"
					:hue="false"
					:editable="false"
					@visible-change="isVisible => isVisible && handleVisibleChange('preset', true)"
					@close="handleVisibleChange('preset', false)"
				/>
			</div>
		</div>
		<p>内置：{{ builtinColor || '未选择' }}；预设：{{ presetColor || '未选择' }}</p>
	</div>
</template>

<script setup>
import { inject, ref } from 'vue';
import { ColorPicker } from '@deot/vc';

const playground = inject('docs:playground');
const handlePreview = playground.run(440);
const builtinColor = ref('#5495F6');
const presetColor = ref('#FF4500');
const colors = ['#FF4500', '#FFD700', '#1DB88C', '#456CF6', ...ColorPicker.colors.slice(0, 2)];
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

### 自定义触发器

默认插槽替换内置触发器，参数为 `{ value, color }`：`value` 是 `v-model` 原值，`color` 可直接用于 CSS（hsv 等 CSS 不支持的格式已转换；未选择时为空字符串）。

:::playground
<!--
<config lang="json5">
{ previewInset: 20 }
</config>
-->
```vue
<template>
	<div class="color-demo">
		<ColorPicker
			v-model="color"
			alpha
			format="hsv"
			@visible-change="isVisible => isVisible && handlePreview(true)"
			@close="handlePreview(false)"
		>
			<template #default="{ value, color: css }">
				<Button>
					<span class="dot" :style="{ background: css || 'transparent' }" />
					{{ value || '选择颜色' }}
				</Button>
			</template>
		</ColorPicker>
	</div>
</template>

<script setup>
import { inject, ref } from 'vue';
import { Button, ColorPicker } from '@deot/vc';

const playground = inject('docs:playground');
const handlePreview = playground.run(420);
const color = ref('hsva(210, 80%, 90%, 0.8)');
</script>

<style scoped>
.color-demo .dot {
	display: inline-block;
	width: 12px;
	height: 12px;
	margin-right: 6px;
	border-radius: 50%;
	box-shadow: inset 0 0 0 1px rgb(0 0 0 / 15%);
}
</style>
```
:::

### 尺寸与禁用

`size` 调整触发器尺寸，高度与 Button 一致：`mini` 22px / `small` 26px / `medium` 32px / `large` 38px。`disabled` 时不能打开浮层、不能清除，也不可聚焦。

:::playground
<!--
<config lang="json5">
{ previewInset: 20 }
</config>
-->
```vue
<template>
	<div class="color-demo">
		<label><input v-model="isDisabled" type="checkbox">禁用</label>
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
	</div>
</template>

<script setup>
import { inject, ref } from 'vue';
import { ColorPicker } from '@deot/vc';

const playground = inject('docs:playground');
const handlePreview = playground.run(420);
const color = ref('#456CF6');
const isDisabled = ref(false);
const sizes = ['mini', 'small', 'medium', 'large'];
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

`ColorPicker.View` 直接展示选色区域，没有浮层、输入框和按钮。用户操作时触发 `update:modelValue` 和 `change`，第二个参数为当前 `Color` 实例；父组件改值或切换 `alpha` / `format` 时不回抛事件。

:::playground
<!--
<config lang="json5">
{ previewInset: 20 }
</config>
-->
```vue
<template>
	<div class="color-demo">
		<div class="picker-view">
			<ColorPicker.View v-model="color" alpha colors @change="handleChange" />
		</div>
		<p>当前：{{ color }}</p>
		<p>RGB 通道：{{ channels }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { ColorPicker } from '@deot/vc';

const color = ref('rgba(19, 206, 102, 0.8)');
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
.picker-view {
	width: 240px;
	max-width: 100%;
}
</style>
```
:::

### 键盘与无障碍

- 触发器可聚焦（`role="button"`、`aria-haspopup`、`aria-expanded`）：`Enter` / 空格 / `↓` 打开浮层，`Esc` 关闭。
- 色板 `role="slider"`，`aria-valuetext` 为当前色值：`←` `→` 调饱和度，`↑` `↓` 调明度，按住 `Shift` 一次 10。
- 色相条、透明度条就是 [Slider](../slider/README.md)：方向键、`PageUp` / `PageDown`、`Home` / `End` 与 Slider 相同；鼠标按住轨道任意位置即可拖动。
- 预设色是按钮（`aria-pressed` 标记选中），`Tab` 聚焦，`Enter` / 空格选中。

## 主题与局部覆盖

全局参数通过 `--vc-<参数>` 配置，单个组件通过 `--vc-color-picker-<参数>` 覆盖。

色谱、饱和度/明度黑白渐变、面板光标和透明棋盘格属于绘图数据，不随主题改变。⚠ color-mix：触发器色块及预设色块边框由 color-contrast-dark 以 15% 与透明色混合；不支持 color-mix 时使用 Sass 编译的固定黑色 rgba() 降级值，不随 color-contrast-dark 变量变化。

色相条、透明度条复用 Slider：轨道粗细写在 `.vc-color-picker-view__hue` / `.vc-color-picker-view__alpha` 上的 Slider 局部参数（`--vc-slider-track-size` 10px），可以在同样的位置覆盖；滑块通过 Slider 的 `#thumb` 插槽画成竖条（`.vc-color-picker-view__thumb`）。浮层内的输入框和按钮使用 Input / Button 各自的主题。

### 全局

| 参数 | 使用位置 | 值 |
| --- | --- | --- |
| color-contrast-dark | 触发器色块及预设色块边框的派生基色 | `#000000`（亮暗主题相同） |
| color-contrast-light | 色相、透明度条的滑块背景 | `#FFFFFF`（亮暗主题相同） |
| color-dark-light | 不可编辑时的色值文字 | 亮色：`#080F20`；暗色：`#E8E8E8` |
| color-dark-extralight | 触发器箭头及清除图标 | 亮色：`#909399`；暗色：`#B9B9B9` |
| color-disabled | 亮色禁用触发器背景 | `#EBEEF5` |
| color-error | 未选择时色块斜线 | `#F53F3F` |
| color-neutral-light | 底部分隔线 | 亮色：`#EDEFF1`；暗色：`#3B4354` |
| color-primary | 触发器悬停及亮色聚焦边框、预设色选中阴影 | `#456CF6` |
| color-primary-light | 暗色聚焦边框 | `#4A96FF` |
| color-primary-lighter | 触发器聚焦光晕、色板、滑块及预设色的键盘聚焦光环 | `rgba(45, 140, 240, 0.2)` |
| color-shadow-fixed | 色相、透明度条的滑块阴影 | 亮色：`rgb(0 0 0 / 6%)`；暗色：`rgb(0 0 0 / 24%)` |
| background-color-light | 暗色禁用触发器背景 | 亮色：`#F7F8FA`；暗色：`#2D3444` |
| background-color-lightest | 触发器背景、未选择时色块底色 | 亮色：`#FFFFFF`；暗色：`#252B3A` |
| border-color | 触发器边框、色相及透明度条的滑块边框 | `#D5D9E1` |

### 局部

当前组件没有额外的局部 CSS 主题参数。

## API

### ColorPicker 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| modelValue | 当前色值，支持 `v-model` | `string \| null` | - | `''` |
| nullValue | 未选择（清除）时提交的值 | `string \| null` | - | `''` |
| confirm | 点「确定」才提交，点外部关闭放弃修改；否则选色即提交 | `boolean` | - | `false` |
| clearable | 悬停触发器时显示清除图标 | `boolean` | - | `true` |
| editable | 浮层底部可输入色值；否则只显示 | `boolean` | - | `true` |
| panel | 显示饱和度/明度色板 | `boolean` | - | `true` |
| hue | 显示色相条 | `boolean` | - | `true` |
| alpha | 显示透明度条并输出带透明度的色值 | `boolean` | - | `false` |
| colors | 预设色：`true` 使用内置色，数组为自定义色 | `boolean \| string[]` | - | `false` |
| format | 输出格式 | `'hex' \| 'rgb' \| 'hsl' \| 'hsv'` | - | 不透明为 `hex`，开启 `alpha` 为 `rgb` |
| size | 触发器尺寸 | `'mini' \| 'small' \| 'medium' \| 'large'` | - | `'medium'` |
| disabled | 禁用 | `boolean` | - | `false` |
| trigger | 浮层触发方式，透传给 Popover | `string` | `click`、`hover`、`strictHover`、`focus`、`custom` | `'click'` |
| arrow | 显示浮层箭头 | `boolean` | - | `false` |
| portalClass | 浮层附加 class | `string \| object \| any[]` | - | - |

其他 attrs 透传给 [Popover](../popover/README.md)，例如 `placement`、`portalStyle`、`to`。

### ColorPicker 事件

| 事件名 | 说明 | 回调参数 |
| --- | --- | --- |
| update:modelValue | 提交色值；值没有变化时不触发 | `(value: string \| null) => void` |
| change | 与 `update:modelValue` 一起触发 | `(value: string \| null) => void` |
| clear | 点击清除图标后，在 `change` 之后触发 | `() => void` |
| color-change | 浮层内的色值变化（`confirm` 时为未提交的预览） | `(value: string) => void` |
| visible-change | 浮层开始展开或收起 | `(isVisible: boolean) => void` |
| ready | 浮层入场完成 | `() => void` |
| close | 浮层离场完成 | `() => void` |

### ColorPicker 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 自定义触发器 | `{ value: string \| null; color: string }`：`color` 可直接用于 CSS，未选择时为 `''` |

### ColorPicker 静态属性

| 名称 | 说明 |
| --- | --- |
| View | 独立面板，同 `ColorPickerView` |
| Color | 色值解析/转换类，同 `Color` |
| colors | 内置预设色（20 个），`colors` 为 `true` 时使用 |

### ColorPickerView 属性与事件

属性为上表中的 `modelValue`、`panel`、`hue`、`alpha`、`colors`、`format`，类型和默认值相同。也可从 `@deot/vc-components` 具名导入 `ColorPickerView`。

| 事件名 | 说明 | 回调参数 |
| --- | --- | --- |
| update:modelValue | 用户操作导致色值变化；父组件改值或改 `alpha` / `format` 时不触发 | `(value: string, color: Color) => void` |
| change | 与 `update:modelValue` 一起触发 | `(value: string, color: Color) => void` |

### Color 工具

`ColorPicker.Color` 是色值解析/转换类，也可从 `@deot/vc-components` 导入 `Color`。

```ts
import { ColorPicker } from '@deot/vc';

const { Color } = ColorPicker;

const color = new Color({ value: '#1DB88C', alpha: true, format: 'hex' });
color.setColor('rgba(19, 206, 102, 0.8)'); // true
color.states.output; // '#13CE67CC'
color.toCss(); // 'rgba(19, 206, 103, 0.8)'
color.setColor('xyz'); // false，保持原值

Color.parse('hsv(120, 50%, 50%)')?.toCss(); // 'rgb(64, 128, 64)'
Color.parse('not a color'); // null
```

可解析的写法：3 / 4 / 6 / 8 位 hex（`#` 可省略）、`rgb()` / `rgba()`、`hsl()` / `hsla()`、`hsv()` / `hsva()`（逗号或空格分隔，透明度可写成 `/ 50%`）、`transparent`，以及 CSS 颜色名（借助 canvas 转换，没有 DOM 的环境不支持）。

构造参数为 `{ value?: string; alpha?: boolean; format?: 'hex' | 'rgb' | 'hsl' | 'hsv' }`。`states` 为响应式对象，包含通道 `hue`（0–360）、`saturation`、`value`、`opacity`（0–100），输出选项 `alpha`、`format`，以及只读的 `output`。

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| Color.parse | 静态方法：解析色值并创建实例 | `(value: string, options?: { alpha?: boolean; format?: ColorFormat })` | `Color \| null` |
| setColor | 设置色值；空值恢复默认红色，无法解析时保持原值 | `value?: string` | `boolean`：是否解析成功 |
| setOptions | 设置输出选项；省略 `alpha` 为 `false`，省略 `format` 按透明度选择默认格式 | `{ alpha?: boolean; format?: ColorFormat }` | `void` |
| set | 设置通道 | `(channel, value)` 或通道对象；通道为 `hue`、`saturation`、`value`、`opacity` | `void` |
| get | 读取通道 | `'hue' \| 'saturation' \| 'value' \| 'opacity'` | `number` |
| toRgb | 转换为 RGB 通道 | - | `{ r: number; g: number; b: number }` |
| toCss | 可直接用于 CSS 的色值；`alpha` 为 `true` 且不完全不透明时为 `rgba()`，否则为 `rgb()` | - | `string` |
| compare | 比较颜色是否近似相同 | `color: Color` | `boolean` |

### 移动端

`MColorPicker` / `MColorPickerView` 目前复用桌面实现；`MColorPicker` 可从 `@deot/vc` 导入，独立面板可使用 `MColorPicker.View`。
