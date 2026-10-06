## 引导（Tour）

通过圆角镂空蒙层高亮目标，分步展示说明和操作。支持 `Tour/TourStep` 声明式组件和基于 Portal 的 `Tour.open(options)` 静态调用。

声明式组件收集引导参数、步骤和插槽，在 `modelValue=true` 时创建 Portal 引导实例，后续参数与插槽更新同步到当前实例；关闭或卸载时清理实例。`Tour.open(options)` 直接创建同一引导弹层，挂载后自动打开，无需传入 `modelValue` 或挂载 Tour/TourStep。

### 何时使用

用于首次使用说明、功能入口介绍或按步骤完成操作。目标默认允许交互；开启 `disableActiveInteraction` 后禁止当前目标的指针和键盘交互，未提供 `element` 时居中展示。

### 基础用法

用 `v-model` 控制打开状态，默认插槽中声明 `TourStep`。下面的两步引导隐藏上一步和关闭图标，目标按钮仍可正常操作。

:::playground
<!-- <config lang="json5">{ previewInset: 24, expandable: true }</config> -->
```vue
<template>
	<div class="tour-example">
		<Button @click="handleStart">开始引导</Button>
		<div ref="summaryPanel" class="summary-panel">条目概览：已完成 2 项 / 共 5 项</div>
		<Button ref="actionButton" type="primary" @click="handleAdd">＋ 创建条目（{{ itemCount }}）</Button>
		<Tour
			v-model="isActive" :previous-text="false" :closable="false"
			@visible-change="handleVisibleChange" @close="handleClose"
		>
			<TourStep :element="() => actionButton?.$el" title="第一步、操作按钮" content="这里是创建条目的操作入口。" placement="right" />
			<TourStep :element="() => summaryPanel" title="第二步、查看概览">
				<template #content>
					<p>此区域展示条目数量和完成进度。</p>
					<p>这里可以放置图片、二维码或其他组件。</p>
				</template>
			</TourStep>
		</Tour>
	</div>
</template>

<script setup>
import { ref, inject } from 'vue';
import { Tour, TourStep, Button } from '@deot/vc';

const isActive = ref(false);
const itemCount = ref(0);
const actionButton = ref();
const summaryPanel = ref();
const playground = inject('docs:playground');
const preview = playground.run(440);
const handleVisibleChange = isVisible => isVisible && preview(true);
const handleClose = () => preview(false);
const handleStart = () => { isActive.value = true; };
const handleAdd = () => { itemCount.value++; };
</script>

<style scoped>
.tour-example {
	display: flex;
	flex-direction: column;
	gap: 24px;
	align-items: flex-start;
}

.summary-panel {
	width: 100%;
	padding: 24px;
	border: 1px solid var(--vc-border-color);
	border-radius: 8px;
	box-sizing: border-box;
}
</style>
```
:::

### 静态调用与异步操作

Tour 参数、事件回调和 Portal 的 `slots/components/uses/install/onDestroyed` 等配置放在同一个对象中。`Tour.open(options)` 同步返回可等待的 `PortalLeaf`，挂载后可以通过 `leaf.wrapper` 调用实例方法，结束后通过 `await leaf` 获取结果。

静态调用通过 Portal 的 `element` 指定挂载容器，支持选择器或 DOM 元素；声明式组件使用 `getPopupContainer`。默认挂载到 body。

操作 `onClick(event, context)` 返回 `false`、抛错或 Promise 拒绝时保留当前步骤，其余结果继续。等待期间禁止其他导航和普通关闭。左右键、目标点击、蒙层推进和实例方法复用对应回调；`goTo` 和外部 `current` 更新直接请求指定步骤。

