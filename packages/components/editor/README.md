## 富文本（Editor）

富文本编辑器

### 何时使用

- 常用的富文本编辑器，可扩展。
- 组件基于quill富文本编辑器。
- 请用 EditorView: 富文本预览组件来显示富文本内容。

### 基本用法

在富文本编辑器中编写的内容可用`EditorView`组件展示。

:::RUNTIME
```vue
<template>
	<div class="v-editor-basic">
		<Editor style="height: 200px" v-model="text" />
        <EditorView :value="text" />
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Editor, EditorView } from '@deot/vc';

const text = ref('');
</script>
```
:::

## API

### 属性

| 属性                 | 说明                | 类型         | 可选值 | 默认值                                                    |
| ------------------ | ----------------- | ---------- | --- | ------------------------------------------------------ |
| modelValue         | 富文本内容             | `string`   | -   | -                                                      |
| options            | 富文本toolbar（优先级最高） | `object`   | -   | -                                                      |
| disabled           | 富文本是否不可编辑         | `boolean`  | -   | `false`                                                |
| imageUploadOptions | 上传图片的配置项          | `object`   | -   | `{accept: 'image/gif,image/jpeg,image/jpg,image/png'}` |
| videoUploadOptions | 上传视频的配置项          | `object`   | -   | `{accept: 'video/mp4,video/webm,video/ogg'}`           |
| register           | Quill扩展注册         | `Function` | -   | -                                                      |


### EditorView属性

| 属性    | 说明            | 类型       | 可选值 | 默认值 |
| ----- | ------------- | -------- | --- | --- |
| value | 富文本内容（html形式） | `string` | -   | -   |


### 事件

| 事件名    | 说明           | 回调参数                                     | 参数说明                                            |
| ------ | ------------ | ---------------------------------------- | ----------------------------------------------- |
| blur   | 富文本失去焦点      | `(editor: object) => void`               | `editor`：富文本实例                                  |
| focus  | 富文本获取焦点      | `(editor: object) => void`               | `editor`：富文本实例                                  |
| change | 富文本内容变化      | `({html, text, editor}: object) => void` | `html`：输入的innerHTML；`text`：输入的文本；`editor`：富文本实例 |
| ready  | quill对象已经实例化 | -                                        | -                                               |


### Slot

| 属性      | 说明                                   |
| ------- | ------------------------------------ |
| toolbar | 工具栏内容(外层节点需要有id属性为`toolbar`)         |
| extend  | 组件提供的工具栏上的尾部工具拓展(和`toolbar`插槽不能同时使用) |

