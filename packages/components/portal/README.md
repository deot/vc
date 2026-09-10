## 传送门（Portal）

将 Vue 组件封装为可调用的服务，通过 `popup()` 传入数据、创建界面并接收操作结果；也提供声明式的 `PortalView`。

### 何时使用

- 从列表、详情或工具栏打开独立的编辑表单、选择器、详情面板，在确认后更新调用页面。
- 封装需要重复使用的 Modal、Drawer 或通知服务，统一创建、结果回传与清理。
- 使用 `PortalView` 保留原位置的占位内容，同时将另一部分内容传送到 `body`。

`Portal` 是创建独立 Vue app 的工具类，不直接提供弹窗、遮罩或按钮。`PortalView` 是基于 Teleport 的组件，仍处于调用方的组件树中。`MPortal` 与 `Portal` 是同一个类，移动端外观由包装组件决定。

### 基础用法

一个可复用服务通常由调用页面、Portal 实例和包装组件三个文件组成。包装组件发送 `portal-fulfilled` 返回结果，发送 `portal-rejected` 表示取消。调用方通过 `await` 或 `.then()/.catch()` 接收结果。

以下命令式案例都将 `new Portal(...)` 放在独立的服务文件中，调用页面导入服务后执行 `popup()`；UI 与表单逻辑放在 Wrapper 中。

下面模拟列表中的编辑操作：Form 校验名称，确认后仅更新当前记录，取消时保持原数据。示例先展开预览区域再创建 Modal，并在 Portal 清理后恢复高度。

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
	<div :class="['editor-demo', { 'is-expanded': isActive }]">
		<Card title="项目资料">
			<div class="record-row">
				<div>
					<strong>{{ record.name }}</strong>
					<p class="description">编号 #{{ record.id }} · 点击编辑更新项目名称</p>
				</div>
				<Button type="primary" :disabled="isActive" @click="handleEdit">
					编辑记录
				</Button>
			</div>
		</Card>
		<p class="feedback" role="status">{{ result }}</p>
	</div>
</template>

<script setup>
import { nextTick, onUnmounted, ref } from 'vue';
import { Button, Card } from '@deot/vc';
import { RecordEditor } from './record-editor.js';

const record = ref({ id: 1, name: '示例项目' });
const result = ref('尚未编辑');
const isActive = ref(false);
let isDisposed = false;

const handleEdit = async () => {
	isActive.value = true;
	await nextTick();
	// Playground 的 iframe 需要先完成高度同步，普通业务页面无需此步骤。
	await new Promise((resolve) => {
		const check = () => {
			isDisposed || window.innerHeight >= 480 ? resolve() : requestAnimationFrame(check);
		};
		check();
	});
	if (isDisposed) return;

	try {
		const data = await RecordEditor.popup({ record: { ...record.value } }, {
			onDestroyed: () => (isActive.value = false)
		});
		record.value = data;
		result.value = '已保存：' + data.name;
	} catch (reason) {
		result.value = reason === 'cancel' ? '已取消，记录未变更' : '操作失败';
	}
};

onUnmounted(() => {
	isDisposed = true;
	RecordEditor.destroy();
});
</script>

<style scoped>
.editor-demo {
	display: grid;
	gap: 16px;
	align-content: start;
}

.editor-demo.is-expanded {
	min-height: 500px;
}

.record-row {
	display: flex;
	gap: 16px;
	align-items: center;
	justify-content: space-between;
	flex-wrap: wrap;
}

.record-row strong {
	font-size: 16px;
}

.description {
	margin: 6px 0 0;
	color: var(--vc-color-dark-extralight);
}

.feedback {
	padding: 12px 16px;
	margin: 0;
	color: var(--vc-color-dark-lighter);
	background: var(--vc-background-color);
	border-radius: 8px;
}
</style>
```

```js record-editor.js
import { Portal } from '@deot/vc';
import EditorWrapper from './EditorWrapper.vue';