:::playground
<!-- <config lang="json5">{ previewInset: 24, expandable: true }</config> -->
```vue
<template>
	<div>
		<Button ref="targetButton" @click="handleOpen">静态调用</Button>
		<p>结果：{{ resultType || '尚未结束' }}</p>
	</div>
</template>

<script setup>
import { ref, inject, onBeforeUnmount } from 'vue';
import { Tour, Button } from '@deot/vc';

const targetButton = ref();
const resultType = ref('');
const playground = inject('docs:playground');
const preview = playground.run(420);
let tourLeaf;
let timer;
const handleVisibleChange = isVisible => isVisible && preview(true);
const handleClose = () => preview(false);
const handleOpen = async () => {
	tourLeaf = Tour.open({
		steps: [
			{ element: () => targetButton.value?.$el, title: '异步检查', content: '下一步等待 600ms，期间不能重复切步或关闭。' },
			{ title: '居中提示', content: '没有目标时居中展示。' }
		],
		nextButtonOptions: {
			onClick: () => new Promise((resolve) => {
				timer = setTimeout(resolve, 600);
			})
		},
		onVisibleChange: handleVisibleChange,
		onClose: handleClose
	});
	resultType.value = (await tourLeaf).type;
};
onBeforeUnmount(() => { clearTimeout(timer); tourLeaf?.destroy(); });
</script>
```
:::

### 目标交互与蒙层推进

`advanceOnClick` 在保留目标原有点击行为的同时推进步骤；开启 `disableActiveInteraction` 后不响应目标点击。`maskClickBehavior="next"` 让蒙层点击执行下一步操作，`maskClosable` 只控制蒙层关闭。

下面的示例使用圆点进度和窄视口，可以在打开前选择是否允许目标交互。

:::playground
<!-- <config lang="json5">{ viewport: 375, viewportOptions: ['auto', 375], previewInset: 20, expandable: true }</config> -->
```vue
<template>
	<div class="interaction-example">
		<div class="interaction-toolbar">
			<Button @click="handleStart">打开交互引导</Button>
			<label><input v-model="isInteractionDisabled" type="checkbox"> 禁止目标交互</label>
		</div>
		<Button ref="targetButton" @click="handleTargetClick">目标按钮（{{ clickCount }}）</Button>
		<p>允许交互时点击目标；禁止交互时点击蒙层推进。</p>
		<Tour
			v-model="isActive" advance-on-click :disable-active-interaction="isInteractionDisabled"
			progress-type="dot" mask-click-behavior="next" :mask-closable="false"
			@visible-change="handleVisibleChange" @close="handleClose"
		>
			<TourStep :element="() => targetButton?.$el" title="操作目标" content="目标点击保留计数行为，并进入下一步；蒙层点击也能推进。" />
			<TourStep title="完成引导" content="无目标时居中显示，最后一步的推进操作会完成引导。" />
		</Tour>
	</div>
</template>

<script setup>
import { ref, inject } from 'vue';
import { Tour, TourStep, Button } from '@deot/vc';

const isActive = ref(false);
const isInteractionDisabled = ref(false);
const targetButton = ref();
const clickCount = ref(0);
const playground = inject('docs:playground');
const preview = playground.run(460);
const handleVisibleChange = isVisible => isVisible && preview(true);
const handleClose = () => preview(false);
const handleStart = () => { isActive.value = true; };
const handleTargetClick = () => { clickCount.value++; };
</script>

<style scoped>
.interaction-example {
	display: flex;
	flex-direction: column;
	gap: 20px;
	align-items: flex-start;
}

.interaction-toolbar {
	display: flex;
	flex-wrap: wrap;
	gap: 12px;
	align-items: center;
}
</style>
```
:::

### 等待目标、跳过与插槽

`waitForElement` 指定等待毫秒数，等待期间保留上一张卡片，首次打开保持隐藏且不锁定滚动。超时后按 `skipMissingElement` 决定居中或跳过。主动不提供 `element` 的步骤不会跳过；全部无效时结果为 `empty`，已有有效步骤后剩余全部跳过时执行完成操作。

