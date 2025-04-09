## 更新`3.x`注意事项
- 变更属性: `imgClass-> imageClass`


## 文件上传(UploadPicker)
图片、视频、文件上传，预览仅支持图片和视频

### 何时使用
上传文件后先进行预览，可取消上传，需要统一提交给表单时使用。
- 上传错误的文件数据不会s传递给外层，切记传递给组件的是 `dataSource` 必须是字符串数组。

### 基础用法

:::RUNTIME
```vue
<template>
	<div style="v-upload-picker-basic">
		<UploadPicker
			v-model="dataSource"
			:max="{image: 2, video: 2}"
			:picker="['image', 'video']"
			:upload-opts="uploadOptions"
		>
		</UploadPicker>
	</div>
</template>
<script setup>
import { ref } from 'vue' ; 
import { UploadPicker } from '@deot/vc';

const dataSource = ref([
	'https://*/*.mp4', 
	'https://*/*.jpg', 
]);
const uploadOptions = ref({
	image: {},
	video: {},
	file: {}
});
</script>
```
:::

## API

### 属性
| 属性                  | 说明                        | 类型                   | 可选值                      | 默认值                                  |
| ------------------- | ------------------------- | -------------------- | ------------------------ | ------------------------------------ |
| modelValue          | 数据源                       | `array`              | -                        | `[]`                                 |
| picker              | upload的类型                 | `array`              | `image`, `video`, `file` | `['image']`                          |
| sortable            | 可否拖拽排序                    | `boolean`            | -                        | `false`                              |
| mask                | `sortable`为`true`时，是否显示遮罩 | `boolean`            | -                        | `false`                              |
| uploadOptions       | `upload`的属性               | `object`             | -                        | `{}`                                 |
| max                 | 上传数量的最大值                  | `Number`、`object`    | -                        | ` Number.MAX_SAFE_INTEGER`           |
| disabled            | 是否禁用                      | `boolean`            | -                        | `false`                              |
| formatter           | 对上传成功后的数据格式化              | `Function`           | -                        | -                                    |
| boxClass            | 上传控件的样式                   | `string`             | -                        | -                                    |
| imagePreviewOptions | 图片预览的配置                   | `object`             | -                        | -                                    |
| imageClass          | 图片item的样式                 | `string`             | -                        | -                                    |
| videoClass          | 视频item的样式                 | `string`             | -                        | -                                    |
| fileClass           | 文件item的样式                 | `string`             | -                        | -                                    |
| urlKey              | 上传成功后那远程地址的key            | `string`             | -                        | `url`                                |
| gallery             | 图片上传调用商品橱窗,仅在PC组件内有效      | `Function`、`boolean` | -                        | `true`                               |
| compressOptions     | 图片压缩选项参数                  | `object`             | -                        | { compress: false, // 是否开启图片压缩 ... } |

### 事件

| 事件名         | 说明                 | 回调参数                                                            | 参数说明                                                                    |
| ----------- | ------------------ | --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| file-before | 单个文件上传前回调(进度)      | `(file: File, fileList: array, type: string) => void`           | `file`：当前上传的文件；`fileList`：上传的文件数组；`type`：在`image`、`video`、`file`中取值     |
| file-start  | 单个文件上传开始回调         | `(file: File, type: string) => void`                            | `file`：当前上传的文件；`type`：在`image`、`video`、`file`中取值                        |
| success     | 单个文件上传过程成功回调       | `(res: object, file: File, info: object, type: string) => void` | `res`：上传结果；`file`：上传的文件；`info`：上传信息对象；`type`：在`image`、`video`、`file`中取值 |
| error       | 组件内部报错回调           | `(error: object, type: string, file: File) => void`             | `error`：错误信息；`type`：在`image`、`video`、`file`中取值；`file`：上传的文件             |
| complete    | 一个周期上传后的回调         | `(info: object, type: string) => void`                          | `info`：上传信息对象；`type`：在`image`、`video`、`file`中取值                         |
| change      | `dataSource`值改变的回调 | `(data) => void`                                                | `data`：改变后绑定的数组                                                         |


### 插槽
| 属性           | 说明        |
| ------------ | --------- |
| image-upload | 图片的上传按钮   |
| video-upload | 视频的上传按钮   |
| file-upload  | 文件的上传按钮   |
| image        | 图片展示的Item |
| video        | 视频展示的Item |
| file         | 文件展示的Item |