export const RecordEditor = new Portal(EditorWrapper, {
	name: 'portal-record-editor'
});
```

```vue EditorWrapper.vue
<template>
	<Modal
		v-model="isActive"
		title="编辑记录"
		:width="360"
		:mask-closable="false"
		:on-cancel="handleCancel"
	>
		<p class="description">保存后，项目名称会同步更新到调用页面。</p>
		<Form ref="form" :model="formData" label-position="top" @submit.prevent="handleSave">
			<FormItem prop="name" label="项目名称" label-for="record-name" required="请填写名称">
				<Input
					v-model="formData.name"
					input-id="record-name"
					aria-label="项目名称"
					placeholder="请输入项目名称"
					:allow-dispatch="false"
					clearable
				/>
			</FormItem>
		</Form>
		<template #footer>
			<div class="actions">
				<Button @click="handleCancel">取消编辑</Button>
				<Button type="primary" @click="handleSave">保存记录</Button>
			</div>
		</template>
	</Modal>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { Button, Form, FormItem, Input, Modal } from '@deot/vc';

const props = defineProps({ record: { type: Object, required: true } });
const emit = defineEmits(['portal-fulfilled', 'portal-rejected']);
const isActive = ref(false);
const form = ref();
const formData = reactive({ name: props.record.name });

const handleSave = async () => {
	// 本例统一在保存时校验，Input 不在输入或失焦时另外触发校验。
	formData.name = formData.name.trim();
	try {
		await form.value.validate({ scroll: false });
	} catch {
		return;
	}
	// 真实业务可在保存成功后再发送结果；失败时保留表单供用户重试。
	isActive.value = false;
	emit('portal-fulfilled', { ...props.record, name: formData.name });
};
const handleCancel = () => {
	isActive.value = false;
	emit('portal-rejected', 'cancel');
};

onMounted(() => (isActive.value = true));
</script>

<style scoped>
.description {
	margin: 0 0 20px;
	line-height: 1.6;
	color: var(--vc-color-dark-extralight);
}

.actions {
	display: flex;
	gap: 12px;
	justify-content: flex-end;
	flex-wrap: wrap;
}
</style>
```
:::

### 创建前准备数据

`onBeforeCreate(propsData)` 可以返回对象或 Promise。返回对象会作为额外 props 合并到包装组件，同名字段覆盖调用时的值；异步准备完成前不会渲染包装组件。

当前实现中，准备 Promise 拒绝时会调用 `onDestroyed(error)` 清理节点，但不会拒绝 `popup()` 的 Promise。下面分别显示加载、结果和准备失败状态，避免将失败提示只放在 `popup().catch()` 中。如果需要一条完整的 `try/catch` 请求链，可先在调用方 `await` 数据请求，再执行 `popup(data, options)`。

:::playground
<!--
<config lang="json5">
{ entry: 'App.vue', views: ['runtime', 'files'], previewInset: 16 }
</config>
-->
```vue App.vue
<template>
	<div class="detail-demo">
		<div class="actions">
			<Button type="primary" :disabled="isActive" @click="handleOpen(false)">加载详情</Button>
			<Button :disabled="isActive" @click="handleOpen(true)">模拟加载失败</Button>
		</div>
		<p class="feedback" role="status">{{ status }}</p>
		<div ref="target" />
	</div>
</template>

<script setup>
import { onUnmounted, ref } from 'vue';
import { Button } from '@deot/vc';
import { Detail } from './detail.js';

const target = ref();
const isActive = ref(false);
const status = ref('尚未加载');

const handleOpen = (isFail) => {
	isActive.value = true;
	status.value = '正在准备数据…';
	Detail.popup({
		id: 7,
		isFail,
		onReady: () => (status.value = '详情已就绪')
	}, {
		el: target.value,
		onDestroyed: (error) => {
			isActive.value = false;
			if (error) status.value = error.message;
		}
	}).then(
		value => (status.value = '已完成：' + value),
		() => (status.value = '已取消')
	);
};

onUnmounted(() => Detail.destroy());
</script>

<style scoped>
.detail-demo {
	display: grid;
	gap: 16px;
}

.actions {
	display: flex;
	gap: 12px;
	flex-wrap: wrap;
}

