## 固钉（Affix）

将内容固定在视口或滚动容器的顶部、底部。`Affix` 与 `MAffix` 指向同一个组件。

### 何时使用

- 滚动页面时，需要让操作、导航或状态内容持续可见。
- 需要将内容固定在局部滚动容器内，或限制其在指定元素范围内活动。

### 基础用法

`fixed` 默认为 `true`，内容固定在视口中。在局部滚动容器内设为 `false`，组件会使用绝对定位。

:::playground
```vue
<template>
	<div class="affix-demo">
		<div class="affix-demo__status" :class="{ 'is-active': active }">
			<span class="affix-demo__status-dot" />
			当前状态：{{ active ? '已固定' : '未固定' }}
		</div>
		<Scroller
			class="affix-demo__scroller"
			height="240px"
			:always="true"
			:native="false"
		>
			<div class="affix-demo__content">
				<div class="affix-demo__spacer">
					<span>向下滚动查看固定效果 ↓</span>
				</div>
				<Affix v-model="active" :fixed="false" :offset="8">
					<template #default="{ active: current }">
						<Button type="primary">
							{{ current ? '已固定在容器顶部' : '等待固定' }}
						</Button>
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

const active = ref(false);
</script>

<style scoped>
.affix-demo__status {
	display: inline-flex;
	align-items: center;
	gap: 8px;
	margin: 12px 0;
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
	border: 1px solid var(--vc-color-light-deepest);
	border-radius: 8px;
	background: var(--vc-background-color-light);
}

.affix-demo__content {
	min-height: 640px;
	padding: 0 20px;
}

.affix-demo__spacer {
	display: flex;
	align-items: center;
	height: 160px;
	color: var(--vc-color-dark-lightest);
	font-size: 13px;
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
| zIndex | 固定状态下的层级 | `number \| string` | - | `1` |
| placement | 固定位置 | `string` | `top`、`bottom` | `top` |
| disabled | 是否禁用固定；禁用时直接渲染默认插槽 | `boolean` | - | `false` |
| fixed | 是否使用 `position: fixed`；设为 `false` 时使用 `position: absolute` | `boolean` | - | `true` |
| offset | 距离顶部或底部的偏移量，单位为 px | `number` | - | `0` |
| target | 限制固钉活动范围的 CSS 选择器；在局部滚动容器中使用绝对定位时不参与计算 | `string` | - | `undefined` |

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
