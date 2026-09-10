## 抽屉（Drawer）

抽屉从视口边缘滑入，覆盖住部分父窗体内容。用户在抽屉内操作时不必离开当前任务，操作完成后，可以平滑地回到原任务。

### 何时使用

- 当需要一个附加的面板来控制父窗体内容，这个面板在需要时呼出。比如，控制界面展示样式，往界面中添加内容。
- 当需要在当前任务流中插入临时任务，创建或预览附加内容。比如展示协议条款，创建子对象。

### 基础用法

通过 `placement` 控制抽屉出现的位置 `top`、`right`、`bottom`、`left`。

:::playground
<!-- <config lang="json5">{ previewInset: 16, expandable: true }</config> -->
```vue
<template>
	<div :class="['v-drawer-basic', { 'is-expanded': expanded }]">
		<p class="drawer-description">选择展开方向，在当前页面中查看项目详情。</p>
		<div class="drawer-actions">
			<Button @click="handleDrawer('top')">
				从上到下
			</Button>
			<Button @click="handleDrawer('left')">
				从左到右
			</Button>
			<Button @click="handleDrawer('bottom')">
				从下到上
			</Button>
			<Button @click="handleDrawer('right')">
				从右到左
			</Button>
		</div>
		<Drawer
			v-model="isActive"
			title="基础抽屉"
			:placement="placement"
			@visible-change="handleVisibleChange"
		>
			<div class="drawer-content">
				<strong>项目详情</strong>
				<p>当前展开方向：{{ placement }}</p>
				<p class="drawer-description">查看完毕后关闭抽屉，即可继续当前任务。</p>
			</div>
		</Drawer>
	</div>
</template>
<script setup>
import { nextTick, onUnmounted, ref } from 'vue';
import { Button, Drawer } from '@deot/vc';

const isActive = ref(false);
const placement = ref('top');
const expanded = ref(false);
let disposed = false;
const handleDrawer = async (res) => {
	placement.value = res;
	expanded.value = true;
	await nextTick();
	// Playground 的 iframe 需要先完成高度同步，普通业务页面无需此步骤。
	await new Promise((resolve) => {
		const check = () => {
			disposed || window.innerHeight >= 480 ? resolve() : requestAnimationFrame(check);
		};
		check();
	});
	if (disposed) return;
	isActive.value = true;
};
const handleVisibleChange = (value) => {
	if (!value) expanded.value = false;
};
onUnmounted(() => (disposed = true));
</script>

<style scoped>
.v-drawer-basic {
	display: grid;
	gap: 16px;
	align-content: start;
}

.drawer-actions {
	display: flex;
	gap: 12px;
	align-items: center;
	flex-wrap: wrap;
}

.drawer-description {
	margin: 0;
	font-size: 14px;
	line-height: 1.7;
	color: var(--vc-color-dark-lightest);
}

.drawer-content {
	display: grid;
	gap: 12px;
	line-height: 1.7;
}

.drawer-content p {
	margin: 0;
}

.v-drawer-basic.is-expanded {
	min-height: 500px;
}
</style>
```
:::

### 是否显示遮罩层
通过`mask`控制遮罩层。

