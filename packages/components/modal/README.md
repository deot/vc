## 对话框（Modal）

Modal 在当前页面上方承载需要用户确认或处理的内容。桌面端可使用 `Modal` 组件及其静态方法；移动端声明式组件为 `MModalView`，静态调用入口为 `MModal`，见[移动端](#移动端)。

### 何时使用

- 需要用户在继续当前流程前确认信息或完成一项短任务时。
- 需要通过 `info`、`success`、`warning`、`error` 等状态快速展示桌面端反馈时。
- 移动端需要标准确认框或纵向操作列表时。

### 基础用法

使用 `v-model` 控制对话框，`title` 设置标题，默认插槽或 `content` 提供内容。点击打开时，对话框立即从点中的元素附近边放大边淡入，关闭时缩回该元素当时的位置附近并淡出；不是由点击打开，或元素已经不在文档中时，改为淡入淡出。遮罩和对话框同一段动画。点击确定、取消、关闭按钮或遮罩后，组件会在离场动画结束时将 `modelValue` 更新为 `false`，并触发 `close`；`visible-change` 在打开时传 `true`、离场结束后传 `false`。

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
	<div class="modal-demo">
		<Button @click="handleOpen">打开对话框</Button>
		<span>{{ result }}</span>
		<Modal
			v-model="isActive"
			title="提交确认"
			@ok="handleOk"
			@cancel="handleCancel"
			@close="handleClose"
			@visible-change="handleVisibleChange"
		>
			请确认当前信息是否填写完整。
		</Modal>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, Modal } from '@deot/vc';

const isActive = ref(false);
const result = ref('尚未操作');

const handleOpen = () => {
	isActive.value = true;
};

const handleOk = () => {
	result.value = '已确认提交';
};

const handleCancel = () => {
	result.value = '已取消';
};

const handleClose = () => {
	result.value += '，已关闭';
};

const handleVisibleChange = (visible) => {
	visible && (result.value = '打开中');
};
</script>

<style scoped>
.modal-demo {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}
</style>
```
:::

### 尺寸、边框与拖拽

`size` 提供三档预设尺寸；`width`、`height` 可进一步覆盖尺寸。不传 `height` 时预设高度是最小高度，内容更多时增长；内容较少又希望弹窗贴合内容时设置 `height="auto"`，高度超过视口后内容区滚动。开启 `draggable` 后可从页头拖动对话框，`x`、`y` 设置初始位置；`border` 则启用带分隔线的紧凑样式。

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
	<div class="modal-demo">
		<Button v-for="item in sizes" :key="item.value" @click="handleOpen(item.value)">{{ item.label }}</Button>
		<Button @click="isCustom = true">自定义宽高与初始位置</Button>
		<Modal v-model="isActive" :size="size" title="可拖拽对话框" border draggable>
			从页头按住并移动鼠标即可拖拽。
		</Modal>
		<Modal v-model="isCustom" :width="360" :x="40" :y="40" height="auto" title="宽 360，高度跟随内容" draggable>
			初始位置在左上角，内容较少时高度贴合内容。
		</Modal>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, Modal } from '@deot/vc';

const sizes = [
	{ label: '小尺寸', value: 'small' },
	{ label: '中尺寸', value: 'medium' },
	{ label: '大尺寸', value: 'large' }
];
const isActive = ref(false);
const isCustom = ref(false);
const size = ref('small');

const handleOpen = (value) => {
	size.value = value;
	isActive.value = true;
};
</script>

<style scoped>
.modal-demo {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}
</style>
```
:::

### 关闭行为与按钮

