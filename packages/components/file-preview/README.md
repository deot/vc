## 文件预览（FilePreview）

展示一组文件（图片、视频、音频、其他文件），点击后在同一个查看器中预览。`ImagePreview.open` 用于直接打开图片预览。

### 何时使用

- 在详情页展示已上传的附件、图片或视频。
- 需要统一控制文件类型识别和预览方式（如接入在线文档预览）。

### 基础用法

`data` 可以是逗号分隔的字符串、地址数组或对象数组。默认 `type="mix"`：按 `data` 顺序混编成紧凑的卡片（按内容宽度，超出最大宽度时省略名称），图片和提供 `thumbnail` 的视频显示缩略图，其余只显示名称。点击后打开查看器，包含 `data` 中的全部项并定位到点击的那一项：图片可缩放、拖动，视频、音频使用原生播放控件，PDF 与 Office 文件内嵌预览。“新窗口打开”使用当前预览地址（Office 为在线预览地址）；“下载”使用文件本身的地址。没有内嵌预览时，文件名与按钮分两行。

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

### 查看器交互

查看器的手势基于 `@deot/vc-hooks` 的 `useGesture`，鼠标、触摸和笔共用：

- 打开：图片、视频、音频和文件都从起点往外放大，关闭时缩回起点。起点依次取传入的 `triggerElement`、打开项的 `element`、最近一次点击的位置（被点的元素在打开前已被移除时，取点下的那个点）。画面按封面铺进元素的盒子，窗口跟着收到画面自己的盒子上。起点（点击位置即点中的元素）里有已加载的图片时，用它垫底立即放大，大图解码完再换上（与 PhotoSwipe 的 `msrc` 相同）：数据带 `width`、`height` 时按它摆放；没带时先等一下大图的尺寸（下载到头部就有，不必等整张图解码，最多等 100ms，缓存里的图一两帧内就有），等到了直接按大图的尺寸放大；等不到时先按这张图的比例放大，尺寸一到再过渡到大图自己的位置，同比例时原位换上。按大图比例摆放时缩略图按封面铺满、不拉伸；开始放大前画面不显示。没有可用的图片时，图片解码完、视频拿到真实尺寸后才开始放大。图片超过 2 秒仍未加载完时显示加载中。列表里点在某一项、但不在该项缩略图上时，从这一项开始，而不是缩略图。点在按钮、链接里的文字或图标上时，与 Modal 一样从整个按钮或链接开始。Image 组件预览时把自己作为 `element` 传入，外层包着链接或按钮时仍从这张图开始。没有起点时淡入。`placeholder` 为 `false` 时图片不用缩略图垫底；没有缩略图垫底的图片、等尺寸的视频，打开时先淡入蒙层、在中间显示加载中，就位后再从起点放大，期间切到别的项或关闭则不再等待。打开的那一项在调用 `open` 时先量一次起点，起点元素之后被移除、隐藏（如图片解码期间、关闭前）时，打开、关闭都用这个位置。数据项带 `element` 时，切换到哪一项，关闭时就回到哪一项现在的位置；没有 `element` 的项关闭时淡出。
- 切换：左右拖动超过 80px 或快速甩动；也可以使用左右按钮、键盘 `←`、`→`。两项时左右箭头都保留，任一方向都切到另一项。只有一项时不循环，拖过端点有阻尼。三项起循环。只挂载当前项与左右相邻项。
- 图片：鼠标单击图片、触屏双击在初始尺寸与 4 倍之间切换，不超过 `max`。放大、缩小按钮每次 2 倍，范围是初始尺寸的 `min`～`max` 倍（默认 1～10），到边界后按钮不可用。滚轮、双指捏合以指针或双指中心缩放，同样不超过 `max`、不低于 `min`；捏合可临时缩到初始尺寸的一半，松手回弹，低于 80% 则关闭。放大后可拖动，拖到边缘后继续拖动则切换。向左、向右旋转每次 90°，保持当前相对倍率并重新居中。
- 关闭：关闭按钮、`Esc`、点击空白处（鼠标和触屏）、向上或向下拖动后松手、双指缩小到初始尺寸的 80% 以下松手。纵向拖动时内容以 0.6 的阻尼跟随，蒙层按这段位移相对视口高度的三分之一变淡；松手时沿该方向的预测位置超过三分之一视口的 0.4，就从当前位置缩回触发元素，没有可测量的元素则淡出，向上和向下同一条线。未超过时内容和蒙层一起弹回。
- 触屏点按图片切换工具栏的显示，点空白处关闭。`Tab` 只在查看器内循环，关闭后焦点回到打开前的元素。查看器打开在 Modal 等弹层之上时，`Esc` 只关闭查看器。
- 文件：PDF（`http`、`https`、`blob` 地址）与 Office 文件（`doc`、`docx`、`xls`、`xlsx`、`ppt`、`pptx`，`http`、`https` 地址，经 `view.officeapps.live.com`）以 iframe 内嵌，第一次切到该项时才加载，之后保留。Office 在线预览要求地址可被公网访问。
- 全局 `renderSlide` 可以替换任意一页，返回 `false` 或空值时使用内置页。