:::playground
<!-- <config lang="json5">{ previewInset: 16, expandable: true }</config> -->
```vue
<template>
	<div :class="['v-drawer-mask', { 'is-expanded': expanded }]">
		<p class="drawer-description">对比两种遮罩模式，选择适合当前任务的展示方式。</p>
		<div class="drawer-actions">
			<Button type="primary" @click="handleDrawer(true)">
				有遮罩层
			</Button>
			<Button @click="handleDrawer(false)">
				无遮罩层
			</Button>
		</div>
		<Drawer
			v-model="isActive"
			title="遮罩设置"
			:mask="mask"
			@visible-change="handleVisibleChange"
		>
			<div class="drawer-content">
				<strong>{{ mask ? '已显示遮罩' : '已隐藏遮罩' }}</strong>
				<p class="drawer-description">可以通过关闭图标或底部按钮关闭抽屉。</p>
			</div>
		</Drawer>
	</div>
</template>
<script setup>
import { nextTick, onUnmounted, ref } from 'vue';
import { Button, Drawer } from '@deot/vc';

const isActive = ref(false);
const mask = ref(true);
const expanded = ref(false);
let disposed = false;
const handleDrawer = async (res) => {
	mask.value = res;
	expanded.value = true;
	await nextTick();
	// Playground 的 iframe 需要先完成高度同步，普通业务页面无需此步骤。
	await new Promise((resolve) => {
		const check = () => {
			disposed || window.innerHeight >= 480 ? resolve() : requestAnimationFrame(check);
		};
		check();
	});
	if (disposed) return;
	isActive.value = true;
};
const handleVisibleChange = (value) => {
	if (!value) expanded.value = false;
};
onUnmounted(() => (disposed = true));
</script>

<style scoped>
.v-drawer-mask {
	display: grid;
	gap: 16px;
	align-content: start;
}

.drawer-actions {
	display: flex;
	gap: 12px;
	align-items: center;
	flex-wrap: wrap;
}

.drawer-description {
	margin: 0;
	font-size: 14px;
	line-height: 1.7;
	color: var(--vc-color-dark-lightest);
}

.drawer-content {
	display: grid;
	gap: 12px;
	line-height: 1.7;
}

.drawer-content p {
	margin: 0;
}

.v-drawer-mask.is-expanded {
	min-height: 500px;
}
</style>
```
:::

### 关闭抽屉
通过`maskClosable`控制是否能够点击遮罩关闭抽屉。

:::playground
<!-- <config lang="json5">{ previewInset: 16, expandable: true }</config> -->
```vue
<template>
	<div :class="['v-drawer-close', { 'is-expanded': expanded }]">
		<p class="drawer-description">填写内容时，可禁止点击遮罩关闭，避免误操作。</p>
		<div class="drawer-actions">
			<Button type="primary" @click="handleDrawer">
				打开抽屉
			</Button>
		</div>
		<Drawer
			v-model="isActive"
			title="关闭设置"
			:mask-closable="false"
			@visible-change="handleVisibleChange"
		>
			<div class="drawer-content">
				<strong>点击遮罩不会关闭</strong>
				<p class="drawer-description">操作完成后，请使用关闭图标或底部按钮退出。</p>
			</div>
		</Drawer>
	</div>
</template>

<script setup>
import { nextTick, onUnmounted, ref } from 'vue';
import { Button, Drawer } from '@deot/vc';

const isActive = ref(false);
const expanded = ref(false);
let disposed = false;
const handleDrawer = async () => {
	expanded.value = true;
	await nextTick();
	// Playground 的 iframe 需要先完成高度同步，普通业务页面无需此步骤。
	await new Promise((resolve) => {
		const check = () => {
			disposed || window.innerHeight >= 480 ? resolve() : requestAnimationFrame(check);
		};
		check();
	});
	if (disposed) return;
	isActive.value = true;
};
const handleVisibleChange = (value) => {
	if (!value) expanded.value = false;
};
onUnmounted(() => (disposed = true));
</script>

<style scoped>
.v-drawer-close {
	display: grid;
	gap: 16px;
	align-content: start;
}

.drawer-actions {
	display: flex;
	gap: 12px;
	align-items: center;
	flex-wrap: wrap;
}

.drawer-description {
	margin: 0;
	font-size: 14px;
	line-height: 1.7;
	color: var(--vc-color-dark-lightest);
}

.drawer-content {
	display: grid;
	gap: 12px;
	line-height: 1.7;
}

.drawer-content p {
	margin: 0;
}

.v-drawer-close.is-expanded {
	min-height: 500px;
}
</style>
```
:::

### 函数调用与异步确认

`Drawer.open(options)` 创建挂载到 body 的抽屉，支持多个实例。确认回调返回 Promise 时，等待兑现后关闭。

