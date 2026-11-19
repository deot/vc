## 进度条（Progress）

展示操作的当前进度，支持线形和圆形。

### 何时使用

用于上传、下载或其他耗时操作，展示已完成的百分比及成功、失败状态。

### 基础用法

`type` 控制形态，`status` 控制状态。`percent` 先转换为数字（无法转换时为 0），再限制在 0–100 之间；达到 100 时强制使用成功状态。线形在成功、失败状态下用图标代替百分比。

挂载时进度从 0 过渡到当前值，之后每次变化也有过渡。这一效果依赖 CSS `@starting-style`，不支持的浏览器直接显示当前值。

:::playground
<!-- <config lang="json5">{ previewInset: 20 }</config> -->
```vue
<template>
	<div class="progress-demo">
		<div class="progress-item"><span>进行中</span><Progress :percent="40" /></div>
		<div class="progress-item"><span>已完成</span><Progress :percent="100" /></div>
		<div class="progress-item"><span>失败</span><Progress :percent="30" status="error" /></div>
		<div class="progress-item"><span>隐藏文本</span><Progress :percent="60" :stroke-width="16" :show-text="false" /></div>
	</div>
</template>
<script setup>
import { Progress } from '@deot/vc';
</script>
<style scoped>
.progress-demo {
	display: grid;
	gap: 20px;
}
.progress-item {
	display: grid;
	grid-template-columns: 72px 1fr;
	align-items: center;
	gap: 12px;
}
</style>
```
:::

### 动态进度

更新 `percent` 即可改变进度。`animated` 为线形进度条增加循环高光动画。

:::playground
<!-- <config lang="json5">{ previewInset: 20 }</config> -->
```vue
<template>
	<div class="progress-demo">
		<Progress :percent="percent" animated />
		<div class="progress-actions">
			<Button @click="percent = Math.max(0, percent - 10)">减少进度</Button>
			<Button @click="percent = Math.min(100, percent + 10)">增加进度</Button>
		</div>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Progress, Button } from '@deot/vc';

const percent = ref(30);
</script>
<style scoped>
.progress-demo {
	display: grid;
	gap: 20px;
}
.progress-actions {
	display: flex;
	gap: 12px;
}
</style>
```
:::

### 文字在条内、自定义文字与置灰

- `textInside`：线形的文字以白字显示在进度条内，靠近进度末端，此时不显示状态图标，线高默认 16px。
- 默认插槽：两种形态都可以用它替换文字，参数为 `{ percent, status }`。插槽内容不受 `showText` 控制，也会替换线形的状态图标。
- `disabled`：进度和文字改用 `foreground-color-inactive`，忽略 `color`，并停止 `animated`。

:::playground
<!-- <config lang="json5">{ previewInset: 20 }</config> -->
```vue
<template>
	<div class="progress-demo">
		<Progress :percent="60" text-inside />
		<Progress :percent="60">
			<template #default="{ percent, status }">
				<span>{{ status === 'success' ? '完成' : `${percent} / 100` }}</span>
			</template>
		</Progress>
		<Progress :percent="60" disabled />
	</div>
</template>
<script setup>
import { Progress } from '@deot/vc';
</script>
<style scoped>
.progress-demo {
	display: grid;
	gap: 20px;
}
</style>
```
:::

### 圆形与自定义颜色

`color` 可以传一个统一的颜色，也可以传按 `default`、`success`、`error` 取值的对象，对象里缺少的状态使用主题色。`trackColor` 控制轨道颜色。

圆形中心的默认文字字号为 `size` 的 20%，可以通过 `textClass` / `textStyle` 覆盖；中心内容也可以通过默认插槽替换。进度为 0 时不绘制进度弧。

:::playground
<!-- <config lang="json5">{ previewInset: 20 }</config> -->
```vue
<template>
	<div class="progress-circles">
		<div class="progress-card"><span>自定义颜色</span><Progress type="circle" :percent="50" :stroke-width="10" color="#ed4014" /></div>
		<Progress
			type="circle"
			:percent="100"
			:color="{ default: '#456cf6', success: '#1db88c', error: '#f04134' }"
		/>
		<Progress type="circle" :percent="60" :size="150">
			<span>已完成 60%</span>
		</Progress>
	</div>
</template>
<script setup>
import { Progress } from '@deot/vc';
</script>
<style scoped>
.progress-circles {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 20px;
}
.progress-card {
	display: grid;
	justify-items: center;
	gap: 12px;
}
</style>
```
:::

## 移动端

`MProgress` 的属性、插槽、结构都与 `Progress` 相同，根节点另有标记类 `.vcm-progress`；结构样式、颜色与主题参数共用。

