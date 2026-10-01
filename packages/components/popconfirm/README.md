## 气泡确认框（Popconfirm）

在触发元素附近展示确认信息，提供确定与取消操作。

### 何时使用

操作需要再次确认、又不需要使用居中 Modal 时，例如删除一条记录或撤销任务。

### 基础用法

默认点击打开，点击确定、取消或浮层外部关闭。`ok` 和 `cancel` 接收鼠标事件；点击外部只改变显隐，不触发 `cancel`。

:::playground
<!-- <config lang="json5">{ previewInset: 16, expandable: true }</config> -->
```vue
<template>
	<div class="basic-demo">
		<Popconfirm
			title="确定删除这条记录？"
			@visible-change="visible => visible && handleVisibleChange(true)"
			@close="handleVisibleChange(false)"
			@ok="handleOk"
			@cancel="handleCancel"
		>
			<Button type="error">删除记录</Button>
		</Popconfirm>
		<p>{{ result }}</p>
	</div>
</template>

<script setup>
import { ref, inject } from 'vue';
import { Popconfirm, Button } from '@deot/vc';

const playground = inject('docs:playground');
const handleVisibleChange = playground.run(320);

const result = ref('等待操作');
const handleOk = () => {
	result.value = '已确认删除';
};
const handleCancel = () => {
	result.value = '已取消删除';
};
</script>

<style scoped>
.basic-demo {
	display: grid;
	justify-items: center;
	gap: 16px;
}

.basic-demo p {
	margin: 0;
}
</style>
```
:::

### 自定义内容、图标与按钮

`title`、`content` 和 `icon` 插槽可以替换对应内容；同名插槽优先于属性。`type` 支持 `warning`、`info`、`success`、`error`。按钮文案由当前 locale 提供，`okText` 和 `cancelText` 可显式覆盖，空字符串会保留为无文案按钮。

:::playground
<!-- <config lang="json5">{ previewInset: 16, expandable: true }</config> -->
```vue
<template>
	<div class="custom-demo">
		<Popconfirm
			v-for="type in types"
			:key="type"
			:type="type"
			:title="`${type} 提示`"
			content="可以补充操作说明。"
			@visible-change="visible => visible && handleVisibleChange(type, true)"
			@close="handleVisibleChange(type, false)"
		>
			<Button>{{ type }}</Button>
		</Popconfirm>
		<Popconfirm
			:width="280"
			ok-text="确认归档"
			cancel-text="稍后处理"
			ok-type="success"
			cancel-type="text"
			@visible-change="visible => visible && handleVisibleChange('custom', true)"
			@close="handleVisibleChange('custom', false)"
		>
			<Button type="primary">自定义确认框</Button>
			<template #title><strong>归档已完成的条目？</strong></template>
			<template #content>归档后仍可在历史记录中查看。</template>
			<template #icon><Icon type="info" /></template>
		</Popconfirm>
	</div>
</template>

<script setup>
import { inject } from 'vue';
import { Popconfirm, Button, Icon } from '@deot/vc';

const playground = inject('docs:playground');
const visibleStates = {};
const handlePreview = playground.run(400);
const handleVisibleChange = (key, visible) => {
	visibleStates[key] = visible;
	return handlePreview(Object.values(visibleStates).some(Boolean));
};

const types = ['warning', 'info', 'success', 'error'];
</script>

<style scoped>
.custom-demo {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: center;
	gap: 16px;
}
</style>
```
:::

### 弹出位置

`placement` 支持 12 种位置，默认 `top`。浮层沿用 Popover 的定位与空间适配；展开预览可以更清楚地观察方向。

:::playground
<!-- <config lang="json5">{ previewInset: 16, expandable: true }</config> -->
```vue
<template>
	<div class="placement-demo">
		<Popconfirm
			v-for="placement in placements"
			:key="placement"
			:class="`placement-demo__${placement}`"
			:placement="placement"
			title="确定执行这项操作？"
			@visible-change="visible => visible && handleVisibleChange(placement, true)"
			@close="handleVisibleChange(placement, false)"
		>
			<Button>{{ placement }}</Button>
		</Popconfirm>
	</div>
</template>

<script setup>
import { inject } from 'vue';
import { Popconfirm, Button } from '@deot/vc';

const playground = inject('docs:playground');
const visibleStates = {};
const handlePreview = playground.run(500);
const handleVisibleChange = (key, visible) => {
	visibleStates[key] = visible;
	return handlePreview(Object.values(visibleStates).some(Boolean));
};

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

.placement-demo :deep(.vc-button) { width: 120px; }
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

	.placement-demo > :deep(.vc-popconfirm) { grid-area: auto; }
}
</style>
```
:::

### 受控显隐

通过 `v-model` 和 `trigger="custom"` 自行控制显隐。`outsideClickable` 等未声明的属性会传给内部 Popover；设置为 `false` 后，点击外部保持打开。外部直接修改 `modelValue` 不触发 `visible-change`。

