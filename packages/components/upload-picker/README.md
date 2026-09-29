## 文件选择上传（UploadPicker）

统一选择、预览、排序和删除图片、视频、音频及普通文件。桌面端使用 `UploadPicker`，移动端使用 `MUploadPicker`，共享数据与事件 API。

### 何时使用

需要在表单内管理上传后的文件列表时使用。图片可放大预览，音视频可打开播放器，普通文件展示文件名。

### 基础用法

选择本地图片后可以预览、删除和排序，最多保留 3 张。示例通过 `onResponse` 生成临时 URL，仅演示本地流程。实际上传请在 `uploadOptions.image` 中设置 `url`，响应包含 `value` 或 `source`；其他响应格式通过 `formatter` 转换。

:::playground
<!-- <config lang="json5">{ previewInset: 20 }</config> -->
```vue
<template>
	<div class="demo">
		<UploadPicker
			v-model="files"
			:max="3"
			sortable mask
			:upload-options="uploadOptions"
		>
		</UploadPicker>
		<p>已选择 {{ files.length }} 个文件；点击媒体项预览。</p>
	</div>
</template>

<script setup>
import { ref, onBeforeUnmount } from 'vue';
import { UploadPicker } from '@deot/vc';

const files = ref([]);
const urls = [];
const labels = { image: '图片' };
const uploadOptions = Object.fromEntries(Object.keys(labels).map(type => [type, {
	onResponse: ({ requestOptions }) => {
		const value = URL.createObjectURL(requestOptions.file);
		urls.push(value);
		return { value };
	}
}]));
onBeforeUnmount(() => urls.forEach(url => URL.revokeObjectURL(url)));
</script>

<style scoped>
.demo p { margin: 8px 0 0; font-size: 13px; }
.demo button { padding: 6px 10px; }
</style>
```
:::

### 多种文件与自定义入口

按类型配置数量上限，支持视频、音频预览及普通文件名称展示。此示例同样只在本地生成临时 URL。

:::playground
<!-- <config lang="json5">{ previewInset: 20 }</config> -->
```vue
<template>
	<div class="demo">
		<UploadPicker
			v-model="files"
			:picker="['image', 'video', 'audio', 'file']"
			:max="{ image: 2, video: 1, audio: 1, file: 2 }"
			sortable mask
			:upload-options="uploadOptions"
		>
			<template #upload="{ type }">
				<button type="button">选择{{ labels[type] }}</button>
			</template>
		</UploadPicker>
		<p>已选择 {{ files.length }} 个文件；点击媒体项预览。</p>
	</div>
</template>

<script setup>
import { ref, onBeforeUnmount } from 'vue';
import { UploadPicker } from '@deot/vc';

const files = ref([]);
const urls = [];
const labels = { image: '图片', video: '视频', audio: '音频', file: '文件' };
const uploadOptions = Object.fromEntries(Object.keys(labels).map(type => [type, {
	onResponse: ({ requestOptions }) => {
		const value = URL.createObjectURL(requestOptions.file);
		urls.push(value);
		return { value };
	}
}]));
onBeforeUnmount(() => urls.forEach(url => URL.revokeObjectURL(url)));
</script>

<style scoped>
.demo p { margin: 8px 0 0; font-size: 13px; }
.demo button { padding: 6px 10px; }
</style>
```
:::

### 自定义文件项和实例方法

默认插槽替换整个文件项，包括内置预览与删除控件。使用 `typeIndex` 和 `type` 调用 `remove`。`index` 是过滤失败、未完成项后的预览索引，不适合用于删除。

