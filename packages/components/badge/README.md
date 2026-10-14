## 徽标（Badge）

出现在图标或文字的右上角，提示数量或新内容；也可以单独作为状态点使用。`Badge` 与 `MBadge` 指向同一个组件。

### 何时使用

- 在图标、头像、菜单项上提示未读数量或有新内容。
- 在列表、表格中用带颜色的圆点标记状态。

### 基础用法

把内容放进默认插槽，`value` 为数字时在右上角显示徽标。`dot` 显示为小圆点，`dot` 插槽自定义徽标（白底圆角）。

:::playground
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<div class="demo">
		<Badge :value="9">
			<span class="box" />
		</Badge>
		<Badge dot :dot-style="{ width: '10px', height: '10px' }">
			<span class="box" />
		</Badge>
		<Badge :dot-style="{ width: '16px', height: '16px', fontSize: '14px' }">
			<span class="box" />
			<template #dot>
				<Icon type="time" />
			</template>
		</Badge>
	</div>
</template>

<script setup>
import { Badge, Icon } from '@deot/vc';
</script>

<style scoped>
.demo {
	display: flex;
	align-items: center;
	gap: 40px;
}
.box {
	display: block;
	width: 40px;
	height: 40px;
	background: var(--vc-color-neutral);
	border-radius: 4px;
}
</style>
```
:::

### 独立使用

没有默认插槽时，徽标在行内显示。

:::playground
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<div class="demo">
		<Badge :value="2" />
		<Badge :value="2" :dot-style="{ background: '#E5E6EB', color: '#86909C' }" />
		<Badge :value="16" />
		<Badge :value="1000" />
	</div>
</template>

<script setup>
import { Badge } from '@deot/vc';
</script>

<style scoped>
.demo {
	display: flex;
	align-items: center;
	gap: 40px;
}
</style>
```
:::

### 文字与最大值

`value` 为字符串时原样显示。数字超过 `max` 时显示为 `${max}+`，`max` 默认为 `99`，`0` 表示不限。数字小于等于 `0` 时不显示徽标。

:::playground
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<div class="demo">
		<Badge value="NEW">
			<span class="box" />
		</Badge>
		<Badge value="HOT">
			<span class="box" />
		</Badge>
		<Badge :value="100" :max="10">
			<span class="box" />
		</Badge>
		<Badge :value="100">
			<span class="box" />
		</Badge>
		<Badge :value="1000" :max="999">
			<span class="box" />
		</Badge>
		<Badge :value="1000" :max="0">
			<span class="box" />
		</Badge>
	</div>
</template>

<script setup>
import { Badge } from '@deot/vc';
</script>

<style scoped>
.demo {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 40px;
}
.box {
	display: block;
	width: 40px;
	height: 40px;
	background: var(--vc-color-neutral);
	border-radius: 4px;
}
</style>
```
:::

### 偏移

`offset` 为 `[水平, 垂直]`，单位为 px，正值向右、向下；数字表示两个方向相同。

:::playground
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<div class="demo">
		<Badge dot :offset="[6, -2]">
			<a href="javascript:void(0)">链接</a>
		</Badge>
		<Badge dot :offset="[2, -2]">
			<Icon type="message" class="icon" />
		</Badge>
		<Badge :value="5" :offset="[-6, 6]">
			<span class="box" />
		</Badge>
	</div>
</template>

<script setup>
import { Badge, Icon } from '@deot/vc';
</script>

<style scoped>
.demo {
	display: flex;
	align-items: center;
	gap: 40px;
}
.icon {
	font-size: 18px;
	color: #888;
	vertical-align: -3px;
}
.box {
	display: block;
	width: 40px;
	height: 40px;
	background: var(--vc-color-neutral);
	border-radius: 4px;
}
</style>
```
:::

### 状态点

设置 `status` 显示为状态点：`default` 默认、`pending` 进行中、`success` 成功、`warning` 提醒、`error` 错误。`label` 为状态点旁的文字，只传 `label` 时状态按 `default`。

:::playground
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<div class="demo">
		<div class="row">
			<Badge v-for="status in STATUSES" :key="status" :status="status" />
		</div>
		<div class="row">
			<Badge v-for="status in STATUSES" :key="status" :status="status" :label="status" />
		</div>
		<div class="row">
			<span>状态：</span>
			<Badge status="success">
				<template #label>
					<b>已完成</b>
				</template>
			</Badge>
		</div>
	</div>
</template>

<script setup>
import { Badge } from '@deot/vc';

const STATUSES = ['default', 'pending', 'success', 'warning', 'error'];
</script>

<style scoped>
.demo {
	display: flex;
	flex-direction: column;
	gap: 24px;
}
.row {
	display: flex;
	align-items: baseline;
	gap: 24px;
}
</style>
```
:::

### 颜色

`color` 接受任意 CSS 颜色，作用于数字、文字、圆点与状态点，不改变徽标的形态。

:::playground
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<div class="demo">
		<div class="row">
			<Badge v-for="color in COLORS" :key="color" :color="color" :label="color" />
		</div>
		<div class="row">
			<Badge :value="8" color="var(--vc-color-primary)">
				<span class="box" />
			</Badge>
			<Badge dot color="var(--vc-color-success)">
				<span class="box" />
			</Badge>
		</div>
	</div>
</template>

<script setup>
import { Badge } from '@deot/vc';

const COLORS = ['#F53F3F', '#7816FF', '#00B42A', '#165DFF', '#FF7D00', '#EB0AA4', '#86909C'];
</script>

<style scoped>
.demo {
	display: flex;
	flex-direction: column;
	gap: 24px;
}
.row {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 24px 40px;
}
.box {
	display: block;
	width: 40px;
	height: 40px;
	background: var(--vc-color-neutral);
	border-radius: 4px;
}
</style>
```
:::

