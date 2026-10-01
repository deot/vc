## 测量范围（Measuring）

标记默认插槽里的内容只是为了量出尺寸而渲染、不会展示；里面的组件用 `useMeasuring()` 得知这一点，跳过与尺寸无关的副作用。自身不生成外层 DOM 元素。

### 何时使用

- **写单元格 / 列表项组件时**（最常见）：虚拟列表 `RecycleList` 以及基于它的虚拟化 `Table`，在行尺寸未知时会先把每一行在隐藏的测量池里渲染一遍来量尺寸，再渲染展示的那一份。组件有挂载即触发的副作用（发请求、登记、埋点等）时，用 `useMeasuring()` 判断，测量的那一遍里跳过。`Image`（不发图片请求）、`Text`（不做截断测量）已内置这一处理。
- **自己实现"先隐藏渲染、量完再展示"的容器时**：用 `Measuring` 包住被测量的内容。

跳过的只能是不影响尺寸的工作：测量时渲染出来的尺寸要与正常展示时一致。

### 基础用法

同一个组件渲染两份，测量范围里的那份不执行副作用。实际使用时测量的那一份是隐藏的，这里为了演示显示出来。

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
	<div class="measuring-demo">
		<section>
			<h4>正常展示</h4>
			<Probe />
		</section>
		<section>
			<h4>测量范围内</h4>
			<Measuring>
				<Probe />
			</Measuring>
		</section>
	</div>
	<p>挂载时执行的副作用次数：{{ effects }}</p>
</template>

<script setup>
import { defineComponent, h, onMounted, ref } from 'vue';
import { Measuring, useMeasuring } from '@deot/vc';

const effects = ref(0);

const Probe = defineComponent({
	setup() {
		const isMeasuring = useMeasuring();
		onMounted(() => {
			// 这一遍只用来量尺寸：不发请求、不登记
			if (isMeasuring) return;
			effects.value++;
		});
		return () => h('div', { class: 'measuring-demo__probe' }, `useMeasuring() → ${isMeasuring}`);
	}
});
</script>

<style scoped>
.measuring-demo {
	display: flex;
	gap: 16px;
}

.measuring-demo section {
	flex: 1;
}

.measuring-demo__probe {
	padding: 12px 16px;
	border: 1px solid #e5e7eb;
	border-radius: 6px;
}
</style>
```
:::

## API

### 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 只为量尺寸而渲染的内容；未提供时不渲染 | - |

组件没有自定义属性、事件或公开方法。

### useMeasuring

| 函数 | 说明 | 返回值 |
| --- | --- | --- |
| `useMeasuring()` | 当前组件是否渲染在测量范围里；在 `setup` 中调用 | `boolean` |

- 同一个组件实例的取值不会变：测量的那份与展示的那份是两个实例。
- 测量范围对所有后代组件生效，不限层级。

### 移动端

`MMeasuring` 是 `Measuring` 的别名，使用相同实现和默认插槽，可从 `@deot/vc` 导入。
