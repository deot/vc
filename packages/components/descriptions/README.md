## 描述列表（Descriptions）

成组展示只读的标签与值，一般用于详情页。按 24 格分列，支持配置和子组件两种写法、分组、合并、四种主题和响应式。

### 何时使用

- 详情页、抽屉或弹窗中展示一条记录的字段。
- 字段较多、需要分组或按列对齐时。

### 基础用法

`data` 是数据源，每项通过 `prop` 路径取值；也可以用 `value` 直接传值。值为空（`null` / `undefined` / `''` / `[]`）时显示 `placeholder`，`0` 不算空。默认 24 格、每项 `span` 为 8（每行 3 项），每行最后一项补满本行。

:::playground
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<Descriptions title="基础信息" :data="data" :options="options" />
</template>

<script setup>
import { Descriptions } from '@deot/vc';

const data = { code: 'NO-000128', name: '条目 128', type: '类型 A', status: '进行中', value: 0, desc: '说明文字' };
const options = [
	{ label: '编号', prop: 'code' },
	{ label: '名称', prop: 'name' },
	{ label: '类型', prop: 'type' },
	{ label: '状态', prop: 'status', tooltip: '状态的说明' },
	{ label: '数值', prop: 'value', suffix: ' 项' },
	{ label: '空值', prop: 'empty' },
	{ label: '说明', prop: 'desc', span: 24 }
];
</script>
```
:::

### 子组件写法

`options` 中每一项的字段与 DescriptionsItem 的属性同名。DescriptionsItem 的默认插槽替换值，`label` 插槽替换标签，参数见[渲染上下文](#渲染上下文)。两种写法可以同时使用，`options` 中的项排在前面。

:::playground
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<Descriptions :data="data">
		<DescriptionsItem label="编号" prop="code" />
		<DescriptionsItem label="名称" prop="name" />
		<DescriptionsItem label="类型" prop="type">
			<template #default="{ value }">
				<Tag>{{ value }}</Tag>
			</template>
		</DescriptionsItem>
	</Descriptions>
</template>

<script setup>
import { Descriptions, DescriptionsItem, Tag } from '@deot/vc';

const data = { code: 'NO-000128', name: '条目 128', type: '类型 A' };
</script>
```
:::

### 主题与尺寸

`theme`：

- `fill`（默认）：灰底面板。
- `inverted`：fill 的反色，白底面板，适合放在灰色区域上。
- `plain`：无底色、无内边距。
- `border`：表格边框，标签格为灰底，此时不显示冒号。

`size` 可选 `mini` / `small` / `medium` / `large`，影响字号、行高、行间距和 border 主题的单元格内边距。

:::playground
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<div>
		<div class="toolbar">
			<RadioGroup v-model="theme">
				<Radio v-for="item in ['fill', 'inverted', 'plain', 'border']" :key="item" :value="item">{{ item }}</Radio>
			</RadioGroup>
		</div>
		<Descriptions :theme="theme" :data="data" :options="options" />
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Descriptions, Radio, RadioGroup } from '@deot/vc';

const theme = ref('fill');
const data = { code: 'NO-000128', name: '条目 128', type: '类型 A', status: '进行中' };
const options = [
	{ label: '编号', prop: 'code' },
	{ label: '名称', prop: 'name' },
	{ label: '类型', prop: 'type' },
	{ label: '状态', prop: 'status' }
];
</script>

<style scoped>
.toolbar {
	margin-bottom: 16px;
}
</style>
```
:::

### 标签位置

`labelPosition` 为 `left` / `right` 时标签在左侧，并按该方向对齐；为 `top` 时标签在上方。标签宽度默认由内容决定；`labelWidth` 为数字时固定宽度，为 `'auto'` 时同一列的标签取其中最宽的，各行对齐。`inline` 时标签和值在同一单元格内按文字流排列。`colon` 控制标签后的冒号，只在 `left` / `right` 且主题不是 `border` 时显示，传字符串可自定义。

### 分列与合并

- `columns` 与 [Grid](../grid/README.md) 相同：数字为等宽列数（默认 24），也支持轨道模板，例如 `[200, '1fr']`。
- Descriptions 上的 `span` 是所有项的默认值，未设置时为轨道数的 1/3；单项上的 `span` 覆盖它。`span: 'auto'` 占满本行剩余。
- `getSpan` 写法同 Table：返回 `[rowspan, colspan]` 或 `{ rowspan, colspan }`。`colspan` 覆盖 `span`，`rowspan` 为跨越的行数，任一为 `0` 时隐藏该项。后面的项会跳过被占用的格子。

:::playground
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<Descriptions theme="border" :data="data" :options="options" :get-span="getSpan" />
</template>

<script setup>
import { Descriptions } from '@deot/vc';

const data = { code: 'NO-000128', name: '条目 128', type: '类型 A', status: '进行中', date: '2026-10-28' };
const options = [
	{ label: '编号', prop: 'code' },
	{ label: '名称', prop: 'name' },
	{ label: '类型', prop: 'type' },
	{ label: '状态', prop: 'status' },
	{ label: '日期', prop: 'date' }
];
const getSpan = ({ index }) => (index === 0 ? [2, 8] : void 0);
</script>
```
:::

