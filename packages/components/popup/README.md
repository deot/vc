## 弹出层（Popup）

从屏幕边缘滑入或在中央淡入的内容容器。`Popup` 与 `MPopup` 是同一个实现，以下使用 `MPopup`。

### 何时使用

用于临时操作面板、内容预览和移动端选项列表。可以只放默认插槽，也可以用 `title`、`content`、`closable` 组成带标题栏的面板；沿弹出方向滑动即可关闭（`swipeClosable`）。桌面端的侧边面板请使用 [Drawer](../drawer/README.md)。

### 基础用法

通过 `v-model` 控制显示。默认从底部弹出，点击遮罩可关闭；关闭事件在离场动画结束后触发。

:::playground
<!-- <config lang="json5">{ viewport: 375, previewInset: 16 }</config> -->
```vue
<template>
	<div>
		<MButton @click="handleOpen">打开操作面板</MButton>
		<p>{{ message }}</p>
		<MPopup v-model="isVisible" @close="handleClosed">
			<div class="panel">
				<h3>操作面板</h3>
				<p>点击遮罩或下方按钮关闭。</p>
				<MButton @click="handleClose">完成</MButton>
			</div>
		</MPopup>
	</div>
</template>

<script setup>
import { ref, inject } from 'vue';
import { MPopup, MButton } from '@deot/vc';

const playground = inject('docs:playground');

const isVisible = ref(false);
const isPreviewVisible = ref(false);
const message = ref('等待打开');
const handleOpen = playground.run(500, { visible: isPreviewVisible }, () => {
	isPreviewVisible.value = true;
	isVisible.value = true;
	message.value = '面板已打开';
});
const handleClose = () => { isVisible.value = false; };
const handleClosed = () => {
	isPreviewVisible.value = false;
	message.value = '离场动画已结束';
};
</script>

<style scoped>
.panel { padding: 24px; }
</style>
```
:::

### 弹出位置与面板外观

四个边缘位置使用滑动动画，`center` 使用淡入淡出；`placement` 可在运行时切换。进入 450ms、离开 240ms，曲线 `cubic-bezier(0.34, 0.69, 0.1, 1)`。

面板靠屏幕内侧的两个角为 24（375 宽下 12px）的圆角，`center` 四角都圆；底部弹出时让出 `safe-area-inset-bottom`，顶部弹出时让出 `safe-area-inset-top`。

`theme="light"` 使用随全局亮暗主题变化的默认面板；`dark` 保留白字半透明深色外观；`none` 不设置面板前景和背景。`wrapperClass`、`wrapperStyle` 作用于内容容器。

:::playground
<!-- <config lang="json5">{ viewport: 375, previewInset: 16 }</config> -->
```vue
<template>
	<div>
		<label>面板外观：
			<select v-model="theme">
				<option value="light">light</option>
				<option value="dark">dark</option>
				<option value="none">none</option>
			</select>
		</label>
		<div class="actions">
			<MButton v-for="item in panels" :key="item.placement" @click="handleOpen(item)">
				{{ item.label }}
			</MButton>
		</div>
		<MPopup
			v-for="item in panels"
			:key="item.placement"
			v-model="item.isVisible"
			:placement="item.placement"
			@close="handleClosed"
			:theme="theme"
			wrapper-class="demo-panel"
		>
			<div class="content">
				<h3>{{ item.label }}面板</h3>
				<p>当前外观：{{ theme }}</p>
				<MButton @click="handleClose(item)">关闭</MButton>
			</div>
		</MPopup>
	</div>
</template>

<script setup>
import { ref, inject } from 'vue';
import { MPopup, MButton } from '@deot/vc';

const playground = inject('docs:playground');

const isPreviewVisible = ref(false);
const theme = ref('light');
const panels = ref([
	{ placement: 'bottom', label: '底部', isVisible: false },
	{ placement: 'top', label: '顶部', isVisible: false },
	{ placement: 'left', label: '左侧', isVisible: false },
	{ placement: 'right', label: '右侧', isVisible: false },
	{ placement: 'center', label: '居中', isVisible: false }
]);
const handleOpen = playground.run(500, { visible: isPreviewVisible }, (item) => {
	isPreviewVisible.value = true;
	item.isVisible = true;
});
const handleClose = (item) => { item.isVisible = false; };
const handleClosed = () => {
	isPreviewVisible.value = panels.value.some(item => item.isVisible);
};
</script>

<style scoped>
.actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 16px; }
.content { box-sizing: border-box; min-width: 240px; padding: 24px; }
</style>
```
:::

