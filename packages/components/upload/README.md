## 上传（Upload）

选择文件并通过 XHR 上传，也支持拖拽、异步文件预处理、串并行调度、周期结果统计和共享任务浮层。

### 基础用法

```vue
<template>
	<Upload
		url="/api/upload"
		:max="5"
		accept="image/*"
		show-task
		@file-progress="handleProgress"
		@file-success="handleSuccess"
		@file-error="handleFileError"
		@complete="handleComplete"
	>
		<Button>上传图片</Button>
	</Upload>
</template>

<script setup>
import { Upload, Button } from '@deot/vc';

const handleProgress = ({ progress, file }) => {
	console.log(file.name, progress.percent);
};

const handleSuccess = ({ response, file, result }) => {
	console.log(file.name, response, result.succeeded);
};

const handleFileError = ({ cause, message, file, result }) => {
	console.error(file.name, message, cause, result.failed);
};

const handleComplete = ({ result }) => {
	console.log(result);
};
</script>
```

### 请求与文件预处理

`message`、`request`、`response` 和 `file-before` 是带返回值的 Hook。它们同样只接收一个对象参数，但由 Upload 直接调用，不依赖 Vue `emit` 收集返回值。

```ts
import { VcInstance } from '@deot/vc';

VcInstance.configure({
	Upload: {
		onRequest: ({ requestOptions, instance }) => ({
			...requestOptions,
			url: '/api/upload',
			headers: {
				...requestOptions.headers,
				Authorization: 'Bearer token'
			}
		}),
		onResponse: ({ request, requestOptions }) => {
			if (!request) return;
			return {
				fileName: requestOptions.file.name,
				response: JSON.parse(request.responseText)
			};
		},
		onMessage: ({ cause, message }) => cause.message || message
	}
});
```

```vue
<Upload
	@file-before="({ file, rawFiles }) => {
		if (rawFiles.length > 5) return false;
		return { ...file, name: `processed-${file.name}` };
	}"
>
	<Button>预处理后上传</Button>
</Upload>
```

`file-before` 可以返回 `false`、`Blob`、完整或部分 `UploadFile`，也可以返回这些值的 Promise。返回 `false` 或抛错会作为 `preflight` 失败计入周期及任务浮层，但不会对外派发 `file-error`。

### Upload.open

```ts
import { Upload } from '@deot/vc';

const result = await Upload.open({
	silent: false,
	max: 2,
	url: '/api/upload',
	onFileBefore: ({ file }) => file
});

console.log(result.completed, result.succeeded, result.failed);
```

- `silent: false` 时自动打开原生文件选择器。
- `silent: true` 时可通过 `leaf.wrapper?.uploadFiles(rawFiles)` 主动上传。
- 全部文件失败时 Promise reject；至少一个文件成功时 resolve。
- Portal 被替换或主动销毁且周期尚未结算时，请求会随组件卸载取消，但 Promise 遵循既有 Portal 语义并保持 pending。

`MUpload.open()` 的参数和结算规则与 `Upload.open()` 相同，但使用独立的移动端
Portal；错误反馈与 Loading 分别由 `MToast.info`、`MToast.loading` 展示。

### 上传任务

设置 `show-task` 后，任务浮层会同步等待、进度、成功、失败和周期结果。多个 Upload
共享一个浮层，但各自保存任务快照，只移除自己创建的记录。

```vue
<Upload url="/api/upload" :max="5" show-task>
	<Button>上传多个文件</Button>
</Upload>
```

Task 仅用于 Upload 内部同步，不提供 `Upload.Task`、`UploadTask` 或任务视图操作接口。

- 动态关闭 `show-task` 或卸载组件时，只移除当前 Upload 创建的任务。
- 多个 Upload 会复用内部浮层，但分别保存和恢复自己的任务快照。
- 需要自定义任务界面时，使用 `begin`、`file-progress`、`file-success`、
  `file-error` 与 `complete` 等公开事件维护业务状态。

## API