- `mask` 控制遮罩，`maskClosable` 控制点遮罩关闭，`escClosable` 控制按 Esc 关闭，`closable` 控制右上角关闭图标。
- `closeWithCancel`（默认开启）让关闭图标、遮罩、Esc 等关闭操作先执行 `cancel`；关闭后只区分「点了取消」时设为 `false`。
- `okText`、`cancelText` 修改按钮文案，传 `false` 隐藏；`okDisabled`、`cancelDisabled` 禁用按钮。
- `ok` / `cancel` 回调返回 Promise 时，等它 resolve 后才关闭。
- `triggerElement` 指定展开与缩回的元素，传 `null` 时原位淡入淡出（例如定时器打开的弹窗）。

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
	<div class="modal-demo">
		<div class="modal-demo__row">
			<Checkbox v-model="isMask">遮罩</Checkbox>
			<Checkbox v-model="isMaskClosable">点遮罩关闭</Checkbox>
			<Checkbox v-model="isEscClosable">Esc 关闭</Checkbox>
			<Checkbox v-model="isClosable">关闭图标</Checkbox>
			<Checkbox v-model="isCloseWithCancel">关闭时执行 cancel</Checkbox>
			<Checkbox v-model="isOkDisabled">禁用确定</Checkbox>
			<Checkbox v-model="isCancelDisabled">禁用取消</Checkbox>
		</div>
		<div class="modal-demo__row">
			<Button @click="isActive = true">打开</Button>
			<Button @click="handleDelayOpen">1 秒后原位打开</Button>
		</div>
		<p class="modal-demo__result">{{ result }}</p>
		<Modal
			v-model="isActive"
			:mask="isMask"
			:mask-closable="isMaskClosable"
			:esc-closable="isEscClosable"
			:closable="isClosable"
			:close-with-cancel="isCloseWithCancel"
			:ok-disabled="isOkDisabled"
			:cancel-disabled="isCancelDisabled"
			:trigger-element="triggerElement"
			ok-text="保存"
			cancel-text="不保存"
			title="关闭行为"
			@ok="handleOk"
			@cancel="handleCancel"
			@close="handleClose"
		>
			点「保存」后等待 1 秒才关闭。
		</Modal>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, Checkbox, Modal } from '@deot/vc';

const isActive = ref(false);
const isMask = ref(true);
const isMaskClosable = ref(true);
const isEscClosable = ref(true);
const isClosable = ref(true);
const isCloseWithCancel = ref(true);
const isOkDisabled = ref(false);
const isCancelDisabled = ref(false);
const triggerElement = ref(undefined);
const result = ref('尚未操作');

const handleDelayOpen = () => {
	triggerElement.value = null;
	setTimeout(() => {
		isActive.value = true;
	}, 1000);
};

const handleOk = () => {
	result.value = '保存中…';
	return new Promise((resolve) => {
		setTimeout(() => {
			result.value = '已保存';
			resolve();
		}, 1000);
	});
};

const handleCancel = () => {
	result.value = '触发 cancel';
};

const handleClose = () => {
	triggerElement.value = undefined;
};
</script>

<style scoped>
.modal-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.modal-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}

.modal-demo__result {
	margin: 0;
}
</style>
```
:::

### 自定义结构与样式

`header` 插槽替换页头（不再渲染默认标题与关闭图标），`footer` 插槽替换页脚按钮，`footer-extra` 在页脚起始位置追加内容；`footer` 为 `false` 时不渲染页脚。`contentClass` / `contentStyle` 作用于内容区，`wrapperClass` / `wrapperStyle` 作用于铺满视口、负责居中的 wrapper。内容区默认由内置 Scroller 滚动，`scrollerOptions` 传给它；`scrollable` 为 `false` 时由内容自行滚动。`mode` 切换为带状态图标的确认式布局。通过 ref 调用 `toggle()` 切换显示。

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
	<div class="modal-demo">
		<Button @click="isCustom = true">自定义页头页脚</Button>
		<Button @click="isPlain = true">无页脚、内容自行滚动</Button>
		<Button @click="handleToggle">mode="warning"（toggle）</Button>
		<Modal
			v-model="isCustom"
			:scroller-options="{ always: true }"
			content-class="modal-demo__content"
			:content-style="{ lineHeight: 2 }"
			wrapper-class="modal-demo__wrapper"
			:wrapper-style="{ alignItems: 'flex-start' }"
		>
			<template #header>
				<strong>自定义页头</strong>
			</template>
			<p v-for="index in 12" :key="index" class="modal-demo__line">第 {{ index }} 行内容</p>
			<template #footer-extra>
				<span>共 12 行</span>
			</template>
			<template #footer>
				<Button type="primary" @click="isCustom = false">知道了</Button>
			</template>
		</Modal>
		<Modal v-model="isPlain" :footer="false" :scrollable="false" title="无页脚">
			<div class="modal-demo__scroll">
				<p v-for="index in 20" :key="index" class="modal-demo__line">第 {{ index }} 行内容</p>
			</div>
		</Modal>
		<Modal ref="modalRef" mode="warning" title="确认删除" content="删除后不可恢复。" />
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, Modal } from '@deot/vc';

const isCustom = ref(false);
const isPlain = ref(false);
const modalRef = ref();

const handleToggle = () => {
	modalRef.value.toggle();
};
</script>

<style scoped>
.modal-demo {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}

.modal-demo__line {
	margin: 0;
}

.modal-demo__scroll {
	min-height: 0;
	overflow: auto;
}
</style>
```
:::

