## 标签页（Tabs）

将同级内容组织为可切换的面板，提供桌面端 `Tabs` / `TabsPane` 和移动端 `MTabs` / `MTabsPane`。

### 何时使用

在同一位置展示不同分类的内容，或通过标签导航到页面锚点。

### 基础用法

通过 `v-model` 绑定面板的 `value`。未设置 `value` 时使用从 0 开始的索引；动态增删时应显式提供稳定的 `value`。`disabled` 阻止点击切换，`animated` 默认为 `false`。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<Tabs v-model="value" animated>
		<TabsPane value="overview" label="概览">项目概览与最新动态。</TabsPane>
		<TabsPane value="details" label="详情">完整的项目说明。</TabsPane>
		<TabsPane value="locked" label="暂未开放" disabled />
	</Tabs>
	<p>当前面板：{{ value }}</p>
</template>

<script setup>
import { ref } from 'vue';
import { Tabs, TabsPane } from '@deot/vc';

const value = ref('overview');
</script>
```
:::

### 卡片与关闭标签

`type="card"` 使用卡片样式。关闭按钮要求父组件和面板同时开启 `closable`，线条样式也支持关闭。`tab-remove` 只通知调用方；删除数据、关闭前确认及删除当前页后的选中值均由调用方处理。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<Tabs v-model="value" type="card" closable @tab-remove="handleRemove">
		<TabsPane
			v-for="item in items"
			:key="item.value"
			:value="item.value"
			:label="item.label"
			:closable="item.value !== 'home'"
		>
			{{ item.label }}的内容
		</TabsPane>
	</Tabs>
	<p>首页保留；其他标签可以关闭。</p>
</template>

<script setup>
import { ref } from 'vue';
import { Tabs, TabsPane } from '@deot/vc';

const value = ref('report');
const items = ref([
	{ value: 'home', label: '首页' },
	{ value: 'report', label: '报表' },
	{ value: 'history', label: '历史记录' }
]);
const handleRemove = (removedValue, index) => {
	items.value.splice(index, 1);
	if (value.value === removedValue) {
		value.value = items.value[Math.max(0, index - 1)].value;
	}
};
</script>
```
:::

### 自定义标签

`label` 插槽接收 `{ row, index }`，其中 `row` 是面板的 props。也可将渲染函数传入面板的 `label`，函数接收 `{ it, index }`。移动端自定义标签应包含 `span`，供自动下划线宽度测量使用。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<Tabs v-model="value">
		<template #label="{ row, index }">
			<span>{{ index + 1 }} · {{ row.label }}</span>
		</template>
		<template #extra>共 2 项</template>
		<TabsPane value="pending" label="待处理">待处理事项。</TabsPane>
		<TabsPane value="done" label="已完成">已完成事项。</TabsPane>
	</Tabs>
</template>

<script setup>
import { ref } from 'vue';
import { Tabs, TabsPane } from '@deot/vc';

const value = ref('pending');
</script>
```
:::

### 移动端

移动端支持标签横向滚动、均分和滚动箭头。`theme="light"` 跟随全局亮暗主题；`theme="dark"` 是深色金色的独立视觉风格，不等同于切换全局主题。

:::playground
<!-- <config lang="json5">{ previewInset: 16, viewport: 375, viewportOptions: ['auto', 375] }</config> -->
```vue
<template>
	<div class="tabs-mobile-demo">
		<label><input v-model="isDark" type="checkbox"> 深色金色风格</label>
		<MTabs v-model="value" :theme="isDark ? 'dark' : 'light'" :average="false" show-step>
			<MTabsPane v-for="item in 8" :key="item" :value="item" :label="`分类 ${item}`">
				分类 {{ item }} 的内容
			</MTabsPane>
		</MTabs>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MTabs, MTabsPane } from '@deot/vc';

const value = ref(1);
const isDark = ref(false);
</script>