### 标题与内容

有 `title`、`#header` 插槽或 `closable` 时显示标题栏（标题 34、字重 600、行高 88，即 375 宽下 17 / 44px），关闭按钮在右侧；`content` 与默认插槽依次放在内容区（字号 32、内边距 40 32），`#footer` 在内容区之后。三者都没有时，默认插槽直接放在面板内，不加任何结构。

`scrollable` 默认为 `true`：内容区由 `MScroller`（原生滚动）承载，面板与对边至少留出 80（40px），内容过长时只有内容区滚动，标题栏与底部固定。

:::playground
<!-- <config lang="json5">{ viewport: 375, previewInset: 16 }</config> -->
```vue
<template>
	<div>
		<MButton @click="isVisible = true">标题与内容</MButton>
		<MButton @click="handleOpen">MPopup.open</MButton>
		<p>{{ message }}</p>
		<MPopup v-model="isVisible" title="标题" closable>
			<div v-for="item in 30" :key="item" style="line-height: 2;">第 {{ item }} 行</div>
			<template #footer>
				<MButton type="primary" long @click="isVisible = false">完成</MButton>
			</template>
		</MPopup>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MPopup, MButton } from '@deot/vc';

const isVisible = ref(false);
const message = ref('');
const handleOpen = () => {
	MPopup.open({
		title: 'MPopup.open',
		content: '以 Portal 打开，onClose 在离场动画结束后触发。',
		closable: true,
		onClose: () => { message.value = 'MPopup.open 已关闭'; }
	});
};
</script>
```
:::

### 手势滑动关闭

默认沿弹出方向拖动面板即可关闭（`swipeClosable` 不设置时跟随 `maskClosable`，默认开启；遮罩不可关闭的面板也不会被滑动关闭，可用 `:swipe-closable="true"` 单独开启）：面板跟手移动，遮罩随之变淡；松手时拖动超过面板尺寸的 30%，或速度超过 200px/s，从当前位置继续滑出并关闭，否则回弹。传对象可配置：

- `directions`：可滑动关闭的方向，可指定多个，如 `['bottom', 'right']`；默认为弹出方向，`center` 需要指定。
- `threshold`：关闭所需的拖动比例，默认 `0.3`。
- `speed`：关闭所需的速度（px/s），默认 `200`。

与内部滚动区域的关系：

- 第一次移动确定手势方向。触点所在的滚动区域（计算样式 `overflow` 为 `auto` / `scroll`，内置的内容区即是）在该方向上还能滚动时，整个手势交给滚动；已滚到边界时才由面板跟手，例如内容滚到顶后继续下拉才会关闭。
- 内层组件自行处理的手势不触发关闭：`MCarousel`、`MPicker` 的列会阻止事件继续传递，在它们上面的拖动只作用于它们自己。
- 只响应触摸，鼠标拖动不会关闭。

:::playground
<!-- <config lang="json5">{ viewport: 375, previewInset: 16 }</config> -->
```vue
<template>
	<div>
		<MButton @click="isVisible = true">下滑关闭</MButton>
		<MButton @click="isMulti = true">下滑或右滑关闭</MButton>
		<MPopup v-model="isVisible" title="下滑关闭">
			<div v-for="item in 40" :key="item" style="line-height: 2;">第 {{ item }} 行</div>
		</MPopup>
		<MPopup
			v-model="isMulti"
			:swipe-closable="{ directions: ['bottom', 'right'] }"
			title="多个方向"
			content="向下或向右滑动关闭；拖动不到 30% 时回弹。"
		/>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MPopup, MButton } from '@deot/vc';

const isVisible = ref(false);
const isMulti = ref(false);
</script>
```
:::

### 局部布局、遮罩与滚动内容

`fixed` 默认为 `true`。设置 `:fixed="false"` 后，内容容器使用绝对定位，可放入具有定位的父容器。遮罩始终使用固定定位，因此局部展示时通常同时设置 `:mask="false"`。

遮罩在所有位置均有效；设置 `:mask-closable="false"` 可禁止点击遮罩关闭，此时需提供其他关闭入口（如 `closable`）。