### 属性

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| tag | 外层标签 | `string \| object` | `span` |
| disabled | 是否禁用选择与拖拽 | `boolean` | `false` |
| max | 一次最多选择的文件数 | `number` | `1` |
| accept | 原生文件类型限制 | `string` | - |
| size | 单个文件大小限制，单位 MB | `number` | `0` |
| name | FormData 文件字段名 | `string` | 全局配置或 `file` |
| url | 上传地址；未设置时直接进入响应处理 | `string` | - |
| body | FormData 额外字段 | `Record<string, unknown>` | `{}` |
| headers | 请求头 | `Record<string, string>` | `{}` |
| show-task | 是否展示任务浮层 | `boolean` | `false` |
| directory | 是否选择文件夹 | `boolean` | `false` |
| enhancer | 原生选择器增强器 | `(instance) => boolean \| void \| Promise` | - |
| parallel | 是否并行上传 | `boolean` | `true` |
| show-error | 是否展示上传错误；Upload 使用 Message，MUpload 使用 MToast | `boolean` | `true` |
| show-loading | 是否展示周期 Loading；根据 Upload/MUpload 选择对应反馈组件 | `boolean` | `false` |

### 回调与事件

所有回调都只接收一个对象参数。事件名仍使用 kebab-case，JSX/配置使用对应的 `onXxx` 名称。

| 事件 | 对象 payload | 返回值 |
| --- | --- | --- |
| message | `{ cause, message }` | `string \| void \| Promise` |
| error | `{ cause }` | `void` |
| begin | `{ rawFiles, files }` | `void` |
| request | `{ requestOptions, instance }` | `UploadRequestOptions \| void \| Promise` |
| response | `{ request, requestOptions }` | `unknown \| Promise<unknown>` |
| file-before | `{ file, rawFiles }` | `false \| void \| Blob \| Partial<UploadFile> \| Promise` |
| file-start | `{ file }` | `void` |
| file-progress | `{ progress, file }` | `void` |
| file-success | `{ response, file, result }` | `void` |
| file-error | `{ stage, cause, message, file, result }` | `void` |
| complete | `{ result }` | `void` |

`instance` 只在 `request` 中提供，类型为 Vue `ComponentInternalInstance`。其他生命周期不暴露 Vue 内部实例。
`begin` 中的数组和 `UploadFile` 元数据为周期创建快照；修改该 payload 不会改变内部调度或 Task 标识。

### UploadCycleResult

```ts
interface UploadCycleResult {
	total: number;
	completed: number;
	succeeded: number;
	failed: number;
	responses: unknown[];
	queues: Array<() => void>;
}
```

- `total` 在周期创建时固定。
- `completed === succeeded + failed`。
- `file-success` 与 `file-error` 中的 `result` 已包含当前文件的结算。
- `responses` 只保存成功响应，顺序为文件实际结算顺序。
- `queues` 保留周期的串并行调度快照；其中的调度函数为 one-shot，重复调用不会重复处理或发送同一文件。

### 类型与出口

当前 Upload 入口公开 `Upload`，并在其上挂载 `open`。`Upload.open()` 返回
通用 Portal leaf；当前没有额外的 `UploadOpenInstance` 包装类型，也没有在入口命名
导出 Upload 或 Task 的内部类型。`wrapper.uploadFiles()`、`wrapper.click()` 等方法在
运行时可用，但 leaf 的通用类型不会进一步收窄这些方法。

源码中的 `UploadProps` 只描述真实运行时属性，不包含 `onMessage`、`onComplete`
等监听器。事件监听器由 Vue `emits`/VNode listeners 接收；`Upload.open()` 的 options
则同时接受运行时属性与上传回调。不要从组件 `setup` 的 props 中读取监听器，也
不要依赖它们出现在 DevTools 的 props 中。

## 迁移指南

本版本直接替换旧 Upload API，不提供位置参数、`mode`、`slient`、
`show-task-manager` 或 Task 编程接口兼容层。建议按“事件参数 → 周期结果 →
`Upload.open` → `show-task`”的顺序迁移。

### 平台反馈属性

