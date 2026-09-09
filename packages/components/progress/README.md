## 进度条（Progress）

展示操作的当前进度，支持线形和圆形。`MProgress` 是 `Progress` 的同实现别名。

### 何时使用

用于上传、下载或其他耗时操作，展示已完成的百分比及成功、失败状态。

### 基础用法

`type` 控制形态，`status` 控制状态。`percent` 转换为数字，大于或等于 100 时显示 100 并强制使用成功状态；组件不限制负数，请传入 0–100 的有效数值。

:::playground
<!-- <config lang="json5">{ previewInset: 20 }</config> -->
```vue
<template>
	<div class="progress-demo">
		<Progress :percent="40" />
		<Progress :percent="100" />
		<Progress :percent="30" status="error" />
		<Progress :percent="60" :stroke-width="16" :show-text="false" />
	</div>
</template>
<script setup>
import { Progress } from '@deot/vc';
</script>
<style scoped>
.progress-demo {
	display: grid;
	gap: 16px;
}
</style>
```
:::

### 动态进度

更新 `percent` 即可改变进度。`animated` 为线形进度条增加循环高光动画；普通进度变化本身已有过渡效果。

:::playground
<!-- <config lang="json5">{ previewInset: 20 }</config> -->
```vue
<template>
	<div class="progress-demo">
		<Progress :percent="percent" animated />
		<div>
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
	gap: 16px;
}
</style>
```
:::

### 圆形与自定义颜色

`color` 可传入统一颜色，或按 `normal`、`success`、`error` 提供完整的状态颜色对象。`trackColor` 控制轨道颜色。圆形中心可通过默认插槽替换，插槽内容不受 `showText` 控制。

:::playground
<!-- <config lang="json5">{ previewInset: 20 }</config> -->
```vue
<template>
	<div class="progress-circles">
		<Progress type="circle" :percent="50" :stroke-width="10" color="#ed4014" />
		<Progress
			type="circle"
			:percent="100"
			:color="{ normal: '#456cf6', success: '#1db88c', error: '#f04134' }"
		/>
		<Progress type="circle" :percent="60" :size="150" :show-text="false">
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
</style>
```
:::

## API

### 属性

`Progress` 和 `MProgress` 使用相同属性。

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| type | 进度条形态 | `string` | `line`、`circle` | `line` |
| percent | 进度百分比，达到 100 时强制成功 | `number \| string` | - | `0` |
| status | 进度状态；线形显示对应状态图标，圆形仍显示百分比 | `string` | `normal`、`success`、`error` | `normal` |
| showText | 是否显示默认百分比或线形状态图标 | `boolean` | - | `true` |
| textStyle | 默认百分比文本样式，不作用于状态图标或插槽 | `string \| object` | - | - |
| textClass | 默认百分比文本类名，不作用于状态图标或插槽 | `string \| object` | - | - |
| animated | 线形进度条的循环高光动画 | `boolean` | - | `false` |
| strokeWidth | 线形高度（px）；圆形为 SVG 100 × 100 坐标系中的描边宽度，随 size 缩放 | `number` | - | `6` |
| size | 圆形画布宽高，单位 px | `number` | - | `120` |
| color | 进度颜色；对象按当前状态取值，不会补齐缺失的状态颜色 | `string \| object` | - | 对应主题的 primary / success / error 颜色 |
| trackColor | 轨道颜色 | `string` | - | `var(--vc-progress-track-color, var(--vc-color-light-deeper))` |
| strokeColor | 兼容属性，当前不参与渲染；请使用 color | `string` | - | `#456CF6` |

### 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 仅圆形生效，替换中心内容，优先于 showText | - |

### 主题

默认状态色分别读取 `--vc-progress-color-primary`、`--vc-progress-color-success`、`--vc-progress-color-error`，回退到对应的全局 `--vc-color-*` 变量。显式 `color` 和 `trackColor` 优先于默认主题值。

文本使用 `--vc-progress-color-dark-lightest`，回退到 `--vc-color-dark-lightest`；轨道可通过 `--vc-progress-track-color` 覆盖。线形错误边框使用主题 error 色，循环高光使用 `--vc-progress-active-overlay-color`（默认白色）。
