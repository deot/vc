## 通知提醒（Notice）

在页面右上角展示带标题、正文和状态图标的通知。`Notice` 同时支持组件渲染和静态方法调用。移动端入口导出的 `MNotice` 属性与方法相同，显示为顶部全宽通栏，见 [移动端](#移动端)。

### 何时使用

- 展示系统通知、操作结果或需要较长描述的反馈。
- 在异步任务期间保留通知，并在任务完成后更新内容。

### 基础用法

`Notice.open()` 展示无图标通知，`info()`、`success()`、`warning()`、`error()` 展示对应状态。默认在 `4500ms` 后关闭，鼠标悬停在通知上时暂停计时，移出后重新计时；正文缺省或为空字符串时只显示标题。全局通知可同时存在，默认把新通知插入顶部。`error` 通知为 `role="alert"`，其余为 `role="status"`。

:::playground
<!--
<config lang="json5">
{
	viewport: 480,
	viewportOptions: ['auto', 480],
	previewInset: 16,
	expandable: true
}
</config>
-->
```vue
<template>
	<div class="notice-demo" :class="{ 'is-visible': isVisible }">
		<div class="notice-demo__actions">
			<Button
				v-for="item in notices"
				:key="item.label"
				:disabled="isVisible"
				@click="handleOpen(item)"
			>
				{{ item.label }}
			</Button>
			<Button :disabled="!isVisible" @click="handleClear">
				清空通知
			</Button>
		</div>
		<p>{{ result }}</p>
	</div>
</template>

<script setup>
import { inject, onUnmounted, ref } from 'vue';
import { Button, Notice } from '@deot/vc';

const playground = inject('docs:playground');
const isVisible = ref(false);
const result = ref('选择一种通知类型');
const notices = [
	{ method: 'open', label: '普通通知', content: '通知支持标题和正文。' },
	{ method: 'info', label: '信息', content: '你有一条新的系统消息。' },
	{ method: 'success', label: '成功', content: '文件已保存。' },
	{ method: 'warning', label: '警告', content: '请检查尚未完成的操作。' },
	{ method: 'error', label: '错误', content: '保存失败，请稍后重试。' },
	{ method: 'open', label: '仅标题', content: '' }
];

const handleOpen = playground.run(260, { visible: isVisible }, (item) => {
	isVisible.value = true;
	result.value = `${item.label}：4500ms 后自动关闭，也可点击关闭图标`;
	Notice[item.method]({
		title: item.label,
		content: item.content,
		onClose: () => {
			isVisible.value = false;
			result.value = '通知已关闭';
		}
	});
});

const handleClear = () => {
	Notice.destroy();
	isVisible.value = false;
	result.value = '已清空全部通知';
};

onUnmounted(() => Notice.destroy());
</script>

<style scoped>
.notice-demo {
	display: grid;
	gap: 12px;
}
.notice-demo.is-visible {
	padding-top: 120px;
}
.notice-demo__actions {
	display: flex;
	flex-wrap: wrap;
	align-items: flex-start;
	gap: 8px;
}
.notice-demo p {
	margin: 0;
	line-height: 1.6;
}
</style>
```
:::

### 更新内容与延迟关闭

`duration: 0` 保持通知显示。静态方法返回 `PortalLeaf`，可通过 `leaf.wrapper.setContent()` 更新字符串或 render 函数，再用 `setDuration()` 从当前时刻重新计时。render 函数接收组件属性和上下文，使用 Vue 的 `h` 返回节点。

点击关闭图标会调用 `onBeforeClose(event)`；返回 Promise 时等待其兑现后关闭。自动关闭和实例方法不执行这个回调。

:::playground
<!--
<config lang="json5">
{
	viewport: 480,
	viewportOptions: ['auto', 480],
	previewInset: 16,
	expandable: true
}
</config>
-->
```vue
<template>
	<div class="notice-demo" :class="{ 'is-visible': isVisible }">
		<div class="notice-demo__actions">
			<Button :disabled="isVisible" @click="handleOpen">
				开始任务
			</Button>
			<Button :disabled="!isVisible" @click="handleComplete">
				更新为已完成
			</Button>
		</div>
		<p>{{ result }}</p>
	</div>
</template>

<script setup>
import { h, inject, onUnmounted, ref } from 'vue';
import { Button, Notice } from '@deot/vc';

const playground = inject('docs:playground');
const isVisible = ref(false);
const result = ref('通知持续显示；点击关闭图标会等待 800ms');
let leaf;

const handleOpen = playground.run(260, { visible: isVisible }, () => {
	isVisible.value = true;
	result.value = '任务进行中，可更新正文或点击关闭图标';
	leaf = Notice.info({
		title: '任务进度',
		content: () => h('span', '正在处理文件…'),
		duration: 0,
		onBeforeClose: () => {
			result.value = '正在完成关闭前的处理…';
			return new Promise(resolve => setTimeout(resolve, 800));
		},
		onClose: () => {
			isVisible.value = false;
			leaf = undefined;
			result.value = '通知已关闭';
		}
	});
});

const handleComplete = () => {
	leaf?.wrapper?.setContent(() => h('strong', '文件处理完成'));
	leaf?.wrapper?.setDuration(1800);
	result.value = '正文已更新，1800ms 后自动关闭';
};

onUnmounted(() => Notice.destroy());
</script>

<style scoped>
.notice-demo {
	display: grid;
	gap: 12px;
}
.notice-demo.is-visible {
	padding-top: 120px;
}
.notice-demo__actions {
	display: flex;
	flex-wrap: wrap;
	align-items: flex-start;
	gap: 8px;
}
.notice-demo p {
	margin: 0;
	line-height: 1.6;
}
</style>
```
:::

### 在页面中渲染

声明式 `Notice` 使用 `fixed: false` 可放入普通文档流。它在挂载时显示并开始计时；收到 `close` 后由父组件卸载，再次展示时重新挂载。`mode="loading"` 显示加载图标，声明式与静态方法（`Notice.loading()`）均可使用。

:::playground
<!--
<config lang="json5">
{
	viewport: 480,
	viewportOptions: ['auto', 480],
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="notice-demo">
		<Button :disabled="isVisible" @click="handleShow">
			显示页面内通知
		</Button>
		<Notice
			v-if="isVisible"
			:fixed="false"
			:duration="0"
			mode="loading"
			title="正在同步"
			content="这条通知位于页面布局中，点击关闭图标可移除。"
			@close="handleClose"
		/>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, Notice } from '@deot/vc';

const isVisible = ref(true);
const handleShow = () => {
	isVisible.value = true;
};
const handleClose = () => {
	isVisible.value = false;
};
</script>

<style scoped>
.notice-demo {
	display: grid;
	justify-items: start;
	gap: 16px;
}
</style>
```
:::

## 移动端

`MNotice` 的属性、事件、静态方法与 `Notice` 相同，结构沿用桌面端，根节点另有标记类 `.vcm-notice`：

- 顶部全宽通栏，`fixed` 浮层，从上方滑入、向上滑出，只改变 `transform`，不推动页面，页面不会抖动。
- 多条通知时新通知在最上方；计时先到的旧通知排在下方，离场时上方的通知不移动。
- 配色：`success`、`warning`、`error` 为状态色实底白字；`info`、`loading` 为主色浅底（主色 10% 与 background-color-lightest 混合，不支持时用 background-color-light）主色字；`open()` 为白底深字加阴影。
- 上滑关闭：手指按住时暂停计时，通知只跟随向上的位移；松手时上移超过自身高度的 30%，或快速上滑，即关闭（先执行 `onBeforeClose`，阻止时回弹）；否则回弹并重新计时。不可关闭（`closable: false`）的通知同样可以上滑关闭。
- `top` 为 750 稿长度，默认 `0`；为 `0` 时最上面一条的上内边距加上 `env(safe-area-inset-top)`，背景延伸进安全区；放在导航栏下方时传 `88`。静态方法的 `top` 同样设置全局容器的位置，换算为 `calc(var(--vc-rem) * n)`。

尺寸按 750 稿设计，随 `--vc-rem` 缩放（括号内为 375 宽下的 px）：

| 项 | 值 |
| --- | --- |
| 最小高度 | 72（36） |
| 内边距 | 16（8） 32（16）；可关闭时左右 80（40），内容保持居中；标题与正文同时存在时左对齐，可关闭时只在右侧留 80（40） |
| 字号、行高 | 28（14） / 40（20）；带正文时标题 500，正文 26（13）、透明度 0.9 |
| 状态图标、加载图标 | 28（14），与文字间距 12（6） |
| 关闭图标 | 24（12），点击区 64（32），距右边 16（8） |

```vue
<template>
	<MButton @click="handleClick">保存</MButton>
</template>

<script setup>
import { MButton, MNotice } from '@deot/vc';

const handleClick = () => {
	MNotice.success({ content: '文件已保存' });
};
</script>
```

## 主题与局部覆盖

全局参数通过 `--vc-<参数>` 配置，组件级覆盖使用 `--vc-notice-<参数>`。局部参数仅提供组件级入口；可在组件根节点或其祖先上设置。

弹层或遮罩通过 Portal 挂载时，覆盖变量需作用于实际浮层或其祖先。

### 全局

| 参数 | 使用位置 | 值 |
| --- | --- | --- |
| color-dark-light | 标题及关闭图标悬停色 | 亮色：`#080F20`；暗色：`#E8E8E8` |
| color-dark-lighter | 通知正文 | 亮色：`#515151`；暗色：`#D9D9D9` |
| color-dark-lightest | 关闭图标 | 亮色：`#64758B`；暗色：`#C9C9C9` |
| color-error | 错误图标 | `#F53F3F` |
| color-primary | 信息及加载图标 | `#456CF6` |
| color-success | 成功图标 | `#1DB88C` |
| color-warning | 警告图标 | `#E6A23C` |
| background-color-lightest | 通知面板背景 | 亮色：`#FFFFFF`；暗色：`#252B3A` |
| box-shadow | 通知面板阴影 | 亮色：`0 0 8px 0 rgb(0 0 0 / 10%)`；暗色：`0 0 8px 0 rgb(255 255 255 / 5%)` |

### 局部

两端的尺寸与配色写成局部变量 `--vc-notice-<键>`，桌面端的默认值见下表，移动端在 `.vcm-notice`、`.vcm-notice-portals` 及各状态的 `.vc-notice__container.is-<mode>` 上覆盖（750 稿），与样式的加载顺序无关。

| 参数 | 使用位置 | 桌面端默认值 |
| --- | --- | --- |
| notice-width / notice-offset | 通知宽度 / 距右边距离 | `384px` / `24px` |
| notice-padding / notice-gap | 内边距 / 多条通知的间距 | `16px` / `16px` |
| notice-radius / notice-shadow | 圆角 / 阴影 | `4px` / box-shadow |
| notice-background | 面板背景 | background-color-lightest |
| notice-content-font-size / notice-content-line-height / notice-content-color | 正文 | `14px` / `1.5` / color-dark-lighter |
| notice-title-font-size / notice-title-color / notice-title-gap | 标题 | `16px` / color-dark-light / `8px` |
| notice-icon-size / notice-icon-line-height / notice-icon-gap / notice-icon-color | 状态图标与加载图标 | `22px` / `24px` / `8px` / 对应状态色 |
| notice-close-top / notice-close-right / notice-close-height / notice-close-size | 关闭图标位置与尺寸 | `16px` / `22px` / `24px` / `12px` |
| notice-close-color / notice-close-hover-color | 关闭图标 / 悬停 | color-dark-lightest / color-dark-light |
| notice-close-space | 可关闭时正文为关闭图标让出的宽度 | `24px` |

## API

### 属性

下列属性用于声明式 `Notice`，也可作为静态方法的配置。静态方法会固定 `fixed: false`，由全局容器在右上角定位；其 `top` 不控制全局容器。`open()` 固定无图标，其余静态方法固定各自的 `mode`。

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| title | 标题。字符串按文本渲染，也可传渲染函数或 `{ type, value }`（需要 HTML 时传 `{ type: 'html', value }`），见 [Customer](../customer/README.md) | `string \| number \| Function \| { type: string; value: any }` | - | - |
| content | 正文，取值与 title 相同 | `string \| number \| Function \| { type: string; value: any }` | - | - |
| duration | 挂载后自动关闭的延时，单位 ms；`0` 不自动关闭；鼠标悬停时暂停，移出后重新计时 | `number` | - | `4500` |
| closable | 是否显示关闭图标 | `boolean` | - | `true` |
| mode | 状态图标类型；`loading` 显示加载图标，不传时无图标 | `'info' \| 'loading' \| 'success' \| 'warning' \| 'error'` | 同类型 | - |
| top | 距顶部的距离，单位 px（`MNotice` 为 750 稿长度，默认 `0`）。声明式 `fixed` 时作用于当前通知；静态方法的通知共用一个容器，`top` 设置容器位置，以最新一次调用为准，不传时为默认值 | `number` | - | `24` |
| fixed | 是否固定在右上角 | `boolean` | - | `true` |
| onBeforeClose | 点击关闭图标前的回调，参数为点击事件 | `Function` | - | - |

`title` 和 `content` 的字符串按文本渲染；需要 HTML 时传 `{ type: 'html', value }`，这类内容只应来自可信来源，或由全局的 `sanitize` 统一清洗，见 [Customer](../customer/README.md)。

`onBeforeClose` 当前的同步返回规则是：`undefined`、`false`、`0`、空字符串等假值以及 `true` 均允许关闭，其他真值阻止关闭。返回 Promise 时，只要兑现就关闭，不检查兑现值；拒绝时保持显示，调用方需自行处理拒绝。它不暂停自动关闭计时。修改 `duration` prop 不会重设计时，需调用 `setDuration()`。

### 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| close | 自动关闭或点击图标的离场动画结束后触发；调用实例关闭方法时立即触发 | - | - |

静态调用使用配置项 `onClose: () => void` 接收关闭完成通知。`Notice.destroy()` 和返回对象的 `destroy()` 直接销毁，不触发 `onClose`。

### 方法

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| Notice.open | 展示无图标通知 | `config` | `PortalLeaf` |
| Notice.info | 展示信息通知 | `config` | `PortalLeaf` |
| Notice.loading | 展示加载通知，默认 `duration: 0`；完成后可通过 `wrapper.setMode()` 原地切换为结果通知 | `config` | `PortalLeaf` |
| Notice.success | 展示成功通知 | `config` | `PortalLeaf` |
| Notice.warning | 展示警告通知 | `config` | `PortalLeaf` |
| Notice.error | 展示错误通知 | `config` | `PortalLeaf` |
| Notice.destroy | 立即销毁全部全局通知并清理全局容器 | - | `void` |

`config` 除组件属性外，还支持 `insertion: 'first' | 'last'`（默认 `'first'`）和 `onClose`。`MNotice` 提供同样的方法，使用独立的全局容器，与 `Notice` 互不影响。

组件 ref 和返回对象的 `wrapper` 暴露以下实例方法：

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| setTitle | 更新标题 | 与 `title` 相同 | `void` |
| setContent | 更新正文 | 与 `content` 相同 | `void` |
| setMode | 切换状态图标，例如加载完成后改为 `success` | 与 `mode` 相同 | `void` |
| setDuration | 清除旧定时器，并从调用时刻重新计时；`0` 取消自动关闭 | `duration: number` | `void` |
| close / remove / hide / destroy | 立即发送关闭事件；全局调用时移除当前通知，声明式使用时由父组件卸载 | - | `void` |

实例方法不会执行 `onBeforeClose`，也不启动离场动画。

返回的 `PortalLeaf` 支持 `then/catch/finally`，正常关闭后以 `undefined` 兑现；`leaf.wrapper` 只在实例存在时可用。直接 `leaf.destroy()` 会销毁实例，但不兑现关闭 Promise，也不执行 Notice 的容器清理；清空通知请使用 `Notice.destroy()`。
