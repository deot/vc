## 滚动容器（Scroller）

为受限高度或宽度的内容提供滚动容器，可使用浏览器滚动条或可拖动的自定义滚动条。

### 何时使用

- 列表、日志或面板内容超过可用空间时。
- 需要读取滚动位置、通过方法定位，或调整滚动条位置时。
- 通用场景优先使用 `Scroller`：滚动由浏览器处理，键盘、触摸、聚焦等方式都能正常滚动。
- `ScrollerWheel` 在 `native=false` 时由滚轮驱动位置，减少一层容器嵌套，滚动位置与依赖它的内容在同一帧更新，适合表头联动、虚拟列表等场景；此时键盘方向键、PageDown 等无法滚动内容，触摸滚动为模拟实现。

### 基础用法

设置 `height` 或 `maxHeight` 限制可视区域；内容超出后才能滚动。数字尺寸按 px 处理，字符串应包含 CSS 单位。`tag` 指定内部内容元素。

`native` 的默认值取决于浏览器滚动条是否占宽。需要稳定展示自定义滚动条时，显式设置 `:native="false"`；`always` 只在内容溢出时让自定义滚动条常显。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<Scroller :height="220" :native="false" always tag="ul" :content-style="{ margin: 0, padding: '0 16px', listStyle: 'none' }">
		<li v-for="item in 20" :key="item" class="row">列表项目 {{ item }}</li>
	</Scroller>
</template>

<script setup>
import { Scroller } from '@deot/vc';
</script>

<style scoped>
.row {
	padding: 12px 0;
	border-bottom: 1px solid var(--vc-color-light-deeper);
}
</style>
```
:::

### 动态内容与滚动定位

默认通过尺寸监听更新滚动条。关闭 `autoResize` 后，应在 DOM 更新后调用 `refresh()`，首次挂载时也需要手动刷新。这里使用 `ScrollerWheel` 展示追加日志、定位和 `scroll` 事件。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<div class="demo">
		<div class="actions">
			<Button @click="handleAppend">追加日志并到底部</Button>
			<Button @click="handleTop">回到顶部</Button>
		</div>
		<ScrollerWheel ref="scroller" :height="200" :native="false" always @scroll="handleScroll">
			<div v-for="item in count" :key="item" class="log">日志 {{ item }}：任务已完成</div>
		</ScrollerWheel>
		<div>共 {{ count }} 条，距顶部 {{ scrollTop }} px</div>
	</div>
</template>

<script setup>
import { nextTick, ref } from 'vue';
import { Button, ScrollerWheel } from '@deot/vc';

const scroller = ref();
const count = ref(12);
const scrollTop = ref(0);
const handleScroll = (event) => {
	scrollTop.value = Math.round(event.target.scrollTop);
};
const handleAppend = async () => {
	count.value += 5;
	await nextTick();
	await scroller.value.refresh();
	scroller.value.setScrollTop(scroller.value.scrollHeight - scroller.value.clientHeight);
};
const handleTop = () => {
	scroller.value.setScrollTop(0);
};
</script>

<style scoped>
.demo {
	display: grid;
	gap: 12px;
}
.actions {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}
.log {
	padding: 10px 12px;
	border-bottom: 1px solid var(--vc-color-light-deeper);
}
</style>
```
:::

### 横向滚动与定位

内容宽度超过容器时出现横向滚动条。可拖动底部滑块，也可使用 `setScrollLeft()` 定位。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<div class="demo">
		<div class="actions">
			<Button @click="handleStart">回到起点</Button>
			<Button @click="handleEnd">查看最后一项</Button>
		</div>
		<Scroller ref="scroller" :native="false" always>
			<div class="cards">
				<div v-for="item in 8" :key="item" class="card">任务 {{ item }}</div>
			</div>
		</Scroller>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, Scroller } from '@deot/vc';

const scroller = ref();
const handleStart = () => scroller.value.setScrollLeft(0);
const handleEnd = async () => {
	await scroller.value.refresh();
	scroller.value.setScrollLeft(scroller.value.scrollWidth - scroller.value.clientWidth);
};
</script>

