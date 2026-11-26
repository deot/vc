## 上传（Upload）

选择或拖拽文件，通过 XHR 上传，支持异步预处理、串并行调度和任务浮层。

移动端入口导出的 `MUpload` 与 `Upload` 是同一实现，属性、事件和方法相同，只是错误与加载提示改用 `MToast`。

### 何时使用

需要自定义上传触发器、请求参数或响应转换时使用。组件默认不渲染文件列表，可以通过生命周期事件维护业务界面。

### 基础用法

点击选择或拖入文件，`max` 限制每次最多 3 个。此示例不发送网络请求：`request` 清除上传地址，`response` 返回本地文件信息，批次结束时触发 `complete`。接入服务时设置 `url`，并移除示例中的这两个 Hook。

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
	<div class="upload-demo">
		<Upload :max="3" @request="handleRequest" @response="handleResponse" @complete="handleComplete">
			<Button>选择文件（也可拖入）</Button>
		</Upload>
		<p class="upload-demo__result">{{ summary }}</p>
		<ul class="upload-demo__list">
			<li v-for="(name, index) in names" :key="index">{{ name }}</li>
		</ul>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Upload, Button } from '@deot/vc';

const names = ref([]);
const summary = ref('等待选择文件');

const handleRequest = ({ requestOptions }) => ({ ...requestOptions, url: undefined });
const handleResponse = ({ requestOptions }) => requestOptions.file.name;

const handleComplete = ({ result }) => {
	names.value = result.responses;
	summary.value = `已完成 ${result.completed} 个，成功 ${result.succeeded} 个`;
};
</script>

<style scoped>
.upload-demo {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 16px;
}

.upload-demo__result {
	margin: 0;
}

.upload-demo__list {
	margin: 0;
	padding-left: 20px;
}
</style>
```
:::

### 串行预处理与任务浮层

下面用三个本地文件演示串行处理（`parallel` 为 `false`），`showTask` 展示任务浮层，组件 ref 的 `uploadFiles` 直接启动一批上传。第二个文件被 `file-before` 返回的 `false` 取消，计入失败，但不触发 `file-error`。延迟发生在预处理阶段，用于观察等待状态；真实上传百分比由 XHR 的 progress 事件提供。

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
	<div class="upload-demo">
		<Upload
			ref="upload"
			:max="3"
			:parallel="false"
			show-task
			@request="handleRequest"
			@response="handleResponse"
			@file-before="handleFileBefore"
			@complete="handleComplete"
		/>
		<Button :disabled="isRunning" @click="handleStart">运行串行示例</Button>
		<p class="upload-demo__result">{{ summary }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Upload, Button } from '@deot/vc';

const upload = ref();
const isRunning = ref(false);
const summary = ref('预期：2 个成功，1 个取消');

const handleRequest = ({ requestOptions }) => ({ ...requestOptions, url: undefined });
const handleResponse = ({ requestOptions }) => ({ name: requestOptions.file.name });

const handleFileBefore = async ({ file }) => {
	await new Promise(resolve => setTimeout(resolve, 700));
	return file.name === 'skip.txt' ? false : file;
};

const handleStart = () => {
	isRunning.value = true;
	summary.value = '处理中，可在右下角查看任务';
	upload.value.uploadFiles(['first.txt', 'skip.txt', 'last.txt'].map(name => new File(['demo'], name)));
};

const handleComplete = ({ result }) => {
	isRunning.value = false;
	summary.value = `成功 ${result.succeeded}，失败 ${result.failed}，总数 ${result.total}`;
};
</script>

<style scoped>
.upload-demo {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 16px;
}

.upload-demo__result {
	margin: 0;
}
</style>
```
:::

多个 Upload 共用一个任务浮层，但分别保存自己的任务记录。关闭 `showTask` 或卸载组件只移除自身记录；关闭浮层不会取消上传。任务视图属于内部能力，没有公开 `Upload.Task` 或 `UploadTask` API。

### 限制、请求参数与生命周期事件

`accept` 过滤文件类型，`size` 限制单文件大小（MB），`directory` 改为选择文件夹，`disabled` 禁用点击与拖拽；`name`、`body`、`headers` 组成请求参数，可在 `request` 中看到。`enhancer` 返回 `true` 时跳过原生选择器（下例改为直接生成文件），实例方法 `click` 则直接打开原生选择器；`tag` 设置外层标签。

