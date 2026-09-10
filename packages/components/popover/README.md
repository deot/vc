## 弹出框（Popover）

依附触发元素展示说明或操作内容的气泡浮层。

### 何时使用

当目标元素有进一步的描述或相关操作时，通过悬停、点击或受控状态展示内容。

### 基础用法

`hover` 支持移入浮层继续操作；`strictHover` 在离开触发器后延时关闭。`focus` 监听 Popover 根节点的焦点事件，因此示例通过 `tabindex` 让根节点可聚焦。

:::playground
<!-- <config lang="json5">{ previewInset: 16, expandable: true }</config> -->
```vue
<template>
	<div class="popover-demo">
		<Popover content="可以将鼠标移入浮层" trigger="hover">
			<Button>悬停打开</Button>
		</Popover>
		<Popover content="再次点击触发器或点击外部关闭" trigger="click">
			<Button>点击打开</Button>
		</Popover>
		<Popover class="focus-trigger" content="失去焦点后关闭" trigger="focus" tabindex="0">
			聚焦打开
		</Popover>
	</div>
</template>

<script setup>
import { Popover, Button } from '@deot/vc';
</script>

<style scoped>
.popover-demo {
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	align-items: center;
	gap: 16px;
	min-height: 160px;
}

.focus-trigger {
	padding: 8px 16px;
	border: 1px solid var(--vc-color-light-deeper);
	border-radius: 4px;
	cursor: pointer;
}
</style>
```
:::

### 定位

支持 12 种位置；空间不足时会根据浏览器视口自动调整方向。可展开预览以观察完整浮层。

:::playground
<!-- <config lang="json5">{ previewInset: 16, expandable: true }</config> -->
```vue
<template>
	<div class="placement-demo">
		<Popover
			v-for="placement in placements"
			:key="placement"
			:class="`placement-demo__${placement}`"
			:placement="placement"
			trigger="hover"
		>
			<Button>{{ placement }}</Button>
			<template #content>
				<div style="height: 100px;">{{ placement }}</div>
			</template>
		</Popover>
	</div>
</template>

<script setup>
import { Popover, Button } from '@deot/vc';

const placements = [
	'top-left', 'top', 'top-right',
	'left-top', 'right-top',
	'left', 'right',
	'left-bottom', 'right-bottom',
	'bottom-left', 'bottom', 'bottom-right'
];
</script>

<style scoped>
.placement-demo {
	display: grid;
	grid-template-areas:
		"top-left top top-right"
		"left-top . right-top"
		"left . right"
		"left-bottom . right-bottom"
		"bottom-left bottom bottom-right";
	grid-template-columns: repeat(3, 120px);
	gap: 16px;
	width: fit-content;
	margin: 0 auto;
	padding: 80px 0;
}

.placement-demo :deep(.vc-button) {
	width: 120px;
}

.placement-demo__top-left { grid-area: top-left; }
.placement-demo__top { grid-area: top; }
.placement-demo__top-right { grid-area: top-right; }
.placement-demo__left-top { grid-area: left-top; }
.placement-demo__left { grid-area: left; }
.placement-demo__left-bottom { grid-area: left-bottom; }
.placement-demo__right-top { grid-area: right-top; }
.placement-demo__right { grid-area: right; }
.placement-demo__right-bottom { grid-area: right-bottom; }
.placement-demo__bottom-left { grid-area: bottom-left; }
.placement-demo__bottom { grid-area: bottom; }
.placement-demo__bottom-right { grid-area: bottom-right; }

@media (width <= 440px) {
	.placement-demo {
		grid-template-columns: repeat(2, 120px);
		grid-template-areas: none;
		padding: 64px 0;
	}

	.placement-demo > :deep(.vc-popover) {
		grid-area: auto;
	}
}
</style>
```
:::

### 自定义内容与受控状态

`content` 插槽优先于同名属性。通过 `trigger="custom"` 和 `v-model` 自行控制显隐；需要禁止外部点击关闭时，设置 `outsideClickable` 为 `false`。