:::playground
<!-- <config lang="json5">{ previewInset: 16, expandable: true }</config> -->
```vue
<template>
	<div :class="['drawer-open-demo', { 'is-expanded': expanded }]">
		<p class="drawer-description">模拟异步保存，完成后关闭抽屉并显示操作结果。</p>
		<div class="drawer-actions">
			<Button type="primary" @click="handleOpen">异步确认</Button>
			<span class="drawer-description" role="status">{{ status }}</span>
		</div>
	</div>
</template>

<script setup>
import { nextTick, onUnmounted, ref } from 'vue';
import { Button, Drawer } from '@deot/vc';

const status = ref('等待操作');
const expanded = ref(false);
let disposed = false;
let leaf;
let closeTimer;
const handleClose = () => {
	clearTimeout(closeTimer);
	closeTimer = setTimeout(() => {
		leaf?.destroy();
		leaf = undefined;
		expanded.value = false;
	}, 300);
};
const handleOpen = async () => {
	leaf?.destroy();
	expanded.value = true;
	await nextTick();
	// Playground 的 iframe 需要先完成高度同步，普通业务页面无需此步骤。
	await new Promise((resolve) => {
		const check = () => {
			disposed || window.innerHeight >= 480 ? resolve() : requestAnimationFrame(check);
		};
		check();
	});
	if (disposed) return;

	leaf = Drawer.open({
		title: '保存详情',
		content: '点击保存，等待一秒后关闭。',
		width: 320,
		okText: '保存',
		onOk: () => {
			status.value = '正在保存';
			return new Promise((resolve) => {
				setTimeout(() => {
					status.value = '已保存';
					resolve();
					handleClose();
				}, 1000);
			});
		},
		onCancel: handleClose
	});
};
onUnmounted(() => {
	disposed = true;
	clearTimeout(closeTimer);
	leaf?.destroy();
});
</script>

<style scoped>
.drawer-open-demo {
	display: grid;
	gap: 16px;
	align-content: start;
}

.drawer-actions {
	display: flex;
	gap: 12px;
	align-items: center;
	flex-wrap: wrap;
}

.drawer-description {
	margin: 0;
	font-size: 14px;
	line-height: 1.7;
	color: var(--vc-color-dark-lightest);
}

.drawer-open-demo.is-expanded {
	min-height: 500px;
}
</style>
```
:::

## API

`DrawerView` 与 `Drawer` 使用相同的属性、事件、插槽和实例方法。`Drawer` 额外提供静态方法 `open`、`destroy`。`MDrawer`、`MDrawerView` 是相应桌面组件的别名，共用实现和样式；小屏幕使用时应设置合适的宽度。

### 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| modelValue | 是否显示，支持 `v-model` | `boolean` | - | `false` |
| title | 标题；字符串按 HTML 渲染，函数由 Customer 渲染；布尔值不渲染标题内容 | `string \| boolean \| Function` | - | - |
| content | 内容，字符串按 HTML 渲染，函数由 Customer 渲染；与默认插槽同时显示 | `string \| Function` | - | `''` |
| placement | 滑入方向 | `string` | `top`、`right`、`bottom`、`left` | `'right'` |
| width | 左右抽屉宽度，单位 px | `number` | - | `600` |
| height | 上下抽屉高度，单位 px | `number` | - | `300` |
| mask | 显示遮罩 | `boolean` | - | `true` |
| maskClosable | 点击遮罩可关闭 | `boolean` | - | `true` |
| scrollable | 当前实现未使用该属性，打开时仍锁定页面滚动 | `boolean` | - | `false` |
| maskStyle | 遮罩样式 | `object \| string` | - | - |
| wrapperClass | 面板容器类名 | `object \| string` | - | - |
| wrapperStyle | 面板容器样式，可覆盖宽高 | `object \| string` | - | - |
| contentClass | 滚动内容区类名 | `object \| string` | - | - |
| contentStyle | 滚动内容区样式 | `object \| string` | - | - |
| closeWithCancel | 关闭图标、遮罩关闭时执行 onCancel；设为 false 时直接关闭 | `boolean` | - | `true` |
| okText | 确认按钮内容；false 或空字符串隐藏按钮 | `string \| boolean` | - | 当前语言的“确定” |
| cancelText | 取消按钮内容；false 或空字符串隐藏按钮 | `string \| boolean` | - | 当前语言的“取消” |
| okDisabled | 禁用确认按钮 | `boolean` | - | `false` |
| cancelDisabled | 禁用取消按钮，不影响关闭图标和遮罩 | `boolean` | - | `false` |
| footer | 显示底部区域；两个按钮内容均为假值时也会隐藏 | `boolean` | - | `true` |
| onOk | 点击确认的回调，返回值参与关闭判断 | `(event: MouseEvent) => any` | - | - |
| onCancel | 点击取消的回调；closeWithCancel 为 true 时也处理图标和遮罩关闭 | `(event: MouseEvent) => any` | - | - |