.feedback {
	padding: 12px 16px;
	margin: 0;
	color: var(--vc-color-dark-lighter);
	background: var(--vc-background-color);
	border-radius: 8px;
}
</style>
```

```js detail.js
import { Portal } from '@deot/vc';
import DetailWrapper from './DetailWrapper.vue';

export const Detail = new Portal(DetailWrapper, {
	name: 'portal-detail',
	leaveDelay: 0,
	onBeforeCreate: async ({ id, isFail }) => {
		// 用本地数据模拟详情请求，业务中可替换为实际接口。
		await new Promise(resolve => setTimeout(resolve, 500));
		if (isFail) throw new Error('模拟请求失败，请重试');
		return { title: '记录 ' + id, description: '详情已加载完成，可以阅读后确认或取消。' };
	}
});
```

```vue DetailWrapper.vue
<template>
	<Card :title="title">
		<p class="description">{{ description }}</p>
		<div class="actions">
			<Button type="primary" @click="handleConfirm">完成阅读</Button>
			<Button @click="handleCancel">取消阅读</Button>
		</div>
	</Card>
</template>

<script setup>
import { onMounted } from 'vue';
import { Button, Card } from '@deot/vc';

const props = defineProps({ id: Number, isFail: Boolean, title: String, description: String });
const emit = defineEmits(['ready', 'portal-fulfilled', 'portal-rejected']);

const handleConfirm = () => emit('portal-fulfilled', props.title);
const handleCancel = () => emit('portal-rejected');

onMounted(() => emit('ready'));
</script>

<style scoped>
.description {
	margin: 0 0 20px;
	line-height: 1.7;
	color: var(--vc-color-dark-lighter);
}

.actions {
	display: flex;
	gap: 12px;
	flex-wrap: wrap;
}
</style>
```
:::

### 多实例、指定容器与独立关闭

默认相同 `name` 的再次调用会销毁旧实例。`multiple: true` 为每次调用生成独立标识，适合并列查看多个详情或显示多条任务通知。`el` 接受已存在的 DOM 元素或选择器；`insertion: 'first'` 将新节点插在目标的首个元素前。

保存返回的 leaf，可以分别 `resolve(value)`、`reject(reason)` 或 `destroy()`。下例使用普通面板展示多实例，避免多个遮罩相互遮挡。`fragment: true` 保留挂载容器，支持包装组件的多根节点和条件渲染。

:::playground
<!--
<config lang="json5">
{ entry: 'App.vue', views: ['runtime', 'files'], previewInset: 16 }
</config>
-->
```vue App.vue
<template>
	<div class="panels-demo">
		<div class="actions">
			<Button type="primary" @click="handleAdd">添加详情</Button>
			<Button :disabled="!activeCount" @click="handleCloseLatest">取消最新详情</Button>
			<Button :disabled="!activeCount" @click="handleClear">清理本组</Button>
		</div>
		<p class="feedback" role="status">当前 {{ activeCount }} 个；{{ status }}</p>
		<div ref="target" class="panels" />
	</div>
</template>

<script setup>
import { onUnmounted, ref } from 'vue';
import { Button } from '@deot/vc';
import { Panels } from './panels.js';

const target = ref();
const activeCount = ref(0);
const status = ref('尚未添加');
const leaves = new Map();
let sequence = 0;

const handleAdd = () => {
	const id = ++sequence;
	const leaf = Panels.popup({ id }, {
		el: target.value,
		onDestroyed: () => {
			leaves.delete(id);
			activeCount.value = leaves.size;
		}
	});
	leaves.set(id, leaf);
	activeCount.value = leaves.size;
	leaf.then(
		value => (status.value = '已确认详情 ' + value),
		reason => (status.value = '已取消详情 ' + reason)
	);
};
const handleCloseLatest = () => {
	const [id, leaf] = [...leaves.entries()].at(-1);
	leaf.reject(id);
};
const handleClear = () => {
	Panels.destroy();
	status.value = '已清理本组；直接销毁不产生确认或取消结果';
};

onUnmounted(() => Panels.destroy());
</script>

<style scoped>
.panels-demo,
.panels {
	display: grid;
	gap: 16px;
}

