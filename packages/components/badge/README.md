## 徽标（Badge）

出现在图标或文字的右上角，提示数量或新内容；也可以单独作为状态点使用。`MBadge` 为移动端版本，属性、插槽与 `Badge` 相同，尺寸随 `--vc-rem` 缩放，`offset` 为 750 稿长度。

### 何时使用

- 在图标、头像、菜单项上提示未读数量或有新内容。
- 在列表、表格中用带颜色的圆点标记状态。

### 基础用法

把内容放进默认插槽，`value` 为数字时在右上角显示徽标。`dot` 显示为小圆点，`dot` 插槽自定义徽标（白底圆角），`dotStyle` 设置徽标元素的样式。右上角徽标会溢出内容约半个徽标，demo 中带徽标的内容之间用 `32px` 间距，避免徽标压到相邻内容。

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
	<div class="badge-demo">
		<Badge :value="9">
			<span class="badge-demo__box" />
		</Badge>
		<Badge dot :dot-style="{ width: '10px', height: '10px' }">
			<span class="badge-demo__box" />
		</Badge>
		<Badge :dot-style="{ width: '16px', height: '16px', fontSize: '14px' }">
			<span class="badge-demo__box" />
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
.badge-demo {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 32px;
}

.badge-demo__box {
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

没有默认插槽时，徽标在行内显示。`dotClass` 给徽标元素加类名，可在外部样式中改写颜色。

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
	<div class="badge-demo">
		<Badge :value="2" />
		<Badge :value="2" dot-class="badge-demo__muted" />
		<Badge :value="16" />
		<Badge :value="1000" />
	</div>
</template>

<script setup>
import { Badge } from '@deot/vc';
</script>

<style scoped>
.badge-demo {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}

.badge-demo :deep(.badge-demo__muted) {
	color: #86909C;
	background: #E5E6EB;
}
</style>
```
:::

### 文字与最大值

`value` 为字符串时原样显示。数字超过 `max` 时显示为 `${max}+`，`max` 默认为 `99`，`0` 表示不限。数字小于等于 `0` 时不显示徽标。

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
	<div class="badge-demo">
		<Badge value="NEW">
			<span class="badge-demo__box" />
		</Badge>
		<Badge value="HOT">
			<span class="badge-demo__box" />
		</Badge>
		<Badge :value="100" :max="10">
			<span class="badge-demo__box" />
		</Badge>
		<Badge :value="100">
			<span class="badge-demo__box" />
		</Badge>
		<Badge :value="1000" :max="999">
			<span class="badge-demo__box" />
		</Badge>
		<Badge :value="1000" :max="0">
			<span class="badge-demo__box" />
		</Badge>
	</div>
</template>

<script setup>
import { Badge } from '@deot/vc';
</script>

<style scoped>
.badge-demo {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 16px 40px;
}

.badge-demo__box {
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

`offset` 为 `[水平, 垂直]`，单位为 px（`MBadge` 中为 750 稿长度），正值向右、向下；数字表示两个方向相同。

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
	<div class="badge-demo">
		<Badge dot :offset="[6, -2]">
			<a href="javascript:void(0)">链接</a>
		</Badge>
		<Badge dot :offset="[2, -2]">
			<Icon type="message" class="badge-demo__icon" />
		</Badge>
		<Badge :value="5" :offset="[-6, 6]">
			<span class="badge-demo__box" />
		</Badge>
		<Badge :value="5" :offset="4">
			<span class="badge-demo__box" />
		</Badge>
	</div>
</template>

<script setup>
import { Badge, Icon } from '@deot/vc';
</script>

<style scoped>
.badge-demo {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 32px;
}

.badge-demo__icon {
	font-size: 18px;
	color: #888;
}

.badge-demo__box {
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

设置 `status` 显示为状态点：`default` 默认、`pending` 进行中、`success` 成功、`warning` 提醒、`error` 错误。`label` 为状态点旁的文字，只传 `label` 时状态按 `default`；`label` 插槽自定义文字。

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
	<div class="badge-demo">
		<div class="badge-demo__row">
			<Badge v-for="status in STATUSES" :key="status" :status="status" />
		</div>
		<div class="badge-demo__row">
			<Badge v-for="status in STATUSES" :key="status" :status="status" :label="status" />
			<Badge label="只传 label" />
		</div>
		<div class="badge-demo__row">
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
.badge-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.badge-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: baseline;
	gap: 8px 16px;
}
</style>
```
:::

### 颜色

`color` 接受任意 CSS 颜色，作用于数字、文字、圆点与状态点，不改变徽标的形态。

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
	<div class="badge-demo">
		<div class="badge-demo__row">
			<Badge v-for="color in COLORS" :key="color" :color="color" :label="color" />
		</div>
		<div class="badge-demo__row">
			<Badge :value="8" color="var(--vc-color-primary)">
				<span class="badge-demo__box" />
			</Badge>
			<Badge dot color="var(--vc-color-success)">
				<span class="badge-demo__box" />
			</Badge>
		</div>
	</div>
</template>

<script setup>
import { Badge } from '@deot/vc';

const COLORS = ['#F53F3F', '#7816FF', '#00B42A', '#165DFF', '#FF7D00', '#EB0AA4', '#86909C'];
</script>

<style scoped>
.badge-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.badge-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 16px 32px;
}

