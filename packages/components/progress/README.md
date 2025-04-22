## 进度条（Progress）
展示操作的当前进度

### 何时使用
在操作需要较长时间才能完成时，为用户显示该操作的当前进度和状态。
- 当一个操作会打断当前界面，或者需要在后台运行，且耗时可能超过 2 秒时。
- 当需要显示一个操作完成的百分比时。

### 基础用法
默认是线性进度条，通过`status`控制进度条类型，当 percent 为 100 时，自动将状态置为 `success`。

:::RUNTIME
```vue
<template>
	<div class="v-progress-basic">
		<Progress
			:percent="50"
		/>
		<Progress
			:percent="100"
			status="success"
		/>
		<Progress
			:percent="20"
			status="error"
		/>
	</div>
</template>
<script setup>
import { Progress } from '@deot/vc';
</script>
<style>
.v-progress-basic {
	width: 500px;
}
</style>
```
:::

### 控制进度条的宽度
通过`stroke-width`控制进度条宽度，单位`px`。

:::RUNTIME
```vue
<template>
	<div class="v-progress-basic">
		<Progress
			:percent="100"
			status="success"
			:stroke-width="15"
		/>
		<Progress
			:percent="20"
			status="error"
			:stroke-width="25"
		/>
		<Progress
			:percent="50"
			:stroke-width="35"
		/>
	</div>
</template>
<script setup>
import { Progress } from '@deot/vc';
</script>
<style>
.v-progress-basic {
	width: 500px;
}
.v-progress-basic > .Progress{
	margin-bottom: 10px;
}
</style>
```
:::


### 进度条动态展示
通过`stroke-width`控制进度条宽度，单位`px`。

:::RUNTIME
```vue
<template>
	<div class="v-progress-basic">
		<Progress
			:percent="percent"
		/>
		<Button @click="handleIncrease">增加进度</Button>
		<Button @click="handleDecrease">减少进度</Button>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Progress, Button } from '@deot/vc';

const percent = ref(30);

const handleIncrease = () => {
	percent.value += 10;
	if (percent.value > 100) {
		percent.value = 100;
	}
};

const handleDecrease = () => {
	percent.value -= 10;
	if (percent.value < 0) {
		percent.value = 0;
	}
};
</script>
<style>
.v-progress-basic {
	width: 500px;
}
.v-progress-basic > .Progress{
	margin-bottom: 10px;
}
</style>
```
:::

### 圆形进度条
type `circle`控制，stroke-color控制颜色。

:::RUNTIME
```vue
<template>
	<div class="v-progress-circle">
		<Progress
			:stroke-width="10"
			:percent="50"
			stroke-color="#ed4014"
			type="circle"
		/>
		<br/>
		<Progress
			:stroke-width="10"
			:percent="60"
			:size="150"
			type="circle"
		>
			<div>这里可以自定义数据</div>
		</Progress>
	</div>
</template>
<script setup>
import { Progress } from '@deot/vc';
</script>
<style>
.v-progress-circle > .Progress {
	margin-bottom: 5px;
}
</style>
```
:::

## API

### 基础属性

| 属性           | 说明                                   | 类型                 | 可选值                                 | 默认值                                                           |
| ------------ | ------------------------------------ | ------------------ | ----------------------------------- | ------------------------------------------------------------- |
| type         | 进度条类型                                | `string`           | `line`、`circle`                     | `line`                                                        |
| percent      | 进度百分比                                | `number`、 `string` | -                                   | 0                                                             |
| status       | 状态                                   | `string`           | `normal`、`success`、`error`、`active` | `normal`                                                      |
| size         | 环形进度条画布宽度（只有type为`circle`时可用），单位`px` | `number`           | -                                   | 120                                                           |
| stroke-width | 进度条宽度，单位`px`                         | `number`           | -                                   | 6                                                             |
| stroke-color | 环形进度条颜色                              | `string`           | -                                   | #2d8cf0                                                       |
| show-info    | 是否显示进度数值或者状态图标                       | `Boolean`          | -                                   | true                                                          |
| line-theme   | line的颜色                              | `Object`           | -                                   | `{ normal: '#5495f6', success: '#52c41a', error: '#f5222d' }` |

