## 悬浮按钮（FloatButton）

悬浮在页面或滚动区域边缘的按钮，可以拖动，松开后可以吸到边上。`MFloatButton` 为移动端版本，属性、事件、插槽与 `FloatButton` 相同，数字长度为 750 稿。

### 何时使用

- 全局入口（客服、反馈、快捷操作）需要一直留在屏幕上，又不能长期挡住内容，用户可以把它挪开。
- 局部滚动区域（如 `Scroller`、`overflow: auto` 的面板）中，需要一个停在区域边缘的操作按钮。

### 基础用法

按钮默认停在右下角，可以上下拖动（`draggable` 默认为 `'y'`）。点按时触发 `click`，拖动后松开不触发。`icon` 为图标类型，同 `Icon` 的 `type`。

:::playground
<!--
<config lang="json5">
{
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="float-button-demo">
		<p class="float-button-demo__status">点击次数：{{ count }}</p>
		<Scroller class="float-button-demo__scroller" height="240px">
			<div v-for="item in 30" :key="item" class="float-button-demo__row">
				第 {{ item }} 行
			</div>
			<FloatButton icon="service" aria-label="客服" :gap="16" @click="count++" />
		</Scroller>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { FloatButton, Scroller } from '@deot/vc';

const count = ref(0);
</script>

<style scoped>
.float-button-demo__status {
	margin: 0 0 12px;
	color: var(--vc-color-dark-lightest);
	font-size: 13px;
}

.float-button-demo__scroller {
	border: 1px solid var(--vc-color-neutral-light);
	border-radius: 8px;
}

.float-button-demo__row {
	padding: 12px 16px;
	border-bottom: 1px solid var(--vc-color-neutral-light);
}
</style>
```
:::

### 拖动与吸边

- `draggable`：`true` 自由拖动，`'x'` / `'y'` 只沿该方向拖动，`false` 不可拖动。鼠标、触摸、笔都可以拖动，移动超过 8px 才算拖动。
- `magnetic`：松开后吸边。`'x'` 吸到左右两边中较近的一边，`'y'` 吸到上下两边中较近的一边，`true` 吸到四边中最近的一边。
- 按钮聚焦后，方向键每次移动 8px，按住 `Shift` 时为 40px，只在可拖动的方向上移动；该方向会吸边时，直接移到按键方向的那一边。

```vue
<FloatButton draggable magnetic="x" icon="service" />
```

### 位置与边界

- 边界区域：从所在位置向上找最近的滚动容器（`Scroller`、`overflow` 为 `auto` / `scroll` 的元素），取它的可视区（去掉边框与滚动条）；没有时为视口。页面滚动、容器尺寸变化时按钮随之移动，容器离开视口后隐藏。
- `gap`：与边界的最小间距，数组为 `[左右, 上下]`。数字在 FloatButton 中为 px（默认 `24`），在 MFloatButton 中为 750 稿长度（默认 `48`）。边界还会避开安全区（`env(safe-area-inset-*)`）。
- `v-model:offset`：`{ x, y }`，单位为 px，表示按钮左上角相对边界区域左上角的位置，超出边界时会被限制在边界内。不传时停在右下角。
- 贴边：按钮贴住某条边后，边界尺寸变化（窗口缩放、容器变宽）时仍贴住这条边。按钮贴边的情况有三种：默认位置、吸边后、拖到边上。其它位置只会被限制在边界内。

```vue
<template>
	<FloatButton v-model:offset="offset" draggable icon="service" @after-change="save" />
</template>

<script setup>
import { ref } from 'vue';

const offset = ref({ x: 0, y: 200 });
const save = value => localStorage.setItem('float-button', JSON.stringify(value));
</script>
```

### 自定义内容与外观

默认插槽替换按钮内容，参数为 `{ dragging }`。内容比按钮宽时，按钮会随之变宽，`circle` 形状会变成胶囊。`shape` 可选 `circle`（默认）和 `square`（圆角方形）。尺寸与颜色是局部变量，可在按钮的 class 上覆盖：

| 变量 | 说明 | FloatButton | MFloatButton |
| --- | --- | --- | --- |
| `--vc-float-button-size` | 按钮高度、最小宽度 | `48px` | 750 稿 `96` |
| `--vc-float-button-padding` | 内容较宽时的左右留白 | `12px` | 750 稿 `16` |
| `--vc-float-button-radius` | `square` 的圆角 | `8px` | 750 稿 `16` |
| `--vc-float-button-icon-size` | 图标大小 | `22px` | 750 稿 `56` |
| `--vc-float-button-font-size` | 文字大小 | `14px` | 750 稿 `28` |
| `--vc-float-button-color` | 图标、文字色 | 主题 `color-contrast-light` | 同左 |
| `--vc-float-button-background` / `--vc-float-button-hover-background` | 底色 / 悬停底色（只在可悬停的设备上） | 主题 `color-primary` / `color-primary-light` | 同左 |
| `--vc-float-button-box-shadow` | 阴影 | 主题 `box-shadow-floating` | 同左 |
| `--vc-float-button-z-index` | 层级，`zIndex` 属性优先 | `100` | 同左 |

```vue
<FloatButton draggable magnetic="x">
	<template #default="{ dragging }">
		{{ dragging ? '拖动中' : '客服' }}
	</template>
</FloatButton>
```

### 注意事项

- 按钮默认挂到 `body`（`portal`），不受祖先的 `transform`、`overflow` 影响。`portal` 为 `false` 时渲染在原处，只在确定祖先没有 `transform`、`filter`、`will-change` 等时使用。
- 拖动时位置直接写在 `transform` 上，不触发重新渲染；吸边和方向键移动有 300ms 过渡，系统开启「减弱动态效果」时没有过渡。
- 在 `KeepAlive` 中失活时隐藏并停止监听，激活后重新定位。
- 按钮为 `<button>`，没有默认的可访问名称，只有图标时请传 `aria-label`；隐藏时不可聚焦。

## API

`MFloatButton` 与 `FloatButton` 用法一致，区别是数字 `gap` 为 750 稿长度，随 `--vc-rem` 缩放，默认尺寸见上表。

### 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| draggable | 拖动方向；`true` 自由拖动，`false` 不可拖动 | `boolean \| string` | `true` / `false` / `x` / `y` | `y` |
| magnetic | 松开后吸边；`true` 吸到四边中最近的一边 | `boolean \| string` | `true` / `false` / `x` / `y` | `false` |
| v-model:offset | 位置：按钮左上角相对边界区域左上角的距离（px） | `{ x: number, y: number }` | - | 右下角 |
| gap | 与边界的最小间距，数组为 `[左右, 上下]`；数字在 FloatButton 中为 px、在 MFloatButton 中为 750 稿长度 | `number \| [number, number]` | - | FloatButton `24`，MFloatButton `48` |
| icon | 图标类型，同 `Icon` 的 `type` | `string` | - | - |
| shape | 形状 | `string` | `circle` / `square` | `circle` |
| zIndex | 层级 | `number \| string` | - | 取样式默认值 `100` |
| portal | 按钮挂到 `body`；为 `false` 时渲染在原处 | `boolean` | - | `true` |

### 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| click | 点按（含回车、空格）时触发，拖动后松开不触发 | `MouseEvent` | - |
| update:offset | 位置变化时触发：拖动中、吸边、方向键、边界变化后重新定位 | `{ x: number, y: number }` | 新位置 |
| after-change | 用户改变位置后触发一次：拖动松开（吸边后）、每次按方向键；位置没变时不触发 | `{ x: number, y: number }` | 新位置 |

### 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 按钮内容，默认为 `icon` 指定的图标 | `{ dragging: boolean }` |

### 方法

通过组件 ref 访问。

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| refresh | 重新查找边界区域并定位 | - | `void` |
| reset | 回到默认的右下角位置 | - | `void` |
