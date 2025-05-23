## 加载中 (Spin)

用于页面和区块的加载中状态

### 何时使用

页面局部处于等待异步数据或正在渲染过程时，合适的加载动效会有效缓解用户的焦虑。

### 基础用法

可以直接使用，当做简单的loading

:::RUNTIME
```vue
<template>
	<div class="v-spin-basic">
		<Spin />
		<div>一个简单的loading状态</div>
	</div>
</template>
<script>
import { Spin } from '@deot/vc';

export default {
	components: {
		Spin: Spin
	}
};
</script>
<style>
.v-spin-basic > div{
	margin-top: 10px
}
</style>
```

### 各种大小
通过`size`属性控制加载中样式的大小，单位`px`。

:::RUNTIME
```vue
<template>
	<div class="v-spin-size">
		<Spin :size="18" />
		<Spin :size="32" />
		<Spin :size="40" />
		<div>不同大小的loading</div>
	</div>
</template>
<script setup>
import { Spin } from '@deot/vc';
</script>
<style>
.v-spin-size > div{
	margin-top: 10px
}
</style>
```
::: 

### 切换加载状态
:::RUNTIME
```vue
<template>
	<div class="v-spin-switch">
		<div class="article">
			<h3>登金陵凤凰台</h3>
			<address>李白</address>
			<article>
				<p>凤凰台上凤凰游，凤去台空江自流。</p>
				<p>吴宫花草埋幽径，晋代衣冠成古丘。</p>
				<p>三山半落青天外，二水中分白鹭洲。</p>
				<p>总为浮云能蔽日，长安不见使人愁。</p>
			</article>
			<div class="spin" v-if="showSpin">
				<Spin />
			</div>
		</div>
		<div>
			切换显示状态:
			<Switch v-model="showSpin">
				<template v-slot:open>
					<span >开</span>
				</template>
				<template v-slot:close>
					<span >关</span>
				</template>
			</Switch>
		</div>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Spin, Switch } from '@deot/vc';

const showSpin = ref(false);
</script>
<style>
.v-spin-switch .article {
	position: relative;
}
.v-spin-switch .spin {
	position: absolute;
	top:0px;
	right: 0px;
	bottom: 0px;
	left: 0px;
	display: flex;
	justify-content: center;
	align-items: center;
	background: #ffffffaa;
}
</style>
```
::: 

### 添加加载中的文案

:::RUNTIME
```vue
<template>
	<div class="v-spin-loadding">
		<Spin>
			<div class="loadding">Loadding</div>
		</Spin>
		<Spin style="margin-left: 40px" background="red" foreground="#ccc" :size="40">
			<div class="loadding">Uploading</div>
		</Spin>
		<Spin style="margin-left: 40px" background="yellow" foreground="#ccc" :size="60">
			<div class="loadding">拼命加载中</div>
		</Spin>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Spin } from '@deot/vc';

const showSpin = ref(false);
</script>
<style>
.v-spin-loadding .loadding {
	margin-top: 20px;
	color: #5495F6;
	background: #ffffffaa;
}
</style>
```
::: 

## API

### 属性

| 属性         | 说明          | 类型       | 可选值 | 默认值                     |
| ---------- | ----------- | -------- | --- | ----------------------- |
| size       | Spin尺寸      | `number` | -   | 28                      |
| background | 背景色         | `string` | -   | var(--vc-color-primary) |
| foreground | loading指示颜色 | `string` | -   | #ccc                    |

### slot

| 名称      | 说明                            |
| ------- | ----------------------------- |
| loading | 自定义 Spin 的内容，设置slot后，默认的样式不生效 |
| default | 自定义加载中的文案                     |