<style scoped>
.tabs-mobile-demo {
	display: grid;
	gap: 16px;
	min-width: 0;
}
</style>
```
:::

## API

### Tabs 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| modelValue | 当前面板的 value，支持 v-model | `string \| number \| boolean` | - | `undefined`，挂载后选中首项 |
| type | 标签样式 | `string` | `line` / `card` | `line` |
| animated | 开启切换动画 | `boolean` | - | `false` |
| closable | 与面板 closable 同时为 true 时显示关闭按钮 | `boolean` | - | `false` |
| barStyle | 标签栏样式 | `object \| string` | - | - |
| contentStyle | 内容区样式 | `object \| string` | - | - |
| barClass | 标签栏类名 | `object \| string` | - | - |
| contentClass | 内容区类名 | `object \| string` | - | - |
| afloat | 已声明，但桌面端不读取此开关；line 始终显示下划线 | `boolean` | - | `true` |
| affixable | 已声明，尚未接入；需要吸顶时在外层使用 Affix | `boolean` | - | `false` |
| affixOptions | 已声明，尚未接入 | `object` | - | - |

### Tabs 事件

下列事件同样适用于 `MTabs`。`value` 的类型为 `string | number | boolean`。

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| update:modelValue | 点击有效标签时更新绑定值 | `(value) => void` | 面板 value，缺省时为索引 |
| change | 有效标签点击时触发，包括重复点击当前项 | `(value) => void` | 当前面板值 |
| click | 与 change 一同触发 | `(value) => void` | 当前面板值 |
| tab-remove | 点击关闭按钮时触发，不会自动删除面板 | `(value, index) => void` | 待关闭面板值及从 0 开始的索引 |

连续点击受 300ms 间隔限制。直接修改 `modelValue` 不触发上述切换事件；配合外层 `Affix` 的锚点滚动同步也会触发 `update:modelValue`、`change` 和 `click`。

### Tabs 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 放置 TabsPane | - |
| label | 自定义标签，优先于面板 label | `{ row, index }` |
| extra | 标签栏右侧附加内容 | - |

### TabsPane 属性

以下属性也适用于 `MTabsPane`，需与对应父组件配套使用。

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| value | 面板标识，与父组件 modelValue 对应 | `string \| number \| boolean` | - | `undefined`，使用索引 |
| label | 标签内容；字符串按 HTML 渲染，仅传入可信内容 | `string \| Function` | - | `''` |
| anchor | 点击时滚动至目标元素的 CSS 选择器 | `string` | - | - |
| lazy | 首次激活时渲染内容，之后保留；false 时立即渲染 | `boolean` | - | `true` |
| closable | 配合父组件 closable 显示关闭按钮 | `boolean` | - | `false` |
| disabled | 禁止点击切换到此面板，不限制外部 modelValue 更新 | `boolean` | - | `false` |

### TabsPane 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 面板内容，MTabsPane 相同 | - |

### MTabs 属性

共享 `Tabs` 的 `modelValue`、`animated`、`closable`；其余有效属性如下。

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| theme | 标签栏视觉风格 | `string` | `light` / `dark` | `light` |
| barStyle | 标签栏样式 | `object \| unknown[]` | - | `{}` |
| afloat | 是否显示下划线 | `boolean` | - | `true` |
| autoAfloatWidth | light 风格下按标签内 span 宽度计算下划线；false 使用整项宽度，dark 固定为 20px | `boolean` | - | `true` |
| average | 标签均分可用宽度 | `boolean` | - | `true` |
| showWrapper | 是否显示标签栏 | `boolean` | - | `true` |
| sticky | 相对于页面滚动进行吸顶，不支持内层滚动容器 | `boolean` | - | `false` |
| offsetTop | 吸顶偏移，单位 px | `number` | - | `0` |
| showStep | 标签溢出时显示左右滚动按钮 | `boolean` | - | `false` |

移动端继承的 `type` 不提供卡片样式；`barClass`、`contentClass`、`contentStyle`、`affixable`、`affixOptions` 尚未接入移动端渲染。

### MTabs 事件

与 `Tabs` 事件相同。

### MTabs 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 放置 MTabsPane | - |
| label | 自定义标签 | `{ row, index }` |
| prepend | 标签栏前置内容 | - |
| append | 标签栏后置内容 | - |

### 布局与主题

在 flex 布局中给标签页所在的弹性子容器设置 `min-width: 0; overflow-x: auto;`，防止内容撑开容器。首次激活后的面板会保留在 DOM 中，切换时通过高度与透明度隐藏。

组件颜色通过 `--vc-tabs-*` 变量覆盖，并回退到全局主题。桌面端使用 `color-primary`、`color-dark-lightest`、`color-light-deeper` 和 `background-color-light`；移动端普通风格使用 `color-dark-lighter`、`foreground-color-dark`、`background-color-light` 和 `step-shadow-color`。移动端金色风格提供 `--vc-tabs-dark-background-color`、`--vc-tabs-dark-color`、`--vc-tabs-dark-step-shadow-color`，默认保留深色背景和金色标签。
