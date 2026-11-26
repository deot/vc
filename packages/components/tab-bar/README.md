## 标签栏（TabBar）

页面底部的导航标签，用于在几个主页面之间切换。只有移动端：`MTabBar` / `MTabBarItem`；`TabBar` / `TabBarItem` 是相同实现的别名。

### 何时使用

- 应用的一级页面（首页、消息、我的等）之间切换，通常 3 – 5 项。
- 页面内的内容分类切换请用 [MTabs](../tabs/README.md)。

### 基础用法

两种写法：`data` 数组，或 `MTabBarItem` 子组件。传了 `data` 就按 `data` 渲染，忽略子组件。两种写法渲染出的 DOM 相同。

`value` 缺省时取序号，即 `data` 的下标或子组件的 DOM 顺序。未传 `v-model` 时选中第一项。选中项变化时触发 `update:modelValue` 与 `change`。

:::playground
<!--
<config lang="json5">
{
	mobile: true,
	previewInset: [12, 0],
	previewVariables: [{
		name: '--rem',
		label: 'rem',
		values: ['auto', '0.5px', '0.552px', '0.64px', '1px']
	}]
}
</config>
-->
```vue
<template>
	<div class="m-tab-bar-demo">
		<MTabBar v-model="value" :data="data" @change="handleChange" />
		<MTabBar v-model="index">
			<MTabBarItem label="首页" icon="grid" />
			<MTabBarItem label="发现" icon="search" :badge="3" />
			<MTabBarItem label="我的" icon="account" />
		</MTabBar>
		<p class="m-tab-bar-demo__result">data：{{ value }}；子组件：{{ index }}；{{ result }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MTabBar, MTabBarItem } from '@deot/vc';

const value = ref('message');
const index = ref(0);
const result = ref('尚未切换');
const data = [
	{ value: 'home', label: '首页', icon: 'grid' },
	{ value: 'message', label: '消息', icon: 'notice', badge: 8 },
	{ value: 'mine', label: '我的', icon: 'account', badge: true }
];

const handleChange = (v) => {
	result.value = `change：${v}`;
};
</script>

<style scoped>
.m-tab-bar-demo {
	display: flex;
	flex-direction: column;
	gap: calc(var(--vc-rem) * 32);
}

.m-tab-bar-demo__result {
	margin: 0;
	padding-inline: calc(var(--vc-rem) * 32);
	font-size: calc(var(--vc-rem) * 28);
	color: var(--vc-color-dark-extralight);
}
</style>
```
:::

### 图标与徽标

- `icon` 为字符串时是 [Icon](../icon/README.md) 的 `type`。
- `icon` 为函数时收到 `{ item, index, active }`，可以返回图片。
- `activeIcon` 是选中时的图标，不传就沿用 `icon`。
- `label` 为函数时同样收到 `{ item, index, active }`。

`badge` 传给 [MBadge](../badge/README.md)：

| 写法 | 效果 |
| --- | --- |
| 数字或字符串 | 作为 `value`，超过 99 显示 `99+` |
| `true` | 圆点 |
| 对象 | 原样透传，如 `{ dot: true, color }` |

只有文字时，徽标挂在文字的右上角。

:::playground
<!--
<config lang="json5">
{
	mobile: true,
	previewInset: [12, 0],
	previewVariables: [{
		name: '--rem',
		label: 'rem',
		values: ['auto', '0.5px', '0.552px', '0.64px', '1px']
	}]
}
</config>
-->
```vue
<template>
	<div class="m-tab-bar-demo">
		<MTabBar :data="data" />
		<MTabBar :data="badges" />
	</div>
</template>

<script setup>
import { h } from 'vue';
import { MTabBar } from '@deot/vc';

const svg = color => `data:image/svg+xml,${encodeURIComponent(
	`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect x="4" y="4" width="32" height="32" rx="8" fill="${color}"/></svg>`
)}`;

const data = [
	{
		label: '图片',
		icon: () => h('img', { src: svg('#C4C9D2'), alt: '' }),
		activeIcon: () => h('img', { src: svg('#456CF6'), alt: '' })
	},
	{ label: ({ active }) => (active ? '已选中' : '函数文字'), icon: 'notice', activeIcon: 'success' },
	{ label: '仅文字', badge: true }
];

const badges = [
	{ label: '数字', icon: 'notice', badge: 128 },
	{ label: '文字', icon: 'service', badge: '新' },
	{ label: '圆点', icon: 'grid', badge: true },
	{ label: '对象', icon: 'account', badge: { dot: true, color: '#1DB88C' } }
];
</script>

<style scoped>
.m-tab-bar-demo {
	display: flex;
	flex-direction: column;
	gap: calc(var(--vc-rem) * 32);
}
</style>
```
:::