尺寸按 750 稿设计：数字 `strokeWidth`（线形）和数字 `size` 为 750 稿长度，写为 `calc(var(--vc-rem) * n)`，随 `--vc-rem` 缩放。圆形的 `strokeWidth` 仍是 SVG 坐标系中的宽度，两端相同。

| 项 | 移动端（括号内为 375 宽下的 px） | 桌面端 |
| --- | --- | --- |
| 线高 | 8（4） | 6px |
| `textInside` 线高 | 36（18） | 16px |
| 文字字号 | 28（14） | 12px |
| 文字与进度条间距 | 16（8） | 8px |
| 文字颜色 | 同进度色 | `color-dark-lightest` |
| `textInside` 文字左右间距 | 12（6） | 6px |
| 圆形尺寸 | 136（68） | 120px |

```vue
<template>
	<MProgress :percent="60" />
	<MProgress type="circle" :percent="60" />
</template>

<script setup>
import { MProgress } from '@deot/vc';
</script>
```

## 主题与局部覆盖

全局参数通过 `--vc-<参数>` 配置，单个组件通过 `--vc-progress-<参数>` 覆盖。

显式的 `color`、`trackColor` 会以内联的 `--vc-progress-bar-color`、`--vc-progress-track-color` 写在根节点上，优先级高于主题值。

### 全局

| 参数 | 使用位置 | 值 |
| --- | --- | --- |
| color-primary | 默认状态的进度色 | `#456CF6` |
| color-success | 成功状态的进度色及图标 | `#1DB88C` |
| color-error | 失败状态的进度色及图标 | `#F53F3F` |
| color-neutral-light | 进度轨道 | 亮色：`#EDEFF1`；暗色：`#3B4354` |
| color-dark-lightest | 进度文字（桌面端） | 亮色：`#64758B`；暗色：`#C9C9C9` |
| foreground-color-inactive | 置灰时的进度与文字 | 亮色：`#C0C4CC`；暗色：`#737D8C` |
| color-contrast-light | 活跃高光、条内文字 | `#FFFFFF`（亮暗主题相同） |

### 局部

两端的尺寸和文字颜色都写成局部变量 `--vc-progress-<键>`。桌面端的默认值见下表，移动端在 `.vcm-progress` 上覆盖，与样式的加载顺序无关。

| 键 | 说明 | 桌面端默认值 |
| --- | --- | --- |
| `bar-color` | 进度色；不设置时取当前状态的主题色 | - |
| `track-color` | 轨道色 | `color-neutral-light` |
| `font-size` | 文字字号 | `12px` |
| `text-color` | 线形百分比与圆形中心文字的颜色 | `color-dark-lightest` |
| `text-gap` | 线形文字与进度条的间距 | `8px` |
| `text-min-width` | 线形文字的最小宽度，整数进度变化时进度条长度不变 | `2.5em` |
| `inner-color` | `textInside` 的文字颜色 | `color-contrast-light` |
| `inner-padding` | `textInside` 的文字左右间距 | `6px` |

## API

### 属性

`Progress` 和 `MProgress` 使用相同属性。

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| type | 进度条形态 | `string` | `line`、`circle` | `line` |
| percent | 进度百分比，限制在 0–100，达到 100 时强制成功 | `number \| string` | - | `0` |
| status | 进度状态；线形显示对应状态图标，圆形仍显示百分比 | `string` | `default`、`success`、`error` | `default` |
| showText | 是否显示默认百分比或线形状态图标 | `boolean` | - | `true` |
| textInside | 线形文字显示在进度条内 | `boolean` | - | `false` |
| textStyle | 默认百分比文本样式，不作用于状态图标或插槽 | `string \| object` | - | - |
| textClass | 默认百分比文本类名，不作用于状态图标或插槽 | `string \| object` | - | - |
| animated | 线形进度条的循环高光动画 | `boolean` | - | `false` |
| disabled | 置灰 | `boolean` | - | `false` |
| strokeWidth | 线形为线高（数字：桌面端 px，移动端 750 稿）；圆形为 SVG 100 × 100 坐标系中的描边宽度，随 size 缩放 | `number` | - | 线形 6（移动端 8），`textInside` 16（移动端 36），圆形 6 |
| size | 圆形画布宽高（数字：桌面端 px，移动端 750 稿；字符串为 CSS 长度） | `number \| string` | - | `120`（移动端 `136`） |
| color | 进度颜色；对象按当前状态取值，缺少的状态使用主题色 | `string \| object` | - | 当前状态的主题色 |
| trackColor | 轨道颜色 | `string` | - | `color-neutral-light` |

### 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 替换文字（线形替换百分比及状态图标，圆形替换中心内容），优先于 showText | `{ percent, status }` |