.actions {
	display: flex;
	gap: 12px;
	flex-wrap: wrap;
}

.feedback {
	padding: 12px 16px;
	margin: 0;
	color: var(--vc-color-dark-lighter);
	background: var(--vc-background-color);
	border-radius: 8px;
}
</style>
```

```js panels.js
import { Portal } from '@deot/vc';
import PanelWrapper from './PanelWrapper.vue';

export const Panels = new Portal(PanelWrapper, {
	name: 'portal-panels',
	multiple: true,
	fragment: true,
	insertion: 'first',
	leaveDelay: 0
});
```

```vue PanelWrapper.vue
<template>
	<Card :title="'详情 ' + id">
		<p v-if="isActive" class="description">每个面板都有自己的展开状态，可独立确认或取消。</p>
		<div class="actions">
			<Button size="small" @click="handleToggle">切换内容 {{ id }}</Button>
			<Button type="primary" size="small" @click="handleConfirm">确认详情 {{ id }}</Button>
		</div>
	</Card>
</template>

<script setup>
import { ref } from 'vue';
import { Button, Card } from '@deot/vc';

const props = defineProps({ id: Number });
const emit = defineEmits(['portal-fulfilled']);
const isActive = ref(true);

const handleToggle = () => (isActive.value = !isActive.value);
const handleConfirm = () => emit('portal-fulfilled', props.id);
</script>

<style scoped>
.description {
	margin: 0 0 16px;
	line-height: 1.7;
	color: var(--vc-color-dark-lighter);
}

.actions {
	display: flex;
	gap: 12px;
	flex-wrap: wrap;
}
</style>
```
:::

### 活跃实例复用

`alive: true` 在同名实例仍存在时更新 props，并在下一次 Vue 更新后调用包装组件暴露的 `update(options)`。它不会在关闭后永久缓存组件：点击未匹配 `aliveRegExp` 的外部区域、发送结果事件或主动销毁，都会清理实例。

触发区域需匹配 `aliveRegExp`，否则再次点击触发按钮时可能先触发外部清理。下面保留输入的草稿，切换当前记录时通过计数观察复用；主动销毁或点击外部区域后重新打开，草稿和计数重置。

“打开活跃面板”返回等待销毁的 Promise，Button 在面板存在期间保持 loading，`onDestroyed` 触发后恢复。记录切换按钮只更新当前实例，不等待新的操作结果。每次复用都传入同一个销毁回调，确保复用后的主动销毁和外部清理都能结束打开按钮的等待。

:::playground
<!--
<config lang="json5">
{ entry: 'App.vue', views: ['runtime', 'files'], previewInset: 16 }
</config>
-->
```vue App.vue
<template>
	<div class="alive-demo">
		<div class="vc-portal-alive actions">
			<Button type="primary" :disabled="isActive" @click="handleOpen">打开活跃面板</Button>
			<Button :disabled="!isActive" @click="handleUpdate('记录 A')">查看记录 A</Button>
			<Button :disabled="!isActive" @click="handleUpdate('记录 B')">查看记录 B</Button>
			<Button :disabled="!isActive" @click="handleDestroy">销毁活跃面板</Button>
		</div>
		<p class="outside-area">点击此处清理活跃面板，然后重新打开观察草稿。</p>
		<div ref="target" />
	</div>
</template>

<script setup>
import { onUnmounted, ref } from 'vue';
import { Button } from '@deot/vc';
import { Preview } from './preview.js';

const target = ref();
const isActive = ref(false);
let onDestroyed;

const handleUpdate = (title) => {
	Preview.popup({ title }, { el: target.value, onDestroyed });
};
const handleOpen = () => new Promise((resolve) => {
	onDestroyed = () => {
		isActive.value = false;
		resolve();
	};
	isActive.value = true;
	handleUpdate('记录 A');
});
const handleDestroy = () => Preview.destroy();

onUnmounted(() => Preview.destroy());
</script>

<style scoped>
.alive-demo {
	display: grid;
	gap: 16px;
}

.actions {
	display: flex;
	gap: 12px;
	flex-wrap: wrap;
}