:::playground
<!-- <config lang="json5">{ previewInset: 20 }</config> -->
```vue
<template>
	<div class="demo">
		<div class="actions">
			<button type="button" @click="handleAdd">添加示例文件</button>
			<button type="button" @click="handleReset">重置视图</button>
		</div>
		<UploadPicker ref="picker" v-model="files" :picker="['file']" disabled>
			<template #default="{ row, type, typeIndex }">
				<button class="file" type="button" @click="handleRemove(typeIndex, type)">{{ row.label }} ×</button>
			</template>
		</UploadPicker>
		<p>modelValue 中有 {{ files.length }} 项；reset 仅重置内部视图，不更新 modelValue。</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { UploadPicker } from '@deot/vc';

const picker = ref();
const files = ref([]);
const handleAdd = () => {
	picker.value.add([{ type: 'file', label: '说明.txt', value: 'data:text/plain,UploadPicker' }]);
};
const handleRemove = (index, type) => picker.value.remove(index, type);
const handleReset = () => picker.value.reset();
</script>

<style scoped>
.demo { display: grid; gap: 16px; }
.actions { display: flex; flex-wrap: wrap; gap: 8px; }
.file { width: 100%; height: 100%; overflow-wrap: anywhere; }
.demo p { margin: 0; font-size: 13px; }
</style>
```
:::

### 移动端

移动端使用较大的文件方块和右上角删除入口，支持相同的四种文件类型。

:::playground
<!-- <config lang="json5">{ viewport: [375, 400], previewInset: 20 }</config> -->
```vue
<template>
	<div class="demo">
		<MUploadPicker
			v-model="files"
			:max="3"
			:upload-options="uploadOptions"
		>
		</MUploadPicker>
		<p>已选择 {{ files.length }} 个文件；点击媒体项预览。</p>
	</div>
</template>

<script setup>
import { ref, onBeforeUnmount } from 'vue';
import { MUploadPicker } from '@deot/vc';

const files = ref([]);
const urls = [];
const labels = { image: '图片' };
const uploadOptions = Object.fromEntries(Object.keys(labels).map(type => [type, {
	onResponse: ({ requestOptions }) => {
		const value = URL.createObjectURL(requestOptions.file);
		urls.push(value);
		return { value };
	}
}]));
onBeforeUnmount(() => urls.forEach(url => URL.revokeObjectURL(url)));
</script>

<style scoped>
.demo p { margin: 8px 0 0; font-size: 13px; }
.demo button { padding: 6px 10px; }
</style>
```
:::

## API

以下属性、事件、插槽和方法适用于 `UploadPicker` 与 `MUploadPicker`，平台差异在对应行说明。下文 `PickerType` 表示 `'image' | 'video' | 'audio' | 'file'`，仅用于解释数据结构。

### 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| modelValue | 文件数据；字符串按逗号分隔，`max=1` 时整个字符串视为一个地址 | `string \| object \| (string \| object)[]` | - | `[]` |
| picker | 文件类型及输出分组顺序 | `PickerType[]` | `image`、`video`、`audio`、`file` | `['image']` |
| sortable | 在同一文件类型内排序 | `boolean` | - | `false` |
| mask | 排序时显示操作遮罩 | `boolean` | - | `false` |
| uploadOptions | 各类型内层 Upload/MUpload 的属性与 `onXxx` 回调配置 | `Partial<Record<PickerType, object>>` | - | `{}` |
| max | 数字限制总数量；对象分别限制各类型，未配置或为 0 的类型不显示入口；上传中及失败项也占数量 | `number \| Partial<Record<PickerType, number>>` | - | `Number.MAX_SAFE_INTEGER` |
| disabled | 隐藏上传入口及正常项删除按钮；仍可预览，失败项仍可删除，不禁止排序或实例方法 | `boolean` | - | `false` |
| formatter | 转换 `(response, file, type)`；返回 undefined 使用默认转换，对象与默认项合并，其他值作为地址 | `Function` | - | - |
| output | 输出项格式；函数接收内部项，返回假值时保留该项 | `string \| Function` | `'object'`、`'string'`、函数 | `'object'` |
| keyValue | 名称和地址的字段映射 | `{ label: string; value: string }` | - | `{ label: 'label', value: 'value' }` |
| boxClass | 默认上传方块的 class | `string` | - | - |
| imagePreviewOptions | 当前读取 `enhancer(current, images, instance)`；返回真值接管图片预览 | `object` | - | `{}` |
| imageClass | 图片内容的 class | `string` | - | - |
| videoClass | 视频内容的 class | `string` | - | - |
| audioClass | 音频内容的 class | `string` | - | - |
| fileClass | 普通文件内容的 class | `string` | - | - |
| enhancer | 仅桌面端默认入口生效；函数接收 `(instance, type)`，返回真值阻止原生选择；true 使用全局 UploadPicker.enhancer | `boolean \| Function` | - | `false` |
| compressOptions | 保留的图片压缩配置，当前尚未执行压缩 | `object` | - | `{ compress: false, width: 0, height: 0, filetype: 'image/jpeg', encoderOptions: 0.92 }` |
| showError | 上传错误提示；桌面端 Message，移动端 MToast | `boolean` | - | `false` |

