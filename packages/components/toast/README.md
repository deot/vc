## 轻提示（Toast）

用于移动端的居中浮层，支持短暂提示、加载状态和自定义内容。`Toast` 是 `MToast` 的别名，`ToastView` 是 `MToastView` 的别名，两端使用相同实现。

### 何时使用

用于操作反馈或等待任务完成。显示期间有透明遮罩，遮挡页面操作并阻止遮罩上的触摸滚动。

### 基础用法

通过静态方法显示提示。`info`、`success`、`warning` 和 `error` 当前具有相同外观，不额外显示状态图标。

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
	<div :class="['toast-demo', { 'is-expanded': expanded }]">
		<div class="toast-actions">
			<Button @click="handleInfo">普通提示</Button>
			<Button @click="handleSuccess">操作成功</Button>
		</div>
		<p>{{ status }}</p>
	</div>
</template>

<script setup>
import { nextTick, onUnmounted, ref } from 'vue';
import { MToast, Button } from '@deot/vc';

const status = ref('提示将在 3 秒后关闭，也可点击外部区域关闭。');
const expanded = ref(false);
let disposed = false;

const prepare = async () => {
	expanded.value = true;
	await nextTick();
	// Playground 的 iframe 需要先完成高度同步，普通业务页面无需此步骤。
	await new Promise((resolve) => {
		const check = () => {
			disposed || window.innerHeight >= 360 ? resolve() : requestAnimationFrame(check);
		};
		check();
	});
};
const handleInfo = async () => {
	await prepare();
	if (disposed) return;
	MToast.info('这是一条提示', 3000, () => {
		status.value = '提示已关闭';
		expanded.value = false;
	});
};
const handleSuccess = async () => {
	await prepare();
	if (disposed) return;
	MToast.success({
		content: '保存成功',
		duration: 1500,
		onClose: () => (expanded.value = false)
	});
};
onUnmounted(() => {
	disposed = true;
	MToast.destroy();
});
</script>

<style scoped>
.toast-demo { padding: 16px; }
.toast-demo.is-expanded { min-height: 360px; }
.toast-actions { display: flex; flex-wrap: wrap; gap: 12px; }
.toast-demo p { margin: 12px 0 0; line-height: 1.6; }
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
	<div :class="['toast-demo', { 'is-expanded': expanded }]">
		<Button @click="handleLoading">模拟加载任务</Button>
		<p class="toast-status">{{ status }}</p>
	</div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, ref } from 'vue';
import { MToast, Button } from '@deot/vc';

const status = ref('加载提示在任务完成后关闭。');
const expanded = ref(false);
let timer;
let toast;
let disposed = false;
const handleLoading = async () => {
	clearTimeout(timer);
	toast?.destroy();
	status.value = '正在处理…';
	expanded.value = true;
	await nextTick();
	// Playground 的 iframe 需要先完成高度同步，普通业务页面无需此步骤。
	await new Promise((resolve) => {
		const check = () => {
			disposed || window.innerHeight >= 360 ? resolve() : requestAnimationFrame(check);
		};
		check();
	});
	if (disposed) return;
	toast = MToast.loading({ content: '加载中…' });
	timer = setTimeout(() => {
		toast.destroy();
		status.value = '任务完成';
		expanded.value = false;
	}, 2000);
};
onBeforeUnmount(() => {
	disposed = true;
	clearTimeout(timer);
	toast?.destroy();
});
</script>

<style scoped>
.toast-demo { padding: 16px; }
.toast-demo.is-expanded { min-height: 360px; }
.toast-status { margin: 12px 0 0; line-height: 1.6; }
</style>
```
:::

### 自定义内容

`content` 支持渲染函数。字符串会作为 HTML 渲染，请只传入可信内容；展示未经信任的文本时，可通过 `h` 创建文本节点。

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
	<div :class="['toast-demo', { 'is-expanded': expanded }]">
		<Button @click="handleCustom">显示自定义内容</Button>
	</div>
</template>

<script setup>
import { h, nextTick, onUnmounted, ref } from 'vue';
import { MToast, Button } from '@deot/vc';

const expanded = ref(false);
let disposed = false;
const handleCustom = async () => {
	expanded.value = true;
	await nextTick();
	// Playground 的 iframe 需要先完成高度同步，普通业务页面无需此步骤。
	await new Promise((resolve) => {
		const check = () => {
			disposed || window.innerHeight >= 360 ? resolve() : requestAnimationFrame(check);
		};
		check();
	});
	if (disposed) return;
	MToast.info({
		content: () => h('div', [h('strong', '已保存'), h('div', '可以继续操作')]),
		duration: 3000,
		onClose: () => (expanded.value = false)
	});
};
onUnmounted(() => {
	disposed = true;
	MToast.destroy();
});
</script>

<style scoped>
.toast-demo { padding: 16px; }
.toast-demo.is-expanded { min-height: 360px; }
</style>
```
:::

## API

### MToast 方法

下列方法也可通过 `Toast` 调用。提示方法支持 `method(options)` 或 `method(content, duration?, onClose?, maskClosable?)`，`content` 可以是字符串或渲染函数。

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| info / success / warning / error | 显示普通提示，默认 3000ms 后关闭、可点击遮罩关闭 | `options` 或上述位置参数 | `PortalLeaf` |
| loading | 显示加载图标，默认 `duration: 0`、`maskClosable: false` | `options` 或上述位置参数 | `PortalLeaf` |
| destroy | 立即销毁所有由 Toast / MToast 静态方法创建的提示 | - | `void` |

`options` 接受下表中的属性及 `onClose` 回调（无业务参数）。自动关闭或点击遮罩关闭后会调用 `onClose`，返回实例也会完成，可以使用 `then` / `catch` / `finally`。返回值并非关闭函数：`leaf.destroy()` 立即销毁当前提示，不触发 `onClose`，也不会使等待中的 Promise 完成；`leaf.resolve()` 会销毁并触发完成回调。

每次调用创建独立提示，多次同时调用会在屏幕中央重叠；应按需保存返回实例并销毁。

### MToastView 属性

以下属性也适用于 `ToastView`、模板中的 `MToast` / `Toast` 及静态方法的 `options`。

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| content | HTML 字符串或 Customer 渲染函数 | `string \| Function` | - | - |
| maskClosable | 是否允许点击透明遮罩关闭 | `boolean` | - | `true` |
| duration | 挂载时开始计时，单位 ms；`0` 表示不自动关闭 | `number` | - | `3000` |
| mode | 仅 `loading` 显示加载图标，其余模式外观相同 | `string` | `info` / `loading` / `success` / `warning` / `error` | `info` |

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

默认在亮色和暗色主题下均保留白字、半透明深色背景，可通过 `--vc-toast-content-color` 和 `--vc-toast-surface-color` 覆盖。加载图标使用 Spin 的主题变量。静态提示挂载在 `body` 下，请把主题变量设置在 `body` 或其祖先上。