.outside-area {
	padding: 16px;
	margin: 0;
	color: var(--vc-color-dark-lighter);
	cursor: pointer;
	background: var(--vc-background-color);
	border: 1px dashed var(--vc-color-light-deepest);
	border-radius: 8px;
}
</style>
```

```js preview.js
import { Portal } from '@deot/vc';
import AliveWrapper from './AliveWrapper.vue';

export const Preview = new Portal(AliveWrapper, {
	name: 'portal-alive-preview',
	alive: true,
	aliveVisibleKey: 'isActive',
	fragment: true,
	leaveDelay: 0
});
```

```vue AliveWrapper.vue
<template>
	<Card v-if="isActive" :title="title">
		<p class="description">复用更新次数：{{ updates }}</p>
		<div class="field">
			<label for="preview-draft">本地草稿</label>
			<Input v-model="draft" input-id="preview-draft" placeholder="输入内容，再切换记录" clearable />
		</div>
	</Card>
</template>

<script setup>
import { ref } from 'vue';
import { Card, Input } from '@deot/vc';

defineProps({ title: String });
const isActive = ref(true);
const updates = ref(0);
const draft = ref('');

defineExpose({
	isActive,
	update: () => {
		isActive.value = true;
		updates.value++;
	}
});
</script>

<style scoped>
.description {
	margin: 0 0 16px;
	color: var(--vc-color-dark-lighter);
}

.field {
	display: grid;
	gap: 8px;
	max-width: 420px;
}
</style>
```
:::

### 注入应用依赖与插槽

Portal 创建独立 app，不自动继承调用页面的 `provide`、插件或全局组件。通过 `install(app)` 显式注入所需依赖，通过 `uses` 注册插件，通过 `components` 注册组件。项目可在 `VcInstance.configure({ Portal: { install } })` 中统一配置；单次调用的 `install` 会覆盖全局配置，不会自动串联。

下面通过 `app.provide` 注入一个响应式值，并通过 `slots` 传入可响应调用方变化的内容。打开按钮等待面板销毁，面板内关闭和调用方主动销毁都会结束 loading。`portal-destroyed` 本身不兑现 `popup()` 的结果，因此这里通过 `onDestroyed` 兑现单独的生命周期 Promise。

:::playground
<!--
<config lang="json5">
{ entry: 'App.vue', views: ['runtime', 'files'], previewInset: 16 }
</config>
-->
```vue App.vue
<template>
	<div class="context-demo">
		<Card title="工作区设置">
			<p class="description">修改工作区名称，观察面板中的注入值与插槽内容同步变化。</p>
			<div class="controls">
				<div class="field">
					<label for="workspace-name">当前工作区</label>
					<Input v-model="workspace" input-id="workspace-name" placeholder="请输入工作区名称" />
				</div>
				<Button type="primary" :disabled="isActive" @click="handleOpen">打开依赖面板</Button>
				<Button :disabled="!isActive" @click="handleDestroy">销毁依赖面板</Button>
			</div>
		</Card>
		<div ref="target" />
	</div>
</template>

<script setup>
import { h, onUnmounted, ref } from 'vue';
import { Button, Card, Input } from '@deot/vc';
import { ContextPanel } from './context-panel.js';

const target = ref();
const workspace = ref('演示工作区');
const isActive = ref(false);
const handleOpen = () => new Promise((resolve) => {
	isActive.value = true;
	ContextPanel.popup({
		el: target.value,
		install: app => app.provide('workspace', workspace),
		slots: { default: () => h('span', workspace.value) },
		onDestroyed: () => {
			isActive.value = false;
			resolve();
		}
	});
});
const handleDestroy = () => ContextPanel.destroy();

onUnmounted(() => ContextPanel.destroy());
</script>

<style scoped>
.context-demo {
	display: grid;
	gap: 16px;
}

.description {
	margin: 0 0 16px;
	line-height: 1.7;
	color: var(--vc-color-dark-lighter);
}

.controls {
	display: flex;
	gap: 12px;
	align-items: flex-end;
	flex-wrap: wrap;
}

