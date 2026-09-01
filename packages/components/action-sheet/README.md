## 动作面板（ActionSheet）

从页面底部弹出一组与当前场景相关的操作。

### 何时使用

- 在移动端集中展示两个或更多操作，并可为操作补充说明。
- 操作需要异步完成，或需要根据回调结果决定是否关闭面板。

`ActionSheet` 与 `MActionSheet` 指向同一个组件，均支持组件渲染以及 `open`、`popup`、`destroy` 方法。函数式调用会将面板挂载到 `body`。

### 基础用法

`open` 返回一个可等待的 Portal 实例。选择操作时结果为对应的 `ActionSheetAction`；点击取消按钮或遮罩关闭时结果为 `undefined`。

:::playground
<!--
<config lang="json5">
{
	viewport: [375, 667],
	viewportOptions: ['auto', 375, [375, 667]]
}
</config>
-->
```vue
<template>
	<div class="action-sheet-demo">
		<MButton type="primary" @click="handleOpen">
			打开动作面板
		</MButton>
		<span class="action-sheet-demo__result">{{ result }}</span>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MActionSheet, MButton } from '@deot/vc';

const result = ref('尚未选择');
const wait = delay => new Promise(resolve => setTimeout(resolve, delay));

const handleOpen = async () => {
	const action = await MActionSheet.open({
		title: '请选择操作',
		cancelText: '取消',
		data: [
			{
				content: '保存',
				subContent: '异步操作完成后关闭',
				onClick: () => wait(800)
			},
			{
				content: '删除',
				style: { color: 'var(--vc-color-error)' }
			},
			{
				content: '禁用选项',
				disabled: true
			}
		]
	});

	result.value = action ? `已选择：${action.content}` : '已取消';
};
</script>

<style scoped>
.action-sheet-demo {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 16px;
}

.action-sheet-demo__result {
	font-size: 14px;
	color: var(--vc-color-dark-lightest);
}
</style>
```
:::

### 异步操作

`onClick` 接收当前操作对象。返回 `false`、返回一个最终解析为 `false` 的 Promise、抛出异常或返回被拒绝的 Promise 时，面板保持打开。Promise 等待期间，当前操作会显示加载状态，并暂时禁止其他操作、遮罩关闭和取消按钮关闭。

### 内容渲染

`title`、`content` 和 `subContent` 均支持字符串或渲染函数。字符串通过 `innerHTML` 渲染，只应传入可信内容；操作的渲染函数会收到包含 `loading` 状态的属性对象。

## API

### ActionSheet 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| mask | 是否显示遮罩 | `boolean` | - | `true` |
| maskClosable | 是否允许点击遮罩关闭；异步操作加载期间暂时禁用 | `boolean` | - | `true` |
| wrapperClass | 弹层容器的 class | `string \| object \| any[]` | - | - |
| wrapperStyle | 弹层容器的内联样式 | `string \| object \| any[]` | - | - |
| scrollRegExp | 用于识别内部滚动容器，防止弹层滚动穿透 | `Record<string, any>` | - | `{ className: /(vcm?-popup-scrollable\|vcm-action-sheet__actions)/ }` |
| title | 操作列表上方的标题；空字符串时不展示 | `ActionSheetContent` | - | `''` |
| data | 操作列表 | `ActionSheetAction[]` | - | `[]` |
| cancelText | 取消按钮文案；空字符串时不展示取消按钮 | `string` | - | `''` |

### ActionSheetAction 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| content | 操作内容；字符串通过 `innerHTML` 渲染 | `ActionSheetContent` | - | `undefined` |
| subContent | 操作的补充说明；字符串通过 `innerHTML` 渲染 | `ActionSheetContent` | - | `undefined` |
| disabled | 是否禁用当前操作 | `boolean` | - | `undefined` |
| class | 当前操作的额外 class | `any` | - | `undefined` |
| style | 当前操作的额外内联样式 | `any` | - | `undefined` |
| onClick | 点击操作时调用；返回 `false`、抛出异常或 Promise 拒绝时阻止关闭 | `(action: ActionSheetAction) => any` | - | `undefined` |

### 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| portal-fulfilled | 面板关闭完成时触发 | `value` | 选择操作时为 `ActionSheetAction`，取消或点击遮罩时为 `undefined` |

### ActionSheet / MActionSheet 方法

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| open | 在 `body` 中打开动作面板 | `options?`：组件属性以及可选的 `onClose` 回调 | 可等待的 Portal 实例；结果为 `ActionSheetAction \| undefined` |
| popup | `open` 的别名 | 同 `open` | 同 `open` |
| destroy | 销毁由当前动作面板 Portal 创建的全部实例 | - | `void` |

### 类型

| 类型名 | 说明 |
| --- | --- |
| `ActionSheetContent` | 字符串或与 `Customer` 一致的渲染函数 |
| `ActionSheetAction` | 单个操作的公开数据结构 |
| `ActionSheetActionValue` | `ActionSheetAction` 的别名 |
