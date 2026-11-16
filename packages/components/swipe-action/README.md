## 滑动操作（SwipeAction）

在列表行、卡片等内容上左右滑动，露出操作按钮。只有移动端：`MSwipeAction`；`SwipeAction` 是相同实现的别名。[MListItem](../list/README.md) 内置相同的能力：配置放在 `swipeActionOptions`，展开状态用 `v-model:swiped`，不需要再包一层。

### 何时使用

- 列表项的次要操作（置顶、标记、删除），平时收起，不占位置。
- 危险操作配合二次确认，或用全滑一步完成。

### 尺寸

长度按 750 稿书写并随 `--vc-rem` 缩放；括号内为 375 宽下的 px。

| 部位 | 值 |
| --- | --- |
| 按钮左右内边距 | 32（16），按钮宽度随内容 |
| 文字字号 / 行高 | 32（16）/ 44（22） |
| 图标 / 与文字的间距 | 40（20）/ 8（4） |

### 基础用法

向左滑露出 `rightActions`，向右滑露出 `leftActions`；数组顺序即按钮从左到右的顺序。拖动超过按钮总宽的 `threshold`（默认 15%）后松手展开，快速甩动时不论距离都按方向展开或收起。

:::playground
<!--
<config lang="json5">
{ viewport: 375, previewInset: 16 }
</config>
-->
```vue
<template>
	<MList>
		<MListItem
			label="向左滑动"
			extra="内容"
			:swipe-action-options="{
				rightActions: [
					{ content: '置顶' },
					{ content: '删除', type: 'error', onClick: () => (message = '删除') }
				]
			}"
		/>
		<MListItem
			label="左右都可以滑"
			:arrow="false"
			:swipe-action-options="{
				leftActions: [{ content: '已读', type: 'primary' }],
				rightActions: [{ content: '删除', type: 'error' }]
			}"
		/>
	</MList>
	<p>{{ message }}</p>
</template>

<script setup>
import { ref } from 'vue';
import { MList, MListItem } from '@deot/vc';

const message = ref('');
</script>
```
:::

### 二次确认与全滑

`onClick` 的返回值决定是否收起，规则与 [MModal](../modal/README.md) 的 `data[]` 相同：

- 返回真值：保持展开；
- 返回 Promise：resolve 后收起，reject 时保持展开；
- 其余情况：立即收起。

最外侧的一项（`rightActions` 的最后一项、`leftActions` 的第一项）设置 `fullSwipe: true` 后，拖动跟手。拖过组件宽度的一半时，这一项铺满露出区域；此时松手，整行先滑到底，再执行这一项的 `onClick`。

:::playground
<!--
<config lang="json5">
{ viewport: 375, previewInset: 16 }
</config>
-->
```vue
<template>
	<MList>
		<MListItem
			v-for="item in rows"
			:key="item"
			:label="item"
			:arrow="false"
			:swipe-action-options="{ rightActions: [{ content: '删除', type: 'error', fullSwipe: true, onClick: () => confirm(item) }] }"
		/>
	</MList>
</template>

<script setup>
import { ref } from 'vue';
import { MList, MListItem, MModal } from '@deot/vc';

const rows = ref(['列表项 1', '列表项 2', '列表项 3']);
const confirm = item => new Promise((resolve, reject) => {
	MModal.alert({
		title: `删除${item}？`,
		onOk: () => {
			rows.value = rows.value.filter(row => row !== item);
			resolve();
		},
		onCancel: () => reject()
	});
});
</script>
```
:::

### 打开状态与独立使用

`v-model` 为露出按钮的一侧：`'right'` 表示露出右侧按钮（即向左滑过），`'left'` 反之，收起时为 `false`；可以由代码打开或收起（MListItem 上为 `v-model:swiped`）。`MSwipeAction` 可以包裹任意内容。

展开时：
- 点内容区只会收起，不会触发内容上的点击（例如 MListItem 的 `click` 和跳转）；
- 按下组件外部（包括别的行）也会收起，因此同一时间只有一行展开。不需要后者时设置 `closeOnClickOutside` 为 `false`。

:::playground
<!--
<config lang="json5">
{ viewport: 375, previewInset: 16 }
</config>
-->
```vue
<template>
	<div>
		<MSwipeAction
			v-model="open"
			:close-on-click-outside="false"
			:right-actions="[{ content: '归档', type: 'primary' }, { content: '删除', type: 'error' }]"
		>
			<div style="padding: 16px; background: var(--vc-background-color-lightest);">当前：{{ open }}</div>
		</MSwipeAction>
		<p>
			<button @click="open = 'right'">打开</button>
			<button @click="open = false">收起</button>
		</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MSwipeAction } from '@deot/vc';

const open = ref(false);
</script>
```
:::

