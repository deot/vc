## 对话框（Modal）

Modal 在当前页面上方承载需要用户确认或处理的内容。桌面端可使用 `Modal` 组件及其静态方法；移动端声明式组件为 `MModalView`，静态调用入口为 `MModal`。

### 何时使用

- 需要用户在继续当前流程前确认信息或完成一项短任务时。
- 需要通过 `info`、`success`、`warning`、`error` 等状态快速展示桌面端反馈时。
- 移动端需要标准确认框或纵向操作列表时。

### 基础用法

使用 `v-model` 控制对话框。点击确定、取消、关闭按钮或遮罩后，组件会在离场动画结束时将 `modelValue` 更新为 `false`。

:::playground
<!--
<config lang="json5">
{
	previewInset: 16,
	expandable: true
}
</config>
-->
```vue
<template>
	<div :class="['modal-demo', { 'is-expanded': expanded }]">
		<Button @click="open">
			打开对话框
		</Button>
		<span>{{ result }}</span>

		<Modal
			v-if="modalReady"
			v-model="visible"
			title="提交确认"
			@ok="handleOk"
			@cancel="handleCancel"
			@close="handleClose"
		>
			请确认当前信息是否填写完整。
		</Modal>
	</div>
</template>

<script setup>
import { nextTick, ref } from 'vue';
import { Button, Modal } from '@deot/vc';

const expanded = ref(false);
const modalReady = ref(false);
const visible = ref(false);
const result = ref('尚未操作');

const waitForViewportHeight = height => new Promise((resolve) => {
	const check = () => {
		window.innerHeight >= height ? resolve() : requestAnimationFrame(check);
	};

	check();
});

const open = async () => {
	expanded.value = true;
	await nextTick();
	await waitForViewportHeight(480);
	modalReady.value = true;
	visible.value = true;
};

const handleOk = () => {
	result.value = '已确认提交';
};

const handleCancel = () => {
	result.value = '已取消';
};

const handleClose = () => {
	modalReady.value = false;
	expanded.value = false;
};
</script>

<style scoped>
.modal-demo {
	display: flex;
	gap: 12px;
	align-items: center;
	flex-wrap: wrap;
}

.modal-demo.is-expanded {
	height: 480px;
}
</style>
```
:::

### 尺寸、边框与拖拽

`size` 提供三档预设尺寸；`width`、`height` 可进一步覆盖尺寸。开启 `draggable` 后可从页头拖动对话框，`border` 则启用带分隔线的紧凑样式。

:::playground
<!--
<config lang="json5">
{
	previewInset: 16,
	expandable: true
}
</config>
-->
```vue
<template>
	<div :class="['modal-demo', { 'is-expanded': expanded }]">
		<Button
			v-for="item in sizes"
			:key="item.value"
			@click="open(item.value)"
		>
			{{ item.label }}
		</Button>

		<Modal
			v-if="modalReady"
			v-model="visible"
			:size="size"
			title="可拖拽对话框"
			border
			draggable
			@close="handleClose"
		>
			从页头按住并移动鼠标即可拖拽。
		</Modal>
	</div>
</template>

<script setup>
import { nextTick, ref } from 'vue';
import { Button, Modal } from '@deot/vc';

const sizes = [
	{ label: '小尺寸', value: 'small' },
	{ label: '中尺寸', value: 'medium' },
	{ label: '大尺寸', value: 'large' }
];
const expanded = ref(false);
const modalReady = ref(false);
const visible = ref(false);
const size = ref('small');

const waitForViewportHeight = height => new Promise((resolve) => {
	const check = () => {
		window.innerHeight >= height ? resolve() : requestAnimationFrame(check);
	};

	check();
});

const open = async (value) => {
	size.value = value;
	expanded.value = true;
	await nextTick();
	await waitForViewportHeight(720);
	modalReady.value = true;
	visible.value = true;
};

const handleClose = () => {
	modalReady.value = false;
	expanded.value = false;
};
</script>

<style scoped>
.modal-demo {
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
}

.modal-demo.is-expanded {
	height: 720px;
}
</style>
```
:::

