## 加载中（Spin）

展示持续旋转的加载图标，可带文字提示；包裹内容时在内容上居中显示加载图标，可带蒙层。移动端入口导出的 `MSpin` 与 `Spin` 的属性和插槽相同，数字长度为 750 稿，见 [移动端](#移动端)。

### 何时使用

- 按钮、输入框、列表末端等局部位置，提示正在加载。
- 卡片、表格、表单等区域等待数据时，包住该区域，在其上显示加载图标，避免重复提交或误操作。

### 基础用法

`size` 控制默认图标的尺寸，单位为 px（`MSpin` 中为 750 稿长度）。图标与 Icon 一样像文字排版：与文字混排时，中心落在父级字体字符框的中心。

:::playground
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<div style="display: flex; align-items: center; gap: 24px">
		<Spin :size="size" />
		<InputNumber v-model="size" :min="16" :max="56" :step="4" style="width: 96px" />
		<span>文字 <Spin :size="16" /> 混排</span>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { InputNumber, Spin } from '@deot/vc';

const size = ref(28);
</script>
```
:::

### 文字提示

`tip` 或 `tip` 插槽显示在图标下方，颜色与转动弧相同。`loading` 为 `false` 时不显示。

:::playground
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<div style="display: flex; align-items: center; gap: 48px">
		<Spin tip="加载中，请稍候" />
		<Spin>
			<template #tip>
				已加载 <b>{{ percent }}%</b>
			</template>
		</Spin>
	</div>
</template>

<script setup>
import { onBeforeUnmount, ref } from 'vue';
import { Spin } from '@deot/vc';

const percent = ref(0);
const timer = setInterval(() => (percent.value = (percent.value + 7) % 100), 300);
onBeforeUnmount(() => clearInterval(timer));
</script>
```
:::

### 包裹内容

有默认插槽时，`Spin` 包住其中的内容：`loading` 为 `true` 时在内容上居中显示加载图标，默认带一层半透明蒙层，内容变淡且不可操作，外层带 `aria-busy`。`mask` 为 `false` 时只显示图标，内容仍可操作。内容始终保留，切换加载状态不会重新渲染。

:::playground
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<div style="display: grid; gap: 16px">
		<div style="display: flex; align-items: center; gap: 16px">
			<Switch v-model="loading" />
			<span>加载中</span>
			<Switch v-model="mask" />
			<span>蒙层</span>
		</div>
		<Spin :loading="loading" :mask="mask" tip="加载中">
			<div style="padding: 24px; border: 1px solid var(--vc-border-color); border-radius: 8px">
				<h4 style="margin: 0 0 8px">区域标题</h4>
				<p style="margin: 0 0 12px">这里是被包裹的内容，加载时上面会显示加载图标。</p>
				<Button size="small">区域内的按钮</Button>
			</div>
		</Spin>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, Spin, Switch } from '@deot/vc';

const loading = ref(true);
const mask = ref(true);
</script>
```
:::

### 延迟显示

`delay`（毫秒）：`loading` 持续超过 `delay` 才显示图标，请求很快时不会闪一下；`loading` 变为 `false` 时立即隐藏。

:::playground
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<div style="display: grid; gap: 16px">
		<div style="display: flex; gap: 8px">
			<Button @click="load(150)">快请求（150ms）</Button>
			<Button @click="load(1500)">慢请求（1500ms）</Button>
		</div>
		<Spin :loading="loading" :delay="300">
			<div style="padding: 24px; border: 1px solid var(--vc-border-color); border-radius: 8px">
				第 {{ count }} 次结果
			</div>
		</Spin>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, Spin } from '@deot/vc';

const loading = ref(false);
const count = ref(1);
const load = (duration) => {
	loading.value = true;
	setTimeout(() => {
		count.value++;
		loading.value = false;
	}, duration);
};
</script>
```
:::

### 自定义颜色与图标

`color` 设置转动弧的颜色，`trackColor` 设置轨道的颜色；也可以在祖先上设置局部变量 `--vc-spin-color`、`--vc-spin-track-color`、`--vc-spin-stroke-width`。`loading` 插槽替换默认图标，插槽容器的字号为 `size`，其中的 SVG 仍会旋转。