### 动画

徽标出现、隐藏与形态切换时缩放过渡；数字变化时文字重新缩放。

:::playground
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<div class="demo">
		<div class="row">
			<Badge :dot="isDot" :value="isDot ? count : 0">
				<span class="box" />
			</Badge>
			<Switch v-model="isDot" />
		</div>
		<div class="row">
			<Badge :value="count">
				<span class="box" />
			</Badge>
			<Button @click="count++">+1</Button>
			<Button @click="count = Math.max(count - 1, 0)">-1</Button>
		</div>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Badge, Button, Switch } from '@deot/vc';

const isDot = ref(true);
const count = ref(12);
</script>

<style scoped>
.demo {
	display: flex;
	flex-direction: column;
	gap: 24px;
}
.row {
	display: flex;
	align-items: center;
	gap: 16px;
}
.box {
	display: block;
	width: 40px;
	height: 40px;
	margin-right: 24px;
	background: var(--vc-color-neutral);
	border-radius: 4px;
}
</style>
```
:::

## 主题与局部覆盖

全局参数通过 `--vc-<参数>` 配置，组件级覆盖使用 `--vc-badge-<参数>`。可在组件根节点或其祖先上设置。

### 全局

| 参数 | 使用位置 | 值 |
| --- | --- | --- |
| color-error | 数字、文字、圆点的背景；`error` 状态点 | `#F53F3F` |
| color-contrast-light | 数字、文字的颜色 | `#FFFFFF`（亮暗主题相同） |
| background-color-lightest | 数字、文字、圆点的外圈；自定义徽标的背景 | 亮色：`#FFFFFF`；暗色：`#252B3A` |
| color-neutral | `default` 状态点 | 亮色：`#C4C9D2`；暗色：`#E8E8E8` |
| color-primary | `pending` 状态点 | `#456CF6` |
| color-success | `success` 状态点 | `#1DB88C` |
| color-warning | `warning` 状态点 | `#E6A23C` |
| foreground-color | 状态点旁的文字 | 亮色：`#080F20`；暗色：`#F8F8F8` |

### 局部

当前组件没有额外的局部 CSS 主题参数。

## API

### 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| value | 徽标内容。数字小于等于 `0` 时不显示，超过 `max` 时显示为 `${max}+`；字符串原样显示，空字符串不显示 | `number \| string` | - | - |
| max | 数字的最大显示值，`0` 表示不限 | `number` | - | `99` |
| dot | 显示为小圆点；`value` 为小于等于 `0` 的数字时不显示 | `boolean` | - | `false` |
| status | 显示为状态点 | `string` | `default` / `pending` / `success` / `warning` / `error` | - |
| label | 状态点旁的文字；设置后也显示为状态点（`status` 未设置时按 `default`）。字符串按文本渲染，也可传渲染函数或 `{ type, value }`（需要 HTML 时传 `{ type: 'html', value }`），见 [Customer](../customer/README.md)；`label` 插槽优先 | `string \| number \| Function \| { type: string; value: any }` | - | - |
| color | 徽标的颜色，任意 CSS 颜色；作用于数字、文字、圆点与状态点 | `string` | - | - |
| offset | 右上角徽标的偏移 `[水平, 垂直]`，单位为 px，正值向右、向下；数字表示两个方向相同 | `number \| number[]` | - | - |
| dotClass | 徽标元素（数字、文字、圆点、自定义徽标、状态点）的类名 | `string \| object \| array` | - | - |
| dotStyle | 徽标元素的样式，优先于 `color` 与 `offset` | `string \| object` | - | - |

`class`、`style` 及其它透传属性绑定在根节点 `.vc-badge` 上。

### 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 被徽标标记的内容；不使用时徽标在行内显示 | - |
| dot | 自定义徽标，优先于 `dot` 与 `value`；状态点模式下不生效 | - |
| label | 状态点旁的文字，优先于 `label` 属性 | - |

### 使用注意

- 显示优先级：设置了 `status` 或 `label` 时显示为状态点，`value`、`dot`、`dot` 插槽都不生效；否则依次为 `dot` 插槽、`dot`、`value`。
- 只有数字参与计数：`value="5"` 这样的字符串按文字显示，不受 `max` 限制，`'0'` 也会显示。需要计数时用 `:value="5"`。
- 有默认插槽时状态点跟在内容后面，与内容同一行；徽标与周围文字按 `label` 文字的基线对齐，没有 `label` 时按圆点的底边。
- 数字、文字与圆点的外圈、自定义徽标的背景使用 `background-color-lightest`，放在其它颜色的背景上时，用 `--vc-badge-background-color-lightest` 改成所在容器的背景色。
- 自定义徽标的尺寸由插槽内容或 `dotStyle` 决定，`color` 对它不生效。
- `offset` 通过 `margin-right` / `margin-top` 实现，`dotStyle` 中的同名属性会覆盖它；状态点不受 `offset` 影响。
- 右上角徽标、独立使用的徽标在出现、隐藏、形态切换时有缩放过渡，状态点没有。数字变化时文字重新缩放；从隐藏到出现只播放进场过渡。
- `label` 的字符串按文本渲染；需要 HTML 时传 `{ type: 'html', value }`，这类内容只应来自可信来源，或由全局的 `sanitize` 统一清洗，见 [Customer](../customer/README.md)。
- `MBadge` 是 `Badge` 的别名，使用同一实现与样式，可从 `@deot/vc` 导入。