### 固定在底部

- `fixed` 让标签栏贴在视口底部，根节点留在原位作为同高的占位，页面内容不会被遮住。`placeholder` 设为 `false` 可以去掉占位。
- 固定时默认在底部补上安全区（`env(safe-area-inset-bottom)`），`safeArea` 设为 `false` 可以关闭；不固定时也能用 `safeArea` 单独开启。
- `zIndex` 只在固定时生效，默认为 10。

:::playground
<!--
<config lang="json5">
{
	mobile: true,
	local: false,
	previewInset: [12, 0],
	previewVariables: [{
		name: '--rem',
		label: 'rem',
		values: ['auto', '0.5px', '0.552px', '0.64px', '1px']
	}]
}
</config>
-->
```vue
<template>
	<div class="m-tab-bar-demo">
		<p v-for="i in 20" :key="i" class="m-tab-bar-demo__row">第 {{ i }} 行</p>
		<MTabBar
			v-model="value"
			fixed
			:placeholder="true"
			:safe-area="false"
			:z-index="20"
			:data="data"
		/>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MTabBar } from '@deot/vc';

const value = ref('home');
const data = [
	{ value: 'home', label: '首页', icon: 'grid' },
	{ value: 'message', label: '消息', icon: 'notice' },
	{ value: 'mine', label: '我的', icon: 'account' }
];
</script>

<style scoped>
.m-tab-bar-demo__row {
	margin: 0;
	padding: calc(var(--vc-rem) * 16) calc(var(--vc-rem) * 32);
	font-size: calc(var(--vc-rem) * 28);
}
</style>
```
:::

### 跳转

点击的处理顺序：
1. 触发 `click`，每次点击都触发，包括重复点击当前项；
2. 值变化时更新 `v-model` 并触发 `change`；
3. 处理该项的 `to`。

点击当前项时只触发 `click`，不跳转；`disabled` 的项置灰，不响应点击。

`to` 的处理与 [MListItem](../list/README.md) 相同：
- 先调用全局配置 `VcInstance.configure({ MTabBar: { to } })` 中的处理函数，参数为 `{ value, instance }`；
  - `value` 是该项的 `to`，`instance` 是被点击的 MTabBarItem；
  - 返回任何非 `undefined` 的值都视为已接管；
- 否则，函数形式的 `to` 直接调用；
- 包含 `协议://地址` 的字符串用 `window.open` 打开。

路由路径不会自动交给 Vue Router。需要时在全局处理函数里接入，或者把 `v-model` 绑定到当前路由、在 `change` 里跳转：

```js
VcInstance.configure({
	MTabBar: {
		to: ({ value }) => (typeof value === 'string' && value.startsWith('/') ? router.push(value) : undefined)
	}
});
```

:::playground
<!--
<config lang="json5">
{
	mobile: true,
	previewInset: [12, 0],
	previewVariables: [{
		name: '--rem',
		label: 'rem',
		values: ['auto', '0.5px', '0.552px', '0.64px', '1px']
	}]
}
</config>
-->
```vue
<template>
	<div class="m-tab-bar-demo">
		<MTabBar v-model="value" :data="data" @click="handleClick" />
		<p class="m-tab-bar-demo__result">{{ result }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MTabBar } from '@deot/vc';

const value = ref('/home');
const result = ref('点击标签');

const handleClick = (v) => {
	result.value = `click：${v}，当前 ${value.value}`;
};

const handleGo = (target) => {
	result.value += `，to：${target}`;
};

const data = [
	{ value: '/home', label: '首页', icon: 'grid', to: () => handleGo('/home') },
	{ value: '/message', label: '消息', icon: 'notice', badge: 5, to: () => handleGo('/message') },
	{ value: '/mine', label: '我的', icon: 'account', to: () => handleGo('/mine') },
	{ value: '/disabled', label: '禁用', icon: 'close', disabled: true }
];
</script>

<style scoped>
.m-tab-bar-demo {
	display: flex;
	flex-direction: column;
	gap: calc(var(--vc-rem) * 32);
}

.m-tab-bar-demo__result {
	margin: 0;
	padding-inline: calc(var(--vc-rem) * 32);
	font-size: calc(var(--vc-rem) * 28);
	color: var(--vc-color-dark-extralight);
}
</style>
```
:::

