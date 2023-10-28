## 抽屉（Drawer）

抽屉从父窗体边缘滑入，覆盖住部分父窗体内容。用户在抽屉内操作时不必离开当前任务，操作完成后，可以平滑地回到到原任务

### 何时使用

- 当需要一个附加的面板来控制父窗体内容，这个面板在需要时呼出。比如，控制界面展示样式，往界面中添加内容。
- 当需要在当前任务流中插入临时任务，创建或预览附加内容。比如展示协议条款，创建子对象。

### 基础用法

通过 `placement` 控制抽屉出现的位置 `top`、`right`、`bottom`、`left`。

:::RUNTIME
```vue
<template>
	<div class="v-drawer-basic">
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
		<Drawer
			v-model="visible"
			:placement="placement"
		>
			我是content1
		</Drawer>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Button, Drawer } from '@deot/vc';

const visible = ref(false);
const placement = ref('top');
const handleDrawer = (res) => {
	visible.value = true;
	placement.value = res
};
</script>
```
:::

### 是否显示遮罩层
通过`mask`控制遮罩层。

:::RUNTIME
```vue
<template>
	<div>
		<Button @click="handleDrawer(true)">
			有遮罩层
		</Button>
		<Button @click="handleDrawer(false)">
			无遮罩层
		</Button>
		<Drawer
			v-model="visible"
			:mask="mask"
		>
			只能点击关闭按钮关闭
		</Drawer>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Button, Drawer } from '@deot/vc';

const visible = ref(false);
const mask = ref(true);
const handleDrawer = (res) => {
	visible.value = true;
};
</script>
```
:::

### 关闭抽屉
通过`maskClosable`控制是否能够点击遮罩关闭抽屉。

:::RUNTIME
```vue
<template>
	<div>
		<Button @click="handleDrawer">
			点击阴影蒙版不能关闭抽屉
		</Button>
		<Drawer
			v-model="visible"
			:maskClosable="false"
		>
			只能点击关闭按钮关闭
		</Drawer>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, Drawer } from '@deot/vc';

const visible = ref(false);
const handleDrawer = (res) => {
	visible.value = true;
};
</script>
```
:::

## API

### 基础属性

| 属性               | 说明                                 | 类型                        | 可选值                           | 默认值     |
| ---------------- | ---------------------------------- | ------------------------- | ----------------------------- | ------- |
| visable          | 抽屉是否显示，可使用 v-model 双向绑定数据          | `boolean`                 | -                             | `false` |
| title            | 抽屉的标题                              | `string`                  | -                             |         |
| width            | 抽屉的宽度（placement为`left`和`right`可设置） | `number`                  | -                             | 300     |
| height           | 抽屉的高度(placement为`top`和`bottom`可设置) | `number`                  | -                             | 300     |
| mask             | 遮罩是否显示                             | `boolean`                 | -                             | `true`  |
| mask-style       | 遮罩的样式                              | `Object`                  | -                             | -       |
| mask-closable    | 是否能够点击遮罩关闭                         | `boolean`                 | -                             | `true`  |
| scrollable       | 页面是否可以滚动                           | `boolean`                 | -                             | `false` |
| placement        | 抽屉的方向                              | `string`                  | `top`、`right`、`bottom`、`left` | `right` |
| wrapperClassName | `Drawer`容器的类名                      | `Object`、`Array`、`string` | -                             | -       |
| wrapperStyle     | 用于设置 `Drawer` 弹出层的样式               | `Object`、`Array`、`string` | -                             | -       |


### 事件

| 事件名            | 说明          | 回调参数 | 参数说明 |
| -------------- | ----------- | ---- | ---- |
| close          | 关闭时的回调      | -    | -    |
| visable-change | 显示状态发生变化时触发 | -    | -    |


### Drawer slot

| 名称     | 说明      |
| ------ | ------- |
| header | 自定义页头内容 |