`uploadOptions.<type>.showError` 可覆盖外层 `showError`。生命周期中的 `onFileBefore/onFileStart/onFileProgress/onFileSuccess/onFileError/onError/onComplete` 由 Picker 接管，应在 Picker 上监听对应事件；Picker 不公开 `file-progress`。请求相关的 `onRequest/onResponse` 放在 `uploadOptions.<type>` 中。

### 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| update:modelValue | 同步数据 | `value` | 转换后的数据 |
| change | 上传周期完成、排序、添加或删除正常项时触发 | `value` | 同 update:modelValue |
| file-before | 上传前处理或取消文件 | `{ file, rawFiles, type }` | 可返回 false、void、Blob、文件属性对象或 Promise |
| file-start | 开始上传 | `{ file, type }` | file 包含 uploadId/name/size/target/percent/current/total |
| file-success | 上传成功 | `{ response, file, result, type }` | response 为响应，result 为周期累计结果 |
| file-error | 上传阶段失败 | `{ stage, cause, message, file, result, type }` | stage 为 'upload'；前置取消不会触发 |
| error | 内层上传错误 | `{ cause, type }` | cause 为错误信息 |
| complete | 一个类型的一次上传周期结束 | `{ result, type }` | result 含 total/completed/succeeded/failed/responses/queues |
| remove-before | 删除前等待回调完成 | `(typeIndex, type)` | 等待返回的 Promise；reject 中止删除，返回 false 不会中止 |

上传事件接收一个对象参数，`type` 表示文件类型。回调类型可从 `@deot/vc` 导入 `UploadPickerCallback`。`file-before` 和 `remove-before` 在 JSX 中分别对应 `onFileBefore` 和 `onRemoveBefore`。

### 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 替换完整文件项 | `{ row, type, index, typeIndex }`；index 为可预览列表索引，不可预览项为 -1；typeIndex 为类型内原始索引 |
| upload | 自定义上传入口 | `{ type }` |

### 方法

通过组件 ref 调用，桌面端与移动端一致。

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| add | 解析并追加数据，触发同步；不检查 max | `source = []`，按当前 modelValue 形态解析 | `void` |
| remove | 等待删除前回调并删除指定项 | `(typeIndex, type)` | `Promise<void>` |
| reset | 用数组替换内部列表并通知 FormItem，不触发 update:modelValue/change | `source = []`，必须为数组 | `void` |

### 数据行为

- 单一 picker 类型作为未声明 type 的默认类型；多个类型时根据地址扩展名识别，无法识别的归为 file。Blob URL 等无扩展名地址应显式指定 type。
- 字符串 modelValue 保持字符串输出；output='object'、max=1 且 modelValue 为对象或 null 时保持单对象输出，删除后为 null。其余通常输出数组。
- 失败项在当前内部列表中显示，不写入输出数据；外部 modelValue 变化会重新解析列表。删除失败项只清理内部项，不触发同步。
- 数据按 picker 顺序分组输出，排序只发生在单一类型内。删除上传中项目不等同于取消底层请求。
- add/reset 复用当前数据解析方式；实例方法管理数组数据时建议使用数组 modelValue。
