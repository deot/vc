## 可视区监听（Intersection）

监听内容进入、离开所在滚动容器的可视区，用于曝光上报、进入可视区再渲染、预加载等。

### 何时使用

- 需要知道某块内容是否被用户看到（曝光统计）。
- 内容开销大，滚动到附近再渲染或请求。

滚动容器自动查找：从组件向上最近的滚动容器，包括 vc Scroller（滚轮驱动时也能识别）和 `overflow: auto / scroll` 的原生容器，都没有时为浏览器视口。同一容器、同一 `offset` / `threshold` 的实例共用一个 IntersectionObserver，长列表里大量使用也只有一个监听。

### 基础用法

`v-model` 同步是否可见，`change` 在可见状态变化时触发。

:::playground
```vue
<template>
	<div class="intersection-demo">
		<p>状态：{{ visible ? '在可视区内' : '不在可视区' }}，change {{ count }} 次</p>
		<div class="intersection-demo__box">
			<div class="intersection-demo__space" />
			<Intersection v-model="visible" class="intersection-demo__target" @change="count++">
				目标
			</Intersection>
			<div class="intersection-demo__space" />
		</div>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Intersection } from '@deot/vc';

const visible = ref(false);
const count = ref(0);
</script>

<style scoped>
.intersection-demo {
	padding: 20px;
}

.intersection-demo__box {
	height: 200px;
	overflow: auto;
	background: var(--vc-color-light-deeper);
}

.intersection-demo__space {
	height: 300px;
}

.intersection-demo__target {
	padding: 16px;
	color: #fff;
	text-align: center;
	background: var(--vc-color-primary);
}
</style>
```
:::

### 提前量与露出比例

- `offset` 扩展滚动容器可视区的四边：正数提前判定为可见（预加载），负数要再往里滚才可见。1 – 4 个值，顺序同 CSS `margin`；字符串支持 `px` 和 `%`。
- `threshold` 为露出比例，达到才算可见；`0` 表示贴边即可见。内容比容器还大时，`1` 永远达不到。

```vue
<Intersection :offset="200" @change="({ visible }) => visible && load()" />
<Intersection :threshold="0.5" once @change="report" />
```

### 只触发一次与暂停

- `once`：首次可见后停止监听，之后保持可见，适合曝光上报与懒加载。
- `disabled`：暂停监听，恢复后重新判断。
- 实例方法 `refresh()`：重新查找滚动容器，并把状态当作不可见重新判断，仍可见时会再触发一次 `change`（如内容替换后重新上报曝光，或组件被移到别的滚动容器里）。

### 进入可视区再渲染

默认插槽带 `{ visible }`。

```vue
<Intersection once style="min-height: 200px;">
	<template #default="{ visible }">
		<HeavyContent v-if="visible" />
	</template>
</Intersection>
```

### 注意事项

- 只按最近的那一层滚动容器裁剪：容器本身被外层滚出视口时，容器里的内容仍可能判定为可见。
- 根元素不可见（`display: none`、未插入文档）时判定为不可见；空内容的根元素高度为 0，贴边时也算相交，需要时给它尺寸。
- 不支持 IntersectionObserver 的环境下挂载后直接视为可见。

## API

`MIntersection` 与 `Intersection` 用法一致，区别是数字 `offset` 为 750 稿长度，随 `--vc-rem` 缩放。

### 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| v-model | 是否在可视区；只读，传入的值不影响判断 | `boolean` | - | `false` |
| tag | 根元素标签 | `string` | - | `'div'` |
| offset | 可视区四边的扩展量；数字在 Intersection 中为 px、在 MIntersection 中为 750 稿长度，字符串支持 `px` / `%` | `number \| string \| Array<number \| string>` | - | `0` |
| threshold | 露出比例达到该值才算可见 | `number` | `0` – `1` | `0` |
| once | 首次可见后停止监听 | `boolean` | - | `false` |
| disabled | 暂停监听 | `boolean` | - | `false` |

### 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| change | 可见状态变化时触发；初始不可见时不触发 | `{ visible, ratio, entry }` | `visible` 是否可见；`ratio` 露出比例；`entry` 为 `IntersectionObserverEntry`，不支持 IntersectionObserver 时为 `null` |

### 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 内容 | `{ visible: boolean }` |

### 方法

通过组件 ref 访问。

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| refresh | 重新查找滚动容器，并把状态当作不可见重新判断；`once` 已触发时也重新开始 | - | `void` |

实例还暴露 `visible`，为当前是否可见。
