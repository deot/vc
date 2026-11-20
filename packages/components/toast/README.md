## 轻提示（Toast）

用于移动端的居中浮层，支持短暂提示、加载状态和自定义内容。`Toast` 是 `MToast` 的别名，`ToastView` 是 `MToastView` 的别名，两端使用相同实现。

### 何时使用

用于操作反馈或等待任务完成。默认显示期间有透明遮罩，遮挡页面操作并阻止遮罩上的触摸滚动；`mask: false` 时不遮挡。

### 基础用法

通过静态方法显示提示。`success`、`warning` 和 `error` 在文字上方显示对应的状态图标，`info` 只有文字。字符串内容中的换行符会换行。

:::playground
<!--
<config lang="json5">
{
	viewport: 375,
	viewportOptions: ['auto', 375],
	expandable: true
}
</config>
-->
```vue
<template>
	<div class="toast-demo">
		<div class="toast-actions">
			<Button @click="handleInfo">普通提示</Button>
			<Button @click="handleSuccess">操作成功</Button>
		</div>
		<p>{{ status }}</p>
	</div>
</template>

<script setup>
import { inject, onUnmounted, ref } from 'vue';
import { MToast, Button } from '@deot/vc';

const status = ref('提示将在 3 秒后关闭，也可点击外部区域关闭。');
const playground = inject('docs:playground');
const isInfoVisible = ref(false);
const isSuccessVisible = ref(false);

const handleInfo = playground.run(360, { visible: isInfoVisible }, () => {
	isInfoVisible.value = true;
	MToast.info('这是一条提示', 3000, () => {
		status.value = '提示已关闭';
		isInfoVisible.value = false;
	});
});
const handleSuccess = playground.run(360, { visible: isSuccessVisible }, () => {
	isSuccessVisible.value = true;
	MToast.success({
		content: '保存成功',
		duration: 1500,
		onClose: () => (isSuccessVisible.value = false)
	});
});
onUnmounted(() => {
	MToast.destroy();
});
</script>

<style scoped>
.toast-demo { padding: 16px; }
.toast-actions { display: flex; flex-wrap: wrap; gap: 12px; }
.toast-demo p { margin: 12px 0 0; line-height: 1.6; }
</style>
```
:::

### 位置与遮罩

`placement` 为 `center`（默认）、`top` 或 `bottom`，后两者距屏幕顶部 / 底部 30%。`mask: false` 时不渲染透明遮罩，提示显示期间页面仍可操作。多次调用各自独立显示、各自关闭。

:::playground
<!--
<config lang="json5">
{
	viewport: 375,
	viewportOptions: ['auto', 375],
	expandable: true
}
</config>
-->
```vue
<template>
	<div class="toast-demo">
		<div class="toast-actions">
			<Button @click="handleShow('top')">顶部</Button>
			<Button @click="handleShow('bottom')">底部</Button>
			<Button @click="count++">页面仍可点击：{{ count }}</Button>
		</div>
	</div>
</template>

<script setup>
import { inject, onUnmounted, ref } from 'vue';
import { MToast, Button } from '@deot/vc';

const playground = inject('docs:playground');
const count = ref(0);
const isVisible = ref(false);
const handleShow = playground.run(360, { visible: isVisible }, (placement) => {
	isVisible.value = true;
	MToast.success({
		content: placement === 'top' ? '已复制' : '已加入收藏',
		placement,
		mask: false,
		duration: 2000,
		onClose: () => (isVisible.value = false)
	});
});
onUnmounted(() => {
	MToast.destroy();
});
</script>

<style scoped>
.toast-demo { padding: 16px; }
.toast-actions { display: flex; flex-wrap: wrap; gap: 12px; }
</style>
```
:::

### 加载提示与手动关闭

`MToast.loading()` 默认持续显示，且点击遮罩不会关闭。下例模拟任务完成后销毁当前提示；也可以显式设置 `duration` 和 `maskClosable`。