.field {
	display: grid;
	flex: 1 1 240px;
	gap: 8px;
	max-width: 420px;
}
</style>
```

```js context-panel.js
import { Portal } from '@deot/vc';
import ContextWrapper from './ContextWrapper.vue';

export const ContextPanel = new Portal(ContextWrapper, {
	name: 'portal-context',
	leaveDelay: 0
});
```

```vue ContextWrapper.vue
<template>
	<Card title="依赖面板">
		<dl class="values">
			<div>
				<dt>注入值</dt>
				<dd>{{ workspace }}</dd>
			</div>
			<div>
				<dt>调用方插槽</dt>
				<dd><slot /></dd>
			</div>
		</dl>
		<Button @click="handleClose">关闭依赖面板</Button>
	</Card>
</template>

<script setup>
import { inject } from 'vue';
import { Button, Card } from '@deot/vc';

const workspace = inject('workspace');
const emit = defineEmits(['portal-destroyed']);
const handleClose = () => emit('portal-destroyed');
</script>

<style scoped>
.values {
	display: grid;
	gap: 12px;
	margin: 0 0 20px;
}

.values > div {
	display: flex;
	gap: 16px;
	flex-wrap: wrap;
}

.values dt {
	min-width: 84px;
	color: var(--vc-color-dark-extralight);
}

.values dd {
	margin: 0;
	overflow-wrap: anywhere;
}
</style>
```
:::

### 声明式传送内容

`PortalView` 的默认插槽仍留在原位置；只有 `content` 插槽被传送到 `body`。它不会创建独立 app，响应式状态与依赖注入仍来自原组件树。下面点击占位区域的按钮，在预览视口底部显示可交互的内容。

:::playground
<!--
<config lang="json5">
{ previewInset: 16 }
</config>
-->
```vue
<template>
	<div class="view-demo">
		<PortalView tag="section">
			<Card title="页面内容">
				<p class="description">这里是默认插槽，保留在页面原位置。</p>
				<div class="actions">
					<Button type="primary" @click="handleToggle">切换底部工具栏</Button>
					<span class="count">累计操作：{{ count }}</span>
				</div>
			</Card>
			<template #content>
				<div v-if="isActive" class="portal-toolbar">
					<div class="toolbar-copy">
						<strong>快捷操作</strong>
						<span>这里来自 content 插槽</span>
					</div>
					<div class="actions">
						<Button type="primary" @click="handleExecute">执行一次</Button>
						<Button @click="handleClose">收起工具栏</Button>
					</div>
				</div>
			</template>
		</PortalView>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, Card, PortalView } from '@deot/vc';

const isActive = ref(false);
const count = ref(0);

const handleToggle = () => (isActive.value = !isActive.value);
const handleExecute = () => count.value++;
const handleClose = () => (isActive.value = false);
</script>

<style scoped>
.view-demo {
	min-height: 340px;
}

.description {
	margin: 0 0 16px;
	line-height: 1.7;
	color: var(--vc-color-dark-lighter);
}

.actions {
	display: flex;
	gap: 12px;
	align-items: center;
	flex-wrap: wrap;
}

.count {
	color: var(--vc-color-dark-extralight);
}

.toolbar-copy {
	display: grid;
	gap: 4px;
}

.toolbar-copy span {
	font-size: 12px;
	color: var(--vc-color-dark-lighter);
}