### 响应式

Descriptions 的 `columns`、`span` 和单项的 `span` 都可以写成 `{ xs, sm, md, lg, xl, xxl }`，按 **Descriptions 自身的宽度** 取值：取当前断点及更小断点中第一个已设置的值，都没有时用默认值。放在弹窗或侧栏中时同样准确。断点同 [Grid](../grid/README.md)：

| 断点 | xs | sm | md | lg | xl | xxl |
| --- | --- | --- | --- | --- | --- | --- |
| 宽度 | < 576 | ≥ 576 | ≥ 768 | ≥ 992 | ≥ 1200 | ≥ 1600 |

:::playground
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<Descriptions :data="data" :options="options" :span="{ xs: 24, sm: 12, lg: 8 }" />
</template>

<script setup>
import { Descriptions } from '@deot/vc';

const data = { code: 'NO-000128', name: '条目 128', type: '类型 A', status: '进行中', desc: '说明文字说明文字说明文字' };
const options = [
	{ label: '编号', prop: 'code' },
	{ label: '名称', prop: 'name' },
	{ label: '类型', prop: 'type' },
	{ label: '状态', prop: 'status' },
	{ label: '说明', prop: 'desc', span: 24 }
];
</script>
```
:::

### 分组

`options` 中写 `{ label, children }`，或使用 DescriptionsGroup。各组放在同一个面板中，组之间有分隔线；连续的、不在分组内的项会合成一个没有标题的分组。

:::playground
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<Descriptions :data="data">
		<DescriptionsGroup label="基础信息">
			<DescriptionsItem label="编号" prop="code" />
			<DescriptionsItem label="名称" prop="name" />
		</DescriptionsGroup>
		<DescriptionsGroup label="其他信息">
			<DescriptionsItem label="状态" prop="status" />
		</DescriptionsGroup>
	</Descriptions>
</template>

<script setup>
import { Descriptions, DescriptionsGroup, DescriptionsItem } from '@deot/vc';

const data = { code: 'NO-000128', name: '条目 128', status: '进行中' };
</script>
```
:::

### 渲染上下文

插槽、函数形式的 `value`、`getSpan`、函数形式的 `tooltip` 都接收同一个上下文 `{ value, row, index, data }`：

- `value`：已按 `prop` 取出的值；`value` 为非函数时就是它本身。
- `row`：当前项，对应 `options` 中的一项（子组件写法时为该项的属性），已补上默认值：`type` 默认为 `'text'`，`span` 为当前断点下解析后的值。
- `index`：该项在全部项中的下标（含 `hidden` 的项，与 `options` 的顺序一致）。
- `data`：Descriptions 的 `data`。

### 值的类型

单项的 `type` 选择内置类型，`options` 原样传给对应的控件：

| type | 展示 | options |
| --- | --- | --- |
| text | 文本，数组用 `,` 连接；未知的 `type` 也按 text 处理 | 传 `line` 时用 [Text](../text/README.md) 按行数截断，其余字段透传给 Text；未传 `line` 时作为文本节点的属性 |
| image | 一行小图，默认边长等于行高，不会把这一行撑高；点击后用 [FilePreview](../file-preview/README.md) 预览全部图片 | `size`：边长（px）或 `[宽, 高]`；`fit`：默认 `'cover'`；`previewable`：默认 `true`；其余字段透传给每个 [Image](../image/README.md) |
| file | [FilePreview](../file-preview/README.md)，`size` 跟随 Descriptions | 透传给 FilePreview，如 `type: 'group'` |
| link | 主色、单行截断的链接，新窗口打开；`javascript:`、`data:` 等脚本协议不生成链接 | 透传给 Text |
| copy | 单行截断的文本，后面是复制图标 | 透传给 Text |
| select | 用 `options.data` 把值映射为 label，多个值用 `,` 连接，没有对应项时显示原值 | `data`：`[{ label, value }]`（同 Select 的 `data`）或 `{ [value]: label }` |