:::playground
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<div style="display: grid; gap: 16px">
		<div style="display: flex; align-items: center; gap: 12px">
			<Spin :color="color" :track-color="trackColor" />
			<label>转动弧</label>
			<ColorPicker v-model="color" />
			<label>轨道</label>
			<ColorPicker v-model="trackColor" />
		</div>
		<div style="display: flex; align-items: center; gap: 24px; --vc-spin-stroke-width: 4">
			<Spin />
			<span>局部变量：线宽 4</span>
		</div>
		<Spin :size="24">
			<template #loading>
				<svg viewBox="0 0 24 24">
					<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="3" stroke-dasharray="16 8" />
				</svg>
			</template>
		</Spin>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { ColorPicker, Spin } from '@deot/vc';

const color = ref('#e6a23c');
const trackColor = ref('#64758b');
</script>
```
:::

## 移动端

`MSpin` 的属性、插槽、结构与 `Spin` 相同，根节点另有标记类 `.vcm-spin`（`.vc-spin.vcm-spin`）；数字 `size` 为 750 稿长度（默认 `56`，即 375 宽下 28px），提示文字为 28 / 44（375 宽下 14px / 22px），与图标间距 16（8px），均随 `--vc-rem` 缩放。

```vue
<template>
	<MSpin tip="加载中" />
</template>
<script setup>
import { MSpin } from '@deot/vc';
</script>
```

## 主题与局部覆盖

全局参数通过 `--vc-<参数>` 配置，单个组件通过 `--vc-spin-<参数>` 覆盖。

### 全局

| 参数 | 使用位置 | 值 |
| --- | --- | --- |
| color-primary | 转动弧、提示文字 | `#456CF6` |
| color-light-deepest | 轨道 | 亮色：`#C0C4CC`；暗色：`#E8E8E8` |
| background-color-lightest | 蒙层底色 | 亮色：`#FFFFFF`；暗色：`#252B3A` |

### 局部

写成局部变量 `--vc-spin-<键>`，可设在 `.vc-spin` 或其祖先上；`color`、`trackColor` 属性即写入前两项。

| 参数 | 使用位置 | 默认值 |
| --- | --- | --- |
| color | 转动弧、提示文字 | `color-primary` |
| track-color | 轨道 | `color-light-deepest` |
| stroke-width | 线宽（图标按 32 × 32 绘制，随尺寸缩放） | `2` |
| tip-font-size / tip-line-height | 提示文字 | `14px` / `22px` |
| tip-gap | 提示与图标的间距 | `8px` |
| mask-opacity | 蒙层不透明度 | `.67` |

## API

`MSpin` 的属性、插槽与 `Spin` 相同，数字 `size` 为 750 稿，可从 `@deot/vc` 导入。

### 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| size | 默认图标尺寸：数字单位为 px（`MSpin` 中为 750 稿长度，默认 `56`），字符串为 CSS 长度；使用 `loading` 插槽时作为插槽容器的字号 | `number \| string` | - | `28` |
| color | 转动弧与提示文字的颜色 | `string` | - | `color-primary` |
| trackColor | 轨道的颜色 | `string` | - | `color-light-deepest` |
| tip | 图标下方的文字提示 | `string` | - | - |
| loading | 是否加载中：为 `false` 时不显示图标；包裹内容时同时撤掉图标与蒙层，内容保留 | `boolean` | - | `true` |
| delay | `loading` 持续超过该毫秒数才显示 | `number` | - | `0` |
| mask | 包裹内容时是否带蒙层；为 `false` 时内容仍可操作 | `boolean` | - | `true` |

### 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 被包裹的内容；有此插槽时在内容上显示加载图标 | - |
| tip | 图标下方的文字提示，优先于 `tip` 属性 | - |
| loading | 替换默认图标，容器的字号为 `size` | - |

### 无障碍

图标根节点为 `role="status"`；没有提示时 `aria-label` 为语言包中的「加载中」（`vc.Spin.loading`），默认图标对读屏隐藏。包裹内容时，加载中外层带 `aria-busy="true"`。
