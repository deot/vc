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
