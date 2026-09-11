## 折叠面板（Collapse）

通过点击标题展开或收起分组内容。标题、内容和图标由插槽提供，组件只提供折叠行为与基础定位样式。

### 何时使用

- 分组展示较长内容，按需展开详情。
- 使用手风琴模式，在交互时只保留一个展开面板。

### 基础用法

普通模式使用数组保存展开项，通过 `change` 回写状态。`icon` 插槽提供当前面板的 `visible` 状态。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<div class="collapse-demo">
		<Collapse :model-value="value" @change="value = [...$event]">
			<CollapseItem v-for="item in items" :key="item.value" :value="item.value">
				<div class="title">
					<span>{{ item.title }}</span>
					<small>{{ item.summary }}</small>
				</div>
				<template #icon="{ visible }">
					<span class="icon">{{ visible ? '−' : '+' }}</span>
				</template>
				<template #content><p class="content">{{ item.content }}</p></template>
			</CollapseItem>
		</Collapse>
		<p class="result">已展开 {{ value.length }} 项</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Collapse, CollapseItem } from '@deot/vc';

const value = ref(['guide']);
const items = [
	{ value: 'guide', title: '使用指南', summary: '快速开始', content: '通过 change 事件同步状态，可以同时展开多个内容面板。' },
	{ value: 'details', title: '详细说明', summary: '交互细节', content: '标题和内容均可使用插槽自定义，图标插槽可读取 visible 状态。' }
];
</script>

<style scoped>
.collapse-demo {
	max-width: 560px;
	margin: 0 auto;
}
.title {
	display: flex;
	flex-direction: column;
	gap: 4px;
	padding: 14px 32px 14px 0;
	font-weight: 600;
}
.title small {
	font-size: 12px;
	font-weight: 400;
	opacity: .65;
}
.icon {
	position: absolute;
	top: 14px;
	right: 8px;
	font-size: 20px;
}
.content {
	margin: 0;
	padding: 0 0 14px;
	opacity: .8;
}
.result {
	margin: 12px 0 0;
	font-size: 13px;
	opacity: .65;
}
</style>
```
:::

### 手风琴与内容保留

设置 `accordion` 后，交互结果为单个标识；收起当前项时返回 `undefined`。设置 `:alive="false"` 可在收起时卸载内容，重新展开后内容状态也会重建。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<div class="accordion-demo">
		<Collapse :model-value="value" accordion :alive="false" @change="value = $event">
			<CollapseItem v-for="item in items" :key="item.id" :value="item.id">
				<div class="title">{{ item.title }}</div>
				<template #content>
					<div class="content">
						<p>{{ item.content }}</p>
						<input :aria-label="item.title + ' 的临时备注'" placeholder="收起后内容会重置">
					</div>
				</template>
			</CollapseItem>
		</Collapse>
		<p class="result">{{ value === undefined ? '当前没有展开项' : `当前展开：${value}` }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Collapse, CollapseItem } from '@deot/vc';

const value = ref(1);
const items = [
	{ id: 1, title: '账户设置', content: '收起后输入框会卸载，重新展开即可看到重置后的内容。' },
	{ id: 2, title: '通知偏好', content: '手风琴模式下，同一时间只保留一个面板展开。' }
];
</script>

<style scoped>
.accordion-demo {
	max-width: 560px;
	margin: 0 auto;
}
.title {
	padding: 14px 0;
	font-weight: 600;
}
.content {
	padding: 0 0 14px;
}
.content p {
	margin: 0 0 12px;
	font-size: 13px;
}
input {
	box-sizing: border-box;
	width: 100%;
	padding: 8px 10px;
	border: 1px solid var(--vc-border-color);
	border-radius: 4px;
}
.result {
	margin: 12px 0 0;
	font-size: 13px;
	opacity: .65;
}
</style>
```
:::

## API

### Collapse 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| modelValue | 展开项；普通模式应传数组，非数组视为全部收起。手风琴模式可传单个标识或数组，建议使用单个标识 | `Array<string \| number> \| string \| number` | - | `undefined` |
| accordion | 手风琴模式，点击展开时只保留最后展开的一项；传入的数组不会自动截断 | `boolean` | - | `false` |
| tag | 外层标签 | `string` | - | `'div'` |
| alive | 收起时保留内容节点；为 false 时卸载内容 | `boolean` | - | `true` |
| styleless | 不添加 Collapse 及 CollapseItem 的默认样式类名 | `boolean` | - | `false` |

### Collapse 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| change | 点击标题切换展开项时触发 | `(value: Array<string \| number> \| string \| number \| undefined) => void` | 普通模式为展开项数组；手风琴模式为单个标识，全部收起为 undefined |
| update:modelValue | 更新绑定值，支持 v-model；与 change 同时触发 | 同 change | 同 change |

### Collapse 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 放置 CollapseItem | - |

### CollapseItem 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| value | 面板标识，与 modelValue 中的值严格匹配；动态列表建议显式提供唯一标识 | `string \| number` | - | 挂载注册时分配的数字索引，从 0 开始 |
| tag | 外层标签 | `string` | - | `'div'` |

### CollapseItem 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 可点击的标题内容 | - |
| icon | 标题区域内的自定义图标 | `{ visible: boolean }`，表示当前是否展开 |
| content | 折叠内容 | - |

### CollapseItem 方法

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| toggle | 仅设置此项的展开状态，不同步父级 modelValue，也不触发 change；通常通过父级状态控制 | `visible: boolean` | `boolean`，设置后的状态 |

实例还暴露 `isActive`，表示当前展开状态。

### 使用注意

- 支持 `v-model`，也可使用示例中的 `:model-value` 和 `@change` 组合回写状态。
- 普通模式内部会修改传入数组；示例回写时复制数组。若需要隔离父级数组，可传入其副本。
- CollapseItem 需要放在 Collapse 内使用。`styleless` 不移除折叠行为和过渡结构，也不会自动提供替代样式。
- `MCollapse`、`MCollapseItem` 分别是 `Collapse`、`CollapseItem` 的别名，使用同一实现与样式，可从 `@deot/vc` 导入。
