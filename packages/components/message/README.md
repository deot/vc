## 全局提示（Message）

在页面顶部居中展示轻量级反馈，并在指定时间后自动关闭。`Message` 是带函数式调用方法的 `MessageView`。

移动端入口导出的 `MMessage` 与 `Message` 是同一实现。

### 何时使用

- 在操作完成后展示信息、成功、警告或错误反馈。
- 在异步任务期间展示不自动关闭的加载状态。

### 基础用法

`Message` 提供 `info`、`success`、`warning`、`error` 和 `loading` 五种提示方法。除 `loading` 默认不自动关闭外，其余提示默认在 3000ms 后关闭；鼠标悬停在提示上时暂停计时，移出后重新计时。多条提示从 `top` 开始依次向下排列，前面的提示关闭后，后续提示上移补位。`error` 提示为 `role="alert"`，其余为 `role="status"`。

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
	<div class="m-message-demo">
		<MButton
			v-for="item in messages"
			:key="item.mode"
			:wait="0"
			@click="handleOpen(item)"
		>
			{{ item.label }}
		</MButton>
	</div>
</template>

<script setup>
import { onUnmounted } from 'vue';
import { MButton, Message } from '@deot/vc';

const messages = [
	{ mode: 'info', label: '信息', content: '这是一条信息提示' },
	{ mode: 'success', label: '成功', content: '操作已成功完成' },
	{ mode: 'warning', label: '警告', content: '请检查当前操作' },
	{ mode: 'error', label: '错误', content: '操作失败，请稍后重试' },
	{ mode: 'loading', label: '加载', content: '正在加载中' }
];

const handleOpen = (item) => {
	if (item.mode === 'loading') {
		Message.loading({ content: item.content, duration: 1200 });
		return;
	}

	Message[item.mode]({ content: item.content });
};

onUnmounted(() => {
	Message.destroy();
});
</script>

<style scoped>
.m-message-demo {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: calc(var(--vc-rem) * 16);
	padding-inline: calc(var(--vc-rem) * 32);
}
</style>
```
:::

### 手动关闭

将 `duration` 设为 `0` 可关闭自动计时，`closable` 会显示关闭入口。`onBeforeClose` 在点击关闭入口或遮罩时调用，并支持等待 Promise；关闭完成后调用 `onClose`。

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
	<div class="m-message-demo">
		<MButton :wait="0" @click="handleOpen">显示可关闭提示</MButton>
		<p class="m-message-demo__result">{{ status }}</p>
	</div>
</template>

<script setup>
import { onUnmounted, ref } from 'vue';
import { MButton, Message } from '@deot/vc';

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

onUnmounted(() => {
	Message.destroy();
});
</script>

<style scoped>
.m-message-demo {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: calc(var(--vc-rem) * 32);
	padding-inline: calc(var(--vc-rem) * 32);
}

.m-message-demo__result {
	margin: 0;
}
</style>
```
:::

### 加载后切换状态

`loading` 返回的实例可以通过 `wrapper.setMode`、`setContent`、`setDuration` 原地切换为结果提示，位置不变。

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
	<div class="m-message-demo">
		<MButton type="primary" :wait="0" @click="handleSave">保存</MButton>
	</div>
</template>

<script setup>
import { onUnmounted } from 'vue';
import { MButton, Message } from '@deot/vc';

const handleSave = () => {
	const message = Message.loading({ content: '正在保存' });
	setTimeout(() => {
		message.wrapper.setMode('success');
		message.wrapper.setContent('保存成功');
		message.wrapper.setDuration(3000);
	}, 1200);
};

onUnmounted(() => {
	Message.destroy();
});
</script>

