## 文件预览（FilePreview）

展示一组文件（图片、视频、音频、其他文件），点击后在同一个查看器中预览。`ImagePreview.open` 用于直接打开图片预览。

### 何时使用

- 在详情页展示已上传的附件、图片或视频。
- 需要统一控制文件类型识别和预览方式（如接入在线文档预览）。

### 基础用法

`data` 可以是逗号分隔的字符串、地址数组或对象数组。点击后打开查看器，包含 `data` 中的全部项并定位到点击的那一项：图片可缩放、拖动，视频、音频使用原生播放控件，PDF 与 Office 文件内嵌预览。“新窗口打开”使用当前预览地址（Office 为在线预览地址）；“下载”使用文件本身的地址。没有内嵌预览时，文件名与按钮分两行。

文件项与 `UploadPicker` 共用两种样式：整行（缩略图或文件标记、文件名）与方格（图片、视频铺满，音频、文件为标记加文件名）。

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

### 布局

`type` 有三种取值：

- `list`：全部为整行，竖向排列；图片、视频行首为缩略图，音频为图标，文件带扩展名角标。行的最大宽度为 `--vc-file-preview-row-max-width`（默认 480px）。
- `grid`：全部为方格，按边长自动换行；音频、文件的方格为标记加两行文件名。
- `group`：图片、视频的方格在前，音频、文件的整行在后。

不传 `type` 时按数据自动选择：只有图片、视频为 `grid`，只有音频、文件为 `list`，两者都有为 `group`。布局只影响展示，预览时的顺序与索引仍按 `data` 原始顺序。

:::playground
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<div class="demo">
		<RadioGroup v-model="type" type="card">
			<Radio v-for="item in types" :key="item" :value="item" :label="item || 'auto'" />
		</RadioGroup>
		<FilePreview :data="data" :type="type || undefined" />
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { FilePreview, RadioGroup, Radio } from '@deot/vc';

