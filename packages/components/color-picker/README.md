## 颜色选择器（ColorPicker）

选择颜色：色板、色相条、透明度条、预设色和色值输入，支持 hex（含 8 位）、rgb、hsl、hsv 输出。移动端使用独立的 `MColorPicker`，见[移动端](#移动端)。

### 何时使用

为文字、背景或图形配置颜色；只需要选色区域、不需要浮层时，使用 `ColorPicker.View`。

### 基础用法

选色即提交：拖动色板、色相条，点预设色或在输入框里输入（失焦或回车后解析），都会立即写入 `v-model` 并触发 `change`。`clearable`（默认开启）时悬停触发器出现清除图标，点击后提交 `nullValue`（默认 `''`），并在 `change` 之后触发 `clear`。

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
	<div class="color-picker-demo">
		<div class="color-picker-demo__row">
			<ColorPicker v-model="color" @change="handleChange" @clear="handleClear" />
			<ColorPicker v-model="nullableColor" :null-value="null" />
			<ColorPicker v-model="fixedColor" :clearable="false" />
		</div>
		<p class="color-picker-demo__result">当前：{{ color || '未选择' }}；最近一次 change：{{ lastChange }}</p>
		<p class="color-picker-demo__result">nullValue 为 null：{{ JSON.stringify(nullableColor) }}；不可清除：{{ fixedColor }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { ColorPicker } from '@deot/vc';

const color = ref('#1DB88C');
const nullableColor = ref('#456CF6');
const fixedColor = ref('#FF4500');
const lastChange = ref('-');

const handleChange = (value) => {
	lastChange.value = value || '已清空';
};

const handleClear = () => {
	lastChange.value = '触发 clear';
};
</script>

<style scoped>
.color-picker-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.color-picker-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}

.color-picker-demo__result {
	margin: 0;
	overflow-wrap: anywhere;
}
</style>
```
:::

### 确认后提交

`confirm` 为 `true` 时浮层底部显示「确定」：选色只是预览（触发器跟随，并触发 `color-change`），点「确定」才提交；点外部关闭则放弃修改，触发器在开始收起时就回到已提交的颜色。浮层开始展开或收起时触发 `visible-change`，入场完成触发 `ready`，离场完成触发 `close`。

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
	<div class="color-picker-demo">
		<ColorPicker
			v-model="color"
			confirm
			@color-change="handleColorChange"
			@visible-change="handleVisibleChange"
			@ready="handleReady"
			@close="handleClose"
		/>
		<p class="color-picker-demo__result">已提交：{{ color || '未选择' }}；预览：{{ previewColor }}</p>
		<p class="color-picker-demo__result">{{ status }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { ColorPicker } from '@deot/vc';

const color = ref('#456CF6');
const previewColor = ref(color.value);
const status = ref('等待操作');

const handleColorChange = (value) => {
	previewColor.value = value;
};

const handleVisibleChange = (isVisible) => {
	status.value = `visible-change：${isVisible}`;
};

const handleReady = () => {
	status.value = '触发 ready';
};

const handleClose = () => {
	previewColor.value = color.value;
	status.value = '触发 close';
};
</script>

<style scoped>
.color-picker-demo {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 16px;
}

.color-picker-demo__result {
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
{
	views: ['runtime', 'files'],
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="color-picker-demo">
		<div class="color-picker-demo__row">
			<Checkbox v-model="isAlpha">启用透明度</Checkbox>
			<Select v-model="format" :data="formats" label="输出格式" class="color-picker-demo__select" />
		</div>
		<ColorPicker v-model="color" :alpha="isAlpha" :format="format" />
		<p class="color-picker-demo__result">当前：{{ color || '未选择' }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Checkbox, ColorPicker, Select } from '@deot/vc';

const color = ref('#13CE66CC');
const isAlpha = ref(true);
const format = ref('hex');
const formats = ['hex', 'rgb', 'hsl', 'hsv'].map(value => ({ value, label: value }));
</script>

<style scoped>
.color-picker-demo {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 16px;
}

.color-picker-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}

.color-picker-demo__select {
	width: 200px;
}

.color-picker-demo__result {
	margin: 0;
	overflow-wrap: anywhere;
}
</style>
```
:::

### 预设色

`colors` 为 `true` 时显示内置的 20 个颜色（`ColorPicker.colors`），为数组时显示自定义颜色，可以在内置色的基础上扩展。无法解析的项会被跳过。关闭 `panel` 和 `hue` 可以只保留预设色；`:editable="false"` 时底部只显示色值，不能输入。

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
	<div class="color-picker-demo">
		<div class="color-picker-demo__row">
			<span>内置色</span>
			<ColorPicker v-model="builtinColor" colors />
			<span>只选预设色</span>
			<ColorPicker v-model="presetColor" :colors="colors" :panel="false" :hue="false" :editable="false" />
		</div>
		<p class="color-picker-demo__result">内置：{{ builtinColor || '未选择' }}；预设：{{ presetColor || '未选择' }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { ColorPicker } from '@deot/vc';

const builtinColor = ref('#5495F6');
const presetColor = ref('#FF4500');
const colors = ['#FF4500', '#FFD700', '#1DB88C', '#456CF6', ...ColorPicker.colors.slice(0, 2)];
</script>

<style scoped>
.color-picker-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.color-picker-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}

.color-picker-demo__result {
	margin: 0;
	overflow-wrap: anywhere;
}
</style>
```
:::

### 自定义触发器

默认插槽替换内置触发器，参数为 `{ value, color }`：`value` 是 `v-model` 原值，`color` 可直接用于 CSS（hsv 等 CSS 不支持的格式已转换；未选择时为空字符串）。`trigger` 设置浮层的触发方式，`arrow` 显示浮层箭头；`placement` 等其他属性透传给 Popover。

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
	<div class="color-picker-demo">
		<ColorPicker v-model="color" alpha format="hsv">
			<template #default="{ value, color: css }">
				<Button>
					<span class="color-picker-demo__dot" :style="{ background: css || 'transparent' }" />
					{{ value || '选择颜色' }}
				</Button>
			</template>
		</ColorPicker>
		<ColorPicker v-model="hoverColor" trigger="hover" placement="right" arrow />
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, ColorPicker } from '@deot/vc';

const color = ref('hsva(210, 80%, 90%, 0.8)');
const hoverColor = ref('#1DB88C');
</script>

<style scoped>
.color-picker-demo {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}

.color-picker-demo__dot {
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
{
	views: ['runtime', 'files'],
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="color-picker-demo">
		<Checkbox v-model="isDisabled">禁用</Checkbox>
		<div class="color-picker-demo__row">
			<ColorPicker v-for="size in sizes" :key="size" v-model="color" :size="size" :disabled="isDisabled" />
		</div>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Checkbox, ColorPicker } from '@deot/vc';

const color = ref('#456CF6');
const isDisabled = ref(false);
const sizes = ['mini', 'small', 'medium', 'large'];
</script>

<style scoped>
.color-picker-demo {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 16px;
}

.color-picker-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}
</style>
```
:::

### 只读文字

`plaintext` 时只显示色值文字（v-model 原样），不渲染色块与浮层：输出一个没有样式的 `<span class="vc-color-picker-plaintext">`，不能交互，`class`、`style` 等 attribute 落在它上面。优先于 `disabled`。没有值时显示 `extra`，未传时为空。

`MColorPicker` 同样支持，文字由 `formatter` 生成（同触发行），不显示色块，输出 `<span class="vcm-color-picker-plaintext">`。

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
	<div class="color-picker-demo">
		<div>颜色：<ColorPicker model-value="#5495F6" plaintext /></div>
		<div>空值：<ColorPicker extra="-" plaintext /></div>
	</div>
</template>

<script setup>
import { ColorPicker } from '@deot/vc';
</script>

<style scoped>
.color-picker-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}
</style>
```
:::

### 独立面板

`ColorPicker.View` 直接展示选色区域，没有浮层、输入框和按钮。用户操作时触发 `update:modelValue` 和 `change`，第二个参数为当前 `Color` 实例；父组件改值或切换 `alpha` / `format` 时不回抛事件。

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
	<div class="color-picker-demo">
		<div class="color-picker-demo__view">
			<ColorPicker.View v-model="color" alpha colors @change="handleChange" />
		</div>
		<p class="color-picker-demo__result">当前：{{ color }}；RGB 通道：{{ channels }}</p>
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
.color-picker-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.color-picker-demo__view {
	width: 240px;
	max-width: 100%;
}

.color-picker-demo__result {
	margin: 0;
	overflow-wrap: anywhere;
}
</style>
```
:::