image 的数据可以是逗号分隔的字符串、地址数组，或 `{ source | src | url }` 数组；未写 `type` 的项都按图片预览，文件名等仍经过 FilePreview 的全局配置。统一调整图片尺寸时，在 Descriptions 或其祖先上设置 `--vc-descriptions-image-size`；单项的 `options.size` 优先。需要卡片或大方格展示时，使用 `file` 类型。

### 自定义类型

全局配置 `VcInstance.options.Descriptions.renderValue` 注册其他类型（如 table、price），也可以覆盖内置类型。参数为[渲染上下文](#渲染上下文)加上当前 Descriptions 的 `instance`，类型从 `row.type` 读取；返回 VNode 时使用它，返回 `false` 或空值时使用内置类型。详见 [全局配置](../vc/README.md)。

```js
import { h } from 'vue';
import { VcInstance } from '@deot/vc';

VcInstance.configure({
	Descriptions: {
		renderValue: ({ value, row }) => {
			if (row.type === 'price') return h('span', `¥ ${Number(value).toFixed(2)}`);
		}
	}
});
```

值的渲染顺序：DescriptionsItem 的默认插槽 → Descriptions 的 `value` 插槽 → 函数形式的 `value` → 全局 `renderValue` → 内置类型。值为空（`null`、`undefined`、`''`、`[]`，`0` 不算空）时，插槽和函数照常渲染，其余显示 `placeholder`，不调用 `renderValue`。`prefix` / `suffix` 放在值的前后，显示 `placeholder` 时不显示它们。

## 主题与局部覆盖

全局参数通过 `--vc-<参数>` 配置，组件级覆盖使用 `--vc-descriptions-<参数>`。局部参数仅提供组件级入口，可在组件根节点或其祖先上设置。

### 全局

| 参数 | 使用位置 | 值 |
| --- | --- | --- |
| color-dark-light | 标题、值 | 亮色：`#080F20`；暗色：`#E8E8E8` |
| color-dark-lighter | 分组标题 | 亮色：`#515151`；暗色：`#D9D9D9` |
| color-dark-lightest | 标签 | 亮色：`#64758B`；暗色：`#C9C9C9` |
| color-primary | link 类型的文字、copy 类型的图标 | `#456CF6` |
| color-neutral-light | 分组分隔线、border 主题的边框 | 亮色：`#EDEFF1`；暗色：`#3B4354` |
| background-color-light | fill 主题的面板、border 主题的标签格 | 亮色：`#F7F8FA`；暗色：`#2D3444` |
| background-color-lightest | inverted 主题的面板 | 亮色：`#FFFFFF`；暗色：`#252B3A` |

### 局部

由 `size` 设置，可在 `.vc-descriptions` 或其祖先上覆盖：

| 参数 | 说明 | mini / small / medium / large |
| --- | --- | --- |
| font-size | 字号 | `12px` / `13px` / `13px` / `14px` |
| line-height | 行高 | `18px` / `20px` / `20px` / `22px` |
| row-gap | 行间距 | `4px` / `8px` / `12px` / `16px` |
| cell-padding-y | border 主题单元格的上下内边距 | `3px` / `5px` / `7px` / `9px` |
| cell-padding-x | border 主题单元格的左右内边距 | `12px` / `16px` / `16px` / `20px` |

另有 `image-size`：image 类型的小图边长，默认等于 `line-height`，不随 `size` 设置。

## API

### Descriptions 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| data | 数据源，每项通过 `prop` 路径取值 | `object` | - | `{}` |
| options | 配置写法：项，或分组 `{ label, children }`；字段见 DescriptionsItem 属性 | `array` | - | `[]` |
| title | 标题。字符串按文本渲染，也可传渲染函数或 `{ type, value }`，见 [Customer](../customer/README.md) | `string \| number \| Function \| { type: string; value: any }` | - | - |
| theme | 主题 | `string` | `fill` / `inverted` / `plain` / `border` | `fill` |
| size | 尺寸 | `string` | `mini` / `small` / `medium` / `large` | `medium` |
| columns | 列轨道，同 Grid。可写成响应式对象 | `number \| string \| (number \| string)[] \| Responsive` | - | `24` |
| span | 所有项的默认 span。可写成响应式对象 | `number \| 'auto' \| Responsive` | - | 轨道数的 1/3 |
| labelPosition | 标签位置 | `string` | `left` / `right` / `top` | `left` |
| labelWidth | 标签宽度（px）；`'auto'` 时同一列（列起点相同）的标签取其中最宽的。`top` 和 `inline` 时不生效 | `number \| 'auto'` | - | - |
| inline | 标签和值在同一单元格内按文字流排列 | `boolean` | - | `false` |
| colon | 标签后的冒号；`left` / `right` 且主题不是 `border` 时显示 | `boolean \| string` | - | `true`（`:`） |
| placeholder | 值为空时显示的内容，取值同 `title` | `string \| number \| Function \| { type: string; value: any }` | - | `'-'` |
| getSpan | 合并，写法同 Table，参数为[渲染上下文](#渲染上下文) | `(context) => [rowspan, colspan] \| { rowspan?, colspan? } \| undefined` | - | - |
| labelClass / labelStyle | 所有标签格的 class / style | `string \| object \| array` | - | - |
| contentClass / contentStyle | 所有值格的 class / style | `string \| object \| array` | - | - |

`Responsive` 为 `{ xs?, sm?, md?, lg?, xl?, xxl? }`，各值的类型与该属性相同，见[响应式](#响应式)。

### Descriptions 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 放置 DescriptionsItem、DescriptionsGroup | - |
| title | 标题 | - |
| extra | 标题右侧的内容 | - |
| label | 所有项的标签 | `{ row, index, data }` |
| value | 所有项的值 | `{ value, row, index, data }` |

### DescriptionsItem 属性

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| label | 标签，取值同 `title` | `string \| number \| Function \| { type: string; value: any }` | - |
| prop | 读取 `data` 的路径 | `string` | - |
| value | 显式传值，优先于 `prop`；传函数时作为渲染函数，参数为[渲染上下文](#渲染上下文) | `any` | - |
| type | 值的类型，见[值的类型](#值的类型) | `string` | `'text'` |
| span | 覆盖 Descriptions 的 `span` | `number \| 'auto' \| Responsive` | - |
| tooltip | 标签的提示图标，悬停时显示。图标在文字后面；`labelPosition` 为 `right` 时在文字前面，保持各行文字右对齐。字符串按文本渲染，需要 HTML 时传 `{ type: 'html', value }`；函数的参数为[渲染上下文](#渲染上下文) | `string \| { type: string; value: any } \| ((context) => string)` | - |
| options | 透传给内置控件的配置，自定义类型通过 `row.options` 读取 | `object` | - |
| prefix / suffix | 值的前后缀，取值同 `title` | `string \| number \| Function \| { type: string; value: any }` | - |
| hidden | 不渲染，也不占位 | `boolean` | `false` |
| labelClass / labelStyle | 标签格的 class / style | `string \| object \| array` | - |
| contentClass / contentStyle | 值格的 class / style | `string \| object \| array` | - |

单项的 `class` / `style` 作用在该项的根节点上；配置写法中也可以写 `class` / `style` 字段。

### DescriptionsItem 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 值 | `{ value, row, index, data }` |
| label | 标签 | `{ row, index, data }` |

### DescriptionsGroup 属性

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| label | 分组标题，取值同 `title` | `string \| number \| Function \| { type: string; value: any }` | - |

### DescriptionsGroup 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 放置 DescriptionsItem | - |
| label | 分组标题 | - |

### 使用注意

- DescriptionsItem、DescriptionsGroup 只用于声明，由 Descriptions 统一渲染：包括 `v-for`、`<template>` 中的项，被其他组件包裹的项不会渲染。
- 只有用到响应式对象时才会监听 Descriptions 的尺寸，断点变化时才重新分行。
- `labelWidth: 'auto'` 监听每个标签内容的尺寸：标签文字、插槽内容、字体或字号变化后，同一列的宽度随之更新，在绘制前完成。
- 有 `title` 时只渲染标题栏和面板，外层卡片的背景和内边距由所在容器（如 Card）提供。
- copy 类型的复制提示：Descriptions 使用 Message，MDescriptions 使用 Toast。
- `MDescriptions` 与 Descriptions 的属性、插槽相同，只有复制提示不同；`MDescriptionsItem`、`MDescriptionsGroup` 是对应组件的别名。均可从 `@deot/vc` 导入。
