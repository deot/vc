## 下拉菜单（Dropdown）
将菜单折叠到下拉菜单里

### 何时使用
当页面上的操作命令过多时，用此组件可以收纳操作元素。点击或移入触点，会出现一个下拉菜单。可在列表中进行选择，并执行相应的命令。

### 基础用法
移动到菜单上，展开。

:::RUNTIME
```vue
<template>
	<div class="v-dropdown-basic">
		<Dropdown
			v-model="visible"
			placement="bottom-left"
		>
			<div class="link">下拉菜单</div>
			<template #list>
				<DropdownMenu>
					<DropdownItem name="1">
						驴打滚
					</DropdownItem>
					<DropdownItem name="2">
						炸酱面
					</DropdownItem>
					<DropdownItem name="3">
						豆汁儿
					</DropdownItem>
					<DropdownItem name="4">
						臭豆腐
					</DropdownItem>
				</DropdownMenu>
			</template>
		</Dropdown>
	</div>
</template>
<script>
import { Dropdown } from '@deot/vc';

export default {
	components: {
		"Dropdown": Dropdown
	},
};
</script>
<style>
.v-dropdown-basic .link {
	cursor: pointer;
}
.v-dropdown-basic .link:hover {
	color: #409EFF;
}
</style>
```
:::

### 触发方式
配置`trigger`参数为`hover`触发或者`click`触发。

:::RUNTIME
```vue
<template>
	<div class="v-dropdown-basic">
		<h2>默认hover触发</h2>
		<Dropdown
			v-model="visible"
			placement="bottom-left"
		>
			<div class="link">下拉菜单</div>
			<template #list>
				<DropdownMenu>
					<DropdownItem name="1">
						驴打滚
					</DropdownItem>
					<DropdownItem name="2">
						炸酱面
					</DropdownItem>
					<DropdownItem name="3">
						豆汁儿
					</DropdownItem>
					<DropdownItem name="4">
						臭豆腐
					</DropdownItem>
				</DropdownMenu>
			</template>
		</Dropdown>
		<h2>click触发</h2>
		<Dropdown
			v-model="visible2"
			placement="bottom-left"
			trigger="click"
		>
			<div class="link">下拉菜单</div>
			<template #list>
				<DropdownMenu>
					<DropdownItem name="1">
						驴打滚
					</DropdownItem>
					<DropdownItem name="2">
						炸酱面
					</DropdownItem>
					<DropdownItem name="3">
						豆汁儿
					</DropdownItem>
					<DropdownItem name="4">
						臭豆腐
					</DropdownItem>
				</DropdownMenu>
			</template>
		</Dropdown>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Dropdown, DropdownMenu, DropdownItem } from '@deot/vc';

const visible = ref(false);
const visible2 = ref(false);
</script>
<style>
.v-dropdown-basic .link {
	cursor: pointer;
}
.v-dropdown-basic .link:hover {
	color: #409EFF;
}
</style>
```
:::

### 下拉菜单出现位置
配置placement。

:::RUNTIME
```vue
<template>
	<div class="v-dropdown-basic">
		<div style="margin-bottom: 10px">
			<Button @click="handlePlacement('top')">top</Button>
			<Button @click="handlePlacement('left')">left</Button>
			<Button @click="handlePlacement('right')">right</Button>
			<Button @click="handlePlacement('bottom')">bottom</Button>
			<Button @click="handlePlacement('bottom-left')">bottom-left</Button>
			<Button @click="handlePlacement('bottom-right')">bottom-right</Button>
			<Button @click="handlePlacement('top-left')">top-left</Button>
			<Button @click="handlePlacement('top-right')">top-right</Button>
			<Button @click="handlePlacement('right-top')">right-top</Button>
			<Button @click="handlePlacement('right-bottom')">right-bottom</Button>
			<Button @click="handlePlacement('left-top')">left-top</Button>
			<Button @click="handlePlacement('left-bottom')">left-bottom</Button>
		</div>
		<Dropdown
			v-model="visible"
			:placement="palcement"
		>
			<div class="link">下拉菜单</div>
			<template #list>
				<DropdownMenu>
					<DropdownItem name="1">
						驴打滚
					</DropdownItem>
					<DropdownItem name="2">
						炸酱面
					</DropdownItem>
					<DropdownItem name="3">
						豆汁儿
					</DropdownItem>
					<DropdownItem name="4">
						臭豆腐
					</DropdownItem>
				</DropdownMenu>
			</template>
		</Dropdown>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Button, Dropdown, DropdownMenu, DropdownItem } from '@deot/vc';

const palcement = ref('bottom');
const handlePlacement = (val) => {
	palcement.value = val;
};
</script>
<style>
.v-dropdown-basic .link {
	cursor: pointer;
}
.v-dropdown-basic .link:hover {
	color: #409EFF;
}
.v-dropdown-basic .vc-btn {
	margin-bottom: 10px;
}
</style>
```
:::