### 色值工具

`ColorPicker.Color` 解析和转换色值，方法见 [Color 工具](#color-工具)。下例输入任意写法，用 `Color.parse` 解析后 `setOptions` 切换输出格式，`get` / `set` 读写通道，`toCss` 得到可用于 CSS 的色值，`compare` 判断与 `setColor` 设置的基准色是否近似。

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
	<div class="color-picker-demo">
		<Input v-model="text" placeholder="输入色值，如 hsv(120, 50%, 50%)" class="color-picker-demo__input" />
		<div class="color-picker-demo__row">
			<Button @click="handleLighten">明度 +10</Button>
		</div>
		<p class="color-picker-demo__result">{{ result }}</p>
	</div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { Button, ColorPicker, Input } from '@deot/vc';

const { Color } = ColorPicker;
const text = ref('hsv(120, 50%, 50%)');
const base = new Color({});
base.setColor('#408040');

const result = computed(() => {
	const color = Color.parse(text.value);
	if (!color) return '无法解析';
	color.setOptions({ alpha: true, format: 'rgb' });
	return `输出：${color.states.output}；CSS：${color.toCss()}；色相：${Math.round(color.get('hue'))}；与 #408040 近似：${color.compare(base)}`;
});

const handleLighten = () => {
	const color = Color.parse(text.value, { format: 'hsv' });
	if (!color) return;
	color.set('value', Math.min(100, color.get('value') + 10));
	text.value = color.states.output;
};
</script>

<style scoped>
.color-picker-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.color-picker-demo__input {
	width: min(100%, 320px);
}

.color-picker-demo__row {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}

.color-picker-demo__result {
	margin: 0;
	overflow-wrap: anywhere;
}
</style>
```
:::

### 键盘与无障碍

- 触发器可聚焦（`role="button"`、`aria-haspopup`、`aria-expanded`）：`Enter` / 空格 / `↓` 打开浮层，`Esc` 关闭。
- 色板 `role="slider"`，`aria-valuetext` 为当前色值：`←` `→` 调饱和度，`↑` `↓` 调明度，按住 `Shift` 一次 10。
- 色相条、透明度条就是 [Slider](../slider/README.md)：方向键、`PageUp` / `PageDown`、`Home` / `End` 与 Slider 相同；鼠标按住轨道任意位置即可拖动。
- 预设色是按钮（`aria-pressed` 标记选中），`Tab` 聚焦，`Enter` / 空格选中。

## 移动端

`MColorPicker` 是独立的移动端组件：默认渲染 MListItem（色块 + 色值，未选择时为「请选择」；`label`、`labelWidth`、`arrow` 传给它），点击后从底部弹出选色视图。`v-model`、`format`、`alpha`、`hue`、`panel`、`colors`、`nullValue`、`clearable`、`editable` 与桌面端同名同义；`confirm` 含义相同，但默认为 `true`（拖动选色需要确认）。尺寸按 750 稿设计，写为 `calc(var(--vc-rem) * n)`，随 `--vc-rem` 缩放，底栏切换 `rem` 可查看不同屏宽下的效果。

### 移动端选色

- 选色视图与桌面端浮层的区别：顶部是一行取值——色块、色值（`editable` 时可输入，失焦或回车时解析）、「清空」（`clearable` 且有值时）；色板、色相 / 透明度条与预设色加大，滑块为圆形，预设色一行 8 个铺满。
- 默认由「确定」提交（触发 `ok`），取消或点蒙层关闭放弃修改（触发 `cancel`）。`true` 或 `'top'` 为顶部的「取消 / 确定」工具栏，文字由 `cancelText`、`okText` 设置；`'bottom'` 为底部的大按钮，此时「清空」也移到底部，与「确定」平分宽度。没有选色就确定时提交默认色（同桌面端），清空过则提交 `nullValue`。
- `confirm` 为 `false`：拖动色板、色条或输入色值即提交，弹层保持打开，标题栏右侧有关闭按钮；点预设色提交并关闭（点的就是当前颜色时直接关闭）；清空即提交 `nullValue`，弹层保持打开，可以接着选。
- 未选择时色板停在默认红色（或清空前的颜色），预设色不标记选中；点选与色板相同的颜色也会提交。
- `formatter` 生成色块旁的文字；默认插槽替换整个触发区，参数同桌面端。
- `MColorPicker.open(options)` 直接打开弹层，通过 `onOk(value)` / `onChange(value)` 接收结果。

:::playground
<!--
<config lang="json5">
{
	mobile: true,
	local: false,
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
	<div class="m-color-picker-demo">
		<MColorPicker
			v-model="basic"
			label="确定后提交"
			label-width="200"
			title="选择颜色"
			cancel-text="返回"
			ok-text="完成"
			@ok="handleOk"
			@cancel="handleCancel"
		/>
		<MColorPicker
			v-model="instant"
			:confirm="false"
			:formatter="value => (value ? value.toLowerCase() : '')"
			label="选色即提交"
			label-width="200"
			title="选择颜色"
			colors
		/>
		<MColorPicker v-model="alpha" label="透明度" label-width="200" title="选择颜色" alpha />
		<MColorPicker v-model="bottom" :arrow="false" label="底部按钮" label-width="200" title="选择颜色" confirm="bottom" colors />
		<MColorPicker v-model="custom" title="选择颜色">
			<template #default="{ value, color }">
				<div class="m-color-picker-demo__trigger">
					<span class="m-color-picker-demo__dot" :style="{ background: color || 'transparent' }" />
					{{ value || '自定义触发区' }}
				</div>
			</template>
		</MColorPicker>
		<div class="m-color-picker-demo__actions">
			<MButton type="primary" @click="handleOpen">MColorPicker.open 直接调用</MButton>
		</div>
		<p class="m-color-picker-demo__result">basic：{{ basic }}；instant：{{ instant }}；alpha：{{ alpha }}</p>
		<p class="m-color-picker-demo__result">bottom：{{ bottom }}；open：{{ opened || '-' }}</p>
		<p class="m-color-picker-demo__result">{{ status }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MButton, MColorPicker } from '@deot/vc';

const basic = ref('');
const instant = ref('#456CF6');
const alpha = ref('rgba(19, 206, 102, 0.8)');
const bottom = ref('#456CF6');
const custom = ref('#FF4500');
const opened = ref('');
const status = ref('等待操作');

const handleOk = (value) => {
	status.value = `ok：${value}`;
};

const handleCancel = () => {
	status.value = '触发 cancel';
};

const handleOpen = async () => {
	try {
		const result = await MColorPicker.open({ value: opened.value, title: '直接调用', colors: true });
		opened.value = result.value;
	} catch {
		status.value = '已取消';
	}
};
</script>

<style scoped>
.m-color-picker-demo {
	display: flex;
	flex-direction: column;
	gap: calc(var(--vc-rem) * 16);
}

.m-color-picker-demo__trigger {
	display: flex;
	align-items: center;
	gap: calc(var(--vc-rem) * 16);
	padding: calc(var(--vc-rem) * 24) calc(var(--vc-rem) * 32);
}

.m-color-picker-demo__dot {
	width: calc(var(--vc-rem) * 32);
	height: calc(var(--vc-rem) * 32);
	border-radius: 50%;
}

.m-color-picker-demo__actions {
	display: flex;
	padding-inline: calc(var(--vc-rem) * 32);
}

.m-color-picker-demo__result {
	margin: 0;
	padding-inline: calc(var(--vc-rem) * 32);
	overflow-wrap: anywhere;
}
</style>
```
:::

### 移动端内嵌视图

`MColorPicker.View`（即 `MColorPickerView`）是内嵌的选色视图：每次操作都更新 `v-model` 并触发 `change`，点「清空」触发 `clear`；通过 ref 调用 `clear()` 与点击「清空」相同。

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
	<div class="m-color-picker-demo">
		<MColorPicker.View ref="viewRef" v-model="value" colors clearable @change="handleChange" @clear="handleClear" />
		<div class="m-color-picker-demo__actions">
			<MButton @click="handleReset">调用 clear()</MButton>
		</div>
		<p class="m-color-picker-demo__result">{{ value || '未选择' }}；{{ status }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MButton, MColorPicker } from '@deot/vc';

const viewRef = ref();
const value = ref('#1DB88C');
const status = ref('等待操作');

const handleChange = (nextValue) => {
	status.value = `change：${nextValue || '空'}`;
};

const handleClear = () => {
	status.value = '触发 clear';
};

const handleReset = () => {
	viewRef.value.clear();
};
</script>

<style scoped>
.m-color-picker-demo {
	display: flex;
	flex-direction: column;
	gap: calc(var(--vc-rem) * 32);
}

.m-color-picker-demo__actions {
	display: flex;
	padding-inline: calc(var(--vc-rem) * 32);
}

.m-color-picker-demo__result {
	margin: 0;
	padding-inline: calc(var(--vc-rem) * 32);
	overflow-wrap: anywhere;
}
</style>
```
:::

## 主题与局部覆盖

全局参数通过 `--vc-<参数>` 配置，单个组件通过 `--vc-color-picker-<参数>` 覆盖。

色谱、饱和度/明度黑白渐变、面板光标和透明棋盘格属于绘图数据，不随主题改变。⚠ color-mix：触发器色块及预设色块边框由 color-contrast-dark 以 15% 与透明色混合；不支持 color-mix 时使用 Sass 编译的固定黑色 rgba() 降级值，不随 color-contrast-dark 变量变化。

色相条、透明度条复用 Slider：轨道粗细写在 `.vc-color-picker-view__hue` / `.vc-color-picker-view__alpha` 上的 Slider 局部参数（`--vc-slider-track-size` 10px），可以在同样的位置覆盖；滑块通过 Slider 的 `#thumb` 插槽画成竖条（`.vc-color-picker-view__thumb`）。浮层内的输入框和按钮使用 Input / Button 各自的主题。

移动端（MColorPickerView）与桌面端渲染相同的色板、色条和预设色，只在 `.vcm-color-picker-view` 上覆盖下方的局部尺寸参数；色相、透明度条为 MSlider，取值行的输入框为 MInput，弹层为 MPickerPopup，各自使用自己的主题。

### 全局

| 参数 | 使用位置 | 值 |
| --- | --- | --- |
| color-contrast-dark | 触发器色块及预设色块边框的派生基色 | `#000000`（亮暗主题相同） |
| color-contrast-light | 色相、透明度条的滑块背景 | `#FFFFFF`（亮暗主题相同） |
| color-dark-light | 不可编辑时的色值文字（含移动端取值行） | 亮色：`#080F20`；暗色：`#E8E8E8` |
| color-dark-extralight | 触发器箭头及清除图标 | 亮色：`#909399`；暗色：`#B9B9B9` |
| color-disabled | 亮色禁用触发器背景 | `#EBEEF5` |
| color-error | 未选择时色块斜线 | `#F53F3F` |
| color-neutral-light | 底部分隔线 | 亮色：`#EDEFF1`；暗色：`#3B4354` |
| color-primary | 触发器悬停及亮色聚焦边框、预设色选中阴影、移动端「清空」文字及预设色选中环 | `#456CF6` |
| color-primary-light | 暗色聚焦边框 | `#4A96FF` |
| color-primary-lighter | 触发器聚焦光晕、色板、滑块及预设色的键盘聚焦光环 | `rgba(45, 140, 240, 0.2)` |
| color-shadow-fixed | 色相、透明度条的滑块阴影 | 亮色：`rgb(0 0 0 / 6%)`；暗色：`rgb(0 0 0 / 24%)` |
| background-color-light | 暗色禁用触发器背景 | 亮色：`#F7F8FA`；暗色：`#2D3444` |
| background-color | 移动端取值行输入框的灰底 | 亮色：`#F5F6FA`；暗色：`#252B3A` |
| background-color-lightest | 触发器背景、未选择时色块底色、移动端视图背景及预设色选中环的间隙 | 亮色：`#FFFFFF`；暗色：`#252B3A` |
| border-color | 触发器边框、色相及透明度条的滑块边框 | `#D5D9E1` |

### 局部

尺寸写成局部参数 `--vc-color-picker-<参数>`，默认值为桌面端的尺寸，MColorPickerView 在 `.vcm-color-picker-view` 上覆盖为 750 稿的值（括号内为 375 宽下）：

| 参数 | 使用位置 | 桌面端 | 移动端 |
| --- | --- | --- | --- |
| view-gap | 各部分之间的间距 | `8px` | `16px` |
| panel-height | 色板高度 | `180px` | `180px` |
| cursor-size | 色板光标直径 | `4px` | `22px` |
| cursor-shadow | 色板光标的白边与阴影 | 白边 1.5px + 内外阴影 | 白边 3px + 阴影 |
| thumb-width / thumb-height | 色相、透明度条的滑块 | `4px` / `10px` | `28px` / `28px` |
| thumb-background | 滑块填充 | `color-contrast-light` | 色相条为纯色相，透明度条为当前颜色 |
| thumb-border | 滑块边框 | `1px solid border-color` | `3px solid #FFFFFF` |
| thumb-radius | 滑块圆角 | `1px` | `50%` |
| thumb-shadow | 滑块阴影 | `0 0 2px color-shadow-fixed` | `0 1px 4px rgb(0 0 0 / 20%)` |
| hue-radius / alpha-radius | 色相、透明度条圆角 | `2px` / `0` | `6px` / `6px` |
| predefine-size | 预设色块尺寸 | `18px` | `auto`（一行 8 个铺满，正方形） |
| predefine-gap | 预设色块间距 | `6px` | `10px` |
| predefine-radius | 预设色块圆角 | `2px` | `4px` |
| predefine-selected-shadow | 预设色选中的光环 | `0 0 2px 1px color-primary` | 2px 底色间隙 + 2px 主色环 |

MColorPickerView 的根节点另有三个由组件写入的参数，用于移动端光标和滑块的填充：`--vc-color-picker-solid-color`（当前颜色，不透明）、`--vc-color-picker-hue-color`（纯色相）、`--vc-color-picker-current-color`（当前颜色，含透明度）。

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
| plaintext | 只显示色值文字，不渲染色块与浮层，没有样式、不能交互；见[只读文字](#只读文字) | `boolean` | - | `false` |
| extra | `plaintext` 没有值时显示的文字 | `string` | - | `''` |
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

### MColorPicker 属性

`MColorPicker` 是独立的移动端组件，见[移动端选色](#移动端选色)。支持下方 MColorPickerView 的全部属性，另有：

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| label | MListItem 左侧标题 | `string` | - | - |
| labelWidth | 标题宽度 | `string \| number` | - | - |
| arrow | 右侧箭头，禁用时不显示 | 同 MListItem | - | 同 MListItem |
| plaintext | 只显示 `formatter` 生成的文字，不渲染色块、MListItem 与弹层，没有样式、不能交互；见[只读文字](#只读文字) | `boolean` | - | `false` |
| extra | 未选择时显示的文字 | `string` | - | 当前语言的 `vc.ColorPicker.placeholder`；`plaintext` 时为 `''` |
| formatter | 生成色块旁的文字 | `(value: string) => any` | - | 原样显示 |
| disabled | 禁用，不打开弹层 | `boolean` | - | `false` |
| title | 弹层标题。字符串按文本渲染，也可传渲染函数或 `{ type, value }`（需要 HTML 时传 `{ type: 'html', value }`），见 [Customer](../customer/README.md) | `string \| number \| Function \| { type: string; value: any }` | - | `''` |
| confirm | 由「确定」提交；`false` 时拖动或输入即提交、弹层保持打开，点预设色提交并关闭 | `boolean \| 'top' \| 'bottom'` | - | `true` |
| cancelText / okText | 「取消」「确定」文字 | `string` | - | 当前语言的 `vc.Picker.*` |

### MColorPicker 事件

| 事件名 | 说明 | 回调参数 |
| --- | --- | --- |
| update:modelValue | 提交色值：确定时；不需要确认时为拖动、输入、清空或点预设色时 | `(value: string \| null) => void` |
| change | 与 `update:modelValue` 一起触发，并通知表单校验 | `(value: string \| null) => void` |
| clear | 点击「清空」 | `() => void` |
| color-change | 弹层内的色值变化（`confirm` 时为未提交的预览） | `(value: string) => void` |
| ok | 点击「确定」；不需要确认时为点预设色（同时关闭）；先于 `change` | `(value: string \| null) => void` |
| cancel | 取消或关闭弹层 | `() => void` |
| visible-change | 弹层开始展开或收起 | `(isVisible: boolean) => void` |
| close | 弹层离场完成 | `() => void` |

### MColorPicker 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 自定义触发区，同桌面端 | `{ value: string \| null; color: string }` |

### MColorPicker 方法

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| open | 直接打开弹层 | MColorPickerView 的属性、`title`、`confirm`、`cancelText`、`okText`，以及 `onOk(value)`、`onChange(value)`、`onCancel()`、`onClear()`、`onColorChange(value)`、`onVisibleChange(visible)`、`onClose()` | Portal 实例，可 `await` 得到 `{ value }`（同 `onOk`，取消时拒绝），可调用 `destroy()` |

`MColorPicker.open` 通过 `onOk`（确定时）或 `onChange`（每次提交，含不需要确认时的拖动与输入）接收结果；返回的 Portal 实例可以 `await`：确定后（关闭动画结束时）得到 `onOk` 的参数组成的对象 `{ value }`，取消、点遮罩等没有确定就关闭时拒绝（只用回调时不会产生未处理的拒绝）；也可调用 `destroy()`。兼容 `value` 作为初始值的别名，同时传入时以 `modelValue` 为准。`MColorPicker.View` 与 `MColorPickerView` 为同一组件；`MColorPicker.Color`、`MColorPicker.colors` 同桌面端。

### MColorPickerView 属性与事件

属性为 ColorPicker 的 `modelValue`、`panel`、`hue`、`alpha`、`colors`、`format`、`editable`、`clearable`、`nullValue`，类型和默认值相同。

| 事件名 | 说明 | 回调参数 |
| --- | --- | --- |
| update:modelValue | 用户操作导致色值变化，或清空（值为 `nullValue`，没有第二个参数）；父组件改值或改 `alpha` / `format` 时不触发 | `(value: string \| null, color?: Color) => void` |
| change | 与 `update:modelValue` 一起触发 | `(value: string \| null, color?: Color) => void` |
| clear | 点击「清空」，先于提交 `nullValue` | `() => void` |

| 方法名 | 说明 |
| --- | --- |
| clear | 清空，同点击「清空」 |