<style scoped>
.m-message-demo {
	display: flex;
	padding-inline: calc(var(--vc-rem) * 32);
}
</style>
```
:::

### 位置与遮罩

`top` 设置第一条提示距离页面顶部的距离（px）。固定定位时默认渲染透明遮罩，点击遮罩会关闭提示：`mask` 设为 `false` 不渲染遮罩，页面可继续操作；`maskClosable` 设为 `false` 时点击遮罩不关闭。

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
	<div class="message-demo">
		<Button :wait="0" @click="handleTop">距顶部 120px</Button>
		<Button :wait="0" @click="handleNoMask">无遮罩</Button>
		<Button :wait="0" @click="handleMaskLocked">遮罩不可关闭</Button>
	</div>
</template>

<script setup>
import { onUnmounted } from 'vue';
import { Button, Message } from '@deot/vc';

const handleTop = () => {
	Message.info({ content: '这条提示距顶部 120px', top: 120 });
};

const handleNoMask = () => {
	Message.info({ content: '没有遮罩，可以继续点击页面', mask: false });
};

const handleMaskLocked = () => {
	Message.warning({
		content: '点击遮罩不会关闭，请点击右侧图标',
		duration: 0,
		closable: true,
		maskClosable: false
	});
};

onUnmounted(() => {
	Message.destroy();
});
</script>

<style scoped>
.message-demo {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}
</style>
```
:::

### 内容渲染

`content` 的字符串按文本渲染；需要 HTML 时传 `{ type: 'html', value }`，这类内容只应来自可信来源，或由全局的 `sanitize` 统一清洗，见 [Customer](../customer/README.md)。`{ type, value }` 始终是内容而不是配置对象，后面可以继续跟位置参数或配置对象，例如 `Message.info({ type: 'html', value }, 3000)`。需要渲染 VNode 时，应在外部导入 Vue 的 `h` 并在函数中调用。

函数式方法既支持配置对象，也支持 `Message.info(content, duration, onClose)` 形式；最后一个参数为配置对象时，会与前面的参数合并，例如 `Message.info('提示内容', { closable: true, duration: 0 })`。

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
	<div class="message-demo">
		<div class="message-demo__row">
			<Button :wait="0" @click="handleHtml">HTML 内容</Button>
			<Button :wait="0" @click="handleRender">渲染函数</Button>
			<Button :wait="0" @click="handlePositional">位置参数</Button>
			<Button :wait="0" @click="handleMerge">合并配置</Button>
		</div>
		<p class="message-demo__result">{{ status }}</p>
	</div>
</template>

<script setup>
import { h, onUnmounted, ref } from 'vue';
import { Button, Message } from '@deot/vc';

const status = ref('等待操作');

const handleHtml = () => {
	Message.success({ type: 'html', value: '已完成 <b>3</b> 项' }, 3000);
};

const handleRender = () => {
	Message.info({
		content: () => h('span', ['渲染函数：', h('b', '第 1 行')])
	});
};

const handlePositional = () => {
	status.value = '等待关闭';
	Message.info('1.5 秒后关闭', 1500, () => {
		status.value = '位置参数提示已关闭';
	});
};

const handleMerge = () => {
	Message.warning('不自动关闭，点击右侧图标关闭', { closable: true, duration: 0 });
};

onUnmounted(() => {
	Message.destroy();
});
</script>

<style scoped>
.message-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.message-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}

.message-demo__result {
	margin: 0;
}
</style>
```
:::

### 内嵌展示

作为组件使用并设置 `fixed` 为 `false` 时，提示在原位置渲染，不渲染遮罩，也不应用 `top`。`mode` 设置状态；提示离场完成后触发 `close` 事件。

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
	<div class="message-demo">
		<div class="message-demo__row">
			<Button :wait="0" @click="handleReset">重新显示</Button>
		</div>
		<div :key="seed" class="message-demo__list">
			<Message
				v-for="item in modes"
				:key="item.mode"
				:fixed="false"
				:mode="item.mode"
				:content="item.content"
				:duration="0"
				closable
				@close="handleClose(item)"
			/>
		</div>
		<p class="message-demo__result">{{ status }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, Message } from '@deot/vc';

const seed = ref(0);
const status = ref('点击提示右侧图标关闭');
const modes = [
	{ mode: 'info', content: '信息提示' },
	{ mode: 'success', content: '成功提示' },
	{ mode: 'warning', content: '警告提示' },
	{ mode: 'error', content: '错误提示' },
	{ mode: 'loading', content: '加载提示' }
];

const handleClose = (item) => {
	status.value = `close：${item.content}`;
};

const handleReset = () => {
	seed.value++;
	status.value = '点击提示右侧图标关闭';
};
</script>

<style scoped>
.message-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.message-demo__row {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}

.message-demo__list {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 8px;
}

.message-demo__result {
	margin: 0;
}
</style>
```
:::

