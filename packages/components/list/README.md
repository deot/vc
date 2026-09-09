## 移动端列表（List）

用于移动端信息展示和设置入口，由 `MList` 和 `MListItem` 组成。`List`、`ListItem` 是相同实现的别名。

### 何时使用

适合展示左侧标签、右侧内容和导航箭头，也可以将列表项独立嵌入其他布局。

### 基础用法

通过 `labelWidth` 统一标签宽度，列表项可以单独覆盖。箭头默认显示，点击事件会在导航处理之前触发。

:::playground
<!--
<config lang="json5">
{ viewport: 375, previewInset: 16 }
</config>
-->
```vue
<template>
	<MList :label-width="80">
		<MListItem label="姓名" extra="小林" :arrow="false" />
		<MListItem label="消息通知" :extra="enabled ? '已开启' : '已关闭'" @click="enabled = !enabled" />
		<MListItem label="个人介绍" :label-width="100" extra="点击列表项可切换通知状态" :arrow="false" />
	</MList>
</template>

<script setup>
import { ref } from 'vue';
import { MList, MListItem } from '@deot/vc';

const enabled = ref(true);
</script>
```
:::

### 自定义内容与独立列表项

`label`、`extra` 插槽分别替换同名属性；`multiple` 将标签与内容上下排列。没有外层 `MList` 时自动使用独立模式，也可通过 `alone` 显式启用。

:::playground
<!--
<config lang="json5">
{ viewport: 375, previewInset: 16 }
</config>
-->
```vue
<template>
	<div>
		<MList :border="false">
			<MListItem multiple :arrow="false">
				<template #label><strong>配送地址</strong></template>
				<template #extra>上海市徐汇区示例路 18 号</template>
			</MListItem>
		</MList>
		<MListItem label="独立入口" :extra="`已点击 ${count} 次`" :indent="0" :to="handleOpen" />
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MList, MListItem } from '@deot/vc';

const count = ref(0);
const handleOpen = () => { count.value++; };
</script>
```
:::

## API

### MList 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| tag | 容器标签 | `string` | - | `'div'` |
| labelWidth | 子项标签宽度；正数或数字字符串按 px 处理，其他值为自动宽度 | `string \| number` | - | `''` |
| border | 是否显示容器上下边框，不控制子项分隔线 | `boolean` | - | `true` |

### MList 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 列表内容，通常放置 `MListItem` | - |

### MListItem 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| tag | 当前保留属性，实际根节点固定为 `div` | `string` | - | `'div'` |
| label | 左侧标签 | `string` | - | - |
| labelWidth | 覆盖容器标签宽度；`0` 显式设为自动宽度，空字符串继承容器值；不支持 `100px` 等 CSS 长度字符串 | `string \| number` | - | `''` |
| extra | 右侧内容 | `string` | - | - |
| arrow | 字符串指定 Icon 类型，`true` 显示右箭头，`false` 或空字符串隐藏 | `string \| boolean` | - | `'right'` |
| multiple | 标签与内容上下排列 | `boolean` | - | `false` |
| indent | 根节点左内边距，单位 px | `number` | - | `12` |
| to | 点击后的目标或回调，详见导航行为 | `string \| object \| Function` | - | - |
| href | 在当前页面跳转的地址 | `string` | - | - |
| alone | 强制独立模式；移除内部上下、右侧内边距和底部分隔线，保留 `indent` | `boolean` | - | `false` |

### MListItem 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| click | 点击列表项，导航处理前触发 | `event` | 原始点击事件 |

### MListItem 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| label | 替换左侧 `label` | - |
| extra | 替换右侧 `extra` | - |

`MListItem` 不渲染默认插槽。

### 导航行为

点击时先触发 `click`，随后调用全局配置 `VcInstance.configure({ MListItem: { to } })` 中的处理函数（如已配置），第一个参数为当前项的 `to`。处理函数返回任何非 `undefined` 值都会终止后续默认导航，包括 `false`。

默认导航优先使用 `href` 设置 `window.location.href`；否则，函数类型的 `to` 无参数执行，包含 `协议://地址` 的字符串通过 `window.open` 打开。普通路由路径和对象不会自动交给 Vue Router，需要通过全局处理函数自行接入。组件没有 `method` 属性。
