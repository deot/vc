## 全局配置（VcInstance）

通过共享的响应式单例配置语言、上传处理、文件预览、弹层安装等组件行为；桌面端与移动端使用同一个 `VcInstance`。

### 何时使用

在应用初始化时统一设置语言或组件配置，或在运行时切换语言。使用按需引入时可以直接调用 `configure()`，无需注册插件。

### 基础用法

```ts
import { VcInstance, enUS } from '@deot/vc';
import type { VcOptions } from '@deot/vc';

const options: VcOptions = { locale: enUS };
VcInstance.configure(options);
```

也可以从 `@deot/vc-components` 引入 `VcInstance`、`VcError` 和 `VcOptions`，从 `@deot/vc-locale` 引入语言对象。

`configure()` 只更新传入的顶层键，未传入的配置保留。传入的嵌套对象会整体替换，不做深度合并。例如，重新配置 `Upload` 时，需要同时提供希望保留的上传回调。

`configure()` 不传参数时保留全部配置，返回单例自身；它不是重置方法。`locale: undefined` 同样保留当前语言，其他顶层键没有这一保护。

### 通过插件统一初始化

使用全量入口 `@deot/vc/full` 的 `createVcPlugin()`（或用 `defineVcPlugin()` 自行挑选组件得到的插件工厂）时，安装插件会将同一份配置交给 `VcInstance.configure()`，并将单例挂到 `app.config.globalProperties.$vc`。第二个参数可以统一转换注册到 Vue app 的组件名。

下面通过插件设置默认语言。注册名称加上 `V` 前缀后，可在模板中使用 `VButton` 等名称；按需导入的组件名不受影响。各组件的配置在下方独立说明。

```ts
import { createApp } from 'vue';
import { createVcPlugin, zhCN } from '@deot/vc/full';

const app = createApp({});
const vc = createVcPlugin({
	locale: zhCN
}, name => `V${name}`);

app.use(vc);
```

后续也可以直接调用 `VcInstance.configure()` 更新配置；每项配置的读取时机由对应组件决定。

### 运行时切换语言

默认语言为 `zhCN`。传入完整的语言对象后，使用 `useLocale()` 的组件会响应语言变化；不会自动合并缺失的翻译。组件的显式文案属性仍按各组件的规则覆盖默认翻译。

下面将语言配置放在 `locale.js`，页面通过 `useLocale()` 读取当前语言名称。切换全局配置后状态同步更新，示例卸载时恢复原语言。

:::playground
<!-- <config lang="json5">{ entry: 'App.vue', views: ['runtime', 'files'], previewInset: 16 }</config> -->
```vue App.vue
<template>
	<div class="demo">
		<div class="actions">
			<Button @click="handleChinese">简体中文</Button>
			<Button @click="handleEnglish">English</Button>
		</div>
		<p>当前语言：{{ lang }}</p>
	</div>
</template>
<script setup>
import { onBeforeUnmount } from 'vue';
import { Button, useLocale } from '@deot/vc';
import { handleChinese, handleEnglish, restoreLocale } from './locale.js';

const { lang } = useLocale();

onBeforeUnmount(restoreLocale);
</script>
<style scoped>
.actions {
	display: flex;
	flex-wrap: wrap;
	gap: 12px;
}

.demo p {
	margin: 16px 0;
}
</style>
```
```js locale.js
import { VcInstance, enUS, zhCN } from '@deot/vc';

const originalLocale = VcInstance.options.locale;

export const handleChinese = () => VcInstance.configure({ locale: zhCN });
export const handleEnglish = () => VcInstance.configure({ locale: enUS });
export const restoreLocale = () => VcInstance.configure({ locale: originalLocale });
```
:::

## API

### VcInstance 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| options | 当前共享的响应式配置对象 | `VcOptions & { locale: Language }` | - | 见下方配置项 |
| globalEvent | 浏览器中由 `document` 的捕获阶段点击监听更新，供弹窗定位等内部逻辑读取；初始化时还没有点击事件 | `MouseEvent` | - | 初始化为 `{}` |

`VcInstance` 在模块加载时创建，多个 Vue 应用和同一服务端进程中的调用会共享此单例。它不提供应用级或请求级隔离。

### VcInstance 方法

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| configure | 按顶层键替换配置；省略参数或传入 `locale: undefined` 时保留当前语言 | `options?: VcOptions` | `typeof VcInstance`，可链式调用 |

### VcOptions 配置项