### 全局配置

`VcInstance.options.FilePreview` 由 FilePreview、UploadPicker 与 Editor 共用：

- `getFileType({ source })`：自定义类型识别，返回空值时回退内置规则。
- `getFileName({ source })`：自定义从地址推导文件名，返回空值时回退内置规则；数据中显式的 `name`（UploadPicker 为 `label`）优先。
- `enhancer({ current, data, instance })`：预览前调用，返回真值（或 resolve 真值）表示已接管，不再执行内置预览（Editor 不使用）。
- `renderSlide({ type, row, index, active, close, instance })`：替换查看器中的某一页。
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

## 主题与局部覆盖

全局参数通过 `--vc-<参数>` 配置，单个组件通过 `--vc-file-preview-<参数>` 覆盖。同一参数可能作用于多个状态；多命名空间时在使用位置中标明。

尺寸变量由 size 修饰类写在根节点，单实例调整时应作用于对应 FilePreview 根节点。查看器的蒙层固定为 80% 不透明的黑色（与 PhotoSwipe 一致），控件与文字使用 color-contrast-light，不随亮暗主题反转。查看器挂载在 Portal 中，变量需作用于实际浮层或其祖先。

⚠ color-mix：缩略图播放圆形底色由 color-contrast-dark 40% 与透明色混合，增强声明仅在 `@supports` 内生效；不支持时使用 Sass 编译的 `rgba(0, 0, 0, .4)`。降级值不会随变量覆盖变化。

### 全局

| 参数 | 使用位置 | 值 |
| --- | --- | --- |
| color-contrast-dark | 缩略图播放圆形底色的派生基色 | `#000000`（亮暗主题相同） |
| color-contrast-light | 查看器控件与文字、缩略图播放标记 | `#FFFFFF`（亮暗主题相同） |
| color-dark-light | 卡片文字 | 亮色：`#080F20`；暗色：`#E8E8E8` |
| color-primary | 可预览卡片悬停文字、类型标记及扩展名 | `#456CF6` |
| color-primary-lighter | 类型标记及扩展名背景 | `rgba(45, 140, 240, 0.2)` |
| background-color | 卡片及方格背景 | 亮色：`#F5F6FA`；暗色：`#252B3A` |
| background-color-primary-light | 可预览卡片悬停背景 | 亮色：`#E6F7FF`；暗色：`#273E5E` |
| box-shadow | 方格悬停阴影 | 亮色：`0 0 8px 0 rgba(0, 0, 0, 0.1)`；暗色：`0 0 8px 0 rgba(255, 255, 255, 0.05)` |

### 局部

| 参数 | 使用位置 | 值 |
| --- | --- | --- |
| card-height | 卡片高度 | mini：`24px`；small：`28px`；medium：`32px`；large：`40px` |
| card-padding | 卡片左右内边距 | mini：`6px`；small：`8px`；medium：`8px`；large：`10px` |
| card-radius | 卡片圆角 | mini：`4px`；small：`4px`；medium：`6px`；large：`6px` |
| card-width | 卡片最大宽度 | mini：`160px`；small：`180px`；medium：`200px`；large：`240px` |
| dot-size | 类型标记尺寸 | mini：`14px`；small：`16px`；medium：`18px`；large：`22px` |
| gap | 文件项目间距 | mini：`6px`；small：`8px`；medium：`8px`；large：`12px` |
| inner-gap | 卡片内部间距 | mini：`4px`；small：`6px`；medium：`6px`；large：`8px` |
| play-size | 播放标记尺寸 | mini：`16px`；small：`22px`；medium：`28px`；large：`36px` |
| square-radius | 方格圆角 | mini：`4px`；small：`6px`；medium：`8px`；large：`8px` |
| square-size | 方格尺寸 | mini：`48px`；small：`64px`；medium：`96px`；large：`128px` |
| text-size | 卡片字号 | mini：`12px`；small：`12px`；medium：`13px`；large：`14px` |
| thumbnail-size | 缩略图尺寸 | mini：`16px`；small：`20px`；medium：`22px`；large：`28px` |

## API

### FilePreview 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| data | 文件数据；字符串按逗号分隔，数组项为地址或数据项对象，没有 `source` 的项会被忽略 | `string \| (string \| object)[]` | - | `[]` |
| type | 展示方式（与数据项的文件类型无关）：`mix` 按顺序混编，`group` 按文件类型分组 | `'mix' \| 'group'` | `mix` / `group` | `mix` |
| size | 尺寸 | `'mini' \| 'small' \| 'medium' \| 'large'` | `mini` / `small` / `medium` / `large` | `medium` |
| vertical | 纵向排列；`group` 时作用于每组 | `boolean` | - | `false` |
| previewable | 点击是否预览；使用 `default` 插槽时由插槽调用 `preview` | `boolean` | - | `true` |
| placeholder | 打开图片时是否用点中的缩略图垫底、立即放大，大图解码完再换上；为 `false` 时先淡入蒙层、显示加载中，大图就位后再放大。不传时用全局 `imageOptions.placeholder` | `boolean` | - | `true` |

数据项（字符串会解析为 `{ source }`）：