.badge-demo__box {
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
	<div class="badge-demo">
		<div class="badge-demo__row">
			<Badge :dot="isDot" :value="isDot ? count : 0">
				<span class="badge-demo__box" />
			</Badge>
			<Switch v-model="isDot" />
		</div>
		<div class="badge-demo__row">
			<Badge :value="count">
				<span class="badge-demo__box" />
			</Badge>
			<div class="badge-demo__actions">
				<Button @click="handleIncrease">+1</Button>
				<Button @click="handleDecrease">-1</Button>
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Badge, Button, Switch } from '@deot/vc';

const isDot = ref(true);
const count = ref(12);

const handleIncrease = () => {
	count.value++;
};

const handleDecrease = () => {
	count.value = Math.max(count.value - 1, 0);
};
</script>

<style scoped>
.badge-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.badge-demo__row {
	display: flex;
	align-items: center;
	gap: 32px;
}

.badge-demo__actions {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}

.badge-demo__box {
	display: block;
	width: 40px;
	height: 40px;
	background: var(--vc-color-neutral);
	border-radius: 4px;
}
</style>
```
:::

## 移动端

`MBadge` 的结构、显示规则和样式都与 `Badge` 相同，根元素另有标记类 `.vcm-badge`。尺寸写为 `calc(var(--vc-rem) * n)`（n 为 750 稿长度），随 `--vc-rem` 缩放；`offset` 同样是 750 稿长度。底栏切换 `rem` 可查看不同屏宽下的效果。

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
	<div class="m-badge-demo">
		<div class="m-badge-demo__row">
			<MBadge :value="2">
				<span class="m-badge-demo__box" />
			</MBadge>
			<MBadge :value="100">
				<span class="m-badge-demo__box" />
			</MBadge>
			<MBadge dot>
				<span class="m-badge-demo__box" />
			</MBadge>
			<MBadge value="NEW">
				<span class="m-badge-demo__box" />
			</MBadge>
		</div>
		<div class="m-badge-demo__row">
			<MBadge :value="2" />
			<MBadge :value="16" />
			<MBadge :value="1000" :max="999" />
			<MBadge value="NEW" />
			<MBadge dot />
		</div>
		<div class="m-badge-demo__row">
			<MBadge>
				<span class="m-badge-demo__box" />
				<template #dot>
					<MIcon type="time" :size="[32, 24]" color="var(--vc-foreground-color-light)" />
				</template>
			</MBadge>
			<MBadge :value="8" color="var(--vc-color-primary)">
				<span class="m-badge-demo__box" />
			</MBadge>
			<MBadge :value="5" :offset="[-12, 12]">
				<span class="m-badge-demo__box" />
			</MBadge>
			<MBadge dot :offset="[8, -4]">
				<span class="m-badge-demo__text">文字</span>
			</MBadge>
		</div>
		<div class="m-badge-demo__row">
			<MBadge :value="count">
				<span class="m-badge-demo__box" />
			</MBadge>
			<MButton size="small" @click="handleIncrease">加一</MButton>
			<MButton size="small" @click="handleDecrease">减一</MButton>
		</div>
		<div class="m-badge-demo__column">
			<MBadge status="default" label="默认" />
			<MBadge status="pending" label="进行中" />
			<MBadge status="success" label="成功" />
			<MBadge status="warning" label="警告" />
			<MBadge status="error" label="失败" />
		</div>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MBadge, MButton, MIcon } from '@deot/vc';

const count = ref(3);

const handleIncrease = () => {
	count.value++;
};

const handleDecrease = () => {
	count.value = Math.max(0, count.value - 1);
};
</script>

<style scoped>
.m-badge-demo {
	display: flex;
	flex-direction: column;
	gap: calc(var(--vc-rem) * 48);
	padding-inline: calc(var(--vc-rem) * 32);
}

/* 右上角徽标会溢出内容，横向间距放宽到 48 */
.m-badge-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: calc(var(--vc-rem) * 32) calc(var(--vc-rem) * 48);
}

.m-badge-demo__column {
	display: flex;
	flex-direction: column;
	gap: calc(var(--vc-rem) * 16);
}

.m-badge-demo__box {
	display: block;
	width: calc(var(--vc-rem) * 80);
	height: calc(var(--vc-rem) * 80);
	background-color: var(--vc-background-color-light);
	border-radius: calc(var(--vc-rem) * 8);
}

.m-badge-demo__text {
	font-size: calc(var(--vc-rem) * 28);
}
</style>
```
:::

