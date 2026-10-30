## 复制（Clipboard）

点击包裹的内容，将指定文本复制到剪贴板。

### 何时使用

用于复制页面内的文字、链接或编号。

### 基础用法

通过 `value` 绑定需要复制的内容。未提供 `after` 回调时，成功后显示默认提示，文案跟随当前 locale。

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
	<div class="clipboard-demo">
		<label>
			<span>复制内容</span>
			<Input v-model="msg" aria-label="复制内容" clearable />
		</label>
		<Clipboard :value="msg" :tag="Button">
			复制
		</Clipboard>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Button, Clipboard, Input } from '@deot/vc';

const msg = ref('我是被复制的内容');
</script>

<style scoped>
.clipboard-demo {
	display: flex;
	flex-wrap: wrap;
	align-items: end;
	gap: 12px;
}

label {
	display: grid;
	gap: 6px;
}
</style>
```
:::

### 修改复制的内容

`before` 的返回值会替换本次复制内容，支持返回 `Promise<string>`，不会修改绑定的 `value`。提供 `after` 后，由调用方处理成功反馈，组件不再显示默认提示。

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
	<div class="clipboard-demo">
		<label>
			<span>待处理的内容</span>
			<Textarea v-model="msg" aria-label="待处理的复制内容" :autosize="{ minRows: 2, maxRows: 4 }" />
		</label>
		<Clipboard
			:value="msg"
			:tag="Button"
			type="primary"
			@before="handleBefore"
			@after="handleAfter"
		>
			处理后复制
		</Clipboard>
		<p role="status">{{ feedback }}</p>
		<Button type="text" @click="handleApi">调用 Clipboard.set</Button>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Button, Clipboard, Textarea } from '@deot/vc';

const msg = ref('我是被复制的内容');
const feedback = ref('等待复制');

const handleAfter = (value) => {
	feedback.value = `复制成功：${value}`;
};

const handleBefore = async (e, value) => {
	return `${value}（已处理）`;
};

const handleApi = () => {
	Clipboard.set(msg.value);
	feedback.value = '已调用 Clipboard.set';
};
</script>

<style scoped>
.clipboard-demo {
	display: flex;
	flex-wrap: wrap;
	align-items: end;
	gap: 12px;
}

label {
	display: grid;
	gap: 6px;
}

[role='status'] {
	flex-basis: 100%;
	margin: 0;
}
</style>
```
:::

### 复制多种格式

`value` 传入以 MIME 类型为键的对象时，会一次写入多种格式。例如同时提供 `text/html` 和 `text/plain` 复制表格：粘贴到表格软件或富文本编辑器时保留单元格，粘贴到纯文本输入框时得到制表符分隔的文本。`Clipboard.set` 接受同样的对象。

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
	<div class="clipboard-demo">
		<Clipboard :value="value" :tag="Button" type="primary">
			复制表格
		</Clipboard>
		<div class="paste" contenteditable="true" aria-label="粘贴区">粘贴到这里查看效果</div>
	</div>
</template>
<script setup>
import { Button, Clipboard } from '@deot/vc';

const rows = [
	['名称', '数值'],
	['条目 1', '12'],
	['条目 2', '7']
];
const cell = 'border:1px solid #000;padding:4px 8px;';

const value = {
	'text/plain': rows.map(row => row.join('\t')).join('\n'),
	'text/html': `<table style="border-collapse:collapse;">${
		rows.map(row => `<tr>${row.map(v => `<td style="${cell}">${v}</td>`).join('')}</tr>`).join('')
	}</table>`
};
</script>

<style scoped>
.clipboard-demo {
	display: grid;
	justify-items: start;
	gap: 12px;
}

.paste {
	box-sizing: border-box;
	width: 100%;
	min-height: 96px;
	padding: 8px;
	border: 1px dashed currentcolor;
}
</style>
```
:::

## API

### 属性

| 属性    | 说明      | 类型                | 可选值 | 默认值   |
| ----- | ------- | ----------------- | --- | ----- |
| value | 复制的内容；字符串写入纯文本，对象以 MIME 类型为键同时写入多种格式 | `string \| Record<string, string>` | - | `undefined` |
| tag | 外层 HTML 标签或 Vue 组件 | `string \| object \| Function` | - | `'div'` |

### 事件

| 事件名    | 说明     | 回调参数                                         | 参数说明                          |
| ------ | ------ | -------------------------------------------- | ----------------------------- |
| before | 复制前处理；必须返回本次要复制的内容 | `(event: MouseEvent, value: ClipboardValue \| undefined) => ClipboardValue \| Promise<ClipboardValue>` | 点击事件及原始 `value` |
| after | 复制成功后的自定义反馈，覆盖默认提示 | `(value: ClipboardValue) => void` | 实际复制的内容，包含 `before` 的处理结果 |
| error | 点击处理流程中捕获到异常时触发 | `(error: unknown) => void` | 例如 `before` 抛出或拒绝的异常 |

`before` 和 `after` 通过单个回调直接调用，JSX 中对应 `onBefore` 和 `onAfter`；`error` 对应 `onError`。`ClipboardValue` 即 `string | Record<string, string>`，可从 `@deot/vc` 导入类型。`before` 返回空字符串会复制空文本，返回 `undefined` 不会自动保留原值；如需中止，可抛出异常或拒绝 Promise。

### 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 可点击的内容 | - |

### 方法

以下是 `Clipboard` 和 `MClipboard` 上的静态方法，例如 `Clipboard.set('需要复制的文本')`，不通过组件 ref 调用，也不会触发组件回调或默认提示。

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| set | 同步写入内容，参数同 `value` | `(value: ClipboardValue)` | `boolean`，浏览器执行复制命令是否成功 |
| get | 读取剪贴板文本 | - | `Promise<string>`，读取失败时拒绝 |
| clear | 写入空字符串 | - | 同 `set` |
| clearSelection | 清除当前页面文字选区 | - | 恢复选区的函数；无选区时返回空函数 |

### 移动端

`MClipboard` 从 `@deot/vc` 导入，与 `Clipboard` 共享属性、事件、插槽和静态方法。桌面端默认使用 `Message.success`，移动端使用 `MToast.info`，均使用 `vc.Clipboard.copySuccess` 文案。

### 使用限制

- 写入使用浏览器的 `document.execCommand('copy')`，在 `copy` 事件中按 `value` 写入各格式，需在用户点击等操作中同步调用。返回值反映复制命令是否执行成功；写入失败时返回 `false`，不触发 `error`。
- 浏览器只保证 `text/plain`、`text/html`、`text/uri-list` 三种类型；其他类型可能被忽略。只传 `text/html` 时不会自动生成纯文本，粘贴到纯文本输入框会得到空内容，建议同时提供 `text/plain`。
- `get()` 直接调用 `navigator.clipboard.readText()`，受浏览器支持、安全上下文和权限限制，调用方应捕获读取异常。
- 组件只负责点击复制；需要键盘操作时，可像示例一样使用 `tag="button"`。视觉样式由标签或调用方提供。
