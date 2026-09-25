## 固钉（Affix）

将内容固定在视口或滚动容器的顶部、底部。`Affix` 与 `MAffix` 指向同一个组件。

### 何时使用

- 滚动页面时，需要让操作、导航或状态内容持续可见。
- 需要将内容固定在局部滚动容器内，或限制其在指定元素范围内活动。

### 基础用法

`fixed` 默认为 `true`，内容固定在视口中。在局部滚动容器内设为 `false`，组件使用 `position: sticky` 吸附在滚动容器内：吸附由浏览器完成，滚动时不会抖动；吸附范围受父元素限制，父元素滚出可视区后固钉随之离开（此时 `active` 为 `false`）。需要在整个滚动容器内持续吸附时，把 `Affix` 直接放在滚动内容中，且与滚动容器之间不要有 `overflow` 非 `visible` 的元素。

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
	<div class="affix-demo">
		<div class="affix-demo__status" :class="{ 'is-active': isActive }">
			<span class="affix-demo__status-dot" aria-hidden="true" />
			<span>当前状态：{{ isActive ? '已固定' : '未固定' }}</span>
		</div>
		<Scroller
			class="affix-demo__scroller"
			height="240px"
			:always="true"
			:native="false"
		>
			<div class="affix-demo__content">
				<div class="affix-demo__spacer">
					<span>向下滚动查看固定效果</span>
					<span class="affix-demo__arrow" aria-hidden="true">↓</span>
				</div>
				<Affix v-model="isActive" :fixed="false" :offset="8">
					<template #default="{ active: isFixed }">
						<div class="affix-demo__action">
							<Button type="primary">
								{{ isFixed ? '已固定在容器顶部' : '等待固定' }}
							</Button>
						</div>
					</template>
				</Affix>
				<div class="affix-demo__spacer affix-demo__spacer--after">
					<span>继续滚动，固钉保持在顶部</span>
				</div>
			</div>
		</Scroller>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Affix, Button, Scroller } from '@deot/vc';

const isActive = ref(false);
</script>

<style scoped>
.affix-demo__status {
	display: inline-flex;
	align-items: center;
	gap: 8px;
	margin-bottom: 12px;
	padding: 6px 12px;
	border-radius: 16px;
	background: var(--vc-color-primary-lighter);
	color: var(--vc-color-dark-lightest);
	font-size: 13px;
}

.affix-demo__status-dot {
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background: var(--vc-color-dark-extralight);
}

.affix-demo__status.is-active {
	color: var(--vc-color-dark);
}

.affix-demo__status.is-active .affix-demo__status-dot {
	background: var(--vc-color-primary);
}

.affix-demo__scroller {
	border: 1px solid var(--vc-color-primary-lighter);
	border-radius: var(--vc-border-radius);
	background: var(--vc-background-color-light);
}

.affix-demo__content {
	min-height: 640px;
	padding: 0 20px;
}

.affix-demo__spacer {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 6px;
	height: 160px;
	color: var(--vc-color-dark-lightest);
	font-size: 13px;
}

.affix-demo__arrow {
	color: var(--vc-color-primary);
	font-size: 16px;
}

.affix-demo__action {
	display: flex;
	justify-content: center;
}

.affix-demo__spacer--after {
	height: 360px;
}
</style>
```
:::

## API

### 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| modelValue | 接收组件检测到的固定状态；传入值不驱动布局，位置检测后通过 `update:modelValue` 同步 | `boolean` | - | `false` |
| zIndex | 固定状态下的层级；`fixed=false` 时始终作用于吸附元素 | `number \| string` | - | `1` |
| placement | 固定位置 | `string` | `top`、`bottom` | `top` |
| disabled | 是否禁用固定；禁用时直接渲染默认插槽 | `boolean` | - | `false` |
| fixed | 是否使用 `position: fixed`；设为 `false` 时使用 `position: sticky`，吸附范围受父元素限制 | `boolean` | - | `true` |
| offset | 距离顶部或底部的偏移量，单位为 px；`fixed=false` 时相对滚动容器去掉 padding 后的可视区 | `number` | - | `0` |
| target | 限制固钉活动范围的 CSS 选择器；仅 `fixed=true` 时参与计算 | `string` | - | `undefined` |

### 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| update:modelValue | 位置检测完成时触发 | `(active: boolean) => void` | `active`：当前是否处于固定状态 |

### 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 固钉内容；禁用时不渲染 Affix 容器 | `{ active: boolean }`；`active` 为当前固定状态，禁用时为 `false` |

### 方法

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| refresh | 重新计算位置并同步固定状态 | - | `void` |
| onScroll | 在当前滚动源上注册回调；`options.first` 为 `true` 时注册后立即执行 | `handler: () => void`，`options?: { first?: boolean }` | 用于取消注册的 `() => void` |
| offScroll | 从当前滚动源移除回调 | `handler: () => void` | `void` |

`onScroll` 的滚动源：固钉所在的滚动容器正是外层 `Scroller` 时订阅其滚动通知（`wheel` 滚轮驱动时与滚动同一帧回调），否则监听该容器的原生 `scroll`。

### 使用注意

`fixed=false` 基于 `position: sticky`（页面级同样如此）：

- 吸附范围由父元素决定：父元素滚出可视区后固钉随之离开，`active` 变为 `false`。需要在整个滚动容器内持续吸附时，把 `Affix` 直接放在滚动内容中。
- 固钉与滚动容器之间不能有 `overflow` 非 `visible` 的中间元素（包括不滚动的 `overflow: hidden`）：sticky 会以最近的这类元素为参照，导致不吸附。滚动容器自身为 `overflow: hidden`（如滚轮驱动的 `Scroller`）不受影响；中间元素只是为了裁剪内容时，可改用 `overflow: clip`。
- 不要把 `Affix` 放成被拉伸的 flex 子项（如 `align-items: stretch` 的横向 flex 容器中），拉伸后与容器等高，sticky 没有移动空间。
- `target` 仅在 `fixed=true` 时生效；需要限制活动范围时使用 `fixed=true` 与 `target`。
- 根节点为 `.vc-affix.is-sticky`；是否处于吸附中通过 `v-model` 或插槽参数 `active` 获取。

<!--
## 变更说明

### fixed=false 改用 position: sticky
- 原先为绝对定位加 JS 滚动补偿，现由浏览器 sticky 吸附，原生滚动时不再抖动。
- 吸附范围改为由父元素决定，父元素滚出可视区后固钉随之离开。
- 页面级（没有局部滚动容器）的 `fixed=false` 不再参考 `target`。
- 不再输出 `.vc-affix__absolute` class，依赖它的样式改为选择 `.vc-affix.is-sticky`。
-->