打开期间锁定页面滚动（`body` 的 `overflow`），并阻止触摸滚动穿透到页面：面板内计算样式 `overflow` 为 `auto` / `scroll` 的区域自动识别为滚动区域，滚到边界后不再带动页面。`scrollRegExp` 可额外指定滚动区域，一般不需要。

:::playground
<!-- <config lang="json5">{ viewport: 375, previewInset: 16 }</config> -->
```vue
<template>
	<div>
		<div class="actions">
			<MButton @click="handleLocalOpen">局部无遮罩</MButton>
			<MButton @click="handleModalOpen">滚动面板</MButton>
		</div>
		<div class="stage">
			<p>局部定位容器</p>
			<MPopup v-model="isLocalVisible" :fixed="false" :mask="false">
				<div class="panel">
					<p>此面板定位在父容器底部。</p>
					<MButton @click="handleLocalClose">关闭局部面板</MButton>
				</div>
			</MPopup>
		</div>
		<MPopup v-model="isModalVisible" :mask-closable="false" @close="isPreviewVisible = false">
			<div class="panel">
				<h3>滚动列表</h3>
				<div class="vcm-popup-scrollable list">
					<p v-for="item in 20" :key="item">选项 {{ item }}</p>
				</div>
				<MButton @click="handleModalClose">关闭滚动面板</MButton>
			</div>
		</MPopup>
	</div>
</template>

<script setup>
import { ref, inject } from 'vue';
import { MPopup, MButton } from '@deot/vc';

const playground = inject('docs:playground');

const isLocalVisible = ref(false);
const isModalVisible = ref(false);
const isPreviewVisible = ref(false);
const handleLocalOpen = () => { isLocalVisible.value = true; };
const handleLocalClose = () => { isLocalVisible.value = false; };
const handleModalOpen = playground.run(560, { visible: isPreviewVisible }, () => {
	isPreviewVisible.value = true;
	isModalVisible.value = true;
});
const handleModalClose = () => { isModalVisible.value = false; };
</script>

<style scoped>
.actions { display: flex; flex-wrap: wrap; gap: 12px; }
.stage { position: relative; height: 280px; margin-top: 20px; border: 1px dashed currentColor; }
.stage > p { padding: 16px; }
.panel { padding: 20px; }
.list { height: 180px; overflow-y: auto; margin-bottom: 16px; }
</style>
```
:::

## 主题与局部覆盖

全局参数通过 `--vc-<参数>` 配置，单个组件通过 `--vc-popup-<参数>` 覆盖。同一参数可能作用于多个状态；多命名空间时在使用位置中标明。

移动端深色外观文字使用 color-contrast-light。⚠ color-mix：背景由 color-contrast-dark 以 30% 与透明色混合。系统遮罩仍使用 color-mask。

弹层通过 Portal 挂载时，变量需作用于实际弹层或其祖先。

透明色增强声明仅在 `@supports` 内生效；不支持 color-mix 时使用 Sass 编译的固定黑色 rgba() 降级值，透明度与上述比例一致，降级值不会随 color-contrast-dark 变量变化。

### 全局

| 参数 | 使用位置 | 值 |
| --- | --- | --- |
| color-contrast-dark | 移动端深色外观背景的派生基色 | `#000000`（亮暗主题相同） |
| color-contrast-light | 移动端深色外观文字 | `#FFFFFF`（亮暗主题相同） |
| color-mask | 遮罩背景 | 亮色：`rgba(0, 0, 0, 0.4)`；暗色：`rgba(255, 255, 255, 0.4)` |
| background-color-lightest | light 外观面板背景 | 亮色：`#FFFFFF`；暗色：`#252B3A` |
| foreground-color | light 外观文字 | 亮色：`#080F20`；暗色：`#F8F8F8` |

另有 `color-dark-light`（标题）、`color-dark-lighter`（内容）、`color-neutral`（关闭按钮），可用 `--vc-popup-<参数>` 覆盖；`dark` 外观下三者跟随面板前景色。

### 局部

尺寸为 750 稿（随 `--vc-rem` 缩放），括号内为 375 宽下的 px。