### 静态方法

`Modal.info`、`Modal.success`、`Modal.warning` 和 `Modal.error` 会创建独立对话框。传入的 `mode` 会由所调用的方法确定。

:::playground
<!--
<config lang="json5">
{
	previewInset: 16,
	expandable: true
}
</config>
-->
```vue
<template>
	<div :class="['modal-demo', { 'is-expanded': expanded }]">
		<Button
			v-for="item in methods"
			:key="item.method"
			@click="open(item.method)"
		>
			{{ item.label }}
		</Button>
		<span>{{ result }}</span>
	</div>
</template>

<script setup>
import { nextTick, onUnmounted, ref } from 'vue';
import { Button, Modal } from '@deot/vc';

const methods = [
	{ label: '消息', method: 'info' },
	{ label: '成功', method: 'success' },
	{ label: '警告', method: 'warning' },
	{ label: '错误', method: 'error' }
];
const expanded = ref(false);
const result = ref('请选择一种状态');

const waitForViewportHeight = height => new Promise((resolve) => {
	const check = () => {
		window.innerHeight >= height ? resolve() : requestAnimationFrame(check);
	};

	check();
});

const open = async (method) => {
	expanded.value = true;
	await nextTick();
	await waitForViewportHeight(360);
	Modal[method]({
		title: methods.find(item => item.method === method)?.label,
		content: '这是通过静态方法创建的对话框。',
		onOk: () => {
			result.value = `已确认 ${method}`;
		},
		onClose: () => {
			expanded.value = false;
		}
	});
};

onUnmounted(() => {
	Modal.destroy();
});
</script>

<style scoped>
.modal-demo {
	display: flex;
	gap: 8px;
	align-items: center;
	flex-wrap: wrap;
}

.modal-demo.is-expanded {
	height: 360px;
}
</style>
```
:::

### 与 Portal 配合

`Portal` 可以把自定义的 Modal 包装组件转换为可调用服务。下面的多文件示例由入口、Portal 实例与 Modal 包装组件组成；包装组件通过 `portal-fulfilled` 和 `portal-rejected` 将操作结果返回给调用方。

:::playground
<!--
<config lang="json5">
{
	entry: 'App.vue',
	views: ['runtime', 'files'],
	previewInset: 16,
	expandable: true
}
</config>
-->
```vue App.vue
<template>
	<div :class="['portal-modal-demo', { 'is-expanded': expanded }]">
		<Button @click="open">
			通过 Portal 打开 Modal
		</Button>
		<span>{{ result }}</span>
	</div>
</template>

<script setup>
import { nextTick, onUnmounted, ref } from 'vue';
import { Button } from '@deot/vc';
import { PortalModal } from './portal-modal.js';

const expanded = ref(false);
const result = ref('尚未操作');

const waitForViewportHeight = height => new Promise((resolve) => {
	const check = () => {
		window.innerHeight >= height ? resolve() : requestAnimationFrame(check);
	};

	check();
});

const open = async () => {
	expanded.value = true;
	await nextTick();
	await waitForViewportHeight(480);

	try {
		await PortalModal.popup({
			title: 'Portal 调用',
			content: '这个对话框由独立的 Portal 服务创建。'
		});
		result.value = '已确认';
	} catch {
		result.value = '已取消';
	} finally {
		expanded.value = false;
	}
};

onUnmounted(() => {
	PortalModal.destroy();
});
</script>

<style scoped>
.portal-modal-demo {
	display: flex;
	gap: 12px;
	align-items: center;
	flex-wrap: wrap;
}

.portal-modal-demo.is-expanded {
	height: 480px;
}
</style>
```

```js portal-modal.js
import { Portal } from '@deot/vc';
import ModalWrapper from './ModalWrapper.vue';

export const PortalModal = new Portal(ModalWrapper, {
	name: 'portal-modal-demo'
});
```