### 手势

- 移动超过 10px 时锁定方向：
  - 纵向交给页面滚动；
  - 横向时，如果起点在还能朝手指方向横向滚动的容器里，交给该容器；
  - 收起状态下，手指方向那一侧没有按钮时不接管，留给外层，例如可滑动切换的 MTabs。
- 接管后的手势不会再触发外层 MTabs 的滑动切换，也不会触发 MPopup 的滑动关闭。
- 从输入框或带 `vc-drag-ignore` 类的元素上按下时不发起。
- 支持鼠标拖动，便于在桌面浏览器中预览。

## 主题与局部覆盖

全局参数通过 `--vc-<参数>` 配置，组件级覆盖使用 `--vc-swipe-action-<参数>`。

### 全局

| 参数 | 使用位置 | 值 |
| --- | --- | --- |
| color-neutral-deep | `type: 'default'` 的按钮背景 | `#86909C` |
| color-primary / color-success / color-warning / color-error | 对应 `type` 的按钮背景 | `#456CF6` / `#1DB88C` / `#E6A23C` / `#F53F3F` |

### 局部

| 参数 | 说明 | 默认值 |
| --- | --- | --- |
| padding | 按钮左右内边距 | `remfix(32)` |
| font-size / line-height | 按钮文字 | `remfix(32)` / `remfix(44)` |
| color | 按钮文字与图标颜色 | `#fff` |
| icon-size / icon-gap | 图标大小 / 与文字的间距 | `remfix(40)` / `remfix(8)` |

## API

### MSwipeAction 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| modelValue | 露出按钮的一侧，支持 `v-model`；`'right'` 为露出右侧按钮 | `'left' \| 'right' \| false` | - | `false` |
| leftActions | 向右滑时从左侧露出的按钮，见下方 SwipeActionItem | `SwipeActionItem[]` | - | `[]` |
| rightActions | 向左滑时从右侧露出的按钮 | `SwipeActionItem[]` | - | `[]` |
| disabled | 不响应滑动；由代码设置 `modelValue` 仍然有效 | `boolean` | - | `false` |
| closeOnClickOutside | 展开时按下组件外部即收起 | `boolean` | - | `true` |
| threshold | 拖动距离超过该侧按钮总宽的这个比例时，松手展开；从展开往回拖时同理收起 | `number` | `0` – `1` | `0.15` |
| duration | 展开、归位的动画时长（ms） | `number` | - | `300` |

### MSwipeAction 事件

| 事件名 | 说明 | 回调参数 |
| --- | --- | --- |
| update:modelValue | 手势或按钮使展开状态变化时触发 | `'left' \| 'right' \| false` |

### MSwipeAction 插槽

| 名称 | 说明 |
| --- | --- |
| default | 内容 |

### SwipeActionItem

| 字段 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| content | 文字，也可传渲染函数或 `{ type, value }`，见 [Customer](../customer/README.md) | `string \| number \| Function \| object` | - |
| icon | MIcon 的类型，显示在文字左侧 | `string` | - |
| type | 背景色 | `'default' \| 'primary' \| 'success' \| 'warning' \| 'error'` | `'default'` |
| disabled | 文字置灰，点击无效，也不参与全滑 | `boolean` | `false` |
| fullSwipe | 只对最外侧的一项生效，见「二次确认与全滑」 | `boolean` | `false` |
| class / style | 加在按钮上，例如用 `style.background` 自定义颜色 | - | - |
| onClick | 点击（或全滑）时调用；返回值决定是否收起 | `(e: Event) => any` | - |

### MListItem

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| swiped | 露出按钮的一侧，支持 `v-model:swiped`；取值同 MSwipeAction 的 `modelValue` | `'left' \| 'right' \| false` | `false` |
| swipeActionOptions | MSwipeAction 除 `modelValue` 外的属性（`leftActions`、`rightActions`、`disabled`、`closeOnClickOutside`、`threshold`、`duration`），缺省值相同 | `SwipeActionOptions` | - |

两侧都没有操作项时，不绑定手势，DOM 与普通列表项相同。状态变化时触发 `update:swiped`。
