## 文件选择上传（UploadPicker）

统一选择、预览、排序和删除图片、视频、音频及普通文件。桌面端使用 `UploadPicker`，移动端使用 `MUploadPicker`，共享数据与事件 API。

### 何时使用

需要在表单内管理上传后的文件列表时使用。图片、音视频、文件都在查看器中预览：图片可缩放，音视频可播放，PDF 与 Office 文件内嵌预览并提供新窗口打开。预览与 `FilePreview` 共用同一套流程和全局配置。

### 基础用法

只有图片时为方格，添加入口在末尾。选择本地图片后可以预览、删除和排序，最多保留 3 张。示例通过 `onResponse` 生成临时 URL，仅演示本地流程。实际上传请在 `uploadOptions.image` 中设置 `url`，响应包含 `value` 或 `source`；其他响应格式通过 `formatter` 转换。

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

### 多种文件：一个入口

无论有几种类型，界面上只有一个上传入口，所有文件按添加顺序放在一个列表里，`v-model` 也按这个顺序输出。每种类型仍各有一个隐藏的 Upload，按类型的 `accept`、`max`、`uploadOptions` 不变：

- 桌面端：入口本身是一个 Upload，`accept` 为还能上传的类型的并集，可点击选择，也可把文件拖到入口上；可一次混选多种文件，通过校验后按各类型的 `accept`（按 `picker` 顺序先匹配先得）分组交给各自的 Upload。都不支持、或超出数量时与 Upload 一样提示（经过 `onMessage`）并发出 `error`。只剩一种类型时，入口沿用该类型的 `uploadOptions`（`enhancer`、`size`、`directory` 等）。
- 移动端：只有一种类型（或只剩一种类型还能上传）时直接打开它的选择；多种类型时先用 ActionSheet 选择类型，再打开该类型的原生选择，相册、拍照与 `capture` 照旧。

`type` 决定布局，不传时按 `picker` 自动选择：只有图片、视频为 `grid`，只有音频、文件为 `list`，两者都有为 `group`。

- `grid`：全部为方格（音频、文件为标记加文件名），添加入口是列表末尾的虚线方格。
- `list`：全部为整行（图片、视频行首为缩略图），入口是列表上方的按钮（主色浅色底与描边，悬停时文字与描边为主色）。行的最大宽度为 `--vc-file-preview-row-max-width`（默认 480px）。
- `group`：图片、视频的方格在前，音频、文件的整行在后，入口在上方；只是分块显示，输出顺序不变，排序只在同一块内进行。

上传中方格显示百分比与带轨道的细进度条，整行在右侧显示百分比、底部显示进度条，传完等待服务端响应时显示「服务器正在接收...」；失败时显示「上传失败」与「重试」（方格红色描边），点「重试」用原文件重新上传；删除浮在右上角。文件项与 `FilePreview` 共用，`size` 同 FilePreview，不传时方格为 `small`（64px）、整行为 `medium`（行高 46px）。

:::playground
<!-- <config lang="json5">{ previewInset: 20 }</config> -->
```vue
<template>
	<div class="demo">
		<RadioGroup v-model="type" type="card">
			<Radio v-for="item in types" :key="item" :value="item" :label="item || 'auto'" />
		</RadioGroup>
		<UploadPicker
			v-model="files"
			:type="type || undefined"
			:picker="['image', 'video', 'audio', 'file']"
			:max="{ image: 2, video: 1, audio: 1, file: 2 }"
			sortable
			:upload-options="uploadOptions"
		/>
		<p>已选择 {{ files.length }} 个文件；点击已上传的项预览。</p>
	</div>
</template>

<script setup>
import { ref, onBeforeUnmount } from 'vue';
import { UploadPicker, RadioGroup, Radio } from '@deot/vc';

const types = ['', 'list', 'grid', 'group'];
const type = ref('');
const files = ref([]);
const urls = [];
const uploadOptions = Object.fromEntries(['image', 'video', 'audio', 'file'].map(item => [item, {
	onResponse: ({ requestOptions }) => {
		const value = URL.createObjectURL(requestOptions.file);
		urls.push(value);
		return { value };
	}
}]));
onBeforeUnmount(() => urls.forEach(url => URL.revokeObjectURL(url)));
</script>

<style scoped>
.demo { display: grid; gap: 16px; }
.demo p { margin: 0; font-size: 13px; }
</style>
```
:::

### 自定义入口、文件项和实例方法

`upload` 插槽替换整个上传入口，参数为 `{ types }`，点击后的行为同默认入口。默认插槽替换整个文件项，包括内置预览与删除控件，参数为 `{ row, type, index, position }`：`position` 是在列表中的位置，用于 `remove`；`index` 是过滤失败、未完成项后的预览索引，不适合用于删除。

