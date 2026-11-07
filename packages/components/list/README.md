## 移动端列表（List）

用于移动端信息展示和设置入口，由 `MList` 和 `MListItem` 组成。`List`、`ListItem` 是相同实现的别名。

### 何时使用

适合展示左侧标签、右侧内容和导航箭头，也可以将列表项独立嵌入其他布局。

### 尺寸

长度按 750 稿书写并随 `--vc-rem` 缩放；括号内为 375 宽下的 px。

| 部位 | 值 |
| --- | --- |
| 列表项最小高度 | 108（54）；有 description 时 148（74） |
| 上下内边距 | 24（12），内容较高时撑开 |
| 左缩进（`indent` 默认）/ 右内边距 | 32（16） |
| label / extra / description 字号 | 32（16）/ 28（14）/ 28（14） |
| label 与 extra 的最小间距 | 48（24） |
| icon / 与 label 的间距 | 40（20）/ 24（12） |
| 箭头 / 与 extra 的间距 | 24（12）/ 16（8） |
| header、footer | 字号 28（14），内边距 24 32（12 16） |

单行模式下 extra 右对齐，最多显示两行，超出省略；`multiple` 模式不限制行数。

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
	<MList :label-width="160">
		<MListItem label="名称" extra="示例名称" :arrow="false" />
		<MListItem label="状态切换" :extra="isEnabled ? '已开启' : '已关闭'" @click="isEnabled = !isEnabled" />
		<MListItem label="描述" :label-width="200" extra="点击列表项可切换选项状态" :arrow="false" />
	</MList>
</template>

<script setup>
import { ref } from 'vue';
import { MList, MListItem } from '@deot/vc';

const isEnabled = ref(true);
</script>
```
:::

### 描述、图标与分组标题

`description` 显示在 label 下方；`icon` 为 MIcon 的类型，`icon` 插槽可放头像等任意内容；MList 的 `header`、`footer` 分别显示在列表上方和下方。

:::playground
<!--
<config lang="json5">
{ viewport: 375, previewInset: 16 }
</config>
-->
```vue
<template>
	<MList header="分组标题" footer="分组说明">
		<MListItem icon="search" label="标题" extra="内容" />
		<MListItem icon="success" label="标题" description="描述文字" extra="内容" />
		<MListItem label="标题" description="描述文字" :arrow="false">
			<template #icon>
				<span style="display: block; width: 32px; height: 32px; background: #c4c9d2; border-radius: 50%;" />
			</template>
		</MListItem>
	</MList>
</template>

<script setup>
import { MList, MListItem } from '@deot/vc';
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
				<template #label><strong>多行描述</strong></template>
				<template #extra>这是一段用于展示多行布局的示例描述，内容换行后保持对齐。</template>
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

## 主题与局部覆盖

全局参数通过 `--vc-<参数>` 配置，组件级覆盖使用 `--vc-list-<参数>`。局部参数仅提供组件级入口；可在组件根节点或其祖先上设置。

这些入口用于移动端 MList 和 MListItem。

### 全局

| 参数 | 使用位置 | 值 |
| --- | --- | --- |
| color-dark-light | label 与 icon | 亮色：`#080F20`；暗色：`#E8E8E8` |
| color-dark-extralight | extra、description、header、footer | 亮色：`#909399`；暗色：`#B9B9B9` |
| color-neutral | 箭头 | 亮色：`#C4C9D2`；暗色：`#E8E8E8` |
| color-neutral-light | 列表边框和列表项分隔线 | 亮色：`#EDEFF1`；暗色：`#3B4354` |
| background-color-light | 可点击列表项按下时的背景 | 亮色：`#F7F8FA`；暗色：`#2D3444` |
| background-color-lightest | 列表及列表项背景 | 亮色：`#FFFFFF`；暗色：`#252B3A` |

### 局部

当前组件没有额外的局部 CSS 主题参数。

## API

### MList 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| tag | 容器标签 | `string` | - | `'div'` |
| labelWidth | 子项标签宽度；正数或数字字符串为 750 稿长度，其他值为自动宽度 | `string \| number` | - | `''` |
| border | 是否显示列表项区域的上下边框，不控制子项分隔线 | `boolean` | - | `true` |
| header | 列表上方的分组标题，取值同 MListItem 的 label；header 插槽优先 | `string \| number \| Function \| { type: string; value: any }` | - | - |
| footer | 列表下方的说明，取值同上；footer 插槽优先 | `string \| number \| Function \| { type: string; value: any }` | - | - |

### MList 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 列表内容，通常放置 `MListItem` | - |
| header | 替换 `header` | - |
| footer | 替换 `footer` | - |

### MListItem 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| tag | 当前保留属性，实际根节点固定为 `div` | `string` | - | `'div'` |
| label | 左侧标签。字符串按文本渲染，也可传渲染函数或 `{ type, value }`，见 [Customer](../customer/README.md)；label 插槽优先 | `string \| number \| Function \| { type: string; value: any }` | - | - |
| labelWidth | 覆盖容器标签宽度；`0` 显式设为自动宽度，空字符串继承容器值；不支持 `100px` 等 CSS 长度字符串 | `string \| number` | - | `''` |
| description | label 下方的描述，取值与 label 相同；description 插槽优先 | `string \| number \| Function \| { type: string; value: any }` | - | - |
| icon | 左侧图标，MIcon 的类型；icon 插槽优先 | `string` | - | - |
| extra | 右侧内容，取值与 label 相同；extra 插槽优先 | `string \| number \| Function \| { type: string; value: any }` | - | - |
| arrow | 字符串指定 Icon 类型，`true` 显示右箭头，`false` 或空字符串隐藏 | `string \| boolean` | - | `'right'` |
| multiple | 标签与内容上下排列 | `boolean` | - | `false` |
| indent | 根节点左内边距，750 稿长度 | `number` | - | 样式默认 `32` |
| to | 点击后的目标或回调，详见导航行为 | `string \| object \| Function` | - | - |
| href | 在当前页面跳转的地址 | `string` | - | - |
| alone | 强制独立模式；移除内部上下、右侧内边距、最小高度和底部分隔线，保留 `indent` | `boolean` | - | `false` |

### MListItem 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| click | 点击列表项，导航处理前触发 | `event` | 原始点击事件 |

### MListItem 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| icon | 替换左侧 `icon` | - |
| label | 替换左侧 `label` | - |
| description | 替换 `description` | - |
| extra | 替换右侧 `extra` | - |

`MListItem` 不渲染默认插槽。

### 按下反馈

显示箭头、设置了 `to` 或 `href`、或监听了 `click` 的列表项视为可点击，根节点带 `is-clickable` 类，按下时整行（含左侧缩进）显示 `background-color-light` 背景。

### 导航行为

点击时先触发 `click`，随后调用全局配置 `VcInstance.configure({ MListItem: { to } })` 中的处理函数（如已配置），参数为 `{ value, instance }`，`value` 为当前项的 `to`。处理函数返回任何非 `undefined` 值都会终止后续默认导航，包括 `false`。

默认导航优先使用 `href` 设置 `window.location.href`；否则，函数类型的 `to` 无参数执行，包含 `协议://地址` 的字符串通过 `window.open` 打开。普通路由路径和对象不会自动交给 Vue Router，需要通过全局处理函数自行接入。组件没有 `method` 属性。