### 自定义

`#icon`、`#label`、`#item` 插槽的参数都是 `{ item, index, active }`：
- `data` 模式下 `item` 是原始数据项，其中的业务字段（如 `path`）只在插槽里使用，不会写到 DOM 上；
- 子组件模式下 `item` 是 MTabBarItem 的 props。

`#item` 替换整项，适合中间凸起的按钮。`MTabBarItem` 自身的 `#icon`、`#label`、`#default` 优先于 MTabBar 的同名插槽，其中 `#default` 对应 MTabBar 的 `#item`。

:::playground
<!--
<config lang="json5">
{
	mobile: true,
	previewInset: [12, 0],
	previewVariables: [{
		name: '--rem',
		label: 'rem',
		values: ['auto', '0.5px', '0.552px', '0.64px', '1px']
	}]
}
</config>
-->
```vue
<template>
	<div class="m-tab-bar-demo">
		<MTabBar v-model="value" :data="data">
			<template #item="{ item, active }">
				<div v-if="item.value === 'publish'" class="m-tab-bar-demo__publish">
					<MIcon type="plus" />
				</div>
				<template v-else>
					<MIcon class="m-tab-bar-demo__icon" :type="item.icon" />
					<div class="m-tab-bar-demo__label" :class="{ 'is-active': active }">{{ item.label }}</div>
				</template>
			</template>
		</MTabBar>
		<MTabBar v-model="index">
			<template #icon="{ active }">
				<MIcon :type="active ? 'success' : 'grid'" />
			</template>
			<template #label="{ index: i }">第 {{ i + 1 }} 项</template>
			<MTabBarItem />
			<MTabBarItem />
			<MTabBarItem @click="handleItemClick">
				<template #label>本项文字</template>
			</MTabBarItem>
			<MTabBarItem>
				<template #icon>
					<MIcon type="star" />
				</template>
			</MTabBarItem>
			<MTabBarItem>
				<span class="m-tab-bar-demo__whole">整项替换</span>
			</MTabBarItem>
		</MTabBar>
		<p class="m-tab-bar-demo__result">{{ result }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MIcon, MTabBar, MTabBarItem } from '@deot/vc';

const value = ref('home');
const index = ref(0);
const result = ref('点击第 3 项触发 MTabBarItem 的 click');
const data = [
	{ value: 'home', label: '首页', icon: 'grid' },
	{ value: 'search', label: '发现', icon: 'search' },
	{ value: 'publish' },
	{ value: 'notice', label: '消息', icon: 'notice', disabled: true },
	{ value: 'mine', label: '我的', icon: 'account' }
];

const handleItemClick = (e) => {
	result.value = `MTabBarItem click：${e.type}`;
};
</script>

<style scoped>
.m-tab-bar-demo {
	display: flex;
	flex-direction: column;
	gap: calc(var(--vc-rem) * 32);
}

.m-tab-bar-demo__result {
	margin: 0;
	padding-inline: calc(var(--vc-rem) * 32);
	font-size: calc(var(--vc-rem) * 28);
	color: var(--vc-color-dark-extralight);
}

.m-tab-bar-demo__icon {
	font-size: calc(var(--vc-rem) * 40);
}

.m-tab-bar-demo__label {
	font-size: calc(var(--vc-rem) * 20);
	line-height: calc(var(--vc-rem) * 28);
}

.m-tab-bar-demo__publish {
	display: flex;
	align-items: center;
	justify-content: center;
	width: calc(var(--vc-rem) * 96);
	height: calc(var(--vc-rem) * 96);
	font-size: calc(var(--vc-rem) * 44);
	color: #fff;
	background: var(--vc-color-primary);
	border-radius: 50%;
	transform: translateY(calc(var(--vc-rem) * -24));
}

.m-tab-bar-demo__whole {
	font-size: calc(var(--vc-rem) * 24);
}
</style>
```
:::