:::playground
<!--
<config lang="json5">
{
	viewport: 375,
	viewportOptions: ['auto', 375],
	expandable: true
}
</config>
-->
```vue
<template>
	<div class="toast-demo">
		<Button @click="handleLoading">模拟加载任务</Button>
		<p class="toast-status">{{ status }}</p>
	</div>
</template>

<script setup>
import { inject, onBeforeUnmount, ref } from 'vue';
import { MToast, Button } from '@deot/vc';

const status = ref('加载提示在任务完成后关闭。');
const playground = inject('docs:playground');
const isVisible = ref(false);
let timer;
let toast;
const handleLoading = playground.run(360, { visible: isVisible }, () => {
	isVisible.value = true;
	clearTimeout(timer);
	toast?.destroy();
	status.value = '正在处理…';
	toast = MToast.loading({ content: '加载中…' });
	timer = setTimeout(() => {
		toast.destroy();
		status.value = '任务完成';
		isVisible.value = false;
	}, 2000);
});
onBeforeUnmount(() => {
	clearTimeout(timer);
	toast?.destroy();
});
</script>

<style scoped>
.toast-demo { padding: 16px; }
.toast-status { margin: 12px 0 0; line-height: 1.6; }
</style>
```
:::

### 自定义内容

`content` 的字符串按文本渲染；需要 HTML 时传 `{ type: 'html', value }`，这类内容只应来自可信来源，或由全局的 `sanitize` 统一清洗，见 [Customer](../customer/README.md)。`{ type, value }` 始终是内容而不是配置对象，后面可以继续跟位置参数或配置对象。

:::playground
<!--
<config lang="json5">
{
	viewport: 375,
	viewportOptions: ['auto', 375],
	expandable: true
}
</config>
-->
```vue
<template>
	<div class="toast-demo">
		<Button @click="handleCustom">显示自定义内容</Button>
	</div>
</template>

<script setup>
import { inject, h, onUnmounted, ref } from 'vue';
import { MToast, Button } from '@deot/vc';

const playground = inject('docs:playground');
const isVisible = ref(false);
const handleCustom = playground.run(360, { visible: isVisible }, () => {
	isVisible.value = true;
	MToast.info({
		content: () => h('div', [h('strong', '已保存'), h('div', '可以继续操作')]),
		duration: 3000,
		onClose: () => (isVisible.value = false)
	});
});
onUnmounted(() => {
	MToast.destroy();
});
</script>

<style scoped>
.toast-demo { padding: 16px; }
</style>
```
:::

## 主题与局部覆盖

全局参数通过 `--vc-<参数>` 配置，单个组件通过 `--vc-toast-<参数>` 覆盖。

移动端提示文字使用 color-contrast-light。⚠ color-mix：背景由 color-contrast-dark 以 80% 与透明色混合；加载图标的圆弧为 color-contrast-light，轨道由 color-contrast-light 以 30% 与透明色混合（在 `.vcm-toast` 上设置 Spin 的局部变量 `--vc-spin-color`、`--vc-spin-track-color`）。

透明色增强声明仅在 `@supports` 内生效；不支持 color-mix 时使用 Sass 编译的固定 rgba() 降级值，透明度与上述比例一致，降级值不会随主题变量变化。

### 全局

| 参数 | 使用位置 | 值 |
| --- | --- | --- |
| color-contrast-dark | 移动端提示背景的派生基色 | `#000000`（亮暗主题相同） |
| color-contrast-light | 移动端提示文字、状态图标、加载图标 | `#FFFFFF`（亮暗主题相同） |

### 局部

尺寸写成局部变量 `--vc-toast-<键>`（默认值为 750 稿，随 `--vc-rem` 缩放），可在 `.vcm-toast` 或其祖先上覆盖。静态提示挂载在 `body` 下，请把变量设置在 `body` 或其祖先上。

| 键 | 说明 | 默认值（750 稿） |
| --- | --- | --- |
| font-size / line-height | 文字字号 / 行高 | `32` / `48` |
| radius | 圆角 | `8` |
| padding | 纯文字的内边距 | `16 32` |
| vertical-padding | 带图标或加载时的内边距 | `32` |
| vertical-min-width | 带图标或加载时的最小宽度 | `200` |
| icon-size | 状态图标、加载图标的尺寸 | `48` |
| icon-gap | 图标与文字的间距 | `16` |
| safe-gap | 与屏幕左右边缘的最小距离 | `32` |
| offset | `top` / `bottom` 时与屏幕边缘的距离 | `30%` |