```vue ModalWrapper.vue
<template>
	<Modal
		v-model="visible"
		:title="title"
		@ok="handleOk"
		@cancel="handleCancel"
	>
		{{ content }}
	</Modal>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { Modal } from '@deot/vc';

defineProps({
	title: String,
	content: String
});

const emit = defineEmits(['portal-fulfilled', 'portal-rejected']);
const visible = ref(false);

const handleOk = () => {
	emit('portal-fulfilled');
};

const handleCancel = () => {
	emit('portal-rejected');
};

onMounted(() => {
	visible.value = true;
});
</script>
```
:::

### 移动端用法

`MModalView` 用于声明式渲染；`MModal.alert` 创建确认框，`MModal.operation` 创建操作列表。

:::playground
<!--
<config lang="json5">
{
	viewport: 375,
	viewportOptions: ['auto', 375],
	previewInset: 16,
	expandable: true
}
</config>
-->
```vue
<template>
	<div class="mobile-modal-demo">
		<Button @click="visible = true">
			声明式确认框
		</Button>
		<Button @click="openAlert">
			静态确认框
		</Button>
		<Button @click="openOperation">
			操作列表
		</Button>
		<p>{{ result }}</p>

		<MModalView
			v-model="visible"
			title="移动端确认"
			content="是否继续当前操作？"
			@ok="handleOk"
			@cancel="handleCancel"
		/>
	</div>
</template>

<script setup>
import { onUnmounted, ref } from 'vue';
import { Button, MModal, MModalView } from '@deot/vc';

const visible = ref(false);
const result = ref('尚未操作');

const handleOk = () => {
	result.value = '已确认';
};

const handleCancel = () => {
	result.value = '已取消';
};

const openAlert = () => {
	MModal.alert({
		title: '移动端确认',
		content: '这是通过 MModal.alert 创建的确认框。',
		onOk: handleOk,
		onCancel: handleCancel
	});
};

const openOperation = () => {
	MModal.operation({
		data: [
			{
				content: '保存草稿',
				onClick: () => {
					result.value = '已保存草稿';
				}
			},
			{
				content: '放弃修改',
				onClick: () => {
					result.value = '已放弃修改';
				}
			}
		]
	});
};

onUnmounted(() => {
	MModal.destroy();
});
</script>

<style scoped>
.mobile-modal-demo {
	display: flex;
	gap: 8px;
	align-items: flex-start;
	flex-direction: column;
}

.mobile-modal-demo p {
	margin: 4px 0 0;
}
</style>
```
:::

## API

### Modal 属性

`ModalView` 与 `Modal` 使用同一组属性；通常直接使用同时带有静态方法的 `Modal`。

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| modelValue | 是否显示；支持 `v-model` | `boolean` | - | `false` |
| mode | 状态图标与确认式布局 | `string` | `info`、`success`、`error`、`warning` | - |
| title | 标题；字符串按 HTML 渲染，也可传渲染函数 | `string \| ((props: Record<string, unknown>, context: SetupContext) => any)` | - | - |
| content | 内容；字符串按 HTML 渲染，也可传渲染函数 | `string \| ((props: Record<string, unknown>, context: SetupContext) => any)` | - | `''` |
| size | 预设尺寸 | `string` | `small`、`medium`、`large` | `small` |
| contentStyle | 内容区域的行内样式 | `object \| string` | - | - |
| contentClass | 内容区域的 class | `object \| string` | - | - |
| width | 自定义宽度，单位为 px | `number` | - | 由 `size` 与 `mode` 计算 |
| height | 自定义高度，单位为 px | `number` | - | - |
| mask | 是否显示遮罩 | `boolean` | - | `true` |
| closable | 非 `mode` 布局下是否显示关闭图标 | `boolean` | - | `true` |
| maskClosable | 是否允许点击遮罩或 wrapper 关闭 | `boolean` | - | `true` |
| escClosable | 是否允许按 `Escape` 关闭 | `boolean` | - | `true` |
| closeWithCancel | 主动关闭时是否先执行 `onCancel` / `cancel` | `boolean` | - | `true` |
| scrollable | 兼容属性；当前实现始终在显示期间锁定页面滚动 | `boolean` | - | `false` |
| draggable | 是否允许从页头拖动 | `boolean` | - | `false` |
| x | 可拖动布局的初始 left，单位为 px | `number` | - | - |
| y | 可拖动布局的初始 top，单位为 px | `number` | - | - |
| okText | 确定按钮文案；传 `false` 或空字符串时隐藏 | `string \| boolean` | - | 当前 locale 的“确定” |
| cancelText | 取消按钮文案；传 `false` 或空字符串时隐藏 | `string \| boolean` | - | 当前 locale 的“取消” |
| wrapperStyle | wrapper 的行内样式 | `object \| string` | - | - |
| wrapperClass | wrapper 的 class | `object \| string` | - | - |
| footer | 是否渲染页脚；默认文案或覆盖文案至少有一项为 truthy 时生效 | `boolean` | - | `true` |
| border | 是否使用带分隔线的紧凑样式 | `boolean` | - | `false` |
| okDisabled | 是否禁用确定按钮 | `boolean` | - | `false` |
| cancelDisabled | 是否禁用取消按钮 | `boolean` | - | `false` |
| onOk | 确定回调；与 `ok` 事件监听器等价 | `Function` | - | - |
| onCancel | 取消回调；与 `cancel` 事件监听器等价 | `Function` | - | - |