`VcOptions` 是可选配置对象，允许以组件名为键传入配置。配置是否生效、局部属性的优先级及回调契约由对应组件决定；`configure()` 本身不校验或补全配置。

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| locale | 设置默认文案使用的完整语言对象；使用 `useLocale()` 的组件响应语言切换 | `Language` | `zhCN`、`enUS` 或自定义语言对象 | `zhCN` |

`Language` 由 `@deot/vc-locale` 导出。以下按组件列出常用配置，每个代码块都是配置伪代码；其中的路由、资源库、鉴权、导出等业务依赖由应用提供。配置是否即时生效、局部覆盖规则及完整参数见对应组件文档。

### Image 全局配置

统一转换原图和缩略图地址，例如为相对地址补齐资源服务器前缀。详见 [Image](../image/README.md)。

| 配置项 | 具体作用 | 默认值 |
| --- | --- | --- |
| formatter | 接收 `(value, type, instance)`，`type` 为 `src` 或 `thumbnail`；返回空值时保留原地址，组件的 `formatter` 优先 | `undefined` |

```js
import { VcInstance } from '@deot/vc';

VcInstance.configure({
	Image: {
		formatter: path => new URL(path, 'https://assets.example.com/').href
	}
});
```

### MListItem 全局配置

接入应用的移动端列表导航。详见 [List](../list/README.md)。

| 配置项 | 具体作用 | 默认值 |
| --- | --- | --- |
| to | 接收 `(value, instance)`，`value` 为当前项的 `to`；返回非 `undefined` 值时终止默认导航，包括 `false` | `undefined` |

```js
import { VcInstance } from '@deot/vc';

// router 为应用的 Vue Router 实例
VcInstance.configure({
	MListItem: {
		to: (value) => {
			if (!value) return;
			router.push(value);
			return false;
		}
	}
});
```

### FilePreview 全局配置

FilePreview 与 UploadPicker 共用此配置，Editor 只读取文件类型和名称配置。配置类型可通过 `VcOptions['FilePreview']` 获取。详见 [FilePreview](../file-preview/README.md)。

| 配置项 | 具体作用 | 默认值 |
| --- | --- | --- |
| getFileType | 接收地址，识别 `image`、`video`、`audio` 或 `file`；返回空值或非法类型时回退内置规则 | `undefined` |
| getFileName | 从地址推导缺省名称；数据中的显式名称优先，返回空值时回退内置规则 | `undefined` |
| enhancer | 接收 `{ current, data, instance }`；返回真值或 resolve 真值时接管预览 | `undefined` |

```js
import { VcInstance } from '@deot/vc';

VcInstance.configure({
	FilePreview: {
		getFileType: source => source.endsWith('.jpg!preview') ? 'image' : undefined,
		getFileName: source => decodeURIComponent(source.split('/').pop()).replace(/^\d+_/, ''),
		enhancer: ({ current, data }) => {
			const item = data[current];
			if (item.type !== 'file') return false;
			// 接入业务的文件预览服务
			window.open(`https://viewer.example.com/?src=${encodeURIComponent(item.source)}`);
			return true;
		}
	}
});
```

### Editor 全局配置

设置统一的编辑器初始化配置和工具栏资源选择方式。详见 [Editor](../editor/README.md)。

| 配置项 | 具体作用 | 默认值 |
| --- | --- | --- |
| options | 提供 Quill 初始化配置，在 Editor 默认配置之后、组件 `options` 之前合并 | `undefined` |
| enhancer | 接收 `(instance, type)`，返回真值时终止默认工具栏上传；需要组件启用 `enhancer`，缺省回退到 `UploadPicker.enhancer` | `undefined` |

```js
import { VcInstance } from '@deot/vc';

VcInstance.configure({
	Editor: {
		options: { toolbar: ['bold', 'italic', 'link', 'upload/image', 'undo', 'redo'] },
		enhancer: async (instance, type) => {
			// selectResource 为业务资源库，返回 { source, name } 或空值
			const resource = await selectResource(type);
			if (!resource) return false;
			instance.exposed.add([{ value: resource.source, target: { name: resource.name } }]);
			return true;
		}
	}
});
```

### Portal 全局配置

Portal 的独立 app 不自动继承主应用的插件或 `provide`，可在这里统一安装依赖和配置保活范围。构造或单次调用配置优先于全局配置。详见 [Portal](../portal/README.md)。

| 配置项 | 具体作用 | 默认值 |
| --- | --- | --- |
| install | 在独立弹层 app 挂载前调用，接收 `app`，用于安装插件或注入依赖 | `undefined` |
| aliveRules | 在 `alive` 模式下，点击路径中的元素匹配 `className` 或 `id` 正则时不触发外部点击关闭 | 未设置时使用 `{ className: /(vc-portal-alive)/ }` |

```js
import { VcInstance } from '@deot/vc';

