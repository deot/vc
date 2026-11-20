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

### 提及

`mentionOptions` 开启提及：输入前缀（默认 `@`）后按前缀之后的文字联想，选中后在原处插入一个**原子的提及节点**和一个空格。提及节点整体选中、整体删除，保存选中项的 `value`（如成员 id），显示 `前缀 + label`；撤销、重做照常。

- 找词规则与 [Mention](../mention/README.md#基础用法) 相同（只看光标所在段落、光标之前的文字）；嵌入的节点（图片、提及）按一个非空白字符计，紧跟在它后面的前缀不触发。
- 键盘：↑ ↓ 移动、Enter 选中（不换行）、Esc 关闭；弹层跟随光标，编辑区滚动时重新定位。
- 输出的 HTML 为 `<span class="vc-editor-mention" data-value="…" data-prefix="@">@文字</span>`；回填、粘贴同样的 HTML 时还原为提及节点。EditorView 按同样的样式显示。配置了全局 `sanitize` 时，需要保留这个 class 与 `data-value`、`data-prefix`（DOMPurify 默认保留）。
- `Editor.getMentions(html)` 按出现顺序取出 `[{ value, prefix, label }]`，如提交时得到要通知的成员。
- `mentionOptions` 的字段同 Mention 的同名属性：`data`、`prefix`、`loadData(keyword, instance, { prefix })`、`virtualized`、`renderOption`、`renderLabel`、`renderOptionGroup`、`placement`、`portal`、`portalClass`。传入固定的对象（不要在模板里每次渲染新建），列表才不会随父组件重渲染而重新过滤。

```vue
<template>
	<Editor v-model="value" :mention-options="mentionOptions" @mention-select="handleSelect" />
</template>
<script setup>
import { ref } from 'vue';
import { Editor } from '@deot/vc';

const USERS = [{ value: 'u1', label: '成员甲' }, { value: 'u2', label: '成员乙' }];
const TOPICS = [{ value: 't1', label: '话题一' }];

const value = ref('');
const mentionOptions = {
	prefix: ['@', '#'],
	// 按前缀返回不同的数据；Promise 解析为数组时直接作为结果
	loadData: (keyword, instance, { prefix }) => Promise.resolve(
		(prefix === '#' ? TOPICS : USERS).filter(item => item.label.includes(keyword))
	)
};
// 当前内容里的提及：[{ value, prefix, label }]，如提交时取出要通知的成员
const mentions = ref([]);
const handleSelect = () => {
	mentions.value = Editor.getMentions(value.value);
};
</script>
```

## 主题与局部覆盖

全局参数通过 `--vc-<参数>` 配置，组件级覆盖使用 `--vc-editor-<参数>`。局部参数仅提供组件级入口；可在组件根节点或其祖先上设置。

工具栏文案跟随 locale。下拉、颜色和链接浮层复用 Popover / Dropdown 的主题入口，文件预览和加载图标分别复用 FilePreview、Spin 的主题入口。

### 全局

| 参数 | 使用位置 | 值 |
| --- | --- | --- |
| color-dark-extralight | 占位文字、待办列表标记及默认色块的斜线 | 亮色：`#909399`；暗色：`#B9B9B9` |
| color-neutral-light | 工具栏下边线、内容表格、引用块及链接预览的分隔线 | 亮色：`#EDEFF1`；暗色：`#3B4354` |
| color-primary | 链接、激活与悬停的工具 | `#456CF6` |
| background-color | 代码及代码块背景 | 亮色：`#F5F6FA`；暗色：`#252B3A` |
| background-color-lightest | 编辑区背景及上传时的遮罩 | 亮色：`#FFFFFF`；暗色：`#252B3A` |
| border-color | 编辑区外框及默认色块边框 | `#D5D9E1` |
| foreground-color | 正文、代码、工具栏图标与文字、选中色块的边框 | 亮色：`#080F20`；暗色：`#F8F8F8` |

### 局部

尺寸为局部变量 `--vc-editor-<参数>`，默认值为下表。

| 参数 | 使用位置 | 默认值 |
| --- | --- | --- |
| font-size | 正文字号（Editor 与 EditorView） | `13px` |
| toolbar-padding | 工具栏内边距 | `6px 8px` |
| toolbar-font-size | 工具栏文字字号 | `14px` |
| group-gap | 工具分组的间距，分割线位于正中；折行后行首不显示分割线 | `13px` |
| divider-height | 分组分割线的高度 | `16px` |
| tool-gap | 组内工具的间距，也是折行后的行距 | `2px` |
| tool-size | 工具按钮的边长（方形），也是选择项的高度 | `28px` |
| tool-padding | 选择项的左右内边距 | `0 6px` |
| tool-radius | 按钮与选择项悬停、激活底色的圆角 | `4px` |
| icon-size | 工具图标大小，也是颜色条的宽度 | `16px` |
| color-bar-height | 颜色按钮下方色条的高度 | `2px` |
| color-size / color-gap | 色块大小与间距 | `16px` / `4px` |
| prompt-padding / prompt-gap | 链接浮层的内边距与间距 | `8px 12px` / `8px` |
| prompt-input-width | 链接浮层输入框宽度，也是预览中链接的最大宽度 | `200px` |

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
| toolbarPlacement | 工具栏位置：`keyboard` 聚焦时停在虚拟键盘上方，仅 MEditor 生效，桌面端同 `top` | `string` | `top` / `keyboard` | Editor：`'top'`；MEditor：`'keyboard'` |
| mentionOptions | 提及，见[提及](#提及)；不传时不开启 | `EditorMentionOptions` | - | `undefined` |

`options` 按 `Editor.defaults` → `VcInstance.options.Editor.options` → 组件 `options` 的顺序合并；`modules` 单独浅合并。默认启用 `EventExtend`；工具栏由组件渲染，`options.theme` 与 `options.modules.toolbar` 不生效。占位文案跟随 locale，可通过 `options.placeholder` 覆盖（包括空字符串）。除占位文案外，应通过重新挂载应用新的初始化配置。

工具栏从 `options.toolbar` 读取数组或 `{ container: [...] }`：顶层的数组为一组，相邻的散项合成一组。每项可以是：

- 格式名，如 `'bold'`、`'blockquote'`、`'code-block'`、`'clean'`；`'color'`、`'header'`、`'font-size'` 等有默认取值的格式显示为选择项。
- `{ 格式: 取值 }`，按钮点击在设置与清除之间切换，如 `{ header: 1 }`、`{ list: 'check' }`、`{ indent: '+1' }`。
- `{ 格式: [取值…] }`，显示为下拉选择；空数组使用默认取值，`'selected'` 或空值表示默认（清除该格式）。`color`、`background` 显示为色块。
- `'link'`、`'video'`、`'formula'` 弹出输入框；`'image'` 与 `'upload/image'` 相同，走上传。
- `'upload/<类型>'`、`'undo'`、`'redo'`。

默认工具包括常用格式、标题、列表、字体、颜色、对齐、字号、行高、字间距、链接、图片/视频上传及撤销/重做。

选中文字后按 `Ctrl / Cmd + K` 或点击链接工具可添加链接；未选中文字时插入地址本身作为链接。光标停在链接里时显示链接预览，可打开、编辑或删除。

字号、字间距作用于选中文字，行高作用于整段（写在段落上，可以调小）。旧内容里写在行内元素上的行高，在重新载入编辑器时会提升为所在段落的行高。`{ 'font-size': [...] }` 等自定义取值会并入格式白名单，不在白名单内的值会被忽略。列表项上的对齐、行高等段落格式会保留在输出的 HTML 中。

全局 enhancer 优先使用 `VcInstance.options.Editor.enhancer`，其次使用 `VcInstance.options.UploadPicker.enhancer`。函数收到 `{ instance, type, types, mobile }`，分别是 Vue 组件内部实例、上传类型（如 `image`、`video`）、`[type]`，以及是否为 MEditor。

### Editor 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| update:modelValue | HTML 内容更新 | `(value)` | `value: string` |
| input | 内容变化 | `({ value, editor })` | `value: string`；`editor: Quill` |
| change | 内容变化，同时通知 FormItem | `({ value, editor })` | 同上 |
| focus | 编辑区获得焦点；光标在编辑区内移动不会重复触发 | `({ value, editor })` | 同上 |
| blur | 编辑区失去焦点，同时通知 FormItem | `({ value, editor })` | 同上 |
| ready | Quill 初始化完成 | `({ dependencies: { quill } })` | `quill` 为 Quill 构造器；实例通过组件 ref 的 `editor` 获取 |
| mention-select | 插入提及 | `({ value, item, prefix, editor })` | `value: string`：选中项的 value；`item`：选中项；`prefix`：前缀；`editor: Quill` |

内容由 `getSemanticHTML()` 生成，空段落 `<p><br></p>` 转换为 `''`。`getSemanticHTML()` 会把所有空格转为 `&nbsp;`，组件会将其还原为普通空格，保证英文可以换行：连续空格交替保留 `&nbsp;`，段首段尾的空格保留 `&nbsp;`，`pre`、`code` 内的内容保持原样。程序修改内容也可能触发内容事件。

### Editor 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| toolbar | 替换默认工具栏 | `{ formats, format, editor }`：`formats` 为当前选区的格式；`format(name, value?, toggle?)` 应用格式，`toggle` 为 `true` 时与当前取值相同则清除；`editor` 为 Quill 实例 |
| extend | 默认工具栏末尾的扩展内容；使用 toolbar 插槽时不渲染 | - |

### Editor 方法与实例成员

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| add | 插入已上传资源 | `Array<{ value: string; target?: { name: string } }>`，默认为 `[]` | `void` |
| editor | 组件 ref 暴露的 Quill 实例；ready 前可能为空 | - | `Quill \| undefined` |
| Editor.getMentions | 静态方法：HTML 中的提及，按出现顺序（MEditor.getMentions 相同） | `html: string` | `Array<{ value: string; prefix: string; label: string }>` |

### EditorView 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| value | 直接渲染的 HTML 内容 | `string` | - | `undefined` |
| previewable | 点击内容中的图片时是否打开预览 | `boolean` | - | `true` |

EditorView 没有公开事件、插槽或方法。`previewable` 开启时，点击内容中的图片会打开预览，预览列表为内容内的全部图片。

## 移动端

`MEditor`、`MEditorView` 与桌面端结构相同，属性、事件、插槽一致；根节点另有标记类 `vcm-editor` / `vcm-editor-view`，尺寸随 `--vc-rem` 缩放（750 稿）。

- 正文字号 32（375 宽下 16px，iOS 聚焦时不放大页面）。
- 工具栏单行横向滚动：按钮 72 见方、图标 40，工具栏高 88；分组之间为竖线。
- 选择项（标题、字体、字号、对齐、行高、字间距）用动作面板，当前值高亮；文字颜色、背景色用底部弹出层的色块网格（色块 64）。
- 链接、视频、公式的输入用底部弹出层；光标停在链接里时仍以浮层显示预览。
- `toolbarPlacement` 默认 `keyboard`：聚焦时工具栏固定在虚拟键盘上方，按 `visualViewport` 计算位置，原位置保留占位；光标被工具栏挡住时滚动页面。失焦或禁用时回到编辑区顶部。
- 停靠时工具栏移到 `body` 下（脱离编辑器的层叠上下文，不会被页面上后面的内容盖住）；移动端工具栏的尺寸变量写在工具栏的标记类 `vcm-editor-toolbar` 上，覆盖时设置在它上面。
- 提及（`mentionOptions`）同样是跟随光标的下拉，750 稿尺寸，按可视区翻转、限高；点按选中，不默认高亮。
- 点击图片用移动端查看器预览；`enhancer` 收到的 `mobile` 为 `true`。

移动端覆盖的局部变量（`.vcm-editor` 上；弹出层在 `body` 下，各自设置）：

| 参数 | 值（750 稿） |
| --- | --- |
| font-size | 32（MEditorView 同） |
| toolbar-padding / toolbar-font-size | `8 16` / 28 |
| group-gap / divider-height / tool-gap | 24 / 32 / 4 |
| tool-size / tool-padding / tool-radius | 72 / `0 16` / 8 |
| icon-size / color-bar-height | 40 / 4 |
| color-size / color-gap（颜色弹出层） | 64 / 24 |

### 注意事项

- EditorView 的内容按 HTML 渲染，组件本身不清洗；展示外部内容前应由业务侧完成可信校验，或配置全局的 `sanitize` 统一清洗（钩子里可用 `instance.parent` 识别 EditorView，为富文本放行更多标签），见 [Customer](../customer/README.md)。
- 旧的 `imageUploadOptions`、`videoUploadOptions`、`uploadOptions` 不属于当前公开属性。