一批文件依次触发 `begin`、`file-start`，之后是 `file-success` 或 `file-error`。下例的第二个文件超过 `size`，触发 `file-error`；`message` 可以改写错误文案，`error` 收到处理后的错误，`showError` 为 `false` 时不弹出提示。`file-progress` 只在真实 XHR 上传时触发。

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
	<div class="upload-demo">
		<div class="upload-demo__row">
			<Upload
				ref="upload"
				tag="div"
				:max="3"
				:size="0.001"
				:disabled="isDisabled"
				:directory="isDirectory"
				:enhancer="handleEnhancer"
				:show-error="false"
				accept=".txt,text/plain"
				name="attachment"
				:body="{ scene: 'demo' }"
				:headers="{ 'X-Demo': '1' }"
				@request="handleRequest"
				@response="handleResponse"
				@begin="handleBegin"
				@file-start="handleFileStart"
				@file-progress="handleFileProgress"
				@file-success="handleFileSuccess"
				@file-error="handleFileError"
				@message="handleMessage"
				@error="handleError"
			>
				<Button :disabled="isDisabled">生成两个文件（enhancer）</Button>
			</Upload>
			<Button :disabled="isDisabled" @click="handleClick">打开原生选择器（click）</Button>
		</div>
		<div class="upload-demo__row">
			<Checkbox v-model="isDisabled">disabled</Checkbox>
			<Checkbox v-model="isDirectory">directory</Checkbox>
		</div>
		<p class="upload-demo__result">{{ request }}</p>
		<ul class="upload-demo__list">
			<li v-for="(item, index) in events" :key="index">{{ item }}</li>
		</ul>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Upload, Button, Checkbox } from '@deot/vc';

const upload = ref();
const isDisabled = ref(false);
const isDirectory = ref(false);
const request = ref('request：-');
const events = ref([]);

const record = (text) => {
	events.value = [...events.value, text].slice(-6);
};

const handleEnhancer = () => {
	events.value = [];
	upload.value.uploadFiles([
		new File(['demo'], 'small.txt', { type: 'text/plain' }),
		new File(['x'.repeat(2048)], 'large.txt', { type: 'text/plain' })
	]);
	return true;
};

const handleClick = () => {
	upload.value.click();
};

const handleRequest = ({ requestOptions }) => {
	const { headers, body } = requestOptions;
	request.value = `request：headers ${JSON.stringify(headers)}，body ${JSON.stringify(body)}`;
	return { ...requestOptions, url: undefined };
};

const handleResponse = ({ requestOptions }) => requestOptions.file.name;
const handleBegin = ({ files }) => record(`begin：${files.length} 个文件`);
const handleFileStart = ({ file }) => record(`file-start：${file.name}`);
const handleFileProgress = ({ progress, file }) => record(`file-progress：${file.name} ${progress.percent}%`);
const handleFileSuccess = ({ file }) => record(`file-success：${file.name}`);
const handleFileError = ({ file, message }) => record(`file-error：${file.name}，${message}`);
const handleMessage = ({ message }) => `已改写：${message}`;
const handleError = ({ cause }) => record(`error：${cause.message}`);
</script>

<style scoped>
.upload-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.upload-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}

.upload-demo__result {
	margin: 0;
	overflow-wrap: anywhere;
}

.upload-demo__list {
	margin: 0;
	padding-left: 20px;
}
</style>
```
:::

### 编程式调用与移动端

`Upload.open()` 和 `MUpload.open()` 返回可等待的 Portal leaf。默认自动打开原生选择器；`silent: true` 可通过 `leaf.wrapper?.uploadFiles(files)` 启动。下面直接生成本地文件，演示移动端调用、`showLoading` 的加载提示及结果结算。

:::playground
<!--
<config lang="json5">
{
	mobile: true,
	local: false,
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
	<div class="m-upload-demo">
		<MButton type="primary" :disabled="isRunning" @click="handleOpen">运行 MUpload.open</MButton>
		<p class="m-upload-demo__result">{{ summary }}</p>
	</div>
</template>

<script setup>
import { ref, onBeforeUnmount } from 'vue';
import { MUpload, MButton } from '@deot/vc';

const isRunning = ref(false);
const summary = ref('本地模拟，无需上传接口');
let leaf;

const handleOpen = async () => {
	isRunning.value = true;
	leaf = MUpload.open({
		silent: true,
		showLoading: true,
		onRequest: ({ requestOptions }) => ({ ...requestOptions, url: undefined }),
		onResponse: async ({ requestOptions }) => {
			await new Promise(resolve => setTimeout(resolve, 600));
			return requestOptions.file.name;
		}
	});
	leaf.wrapper?.uploadFiles([new File(['demo'], 'mobile.txt')]);
	try {
		const result = await leaf;
		summary.value = `成功 ${result.succeeded}：${result.responses.join(', ')}`;
	} catch (result) {
		summary.value = `失败 ${result.failed}`;
	} finally {
		isRunning.value = false;
	}
};

onBeforeUnmount(() => leaf?.destroy());
</script>

<style scoped>
.m-upload-demo {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: calc(var(--vc-rem) * 32);
	padding-inline: calc(var(--vc-rem) * 32);
}

.m-upload-demo__result {
	margin: 0;
	overflow-wrap: anywhere;
}
</style>
```
:::

