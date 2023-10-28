## 折叠/展开（Expand）

折叠/展开面板

### 何时使用

需要对页面内容进行折叠、展开切换。

### 基础用法
通过`v-model`控制折叠或展开。

:::RUNTIME
```vue
<template>
	<div>
		<span @click="handleToggle">
			更多搜索条件{{ visible ? `up` : `down` }}
		</span>
		<Icon :type="`triangle-${visible ? `up2` : `down2`}`" />
		<Expand 
			ref="expand"
			v-model="visible"
		>
			<div style="margin: 20px;">折叠的内容</div>
		</Expand>
	</div>
</template>
<script setup>
import { ref } from 'vue';	
import { Expand, Icon } from '@deot/vc';

const visible = ref(false);

const handleToggle = () => {
	visible.value = !visible.value;
};
</script>
```
:::

## API

### 基础属性

| 属性      | 说明           | 类型        | 可选值            | 默认值     |
| ------- | ------------ | --------- | -------------- | ------- |
| tag     | 要渲染成的html标签  | `string`  | -              | `div`   |
| visible | 折叠或展开状态      | `boolean` | `true`、`false` | `false` |
| remove  | 收起后是否移除DOM节点 | `boolean` | -              | `false` |
