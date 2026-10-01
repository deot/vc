## 文件预览（FilePreview）

展示一组文件（图片、视频、音频、其他文件），点击后按类型打开预览。`ImagePreview.open` 用于直接打开图片预览。

### 何时使用

- 在详情页展示已上传的附件、图片或视频。
- 需要统一控制文件类型识别和预览方式（如接入在线文档预览）。

### 基础用法

`data` 可以是逗号分隔的字符串、地址数组或对象数组。默认 `type="mix"`：按 `data` 顺序混编成紧凑的卡片（按内容宽度，超出最大宽度时省略名称），图片和提供 `thumbnail` 的视频显示缩略图，其余只显示名称。点击后：图片打开多图预览（只包含图片项），视频、音频打开播放弹窗，其他文件在新窗口打开。

:::playground
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<FilePreview :data="data" />
</template>

<script setup>
import { FilePreview } from '@deot/vc';

const data = [
	{ source: 'https://dummyimage.com/1800x600/555/fff.png?text=banner', name: 'banner.png' },
	{ source: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', name: '示例文件-2026.pdf' },
	'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
	'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3',
	{ source: 'https://dummyimage.com/600x1800/555/fff.png?text=detail', name: 'detail.png' }
];
</script>
```
:::

### 分组展示

`type="group"` 按图片、视频、音频、文件的顺序分组：图片、视频使用方格，音频卡片带播放标记，文件卡片带扩展名。分组只影响展示，预览时的顺序与索引仍按 `data` 原始顺序。

:::playground
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<FilePreview :data="data" type="group" />
</template>

<script setup>
import { FilePreview } from '@deot/vc';

const data = [
	{ source: 'https://dummyimage.com/1800x600/555/fff.png?text=1', name: '1.png' },
	{ source: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', name: '示例文件-2026.pdf' },
	'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
	{ source: 'https://dummyimage.com/600x1800/555/fff.png?text=2', name: '2.png' },
	'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3'
];
</script>
```
:::

### 尺寸、方向与缩略图

`size` 控制方格、卡片与文字的尺寸，默认 `medium`（方格 96px，卡片高 32px、最大宽 200px）。`vertical` 使每组内纵向排列。图片和视频的 `thumbnail` 优先用于展示，预览使用 `source`；分组展示的视频没有 `thumbnail` 时使用原生 `<video preload="metadata">` 展示，能否显示首帧取决于浏览器及媒体资源。`previewable` 为 `false` 时禁用默认文件项的点击预览。

:::playground
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<div class="demo">
		<div class="toolbar">
			<RadioGroup v-model="size" type="button">
				<Radio v-for="item in sizes" :key="item" :value="item" :label="item" />
			</RadioGroup>
			<Checkbox v-model="isVertical">vertical</Checkbox>
			<Checkbox v-model="isPreviewable">previewable</Checkbox>
		</div>
		<FilePreview
			:data="data"
			:size="size"
			:vertical="isVertical"
			:previewable="isPreviewable"
			type="group"
		/>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { FilePreview, RadioGroup, Radio, Checkbox } from '@deot/vc';

const sizes = ['mini', 'small', 'medium', 'large'];
const size = ref('medium');
const isVertical = ref(false);
const isPreviewable = ref(true);
const data = [
	{
		source: 'https://dummyimage.com/1800x600/555/fff.png?text=source',
		thumbnail: 'https://dummyimage.com/96x96/2d8cf0/fff.png?text=thumb',
		name: 'source.png'
	},
	{
		source: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
		thumbnail: 'https://dummyimage.com/96x96/1db88c/fff.png?text=cover'
	},
	'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'
];
</script>

<style scoped>
.toolbar {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 16px;
	margin-bottom: 16px;
}
</style>
```
:::

### 自定义文件项

`default` 插槽替换每一项的内容，参数为 `{ row, index, preview }`。使用插槽后外层不再绑定点击，由插槽调用 `preview()` 打开预览；`preview()` 同样先经过全局 `enhancer`，且不受 `previewable` 限制。

:::playground
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<FilePreview :data="data" vertical>
		<template #default="{ row, preview }">
			<div class="row">
				<span class="name">{{ row.name }}</span>
				<Button size="small" @click="handlePreview(preview)">预览</Button>
				<a :href="row.source" target="_blank" rel="noopener">新窗口打开</a>
			</div>
		</template>
	</FilePreview>
</template>

<script setup>
import { Button, FilePreview } from '@deot/vc';

const handlePreview = preview => preview();
const data = [
	{ source: 'https://dummyimage.com/1800x600/555/fff.png?text=1', name: '1.png' },
	'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
	{ source: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', name: '示例文件-2026.pdf' }
];
</script>

<style scoped>
.row {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 12px;
	font-size: 13px;
}

.name {
	width: 120px;
	max-width: 100%;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.row a {
	cursor: pointer;
}
</style>
```
:::

### 全局配置

`VcInstance.options.FilePreview` 由 FilePreview、UploadPicker 与 Editor 共用：

- `getFileType(source)`：自定义类型识别，返回空值时回退内置规则。
- `getFileName(source)`：自定义从地址推导文件名，返回空值时回退内置规则；数据中显式的 `name`（UploadPicker 为 `label`）优先。
- `enhancer({ current, data, instance })`：预览前调用，返回真值（或 resolve 真值）表示已接管，不再执行内置预览（Editor 不使用）。

示例中带处理后缀的图片地址（内置规则会识别为文件）被识别为图片，文件名去掉时间戳前缀，文件交给 `enhancer` 处理。

:::playground
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<div>
		<FilePreview :data="data" type="group" />
		<p class="tip">{{ tip }}</p>
	</div>
</template>

<script setup>
import { ref, onBeforeUnmount } from 'vue';
import { FilePreview, VcInstance } from '@deot/vc';

const original = { ...VcInstance.options.FilePreview };
const tip = ref('点击文件，由 enhancer 接管');
const data = [
	{ source: 'https://dummyimage.com/800x600/555/fff/?text=photo.jpg!4-4', name: 'photo.jpg!4-4' },
	'https://example.com/files/1695123_%E7%A4%BA%E4%BE%8B%E6%96%87%E4%BB%B6.pdf'
];

VcInstance.configure({
	FilePreview: {
		getFileType: source => (/\.jpg!/.test(source) ? 'image' : undefined),
		getFileName: (source) => {
			const name = decodeURIComponent(source.split('/').pop());
			return name.replace(/^\d+_/, '');
		},
		enhancer: ({ current, data: items }) => {
			const item = items[current];
			if (item.type !== 'file') return false;
			tip.value = `enhancer 接管：${item.name}`;
			return true;
		}
	}
});

onBeforeUnmount(() => VcInstance.configure({ FilePreview: original }));
</script>

<style scoped>
.tip {
	margin: 12px 0 0;
	font-size: 13px;
}
</style>
```
:::

### 图片预览（ImagePreview）

`ImagePreview.open` 直接打开图片预览（基于 PhotoSwipe），不经过 `enhancer`。

:::playground
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<Button @click="handleClick">从第 2 张打开</Button>
</template>

<script setup>
import { Button, ImagePreview } from '@deot/vc';

const handleClick = () => {
	ImagePreview.open({
		current: 1,
		data: [
			'https://dummyimage.com/1800x600/555/fff.png?text=1',
			'https://dummyimage.com/600x1800/555/fff.png?text=2',
			'https://dummyimage.com/800x600/555/fff.png?text=3'
		]
	});
};
</script>
```
:::

## API

### FilePreview 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| data | 文件数据；字符串按逗号分隔，数组项为地址或数据项对象，没有 `source` 的项会被忽略 | `string \| (string \| object)[]` | - | `[]` |
| type | 展示方式（与数据项的文件类型无关）：`mix` 按顺序混编，`group` 按文件类型分组 | `'mix' \| 'group'` | `mix` / `group` | `mix` |
| size | 尺寸 | `'mini' \| 'small' \| 'medium' \| 'large'` | `mini` / `small` / `medium` / `large` | `medium` |
| vertical | 纵向排列；`group` 时作用于每组 | `boolean` | - | `false` |
| previewable | 点击是否预览；使用 `default` 插槽时由插槽调用 `preview` | `boolean` | - | `true` |

数据项（字符串会解析为 `{ source }`）：

| 字段 | 说明 | 类型 |
| --- | --- | --- |
| source | 文件地址，预览时使用 | `string` |
| type | 文件类型；不传或不合法时通过 `getFileType` 识别 | `'image' \| 'video' \| 'audio' \| 'file'` |
| name | 名称；不传或为空字符串时通过 `getFileName` 推导，内置规则取地址最后一段（去掉 `?`、`#` 之后的部分并解码） | `string` |
| thumbnail | 图片、视频的展示缩略图；音频和普通文件忽略此字段 | `string` |

其他字段原样保留，可在插槽和 `enhancer` 中读取。

### FilePreview 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 替换每一项的内容；外层不再绑定点击 | `{ row, index, preview }`：`row` 为解析后的数据项，`index` 为解析后列表中的索引，`preview()` 打开该项的预览并返回 Promise |

### FilePreview 方法

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| FilePreview.open | 先调用全局 `enhancer`，未接管时按类型打开内置预览 | `{ data, current?, instance? }`：`data` 同属性 `data`，`current` 为解析后列表的索引，默认 `0`；`instance` 默认 `null` | `Promise<void>`；调用完成不表示预览已关闭 |

### ImagePreview 方法

`ImagePreview` 是提供静态方法的对象，不是可渲染的 Vue 组件。

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| ImagePreview.open | 直接打开 PhotoSwipe 图片预览，不经过 `FilePreview.enhancer` | `{ data, current?, ...photoswipeOptions }`：`current` 从 `0` 开始，默认 `0`；`data` 为地址数组或对象数组，图片地址依次取 `value`、`source`、`src`，可带 `width`、`height` | `Promise<void>`；调用完成不表示预览已关闭 |

其他选项透传给 PhotoSwipe；本封装不把 `onClose` 绑定到 PhotoSwipe 的关闭事件。`closeTitle`、`zoomTitle`、`arrowPrevTitle`、`arrowNextTitle`、`errorMsg` 默认使用当前 locale，可以通过同名选项覆盖（包括空字符串）。切换语言后，下次打开图片预览使用新语言；音视频弹窗的关闭按钮名称随语言实时更新。

### 全局配置

通过 `VcInstance.configure({ FilePreview: { ... } })` 设置，FilePreview 与 UploadPicker 共用；Editor 按地址插入资源时也读取 `getFileType`、`getFileName`。

| 属性 | 说明 | 类型 |
| --- | --- | --- |
| getFileType | 自定义类型识别，参数为地址或文件名；返回空值或非法类型时回退内置规则 | `(source: string) => 'image' \| 'video' \| 'audio' \| 'file' \| null \| undefined \| void` |
| getFileName | 自定义从地址推导文件名；返回空值时回退内置规则。只在数据未提供名称时调用 | `(source: string) => string \| null \| undefined \| void` |
| enhancer | 预览前调用；返回真值（或 resolve 真值）表示已接管，不再执行内置预览。`data` 为解析后的列表，`instance` 为调用方组件内部实例或 `null` | `({ current, data, instance }) => unknown` |

### 使用注意

- 内置类型规则按扩展名识别（忽略 `?`、`#` 之后的部分）：
  - image：`jpg`、`jpeg`、`png`、`gif`、`bmp`、`webp`、`image`、`heic`
  - video：`mp4`、`mov`、`avi`、`mpg`、`mpeg`、`rmvb`
  - audio：`mp3`、`aac`、`wav`、`flac`、`ape`、`ogg`、`m4a`
  - 其余为 file。没有扩展名的地址可在数据项中传 `type`，或配置 `getFileType`。
- 内置预览：图片打开多图预览，只包含 `data` 中的图片项；视频、音频打开播放弹窗；其他文件通过 `window.open` 在新窗口打开。Office、PDF 等在线预览可通过 `enhancer` 接入。
- 属性 `type` 表示展示方式，数据项的 `type` 表示文件类型，两者含义不同。
- 颜色使用主题变量，可通过以下变量单独覆盖：
  - `--vc-file-preview-background-color`：卡片、方格底色
  - `--vc-file-preview-color-dark-light`：名称
  - `--vc-file-preview-color-primary`：悬停文字、音频标记、扩展名
  - `--vc-file-preview-color-primary-lighter`：悬停底色、音频标记与扩展名底色
  - `--vc-file-preview-mask-color`、`--vc-file-preview-color-light`：视频播放标记
  - `--vc-file-preview-border-shadow`：方格悬停阴影
  - `--vc-file-preview-preview-background-color`：视频、音频播放弹窗的背景，默认 `#000`
  - `--vc-file-preview-preview-close-color`：视频、音频关闭按钮的颜色，默认 `#fff`
- 音视频弹窗也兼容显式设置 `--vc-file-preview-color-dark`（背景）和 `--vc-file-preview-color-light`（关闭按钮）；专属 `preview-*` 变量优先。预览弹窗挂载在页面外层，覆盖变量需设置在其能继承的祖先（如 `:root`）上。
- 图片预览使用 PhotoSwipe 自带的深色画布及 `--pswp-*` 变量，保持媒体显示与控件对比度，不随页面主题反转。
- 尺寸默认按 Sass `$scale` 缩放；由根节点上按 `size` 设置的变量控制，可在 `style` 中覆盖：
  - 方格：`--vc-file-preview-square-size`、`--vc-file-preview-square-radius`、`--vc-file-preview-play-size`
  - 卡片：`--vc-file-preview-card-width`（最大宽度）、`--vc-file-preview-card-height`、`--vc-file-preview-card-padding`、`--vc-file-preview-card-radius`、`--vc-file-preview-thumbnail-size`、`--vc-file-preview-dot-size`、`--vc-file-preview-text-size`、`--vc-file-preview-inner-gap`
  - 间距：`--vc-file-preview-gap`
- `MFilePreview`、`MImagePreview` 分别是 `FilePreview`、`ImagePreview` 的别名。

### 从 ImagePreview 迁移

- 组件 `ImagePreview`（`vc-image-preview`）改为 `FilePreview`（`vc-file-preview`）；`ImagePreview` 只保留 `open` 方法，不再注册为组件。
- `VcInstance.options.ImagePreview.enhancer` 移除，改用 `VcInstance.options.FilePreview.enhancer`，参数改为 `{ current, data, instance }`，且对所有文件类型生效。
- 视频、音频播放弹窗的主题变量前缀由 `--vc-upload-picker-*` 改为 `--vc-file-preview-*`。