:::playground
<!-- <config lang="json5">{ previewInset: 24, expandable: true }</config> -->
```vue
<template>
	<div>
		<div class="waiting-toolbar">
			<Button @click="handleStart">等待新目标</Button>
			<Button v-if="isTargetVisible" ref="targetButton">延迟出现的目标</Button>
		</div>
		<p>当前下标：{{ current }}；缺失的中间步骤会自动跳过。</p>
		<Tour
			v-model="isActive" v-model:current="current" skip-missing-element advance-on-click
			@visible-change="handleVisibleChange" @close="handleClose"
		>
			<TourStep :element="() => targetButton?.$el" :wait-for-element="1500" title="目标已出现">
				<template #content><strong>内容插槽</strong><p>点击目标进入下一步。</p></template>
			</TourStep>
			<TourStep element="#missing-tour-target" title="这个步骤被跳过" />
			<TourStep title="自定义页脚">
				<template #footer="{ finish: handleFinish }"><Button type="primary" @click="handleFinish">完成引导</Button></template>
			</TourStep>
		</Tour>
	</div>
</template>

<script setup>
import { ref, inject, onBeforeUnmount } from 'vue';
import { Tour, TourStep, Button } from '@deot/vc';

const isActive = ref(false);
const isTargetVisible = ref(false);
const current = ref(0);
const targetButton = ref();
const playground = inject('docs:playground');
const preview = playground.run(420);
let timer;
const handleVisibleChange = isVisible => isVisible && preview(true);
const handleClose = () => { clearTimeout(timer); preview(false); };
const handleStart = () => {
	isTargetVisible.value = false;
	current.value = 0;
	isActive.value = true;
	clearTimeout(timer);
	timer = setTimeout(() => { isTargetVisible.value = true; }, 500);
};
onBeforeUnmount(() => clearTimeout(timer));
</script>

<style scoped>
.waiting-toolbar {
	display: flex;
	flex-wrap: wrap;
	gap: 16px;
	align-items: center;
}
</style>
```
:::

### 缓存与重新演示

实例 `cache` 为字符串 key，`false` 或不传表示不缓存。`VcInstance.configure({ Tour })` 中的 `cache` 是布尔总开关，默认 `true`；关闭后所有实例不读写缓存。默认只记住 `finish/skip`，关闭图标、ESC 和蒙层关闭不记录；`cacheTypes` 可以调整写入类型，替换、强制销毁和卸载始终不写缓存。

下面用页面内的 Set 演示缓存命中、全局开关和清除后重新打开。示例卸载时恢复原配置。

:::playground
<!-- <config lang="json5">{ previewInset: 24, expandable: true }</config> -->
```vue
<template>
	<div>
		<div class="cache-toolbar">
			<Button @click="handleOpen">打开缓存引导</Button>
			<Button @click="handleClearCache">清除缓存</Button>
			<label><input v-model="isCacheEnabled" type="checkbox" @change="handleCacheChange"> 全局允许缓存</label>
		</div>
		<p>结果：{{ resultType || '完成或跳过后再次打开，观察缓存命中' }}</p>
	</div>
</template>

<script setup>
import { ref, inject, onBeforeUnmount } from 'vue';
import { Tour, Button, VcInstance } from '@deot/vc';

const originalConfig = VcInstance.options.Tour;
const cachedKeys = new Set();
const cacheKey = 'tour-cache-demo';
const isCacheEnabled = ref(true);
const resultType = ref('');
const playground = inject('docs:playground');
const preview = playground.run(420);
let tourLeaf;
const configure = () => VcInstance.configure({ Tour: {
	...originalConfig,
	cache: isCacheEnabled.value,
	cacheTypes: ['finish', 'skip'],
	getCache: ({ cacheKey }) => cachedKeys.has(cacheKey),
	setCache: ({ cacheKey }) => { cachedKeys.add(cacheKey); }
} });
configure();
const handleCacheChange = () => configure();
const handleVisibleChange = isVisible => isVisible && preview(true);
const handleClose = () => preview(false);
const handleClearCache = () => { cachedKeys.delete(cacheKey); resultType.value = '缓存已清除'; };
const handleOpen = async () => {
	tourLeaf = Tour.open({
		cache: cacheKey,
		steps: [{ title: '缓存引导', content: '点击完成或跳过后，再次打开会命中缓存。清除缓存后可重新演示。' }],
		onVisibleChange: handleVisibleChange,
		onClose: handleClose
	});
	resultType.value = (await tourLeaf).type;
};
onBeforeUnmount(() => { tourLeaf?.destroy(); VcInstance.configure({ Tour: originalConfig }); });
</script>

<style scoped>
.cache-toolbar {
	display: flex;
	flex-wrap: wrap;
	gap: 12px;
	align-items: center;
}
</style>
```
:::

默认缓存只保存在页面内存。业务可通过 `getCache/setCache` 接入持久化或服务端，均支持 Promise。例如：

