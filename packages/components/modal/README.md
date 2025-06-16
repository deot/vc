## 对话框（Modal）

模态对话框，在浮层中显示，引导用户进行相关操作。Modal提供了两种用法，普通组件使用和封装好的简洁实例调用。

### 何时使用

需要用户处理事务，又不希望跳转页面以致打断工作流程时，可以使用 Modal 在当前页面正中打开一个浮层，承载相应的操作。

### 基础用法

最简单的使用方法，通过控制属性`value`来显示 / 隐藏对话框。可以使用 v-model 实现双向绑定。默认按键盘`ESC`键也可以关闭。

:::RUNTIME
```vue
<template>
	<div class="v-modal-basic">
		<Button @click="handleModal">
			点击出现对话框
		</Button>
		<Modal
			v-model="visible"
			:mask-closable="true"
			title="标题1"
			@close="handleClose"
			@cancel="handleCancel"
			@ok="handleOk"
		>
			<div>Content</div>
		</Modal>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Button, Modal } from '@deot/vc';

const visible = ref(false);

const handleModal = () => {
	visible.value = true;
};

const handleClose = () => {
	console.log('关闭后都会触发');
};

const handleCancel = () => {
	console.log('点击取消这个按钮时回调');
};

const handleOk = (e) => {
	return new Promise((resolve, reject) => {
		setTimeout(resolve, 1000);
	});
};
</script>
<style>
.v-modal-basic > button {
	margin-bottom: 10px;
}
.vc-modal__header > p {
	margin-bottom: 0 !important;
}
</style>
```
:::

### 自定义样式
可自由控制Modal的组成部分，比如页头、页脚、按钮、可以根据`size`来切换Modal的大小，也可通过`width`设置Modal宽度

:::RUNTIME
```vue
<template>
	<div class="v-modal-basic">
		<Button @click="handleLarge">
			大弹框
		</Button>
		<Button @click="handleMedium">
			中弹框
		</Button>
		<Button @click="handleSmall">
			小弹框
		</Button>
		<Button @click="handleCustom">
			自定义header和footer
		</Button>
		<Button @click="handleWidth">
			设置宽度
		</Button>
		<Modal
			v-model="visible"
			title="大弹框"
			size="large"
		>
			<div>Content</div>
		</Modal>
		<Modal
			v-model="visible2"
			title="中弹框"
			size="medium"
		>
			<div>Content</div>
		</Modal>
		<Modal
			v-model="visible3"
			title="小弹框"
			sizee="small"
		>
			<div>Content</div>
		</Modal>
		<Modal
			v-model="visible4"
			:mask-closable="true"
		>
			<template #header>
				我是自定义的header
			</template>

			<template #footer>
				我是自定义的footer
			</template>
		</Modal>
		<Modal
			v-model="visible5"
			title="宽度为300的弹框"
			sizee="small"
			:width="300"
		>
			<div>Content</div>
		</Modal>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Button, Modal } from '@deot/vc';

const visible = ref(false);
const visible2 = ref(false);
const visible3 = ref(false);
const visible4 = ref(false);
const visible5 = ref(false);

const handleLarge = () => {
	visible.value = true;
};
const handleMedium = () => {
	visible2.value = true;
};
const handleSmall = () => {
	visible3.value = true;
};
const handleCustom = () => {
	visible4.value = true;
};
const handleWidth = () => {
	visible5.value = true;
};
</script>
```
:::

### 拖拽弹框
可以拖拽移动弹框

:::RUNTIME
```vue
<template>
	<div class="v-modal-basic">
		<Button @click="handleModal">
			可拖拽的对话框
		</Button>
		<Modal
			v-model="visible"
			:mask-closable="true"
			title="点击我进行拖拽"
			draggable
		>
			<div>Content</div>
		</Modal>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Button, Modal } from '@deot/vc';

const visible = ref(false);

const handleModal = () => {
	visible.value = true;
};
</script>
<style>
.v-modal-basic > button {
	margin-bottom: 10px;
}
</style>
```
:::

### 实例化使用方法

