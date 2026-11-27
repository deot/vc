## 动作面板（ActionSheet）

从页面底部弹出一组与当前场景相关的操作。

`ActionSheet` 与 `MActionSheet` 指向同一个组件，均支持组件渲染以及 `open`、`popup`、`destroy` 方法。函数式调用会将面板挂载到 `body`。

### 何时使用

- 在移动端集中展示两个或更多操作，并可为操作补充说明。
- 操作需要异步完成，或需要根据回调结果决定是否关闭面板。

### 基础用法

`open` 返回一个可等待的 Portal 实例，`await` 的结果即 `onOk` 的参数组成的对象 `{ value, index }`（`value` 为选中的 `ActionSheetAction`），在关闭动画结束后兑现；点击取消按钮或遮罩关闭时拒绝。`title` 为标题，`cancelText` 为取消按钮文案；操作项的 `subContent` 补充说明，`disabled` 禁用，`class`、`style` 作用于单个操作。

:::playground
<!--
<config lang="json5">
{
	mobile: true
}
</config>
-->
```vue
<template>
	<div class="m-action-sheet-demo">
		<MButton type="primary" @click="handleOpen">打开动作面板</MButton>
		<p class="m-action-sheet-demo__result">{{ result }}</p>
	</div>
</template>

<script setup>
import { inject, onUnmounted, ref } from 'vue';
import { MActionSheet, MButton } from '@deot/vc';

const result = ref('尚未选择');
const playground = inject('docs:playground');

const handleOpen = playground.run(560, async () => {
	try {
		const { value, index } = await MActionSheet.open({
			title: '请选择操作',
			cancelText: '取消',
			data: [
				{ content: '操作一', subContent: '操作的补充说明' },
				{ content: '操作二', class: 'm-action-sheet-demo__danger', style: { color: 'var(--vc-color-error)' } },
				{ content: '禁用操作', disabled: true }
			]
		});
		result.value = `已选择：${value.content}（第 ${index + 1} 项）`;
	} catch {
		result.value = '已取消';
	}
});

onUnmounted(() => {
	MActionSheet.destroy();
});
</script>

<style scoped>
.m-action-sheet-demo {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: calc(var(--vc-rem) * 32);
	padding-inline: calc(var(--vc-rem) * 32);
}

.m-action-sheet-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: calc(var(--vc-rem) * 16);
}

.m-action-sheet-demo__result {
	margin: 0;
	font-size: calc(var(--vc-rem) * 28);
	color: var(--vc-color-dark-lightest);
}
</style>
```
:::

### 异步操作与阻止关闭

`onClick` 接收当前操作对象。返回 `false`、返回一个最终解析为 `false` 的 Promise、抛出异常或返回被拒绝的 Promise 时，面板保持打开。Promise 等待期间，当前操作会显示加载状态，并暂时禁止其他操作、遮罩关闭和取消按钮关闭。只用 `onOk(action, index)`、`onClose()` 回调、不 `await` 时，取消不会产生未处理的拒绝。`maskClosable` 设为 `false` 后点击遮罩不关闭，`mask` 设为 `false` 不显示遮罩。

:::playground
<!--
<config lang="json5">
{
	mobile: true
}
</config>
-->
```vue
<template>
	<div class="m-action-sheet-demo">
		<div class="m-action-sheet-demo__row">
			<MButton type="primary" @click="handleAsync">异步关闭</MButton>
			<MButton @click="handlePrevent">阻止关闭</MButton>
			<MButton @click="handleNoMask">无遮罩</MButton>
		</div>
		<p class="m-action-sheet-demo__result">{{ result }}</p>
	</div>
</template>

<script setup>
import { inject, onUnmounted, ref } from 'vue';
import { MActionSheet, MButton } from '@deot/vc';

const result = ref('等待操作');
const playground = inject('docs:playground');
const wait = delay => new Promise(resolve => setTimeout(resolve, delay));

const callbacks = {
	onOk: (action, index) => {
		result.value = `onOk：${action.content}（第 ${index + 1} 项）`;
	},
	onClose: () => {
		result.value += '，onClose';
	}
};

const handleAsync = playground.run(560, () => {
	result.value = '等待操作';
	MActionSheet.open({
		...callbacks,
		title: '加载期间不能关闭',
		cancelText: '取消',
		maskClosable: false,
		data: [
			{ content: '操作一', subContent: '1.5 秒后关闭', onClick: () => wait(1500) },
			{ content: '操作二', subContent: '1.5 秒后解析为 false，保持打开', onClick: () => wait(1500).then(() => false) }
		]
	});
});

const handlePrevent = playground.run(560, () => {
	result.value = '等待操作';
	MActionSheet.open({
		...callbacks,
		title: '以下操作都不会关闭面板',
		cancelText: '取消',
		data: [
			{ content: '返回 false', onClick: () => false },
			{ content: '返回被拒绝的 Promise', onClick: () => Promise.reject(new Error('rejected')) },
			{ content: '正常关闭' }
		]
	});
});

const handleNoMask = playground.run(560, () => {
	result.value = '等待操作';
	MActionSheet.open({
		...callbacks,
		mask: false,
		cancelText: '取消',
		data: [
			{ content: '操作一' },
			{ content: '操作二' }
		]
	});
});

onUnmounted(() => {
	MActionSheet.destroy();
});
</script>

<style scoped>
.m-action-sheet-demo {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: calc(var(--vc-rem) * 32);
	padding-inline: calc(var(--vc-rem) * 32);
}

.m-action-sheet-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: calc(var(--vc-rem) * 16);
}

.m-action-sheet-demo__result {
	margin: 0;
	font-size: calc(var(--vc-rem) * 28);
	color: var(--vc-color-dark-lightest);
}
</style>
```
:::

