## 下拉菜单（Dropdown）

将操作收纳到浮层菜单中，通过 DropdownMenu 和 DropdownItem 展示并选择操作。

### 何时使用

当页面操作较多，或需要为某个元素提供附加操作时使用。

### 基础用法

默认悬停展开；点击菜单项会触发 `click` 并关闭菜单。回调优先使用 `value`，缺省时使用 `label`。

:::playground
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<div class="dropdown-basic-demo">
		<Dropdown
			placement="bottom-left"
			@visible-change="visible => visible && handleVisibleChange(true)"
			@close="handleVisibleChange(false)"
			@click="handleClick"
		>
			<Button>悬停查看操作</Button>
			<template #content>
				<DropdownMenu>
					<DropdownItem value="edit" label="编辑" />
					<DropdownItem value="copy" label="复制" />
					<DropdownItem label="查看详情" />
				</DropdownMenu>
			</template>
		</Dropdown>
		<p>最近操作：{{ action }}</p>
	</div>
</template>

<script setup>
import { ref, inject } from 'vue';
import { Button, Dropdown, DropdownMenu, DropdownItem } from '@deot/vc';

const playground = inject('docs:playground');
const handleVisibleChange = playground.run(320);

const action = ref('尚未选择');
const handleClick = (value) => {
	action.value = value;
};
</script>

<style scoped>
.dropdown-basic-demo {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 16px;
}
</style>
```
:::

### 点击触发与菜单项状态

`selected` 只控制选中样式，选中值由调用方维护。`disabled` 阻止菜单项事件和关闭；`:closable="false"` 允许连续选择。`divided` 添加上分割线，`arrow` 显示箭头。

:::playground
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<div class="dropdown-states-demo">
		<Dropdown
			v-model="isVisible"
			trigger="click"
			placement="bottom-left"
			arrow
			@visible-change="visible => visible && handleVisibleChange(true)"
			@close="handleVisibleChange(false)"
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
		<p>排序：{{ sort }}；菜单{{ isVisible ? '已展开' : '已关闭' }}</p>
	</div>
</template>

<script setup>
import { ref, inject } from 'vue';
import { Button, Dropdown, DropdownMenu, DropdownItem } from '@deot/vc';

const playground = inject('docs:playground');
const handleVisibleChange = playground.run(400);

const isVisible = ref(false);
const sort = ref('time');
const handleClick = (value) => {
	if (value !== 'done') sort.value = value;
};
</script>

<style scoped>
.dropdown-states-demo {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 16px;
}
</style>
```
:::

### 手动控制与弹出位置

`trigger="custom"` 配合 `v-model` 控制显隐，也可以通过实例 `close()` 关闭。下例切换位置后重新展开，弹层靠近视口边缘时会自动调整位置。

:::playground
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<div class="dropdown-placement-demo">
		<label>
			弹出位置
			<select v-model="placement" @change="handlePlacement">
				<option v-for="item in placements" :key="item" :value="item">{{ item }}</option>
			</select>
		</label>
		<div class="dropdown-placement-demo__stage">
			<Dropdown
				ref="dropdown"
				v-model="isVisible"
				trigger="custom"
				:placement="placement"
				arrow
				@close="isPreviewVisible = false"
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
		<Button @click="handleClose">调用 close()</Button>
	</div>
</template>

<script setup>
import { ref, inject } from 'vue';
import { Button, Dropdown, DropdownMenu, DropdownItem } from '@deot/vc';

const playground = inject('docs:playground');

const dropdown = ref();
const isVisible = ref(false);
const isPreviewVisible = ref(false);
const placement = ref('bottom');
const placements = [
	'top', 'top-left', 'top-right', 'bottom', 'bottom-left', 'bottom-right',
	'left', 'left-top', 'left-bottom', 'right', 'right-top', 'right-bottom'
];
const handleOpen = playground.run(400, { visible: isPreviewVisible }, () => {
	isPreviewVisible.value = true;
	isVisible.value = true;
});
const handleToggle = () => {
	if (isVisible.value) isVisible.value = false;
	else handleOpen();
};
const handlePlacement = () => {
	isVisible.value = false;
};
const handleClose = () => {
	dropdown.value?.close();
};
</script>

<style scoped>
.dropdown-placement-demo {
	display: grid;
	gap: 16px;
	justify-items: start;
}
.dropdown-placement-demo__stage {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
}
</style>
```
:::

## API

### Dropdown 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| modelValue | 是否显示菜单，支持 `v-model`，适用于所有触发模式 | `boolean` | - | `false` |
| trigger | 触发方式；`custom` 由调用方控制，`strictHover` 移出触发区即延时关闭，`focus` 需触发根节点可聚焦 | `string` | `hover` / `strictHover` / `click` / `focus` / `custom` | `hover` |
| placement | 首选弹出位置 | `string` | `top` / `top-left` / `top-right` / `bottom` / `bottom-left` / `bottom-right` / `left` / `left-top` / `left-bottom` / `right` / `right-top` / `right-bottom` | `bottom` |
| arrow | 是否显示箭头 | `boolean` | - | `false` |
| portalClass | 浮层附加类名 | `string \| object` | - | - |

其他属性透传给 Popover，例如 `portal`、`portalStyle`、`getPopupContainer`、`outsideClickable` 和 `tag`；`class`、`style` 应用于触发根节点。`focus` 模式可搭配 `tabindex="0"`。当前不支持 `contextMenu` 触发。

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

DropdownItem 应置于 Dropdown 的内容中使用。`MDropdown`、`MDropdownMenu`、`MDropdownItem` 是同一实现的移动端别名，触屏场景建议使用 `trigger="click"`。

### 主题

菜单项支持 `--vc-dropdown-color-dark-lighter`（文字）、`--vc-dropdown-color-primary`（悬停与选中）、`--vc-dropdown-color-primary-lighter`（悬停背景）、`--vc-dropdown-color-dark-extralight`（禁用文字）和 `--vc-dropdown-color-light-deeper`（分割线），缺省时使用同名全局 token。

浮层背景、阴影和箭头由 Popover 提供。默认浮层挂载在 `body`，主题变量应设置在浮层能继承的位置，或通过 `portalStyle` / `portalClass` 设置。