:::RUNTIME
```vue
<template>
	<div class="v-modal-basic">
		<Button @click="handleModal('info')">
			消息
		</Button>
		<Button @click="handleModal('success')">
			成功
		</Button>
		<Button @click="handleModal('error')">
			错误
		</Button>
		<Button @click="handleModal('warning')">
			警告
		</Button>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Button, Modal } from '@deot/vc';

const visible = ref(false);

const handleModal = (type) => {
	switch (type) {
		case 'info':
			Modal.info({
				title: 'info',
				content: 'content',
				okText: '自定义的按钮',
				loading: true,
				onOk: () => {
					console.log('23333');
				}
			});
			break;
		case 'success':
			Modal.success({
				title: 'success',
				content: 'content',
			});
			break;
		case 'error':
			Modal.error({
				title: 'error',
				content: 'content',
			});
			break;
		case 'warning':
			Modal.warning({
				title: 'waring',
				content: 'content',
			});
			break;
	}
};
</script>
```
:::

### 自定义内容

:::RUNTIME
```vue
<template>
	<div class="v-modal-basic">
		<Button @click="handleModal">
			自定义内容
		</Button>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Button, Modal } from '@deot/vc';

const visible = ref(false);

const handleModal = () => {
	Modal.info({
		title: 'info',
		content: (h) => {
			return (
				<div>
					<textarea
						placeholder="请输入内容"
					/>
				</div>
			);
		}
	});
};
</script>
```
:::

### 移动端基础用法

:::RUNTIME
```vue
<template>
	<div class="v-modal-basic">
		<button @click="handleModal">
			移动端弹框
		</button>
		<button @click="handleModal2">
			移动端弹框（实例化使用方法）
		</button>
		<button @click="handleModal3">
			移动端弹框（弹框内多个按钮）
		</button>
		<MModal
			v-model="visible"
			:mask-closable="true"
			title="标题"
			content="内容"
		/>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Button, MModal } from '@deot/vc';

const visible = ref(false);

const handleModal = () => {
	visible.value = !visible.value;
};
const handleModal2 = () => {
	MModal.alert({
		title: '标题1',
		content: '啦啦',
		onOk: () => {
			console.log('点击确定这个按钮时回调');
		},
		onCancel: (e, done) => {
			setTimeout(() => {
				done();
				console.log('点击确定这个按钮时回调');
			}, 3000);
			return true;
		},
		onClose: () => {
			console.log('关闭后都会触发');
		}
	});
};

const handleModal3 = () => {
	MModal.operation({
		actions: [
			{
				text: '1',
				onPress: () => console.log(`点击了第1个按钮`)
			},
			{
				text: '2',
				onPress: () => console.log(`点击了第2个按钮`)
			},
			{
				text: '3',
				onPress: () => console.log(`点击了第3个按钮`)
			}
		]
	});
};
</script>
```
:::

## API

### 基础属性

| 属性                | 说明                                 | 类型                  | 可选值                                | 默认值    |
| ----------------- | ---------------------------------- | ------------------- | ---------------------------------- | ------ |
| modelValue        | 对话框是否显示，可用v-model双向绑定              | `boolean`           | -                                  | false  |
| model             | 对话框的类型                             | `string`            | `info`、`success`、`error`、`warning` | -      |
| title             | 内容标题                               | `string`            | -                                  | -      |
| content           | 内容,可以是jsx                          | `string`、`Function` | -                                  | -      |
| footer            | 是否显示footer                         | `boolean`           | -                                  | -      |
| title             | 对话框标题，如果使用slot自定义header，则title无效   | `string`            | -                                  | -      |
| size              | 对话框的三个默认大小                         | `string`            | `small`、`medium`、`large`           | small  |
| wrapperStyle      | 设置wrapper的style | `object`、`string`           | -                                  |        |
| contentStyle      | 设置content的style | `object`、`string`           | -                                  |        |
| wrapperClass      | 设置wrapper的class | `object`、`string`           | -                                  |        |
| contentClass      | 设置content的class | `object`、`string`           | -                                  |        |
| ok-text           | 自定义确定按钮的文案                         | `string`、`boolean`  | -                                  | 确定     |
| cancel-text       | 自定义取消按钮的文案                         | `string`、`boolean`  | -                                  | 取消     |
| width             | 对话框的宽度                             | `number`            | -                                  | 400    |
| height             | 对话框的高度                             | `number`            | -                                  | -    |
| closable          | 是否显示关闭图标                           | `boolean`           | -                                  | `true` |
| mask              | 遮罩层是否显示                            | `boolean`           | -                                  | `true` |
| mask-closable     | 点击遮罩层是否关闭                          | `Booelan`           | -                                  | `true` |
| esc-closable      | 点击esc是否关闭                          | `boolean`           | -                                  | `true` |
| scrollable        | 页面是否可以滚动                           | `boolean`           | -                                  | false  |
| draggable         | 是否可以拖拽                             | `boolean`           | -                                  | false  |
| close-with-cancel | `主动`关闭时出发cancel事件                  | `boolean`           | -                                  | `true` |
| portalClass       | 弹框内容区域的className                   | `string`            | -                                  | -      |
| onOk              | 点击确定回调方法                           | `Function`          | -                                  | -      |
| onCancel          | 点击取消回调方法                           | `Function`          | -                                  | -      |


