## 延迟器（Defer）

延迟调度列表渲染，通过默认插槽定义每条数据的内容，自身不生成额外的容器元素。

### 何时使用

- 需要将列表首次渲染交给异步任务调度。
- 替换数据后需要重新调度，或只在首次加载时延迟渲染。

Defer 最终会渲染全部数据，不是虚拟列表。**每个任务只提交一片并让出主线程**，任务之间浏览器有机会绘制，因此不会出现「整批数据卡在一个任务里」的长任务。

一片渲染多少条是**自适应**的：每片渲染完成后会测出这一片的实际耗时，与一帧（16ms）的时间片预算相比，没用满就放大、超了就缩小——内容轻的列表会自动用更大的步长（总时间接近一次性渲染），内容重的列表会自动收敛到很小的步长（每个任务仍然很短）。`concurrency` 只是**起始步长**。

伸缩比较的是整片的耗时，不折算到每一行：一次分片往返本身就有与条数无关的固定开销（提交、patch、浏览器重排），把它摊进每一行会让片越小单价越高、下一片更小，步长一路塌到 1。按整片比较则相反，固定开销大的场景会自动放大步长把它摊薄；缩小若换不来更短的耗时，步长就停在那里，不会继续往下切。

调度层是一个与 `requestIdleCallback` 语义一致的实现：回调收到 `IdleDeadline`，由它决定这一片的预算。默认用 `MessageChannel` 而不是原生 `requestIdleCallback`，因为原生只在浏览器空闲时执行，列表要等太久；签名保持一致，需要时可以直接换成原生。

每片渲染完成都会触发 `progress`，带上已渲染条数：使用方据此判断自己关心的那部分是否已经渲染，不必等整轮结束（虚拟列表的隐藏测量池就靠它按批放行）。

已提交的每一片由一个内部子组件承载，**它们不会随后续分片重新渲染**：渲染 2000 条时，每行只渲染一次，不会因为提交了 200 次就把先渲染的行重复 diff 200 遍。行内容依赖的响应式状态发生变化时，对应的分片仍会照常更新。

替换数组时，已渲染部分中与新数组**位置和 `primaryKey` 都相同的前缀会保持挂载**，只重新调度其余部分；例如在末尾追加数据时，已渲染的条目不会被卸载重建。

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
| concurrency | 起始步长：第一片渲染的条数，请传入正整数。之后每片的条数按实测耗时向一帧（16ms）的预算自适应 | `number` | - | `10` |
| disabled | 是否跳过延迟调度，直接渲染全部数据 | `boolean` | - | `false` |
| once | 首次完成后是否跳过后续延迟调度 | `boolean` | - | `true` |

### 事件

| 事件名      | 说明 | 回调参数 | 参数说明 |
| -------- | -- | ---- | ---- |
| progress | 每提交一片并渲染到 DOM 时触发；JSX 使用 `onProgress` | `(count: number, data: unknown[]) => void` | `count` 为本轮累计已渲染的条数；`data` 为这一轮的数组，与传入的 `data` 是同一个引用 |
| complete | 当前这份 `data` 已全部渲染到 DOM 时触发；JSX 使用 `onComplete` | `(timestamp: number, data: unknown[]) => void` | `timestamp` 为从本轮开始到渲染完成的耗时，单位 ms（不代表已绘制到屏幕）；`data` 为这一轮渲染完成的数组，与传入的 `data` 是同一个引用 |

`progress` 与 `complete` 一样受轮次保护：调度期间替换了 `data` 或卸载，被取代的那一轮不再触发；本轮没有任何分片可提交（如空数组）时只有 `complete`。

每份 `data` 渲染完成都会触发 `complete`，与是否经过分片无关：分片调度完成、禁用时直接全部渲染、空数组、`once` 首次完成后的更新，都会在本轮更新提交到 DOM 后触发。调度期间替换了 `data` 或卸载，被取代的那一轮不再触发；调度期间设置 `disabled` 为 `true` 会取消剩余任务、展示全部数据并触发一次。

### 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 每条数据的渲染内容 | `{ row: any, index: number, key: any }`；`row` 为数据项，`index` 为从 0 开始的索引，`key` 为 `row[primaryKey]` |

### 使用注意

- 数据监听基于数组引用；需要重新调度时替换数组，不要依赖原地 `push` / `splice` 触发新一轮任务。
- `concurrency` 当前没有运行时校验；零或负数会被当作 1 处理。
- `MDefer` 是 `Defer` 的别名，属性、事件和插槽完全相同，可从 `@deot/vc` 导入。
