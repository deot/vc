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

工具栏上传前会调用 `enhancer({ instance, type, types })`（`types` 为 `[type]`，与 UploadPicker 的签名一致），异步返回真值时终止默认上传。可在自定义资源选择完成后调用组件实例的 `add()` 插入资源。粘贴或拖入文件走默认上传流程，不经过工具栏 enhancer。

```text
editorRef.value.add([
	{ value: 'https://example.com/manual.pdf', target: { name: 'manual.pdf' } }
]);
```

资源类型根据 `target.name` 识别；省略 `target` 时从地址推导文件名。两者分别读取全局 `VcInstance.options.FilePreview.getFileType`、`getFileName`，未配置或返回空值时使用内置规则（按扩展名识别；取地址最后一段，去掉 `?`、`#` 之后的部分并解码）。普通文件插入链接，图片、音频和视频插入对应媒体元素。应在 `ready` 后调用。

## 主题与局部覆盖

全局参数通过 `--vc-<参数>` 配置，组件级覆盖使用 `--vc-editor-<参数>`。局部参数仅提供组件级入口；可在组件根节点或其祖先上设置。

`label-*` 变量由 locale 写入，用于工具栏文案；文案调整使用语言配置。文件预览和加载图标分别复用 FilePreview、Spin 的主题入口。

### 全局

| 参数 | 使用位置 | 值 |
| --- | --- | --- |
| color-dark-extralight | 占位文字及列表标记 | 亮色：`#909399`；暗色：`#B9B9B9` |
| color-neutral-light | 工具栏、内容表格、引用块及操作分隔线 | 亮色：`#EDEFF1`；暗色：`#3B4354` |
| color-primary | 链接、激活工具及选中选项 | `#456CF6` |
| background-color | 代码及代码块背景 | 亮色：`#F5F6FA`；暗色：`#252B3A` |
| background-color-lightest | 编辑区、工具栏选项及提示浮层背景 | 亮色：`#FFFFFF`；暗色：`#252B3A` |
| border-color | 编辑区外框、工具选项及浮层输入框边框 | `#D5D9E1` |
| foreground-color | 正文、工具栏文字及 SVG 图标 | 亮色：`#080F20`；暗色：`#F8F8F8` |
| box-shadow | 工具栏选项及提示浮层阴影 | 亮色：`0 0 8px 0 rgb(0 0 0 / 10%)`；暗色：`0 0 8px 0 rgb(255 255 255 / 5%)` |

### 局部

当前组件没有额外的局部 CSS 主题参数。

## API

### Editor 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| modelValue | HTML 内容，支持 `v-model` | `string` | - | `''` |
| options | Quill 初始化配置和 `toolbar` 配置，见下文 | `object` | - | `undefined` |
| disabled | 是否禁用编辑；禁用时工具栏上传、撤销、重做以及粘贴、拖入文件都不响应。优先于 `options.readOnly` | `boolean` | - | `false` |
| register | 创建编辑器前注册 Quill 扩展 | `(QuillClass: typeof Quill) => void` | - | `undefined` |
| poster | 插入视频时的封面地址；未提供或返回空值时不设置封面 | `({ value, type }) => string \| undefined` | - | `undefined` |
| enhancer | 工具栏上传增强函数；`true` 使用全局配置，`false` 跳过增强 | `boolean \| Function` | - | `true` |
| previewable | 点击编辑区域内图片时是否打开预览 | `boolean` | - | `true` |

`options` 按 `Editor.defaults` → `VcInstance.options.Editor.options` → 组件 `options` 的顺序合并；`modules` 单独浅合并。默认主题为 `snow`，默认启用 `EventExtend`。占位文案跟随 locale，可通过 `options.placeholder` 覆盖（包括空字符串）。除占位文案外，应通过重新挂载应用新的初始化配置。

工具栏从 `options.toolbar` 读取数组或 `{ container: [...] }`，`options.modules.toolbar` 会被内部生成的工具栏选择器覆盖。默认工具包括常用格式、标题、列表、字体、颜色、对齐、字号、行高、字间距、链接、图片/视频上传及撤销/重做。

字号、字间距作用于选中文字，行高作用于整段（写在段落上，可以调小）。旧内容里写在行内元素上的行高，在重新载入编辑器时会提升为所在段落的行高。`{ 'font-size': [...] }` 等自定义取值会并入格式白名单，不在白名单内的值会被忽略。列表项上的对齐、行高等段落格式会保留在输出的 HTML 中。

全局 enhancer 优先使用 `VcInstance.options.Editor.enhancer`，其次使用 `VcInstance.options.UploadPicker.enhancer`。函数收到 `{ instance, type, types }`，分别是 Vue 组件内部实例、上传类型（如 `image`、`video`）和 `[type]`。

### Editor 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| update:modelValue | HTML 内容更新 | `(value)` | `value: string` |
| input | 内容变化 | `({ value, editor })` | `value: string`；`editor: Quill` |
| change | 内容变化，同时通知 FormItem | `({ value, editor })` | 同上 |
| focus | 编辑区获得焦点；光标在编辑区内移动不会重复触发 | `({ value, editor })` | 同上 |
| blur | 编辑区失去焦点，同时通知 FormItem | `({ value, editor })` | 同上 |
| ready | Quill 初始化完成 | `({ dependencies: { quill } })` | `quill` 为 Quill 构造器；实例通过组件 ref 的 `editor` 获取 |

内容由 `getSemanticHTML()` 生成，空段落 `<p><br></p>` 转换为 `''`。`getSemanticHTML()` 会把所有空格转为 `&nbsp;`，组件会将其还原为普通空格，保证英文可以换行：连续空格交替保留 `&nbsp;`，段首段尾的空格保留 `&nbsp;`，`pre`、`code` 内的内容保持原样。程序修改内容也可能触发内容事件。

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
| previewable | 点击内容中的图片时是否打开预览 | `boolean` | - | `true` |

EditorView 没有公开事件、插槽或方法。`previewable` 开启时，点击内容中的图片会打开预览，预览列表为内容内的全部图片。

### 注意事项

- EditorView 的内容按 HTML 渲染，组件本身不清洗；展示外部内容前应由业务侧完成可信校验，或配置全局的 `sanitize` 统一清洗（钩子里可用 `instance.parent` 识别 EditorView，为富文本放行更多标签），见 [Customer](../customer/README.md)。
- `MEditor`、`MEditorView` 是对应桌面组件的别名，没有独立移动端实现。
- 旧的 `imageUploadOptions`、`videoUploadOptions`、`uploadOptions` 不属于当前公开属性。
