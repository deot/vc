## 更新`3.x`注意事项
- 组件: `ImagePreview -> vc-image-preview`
- 变更属性: `id -> elementId`
- 移除`getInstance``
- `options -> options`

## 图片预览（ImagePreview）
点击预览大图

### 何时使用
随时能在页面内展示完整的图片。

### 基础用法

:::RUNTIME
```vue
<template>
	<div>
		<ImagePreview :data-source="dataSource" />
	</div>
</template>
<script setup lang="jsx">
import { ref } from 'vue';
import { ImagePreview } from '@deot/vc';

const dataSource = ref([
	{
		src: 'https://github.githubassets.com/favicons/favicon.svg',
		title: 'Image 1',
		w: 1200,
		h: 900
	},
	{
		src: 'https://github.githubassets.com/favicons/favicon.svg',
		title: 'Image 2',
		w: 1200,
		h: 900
	},
	{
		src: 'https://github.githubassets.com/favicons/favicon.svg',
		title: 'Image 2',
		w: 1200,
		h: 900
	},
	{
		src: 'https://github.githubassets.com/favicons/favicon.svg',
		title: 'Image 2',
		w: 1200,
		h: 900
	},
	{
		src: 'https://github.githubassets.com/favicons/favicon.svg',
		title: 'Image 2',
		w: 1200,
		h: 900
	}

]);
</script>
```
:::

### 自定义 renderRow
可以自定义展示图片，设置图片的样式。

:::RUNTIME
```vue
<template>
	<div>
		<!-- 自定义 renderRow -->
		<p>通过renderRow自定义</p>	
		<ImagePreview :data-source="dataSource" :render-row="renderRow" />
		
		<!-- 自定义 renderRow -->
		<p>通过slot自定义</p>	
		<ImagePreview :data-source="dataSource">
			<template #row="it">
				<img 
					:key="it.index" 
					:src="it.src" 
					:style="{ width: '100px', height: '100px', borderRadius: '20px' }"
				>
			</template>
		</ImagePreview>
	</div>
</template>
<script setup lang="jsx">
import { ref } from 'vue';
import { ImagePreview } from '@deot/vc';

const dataSource = ref([
	{
		src: 'https://github.githubassets.com/favicons/favicon.svg',
		title: 'Image 1',
		w: 1200,
		h: 900
	},
	{
		src: 'https://github.githubassets.com/favicons/favicon.svg',
		title: 'Image 2',
		w: 1200,
		h: 900
	},
	{
		src: 'https://github.githubassets.com/favicons/favicon.svg',
		title: 'Image 2',
		w: 1200,
		h: 900
	},
	{
		src: 'https://github.githubassets.com/favicons/favicon.svg',
		title: 'Image 2',
		w: 1200,
		h: 900
	},
	{
		src: 'https://github.githubassets.com/favicons/favicon.svg',
		title: 'Image 2',
		w: 1200,
		h: 900
	}
]);
const renderRow = (props, parent) => {
	const { src, index } = props; 
	return (
		<img 
			src={src} 
			key={index} 
			style={{ width: '100px', height: '100px', borderRadius: '50px' }} 
		/>
	);
};
</script>
```
:::

### 自定义operate
通过`slot`：operate插入预览触发内容。

:::RUNTIME
```vue
<template>
	<div>
		<!-- 自定义 operate -->
		<ImagePreview :data-source="dataSource">
			<template #operate="it">
				<div @click="it.show($event, it.index)">
					{{ it.index }}
				</div>
			</template>
		</ImagePreview>
	</div>
</template>
<script setup lang="jsx">
import { ref } from 'vue';
import { ImagePreview } from '@deot/vc';

const dataSource = ref([
	{
		src: 'https://github.githubassets.com/favicons/favicon.svg',
		title: 'Image 1',
		w: 1200,
		h: 900
	},
	{
		src: 'https://github.githubassets.com/favicons/favicon.svg',
		title: 'Image 2',
		w: 1200,
		h: 900
	},
	{
		src: 'https://github.githubassets.com/favicons/favicon.svg',
		title: 'Image 2',
		w: 1200,
		h: 900
	},
	{
		src: 'https://github.githubassets.com/favicons/favicon.svg',
		title: 'Image 2',
		w: 1200,
		h: 900
	},
	{
		src: 'https://github.githubassets.com/favicons/favicon.svg',
		title: 'Image 2',
		w: 1200,
		h: 900
	}

]);
</script>
```
:::

### 自定义预览
调用ImagePreview的open方法预览大图。

:::RUNTIME
```vue
<template>
	<div>
		<span style="cursor: pointer;" @click="handleClick">自定义预览</span>
	</div>
</template>
<script setup lang="jsx">
import { ref } from 'vue';
import { ImagePreview } from '@deot/vc';

const dataSource = ref([
	{
		src: 'https://github.githubassets.com/favicons/favicon.svg',
		title: 'Image 1',
		w: 1200,
		h: 900
	},
	{
		src: 'https://github.githubassets.com/favicons/favicon.svg',
		title: 'Image 2',
		w: 1200,
		h: 900
	},
	{
		src: 'https://github.githubassets.com/favicons/favicon.svg',
		title: 'Image 2',
		w: 1200,
		h: 900
	},
	{
		src: 'https://github.githubassets.com/favicons/favicon.svg',
		title: 'Image 2',
		w: 1200,
		h: 900
	},
	{
		src: 'https://github.githubassets.com/favicons/favicon.svg',
		title: 'Image 2',
		w: 1200,
		h: 900
	}
]);

const options = ref({
	closeOnScroll: false
});

const handleClick = (e) => {
	let pos = {};
	try {
		const target = e.target; // 先得到pos, 否则getThumbBoundsFn再计划，target已变化（比如弹窗transition的影响）
		const pageYScroll = window.pageYOffset || document.documentElement.scrollTop;
		const rect = target.getBoundingClientRect();

		pos = { x: rect.left, y: rect.top + pageYScroll, w: rect.width };

	} catch (e) {
		console.log(e);
	}
	ImagePreview.open({
		visible: true,
		dataSource: dataSource.value,
		options: {
			index: 2,
			history: false,
			getThumbBoundsFn: (index) => pos
		}
	});
}
</script>
```
:::

## API

### 属性

| 属性            | 说明             | 类型                               | 可选值 | 默认值 |
| ------------- | -------------- | -------------------------------- | --- | --- |
| dataSource    | 源数据            | `array<object>`; `array<String>` | -   | -   |
| options       | photoSwipe参数   | `object`                         | -   | -   |
| events        | photoSwipe事件   | `object`                         | -   | -   |
| actionBar     | 工具栏扩展          | `array`                          | -   | -   |
| getInstance   | 获取组件实例对象       | `Function`                       | -   | -   |
| enhancer      | 增强方法           | `Function`                       | -   | -   |
| itemClassName | item的className | `string`                         | -   | -   |
| renderRow     | 自定义渲染内容        | `(props, parent) => jsx`         | -   |     |
| elementId     | 外层标识           | `string`                         | -   | -   |


### 事件

| 事件名   | 说明   | 回调参数 | 参数说明 |
| ----- | ---- | ---- | ---- |
| open  | 打开预览 | -    | -    |
| close | 关闭预览 | -    | -    |


### 插槽

| 属性      | 说明           |
| ------- | ------------ |
| operate | 蒙层中的操作视图     |
| row     | 同方法renderRow |