## API

### MToast 方法

下列方法也可通过 `Toast` 调用。提示方法支持 `method(options)` 或 `method(content, duration?, onClose?, maskClosable?)`；最后一个参数为配置对象时，会与前面的参数合并，例如 `MToast.info('提示内容', { duration: 0 })`。`content` 可以是字符串、数字、渲染函数或 `{ type, value }`。

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| info / success / warning / error | 显示普通提示，默认 3000ms 后关闭、可点击遮罩关闭 | `options` 或上述位置参数 | `PortalLeaf` |
| loading | 显示加载图标，默认 `duration: 0`、`maskClosable: false` | `options` 或上述位置参数 | `PortalLeaf` |
| destroy | 立即销毁所有由 Toast / MToast 静态方法创建的提示 | - | `void` |

`options` 接受下表中的属性及 `onClose` 回调（无业务参数）。自动关闭或点击遮罩关闭后会调用 `onClose`，返回实例也会完成，可以使用 `then` / `catch` / `finally`。返回值并非关闭函数：`leaf.destroy()` 立即销毁当前提示，不触发 `onClose`，也不会使等待中的 Promise 完成；`leaf.resolve()` 会销毁并触发完成回调。

每次调用创建独立提示，各自计时、各自关闭；同一 `placement` 的多条提示会重叠，可用不同位置区分，或保存返回实例按需销毁。

### MToastView 属性

以下属性也适用于 `ToastView`、模板中的 `MToast` / `Toast` 及静态方法的 `options`。

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| content | 提示内容。字符串按文本渲染，也可传渲染函数或 `{ type, value }`（需要 HTML 时传 `{ type: 'html', value }`），见 [Customer](../customer/README.md) | `string \| number \| Function \| { type: string; value: any }` | - | - |
| mask | 是否显示透明遮罩；为 `false` 时提示显示期间页面仍可操作 | `boolean` | - | `true` |
| maskClosable | 是否允许点击透明遮罩关闭，仅 `mask` 为 `true` 时生效 | `boolean` | - | `true` |
| duration | 挂载时开始计时，单位 ms；`0` 表示不自动关闭 | `number` | - | `3000` |
| mode | `loading` 显示加载图标，`success` / `warning` / `error` 显示状态图标（图标在上、文字在下），`info` 只有文字；`error` 的提示为 `role="alert"`，其余为 `role="status"` | `string` | `info` / `loading` / `success` / `warning` / `error` | `info` |
| placement | 显示位置，`top` / `bottom` 距屏幕边缘 30% | `string` | `top` / `center` / `bottom` | `center` |

直接使用 `<MToastView mode="loading" />` 时仍采用属性默认值；只有静态方法 `MToast.loading()` 会设置持续显示和不可点击遮罩关闭的默认值。`content` 变化会更新内容，修改 `duration` prop 不会重启计时，请使用 `setDuration`。

### MToastView 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| close | 自动关闭或点击遮罩的离场动画结束时触发；调用实例关闭方法时立即触发 | - | - |

直接以组件形式使用时，请在 `close` 事件中通过 `v-if` 卸载组件，以移除透明遮罩。组件没有内容插槽，请使用 `content`。

### MToastView 方法

通过组件 ref 调用；静态方法返回实例的 `leaf.wrapper` 也可访问这些方法。

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| setContent | 更新当前显示内容 | `string \| Function` | `void` |
| setDuration | 清除原计时器并重新计时；`0` 取消自动关闭 | `number`，单位 ms | `void` |
| destroy / remove / close / hide | 立即发出关闭通知，交由 Portal 或调用方卸载；直接使用组件时不会自行移除 DOM | - | `void` |

### 主题

默认在亮色和暗色主题下均保留白字、半透明深色背景，可通过 `--vc-toast-color-contrast-light`（文字与图标）和 `--vc-toast-color-contrast-dark`（背景基色）覆盖，尺寸见上文「局部」。静态提示挂载在 `body` 下，请把主题变量设置在 `body` 或其祖先上。