`Upload` 使用 `Message.error/loading`；`MUpload` 使用 `MToast.info/loading`。二者的编程式 Portal 相互独立。

## 主题与局部覆盖

全局参数通过 `--vc-<参数>` 配置，单个组件通过 `--vc-upload-task-<参数>` 覆盖。同一参数可能作用于多个状态；多命名空间时在使用位置中标明。

这些入口属于 upload-task 任务浮层；变量应作用于实际浮层或其祖先。任务结果区域文字使用可覆盖的 color-contrast-light。⚠ color-mix：任务进度浅底由 color-primary-light 与透明色混合，颜色占 8%；不支持时使用 color-primary-lighter。

### 全局

| 参数 | 使用位置 | 值 |
| --- | --- | --- |
| color-contrast-light | 任务结果区域文字（upload-task） | `#FFFFFF`（亮暗主题相同） |
| color-dark | 上传任务浮层文字 | 亮色：`#000000`；暗色：`#FFFFFF` |
| color-dark-lighter | 任务列表列文字 | 亮色：`#515151`；暗色：`#D9D9D9` |
| color-error | 上传失败状态 | `#F53F3F` |
| color-neutral-light | 任务标题及列表分隔线 | 亮色：`#EDEFF1`；暗色：`#3B4354` |
| color-primary | 任务结果区域背景 | `#456CF6` |
| color-primary-light | 任务进度浅底派生 | `#4A96FF` |
| color-primary-lighter | 任务进度浅底降级色 | `rgba(45, 140, 240, 0.2)` |
| color-success | 上传成功状态 | `#1DB88C` |
| background-color-lightest | 上传任务浮层背景 | 亮色：`#FFFFFF`；暗色：`#252B3A` |
| box-shadow | 上传任务浮层阴影 | 亮色：`0 0 8px 0 rgba(0, 0, 0, 0.1)`；暗色：`0 0 8px 0 rgba(255, 255, 255, 0.05)` |

### 局部

当前组件没有额外的局部 CSS 主题参数。

## API

### 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| tag | 外层标签或组件 | `string \| object` | - | `'span'` |
| disabled | 禁用触发器点击与拖拽；不拦截实例方法 | `boolean` | - | `false` |
| max | 每次经过 accept 过滤后允许的文件数；大于 1 时开启多选 | `number` | - | `1` |
| accept | 文件扩展名或 MIME 类型，逗号分隔；无 MIME 的文件不做二次过滤 | `string` | - | - |
| size | 单文件大小上限，单位 MB；0 不限制，预处理后校验 | `number` | - | `0` |
| name | FormData 文件字段名；空值使用全局 Upload.name 或 'file' | `string` | - | `''` |
| url | POST 上传地址；缺省时跳过 XHR，直接调用 response Hook | `string` | - | - |
| body | FormData 附加字段，非 Blob 值转换为字符串 | `Record<string, unknown>` | - | `{}` |
| headers | 请求头 | `Record<string, string>` | - | `{}` |
| showTask | 展示共享任务浮层 | `boolean` | - | `false` |
| directory | 使用浏览器文件夹选择能力，仍受 max 限制 | `boolean` | - | `false` |
| enhancer | 选择器增强器；同步 true 跳过原生选择器，Promise 返回 undefined 也跳过 | `(data: { instance: ComponentInternalInstance }) => boolean \| void \| Promise<boolean \| void>` | - | - |
| parallel | 并行上传；false 为串行，每批开始时固定 | `boolean` | - | `true` |
| showError | 展示组件错误反馈；不影响 error 事件 | `boolean` | - | `true` |
| showLoading | 每批创建 Loading，完成或卸载时关闭 | `boolean` | - | `false` |

### 事件