:::playground
<!-- <config lang="json5">{ previewInset: 16, expandable: true }</config> -->
```vue
<template>
	<div class="custom-demo">
		<Popover v-model="isVisible" trigger="custom" :outside-clickable="false">
			<Button @click="handleToggle">自定义操作</Button>
			<template #content>
				<div class="custom-content">
					<p>已操作 {{ count }} 次</p>
					<div class="custom-actions">
						<Button @click="handleIncrease">增加</Button>
						<Button @click="handleClose">关闭</Button>
					</div>
				</div>
			</template>
		</Popover>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Popover, Button } from '@deot/vc';

const isVisible = ref(false);
const count = ref(0);

const handleToggle = () => {
	isVisible.value = !isVisible.value;
};
const handleIncrease = () => {
	count.value++;
};
const handleClose = () => {
	isVisible.value = false;
};
</script>

<style scoped>
.custom-demo {
	display: flex;
	align-items: flex-start;
	justify-content: center;
	min-height: 180px;
	padding-top: 32px;
}

.custom-content p {
	margin: 0 0 12px;
}

.custom-actions {
	display: flex;
	gap: 8px;
}
</style>
```
:::

### 挂载容器

默认挂载到 `document.body`。`portal="false"` 将浮层挂到 Popover 根节点；`getPopupContainer` 优先指定挂载容器，应返回包含触发器的定位容器。边界判断仍基于浏览器视口，容器的 `overflow` 可能裁剪浮层。

:::playground
<!-- <config lang="json5">{ previewInset: 16, expandable: true }</config> -->
```vue
<template>
	<div ref="container" class="container-demo">
		<Popover :get-popup-container="getPopupContainer" trigger="click" content="挂载在定位容器内">
			<Button>指定容器</Button>
		</Popover>
		<Popover :portal="false" trigger="click" content="挂载在触发器根节点内">
			<Button>就地挂载</Button>
		</Popover>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Popover, Button } from '@deot/vc';

const container = ref();
const getPopupContainer = () => container.value;
</script>

<style scoped>
.container-demo {
	position: relative;
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: center;
	gap: 16px;
	min-height: 180px;
	padding: 32px 24px;
	border: 1px dashed var(--vc-color-light-deeper);
	border-radius: 8px;
}
</style>
```
:::

### 主题

`theme` 支持 `light`、`dark` 和 `none`；`none` 不设置主题背景，但仍保留容器间距与阴影。颜色跟随共享主题变量，可用 `portalStyle` 覆盖浮层的 `--vc-popover-wrapper-*` 变量。

:::playground
<!-- <config lang="json5">{ previewInset: 16, expandable: true }</config> -->
```vue
<template>
	<div class="theme-demo">
		<Popover v-for="theme in ['light', 'dark', 'none']" :key="theme" :theme="theme" :content="theme" trigger="click">
			<Button>{{ theme }}</Button>
		</Popover>
	</div>
</template>

<script setup>
import { Popover, Button } from '@deot/vc';
</script>

<style scoped>
.theme-demo {
	display: flex;
	flex-wrap: wrap;
	gap: 16px;
	align-items: center;
	justify-content: center;
	min-height: 160px;
}
</style>
```
:::

### 静态方法

`Popover.open` 立即创建浮层，`triggerEl` 必须传真实 DOM 元素。返回的 `PortalLeaf` 可通过 `destroy()` 清理；页面卸载时也应清理仍存在的实例。

:::playground
<!-- <config lang="json5">{ previewInset: 16, expandable: true }</config> -->
```vue
<template>
	<div class="method-demo">
		<Button @click="handleOpen">调用 Popover.open</Button>
	</div>
</template>

<script setup>
import { onUnmounted } from 'vue';
import { Popover, Button } from '@deot/vc';

let leaf;
const handleOpen = (event) => {
	leaf?.destroy();
	leaf = Popover.open({
		triggerEl: event.currentTarget,
		placement: 'bottom',
		content: '点击浮层外部关闭'
	});
};

onUnmounted(() => leaf?.destroy());
</script>

<style scoped>
.method-demo {
	display: flex;
	align-items: flex-start;
	justify-content: center;
	min-height: 160px;
	padding-top: 32px;
}
</style>
```
:::

## API