const types = ['', 'list', 'grid', 'group'];
const type = ref('');
const data = [
	{ source: 'https://dummyimage.com/1800x600/555/fff.png?text=1', name: '1.png' },
	{ source: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', name: '示例文件-2026.pdf' },
	'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
	{ source: 'https://dummyimage.com/600x1800/555/fff.png?text=2', name: '2.png' },
	'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3'
];
</script>

<style scoped>
.demo { display: grid; gap: 16px; }
</style>
```
:::

### 尺寸与缩略图

`size` 控制方格与整行的尺寸，默认 `medium`：

| size | 方格边长 | 行高 | 行内字号 | 行首缩略图 |
| --- | --- | --- | --- | --- |
| mini | 48px | 28px | 12px | 20px |
| small | 64px | 36px | 13px | 24px |
| medium | 96px | 46px | 14px | 32px |
| large | 128px | 56px | 14px | 40px |

图片和视频的 `thumbnail` 优先用于展示，预览使用 `source`；视频没有 `thumbnail` 时使用原生 `<video preload="metadata">` 展示，能否显示首帧取决于浏览器及媒体资源。`previewable` 为 `false` 时禁用默认文件项的点击预览。

:::playground
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<div class="demo">
		<div class="toolbar">
			<RadioGroup v-model="size" type="card">
				<Radio v-for="item in sizes" :key="item" :value="item" :label="item" />
			</RadioGroup>
			<Checkbox v-model="isPreviewable">previewable</Checkbox>
		</div>
		<FilePreview
			:data="data"
			:size="size"
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
	'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
	{ source: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', name: '示例文件-2026.pdf' }
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
	<FilePreview :data="data" type="list">
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

### 查看器交互

查看器的手势基于 `@deot/vc-hooks` 的 `useGesture`，鼠标、触摸和笔共用：

- 打开：图片、视频、音频和文件都从起点往外放大，关闭时缩回起点。起点依次取传入的 `triggerElement`、打开项的 `element`、最近一次点击的位置（被点的元素在打开前已被移除时，取点下的那个点）。画面按封面铺进元素的盒子，窗口跟着收到画面自己的盒子上。起点（点击位置即点中的元素）里有已加载的图片时，用它垫底立即放大，大图解码完再换上（与 PhotoSwipe 的 `msrc` 相同）：数据带 `width`、`height` 时按它摆放；没带时先等一下大图的尺寸（下载到头部就有，不必等整张图解码，最多等 100ms，缓存里的图一两帧内就有），等到了直接按大图的尺寸放大；等不到时先按这张图的比例放大，尺寸一到再过渡到大图自己的位置，同比例时原位换上。按大图比例摆放时缩略图按封面铺满、不拉伸；开始放大前画面不显示。没有可用的图片时，图片解码完、视频拿到真实尺寸后才开始放大。图片超过 2 秒仍未加载完时显示加载中。列表里点在某一项、但不在该项缩略图上时，从这一项开始，而不是缩略图。点在按钮、链接里的文字或图标上时，与 Modal 一样从整个按钮或链接开始。Image 组件预览时把自己作为 `element` 传入，外层包着链接或按钮时仍从这张图开始。没有起点时淡入。`placeholder` 为 `false` 时图片不用缩略图垫底；没有缩略图垫底的图片、等尺寸的视频，打开时先淡入蒙层、在中间显示加载中，就位后再从起点放大，期间切到别的项或关闭则不再等待。打开的那一项在调用 `open` 时先量一次起点，起点元素之后被移除、隐藏（如图片解码期间、关闭前）时，打开、关闭都用这个位置。数据项带 `element` 时，切换到哪一项，关闭时就回到哪一项现在的位置；没有 `element` 的项关闭时淡出。
- 切换：左右拖动超过 80px 或快速甩动；也可以使用左右按钮、键盘 `←`、`→`。两项时左右箭头都保留，任一方向都切到另一项。只有一项时不循环，拖过端点有阻尼。三项起循环。只挂载当前项与左右相邻项。
- 图片：鼠标单击图片、触屏双击在初始尺寸与 4 倍之间切换，不超过 `max`。放大、缩小按钮每次 2 倍，范围是初始尺寸的 `min`～`max` 倍（默认 1～10），到边界后按钮不可用。滚轮、双指捏合以指针或双指中心缩放，同样不超过 `max`、不低于 `min`；捏合可临时缩到初始尺寸的一半，松手回弹，低于 80% 则关闭。放大后可拖动，拖到边缘后继续拖动则切换。向左、向右旋转每次 90°，保持当前相对倍率并重新居中。
- 关闭：关闭按钮、`Esc`、点击空白处（鼠标和触屏）、向上或向下拖动后松手、双指缩小到初始尺寸的 80% 以下松手。纵向拖动时内容以 0.6 的阻尼跟随，蒙层按这段位移相对视口高度的三分之一变淡；松手时沿该方向的预测位置超过三分之一视口的 0.4，就从当前位置缩回触发元素，没有可测量的元素则淡出，向上和向下同一条线。未超过时内容和蒙层一起弹回。
- 触屏点按图片切换工具栏的显示，点空白处关闭。`Tab` 只在查看器内循环，关闭后焦点回到打开前的元素。查看器打开在 Modal 等弹层之上时，`Esc` 只关闭查看器。
- 文件：PDF（`http`、`https`、`blob`、`data` 地址；`data` 地址没有扩展名时按媒体类型识别）与 Office 文件（`doc`、`docx`、`xls`、`xlsx`、`ppt`、`pptx`，`http`、`https` 地址，经 `view.officeapps.live.com`）以 iframe 内嵌，第一次切到该项时才加载，之后保留。Office 在线预览要求地址可被公网访问。
- 新窗口打开与下载：“下载”指向文件本身的地址（`http`、`https`、`blob`、`data`），文件名取 `name`；跨域的 `http(s)` 地址浏览器不认 `download`，会直接打开，需要服务端返回 `Content-Disposition: attachment`。浏览器不允许直接在新窗口打开 `data` 地址，纯文本（`text/plain`）与 PDF（`application/pdf`）转成 `blob` 地址后打开，该页卸载时释放；其他类型（如 `text/html`、`image/svg+xml`）只提供下载，避免其中的脚本以当前页面的源运行。
- 全局 `renderSlide` 可以替换任意一页，返回 `false` 或空值时使用内置页。

### 全局配置

`VcInstance.options.FilePreview` 由 FilePreview、UploadPicker 与 Editor 共用：

- `getFileType({ source })`：自定义类型识别，返回空值时回退内置规则。
- `getFileName({ source })`：自定义从地址推导文件名，返回空值时回退内置规则；数据中显式的 `name`（UploadPicker 为 `label`）优先。
- `enhancer({ current, data, instance, mobile })`：预览前调用，返回真值（或 resolve 真值）表示已接管，不再执行内置预览（Editor 不使用）。
- `renderSlide({ type, row, index, active, close, instance, mobile })`：替换查看器中的某一页。
- `enhancer`、`renderSlide` 的参数 `mobile` 标识当前是哪一端：由 `MFilePreview`、`MImagePreview`、`MUploadPicker` 触发时为 `true`，一份全局配置可按它区分两端。
- `imageOptions`：`fit` 为初始展示方式，默认 `max-edge`。`max`、`min` 为相对初始尺寸的最大、最小倍数，默认 `10` 和 `1`。`placeholder` 为打开图片时是否用缩略图垫底，默认 `true`。

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
		getFileType: ({ source }) => (/\.jpg!/.test(source) ? 'image' : undefined),
		getFileName: ({ source }) => {
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

`ImagePreview.open` 直接用查看器打开一组图片，不经过 `enhancer`。

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

### 移动端

`MFilePreview` 的属性、插槽、结构与 `FilePreview` 相同，根节点另有标记类 `.vcm-file-preview`，结构样式与主题参数共用；各档尺寸按 750 稿随 `--vc-rem` 缩放（括号内为 375 宽下的 px）：

| size | 方格边长 | 行高 | 行内字号 | 行首缩略图 |
| --- | --- | --- | --- | --- |
| mini | 96（48） | 56（28） | 24（12） | 40（20） |
| small | 128（64） | 72（36） | 26（13） | 48（24） |
| medium | 192（96） | 92（46） | 28（14） | 64（32） |
| large | 256（128） | 112（56） | 28（14） | 80（40） |

方格以 `size` 为最小边长，均分铺满一行（`repeat(auto-fill, minmax(边长, 1fr))`）：屏幕变宽时每行多放几个，而不是把每格放大。

从 `MFilePreview` 点开，或调用 `MFilePreview.open`、`MImagePreview.open`（参数同 `FilePreview.open`、`ImagePreview.open`）时，打开移动端查看器：

- 只保留右上角的关闭按钮（56，即 375 宽下 28px，避开顶部安全区）；切换、旋转、缩放按钮不显示，由手势完成：双击或捏合缩放，左右滑动切换；点按空白处、向上或向下拖动、捏小同样关闭。
- 计数在底部通栏、左对齐，字号 28（14），底部渐变加深并留出安全区；蒙层为 90% 不透明的黑色。
- 文件页左右留白 32（16），顶部让出关闭按钮、底部让出计数的高度；文件名 32（16）。
- 「新窗口打开」「下载」统一为一个「复制链接」（高 64，即 32px），复制文件本身的地址，复制后按钮原地显示「复制成功」两秒：手机浏览器对跨域地址多不认 `download`，微信等内嵌浏览器常拦截新窗口。`blob:`、`data:` 地址复制出去无法打开，这类仍只提供「下载」。

```vue
<template>
	<MFilePreview :data="files" />
</template>

<script setup>
import { MFilePreview } from '@deot/vc';

const files = ['https://dummyimage.com/600x400/555/fff.png?text=1', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'];
</script>
```

## 主题与局部覆盖

全局参数通过 `--vc-<参数>` 配置，单个组件通过 `--vc-file-preview-<参数>` 覆盖。同一参数可能作用于多个状态；多命名空间时在使用位置中标明。

文件项（方格、整行）与 `UploadPicker` 共用：当前尺寸由根节点上的 `is-tile-<size>`、`is-row-<size>` 写成 `--vc-file-tile-<键>`、`--vc-file-row-<键>`，单实例调整时在 FilePreview 根节点的 `style` 上覆盖这些变量；各档的默认值来自 `--vc-file-item-tile-<size>-<键>`、`--vc-file-item-row-<size>-<键>`（如 `--vc-file-item-tile-small-size`），`MFilePreview`、`MUploadPicker` 在根节点的标记类 `.vcm-file-items` 上覆盖这些变量。可点击（可预览）的项带 `is-clickable`：手形光标，整行在有悬停的设备上加深底色。查看器的蒙层为黑色，不透明度取 `--vc-file-viewer-bg-opacity`（默认 0.8；移动端查看器为 0.9），控件与文字使用 color-contrast-light，不随亮暗主题反转。查看器挂载在 Portal 中，变量需作用于实际浮层或其祖先。

⚠ color-mix：根节点上的 `--vc-file-primary-10`、`--vc-file-primary-20` 为 color-primary-light 10%、20% 与透明色混合（整行底色与悬停、UploadPicker 的上传按钮与进度轨道），缩略图播放圆形底色为 color-contrast-dark 40%；增强声明仅在 `@supports` 内生效，不支持时使用 Sass 编译的固定值，不会随变量覆盖变化。方格、行首缩略图的浅灰底为 `--vc-file-surface`。

### 全局

| 参数 | 使用位置 | 值 |
| --- | --- | --- |
| color-contrast-dark | 方格播放圆形底色的派生基色 | `#000000`（亮暗主题相同） |
| color-contrast-light | 查看器控件与文字、方格播放标记 | `#FFFFFF`（亮暗主题相同） |
| color-dark-light | 整行文字 | 亮色：`#080F20`；暗色：`#E8E8E8` |
| color-dark-lighter | 方格文件名，音频、文件图标 | 亮色：`#515151`；暗色：`#D9D9D9` |
| color-primary | 扩展名角标文字 | `#456CF6` |
| color-primary-light | 整行底色（10%，悬停 20%） | `#4A96FF` |
| color-primary-lighter | 扩展名角标底色 | `rgba(45, 140, 240, 0.2)` |
| background-color | 方格及行首缩略图底色（亮色） | 亮色：`#F5F6FA`；暗色：`#252B3A`（此处不使用） |
| background-color-light | 方格底色（暗色；暗色下 background-color 与页面底色相同） | 亮色：`#F7F8FA`（此处不使用）；暗色：`#2D3444` |

### 局部

| 参数 | 使用位置 | 值 |
| --- | --- | --- |
| row-max-width | 整行列表的最大宽度 | `480px` |

各档尺寸（桌面端，px）：

| 键 | 说明 | mini | small | medium | large |
| --- | --- | --- | --- | --- | --- |
| tile-size | 方格边长 | 48 | 64 | 96 | 128 |
| tile-radius | 方格圆角 | 4 | 6 | 8 | 8 |
| tile-icon | 方格内音频、文件图标 | 16 | 20 | 28 | 36 |
| tile-ext | 方格内扩展名字号 | 10 | 10 | 12 | 13 |
| tile-name | 方格内文件名字号 | 10 | 11 | 12 | 13 |
| tile-play | 方格播放标记 | 16 | 22 | 28 | 36 |
| tile-gap | 方格间距 | 6 | 8 | 8 | 12 |
| row-height | 行高 | 28 | 36 | 46 | 56 |
| row-padding | 行左右内边距 | 8 | 10 | 12 | 14 |
| row-font | 行内字号 | 12 | 13 | 14 | 14 |
| row-media | 行首缩略图 | 20 | 24 | 32 | 40 |
| row-icon | 行首图标 | 14 | 14 | 16 | 18 |
| row-ext | 行首扩展名字号 | 10 | 10 | 11 | 12 |
| row-radius | 行圆角 | 4 | 6 | 8 | 8 |
| row-gap | 行间距与行内元素间距 | 6 | 8 | 8 | 10 |

## API

### FilePreview 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| data | 文件数据；字符串按逗号分隔，数组项为地址或数据项对象，没有 `source` 的项会被忽略 | `string \| (string \| object)[]` | - | `[]` |
| type | 布局（与数据项的文件类型无关）：`list` 全部整行，`grid` 全部方格，`group` 图片、视频方格在前、音频、文件整行在后；不传时按数据自动选择 | `'list' \| 'grid' \| 'group'` | `list` / `grid` / `group` | - |
| size | 尺寸 | `'mini' \| 'small' \| 'medium' \| 'large'` | `mini` / `small` / `medium` / `large` | `medium` |
| previewable | 点击是否预览；使用 `default` 插槽时由插槽调用 `preview` | `boolean` | - | `true` |
| placeholder | 打开图片时是否用点中的缩略图垫底、立即放大，大图解码完再换上；为 `false` 时先淡入蒙层、显示加载中，大图就位后再放大。不传时用全局 `imageOptions.placeholder` | `boolean` | - | `true` |

数据项（字符串会解析为 `{ source }`）：

| 字段 | 说明 | 类型 |
| --- | --- | --- |
| source | 文件地址，预览时使用 | `string` |
| type | 文件类型；不传或不合法时通过 `getFileType` 识别 | `'image' \| 'video' \| 'audio' \| 'file'` |
| name | 名称；不传或为空字符串时通过 `getFileName` 推导，内置规则取地址最后一段（去掉 `?`、`#` 之后的部分并解码）；`data` 地址取 `name` 参数（如 `data:text/plain;name=a.txt,…`），没有时为 `file.<扩展名>` | `string` |
| thumbnail | 图片、视频的展示缩略图；音频和普通文件忽略此字段 | `string` |
| width / height | 图片的自然宽高；都大于 0 时查看器不等待图片解码，直接按此尺寸放置 | `number` |
| element | 缩略图元素：查看器打开时从它放大，关闭时回到它。FilePreview 列表会自动传入各项的缩略图 | `Element` |

其他字段原样保留，可在插槽和 `enhancer` 中读取。

### FilePreview 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 替换每一项的内容；外层不再绑定点击 | `{ row, index, preview }`：`row` 为解析后的数据项，`index` 为解析后列表中的索引，`preview()` 打开该项的预览，返回值同 `FilePreview.open` |

### FilePreview 方法

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| FilePreview.open | 先调用全局 `enhancer`，未接管时打开查看器 | `{ data, current?, instance?, triggerElement?, placeholder?, onClose? }`：`data` 同属性 `data`；`current` 为解析后列表的索引，越界时回退到 `0`；`instance` 默认 `null`；`placeholder` 同组件属性；`triggerElement` 为打开时放大的起点，可以是元素或 `VirtualElement`（只有一个盒子的替身）；不传时用打开项的 `element`，没有时取最近一次点击的位置；传 `null` 时不用点击位置，只看打开项的 `element`，都没有时淡入；`onClose` 在查看器关闭后调用 | 查看器句柄（`destroy()` 立即销毁）；`data` 为空或被接管时为 `undefined`；`enhancer` 返回 Promise 时返回 resolve 为句柄或 `undefined` 的 Promise |

### ImagePreview 方法

`ImagePreview` 是提供静态方法的对象，不是可渲染的 Vue 组件。

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| ImagePreview.open | 直接用查看器打开图片，不经过 `FilePreview.enhancer` | `{ data, current?, triggerElement?, placeholder?, onClose? }`：`triggerElement`、`placeholder` 同 `FilePreview.open`；`current` 从 `0` 开始，越界时回退到 `0`；`data` 为地址数组或对象数组，图片地址依次取 `value`、`source`、`src`，可带 `width`、`height`、`element`；名称同样经过全局 `getFileName` | 查看器句柄；没有有效图片时为 `undefined` |

查看器的按钮名称、加载失败文案使用 `vc.FilePreview` 下的 locale，切换语言后实时更新。

### 全局配置

通过 `VcInstance.configure({ FilePreview: { ... } })` 设置，FilePreview 与 UploadPicker 共用；Editor 按地址插入资源时也读取 `getFileType`、`getFileName`。

| 属性 | 说明 | 类型 |
| --- | --- | --- |
| getFileType | 自定义类型识别，`source` 为地址或文件名；返回空值或非法类型时回退内置规则 | `(data: { source: string }) => 'image' \| 'video' \| 'audio' \| 'file' \| null \| undefined \| void` |
| getFileName | 自定义从地址推导文件名，`source` 为地址；返回空值时回退内置规则。只在数据未提供名称时调用 | `(data: { source: string }) => string \| null \| undefined \| void` |
| enhancer | 预览前调用；返回真值（或 resolve 真值）表示已接管，不再执行内置预览。`data` 为解析后的列表，`instance` 为调用方组件内部实例或 `null`，`mobile` 为是否由移动端入口触发 | `({ current, data, instance, mobile }) => unknown` |
| renderSlide | 替换查看器中的某一页：返回 VNode 时使用它，返回 `false`、`null`、`undefined` 或不返回时使用内置页。`close()` 关闭查看器，`mobile` 为是否为移动端查看器 | `({ type, row, index, active, close, instance, mobile }) => VNode \| false \| null \| undefined \| void` |
| imageOptions | 图片页配置。`fit` 为初始展示：`max-edge` 整图可见，小图放大到长边贴齐视口；`actual` 按自然像素，超出视口时同比例缩小。`max`、`min` 为相对初始尺寸的最大、最小倍数，限制按钮、滚轮和捏合的稳定缩放。`placeholder` 为打开时是否用缩略图垫底，组件属性、`open` 选项可覆盖 | `{ fit?: 'max-edge' \| 'actual'; max?: number; min?: number; placeholder?: boolean }`，默认 `{ fit: 'max-edge', max: 10, min: 1, placeholder: true }` |

### 使用注意

- 内置类型规则按扩展名识别（忽略 `?`、`#` 之后的部分）：
  - image：`jpg`、`jpeg`、`png`、`gif`、`bmp`、`webp`、`image`、`heic`
  - video：`mp4`、`mov`、`avi`、`mpg`、`mpeg`、`rmvb`
  - audio：`mp3`、`aac`、`wav`、`flac`、`ape`、`ogg`、`m4a`
  - 其余为 file。没有扩展名的地址可在数据项中传 `type`，或配置 `getFileType`。
  - `data` 地址按媒体类型的主类型识别：`image/*`、`video/*`、`audio/*` 分别为 image、video、audio，其余为 file；扩展名由媒体类型推导（如 `image/jpeg` 为 `JPG`、`text/plain` 为 `TXT`）。
- 内置预览：全部类型进入同一个查看器，交互见上文“查看器交互”。需要接入其他在线预览服务时，可用 `renderSlide` 替换文件页，或用 `enhancer` 整体接管。
- 属性 `type` 表示展示方式，数据项的 `type` 表示文件类型，两者含义不同。
- 颜色、尺寸变量见[主题与局部覆盖](#主题与局部覆盖)。
- `MFilePreview` 与 `FilePreview` 结构相同、尺寸按 750 稿；`MFilePreview.open`、`MImagePreview.open` 打开移动端查看器，见[移动端](#移动端)。

### 从 mix / group 迁移

- `type` 改为 `list`、`grid`、`group`，默认不传、按数据自动选择；原来的 `mix`（紧凑卡片）去掉，原来的 `group`（按图片、视频、音频、文件四组）改为媒体方格在前、其余整行在后。
- `vertical` 去掉：`list` 本身竖排，`grid` 自动换行。
- 可预览项的类名 `is-previewable` 改为 `is-clickable`（与 UploadPicker 共用），整行只在可点击时有悬停色。
- 卡片、方格的局部变量（`card-*`、`square-*`、`thumbnail-size`、`dot-size`、`text-size`、`inner-gap`、`gap`、`play-size`）改为 `--vc-file-tile-*`、`--vc-file-row-*`，见[局部](#局部)；`box-shadow`、`background-color-primary-light` 不再使用。

### 从 PhotoSwipe 版本迁移

- 不再依赖 `photoswipe`；`ImagePreview.open` 不再透传 PhotoSwipe 选项，`vc.ImagePreview` 下的 locale 合并到 `vc.FilePreview`。
- 图片、视频、音频、文件进入同一个查看器；文件不再直接 `window.open`。“新窗口打开”指向当前预览地址，“下载”指向文件本身的地址。
- `FilePreview.open`、`ImagePreview.open` 同步返回查看器句柄，不再返回 `Promise<void>`（`enhancer` 返回 Promise 时除外）。

### 从 ImagePreview 迁移

- 组件 `ImagePreview`（`vc-image-preview`）改为 `FilePreview`（`vc-file-preview`）；`ImagePreview` 只保留 `open` 方法，不再注册为组件。
- `VcInstance.options.ImagePreview.enhancer` 移除，改用 `VcInstance.options.FilePreview.enhancer`，参数改为 `{ current, data, instance }`，且对所有文件类型生效。
- 视频、音频播放弹窗的主题变量前缀由 `--vc-upload-picker-*` 改为 `--vc-file-preview-*`。