桌面端预设尺寸如下。视口较小时，最终尺寸不会超过视口宽高减去 `20px`。

| size | 普通布局 | 设置 mode 后 |
| --- | --- | --- |
| small | `480 × 296` | `340 × 154` |
| medium | `640 × 502` | `640 × 502` |
| large | `864 × 662` | `390 × 198` |

### Modal 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| update:modelValue | 离场动画结束后更新显示状态 | `(visible: false) => void` | 始终传 `false` |
| ok | 点击确定按钮时调用 | `(event: MouseEvent) => unknown` | 返回 Promise 时会在其 resolve 后关闭 |
| cancel | 点击取消按钮或由关闭动作触发时调用 | `(event: MouseEvent \| KeyboardEvent) => unknown` | 返回 Promise 时会在其 resolve 后关闭 |
| close | 离场动画结束后触发 | `() => void` | - |
| visible-change | 离场动画结束后触发 | `(visible: false) => void` | 当前实现仅在关闭后传 `false` |
| portal-fulfilled | 离场动画结束后触发，供 Portal 调用兼容 | `() => void` | - |

`ok` / `cancel` 回调返回 Promise 时，对话框会等待 Promise resolve 后关闭；返回除 `true` 以外的 truthy 非 Promise 值会阻止关闭。

### Modal 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 对话框主体内容 | - |
| header | 自定义页头；使用后默认标题和关闭图标不再渲染 | - |
| footer | 自定义页脚；使用后默认按钮不再渲染 | - |
| footer-extra | 页脚起始位置的额外内容 | - |

### ModalView 方法与状态

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| toggle | 显示、隐藏或切换内部激活状态 | `visible?: boolean` | `void` |
| resetOrigin | 根据最近一次点击位置重新计算动画原点 | - | `void` |

组件实例还暴露只读使用场景下的当前 `isActive` 状态。

### Modal 静态方法

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| info | 创建 `info` 对话框 | Modal 属性及可选的 `onClose` 回调 | 弹层句柄 |
| success | 创建 `success` 对话框 | Modal 属性及可选的 `onClose` 回调 | 弹层句柄 |
| warning | 创建 `warning` 对话框 | Modal 属性及可选的 `onClose` 回调 | 弹层句柄 |
| error | 创建 `error` 对话框 | Modal 属性及可选的 `onClose` 回调 | 弹层句柄 |
| destroy | 销毁所有由上述方法创建的 Modal | - | `void` |

静态方法的 `onClose` 会在离场动画结束并开始销毁 Portal 时调用。

