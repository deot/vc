## 图片生成（Snapshot）

HTML转图片

### 何时使用

要把HTML转成图片。

### 基础用法

:::RUNTIME
```vue
<template>
	<div>
		<Snapshot ref="target" :parser="parser" crossorigin="anonymous" >
			<!-- 需要crossorigin加在第一个， 才能处理跨域 -->
			<img
				src="'https://*/*.jpg'"
				class="image"
			>
		</Snapshot>
		<p>生成的图片</p>
		<img :src="src">
		<Button @click="handleClick">
			点击生成图片
		</Button>
		<Button @click="handleDown">
			点击生成图片并下载
		</Button>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Snapshot, Button } from '@deot/vc';

const src = ref('');
const target = ref();

const handleClick = async () => {
	const res = await target.value.getImage();
	src.value = res.base64Image;
};

const handleDown = async () => {
	const res = await target.value.download();
	src.value = res.base64Image;
};

const parser = (url) => {
	return new Promise((resolve) => {
		setTimeout(() => {
			console.log(url);
			resolve(url);
		}, 3000);
	});
};
</script>
<style>
.image {
	width: 200px;
}
</style>
```
:::

## API

### 基础属性

| 属性          | 说明        | 类型         | 可选值                           | 默认值         |
| ----------- | --------- | ---------- | ----------------------------- | ----------- |
| crossorigin | 处理跨域      | `string`   | `anonymous`、`use-credentials` | `anonymous` |
| showLoading | 处理跨域      | `boolean`  | -                             | `true`      |
| lazy        | 导出时实例化    | `boolean`  | -                             | `true`      |
| source      | -         | `function` | -                             | -           |
| download    | 下载（全局可拦截） | `function` | -                             | -           |


### 方法

| 方法名      | 说明      | 参数                                          |
| -------- | ------- | ------------------------------------------- |
| toDataURL | 生成图片    | `filename`：生成的图片文件名称；`getFile`：是否输出`file`文件 |
| download | 生成图片并下载 | `filename`：生成的图片文件名称；`getFile`：是否输出`file`文件 |