### 内容渲染

`title`、`content` 和 `subContent` 的字符串按文本渲染；需要 HTML 时传 `{ type: 'html', value }`，这类内容只应来自可信来源，或由全局的 `sanitize` 统一清洗，见 [Customer](../customer/README.md)。渲染函数返回的内容放在对应的容器元素内（标题、操作内容、补充说明各自带 class 的 `div`），操作的渲染函数会收到包含 `loading` 状态的参数对象。

:::playground
<!--
<config lang="json5">
{
	mobile: true
}
</config>
-->
```vue
<template>
	<div class="m-action-sheet-demo">
		<MButton type="primary" @click="handleOpen">打开动作面板</MButton>
	</div>
</template>

<script setup>
import { h, inject, onUnmounted } from 'vue';
import { MActionSheet, MButton } from '@deot/vc';

const playground = inject('docs:playground');
const wait = delay => new Promise(resolve => setTimeout(resolve, delay));

const handleOpen = playground.run(560, () => {
	MActionSheet.open({
		title: () => h('strong', '渲染函数标题'),
		cancelText: '取消',
		data: [
			{
				content: { type: 'html', value: '<b>HTML</b> 内容' },
				subContent: '字符串按文本渲染：<b>不会加粗</b>'
			},
			{
				content: ({ loading }) => h('span', loading ? '处理中…' : '渲染函数内容'),
				subContent: () => h('span', '点击后 1.5 秒关闭'),
				onClick: () => wait(1500)
			}
		]
	});
});

onUnmounted(() => {
	MActionSheet.destroy();
});
</script>

<style scoped>
.m-action-sheet-demo {
	padding-inline: calc(var(--vc-rem) * 32);
}
</style>
```
:::

### 组件渲染

组件挂载后即打开面板，关闭动画结束时触发 `close`；配合 `v-if` 在 `close` 后卸载。选中操作时触发 `ok`，参数为 `(action, index)`。

:::playground
<!--
<config lang="json5">
{
	mobile: true
}
</config>
-->
```vue
<template>
	<div class="m-action-sheet-demo">
		<MButton type="primary" @click="handleOpen">渲染动作面板</MButton>
		<p class="m-action-sheet-demo__result">{{ result }}</p>
		<MActionSheet
			v-if="isVisible"
			title="组件方式渲染"
			cancel-text="取消"
			:data="actions"
			@ok="handleOk"
			@close="handleClose"
		/>
	</div>
</template>

<script setup>
import { inject, ref } from 'vue';
import { MActionSheet, MButton } from '@deot/vc';

const playground = inject('docs:playground');
const isVisible = ref(false);
const result = ref('尚未选择');
const actions = [
	{ content: '选项 A' },
	{ content: '选项 B' },
	{ content: '选项 C' }
];

const handleOpen = playground.run(560, { visible: isVisible });

const handleOk = (action, index) => {
	result.value = `ok：${action.content}（第 ${index + 1} 项）`;
};

const handleClose = () => {
	isVisible.value = false;
};
</script>

<style scoped>
.m-action-sheet-demo {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: calc(var(--vc-rem) * 32);
	padding-inline: calc(var(--vc-rem) * 32);
}

.m-action-sheet-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: calc(var(--vc-rem) * 16);
}

.m-action-sheet-demo__result {
	margin: 0;
	font-size: calc(var(--vc-rem) * 28);
	color: var(--vc-color-dark-lightest);
}
</style>
```
:::

## 主题与局部覆盖

