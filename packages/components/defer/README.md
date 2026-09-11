## 延迟器（Defer）

延迟调度列表渲染，通过默认插槽定义每条数据的内容，自身不生成额外的容器元素。

### 何时使用

- 需要将列表首次渲染交给异步任务调度。
- 替换数据后需要重新调度，或只在首次加载时延迟渲染。

Defer 最终会渲染全部数据，不是虚拟列表。当前实现通过 `MessageChannel` 调度任务，以约 5ms 的预算推进可渲染条数；一次任务可以累加多个 `concurrency` 步长，再提交更新，因此不保证每帧固定渲染多少条，也不保证 DOM 渲染耗时受此预算限制。

### 基础用法

默认 `once` 为 `true`，首次完成后，后续数据更新直接完整渲染。下面设置 `:once="false"`，每次替换数组都会重新调度，并显示完成次数与调度耗时。

:::playground
```vue
<template>
	<div style="max-width: 560px; padding: 20px;">
		<div style="display: flex; gap: 8px; align-items: center; margin-bottom: 12px;">
			<Button type="primary" size="small" @click="reload">重新加载</Button>
			<Button size="small" @click="disabled = !disabled">{{ disabled ? '启用延迟' : '立即显示全部' }}</Button>
			<span style="color: #888;">{{ data.length }} 条数据</span>
		</div>
		<p style="margin: 0 0 12px; color: #888;">完成 {{ completed }} 次 · 最近耗时 {{ elapsed }} ms</p>
		<ul style="height: 220px; padding: 8px 16px; margin: 0; overflow: auto; border: 1px solid #e5e7eb; border-radius: 6px;">
			<Defer :data="data" :disabled="disabled" :once="false" :concurrency="20" @complete="handleComplete">
				<template #default="{ row, index }">
					<li>{{ index + 1 }}. {{ row.label }}</li>
				</template>
			</Defer>
		</ul>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, Defer } from '@deot/vc';

const createData = () => Array.from({ length: 200 }, (_, index) => ({
	id: index,
	label: `数据 ${index + 1}`
}));
const data = ref(createData());
const disabled = ref(false);
const completed = ref(0);
const elapsed = ref(0);
const reload = () => {
	data.value = createData();
};
const handleComplete = (timestamp) => {
	completed.value += 1;
	elapsed.value = timestamp;
};
</script>
```
:::

## API

### 属性
| 属性          | 说明   | 类型        | 可选值 | 默认值   |
| ----------- | ---- | --------- | --- | ----- |
| data | 对象数组；通过替换数组引用触发重新调度 | `unknown[]` | - | `[]` |
| primaryKey | 数据项中用作插槽 VNode key 的字段名，请提供稳定且唯一的值 | `string` | - | `'id'` |
| concurrency | 每次累加可渲染条数的步长，请传入正整数 | `number` | - | `10` |
| disabled | 是否跳过延迟调度，直接渲染全部数据 | `boolean` | - | `false` |
| once | 首次完成后是否跳过后续延迟调度 | `boolean` | - | `true` |

### 事件

| 事件名      | 说明 | 回调参数 | 参数说明 |
| -------- | -- | ---- | ---- |
| complete | 一轮非空数据的调度完成时触发；JSX 使用 `onComplete` | `(timestamp: number) => void` | 从本轮开始到调度完成的耗时，单位 ms；不代表 DOM 已绘制完成 |

空数据、禁用调度以及 `once` 首次完成后的更新不会触发 `complete`。调度期间设置 `disabled` 为 `true` 会取消待执行任务并展示全部数据。

### 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 每条数据的渲染内容 | `{ row: any, index: number, key: any }`；`row` 为数据项，`index` 为从 0 开始的索引，`key` 为 `row[primaryKey]` |

### 使用注意

- 数据监听基于数组引用；需要重新调度时替换数组，不要依赖原地 `push` / `splice` 触发新一轮任务。
- `concurrency` 当前没有运行时校验，零或负数可能导致调度无法推进。
- `MDefer` 是 `Defer` 的别名，属性、事件和插槽完全相同，可从 `@deot/vc` 导入。