| 参数 | 使用位置 | 默认值 |
| --- | --- | --- |
| radius | 面板靠屏幕内侧的圆角 | `calc(var(--vc-rem) * 24)`（12） |
| gap | 有标题栏或 content 时，面板与对边的最小距离 | `calc(var(--vc-rem) * 80)`（40） |
| padding-x | 标题栏与内容区的左右内边距 | `calc(var(--vc-rem) * 32)`（16） |
| title-font-size / title-line-height | 标题 | `calc(var(--vc-rem) * 34)` / `calc(var(--vc-rem) * 88)`（17 / 44） |
| close-size / close-area | 关闭图标与点击区域 | `calc(var(--vc-rem) * 32)` / `calc(var(--vc-rem) * 88)`（16 / 44） |
| content-font-size / content-line-height | 内容 | `calc(var(--vc-rem) * 32)` / `1.5`（16） |
| content-padding-y | 内容区上下内边距 | `calc(var(--vc-rem) * 40)`（20） |
| footer-padding | 底部内边距 | `0 calc(var(--vc-rem) * 32) calc(var(--vc-rem) * 32)`（0 16 16） |

## API

以下 API 同时适用于 `Popup` 和 `MPopup`。

### 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| modelValue | 是否显示，支持 `v-model` | `boolean` | - | `false` |
| fixed | 内容容器是否使用固定定位；为 `false` 时使用绝对定位 | `boolean` | - | `true` |
| placement | 弹出位置，可在运行时切换 | `string` | `top`、`bottom`、`left`、`right`、`center` | `bottom` |
| theme | 面板外观 | `string` | `light`、`dark`、`none` | `light` |
| mask | 是否显示遮罩，适用于所有位置 | `boolean` | - | `true` |
| maskClosable | 是否允许点击遮罩关闭 | `boolean` | - | `true` |
| title | 标题，使用 Customer 渲染；`false` 不显示 | `CustomerValue \| boolean` | - | - |
| content | 内容，在默认插槽之前，使用 Customer 渲染 | `CustomerValue` | - | - |
| closable | 标题栏右侧显示关闭按钮 | `boolean` | - | `false` |
| scrollable | 有标题栏或 content 时，内容区由 `MScroller` 滚动；为 `false` 时内容区不滚动 | `boolean` | - | `true` |
| swipeClosable | 手势滑动关闭，见 [手势滑动关闭](#手势滑动关闭)；不设置时跟随 `maskClosable` | `boolean \| { directions?: Placement[]; threshold?: number; speed?: number }` | - | - |
| wrapperClass | 内容容器的 class | `string \| object \| unknown[]` | - | - |
| wrapperStyle | 内容容器的 style | `string \| object \| unknown[]` | - | - |
| scrollRegExp | 额外视为滚动区域的元素（按元素属性匹配，任一规则匹配即可）；`overflow` 为 `auto` / `scroll` 的元素已自动识别 | `{ id?: RegExp; className?: RegExp; tagName?: RegExp }` | - | `{ className: /(vcm?-popup-scrollable)/ }` |

### 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| update:modelValue | 离场动画结束后同步关闭状态 | `(value: boolean) => void` | 当前实现只发出 `false` |
| close | 离场动画结束后触发 | - | - |
| portal-fulfilled | 离场动画结束后通知 Portal 完成 | - | - |
| visible-change | 打开时传 `true`；关闭时在离场动画结束后传 `false` | `(visible: boolean) => void` | - |

### 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 弹出层内容，隐藏时仍保留挂载；有标题栏或 content 时放在内容区 | - |
| header | 替换标题（关闭按钮仍在右侧） | - |
| footer | 内容区之后的底部，不随内容滚动 | - |

### 方法

通过组件 ref 调用。

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| toggle | 修改内部可见状态；省略参数时切换。打开时不会同步 `modelValue`，通常优先使用 `v-model` | `value?: boolean` | `void` |

实例还暴露 `isActive`，供 Portal 读取内部可见状态。组件不会自动 Teleport 到 `body`；存在裁剪或层叠上下文时，请使用 `MPopup.open` 或自行选择挂载位置。

### 静态方法

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| MPopup.open | 以 Portal 打开弹出层，参数同组件属性；内容用 `content`，`onClose` 在离场动画结束后触发 | `options` | `PortalLeaf` |
| MPopup.destroy | 销毁所有以 `open` 打开的弹出层 | - | - |