全局参数通过 `--vc-<参数>` 配置，组件级覆盖使用 `--vc-action-sheet-<参数>`。局部参数仅提供组件级入口；可在组件根节点或其祖先上设置。

弹层或遮罩通过 Portal 挂载时，覆盖变量需作用于实际浮层或其祖先。

内嵌或复用的 [spin](../spin/README.md#主题与局部覆盖) 使用各自的主题入口。

### 全局

| 参数 | 使用位置 | 值 |
| --- | --- | --- |
| color-dark | 选项文字 | 亮色：`#000000`；暗色：`#FFFFFF` |
| color-dark-lightest | 标题、描述和取消文字 | 亮色：`#64758B`；暗色：`#C9C9C9` |
| color-light | 分组间隔的半透明叠层 | 亮色：`#FFFFFF`；暗色：`#000000` |
| color-neutral-light | 标题及选项分隔线 | 亮色：`#EDEFF1`；暗色：`#3B4354` |
| background-color | 分组间隔背景 | 亮色：`#F5F6FA`；暗色：`#252B3A` |
| background-color-light | 可交互选项及取消区按下背景 | 亮色：`#F7F8FA`；暗色：`#2D3444` |
| background-color-lightest | 选项组、选项和取消区背景 | 亮色：`#FFFFFF`；暗色：`#252B3A` |
| foreground-color-inactive | 禁用选项及辅助文字 | 亮色：`#C0C4CC`；暗色：`#737D8C` |

### 局部

当前组件没有额外的局部 CSS 主题参数。

## API

### ActionSheet 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| mask | 是否显示遮罩 | `boolean` | - | `true` |
| maskClosable | 是否允许点击遮罩关闭；异步操作加载期间暂时禁用 | `boolean` | - | `true` |
| wrapperClass | 弹层容器的 class | `string \| object \| any[]` | - | - |
| wrapperStyle | 弹层容器的内联样式 | `string \| object \| any[]` | - | - |
| scrollRegExp | 用于识别内部滚动容器，防止弹层滚动穿透 | `Record<string, any>` | - | `{ className: /(vcm?-popup-scrollable\|vcm-action-sheet__actions)/ }` |
| title | 操作列表上方的标题；空字符串时不展示 | `ActionSheetContent` | - | `''` |
| data | 操作列表 | `ActionSheetAction[]` | - | `[]` |
| cancelText | 取消按钮文案；空字符串时不展示取消按钮 | `string` | - | `''` |

### ActionSheetAction 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| content | 操作内容；字符串按文本渲染，需要 HTML 时传 `{ type: 'html', value }` | `ActionSheetContent` | - | `undefined` |
| subContent | 操作的补充说明；字符串按文本渲染，需要 HTML 时传 `{ type: 'html', value }` | `ActionSheetContent` | - | `undefined` |
| disabled | 是否禁用当前操作 | `boolean` | - | `undefined` |
| class | 当前操作的额外 class | `any` | - | `undefined` |
| style | 当前操作的额外内联样式 | `any` | - | `undefined` |
| onClick | 点击操作时调用；返回 `false`、抛出异常或 Promise 拒绝时阻止关闭 | `(action: ActionSheetAction) => any` | - | `undefined` |

### 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| ok | 选中操作时触发（异步 `onClick` 完成后） | `(action, index)` | 选中的 `ActionSheetAction` 及其在 `data` 中的位置 |
| close | 面板关闭动画结束时触发，选中或取消都会触发 | - | - |
| portal-fulfilled | 选中操作后，关闭动画结束时触发；`open()` 以此兑现 | `{ value, index }` | 同 `ok` 的参数组成的对象 |
| portal-rejected | 未选中就关闭（取消、遮罩）时，关闭动画结束后触发；`open()` 以此拒绝 | - | - |

### ActionSheet / MActionSheet 方法

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| open | 在 `body` 中打开动作面板 | `options?`：组件属性以及可选的 `onOk(action, index)`、`onClose()` 回调 | 可等待的 Portal 实例；可 `await` 得到 `{ value, index }`（同 `onOk`，取消时拒绝） |
| popup | `open` 的别名 | 同 `open` | 同 `open` |
| destroy | 销毁由当前动作面板 Portal 创建的全部实例 | - | `void` |

### 类型

| 类型名 | 说明 |
| --- | --- |
| `ActionSheetContent` | 字符串、数字、渲染函数或 `{ type, value }`，见 [Customer](../customer/README.md) |
| `ActionSheetAction` | 单个操作的公开数据结构 |
| `ActionSheetActionValue` | `ActionSheetAction` 的别名 |
