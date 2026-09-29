# @deot/vc-components

`@deot/vc-components` 提供 `@deot/vc` 的桌面端与移动端组件。移动端组件通常使用 `M` 前缀，并与桌面端组件从同一入口导出。

## 安装

```bash
pnpm add @deot/vc-components @deot/vc-locale vue
```

## 使用

```ts
import { Button, MButton } from '@deot/vc-components';
```

各组件的示例与 API 按使用场景收录在文档站侧栏中。应用项目通常可以直接从聚合包 `@deot/vc` 引入。

## VcInstance

`VcInstance` 用于统一配置语言、主题变量和组件的全局默认行为。`configure()` 可以多次调用，每次只更新传入的顶层配置项。

```ts
import { VcInstance } from '@deot/vc-components';
import { enUS } from '@deot/vc-locale';

VcInstance.configure({
	locale: enUS,
	Theme: {
		variables: {
			brandColor: '#456cf6'
		}
	}
});
```

也可以从聚合包引入：

```ts
import { VcInstance, enUS } from '@deot/vc';
```

组件专属的全局配置使用组件名作为键，例如 `Theme`、`Image`、`Upload` 和 `RecycleList`。局部 props 可以继续覆盖对应组件的全局默认值。

`FilePreview` 的配置由 FilePreview、UploadPicker 与 Editor 共用，用于自定义文件类型识别、文件名推导和接管预览（Editor 不使用 `enhancer`）：

```ts
VcInstance.configure({
	FilePreview: {
		// 返回空值时回退内置规则
		getFileType: source => (/\.jpg!/.test(source) ? 'image' : undefined),
		// 数据未提供名称时调用，返回空值时回退内置规则
		getFileName: source => decodeURIComponent(source.split('/').pop()).replace(/^\d+_/, ''),
		// 返回真值（或 resolve 真值）表示已接管，不再执行内置预览
		enhancer: ({ current, data, instance }) => {
			const item = data[current];
			if (item.type !== 'file') return false;
			window.open(`https://view.example.com/?src=${encodeURIComponent(item.source)}`);
			return true;
		}
	}
});
```