// router、store 为主应用已有的路由和状态管理插件
VcInstance.configure({
	Portal: {
		aliveRules: { className: /(vc-portal-alive|vc-modal|vc-drawer)/ },
		install: (app) => {
			app.use(router);
			app.use(store);
			app.provide('appName', 'demo');
		}
	}
});
```

### RecycleList 全局配置

定制各状态的默认内容；对应插槽优先于组件 `render*` 属性，组件属性优先于全局配置。详见 [RecycleList](../recycle-list/README.md)。

| 配置项 | 具体作用 | 默认值 |
| --- | --- | --- |
| renderRefresh | 定制拉动刷新提示，接收 `{ status, type }` | `undefined` |
| renderPlaceholder | 定制首次加载时的骨架占位内容 | `undefined` |
| renderLoading | 定制列表加载中的内容 | `undefined` |
| renderComplete | 定制加载完成、没有更多数据时的内容 | `undefined` |
| renderEmpty | 定制空列表内容 | `undefined` |

```js
import { h } from 'vue';
import { VcInstance } from '@deot/vc';

VcInstance.configure({
	RecycleList: {
		renderRefresh: ({ status }) => h('span', status === 4 ? '正在刷新' : '下拉刷新'),
		renderPlaceholder: () => h('div', '正在准备列表'),
		renderLoading: () => h('span', '正在加载'),
		renderComplete: () => h('span', '已加载全部记录'),
		renderEmpty: () => h('span', '暂无记录')
	}
});
```

### Snapshot 全局配置

设置统一的 DOM 采集参数，或接管下载以提供 PDF 等业务导出方式。详见 [Snapshot](../snapshot/README.md)。

| 配置项 | 具体作用 | 默认值 |
| --- | --- | --- |
| options | 提供 DOM 采集配置，与内置配置、组件 `options` 依次合并 | `undefined` |
| download | 接收 `(instance, options)`，组件的 `download` 优先；同步真值、Promise 兑现为真值或 `undefined` 时跳过默认下载，假值继续默认下载 | `undefined` |
| source | 保留配置，当前实现未读取 | `undefined` |

```js
import { VcInstance } from '@deot/vc';

VcInstance.configure({
	Snapshot: {
		options: { fast: false },
		download: async (instance, options) => {
			if (options.format !== 'pdf') return false;
			const snapshot = await instance.exposed.refresh();
			const canvas = await snapshot.toCanvas();
			// exportPdf 为业务项目的 PDF 导出实现
			await exportPdf(canvas, options.filename);
			return true;
		}
	}
});
```

### TableColumn 全局配置

统一设置默认文本行数，列上的值优先。详见 [Table](../table/README.md)。

| 配置项 | 具体作用 | 默认值 |
| --- | --- | --- |
| line | 设置单元格文本行数，`0` 表示不限行数 | `undefined`，组件回退为不限行数 |
| headerLine | 设置表头文本行数，`0` 表示不限行数 | `undefined`，组件回退为 `1` |

```js
import { VcInstance } from '@deot/vc';

VcInstance.configure({
	TableColumn: {
		line: 1,
		headerLine: 2
	}
});
```

### Upload 全局配置

统一处理上传接口、鉴权、响应转换和错误文案，局部对应配置优先。以下回调采用当前对象参数形式。详见 [Upload](../upload/README.md)。

| 配置项 | 具体作用 | 默认值 |
| --- | --- | --- |
| onRequest | 请求前接收 `{ requestOptions, instance }`，可同步或异步返回新请求参数；返回空值时使用原参数 | `undefined` |
| onResponse | 接收 `{ request, requestOptions }`，将响应转换成组件使用的结果，例如上传文件的 `source` | `undefined` |
| onMessage | 接收 `{ cause, message }`，返回字符串时覆盖上传失败文案 | `undefined` |
| name | 设置 FormData 的文件字段名，组件非空的 `name` 优先 | 未设置时回退为 `'file'` |
| enhancer | 接收组件内部实例，接管原生文件选择前的操作；跳过选择器的返回值规则见 Upload 文档 | `undefined` |

```js
import { VcInstance } from '@deot/vc';

