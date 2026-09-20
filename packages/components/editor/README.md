## 富文本（Editor）

基于 Quill 的 HTML 富文本编辑器，提供格式工具栏、图片预览和上传扩展；EditorView 用于展示 HTML 内容。

### 何时使用

- 编辑包含标题、列表、链接和媒体的内容。
- 将编辑结果通过 `v-model` 保存，并用 `EditorView` 展示。

### 基础用法

输入内容后，下方预览会同步更新。`disabled` 控制编辑区域是否可编辑；通过 `options.toolbar` 选择需要的工具。

:::playground
<!--
<config lang="json5">
{ previewInset: 16 }
</config>
-->
```vue
<template>
	<div class="editor-demo">
		<div class="editor-demo__actions">
			<Button @click="handleToggle">{{ isDisabled ? '启用编辑' : '禁用编辑' }}</Button>
			<Button @click="handleClear">清空内容</Button>
		</div>
		<Editor v-model="value" :disabled="isDisabled" :options="options" class="editor-demo__input" />
		<section>
			<h4>内容预览</h4>
			<EditorView :value="value" />
		</section>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, Editor, EditorView } from '@deot/vc';

const value = ref('<p>试试选中文字，再点击<strong>加粗</strong>工具。</p>');
const isDisabled = ref(false);
const options = {
	toolbar: [
		['bold', 'italic', 'underline'],
		[{ header: [1, 2, 3, false] }, { list: 'ordered' }, { list: 'bullet' }],
		['link', 'undo', 'redo']
	]
};
const handleToggle = () => (isDisabled.value = !isDisabled.value);
const handleClear = () => (value.value = '');
</script>

<style scoped>
.editor-demo {
	display: grid;
	gap: 20px;
}
.editor-demo__actions {
	display: flex;
	flex-wrap: wrap;
	gap: 12px;
}
.editor-demo__input {
	width: 100%;
	height: 240px;
}
h4 {
	margin: 0 0 12px;
}
</style>
```
:::

### 接入上传

默认工具栏包含 `upload/image` 和 `upload/video`，通过 `Upload.open()` 上传。先配置公开的 `VcInstance.configure({ Upload: … })` 上传能力；成功响应应包含字符串 `value`、`source` 或 `url`，依次取首个字符串作为文件地址。

工具栏上传前会调用 `enhancer(instance, type)`，异步返回真值时终止默认上传。可在自定义资源选择完成后调用组件实例的 `add()` 插入资源。粘贴或拖入文件走默认上传流程，不经过工具栏 enhancer。

```text
editorRef.value.add([
	{ value: 'https://example.com/manual.pdf', target: { name: 'manual.pdf' } }
]);
```

资源类型根据 `target.name` 的扩展名识别；省略 `target` 时从地址末尾推导文件名。普通文件插入链接，图片、音频和视频插入对应媒体元素。应在 `ready` 后调用。

## API

### Editor 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| modelValue | HTML 内容，支持 `v-model` | `string` | - | `''` |
| options | Quill 初始化配置和 `toolbar` 配置，见下文 | `object` | - | `undefined` |
| disabled | 是否禁用编辑区域；优先于 `options.readOnly` | `boolean` | - | `false` |
| uploadOptions | 已声明的上传配置；当前默认上传流程未读取此属性 | `object` | - | `{ file: {}, image: {}, video: {} }` |
| register | 创建编辑器前注册 Quill 扩展 | `(QuillClass: typeof Quill) => void` | - | `undefined` |
| poster | 已声明的封面回调；当前组件上下文未将它传给媒体插入流程 | `Function` | - | `undefined` |
| enhancer | 工具栏上传增强函数；`true` 使用全局配置，`false` 跳过增强 | `boolean \| Function` | - | `true` |
| previewable | 点击编辑区域内图片时是否打开预览 | `boolean` | - | `true` |

`options` 按 `Editor.defaults` → `VcInstance.options.Editor.options` → 组件 `options` 的顺序合并；`modules` 单独浅合并。默认主题为 `snow`，默认启用 `EventExtend`。占位文案跟随 locale，可通过 `options.placeholder` 覆盖（包括空字符串）。除占位文案外，应通过重新挂载应用新的初始化配置。

工具栏从 `options.toolbar` 读取数组或 `{ container: [...] }`，`options.modules.toolbar` 会被内部生成的工具栏选择器覆盖。默认工具包括常用格式、标题、列表、字体、颜色、对齐、字号、行高、字间距、链接、图片/视频上传及撤销/重做。

全局 enhancer 优先使用 `VcInstance.options.Editor.enhancer`，其次使用 `VcInstance.options.UploadPicker.enhancer`。函数收到 Vue 组件内部实例和上传类型（如 `image`、`video`）。

### Editor 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| update:modelValue | HTML 内容更新 | `(value, info)` | `value: string`；`info: { value: string, editor: Quill }` |
| input | Quill 内容变化 | `(value, info)` | 同上 |
| change | Quill 内容变化，同时通知 FormItem | `(value, info)` | 同上 |
| focus | Quill 选区变为非空 | `(value, info)` | 同上；选区变化也可能触发 |
| blur | Quill 选区变为空 | `(value, info)` | 同上 |
| ready | Quill 初始化完成 | `({ dependencies: { quill } })` | `quill` 为 Quill 构造器；实例通过组件 ref 的 `editor` 获取 |

内容由 `getSemanticHTML()` 生成，空段落 `<p><br></p>` 转换为 `''`。程序修改内容也可能触发内容事件。

### Editor 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| toolbar | 替换默认工具栏。根元素的 id 必须与组件 ref 暴露的 `toolbarId` 一致，并在 Quill 初始化前存在 | - |
| extend | 默认工具栏末尾的扩展内容；使用 toolbar 插槽时不渲染 | - |

### Editor 方法与实例成员

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| add | 插入已上传资源 | `Array<{ value: string; target?: { name: string } }>`，默认为 `[]` | `void` |
| editor | 组件 ref 暴露的 Quill 实例；ready 前可能为空 | - | `Quill \| undefined` |
| toolbarId | 组件 ref 暴露的自动生成的工具栏 id | - | `string` |

### EditorView 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| value | 直接渲染的 HTML 内容 | `string` | - | `undefined` |
| fontSize | 注入字号工具标签样式的值 | `string[]` | - | `['12px', '14px', '16px', '18px', '20px', '22px', '24px', '50px']` |
| lineHeight | 注入行高工具标签样式的值 | `string[]` | - | `['1', '1.2', '1.4', '1.6', '1.8', '2.0', '2.2', '2.4', '2.6', '2.8', '3.0']` |
| letterSpacing | 注入字间距工具标签样式的值 | `string[]` | - | `['0px', '1px', '2px', '3px', '4px', '5px', '6px', '7px', '8px', '9px', '10px']` |

这些数组在挂载时生成标签样式，不修改 HTML 或 Quill 格式白名单。EditorView 没有公开事件、插槽或方法。当前图片预览监听匹配旧容器类名，因此普通 EditorView 渲染不提供有效的图片点击预览。

### 注意事项

- EditorView 使用 `innerHTML`，不会清洗 HTML；展示外部内容前应由业务侧完成可信校验和清洗。
- `MEditor`、`MEditorView` 是对应桌面组件的别名，没有独立移动端实现。
- 旧的 `imageUploadOptions`、`videoUploadOptions` 不属于当前公开属性。