:::playground
<!-- <config lang="json5">{ previewInset: 20 }</config> -->
```vue
<template>
	<div class="demo">
		<div class="actions">
			<button type="button" @click="handleAdd">添加示例文件</button>
			<button type="button" @click="handleReset">重置视图</button>
		</div>
		<UploadPicker ref="picker" v-model="files" :picker="['image', 'file']" type="list">
			<template #upload="{ types }">
				<button type="button">选择{{ types.map(item => labels[item]).join('或') }}</button>
			</template>
			<template #default="{ row, position }">
				<button class="file" type="button" @click="handleRemove(position)">{{ row.label }} ×</button>
			</template>
		</UploadPicker>
		<p>modelValue 中有 {{ files.length }} 项；reset 仅重置内部视图，不更新 modelValue。</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { UploadPicker } from '@deot/vc';

const labels = { image: '图片', file: '文件' };
const picker = ref();
const files = ref([]);
const handleAdd = () => {
	picker.value.add([{ type: 'file', label: '说明.txt', value: 'data:text/plain,UploadPicker' }]);
};
const handleRemove = position => picker.value.remove(position);
const handleReset = () => picker.value.reset();
</script>

<style scoped>
.demo { display: grid; gap: 16px; }
.actions { display: flex; flex-wrap: wrap; gap: 8px; }
.file { overflow-wrap: anywhere; }
.demo p { margin: 0; font-size: 13px; }
</style>
```
:::

### 移动端

`MUploadPicker` 的属性、事件、插槽、结构与 `UploadPicker` 相同，根节点另有标记类 `.vcm-upload-picker`；尺寸按 750 稿随 `--vc-rem` 缩放，375 宽下与桌面端同 px：

- 方格以 `size` 为最小边长（默认 small，128，即 375 宽下 64px），均分铺满一行，屏幕变宽时每行多放几个；整行默认 medium，行高 92（46）。
- 删除为右上角的半透明黑底角标 36（18），与项的右上角贴合。
- 多种类型时，点「上传」先选类型（图片、视频、音频、文件），再打开该类型的原生选择；选项名使用 `vc.UploadPicker` 下的 locale。
- 预览打开移动端查看器（只保留关闭按钮，计数在底部），见 FilePreview 的「移动端」。

:::playground
<!-- <config lang="json5">{ viewport: [375, 400], previewInset: 20 }</config> -->
```vue
<template>
	<div class="demo">
		<MUploadPicker
			v-model="files"
			:picker="['image', 'file']"
			:upload-options="uploadOptions"
		/>
		<p>已选择 {{ files.length }} 个文件；点击已上传的项预览。</p>
	</div>
</template>

<script setup>
import { ref, onBeforeUnmount } from 'vue';
import { MUploadPicker } from '@deot/vc';

const files = ref([]);
const urls = [];
const uploadOptions = Object.fromEntries(['image', 'file'].map(type => [type, {
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
</style>
```
:::

## 主题与局部覆盖

全局参数通过 `--vc-<参数>` 配置，单个组件通过 `--vc-upload-picker-<参数>` 覆盖。文件项（方格、整行）的颜色与尺寸来自 FilePreview，见 FilePreview 的「主题与局部覆盖」；这里只列上传入口、上传状态与删除。

移动端删除角标的底色（`rgb(0 0 0 / 30%)`）为固定值，不随主题变化。上传按钮的底色、描边与进度轨道使用 FilePreview 根节点上的 `--vc-file-primary-10`、`--vc-file-primary-20`（color-primary-light 与透明色混合），添加方格的底色使用 `--vc-file-surface`。

### 全局

| 参数 | 使用位置 | 值 |
| --- | --- | --- |
| color-contrast-light | 删除图标 | `#FFFFFF`（亮暗主题相同） |
| color-dark-light | 上传按钮文字、方格上传百分比 | 亮色：`#080F20`；暗色：`#E8E8E8` |
| color-dark-extralight | 添加方格文字、整行上传百分比、服务端接收中 | 亮色：`#909399`；暗色：`#B9B9B9` |
| color-error | 上传失败文字、方格失败描边 | `#F53F3F` |
| color-neutral-light | 添加方格虚线边框 | 亮色：`#EDEFF1`；暗色：`#3B4354` |
| color-primary | 悬停（按下）时上传入口的文字与描边、「重试」、进度条 | `#456CF6` |
| color-primary-light | 上传按钮底色与描边、方格进度条轨道（20%）、桌面端删除按钮背景 | `#4A96FF` |

### 局部

上传入口与状态的尺寸，桌面端为下表的 px；`MUploadPicker` 按 ×2 换成 750 稿（375 宽下与桌面端相同）。