VcInstance.configure({
	Upload: {
		name: 'file',
		onRequest: ({ requestOptions }) => ({
			...requestOptions,
			url: requestOptions.url || '/api/files',
			headers: {
				// getAccessToken 为业务鉴权方法
				Authorization: `Bearer ${getAccessToken()}`,
				...requestOptions.headers
			}
		}),
		onResponse: ({ request }) => {
			if (!request) return;
			const result = JSON.parse(request.responseText);
			// 按实际接口字段转换为上传结果
			return { source: result.url };
		},
		onMessage: ({ cause, message }) => cause.message || message
	}
});
```

### UploadPicker 全局配置

接管桌面端默认资源选择入口；Editor 也将此配置作为资源选择的后备增强器。详见 [UploadPicker](../upload-picker/README.md)。

| 配置项 | 具体作用 | 默认值 |
| --- | --- | --- |
| enhancer | 接收 `(instance, type)`，同步返回真值时阻止原生选择；需要组件的 `enhancer` 为 `true`，移动端入口不使用此配置 | `undefined` |

```js
import { VcInstance } from '@deot/vc';

VcInstance.configure({
	UploadPicker: {
		enhancer: (instance, type) => {
			// openResourceLibrary 为业务资源库；此回调同步返回 true
			openResourceLibrary(type, (items) => {
				// items 按组件的 keyValue 配置提供 value、label 等字段
				instance.exposed.add(items);
			});
			return true;
		}
	}
});
```

### Theme 全局配置

这里只设置 [Theme 组件族](../theme/README.md) 使用的 JavaScript 映射。组件库的全局主题由 CSS 控制，通过 `--vc-*` CSS 变量及 `data-vc-theme` 切换亮暗主题。

| 配置项 | 具体作用 | 默认值 |
| --- | --- | --- |
| variables | 供 Theme 组件解析变量名，局部映射中的真值优先；具体用法见 Theme 文档 | `{}` |

```js
import { VcInstance } from '@deot/vc';

VcInstance.configure({
	Theme: {
		variables: { 'brand-text': 'var(--vc-color-primary)' }
	}
});
```

### Tour 全局配置

Tour 的全局配置使用 `VcInstance.configure({ Tour })`，实例使用 `cache: '业务引导-key'` 开启缓存。

| 配置项 | 具体作用 | 默认值 |
| --- | --- | --- |
| cache | 布尔总开关，为 `false` 时禁止所有实例读写缓存 | `true` |
| cacheTypes | 写入缓存的结束类型，可选 `finish`、`skip`、`close` | `['finish', 'skip']` |
| getCache | 接收 `({ cacheKey })`，返回 `boolean` 或 `Promise<boolean>`；未配置时使用页面内存 | `undefined` |
| setCache | 接收 `({ cacheKey, type })`，可返回 `Promise`；未配置时使用页面内存 | `undefined` |
| onOpen | 接收 `({ cacheKey, steps })`，可返回 `Promise`；返回 `false` 阻止打开 | `undefined` |

默认缓存不持久化；缓存失败通过 Tour error 通知。全局打开检查先于实例检查。
更新嵌套配置会整体替换，切换开关可使用 `{ ...VcInstance.options.Tour, cache: false }` 保留回调。
完整用法见 [Tour](../tour/README.md)。

### VcError

`VcError` 是开发诊断对象，不继承原生 `Error`，没有原生错误的 `name`、`stack` 等能力。仅当 `target` 和 `message` 都为真值时，生成 `message`；在 development 环境还会调用 `console.error()`。这不是面向用户的提示组件。

```ts
import { VcError } from '@deot/vc';

const diagnostic = new VcError('example', 'invalid configuration');
// diagnostic.message === '[@deot/vc - example]: invalid configuration'
```

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| new VcError | 创建诊断对象；任一参数为假值时不生成消息 | `target?: string, message?: any` | `VcError`，其 `message` 类型为 `string \| undefined` |

### defineVcPlugin / createVcPlugin

`defineVcPlugin(components)` 基于传入的组件集合返回插件工厂 `createVcPlugin`，自身不引用任何组件，按需引入时只有传入的组件会进入产物。全量入口 `@deot/vc/full` 导出的 `createVcPlugin` 即 `defineVcPlugin(Components)`。插件用于注册组件、应用全局配置，并在主应用上提供 `$vc`；它使用上文同一个 `VcInstance`，不会创建隔离的配置实例。

```ts
import { defineVcPlugin, Button, MButton } from '@deot/vc';

const createVcPlugin = defineVcPlugin({ Button, MButton });
app.use(createVcPlugin());
```

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| defineVcPlugin | 创建插件工厂；键名即注册名 | `components: Record<string, Component>` | `createVcPlugin` |
| createVcPlugin | 创建 Vue 插件；配置在 `app.use()` 安装时应用，组件名转换函数返回空值时保留原名 | `options?: VcOptions, transfromComponentKey?: (name: string) => string`；转换函数缺省为原样返回名称 | `{ install: (app: App) => void }` |