<style scoped>
.demo { display: grid; grid-template-columns: minmax(0, 1fr); gap: 12px; }
.actions { display: flex; flex-wrap: wrap; gap: 8px; }
.cards { display: flex; gap: 12px; width: max-content; padding-bottom: 16px; }
.card {
	display: grid;
	place-items: center;
	width: 150px;
	height: 100px;
	border: 1px solid var(--vc-color-light-deeper);
	border-radius: 8px;
}
</style>
```
:::

### 滚动条显示方式与最大高度

切换原生、自定义滚动条和常显状态。`maxHeight` 让少量内容自然撑开，内容增加后再限制高度；关闭 `showBar` 仅隐藏自定义滚动条，内容仍可滚动。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<div class="demo">
		<div class="actions">
			<label><input v-model="isNative" type="checkbox"> 原生滚动条</label>
			<label><input v-model="isAlways" type="checkbox" :disabled="isNative"> 常显</label>
			<label><input v-model="isBarVisible" type="checkbox" :disabled="isNative"> 显示自定义滚动条</label>
		</div>
		<div class="actions">
			<Button @click="handleMore">增加内容</Button>
			<Button @click="handleReset">恢复两项</Button>
			<span>当前 {{ count }} 项</span>
		</div>
		<Scroller :max-height="200" :native="isNative" :always="isAlways" :show-bar="isBarVisible">
			<div v-for="item in count" :key="item" class="row">内容项目 {{ item }}</div>
		</Scroller>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, Scroller } from '@deot/vc';

const isNative = ref(false);
const isAlways = ref(true);
const isBarVisible = ref(true);
const count = ref(2);
const handleMore = () => { count.value += 4; };
const handleReset = () => { count.value = 2; };
</script>

<style scoped>
.demo { display: grid; gap: 12px; }
.actions { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
.row { padding: 12px; border-bottom: 1px solid var(--vc-color-light-deeper); }
</style>
```
:::

### 将滚动条放在内容之外

`barTo` 指定轨道挂载容器，下面为滚动条预留右侧空间。目标节点先于 Scroller 挂载，使用实例唯一 ID 避免多个示例互相影响。拖动右侧滑块或点击轨道即可定位。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<div class="panel">
		<div :id="trackId" class="track-host" />
		<Scroller :height="200" :native="false" always :bar-to="`#${trackId}`" :track-offset-y="[8, 4, 8, 0]">
			<div v-for="item in 16" :key="item" class="row">消息 {{ item }}：滚动条位于独立区域</div>
		</Scroller>
	</div>
</template>

<script setup>
import { useId } from 'vue';
import { Scroller } from '@deot/vc';

const trackId = `scroller-track-${useId()}`;
</script>