两端的尺寸都写成局部变量 `--vc-badge-<键>`，桌面端的默认值为 px，移动端在 `.vcm-badge` 上覆盖，与样式的加载顺序无关。键为 `height`、`padding`、`font-size`、`dot`、`inset`、`ring`、`label-font-size`、`label-line-height`、`label-gap`。

| 项 | `Badge` | `MBadge`（750 稿） | 375 宽下 |
| --- | --- | --- | --- |
| 数字、文字的高度 / 最小宽度 | `20px` | `32` | `16px` |
| 数字、文字的左右内边距 | `6px` | `8` | `4px` |
| 数字、文字的字号 | `12px` | `24` | `12px` |
| 圆点、状态点 | `6px` | `16` | `8px` |
| 外圈宽度 | `2px` | `4` | `2px` |
| 状态点旁文字的字号 / 行高 / 间距 | `14px` / `22px` / `8px` | `28` / `44` / `16` | `14px` / `22px` / `8px` |

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

尺寸写成局部变量 `--vc-badge-<键>`，桌面端的默认值在括号内，设在徽标或其祖先上；`MBadge` 的取值见 [移动端](#移动端)：

| 键 | 说明 |
| --- | --- |
| height | 数字的高、最小宽、行高与圆角（20px） |
| padding | 数字左右内边距（6px） |
| font-size | 数字字号（12px） |
| dot | 圆点与状态点尺寸（6px） |
| inset | 角标向内的偏移（2px） |
| ring | 描边宽度（2px） |
| label-font-size | 状态文字字号（14px） |
| label-line-height | 状态文字行高（22px） |
| label-gap | 状态点与文字的间距（8px） |

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
| offset | 右上角徽标的偏移 `[水平, 垂直]`，单位为 px（`MBadge` 中为 750 稿长度），正值向右、向下；数字表示两个方向相同 | `number \| number[]` | - | - |
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
- `MBadge` 与 `Badge` 共用同一份逻辑与样式规则，只有尺寸与 `offset` 的单位不同；主题参数相同，`--vc-badge-<参数>` 对两者都生效。