| 字段 | 说明 | 类型 |
| --- | --- | --- |
| source | 文件地址，预览时使用 | `string` |
| type | 文件类型；不传或不合法时通过 `getFileType` 识别 | `'image' \| 'video' \| 'audio' \| 'file'` |
| name | 名称；不传或为空字符串时通过 `getFileName` 推导，内置规则取地址最后一段（去掉 `?`、`#` 之后的部分并解码） | `string` |
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
| enhancer | 预览前调用；返回真值（或 resolve 真值）表示已接管，不再执行内置预览。`data` 为解析后的列表，`instance` 为调用方组件内部实例或 `null` | `({ current, data, instance }) => unknown` |
| renderSlide | 替换查看器中的某一页：返回 VNode 时使用它，返回 `false`、`null`、`undefined` 或不返回时使用内置页。`close()` 关闭查看器 | `({ type, row, index, active, close, instance }) => VNode \| false \| null \| undefined \| void` |
| imageOptions | 图片页配置。`fit` 为初始展示：`max-edge` 整图可见，小图放大到长边贴齐视口；`actual` 按自然像素，超出视口时同比例缩小。`max`、`min` 为相对初始尺寸的最大、最小倍数，限制按钮、滚轮和捏合的稳定缩放。`placeholder` 为打开时是否用缩略图垫底，组件属性、`open` 选项可覆盖 | `{ fit?: 'max-edge' \| 'actual'; max?: number; min?: number; placeholder?: boolean }`，默认 `{ fit: 'max-edge', max: 10, min: 1, placeholder: true }` |

### 使用注意

- 内置类型规则按扩展名识别（忽略 `?`、`#` 之后的部分）：
  - image：`jpg`、`jpeg`、`png`、`gif`、`bmp`、`webp`、`image`、`heic`
  - video：`mp4`、`mov`、`avi`、`mpg`、`mpeg`、`rmvb`
  - audio：`mp3`、`aac`、`wav`、`flac`、`ape`、`ogg`、`m4a`
  - 其余为 file。没有扩展名的地址可在数据项中传 `type`，或配置 `getFileType`。
- 内置预览：全部类型进入同一个查看器，交互见上文“查看器交互”。需要接入其他在线预览服务时，可用 `renderSlide` 替换文件页，或用 `enhancer` 整体接管。
- 属性 `type` 表示展示方式，数据项的 `type` 表示文件类型，两者含义不同。
- 颜色使用主题变量，可通过以下变量单独覆盖：
  - `--vc-file-preview-background-color`：卡片、方格底色
  - `--vc-file-preview-color-dark-light`：名称
  - `--vc-file-preview-color-primary`：悬停文字、音频标记、扩展名
  - `--vc-file-preview-color-primary-lighter`：音频标记与扩展名底色
  - `--vc-file-preview-background-color-primary-light`：可预览卡片悬停底色
  - `--vc-file-preview-color-contrast-dark`、`--vc-file-preview-color-contrast-light`：播放底色的派生基色、播放标记及查看器控件
  - `--vc-file-preview-box-shadow`：方格悬停阴影
- 查看器挂载在页面外层，覆盖变量需设置在其能继承的祖先（如 `:root`）上。
- 尺寸默认按 Sass `$scale` 缩放；由根节点上按 `size` 设置的变量控制，可在 `style` 中覆盖：
  - 方格：`--vc-file-preview-square-size`、`--vc-file-preview-square-radius`、`--vc-file-preview-play-size`
  - 卡片：`--vc-file-preview-card-width`（最大宽度）、`--vc-file-preview-card-height`、`--vc-file-preview-card-padding`、`--vc-file-preview-card-radius`、`--vc-file-preview-thumbnail-size`、`--vc-file-preview-dot-size`、`--vc-file-preview-text-size`、`--vc-file-preview-inner-gap`
  - 间距：`--vc-file-preview-gap`
- `MFilePreview`、`MImagePreview` 分别是 `FilePreview`、`ImagePreview` 的别名。

### 从 PhotoSwipe 版本迁移

- 不再依赖 `photoswipe`；`ImagePreview.open` 不再透传 PhotoSwipe 选项，`vc.ImagePreview` 下的 locale 合并到 `vc.FilePreview`。
- 图片、视频、音频、文件进入同一个查看器；文件不再直接 `window.open`。“新窗口打开”指向当前预览地址，“下载”指向文件本身的地址。
- `FilePreview.open`、`ImagePreview.open` 同步返回查看器句柄，不再返回 `Promise<void>`（`enhancer` 返回 Promise 时除外）。

### 从 ImagePreview 迁移

- 组件 `ImagePreview`（`vc-image-preview`）改为 `FilePreview`（`vc-file-preview`）；`ImagePreview` 只保留 `open` 方法，不再注册为组件。
- `VcInstance.options.ImagePreview.enhancer` 移除，改用 `VcInstance.options.FilePreview.enhancer`，参数改为 `{ current, data, instance }`，且对所有文件类型生效。
- 视频、音频播放弹窗的主题变量前缀由 `--vc-upload-picker-*` 改为 `--vc-file-preview-*`。
