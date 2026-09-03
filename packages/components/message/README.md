## 全局提示（Message）

在页面顶部居中展示轻量级反馈，并在指定时间后自动关闭。`Message` 是带函数式调用方法的 `MessageView`；`MMessage` 与 `Message` 指向同一个组件。

### 何时使用

- 在操作完成后展示信息、成功、警告或错误反馈。
- 在异步任务期间展示不自动关闭的加载状态。

### 基础用法

`Message` 提供 `info`、`success`、`warning`、`error` 和 `loading` 五种提示方法。除 `loading` 默认不自动关闭外，其余提示默认在 1500ms 后关闭。

:::playground
<!--
<config lang="json5">
{
	viewport: [375, 240],
	viewportOptions: ['auto', [375, 240]],
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="message-demo">
		<Button
			v-for="item in messages"
			:key="item.mode"
			:wait="0"
			@click="handleOpen(item)"
		>
			{{ item.label }}
		</Button>
	</div>
</template>

<script setup>
import { Button, Message } from '@deot/vc';

const messages = [
	{ mode: 'info', label: '信息', content: '这是一条信息提示' },
	{ mode: 'success', label: '成功', content: '操作已成功完成' },
	{ mode: 'warning', label: '警告', content: '请检查当前操作' },
	{ mode: 'error', label: '错误', content: '操作失败，请稍后重试' },
	{ mode: 'loading', label: '加载', content: '正在加载中' }
];

const handleOpen = (item) => {
	if (item.mode === 'loading') {
		Message.loading(item.content, 1200);
		return;
	}

	Message[item.mode](item.content);
};
</script>

<style scoped>
.message-demo {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}
</style>
```
:::

### 手动关闭

将 `duration` 设为 `0` 可关闭自动计时，`closable` 会显示关闭入口。`onBeforeClose` 在点击关闭入口或遮罩时调用，并支持等待 Promise。

:::playground
<!--
<config lang="json5">
{
	viewport: [375, 240],
	viewportOptions: ['auto', [375, 240]],
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="message-close-demo">
		<Button :wait="0" @click="handleOpen">
			显示可关闭提示
		</Button>
		<span>{{ status }}</span>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, Message } from '@deot/vc';

const status = ref('尚未关闭');

const handleOpen = () => {
	status.value = '等待关闭';
	Message.info({
		content: '点击右侧图标关闭，关闭前等待 500ms',
		duration: 0,
		closable: true,
		onBeforeClose: () => new Promise(resolve => setTimeout(resolve, 500)),
		onClose: () => {
			status.value = '提示已关闭';
		}
	});
};
</script>

<style scoped>
.message-close-demo {
	display: flex;
	align-items: center;
	gap: 12px;
	font-size: 14px;
}
</style>
```
:::

### 内容渲染

`content` 支持字符串或与 `Customer` 一致的渲染函数。字符串通过 `innerHTML` 渲染，只应传入可信内容；需要渲染 VNode 时，应在外部导入 Vue 的 `h` 并在函数中调用。

函数式方法既支持配置对象，也支持 `Message.info(content, duration, onClose)` 形式；最后一个参数为配置对象时，会与前面的参数合并，例如 `Message.info('提示内容', { closable: true, duration: 0 })`。

## API

### Message / MessageView 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| content | 提示内容；字符串通过 `innerHTML` 渲染 | `string \| ((attrs: Record<string, unknown>, context: SetupContext) => any)` | - | `undefined` |
| mask | `fixed` 为 `true` 时是否渲染透明遮罩 | `boolean` | - | `true` |
| maskClosable | 是否允许点击遮罩关闭提示 | `boolean` | - | `true` |
| fixed | 是否使用固定定位；设为 `false` 时不渲染遮罩，也不应用 `top` | `boolean` | - | `true` |
| duration | 自动关闭延时，单位为 ms；`0` 表示不自动关闭 | `number` | - | `1500` |
| top | 固定定位时距离页面顶部的距离，单位为 px | `number` | - | `30` |
| closable | 是否显示关闭入口 | `boolean` | - | `false` |
| mode | 提示状态；`loading` 使用加载指示器，其余状态使用对应图标 | `'info' \| 'loading' \| 'success' \| 'warning' \| 'error'` | `info`、`loading`、`success`、`warning`、`error` | `info` |
| onBeforeClose | 点击关闭入口或遮罩前调用；Promise resolve 后关闭 | `(event: Event) => any` | - | `undefined` |

### 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| close | 提示离场完成或通过 exposed 关闭方法移除时触发 | - | - |
| portal-fulfilled | 提示关闭完成时触发，供 Portal 调用链完成使用 | - | - |

### Message / MMessage 静态方法

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| info | 显示信息提示 | `options` 或 `content, duration?, onClose?` | 可等待的 Portal 实例；关闭后解析为 `undefined` |
| success | 显示成功提示 | `options` 或 `content, duration?, onClose?` | 同 `info` |
| warning | 显示警告提示 | `options` 或 `content, duration?, onClose?` | 同 `info` |
| error | 显示错误提示 | `options` 或 `content, duration?, onClose?` | 同 `info` |
| loading | 显示加载提示；默认 `duration: 0`、`maskClosable: false` | `options` 或 `content, duration?, onClose?` | 同 `info` |
| destroy | 销毁当前全部 Message Portal 实例 | - | `void` |

`options` 支持上述组件属性以及关闭完成后的 `onClose` 回调。

### Message / MessageView exposed 方法

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| setContent | 更新当前提示内容 | `content` | `void` |
| setDuration | 重新设置自动关闭延时；`0` 表示不自动关闭 | `duration: number` | `void` |
| close / remove / destroy / hide | 触发 `close` 和 `portal-fulfilled`，由 Portal 移除实例 | - | `void` |
