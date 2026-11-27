## 图片生成（Snapshot）

将默认插槽中的 DOM 交给 `@zumer/snapdom` 生成快照，支持 SVG、PNG 和下载。

移动端入口导出的 `MSnapshot` 与 `Snapshot` 是同一实现。

### 何时使用

- 需要将卡片、报表等页面内容保存为图片时。

### 基础用法

等待 `ready` 后调用 `toDataURL()` 生成 SVG，传入 `'png'` 则生成 PNG。每次调用都会重新采集当前 DOM；`showLoading` 默认开启，生成期间显示提示。

:::playground
<!--
<config lang="json5">
{
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="snapshot-demo">
		<Snapshot ref="target" @ready="handleReady">
			<div class="snapshot-demo__card">
				<strong>条目统计</strong>
				<p class="snapshot-demo__text">已完成 3 项，共 12 条记录。</p>
			</div>
		</Snapshot>
		<div class="snapshot-demo__row">
			<Button :disabled="!isReady || isGenerating" @click="handleSvg">生成 SVG</Button>
			<Button :disabled="!isReady || isGenerating" @click="handlePng">生成 PNG</Button>
		</div>
		<p class="snapshot-demo__result" role="status">{{ status }}</p>
		<img v-if="src" :src="src" alt="条目统计快照" class="snapshot-demo__preview">
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, Snapshot } from '@deot/vc';

const target = ref();
const src = ref('');
const isReady = ref(false);
const isGenerating = ref(false);
const status = ref('正在加载截图依赖…');

const handleReady = () => {
	isReady.value = true;
	status.value = '选择格式生成图片。';
};

const generate = async (type) => {
	isGenerating.value = true;
	try {
		src.value = await target.value.toDataURL(type);
		status.value = '已生成 ' + type.toUpperCase() + ' 图片。';
	} catch (error) {
		status.value = '生成失败：' + error.message;
	} finally {
		isGenerating.value = false;
	}
};

const handleSvg = () => generate('svg');
const handlePng = () => generate('png');
</script>

<style scoped>
.snapshot-demo {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 16px;
}

.snapshot-demo__card {
	display: flex;
	flex-direction: column;
	gap: 8px;
	padding: 20px;
	color: #243248;
	background: #edf4ff;
	border-radius: 12px;
}

.snapshot-demo__text,
.snapshot-demo__result {
	margin: 0;
}

.snapshot-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}

.snapshot-demo__preview {
	max-width: 100%;
}
</style>
```
:::

### 下载与自定义处理

在组件就绪后，通过模板 ref 调用 `download({ format: 'png', filename: 'snapshot' })`，参数直接传给快照对象的 `download`。PDF 等额外格式需要自行实现。

`download` 属性优先于 `VcInstance.options.Snapshot.download`，回调接收 Vue 内部组件实例和下载参数。同步返回真值会跳过默认下载，假值则继续；返回 Promise 时，兑现为 `undefined` 或真值会跳过，假值则继续。

`lazy` 设为 `false` 时挂载后立即采集一次，`ready` 在首次采集完成后触发，模板 ref 上的 `snapshot` 即为这次结果；`options` 传给 snapdom 的采集配置，例如 `scale`；`showLoading` 设为 `false` 时不显示生成提示。

:::playground
<!--
<config lang="json5">
{
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="snapshot-demo">
		<Snapshot
			ref="target"
			:lazy="false"
			:show-loading="false"
			:options="{ scale: 2 }"
			:download="handleDownload"
			@ready="handleReady"
		>
			<div class="snapshot-demo__card">
				<strong>条目一</strong>
				<p class="snapshot-demo__text">第 1 行 · 第 2 行 · 第 3 行</p>
			</div>
		</Snapshot>
		<div class="snapshot-demo__row">
			<Button :disabled="!isReady" @click="handleIntercept">拦截下载</Button>
			<Button :disabled="!isReady" @click="handleDefault">下载 PNG</Button>
		</div>
		<p class="snapshot-demo__result" role="status">{{ status }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, Snapshot } from '@deot/vc';

const target = ref();
const isReady = ref(false);
const isIntercept = ref(false);
const status = ref('正在采集…');

const handleReady = () => {
	isReady.value = true;
	status.value = target.value.snapshot
		? '首次采集完成，snapshot 已就绪'
		: '首次采集未完成';
};

const handleDownload = ({ options }) => {
	if (!isIntercept.value) return false;
	status.value = `已拦截下载：${options.filename}.${options.format}`;
	return true;
};

const handleIntercept = () => {
	isIntercept.value = true;
	target.value.download({ format: 'png', filename: 'snapshot' });
};

const handleDefault = () => {
	isIntercept.value = false;
	status.value = '已交给默认下载';
	target.value.download({ format: 'png', filename: 'snapshot' });
};
</script>

<style scoped>
.snapshot-demo {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 16px;
}

.snapshot-demo__card {
	display: flex;
	flex-direction: column;
	gap: 8px;
	padding: 20px;
	color: #243248;
	background: #edf4ff;
	border-radius: 12px;
}

.snapshot-demo__text,
.snapshot-demo__result {
	margin: 0;
}

.snapshot-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}
</style>
```
:::

