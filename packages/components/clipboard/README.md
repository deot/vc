## 复制（Clipboard）

点击包裹的内容，将指定文本复制到剪贴板。

### 何时使用

用于复制页面内的文字、链接或编号。

### 基础用法

通过 `value` 绑定需要复制的内容。未提供 `after` 回调时，成功后显示默认提示，文案跟随当前 locale。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<div>
		<input v-model="msg" aria-label="复制内容" type="text">
		<br>
		<Clipboard :value="msg" tag="button" type="button">
			点我复制
		</Clipboard>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Clipboard } from '@deot/vc';

const msg = ref('我是被复制的内容');
</script>
```
:::

### 修改复制的内容

`before` 的返回值会替换本次复制内容，支持返回 `Promise<string>`，不会修改绑定的 `value`。提供 `after` 后，由调用方处理成功反馈，组件不再显示默认提示。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<div>
		<input v-model="msg" aria-label="待处理的复制内容" type="text">
		<br>
		<Clipboard
			:value="msg"
			tag="button"
			type="button"
			@before="handleBefore"
			@after="handleAfter"
		>
			点我复制
		</Clipboard>
		<p role="status">{{ feedback }}</p>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Clipboard } from '@deot/vc';

const msg = ref('我是被复制的内容');
const feedback = ref('等待复制');

const handleAfter = (value) => {
	feedback.value = `复制成功：${value}`;
};

const handleBefore = async (e, value) => {
	return `${value}（已处理）`;
};
</script>
```
:::

## API

### 属性

| 属性    | 说明      | 类型                | 可选值 | 默认值   |
| ----- | ------- | ----------------- | --- | ----- |
| value | 复制的文本内容 | `string` | - | `undefined` |
| tag | 外层 HTML 标签或 Vue 组件 | `string \| object \| Function` | - | `'div'` |

### 事件

| 事件名    | 说明     | 回调参数                                         | 参数说明                          |
| ------ | ------ | -------------------------------------------- | ----------------------------- |
| before | 复制前处理；必须返回本次要复制的文本 | `(event: MouseEvent, value: string \| undefined) => string \| Promise<string>` | 点击事件及原始 `value` |
| after | 复制成功后的自定义反馈，覆盖默认提示 | `(value: string) => void` | 实际复制的文本，包含 `before` 的处理结果 |
| error | 点击处理流程中捕获到异常时触发 | `(error: unknown) => void` | 例如 `before` 抛出或拒绝的异常 |

`before` 和 `after` 通过单个回调直接调用，JSX 中对应 `onBefore` 和 `onAfter`；`error` 对应 `onError`。`before` 返回空字符串会复制空文本，返回 `undefined` 不会自动保留原值；如需中止，可抛出异常或拒绝 Promise。

### 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 可点击的内容 | - |

### 方法

以下是 `Clipboard` 和 `MClipboard` 上的静态方法，例如 `Clipboard.set('需要复制的文本')`，不通过组件 ref 调用，也不会触发组件回调或默认提示。

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| set | 同步写入文本 | `(value: string)` | 当前实现通常为 `true`，降级写入抛错时为 `undefined`，见下方限制 |
| get | 读取剪贴板文本 | - | `Promise<string>`，读取失败时拒绝 |
| clear | 写入空字符串 | - | 同 `set` |
| clearSelection | 清除当前页面文字选区 | - | 恢复选区的函数；无选区时返回空函数，存在选区但无活动元素时返回 `undefined` |

### 移动端

`MClipboard` 从 `@deot/vc` 导入，与 `Clipboard` 共享属性、事件、插槽和静态方法。桌面端默认使用 `Message.success`，移动端使用 `MToast.info`，均使用 `vc.Clipboard.copySuccess` 文案。

### 使用限制

- 写入使用浏览器的 `document.execCommand('copy')` 及旧版 `clipboardData` 降级逻辑，建议在用户点击时调用。当前降级实现可能在 `clipboardData` 不存在时仍返回 `true`，因此返回值和成功提示不能保证系统剪贴板已经更新；底层写入失败也不保证触发 `error`。
- `get()` 直接调用 `navigator.clipboard.readText()`，受浏览器支持、安全上下文和权限限制，调用方应捕获读取异常。
- 组件只负责点击复制；需要键盘操作时，可像示例一样使用 `tag="button"`。视觉样式由标签或调用方提供。