| 旧属性 | 新属性 |
| --- | --- |
| `Upload.showMessage` | `Upload.showError` |
| `Upload.showToast` | 删除 |
| `MUpload.showMessage` / `MUpload.showToast` | `MUpload.showError` |
| `UploadPicker.showMessage` | `UploadPicker.showError` |
| `MUploadPicker.showMessage` / `MUploadPicker.showToast` | `MUploadPicker.showError` |

`showError` 只表达是否展示错误，不再选择反馈组件。`Upload` 固定使用
`Message.error`，`MUpload` 固定使用 `MToast.info`；`showLoading` 同理分别使用
`Message.loading` 和 `MToast.loading`。旧属性不会继续生效，也不会产生兼容警告。

### 1. 回调统一为对象参数

Vue 模板事件名仍使用 kebab-case，JSX、全局配置和 `Upload.open()` 使用对应的
`onXxx` 名称；变化的是回调参数，不是事件名。

| 旧写法 | 新写法 |
| --- | --- |
| `onMessage(error, internalMessage)` | `onMessage({ cause, message })` |
| `onError(error)` | `onError({ cause })` |
| `onBegin(fileList)` | `onBegin({ rawFiles, files })` |
| `onRequest(options, instance)` | `onRequest({ requestOptions, instance })` |
| `onResponse(request, options)` | `onResponse({ request, requestOptions })` |
| `onFileBefore(file, fileList)` | `onFileBefore({ file, rawFiles })` |
| `onFileStart(file, mode)` | `onFileStart({ file })` |
| `onFileProgress(progress, file, mode)` | `onFileProgress({ progress, file })` |
| `onFileSuccess(response, file, info, mode)` | `onFileSuccess({ response, file, result })` |
| `onFileError(response, file, info, mode)` | `onFileError({ stage, cause, message, file, result })` |
| `onComplete(info)` | `onComplete({ result })` |

迁移示例：

```ts
// 旧版
const onFileSuccess = (response, file, info, mode) => {
	console.log(response, file, info.success, mode);
};

// 新版
const onFileSuccess = ({ response, file, result }) => {
	console.log(response, file, result.succeeded);
};
```

对象字段统一如下：

- 单个规范化文件使用 `file`，规范化文件数组使用 `files`，原生 `File[]` 使用 `rawFiles`。
- `fileList` 改为 `rawFiles`，`options` 改为 `requestOptions`，`info/cycle` 改为 `result`。
- 错误源统一称为 `cause`；可展示文案称为 `message`。
- `mode` 属性及所有生命周期中的 `mode` 字段已移除。需要业务分类时由上层通过闭包或组件上下文维护。
- `instance` 只保留在 `request` payload 中，表示当前 Upload 的 Vue 内部实例；其他事件不附带实例。

`message`、`request`、`response`、`file-before` 需要返回值，因此仍由 Upload 直接
调用监听函数；其余生命周期通过 Vue `emit` 派发。它们都遵循同一份对象 payload
契约。

### 2. 监听器不再声明为运行时 Props

`UploadProps` 只包含 `url`、`headers`、`showTask` 等真实配置。`onMessage`、
`onFileProgress`、`onComplete` 等由 Vue `emits`/VNode listeners 接收，不会出现在
运行时 props 或 DevTools props 中。

```vue
<!-- 模板写法不变 -->
<Upload
	@file-progress="handleProgress"
	@complete="handleComplete"
/>
```

```tsx
export const render = () => (
	<Upload
		// @ts-ignore Vue 的 string[] emits 保留 kebab-case 监听器类型
		onFileProgress={handleProgress}
		onComplete={handleComplete}
	/>
);
```

当前 `emits` 有意保持直观的 `string[]`。Vue 的 TSX 类型可能把 kebab-case 事件推导为
`onFile-progress`；项目内需要转发 camelCase 监听器时，只在 render 中第一个事件属性
前使用局部 `@ts-ignore`，不把 `onXxx` 重新加入 Props，也不在普通 JS 逻辑上扩大忽略
范围。

`Upload.open(options)` 不是组件 Props 对象，它仍可直接接收 `onFileBefore`、
`onComplete` 等回调。不要通过 `UploadProps` 给组件事件监听器建模，也不要在组件
`setup` 的 props 中读取它们；应继续把它们作为 Vue listeners 传入。