需要可靠等待导出完成或处理异常时，可直接操作 `refresh()` 返回的快照对象：

```text
const snapshot = await target.value.refresh();
await snapshot.download({ format: 'png', filename: 'snapshot' });
```

## API

### 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| lazy | 跳过挂载时的首次采集；依赖仍在挂载时加载 | `boolean` | - | `true` |
| showLoading | 调用 `toDataURL`、`download` 时显示生成提示 | `boolean` | - | `true` |
| options | 传给 snapdom 的采集配置，覆盖全局配置 | `object` | - | `{}` |
| download | 自定义下载回调，`options` 为调用 `download()` 时传入的参数 | `(data: { instance: object; options: any }) => any` | - | - |
| tag | 保留属性，当前渲染固定为 `div` | `string` | - | `'div'` |
| crossOrigin | 保留属性，当前未参与采集或图片属性设置 | `string` | `''`、`'anonymous'`、`'use-credentials'` | `'anonymous'` |
| source | 保留属性，当前未调用 | `Function` | - | - |

采集配置按 `{ fast: false }`、`VcInstance.options.Snapshot.options`、组件 `options` 的顺序合并。

### 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| ready | 依赖加载完成；`lazy=false` 时还会等待首次采集完成 | `{ instance, dependencies: { snapDOM } }` | `instance` 为 Vue 内部组件实例，`snapDOM` 为采集函数 |

### 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 需要采集的 DOM 内容 | - |

### 方法

通过模板 ref 访问以下方法，调用前等待 `ready`。

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| refresh | 等待 Vue DOM 更新后重新采集，不显示生成提示 | - | `Promise<any>`，兑现为 snapdom 快照对象 |
| toDataURL | 重新采集并生成图片地址 | `type?: string`，默认 `'svg'`；`'png'` 调用 `toPng()`，其他值调用 `toRaw()` | `Promise<string>` |
| download | 执行自定义回调或默认下载 | `options?: any`，原样透传 | `Promise<any>`；不返回图片数据，也不保证等待默认下载完成 |

模板 ref 还暴露 `snapshot`，为最近一次采集结果；首次采集前为 `undefined`。默认下载的异步失败不会可靠传给 `download()` 的调用方；自定义回调同步抛错时，当前实现也不会自动关闭生成提示。

### 使用注意

- 运行时优先使用 `window.snapdom`，否则动态导入 `@zumer/snapdom`，需要应用提供该依赖。
- 外部图片、字体等资源仍受浏览器跨域策略和 snapdom 能力限制；`crossOrigin` 属性不会自动解决跨域问题。
- 示例卡片采用固定的图片配色；组件自身不提供背景或前景样式。
