## 折叠/展开（Expand）

通过外部状态控制内容的折叠与展开，并提供高度过渡动画。

移动端入口导出的 `MExpand` 与 `Expand` 是同一实现。

### 何时使用

需要对页面内容进行折叠、展开切换。

### 基础用法

通过 `modelValue` 控制展开状态，`tag` 设置外层标签（初始化时确定）。组件不提供内置触发器，也不会主动发出 `update:modelValue`，由调用方更新状态。

:::playground
<!--
<config lang="json5">
{
	views: ['runtime', 'files'],
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="expand-demo">
		<div class="expand-demo__row">
			<Button type="primary" @click="handleToggle">
				{{ isVisible ? '收起' : '展开' }}更多筛选条件
			</Button>
		</div>
		<Expand :model-value="isVisible" tag="section">
			<div class="expand-demo__panel">
				<label class="expand-demo__field">
					关键词
					<Input placeholder="输入关键词" />
				</label>
				<label class="expand-demo__field">
					状态
					<Select v-model="status" class="expand-demo__select" :data="statusOptions" />
				</label>
			</div>
		</Expand>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, Expand, Input, Select } from '@deot/vc';

const isVisible = ref(false);
const status = ref('all');
const statusOptions = [
	{ value: 'all', label: '全部' },
	{ value: 'enabled', label: '启用' },
	{ value: 'disabled', label: '停用' }
];

const handleToggle = () => {
	isVisible.value = !isVisible.value;
};
</script>

<style scoped>
.expand-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.expand-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}

.expand-demo__panel {
	display: flex;
	flex-wrap: wrap;
	gap: 16px;
	padding: 16px;
	border: 1px solid var(--vc-color-neutral-light, #edeff1);
	border-radius: 4px;
}

.expand-demo__field {
	display: flex;
	align-items: center;
	gap: 8px;
	white-space: nowrap;
}

.expand-demo__select {
	width: 100px;
}
</style>
```
:::

### 保留与销毁子内容

`alive` 默认为 `true`，初始收起时也会渲染子内容，收起后保留其 DOM 和组件状态。设置为 `false` 时，仅在展开时渲染子内容，收起时移除；外层标签仍保留。

下面的输入框没有绑定外部状态：默认情况下收起再展开会保留输入，关闭保留选项后收起再展开会重建输入框。

:::playground
<!--
<config lang="json5">
{
	views: ['runtime', 'files'],
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="expand-demo">
		<div class="expand-demo__row">
			<Checkbox v-model="isAlive">保留子内容</Checkbox>
			<Button type="primary" @click="handleToggle">
				{{ isVisible ? '收起' : '展开' }}输入框
			</Button>
		</div>
		<Expand :model-value="isVisible" :alive="isAlive">
			<div class="expand-demo__panel">
				<label class="expand-demo__field">
					备注
					<Input placeholder="输入后收起再展开" />
				</label>
			</div>
		</Expand>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, Checkbox, Expand, Input } from '@deot/vc';

const isVisible = ref(true);
const isAlive = ref(true);

const handleToggle = () => {
	isVisible.value = !isVisible.value;
};
</script>

<style scoped>
.expand-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.expand-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}

.expand-demo__panel {
	padding: 16px;
	background: var(--vc-background-color-light, #f7f8fa);
	border-radius: 4px;
}

.expand-demo__field {
	display: flex;
	align-items: center;
	gap: 8px;
	white-space: nowrap;
}
</style>
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
