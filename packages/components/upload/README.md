## 上传（Upload）

上传功能

### 何时使用

上传是将信息（网页、文字、图片、视频等）通过网页或者上传工具发布到远程服务器上的过程。
- 当需要上传一个或一些文件时。
- 当需要使用拖拽交互时。

### 基础用法

点击上传一个文件

:::RUNTIME
```vue
<template>
	<div>
		<Upload
			@file-error="handleFileError"
			@file-success="handleFileSuccess"
		>
			<Button
				style="margin-bottom: 21px"
			>上传</Button>
		</Upload>
		{{fileName}}
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Upload, Message, Button, VcInstance } from '@deot/vc';
// 只需要注册一次(项目中已注册无视)
VcInstance.hasInit = false;
VcInstance.configure({
	Upload: {
		url: 'https://api.github.com/users/deot',
		onPostBefore: ({ options }) => {
			return new Promise((resolve, reject) => {
				if (Math.random(0, 10) > 10) {
					throw new Error('上传失败');
				}
				resolve({
					...options,
					param: {
						...options.param,
						timestamp: new Date()
					},
					type: 'GET',
					credentials: 'omit', //  cors下关闭
					headers: {

					}
				});
			});
		},
		onPostAfter: ({ response, options }) => {
			const { file } = options.param;
			return new Promise((resolve) => {
				// 模拟强制返回
				resolve({
					status: 1,
					data: {
						url: 'https://avatars2.githubusercontent.com/u/34465004?v=4',
						type: `.${file.name.split('.').pop()}`,
						uid: file.uid,
						title: file.name,
						size: file.size
					},
					...response
				});
			});
		}
	}
});

const fileName = ref('');
const handleFileSuccess = (res, file, opt) => {
	console.log(`Success：${file.current}, 总数：${file.total}`);
	console.log(res);
	console.log('file', file);
	console.log('opt', opt);
	Message.destroy();
	Message.success({
		content: `上传成功`
	});
	fileName.value = res.avatar_url;
};

const handleFileError = (res, file) => {
	console.log(`Error: 当前：${file.current}, 总数：${file.total}`);
	console.log(res);
	Message.destroy();
	Message.error({
		content: res.message
	});
	fileName.value = res.avatar_url;
};
</script>
```
:::

### 自定义上传文件类型及其他限制

- 设置`max`属性控制一次性上传文件个数
- 设置`size`属性控制上传文件的大小，单位`Mb`。
- 设置`accept`属性控制文件上传的类型。

:::RUNTIME
```vue
<template>
	<div class="v-upload-basic">
		<Upload
			:size="100"
			:max="5"
			accept="image/*"
			@error="handleError"
			@begin="handleBegin"
			@complete="handleComplete"
			@file-before="handleFileBefore"
			@file-start="handleFileStart"
			@file-error="handleFileError"
			@file-success="handleFileSuccess"
			@file-progress="handleFileProgress"
		>
			<Button style="margin-bottom: 21px;">
				上传多个文件
			</button>
		</Upload>
		<div style="display: flex; flex-wrap: wrap">
			<div
				v-for="(item, index) in list"
				:key="index"
				:style="{ backgroundImage: `url(${item.base64})` }"
				class="image"
			>
				{{ item.title }}
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Upload, Message, Button, VcInstance } from '@deot/vc';

VcInstance.configure({
	Upload: {
		onRequest: (options) => {
			return new Promise((resolve) => {
				if (random(0, 10) > 9) {
					throw new Error('存在异常');
				}
				resolve({
					...options,
					url: 'https://httpbin.org/post',
					body: {
						timestamp: new Date().getTime(),
						...options.body
					},
					headers: {}
				});
			});
		},
		onResponse: (response, options) => {
			const file = options.file;
			return new Promise((resolve, reject) => {
				try {
					response = JSON.parse(response);
				} catch (e) {
					reject(e);
				};
				// 模拟强制返回
				resolve({
					base64: response.files.file,
					type: `.${file.name.split('.').pop()}`,
					title: file.name,
					size: file.size
				});
			});
		}
	}
});
const list = ref([]);
const handleError = (error) => {
	console.error(error.message);
};

const handleBegin = (files) => {
	console.log(files);
	Message.loading({
		content: `上传中`
	});
};

const handleComplete = (cycle = {}) => {
	console.log(`Error: ${cycle.error}, Success: ${cycle.success}, 总数：${cycle.total}`);
	console.log(cycle.responses);
	Message.destroy();
};

const handleFileBefore = (vFile) => {
	console.log(`上传之前`);
	return new Promise((resolve) => {
		resolve(vFile);
	});
};

const handleFileStart = () => {
	console.log(`开始上传`);
};

const handleFileSuccess = (response, vFile) => {
	console.log(`Success：${vFile.current}, 总数：${vFile.total}`);
	console.log(response);
	Message.destroy();
	Message.success({
		content: `上传成功`
	});

	list.value.push(response);
};

const handleFileProgress = (e, vFile) => {
	console.log(`Progress: 当前：${vFile.current}, 总数：${vFile.total}`);
	console.log(e);
};

const handleFileError = (e, vFile) => {
	console.log(`Error: 当前：${vFile.current}, 总数：${vFile.total}`);
	console.log(e);
	Message.destroy();
	Message.error({
		content: e.message || 'test'
	});
};
</script>
<style lang="scss">
.v-upload-basic{
	._image {
		background-size: cover;
		width: 64px;
		height: 64px;
		border-radius: 3px;
		margin-right: 12px;
		border: 1px solid #f2f2f2;
		color: red;
		display: flex;
		align-items: center;
		justify-content: center;
	}
}
</style>
```
:::