### 静态方法

`Modal.info`、`Modal.success`、`Modal.warning` 和 `Modal.error` 会创建独立对话框。传入的 `mode` 会由所调用的方法确定。`Modal.destroy()` 销毁所有由这些方法创建的对话框。

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
	<div class="modal-demo">
		<Button v-for="item in methods" :key="item.method" @click="handleOpen(item.method)">{{ item.label }}</Button>
		<span>{{ result }}</span>
	</div>
</template>

<script setup>
import { onUnmounted, ref } from 'vue';
import { Button, Modal } from '@deot/vc';

const methods = [
	{ label: '消息', method: 'info' },
	{ label: '成功', method: 'success' },
	{ label: '警告', method: 'warning' },
	{ label: '错误', method: 'error' }
];
const result = ref('请选择一种状态');

const handleOpen = (method) => {
	Modal[method]({
		title: methods.find(item => item.method === method)?.label,
		content: '这是通过静态方法创建的对话框。',
		onOk: () => {
			result.value = `已确认 ${method}`;
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
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
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
	previewInset: 16
}
</config>
-->
```vue App.vue
<template>
	<div class="modal-demo">
		<Button @click="handleOpen">通过 Portal 打开 Modal</Button>
		<span>{{ result }}</span>
	</div>
</template>

<script setup>
import { onUnmounted, ref } from 'vue';
import { Button } from '@deot/vc';
import { PortalModal } from './portal-modal.js';

const result = ref('尚未操作');

const handleOpen = async () => {
	try {
		await PortalModal.popup({
			title: 'Portal 调用',
			content: '这个对话框由独立的 Portal 服务创建。'
		});
		result.value = '已确认';
	} catch {
		result.value = '已取消';
	}
};

onUnmounted(() => {
	PortalModal.destroy();
});
</script>

<style scoped>
.modal-demo {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
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
		v-model="isActive"
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
const isActive = ref(false);

const handleOk = () => {
	emit('portal-fulfilled');
};

const handleCancel = () => {
	emit('portal-rejected');
};

onMounted(() => {
	isActive.value = true;
});
</script>
```
:::

## 移动端

`MModalView` 用于声明式渲染；`MModal.alert` 创建确认框，`MModal.operation` 创建操作列表。尺寸按 750 稿设计，写为 `calc(var(--vc-rem) * n)`，随 `--vc-rem` 缩放，底栏切换 `rem` 可查看不同屏宽下的效果。

### 声明式确认框

`MModalView` 的 `title`、`content`、`okText`、`cancelText`、`mask`、`maskClosable`、`closeWithCancel` 与桌面端同义，`width` 为 750 稿长度。`data` 自定义按钮列表，项设置 `disabled: true` 时置灰、点击既不触发回调也不关闭；`mode="operation"` 时只渲染 `data` 操作列表。`header`、`default`、`footer` 插槽只在 `alert` 模式下生效，`footer` 为 `false` 时不渲染页脚。离场动画结束后触发 `close` 与 `portal-fulfilled`。

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
	<div class="m-modal-demo">
		<MButton type="primary" @click="isActive = true">默认确认框</MButton>
		<MButton @click="isCustom = true">自定义按钮与插槽</MButton>
		<MButton @click="handleToggle">操作列表（toggle）</MButton>
		<MButton @click="isPlain = true">无页脚</MButton>
		<p class="m-modal-demo__result">{{ result }}</p>
		<MModalView
			v-model="isActive"
			:width="600"
			:close-with-cancel="false"
			title="移动端确认"
			content="是否继续当前操作？"
			ok-text="继续"
			cancel-text="再想想"
			content-class="m-modal-demo__content"
			:content-style="{ textAlign: 'left' }"
			wrapper-class="m-modal-demo__wrapper"
			:wrapper-style="{ paddingBottom: '20vh' }"
			@ok="handleOk"
			@cancel="handleCancel"
			@close="handleClose"
			@portal-fulfilled="handleFulfilled"
		/>
		<MModalView v-model="isCustom" :data="data" :mask-closable="false">
			<template #header>
				<strong class="m-modal-demo__header">自定义页头</strong>
			</template>
			<span>第三项不可点击。</span>
		</MModalView>
		<MModalView v-model="isPlain" :footer="false" :mask="false" title="没有页脚，也没有遮罩" content="点空白处关闭。" />
		<MModalView ref="operationRef" :data="operations" mode="operation" />
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MButton, MModalView } from '@deot/vc';

const isActive = ref(false);
const isCustom = ref(false);
const isPlain = ref(false);
const operationRef = ref();
const result = ref('尚未操作');
// 回调返回 undefined 才会关闭；表达式体会把赋值结果（非空字符串）当返回值而阻止关闭
const setResult = (text) => {
	result.value = text;
};

const data = [
	{ content: '选项一', onClick: () => setResult('点了选项一') },
	{ content: '选项二', style: { color: 'var(--vc-color-error)' }, onClick: () => setResult('点了选项二') },
	{ content: '选项三', disabled: true }
];
const operations = [
	{ content: '保存草稿', onClick: () => setResult('已保存草稿') },
	{ content: '放弃修改', onClick: () => setResult('已放弃修改') }
];

const handleToggle = () => {
	operationRef.value.toggle();
};

const handleOk = () => {
	result.value = '已确认';
};

const handleCancel = () => {
	result.value = '已取消';
};

const handleClose = () => {
	result.value += '，已关闭';
};

const handleFulfilled = () => {
	result.value += '（portal-fulfilled）';
};
</script>

<style scoped>
.m-modal-demo {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: calc(var(--vc-rem) * 16);
	padding-inline: calc(var(--vc-rem) * 32);
}

.m-modal-demo__header {
	display: block;
	padding: calc(var(--vc-rem) * 40) calc(var(--vc-rem) * 32) 0;
	text-align: center;
}

.m-modal-demo__result {
	margin: 0;
}
</style>
```
:::

### 静态调用

`MModal.alert` 与 `MModal.operation` 接收 MModalView 的属性及可选的 `onClose`，`MModal.destroy()` 销毁所有由它们创建的弹窗。

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
	<div class="m-modal-demo">
		<MButton type="primary" @click="handleOpenAlert">静态确认框</MButton>
		<MButton @click="handleOpenOperation">操作列表</MButton>
		<p class="m-modal-demo__result">{{ result }}</p>
	</div>
</template>

<script setup>
import { onUnmounted, ref } from 'vue';
import { MButton, MModal } from '@deot/vc';

const result = ref('尚未操作');
// 回调返回 undefined 才会关闭；表达式体会把赋值结果（非空字符串）当返回值而阻止关闭
const setResult = (text) => {
	result.value = text;
};

const handleOpenAlert = () => {
	MModal.alert({
		title: '移动端确认',
		content: '这是通过 MModal.alert 创建的确认框。',
		onOk: () => {
			result.value = '已确认';
		},
		onCancel: () => {
			result.value = '已取消';
		}
	});
};

const handleOpenOperation = () => {
	MModal.operation({
		data: [
			{ content: '保存草稿', onClick: () => setResult('已保存草稿') },
			{ content: '放弃修改', onClick: () => setResult('已放弃修改') }
		],
		onClose: () => {
			result.value += '，已关闭';
		}
	});
};

onUnmounted(() => {
	MModal.destroy();
});
</script>

<style scoped>
.m-modal-demo {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: calc(var(--vc-rem) * 16);
	padding-inline: calc(var(--vc-rem) * 32);
}

.m-modal-demo__result {
	margin: 0;
}
</style>
```
:::

尺寸如下（括号内为 375 宽下的 px）：

| 项 | 值 |
| --- | --- |
| 弹窗 | 宽 540（270），圆角 16（8） |
| 标题 | 字号 34（17），字重 600，行高 52（26）；标题栏内边距 40 32 0（20 16 0），只有标题时底部同为 40（20） |
| 正文 | 字号 30（15），行高 44（22）；内边距 8 32 40（4 16 20），没有标题时顶部为 40（20）并改用主文字颜色 |
| 按钮 | 高 88（44），字号 32（16）；取消为 `color-dark-light`、确定为主色，三个及以上竖排、只有一个按钮时都为主色 |

- 标题、正文默认居中；正文的对齐可通过 `contentStyle`（如 `text-align: left`）调整，标题可通过 `header` 插槽自定义。
- `data` 中的项设置 `disabled: true` 时置灰，点击既不触发回调也不关闭。
- 打开时从 0.5 倍放大并回弹（450ms），关闭时缩小淡出（150ms）。
- 分隔线保持 1px（高分屏 0.5px），不随 `--vc-rem` 缩放。

## 主题与局部覆盖

全局参数通过 `--vc-<参数>` 配置，组件级覆盖使用 `--vc-modal-<参数>`。局部参数仅提供组件级入口；可在组件根节点或其祖先上设置。

弹层或遮罩通过 Portal 挂载时，覆盖变量需作用于实际浮层或其祖先。

内嵌或复用的 [button](../button/README.md#主题与局部覆盖)、[scroller](../scroller/README.md#主题与局部覆盖) 使用各自的主题入口。

### 全局

| 参数 | 使用位置 | 值 |
| --- | --- | --- |
| color-dark-light | 桌面端标题；移动端标题、无标题正文、取消按钮及操作文字 | 亮色：`#080F20`；暗色：`#E8E8E8` |
| color-dark-lighter | 移动端正文 | 亮色：`#515151`；暗色：`#D9D9D9` |
| color-dark-lightest | 桌面端关闭图标 | 亮色：`#64758B`；暗色：`#C9C9C9` |
| color-error | 错误图标 | `#F53F3F` |
| color-mask | 遮罩背景 | 亮色：`rgb(0 0 0 / 40%)`；暗色：`rgb(255 255 255 / 40%)` |
| color-neutral-light | 桌面标题、底部及移动端按钮分隔线 | 亮色：`#EDEFF1`；暗色：`#3B4354` |
| color-primary | 信息图标及移动端确认按钮 | `#456CF6` |
| foreground-color-inactive | 移动端禁用按钮的文字 | 亮色：`#C0C4CC`；暗色：`#737D8C` |
| color-success | 成功图标 | `#1DB88C` |
| color-warning | 警告图标 | `#E6A23C` |
| background-color-lightest | 弹窗面板背景 | 亮色：`#FFFFFF`；暗色：`#252B3A` |
| foreground-color | 桌面端弹窗文字 | 亮色：`#080F20`；暗色：`#F8F8F8` |
| box-shadow | 弹窗面板阴影 | 亮色：`0 0 8px 0 rgb(0 0 0 / 10%)`；暗色：`0 0 8px 0 rgb(255 255 255 / 5%)` |

### 局部

当前组件没有额外的局部 CSS 主题参数。

## API

### Modal 属性

`ModalView` 与 `Modal` 使用同一组属性；通常直接使用同时带有静态方法的 `Modal`。

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| modelValue | 是否显示；支持 `v-model` | `boolean` | - | `false` |
| mode | 状态图标与确认式布局 | `string` | `info`、`success`、`error`、`warning` | - |
| title | 标题。字符串按文本渲染，也可传渲染函数或 `{ type, value }`（需要 HTML 时传 `{ type: 'html', value }`），见 [Customer](../customer/README.md) | `string \| number \| Function \| { type: string; value: any }` | - | - |
| content | 内容，取值与 title 相同；与默认插槽同时显示 | `string \| number \| Function \| { type: string; value: any }` | - | `''` |
| size | 预设尺寸 | `string` | `small`、`medium`、`large` | `small` |
| contentStyle | 内容区域的行内样式 | `object \| string` | - | - |
| contentClass | 内容区域的 class | `object \| string` | - | - |
| width | 自定义宽度，单位为 px | `number` | - | 由 `size` 与 `mode` 计算 |
| height | 数字为固定高度，单位为 px；`'auto'` 时高度跟随内容，不使用 `size` 预设的最小高度；不传时以 `size` 预设的高度为最小高度 | `number \| 'auto'` | - | - |
| mask | 是否显示遮罩 | `boolean` | - | `true` |
| triggerElement | 打开时从它展开，关闭时缩回它（已不在文档里时缩回打开时的位置）；可以是元素或 `VirtualElement`（只有一个盒子的替身）；传 `null` 时原位淡入淡出，如定时器、推送打开的弹窗 | `Element \| VirtualElement \| null` | - | 最近一次点击的位置，请求回来后才打开、被点的元素已移除也算 |
| closable | 非 `mode` 布局下是否显示关闭图标 | `boolean` | - | `true` |
| maskClosable | 是否允许点击遮罩关闭 | `boolean` | - | `true` |
| escClosable | 是否允许按 `Escape` 关闭；多个弹层叠加时一次只关闭最后打开的一个，其中的下拉打开时先关闭下拉，输入法组合中不响应 | `boolean` | - | `true` |
| closeWithCancel | 主动关闭时是否先执行 `onCancel` / `cancel` | `boolean` | - | `true` |
| scrollable | 内容区是否由内置的 Scroller 滚动；`false` 时由内容自行收缩并滚动（内容的根节点需设置 `min-height: 0`） | `boolean` | - | `true` |
| scrollerOptions | 内置 Scroller 的属性（如 `always`、`native`）；内容区的类名与样式仍用 `contentClass`、`contentStyle` | `object` | - | - |
| draggable | 是否允许从页头拖动 | `boolean` | - | `false` |
| x | 可拖动布局的初始 left，单位为 px | `number` | - | - |
| y | 可拖动布局的初始 top，单位为 px | `number` | - | - |
| okText | 确定按钮文案；传 `false` 或空字符串时隐藏 | `string \| boolean` | - | 当前 locale 的“确定” |
| cancelText | 取消按钮文案；传 `false` 或空字符串时隐藏 | `string \| boolean` | - | 当前 locale 的“取消” |
| wrapperStyle | wrapper 的行内样式；wrapper 铺满视口并负责居中，自身不接收事件 | `object \| string` | - | - |
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
| visible-change | 打开时传 `true`；关闭时在离场动画结束后传 `false` | `(visible: boolean) => void` | - |
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

### 静态调用的 Promise 与操作回调

`await Modal.info(options)`（以及 `success`、`warning`、`error`）等待的是 **Modal 关闭**，不是用户点击确定。正常交互中，无论通过确定、取消还是关闭操作结束弹层，返回句柄都会在离场结束后 resolve；不能用它判断用户是否确认。

`onOk`、`onCancel` 是操作回调，不是只消费一次的 Promise 结果。它们返回的 Promise resolve 后才会继续关闭；如果返回 rejected Promise，弹层保持打开，用户可以再次操作，因此同一个弹层的回调可能执行多次。

`onClose` 始终表示弹层已经关闭，不表示取消操作；`onCancel` 用于取消按钮操作。注意默认 `closeWithCancel: true` 还会把关闭图标、遮罩和 Escape 等关闭操作关联到 `onCancel`。需要严格区分时，设置 `closeWithCancel: false`。

如果业务需要“确定时 resolve，取消或关闭时 reject”，可以单独包装 Promise：

```js
import { Modal } from '@deot/vc';

const confirm = () => new Promise((resolve, reject) => {
	Modal.info({
		title: '提交确认',
		content: '是否提交当前信息？',
		closeWithCancel: false,
		onOk: resolve,
		onCancel: reject,
		onClose: reject
	});
});

export const handleSubmit = async () => {
	try {
		await confirm();
	} catch {
		return;
	}
	// 用户已确认，在这里执行提交逻辑。
};
```

这里的 `reject` 结束的是外层业务 Promise，回调本身返回 `undefined`，因此不会阻止 Modal 关闭；这与回调返回 `Promise.reject(...)` 不同。确定后仍会触发 `onClose`，但外层 Promise 已经 resolve，后续 reject 不会改变结果。外层 Promise 表达的是操作结果，不等待离场动画；调用方需要处理其 rejection。直接调用 `Modal.destroy()` 是强制销毁，不经过正常离场回调，不应依赖它触发上述 `onClose` 或完成等待。

### MModalView 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| modelValue | 是否显示；支持 `v-model` | `boolean` | - | `false` |
| mode | 移动端布局模式 | `string` | `alert`、`operation` | `alert` |
| title | 标题；`false` 隐藏。字符串按文本渲染，也可传渲染函数或 `{ type, value }`（需要 HTML 时传 `{ type: 'html', value }`），见 [Customer](../customer/README.md) | `string \| number \| boolean \| Function \| { type: string; value: any }` | - | - |
| content | 内容；`false` 隐藏，其余取值与 title 相同 | `string \| number \| boolean \| Function \| { type: string; value: any }` | - | - |
| width | 对话框宽度，750 稿长度 | `number` | - | 样式默认 `540` |
| mask | 是否显示遮罩 | `boolean` | - | `true` |
| maskClosable | 是否允许点击遮罩关闭 | `boolean` | - | `true` |
| closeWithCancel | 点击遮罩关闭时是否先执行 `onCancel` / `cancel` | `boolean` | - | `true` |
| okText | 默认确定按钮文案；传 `false` 或空字符串时隐藏 | `string \| boolean` | - | 当前 locale 的“确定” |
| cancelText | 默认取消按钮文案；传 `false` 或空字符串时隐藏 | `string \| boolean` | - | 当前 locale 的“取消” |
| wrapperClass | wrapper 的类名；wrapper 铺满视口并负责居中，自身不接收事件 | `string \| object \| array` | - | - |
| wrapperStyle | wrapper 的行内样式 | `string \| object \| array` | - | - |
| contentClass | 内容区（`.vcm-modal__content`）的类名 | `string \| object \| array` | - | - |
| contentStyle | 内容区的行内样式，如 `text-align: left` 让正文左对齐 | `string \| object \| array` | - | - |
| footer | `alert` 模式下是否渲染页脚 | `boolean` | - | `true` |
| data | 自定义按钮列表；`operation` 模式的数据源 | `Array<{ content?: string \| boolean; style?: object; disabled?: boolean; onClick?: Function }>` | - | 取消、确定两个默认项 |
| onOk | 默认确定按钮回调；与 `ok` 事件监听器等价 | `Function` | - | - |
| onCancel | 默认取消按钮回调；与 `cancel` 事件监听器等价 | `Function` | - | - |

`operation` 模式只渲染 `data` 操作列表，不渲染标题、内容和页脚。

### MModalView data 项

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| content | 按钮内容，取值与 title 相同；falsy 值不渲染 | `string \| number \| boolean \| Function \| { type: string; value: any }` | - | - |
| style | 按钮行内样式 | `object` | - | - |
| disabled | 是否禁用：置灰，点击既不触发 `onClick` 也不关闭 | `boolean` | - | `false` |
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

`title`、`content` 和移动端 `data[].content` 的字符串按文本渲染；需要 HTML 时传 `{ type: 'html', value }`，这类内容只应来自可信来源，或由全局的 `sanitize` 统一清洗，见 [Customer](../customer/README.md)。