```ts
import { Tour, VcInstance } from '@deot/vc';

VcInstance.configure({ Tour: {
	cache: true,
	cacheTypes: ['finish', 'skip'],
	getCache: ({ cacheKey }) => localStorage.getItem(cacheKey) === 'done',
	setCache: ({ cacheKey }) => { localStorage.setItem(cacheKey, 'done'); },
	onOpen: ({ steps }) => steps.length > 0
} });
Tour.open({ cache: 'feature-guide-v1', steps: [{ element: '#feature-entry', title: '功能入口' }] });
```

`configure` 整体替换嵌套对象，切换开关时保留回调：`VcInstance.configure({ Tour: { ...VcInstance.options.Tour, cache: false } })`。读取失败通知 `error` 并允许展示，写入失败通知 `error` 并正常结束。全局 `onOpen` 先于实例 `onOpen`，返回 `false`、抛错或拒绝均阻止打开。完整配置见 [VcInstance](../vc/README.md)。

## 主题与局部覆盖

全局参数通过 `--vc-<参数>` 配置，单个引导通过 `--vc-tour-<参数>` 覆盖。同一参数可能作用于多个区域。

卡片与蒙层由 Portal 挂载，覆盖变量需作用于实际引导根节点或其祖先。默认挂载到 body，调用方容器上的变量不会自动继承；可通过 `wrapperStyle` 设置当前引导的 CSS 变量，例如 `{ '--vc-tour-border-radius': '12px' }`。声明式组件和 `Tour.open(options)` 都支持这种方式。

