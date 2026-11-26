## 通知提醒（Notice）

在页面右上角展示带标题、正文和状态图标的通知。`Notice` 同时支持组件渲染和静态方法调用。移动端入口导出的 `MNotice` 属性与方法相同，显示为顶部全宽通栏，见 [移动端](#移动端)。

### 何时使用

- 展示系统通知、操作结果或需要较长描述的反馈。
- 在异步任务期间保留通知，并在任务完成后更新内容。

### 基础用法

`Notice.open()` 展示无图标通知，`info()`、`success()`、`warning()`、`error()` 展示对应状态。默认在 `4500ms` 后关闭，鼠标悬停在通知上时暂停计时，移出后重新计时；正文缺省或为空字符串时只显示标题。全局通知可同时存在，默认把新通知插入顶部，`insertion: 'last'` 时追加到底部；`top` 设置全局容器距顶部的距离。`error` 通知为 `role="alert"`，其余为 `role="status"`。`Notice.destroy()` 立即清空全部通知。

:::playground
<!--
<config lang="json5">
{
	views: ['runtime', 'files'],
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="notice-demo">
		<div class="notice-demo__row">
			<Button v-for="item in notices" :key="item.label" @click="handleOpen(item)">{{ item.label }}</Button>
		</div>
		<div class="notice-demo__row">
			<Checkbox v-model="isLast">追加到底部</Checkbox>
			<Checkbox v-model="isLower">距顶部 80px</Checkbox>
			<Button @click="handleClear">清空通知</Button>
		</div>
		<p class="notice-demo__result">{{ result }}</p>
	</div>
</template>

<script setup>
import { onUnmounted, ref } from 'vue';
import { Button, Checkbox, Notice } from '@deot/vc';

const isLast = ref(false);
const isLower = ref(false);
const result = ref('选择一种通知类型');
const notices = [
	{ method: 'open', label: '普通通知', content: '通知支持标题和正文。' },
	{ method: 'info', label: '信息', content: '你有一条新的系统消息。' },
	{ method: 'success', label: '成功', content: '文件已保存。' },
	{ method: 'warning', label: '警告', content: '请检查尚未完成的操作。' },
	{ method: 'error', label: '错误', content: '保存失败，请稍后重试。' },
	{ method: 'open', label: '仅标题', content: '' }
];

const handleOpen = (item) => {
	result.value = `${item.label}：4500ms 后自动关闭，也可点击关闭图标`;
	Notice[item.method]({
		title: item.label,
		content: item.content,
		insertion: isLast.value ? 'last' : 'first',
		top: isLower.value ? 80 : 24,
		onClose: () => {
			result.value = `${item.label}已关闭`;
		}
	});
};

const handleClear = () => {
	Notice.destroy();
	result.value = '已清空全部通知';
};

onUnmounted(() => Notice.destroy());
</script>

<style scoped>
.notice-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.notice-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}

.notice-demo__result {
	margin: 0;
}
</style>
```
:::

### 更新内容与延迟关闭

`duration: 0` 保持通知显示。静态方法返回 `PortalLeaf`，通过 `leaf.wrapper` 调用实例方法：`setTitle()`、`setContent()` 更新标题与正文（字符串或 render 函数），`setMode()` 切换状态图标，`setDuration()` 从当前时刻重新计时，`close()` 立即关闭。render 函数接收组件属性和上下文，使用 Vue 的 `h` 返回节点。`Notice.loading()` 显示加载图标，默认 `duration: 0`。

点击关闭图标会调用 `onBeforeClose(event)`；返回 Promise 时等待其兑现后关闭。自动关闭和实例方法不执行这个回调。

:::playground
<!--
<config lang="json5">
{
	views: ['runtime', 'files'],
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="notice-demo">
		<div class="notice-demo__row">
			<Button :disabled="isVisible" @click="handleOpen">开始任务</Button>
			<Button :disabled="!isVisible" @click="handleComplete">更新为已完成</Button>
			<Button :disabled="!isVisible" @click="handleClose">立即关闭</Button>
		</div>
		<p class="notice-demo__result">{{ result }}</p>
	</div>
</template>

<script setup>
import { h, onUnmounted, ref } from 'vue';
import { Button, Notice } from '@deot/vc';

const isVisible = ref(false);
const result = ref('通知持续显示；点击关闭图标会等待 800ms');
let leaf;

const handleOpen = () => {
	isVisible.value = true;
	result.value = '任务进行中，可更新内容或点击关闭图标';
	leaf = Notice.loading({
		title: '任务进度',
		content: () => h('span', '正在处理文件…'),
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
};

const handleComplete = () => {
	leaf?.wrapper?.setTitle('任务完成');
	leaf?.wrapper?.setContent(() => h('strong', '文件处理完成'));
	leaf?.wrapper?.setMode('success');
	leaf?.wrapper?.setDuration(1800);
	result.value = '已更新，1800ms 后自动关闭';
};

const handleClose = () => {
	leaf?.wrapper?.close();
};

onUnmounted(() => Notice.destroy());
</script>

<style scoped>
.notice-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.notice-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}

.notice-demo__result {
	margin: 0;
}
</style>
```
:::

### 在页面中渲染

声明式 `Notice` 使用 `fixed: false` 可放入普通文档流。它在挂载时显示并开始计时；收到 `close` 后由父组件卸载，再次展示时重新挂载。`mode="loading"` 显示加载图标，声明式与静态方法（`Notice.loading()`）均可使用。`closable` 为 `false` 时不显示关闭图标，可通过 ref 调用 `setMode()` 等实例方法与 `remove()`（同 `close` / `hide` / `destroy`）关闭。

:::playground
<!--
<config lang="json5">
{
	views: ['runtime', 'files'],
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="notice-demo">
		<div class="notice-demo__row">
			<Button :disabled="isVisible" @click="handleShow">显示页面内通知</Button>
			<Button :disabled="!isVisible" @click="handleDone">完成并移除</Button>
		</div>
		<Notice
			v-if="isVisible"
			ref="noticeRef"
			:fixed="false"
			:duration="0"
			:closable="false"
			mode="loading"
			title="正在同步"
			content="这条通知位于页面布局中，没有关闭图标。"
			@close="handleClose"
		/>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, Notice } from '@deot/vc';

const noticeRef = ref();
const isVisible = ref(true);

const handleShow = () => {
	isVisible.value = true;
};

const handleDone = () => {
	noticeRef.value.setMode('success');
	setTimeout(() => noticeRef.value?.remove(), 800);
};

const handleClose = () => {
	isVisible.value = false;
};
</script>

<style scoped>
.notice-demo {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 16px;
}

.notice-demo__row {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}
</style>
```
:::

## 移动端

`MNotice` 的属性、事件、静态方法与 `Notice` 相同，结构沿用桌面端，根节点另有标记类 `.vcm-notice`。尺寸按 750 稿设计，写为 `calc(var(--vc-rem) * n)`，随 `--vc-rem` 缩放，底栏切换 `rem` 可查看不同屏宽下的效果。

- 顶部全宽通栏，`fixed` 浮层，从上方滑入、向上滑出，只改变 `transform`，不推动页面，页面不会抖动。
- 多条通知时新通知在最上方；计时先到的旧通知排在下方，离场时上方的通知不移动。
- 配色：`success`、`warning`、`error` 为状态色实底白字；`info`、`loading` 为主色浅底（主色 10% 与 background-color-lightest 混合，不支持时用 background-color-light）主色字；`open()` 为白底深字加阴影。
- 上滑关闭：手指按住时暂停计时，通知只跟随向上的位移；松手时上移超过自身高度的 30%，或快速上滑，即关闭（先执行 `onBeforeClose`，阻止时回弹）；否则回弹并重新计时。不可关闭（`closable: false`）的通知同样可以上滑关闭。
- `top` 为 750 稿长度，默认 `0`；为 `0` 时最上面一条的上内边距加上 `env(safe-area-inset-top)`，背景延伸进安全区；放在导航栏下方时传 `88`。静态方法的 `top` 同样设置全局容器的位置，换算为 `calc(var(--vc-rem) * n)`。

:::playground
<!--
<config lang="json5">
{
	mobile: true,
	local: false,
	previewInset: [12, 0],
	previewVariables: [{
		name: '--rem',
		label: 'rem',
		values: ['auto', '0.5px', '0.552px', '0.64px', '1px']
	}]
}
</config>
-->
```vue
<template>
	<div class="m-notice-demo">
		<div class="m-notice-demo__row">
			<MButton v-for="item in notices" :key="item.label" @click="handleOpen(item)">{{ item.label }}</MButton>
		</div>
		<div class="m-notice-demo__row">
			<MButton type="primary" @click="handleBelow">导航栏下方（top 88）</MButton>
			<MButton @click="handleClear">清空</MButton>
		</div>
		<p class="m-notice-demo__result">{{ result }}</p>
	</div>
</template>

<script setup>
import { onUnmounted, ref } from 'vue';
import { MButton, MNotice } from '@deot/vc';

const result = ref('选择一种通知类型');
const notices = [
	{ method: 'open', label: '普通', content: '一条普通通知' },
	{ method: 'info', label: '信息', content: '你有一条新的消息' },
	{ method: 'success', label: '成功', content: '文件已保存' },
	{ method: 'warning', label: '警告', content: '请检查未完成的操作' },
	{ method: 'error', label: '错误', content: '保存失败，请稍后重试' },
	{ method: 'loading', label: '加载', content: '正在处理…' }
];

const handleOpen = (item) => {
	result.value = `${item.label}：上滑可关闭`;
	MNotice[item.method]({
		content: item.content,
		top: 0,
		duration: item.method === 'loading' ? 2000 : 3000,
		onClose: () => {
			result.value = `${item.label}已关闭`;
		}
	});
};

const handleBelow = () => {
	MNotice.success({ title: '已同步', content: '通知显示在导航栏下方，不可点击关闭', top: 88, closable: false });
};

const handleClear = () => {
	MNotice.destroy();
	result.value = '已清空';
};

onUnmounted(() => MNotice.destroy());
</script>

<style scoped>
.m-notice-demo {
	display: flex;
	flex-direction: column;
	gap: calc(var(--vc-rem) * 32);
	padding-inline: calc(var(--vc-rem) * 32);
}

.m-notice-demo__row {
	display: flex;
	flex-wrap: wrap;
	gap: calc(var(--vc-rem) * 16);
}

.m-notice-demo__result {
	margin: 0;
}
</style>
```
:::

尺寸如下（括号内为 375 宽下的 px）：

| 项 | 值 |
| --- | --- |
| 最小高度 | 72（36） |
| 内边距 | 16（8） 32（16）；可关闭时左右 80（40），内容保持居中；标题与正文同时存在时左对齐，可关闭时只在右侧留 80（40） |
| 字号、行高 | 28（14） / 40（20）；带正文时标题 500，正文 26（13）、透明度 0.9 |
| 状态图标、加载图标 | 28（14），与文字间距 12（6） |
| 关闭图标 | 24（12），点击区 64（32），距右边 16（8） |

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

`onBeforeClose` 当前的同步返回规则是：`undefined`、`false`、`0`、空字符串等假值以及 `true` 均允许关闭，其他真值阻止关闭。返回 Promise 时，只要兑现就关闭，不检查兑现值；拒绝时保持显示（上滑关闭时回弹），组件内部接住拒绝，不会产生未处理的 Promise 拒绝。它不暂停自动关闭计时。修改 `duration` prop 不会重设计时，需调用 `setDuration()`。

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