默认按钮文案跟随 `VcInstance.configure({ locale })` 更新，显式传入的文案优先。渲染函数接收 Customer 的 `(props, context)` 参数，可返回 Vue 渲染内容。

### 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| update:modelValue | 离场动画结束后同步关闭状态 | `false` | 仅关闭时触发 |
| close | 离场动画结束后触发 | - | JSX 对应 onClose |
| visible-change | 离场动画结束后触发；打开时不触发 | `false` | JSX 对应 onVisibleChange |

模板可通过 `@ok`、`@cancel` 传入上述 `onOk`、`onCancel` 回调。它们是带返回值的回调属性。

### 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 内容，追加在 content 后 | - |
| header | 替换标题内容，保留关闭图标 | - |
| footer | 替换默认按钮，仅在底部区域显示时生效 | - |
| footer-extra | 底部额外内容，位于 footer 插槽或默认按钮之前 | - |

### 方法

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| toggle | 实例方法，设置显示状态；省略参数时取反 | `value?: boolean` | `void` |
| Drawer.open | 静态方法，创建并打开抽屉 | 上述属性及 `onClose?: () => any` | `PortalLeaf` |
| Drawer.destroy | 静态方法，立即销毁所有 Drawer.open 创建的实例 | - | `void` |

`Drawer.open` 返回的对象支持 `then/catch/finally`，可用 `destroy()` 销毁单个实例。普通确认、取消或图标关闭最终均通过 close 完成，不能用 Promise 兑现区分确认与取消。`onClose` 在正常关闭时调用一次；直接销毁不等于执行确认或取消回调。


### 方法调用：等待关闭与确认结果

`await Drawer.open(options)` 等待的是抽屉关闭，不代表用户点击了确定。确认、取消或点击关闭图标，都可能结束弹层生命周期，因此不要把返回句柄的兑现当作业务确认结果。

`onClose` 始终表示弹层已经关闭；`onOk`、`onCancel` 分别处理确定和取消按钮的操作。它们返回的 Promise 如果被拒绝，抽屉会保持打开，用户可以再次操作，回调也可以执行多次；它们不是一次性的 Promise 消费。

注意：当前默认 `closeWithCancel=true` 会把关闭图标和遮罩关闭也关联到 `onCancel`。需要让 `onCancel` 仅表示点击取消按钮时，请设置 `closeWithCancel: false`。

如果业务需要一次性的确认结果，可以独立包装 Promise，将确定映射为兑现，取消或关闭映射为拒绝：

```js
import { Drawer } from '@deot/vc';

const confirm = () => new Promise((resolve, reject) => {
	Drawer.open({
		title: '确认操作',
		content: '确定后继续执行当前任务。',
		closeWithCancel: false,
		onOk: resolve,
		onCancel: reject,
		onClose: reject
	});
});
```

调用 `confirm()` 时使用 `try/catch` 或 `.catch()` 处理取消、关闭分支。确认后再触发 `onClose` 不会改变外层 Promise 已兑现的结果。这里调用外层 `reject` 是拒绝业务结果；它不同于从 onOk/onCancel 返回 `Promise.reject(...)`，后者才会阻止抽屉关闭。

### 关闭行为与注意事项

- onOk/onCancel 返回 Promise 时，兑现后关闭；拒绝时保持打开，组件没有内置错误提示。
- 同步返回假值（包括 false、undefined）或 true 时关闭；返回其他真值时保持打开。不要用 false 阻止关闭。
- toggle(true) 不发出 update:modelValue 或 visible-change；关闭动画结束后才发出 false。
- title/content 的字符串使用 innerHTML，请仅传入可信 HTML；普通文本可使用插槽。