### 3. 周期结果重新命名

| 旧字段/选项 | 新字段/选项 |
| --- | --- |
| `result.success` | `result.succeeded` |
| `result.error` | `result.failed` |
| `result.total` 表示已完成数 | `result.total` 表示固定总数 |
| 无独立已完成字段 | `result.completed` |

新关系为 `completed === succeeded + failed`。`file-success`、`file-error` 中的
`result` 已包含当前文件的结算；`complete` 收到最终快照。`responses` 只记录成功
响应，并按实际结算顺序排列。

每次文件选择现在创建独立周期。前一批尚未结束时再次选择文件，两批会分别维护
`result`、请求、串并行队列和 `complete`，不再共同重置或累加同一个全局结果。

`file-before` 返回 `false` 或抛错会作为 `preflight` 失败计入 `failed/completed`，
启用 `show-task` 时也会更新 Task，但不会对外派发 `file-error`；网络、超时和响应
处理失败才派发 `stage: 'upload'` 的 `file-error`。

### 4. Upload.open

| 旧写法 | 新写法 |
| --- | --- |
| `slient` | `silent` |
| `onComplete(info)` | `onComplete({ result })` |
| Promise 返回旧周期对象 | resolve/reject `UploadCycleResult` |

```ts
// 旧版
Upload.open({
	slient: true,
	onComplete(info) {
		console.log(info.success);
	}
});

// 新版
const leaf = Upload.open({
	silent: true,
	onComplete({ result }) {
		console.log(result.succeeded);
	}
});

leaf.wrapper?.uploadFiles(files);
```

- `silent: false` 会自动点击文件选择器，`silent: true` 由调用方通过
  `leaf.wrapper?.uploadFiles()` 启动。
- 全部文件失败时 Promise reject；存在成功文件时 resolve。
- 周期完成前替换或销毁 Portal 会取消请求，但 Promise 保持 pending；不会自动
  生成取消错误。

### 5. UploadPicker

UploadPicker 保留原有上传事件集合，但所有上传事件也改为单对象 payload，并在对象上追加 `type`：

```ts
onFileSuccess({ response, file, result, type });
onFileError({ stage, cause, message, file, result, type });
onComplete({ result, type });
```

`file-before` 从 `(file, fileList, type)` 改为 `({ file, rawFiles, type })`。返回 `false` 现在会真实取消该文件，不再回退为原文件继续上传。类型可从 UploadPicker 入口导入为 `UploadPickerCallback`。

### 6. Task 改为内部能力

| 旧名称 | 新名称 |
| --- | --- |
| `Upload.TaskManager` / `Upload.Task` | 删除；使用组件的 `show-task` |
| `UploadTaskManager` / `UploadTask` | 不再公开 |
| `UploadTaskManagerView` / `UploadTaskView` | 不再公开 |
| `UploadTaskManagerInstance` / `UploadTaskInstance` | 删除 |
| `UploadTaskManagerService` / `UploadTaskService` | 删除 |
| `UploadTaskManagerExposed` / `UploadTaskExposed` | 不再公开 |
| `show-task-manager` / `showTaskManager` | `show-task` / `showTask` |
| `.vc-upload-task-manager` | `.vc-upload-task` |
| `task-manager/` / `upload-task-manager` | `task/` / `upload-task` |

原有手动 Task 调用改为由 Upload 自动管理：

```vue
<Upload
	show-task
	@file-progress="handleProgress"
	@complete="handleComplete"
/>
```

新版本没有手动 `popup/show/progress/destroy` 的替代 API。任务浮层属于组件实现细节；
需要不同展示或跨页面任务中心时，应基于公开上传事件在业务层实现。

### 7. Editor

Editor 的 Upload 全局配置同样使用对象参数：

```ts
VcInstance.configure({
	Upload: {
		onRequest: ({ requestOptions }) => requestOptions,
		onResponse: ({ request, requestOptions }) => ({
			request,
			file: requestOptions.file
		})
	}
});
```

Editor 内部静默上传选项已由 `slient` 改为 `silent`。

### Slot

| 名称 | 说明 |
| --- | --- |
| default | 上传文件触发器 |