.portal-toolbar {
	position: fixed;
	right: 16px;
	bottom: 16px;
	left: 16px;
	display: flex;
	gap: 16px;
	align-items: center;
	justify-content: space-between;
	flex-wrap: wrap;
	padding: 16px;
	color: var(--vc-foreground-color);
	background: var(--vc-background-color-light);
	border: 1px solid var(--vc-color-light-deeper);
	border-radius: 12px;
	box-shadow: var(--vc-border-shadow);
}
</style>
```
:::

## API

### Portal 构造参数

`new Portal(wrapper, options?)` 返回可重复调用的服务实例。配置按内置默认值、`VcInstance.options.Portal`、构造配置、本次调用配置的顺序浅合并。

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| wrapper | 包装组件，负责 UI、校验和结果事件 | `Component` | - | - |
| options | 构造级配置，字段见下表 | `object` | - | - |

### Portal 配置

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| propsData | 显式传给包装组件的 props | `Record<string, any>` | - | - |
| name | 实例注册标识；不同服务建议显式区分，避免重名替换 | `string` | - | 构造配置的 name、wrapper.name 或自动生成值 |
| el | 已存在的挂载目标；未找到时不会插入页面 | `string \| HTMLElement` | - | `'body'` |
| tag | 内部挂载容器标签；默认通常仅将其元素子节点移入目标 | `string` | - | `'div'` |
| fragment | 保留挂载容器，适合多根节点及根节点的条件变化 | `boolean` | - | `false` |
| insertion | 插入目标首个元素之前或末尾 | `string` | `first` / `last` | `'last'` |
| multiple | 每次生成独立标识，允许多实例共存 | `boolean` | - | `false` |
| leaveDelay | resolve/reject 后延迟销毁的时间，单位 ms；直接 destroy 不延迟 | `number` | - | `300` |
| autoDestroy | 是否允许无强制参数的 `Portal.clear()` 清理；不影响结果事件的自动销毁 | `boolean` | - | `true` |
| alive | 同名活跃实例再次调用时复用并更新 props | `boolean` | - | `false` |
| aliveRegExp | alive 模式下，点击路径匹配这些属性时不执行外部清理 | `{ className?: RegExp; id?: RegExp }` | - | `{ className: /(vc-portal-alive)/ }` |
| aliveVisibleKey | 外部清理前操作的暴露字段：函数则传入 false，否则赋值 false | `string` | - | `'isVisible'` |
| aliveUpdateKey | alive 复用后调用的暴露方法名，接收本次完整 options | `string` | - | `'update'` |
| slots | 传给包装组件的插槽，通常使用插槽函数对象 | `VNodeNormalizedChildren` | - | - |
| components | 在独立 app 中注册的组件 | `Record<string, Component>` | - | `{}` |
| uses | 在独立 app 中注册的插件 | `Record<string, Plugin>` | - | `{}` |
| globalProperties | 赋给独立 app 的 `app.config.globalProperties` | `Record<string, any>` | - | - |
| install | 完成组件、插件注册后，挂载之前调用 | `(app: App) => any` | - | - |
| parent | 兼容字段：作为根组件选项传入；当前 Vue 3 实现不会因此继承调用方上下文 | `object` | - | - |
| onBeforeCreate | 渲染包装组件前准备额外 props；返回值覆盖同名原始 props | `(propsData?: Record<string, any>) => Record<string, any> \| Promise<Record<string, any>>` | - | - |
| onFulfilled | 结果成功回调，随后兑现 Promise | `(value?: any) => any` | - | - |
| onRejected | 结果取消/失败回调，随后拒绝 Promise | `(reason?: any) => any` | - | - |
| onDestroyed | 清理开始时调用；准备 Promise 拒绝时接收错误；不等于操作结果 | `(...args: any[]) => any` | - | - |

### Portal 方法

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| popup | 创建/复用包装组件，返回可等待的句柄 | `options?` 或 `propsData, options` | PortalLeaf 句柄 |
| destroy | 销毁指定句柄或注册标识；无参数时清理该服务默认标识，构造配置 multiple=true 时也可清理该组 | `target?: string \| PortalLeaf` | `void` |
| Portal.clear | 无参数/false 仅清理 autoDestroy=true 的节点；true 强制全部清理；字符串或数组强制清理精确标识 | `name?: string \| string[] \| boolean` | `void` |
| Portal.clearAll | 强制清理全部 Portal 节点 | - | `void` |

`popup()` 的参数解析有两种形式：

```text
// 一个参数：既是配置，也是隐式 props 的来源。
Viewer.popup({ title: '详情', leaveDelay: 300 });

// 显式 propsData：其余非配置字段不会再混入组件 props。
Viewer.popup({ propsData: { name: '业务名称' }, name: 'portal-detail' });