### 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| modelValue | 显隐状态，支持 `v-model` | `boolean` | - | `false` |
| trigger | 触发方式，`custom` 不绑定自动触发行为 | `string` | `hover`、`strictHover`、`click`、`focus`、`custom` | `hover` |
| placement | 首选位置，空间不足时自动调整 | `string` | `top`、`top-left`、`top-right`、`bottom`、`bottom-left`、`bottom-right`、`left`、`left-top`、`left-bottom`、`right`、`right-top`、`right-bottom` | `bottom` |
| content | 内容字符串按 HTML 渲染；函数通过 Customer 渲染 | `string \| Function` | - | - |
| animation | TransitionScale 动画模式，未设置时使用 `part` | `string` | - | - |
| theme | 浮层主题 | `string` | `light`、`dark`、`none` | `light` |
| getPopupContainer | 返回浮层挂载容器，优先于 `portal` | `() => HTMLElement` | - | - |
| portal | 是否挂载到 body，`false` 时挂到 Popover 根节点 | `boolean` | - | `true` |
| arrow | 是否显示箭头 | `boolean` | - | `true` |
| autoWidth | `true` 按内容确定宽度，`false` 跟随触发元素宽度 | `boolean` | - | `true` |
| always | 禁止交互关闭；需配合 `modelValue: true` 初始显示，仍可通过 modelValue 关闭 | `boolean` | - | `false` |
| tag | 触发器根节点标签 | `string` | - | `span` |
| disabled | 禁用交互触发，不阻止外部 modelValue 控制 | `boolean` | - | `false` |
| outsideClickable | 是否允许点击浮层外部关闭 | `boolean` | - | `true` |
| portalClass | 浮层外层类名 | `string \| object \| unknown[]` | - | - |
| portalStyle | 浮层外层样式 | `string \| object` | - | - |

### 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| update:modelValue | 交互引起的显隐变化 | `(visible: boolean)` | 新的显隐状态 |
| visible-change | 交互引起的显隐变化；外部直接修改 modelValue 不触发 | `(visible: boolean)` | 新的显隐状态 |
| ready | 浮层节点挂载完成 | - | - |
| close | 关闭动画完成 | - | - |

### 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 触发器内容 | - |
| content | 浮层内容，优先于 content 属性 | - |

### 方法

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| Popover.open | 创建独立浮层 | `options`：浮层属性与 Portal 配置 | `PortalLeaf` |

`open` 使用独立浮层，支持上述外观属性（`animation`、`placement`、`theme`、`content`、`arrow`、`autoWidth`、`portalClass`、`portalStyle`），以及以下选项。声明式组件的 `trigger`、`disabled`、`outsideClickable` 不控制静态浮层。

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| triggerEl | 必填，定位与事件绑定使用的真实 DOM | `HTMLElement` | - | - |
| el | Portal 挂载节点或选择器 | `HTMLElement \| string` | - | `body` |
| name | Portal 实例标识，同名实例默认替换 | `string` | - | `vc-popover-wrapper` |
| multiple | 是否允许多个实例共存 | `boolean` | - | `false` |
| alone | 独立管理显隐，通常保持默认 | `boolean` | - | `true` |
| hover | 绑定触发器和浮层的悬停事件；为 false 时支持外部点击关闭 | `boolean` | - | `false` |
| onReady | 浮层挂载回调 | `() => void` | - | - |
| onClose | 关闭动画完成回调 | `() => void` | - | - |
| onChange | 触发器或浮层事件回调 | `(event: Event, info: object) => void` | - | 空函数 |

`onChange` 的 `info` 包含 `context`（浮层内部组件实例）；悬停事件另含 `visible: boolean`，外部点击时不包含 `visible`。`leaf.wrapper?.toggle(false)` 可执行关闭动画，`leaf.destroy()` 立即销毁。其他 Portal 通用配置见 Portal 文档。

### 移动端

`MPopover` 是 `Popover` 的别名，使用同一实现与样式；触屏场景建议使用 `trigger="click"` 或 `custom`。

### 注意事项

字符串 `content` 会作为 HTML 插入，避免传入未经处理的不可信内容；普通文本可通过 `content` 插槽插值显示。浮层默认挂载到 body，局部祖先上的主题变量不会自动继承到浮层，可在全局或 `portalStyle` 上设置覆盖值。
