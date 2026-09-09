## 折叠/展开（Expand）

通过外部状态控制内容的折叠与展开，并提供高度过渡动画。

### 何时使用

需要对页面内容进行折叠、展开切换。

### 基础用法

通过 `modelValue` 控制展开状态。组件不提供内置触发器，也不会主动发出 `update:modelValue`，由调用方更新状态。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<div>
		<button type="button" @click="handleToggle">
			{{ visible ? '收起' : '展开' }}更多搜索条件
		</button>
		<Expand
			:model-value="visible"
		>
			<div style="margin: 20px;">折叠的内容</div>
		</Expand>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Expand } from '@deot/vc';

const visible = ref(false);

const handleToggle = () => {
	visible.value = !visible.value;
};
</script>
```
:::

### 保留与销毁子内容

`alive` 默认为 `true`，初始收起时也会渲染子内容，收起后保留其 DOM 和组件状态。设置为 `false` 时，仅在展开时渲染子内容，收起时移除；外层标签仍保留。

下面的输入框没有绑定外部状态：默认情况下收起再展开会保留输入，关闭保留选项后收起再展开会重建输入框。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<div>
		<label><input v-model="alive" type="checkbox">保留子内容</label>
		<button type="button" @click="visible = !visible">
			{{ visible ? '收起' : '展开' }}输入框
		</button>
	</div>
	<Expand :model-value="visible" :alive="alive">
		<p><input aria-label="示例输入" placeholder="输入后收起再展开"></p>
	</Expand>
</template>

<script setup>
import { ref } from 'vue';
import { Expand } from '@deot/vc';

const visible = ref(true);
const alive = ref(true);
</script>
```
:::

## API

### 属性

| 属性         | 说明           | 类型        | 可选值            | 默认值     |
| ---------- | ------------ | --------- | -------------- | ------- |
| tag        | 外层 HTML 标签，在组件初始化时确定 | `string` | - | `'div'` |
| modelValue | 折叠或展开状态      | `boolean` | `true`、`false` | `false` |
| alive      | 收起时是否保留子内容；为 `true` 时初始收起也会渲染子内容 | `boolean` | - | `true` |

### 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 需要折叠或展开的内容 | - |

### 移动端

`MExpand` 是 `Expand` 的别名，属性、插槽和行为一致，可从 `@deot/vc` 导入。