| 参数 | 使用位置 | 值 |
| --- | --- | --- |
| font | 根节点字号 | `12px` |
| trigger-padding-y / trigger-padding-x | 上传按钮的上下、左右内边距 | `4px` / `16px` |
| trigger-font / trigger-line | 上传按钮字号、行高 | `13px` / `20px` |
| trigger-radius / trigger-gap / trigger-icon | 上传按钮圆角、图标与文字间距、图标大小 | `8px` / `4px` / `14px` |
| bar / meter | 整行底部进度条、方格进度轨道的粗细 | `2px` / `3px` |
| failed-gap | 整行里「上传失败」与「重试」的间距 | `8px` |
| overlay-padding / overlay-gap | 方格覆盖层（上传中、失败）的左右内边距、行间距 | `4px` / `2px` |

## API

以下属性、事件、插槽和方法适用于 `UploadPicker` 与 `MUploadPicker`，平台差异在对应行说明。下文 `PickerType` 表示 `'image' | 'video' | 'audio' | 'file'`，仅用于解释数据结构。

### 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| modelValue | 文件数据；字符串按逗号分隔，`max=1` 时整个字符串视为一个地址 | `string \| object \| (string \| object)[]` | - | `[]` |
| picker | 可上传的文件类型；顺序决定选择框按 accept 匹配的先后与移动端选项的顺序 | `PickerType[]` | `image`、`video`、`audio`、`file` | `['image']` |
| type | 布局：`list` 全部整行，`grid` 全部方格，`group` 图片、视频方格在前、音频、文件整行在后；不传时按 `picker` 自动选择 | `string` | `list`、`grid`、`group` | - |
| size | 方格与整行的尺寸，同 FilePreview | `string` | `mini`、`small`、`medium`、`large` | 方格 `small`，整行 `medium` |
| sortable | 拖动排序；`group` 时在同一块内排序 | `boolean` | - | `false` |
| mask | 排序时显示操作遮罩 | `boolean` | - | `false` |
| uploadOptions | 各类型内层 Upload/MUpload 的属性与 `onXxx` 回调配置 | `Partial<Record<PickerType, object>>` | - | `{}` |
| max | 数字限制总数量；对象分别限制各类型，未配置或为 0 的类型不能上传；上传中及失败项也占数量；所有类型都满时不显示入口 | `number \| Partial<Record<PickerType, number>>` | - | `Number.MAX_SAFE_INTEGER` |
| disabled | 隐藏上传入口及正常项删除按钮；仍可预览，失败项仍可删除，不禁止排序或实例方法 | `boolean` | - | `false` |
| formatter | 转换 `(response, file, type)`；返回 undefined 使用默认转换，对象与默认项合并，其他值作为地址 | `Function` | - | - |
| output | 输出项格式；函数接收内部项，返回假值时保留该项 | `string \| Function` | `'object'`、`'string'`、函数 | `'object'` |
| keyValue | 名称和地址的字段映射 | `{ label: string; value: string }` | - | `{ label: 'label', value: 'value' }` |
| boxClass | 默认上传入口（添加方格或上传按钮）的 class | `string` | - | - |
| enhancer | 打开原生选择前调用；函数接收 `{ instance, type, types }`，返回真值表示已自行处理、不再打开；`type` 为这次要选的类型，桌面端多种类型一次选择时为空；true 使用全局 UploadPicker.enhancer | `boolean \| Function` | - | `false` |
| showError | 上传错误提示；桌面端 Message，移动端 MToast | `boolean` | - | `false` |

`uploadOptions.<type>.showError` 可覆盖外层 `showError`。生命周期中的 `onFileBefore/onFileStart/onFileProgress/onFileSuccess/onFileError/onError/onComplete` 由 Picker 接管，应在 Picker 上监听对应事件；Picker 不公开 `file-progress`。请求相关的 `onRequest/onResponse` 放在 `uploadOptions.<type>` 中；只剩一种类型（桌面端入口沿用其属性）或移动端选好类型后，会经过该类型 Upload 的 `enhancer`；桌面端多种类型一次选择时经过全局 `Upload.enhancer`。

### 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| update:modelValue | 同步数据 | `value` | 转换后的数据，按列表顺序 |
| change | 上传周期完成、排序、添加或删除正常项时触发 | `value` | 同 update:modelValue |
| file-before | 上传前处理或取消文件 | `{ file, rawFiles, type }` | 可返回 false、void、Blob、文件属性对象或 Promise |
| file-start | 开始上传 | `{ file, type }` | file 包含 uploadId/name/size/target/percent/current/total |
| file-success | 上传成功 | `{ response, file, result, type }` | response 为响应，result 为周期累计结果 |
| file-error | 上传阶段失败 | `{ stage, cause, message, file, result, type }` | stage 为 'upload'；前置取消不会触发 |
| error | 上传错误 | `{ cause, type }` | cause 为错误信息；桌面端入口拒绝（都不支持、超出总数）时 type 为空 |
| complete | 一个类型的一次上传周期结束 | `{ result, type }` | result 含 total/completed/succeeded/failed/responses/queues |
| remove-before | 删除前等待回调完成 | `(position, type)` | position 为在列表中的位置；等待返回的 Promise，reject 中止删除，返回 false 不会中止 |