:::playground
<!-- <config lang="json5">{ previewInset: 16, expandable: true }</config> -->
```vue
<template>
	<div class="controlled-demo">
		<Popconfirm
			v-model="isVisible"
			trigger="custom"
			:outside-clickable="false"
			title="确认提交？"
			placement="bottom"
			@close="isPreviewVisible = false"
		>
			<Button @click="handleToggle">{{ isVisible ? '收起' : '打开' }}确认框</Button>
		</Popconfirm>
		<p>当前状态：{{ isVisible ? '打开' : '关闭' }}</p>
	</div>
</template>

<script setup>
import { ref, inject } from 'vue';
import { Popconfirm, Button } from '@deot/vc';

const playground = inject('docs:playground');

const isVisible = ref(false);
const isPreviewVisible = ref(false);
const handleOpen = playground.run(320, { visible: isPreviewVisible }, () => {
	isPreviewVisible.value = true;
	isVisible.value = true;
});
const handleToggle = () => {
	if (isVisible.value) isVisible.value = false;
	else handleOpen();
};
</script>

<style scoped>
.controlled-demo {
	display: grid;
	justify-items: center;
	align-content: start;
	gap: 16px;
}

.controlled-demo p { margin: 0; }
</style>
```
:::

### 异步确认

`ok`、`cancel` 返回 Promise 时，对应按钮在等待期间显示 loading，Promise resolve 后关闭；reject 时保持打开，调用方需处理错误。同步回调返回假值（包括 `false`）或 `true` 都会关闭，其他真值保持打开。回调只有事件参数，没有第二个 `callback` 参数。

:::playground
<!-- <config lang="json5">{ previewInset: 16, expandable: true }</config> -->
```vue
<template>
	<div class="async-demo">
		<Popconfirm
			title="提交并等待完成？"
			@visible-change="visible => visible && handleVisibleChange(true)"
			@close="handleVisibleChange(false)"
			@ok="handleOk"
		>
			<Button type="primary">异步提交</Button>
		</Popconfirm>
		<p>{{ result }}</p>
	</div>
</template>

<script setup>
import { ref, inject } from 'vue';
import { Popconfirm, Button } from '@deot/vc';

const playground = inject('docs:playground');
const handleVisibleChange = playground.run(320);

const result = ref('等待提交');
const handleOk = () => {
	result.value = '提交中…';
	return new Promise((resolve) => {
		setTimeout(() => {
			result.value = '提交完成，确认框已关闭';
			resolve();
		}, 1000);
	});
};
</script>

<style scoped>
.async-demo {
	display: grid;
	justify-items: center;
	gap: 16px;
}

.async-demo p { margin: 0; }
</style>
```
:::

## API

### 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| modelValue | 是否显示，支持 `v-model` | `boolean` | - | `false` |
| trigger | 触发方式；`focus` 监听根节点，需让根节点可聚焦 | `string` | `click`、`hover`、`strictHover`、`focus`、`custom` | `click` |
| placement | 首选弹出位置 | `string` | `top`、`top-left`、`top-right`、`bottom`、`bottom-left`、`bottom-right`、`left`、`left-top`、`left-bottom`、`right`、`right-top`、`right-bottom` | `top` |
| title | 标题；字符串按 HTML 渲染，函数通过 Customer 渲染 | `string \| Function` | - | `''` |
| content | 补充内容；字符串按 HTML 渲染，函数通过 Customer 渲染 | `string \| Function` | - | `''` |
| okText | 确定按钮文案；显式字符串优先于 locale | `string` | - | 当前 locale 的 `vc.Popconfirm.okButtonText`（中文：`确定`） |
| cancelText | 取消按钮文案；显式字符串优先于 locale | `string` | - | 当前 locale 的 `vc.Popconfirm.cancelButtonText`（中文：`取消`） |
| okType | 确定按钮类型，沿用 Button 的 type | `string` | `default`、`primary`、`text`、`success`、`error`、`warning` | `primary` |
| cancelType | 取消按钮类型，沿用 Button 的 type | `string` | `default`、`primary`、`text`、`success`、`error`、`warning` | `default` |
| type | 默认图标类型 | `string` | `warning`、`info`、`success`、`error` | `warning` |
| width | 内层宽度，内部追加 px；字符串也应为数值字符串，最小宽度为 218px（默认缩放） | `string \| number` | - | - |
| portalClass | 浮层外层类名 | `string \| object` | - | - |

其他属性透传给内部 [Popover](../popover/README.md)，例如 `portal`、`portalStyle`、`getPopupContainer`、`arrow`、`theme`、`disabled` 和 `outsideClickable`。`class`、`style` 作用于触发器，浮层默认挂载到 body；浮层的样式与主题覆盖应通过 `portalClass`、`portalStyle` 或全局变量设置。

### 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| update:modelValue | 交互引起的显隐变化 | `(visible: boolean)` | 新的显隐状态 |
| visible-change | 交互引起的显隐变化；外部直接修改 modelValue 不触发 | `(visible: boolean)` | 新的显隐状态 |
| ok | 点击确定；JSX/config 对应 `onOk`，返回值控制关闭及等待 | `(event: MouseEvent) => unknown` | 按钮点击事件 |
| cancel | 点击取消；JSX/config 对应 `onCancel`，返回值规则与 ok 相同 | `(event: MouseEvent) => unknown` | 按钮点击事件 |
| ready | 浮层节点挂载完成 | - | - |
| close | 关闭动画完成 | - | - |

### 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 触发器内容 | - |
| title | 标题，优先于 title 属性 | - |
| content | 补充内容，优先于 content 属性 | - |
| icon | 替换默认图标 | - |

### 移动端

`MPopconfirm` 是 `Popconfirm` 的别名，使用相同实现、locale 和样式。触屏场景建议使用 `click` 或 `custom`。

### 注意事项

字符串 `title`、`content` 会作为 HTML 插入，避免传入未经处理的不可信内容；普通文本可使用插槽插值显示。