// 两个参数：第一个只作为组件 props，第二个作为 Portal 配置。
Viewer.popup({ name: '业务名称', title: '详情' }, { name: 'portal-detail' });
```

当业务字段也叫 `name`、`el`、`slots` 等配置名时，使用显式 `propsData` 或双参数形式，避免被当作 Portal 配置。`popup(propsData, options)` 会把 propsData 写入传入的 options 对象，建议每次传入新对象。

`Portal.leafs` 是静态的 `Map<string, PortalLeaf>`，记录当前所有 Portal 节点。`multiple` 模式下注册标识附带自动生成后缀；精确关闭优先保存 leaf，避免依赖后缀格式。临时覆盖 `name` 或 `multiple` 后，也优先调用 `leaf.destroy()`。

### 包装组件事件

这些是包装组件向 Portal 发送的协议事件，不是 `PortalView` 的事件。

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| portal-fulfilled | 兑现结果，并按 leaveDelay 清理 | `value?: any` | 传给 onFulfilled 与 Promise 的结果 |
| portal-rejected | 拒绝结果，并按 leaveDelay 清理 | `reason?: any` | 传给 onRejected 与 Promise 的原因 |
| portal-destroyed | 立即清理，不改变 Promise 状态 | `...args: any[]` | 传给 onDestroyed |

### PortalLeaf 句柄

句柄支持 `await`，但本身不是原生 Promise。此处的 `PortalLeaf` 是返回值名称，不是 `@deot/vc` 提供的独立导出。

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| then | 订阅结果 | `onFulfilled, onRejected?` | `Promise` |
| catch | 订阅拒绝 | `onRejected?` | `Promise` |
| finally | 在结果兑现或拒绝后执行 | `callback?` | `Promise` |
| resolve | 主动兑现结果，并按 leaveDelay 清理 | `value?: any` | `void` |
| reject | 主动拒绝结果，并按 leaveDelay 清理 | `reason?: any` | `void` |
| destroy | 立即清理，不兑现也不拒绝结果 | `...args: any[]` | `void` |

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| target | 当前结果 Promise | `Promise<any>` | - | 创建时生成 |
| wrapper | 包装组件实例，可访问 defineExpose 的内容；异步准备完成前可能不存在 | `ComponentPublicInstance \| undefined` | - | - |
| app | 独立的 Vue app | `App \| undefined` | - | 创建时设置 |
| propsData | 传给包装组件的基础 props 引用；不包含 onBeforeCreate 的额外结果 | `Ref<Record<string, any>> \| undefined` | - | 创建时设置 |
| autoDestroy | 当前 clear 策略的标记 | `boolean` | - | 由调用配置决定 |

### PortalView 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| tag | 默认插槽在原位置的包裹标签，带有 vc-portal-view class | `string` | - | `'div'` |

### PortalView 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 留在原位置的占位内容 | - |
| content | 通过 Teleport 传送到 body 的内容 | - |

### 生命周期与使用边界

- 结果与清理是两件事。`leaveDelay > 0` 时，`await popup()` 可先结束，节点稍后销毁；需要处理清理状态时使用 `onDestroyed`。
- `destroy()`、同名替换、`Portal.clear()`、`portal-destroyed`、alive 外部点击以及准备 Promise 拒绝，都不会自动结束尚在等待的结果 Promise。需要取消结果时调用 `leaf.reject(reason)`，并处理拒绝。
- `alive` 复用会替换句柄上的 `target`。不要把多次复用视作相互独立的请求；旧的等待者不会自动取消。需要分别返回结果的业务弹窗，使用默认模式或 `multiple`。
- `multiple` 会生成不同标识，因此不能同时期待它按同一个标识复用 `alive` 实例。
- 页面卸载时清理自己持有的服务或 leaf。全局 `clear/clearAll` 会影响其他 Portal 服务，应只用于明确的全局清理场景。
- 命令式 `popup()` 直接使用 `document`，应在浏览器挂载完成后或事件回调中调用。Portal 不负责 SSR 渲染。
- Portal 不提供主题色与默认操作文案。Modal/Drawer 等包装组件负责自身 locale/theme；传送至 body 的内容不会继承原局部 DOM 祖先上的 CSS 变量，需要在实际挂载祖先或内容自身设置。
