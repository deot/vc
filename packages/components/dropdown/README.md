## 下拉菜单（Dropdown）

将操作收纳到浮层菜单中，通过 DropdownMenu 和 DropdownItem 展示并选择操作。移动端入口导出 `MDropdown`、`MDropdownMenu`、`MDropdownItem`，见[移动端](#移动端)。

### 何时使用

当页面操作较多，或需要为某个元素提供附加操作时使用。

### 基础用法

默认悬停展开；点击菜单项会触发 `click` 并关闭菜单。回调优先使用 `value`，缺省时使用 `label`；DropdownItem 的默认插槽优先于 `label` 显示，但不用于推断回调值。DropdownItem 自身也触发 `click`。浮层就绪时触发 `ready`。

:::playground
<!--
<config lang="json5">
{
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="dropdown-demo">
		<Dropdown placement="bottom-left" @click="handleClick" @ready="handleReady">
			<Button>悬停查看操作</Button>
			<template #content>
				<DropdownMenu>
					<DropdownItem value="edit" label="编辑" />
					<DropdownItem value="copy" label="复制" @click="handleItemClick" />
					<DropdownItem value="detail">
						<strong>查看详情</strong>
					</DropdownItem>
					<DropdownItem label="更多" />
				</DropdownMenu>
			</template>
		</Dropdown>
		<p class="dropdown-demo__result">最近操作：{{ action }}；{{ status }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, Dropdown, DropdownItem, DropdownMenu } from '@deot/vc';

const action = ref('尚未选择');
const status = ref('');

const handleClick = (value) => {
	action.value = value;
};

const handleItemClick = (value) => {
	status.value = `DropdownItem click：${value}`;
};

const handleReady = () => {
	status.value = '触发 ready';
};
</script>

<style scoped>
.dropdown-demo {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 16px;
}

.dropdown-demo__result {
	margin: 0;
}
</style>
```
:::

### 点击触发与菜单项状态

`selected` 只控制选中样式，选中值由调用方维护。`disabled` 阻止菜单项事件和关闭；`:closable="false"` 允许连续选择。`divided` 添加上分割线，`arrow` 显示浮层的箭头，`caret` 在触发内容之后显示箭头（展开时翻转）。`v-model` 同步菜单的显隐，内部显隐操作时还会触发 `visible-change`。

:::playground
<!--
<config lang="json5">
{
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="dropdown-demo">
		<Dropdown
			v-model="isVisible"
			trigger="click"
			placement="bottom-left"
			arrow
			@visible-change="handleVisibleChange"
			@click="handleClick"
		>
			<Button>点击选择排序</Button>
			<template #content>
				<DropdownMenu>
					<DropdownItem value="time" :selected="sort === 'time'" :closable="false" label="按时间排序" />
					<DropdownItem value="name" :selected="sort === 'name'" :closable="false" label="按名称排序" />
					<DropdownItem disabled label="无权限操作" />
					<DropdownItem value="done" divided label="完成并关闭" />
				</DropdownMenu>
			</template>
		</Dropdown>
		<p class="dropdown-demo__result">排序：{{ sort }}；菜单{{ isVisible ? '已展开' : '已关闭' }}；{{ status }}</p>
		<Dropdown caret placement="bottom-left" @click="handleClick">
			<span>{{ sort === 'time' ? '按时间排序' : '按名称排序' }}</span>
			<template #content>
				<DropdownMenu>
					<DropdownItem value="time" :selected="sort === 'time'" label="按时间排序" />
					<DropdownItem value="name" :selected="sort === 'name'" label="按名称排序" />
				</DropdownMenu>
			</template>
		</Dropdown>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, Dropdown, DropdownItem, DropdownMenu } from '@deot/vc';

const isVisible = ref(false);
const sort = ref('time');
const status = ref('');

const handleClick = (value) => {
	if (value !== 'done') sort.value = value;
};

const handleVisibleChange = (visible) => {
	status.value = `visible-change：${visible}`;
};
</script>

<style scoped>
.dropdown-demo {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 16px;
}

.dropdown-demo__result {
	margin: 0;
}
</style>
```
:::

### 手动控制与弹出位置

`trigger="custom"` 配合 `v-model` 控制显隐，也可以通过实例 `close()` 关闭。下例切换位置后重新展开，弹层靠近视口边缘时会自动调整位置；浮层关闭时触发 `close`。

:::playground
<!--
<config lang="json5">
{
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="dropdown-demo">
		<Select v-model="placement" :data="placements" label="弹出位置" class="dropdown-demo__select" @change="handlePlacement" />
		<div class="dropdown-demo__stage">
			<Dropdown
				ref="dropdownRef"
				v-model="isVisible"
				:placement="placement"
				trigger="custom"
				arrow
				@close="handleClose"
			>
				<Button @click="handleToggle">{{ isVisible ? '收起' : '展开' }}菜单</Button>
				<template #content>
					<DropdownMenu>
						<DropdownItem label="编辑" />
						<DropdownItem label="复制" />
					</DropdownMenu>
				</template>
			</Dropdown>
		</div>
		<div class="dropdown-demo__row">
			<Button @click="handleCall">调用 close()</Button>
		</div>
		<p class="dropdown-demo__result">{{ status }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, Dropdown, DropdownItem, DropdownMenu, Select } from '@deot/vc';

const dropdownRef = ref();
const isVisible = ref(false);
const placement = ref('bottom');
const status = ref('等待操作');
const placements = [
	'top', 'top-left', 'top-right', 'bottom', 'bottom-left', 'bottom-right',
	'left', 'left-top', 'left-bottom', 'right', 'right-top', 'right-bottom'
].map(value => ({ value, label: value }));

const handleToggle = () => {
	isVisible.value = !isVisible.value;
};

const handlePlacement = () => {
	isVisible.value = false;
};

const handleCall = () => {
	dropdownRef.value?.close();
};

const handleClose = () => {
	status.value = '触发 close';
};
</script>

<style scoped>
.dropdown-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.dropdown-demo__select {
	width: 240px;
}

.dropdown-demo__stage {
	display: flex;
	align-items: center;
	justify-content: center;
}

.dropdown-demo__row {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}

.dropdown-demo__result {
	margin: 0;
}
</style>
```
:::

### 固定的页头与页脚

`header`、`footer` 插槽放在浮层的顶部和底部，不随菜单内容滚动，可放置说明或「重置」等按钮。

:::playground
<!--
<config lang="json5">
{
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="dropdown-demo">
		<Dropdown trigger="click" placement="bottom-left" @click="handleClick">
			<Button>筛选条目</Button>
			<template #header>
				<div class="dropdown-demo__header">选择一个分组</div>
			</template>
			<template #content>
				<DropdownMenu>
					<DropdownItem v-for="item in groups" :key="item" :label="item" :selected="current === item" />
				</DropdownMenu>
			</template>
			<template #footer>
				<div class="dropdown-demo__footer">
					<Button size="small" type="text" @click="current = ''">重置</Button>
				</div>
			</template>
		</Dropdown>
		<p class="dropdown-demo__result">当前分组：{{ current || '全部' }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, Dropdown, DropdownItem, DropdownMenu } from '@deot/vc';

const groups = ['分组 A', '分组 B', '分组 C'];
const current = ref('');

const handleClick = (value) => {
	current.value = value;
};
</script>

<style scoped>
.dropdown-demo {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 16px;
}

.dropdown-demo__header {
	padding: 8px 16px 4px;
	font-size: 12px;
	color: var(--vc-color-dark-extralight);
}

.dropdown-demo__footer {
	display: flex;
	justify-content: flex-end;
	padding: 4px 8px;
}

.dropdown-demo__result {
	margin: 0;
}
</style>
```
:::

## 移动端

`MDropdown`、`MDropdownMenu`、`MDropdownItem` 与桌面端的结构相同：默认插槽为触发区，`content` 插槽放 `MDropdownMenu`（`ul`）与 `MDropdownItem`（`li`）。根节点另有标记类 `.vcm-dropdown`、`.vcm-dropdown-menu`、`.vcm-dropdown-item`，颜色与主题参数共用。尺寸按 750 稿设计，写为 `calc(var(--vc-rem) * n)`，随 `--vc-rem` 缩放，底栏切换 `rem` 可查看不同屏宽下的效果。

弹层不是跟随触发区的气泡，而是占满视口宽度的面板：从触发区下沿向下滑出，其余区域为蒙层，触发区保持可见；`placement` 为 `top*`，或下方剩余空间不足（小于上方且不到视口一半）时，从触发区上沿向上展开。面板为直角，最高为可用高度的 80%，超出时滚动。点击蒙层、面板与触发区以外的区域时关闭。同一时间只展开一个：展开另一个时，前一个立即收起，蒙层保持显示。

属性与 `Dropdown` 的差异：

- `trigger` 只有 `click`（默认）与 `custom`。
- 没有 `arrow`、`scrollable`、`scrollerOptions`；`portalClass`、`portalStyle` 作用于弹层容器。
- `tag`、`disabled`、`portal`、`to` 为声明的属性（桌面端经 Popover 透传）。
- `header`、`footer` 插槽放在面板的顶部和底部，不随内容滚动，可放置「重置」「确定」等按钮。

:::playground
<!--
<config lang="json5">
{
	mobile: true
}
</config>
-->
```vue
<template>
	<div class="m-dropdown-demo">
		<div class="m-dropdown-demo__bar">
			<MDropdown caret @click="handleSort">
				{{ sort }}
				<template #content>
					<MDropdownMenu>
						<MDropdownItem v-for="item in sorts" :key="item" :label="item" :selected="sort === item" />
					</MDropdownMenu>
				</template>
			</MDropdown>
			<MDropdown v-model="isFilterVisible" trigger="custom" caret>
				<span @click="isFilterVisible = !isFilterVisible">筛选</span>
				<template #content>
					<MDropdownMenu>
						<MDropdownItem
							v-for="item in groups"
							:key="item"
							:label="item"
							:selected="filters.includes(item)"
							:closable="false"
							@click="handleToggle"
						/>
						<MDropdownItem label="不可用" disabled divided />
					</MDropdownMenu>
				</template>
				<template #footer>
					<div class="m-dropdown-demo__footer">
						<MButton class="m-dropdown-demo__button" @click="filters = []">重置</MButton>
						<MButton type="primary" class="m-dropdown-demo__button" @click="isFilterVisible = false">确定</MButton>
					</div>
				</template>
			</MDropdown>
		</div>
		<p class="m-dropdown-demo__result">排序：{{ sort }}；筛选：{{ filters.join('、') || '全部' }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MButton, MDropdown, MDropdownItem, MDropdownMenu } from '@deot/vc';

const sorts = ['默认排序', '最新', '名称'];
const groups = ['分组 A', '分组 B', '分组 C'];
const sort = ref(sorts[0]);
const filters = ref([]);
const isFilterVisible = ref(false);

const handleSort = (value) => {
	sort.value = value;
};

const handleToggle = (value) => {
	filters.value = filters.value.includes(value)
		? filters.value.filter(item => item !== value)
		: [...filters.value, value];
};
</script>

<style scoped>
.m-dropdown-demo {
	display: flex;
	flex-direction: column;
	gap: calc(var(--vc-rem) * 32);
}

.m-dropdown-demo__bar {
	display: flex;
	justify-content: space-around;
	padding: calc(var(--vc-rem) * 24) calc(var(--vc-rem) * 32);
	background: var(--vc-background-color-lightest);
}

.m-dropdown-demo__footer {
	display: flex;
	gap: calc(var(--vc-rem) * 24);
	padding: calc(var(--vc-rem) * 16) calc(var(--vc-rem) * 32);
}

.m-dropdown-demo__button {
	flex: 1;
}

.m-dropdown-demo__result {
	margin: 0;
	padding-inline: calc(var(--vc-rem) * 32);
}
</style>
```
:::

尺寸如下（括号内为 375 宽下的 px）：

| 项 | 值 |
| --- | --- |
| 菜单项 | 字号 32（16），行高 44（22），内边距 32（16），单行时高 108（54），与 `MList` 一致；占满面板宽度，超出省略 |
| 选中项 | 文字为主色，右侧对勾 32（16）（`correct` 图标，同 Select 选项） |
| `caret` | 实心三角 24（12），与文字间距 8（4），收起时 `color-neutral`；展开时与触发区文字一起变为主色 |
| `divided` | 上方一条细线，没有间距；其余项之间不画线 |

按下菜单项时显示 `background-color-light` 底色（同 `MListItem`），不使用悬停样式。

## 主题与局部覆盖

全局参数通过 `--vc-<参数>` 配置，组件级覆盖使用 `--vc-dropdown-<参数>`。局部参数仅提供组件级入口；可在组件根节点或其祖先上设置。

菜单通过 Portal 挂载时，变量需作用于实际菜单弹层或其祖先。

内嵌或复用的 [popover](../popover/README.md#主题与局部覆盖) 使用各自的主题入口。

### 全局

| 参数 | 使用位置 | 值 |
| --- | --- | --- |
| color-dark-lighter | 菜单项文字 | 亮色：`#515151`；暗色：`#D9D9D9` |
| color-dark-extralight | 禁用菜单文字 | 亮色：`#909399`；暗色：`#B9B9B9` |
| color-neutral-light | 菜单分组分隔线 | 亮色：`#EDEFF1`；暗色：`#3B4354` |
| color-primary | 菜单悬停及选中文字；移动端展开时的触发区与 `caret` | `#456CF6` |
| background-color-primary-light | 可用菜单项悬停背景 | 亮色：`#E6F7FF`；暗色：`#273E5E` |
| color-dark-light | 移动端菜单项文字 | 亮色：`#080F20`；暗色：`#E8E8E8` |
| color-neutral | 移动端 `caret` 箭头（收起） | 亮色：`#C4C9D2`；暗色：`#E8E8E8` |
| background-color-light | 移动端菜单项按下背景 | 亮色：`#F7F8FA`；暗色：`#2D3444` |

### 局部

尺寸写成局部变量 `--vc-dropdown-<键>`，`MDropdown` 在 `.vcm-dropdown`、`.vcm-dropdown-menu`、`.vcm-dropdown-item` 上覆盖（见 [移动端](#移动端)），与样式的加载顺序无关。

| 参数 | 使用位置 | 默认值 |
| --- | --- | --- |
| icon-size | `caret` 箭头大小 | `12px` |
| icon-gap | `caret` 箭头与触发内容的间距 | `4px` |
| icon-color | `caret` 箭头颜色（收起） | `currentcolor` |
| icon-transform | `caret` 箭头变换（收起） | `scale(0.8)` |
| icon-active-color | `caret` 箭头颜色（展开） | `currentcolor` |
| icon-active-transform | `caret` 箭头变换（展开） | `scale(0.8) rotate(180deg)` |
| menu-min-width | 菜单最小宽度 | `100px` |
| item-padding | 菜单项内边距 | `7px 16px` |
| item-font-size | 菜单项字号 | `12px` |
| item-line-height | 菜单项行高 | `normal` |
| item-color | 菜单项文字 | 全局 `color-dark-lighter` |
| divided-gap | `divided` 分割线上方的间距 | `5px` |

## API

### Dropdown 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| modelValue | 是否显示菜单，支持 `v-model`，适用于所有触发模式 | `boolean` | - | `false` |
| trigger | 触发方式；`custom` 由调用方控制，`strictHover` 移出触发区即延时关闭，`focus` 需触发根节点可聚焦 | `string` | `hover` / `strictHover` / `click` / `focus` / `custom` | `hover` |
| placement | 首选弹出位置 | `string` | `top` / `top-left` / `top-right` / `bottom` / `bottom-left` / `bottom-right` / `left` / `left-top` / `left-bottom` / `right` / `right-top` / `right-bottom` | `bottom` |
| arrow | 是否显示浮层的箭头 | `boolean` | - | `false` |
| caret | 是否在触发内容之后显示箭头；展开时翻转 | `boolean` | - | `false` |
| portalClass | 浮层附加类名 | `string \| object` | - | - |
| scrollable | 内容区是否由内置的 Scroller 滚动；`false` 时由内容自行收缩并滚动，同 [Popover](../popover/README.md) | `boolean` | - | `true` |
| scrollerOptions | 内置 Scroller 的属性（如 `maxHeight`、`always`），同 Popover | `object` | - | - |

其他属性透传给 Popover，例如 `portal`、`portalStyle`、`to`、`outsideClickable` 和 `tag`；`class`、`style` 应用于触发根节点。`focus` 模式可搭配 `tabindex="0"`。当前不支持 `contextMenu` 触发。

### Dropdown 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| update:modelValue | 内部显隐操作时同步状态 | `(isVisible: boolean)` | 用于 `v-model` |
| visible-change | 内部显隐操作时触发；仅外部赋值不触发 | `(isVisible: boolean)` | 当前显隐状态 |
| click | 点击未禁用菜单项时触发 | `(value: string \| number \| undefined, event: MouseEvent)` | 菜单项 `value`，缺省时为 `label`；第二参数为原生事件 |
| ready | 浮层就绪时触发 | - | - |
| close | 浮层关闭生命周期回调 | - | - |

### Dropdown 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 触发内容，由 Popover 根节点包裹 | - |
| header | 浮层顶部的固定区，不随内容滚动 | - |
| footer | 浮层底部的固定区，不随内容滚动 | - |
| content | 浮层内容，通常放置 DropdownMenu | - |

### Dropdown 方法

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| close | 关闭菜单并触发 `update:modelValue(false)` 与 `visible-change(false)` | - | `void` |

### DropdownMenu 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 菜单项；渲染于 `ul` 内 | - |

### DropdownItem 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| value | 菜单项回调值；未设置时使用 `label` | `string \| number` | - | `undefined` |
| label | 默认显示文本，也是 `value` 缺省时的回调值 | `string \| number` | - | `undefined` |
| disabled | 禁止点击，不触发菜单项事件或关闭 | `boolean` | - | `false` |
| selected | 是否显示选中样式，不自动维护选择状态 | `boolean` | - | `false` |
| closable | 点击后是否关闭所属 Dropdown | `boolean` | - | `true` |
| divided | 是否显示上分割线 | `boolean` | - | `false` |

### DropdownItem 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| click | 未禁用时点击触发，同时通知所属 Dropdown | `(value: string \| number \| undefined, event: MouseEvent)` | 与 Dropdown 的 `click` 参数相同 |

### DropdownItem 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 优先于 `label` 的显示内容；不用于推断回调值 | - |

DropdownItem 应置于 Dropdown 的内容中使用。移动端入口导出 `MDropdown`、`MDropdownMenu`、`MDropdownItem`，见 [移动端](#移动端)。

### 主题

菜单项支持 `--vc-dropdown-color-dark-lighter`（文字）、`--vc-dropdown-color-primary`（悬停与选中）、`--vc-dropdown-background-color-primary-light`（悬停背景）、`--vc-dropdown-color-dark-extralight`（禁用文字）和 `--vc-dropdown-color-neutral-light`（分割线），缺省时使用同名全局 token。

浮层背景、阴影和箭头由 Popover 提供。默认浮层挂载在弹层挂载点 `VcInstance.options.Portal.element`（未设置时为 `body`），主题变量应设置在浮层能继承的位置，或通过 `portalStyle` / `portalClass` 设置。