### MModalView 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| modelValue | 是否显示；支持 `v-model` | `boolean` | - | `false` |
| mode | 移动端布局模式 | `string` | `alert`、`operation` | `alert` |
| title | 标题；`false` 隐藏，字符串按 HTML 渲染，也可传渲染函数 | `boolean \| string \| ((props: Record<string, unknown>, context: SetupContext) => any)` | - | - |
| content | 内容；`false` 隐藏，字符串按 HTML 渲染，也可传渲染函数 | `boolean \| string \| ((props: Record<string, unknown>, context: SetupContext) => any)` | - | - |
| width | 对话框宽度，单位为 px | `number` | - | `270` |
| mask | 是否显示遮罩 | `boolean` | - | `true` |
| maskClosable | 是否允许点击遮罩关闭 | `boolean` | - | `true` |
| closeWithCancel | 点击遮罩关闭时是否先执行 `onCancel` / `cancel` | `boolean` | - | `true` |
| okText | 默认确定按钮文案；传 `false` 或空字符串时隐藏 | `string \| boolean` | - | 当前 locale 的“确定” |
| cancelText | 默认取消按钮文案；传 `false` 或空字符串时隐藏 | `string \| boolean` | - | 当前 locale 的“取消” |
| wrapperStyle | wrapper 的行内样式 | `object` | - | - |
| footer | `alert` 模式下是否渲染页脚 | `boolean` | - | `true` |
| data | 自定义按钮列表；`operation` 模式的数据源 | `Array<{ content?: string \| boolean; style?: object; onClick?: Function }>` | - | 取消、确定两个默认项 |
| onOk | 默认确定按钮回调；与 `ok` 事件监听器等价 | `Function` | - | - |
| onCancel | 默认取消按钮回调；与 `cancel` 事件监听器等价 | `Function` | - | - |

`operation` 模式只渲染 `data` 操作列表，不渲染标题、内容和页脚。

### MModalView data 项

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| content | 按钮内容，字符串按 HTML 渲染；falsy 值不渲染 | `string \| boolean` | - | - |
| style | 按钮行内样式 | `object` | - | - |
| onClick | 点击回调 | `(event: MouseEvent) => unknown` | - | - |

### MModalView 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| update:modelValue | 离场动画结束后更新显示状态 | `(visible: false) => void` | 始终传 `false` |
| ok | 点击默认确定按钮时调用 | `(event: MouseEvent) => unknown` | 返回 Promise 时会在其 resolve 后关闭 |
| cancel | 点击默认取消按钮或由遮罩关闭触发时调用 | `(event: MouseEvent) => unknown` | 返回 Promise 时会在其 resolve 后关闭 |
| close | 离场动画结束后触发 | `() => void` | - |
| portal-fulfilled | 离场动画结束后触发，供 Portal 调用兼容 | `() => void` | - |

### MModalView 插槽

以下插槽仅在 `alert` 模式下生效。

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 自定义主体内容 | - |
| header | 自定义页头 | - |
| footer | 自定义页脚 | - |

### MModalView 方法与状态

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| toggle | 显示、隐藏或切换内部激活状态 | `visible?: boolean` | `void` |

组件实例还暴露只读使用场景下的当前 `isActive` 状态。

### MModal 静态方法

`MModal` 是移动端静态调用命名空间；声明式渲染请使用 `MModalView`。

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| alert | 创建 `alert` 确认框 | MModalView 属性及可选的 `onClose` 回调 | 弹层句柄 |
| operation | 创建 `operation` 操作列表 | MModalView 属性及可选的 `onClose` 回调 | 弹层句柄 |
| destroy | 销毁所有由上述方法创建的移动端 Modal | - | `void` |

### Locale

默认按钮文案来自 `vc.Modal.okButtonText` 与 `vc.Modal.cancelButtonText`，会响应 `VcInstance.configure({ locale })` 的运行时切换。显式传入 `okText`、`cancelText`（包括空字符串）时始终优先使用传入值。

## 注意事项

`title`、`content` 和移动端 `data[].content` 的字符串会通过 `innerHTML` 渲染。只应传入可信内容；展示不可信输入时请使用插槽或渲染函数，由调用方自行创建文本节点。
