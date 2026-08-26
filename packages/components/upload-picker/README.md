## 文件上传(UploadPicker)
统一选择、预览和删除图片、视频、音频及普通文件。桌面端使用 `UploadPicker`，移动端使用 `MUploadPicker`，两者的数据 API 一致。

### 何时使用
上传文件后先进行预览，可取消上传，需要统一提交给表单时使用。
- 上传失败的数据仅保留在组件内部用于展示失败状态，不会写入 `modelValue`。
- 视频和音频支持点击播放预览，普通文件展示文件名。

### 基础用法

:::RUNTIME
```vue
<template>
	<div style="v-upload-picker-basic">
		<UploadPicker
			v-model="dataSource"
			:max="{image: 2, video: 2}"
			:picker="['image', 'video']"
			:upload-options="uploadOptions"
		>
		</UploadPicker>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { UploadPicker } from '@deot/vc';

const dataSource = ref([
	'https://*/*.mp4',
	'https://*/*.jpg'
]);
const uploadOptions = ref({
	image: {},
	video: {},
	audio: {},
	file: {}
});
</script>
```
:::

### 移动端

```vue
<template>
	<MUploadPicker
		v-model="dataSource"
		:picker="['image', 'video', 'audio', 'file']"
		:max="{ image: 3, video: 1, audio: 1, file: 2 }"
	/>
</template>

<script setup>
import { ref } from 'vue';
import { MUploadPicker } from '@deot/vc';

const dataSource = ref([]);
</script>
```

## API

### 属性
| 属性                  | 说明                        | 类型                   | 可选值                      | 默认值                                  |
| ------------------- | ------------------------- | -------------------- | ------------------------ | ------------------------------------ |
| modelValue          | 数据源；支持字符串、对象及数组          | `string`、`object`、`array` | - | `[]` |
| picker              | upload的类型                 | `array`              | `image`, `video`, `audio`, `file` | `['image']` |
| sortable            | 可否拖拽排序                    | `boolean`            | -                        | `false`                              |
| mask                | `sortable`为`true`时，是否显示遮罩 | `boolean`            | -                        | `false`                              |
| uploadOptions       | `upload`的属性               | `object`             | -                        | `{}`                                 |
| max                 | 上传数量的最大值                  | `Number`、`object`    | -                        | ` Number.MAX_SAFE_INTEGER`           |
| disabled            | 是否禁用                      | `boolean`            | -                        | `false`                              |
| formatter           | 上传成功后的数据转换，签名为 `(response, file, type)`；返回对象时合并，返回其他值时作为文件地址 | `Function` | - | - |
| output              | 输出数组项格式或自定义转换函数           | `string`、`Function` | `object`、`string`       | `object`                             |
| keyValue            | 对象数据的名称、值字段映射              | `object`             | -                        | `{ label: 'label', value: 'value' }` |
| boxClass            | 上传控件的样式                   | `string`             | -                        | -                                    |
| imagePreviewOptions | 图片预览的配置                   | `object`             | -                        | -                                    |
| imageClass          | 图片item的样式                 | `string`             | -                        | -                                    |
| videoClass          | 视频item的样式                 | `string`             | -                        | -                                    |
| audioClass          | 音频item的样式                 | `string`             | -                        | -                                    |
| fileClass           | 文件item的样式                 | `string`             | -                        | -                                    |
| enhancer            | 桌面端上传入口增强器                   | `Function`、`boolean` | -                        | -                                    |
| compressOptions     | 图片压缩选项参数                  | `object`             | -                        | { compress: false, // 是否开启图片压缩 ... } |
| showMessage         | 组件内部错误时是否显示消息提示            | `boolean`            | -                        | `false`                              |

### 事件

| 事件名            | 说明                  | 回调参数 |
| ---------------- | -------------------- | -------- |
| update:modelValue | `modelValue` 更新      | `(value) => void` |
| change             | 文件列表改变            | `(value) => void` |
| file-before        | 单个文件上传前，可异步返回处理后的文件 | `(file, fileList, type) => UploadFile \| Promise<UploadFile>` |
| file-start         | 单个文件开始上传         | `(file, type) => void` |
| file-success       | 单个文件上传成功         | `(response, file, info, type) => void` |
| file-error         | 单个文件上传失败         | `(response, file, info, type) => void` |
| error              | 上传组件内部错误         | `(error, type) => void` |
| complete           | 一个上传周期结束         | `(info, type) => void` |
| remove-before      | 删除前回调，可返回 Promise 阻止后续操作直至完成 | `(typeIndex, type) => void \| Promise<void>` |

以上事件中的 `type` 均为 `image`、`video`、`audio` 或 `file`。


### 插槽
| 属性      | 说明 |
| -------- | ---- |
| default  | 自定义文件项，参数为 `{ row, type, index, typeIndex }`；`index` 为可预览列表索引，`typeIndex` 为当前文件类型数组索引 |
| upload   | 自定义上传按钮，参数为 `{ type }` |
