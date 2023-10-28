## 更新`3.x`注意事项
- 变更方法: `onSure -> onFulfilled`
- 变更方法: `onClose -> onRejected`
- 变更事件: `sure -> portal-fulfilled`
- 变更事件: `close -> portal-rejected`
- 变更属性 `data -> dataSource`,
- 变更属性 `$slots -> slots`,
- 变更属性 `$parent -> parent`,
- 变更默认值: `aliveKey`, 'visible' -> 'isVisible'`
- 变更暴露属性 `vm -> app`, `app.wrapper`同`2.x`
- 变更取值`onBefore: () => response.data -> response`
- 变更属性: `parent -> uses(TODO)`
- 新增属性: `fragment: false`

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
	onBefore() {
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
}
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

### new Portal参数

| 属性              | 说明     | 类型       | 可选值 | 默认值 |
| --------------- | ------ | -------- | --- | --- |
| wrapper         | 要传送的组件 | `object` | -   | -   |
| registerOptions | 配置项    | `object` | -   | -   |


#### registerOptions参数

| 属性          | 说明                                                          | 类型         | 可选值        | 默认值                                           |
| ----------- | ----------------------------------------------------------- | ---------- | ---------- | --------------------------------------------- |
| tag         | 外层标签                                                        | `string`   | -          | `div`                                         |
| el          | 组件插入的目标元素                                                   | `string`   | -          | `body`                                        |
| cName       | 组件`name`：用于标识卸载                                             | `string`   | -          | 传入的`wapper`组件`name`                           |
| alive       | 是否缓存组件不消毁                                                   | `boolean`  | -          | `false`                                       |
| aliveRegExp | 实例以外且该数组内的, 不销毁                                             | `object`   | -          | `{ className: /(vc-hack-alive\vc-hack-cp)/ }` |
| multiple    | 多个实例共存                                                      | `boolean`  | -          | `false`                                       |
| promise     | 使用`promise`形式调用                                             | `boolean`  | -          | `false`                                       |
| onBefore    | 初始化组件前操作，可以是ajax                                            | -          | `Function` | -                                             |
| aliveKey    | 控制组件显示隐藏字段                                                  | `string`   | -          | `isVisible`                                   |
| leaveDelay  | 延迟关闭，单位`s`                                                  | `Number`   | -          | 0.3                                           |
| autoDestroy | 自动销毁                                                        | `boolean`  | -          | `true`                                        |
| getInstance | 获取组件实例                                                      | `Function` | -          | -                                             |
| parent      | 依赖注入使用 like store, router, Life cycle，methods, mixins, .... | `object`   | -          | -                                             |
| components  | 动态注入组件                                                      | `object`   | -          | -                                             |
| data        | props数据                                                     | `object`   | -          | -                                             |


### [Viewer].popup参数

| 属性      | 说明                       | 类型       | 可选值 | 默认值                      |
| ------- | ------------------------ | -------- | --- | ------------------------ |
| options | 配置参数，同上`registerOptions` | `object` | -   | 默认字段同`registerOptions`参数 |


## TODO
- 支持`SSR`，可以借 `<RootPortals />`; 通知插入以及删除组件
- HRM