所有监听器接收一个对象。模板使用下表事件名，JSX、全局配置及 open 使用对应的 `onXxx` 名称，例如 `file-before` 对应 `onFileBefore`。

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| message | 返回自定义错误文案，支持 Promise；空字符串是有效覆盖 | `{ cause, message }` | cause 为原始错误对象，message 为内置提示 |
| error | 上传或选择校验错误 | `{ cause }` | cause.message 为处理后的提示 |
| begin | 每批文件开始 | `{ rawFiles, files }` | 原生 File 数组及规范化文件快照 |
| request | 返回完整请求参数或 void，支持 Promise | `{ requestOptions, instance }` | instance 为 Vue ComponentInternalInstance |
| response | 返回转换后的响应，支持 Promise | `{ request, requestOptions }` | request 为 XMLHttpRequest 或 undefined |
| file-before | 预处理；可返回 false、void、Blob、部分文件信息或其 Promise | `{ file, rawFiles }` | false 或抛错计入失败，仅更新任务状态，不触发 file-error |
| file-start | 预处理与大小校验通过，请求 Hook 执行前 | `{ file }` | 当前规范化文件 |
| file-progress | XHR 上传进度 | `{ progress, file }` | progress 含 progress（0–1）、percent（0–100）与原始 ProgressEvent target |
| file-success | 单文件成功 | `{ response, file, result }` | result 已计入当前成功 |
| file-error | 单文件上传阶段失败 | `{ stage, cause, message, file, result }` | 对外 stage 为 'upload'，result 已计入当前失败 |
| complete | 当前批次全部结算 | `{ result }` | 当前批次最终结果 |

`message`、`request`、`response`、`file-before` 是直接调用监听器的返回值 Hook，其余事件通过 Vue emit 派发。`VcInstance.configure({ Upload: { name, enhancer, onMessage, onRequest, onResponse } })` 可配置默认行为；组件对应配置优先。`onFileBefore` 不读取全局配置。

`requestOptions` 包含 `url?: string`、`headers: Record<string, string>`、`body: Record<string, unknown>`、`timeout: number | null`（毫秒）和 `file: File`。返回替代对象时需保留所需字段。`response` 未返回值时默认解析 XHR 响应为 JSON，解析失败则保留原始文本。

### 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 自定义上传触发器 | - |

### 方法

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| uploadFiles | 通过组件 ref 启动一批上传 | `FileList \| File[]` | `void` |
| click | 直接触发原生 input，不经过 enhancer | - | `void` |
| Upload.open / MUpload.open | 编程式上传；options 接受上述属性、onXxx 回调及 silent | `options` | 可等待的 Portal leaf |

`silent` 默认为 `false`。至少一个文件成功时 leaf resolve，全部失败时 reject，值都是当前批次结果。未选择文件、选择校验失败，或结算前销毁/替换 Portal 时，Promise 保持 pending。销毁组件会取消仍在进行的请求。leaf 的通用 TypeScript 类型不会收窄 `wrapper.uploadFiles/click`，组件入口也不额外导出 Upload 内部类型。

### 文件与批次结果

以下结构用于说明回调数据，不是入口的命名类型导出。

```ts
interface UploadFile {
	uploadId: string;
	current: number;
	total: number;
	percent: number;
	size: number;
	name: string;
	target: File;
}

interface UploadCycleResult {
	total: number;
	completed: number;
	succeeded: number;
	failed: number;
	responses: unknown[];
	queues: Array<() => void>;
}
```

`current` 从 1 开始，size 为字节数。`file-before` 返回的部分文件信息可包含 Blob 类型的 target，组件会补全为 File；uploadId/current/total 始终保留原批次标识。

每次选择创建独立批次，允许重叠上传。`total` 固定，`completed === succeeded + failed`；`responses` 只记录成功响应，按实际结算顺序排列。`queues` 是当前调度队列的快照（串行模式逐个移出），函数只能执行一次，通常无需调用。`begin` 提供数组和文件元数据快照，修改它们不会改变内部调度集合。

### 语言与主题

内置提示使用 `vc.Upload` 语言数据。任务标题、列名、等待/上传状态与统计随 locale 切换；错误消息和 Loading 在产生时使用当前语言，业务提供的消息保留原值。

浮层使用 `upload-task` CSS namespace，可通过 `--vc-upload-task-<参数>` 覆盖：`color-dark`（文字）、`color-dark-lighter`（列名）、`color-neutral-light`（分隔线）、`color-primary`（结果栏背景）、`color-contrast-light`（结果栏文字）、`color-primary-light`（进度条，按 8% 混合；浏览器不支持 `color-mix` 时改用 `color-primary-lighter`）、`color-success` / `color-error`（成功 / 失败状态）、`background-color-lightest`（浮层背景）和 `box-shadow`（浮层阴影）；未覆盖时回退到同名全局变量 `--vc-<参数>`。浮层挂载在 Portal 中，变量应设在根节点或其他能覆盖浮层的祖先上。

### 旧版迁移

旧的位置参数回调改为上文的对象参数；`result.success/error` 改为 `succeeded/failed`。`slient` 改为 `silent`，`show-task-manager` 改为 `show-task`，`showMessage/showToast` 改为 `showError`。不再提供 `mode`、`Upload.Task` 或 TaskManager 编程接口；需要自定义任务视图时使用公开上传事件。
