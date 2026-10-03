## 弹出层（Popup）

从屏幕边缘滑入或在中央淡入的内容容器。`Popup` 与 `MPopup` 是同一个实现，以下使用 `MPopup`。

### 何时使用

用于临时操作面板、内容预览和移动端选项列表。内容与关闭按钮由默认插槽提供。

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

四个边缘位置使用滑动动画，`center` 使用淡入淡出。此例为每个位置保留独立实例，因为动画组件在初始化时按 `placement` 选择。

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
			:wrapper-style="{ borderRadius: '12px', maxWidth: '100%' }"
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
:deep(.demo-panel) { overflow: hidden; }
</style>
```
:::

### 局部布局、遮罩与滚动内容

`fixed` 默认为 `true`。设置 `:fixed="false"` 后，内容容器使用绝对定位，可放入具有定位的父容器。遮罩始终使用固定定位，因此局部展示时通常同时设置 `:mask="false"`。

遮罩在所有位置均有效；设置 `:mask-closable="false"` 可禁止点击遮罩关闭。关闭入口需由调用方提供。触屏滚动区域应添加 `vcm-popup-scrollable`（或 `vc-popup-scrollable`），并设置高度和 `overflow`；`scrollRegExp` 可自定义匹配规则。

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

### 局部

当前组件没有额外的局部 CSS 主题参数。

## API

以下 API 同时适用于 `Popup` 和 `MPopup`。

### 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| modelValue | 是否显示，支持 `v-model` | `boolean` | - | `false` |
| fixed | 内容容器是否使用固定定位；为 `false` 时使用绝对定位 | `boolean` | - | `true` |
| placement | 弹出位置，建议初始化时确定 | `string` | `top`、`bottom`、`left`、`right`、`center` | `bottom` |
| theme | 面板外观 | `string` | `light`、`dark`、`none` | `light` |
| mask | 是否显示遮罩，适用于所有位置 | `boolean` | - | `true` |
| maskClosable | 是否允许点击遮罩关闭 | `boolean` | - | `true` |
| wrapperClass | 内容容器的 class | `string \| object \| unknown[]` | - | - |
| wrapperStyle | 内容容器的 style | `string \| object \| unknown[]` | - | - |
| scrollRegExp | 按事件路径上的元素属性匹配可滚动区域，任一规则匹配即可 | `{ id?: RegExp; className?: RegExp; tagName?: RegExp }` | - | `{ className: /(vcm?-popup-scrollable)/ }` |

### 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| update:modelValue | 离场动画结束后同步关闭状态 | `(value: boolean) => void` | 当前实现只发出 `false` |
| close | 离场动画结束后触发 | - | - |
| portal-fulfilled | 离场动画结束后通知 Portal 完成 | - | - |
| visible-change | 离场动画结束后触发；打开时不触发 | `(visible: boolean) => void` | 当前实现只发出 `false` |

### 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 弹出层内容，隐藏时仍保留挂载 | - |

### 方法

通过组件 ref 调用。

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| toggle | 修改内部可见状态；省略参数时切换。打开时不会同步 `modelValue`，通常优先使用 `v-model` | `value?: boolean` | `void` |

实例还暴露 `isActive`，供 Portal 读取内部可见状态。组件本身没有静态 `open` 方法，也不会自动 Teleport 到 `body`；存在裁剪或层叠上下文时，请自行选择挂载位置或配合 `Portal` 使用。

### 主题变量

默认面板与遮罩支持 `--vc-popup-background-color-lightest`、`--vc-popup-foreground-color`、`--vc-popup-color-mask`，分别回退到同名全局 token。`dark` 外观使用 `--vc-popup-background-color-translucent`（默认 `rgb(0 0 0 / 30%)`）与 `--vc-popup-foreground-color-inverse`（默认 `#fff`）；`none` 不设置面板颜色。