### 带三角指向的菜单
通过设置`arrow`添加三角指向。

:::RUNTIME
```vue
<template>
	<div class="v-dropdown-basic">
		<Dropdown
			v-model="visible"
			placement="bottom-left"
			arrow
		>
			<div class="link">下拉菜单</div>
			<template #list>
				<DropdownMenu>
					<DropdownItem name="1" disabled>
						驴打滚（不可点击）
					</DropdownItem>
					<DropdownItem name="2" :closable="false">
						炸酱面（点击菜单不消失）
					</DropdownItem>
					<DropdownItem name="3" divided>
						豆汁儿（添加分割线）
					</DropdownItem>
					<DropdownItem name="4">
						臭豆腐
					</DropdownItem>
				</DropdownMenu>
			</template>
		</Dropdown>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Dropdown, DropdownMenu, DropdownItem } from '@deot/vc';

const palcement = ref('bottom');
const handlePlacement = (val) => {
	palcement.value = val;
};
</script>
<style>
.v-dropdown-basic .link {
	cursor: pointer;
}
.v-dropdown-basic .link:hover {
	color: #409EFF;
}
</style>
```
:::

### API

### Dropdown属性

| 属性                | 说明                                  | 类型        | 可选值                                                                                                                                   | 默认值      |
| ----------------- | ----------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| modelValue        | 手动控制下拉框的显示，在 trigger = 'custom' 时使用 | `boolean` | -                                                                                                                                     | `false`  |
| trigger           | 触发方式                                | `string`  | 可选值为 `hover`（悬停）`click`（点击）`contextMenu`（右键）`custom`（自定义），使用 custom 时，需配合 `visible` 一起使用                                              | `hover`  |
| arrow             | 是否带三角指向                             | `boolean` | -                                                                                                                                     | `false`  |
| placement         | 菜单弹出位置                              | `string`  | `top`、`left`、`right`、`bottom`、`bottom-left`、`bottom-right`、`top-left`、`top-right`、`right-top`、`right-bottom`、`left-top`、`left-bottom` | `bottom` |
| portal-class | 开启 portal 时，给浮层添加额外的 class 名称       | `string`  | -                                                                                                                                     | -        |

### DropdownItem属性
属性 | 说明 | 类型 | 可选值 | 默认值
---|---|---|---|---
name | 用来标识这一项 | `string` | - | -
disabled | 是否禁止选择 | `boolean` | - | `false`
selected | 是否选中 | `boolean` | - | `false`
closable | 是否点击后隐藏 | `boolean` | - | `true`
divided | 是否需要分割线 | `boolean` | - | `false`

### 事件

| 事件名            | 说明           | 回调参数                     | 参数说明             |
| -------------- | ------------ | ------------------------ | ---------------- |
| click          | 点击菜单项时触发     | `(name: string) => void` | `name`：item的name |
| visible-change | visible改变时回调 | -                        | -                |
| close          | 关闭时回调        | -                        | -                |
| ready          | 弹层出来时回调      | -                        | -                |


### Slot

| 属性   | 说明                             |
| ---- | ------------------------------ |
| \-   | 触发下拉列表显示的元素。 注意： 必须是一个元素或者或者组件 |
| list | 列表内容，一般由 `DropdownMenu` 承担     |