### 移动端基础属性

| 属性                | 说明                                 | 类型                            | 可选值                 | 默认值    |
| ----------------- | ---------------------------------- | ----------------------------- | ------------------- | ------ |
| model             | 对话框的类型                             | `string`                      | `alert`、`operation` | -      |
| title             | 内容标题                               | `string`、`boolean`            | -                   | -      |
| content           | 内容,可以是jsx                          | `string`、`Function`、`boolean` | -                   | -      |
| footer            | 是否显示footer                         | `boolean`                     | -                   | -      |
| visible           | 对话框是否显示，可用v-model双向绑定              | `boolean`                     | -                   | false  |
| title             | 对话框标题，如果使用slot自定义header，则title无效   | `string`                      | -                   | -      |
| wrapperStyle      | 设置wrapper的style | `object`                      | -                   |        |
| ok-text           | 自定义确定按钮的文案                         | `string`、`boolean`            | -                   | 确定     |
| cancel-text       | 自定义取消按钮的文案                         | `string`、`boolean`            | -                   | 取消     |
| width             | 对话框的宽度                             | `number`                      | -                   | 400    |
| mask              | 遮罩层是否显示                            | `boolean`                     | -                   | `true` |
| mask-closable     | 点击遮罩层是否关闭                          | `Booelan`                     | -                   | `true` |
| close-with-cancel | `主动`关闭时出发cancel事件                  | `boolean`                     | -                   | `true` |


### 事件

| 事件名            | 说明                            | 回调参数                           | 参数说明               |
| -------------- | ----------------------------- | ------------------------------ | ------------------ |
| ok             | 点击确定的回调, 配合Promise触发loading效果 | -                              | -                  |
| cancel         | 点击取消的回调                       | -                              | -                  |
| close          | 弹窗关闭后触发(可作用与portal)           | -                              | -                  |
| visible-change | 显示状态发生变化时触发                   | `(visible: boolean) => void 0` | `visible`：当前弹窗显示状态 |


### 额外事件（兼容portal）

| 事件名              | 说明    | 回调参数 | 参数说明 |
| ---------------- | ----- | ---- | ---- |
| portal-fulfilled | 确定时触发 | -    | -    |
| portal-rejected  | 取消时触发 | -    | -    |



### Modal slot

| 名称           | 说明           |
| ------------ | ------------ |
| header       | 自定义页头内容      |
| footer       | 自定义页脚内容      |
| footer-extra | 页脚按钮边上可自定义文案 |


### 方法

| 方法名        | 说明              | 参数 |
| ---------- | --------------- | -- |
| resetOrgin | 重新设置原始坐标, 关系到动画 | -  |


```javascript
Modal.info({});

Modal.success({});

Modal.error({});

Modal.warning({});

MModal.alert({});

MModal.operation({});
```

> 方法同上属性值, 事件使用`onOk`, `onCancel`

### TODO
使用`renderHeader`, `renderFooter` 方法式调用`slot`写法