### 获取文件但不上传到服务器

通过`file-before`事件返回`false`可以阻止文件上传

:::RUNTIME
```vue
<template>
	<div>
		<Upload
			@file-before="handleFileBefore"
		>
			<Button
				style="margin-bottom: 21px"
			>上传</Button>
		</Upload>
		{{fileName}}
	</div>
</template>

<script setup>
import { Upload, Message, Button, VcInstance } from '@deot/vc';

VcInstance.configure({
	Upload: {
		onRequest: (options) => {
			return new Promise((resolve) => {
				if (random(0, 10) > 9) {
					throw new Error('存在异常');
				}
				resolve({
					...options,
					url: 'https://httpbin.org/post',
					body: {
						timestamp: new Date().getTime(),
						...options.body
					},
					headers: {}
				});
			});
		},
		onResponse: (response, options) => {
			const file = options.file;
			return new Promise((resolve, reject) => {
				try {
					response = JSON.parse(response);
				} catch (e) {
					reject(e);
				};
				// 模拟强制返回
				resolve({
					base64: response.files.file,
					type: `.${file.name.split('.').pop()}`,
					title: file.name,
					size: file.size
				});
			});
		}
	}
});

const fileName = ref('');
const file = ref(null);
const handleFileBefore = (vFile) => {
	file.value = vFile.source;
	return false;
};
</script>
```
:::

## API

### 属性

| 属性                | 说明                                     | 类型                           | 可选值 | 默认值      |
| ----------------- | -------------------------------------- | ---------------------------- | --- | -------- |
| tag               | 外层标签                                   | `string`、`object`、`Function` | -   | `span`   |
| max               | 一次性最多选择的文件数量                           | `Number`                     | -   | 1        |
| disabled          | 禁用                                     | `Boolean`                    | -   | `false`  |
| accept            | 文件格式                                   | `string`                     | -   | -        |
| mode              | 文件归类（images / file）,提前定位文件类型（内置图片压缩）   | `string`                     | -   | `images` |
| request           | 请求函数                                   | `() => Promise`              | -   | -        |
| url               | request:url -> 默认通过`VcInstance.init`注册 | `string`                     | -   | -        |
| async             | 是否使用异步                                 | `Boolean`                    | -   | `true`   |
| name              | 上传给后端获取的key                            | `string`                     | -   | -        |
| size              | 限制上传文件大小, 默认不限制（单位：mb）                 | `Number`                     | -   | 0        |
| extra             | request需要传递的参数                         | `object`                     | -   | {}       |
| headers           | request: headers                       | `object`                     | -   | {}       |
| show-task-manager | 展示显示进度弹窗                               | `Boolean`                    | -   | `false`  |
| directory         | 是否选取文件夹                                | `Boolean`                    | -   | `false`  |
| parallel          | 是否并发执行                                 | `Boolean`                    | -   | `true`   |


### 事件

| 事件名           | 说明            | 回调参数                                              | 参数说明                                  |
| ------------- | ------------- | ------------------------------------------------- | ------------------------------------- |
| file-before   | 单个文件上传前回调(进度) | `(file: File, fileList: array) => void`           | `file`：当前上传的文件；`fileList`：上传的文件数组     |
| file-start    | 单个文件上传开始回调    | `(file: File) => void`                            | `file`：当前上传的文件                        |
| file-progress | 单个文件上传过程回调    | `(e: Event, file: File) => void`                  | `e`：上传事件对象；`file`：上传的文件               |
| file-success  | 单个文件上传过程成功回调  | `(res: object, file: File, info: object) => void` | `res`：上传结果；`file`：上传的文件；`info`：上传信息对象 |
| file-error    | 单个文件上传过程失败回调  | `(res: object, file: File, info: object) => void` | `res`：上传结果；`file`：上传的文件；`info`：上传信息对象 |
| begin         | 一个周期上传前的回调    | `(fileList: array) => void`                       | `fileList`：上传的文件数组                    |
| complete      | 一个周期上传后的回调    | `(info: object) => void`                          | `info`：上传信息对象                         |
| error         | 组件内部报错回调      | `(error: object) => void`                         | `error`：错误信息                          |
| post-before   | 文件上传前回调（处理异步） | `() => {}`                                        | -                                     |
| post-after    | 文件上传后回调       | `() => {}`                                        | -                                     |
| remove-before | 文件移除前回调       | `() => Promise`                                   | -                                     |

### Slot

| 属性      | 说明      |
| ------- | ------- |
| default | 上传文件触发器 |

