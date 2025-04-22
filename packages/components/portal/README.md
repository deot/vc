## 传送门（Portal）
渲染到组件内改变其他地方的DOM结构。

### 何时使用
组件在表示层和其他组件没有任何差异，但是在渲染的时候需要出现在其他地方时使用。
- 比如`Modal`、`Message`组件

### 基础用法

:::RUNTIME
```vue
<template>
	<Modal
		v-model="isVisible"
		title="Common Modal dialog box title"
		@ok="handleOk"
		@cancel="handleCancel"
	>
		<p>Content of dialog</p>
		<p>Content of dialog</p>
		<p>Content of dialog</p>
	</Modal>
</template>
<script>
import { ref, onMounted, defineEmits } from 'vue';
import { Modal } from '@deot/vc';

const emit = defineEmits(['portal-fulfilled', 'portal-rejected']);
const isVisible = ref(false);
onMounted(() => (isVisible.value = true));

const handleOk = () => {
	emit('portal-fulfilled');
};

const handleCancel = () => {
	emit('portal-rejected');
};
</script>
```

```js
import { Portal } from '@deot/vc';
import Wrapper from './wrapper.vue';

export const PModalWithBefore = new Portal(Wrapper, {
	onBeforeCreate() {
		return new Promise((resolve) => {
			setTimeout(resolve, 1000);
		});
	}
});

export const PModal = new Portal(Wrapper, {});
```
:::

### 调用

:::RUNTIME
```vue
<template>
	<div>
		<div @click="handleClickWithBefore">
			点我(带延迟)
		</div>
		<div @click="handleClick">
			点我(不带延迟)
		</div>
	</div>
</template>
<script setup>
import { PModal, PModalWithBefore } from './popup';

const handleClickWithBefore = async () => {
	try {
		const res = await PModalWithBefore.popup({});
		console.log(res);
	} catch (e) {
		console.log(e);
	}
};
const handleClick = async () => {
	try {
		const res = await PModal.popup({});
		console.log(res);
	} catch (e) {
		console.log(e);
	}
};
</script>
```
:::

### 组件 - `PortalView`

:::RUNTIME
```vue
<template>
	<PortalView>
		<div>placeholder</div>
	</PortalView>
</template>
<script setup>
import { PortalView } from '@deot/vc';

</script>
```
:::

## API

### Portal参数

| 属性      | 说明     | 类型       | 可选值 | 默认值 |
| ------- | ------ | -------- | --- | --- |
| wrapper | 要传送的组件 | `object` | -   | -   |
| options | 配置项    | `object` | -   | -   |

#### `PortalOptions`参数

| 属性              | 说明               | 类型        | 可选值        | 默认值                                           |
| --------------- | ---------------- | --------- | ---------- | --------------------------------------------- |
| tag             | 外层标签             | `string`  | -          | `div`                                         |
| el              | 组件插入的目标元素        | `string`  | -          | `body`                                        |
| name            | 组件`name`：用于标识卸载  | `string`  | -          | 传入的`wapper`组件`name`                           |
| alive           | 是否缓存组件不消毁        | `boolean` | -          | `false`                                       |
| aliveRegExp     | 实例以外且该数组内的, 不销毁  | `object`  | -          | `{ className: /(vc-hack-alive\vc-hack-cp)/ }` |
| aliveVisibleKey | 控制组件显示隐藏字段       | `string`  | -          | `isVisible`                                   |
| aliveUpdateKey  | 控制组件重新更新的字段      | `string`  | -          | `update`                                      |
| multiple        | 多个实例共存           | `boolean` | -          | `false`                                       |
| leaveDelay      | 延迟关闭，单位`s`       | `Number`  | -          | 0.3                                           |
| autoDestroy     | 自动销毁             | `boolean` | -          | `true`                                        |
| parent          | 依赖注入使用           | `object`  | -          | -                                             |
| components      | 动态注入组件           | `object`  | -          | -                                             |
| uses            | 动态注入插件           | `object`  | -          | -                                             |
| slots           | 插槽               | `object`  | -          | -                                             |
| fragment        | 是否使用片段，即组件没有根节点  | `boolean` | -          | false                                         |
| install         | 动态注入插件           | `object`  | -          | -                                             |
| propsData       | props数据          | `object`  | -          | -                                             |
| onBeforeCreate  | 初始化组件前操作，可以是ajax | -         | `Function` | -                                             |
| onFulfilled     | 调用成功的回调          | -         | `Function` | -                                             |
| onRejected      | 调用失败的回调          | -         | `Function` | -                                             |
| onDestroyed     | 已销毁时调用           | -         | `Function` | -                                             |

### [Viewer].popup(propsData?, options?)参数

| 属性        | 说明                     | 类型       | 可选值 | 默认值                    |
| --------- | ---------------------- | -------- | --- | ---------------------- |
| propsData | 传给组件的参数                | `object` | -   | -                      |
| options   | 配置参数，同上`PortalOptions` | `object` | -   | 默认字段同`PortalOptions`参数 |

> 当只有一个参数时，`propsData`会作为`options`, 所以可以使用`options.propsData`或者`options`中除配置字段，其他会作为`propsData`给组件


## TODO
- 支持`SSR`，可以借 `<RootPortals />`; 通知插入以及删除组件