上传事件接收一个对象参数，`type` 表示文件类型。回调类型可从 `@deot/vc` 导入 `UploadPickerCallback`。`file-before` 和 `remove-before` 在 JSX 中分别对应 `onFileBefore` 和 `onRemoveBefore`。

### 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 替换完整文件项 | `{ row, type, index, position }`；index 为可预览列表索引，不可预览项为 -1；position 为在列表中的位置 |
| upload | 替换整个上传入口，点击后的行为同默认入口 | `{ types }`：picker 中有效的类型 |

### 方法

通过组件 ref 调用，桌面端与移动端一致。

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| add | 解析并追加到列表末尾，触发同步；不检查 max | `source = []`，按当前 modelValue 形态解析 | `void` |
| remove | 等待删除前回调并删除指定项 | `(position)` | `Promise<void>` |
| reset | 用数组替换内部列表并通知 FormItem，不触发 update:modelValue/change | `source = []`，必须为数组 | `void` |

### 预览

- 点击上传成功的项时调用 `FilePreview.open`：先执行全局 `VcInstance.options.FilePreview.enhancer`，返回真值（或 resolve 真值）表示已接管；否则打开查看器，包含所有上传成功的项（不分类型），按列表顺序排列，并定位到点击的那一项。
- `enhancer` 收到 `{ current, data, instance }`：`data` 每项为 `{ ...内部项, type, source, name }`，`source`、`name` 分别取自 `keyValue.value`、`keyValue.label`；`instance` 为 UploadPicker 实例。
- 原 `imagePreviewOptions` 与 `VcInstance.options.ImagePreview.enhancer` 已移除，改用 `VcInstance.options.FilePreview.enhancer`，对所有文件类型生效。

### 数据行为

- 只有一种 picker 类型时作为未声明 type 的默认类型；多个类型时通过 `VcInstance.options.FilePreview.getFileType` 识别，未配置或返回空值时按地址扩展名识别，无法识别的归为 file；不在 picker 中的类型被忽略。Blob URL 等无扩展名地址应显式指定 type。`getFileType` 在解析 modelValue 时读取，修改后需重新设置 modelValue 才会重新识别。
- 未提供 label 的项通过 `VcInstance.options.FilePreview.getFileName` 推导名称，未配置或返回空值时取地址最后一段（去掉 `?`、`#` 之后的部分并解码）；推导出的 label 会写入输出数据。
- 字符串 modelValue 保持字符串输出；output='object'、max=1 且 modelValue 为对象或 null 时保持单对象输出，删除后为 null。其余通常输出数组。
- 失败项在当前内部列表中显示，不写入输出数据；删除失败项只清理内部项，不触发同步。
- 外部 modelValue 变化时与当前列表协调，而不是整表重建：同一对象、同一地址的项沿用原来的项（不重新挂载，上传时得到的名称等不丢）；上传中的项留在原位；原样回写刚同步出去的值（`v-model` 的常规用法，包括拷贝后回写）时，失败项也留在原位。
- 失败项保留了上传时的原始文件时显示「重试」：移除该项，用原文件重新走一遍该类型的上传，事件、`onFileBefore` 与 `uploadOptions` 照常生效；通过 `add` 等方式放入、没有原始文件的失败项不显示「重试」。
- 删除上传中项目不等同于取消底层请求。add/reset 复用当前数据解析方式；实例方法管理数组数据时建议使用数组 modelValue。

### 从按类型分块的版本迁移

- 每种类型各自的上传入口合并为一个；`upload` 插槽的参数由 `{ type }` 改为 `{ types }`，只渲染一次。
- 列表不再按类型分组，输出按添加顺序；需要按类型分开时在外层按 `type` 过滤。
- 默认插槽参数 `typeIndex` 改为 `position`（在整个列表中的位置）；`remove(typeIndex, type)` 改为 `remove(position)`；`remove-before` 的参数改为 `(position, type)`。
- 方格不再是固定的 64px：大小由 `size` 决定，每行放几个按容器宽度自动计算；整行列表的最大宽度为 `--vc-file-preview-row-max-width`。
- `imageClass`、`videoClass`、`audioClass`、`fileClass` 去掉，文件项改用 FilePreview 的共用样式，可通过默认插槽自定义。
- `compressOptions` 去掉（从未生效）。
- `enhancer` 的参数增加 `types`；桌面端多种类型一次选择时 `type` 为空。移动端的入口也会调用 `enhancer`。
- 只使用图片（`picker` 为默认值）时外观不变。