内嵌的 [Button](../button/README.md#主题与局部覆盖) 使用自己的主题入口；`--vc-tour-color-primary` 只覆盖当前进度点，按钮主色通过 `--vc-button-color-primary` 设置。

正文使用 [Scroller](../scroller/README.md#主题与局部覆盖)，滚动条沿用 Scroller 的主题入口。

有目标的步骤使用 [Popover](../popover/README.md) 气泡，挂载在引导根节点内；气泡和箭头的背景、圆角、阴影由下表的 Tour 参数设置，`wrapperStyle` 上的覆盖值同样生效。

### 全局

| 参数 | 使用位置 | 值 |
| --- | --- | --- |
| color-mask | 镂空蒙层 | 亮色：`rgb(0 0 0 / 40%)`；暗色：`rgb(255 255 255 / 40%)` |
| color-primary | 当前步骤的进度点 | `#456CF6` |
| background-color-lightest | 卡片及箭头背景 | 亮色：`#FFFFFF`；暗色：`#252B3A` |
| foreground-color | 标题及默认文字 | 亮色：`#080F20`；暗色：`#F8F8F8` |
| foreground-color-light | 正文及关闭图标 | 亮色：`#667383`；暗色：`#C9C9C9` |
| foreground-color-inactive | 数字进度及非当前步骤的进度点 | 亮色：`#C0C4CC`；暗色：`#737D8C` |
| border-radius | 卡片圆角 | `8px` |
| box-shadow-floating | 卡片阴影 | 亮色：`0 4px 12px rgb(0 0 0 / 12%)`；暗色：`0 4px 12px rgb(0 0 0 / 32%)` |
| font-size-small | 默认字号 | `13px` |
| line-height-large | 默认行高 | `20px` |

### 局部

当前组件没有额外的局部 CSS 主题参数。

## API

### Tour 属性

公共展示和操作参数也适用于 `TourStep` 与静态步骤；步骤未填写时继承 Tour，保留显式 `false/0/空字符串`，配置对象整体覆盖。

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| modelValue | 声明式组件是否请求打开，支持 `v-model`；静态调用无需传入 | `boolean` | - | `false` |
| current | 步骤下标，从 0 开始，支持 `v-model:current`；未绑定时内部管理 | `number` | - | `undefined` |
| steps | 静态步骤数组；有声明式 TourStep 时优先使用声明，不合并 | `object[]` | - | `[]` |
| getPopupContainer | 声明式组件打开时指定 Portal 挂载容器，默认使用 body；静态调用使用 Portal 的 element | `() => HTMLElement` | - | - |
| zIndex | 覆盖自动计算的浮层层级 | `number` | - | - |
| scrollable | 允许背景滚动；为 true 时自身不持锁，仍保留其他浮层的滚动锁 | `boolean` | - | `false` |
| wrapperClass | 整个引导的类名 | `string \| object \| any[]` | - | - |
| wrapperStyle | 整个引导的样式 | `string \| object \| any[]` | - | - |
| cache | 字符串作为缓存 key；false 或未传时不缓存 | `string \| boolean` | 字符串、`false` | `false` |
| cacheTypes | 写入缓存的结束类型，覆盖全局配置 | `string[]` | `finish`、`skip`、`close` | 全局配置，默认 `['finish', 'skip']` |
| onOpen | 实例打开检查，收到 `{ cacheKey, steps }`；支持 Promise，false 阻止打开 | `(context: any) => any` | - | - |
| placement | 卡片方向，空间不足时自动翻转或贴边 | `string` | `top`、`top-left`、`top-right`、`bottom`、`bottom-left`、`bottom-right`、`left`、`left-top`、`left-bottom`、`right`、`right-top`、`right-bottom` | `bottom` |
| arrow | 显示箭头；无目标时不显示 | `boolean` | - | `true` |
| closable | 显示关闭图标 | `boolean` | - | `true` |
| width | 卡片宽度，数字单位为 px；受可用视口限制 | `number \| string` | - | `300` |
| footer | 显示默认页脚或 footer 插槽 | `boolean` | - | `true` |
| contentClass | 卡片类名 | `string \| object \| any[]` | - | - |
| contentStyle | 卡片样式 | `string \| object \| any[]` | - | - |
| mask | 显示镂空蒙层；开启时约束焦点在卡片和可交互目标内 | `boolean` | - | `true` |
| maskClosable | 点击蒙层关闭，仅在 maskClickBehavior 为 close 时生效 | `boolean` | - | `true` |
| escClosable | ESC 关闭；独立于 keyboard | `boolean` | - | `true` |
| maskStyle | SVG 蒙层样式，颜色使用 fill 设置 | `string \| object \| any[]` | - | - |
| stagePadding | 高亮区域扩展距离；数组为 `[水平, 垂直]`，单位 px | `number \| number[]` | - | `10` |
| stageRadius | 高亮区域圆角，单位 px | `number` | - | `5` |
| disableActiveInteraction | 禁止当前目标的指针和键盘交互 | `boolean` | - | `false` |
| showProgress | 默认页脚中显示进度或 progress 插槽 | `boolean` | - | `true` |
| progressType | 默认进度形式；total 保留原步骤总数，包括被跳过的步骤 | `string` | `number`、`dot` | `number` |
| progressFormatter | 格式化数字进度，收到 `{ current, total }`；展示序号从 1 开始，未传时显示 `(1/2)` | `(context: any) => any` | - | - |
| previousText | 上一步文案，false 隐藏；首步不显示上一步 | `string \| boolean` | 字符串、`false` | 当前语言的“上一步” |
| nextText | 下一步文案，false 隐藏 | `string \| boolean` | 字符串、`false` | 当前语言的“下一步” |
| finishText | 完成文案，false 隐藏 | `string \| boolean` | 字符串、`false` | 当前语言的“我知道了” |
| skipText | 跳过文案，false 隐藏 | `string \| boolean` | 字符串、`false` | 当前语言的“跳过” |
| previousButtonOptions | 上一步 Button 属性及异步 onClick | `object` | - | - |
| nextButtonOptions | 下一步 Button 属性及异步 onClick | `object` | - | - |
| finishButtonOptions | 完成 Button 属性及异步 onClick | `object` | - | - |
| skipButtonOptions | 跳过 Button 属性及异步 onClick | `object` | - | - |
| animated | 开启高亮切换及进入、退出动画 | `boolean` | - | `true` |
| duration | 动画时长，单位毫秒 | `number` | - | `300` |
| keyboard | 左右键切步；过滤输入区、子弹层、组合输入、修饰键和重复键 | `boolean` | - | `true` |
| scrollIntoViewOptions | 目标自动滚动参数，false 禁止自动滚动 | `ScrollIntoViewOptions \| false` | 配置对象、`false` | `{ block: 'center', inline: 'nearest' }` |
| advanceOnClick | 允许目标交互时，点击目标执行推进操作，保留原行为 | `boolean` | - | `false` |
| waitForElement | 等待缺失目标的最长时间，单位毫秒 | `number` | - | `0` |
| skipMissingElement | 等待超时后跳过缺失目标；主动无目标的步骤不跳过 | `boolean` | - | `false` |
| maskClickBehavior | 点击蒙层的行为；next 复用推进回调，none 不处理 | `string` | `close`、`next`、`none` | `close` |

### Tour 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| update:modelValue | 同步打开状态 | `boolean` | 新状态 |
| update:current | 同步实际步骤下标 | `number` | 从 0 开始 |
| visible-change | 实际显示或隐藏时通知 | `boolean` | JSX / 静态调用使用 `onVisibleChange` |
| ready | 首次显示并完成定位 | `context` | 步骤上下文；静态调用使用 `onReady` |
| change | 成功切步后通知，首次打开不触发 | `(current, context)` | 新下标和步骤上下文；静态调用使用 `onChange` |
| finish | 完成操作成功 | `context` | 结束上下文，type 为 finish；静态调用使用 `onFinish` |
| skip | 跳过操作成功 | `context` | 结束上下文，type 为 skip；静态调用使用 `onSkip` |
| close | 展示过的引导实际结束，包含 finish 和 skip | `context` | 结束上下文；静态调用使用 `onClose` |
| error | 打开、目标、操作或缓存发生异常 | `{ error, phase, current }` | phase 为 open / element / action / getCache / setCache；静态调用使用 `onError` |

步骤上下文包含 `{ current, total, step, element }`：`current` 从 0 开始，`total` 为原步骤总数，`step` 为合并后的当前配置，`element` 为当前 HTMLElement 或 null。结束上下文额外包含 `type` 和 `source`，type 为 `finish/skip/close`；source 为 `button/keyboard/element/mask/esc/api/model/replace`。

按钮配置的 `onClick(event, context)` 收到原生事件（实例方法调用时为 undefined）及步骤上下文，额外包含 `next` 和 `source`。`next` 为请求的目标下标，完成和跳过时为 null。返回 false、抛错或拒绝均保留当前步骤，异常同时通知 error；对应配置的 `disabled` 也阻止该操作。按钮配置作用于该操作的所有入口，`onClick` 与 `disabled` 对左右键、目标点击、蒙层推进和实例方法同样生效，回调中可通过 `source` 区分入口。

### Tour 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 放置 TourStep 声明 | - |
| title | 当前步骤标题，步骤同名插槽优先 | 步骤上下文和导航方法 |
| content | 当前步骤内容，步骤 content/default 插槽优先 | 步骤上下文和导航方法 |
| header | 替换完整标题区域，步骤同名插槽优先 | 步骤上下文和导航方法 |
| footer | 替换完整页脚，footer=true 时显示，步骤同名插槽优先 | 步骤上下文和导航方法 |
| progress | 替换默认页脚中的进度，showProgress=true 时显示 | 步骤上下文和导航方法 |

导航方法为 `next/previous/goTo/finish/skip/close`。内容优先级为步骤 content 插槽、步骤 default 插槽、Tour content 插槽、步骤 content 参数。

### Tour 方法

组件 ref 和挂载后的 `leaf.wrapper` 提供以下实例方法。

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| next | 下一步；最后一步或后续全部缺失时执行完成操作 | - | `Promise<boolean>` |
| previous | 上一个有效步骤 | - | `Promise<boolean>` |
| goTo | 请求指定下标，不执行按钮操作回调；缺失目标按步骤配置处理 | `index: number` | `Promise<boolean>` |
| finish | 执行完成回调，成功后结束引导 | - | `Promise<boolean>` |
| skip | 执行跳过回调，成功后结束引导 | - | `Promise<boolean>` |
| close | 普通关闭，不经过操作回调 | - | `Promise<boolean>` |
| refresh | 重新查找目标并定位；缺失且配置跳过时执行推进操作 | - | `Promise<void>` |
| Tour.open | 同步创建 Portal 调用，参数与 Portal 配置合并在一个对象中 | `options: object` | `PortalLeaf` |
| Tour.destroy | 强制清理默认 Portal 名称下的引导和等待创建的实例 | - | `void` |

正常结束时 `await leaf` 返回 `{ type: 'finish' / 'skip' / 'close', current }`。缓存命中、阻止打开和完全没有有效步骤分别返回 `{ type: 'cached' / 'blocked' / 'empty', current: null }`，这些情况不触发 close。`Tour.destroy()` 和 `leaf.destroy()` 不写缓存、不结算结果 Promise；自定义 Portal 名称的实例通过 `leaf.destroy()` 清理。

### TourStep 属性

除下表外，还支持 Tour 表格中的公共展示和操作参数。静态步骤对象支持同样的参数，并通过 `onClose(context)` 接收当前步骤的结束通知。

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| element | 目标选择器、DOM 或返回 DOM/null 的函数；未提供时主动居中 | `string \| HTMLElement \| (() => HTMLElement \| null)` | - | - |
| title | 标题；字符串按 HTML 渲染，函数通过 Customer 渲染 | `string \| Function` | - | - |
| content | 内容；字符串按 HTML 渲染，函数通过 Customer 渲染 | `string \| Function` | - | - |

### TourStep 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| close | 当前步骤随引导实际结束时通知；其他步骤不通知 | `context` | 结束上下文；JSX 使用 `onClose` |

### TourStep 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 当前步骤内容，优先于 Tour content 插槽和 content 参数 | 步骤上下文和导航方法 |
| title | 替换当前步骤标题 | 步骤上下文和导航方法 |
| content | 替换当前步骤内容，优先于本步骤 default 插槽 | 步骤上下文和导航方法 |
| header | 替换完整标题区域 | 步骤上下文和导航方法 |
| footer | 替换完整页脚，footer=true 时显示 | 步骤上下文和导航方法 |
| progress | 替换默认页脚中的进度，showProgress=true 时显示 | 步骤上下文和导航方法 |

### 行为与使用说明

- 声明式步骤按当前模板顺序展示，支持带 key 的重排与插入。
- 初始等待期间更新 current 会取消旧查找并使用最新下标。异步操作期间拒绝其他导航，并将外部 current 同步回实际下标；外部关闭请求也会同步回实际打开状态。
- 同页只显示一个引导，新引导通过打开、缓存和初始目标检查后才替换旧引导。缓存命中或阻止打开不影响旧引导，较旧的异步打开不能覆盖新引导。
- 目标或祖先布局、选择器匹配变化后自动重新定位。结束或卸载后清理观察器、键盘监听和自身滚动锁，并恢复可用的入口焦点。
- 卡片高度受可用空间限制，长内容仅在正文区域通过 Scroller 滚动，标题、关闭按钮和底部操作保持固定；居中步骤与目标步骤行为一致。
- 有目标的步骤在引导根节点内渲染 Popover 的气泡，以高亮区为触发节点，定位、翻转、限高和箭头沿用 Popover；显隐由引导控制，点击外部不会关闭，跟随引导根节点淡入淡出。无目标的步骤居中显示，不使用气泡。
- 卡片或目标中打开的子弹层（如 Select 下拉）获得焦点时视为在引导内：Tab 从触发控件的位置继续，ESC 先让焦点回到触发控件，再次按下才关闭引导，左右键交给子弹层处理、不切步。
- Portal 创建的 app 不继承调用方插件和 provide，需要通过 uses/components/install 显式注入，卡片与气泡内容都在该 app 中；Portal 配置用法见 [Portal](../portal/README.md)。
- `getPopupContainer` 指向带 `transform` 等会改变 fixed 定位参照的容器时，气泡贴边仍以页面视口为准。
- title/content 字符串按 HTML 渲染，请传入可信内容；需要组合其他组件时使用渲染函数或插槽。
- `MTour`、`MTourStep` 分别是 `Tour`、`TourStep` 的别名，使用同一实现与样式，可从 `@deot/vc` 导入。

### 完整示例

- [声明式两步引导](./examples/index.vue)
- [方向、目标交互、异步等待和长内容](./examples/options.vue)
- [缓存与重新演示](./examples/cache.vue)
- [窄视口与主题](./examples/responsive.vue)