## 尺寸

长度按 750 稿书写并随 `--vc-rem` 缩放；括号内为 375 宽下的 px。

| 部位 | 值 |
| --- | --- |
| 栏高 | 100（50），各项等分宽度 |
| 图标 / 上下间距 | 40（20）/ 14（7）、8（4） |
| 文字字号 / 行高 / 下间距 | 20（10）/ 28（14）/ 10（5） |
| 只有文字时 | 32（16）/ 44（22） |

## 主题与局部覆盖

全局参数通过 `--vc-<参数>` 配置，组件级覆盖使用 `--vc-tab-bar-<参数>`。局部参数可以设在组件根节点或其祖先上。

### 全局

| 参数 | 使用位置 | 值 |
| --- | --- | --- |
| color-dark-extralight | 未选中项的图标与文字 | 亮色：`#909399`；暗色：`#B9B9B9` |
| color-primary | 选中项的图标与文字 | `#456CF6` |
| color-neutral-light | 顶部分隔线 | 亮色：`#EDEFF1`；暗色：`#3B4354` |
| background-color-lightest | 背景 | 亮色：`#FFFFFF`；暗色：`#252B3A` |

### 局部

| 参数 | 说明 | 默认值 |
| --- | --- | --- |
| color | 未选中项的颜色 | `var(--vc-color-dark-extralight)` |
| active-color | 选中项的颜色 | `var(--vc-color-primary)` |
| background | 背景 | `var(--vc-background-color-lightest)` |

## API

### MTabBar 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| modelValue | 选中项的 `value`，支持 `v-model`；不传时选中第一项 | `string \| number` | - | - |
| data | 标签项，传了就按它渲染，忽略子组件 | `TabBarOption[]` | - | - |
| fixed | 固定在视口底部 | `boolean` | - | `false` |
| placeholder | 固定时在原位置留同高占位（含安全区） | `boolean` | - | `true` |
| safeArea | 底部补安全区；不传时跟随 `fixed` | `boolean` | - | - |
| zIndex | 固定时的层级 | `number` | - | `10`（CSS） |

### MTabBar 事件

| 事件名 | 说明 | 回调参数 |
| --- | --- | --- |
| update:modelValue / change | 选中项变化时触发 | `value` |
| click | 每次点击标签都触发，包括重复点击当前项；禁用项不触发 | `value` |

### MTabBar 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | MTabBarItem 子组件；传了 `data` 时忽略 | - |
| icon / label | 替换每一项的图标 / 文字 | `{ item, index, active }` |
| item | 替换每一项的全部内容 | `{ item, index, active }` |

### MTabBarItem 属性 / TabBarOption

`data` 的每一项与 MTabBarItem 的属性是同一份定义。`data` 项还可以带 `class`、`style`，以及只在插槽中使用的业务字段。

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| value | 标识；不传时取序号 | `string \| number` | - |
| label | 文字；函数形式收到 `{ item, index, active }` | `string \| number \| Function \| { type, value }` | - |
| icon | 图标：字符串为 Icon 的 `type`，函数形式同 `label` | `string \| Function \| { type, value }` | - |
| activeIcon | 选中时的图标，不传则沿用 `icon` | 同 `icon` | - |
| badge | 徽标，见上文 | `number \| string \| boolean \| BadgeProps` | - |
| to | 跳转，见上文 | `string \| object \| Function` | - |
| disabled | 禁用：置灰，不响应点击 | `boolean` | `false` |

### MTabBarItem 事件与插槽

| 名称 | 说明 |
| --- | --- |
| click（事件） | 点击时触发，参数为原生事件；禁用时不触发 |
| icon / label（插槽） | 替换本项的图标 / 文字，参数 `{ item, index, active }` |
| default（插槽） | 替换本项的全部内容，参数同上 |

### 无障碍

标签栏为 `role="tablist"`，各项为 `role="tab"`，带 `aria-selected`；禁用项带 `aria-disabled`。
