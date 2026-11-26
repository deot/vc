## 滑动操作（SwipeAction）

在列表行、卡片等内容上左右滑动，露出操作按钮。只有移动端：`MSwipeAction`；`SwipeAction` 是相同实现的别名。[MListItem](../list/README.md) 内置相同的能力：配置放在 `swipeActionOptions`，展开状态用 `v-model:swiped`，不需要再包一层。

### 何时使用

- 列表项的次要操作（置顶、标记、删除），平时收起，不占位置。
- 危险操作配合二次确认，或用全滑一步完成。

### 基础用法

向左滑露出 `rightActions`，向右滑露出 `leftActions`；数组顺序即按钮从左到右的顺序。拖动超过按钮总宽的 `threshold`（默认 15%）后松手展开，快速甩动时不论距离都按方向展开或收起。按钮的 `type` 决定背景色，`icon` 显示在文字左侧，`style` 可自定义颜色，`disabled` 置灰且点击无效。

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
	<div class="m-swipe-action-demo">
		<MList>
			<MListItem
				label="向左滑动"
				extra="内容"
				:swipe-action-options="{ rightActions: baseActions }"
			/>
			<MListItem
				label="左右都可以滑"
				description="threshold 为 0.5"
				:arrow="false"
				:swipe-action-options="{ leftActions, rightActions: iconActions, threshold: 0.5 }"
			/>
		</MList>
		<p class="m-swipe-action-demo__result">{{ result }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MList, MListItem } from '@deot/vc';

const result = ref('尚未操作');

const handleAction = (content) => {
	result.value = `点击了「${content}」`;
};

const baseActions = [
	{ content: '置顶', onClick: () => handleAction('置顶') },
	{ content: '删除', type: 'error', onClick: () => handleAction('删除') }
];

const leftActions = [
	{ content: '标记', type: 'primary', icon: 'success', onClick: () => handleAction('标记') },
	{ content: '完成', type: 'success', onClick: () => handleAction('完成') }
];

const iconActions = [
	{ content: '收藏', icon: 'star', style: { background: '#FFB400' }, onClick: () => handleAction('收藏') },
	{ content: '稍后', type: 'warning', disabled: true },
	{ content: '删除', type: 'error', icon: 'delete', onClick: () => handleAction('删除') }
];
</script>

<style scoped>
.m-swipe-action-demo {
	display: flex;
	flex-direction: column;
	gap: calc(var(--vc-rem) * 32);
}

.m-swipe-action-demo__result {
	margin: 0;
	padding-inline: calc(var(--vc-rem) * 32);
	font-size: calc(var(--vc-rem) * 28);
	color: var(--vc-color-dark-extralight);
}
</style>
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
	<div class="m-swipe-action-demo">
		<MList>
			<MListItem
				v-for="item in rows"
				:key="item"
				:label="item"
				:arrow="false"
				:swipe-action-options="{
					rightActions: [
						{ content: '保持', onClick: () => true },
						{ content: '删除', type: 'error', fullSwipe: true, onClick: () => handleRemove(item) }
					]
				}"
			/>
		</MList>
		<p class="m-swipe-action-demo__result">剩余 {{ rows.length }} 项</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MList, MListItem, MModal } from '@deot/vc';

const rows = ref(['列表项 1', '列表项 2', '列表项 3']);

const handleRemove = item => new Promise((resolve, reject) => {
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

<style scoped>
.m-swipe-action-demo {
	display: flex;
	flex-direction: column;
	gap: calc(var(--vc-rem) * 32);
}

.m-swipe-action-demo__result {
	margin: 0;
	padding-inline: calc(var(--vc-rem) * 32);
	font-size: calc(var(--vc-rem) * 28);
	color: var(--vc-color-dark-extralight);
}
</style>
```
:::

### 打开状态与独立使用

`v-model` 为露出按钮的一侧：`'right'` 表示露出右侧按钮（即向左滑过），`'left'` 反之，收起时为 `false`；可以由代码打开或收起（MListItem 上为 `v-model:swiped`），手势或按钮使状态变化时触发 `update:modelValue`。`MSwipeAction` 的默认插槽可以放任意内容，`duration` 设置展开、归位的动画时长，`disabled` 后不响应滑动，但由代码设置 `modelValue` 仍然有效。

展开时：
- 点内容区只会收起，不会触发内容上的点击（例如 MListItem 的 `click` 和跳转）；
- 按下组件外部（包括别的行）也会收起，因此同一时间只有一行展开。不需要后者时设置 `closeOnClickOutside` 为 `false`。

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
	<div class="m-swipe-action-demo">
		<MSwipeAction
			v-model="side"
			:disabled="isDisabled"
			:duration="600"
			:close-on-click-outside="false"
			:right-actions="[{ content: '归档', type: 'primary' }, { content: '删除', type: 'error' }]"
			@update:model-value="handleChange"
		>
			<div class="m-swipe-action-demo__card">当前：{{ side }}</div>
		</MSwipeAction>
		<div class="m-swipe-action-demo__row">
			<MButton size="small" type="primary" @click="side = 'right'">打开</MButton>
			<MButton size="small" @click="side = false">收起</MButton>
			<MButton size="small" @click="isDisabled = !isDisabled">{{ isDisabled ? '启用手势' : '禁用手势' }}</MButton>
		</div>
		<p class="m-swipe-action-demo__result">update:modelValue 触发 {{ count }} 次</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MButton, MSwipeAction } from '@deot/vc';

const side = ref(false);
const isDisabled = ref(false);
const count = ref(0);

const handleChange = () => {
	count.value++;
};
</script>

<style scoped>
.m-swipe-action-demo {
	display: flex;
	flex-direction: column;
	gap: calc(var(--vc-rem) * 32);
}

.m-swipe-action-demo__card {
	padding: calc(var(--vc-rem) * 32);
	background: var(--vc-background-color-lightest);
}

.m-swipe-action-demo__row {
	display: flex;
	flex-wrap: wrap;
	gap: calc(var(--vc-rem) * 16);
	padding-inline: calc(var(--vc-rem) * 32);
}

.m-swipe-action-demo__result {
	margin: 0;
	padding-inline: calc(var(--vc-rem) * 32);
	font-size: calc(var(--vc-rem) * 28);
	color: var(--vc-color-dark-extralight);
}
</style>
```
:::

## 尺寸

长度按 750 稿书写并随 `--vc-rem` 缩放；括号内为 375 宽下的 px。

| 部位 | 值 |
| --- | --- |
| 按钮左右内边距 | 32（16），按钮宽度随内容 |
| 文字字号 / 行高 | 32（16）/ 44（22） |
| 图标 / 与文字的间距 | 40（20）/ 8（4） |

## 手势

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