## 主题与局部覆盖

全局参数通过 `--vc-<参数>` 配置，组件级覆盖使用 `--vc-message-<参数>`。局部参数仅提供组件级入口；可在组件根节点或其祖先上设置。

弹层或遮罩通过 Portal 挂载时，覆盖变量需作用于实际浮层或其祖先。

内嵌或复用的 [spin](../spin/README.md#主题与局部覆盖) 使用各自的主题入口。

### 全局

| 参数 | 使用位置 | 值 |
| --- | --- | --- |
| color-error | 错误图标 | `#F53F3F` |
| color-mask | 遮罩背景 | 亮色：`rgb(0 0 0 / 40%)`；暗色：`rgb(255 255 255 / 40%)` |
| color-primary | 信息图标 | `#456CF6` |
| color-success | 成功图标 | `#1DB88C` |
| color-warning | 警告图标 | `#E6A23C` |
| background-color-lightest | 提示面板背景 | 亮色：`#FFFFFF`；暗色：`#252B3A` |
| foreground-color | 提示文字 | 亮色：`#080F20`；暗色：`#F8F8F8` |
| box-shadow | 提示面板阴影 | 亮色：`0 0 8px 0 rgb(0 0 0 / 10%)`；暗色：`0 0 8px 0 rgb(255 255 255 / 5%)` |

### 局部

当前组件没有额外的局部 CSS 主题参数。

## API

### Message / MessageView 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| content | 提示内容。字符串按文本渲染，也可传渲染函数或 `{ type, value }`（需要 HTML 时传 `{ type: 'html', value }`），见 [Customer](../customer/README.md) | `string \| number \| Function \| { type: string; value: any }` | - | `undefined` |
| mask | `fixed` 为 `true` 时是否渲染透明遮罩 | `boolean` | - | `true` |
| maskClosable | 是否允许点击遮罩关闭提示 | `boolean` | - | `true` |
| fixed | 是否使用固定定位；设为 `false` 时不渲染遮罩，也不应用 `top` | `boolean` | - | `true` |
| duration | 自动关闭延时，单位为 ms；`0` 表示不自动关闭；鼠标悬停时暂停，移出后重新计时 | `number` | - | `3000` |
| top | 固定定位时第一条提示距离页面顶部的距离，单位为 px；同一 `top` 的多条提示依次向下排列，间距 7px | `number` | - | `30` |
| closable | 是否显示关闭入口 | `boolean` | - | `false` |
| mode | 提示状态；`loading` 使用加载指示器，其余状态使用对应图标 | `'info' \| 'loading' \| 'success' \| 'warning' \| 'error'` | `info`、`loading`、`success`、`warning`、`error` | `info` |
| onBeforeClose | 点击关闭入口或遮罩前调用；Promise resolve 后关闭，reject 时保持显示 | `(event: Event) => any` | - | `undefined` |

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
| setDuration | 重新设置自动关闭延时并重新计时；`0` 表示不自动关闭 | `duration: number` | `void` |
| setMode | 切换提示状态，例如加载完成后改为 `success` | `mode: 'info' \| 'loading' \| 'success' \| 'warning' \| 'error'` | `void` |
| close / remove / destroy / hide | 触发 `close` 和 `portal-fulfilled`，由 Portal 移除实例 | - | `void` |
