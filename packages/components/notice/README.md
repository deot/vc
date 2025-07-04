## 通知提醒（Notice）

全局展示通知提醒信息。

### 何时使用

在界面右上角显示可关闭的全局通知，可设置描述信息。经常用于以下情况：
- 较为复杂的通知内容。
- 带有交互的通知，给出用户下一步的行动点。
- 系统主动推送。

### 基础用法

基本用法，默认在 4.5秒后关闭。如果 content 参数为空或不填，则自动应用仅标题模式下的样式。

:::RUNTIME
```vue
<template>
	<div>
		<Button @click="handleClick(true)">
			打开通知
		</Button>
		<Button @click="handleClick(false)">
			仅标题模式
		</Button>
	</div>
</template>
<script setup>
import { Button, Notice } from '@deot/vc';

window.Notice = Notice;

const handleClick = (content) => {
	Notice.open({
		title: '这是标题',
		content: content ? '这里是通知描述这里,是通知描述这里是通知描述这里,是通知描述这里,是通知描述这里是通知描述这里是通知描述' : '',
		onClose() {
			console.log('回调');
		}
	});
};
</script>
```
:::

### 提醒类型
通知提醒框左侧有图标。

:::RUNTIME
```vue
<template>
	<div>
		<div>
			<Button @click="handleClick('info')">
				消息
			</Button>
			<Button @click="handleClick('success')">
				成功
			</Button>
			<Button @click="handleClick('error')">
				错误
			</Button>
			<Button @click="handleClick('warn')">
				警告
			</Button>
			<Button @click="handleClick('open')">
				无图标
			</Button>
		</div>
	</div>
</template>
<script setup>
import { Button, Notice } from '@deot/vc';

window.Notice = Notice;

const handleClick = (type) => {
	if (type === 'info') {
		Notice.info({
			title: '消息',
			content: '测试消息的提示',
			onClose() {
				console.log('回调');
			}
		});
	} else if (type === 'success') {
		Notice.success({
			title: '成功',
			content: '成功的提示',
			onClose() {
				console.log('回调');
			}
		});
	} else if (type === 'error') {
		Notice.error({
			title: '错误',
			content: '测试错误的提示',
			onClose() {
				console.log('回调');
			}
		});
	} else if (type === 'warn') {
		Notice.warning({
			title: '警告',
			content: '测试警告的提示',
			onClose() {
				console.log('回调');
			}
		});
	} else if (type === 'open') {
		Notice.open({
			title: '这是标题',
			content: '测试无图标的提示',
			onClose() {
				console.log('回调');
			}
		});
	}
};
</script>
```
:::

### 自定义关闭时间
使用duration属性，为0则不自动关闭，默认为4.5。

:::RUNTIME
```vue
<template>
	<div>
		<div>
			<Button @click="handleClick()">
				自定义关闭时间
			</Button>
		</div>
	</div>
</template>
<script setup>
import { Button, Notice } from '@deot/vc';

window.Notice = Notice;

const handleClick = (type) => {
	Notice.info({
		title: '手动关闭提醒',
		content: '需要点击关闭按钮关闭提醒',
		duration: 0,
		onClose: () => {
			console.log('回调');
		}
	});
};
</script>
```
:::

#### render函数渲染
你可以自定义 Render 函数来替代 content。

:::RUNTIME
```vue
<template>
	<div>
		<Button @click="handleClickrender">
			根据render函数渲染
		</Button>
	</div>
</template>
<script setup lang="jsx">
import { Button, Notice } from '@deot/vc';

window.Notice = Notice;

const handleClickrender = () => {
	Notice.info({
		content: (h) => {
			return (
				<span>
					使用
					<span style="color: #2B72FD">jsx</span>
					渲染
				</span>
			);
		}
	});
};
</script>
```
:::

## API

### 属性

| 属性          | 说明                    | 类型                        | 可选值                                | 默认值    |
| ----------- | --------------------- | ------------------------- | ---------------------------------- | ------ |
| title       | 通知的标题                 | `string`、`Function`       | -                                  | -      |
| content     | 通知的内容                 | `string`、`Function`、`jsx` | -                                  | -      |
| duration    | 自动关闭的延时，单位`ms`，不关闭可以写 0 | `number`                  | -                                  | 450    |
| closable    | 手动关闭提示                | `Boolean`                 | -                                  | `true` |
| mode        | 通知的图标类型               | `string`                  | `info`、`success`、`error`、`warning` | -      |
| beforeClose | 关闭前的回调                | `Function`                | -                                  | -      |
| onClose     | 关闭后的回调                | -                         | -                                  | -      |


### 事件

- `Notice.open(config)` 没有图标
- `Notice.success(config)`
- `Notice.info(config)`
- `Notice.error(config)`
- `Notice.warning(config)`