<style scoped>
.panel { position: relative; padding-right: 24px; }
.track-host { position: absolute; top: 0; right: 0; width: 16px; height: 200px; }
.row { padding: 12px; border-bottom: 1px solid var(--vc-color-light-deeper); }
</style>
```
:::

## API

### Scroller 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| tag | 内容元素标签，初始化时确定 | `string` | HTML 标签 | `'div'` |
| height | 可视容器高度，数字按 px 处理 | `string \| number` | - | `''` |
| maxHeight | 可视容器最大高度，数字按 px 处理 | `string \| number` | - | `''` |
| wrapperStyle | 可视容器样式，height/maxHeight 优先 | `StyleValue` | - | `''` |
| wrapperClass | 可视容器 class | `StyleValue` | - | `''` |
| contentStyle | 内容元素样式 | `StyleValue` | - | `''` |
| contentClass | 内容元素 class | `StyleValue` | - | `''` |
| native | 使用浏览器滚动条 | `boolean` | - | 浏览器滚动条不占宽时为 `true`，否则为 `false` |
| showBar | 渲染自定义滚动条；不控制原生滚动条 | `boolean` | - | `true` |
| always | 自定义滚动条常显；否则鼠标移入并移动时显示，移出后隐藏 | `boolean` | - | `false` |
| autoResize | 挂载时监听容器和内容尺寸；建议在挂载前设置 | `boolean` | - | `true` |
| thumbMinSize | 自定义滑块最小长度，单位 px | `number` | - | `30` |
| thumbStyle | 自定义滑块样式 | `StyleValue` | - | - |
| thumbClass | 自定义滑块 class | `StyleValue` | - | - |
| trackStyle | 横纵轨道共用样式 | `StyleValue` | - | - |
| trackClass | 横纵轨道共用 class | `StyleValue` | - | - |
| trackOffsetX | 横向轨道偏移 `[上, 右, 下, 左]`，单位 px；上不生效，左右影响轨道长度 | `number[]` | - | `[0, 0, 0, 0]` |
| trackOffsetY | 纵向轨道偏移 `[上, 右, 下, 左]`，单位 px；左不生效，上下影响轨道长度 | `number[]` | - | `[0, 0, 0, 0]` |
| barTo | 将自定义滚动条 Teleport 到匹配的 DOM 节点或传入的元素；目标需已存在且提供合适的定位上下文。传元素时，元素变化后轨道随之移动 | `string \| HTMLElement` | CSS selector / 元素 | - |
| barTrigger | 鼠标悬停时显示自定义滚动条的区域（CSS selector，优先匹配轨道的祖先）；默认为轨道所在的容器。滚动条 Teleport 到无法直接悬停的节点时使用 | `string` | CSS selector | - |

`StyleValue` 为 Vue 的样式类型；当前 class 属性也沿用这一类型声明，运行时按 Vue class 规则处理字符串、对象或数组。

滚动条相关样式与偏移仅在 `native=false` 且 `showBar=true` 时生效。`barTo` 目标不存在时不渲染自定义滚动条；移出原容器后，主题变量从目标节点继承。

### Scroller 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| scroll | 滚动或调用定位方法时触发 | `event` | 自定义代理对象，`target` 与 `currentTarget` 指向同一份滚动数据 |

`event.target` 包含 `scrollLeft`、`scrollTop`、`clientWidth`、`clientHeight`、`scrollWidth`、`scrollHeight`，以及 `getBoundingClientRect()`。它不是 DOM 节点，`event` 也不是原生 `Event`，不提供 `preventDefault()` 等方法。JSX 对应 `onScroll`。

### Scroller 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 放入 `tag` 指定的内容元素 | - |

### Scroller 方法

通过组件 ref 调用；需在挂载后使用。

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| refresh | 更新容器、内容尺寸并同步滚动条 | - | `Promise<void>`（运行时） |
| setScrollTop | 设置纵向滚动位置并通知监听器 | `value: number`，单位 px | `void` |
| setScrollLeft | 设置横向滚动位置并通知监听器 | `value: number`，单位 px | `void` |
| scrollTo | 设置指定轴的位置，未指定的轴保持原值 | `{ x?: number; y?: number }`，单位 px | `void` |
| on | 注册滚动监听器 | `(event) => void`，与 scroll 事件参数相同 | `void` |
| off | 移除已注册的监听器 | 注册时的同一函数引用 | `void` |

实例还暴露 `wrapper`、`content` DOM 引用，以及 `scrollLeft`、`scrollTop`、`clientWidth`、`clientHeight`、`scrollWidth`、`scrollHeight` 数值。定位时传入有效范围内的坐标，纵向最大值为 `scrollHeight - clientHeight`，横向为 `scrollWidth - clientWidth`。

当前导出的 `ScrollerExposed` 类型仅声明 `refresh`、`setScrollTop`、`setScrollLeft`，其中 `refresh` 返回值声明为 `void`；上表同时记录了运行时实际暴露的方法。属性类型导出名为 `ScrollerProps`。

### ScrollerWheel 属性

继承全部 Scroller 属性，事件、插槽和实例方法相同，额外提供：

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| stopPropagation | 控制被接管的滚轮事件是否停止冒泡 | `boolean` | - | `true` |

`native=true` 时使用原生滚动；`native=false` 时由滚轮和实例方法驱动位置，聚焦、`scrollIntoView`、直接修改 DOM 的 `scrollTop` 等引起的滚动也会同步滚动条并触发 scroll 事件。

### MScroller

`MScroller` 是 `Scroller` 的别名，属性、事件、插槽和方法一致，可从 `@deot/vc` 导入。

### 主题

自定义滚动条支持以下 CSS 变量，默认随亮暗主题变化；`thumbStyle` 中的背景色可覆盖默认样式。

| CSS 变量 | 说明 | 默认来源 |
| --- | --- | --- |
| `--vc-scroller-track-color-dark-extralight` | 滑块普通状态 | `--vc-color-dark-extralight` |
| `--vc-scroller-track-color-dark-lightest` | 滑块 hover 状态 | `--vc-color-dark-lightest` |
